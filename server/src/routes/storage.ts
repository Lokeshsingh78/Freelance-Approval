import { Router, Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import {
  saveUploadedFile,
  getFileDownloadUrl,
  deleteFileFromStorage,
  getLocalUploadsPath,
} from "../storage.js";
import {
  attachFileToProject,
  getFileById,
  deleteFile,
  getPaymentByOrderId,
  updatePaymentStatus,
} from "../db.js";

import {
  emitFileUploaded,
  emitFileDeleted,
  emitProjectStatusUpdated,
} from "../socket.js";
import { calculateUploadPrice } from "../pricing.js";

export const storageRouter = Router();

// Helper to extract admin token
const getAdminToken = (req: Request): string | null => {
  const xAdmin = req.headers["x-admin-token"];
  if (typeof xAdmin === "string" && xAdmin.trim()) {
    return xAdmin.trim();
  }

  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  return null;
};

// In-memory temp uploaded buffers/files pending confirm
const tempUploads = new Map<string, { buffer: Buffer; mimeType: string; filename: string }>();

// 1. Sign URL for Uploading
storageRouter.post("/sign-url", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { filename, mimeType, size, paymentOrderId } = req.body;
    if (!filename) {
      res.status(400).json({ message: "Filename is required" });
      return;
    }

    const sizeBytes = Number(size) || 0;
    const pricing = calculateUploadPrice(sizeBytes);

    // If file is 100MB+, verify payment was completed
    if (!pricing.isFree) {
      if (!paymentOrderId) {
        res.status(402).json({
          error: "PAYMENT_REQUIRED",
          message: `Deliverable is ${pricing.sizeMB} MB. Files 100MB or above require payment of ₹${pricing.amount} via Cashfree before upload.`,
          pricing,
        });
        return;
      }

      const payment = await getPaymentByOrderId(paymentOrderId);
      if (!payment || payment.status !== "SUCCESS") {
        res.status(402).json({
          error: "PAYMENT_NOT_VERIFIED",
          message: "Payment order is not yet confirmed. Please complete Cashfree payment.",
          pricing,
        });
        return;
      }
    }

    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${safeName}`;
    const serverUrl =
      process.env.SERVER_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      (process.env.NODE_ENV === "production" ? "https://freelance-approval.onrender.com" : "http://localhost:8080");
    const uploadUrl = `${serverUrl}/api/storage/upload/${encodeURIComponent(key)}`;

    const responsePayload = {
      uploadUrl,
      key,
      pricing,
      paymentOrderId: paymentOrderId || null,
      data: {
        uploadUrl,
        key,
      },
    };

    res.json(responsePayload);
  } catch (error: any) {
    console.error("Sign URL error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});


// 2. Binary Upload Target (PUT)
storageRouter.put("/upload/:key", async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const contentType = req.headers["content-type"] || "application/octet-stream";

    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        // Persist to storage immediately
        const savedUrl = await saveUploadedFile(key, buffer, contentType);
        
        tempUploads.set(key, {
          buffer,
          mimeType: contentType,
          filename: key,
        });

        res.status(200).json({ success: true, key, url: savedUrl });
      } catch (err: any) {
        console.error("File save error:", err);
        res.status(500).json({ message: "Failed to store file" });
      }
    });

    req.on("error", (err) => {
      console.error("Upload stream error:", err);
      res.status(500).json({ message: "Upload stream failed" });
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// 3. Confirm Upload & Attach to Project
storageRouter.post("/confirm", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { key, filename, size, mimeType, paymentOrderId } = req.body;
    if (!key || !filename) {
      res.status(400).json({ message: "key and filename are required" });
      return;
    }

    const fileUrl = await getFileDownloadUrl(key, filename, false);

    const result = await attachFileToProject(token, {
      key,
      filename,
      size: Number(size) || 0,
      mimeType: mimeType || "application/octet-stream",
      url: fileUrl,
    });

    if (!result) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Link payment order if present
    if (paymentOrderId) {
      try {
        await updatePaymentStatus(paymentOrderId, "SUCCESS");
      } catch (e) {
        console.warn("Failed to link payment to file confirm:", e);
      }
    }

    // Emit Realtime WebSockets to update dashboard and client view
    emitFileUploaded(result.projectId);
    emitProjectStatusUpdated(result.projectId, { status: "PENDING" });

    res.json({
      data: result.file,
      file: result.file,
      paymentOrderId: paymentOrderId || null,
    });

  } catch (error: any) {
    console.error("Confirm file error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// 4. Download / View File URL
storageRouter.get("/download/:fileId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const isDownload = req.query.download === "true" || req.query.download === "download";

    const file = await getFileById(fileId);
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    const downloadUrl = await getFileDownloadUrl(
      file.storageKey,
      file.fileName,
      isDownload
    );

    res.json({
      url: downloadUrl,
      filename: file.fileName,
    });
  } catch (error: any) {
    console.error("Download URL error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// 4b. Raw Stream & Direct Download Target (with native Content-Disposition)
storageRouter.get("/raw/:key", (req: Request, res: Response): void => {
  try {
    const { key } = req.params;
    const isDownload = req.query.download === "true";
    const filename = (req.query.filename as string) || path.basename(key);
    const safeKey = path.basename(key);
    const filePath = path.join(getLocalUploadsPath(), safeKey);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    if (isDownload) {
      res.download(filePath, filename);
    } else {
      res.sendFile(filePath);
    }
  } catch (error: any) {
    console.error("Raw download error:", error);
    res.status(500).json({ message: error.message || "Failed to download file" });
  }
});

// 5. Delete File
storageRouter.post("/:fileId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { projectId } = req.body;

    const result = await deleteFile(fileId, projectId);
    if (!result.success) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    if (result.storageKey) {
      await deleteFileFromStorage(result.storageKey);
    }

    if (result.projectId) {
      emitFileDeleted(result.projectId);
    }

    res.json({ message: "File deleted successfully" });
  } catch (error: any) {
    console.error("Delete file error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

import { Router, Request, Response } from "express";
import {
  createProject,
  getProjectByAdminToken,
  getProjectByPublicToken,
  updateProjectStatus,
  updateProjectExpiration,
  deleteProject,
} from "../db.js";
import {
  emitProjectStatusUpdated,
  emitProjectExpirationUpdated,
} from "../socket.js";

export const projectsRouter = Router();

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

// 1. Create a Project
projectsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "Project name is required" });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    const { id, adminToken, publicToken } = await createProject(
      name.trim(),
      ip,
      ua
    );

    res.status(201).json({
      data: {
        id,
        adminToken,
        publicToken,
      },
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    res.status(500).json({ message: error.message || "Failed to create project" });
  }
});

// 2. Get Admin Project Details
projectsRouter.get("/admin/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Missing admin authentication token" });
      return;
    }

    const project = await getProjectByAdminToken(token);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.json({ data: project });
  } catch (error: any) {
    console.error("Admin fetch project error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// 3. Get Public Project for Client View
projectsRouter.get("/view/:token", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    const project = await getProjectByPublicToken(token, ip, ua);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.json({ data: project });
  } catch (error: any) {
    console.error("Public fetch project error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// 4. Client Decision (Approve or Request Changes)
projectsRouter.post("/:token/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const decision = req.body.decision || req.body.status;
    const { comment, clientName, clientEmail } = req.body;

    if (!decision || (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED")) {
      res.status(400).json({ message: "Valid decision is required (APPROVED or CHANGES_REQUESTED)" });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    const updated = await updateProjectStatus(
      token,
      decision,
      comment,
      ip,
      ua,
      clientName,
      clientEmail
    );
    if (!updated) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Emit Realtime WebSockets to room
    emitProjectStatusUpdated(updated.id, {
      status: updated.status,
      comment: comment || null,
      decisions: updated.decisions || [],
    });


    res.json({ data: updated });
  } catch (error: any) {
    console.error("Client decision error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// 5. Update Expiration
projectsRouter.patch("/admin/expiration", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Missing admin authentication token" });
      return;
    }

    const { days } = req.body;
    const numDays = Number(days);
    if (!numDays || numDays <= 0) {
      res.status(400).json({ message: "Valid duration in days is required" });
      return;
    }

    const result = await updateProjectExpiration(token, numDays);
    if (!result) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Emit Realtime WebSockets
    emitProjectExpirationUpdated(result.projectId, result.expiresAt);

    res.json({ data: { expiresAt: result.expiresAt } });
  } catch (error: any) {
    console.error("Update expiration error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// 6. Delete Project
projectsRouter.delete("/admin/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Missing admin authentication token" });
      return;
    }

    const success = await deleteProject(token);
    if (!success) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

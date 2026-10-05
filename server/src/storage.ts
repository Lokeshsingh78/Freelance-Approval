import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase, isSupabaseConfigured } from "./supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

const BUCKET_NAME = process.env.SUPABASE_BUCKET || "deliverables";

export interface StoredFileInfo {
  key: string;
  url: string;
}

export const saveUploadedFile = async (
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  const saveToLocalDisk = () => {
    const filePath = path.join(LOCAL_UPLOADS_DIR, key);
    fs.writeFileSync(filePath, buffer);
    const serverUrl = process.env.SERVER_URL || "http://localhost:8080";
    return `${serverUrl}/uploads/${key}`;
  };

  // If file exceeds 48MB, Supabase free tier bucket limit (EntityTooLarge) triggers.
  // Store directly in local disk storage for fast, reliable large deliverable uploads!
  if (buffer.length > 48 * 1024 * 1024) {
    console.log(`📦 File size is ${(buffer.length / (1024 * 1024)).toFixed(1)}MB (>48MB). Storing in high-capacity local disk storage.`);
    return saveToLocalDisk();
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(key, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.warn("Supabase Storage upload warning (falling back to disk):", error.message);
        return saveToLocalDisk();
      }

      // Try to get public URL
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(key);

      return publicData?.publicUrl || key;
    } catch (err: any) {
      console.warn("Supabase Storage error (falling back to disk):", err?.message || err);
      return saveToLocalDisk();
    }
  } else {
    // Local storage fallback
    return saveToLocalDisk();
  }
};

export const getFileDownloadUrl = async (
  key: string,
  filename: string,
  isDownload: boolean = true
): Promise<string> => {
  const serverUrl = process.env.SERVER_URL || "http://localhost:8080";
  const rawEndpoint = `${serverUrl}/api/storage/raw/${encodeURIComponent(key)}?download=${isDownload}&filename=${encodeURIComponent(filename)}`;

  // If file exists on local disk storage
  const localFilePath = path.join(LOCAL_UPLOADS_DIR, key);
  if (fs.existsSync(localFilePath)) {
    return rawEndpoint;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(key, 60 * 60 * 24, {
          download: isDownload ? filename : undefined,
        });

      if (data?.signedUrl) {
        return data.signedUrl;
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(key);

      return publicData?.publicUrl || rawEndpoint;
    } catch {
      return rawEndpoint;
    }
  } else {
    return rawEndpoint;
  }
};

export const deleteFileFromStorage = async (key: string): Promise<void> => {
  const localFilePath = path.join(LOCAL_UPLOADS_DIR, key);
  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
    } catch {}
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.storage.from(BUCKET_NAME).remove([key]);
    } catch {}
  }
};

export const getLocalUploadsPath = () => LOCAL_UPLOADS_DIR;
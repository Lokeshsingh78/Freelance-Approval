export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "executable"
  | "archive"
  | "code"
  | "spreadsheet"
  | "document"
  | "other";

export const getFileCategory = (
  mimeType?: string | null,
  filename?: string | null
): FileCategory => {
  const mime = (mimeType || "").toLowerCase();
  const name = (filename || "").toLowerCase();

  // Executables & Installers
  if (
    name.endsWith(".exe") ||
    name.endsWith(".msi") ||
    name.endsWith(".dmg") ||
    name.endsWith(".apk") ||
    name.endsWith(".app") ||
    name.endsWith(".bin") ||
    name.endsWith(".bat") ||
    name.endsWith(".cmd") ||
    name.endsWith(".sh") ||
    mime.includes("x-msdownload") ||
    mime.includes("x-executable") ||
    mime.includes("octet-stream") && (name.endsWith(".exe") || name.endsWith(".msi"))
  ) {
    return "executable";
  }

  // Images
  if (
    mime.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".svg") ||
    name.endsWith(".gif") ||
    name.endsWith(".bmp") ||
    name.endsWith(".ico")
  ) {
    return "image";
  }

  // Videos
  if (
    mime.startsWith("video/") ||
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".avi") ||
    name.endsWith(".mkv") ||
    name.endsWith(".webm") ||
    name.endsWith(".wmv")
  ) {
    return "video";
  }

  // Audio
  if (
    mime.startsWith("audio/") ||
    name.endsWith(".mp3") ||
    name.endsWith(".wav") ||
    name.endsWith(".ogg") ||
    name.endsWith(".m4a") ||
    name.endsWith(".flac") ||
    name.endsWith(".aac")
  ) {
    return "audio";
  }

  // Archives
  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    mime.includes("tar") ||
    mime.includes("rar") ||
    mime.includes("7z") ||
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z") ||
    name.endsWith(".tar") ||
    name.endsWith(".gz") ||
    name.endsWith(".iso")
  ) {
    return "archive";
  }

  // PDF
  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }

  // Spreadsheets
  if (
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    mime.includes("csv") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    return "spreadsheet";
  }

  // Code & Developer
  if (
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("json") ||
    mime.includes("html") ||
    mime.includes("xml") ||
    name.endsWith(".js") ||
    name.endsWith(".jsx") ||
    name.endsWith(".ts") ||
    name.endsWith(".tsx") ||
    name.endsWith(".html") ||
    name.endsWith(".css") ||
    name.endsWith(".json") ||
    name.endsWith(".py") ||
    name.endsWith(".java") ||
    name.endsWith(".cpp") ||
    name.endsWith(".c") ||
    name.endsWith(".cs") ||
    name.endsWith(".php") ||
    name.endsWith(".rs") ||
    name.endsWith(".go") ||
    name.endsWith(".sql")
  ) {
    return "code";
  }

  // Documents
  if (
    mime.includes("word") ||
    mime.includes("document") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt") ||
    name.endsWith(".rtf") ||
    name.endsWith(".md")
  ) {
    return "document";
  }

  return "other";
};

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const getCategoryBadge = (category: FileCategory): { label: string; color: string } => {
  switch (category) {
    case "executable":
      return {
        label: "EXECUTABLE (.EXE / APP)",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      };
    case "video":
      return {
        label: "VIDEO MEDIA",
        color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      };
    case "audio":
      return {
        label: "AUDIO TRACK",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    case "image":
      return {
        label: "IMAGE / GRAPHIC",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    case "pdf":
      return {
        label: "PDF DOCUMENT",
        color: "bg-red-500/10 text-red-400 border-red-500/30",
      };
    case "archive":
      return {
        label: "ZIP ARCHIVE",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      };
    case "code":
      return {
        label: "SOURCE CODE",
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      };
    case "spreadsheet":
      return {
        label: "SPREADSHEET",
        color: "bg-teal-500/10 text-teal-400 border-teal-500/30",
      };
    case "document":
      return {
        label: "DOCUMENT",
        color: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
      };
    default:
      return {
        label: "DELIVERABLE FILE",
        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      };
  }
};

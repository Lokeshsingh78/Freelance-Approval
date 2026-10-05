import React from "react";
import styles from "./index.module.css";
import {
  FileText,
  FileImage,
  FileArchive,
  FileAudio,
  FileVideo,
  FileCode,
  FileSpreadsheet,
  FileTerminal,
  File,
} from "lucide-react";

export const getFileIcon = (
  type?: string | null,
  filename?: string | null,
  size: number = 16
): React.ReactNode => {
  const mime = (type || "").toLowerCase();
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
    mime.includes("x-executable")
  ) {
    return <FileTerminal className={styles.icon} size={size} />;
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
    return <FileImage className={styles.icon} size={size} />;
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
    return <FileVideo className={styles.icon} size={size} />;
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
    return <FileAudio className={styles.icon} size={size} />;
  }

  // Code & Developer files
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
    return <FileCode className={styles.icon} size={size} />;
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
    return <FileSpreadsheet className={styles.icon} size={size} />;
  }

  // Archives / Compressed
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
    return <FileArchive className={styles.icon} size={size} />;
  }

  // Documents & PDFs
  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("document") ||
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt") ||
    name.endsWith(".rtf") ||
    name.endsWith(".md")
  ) {
    return <FileText className={styles.icon} size={size} />;
  }

  return <File className={styles.icon} size={size} />;
};

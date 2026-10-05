import { useState } from "react";
import { toast } from "sonner";
import { getDownloadUrlApi } from "@/lib/api/getDownloadUrlApi";

export const useDownloadFile = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * @param fileId - The ID of the file to download
   * @param filename - Optional fallback filename (for UI feedback)
   * @param token - Optional auth token (if public view)
   * @param mode - 'download' forces save to disk, 'preview' opens in new tab
   */
  const downloadFile = async (
    fileId: string,
    filename: string,
    token?: string,
    mode: "download" | "preview" = "download"
  ) => {
    try {
      setIsDownloading(true);

      if (mode === "download") {
        toast.info("Preparing download...");
      }

      // 1. Get the Signed URL from your backend
      const data = await getDownloadUrlApi({
        fileId,
        token,
        download: mode === "download",
      });

      if (!data?.url) {
        throw new Error("Download URL not found");
      }

      // 2. Trigger the action
      if (mode === "preview") {
        // Open in new tab
        window.open(data.url, "_blank");
      } else {
        // Force Download
        // Since the URL now has "Content-Disposition: attachment",
        // a simple link click works perfectly.
        const link = document.createElement("a");
        link.href = data.url;
        link.setAttribute("download", data.filename || filename); // Backup hint
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Download started");
      }
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to retrieve file");
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadFile, isDownloading };
};

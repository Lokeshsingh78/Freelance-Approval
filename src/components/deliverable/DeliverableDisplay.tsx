import React from "react";
import {
  Download,
  ExternalLink,
  ShieldCheck,
  Terminal,
  FileArchive,
  Loader2,
  Volume2,
} from "lucide-react";
import {
  getFileCategory,
  formatFileSize,
  getCategoryBadge,
} from "@/lib/fileHelpers";
import { getFileIcon } from "@/lib/ConditionalIcons/getFileIcon";

interface DeliverableDisplayProps {
  file: {
    id: string;
    fileId?: string;
    fileName?: string;
    filename?: string;
    mimeType: string;
    size: number;
    url: string;
  };
  onDownload?: () => void;
  isDownloading?: boolean;
}

export const DeliverableDisplay: React.FC<DeliverableDisplayProps> = ({
  file,
  onDownload,
  isDownloading = false,
}) => {
  const fileName = file.fileName || file.filename || "deliverable";
  const category = getFileCategory(file.mimeType, fileName);
  const badge = getCategoryBadge(category);
  const sizeFormatted = formatFileSize(file.size);

  // 1. IMAGE DISPLAY
  if (category === "image") {
    return (
      <div className="relative w-full flex items-center justify-center p-2 bg-black/40">
        <img
          src={file.url}
          alt={fileName}
          className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
        />
      </div>
    );
  }

  // 2. VIDEO PLAYER
  if (category === "video") {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4 bg-black/60 rounded-2xl">
        <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-black">
          <video
            src={file.url}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[75vh] bg-black"
          >
            Your browser does not support HTML5 video playback.
          </video>
        </div>
        <div className="w-full max-w-4xl flex items-center justify-between mt-3 text-xs text-zinc-400 px-1">
          <span className="truncate">{fileName}</span>
          <span>{sizeFormatted}</span>
        </div>
      </div>
    );
  }

  // 3. AUDIO PLAYER
  if (category === "audio") {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/5 animate-pulse">
          <Volume2 size={42} />
        </div>

        <div className={`px-3 py-1 text-xs rounded-full border mb-3 ${badge.color}`}>
          {badge.label}
        </div>

        <h3 className="text-xl font-bold text-white mb-1 truncate max-w-md">
          {fileName}
        </h3>
        <p className="text-xs text-zinc-400 mb-6">{sizeFormatted}</p>

        <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl mb-6">
          <audio src={file.url} controls className="w-full focus:outline-none" />
        </div>

        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="px-6 py-3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl flex items-center gap-2 transition shadow-lg"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Download Audio Track
          </button>
        )}
      </div>
    );
  }

  // 4. PDF VIEWER
  if (category === "pdf") {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
          <span className="truncate">{fileName} ({sizeFormatted})</span>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition"
          >
            <ExternalLink size={13} /> Open in New Tab
          </a>
        </div>
        <iframe
          src={file.url}
          className="w-full h-[75vh] border-0 bg-zinc-950"
          title="PDF Document Preview"
        />
      </div>
    );
  }

  // 5. EXECUTABLES & BINARIES (.EXE, .MSI, .DMG, .APK, ETC.)
  if (category === "executable") {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/10">
          <Terminal size={44} strokeWidth={2.2} />
        </div>

        <div className={`px-3 py-1 text-xs rounded-full border mb-3 font-mono font-medium ${badge.color}`}>
          {badge.label}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 truncate max-w-lg">
          {fileName}
        </h3>

        <div className="flex items-center gap-3 text-xs text-zinc-400 mb-6">
          <span className="px-2.5 py-1 bg-zinc-800 rounded-md font-mono">{sizeFormatted}</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck size={14} /> Ready for Client Execution
          </span>
        </div>

        <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
          Executable application deliverable submitted for review. Download and run on your test machine to verify functionality before formal approval.
        </p>

        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl flex items-center gap-3 transition shadow-xl shadow-purple-600/20 text-base"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            Download Executable
          </button>
        )}
      </div>
    );
  }

  // 6. ARCHIVES (.ZIP, .RAR, .TAR, ETC.)
  if (category === "archive") {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10">
          <FileArchive size={44} strokeWidth={2.2} />
        </div>

        <div className={`px-3 py-1 text-xs rounded-full border mb-3 font-medium ${badge.color}`}>
          {badge.label}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 truncate max-w-lg">
          {fileName}
        </h3>

        <div className="flex items-center gap-3 text-xs text-zinc-400 mb-6">
          <span className="px-2.5 py-1 bg-zinc-800 rounded-md font-mono">{sizeFormatted}</span>
          <span className="flex items-center gap-1 text-blue-400">
            Compressed Package
          </span>
        </div>

        <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
          Archive deliverable containing all project assets and documentation. Extract files locally to inspect before approving.
        </p>

        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center gap-3 transition shadow-xl shadow-blue-600/20 text-base"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            Download Archive Package
          </button>
        )}
      </div>
    );
  }

  // 7. GENERIC / CODE / SPREADSHEET / OTHER FILES
  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-6 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-3xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center justify-center mb-6 shadow-2xl">
        {getFileIcon(file.mimeType, fileName, 44)}
      </div>

      <div className={`px-3 py-1 text-xs rounded-full border mb-3 font-medium ${badge.color}`}>
        {badge.label}
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 truncate max-w-lg">
        {fileName}
      </h3>

      <div className="flex items-center gap-3 text-xs text-zinc-400 mb-6">
        <span className="px-2.5 py-1 bg-zinc-800 rounded-md font-mono">{sizeFormatted}</span>
        <span className="flex items-center gap-1 text-zinc-400">
          Ready for Review
        </span>
      </div>

      <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
        Deliverable file ready for review. Download to your computer to inspect the contents.
      </p>

      {onDownload && (
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl flex items-center gap-3 transition shadow-xl text-base"
        >
          {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          Download File
        </button>
      )}
    </div>
  );
};

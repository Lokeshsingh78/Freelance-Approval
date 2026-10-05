import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { FeedbackHistory } from "@/components/dashboard/FeedbackHistory";
import { SocketManager } from "@/components/socketManager/SocketManager";


import { useModalStore } from "@/store/modalStore/useModalStore";
import {
  useAdminProject,
  useUpdateExpiration,
  useDeleteFile,
} from "@/hooks/useProject/export";

import {
  Copy,
  ExternalLink,
  Loader2,
  Clock,
  CalendarDays,
  Trash2,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getFileIcon } from "@/lib/ConditionalIcons/getFileIcon";
import { getFileCategory, formatFileSize, getCategoryBadge } from "@/lib/fileHelpers";
import { useDownloadFile } from "@/hooks/useProject/storage/useDownloadFile";

export const Dashboard = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  // 1. DATA FETCHING (Replaces fetchProject from store)
  const { data: project, isLoading, error } = useAdminProject(token);

  // 2. MUTATIONS
  const { mutate: updateExpiration } = useUpdateExpiration(token);
  const { mutate: deleteFile } = useDeleteFile(token);
  const { downloadFile, isDownloading } = useDownloadFile();
  const { openModal } = useModalStore();
  // 3. LOCAL UI STATE
  const [copyText, setCopyText] = useState("Copy Link");
  // Initialize duration from local storage or default to 30
  const [selectedDuration, setSelectedDuration] = useState(() => {
    if (!token) return "30";
    return localStorage.getItem(`approval_duration_${token}`) || "30";
  });
  const [showReuploader, setShowReuploader] = useState(false);

  // Redirect on specific error (optional)
  useEffect(() => {
    if (error) {
      console.error("Dashboard Load Error:", error);
    }
  }, [error, navigate]);

  // --- HANDLERS ---

  const handleCopyLink = () => {
    if (!project) return;
    // Fallback if publicToken isn't in the response yet
    const linkToken = project.publicToken || token;
    const url = `${window.location.origin}/view/${linkToken}`;

    navigator.clipboard.writeText(url);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Link"), 2000);
  };

  const handleDeleteClick = (fileId: string, projectId: string) => {
    openModal("WARNING", {
      title: "Delete File?",
      description:
        "This will permanently delete the file from both your dashboard and the client's view. The client will lose access immediately.",
      confirmText: "Delete File",
      variant: "danger",
      onConfirm: async () => {
        deleteFile({ fileId, projectId });
        // closeModal();
      },
    });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const days = Number(val);

    // 1. Optimistic UI update
    setSelectedDuration(val);
    if (token) localStorage.setItem(`approval_duration_${token}`, val);

    // 2. Server Update (Mutation)
    updateExpiration(days);
  };

  // --- RENDER STATES ---

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );

  if (error || !project)
    return (
      <div className="h-screen flex items-center justify-center bg-black text-red-400">
        Error loading project. Please refresh.
      </div>
    );

  return (
    <div className="p-6 transition-colors">
      <SocketManager projectId={project.id} />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              {project.name}
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={project.status} />
              <span className="text-zinc-500 text-sm font-mono">
                ID: {project.id ? project.id.slice(0, 8) : "..."}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                window.open(`/view/${project.publicToken}`, "_blank")
              }
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-300 flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <ExternalLink size={16} /> Preview
            </button>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Copy size={16} /> {copyText}
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: UPLOAD AREA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Deliverable</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {project.file
                      ? "Current deliverable sent to client"
                      : "Upload the project file to generate client review"}
                  </p>
                </div>
                {project.file && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReuploader(!showReuploader)}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
                      title="Upload a revised file"
                    >
                      <RefreshCw
                        size={13}
                        className={showReuploader ? "rotate-180 transition-transform duration-300" : "transition-transform"}
                      />
                      {showReuploader ? "Close Revision" : "Upload Revision"}
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteClick(project.file?.id, project.id)
                      }
                      title="Delete Deliverable"
                      className="p-2 cursor-pointer text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {project.file ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl group gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        {getFileIcon(project.file.mimeType, project.file.fileName, 24)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] rounded font-mono border ${getCategoryBadge(getFileCategory(project.file.mimeType, project.file.fileName)).color}`}>
                            {getCategoryBadge(getFileCategory(project.file.mimeType, project.file.fileName)).label}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                            {formatFileSize(project.file.size)}
                          </span>
                        </div>
                        <p className="font-semibold text-zinc-900 dark:text-white truncate text-sm">
                          {project.file.fileName}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Secured & Encrypted Deliverable</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() =>
                          downloadFile(
                            project.file?.id || "",
                            project.file?.fileName || "deliverable",
                            token,
                            "download"
                          )
                        }
                        disabled={isDownloading}
                        title="Download Deliverable"
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700"
                      >
                        {isDownloading ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Download size={14} />
                        )}
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Manual Reuploader toggled by button */}
                  {showReuploader && (
                    <div className="p-4 bg-indigo-50/50 dark:bg-zinc-950/80 border border-indigo-200 dark:border-indigo-500/30 rounded-xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                          <RefreshCw size={13} />
                          Upload Revised Deliverable
                        </p>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Replaces file & resets status to PENDING
                        </span>
                      </div>
                      <FileUploader token={token} projectId={project.id} />
                    </div>
                  )}
                </div>
              ) : (
                <FileUploader token={token} projectId={project.id} />
              )}
            </div>

            {/* CLIENT FEEDBACK & REVISION UPLOAD ZONE */}
            {project.status === "CHANGES_REQUESTED" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 space-y-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 text-red-500 dark:text-red-400 font-semibold text-base mb-1">
                    <AlertCircle size={18} />
                    <span>Client Requested Changes</span>
                  </div>
                  <div className="bg-white/80 dark:bg-red-950/60 p-3.5 rounded-xl border border-red-200 dark:border-red-500/20 text-red-900 dark:text-red-100 text-sm italic mt-2">
                    "{project.latestComment || "Please provide improvements"}"
                  </div>
                </div>

                <div className="pt-2 border-t border-red-500/20">
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium mb-3">
                    Upload revised file below. Uploading will automatically reset the review status back to <span className="text-amber-600 dark:text-amber-400 font-bold">PENDING</span> so the client can approve or reject the new version on the same link:
                  </p>
                  <FileUploader token={token} projectId={project.id} />
                </div>
              </div>
            )}

            {/* FULL CLIENT FEEDBACK & DECISION TRAIL */}
            <FeedbackHistory
              decisions={project.decisions}
              currentStatus={project.status}
            />
          </div>

          {/* RIGHT: INFO SIDEBAR */}

          <div className="space-y-6">
            {/* LINK SETTINGS */}
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm transition-colors">
              <h3 className="font-semibold mb-4 text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Clock size={16} className="text-zinc-500" /> Link Settings
              </h3>


              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider ml-1">
                    Expires In
                  </label>
                  <div className="relative mt-2">
                    <select
                      value={selectedDuration}
                      onChange={handleDurationChange}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl p-3 text-sm text-zinc-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                    >
                      <option value="3">3 Days (Urgent)</option>
                      <option value="7">7 Days (1 Week)</option>
                      <option value="30">30 Days (Standard)</option>
                      <option value="90">90 Days (Long term)</option>
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500">
                      <CalendarDays size={14} />
                    </div>
                  </div>
                </div>

                {project.expiresAt && (
                  <p className="text-[10px] text-zinc-500 text-right px-1">
                    Valid until:{" "}
                    {new Date(project.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Next Steps Block */}
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm transition-colors">
              <h3 className="font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Next Steps</h3>
              <ol className="space-y-4">
                <li
                  className={`flex gap-3 items-center ${
                    project.file
                      ? "text-zinc-400 line-through"
                      : "text-zinc-700 dark:text-zinc-300 font-medium"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    1
                  </span>
                  Upload your file
                </li>
                <li
                  className={`flex gap-3 items-center ${
                    project.status !== "PENDING"
                      ? "text-zinc-400 line-through"
                      : "text-zinc-700 dark:text-zinc-300 font-medium"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    2
                  </span>
                  Send link to client
                </li>
                <li
                  className={`flex gap-3 items-center ${
                    project.status === "APPROVED"
                      ? "text-emerald-600 dark:text-green-500 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 font-medium"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    3
                  </span>
                  Get Approved
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

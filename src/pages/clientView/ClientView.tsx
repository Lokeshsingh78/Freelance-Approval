import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, CheckCircle2, XCircle, Loader2, Send, Download, Clock, Quote } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TimeRemaining } from "@/components/timeRemaining/TimeRemaining";
import { usePublicProject, useClientDecision } from "@/hooks/useProject/export";
import { ClientSocketManager } from "@/components/socketManager/ClientSocketManager";
import { useDownloadFile } from "@/hooks/useProject/storage/useDownloadFile";
import { DeliverableDisplay } from "@/components/deliverable/DeliverableDisplay";
import { FeedbackHistory } from "@/components/dashboard/FeedbackHistory";
import { ThemeToggle } from "@/components/themeToggle/ThemeToggle";
import { ProjectCompletedView } from "@/components/clientView/ProjectCompletedView";



export const ClientView = () => {
  const { token } = useParams();
  const { data: project, isLoading, error } = usePublicProject(token);
  const { mutate, isPending } = useClientDecision(token);
  const { downloadFile, isDownloading } = useDownloadFile();

  // Interaction State
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [clientName, setClientName] = useState("");

  const handleDecision = async (status: "APPROVED" | "CHANGES_REQUESTED") => {
    if (token) {
      mutate(
        {
          decision: status,
          feedback: feedback.trim() || undefined,
          clientName: clientName.trim() || undefined,
        },
        {
          onSuccess: () => {
            setShowRejectForm(false);
            setShowApproveForm(false);
            setFeedback("");
            setClientName("");
          },
        }
      );
    }
  };

  const handleDownload = () => {
    if (project?.file) {
      downloadFile(
        project.file.id || (project.file as any).fileId,
        project.file.fileName || (project.file as any).filename || "deliverable",
        token,
        "download"
      );
    }
  };

  const isExpired = project?.expiresAt
    ? new Date(project.expiresAt).getTime() <= Date.now()
    : false;

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="animate-spin text-zinc-900 dark:text-white" />
      </div>
    );

  if (error || !project) {
    return <ProjectCompletedView reason="deleted" />;
  }

  if (isExpired || project.status === "EXPIRED" || (project.status as any) === "COMPLETED") {
    return <ProjectCompletedView projectName={project.name} reason="expired" />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pb-28 font-sans transition-colors">
      <ClientSocketManager projectId={project.id} />
      {/* Top Navbar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-zinc-900 text-white dark:bg-white dark:text-black rounded flex items-center justify-center">
              <CheckCircle2 size={16} strokeWidth={3} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-white">Freelance Approval</span>
                <span className="text-zinc-300 dark:text-zinc-600">/</span>
                <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">{project.name}</span>
              </div>
              <p className="text-[11px] text-zinc-500">Client Review Portal • By Lokesh Singh Tanwar</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <TimeRemaining expiresAt={project?.expiresAt} />
            <StatusBadge status={project.status} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* UNIVERSAL FILE VIEWER */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl min-h-[50vh] flex items-center justify-center relative group transition-colors">
          {project.file ? (
            <DeliverableDisplay
              file={project.file}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          ) : (
            <p className="text-zinc-400 dark:text-zinc-500 py-16">No deliverable file uploaded yet.</p>
          )}

          {/* Quick Download Action Button */}
          {project.file && (
            <button
              className="absolute top-3.5 right-3.5 bg-zinc-900/80 hover:bg-zinc-900 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition shadow-md border border-white/10 dark:border-zinc-700/60 cursor-pointer z-10"
              onClick={() => handleDownload()}
              disabled={isDownloading}
              title="Download Deliverable"
            >
              {isDownloading ? (
                <Loader2 className="animate-spin" size={13} />
              ) : (
                <Download size={13} />
              )}
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </button>
          )}
        </div>

        {/* ACTION BAR (Only if Pending) */}
        {project.status === "PENDING" && (
          <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-4 transition-colors z-40">
            <div className="max-w-xl mx-auto">
              {!showRejectForm && !showApproveForm ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowRejectForm(true);
                      setShowApproveForm(false);
                      setFeedback("");
                    }}
                    className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
                  >
                    <XCircle size={18} /> Request Changes
                  </button>

                  <button
                    onClick={() => {
                      setShowApproveForm(true);
                      setShowRejectForm(false);
                      setFeedback("");
                    }}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle size={18} /> Approve Deliverable
                  </button>
                </div>
              ) : showApproveForm ? (
                /* APPROVAL FORM WITH REMARKS */
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 size={16} />
                      <span>Approve Deliverable</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Add an optional note or remarks
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Your Name (Optional - e.g. Sarah / Client)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />

                  <textarea
                    autoFocus
                    placeholder="Approval comments (e.g. Looks fantastic, ready to finalize! Everything is approved.)"
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none text-sm transition"
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />

                  <div className="flex gap-3 justify-end items-center">
                    <button
                      onClick={() => {
                        setShowApproveForm(false);
                        setFeedback("");
                      }}
                      className="px-5 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDecision("APPROVED")}
                      disabled={isPending}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <CheckCircle size={15} />
                      )}
                      Confirm & Approve
                    </button>
                  </div>
                </div>
              ) : (
                /* REJECT INPUT */
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                      <XCircle size={16} />
                      <span>Request Changes</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Provide details so freelancer can revise
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Your Name (Optional - e.g. Sarah / Client)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <textarea
                    autoFocus
                    placeholder="Describe the changes or improvements needed in detail..."
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500/50 outline-none resize-none text-sm transition"
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <div className="flex gap-3 justify-end items-center">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setFeedback("");
                      }}
                      className="px-5 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDecision("CHANGES_REQUESTED")}
                      disabled={isPending || !feedback.trim()}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Send size={15} />
                      )}
                      Send Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVISION IN PROGRESS BANNER (When changes were requested) */}
        {project.status === "CHANGES_REQUESTED" && (
          <div className="text-center py-10 bg-amber-500/5 dark:bg-zinc-900/50 border border-amber-500/30 rounded-2xl p-6 shadow-sm dark:shadow-xl animate-in fade-in transition-colors space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
              <Clock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Revision in Progress
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
              Your feedback has been received by the freelancer. They are currently preparing an updated version.
            </p>

            {project.latestComment && (
              <div className="bg-white/80 dark:bg-zinc-950 p-4 rounded-xl border border-amber-300/60 dark:border-amber-500/30 max-w-lg mx-auto text-left shadow-xs">
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Quote size={13} />
                  Your Submitted Remarks:
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 text-sm whitespace-pre-wrap font-sans">
                  "{project.latestComment}"
                </p>
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Waiting for revised upload... This page will refresh automatically with the new file and approval buttons!
            </div>
          </div>
        )}

        {/* DECISION & FEEDBACK TRAIL */}
        {project.decisions && project.decisions.length > 0 && (
          <FeedbackHistory
            decisions={project.decisions}
            currentStatus={project.status}
          />
        )}


        {/* SUCCESS MESSAGE (If Approved) */}
        {project.status === "APPROVED" && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Project Approved
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">The freelancer has been notified.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 mt-20 py-8 text-center text-xs text-zinc-500 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-6">
          <span>
            Powered by <strong className="text-zinc-700 dark:text-zinc-300">Freelance Approval</strong> — Fast & friction-free client approvals
          </span>
          <span>
            Created by <strong className="text-zinc-700 dark:text-zinc-300">Lokesh Singh Tanwar</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};

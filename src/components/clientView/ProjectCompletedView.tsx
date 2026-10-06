import React from "react";
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/themeToggle/ThemeToggle";

interface ProjectCompletedViewProps {
  projectName?: string;
  reason?: "deleted" | "expired" | "completed";
}

export const ProjectCompletedView: React.FC<ProjectCompletedViewProps> = ({
  projectName,
  reason = "completed",
}) => {
  const getReasonMessage = () => {
    if (reason === "expired") {
      return "The review window for this project has concluded and the deliverable is marked as completed.";
    }
    return "This project has reached completion and all client reviews have concluded. The deliverable has been finalized and archived.";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans transition-colors flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-white">
                  Freelance Approval
                </span>
                {projectName && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">/</span>
                    <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                      {projectName}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Client Review Portal • By Lokesh Singh Tanwar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Completed
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-lg w-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-xl dark:shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Big Check Badge */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-400/40">
              <CheckCircle2 size={40} strokeWidth={2.2} />
            </div>
          </div>

          {/* Heading & Reason */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <Sparkles size={12} />
              Review Concluded
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Project Completed
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {getReasonMessage()}
            </p>
          </div>

          {/* Highlights Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Deliverables Finalized</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Files and feedback recorded with immutable proof.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                <FileCheck size={14} className="text-indigo-500" />
                <span>Next Milestones</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Contact your freelancer directly for new requests.
              </p>
            </div>
          </div>

          {/* Action Link */}
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow-md cursor-pointer group"
            >
              <span>Go to Freelance Approval</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-6 text-center text-xs text-zinc-500 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-6">
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

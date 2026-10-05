import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  History,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import type { ApprovalDecision } from "@/types/project/project";

interface FeedbackHistoryProps {
  decisions?: ApprovalDecision[];
  currentStatus?: string;
  className?: string;
}

export const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({
  decisions = [],
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!decisions || decisions.length === 0) {
    return (
      <div className={`bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors ${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
            <History size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
              Feedback & Decision History
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Immutable record of all client feedback and approval rounds
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 text-center py-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            No client decisions recorded yet. Once the client reviews the deliverable, their remarks or approval notes will be permanently preserved here.
          </p>
        </div>
      </div>
    );
  }

  // Sort decisions descending (newest first)
  const sorted = [...decisions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalRounds = sorted.length;
  const rejectionCount = sorted.filter((d) => d.type === "CHANGES_REQUESTED").length;
  const approvalCount = sorted.filter((d) => d.type === "APPROVED").length;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors ${className}`}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30 shrink-0">
            <History size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
              Feedback & Decision History
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Immutable record of all client feedback and approval rounds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {totalRounds} {totalRounds === 1 ? "Round" : "Rounds"}
          </span>
          {rejectionCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900/50">
              {rejectionCount} {rejectionCount === 1 ? "Revision" : "Revisions"}
            </span>
          )}
          {approvalCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
              {approvalCount} Approved
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer ml-1"
            title={isExpanded ? "Collapse History" : "Expand History"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* TIMELINE LIST */}
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
            {sorted.map((item, index) => {
              const roundNumber = totalRounds - index;
              const isLatest = index === 0;
              const isReject = item.type === "CHANGES_REQUESTED";

              return (
                <div key={item.id || index} className="relative group">
                  {/* Timeline Bullet Node */}
                  <div
                    className={`absolute -left-7 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs transition-transform group-hover:scale-110 ${
                      isReject
                        ? "bg-rose-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {isReject ? (
                      <AlertCircle size={12} strokeWidth={2.5} />
                    ) : (
                      <CheckCircle2 size={12} strokeWidth={2.5} />
                    )}
                  </div>

                  {/* Card Container */}
                  <div
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      isLatest
                        ? isReject
                          ? "bg-rose-50/30 dark:bg-rose-950/10 border-rose-300 dark:border-rose-900/40 shadow-xs"
                          : "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-900/40 shadow-xs"
                        : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md tracking-wider ${
                            isReject
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          }`}
                        >
                          {isReject ? "Changes Requested" : "Approved"}
                        </span>

                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                          Round #{roundNumber} {isLatest && "(Latest)"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <Clock size={12} />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* CLIENT REMARKS BUBBLE */}
                    <div>
                      {item.comment ? (
                        <div
                          className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
                            isReject
                              ? "bg-white dark:bg-zinc-950/70 border-rose-200/80 dark:border-rose-900/40 text-zinc-900 dark:text-zinc-100"
                              : "bg-white dark:bg-zinc-950/70 border-emerald-200/80 dark:border-emerald-900/40 text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5 text-zinc-500 dark:text-zinc-400">
                            <MessageSquare
                              size={12}
                              className={isReject ? "text-rose-500" : "text-emerald-500"}
                            />
                            <span>{isReject ? "Client Remarks:" : "Approval Note:"}</span>
                          </div>
                          <p className="whitespace-pre-wrap font-sans text-sm text-zinc-800 dark:text-zinc-200 font-normal">
                            {item.comment}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs italic text-zinc-500">
                          {isReject
                            ? "No additional written remarks provided with this rejection."
                            : "Approved without additional notes."}
                        </div>
                      )}
                    </div>

                    {/* FOOTER METADATA */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-zinc-400" />
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {item.clientName || "Client"}
                          </span>
                        </span>
                        {item.clientEmail && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            ({item.clientEmail})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span>Verified Client Decision</span>
                        {item.ipAddress && (
                          <span className="opacity-60">• IP: {item.ipAddress.slice(0, 15)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


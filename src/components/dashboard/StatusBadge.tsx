import type { JSX } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { clsx } from "clsx";

interface StatusBadgeProps {
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "EXPIRED" | "COMPLETED" | string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const normalizedStatus = status === "EXPIRED" ? "COMPLETED" : status;

  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    CHANGES_REQUESTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    EXPIRED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };

  const icons: Record<string, JSX.Element> = {
    PENDING: <Clock size={14} className="mr-2" />,
    APPROVED: <CheckCircle size={14} className="mr-2" />,
    CHANGES_REQUESTED: <XCircle size={14} className="mr-2" />,
    COMPLETED: <CheckCircle size={14} className="mr-2" />,
    EXPIRED: <CheckCircle size={14} className="mr-2" />,
  };

  const currentStyle = styles[normalizedStatus] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  const currentIcon = icons[normalizedStatus] || <CheckCircle size={14} className="mr-2" />;

  return (
    <span
      className={clsx(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        currentStyle
      )}
    >
      {currentIcon}
      {normalizedStatus.replace("_", " ")}
    </span>
  );
};

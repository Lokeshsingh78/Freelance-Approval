import type { JSX } from "react";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

interface StatusBadgeProps {
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "EXPIRED";
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles: Record<StatusBadgeProps["status"], string> = {
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    APPROVED: "bg-green-500/10 text-green-500 border-green-500/20",
    CHANGES_REQUESTED: "bg-red-500/10 text-red-500 border-red-500/20",
    EXPIRED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  const icons: Record<StatusBadgeProps["status"], JSX.Element> = {
    PENDING: <Clock size={14} className="mr-2" />,
    APPROVED: <CheckCircle size={14} className="mr-2" />,
    CHANGES_REQUESTED: <XCircle size={14} className="mr-2" />,
    EXPIRED: <AlertTriangle size={14} className="mr-2" />,
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        styles[status]
      )}
    >
      {icons[status]}
      {status.replace("_", " ")}
    </span>
  );
};

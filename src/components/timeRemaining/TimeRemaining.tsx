import { Clock, CheckCircle } from "lucide-react";

export const TimeRemaining = ({
  expiresAt,
}: {
  expiresAt?: string | Date | null;
}) => {
  if (!expiresAt) return null;

  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine urgency
  const isUrgent = diffDays <= 3;
  const isExpired = diffDays <= 0;

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
        <CheckCircle size={12} /> Project Completed
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border ${
        isUrgent
          ? "text-red-400 border-red-500/20 bg-red-500/10 animate-pulse"
          : "text-zinc-400 border-zinc-800 bg-zinc-900"
      }`}
    >
      <Clock size={12} />
      {diffDays} days left
    </span>
  );
};

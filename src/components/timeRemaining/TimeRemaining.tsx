import { Clock, AlertTriangle } from "lucide-react";

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
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
        <AlertTriangle size={12} /> Expired
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

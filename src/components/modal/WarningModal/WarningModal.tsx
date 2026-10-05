import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useModalStore } from "@/store/modalStore/useModalStore";

export const WarningModal = () => {
  const { isOpen, type, data, closeModal } = useModalStore();

  // 1. Add local loading state
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || type !== "WARNING" || !data) return null;

  const handleConfirm = async () => {
    // 2. Check if a confirm function was passed
    if (!data.onConfirm) return;

    try {
      setIsLoading(true);
      // 3. Await the function passed from the parent component
      await data.onConfirm();
      closeModal();
    } catch (err) {
      console.error(err);
      // Error handling is usually done in the hook, but we catch here to stop the spinner if needed
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-red-900/50 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={closeModal}
          disabled={isLoading}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2 ring-1 ring-red-500/20">
            <AlertTriangle size={32} />
          </div>

          <h3 className="text-xl font-bold text-white">{data.title}</h3>

          <p className="text-sm text-zinc-400 leading-relaxed px-2">
            {data.description}
          </p>

          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={closeModal}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                data.confirmText || "Confirm"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

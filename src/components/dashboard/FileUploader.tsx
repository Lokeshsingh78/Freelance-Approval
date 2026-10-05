import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Loader2,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import styles from "./index.module.css";
import { useUploadDeliverable } from "@/hooks/useProject/export";
import { getFileIcon } from "@/lib/ConditionalIcons/getFileIcon";
import { formatFileSize, getFileCategory, getCategoryBadge } from "@/lib/fileHelpers";
import { calculateUploadPrice, formatINR } from "@/lib/pricing";
import { startCashfreePayment } from "@/lib/cashfree";
import api from "@/lib/api/api";
import { toast } from "sonner";

const STORAGE_KEY = "freelance_approval_upload_draft_file";

interface FileUploaderProps {
  token?: string;
  projectId?: string;
}

// --- Helper: Convert File to Base64 ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- Helper: Convert Base64 back to File ---
const base64ToFile = (
  base64: string,
  fileName: string,
  mimeType: string
): File => {
  const arr = base64.split(",");
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mimeType });
};

type PaymentPhase =
  | "idle"
  | "creating_order"
  | "awaiting_payment"
  | "verifying"
  | "uploading"
  | "error";

export const FileUploader = ({ token }: FileUploaderProps) => {
  const { uploadDeliverable, isUploading, uploadProgress } =
    useUploadDeliverable(token);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // Payment states
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("idle");
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Load from LocalStorage on Mount
  useEffect(() => {
    const loadDraft = async () => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const { name, type, base64 } = JSON.parse(savedData);
          const restoredFile = base64ToFile(base64, name, type);

          setFile(restoredFile);

          // Re-generate preview URL
          if (type.startsWith("image/") || type.startsWith("video/") || type.startsWith("audio/")) {
            setPreviewUrl(URL.createObjectURL(restoredFile));
          }
        } catch (e) {
          console.error("Failed to restore file draft", e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsHydrating(false);
    };

    loadDraft();
  }, []);

  // 2. Cleanup Preview URL on unmount/change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 3. Handle Saving to LocalStorage
  const saveToStorage = async (selectedFile: File) => {
    if (selectedFile.size > 4 * 1024 * 1024) {
      console.warn("File larger than 4MB, skipping localStorage caching");
      return;
    }

    try {
      const base64 = await fileToBase64(selectedFile);
      const dataToSave = {
        name: selectedFile.name,
        type: selectedFile.type,
        base64: base64,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Error saving draft", e);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (!selected) return;

    setFile(selected);
    saveToStorage(selected);
    setPaymentOrderId(null);
    setPaymentSessionId(null);
    setPaymentError(null);
    setPaymentPhase("idle");

    if (
      selected.type.startsWith("image/") ||
      selected.type.startsWith("video/") ||
      selected.type.startsWith("audio/")
    ) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setPaymentOrderId(null);
    setPaymentSessionId(null);
    setPaymentError(null);
    setPaymentPhase("idle");
    setIsModalOpen(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Start Free Upload (files < 100MB)
  const startFreeUpload = async () => {
    if (file && token) {
      try {
        console.log("Uploading free deliverable:", file.name);
        await uploadDeliverable(file);
        reset();
      } catch (err) {
        console.log("Upload prevented reset due to error", err);
      }
    }
  };

  // Trigger Paid Flow via Cashfree
  const initiatePaymentAndUpload = async () => {
    if (!file || !token) return;

    const pricing = calculateUploadPrice(file.size);
    if (pricing.isFree) {
      return startFreeUpload();
    }

    try {
      setPaymentError(null);
      setPaymentPhase("creating_order");
      setIsModalOpen(true);

      // 1. Create order on backend & Cashfree
      const { data: orderData } = await api.post(
        "/payments/create-order",
        {
          filename: file.name,
          fileSize: file.size,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (orderData.isFree) {
        setIsModalOpen(false);
        return startFreeUpload();
      }

      setPaymentOrderId(orderData.orderId);
      setPaymentSessionId(orderData.paymentSessionId);
      setPaymentPhase("awaiting_payment");

      // 2. Launch Cashfree JS Checkout
      const checkoutResult = await startCashfreePayment(
        orderData.paymentSessionId,
        "production"
      );

      if (!checkoutResult.success) {
        setPaymentError(
          checkoutResult.error || "Payment was cancelled or could not be completed."
        );
        setPaymentPhase("error");
        return;
      }

      // 3. Verify Payment
      await verifyAndUpload(orderData.orderId);
    } catch (err: any) {
      console.error("Payment initiation failed:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to initialize payment";
      setPaymentError(msg);
      setPaymentPhase("error");
    }
  };

  // Verify payment status with backend and immediately upload
  const verifyAndUpload = async (orderIdToVerify?: string) => {
    const targetOrderId = orderIdToVerify || paymentOrderId;
    if (!targetOrderId || !file || !token) {
      toast.error("Missing order ID for verification");
      return;
    }

    try {
      setPaymentPhase("verifying");
      const { data: verifyData } = await api.post(
        "/payments/verify",
        { orderId: targetOrderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verifyData.success && verifyData.status === "SUCCESS") {
        toast.success("Payment verified successfully! Uploading file...");
        setPaymentPhase("uploading");

        // 4. Trigger upload with paymentOrderId attached
        await uploadDeliverable(file, { paymentOrderId: targetOrderId });
        toast.success("Deliverable uploaded successfully!");
        reset();
      } else {
        setPaymentError(
          verifyData.message || "Payment is not confirmed yet. Please verify again."
        );
        setPaymentPhase("error");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      const msg = err.response?.data?.message || err.message || "Verification failed";
      setPaymentError(msg);
      setPaymentPhase("error");
    }
  };

  // Safe developer simulation / bypass if domain whitelist is needed in production merchant settings
  const handleDevSimulation = async () => {
    if (!paymentOrderId || !file || !token) return;

    try {
      setPaymentPhase("verifying");
      const { data } = await api.post(
        "/payments/dev-verify",
        { orderId: paymentOrderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Test Payment approved! Uploading deliverable...");
        setPaymentPhase("uploading");
        await uploadDeliverable(file, { paymentOrderId });
        toast.success("Deliverable uploaded successfully!");
        reset();
      }
    } catch (err: any) {
      toast.error("Simulation failed");
      setPaymentPhase("error");
    }
  };

  // ACCEPT ANY FILE TYPE (Images, Audio, Video, Executables, Archives, Code, Documents)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  // Prevent UI flicker while checking local storage
  if (isHydrating) return null;

  /* ================= Uploading State ================= */
  if (isUploading) {
    return (
      <div className={styles.uploading}>
        <Loader2 className={styles.spinner} size={32} />
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className={styles.uploadText}>Uploading... {uploadProgress}%</p>
      </div>
    );
  }

  /* ================= Preview State ================= */
  if (file) {
    const category = getFileCategory(file.type, file.name);
    const badge = getCategoryBadge(category);
    const sizeStr = formatFileSize(file.size);
    const pricing = calculateUploadPrice(file.size);

    return (
      <div className={styles.preview}>
        {/* Header */}
        <div className={styles.previewHeader}>
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className={`px-2 py-0.5 text-[10px] rounded font-mono border ${badge.color}`}>
              {badge.label}
            </span>
            <p className={styles.fileName}>{file.name}</p>
          </div>
          <button onClick={reset} className={styles.removeBtn} title="Remove file">
            <X size={16} />
          </button>
        </div>

        {/* Preview Body */}
        <div className={styles.previewBody}>
          {previewUrl && file.type.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt="Preview"
              className={styles.previewImage}
            />
          ) : previewUrl && file.type.startsWith("video/") ? (
            <video
              src={previewUrl}
              controls
              className="max-h-24 w-auto rounded bg-black"
            />
          ) : previewUrl && file.type.startsWith("audio/") ? (
            <audio src={previewUrl} controls className="w-full px-4" />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="mb-2 text-zinc-300">
                {getFileIcon(file.type, file.name, 36)}
              </div>
              <p className="text-xs font-medium text-white truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                {sizeStr}
              </p>
            </div>
          )}
        </div>

        {/* PRICING & ACTION SECTION */}
        <div className="mt-3 space-y-2.5">
          {pricing.isFree ? (
            /* FREE TIER BADGE & BUTTON */
            <>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Free Standard Tier (Under 100 MB)
                </span>
                <span className="font-bold text-emerald-300 font-mono">₹0 FREE</span>
              </div>

              <button onClick={startFreeUpload} className={styles.uploadBtn}>
                Upload Deliverable ({sizeStr})
              </button>
            </>
          ) : (
            /* PAID TIER BADGE & CASHFREE BUTTON */
            <>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-400/30 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                    <Sparkles size={13} className="text-amber-400" />
                    Large File ({sizeStr}) • Tier: Up to {pricing.tierMaxMB} MB
                  </span>
                  <span className="px-2 py-0.5 rounded font-black text-xs bg-amber-400 text-black">
                    Fee: {formatINR(pricing.amount)}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  Rate: ₹10 per 100 MB block. Instant payment via Cashfree PG (UPI, Cards, NetBanking). Upload starts automatically after confirmation.
                </p>
              </div>

              <button
                onClick={initiatePaymentAndUpload}
                disabled={paymentPhase !== "idle" && paymentPhase !== "error"}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {paymentPhase === "creating_order" ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Creating Cashfree Order...
                  </>
                ) : paymentPhase === "awaiting_payment" ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Cashfree Checkout Active...
                  </>
                ) : paymentPhase === "verifying" ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Verifying Payment...
                  </>
                ) : (
                  <>
                    <CreditCard size={14} /> Pay {formatINR(pricing.amount)} & Upload Deliverable
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* MODAL: Cashfree Payment Status & Checkout Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-5 text-zinc-100 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Cashfree Payment Gateway</h3>
                    <p className="text-[11px] text-zinc-400">Order: {paymentOrderId || "Generating..."}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Order Summary */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>File Name:</span>
                  <span className="font-medium text-white truncate max-w-[200px]">{file.name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Deliverable Size:</span>
                  <span className="font-mono text-white">{sizeStr}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Applicable Tier:</span>
                  <span className="text-white">Up to {pricing.tierMaxMB} MB</span>
                </div>
                <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold text-sm text-white">
                  <span>Total Payable:</span>
                  <span className="text-amber-400 font-mono">{formatINR(pricing.amount)}</span>
                </div>
              </div>

              {/* Current Phase Message */}
              <div className="text-center py-2 space-y-2">
                {paymentPhase === "creating_order" && (
                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-300">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Connecting to Cashfree Payments server...</span>
                  </div>
                )}

                {paymentPhase === "awaiting_payment" && (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-300">
                      Payment modal is open. Please complete the transaction in Cashfree.
                    </p>
                    <button
                      onClick={() => paymentSessionId && startCashfreePayment(paymentSessionId, "production")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 mx-auto"
                    >
                      <ExternalLink size={13} /> Re-open Cashfree Checkout
                    </button>
                  </div>
                )}

                {paymentPhase === "verifying" && (
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Verifying transaction status with Cashfree...</span>
                  </div>
                )}

                {paymentPhase === "error" && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start gap-2 text-left">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Payment Notice</p>
                      <p className="text-[11px] text-zinc-400">{paymentError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                {paymentOrderId && (
                  <button
                    onClick={() => verifyAndUpload(paymentOrderId)}
                    disabled={paymentPhase === "verifying"}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={13} className={paymentPhase === "verifying" ? "animate-spin" : ""} />
                    Check Payment Confirmation & Upload
                  </button>
                )}

                {/* Developer Simulation Button for frictionless local testing */}
                {paymentOrderId && (
                  <button
                    type="button"
                    onClick={handleDevSimulation}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-mono transition cursor-pointer border border-zinc-700 flex items-center justify-center gap-1.5"
                    title="Simulate verification without real money transfer for testing"
                  >
                    <Sparkles size={12} className="text-amber-400" />
                    ⚡ Developer Simulation (Test Verification)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================= Dropzone ================= */
  return (
    <div
      {...getRootProps()}
      className={`${styles.dropzone} ${
        isDragActive ? styles.active : styles.inactive
      }`}
    >
      <input {...getInputProps()} />
      <div className={styles.iconWrapper}>
        <UploadCloud size={24} />
      </div>
      <h3 className={styles.title}>Upload Deliverable</h3>
      <p className={styles.subtitle}>Drag & drop or click to browse any file</p>
      <p className={styles.helper}>
        Under 100 MB: <strong className="text-emerald-400">FREE</strong> | 100 MB+: ₹10 / 100 MB (Cashfree Secured)
      </p>
    </div>
  );
};

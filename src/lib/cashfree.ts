declare global {
  interface Window {
    Cashfree?: (config: { mode: "production" | "sandbox" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_modal" | "_self" | "_blank" | "_top";
      }) => Promise<{
        error?: { message: string; code?: string };
        paymentDetails?: any;
      }>;
    };
  }
}

let sdkPromise: Promise<void> | null = null;

export const loadCashfreeSDK = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();

  if (window.Cashfree) {
    return Promise.resolve();
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    // Check if already in document
    const existing = document.querySelector('script[src*="cashfree.com/js/v3"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return sdkPromise;
};

export interface CashfreeCheckoutResult {
  success: boolean;
  error?: string;
  paymentDetails?: any;
  isSimulated?: boolean;
}

export const startCashfreePayment = async (
  paymentSessionId: string,
  mode: "production" | "sandbox" = "production",
  redirectTarget: "_modal" | "_self" = "_modal",
  returnUrl?: string
): Promise<CashfreeCheckoutResult> => {
  await loadCashfreeSDK();

  if (!window.Cashfree) {
    throw new Error("Cashfree SDK failed to initialize");
  }

  const cashfree = window.Cashfree({
    mode: mode,
  });

  try {
    const checkoutOptions: any = {
      paymentSessionId,
      redirectTarget,
    };
    if (returnUrl) {
      checkoutOptions.returnUrl = returnUrl;
    }

    const result = await cashfree.checkout(checkoutOptions);

    if (result && result.error) {
      return {
        success: false,
        error: result.error.message || "Payment cancelled or failed",
      };
    }

    return {
      success: true,
      paymentDetails: result?.paymentDetails,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Cashfree checkout encountered an unexpected error",
    };
  }
};

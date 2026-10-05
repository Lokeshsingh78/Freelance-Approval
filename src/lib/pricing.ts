/**
 * Deliverable Upload Pricing Calculation
 * - Under 100 MB (up to 99.9 MB): FREE (₹0)
 * - 100 MB or above: ₹10 per 100 MB tier
 *   Examples:
 *   - 100 MB = ₹10
 *   - 150 MB = ₹20 (Tier: up to 200 MB)
 *   - 500 MB = ₹50
 *   - 1000 MB (1 GB) = ₹100
 */

export const FREE_TIER_MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export interface PricingTierResult {
  bytes: number;
  sizeMB: number;
  isFree: boolean;
  amount: number; // in INR
  tierLabel: string;
  tierMaxMB: number;
  rateDescription: string;
}

export const calculateUploadPrice = (bytes: number): PricingTierResult => {
  const safeBytes = Math.max(0, Number(bytes) || 0);
  const sizeMB = safeBytes / (1024 * 1024);

  // Files strictly under 100 MB are Free
  if (safeBytes < FREE_TIER_MAX_BYTES) {
    return {
      bytes: safeBytes,
      sizeMB: Math.round(sizeMB * 10) / 10,
      isFree: true,
      amount: 0,
      tierLabel: "Free Standard Tier",
      tierMaxMB: 100,
      rateDescription: "Files under 100 MB are 100% Free",
    };
  }

  // 100 MB+: ₹10 for every 100 MB block
  const blocks = Math.ceil(sizeMB / 100);
  const amount = blocks * 10;
  const tierMaxMB = blocks * 100;

  return {
    bytes: safeBytes,
    sizeMB: Math.round(sizeMB * 10) / 10,
    isFree: false,
    amount,
    tierLabel: `Heavy Deliverable (${tierMaxMB} MB Tier)`,
    tierMaxMB,
    rateDescription: "₹10 per 100 MB tier",
  };
};

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

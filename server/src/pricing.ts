/**
 * Pricing Logic for Deliverable Uploads
 * - Files < 100 MB: FREE (0 INR)
 * - Files >= 100 MB: 10 INR per 100 MB block
 *   e.g. 100 MB = ₹10, 200 MB = ₹20, 500 MB = ₹50, 1000 MB (1GB) = ₹100
 */

export const FREE_TIER_MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export interface PricingDetails {
  bytes: number;
  sizeMB: number;
  isFree: boolean;
  amount: number; // in INR
  tierLabel: string;
  tierMaxMB: number;
}

export const calculateUploadPrice = (bytes: number): PricingDetails => {
  const safeBytes = Math.max(0, Number(bytes) || 0);
  const sizeMB = safeBytes / (1024 * 1024);

  // Files strictly under 100 MB are Free
  if (safeBytes < FREE_TIER_MAX_BYTES) {
    return {
      bytes: safeBytes,
      sizeMB: Math.round(sizeMB * 100) / 100,
      isFree: true,
      amount: 0,
      tierLabel: "Free Tier (Under 100 MB)",
      tierMaxMB: 100,
    };
  }

  // 100 MB+ : ₹10 per 100 MB tier
  const blocks = Math.ceil(sizeMB / 100);
  const amount = blocks * 10;
  const tierMaxMB = blocks * 100;

  return {
    bytes: safeBytes,
    sizeMB: Math.round(sizeMB * 100) / 100,
    isFree: false,
    amount,
    tierLabel: `Heavy Deliverable Tier (Up to ${tierMaxMB} MB)`,
    tierMaxMB,
  };
};

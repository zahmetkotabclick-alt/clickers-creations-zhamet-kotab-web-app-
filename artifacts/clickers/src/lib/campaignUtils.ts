/**
 * Pure calculation utilities for the Global Promotional Campaign System.
 * Ensures consistent price calculations across product cards, product details,
 * cart drawer, checkout, and order placement.
 */

export interface ActiveCampaignInfo {
  id: string;
  name: string;
  discountPercent: number;
  isActive: boolean;
  createdAt?: string;
}

export interface PricingResult {
  /** The final price the customer pays */
  effectivePrice: number;
  /** Strikethrough original price if a discount applies, or null if none */
  originalPrice: number | null;
  /** Discount percentage to display in badges (e.g. 60), or null if none */
  discountPercent: number | null;
  /** Whether a discount (campaign or product-specific) is actively applied */
  hasDiscount: boolean;
}

/**
 * Calculates the exact pricing for a book given its database record and active campaign.
 * Rules:
 * 1. Free products (price <= 0) remain free (0 EGP).
 * 2. Unintended stacking is prevented: Campaign discount applies to original reference price.
 * 3. Customer always gets the better price (min between current selling price and campaign price).
 */
export function calculateBookPricing(
  price: number | string | null | undefined,
  originalPrice?: number | string | null | undefined,
  campaign?: ActiveCampaignInfo | null
): PricingResult {
  const currentPrice = Math.max(0, Number(price) || 0);
  const baseOriginalPrice = originalPrice ? Math.max(0, Number(originalPrice)) : null;

  // 1. Free products remain free
  if (currentPrice <= 0) {
    return {
      effectivePrice: 0,
      originalPrice: null,
      discountPercent: null,
      hasDiscount: false,
    };
  }

  const campaignActive = !!(campaign && campaign.isActive && campaign.discountPercent > 0);

  if (campaignActive) {
    // If book already had a higher original_price, calculate off that base to avoid double-discount stacking
    const baseRefPrice = baseOriginalPrice && baseOriginalPrice > currentPrice
      ? baseOriginalPrice
      : currentPrice;

    const campaignDiscountedPrice = Math.round(baseRefPrice * (1 - campaign.discountPercent / 100) * 100) / 100;

    // Apply the better deal for the customer
    const effectivePrice = Math.min(currentPrice, campaignDiscountedPrice);

    const hasDiscount = baseRefPrice > effectivePrice;
    const discountPercent = hasDiscount
      ? Math.round((1 - effectivePrice / baseRefPrice) * 100)
      : null;

    return {
      effectivePrice: Number(effectivePrice.toFixed(2)),
      originalPrice: hasDiscount ? Number(baseRefPrice.toFixed(2)) : null,
      discountPercent,
      hasDiscount,
    };
  }

  // No active campaign: standard per-book discount (if original_price > price)
  if (baseOriginalPrice && baseOriginalPrice > currentPrice) {
    const discountPercent = Math.round((1 - currentPrice / baseOriginalPrice) * 100);
    return {
      effectivePrice: Number(currentPrice.toFixed(2)),
      originalPrice: Number(baseOriginalPrice.toFixed(2)),
      discountPercent,
      hasDiscount: true,
    };
  }

  return {
    effectivePrice: Number(currentPrice.toFixed(2)),
    originalPrice: null,
    discountPercent: null,
    hasDiscount: false,
  };
}


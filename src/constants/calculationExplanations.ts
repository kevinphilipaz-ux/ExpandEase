/**
 * Single source of truth for "how we calculate" copy.
 * Used by: (1) tooltips next to key metrics in the UI, (2) chatbot context so the AI
 * explains the same way. Keeps defensibility and consistency.
 */

/** Short copy for tooltips (hover). */
export const CALCULATION_TOOLTIPS = {
  /** ROI shown in Wishlist and Financial (blended). */
  roi: `ROI is (total value added ÷ total cost) × 100. Value added per item = cost × ROI rate from our tables (e.g. kitchen tier, flooring, pool). These are directional estimates, not guarantees.`,

  /** "Save $X/mo" vs. comparable. */
  monthlySavings: `We need your existing loan balance to compute “your payment” after reno. For accuracy, enter your current monthly mortgage payment (P&I) in the Analysis section; we derive your balance from that plus your rate (onboarding) and a 30-year term. You can override with “Existing mortgage balance” if you know it. Your payment = P&I on (that balance + renovation cost) at your rate, 30 years. Comparable = P&I on 80% of post-reno value at today’s market rate (e.g. 6.8%). Savings = comparable − your payment.`,

  /** Post-renovation value. */
  postRenovationValue: `Current home value + total value added. Value added = sum of (each item’s cost × its ROI rate) from our cost/ROI tables.`,
} as const;

/** Slightly longer copy for chatbot context (same facts, can be cited verbatim). */
export const CALCULATION_EXPLANATIONS_FOR_CHATBOT = {
  roi: `Blended ROI = (total value added ÷ total cost) × 100. Each line item (kitchen tier, flooring, pool, etc.) has a cost and an ROI rate in our tables; value added for that item = cost × ROI. The blended ROI is the overall percentage. These are directional estimates from our internal tables, not from a single cited source like Cost vs. Value; for lender or contractor tie-out, use actual bids and appraisals when available.`,

  monthlySavings: `Monthly "Save $X/mo" compares two payments over 30 years: (1) Your payment = P&I on (existing mortgage balance + total renovation cost) at the user’s rate (onboarding). (2) Comparable payment = P&I on 80% of post-renovation value at market rate (e.g. 6.8%). Savings = comparable − your payment. For accuracy, we prefer the user’s current monthly mortgage payment (P&I): we derive existing balance from that plus rate and 30-year term. If they don’t enter it, we use their manual “Existing mortgage balance” or an estimated balance (e.g. 75% LTV of current value) so the number isn’t overstated.`,

  postRenovationValue: `Post-renovation value = current home value + total value added. Total value added = sum over all items of (item cost × item ROI rate) from our cost/ROI tables. Current value comes from the property (API or user edit) or a default.`,
} as const;

/** All explanation text in one blob for injecting into chatbot system/context. */
export function getCalculationContextForChatbot(): string {
  return [
    '## How the app calculates key numbers (use this to answer homeowner questions)',
    '',
    '### ROI',
    CALCULATION_EXPLANATIONS_FOR_CHATBOT.roi,
    '',
    '### Monthly savings vs. comparable',
    CALCULATION_EXPLANATIONS_FOR_CHATBOT.monthlySavings,
    '',
    '### Post-renovation value',
    CALCULATION_EXPLANATIONS_FOR_CHATBOT.postRenovationValue,
  ].join('\n');
}

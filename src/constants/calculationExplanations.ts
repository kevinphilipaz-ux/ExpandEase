/**
 * Single source of truth for "how we calculate" copy.
 * Used by: (1) tooltips next to key metrics in the UI, (2) chatbot context so the AI
 * explains the same way. Keeps defensibility and consistency.
 */

/** Short copy for tooltips (hover): simple math + brief, positive assumption note. */
export const CALCULATION_TOOLTIPS = {
  /** ROI shown in Wishlist and Financial (blended). */
  roi: `Blended ROI = (Total value added ÷ Total cost) × 100. Value per item = cost × ROI rate from our tables. We use industry benchmarks so your numbers hold up with lenders and contractors.`,

  /** "Save $X/mo" vs. comparable. */
  monthlySavings: `Your payment = existing P&I (unchanged at your rate) + new P&I on renovation amount at second-lien rate (~8.5%), 30 years. Comparable = P&I on 80% of post-reno value at market rate (~7%). Savings = Comparable − Your blended payment. We split the calculation so your existing low rate is preserved.`,

  /** Post-renovation value. */
  postRenovationValue: `Post-reno value = Current value + Total value added. Value added = Σ (each item's cost × its ROI rate). Our ROI rates come from established benchmarks so your estimate stays realistic and defensible.`,
} as const;

/** Slightly longer copy for chatbot context (same facts, can be cited verbatim). */
export const CALCULATION_EXPLANATIONS_FOR_CHATBOT = {
  roi: `Blended ROI = (total value added ÷ total cost) × 100. Each line item has value added = cost × ROI rate from our tables. We use industry benchmarks so the numbers hold up with lenders and contractors; for formal tie-out, use actual bids and appraisals when available.`,

  monthlySavings: `Your payment = existing P&I (unchanged at the user's rate) + new P&I on renovation amount at second-lien rate (~8.5%), 30 years. Comparable = P&I on 80% of post-reno value at market rate (~7%). Savings = Comparable − Your blended payment. We derive balance from their current P&I when they enter it, or use manual balance or a conservative LTV estimate so the comparison stays accurate.`,

  postRenovationValue: `Post-reno value = current value + total value added. Value added = Σ (item cost × item ROI rate) from our tables. Our ROI rates come from established benchmarks so the estimate stays realistic and defensible.`,
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

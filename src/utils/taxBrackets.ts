/**
 * US Federal marginal tax bracket lookup (2024 single-filer rates, simplified).
 * Used to personalize renovation tax-benefit estimates based on onboarding income.
 *
 * NOTE: This is an estimate for planning purposes only. We use single-filer
 * brackets as a conservative default — married-filing-jointly brackets are
 * wider, so actual savings may be higher. This is intentionally conservative
 * so we under-promise and over-deliver.
 */

interface TaxBracket {
  /** Upper bound of taxable income for this bracket (Infinity for the top) */
  upTo: number;
  /** Marginal rate applied to income within this bracket */
  rate: number;
}

const FEDERAL_BRACKETS_2024: TaxBracket[] = [
  { upTo: 11_600, rate: 0.10 },
  { upTo: 47_150, rate: 0.12 },
  { upTo: 100_525, rate: 0.22 },
  { upTo: 191_950, rate: 0.24 },
  { upTo: 243_725, rate: 0.32 },
  { upTo: 609_350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

/**
 * Returns the marginal federal tax rate for a given annual income.
 * Falls back to 24% if income is missing or zero.
 */
export function getMarginalTaxRate(annualIncome: number | undefined | null): number {
  if (!annualIncome || annualIncome <= 0) return 0.24; // safe default

  for (const bracket of FEDERAL_BRACKETS_2024) {
    if (annualIncome <= bracket.upTo) {
      return bracket.rate;
    }
  }
  return 0.37; // top bracket
}

/**
 * Returns a human-readable bracket percentage string, e.g. "24%".
 */
export function formatTaxBracket(annualIncome: number | undefined | null): string {
  return `${Math.round(getMarginalTaxRate(annualIncome) * 100)}%`;
}

/**
 * Calculates monthly tax savings from renovation financing.
 * Returns { monthlyInterestDeduction, monthlyPropTaxSavings, totalTaxSavings, bracketRate }
 */
export function calculateTaxSavings(
  totalCost: number,
  totalValue: number,
  secondLienRate: number,
  annualIncome: number | undefined | null,
) {
  const bracketRate = getMarginalTaxRate(annualIncome);
  const annualRenoInterest = totalCost * secondLienRate;
  const monthlyInterestDeduction = Math.round((annualRenoInterest * bracketRate) / 12);
  // Property tax estimate: ~0.6% of value increase / 12, at marginal rate
  const monthlyPropTaxSavings = Math.round((totalValue * 0.006 * bracketRate) / 12);
  const totalTaxSavings = monthlyInterestDeduction + monthlyPropTaxSavings;

  return {
    monthlyInterestDeduction,
    monthlyPropTaxSavings,
    totalTaxSavings,
    bracketRate,
  };
}

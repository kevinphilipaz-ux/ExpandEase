/**
 * Shared pure calculation functions for renovation financial modeling.
 * Used by FinancialAnalysis, FeasibilityGrid, MortgageRoadmap, NetWorthImpact,
 * CashflowTimeline, and AffordabilitySummary so all pages show identical numbers.
 */

import {
  TERM_YEARS,
  SECOND_LIEN_RATE_ANNUAL,
  MARKET_RATE_ANNUAL,
  ANNUAL_APPRECIATION_RATE,
  ESTIMATED_LTV_WHEN_BALANCE_UNKNOWN,
} from '../config/renovationDefaults';

// ─── Core mortgage math ────────────────────────────────────────────────────

/** Monthly P&I payment for an amortizing loan */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number = TERM_YEARS,
): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Derive loan principal from known monthly P&I (inverse of monthlyPayment) */
export function principalFromPayment(
  monthlyPmt: number,
  annualRate: number,
  termYears: number = TERM_YEARS,
): number {
  if (monthlyPmt <= 0 || annualRate < 0) return 0;
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return monthlyPmt * n;
  return (monthlyPmt * (1 - Math.pow(1 + r, -n))) / r;
}

/** Remaining balance on an amortizing loan after N years of payments */
export function remainingBalance(
  originalPrincipal: number,
  annualRate: number,
  termYears: number,
  yearsElapsed: number,
): number {
  if (originalPrincipal <= 0 || yearsElapsed <= 0) return originalPrincipal;
  if (yearsElapsed >= termYears) return 0;
  const r = annualRate / 12;
  const n = termYears * 12;
  const p = yearsElapsed * 12; // payments made
  if (r === 0) return originalPrincipal * (1 - p / n);
  return originalPrincipal * (Math.pow(1 + r, p) - Math.pow(1 + r, n) / Math.pow(1 + r, n - p));
}

/**
 * More accurate remaining balance using the standard amortization formula:
 * B(p) = L * [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
 */
export function calculateRemainingBalance(
  originalLoan: number,
  annualRate: number,
  termYears: number,
  yearsElapsed: number,
): number {
  if (originalLoan <= 0 || yearsElapsed <= 0) return originalLoan;
  if (yearsElapsed >= termYears) return 0;
  const r = annualRate / 12;
  const n = termYears * 12;
  const p = yearsElapsed * 12;
  if (r === 0) return originalLoan * (1 - p / n);
  const factor = Math.pow(1 + r, n);
  const paidFactor = Math.pow(1 + r, p);
  return originalLoan * (factor - paidFactor) / (factor - 1);
}

// ─── Blended payment (existing 1st mortgage + renovation 2nd lien) ──────

export interface BlendedPaymentResult {
  existingPayment: number;
  renovationPayment: number;
  blendedPayment: number;
  existingBalance: number;
  /** When balance was derived from current monthly payment */
  derivedBalanceFromPayment?: number;
}

/**
 * Calculate the blended monthly payment: existing mortgage stays at its rate,
 * renovation portion is a separate second lien at SECOND_LIEN_RATE_ANNUAL.
 */
export function calculateBlendedPayment(
  existingBalance: number,
  renovationCost: number,
  existingRate: number,
  secondLienRate: number = SECOND_LIEN_RATE_ANNUAL,
  termYears: number = TERM_YEARS,
): BlendedPaymentResult {
  const existingPayment = monthlyPayment(existingBalance, existingRate, termYears);
  const renovationPayment = monthlyPayment(renovationCost, secondLienRate, termYears);
  return {
    existingPayment,
    renovationPayment,
    blendedPayment: existingPayment + renovationPayment,
    existingBalance,
  };
}

/**
 * Resolve the existing balance from available user inputs.
 * Priority: manual override > derived from current payment > LTV estimate
 */
export function resolveExistingBalance(
  currentHomeValue: number,
  existingRate: number,
  manualBalance?: number,
  currentMonthlyPayment?: number,
): { balance: number; derivedFromPayment?: number } {
  if (manualBalance && manualBalance > 0) {
    return { balance: manualBalance };
  }
  if (currentMonthlyPayment && currentMonthlyPayment > 0) {
    const derived = principalFromPayment(currentMonthlyPayment, existingRate, TERM_YEARS);
    return { balance: derived, derivedFromPayment: derived };
  }
  return { balance: currentHomeValue * ESTIMATED_LTV_WHEN_BALANCE_UNKNOWN };
}

// ─── Savings vs. comparable ─────────────────────────────────────────────

/**
 * Estimate total "cost to move": sell current home + buy a home at target value.
 * Used to contextualize a negative net on renovation (you're still ahead vs. moving).
 * Assumes: seller commission ~6%, buyer closing ~2% of purchase price.
 */
export function estimateCostToMove(
  currentHomeValue: number,
  purchasePriceOfNewHome: number,
  sellerCommissionRate: number = 0.06,
  buyerClosingRate: number = 0.02,
): number {
  const sellerCost = currentHomeValue * sellerCommissionRate;
  const buyerCost = purchasePriceOfNewHome * buyerClosingRate;
  return Math.round(sellerCost + buyerCost);
}

/**
 * Monthly savings compared to buying a comparable home at market rate.
 * Comparable = P&I on 80% of post-reno value at market rate.
 */
export function calculateSavingsVsComparable(
  blendedPayment: number,
  postRenovationValue: number,
  marketRate: number = MARKET_RATE_ANNUAL,
  termYears: number = TERM_YEARS,
): number {
  const comparableLoanAmount = 0.8 * postRenovationValue;
  const comparablePayment = monthlyPayment(comparableLoanAmount, marketRate, termYears);
  return Math.round(comparablePayment - blendedPayment);
}

// ─── Break-even & net worth ─────────────────────────────────────────────

/**
 * Years until the renovation "pays for itself" through equity creation.
 * Considers both instant value-add and ongoing appreciation.
 */
export function calculateBreakEvenYears(
  totalCost: number,
  totalValueAdded: number,
  annualAppreciation: number = ANNUAL_APPRECIATION_RATE,
): number {
  if (totalCost <= 0) return 0;

  // Instant equity from the renovation
  const instantEquity = totalValueAdded - totalCost;
  if (instantEquity >= 0) return 0; // Already positive from day one

  // How many years of appreciation on the value-added to cover the gap
  const gap = -instantEquity;
  // Each year, appreciation adds totalValueAdded * rate (compounding)
  if (annualAppreciation <= 0) return Infinity;

  // Solve: totalValueAdded * ((1 + r)^t - 1) >= gap
  const t = Math.log(1 + gap / totalValueAdded) / Math.log(1 + annualAppreciation);
  return Math.round(t * 10) / 10; // round to 1 decimal
}

/**
 * Net worth impact over a projection period.
 * Returns the appreciated value of renovation vs. the true interest cost (sunk cost).
 * Principal is NOT counted as a cost since it becomes recoverable equity when you sell.
 */
export function calculateNetWorthImpact(
  totalCost: number,
  totalValueAdded: number,
  appreciationYears: number = 10,
  annualAppreciation: number = ANNUAL_APPRECIATION_RATE,
): {
  /** True sunk cost: interest paid on the renovation loan over the holding period */
  interestPaid: number;
  /** For backwards-compat: same as interestPaid (principal is recoverable equity, not a cost) */
  totalCostWithInterest: number;
  appreciatedValueAdded: number;
  netImpact: number;
} {
  // Value added appreciates over time
  const appreciatedValueAdded = totalValueAdded * Math.pow(1 + annualAppreciation, appreciationYears);

  // Accurate interest paid using actual amortization (replaces inaccurate 0.6 heuristic)
  // Principal paid off is NOT a sunk cost — it becomes equity when you sell.
  const holdingYears = Math.min(appreciationYears, TERM_YEARS);
  let interestPaid = 0;
  if (totalCost > 0) {
    const monthlyPmt = monthlyPayment(totalCost, SECOND_LIEN_RATE_ANNUAL, TERM_YEARS);
    const remainingBal = calculateRemainingBalance(totalCost, SECOND_LIEN_RATE_ANNUAL, TERM_YEARS, holdingYears);
    const principalRepaid = totalCost - remainingBal;
    const totalPaid = monthlyPmt * holdingYears * 12;
    interestPaid = Math.round(totalPaid - principalRepaid);
  }

  return {
    interestPaid,
    totalCostWithInterest: interestPaid, // backwards-compat alias
    appreciatedValueAdded: Math.round(appreciatedValueAdded),
    netImpact: Math.round(appreciatedValueAdded - interestPaid),
  };
}

// ─── Draw schedule ──────────────────────────────────────────────────────

export interface DrawMilestone {
  month: number;
  label: string;
  drawAmount: number;
  cumulativeDrawn: number;
}

/**
 * Generate a construction draw schedule based on total cost.
 * Divides into standard construction milestones with typical allocation percentages.
 */
export function calculateDrawSchedule(totalCost: number, durationMonths: number = 12): DrawMilestone[] {
  if (totalCost <= 0) return [];

  // Standard draw allocation percentages for residential construction
  const milestones = [
    { monthFraction: 0.08, label: 'Design & Permits', pct: 0.10 },
    { monthFraction: 0.25, label: 'Foundation', pct: 0.20 },
    { monthFraction: 0.50, label: 'Framing & Rough-In', pct: 0.35 },
    { monthFraction: 0.75, label: 'Finishes', pct: 0.25 },
    { monthFraction: 1.00, label: 'Complete & Punch', pct: 0.10 },
  ];

  let cumulative = 0;
  return milestones.map((m) => {
    const draw = Math.round(totalCost * m.pct);
    cumulative += draw;
    return {
      month: Math.max(1, Math.round(m.monthFraction * durationMonths)),
      label: m.label,
      drawAmount: draw,
      cumulativeDrawn: cumulative,
    };
  });
}

// ─── DTI / Affordability ────────────────────────────────────────────────

export interface AffordabilityResult {
  dtiPct: number;
  freeCashflow: number;
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
  newMonthlyPayment: number;
  totalObligations: number;
}

/**
 * Calculate DTI and affordability from income, debts, and renovation payment.
 */
export function calculateAffordability(
  monthlyIncome: number,
  monthlyDebts: number,
  renovationPayment: number,
): AffordabilityResult {
  const newMonthlyPayment = renovationPayment;
  const totalObligations = monthlyDebts + newMonthlyPayment;
  const dtiPct = monthlyIncome > 0 ? Math.round((totalObligations / monthlyIncome) * 100) : 0;
  const freeCashflow = monthlyIncome - totalObligations;
  const feasibility: 'HIGH' | 'MEDIUM' | 'LOW' =
    dtiPct < 36 ? 'HIGH' : dtiPct < 43 ? 'MEDIUM' : 'LOW';

  return { dtiPct, freeCashflow, feasibility, newMonthlyPayment, totalObligations };
}

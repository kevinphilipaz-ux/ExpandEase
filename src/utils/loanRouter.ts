/**
 * Loan product routing — determines which financing options qualify for a homeowner.
 *
 * Three products:
 * 1. Standard HELOC / Home Equity Loan — borrows against current equity only
 * 2. ARV Second Lien (Renovation HELOC) — borrows against after-repair value
 * 3. Construction-to-Permanent — replaces first mortgage entirely at a single rate
 */

import {
  SECOND_LIEN_RATE_ANNUAL,
  CONSTRUCTION_TO_PERM_RATE_ANNUAL,
  LTV_LIMITS,
  TERM_YEARS,
} from '../config/renovationDefaults';
import { monthlyPayment } from './renovationMath';

export interface LoanOption {
  type: 'standard-heloc' | 'arv-second-lien' | 'construction-to-perm';
  label: string;
  maxBorrowingPower: number;
  estimatedRate: number;
  monthlyPayment: number; // blended with existing mortgage where applicable
  keepsExistingRate: boolean;
  qualifies: boolean; // used for recommendation stamps only; we do not disqualify in UI
  totalInterest10yr: number;
  /** Cash needed to close the gap if max borrowing < project cost (or combined loan for CTP). */
  cashRequired: number;
  /** Amount to trim from scope (or pay down) so this option needs $0 extra cash. */
  requiredOptimizationAmount: number;
}

/**
 * Route the homeowner into qualifying loan products with side-by-side comparison.
 */
export function routeLoanOptions(
  currentValue: number,
  existingBalance: number,
  renovationCost: number,
  existingRate: number,
  projectedARV: number,
): LoanOption[] {
  const options: LoanOption[] = [];

  // --- 1. Standard HELOC ---
  const helocMaxBorrow = Math.max(0, currentValue * LTV_LIMITS.standardHeloc - existingBalance);
  const helocQualifies = helocMaxBorrow >= renovationCost;
  const helocCashRequired = Math.max(0, renovationCost - helocMaxBorrow);
  const helocExistingPmt = monthlyPayment(existingBalance, existingRate, TERM_YEARS);
  const helocRenoPmt = monthlyPayment(
    helocQualifies ? renovationCost : helocMaxBorrow,
    SECOND_LIEN_RATE_ANNUAL,
    TERM_YEARS,
  );
  const helocBlended = helocExistingPmt + helocRenoPmt;
  const helocInterest10yr = Math.round(
    existingBalance * existingRate * 10 * 0.85 +
    (helocQualifies ? renovationCost : helocMaxBorrow) * SECOND_LIEN_RATE_ANNUAL * 10 * 0.85,
  );

  options.push({
    type: 'standard-heloc',
    label: 'Standard HELOC',
    maxBorrowingPower: Math.round(helocMaxBorrow),
    estimatedRate: SECOND_LIEN_RATE_ANNUAL,
    monthlyPayment: Math.round(helocBlended),
    keepsExistingRate: true,
    qualifies: helocQualifies,
    totalInterest10yr: helocInterest10yr,
    cashRequired: Math.round(helocCashRequired),
    requiredOptimizationAmount: Math.round(helocCashRequired),
  });

  // --- 2. ARV Second Lien (Renovation HELOC) ---
  const arvMaxBorrow = Math.max(0, projectedARV * LTV_LIMITS.arvSecondLien - existingBalance);
  const arvQualifies = arvMaxBorrow >= renovationCost;
  const arvCashRequired = Math.max(0, renovationCost - arvMaxBorrow);
  const arvExistingPmt = monthlyPayment(existingBalance, existingRate, TERM_YEARS);
  const arvRenoPmt = monthlyPayment(renovationCost, SECOND_LIEN_RATE_ANNUAL, TERM_YEARS);
  const arvBlended = arvExistingPmt + arvRenoPmt;
  const arvInterest10yr = Math.round(
    existingBalance * existingRate * 10 * 0.85 +
    renovationCost * SECOND_LIEN_RATE_ANNUAL * 10 * 0.85,
  );

  options.push({
    type: 'arv-second-lien',
    label: 'ARV Second Lien',
    maxBorrowingPower: Math.round(arvMaxBorrow),
    estimatedRate: SECOND_LIEN_RATE_ANNUAL,
    monthlyPayment: Math.round(arvBlended),
    keepsExistingRate: true,
    qualifies: arvQualifies,
    totalInterest10yr: arvInterest10yr,
    cashRequired: Math.round(arvCashRequired),
    requiredOptimizationAmount: Math.round(arvCashRequired),
  });

  // --- 3. Construction-to-Permanent (replaces 1st mortgage) ---
  const ctpTotalLoan = existingBalance + renovationCost;
  const ctpMaxBorrow = projectedARV * LTV_LIMITS.constructionToPerm;
  const ctpQualifies = ctpTotalLoan <= ctpMaxBorrow;
  const ctpShortfall = Math.max(0, ctpTotalLoan - ctpMaxBorrow);
  const ctpPmt = monthlyPayment(ctpTotalLoan, CONSTRUCTION_TO_PERM_RATE_ANNUAL, TERM_YEARS);
  const ctpInterest10yr = Math.round(ctpTotalLoan * CONSTRUCTION_TO_PERM_RATE_ANNUAL * 10 * 0.85);

  options.push({
    type: 'construction-to-perm',
    label: 'Construction-to-Permanent',
    maxBorrowingPower: Math.round(ctpMaxBorrow),
    estimatedRate: CONSTRUCTION_TO_PERM_RATE_ANNUAL,
    monthlyPayment: Math.round(ctpPmt),
    keepsExistingRate: false,
    qualifies: ctpQualifies,
    totalInterest10yr: ctpInterest10yr,
    cashRequired: Math.round(ctpShortfall),
    requiredOptimizationAmount: Math.round(ctpShortfall),
  });

  return options;
}

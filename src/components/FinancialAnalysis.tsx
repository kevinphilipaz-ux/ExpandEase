import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProjectOptional } from '../context/ProjectContext';
import { ValueWithPop } from './ui/ValueWithPop';
import { InfoTooltip } from './ui/InfoTooltip';
import { CALCULATION_TOOLTIPS } from '../constants/calculationExplanations';
import { useMilestoneConfetti } from '../hooks/useMilestoneConfetti';
import {
  DEFAULT_CURRENT_HOME_VALUE,
  USER_RATE_ANNUAL,
  SECOND_LIEN_RATE_ANNUAL,
  TERM_YEARS,
  MASTER_RENOVATION_ITEMS,
} from '../config/renovationDefaults';
import {
  monthlyPayment as calcMonthlyPayment,
  calculateBlendedPayment,
  resolveExistingBalance,
  calculateSavingsVsComparable,
} from '../utils/renovationMath';
import { routeLoanOptions } from '../utils/loanRouter';
import { ItemizedBill } from './feasibility/ItemizedBill';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Wallet,
  Target,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  Info,
  Lightbulb
} from 'lucide-react';

interface FinancialAnalysisProps {
  onProgressUpdate?: (value: number) => void;
  isActive?: boolean;
}

export interface LineItem {
  id: string;
  label: string;
  category: string;
  cost: number;
  valueAdded: number;
  roiPct: number;
  /** Short amenity description for "what you're getting" */
  amenity?: string;
  /** One-line benefit for "what you're getting" detail */
  benefit?: string;
}

/** Line items from single source of truth; ids match MASTER_RENOVATION_ITEMS for sync with Wishlist/Contractor. */
const LINE_ITEMS: LineItem[] = MASTER_RENOVATION_ITEMS.map((item) => ({
  id: item.id,
  label: item.label,
  category: item.category,
  cost: item.cost,
  valueAdded: item.valueAdded,
  roiPct: item.roiPct,
  amenity: item.amenity,
  benefit: item.benefit,
}));

// principalFromPayment moved to utils/renovationMath.ts — using calcPrincipalFromPayment import

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
};

const formatCurrencyFull = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

function getRoiTier(roiPct: number): 'high' | 'medium' | 'low' {
  if (roiPct >= 95) return 'high';
  if (roiPct >= 75) return 'medium';
  return 'low';
}

export function FinancialAnalysis({ onProgressUpdate }: FinancialAnalysisProps) {
  const projectCtx = useProjectOptional();
  const fin = projectCtx?.project?.financial;
  const [lineItems] = useState<LineItem[]>(() => LINE_ITEMS.map((i) => ({ ...i })));
  const masterIds = useMemo(() => new Set(MASTER_RENOVATION_ITEMS.map((i) => i.id)), []);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(() => {
    const saved = fin?.enabledLineItemIds;
    if (saved?.length) {
      const normalized = saved.map((id) => (id === 'bedroom' ? 'master-suite' : id)).filter((id) => masterIds.has(id));
      return normalized.length > 0 ? new Set(normalized) : new Set(MASTER_RENOVATION_ITEMS.map((i) => i.id));
    }
    return new Set(MASTER_RENOVATION_ITEMS.map((i) => i.id));
  });
  const [monthlyIncome, setMonthlyIncome] = useState(fin?.monthlyIncome ?? 17000);
  const [monthlyDebts, setMonthlyDebts] = useState(fin?.monthlyDebts ?? 4500);
  const [targetBudget, setTargetBudget] = useState<number | null>(fin?.targetBudget ?? null);
  const [currentMonthlyPayment, setCurrentMonthlyPayment] = useState<number | ''>(fin?.currentMonthlyPayment ?? '');
  const [downPaymentAtPurchase, setDownPaymentAtPurchase] = useState<number | ''>(fin?.downPaymentAtPurchase ?? '');
  const [existingMortgageBalance, setExistingMortgageBalance] = useState<number | ''>(fin?.existingMortgageBalance ?? '');
  const [paymentSlider, setPaymentSlider] = useState(0); // extra $/month user is willing to consider

  useEffect(() => {
    onProgressUpdate?.(100);
  }, [onProgressUpdate]);

  // Persist affordability inputs and derived totals so ContractorReview/DesignPackage see correct final math
  useEffect(() => {
    if (!projectCtx) return;
    const enabledItems = LINE_ITEMS.filter((i) => enabledIds.has(i.id));
    const totalCost = enabledItems.reduce((s, i) => s + i.cost, 0);
    const totalValue = enabledItems.reduce((s, i) => s + i.valueAdded, 0);
    projectCtx.updateProject({
      financial: {
        ...projectCtx.project.financial,
        monthlyIncome,
        monthlyDebts,
        targetBudget: targetBudget ?? undefined,
        currentMonthlyPayment: typeof currentMonthlyPayment === 'number' ? currentMonthlyPayment : undefined,
        downPaymentAtPurchase: typeof downPaymentAtPurchase === 'number' ? downPaymentAtPurchase : undefined,
        existingMortgageBalance: typeof existingMortgageBalance === 'number' ? existingMortgageBalance : undefined,
        enabledLineItemIds: Array.from(enabledIds),
        totalCost,
        totalValue,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- projectCtx is stable; we only persist when user inputs change
  }, [monthlyIncome, monthlyDebts, targetBudget, currentMonthlyPayment, downPaymentAtPurchase, existingMortgageBalance, enabledIds]);

  const toggleItem = (id: string) => {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enabledItems = useMemo(
    () => lineItems.filter((i) => enabledIds.has(i.id)),
    [lineItems, enabledIds]
  );

  const currentHomeValue = projectCtx?.project?.property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
  const userRateDecimal = (projectCtx?.project?.onboarding?.mortgageRate ?? USER_RATE_ANNUAL * 100) / 100;

  const totals = useMemo(() => {
    const totalCost = enabledItems.reduce((s, i) => s + i.cost, 0);
    const totalValue = enabledItems.reduce((s, i) => s + i.valueAdded, 0);
    const netEquity = totalValue - totalCost;
    const roiPct = totalCost > 0 ? Math.round((totalValue / totalCost) * 100) : 0;
    const postRenovationValue = currentHomeValue + totalValue;

    // Resolve existing balance from user inputs
    const { balance: existingBalance, derivedFromPayment } = resolveExistingBalance(
      currentHomeValue,
      userRateDecimal,
      typeof existingMortgageBalance === 'number' && existingMortgageBalance > 0 ? existingMortgageBalance : undefined,
      typeof currentMonthlyPayment === 'number' && currentMonthlyPayment > 0 ? currentMonthlyPayment : undefined,
    );

    // Blended payment: existing mortgage at user's rate + renovation at second-lien rate
    const blended = calculateBlendedPayment(existingBalance, totalCost, userRateDecimal, SECOND_LIEN_RATE_ANNUAL);
    const yourPayment = blended.blendedPayment;

    // Savings vs. buying a comparable home at market rate
    const monthlySavingsVsComparable = calculateSavingsVsComparable(yourPayment, postRenovationValue);

    return {
      totalCost,
      totalValue,
      netEquity,
      roiPct,
      postRenovationValue,
      monthlySavingsVsComparable,
      existingBalance,
      existingPayment: blended.existingPayment,
      renovationPayment: blended.renovationPayment,
      blendedPayment: yourPayment,
      /** When we derived balance from current payment (and user didn't override), show it so they see the link. */
      derivedBalanceFromPayment: derivedFromPayment,
    };
  }, [enabledItems, currentHomeValue, userRateDecimal, existingMortgageBalance, currentMonthlyPayment]);

  /** Full-scope "vision" totals (all line items) for comparison with optimized scope */
  const visionTotals = useMemo(() => {
    const totalCost = lineItems.reduce((s, i) => s + i.cost, 0);
    const totalValue = lineItems.reduce((s, i) => s + i.valueAdded, 0);
    return { totalCost, totalValue };
  }, [lineItems]);

  useMilestoneConfetti(totals.netEquity, totals.roiPct);

  // Loan product routing (P4)
  const loanOptions = useMemo(
    () => routeLoanOptions(
      currentHomeValue,
      totals.existingBalance,
      totals.totalCost,
      userRateDecimal,
      totals.postRenovationValue,
    ),
    [currentHomeValue, totals.existingBalance, totals.totalCost, userRateDecimal, totals.postRenovationValue],
  );

  // New payment = renovation portion at second-lien rate (existing mortgage is already in debts)
  const newPayment = useMemo(
    () => Math.round(calcMonthlyPayment(totals.totalCost, SECOND_LIEN_RATE_ANNUAL, TERM_YEARS)),
    [totals.totalCost]
  );
  const paymentWithSlider = newPayment + paymentSlider;
  const totalObligations = monthlyDebts + paymentWithSlider;
  const dtiPct = monthlyIncome > 0 ? Math.round((totalObligations / monthlyIncome) * 100) : 0;
  const freeCashflow = monthlyIncome - totalObligations;
  const feasibility: 'HIGH' | 'MEDIUM' | 'LOW' =
    dtiPct < 36 ? 'HIGH' : dtiPct < 43 ? 'MEDIUM' : 'LOW';

  const gapToTarget = targetBudget != null ? totals.totalCost - targetBudget : null;
  const sortedByRoi = useMemo(
    () => [...lineItems].sort((a, b) => b.roiPct - a.roiPct),
    [lineItems]
  );
  const lowRoiItems = sortedByRoi.filter((i) => getRoiTier(i.roiPct) === 'low');
  const highRoiItems = sortedByRoi.filter((i) => getRoiTier(i.roiPct) === 'high');

  const trimToBudgetSuggestions = useMemo(() => {
    if (targetBudget == null || gapToTarget == null || gapToTarget <= 0) return [];
    let needToTrim = gapToTarget;
    const byWorstRoi = [...lineItems].sort((a, b) => a.roiPct - b.roiPct);
    const suggestions: LineItem[] = [];
    for (const item of byWorstRoi) {
      if (needToTrim <= 0 || !enabledIds.has(item.id)) continue;
      suggestions.push(item);
      needToTrim -= item.cost;
    }
    return suggestions;
  }, [targetBudget, gapToTarget, lineItems, enabledIds]);

  /** High-value recommendations: remove low-ROI items (e.g. pool) or add high-ROI / ratio-balancing items. Toggling applies the suggestion; when none left, card hides. */
  interface OptimizationSuggestion {
    id: string;
    type: 'remove' | 'add';
    label: string;
    message: string;
  }
  const roomForOptimizationSuggestions = useMemo((): OptimizationSuggestion[] => {
    const out: OptimizationSuggestion[] = [];
    for (const item of lineItems) {
      const enabled = enabledIds.has(item.id);
      if (enabled && item.id === 'pool') {
        out.push({
          id: item.id,
          type: 'remove',
          label: item.label,
          message: 'Removing the pool lowers project cost; pools often don\'t add to sale price.',
        });
      } else if (enabled && item.roiPct < 75) {
        out.push({
          id: item.id,
          type: 'remove',
          label: item.label,
          message: `Removing ${item.label.toLowerCase()} lowers cost with minimal impact on value.`,
        });
      } else if (!enabled && item.id === 'bath-add') {
        out.push({
          id: item.id,
          type: 'add',
          label: item.label,
          message: 'Adding a bathroom balances your bed/bath ratio and can raise the value of your house.',
        });
      } else if (!enabled && item.id === 'master-suite') {
        out.push({
          id: item.id,
          type: 'add',
          label: item.label,
          message: 'Adding a full bedroom balances your home\'s ratio and adds value.',
        });
      } else if (!enabled && item.roiPct >= 95) {
        out.push({
          id: item.id,
          type: 'add',
          label: item.label,
          message: `Adding ${item.label.toLowerCase()} can improve your blended ROI.`,
        });
      }
    }
    return out;
  }, [lineItems, enabledIds]);

  const steps = [
    { step: 1, title: 'Lock your scope', detail: 'Use the toggles below to include only what you want. Your totals update live.' },
    { step: 2, title: 'Check affordability', detail: 'Enter income and debts above. We show DTI and whether you’re on track.' },
    { step: 3, title: 'Optimize for cost or ROI', detail: 'Turn off low-ROI items to save, or add high-ROI ones to maximize value.' },
    { step: 4, title: 'Choose your payment', detail: 'Use “What if I paid more?” to see how a higher payment changes what you can do.' },
  ];

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(168,85,247,0.08),transparent_60%),radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(56,189,248,0.05),transparent_60%)] animate-pulse-opacity"
        aria-hidden
        style={{ animationDuration: '8s' }}
      />
      <div className="relative z-10 space-y-6">
        {/* Think Big reminder */}
        <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10 px-5 py-4 flex items-start gap-3">
          <div className="text-2xl shrink-0 mt-0.5">💡</div>
          <div>
            <p className="font-bold text-white text-sm tracking-wide uppercase">Think Big — Your Vision, Optimized</p>
            <p className="text-purple-200/80 text-xs mt-1">
              Toggle items on and off below to find the perfect scope. Start with your full vision — then trim by ROI or budget to dial it in.
            </p>
          </div>
        </div>

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white">Financial Analysis</h2>
          <p className="text-purple-300/70 text-sm mt-1">
            See every dollar, toggle items on/off, and optimize for your budget and lifestyle
          </p>
        </div>

        {/* ——— THE PRIZE ——— */}
        <section className="bg-gradient-to-br from-emerald-900/40 to-green-900/30 rounded-2xl border border-emerald-500/30 p-5 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-emerald-400" />
            <h3 className="font-bold text-emerald-200 uppercase tracking-wider text-sm">The outcome</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider">New home value</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totals.postRenovationValue)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider">Total investment</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totals.totalCost)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider flex items-center gap-1">
                Blended ROI
                <InfoTooltip content={CALCULATION_TOOLTIPS.roi} label="How we calculate ROI" />
              </p>
              <p className="text-2xl font-bold text-emerald-400"><ValueWithPop value={totals.roiPct} format="percent" /></p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider flex items-center gap-1">
                Monthly savings vs. comparable
                <InfoTooltip content={CALCULATION_TOOLTIPS.monthlySavings} label="How we calculate monthly savings" />
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                {totals.monthlySavingsVsComparable >= 0
                  ? `+${formatCurrencyFull(totals.monthlySavingsVsComparable)}/mo`
                  : `${formatCurrencyFull(totals.monthlySavingsVsComparable)}/mo`}
              </p>
            </div>
          </div>
          <p className="text-emerald-200/90 text-sm font-medium mb-1">What you’re getting</p>
          <p className="text-emerald-300/70 text-xs mb-3">
            Your plan includes the scope below — each item adds real value to your home and lifestyle.
          </p>
          <ul className="flex flex-wrap gap-2">
            {enabledItems.map((i) => (
              <li
                key={i.id}
                className="inline-flex items-start gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-emerald-100 min-w-0 max-w-[220px]"
              >
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm">
                  <span className="font-medium">{i.amenity ?? i.label}</span>
                  {i.benefit != null && i.benefit !== '' && <span className="block text-emerald-200/80 text-xs mt-0.5">{i.benefit}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— LOAN PRODUCT COMPARISON ——— */}
      {totals.totalCost > 0 && (
        <section className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-purple-300" />
            <h3 className="font-semibold text-white">Financing options</h3>
          </div>
          <p className="text-purple-300/70 text-xs mb-4">Side-by-side comparison of qualifying loan products based on your equity and renovation scope.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loanOptions.map((opt) => (
              <div
                key={opt.type}
                className={`rounded-xl border p-4 ${
                  opt.qualifies
                    ? opt.type === 'arv-second-lien'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/5 border-white/10'
                    : 'bg-white/5 border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white text-sm">{opt.label}</p>
                  {opt.qualifies ? (
                    <span className="text-emerald-400 text-xs font-medium">Qualifies</span>
                  ) : (
                    <span className="text-red-400 text-xs font-medium">Does not qualify</span>
                  )}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-purple-300/80">Est. rate</span>
                    <span className="text-white font-mono">{(opt.estimatedRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300/80">Monthly payment</span>
                    <span className="text-white font-mono">{formatCurrencyFull(opt.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300/80">Max borrowing</span>
                    <span className="text-white font-mono">{formatCurrency(opt.maxBorrowingPower)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300/80">10yr interest (est.)</span>
                    <span className="text-white font-mono">{formatCurrency(opt.totalInterest10yr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300/80">Keeps your rate?</span>
                    <span className={opt.keepsExistingRate ? 'text-emerald-400' : 'text-amber-400'}>
                      {opt.keepsExistingRate ? 'Yes' : 'No — loses your low rate'}
                    </span>
                  </div>
                </div>
                {opt.disqualifyReason && (
                  <p className="text-red-300/70 text-xs mt-2">{opt.disqualifyReason}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-purple-400/70 text-xs mt-3">Rates are estimates for planning purposes. All financing is subject to credit approval by licensed lending partners.</p>
        </section>
      )}

      {/* ——— GRANULAR: EVERY ITEM + TOGGLE ——— */}
        <section className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-purple-300" />
            <h3 className="font-semibold text-white">Every item · cost, value & ROI</h3>
          </div>
          <span className="text-purple-300/70 text-xs">
            Toggle off to remove from plan — totals update below
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-purple-300/80 uppercase tracking-wider">
                <th className="pb-3 pr-2 font-medium">Include</th>
                <th className="pb-3 pr-4 font-medium">Item</th>
                <th className="pb-3 pr-4 font-medium text-right">Cost</th>
                <th className="pb-3 pr-4 font-medium text-right">Value added</th>
                <th className="pb-3 font-medium text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {sortedByRoi.map((item) => {
                const enabled = enabledIds.has(item.id);
                const tier = getRoiTier(item.roiPct);
                return (
                  <motion.tr
                    key={item.id}
                    layout
                    className={`border-b border-white/5 ${!enabled ? 'opacity-50' : ''}`}
                  >
                    <td className="py-3 pr-2">
                      <motion.button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label={enabled ? 'Exclude from plan' : 'Include in plan'}
                      >
                        {enabled ? (
                          <ToggleRight size={22} className="text-emerald-400" />
                        ) : (
                          <ToggleLeft size={22} className="text-purple-400" />
                        )}
                      </motion.button>
                    </td>
                    <td className="py-3 pr-4 font-medium text-white">{item.label}</td>
                    <td className="py-3 pr-4 text-right text-white tabular-nums">{formatCurrency(item.cost)}</td>
                    <td className="py-3 pr-4 text-right text-emerald-300 tabular-nums">+{formatCurrency(item.valueAdded)}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-medium ${
                          tier === 'high'
                            ? 'text-emerald-400'
                            : tier === 'medium'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {item.roiPct}%
                        {tier === 'high' && <TrendingUp size={14} />}
                        {tier === 'low' && <TrendingDown size={14} />}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          <div className="flex flex-wrap gap-6">
            <span className="text-purple-300">Total cost <span className="text-white font-bold">{formatCurrency(totals.totalCost)}</span></span>
            <span className="text-purple-300">Total value added <span className="text-emerald-400 font-bold">+{formatCurrency(totals.totalValue)}</span></span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <p className="text-purple-300/80 text-xs uppercase tracking-wider font-medium">Vision vs. optimized</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-purple-300/80">Vision (full scope): </span>
                <span className="text-white font-medium">{formatCurrency(visionTotals.totalCost)}</span>
                <span className="text-purple-400/70"> cost</span>
                <span className="text-white/60 mx-1">·</span>
                <span className="text-emerald-300/90 font-medium">+{formatCurrency(visionTotals.totalValue)}</span>
                <span className="text-purple-400/70"> value</span>
              </div>
              <div>
                <span className="text-purple-300/80">Total value optimized for: </span>
                <span className="text-emerald-400 font-bold">+{formatCurrency(totals.totalValue)}</span>
                <span className="text-purple-400/70"> value</span>
                <span className="text-white/60 mx-1">·</span>
                <span className="text-white font-medium">{formatCurrency(totals.totalCost)}</span>
                <span className="text-purple-400/70"> cost</span>
              </div>
            </div>
            {(visionTotals.totalCost !== totals.totalCost || visionTotals.totalValue !== totals.totalValue) && (
              <p className="text-purple-200/90 text-xs pt-1">
                Saved by optimizing: <span className="text-emerald-400 font-medium">{formatCurrency(visionTotals.totalCost - totals.totalCost)}</span> cost
                {visionTotals.totalValue !== totals.totalValue && (
                  <> · <span className="text-amber-200/90">{formatCurrency(visionTotals.totalValue - totals.totalValue)}</span> value traded</>
                )}
              </p>
            )}
          </div>
          <p className="text-purple-400/70 text-xs">Estimates only — not a quote. Get quotes from licensed contractors.</p>
        </div>
      </section>

      {/* ——— HOW TO DO IT + GAP ——— */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl border border-white/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-purple-300" />
            <h3 className="font-semibold text-white">How to do it</h3>
          </div>
          <ol className="space-y-3">
            {steps.map((s) => (
              <li key={s.step} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <div>
                  <p className="font-medium text-white text-sm">{s.title}</p>
                  <p className="text-purple-300/80 text-xs mt-0.5">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-white/10 rounded-xl border border-white/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-purple-300" />
            <h3 className="font-semibold text-white">Where you stand</h3>
          </div>
          <div className="space-y-4">
            <label className="block text-purple-300 text-sm">
              Target budget (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 500000"
              value={targetBudget ?? ''}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '');
                setTargetBudget(v === '' ? null : Math.max(0, parseInt(v, 10) || 0));
              }}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-400/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            />
            {gapToTarget != null && (
              <div
                className={`p-4 rounded-xl border ${
                  gapToTarget > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <p className="font-medium">
                  {gapToTarget > 0
                    ? `You’re ${formatCurrency(gapToTarget)} over target. Trim low-ROI items below or increase budget.`
                    : `You’re ${formatCurrency(-gapToTarget)} under target. You have room to add scope or save.`}
                </p>
              </div>
            )}
            {gapToTarget == null && (
              <p className="text-purple-300/80 text-sm">Set a target budget to see how far off you are and where to optimize.</p>
            )}
          </div>
        </div>
      </section>

      {/* ——— AFFORDABILITY (INCOME, DTI, PAYMENT) ——— */}
      <section className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-purple-300" />
          <h3 className="font-semibold text-white">Affordability · based on your income</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <label className="text-purple-300 text-sm">Monthly household income</label>
              <div className="flex items-center">
                <span className="text-gray-500 font-mono mr-1">$</span>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                  className="w-28 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>
            </div>
            <div className="flex justify-between items-center gap-4">
              <label className="text-purple-300 text-sm">Current monthly debts</label>
              <div className="flex items-center">
                <span className="text-gray-500 font-mono mr-1">$</span>
                <input
                  type="number"
                  value={monthlyDebts}
                  onChange={(e) => setMonthlyDebts(Math.max(0, Number(e.target.value)))}
                  className="w-28 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>
            </div>
            <div className="flex justify-between items-center gap-4">
              <label className="text-purple-300 text-sm">Current monthly mortgage payment (P&I only)</label>
              <div className="flex items-center">
                <span className="text-gray-500 font-mono mr-1">$</span>
                <input
                  type="number"
                  value={currentMonthlyPayment}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    setCurrentMonthlyPayment(v === '' ? '' : Math.max(0, parseInt(v, 10) || 0));
                  }}
                  placeholder="e.g. 2500"
                  className="w-32 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 placeholder-purple-400/50"
                />
              </div>
            </div>
            <p className="text-purple-300/70 text-xs -mt-2">We use this with your rate (from onboarding) to estimate your loan balance for an accurate &quot;monthly savings vs. comparable&quot; number.</p>
            <div className="flex justify-between items-center gap-4">
              <label className="text-purple-300 text-sm">Down payment at purchase (optional)</label>
              <div className="flex items-center">
                <span className="text-gray-500 font-mono mr-1">$</span>
                <input
                  type="number"
                  value={downPaymentAtPurchase}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    setDownPaymentAtPurchase(v === '' ? '' : Math.max(0, parseInt(v, 10) || 0));
                  }}
                  placeholder="For context"
                  className="w-32 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 placeholder-purple-400/50"
                />
              </div>
            </div>
            <div className="flex justify-between items-center gap-4">
              <label className="text-purple-300 text-sm">Existing mortgage balance (optional override)</label>
              <div className="flex items-center">
                <span className="text-gray-500 font-mono mr-1">$</span>
                <input
                  type="number"
                  value={existingMortgageBalance}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    setExistingMortgageBalance(v === '' ? '' : Math.max(0, parseInt(v, 10) || 0));
                  }}
                  placeholder="Overrides balance from payment"
                  className="w-32 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 placeholder-purple-400/50"
                />
              </div>
            </div>
            <p className="text-purple-300/70 text-xs -mt-2">Leave blank to use balance derived from your current payment; set if you know the exact balance (e.g. for lender).</p>
          </div>
          <div className="space-y-3">
            {totals.derivedBalanceFromPayment != null && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-200/90 text-sm">Estimated balance (from your payment)</span>
                <span className="font-mono font-medium text-emerald-300">{formatCurrencyFull(totals.derivedBalanceFromPayment)}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-purple-300 text-sm">New monthly payment (est.)</span>
              <span className="font-mono font-bold text-white">{formatCurrencyFull(paymentWithSlider)}</span>
            </div>
            <div
              className={`flex justify-between items-center p-3 rounded-lg border ${
                dtiPct < 36 ? 'bg-emerald-500/10 border-emerald-500/20' : dtiPct < 43 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <span className="text-sm font-medium">Debt-to-income (DTI)</span>
              <span className="font-mono font-bold">{dtiPct}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-purple-300 text-sm">Remaining cashflow</span>
              <span className={`font-mono font-bold ${freeCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrencyFull(freeCashflow)}/mo
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border border-white/10">
              <span className="text-sm font-medium">Project feasibility</span>
              <span
                className={`font-bold ${
                  feasibility === 'HIGH' ? 'text-emerald-400' : feasibility === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                }`}
              >
                {feasibility}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ——— ROI SIGNALS + OPTIMIZE ——— */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-emerald-300">Good ROI · keep or add</h3>
          </div>
          <ul className="space-y-2">
            {highRoiItems.map((i) => (
              <li key={i.id} className="flex justify-between items-center text-sm">
                <span className="text-white">{i.label}</span>
                <span className="text-emerald-400 font-mono">{i.roiPct}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-amber-400" />
            <h3 className="font-semibold text-amber-300">Lower ROI · trim to save</h3>
          </div>
          <ul className="space-y-2">
            {lowRoiItems.map((i) => (
              <li key={i.id} className="flex justify-between items-center text-sm">
                <span className="text-white">{i.label}</span>
                <span className="text-amber-400 font-mono">{i.roiPct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— ROOM FOR OPTIMIZATION ——— */}
      {roomForOptimizationSuggestions.length > 0 && (
        <section className="bg-purple-500/10 rounded-2xl border border-purple-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-purple-300" />
            <h3 className="font-semibold text-white">Room for Optimization</h3>
          </div>
          <p className="text-purple-200/90 text-sm mb-4">
            Apply a suggestion below to update your plan. When all are applied, this card clears.
          </p>
          <ul className="space-y-3">
            {roomForOptimizationSuggestions.map((s) => (
              <li key={s.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-medium text-white text-sm">{s.type === 'remove' ? 'Remove' : 'Add'}: {s.label}</p>
                    <p className="text-purple-300/80 text-xs mt-0.5">{s.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleItem(s.id)}
                    className="shrink-0 px-4 py-2 rounded-lg bg-purple-500/30 text-purple-200 text-sm font-medium hover:bg-purple-500/40 transition-colors"
                  >
                    {s.type === 'remove' ? 'Remove from plan' : 'Add to plan'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ——— OPTIMIZE: TRIM TO BUDGET + LIFESTYLE SLIDER ——— */}
        <section className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 space-y-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-purple-300" />
          <h3 className="font-semibold text-white">Optimize for cost & lifestyle</h3>
        </div>

        {trimToBudgetSuggestions.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-200 font-medium text-sm mb-2">To hit your target budget, consider turning off:</p>
            <ul className="flex flex-wrap gap-2">
              {trimToBudgetSuggestions.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => toggleItem(i.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 text-sm hover:bg-amber-500/30 transition-colors"
                  >
                    {i.label} ({formatCurrency(i.cost)})
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-purple-300 text-sm mb-2">
            What if I increased my mortgage payment? (lifestyle tradeoff)
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="range"
              min={0}
              max={1500}
              step={100}
              value={paymentSlider}
              onChange={(e) => setPaymentSlider(Number(e.target.value))}
              className="flex-1 min-w-[120px] accent-purple-500"
            />
            <span className="font-mono font-bold text-white whitespace-nowrap">
              +{formatCurrencyFull(paymentSlider)}/mo
            </span>
          </div>
          <p className="text-purple-300/70 text-xs mt-2">
            A higher payment means more borrowing power: +{formatCurrencyFull(paymentSlider)}/mo roughly supports ~{formatCurrency(Math.round(paymentSlider * 12 * 15))} more in project scope (approx. 30-yr).
            Your combined payment would be <span className="text-white font-medium">{formatCurrencyFull(paymentWithSlider)}</span>/mo; DTI {dtiPct}%.
          </p>
        </div>
      </section>

      {/* ——— ITEMIZED BILL ——— */}
        <section className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5">
          <ItemizedBill />
        </section>

        {/* ——— BOTTOM LINE ——— */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
          <p className="text-emerald-300 font-semibold uppercase tracking-wider text-sm mb-4">Bottom line</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider">New home value</p>
              <p className="text-lg font-bold text-white">{formatCurrency(totals.postRenovationValue)}</p>
            </div>
            <div>
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider">Total investment</p>
              <p className="text-lg font-bold text-white">{formatCurrency(totals.totalCost)}</p>
            </div>
            <div>
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider flex items-center gap-1">
                Blended ROI
                <InfoTooltip content={CALCULATION_TOOLTIPS.roi} label="How we calculate ROI" />
              </p>
              <p className="text-lg font-bold text-emerald-400">{totals.roiPct}%</p>
            </div>
            <div>
              <p className="text-emerald-300/80 text-xs uppercase tracking-wider flex items-center gap-1">
                Monthly savings vs. comparable
                <InfoTooltip content={CALCULATION_TOOLTIPS.monthlySavings} label="How we calculate monthly savings" />
              </p>
              <p className="text-lg font-bold text-emerald-400">
                {totals.monthlySavingsVsComparable >= 0 ? '+' : ''}{formatCurrencyFull(totals.monthlySavingsVsComparable)}/mo
              </p>
            </div>
          </div>
          <p className="text-emerald-200/90 text-sm">
            Toggle items above to refine your plan. Use the Room for Optimization suggestions when they appear, then check affordability and the payment slider to see how to make it work.
            {totals.netEquity !== 0 && (
              <span className="block mt-2 text-emerald-300/70">
                Net equity impact from this scope: <span className={totals.netEquity >= 0 ? 'text-emerald-400 font-medium' : 'text-amber-300/90'}>{formatCurrency(totals.netEquity)}</span>.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

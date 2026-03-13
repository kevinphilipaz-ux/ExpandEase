import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Calendar,
  PiggyBank,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { TableOfContents, type TocItem } from './ui/TableOfContents';
import { useProjectOptional } from '../context/ProjectContext';
import {
  DEFAULT_CURRENT_HOME_VALUE,
  USER_RATE_ANNUAL,
  SECOND_LIEN_RATE_ANNUAL,
  ANNUAL_APPRECIATION_RATE,
  MASTER_RENOVATION_ITEMS,
  CAD_PACKAGE_PRICE,
  CAD_PACKAGE_US_PRICE_HIGH,
  ANALYSIS_MARKET_VALUE,
} from '../config/renovationDefaults';
import {
  resolveExistingBalance,
  calculateBlendedPayment,
  calculateBreakEvenYears,
  calculateNetWorthImpact,
  calculateAffordability,
  estimateCostToMove,
  calculateSavingsVsComparable,
} from '../utils/renovationMath';
import { calculateTaxSavings, formatTaxBracket } from '../utils/taxBrackets';

interface FeasibilityGridProps {
  onProgressUpdate?: (value: number) => void;
  isActive?: boolean;
  onNavigateTo?: (sectionId: string) => void;
}

export function FeasibilityGrid({ onProgressUpdate, onNavigateTo }: FeasibilityGridProps) {
  const projectCtx = useProjectOptional();
  const fin = projectCtx?.project?.financial;
  const onboarding = projectCtx?.project?.onboarding;
  const property = projectCtx?.project?.property;

  const [showTaxBenefits, setShowTaxBenefits] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    onProgressUpdate?.(100);
  }, [onProgressUpdate]);

  // Dynamic values from project context
  const currentHomeValue = property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
  const userRate = (onboarding?.mortgageRate ?? USER_RATE_ANNUAL * 100) / 100;
  const totalCost = fin?.totalCost ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.cost, 0);
  const totalValue = fin?.totalValue ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.valueAdded, 0);
  const monthlyIncome = fin?.monthlyIncome || (onboarding?.income ? Math.round(onboarding.income / 12) : 15000);
  const monthlyDebts = fin?.monthlyDebts || 4500;

  const computed = useMemo(() => {
    const { balance: existingBalance } = resolveExistingBalance(
      currentHomeValue, userRate,
      fin?.existingMortgageBalance && fin.existingMortgageBalance > 0 ? fin.existingMortgageBalance : undefined,
      fin?.currentMonthlyPayment && fin.currentMonthlyPayment > 0 ? fin.currentMonthlyPayment : undefined,
    );

    const blended = calculateBlendedPayment(existingBalance, totalCost, userRate, SECOND_LIEN_RATE_ANNUAL);
    const breakEven = calculateBreakEvenYears(totalCost, totalValue);
    const netWorth = calculateNetWorthImpact(totalCost, totalValue, 10);
    const afford = calculateAffordability(monthlyIncome, monthlyDebts, Math.round(blended.renovationPayment));
    const postRenovationValue = currentHomeValue + totalValue;
    const monthlySavingsVsComparable = calculateSavingsVsComparable(blended.blendedPayment, postRenovationValue);
    const costToMove = estimateCostToMove(currentHomeValue, postRenovationValue);
    const netEquity = totalValue - totalCost;
    const betterOffRenovating = costToMove + netEquity;

    // Tax benefit estimate: personalized to user's income bracket
    const taxSavings = calculateTaxSavings(totalCost, totalValue, SECOND_LIEN_RATE_ANNUAL, onboarding?.income);
    const { monthlyInterestDeduction, monthlyPropTaxSavings, totalTaxSavings, bracketRate } = taxSavings;

    return {
      blendedPayment: Math.round(blended.blendedPayment),
      existingPayment: Math.round(blended.existingPayment),
      renovationPayment: Math.round(blended.renovationPayment),
      existingBalance: Math.round(existingBalance),
      breakEvenYears: breakEven,
      netWorthImpact: netWorth,
      affordability: afford,
      postRenovationValue,
      monthlySavingsVsComparable,
      costToMove,
      netEquity,
      betterOffRenovating,
      monthlyInterestDeduction,
      monthlyPropTaxSavings,
      totalTaxSavings,
      bracketRate,
    };
  }, [currentHomeValue, userRate, totalCost, totalValue, monthlyIncome, monthlyDebts, fin, onboarding?.income]);

  const blendedPmt = computed.blendedPayment;
  const taxAdjustedPmt = blendedPmt - (showTaxBenefits ? computed.totalTaxSavings : 0);

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1_000_000) return `${sign}$${(absVal / 1_000_000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}$${(absVal / 1000).toFixed(1)}K`;
    return `${sign}$${absVal}`;
  };
  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Compute overall verdict for the banner
  const verdictLabel =
    computed.affordability.feasibility === 'HIGH' && computed.breakEvenYears <= 3
      ? 'An excellent investment.'
      : computed.affordability.feasibility === 'HIGH' && computed.breakEvenYears <= 7
      ? 'A strong financial move.'
      : computed.affordability.feasibility === 'MEDIUM'
      ? 'Achievable with solid planning.'
      : 'Ambitious — here\'s what to know.';

  const verdictColor =
    computed.affordability.feasibility === 'HIGH'
      ? 'from-emerald-400 to-green-300'
      : computed.affordability.feasibility === 'MEDIUM'
      ? 'from-blue-400 to-cyan-300'
      : 'from-amber-400 to-yellow-300';

  // Card order: HOW (Affordability) → WHY (Wealth) → SUPPORTING (Timeline) → BONUS (Tax)
  const feasibilityCards = [
    {
      id: 'affordability',
      title: 'Can You Afford It?',
      icon: Wallet,
      summary: `${formatCurrency(taxAdjustedPmt)}/mo`,
      subtext: showTaxBenefits ? 'With included tax benefits*' : 'New blended monthly payment',
      status: computed.affordability.feasibility === 'HIGH' ? 'affordable' : computed.affordability.feasibility === 'MEDIUM' ? 'good' : 'warning',
      color: 'emerald',
    },
    {
      id: 'wealth',
      title: 'Why Renovating Beats Moving',
      icon: TrendingUp,
      summary: `${formatCurrency(computed.betterOffRenovating)} ahead`,
      subtext: 'vs. selling & buying the same home',
      status: 'excellent',
      color: 'purple',
    },
    {
      id: 'timeline',
      title: 'When Will You Break Even?',
      icon: Calendar,
      summary: computed.breakEvenYears === 0 ? 'Day 1' : `${computed.breakEvenYears} yrs`,
      subtext: 'Equity payback period',
      status: 'good',
      color: 'blue',
    },
    {
      id: 'savings',
      title: 'Tax Savings',
      icon: PiggyBank,
      summary: `${fmt(computed.totalTaxSavings)}/mo`,
      subtext: 'You save each month on taxes',
      status: 'excellent',
      color: 'emerald',
    },
  ];

  // ─── Detail panels ──────────────────────────────────────────────

  const renderAffordabilityDetail = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-purple-300 text-xs uppercase mb-1">Current Payment</p>
          <p className="text-2xl font-bold text-white">{fmt(computed.existingPayment)}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-emerald-400 text-xs uppercase mb-1">New Blended Payment</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(blendedPmt)}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-purple-300 text-sm">Monthly Income</span>
          <span className="text-white font-medium">{fmt(monthlyIncome)}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-purple-300 text-sm">New Debt-to-Income</span>
          <span className="text-emerald-400 font-medium">{computed.affordability.dtiPct}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all ${computed.affordability.dtiPct < 36 ? 'bg-emerald-500' : computed.affordability.dtiPct < 43 ? 'bg-blue-400' : 'bg-amber-400'}`}
            style={{ width: `${Math.min(computed.affordability.dtiPct, 100)}%` }}
          />
        </div>
        <p className="text-purple-300/70 text-xs mt-2">
          DTI calculated on the full payment of {fmt(blendedPmt)}/mo (lenders don't factor in tax benefits).{' '}
          {computed.affordability.dtiPct < 43
            ? `You're in great shape at ${computed.affordability.dtiPct}% — well under the 43% qualifying threshold.`
            : 'Consider trimming scope to reduce your DTI below 43%.'}
        </p>
      </div>

      {showTaxBenefits && (
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex justify-between items-center mb-1">
            <span className="text-emerald-300 text-sm">After tax benefits*</span>
            <span className="text-emerald-300 font-bold text-lg">{fmt(taxAdjustedPmt)}/mo</span>
          </div>
          <p className="text-emerald-200/60 text-xs">Saving ~{fmt(computed.totalTaxSavings)}/mo on mortgage interest + property tax deductions ({formatTaxBracket(onboarding?.income)} bracket based on your income).</p>
        </div>
      )}
    </div>
  );

  const renderWealthDetail = () => (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* Lead with the buy vs. renovate comparison — most compelling WHY */}
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 overflow-hidden min-w-0">
        <p className="text-emerald-200/90 text-xs uppercase tracking-wider font-semibold mb-3">Sell &amp; buy the same house instead?</p>
        <p className="text-purple-200/90 text-sm mb-3">
          Your renovation payment vs. buying this home at market value today:
        </p>
        <div className="flex justify-between items-baseline gap-3 min-w-0 py-1">
          <span className="text-purple-300 text-sm min-w-0 break-words pr-2">Your payment after renovating</span>
          <span className="text-white font-medium shrink-0">{fmt(blendedPmt)}/mo</span>
        </div>
        <div className="flex justify-between items-baseline gap-3 min-w-0 py-1">
          <span className="text-purple-300 text-sm min-w-0 break-words pr-2">If you bought this home at market</span>
          <span className="text-purple-200 shrink-0">{fmt(computed.blendedPayment + computed.monthlySavingsVsComparable)}/mo</span>
        </div>
        <div className="flex justify-between items-baseline gap-3 min-w-0 pt-2 mt-2 border-t border-emerald-500/20">
          <span className="text-emerald-200 font-medium text-sm min-w-0 break-words pr-2">You save monthly by renovating</span>
          <span className="font-bold text-emerald-400 shrink-0">{computed.monthlySavingsVsComparable >= 0 ? '+' : ''}{fmt(computed.monthlySavingsVsComparable)}/mo</span>
        </div>
        <div className="flex justify-between items-baseline gap-3 min-w-0 mt-2">
          <span className="text-purple-300 text-sm min-w-0 break-words pr-2">Transaction cost to move (8% est.)</span>
          <span className="text-amber-300/90 shrink-0">{fmt(computed.costToMove)}</span>
        </div>
        <p className="text-emerald-200 text-sm mt-3 break-words min-w-0">
          {computed.netEquity >= 0 ? (
            <>You add <span className="font-medium text-white">{formatCurrency(computed.netEquity)}</span> in equity and avoid ~{formatCurrency(computed.costToMove)} in commissions and closing — all while keeping your current mortgage rate.</>
          ) : (
            <>Even with a narrow net of <span className="font-medium text-white">{formatCurrency(computed.netEquity)}</span>, you&apos;re still <span className="font-bold text-emerald-300">{formatCurrency(computed.betterOffRenovating)}</span> better off renovating than selling and buying the same home.</>
          )}
        </p>
      </div>

      {/* Benefits summary strip — always positive */}
      <div className="grid grid-cols-3 gap-3 min-w-0">
        <div className="bg-white/5 rounded-xl p-3 text-center overflow-hidden min-w-0">
          <p className="text-purple-300 text-xs mb-1">Home After Reno</p>
          <p className="text-lg font-bold text-white">{formatCurrency(computed.postRenovationValue)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center overflow-hidden min-w-0">
          <p className="text-purple-300 text-xs mb-1">Moving Costs Avoided</p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(computed.costToMove)}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20 overflow-hidden min-w-0">
          <p className="text-emerald-400 text-xs mb-1">Total Advantage</p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(computed.betterOffRenovating)}</p>
        </div>
      </div>

      {/* The full picture — honest but positive-framed */}
      <div className="bg-white/5 rounded-xl p-4 overflow-hidden min-w-0">
        <p className="text-purple-300 text-sm mb-3">How It All Adds Up</p>
        <div className="space-y-2 min-w-0">
          <div className="flex justify-between items-center gap-3 min-w-0">
            <span className="text-purple-200 text-sm min-w-0 break-words pr-2">Value added to your home</span>
            <span className="text-emerald-400 shrink-0">+{formatCurrency(totalValue)}</span>
          </div>
          <div className="flex justify-between items-center gap-3 min-w-0">
            <span className="text-purple-200 text-sm min-w-0 break-words pr-2">Renovation cost</span>
            <span className="text-white shrink-0">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between items-center gap-3 min-w-0">
            <span className="text-purple-200 text-sm min-w-0 break-words pr-2">Commissions &amp; closing you skip</span>
            <span className="text-emerald-400 shrink-0">+{formatCurrency(computed.costToMove)}</span>
          </div>
          <div className="flex justify-between items-center gap-3 min-w-0">
            <span className="text-purple-200 text-sm min-w-0 break-words pr-2">Monthly savings vs. buying (5yr)</span>
            <span className="text-emerald-400 shrink-0">+{formatCurrency(computed.monthlySavingsVsComparable * 60)}</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center gap-3 min-w-0">
            <span className="text-white font-medium min-w-0 break-words pr-2">You come out ahead by</span>
            <span className="font-bold text-lg shrink-0 text-emerald-400">{formatCurrency(computed.betterOffRenovating)}</span>
          </div>
        </div>
        <p className="text-purple-300/60 text-xs mt-2 break-words min-w-0">
          Even when renovation costs exceed immediate appraisal gains, you win on lower monthly payments, zero transaction fees, and keeping your rate. Based on 3.5% annual appreciation. Estimates only.
        </p>
      </div>
    </div>
  );

  const renderTimelineDetail = () => {
    const years = [];
    let cumulative = 0;
    for (let y = 1; y <= 5; y++) {
      const annualAppreciation = Math.round(totalValue * ANNUAL_APPRECIATION_RATE * Math.pow(1 + ANNUAL_APPRECIATION_RATE, y - 1));
      const netGain = y === 1 ? (totalValue - totalCost) + annualAppreciation : annualAppreciation;
      cumulative += netGain;
      years.push({
        year: y < 5 ? `Year ${y}` : `Year ${y}+`,
        equity: formatCurrency(netGain),
        cumulative: formatCurrency(cumulative),
      });
    }

    return (
      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-purple-300 text-sm">Equity Payback Timeline</span>
            <span className="text-emerald-400 font-bold">
              {computed.breakEvenYears === 0 ? 'Instant' : `${computed.breakEvenYears} years`}
            </span>
          </div>
          <div className="space-y-3">
            {years.map((row) => (
              <div key={row.year} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-purple-200 text-sm">{row.year}</span>
                <span className="text-emerald-400 text-sm">{row.equity}</span>
                <span className="text-white font-medium text-sm">{row.cumulative}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-emerald-300 font-medium text-sm mb-2">What This Means</p>
          <p className="text-emerald-200/70 text-xs">
            {computed.breakEvenYears === 0
              ? 'Your renovation creates instant equity from day one — the value added exceeds the cost immediately.'
              : `After ${computed.breakEvenYears} years, the equity you've built will have fully paid for your renovation costs. From that point forward, it's pure profit if you sell.`}
          </p>
        </div>
      </div>
    );
  };

  const renderSavingsDetail = () => (
    <div className="space-y-4">
      {/* Educational intro */}
      <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
        <p className="text-white font-medium text-sm mb-2">How renovation tax benefits work</p>
        <p className="text-purple-200/80 text-xs leading-relaxed">
          When your renovation is financed with a loan secured by your home (like a HELOC or home equity loan), the interest you pay is typically tax-deductible — just like your primary mortgage. This reduces your effective monthly cost. Property value increases can also yield additional deductions through adjusted property tax basis.
        </p>
      </div>

      {/* The numbers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
          <p className="text-emerald-300 text-xs uppercase mb-1">Interest Deduction</p>
          <p className="text-xl font-bold text-emerald-400">{fmt(computed.monthlyInterestDeduction)}/mo</p>
          <p className="text-purple-300/50 text-xs mt-1">Renovation loan interest</p>
        </div>
        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
          <p className="text-emerald-300 text-xs uppercase mb-1">Property Tax Savings</p>
          <p className="text-xl font-bold text-emerald-400">{fmt(computed.monthlyPropTaxSavings)}/mo</p>
          <p className="text-purple-300/50 text-xs mt-1">Adjusted basis deduction</p>
        </div>
      </div>

      {/* Total impact */}
      <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
        <div className="flex justify-between items-center gap-3 mb-2">
          <span className="text-emerald-300 font-medium">Your Effective Monthly Payment</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-white/40 line-through text-lg">{fmt(blendedPmt)}</span>
          <ArrowRight size={16} className="text-emerald-400" />
          <span className="text-emerald-300 font-bold text-2xl">{fmt(taxAdjustedPmt)}</span>
          <span className="text-emerald-300/60 text-sm">/mo</span>
        </div>
        <p className="text-emerald-200/50 text-xs">
          Saving {fmt(computed.totalTaxSavings)}/mo at your estimated {formatTaxBracket(onboarding?.income)} marginal bracket. Consult a tax professional for your specific situation.
        </p>
      </div>

      {/* Toggle hint */}
      <p className="text-center text-purple-300/50 text-xs py-1">
        Use the toggle at the top of this page to turn tax benefits on or off.
      </p>
    </div>
  );

  const renderDetail = (id: string) => {
    switch (id) {
      case 'affordability': return renderAffordabilityDetail();
      case 'wealth': return renderWealthDetail();
      case 'timeline': return renderTimelineDetail();
      case 'savings': return renderSavingsDetail();
      default: return null;
    }
  };

  // Navigation
  const navigateExternal = useNavigate();

  const FEASIBILITY_TOC: TocItem[] = [
    { id: 'feasibility-verdict', label: 'Verdict', icon: CheckCircle2 },
    { id: 'feasibility-cards', label: 'Affordability', icon: Wallet },
    { id: 'feasibility-cta', label: 'Next Step' },
  ];

  return (
    <div className="space-y-10 min-w-0 overflow-hidden">
      <TableOfContents items={FEASIBILITY_TOC} accent="purple" />

      {/* ── 1. VERDICT BANNER ──────────────────────────────────── */}
      <motion.div
        id="feasibility-verdict"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden"
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${verdictColor}`} />
        <div className="px-6 pt-5 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-purple-300/70 text-xs uppercase tracking-widest mb-1">Feasibility Verdict</p>
              <h2 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${verdictColor} bg-clip-text text-transparent`}>
                {verdictLabel}
              </h2>
              <p className="text-purple-200/70 text-sm mt-1">
                Here&apos;s how you can afford it — and why it&apos;s the right call.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 shrink-0 self-start">
              <CheckCircle2 size={15} className="text-purple-400 shrink-0" />
              <span className="text-purple-300/80 text-xs">Preliminary — subject to lender approval</span>
            </div>
          </div>

          {/* Key metrics strip */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-purple-300/60 text-xs mb-0.5">New Payment{showTaxBenefits ? '*' : ''}</p>
              <p className="text-white font-bold text-lg">{fmt(taxAdjustedPmt)}<span className="text-purple-400 text-xs font-normal">/mo</span></p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-purple-300/60 text-xs mb-0.5">Break Even</p>
              <p className="text-white font-bold text-lg">{computed.breakEvenYears === 0 ? 'Day 1' : `${computed.breakEvenYears} yrs`}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-purple-300/60 text-xs mb-0.5">Ahead vs. Moving</p>
              <p className="font-bold text-lg text-emerald-400">
                {formatCurrency(computed.betterOffRenovating)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tax-adjusted view toggle (top-level, subtle) ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTaxBenefits(!showTaxBenefits)}
            className={`relative w-10 h-5 rounded-full transition-colors ${showTaxBenefits ? 'bg-emerald-500' : 'bg-white/20'}`}
            aria-label="Toggle tax benefits"
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showTaxBenefits ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-purple-200/80 text-xs font-medium">
            {showTaxBenefits ? 'Showing tax-adjusted payments' : 'Showing pre-tax payments'}
          </span>
        </div>
        <span className="text-purple-400/50 text-[10px] max-w-[220px] text-right leading-tight">
          {showTaxBenefits ? 'Annual deductions shown as monthly equivalent. Consult a tax professional.' : ''}
        </span>
      </div>

      {/* ── 2. HOW + WHY CARDS ─────────────────────────────────── */}
      <div id="feasibility-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {feasibilityCards.map((card, idx) => {
          const Icon = card.icon;
          const isExpanded = expandedCard === card.id;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`bg-white/10 backdrop-blur-md rounded-2xl border overflow-hidden transition-all ${
                isExpanded
                  ? 'border-pink-500/50 ring-1 ring-pink-500/20 sm:col-span-2'
                  : 'border-white/20 hover:border-white/30'
              }`}
            >
              <button
                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                className="w-full p-5 flex items-center justify-between text-left gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    card.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    card.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                    card.color === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{card.title}</p>
                    <p className="text-purple-300/70 text-sm mt-0.5">{card.subtext}</p>
                  </div>
                </div>
                <p className={`text-xl sm:text-2xl font-bold shrink-0 ${
                  card.status === 'affordable' ? 'text-emerald-400' :
                  card.status === 'excellent' ? 'text-purple-400' :
                  card.status === 'good' ? 'text-blue-400' :
                  card.status === 'active' ? 'text-amber-300' :
                  card.status === 'warning' ? 'text-amber-400' :
                  'text-purple-300'
                }`}>
                  {card.summary}
                </p>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10"
                >
                  <div className="p-5">
                    {renderDetail(card.id)}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── 3. YOUR NEXT STEP ─────────────────────────────────── */}
      <motion.div
        id="feasibility-cta"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/20 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md p-6 sm:p-8 text-center space-y-6"
      >
        <div>
          <p className="text-emerald-300 font-medium text-sm flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 size={16} />
            Analysis complete
          </p>
          <p className="text-purple-300/50 text-xs mb-2">
            An analysis like this typically costs ${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ from a contractor or architect. Yours is included free.
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-white">Share this with your partner</h3>
          <p className="text-purple-300/70 text-sm mt-1 max-w-md mx-auto">
            We built a clean summary page designed to be shared — scannable in 60 seconds with all the numbers that matter.
          </p>
        </div>

        <motion.button
          onClick={() => navigateExternal('/summary')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all text-base"
        >
          Share Project Summary
          <ArrowRight size={18} />
        </motion.button>

        <div className="pt-4 border-t border-white/10">
          <p className="text-purple-300/60 text-xs mb-3">Ready to go further?</p>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => navigateExternal('/design-package')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-pink-500/30 text-pink-300 hover:text-white text-sm font-medium transition-all"
            >
              <Sparkles size={16} />
              Get Your Design Package — ${CAD_PACKAGE_PRICE}
            </button>
            <span className="text-emerald-400/70 text-[10px] font-semibold">${(CAD_PACKAGE_US_PRICE_HIGH / 1000).toFixed(0)}K+ Value — yours at cost</span>
          </div>
        </div>
      </motion.div>

      {/* ── 4. DISCLAIMERS ─────────────────────────── */}
      <div className="flex flex-col items-center gap-2 pb-2">
        {showTaxBenefits && (
          <p className="text-purple-400/50 text-xs text-center max-w-lg">
            * Tax-adjusted amounts reflect estimated annual deductions at your {formatTaxBracket(onboarding?.income)} federal bracket, displayed as a monthly equivalent. DTI and lender qualification use the pre-tax payment of {fmt(blendedPmt)}/mo.
          </p>
        )}
        <p className="text-purple-400/50 text-xs text-center max-w-lg">
          All costs, timelines, and financial projections are estimates based on similar projects in your area. Your licensed contractor will confirm final pricing and schedule after an on-site evaluation. This is not a loan offer or pre-approval.
        </p>
      </div>

      {/* Back to Financial Analysis — easy jump back from bottom on mobile */}
      {onNavigateTo && (
        <div className="pt-4 pb-2 flex justify-center">
          <button
            type="button"
            onClick={() => onNavigateTo('financial')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
            aria-label="Back to Financial Analysis"
          >
            <ArrowLeft size={18} />
            Back to Financial Analysis
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Calendar,
  PiggyBank,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  BarChart2,
  Pencil,
  ChevronRight,
} from 'lucide-react';
import { useProjectOptional } from '../context/ProjectContext';
import {
  DEFAULT_CURRENT_HOME_VALUE,
  USER_RATE_ANNUAL,
  SECOND_LIEN_RATE_ANNUAL,
  ANNUAL_APPRECIATION_RATE,
  MASTER_RENOVATION_ITEMS,
  CAD_PACKAGE_PRICE,
  CAD_PACKAGE_US_PRICE_LOW,
  CAD_PACKAGE_US_PRICE_HIGH,
  CAD_TURNAROUND,
  CAD_DELIVERABLES,
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

  const [showTaxBenefits, setShowTaxBenefits] = useState(false);
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

    // Tax benefit estimate: interest deduction on reno loan (~24% bracket assumed)
    const annualRenoInterest = totalCost * SECOND_LIEN_RATE_ANNUAL;
    const monthlyInterestDeduction = Math.round((annualRenoInterest * 0.24) / 12);
    // Property tax estimate: ~0.6% of value increase / 12, taxed at marginal rate
    const monthlyPropTaxSavings = Math.round((totalValue * 0.006 * 0.24) / 12);
    const totalTaxSavings = monthlyInterestDeduction + monthlyPropTaxSavings;

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
    };
  }, [currentHomeValue, userRate, totalCost, totalValue, monthlyIncome, monthlyDebts, fin]);

  const blendedPmt = computed.blendedPayment;
  const taxAdjustedPmt = blendedPmt - (showTaxBenefits ? computed.totalTaxSavings : 0);

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1_000_000) return `${sign}$${(absVal / 1_000_000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}$${(absVal / 1000).toFixed(1)}K`;
    return `${sign}$${absVal}`;
  };
  const formatSignedCurrency = (val: number) =>
    val >= 0 ? `+${formatCurrency(val)}` : formatCurrency(val);
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
      subtext: 'New blended monthly payment',
      status: computed.affordability.feasibility === 'HIGH' ? 'affordable' : computed.affordability.feasibility === 'MEDIUM' ? 'good' : 'warning',
      color: 'emerald',
    },
    {
      id: 'wealth',
      title: 'How Much Wealth Will You Build?',
      icon: TrendingUp,
      summary: computed.netWorthImpact.netImpact >= 0
        ? formatSignedCurrency(computed.netWorthImpact.netImpact)
        : `${formatCurrency(computed.betterOffRenovating)} ahead`,
      subtext: computed.netWorthImpact.netImpact >= 0
        ? '10-year net wealth gain'
        : 'vs. selling & buying the same house',
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
      title: 'Tax Benefits',
      icon: PiggyBank,
      summary: showTaxBenefits ? `-${fmt(computed.totalTaxSavings)}/mo` : 'See your upside',
      subtext: showTaxBenefits ? 'Off your effective payment' : 'Toggle to estimate tax savings',
      status: showTaxBenefits ? 'active' : 'neutral',
      color: 'amber',
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
          Lenders typically prefer DTI under 43%.{' '}
          {computed.affordability.dtiPct < 43
            ? `You're in great shape with ${fmt(Math.round(monthlyIncome * 0.43 - computed.affordability.totalObligations))} of additional monthly capacity.`
            : 'Consider trimming scope to reduce your DTI.'}
        </p>
      </div>

      {showTaxBenefits && (
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex justify-between items-center mb-1">
            <span className="text-amber-300 text-sm">After tax benefits</span>
            <span className="text-amber-300 font-bold text-lg">{fmt(taxAdjustedPmt)}/mo</span>
          </div>
          <p className="text-amber-200/60 text-xs">Saving ~{fmt(computed.totalTaxSavings)}/mo on mortgage interest + property tax deductions (24% bracket assumed).</p>
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

      {/* 3-metric summary strip */}
      <div className="grid grid-cols-3 gap-3 min-w-0">
        <div className="bg-white/5 rounded-xl p-3 text-center overflow-hidden min-w-0">
          <p className="text-purple-300 text-xs mb-1">Post-Reno Value</p>
          <p className="text-lg font-bold text-white">{formatCurrency(computed.postRenovationValue)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center overflow-hidden min-w-0">
          <p className="text-purple-300 text-xs mb-1">Renovation Cost</p>
          <p className="text-lg font-bold text-white">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20 overflow-hidden min-w-0">
          <p className="text-emerald-400 text-xs mb-1">Day-1 Equity Delta</p>
          <p className={`text-lg font-bold ${(totalValue - totalCost) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{formatSignedCurrency(totalValue - totalCost)}</p>
        </div>
      </div>

      {/* 10-year projection */}
      <div className="bg-white/5 rounded-xl p-4 overflow-hidden min-w-0">
        <p className="text-purple-300 text-sm mb-3">10-Year Wealth Projection</p>
        <div className="space-y-2 min-w-0">
          <div className="flex justify-between items-center gap-3 min-w-0">
            <span className="text-purple-200 text-sm min-w-0 break-words pr-2">Appreciated Value of Improvements</span>
            <span className="text-emerald-400 shrink-0">+{formatCurrency(computed.netWorthImpact.appreciatedValueAdded)}</span>
          </div>
          <div className="flex justify-between items-center gap-3 min-w-0">
            <span className="text-purple-200 text-sm min-w-0 break-words pr-2">Interest Cost (10yr est.)</span>
            <span className="text-amber-300 shrink-0">-{formatCurrency(computed.netWorthImpact.interestPaid)}</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center gap-3 min-w-0">
            <span className="text-white font-medium min-w-0 break-words pr-2">Net Wealth Gain</span>
            <span className={`font-bold text-lg shrink-0 ${computed.netWorthImpact.netImpact >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{formatSignedCurrency(computed.netWorthImpact.netImpact)}</span>
          </div>
        </div>
        <p className="text-purple-300/60 text-xs mt-2 break-words min-w-0">
          Principal paid is recoverable equity — only interest is a true sunk cost. Based on 3.5% annual appreciation.
          {computed.netWorthImpact.netImpact < 0 && ' You\'re still better off renovating than selling and buying (see above).'} Estimates only.
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
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => setShowTaxBenefits(!showTaxBenefits)}
          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
            showTaxBenefits
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-white/5 border-white/20 text-purple-300'
          }`}
        >
          {showTaxBenefits ? '✓ Tax Benefits Active — reflected in your payment above' : 'Enable Tax Benefits'}
        </button>
      </div>

      {showTaxBenefits ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-purple-300 text-xs uppercase mb-1">Interest Deduction</p>
              <p className="text-xl font-bold text-white">{fmt(computed.monthlyInterestDeduction)}/mo</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-purple-300 text-xs uppercase mb-1">Property Tax</p>
              <p className="text-xl font-bold text-white">{fmt(computed.monthlyPropTaxSavings)}/mo</p>
            </div>
          </div>

          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <div className="flex justify-between items-center gap-3 mb-2">
              <span className="text-amber-300 font-medium">Total Monthly Savings</span>
              <span className="text-amber-300 font-bold text-2xl shrink-0">{fmt(computed.totalTaxSavings)}/mo</span>
            </div>
            <p className="text-amber-200/70 text-xs">
              Estimated at 24% marginal bracket. Consult a tax professional for figures specific to your situation.
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-purple-300 text-sm mb-2">Your Effective Monthly Payment</p>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 line-through text-lg">{fmt(blendedPmt)}</span>
              <ArrowRight size={16} className="text-purple-400" />
              <span className="text-amber-300 font-bold text-2xl">{fmt(taxAdjustedPmt)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <PiggyBank size={40} className="text-amber-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Renovation interest may be deductible</p>
          <p className="text-purple-300/70 text-sm">
            Enable this to see estimated monthly savings from mortgage interest and property tax deductions. Applies when the loan is secured by your home.
          </p>
        </div>
      )}
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

  // ─── What's Next CTA section ────────────────────────────────────

  const ctaOptions = [
    {
      id: 'package',
      icon: FileText,
      title: 'Get Your Package',
      description: 'A polished summary with all your numbers, projections, and financing options — ready to share with your lender, spouse, or contractor.',
      action: 'Download Summary',
      color: 'blue',
      onClick: () => {/* TODO: trigger PDF export */},
    },
    {
      id: 'analysis',
      icon: BarChart2,
      title: 'Deep Dive Analysis',
      description: 'Explore full loan comparisons, an itemized cost breakdown, and detailed financing scenarios — all the data behind these numbers.',
      action: 'Go to Analysis',
      color: 'purple',
      onClick: () => onNavigateTo?.('financial'),
    },
    {
      id: 'cad',
      icon: Pencil,
      title: 'See It In Real Life',
      description: `3D photorealistic renders, color elevations, before & after floor plans — printed large-format and mailed to your door. Delivered in ${CAD_TURNAROUND}. The same package costs $${(CAD_PACKAGE_US_PRICE_LOW/1000).toFixed(0)}K–$${(CAD_PACKAGE_US_PRICE_HIGH/1000).toFixed(0)}K from a US firm.`,
      action: `$${CAD_PACKAGE_PRICE} — Full Design Package`,
      color: 'pink',
      primary: true,
      onClick: () => {/* TODO: open deposit/checkout flow */},
    },
  ];

  return (
    <div className="space-y-10 min-w-0 overflow-hidden">

      {/* ── 1. VERDICT BANNER ──────────────────────────────────── */}
      <motion.div
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
              <p className="text-purple-300/60 text-xs mb-0.5">New Payment</p>
              <p className="text-white font-bold text-lg">{fmt(blendedPmt)}<span className="text-purple-400 text-xs font-normal">/mo</span></p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-purple-300/60 text-xs mb-0.5">Break Even</p>
              <p className="text-white font-bold text-lg">{computed.breakEvenYears === 0 ? 'Day 1' : `${computed.breakEvenYears} yrs`}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-purple-300/60 text-xs mb-0.5">10yr Wealth</p>
              <p className={`font-bold text-lg ${computed.netWorthImpact.netImpact >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatSignedCurrency(computed.netWorthImpact.netImpact)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. HOW + WHY CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* ── 3. WHAT'S NEXT CTA ─────────────────────────────────── */}
      <div>
        <div className="mb-5">
          <p className="text-purple-300/60 text-xs uppercase tracking-widest mb-1">Ready to move forward?</p>
          <h3 className="text-xl font-bold text-white">What do you want to do next?</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ctaOptions.map((option, idx) => {
            const Icon = option.icon;
            const borderColor =
              option.primary ? 'border-pink-500/50 hover:border-pink-400/70' :
              option.color === 'blue' ? 'border-blue-500/30 hover:border-blue-400/50' :
              'border-purple-500/30 hover:border-purple-400/50';
            const iconBg =
              option.primary ? 'bg-pink-500/20 text-pink-300' :
              option.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
              'bg-purple-500/20 text-purple-300';
            const btnStyle = option.primary
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500'
              : option.color === 'blue'
              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
              : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30';

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.07 }}
                className={`rounded-2xl border bg-white/5 backdrop-blur-md p-5 flex flex-col gap-4 transition-all cursor-pointer relative overflow-hidden ${borderColor} ${option.primary ? 'ring-1 ring-pink-500/20' : ''}`}
                onClick={option.onClick}
              >
                {/* Value sticker on the CAD card */}
                {option.primary && (
                  <div className="absolute -top-0 -right-0 z-10">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-xs px-3 py-1.5 rounded-bl-xl shadow-lg shadow-orange-500/30">
                      $8,000 Value!
                    </div>
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm mb-1">{option.title}</p>
                  <p className="text-purple-300/70 text-xs leading-relaxed">{option.description}</p>
                </div>
                <button
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${btnStyle}`}
                  onClick={(e) => { e.stopPropagation(); option.onClick(); }}
                >
                  {option.action}
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 4. DISCLAIMER ──────────────────────────────────────── */}
      <p className="text-purple-400/50 text-xs text-center pb-2">
        ExpandEase provides estimates for planning purposes only. All financing is subject to credit approval by licensed lending partners. This is not a loan offer or pre-approval.
      </p>

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

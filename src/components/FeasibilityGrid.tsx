import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Wallet,
  TrendingUp,
  Calendar,
  PiggyBank,
  ArrowRight,
  CheckCircle2,
  Info
} from 'lucide-react';

interface FeasibilityGridProps {
  onProgressUpdate?: (value: number) => void;
  isActive?: boolean;
}

export function FeasibilityGrid({ onProgressUpdate }: FeasibilityGridProps) {
  const [showTaxBenefits, setShowTaxBenefits] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const monthlyPayment = showTaxBenefits ? 3450 : 3865;
  const currentPayment = 3250;
  const income = 15000;
  const debtToIncome = 35;

  useEffect(() => {
    onProgressUpdate?.(100);
  }, [onProgressUpdate]);

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  const feasibilityCards = [
    {
      id: 'affordability',
      title: 'Can You Afford It?',
      icon: Wallet,
      summary: `${formatCurrency(monthlyPayment)}/mo`,
      subtext: 'New monthly payment',
      status: 'affordable',
      color: 'emerald'
    },
    {
      id: 'timeline',
      title: 'When Will You Break Even?',
      icon: Calendar,
      summary: '4.2 years',
      subtext: 'Equity payback period',
      status: 'good',
      color: 'blue'
    },
    {
      id: 'wealth',
      title: 'How Much Wealth Will You Build?',
      icon: TrendingUp,
      summary: '+$365K',
      subtext: 'Net worth increase',
      status: 'excellent',
      color: 'purple'
    },
    {
      id: 'savings',
      title: 'Tax Benefits',
      icon: PiggyBank,
      summary: showTaxBenefits ? '$415/mo' : 'Enable to see',
      subtext: 'Estimated monthly savings',
      status: showTaxBenefits ? 'active' : 'disabled',
      color: 'amber'
    }
  ];

  const renderAffordabilityDetail = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-purple-300 text-xs uppercase mb-1">Current Payment</p>
          <p className="text-2xl font-bold text-white">${currentPayment.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-emerald-400 text-xs uppercase mb-1">New Payment</p>
          <p className="text-2xl font-bold text-emerald-400">${monthlyPayment.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-purple-300 text-sm">Monthly Income</span>
          <span className="text-white font-medium">${income.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-purple-300 text-sm">Current Debt-to-Income</span>
          <span className="text-white font-medium">{debtToIncome}%</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-purple-300 text-sm">New Debt-to-Income</span>
          <span className="text-emerald-400 font-medium">{Math.round((monthlyPayment / income) * 100)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }} />
        </div>
        <p className="text-purple-300/70 text-xs mt-2">
          Lenders typically prefer DTI under 43%. You're in great shape!
        </p>
      </div>

      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-200 font-medium text-sm">Affordability Check</p>
            <p className="text-blue-200/70 text-xs mt-1">
              Based on your income of ${income.toLocaleString()}/month, this renovation is well within your budget.
              You have ${(income * 0.43 - monthlyPayment).toFixed(0)} of additional borrowing capacity if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimelineDetail = () => (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-purple-300 text-sm">Equity Payback Timeline</span>
          <span className="text-emerald-400 font-bold">4.2 years</span>
        </div>
        <div className="space-y-3">
          {[
            { year: 'Year 1', equity: '$125K', cumulative: '$125K' },
            { year: 'Year 2', equity: '$130K', cumulative: '$255K' },
            { year: 'Year 3', equity: '$135K', cumulative: '$390K' },
            { year: 'Year 4', equity: '$140K', cumulative: '$530K' },
            { year: 'Year 5+', equity: '$145K/yr', cumulative: '$675K+' },
          ].map((row, idx) => (
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
          After 4.2 years, the equity you've built will have fully paid for your renovation costs.
          From that point forward, it's pure profit if you sell.
        </p>
      </div>
    </div>
  );

  const renderWealthDetail = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-purple-300 text-xs mb-1">Home Value</p>
          <p className="text-lg font-bold text-white">$3.64M</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-purple-300 text-xs mb-1">Mortgage Balance</p>
          <p className="text-lg font-bold text-white">$1.89M</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
          <p className="text-emerald-400 text-xs mb-1">Your Equity</p>
          <p className="text-lg font-bold text-emerald-400">$1.75M</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-purple-300 text-sm mb-3">10-Year Wealth Projection</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-purple-200 text-sm">Current Home Value</span>
            <span className="text-white">$2.70M</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-purple-200 text-sm">Projected Value (10yr)</span>
            <span className="text-white">$4.85M</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-purple-200 text-sm">Renovation Investment</span>
            <span className="text-white">-$575K</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-purple-200 text-sm">Equity from Renovation</span>
            <span className="text-emerald-400">+$940K</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center">
            <span className="text-white font-medium">Net Worth Increase</span>
            <span className="text-emerald-400 font-bold text-lg">+$365K</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSavingsDetail = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowTaxBenefits(!showTaxBenefits)}
          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
            showTaxBenefits
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-white/5 border-white/20 text-purple-300'
          }`}
        >
          {showTaxBenefits ? '✓ Tax Benefits Enabled' : 'Enable Tax Benefits'}
        </button>
      </div>

      {showTaxBenefits ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-purple-300 text-xs uppercase mb-1">Interest Deduction</p>
              <p className="text-xl font-bold text-white">$285/mo</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-purple-300 text-xs uppercase mb-1">Property Tax</p>
              <p className="text-xl font-bold text-white">$130/mo</p>
            </div>
          </div>

          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-emerald-300 font-medium">Total Monthly Savings</span>
              <span className="text-emerald-400 font-bold text-2xl">$415</span>
            </div>
            <p className="text-emerald-200/70 text-xs">
              Estimated tax savings based on your income bracket and local tax rates.
              Consult a tax professional for exact figures.
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-purple-300 text-sm mb-2">Effective Monthly Payment</p>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 line-through text-lg">${monthlyPayment.toLocaleString()}</span>
              <ArrowRight size={16} className="text-purple-400" />
              <span className="text-emerald-400 font-bold text-2xl">${(monthlyPayment - 415).toLocaleString()}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <PiggyBank size={48} className="text-purple-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-2">See Your Tax Benefits</p>
          <p className="text-purple-300/70 text-sm">
            Enable this feature to see estimated monthly tax savings from mortgage interest
            and property tax deductions.
          </p>
        </div>
      )}
    </div>
  );

  const renderDetail = (id: string) => {
    switch (id) {
      case 'affordability': return renderAffordabilityDetail();
      case 'timeline': return renderTimelineDetail();
      case 'wealth': return renderWealthDetail();
      case 'savings': return renderSavingsDetail();
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard header — sell the good news */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Your feasibility at a glance</h2>
          <p className="text-purple-300/80 text-sm mt-1">The numbers say your renovation makes sense.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="text-emerald-300 font-semibold">You&apos;re approved</span>
        </div>
      </div>

      {/* Metric cards — clear, spacious, good news front and center */}
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
                  'text-amber-400'
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
    </div>
  );
}

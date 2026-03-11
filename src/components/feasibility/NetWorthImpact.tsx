import React, { useMemo } from 'react';
import { useProjectOptional } from '../../context/ProjectContext';
import { MASTER_RENOVATION_ITEMS } from '../../config/renovationDefaults';
import { calculateNetWorthImpact } from '../../utils/renovationMath';

export function NetWorthImpact() {
  const projectCtx = useProjectOptional();
  const fin = projectCtx?.project?.financial;

  const impact = useMemo(() => {
    const totalCost = fin?.totalCost ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.cost, 0);
    const totalValue = fin?.totalValue ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.valueAdded, 0);
    return calculateNetWorthImpact(totalCost, totalValue, 10);
  }, [fin?.totalCost, fin?.totalValue]);

  const formatCompact = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1000) return `$${Math.round(abs / 1000)}k`;
    return `$${abs}`;
  };
  const formatFull = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">The Net Worth Impact</h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: The Cost */}
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6 text-center">
          <div className="text-sm text-red-300 uppercase tracking-wider font-bold mb-2">
            The Cost
          </div>
          <div className="text-4xl font-mono font-bold text-red-400 mb-1">
            -{formatCompact(impact.totalCostWithInterest)}
          </div>
          <div className="text-gray-400 text-sm">What you borrow + interest (10yr est.)</div>
        </div>

        {/* Card 2: The Gain */}
        <div className="bg-green-950/20 border border-green-500/20 rounded-xl p-6 text-center">
          <div className="text-sm text-green-300 uppercase tracking-wider font-bold mb-2">
            The Gain
          </div>
          <div className="text-4xl font-mono font-bold text-green-400 mb-1">
            +{formatCompact(impact.appreciatedValueAdded)}
          </div>
          <div className="text-gray-400 text-sm">Appreciated value of improvements (10yr)</div>
        </div>
      </div>

      {/* Hero Footer */}
      <div className="mt-8 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-xl p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
        <div className="relative z-10">
          <div className="text-sm text-green-300 uppercase tracking-widest font-bold mb-2">
            Bottom Line
          </div>
          <div className="text-3xl md:text-5xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            Net Equity Created:{' '}
            <span className={impact.netImpact >= 0 ? 'text-green-400' : 'text-red-400'}>
              {impact.netImpact >= 0 ? '+' : '-'}{formatFull(Math.abs(impact.netImpact))}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-2">10-year projection with 3.5% annual appreciation. Estimates only.</p>
        </div>
      </div>
    </div>);

}
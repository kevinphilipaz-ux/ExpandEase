import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useProjectOptional } from '../../context/ProjectContext';
import {
  SECOND_LIEN_RATE_ANNUAL,
  USER_RATE_ANNUAL,
  DEFAULT_CURRENT_HOME_VALUE,
  MASTER_RENOVATION_ITEMS,
} from '../../config/renovationDefaults';
import { monthlyPayment, resolveExistingBalance, calculateBlendedPayment } from '../../utils/renovationMath';

interface MortgageRoadmapProps {
  finalPayment: number;
}
export function MortgageRoadmap({ finalPayment }: MortgageRoadmapProps) {
  const projectCtx = useProjectOptional();
  const fin = projectCtx?.project?.financial;
  const onboarding = projectCtx?.project?.onboarding;
  const property = projectCtx?.project?.property;

  const currentHomeValue = property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
  const userRate = (onboarding?.mortgageRate ?? USER_RATE_ANNUAL * 100) / 100;

  // Derive dynamic values from project context
  const roadmap = useMemo(() => {
    const totalCost = fin?.totalCost ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.cost, 0);

    const { balance: existingBalance } = resolveExistingBalance(
      currentHomeValue,
      userRate,
      fin?.existingMortgageBalance && fin.existingMortgageBalance > 0 ? fin.existingMortgageBalance : undefined,
      fin?.currentMonthlyPayment && fin.currentMonthlyPayment > 0 ? fin.currentMonthlyPayment : undefined,
    );

    const existingPmt = monthlyPayment(existingBalance, userRate);
    const blended = calculateBlendedPayment(existingBalance, totalCost, userRate, SECOND_LIEN_RATE_ANNUAL);

    // During construction, interest-only on drawn funds peaks at full draw
    const ioOnFullDraw = Math.round(totalCost * (SECOND_LIEN_RATE_ANNUAL / 12));

    return {
      existingBalance: Math.round(existingBalance),
      existingRate: (userRate * 100).toFixed(1),
      existingPmt: Math.round(existingPmt),
      renovationAmount: Math.round(totalCost),
      ioOnFullDraw,
      blendedPayment: Math.round(blended.blendedPayment),
      secondLienRate: (SECOND_LIEN_RATE_ANNUAL * 100).toFixed(1),
    };
  }, [fin, currentHomeValue, userRate]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };
  const formatCompact = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${Math.round(val / 1000)}k`;
    return `$${val}`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">The Mortgage Roadmap</h3>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 relative">
        {/* Node 1: Now */}
        <div className="flex-1 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-4 relative group hover:border-purple-500/60 transition-colors">
          <div className="text-xs text-purple-300 uppercase font-bold mb-2 tracking-wider">
            Now (Current Mortgage)
          </div>
          <div className="text-white font-medium mb-1">Loan A ({formatCompact(roadmap.existingBalance)} @ {roadmap.existingRate}%)</div>
          <div className="text-gray-400 font-mono text-sm">{formatCurrency(roadmap.existingPmt)}/mo</div>
        </div>

        {/* Arrow 1 */}
        <div className="hidden md:flex items-center justify-center text-gray-600">
          <ArrowRight size={24} />
        </div>
        <div className="md:hidden flex justify-center text-gray-600 rotate-90 my-[-10px]">
          <ArrowRight size={24} />
        </div>

        {/* Node 2: The Build */}
        <div className="flex-1 bg-gradient-to-br from-pink-900/50 to-purple-900/50 border border-pink-500/30 rounded-xl p-4 relative group hover:border-pink-500/60 transition-colors">
          <div className="text-xs text-pink-300 uppercase font-bold mb-2 tracking-wider">
            The Build (Construction Draw)
          </div>
          <div className="text-white font-medium mb-1">
            Interest Only on Drawn Funds
          </div>
          <div className="text-gray-400 font-mono text-sm">
            Starts at $0 → Peaks at {formatCurrency(roadmap.ioOnFullDraw)}/mo
          </div>
        </div>

        {/* Arrow 2 */}
        <div className="hidden md:flex items-center justify-center text-gray-600">
          <ArrowRight size={24} />
        </div>
        <div className="md:hidden flex justify-center text-gray-600 rotate-90 my-[-10px]">
          <ArrowRight size={24} />
        </div>

        {/* Node 3: The Future */}
        <div className="flex-1 bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/50 rounded-xl p-4 relative shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all">
          <div className="text-xs text-green-300 uppercase font-bold mb-2 tracking-wider">
            The Future (Blended Payment)
          </div>
          <div className="text-white font-medium mb-1">
            Loan A + Loan B ({formatCompact(roadmap.renovationAmount)} @ {roadmap.secondLienRate}%)
          </div>
          <div className="text-green-400 font-mono font-bold text-lg drop-shadow-sm">
            {formatCurrency(finalPayment > 0 ? finalPayment : roadmap.blendedPayment)}/mo Total
          </div>
        </div>
      </div>
    </div>);

}
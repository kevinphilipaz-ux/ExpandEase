import React from 'react';
import { ArrowRight } from 'lucide-react';
interface MortgageRoadmapProps {
  finalPayment: number;
}
export function MortgageRoadmap({ finalPayment }: MortgageRoadmapProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
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
          <div className="text-white font-medium mb-1">Loan A ($310k @ 3%)</div>
          <div className="text-gray-400 font-mono text-sm">$2,200/mo</div>
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
            Starts at $0 → Peaks at $1,200/mo
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
            Loan A + Loan B ($235k @ 8.5%)
          </div>
          <div className="text-green-400 font-mono font-bold text-lg drop-shadow-sm">
            {formatCurrency(finalPayment)}/mo Total
          </div>
        </div>
      </div>
    </div>);

}
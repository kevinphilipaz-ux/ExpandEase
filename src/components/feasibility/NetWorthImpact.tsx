import React from 'react';
export function NetWorthImpact() {
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
            -$575k
          </div>
          <div className="text-gray-400 text-sm">What you borrow</div>
        </div>

        {/* Card 2: The Gain */}
        <div className="bg-green-950/20 border border-green-500/20 rounded-xl p-6 text-center">
          <div className="text-sm text-green-300 uppercase tracking-wider font-bold mb-2">
            The Gain
          </div>
          <div className="text-4xl font-mono font-bold text-green-400 mb-1">
            +$940k
          </div>
          <div className="text-gray-400 text-sm">What you own</div>
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
            <span className="text-green-400">+$365,000</span>
          </div>
        </div>
      </div>
    </div>);

}
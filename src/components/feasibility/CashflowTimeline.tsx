import React from 'react';
export function CashflowTimeline() {
  const months = Array.from(
    {
      length: 12
    },
    (_, i) => i + 1
  );
  const milestones: Record<number, string> = {
    1: 'Design',
    3: 'Foundation',
    6: 'Framing',
    9: 'Finishes',
    12: 'Complete'
  };
  const cashNeeded: Record<number, number> = {
    1: 500,
    6: 2000
  };
  const bankDraws: Record<number, number> = {
    3: 50000,
    6: 80000,
    9: 60000,
    12: 45000
  };
  // Payment ramp up logic for graph
  const getPaymentHeight = (month: number) => {
    // Base height 20%, max height 90%
    const progress = month / 12;
    return 20 + progress * 70;
  };
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">
        12-Month Cashflow Timeline
      </h3>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] grid grid-cols-12 gap-2 relative">
          {/* Row 1: Milestones */}
          {months.map((m) =>
          <div
            key={`m-${m}`}
            className="h-12 flex flex-col justify-end items-center border-b border-white/10 pb-2">

              <span className="text-xs text-gray-500 font-mono mb-1">M{m}</span>
              {milestones[m] &&
            <span className="text-[10px] text-white font-bold bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {milestones[m]}
                </span>
            }
            </div>
          )}

          {/* Row 2: Cash Needed */}
          {months.map((m) =>
          <div
            key={`c-${m}`}
            className="h-12 flex items-center justify-center border-b border-white/10 relative">

              {cashNeeded[m] &&
            <div className="group relative">
                  <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-pink-900 text-pink-200 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    -${cashNeeded[m]} Cash
                  </div>
                </div>
            }
            </div>
          )}

          {/* Row 3: Bank Draws */}
          {months.map((m) =>
          <div
            key={`b-${m}`}
            className="h-24 flex items-end justify-center border-b border-white/10 px-1">

              {bankDraws[m] &&
            <div
              className="w-full bg-purple-500/40 border border-purple-400/50 rounded-t-sm relative group hover:bg-purple-500/60 transition-colors"
              style={{
                height: `${bankDraws[m] / 80000 * 100}%`
              }}>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[10px] text-purple-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    ${bankDraws[m] / 1000}k
                  </div>
                </div>
            }
            </div>
          )}

          {/* Row 4: Payment Graph Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none">
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none">

              <defs>
                <linearGradient
                  id="paymentGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0">

                  <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
                </linearGradient>
              </defs>
              <path
                d={`M 0,${100 - getPaymentHeight(0)} ${months.map((m) => `L ${(m - 0.5) * (100 / 12)}%,${100 - getPaymentHeight(m)}`).join(' ')}`}
                fill="none"
                stroke="url(#paymentGradient)"
                strokeWidth="2"
                strokeDasharray="4 2" />

              {/* End point dot */}
              <circle
                cx={`${11.5 * (100 / 12)}%`}
                cy={`${100 - getPaymentHeight(12)}`}
                r="3"
                fill="white" />

            </svg>
          </div>

          {/* Row 4: Payment Label Area */}
          {months.map((m) =>
          <div
            key={`p-${m}`}
            className="h-8 flex items-center justify-center">

              {m === 1 &&
            <span className="text-[10px] text-gray-500 font-mono">
                  $2.2k
                </span>
            }
              {m === 12 &&
            <span className="text-[10px] text-white font-mono font-bold">
                  $3.8k
                </span>
            }
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-pink-500"></div>
          <span className="text-gray-400">Cash Needed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500/40 border border-purple-400/50"></div>
          <span className="text-gray-400">Bank Draws</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-gray-400 border-t border-dashed"></div>
          <span className="text-gray-400">Monthly Payment</span>
        </div>
      </div>
    </div>);

}
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { ProjectBuilder, ProjectBuilderOutput } from './ProjectBuilder';
import { ValueWithPop } from '../ui/ValueWithPop';
import { useMilestoneConfetti } from '../../hooks/useMilestoneConfetti';
export function DreamCalculator() {
  const navigate = useNavigate();
  const [homeValue, setHomeValue] = useState(800000);
  // New State from ProjectBuilder
  const [budgetRange, setBudgetRange] = useState({
    min: 0,
    max: 0
  });
  const [equityMultiplier, setEquityMultiplier] = useState(1.4);
  const [additionsCost, setAdditionsCost] = useState(0);
  const [renovationsCost, setRenovationsCost] = useState(0);
  // Derived values
  const [newValue, setNewValue] = useState(0);
  const [equity, setEquity] = useState(0);
  // Handle updates from ProjectBuilder
  const handleBuilderUpdate = (output: ProjectBuilderOutput) => {
    setBudgetRange({
      min: output.estimatedBudgetMin,
      max: output.estimatedBudgetMax
    });
    setEquityMultiplier(output.equityMultiplier);
    setAdditionsCost(output.additionsCost);
    setRenovationsCost(output.renovationsCost);
  };
  useEffect(() => {
    // Use the average of the estimated budget range for calculations
    const estimatedBudget = (budgetRange.min + budgetRange.max) / 2;
    // Calculate new value based on budget and equity multiplier
    // New Value = Current Value + (Budget * Multiplier)
    const addedValue = estimatedBudget * equityMultiplier;
    const projectedValue = homeValue + addedValue;
    setNewValue(projectedValue);
    setEquity(addedValue - estimatedBudget); // Instant equity is value added minus cost
  }, [homeValue, budgetRange, equityMultiplier]);
  const roiPercent = (budgetRange.min + budgetRange.max) / 2 > 0 ? Math.round((equity / ((budgetRange.min + budgetRange.max) / 2)) * 100) : 0;
  useMilestoneConfetti(equity, roiPercent);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };
  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(val);
  };
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl relative overflow-hidden group">
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl group-hover:bg-pink-500/30 transition-all duration-700"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              See Your Future Equity
            </h3>
            <p className="text-purple-200 text-sm">Real-time ROI estimation</p>
            <p className="text-purple-400/70 text-xs mt-0.5">For illustration only — not a guarantee.</p>
          </div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1 flex items-center gap-1">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-green-300 text-xs font-bold tracking-wide">
              LIVE DATA
            </span>
          </div>
        </div>

        {/* Home Value Slider */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-purple-200">Current Home Value</span>
            <span className="text-white font-mono font-bold">
              {formatCompact(homeValue)}
            </span>
          </div>
          <input
            type="range"
            min="300000"
            max="2000000"
            step="10000"
            value={homeValue}
            onChange={(e) => setHomeValue(Number(e.target.value))}
            className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all" />

        </div>

        {/* Project Builder Widget */}
        <div className="mb-8">
          <ProjectBuilder onUpdate={handleBuilderUpdate} />

          {/* Micro-breakdown */}
          {(additionsCost > 0 || renovationsCost > 0) &&
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-400">
              {additionsCost > 0 &&
            <span>
                  Additions:{' '}
                  <span className="text-blue-300 font-mono">
                    {formatCompact(additionsCost)}
                  </span>
                </span>
            }
              {additionsCost > 0 && renovationsCost > 0 &&
            <span className="text-gray-600">•</span>
            }
              {renovationsCost > 0 &&
            <span>
                  Renovations:{' '}
                  <span className="text-purple-300 font-mono">
                    {formatCompact(renovationsCost)}
                  </span>
                </span>
            }
            </div>
          }

          {/* Dynamic Budget Output */}
          <div className="mt-2 flex justify-between items-center px-2">
            <span className="text-xs text-purple-300 uppercase tracking-wider">
              Est. Project Budget
            </span>
            <span className="text-white font-mono font-bold text-lg">
              {formatCompact(budgetRange.min)} -{' '}
              {formatCompact(budgetRange.max)}
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-purple-200 text-sm">Projected New Value</span>
            <span className="text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {formatCompact(newValue)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-purple-300 text-xs">
              Instant Equity Created
            </span>
            <span className="text-green-400 font-mono font-bold text-sm shadow-green-500/20 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">
              <ValueWithPop value={equity} format="currency" prefix="+" />
            </span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          type="button"
          onClick={() => navigate('/onboarding')}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 p-px focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-purple-900"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-100 transition-opacity group-hover:opacity-90"></span>
          <span className="relative flex items-center justify-center gap-2 rounded-xl bg-transparent px-6 py-3.5 text-base font-bold text-white transition-all">
            Start Your Vision
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1" />
          </span>
        </motion.button>
      </div>
    </div>);

}
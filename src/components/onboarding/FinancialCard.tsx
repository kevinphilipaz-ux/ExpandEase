import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
interface FinancialCardProps {
  onNext: () => void;
}
export function FinancialCard({ onNext }: FinancialCardProps) {
  const { data, updateData } = useOnboarding();
  const [rate, setRate] = useState(data.mortgageRate);
  const handleNext = () => {
    updateData({
      mortgageRate: rate
    });
    onNext();
  };
  return (
    <div className="w-full max-w-xl mx-auto relative">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center">
        What's your current rate?
      </h2>
      <p className="text-gray-400 text-center mb-8">
        This tells us how much you're saving by not moving.
      </p>

      <div className="bg-gray-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <label className="text-gray-300 font-medium">
            Current Mortgage Rate
          </label>
          <span className="text-pink-400 font-mono font-bold text-2xl">
            {rate}%
          </span>
        </div>
        <input
          type="range"
          min="2"
          max="8"
          step="0.125"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500" />

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>2%</span>
          <span>8%</span>
        </div>
      </div>

      {/* Savings Badge */}
      {rate < 5 &&
      <motion.div
        initial={{
          scale: 0,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        className="absolute -top-6 -right-6 md:-right-12 bg-green-500 text-black font-bold p-4 rounded-full shadow-lg transform rotate-12 flex flex-col items-center justify-center w-24 h-24 text-center text-xs leading-tight z-10">

          <TrendingUp size={20} className="mb-1" />
          Huge Savings vs Moving
        </motion.div>
      }

      <motion.button
        whileTap={{
          scale: 0.98
        }}
        onClick={handleNext}
        className="mt-8 w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-pink-500/20 transition-all flex items-center justify-center gap-2 group">

        Continue
        <ArrowRight
          size={20}
          className="group-hover:translate-x-1 transition-transform" />

      </motion.button>
    </div>);

}
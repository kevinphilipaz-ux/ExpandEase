import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
interface TripwireCardProps {
  onNext: () => void;
}
export function TripwireCard({ onNext }: TripwireCardProps) {
  const { updateData } = useOnboarding();
  const handleSelect = (choice: 'analysis' | 'visualization') => {
    updateData({
      choice
    });
    onNext();
  };
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-12 text-center">
        Let's see what's possible.
      </h2>

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        {/* Option A: Free Analysis */}
        <motion.div
          className="bg-gray-900/40 border border-white/10 rounded-2xl p-8 flex flex-col backdrop-blur-sm hover:bg-gray-900/60 transition-colors"
          whileHover={{
            y: -4
          }}>

          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <BarChart3 className="text-gray-300" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Instant Analysis
          </h3>
          <p className="text-gray-400 mb-8 flex-grow">
            See your home's potential value, equity creation, and ROI analysis
            instantly.
          </p>
          <div className="mt-auto">
            <span className="block text-sm text-gray-500 mb-2 uppercase tracking-wider font-bold">
              Free
            </span>
            <button
              onClick={() => handleSelect('analysis')}
              className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">

              Show Me the Numbers
            </button>
          </div>
        </motion.div>

        {/* Option B: Visualization (Highlighted) */}
        <motion.div
          className="bg-gradient-to-b from-gray-900/80 to-purple-900/20 border border-pink-500/50 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(236,72,153,0.1)]"
          whileHover={{
            y: -4,
            shadow: '0 0 50px rgba(236,72,153,0.2)'
          }}>

          <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
            MOST POPULAR
          </div>

          <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mb-6">
            <div className="text-pink-400" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Custom Visualization
          </h3>
          <p className="text-gray-300 mb-8 flex-grow">
            Get a photorealistic 3D render of your renovated home designed by
            our architects.
          </p>
          <div className="mt-auto">
            <span className="block text-sm text-pink-300 mb-2 uppercase tracking-wider font-bold">
              $500 Deposit
            </span>
            <button
              onClick={() => handleSelect('visualization')}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-pink-500/25 transition-all flex items-center justify-center gap-2">

              Build My Dream
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      <p className="text-center text-gray-500 text-sm mt-8">
        90% of users start with the Analysis. 10% are ready to build today.
      </p>
    </div>);

}
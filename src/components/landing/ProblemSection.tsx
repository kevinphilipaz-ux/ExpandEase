import React from 'react';
import { X, Check } from 'lucide-react';
export function ProblemSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-purple-950 relative overflow-hidden">
      {/* Background noise/texture could go here */}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            The Math Doesn't Lie
          </h2>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Why trade a 3% mortgage for a 7% one? See the real cost of moving
            versus improving.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* The Old Way - Moving */}
          <div className="bg-gray-100 rounded-2xl p-8 relative transform rotate-[-1deg] hover:rotate-0 transition-transform duration-300 shadow-xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
              The Old Way
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b border-gray-300 pb-4">
              Buying a New Home
            </h3>

            <ul className="space-y-4 mb-8 font-mono text-gray-700">
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <X size={16} className="text-red-500" /> Agent Fees (6%)
                </span>
                <span className="text-red-600 font-bold">-$45,000</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <X size={16} className="text-red-500" /> Closing Costs
                </span>
                <span className="text-red-600 font-bold">-$10,000</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <X size={16} className="text-red-500" /> Moving Costs
                </span>
                <span className="text-red-600 font-bold">-$5,000</span>
              </li>
              <li className="flex justify-between items-center pt-2 border-t border-gray-300 border-dashed">
                <span className="flex items-center gap-2 font-bold">
                  New Interest Rate
                </span>
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                  ~7.0%
                </span>
              </li>
            </ul>

            <div className="bg-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                THE VERDICT
              </p>
              <p className="text-3xl font-black text-gray-400">DEAD MONEY</p>
            </div>
          </div>

          {/* The New Way - Expanding */}
          <div className="bg-white rounded-2xl p-8 relative transform rotate-[1deg] hover:rotate-0 transition-transform duration-300 shadow-2xl ring-4 ring-purple-500/30 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
              The ExpandEase Way
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b border-gray-200 pb-4">
              Expanding Your Home
            </h3>

            <ul className="space-y-4 mb-8 font-mono text-gray-800">
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" /> Agent Fees
                </span>
                <span className="text-green-600 font-bold">$0</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" /> Closing Costs
                </span>
                <span className="text-green-600 font-bold">$0</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" /> Customization
                </span>
                <span className="text-green-600 font-bold">100% YOU</span>
              </li>
              <li className="flex justify-between items-center pt-2 border-t border-gray-200 border-dashed">
                <span className="flex items-center gap-2 font-bold">
                  Your Interest Rate
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">
                  Kept at 3%
                </span>
              </li>
            </ul>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-center text-white shadow-lg">
              <p className="text-purple-100 text-xs uppercase tracking-widest mb-1">
                THE VERDICT
              </p>
              <p className="text-3xl font-black">WEALTH BUILDING</p>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
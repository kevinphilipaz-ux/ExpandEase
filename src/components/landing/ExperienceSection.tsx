import React from 'react';
import { Plus, Minus, Heart } from 'lucide-react';
export function ExperienceSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-gradient-to-b from-purple-950 to-purple-900 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text Content */}
        <div className="order-2 lg:order-1">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Curate.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Don't Complicate.
            </span>
          </h2>
          <p className="text-xl text-purple-200 mb-8 leading-relaxed">
            Building your Project Requirement Document (PRD) should feel like
            scrolling your favorite feed. Select what you love, see the
            real-world cost instantly, and optimize for your budget.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Heart className="text-pink-400" size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">
                  Visual Selection
                </h4>
                <p className="text-purple-300">
                  No spreadsheets. Just beautiful options.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <div className="text-green-400 font-mono font-bold">$</div>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">
                  Instant Pricing
                </h4>
                <p className="text-purple-300">
                  Real market data updates your budget in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Phone Mockup */}
        <div className="order-1 lg:order-2 flex justify-center relative">
          {/* Floating UI Bubbles */}
          <div className="absolute top-20 -left-10 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-xl animate-bounce duration-[3000ms]">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-1.5 rounded-full">
                <Plus size={14} className="text-green-400" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">
                  Added: Soaking Tub
                </p>
                <p className="text-green-300 text-xs">+$4,200</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-32 -right-4 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-xl animate-bounce duration-[4000ms]">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-1.5 rounded-full">
                <Minus size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">
                  Removed: Marble Floors
                </p>
                <p className="text-green-300 text-xs">-$8,500</p>
              </div>
            </div>
          </div>

          {/* Phone Frame */}
          <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-24 bg-black rounded-b-xl z-20"></div>

            {/* Screen Content */}
            <div className="w-full h-full bg-gray-900 overflow-hidden relative">
              {/* Header */}
              <div className="absolute top-0 w-full pt-12 pb-4 px-6 bg-gradient-to-b from-black/80 to-transparent z-10">
                <h3 className="text-white font-bold text-lg">
                  Kitchen Upgrades
                </h3>
                <p className="text-gray-400 text-xs">
                  Budget Remaining: $42,000
                </p>
              </div>

              {/* Feed Items */}
              <div className="pt-24 px-4 space-y-4 overflow-y-auto h-full pb-20 no-scrollbar">
                {/* Item 1 */}
                <div className="bg-gray-800 rounded-2xl overflow-hidden group relative">
                  <div className="h-32 bg-gray-700 relative">
                    <img
                      src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80"
                      alt="Kitchen Island"
                      className="w-full h-full object-cover opacity-80" />

                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md rounded-full p-1.5">
                      <Heart size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-white text-sm font-bold">
                        Waterfall Island
                      </p>
                      <p className="text-green-400 text-xs font-mono">$5,200</p>
                    </div>
                    <button className="w-full mt-2 bg-white text-black text-xs font-bold py-2 rounded-lg">
                      Add to Project
                    </button>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="bg-gray-800 rounded-2xl overflow-hidden group relative border-2 border-pink-500">
                  <div className="h-32 bg-gray-700 relative">
                    <img
                      src="https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"
                      alt="Cabinets"
                      className="w-full h-full object-cover opacity-80" />

                    <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1.5">
                      <Heart size={16} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-white text-sm font-bold">
                        Custom Cabinetry
                      </p>
                      <p className="text-green-400 text-xs font-mono">
                        $12,500
                      </p>
                    </div>
                    <button className="w-full mt-2 bg-pink-600 text-white text-xs font-bold py-2 rounded-lg">
                      Added
                    </button>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="bg-gray-800 rounded-2xl overflow-hidden group relative">
                  <div className="h-32 bg-gray-700 relative">
                    <img
                      src="https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80"
                      alt="Lighting"
                      className="w-full h-full object-cover opacity-80" />

                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-white text-sm font-bold">
                        Smart Lighting Pkg
                      </p>
                      <p className="text-green-400 text-xs font-mono">$2,800</p>
                    </div>
                    <button className="w-full mt-2 bg-white text-black text-xs font-bold py-2 rounded-lg">
                      Add to Project
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="absolute bottom-0 w-full h-16 bg-black/80 backdrop-blur-md flex justify-around items-center px-6 border-t border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                <div className="w-8 h-8 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                <div className="w-8 h-8 rounded-full bg-white/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
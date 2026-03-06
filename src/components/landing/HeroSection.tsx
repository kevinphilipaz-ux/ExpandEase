import React from 'react';
import { DreamCalculator } from './DreamCalculator';
export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex items-center pt-20 pb-16 px-4 md:px-8 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
          alt="Modern renovated home exterior"
          className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/95 via-purple-900/90 to-purple-900/40"></div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Column: Text */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
            <span className="text-xs font-medium text-pink-200 tracking-wide uppercase">
              The Future of Renovation
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
            The Home You Want is the One You{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Already Own.
            </span>
          </h1>

          <p className="text-xl text-purple-100/80 max-w-xl leading-relaxed">
            Moving is financial suicide. Keep your 3% rate. Keep your
            neighborhood. Upgrade everything else.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center gap-4 text-sm text-purple-200">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) =>
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border-2 border-purple-900 flex items-center justify-center text-xs font-bold text-gray-800">

                    {String.fromCharCode(64 + i)}
                  </div>
                )}
              </div>
              <span>See your numbers before you commit</span>
            </div>
          </div>
        </div>

        {/* Right Column: Calculator */}
        <div className="w-full max-w-md mx-auto lg:ml-auto">
          <DreamCalculator />
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-purple-900 to-transparent z-10"></div>
    </section>);

}
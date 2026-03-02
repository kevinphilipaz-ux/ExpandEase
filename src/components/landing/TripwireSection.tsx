import React from 'react';
import { ArrowRight } from 'lucide-react';
export function TripwireSection() {
  return (
    <section className="relative py-32 px-4 md:px-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80"
          alt="Luxury home interior with modern renovation"
          className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-block border border-white/30 rounded-lg p-2 mb-8 bg-white/5 backdrop-blur-md transform rotate-2 hover:rotate-0 transition-transform duration-300">
          <span className="text-xs font-bold text-white tracking-widest uppercase px-2">
            Visualization Package
          </span>
        </div>

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          See it before you sign it.
        </h2>

        <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
          For a small deposit, our design team turns your inputs into a stunning
          visualization. Put it on your wall. Stare at it. Make sure it's the
          dream before you spend a dime on construction.
        </p>

        <button className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-white/10 font-lg rounded-full hover:bg-white/20 border border-white/30 backdrop-blur-md">
          <span>Get My Home Visualization</span>
          <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
        </button>
      </div>
    </section>);

}
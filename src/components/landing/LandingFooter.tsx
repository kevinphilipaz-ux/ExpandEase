import React from 'react';
import { Home } from 'lucide-react';
import { AuthUI } from '../AuthUI';

export function LandingFooter() {
  return (
    <footer className="bg-black py-12 px-4 md:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <Home className="text-pink-500" size={24} />
          <span className="text-xl font-bold text-white tracking-tight">
            ExpandEase
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors py-2 min-h-[44px] flex items-center">
            About
          </a>
          <a href="#" className="hover:text-white transition-colors py-2 min-h-[44px] flex items-center">
            Lending Partners
          </a>
          <AuthUI />
        </div>

        <div className="text-xs text-gray-600">
          <p>Data provided by RSMeans & 1Build</p>
          <p className="mt-1">© 2024 ExpandEase. All rights reserved.</p>
        </div>
      </div>
    </footer>);

}
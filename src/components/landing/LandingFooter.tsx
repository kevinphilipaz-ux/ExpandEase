import React from 'react';
import { Home } from 'lucide-react';
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

        <div className="flex gap-8 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">
            About
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Lending Partners
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Login
          </a>
        </div>

        <div className="text-xs text-gray-600">
          <p>Data provided by RSMeans & 1Build</p>
          <p className="mt-1">© 2024 ExpandEase. All rights reserved.</p>
        </div>
      </div>
    </footer>);

}
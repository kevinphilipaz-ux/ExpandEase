import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LineChart } from 'lucide-react';
export function ComparableProperties() {
  const [isExpanded, setIsExpanded] = useState(false);
  return <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LineChart className="text-pink-300" size={20} />
          <h2 className="text-xl font-semibold">WHAT</h2>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-purple-200 hover:text-white transition-colors">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      <div className="mt-3">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 h-24 rounded-lg flex items-center justify-center">
          <p className="text-center text-sm">Comparable Properties Chart</p>
        </div>
        {isExpanded && <div className="mt-4 space-y-3 border-t border-purple-300/30 pt-3">
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="font-medium">Comparable 1</p>
              <div className="flex justify-between text-sm mt-1">
                <span>$5.2M</span>
                <span>4,800 sqft</span>
                <span>5 bed / 5 bath</span>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="font-medium">Comparable 2</p>
              <div className="flex justify-between text-sm mt-1">
                <span>$4.5M</span>
                <span>4,500 sqft</span>
                <span>5 bed / 4.5 bath</span>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="font-medium">Comparable 3</p>
              <div className="flex justify-between text-sm mt-1">
                <span>$3.9M</span>
                <span>4,200 sqft</span>
                <span>4 bed / 4 bath</span>
              </div>
            </div>
          </div>}
      </div>
    </div>;
}
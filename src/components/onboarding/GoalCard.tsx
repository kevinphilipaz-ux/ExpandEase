import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Palmtree, Sparkles, Star } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
interface GoalCardProps {
  onNext: () => void;
}
export function GoalCard({ onNext }: GoalCardProps) {
  const { updateData } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);
  const options = [
  {
    id: 'space',
    label: 'More Space',
    icon: BedDouble
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle Upgrade',
    icon: Palmtree
  },
  {
    id: 'modern',
    label: 'Modernization',
    icon: Sparkles
  },
  {
    id: 'everything',
    label: 'Everything',
    icon: Star
  }];

  const handleSelect = (id: string) => {
    setSelected(id);
    updateData({
      goal: id
    });
    setTimeout(onNext, 400);
  };
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
        What's the big move?
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option) =>
        <motion.button
          key={option.id}
          onClick={() => handleSelect(option.id)}
          className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 group ${selected === option.id ? 'bg-pink-500/20 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)]' : 'bg-gray-900/50 border-white/10 hover:bg-gray-800 hover:border-white/20'}`}
          whileHover={{
            scale: 1.02
          }}
          whileTap={{
            scale: 0.98
          }}>

            <option.icon
            size={48}
            className={`transition-colors duration-300 ${selected === option.id ? 'text-pink-400' : 'text-gray-400 group-hover:text-white'}`} />

            <span
            className={`text-lg font-medium transition-colors duration-300 ${selected === option.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>

              {option.label}
            </span>
          </motion.button>
        )}
      </div>
    </div>);

}
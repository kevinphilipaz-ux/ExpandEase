import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
interface TimelineCardProps {
  onNext: () => void;
}
export function TimelineCard({ onNext }: TimelineCardProps) {
  const { updateData } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);
  const options = [
  {
    label: 'Yesterday',
    value: 'urgent',
    icon: Zap
  },
  {
    label: '3 Months',
    value: '3_months',
    icon: Clock
  },
  {
    label: '6 Months',
    value: '6_months',
    icon: Clock
  },
  {
    label: 'Just Dreaming',
    value: 'dreaming',
    icon: Clock
  }];

  const handleSelect = (value: string) => {
    setSelected(value);
    updateData({
      timeline: value
    });
    // Delay slightly longer if "3 Months" to show the toast
    const delay = value === '3_months' ? 1500 : 400;
    setTimeout(onNext, delay);
  };
  return (
    <div className="w-full max-w-xl mx-auto relative">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
        When do you want to break ground?
      </h2>

      <div className="space-y-3">
        {options.map((option) =>
        <motion.button
          key={option.value}
          onClick={() => handleSelect(option.value)}
          className={`w-full p-6 rounded-xl border text-left flex items-center justify-between group transition-all duration-200 ${selected === option.value ? 'bg-pink-500/20 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'bg-gray-900/50 border-white/10 hover:bg-gray-800 hover:border-white/20'}`}
          whileHover={{
            scale: 1.01,
            x: 4
          }}
          whileTap={{
            scale: 0.99
          }}>

            <span
            className={`text-lg font-medium ${selected === option.value ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>

              {option.label}
            </span>
            <option.icon
            size={20}
            className={
            selected === option.value ?
            'text-pink-400' :
            'text-gray-500 group-hover:text-gray-300'
            } />

          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {selected === '3_months' &&
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -20
          }}
          className="absolute bottom-[-80px] left-0 right-0 bg-green-500/20 border border-green-500/50 text-green-300 p-4 rounded-xl text-center font-medium backdrop-blur-md">

            🚀 We can get you funded in 45 days.
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
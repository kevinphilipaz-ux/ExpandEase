import React from 'react';
import { motion } from 'framer-motion';
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}
export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep + 1) / totalSteps * 100;
  return (
    <div className="fixed top-0 left-0 w-full h-2 bg-gray-900 z-50">
      <motion.div
        className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
        initial={{
          width: 0
        }}
        animate={{
          width: `${progress}%`
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 20
        }} />

    </div>);

}
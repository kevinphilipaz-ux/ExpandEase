import React from 'react';
import { motion } from 'framer-motion';

const tapTransition = { type: 'spring' as const, stiffness: 400, damping: 17 };

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Use "scale" for buttons, "subtle" for less emphasis (e.g. icon-only) */
  variant?: 'scale' | 'subtle';
}

/**
 * Button with consistent tap feedback (scale down on press, optional hover).
 * Use for CTAs and interactive elements so every click has visible feedback.
 */
export function MotionButton({
  children,
  variant = 'scale',
  className = '',
  ...props
}: MotionButtonProps) {
  const scale = variant === 'subtle' ? 0.96 : 0.97;
  return (
    <motion.button
      whileTap={{ scale }}
      whileHover={{ scale: 1.02 }}
      transition={tapTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ValueWithPopFormat = 'currency' | 'percent';

interface ValueWithPopProps {
  value: number;
  format: ValueWithPopFormat;
  prefix?: string;
  className?: string;
  /** Optional label or children rendered next to the value */
  children?: React.ReactNode;
}

function formatDelta(value: number, format: ValueWithPopFormat): string {
  if (format === 'currency') {
    if (value >= 1_000_000) return `+$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `+$${(value / 1_000).toFixed(0)}K`;
    return `+$${value.toLocaleString()}`;
  }
  return `+${Math.round(value)}%`;
}

/**
 * Displays a value and, when it increases (positive-only), shows a green delta
 * that jumps up then falls down the page and fades out.
 */
export function ValueWithPop({ value, format, prefix = '', className = '', children }: ValueWithPopProps) {
  const prevValue = useRef(value);
  const [pop, setPop] = useState<{ delta: number; key: number } | null>(null);

  useEffect(() => {
    if (value > prevValue.current) {
      const delta = value - prevValue.current;
      setPop({ delta, key: Date.now() });
      prevValue.current = value;
      const t = setTimeout(() => setPop(null), 1200);
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  const displayValue =
    format === 'currency'
      ? value >= 1_000_000
        ? `$${(value / 1_000_000).toFixed(2)}M`
        : value >= 1_000
          ? `$${(value / 1_000).toFixed(0)}K`
          : `$${value.toLocaleString()}`
      : `${Math.round(value)}%`;

  return (
    <span className={`relative inline-block ${className}`}>
      {prefix}
      {displayValue}
      {children}
      <AnimatePresence>
        {pop && (
          <motion.span
            key={pop.key}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: [1, 1, 0], y: [0, -24, 48] }}
            transition={{
              duration: 1,
              times: [0, 0.25, 1],
              ease: 'easeOut',
            }}
            className="absolute left-0 top-0 font-bold text-emerald-400 text-sm whitespace-nowrap drop-shadow-sm"
            style={{ pointerEvents: 'none' }}
          >
            {formatDelta(pop.delta, format)}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

import { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

/** Equity thresholds in dollars — confetti when user first crosses each */
const EQUITY_MILESTONES = [25_000, 50_000, 100_000, 200_000, 500_000];

/** ROI thresholds in percent — confetti when user first crosses each */
const ROI_MILESTONES = [80, 100, 120, 150, 200];

/** Emerald/green/gold palette for positive outcome celebration */
const CONFETTI_COLORS = ['#34d399', '#10b981', '#059669', '#fbbf24', '#f59e0b'];

function fireConfetti(options?: { particleCount?: number; spread?: number }) {
  confetti({
    particleCount: options?.particleCount ?? 80,
    spread: options?.spread ?? 70,
    origin: { y: 0.6 },
    colors: CONFETTI_COLORS,
    ...options,
  });
}

/**
 * Fires confetti when equity or ROI crosses upward past a milestone (positive-only).
 * Tracks which milestones were already celebrated so each fires only once per session.
 */
export function useMilestoneConfetti(equity: number, roiPercent: number) {
  const equityCelebrated = useRef<Set<number>>(new Set());
  const roiCelebrated = useRef<Set<number>>(new Set());
  const prevEquity = useRef(equity);
  const prevRoi = useRef(roiPercent);

  useEffect(() => {
    // Equity: only when current value crosses a milestone from below
    for (const threshold of EQUITY_MILESTONES) {
      if (equity >= threshold && !equityCelebrated.current.has(threshold) && prevEquity.current < threshold) {
        equityCelebrated.current.add(threshold);
        fireConfetti({ particleCount: 60, spread: 55 });
        break; // one burst per update
      }
    }
    prevEquity.current = equity;

    // ROI: only when current value crosses a milestone from below
    for (const threshold of ROI_MILESTONES) {
      if (roiPercent >= threshold && !roiCelebrated.current.has(threshold) && prevRoi.current < threshold) {
        roiCelebrated.current.add(threshold);
        fireConfetti({ particleCount: 60, spread: 55 });
        break;
      }
    }
    prevRoi.current = roiPercent;
  }, [equity, roiPercent]);
}

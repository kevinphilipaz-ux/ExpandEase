import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { Heart, X, RotateCcw, ChevronRight, Zap, TrendingUp, DollarSign, Sparkles, Timer, Flame, Trophy, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SwipeItem {
  id: string;
  label: string;
  /** Category badge (e.g. "Kitchen", "Outdoor") */
  category: string;
  /** Estimated cost */
  cost: number;
  /** Estimated value-add (cost × ROI) */
  valueAdded: number;
  /** ROI as a decimal (0.85 = 85%) */
  roi: number;
  /** Optional Unsplash/placeholder image URL */
  image?: string;
  /** Brief educational text explaining why this feature matters */
  description?: string;
}

interface TinderModeProps {
  items: SwipeItem[];
  /** Called whenever the accepted/rejected sets change */
  onSelectionChange: (accepted: string[], rejected: string[]) => void;
  /** Called when user finishes all cards */
  onFinish: (accepted: string[], rejected: string[]) => void;
  /** Initial accepted item ids (e.g. pre-existing selections) */
  initialAccepted?: string[];
  /** When true the component fills its container (used inside the full-screen overlay) */
  isFullScreen?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Placeholder images per category (Unsplash)                        */
/* ------------------------------------------------------------------ */

const CATEGORY_IMAGES: Record<string, string> = {
  Kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  Bathrooms: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
  Rooms: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=400&fit=crop',
  Interior: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop',
  Exterior: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  Outdoor: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  Systems: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
};

/* ------------------------------------------------------------------ */
/*  Conflict groups — features where only one pick makes sense         */
/* ------------------------------------------------------------------ */

const CONFLICT_GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'siding material',
    items: ['Stucco', 'Brick', 'Stone Veneer', 'Hardie Board', 'Wood Siding'],
  },
];

/** Returns the first already-accepted id that conflicts with `itemId`, plus the group label */
function findConflict(
  itemId: string,
  accepted: string[]
): { conflictId: string; label: string } | null {
  for (const group of CONFLICT_GROUPS) {
    if (!group.items.includes(itemId)) continue;
    const hit = accepted.find(id => group.items.includes(id));
    if (hit) return { conflictId: hit, label: group.label };
  }
  return null;
}

const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `$${n}`;

// Format using absolute value (for Net Equity where we control the sign separately)
const fmtAbs = (n: number) => {
  const abs = Math.abs(n);
  return abs >= 1000 ? `$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}K` : `$${abs}`;
};

const fmtTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/* ------------------------------------------------------------------ */
/*  Confetti helpers                                                    */
/* ------------------------------------------------------------------ */

function fireSwipeConfetti() {
  confetti({
    particleCount: 30,
    angle: 90,
    spread: 55,
    origin: { x: 0.65, y: 0.55 },
    colors: ['#ec4899', '#a855f7', '#10b981', '#f59e0b'],
    scalar: 0.9,
    gravity: 1.2,
    ticks: 150,
  });
}

function fireMilestoneConfetti() {
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 80,
    origin: { x: 0.1, y: 0.6 },
    colors: ['#ec4899', '#a855f7', '#10b981'],
  });
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 80,
    origin: { x: 0.9, y: 0.6 },
    colors: ['#ec4899', '#a855f7', '#10b981'],
  });
}

function fireCompletionConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#ec4899', '#a855f7'],
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#10b981', '#f59e0b'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/* ------------------------------------------------------------------ */
/*  Timer Hook                                                          */
/* ------------------------------------------------------------------ */

function useStopwatch(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  return elapsed;
}

/* ------------------------------------------------------------------ */
/*  SwipeCard                                                          */
/* ------------------------------------------------------------------ */

function SwipeCard({
  item,
  onSwipe,
  isTop,
  fullScreen = false,
}: {
  item: SwipeItem;
  onSwipe: (dir: 'left' | 'right') => void;
  isTop: boolean;
  fullScreen?: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const yesOpacity = useTransform(x, [0, 100], [0, 1]);
  const noOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const imgSrc = item.image || CATEGORY_IMAGES[item.category] || CATEGORY_IMAGES.default;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 5 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5, y: isTop ? 0 : 12 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7, y: isTop ? 0 : 12 }}
      variants={{
        exit: (dir: 'left' | 'right') => ({
          x: dir === 'right' ? 350 : -350,
          opacity: 0,
          rotate: dir === 'right' ? 15 : -15,
          transition: { duration: 0.22 },
        }),
      }}
      exit="exit"
      whileTap={isTop ? { scale: 1.02 } : undefined}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl flex flex-col">
        {/* Image */}
        <div className={`relative bg-gray-800 overflow-hidden shrink-0 ${fullScreen ? 'h-56 sm:h-64' : 'h-48 sm:h-56'}`}>
          <img src={imgSrc} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
          {/* Category badge */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-white">
            {item.category}
          </div>
          {/* Swipe hint overlays */}
          <motion.div
            className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center pointer-events-none"
            style={{ opacity: yesOpacity }}
          >
            <div className="px-6 py-3 rounded-xl border-4 border-emerald-400 text-emerald-400 font-black text-3xl rotate-[-12deg] drop-shadow-lg">
              YES ❤️
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none"
            style={{ opacity: noOpacity }}
          >
            <div className="px-6 py-3 rounded-xl border-4 border-red-400 text-red-400 font-black text-3xl rotate-[12deg]">
              SKIP ✕
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-h-0">
          <div className="flex-1 min-h-0">
            <h3 className="text-lg font-bold text-white mb-1 leading-tight">{item.label}</h3>
            {item.description && (
              <p className="text-gray-400 text-xs leading-relaxed mb-2 line-clamp-3">
                {item.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1 text-gray-300 bg-white/5 rounded-lg px-2 py-1">
                <DollarSign size={11} className="text-pink-400" />
                <span>{fmt(item.cost)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-300 bg-white/5 rounded-lg px-2 py-1">
                <TrendingUp size={11} className="text-emerald-400" />
                <span>+{fmt(item.valueAdded)} value</span>
              </div>
              <div className="flex items-center gap-1 text-gray-300 bg-white/5 rounded-lg px-2 py-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>{Math.round(item.roi * 100)}% ROI</span>
              </div>
            </div>
          </div>

          {isTop && (
            <p className="text-gray-500 text-[10px] text-center mt-2 shrink-0 select-none">
              ← skip &nbsp;&bull;&nbsp; drag or use buttons &nbsp;&bull;&nbsp; add →
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Running Summary Bar                                                */
/* ------------------------------------------------------------------ */

function SummaryBar({
  totalCost,
  totalValue,
  itemCount,
}: {
  totalCost: number;
  totalValue: number;
  itemCount: number;
}) {
  const equity = totalValue - totalCost;

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
        <div className="text-[11px] uppercase tracking-wide text-purple-200/80 mb-1 font-semibold">
          Project Cost
        </div>
        <div className="text-lg font-bold text-white font-mono tabular-nums">
          {fmt(totalCost)}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
        <div className="text-[11px] uppercase tracking-wide text-purple-200/80 mb-1 font-semibold">
          Value Added
        </div>
        <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
          {fmt(totalValue)}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
        <div className="text-[11px] uppercase tracking-wide text-purple-200/80 mb-1 font-semibold">
          Net Equity
        </div>
        <div
          className={`text-lg font-bold font-mono tabular-nums ${
            equity >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {equity >= 0 ? '+' : '-'}
          {fmtAbs(equity)}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
        <div className="text-[11px] uppercase tracking-wide text-purple-200/80 mb-1 font-semibold">
          Selected
        </div>
        <div className="text-lg font-bold text-pink-400 font-mono tabular-nums">
          {itemCount}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Streak Banner                                                       */
/* ------------------------------------------------------------------ */

function StreakBanner({ streak }: { streak: number }) {
  if (streak < 3) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        initial={{ scale: 0.5, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-center gap-2 mb-3"
      >
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30 border border-orange-400/50 text-orange-300 text-sm font-bold">
          <Flame size={14} className="text-orange-400" />
          {streak} in a row! 🔥
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Completion Screen                                                  */
/* ------------------------------------------------------------------ */

function CompletionScreen({
  accepted,
  rejected,
  items,
  elapsedSeconds,
  onReset,
  onFinish,
}: {
  accepted: string[];
  rejected: string[];
  items: SwipeItem[];
  elapsedSeconds: number;
  onReset: () => void;
  onFinish: () => void;
}) {
  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const totalCost = accepted.reduce((sum, id) => sum + (itemMap.get(id)?.cost ?? 0), 0);
  const totalValue = accepted.reduce((sum, id) => sum + (itemMap.get(id)?.valueAdded ?? 0), 0);
  const equity = totalValue - totalCost;
  const isSpeedrun = elapsedSeconds < 120 && items.length >= 10;

  // Fire completion confetti on mount
  useEffect(() => {
    fireCompletionConfetti();
  }, []);

  return (
    <div className="text-center py-6">
      {/* Trophy icon with pulse */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/30"
      >
        <Trophy size={34} className="text-white" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-bold text-white mb-1"
      >
        TURBO COMPLETE! ⚡
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-gray-400 mb-2"
      >
        You selected <strong className="text-white">{accepted.length}</strong> items and skipped{' '}
        <strong className="text-white">{rejected.length}</strong>.
      </motion.p>

      {/* Time taken + speed badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-center gap-2 mb-5"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gray-300 text-sm">
          <Timer size={13} className="text-purple-400" />
          Completed in {fmtTime(elapsedSeconds)}
        </div>
        {isSpeedrun && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30 border border-orange-400/50 text-orange-300 text-sm font-bold"
          >
            <Zap size={12} /> Speed Run!
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400">Total Cost</div>
          <div className="text-lg font-bold text-white">{fmt(totalCost)}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400">Value Added</div>
          <div className="text-lg font-bold text-emerald-400">{fmt(totalValue)}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400">Net Equity</div>
          <div className={`text-lg font-bold ${equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {equity >= 0 ? '+' : ''}{fmt(equity)}
          </div>
        </div>
      </div>

      {/* Selected items list */}
      {accepted.length > 0 && (
        <div className="text-left mb-6 max-h-48 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Your selections</h4>
          <div className="space-y-1">
            {accepted.map(id => {
              const item = itemMap.get(id);
              if (!item) return null;
              return (
                <div key={id} className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-white/5 text-sm">
                  <span className="text-gray-200">{item.label}</span>
                  <span className="text-gray-400">{fmt(item.cost)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} /> Start Over
        </button>
        <button
          onClick={onFinish}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Conflict Toast                                                     */
/* ------------------------------------------------------------------ */

function ConflictToast({
  replacedLabel,
  newLabel,
  groupLabel,
  onUndo,
}: {
  replacedLabel: string;
  newLabel: string;
  groupLabel: string;
  onUndo: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-amber-400/35 bg-amber-500/10 backdrop-blur-sm px-4 py-3 mb-3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-100 font-medium leading-snug">
            Replaced <span className="text-white font-bold">{replacedLabel}</span> with{' '}
            <span className="text-white font-bold">{newLabel}</span>
          </p>
          <p className="text-xs text-amber-300/70 mt-0.5">
            Only one {groupLabel} at a time — you can review all picks at the end.
          </p>
        </div>
        <motion.button
          onClick={onUndo}
          whileTap={{ scale: 0.92 }}
          className="shrink-0 text-xs font-bold text-amber-300 bg-amber-400/20 border border-amber-400/40 px-3 py-1.5 rounded-lg hover:bg-amber-400/30 transition-colors"
        >
          Undo
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main TinderMode Component                                          */
/* ------------------------------------------------------------------ */

export function TinderMode({ items, onSelectionChange, onFinish, initialAccepted = [], isFullScreen = false }: TinderModeProps) {
  const [accepted, setAccepted] = useState<string[]>(initialAccepted);
  const [rejected, setRejected] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<Array<{
    id: string;
    dir: 'left' | 'right';
    /** Id of an item auto-removed due to conflict — restored on undo */
    removedConflict?: string;
  }>>([]);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Conflict notice shown after auto-replacing a mutually exclusive pick
  const [conflictNotice, setConflictNotice] = useState<{
    replacedLabel: string;
    newLabel: string;
    groupLabel: string;
  } | null>(null);
  const conflictDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the last swipe direction so the card exit animation matches
  const exitDirRef = useRef<'left' | 'right'>('right');

  // Timer — runs from mount until finish
  const elapsed = useStopwatch(!isFinished);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  const remaining = items.length - currentIndex;

  // Running totals
  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const totalCost = useMemo(() => accepted.reduce((sum, id) => sum + (itemMap.get(id)?.cost ?? 0), 0), [accepted, itemMap]);
  const totalValue = useMemo(() => accepted.reduce((sum, id) => sum + (itemMap.get(id)?.valueAdded ?? 0), 0), [accepted, itemMap]);

  const handleSwipe = useCallback(
    (dir: 'left' | 'right') => {
      const item = items[currentIndex];
      if (!item) return;
      exitDirRef.current = dir;

      let newAccepted = dir === 'right' ? [...accepted, item.id] : accepted;
      const newRejected = dir === 'left' ? [...rejected, item.id] : rejected;
      const newStreak = dir === 'right' ? streak + 1 : 0;
      const nextIndex = currentIndex + 1;

      // ── Conflict detection ──────────────────────────────────────────
      let removedConflict: string | undefined;
      if (dir === 'right') {
        const conflict = findConflict(item.id, accepted);
        if (conflict) {
          // Auto-remove the conflicting pick and show a toast
          newAccepted = newAccepted.filter(id => id !== conflict.conflictId);
          removedConflict = conflict.conflictId;
          // Clear any previous dismiss timer and show new notice
          if (conflictDismissRef.current) clearTimeout(conflictDismissRef.current);
          setConflictNotice({
            replacedLabel: conflict.conflictId,
            newLabel: item.id,
            groupLabel: conflict.label,
          });
          conflictDismissRef.current = setTimeout(() => setConflictNotice(null), 4500);
        } else {
          // Clear stale conflict notice on any non-conflict swipe
          if (conflictNotice) {
            if (conflictDismissRef.current) clearTimeout(conflictDismissRef.current);
            setConflictNotice(null);
          }
        }
      }

      setAccepted(newAccepted);
      setRejected(newRejected);
      setHistory(prev => [...prev, { id: item.id, dir, removedConflict }]);
      setCurrentIndex(nextIndex);
      setStreak(newStreak);
      onSelectionChange(newAccepted, newRejected);

      // Confetti on YES
      if (dir === 'right') {
        fireSwipeConfetti();
        if (newAccepted.length % 5 === 0 && newAccepted.length > 0) {
          fireMilestoneConfetti();
        }
      }

      if (nextIndex >= items.length) {
        setIsFinished(true);
      }
    },
    [currentIndex, items, accepted, rejected, streak, onSelectionChange, conflictNotice]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    setIsFinished(false);
    if (last.dir === 'right') {
      setAccepted(prev => {
        // Remove the undone pick
        let next = prev.filter(id => id !== last.id);
        // Restore any item that was auto-removed due to a conflict
        if (last.removedConflict) next = [...next, last.removedConflict];
        return next;
      });
    } else {
      setRejected(prev => prev.filter(id => id !== last.id));
    }
    // Dismiss any visible conflict notice on undo
    if (conflictDismissRef.current) clearTimeout(conflictDismissRef.current);
    setConflictNotice(null);
    setStreak(0);
  }, [history]);

  // Keyboard shortcuts: ← skip, → add, Backspace/⌘Z undo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire while typing in a form field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (isFinished) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); handleSwipe('right'); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); handleSwipe('left'); }
      if (e.key === 'Backspace' || (e.key === 'z' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSwipe, handleUndo, isFinished]);

  const handleReset = () => {
    setAccepted(initialAccepted);
    setRejected([]);
    setCurrentIndex(0);
    setHistory([]);
    setStreak(0);
    setIsFinished(false);
  };

  const handleFinish = () => {
    onFinish(accepted, rejected);
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto">
        <CompletionScreen
          accepted={accepted}
          rejected={rejected}
          items={items}
          elapsedSeconds={elapsed}
          onReset={handleReset}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  // Show current card and next card (for depth effect)
  const currentItem = items[currentIndex];
  const nextItem = currentIndex + 1 < items.length ? items[currentIndex + 1] : null;

  return (
    <div className={isFullScreen ? 'w-full max-w-lg mx-auto' : 'max-w-md mx-auto'}>
      {/* Progress + Timer row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">
          {currentIndex + 1} of {items.length}
        </span>
        <div className="flex-1 mx-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / items.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {/* Live stopwatch */}
        <div className="flex items-center gap-1 text-sm text-purple-300 font-mono font-semibold">
          <Timer size={13} className="text-purple-400" />
          {fmtTime(elapsed)}
        </div>
      </div>

      {/* Remaining badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{remaining} left</span>
        {streak >= 3 && (
          <motion.div
            key={streak}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs font-bold"
          >
            <Flame size={11} /> {streak} streak!
          </motion.div>
        )}
      </div>

      {/* Streak Banner (for big milestones) */}
      <StreakBanner streak={streak} />

      {/* Conflict Toast — shows when a mutually-exclusive item auto-replaces another */}
      <AnimatePresence>
        {conflictNotice && (
          <ConflictToast
            replacedLabel={conflictNotice.replacedLabel}
            newLabel={conflictNotice.newLabel}
            groupLabel={conflictNotice.groupLabel}
            onUndo={handleUndo}
          />
        )}
      </AnimatePresence>

      {/* Card Stack */}
      <div className={`relative w-full mb-4 ${isFullScreen ? 'h-[46vh] min-h-[300px]' : 'h-[380px] sm:h-[420px]'}`}>
        <AnimatePresence mode="popLayout" custom={exitDirRef.current}>
          {nextItem && (
            <SwipeCard
              key={nextItem.id}
              item={nextItem}
              onSwipe={() => {}}
              isTop={false}
              fullScreen={isFullScreen}
            />
          )}
          <SwipeCard
            key={currentItem.id}
            item={currentItem}
            onSwipe={handleSwipe}
            isTop={true}
            fullScreen={isFullScreen}
          />
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6 mb-5">
        <motion.button
          onClick={() => handleSwipe('left')}
          whileTap={{ scale: 0.82 }}
          whileHover={{ scale: 1.08 }}
          className="w-14 h-14 rounded-full border-2 border-red-400/50 text-red-400 flex items-center justify-center hover:bg-red-400/10 hover:border-red-400 transition-colors"
          title="Skip"
        >
          <X size={24} />
        </motion.button>
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-10 h-10 rounded-full border border-white/20 text-gray-400 flex items-center justify-center hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <RotateCcw size={16} />
        </button>
        <motion.button
          onClick={() => handleSwipe('right')}
          whileTap={{ scale: 0.82 }}
          whileHover={{ scale: 1.12 }}
          animate={streak >= 3 ? {
            boxShadow: ['0 0 0px rgba(236,72,153,0)', '0 0 18px rgba(236,72,153,0.5)', '0 0 0px rgba(236,72,153,0)'],
          } : {}}
          transition={streak >= 3 ? { repeat: Infinity, duration: 1.2 } : {}}
          className="w-14 h-14 rounded-full border-2 border-emerald-400/50 text-emerald-400 flex items-center justify-center hover:bg-emerald-400/10 hover:border-emerald-400 transition-colors"
          title="Add to project"
        >
          <Heart size={24} />
        </motion.button>
      </div>

      {/* Running totals */}
      <SummaryBar
        totalCost={totalCost}
        totalValue={totalValue}
        itemCount={accepted.length}
      />

      {/* Keyboard shortcut hint — desktop only */}
      <p className="hidden sm:block text-center text-[10px] text-gray-600 mt-3 select-none">
        ← / → arrow keys to swipe &nbsp;·&nbsp; Backspace or ⌘Z to undo
      </p>
    </div>
  );
}

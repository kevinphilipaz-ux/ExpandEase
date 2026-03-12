import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, CheckCircle2, Wand2, RefreshCw, ChevronRight, ImageIcon, Palette, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { analyzePinterestScreenshots, fileToBase64, type PinterestStyleResult, type MaterialDetail } from '../services/pinterestApi';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface PinterestSelections {
  homeStyle?: string;
  kitchenLevel?: string;
  flooring?: string;
  features: string[];
  materialDetails?: MaterialDetail[];
}

interface PinterestImportProps {
  onApply: (selections: PinterestSelections) => void;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Scanning animation particles                                        */
/* ------------------------------------------------------------------ */

function ScanParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-pink-400"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Sweeping gradient scan line */}
      <motion.div
        className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-pink-500/20 to-transparent"
        animate={{ y: ['-10%', '110%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Style tag line badge                                                */
/* ------------------------------------------------------------------ */

const STYLE_GRADIENTS: Record<string, string> = {
  Modern: 'from-slate-500 to-zinc-600',
  Farmhouse: 'from-amber-700 to-stone-600',
  Contemporary: 'from-violet-600 to-indigo-600',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: '✦ High confidence',
  medium: '✦ Good match',
  low: '✦ Approximate match',
};

/* ------------------------------------------------------------------ */
/*  Result detail card                                                  */
/* ------------------------------------------------------------------ */

function ResultCard({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
    >
      <p className="text-xs text-purple-400/70 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Material detail card                                                */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  Countertops: 'from-stone-600/40 to-stone-700/20 border-stone-500/30',
  Flooring: 'from-amber-700/30 to-amber-800/20 border-amber-600/30',
  Cabinets: 'from-slate-600/40 to-slate-700/20 border-slate-500/30',
  Backsplash: 'from-teal-700/30 to-teal-800/20 border-teal-600/30',
  Walls: 'from-violet-700/30 to-violet-800/20 border-violet-600/30',
  'Bath Tile': 'from-cyan-700/30 to-cyan-800/20 border-cyan-600/30',
  'Exterior Siding': 'from-green-700/30 to-green-800/20 border-green-600/30',
  'Trim & Millwork': 'from-pink-700/30 to-pink-800/20 border-pink-600/30',
};

function MaterialCard({ detail, delay }: { detail: MaterialDetail; delay: number }) {
  const colors = CATEGORY_COLORS[detail.category] ?? 'from-purple-700/30 to-purple-800/20 border-purple-600/30';
  const budgetStr =
    detail.budgetLow >= 1000 || detail.budgetHigh >= 1000
      ? `$${Math.round(detail.budgetLow / 1000)}K–$${Math.round(detail.budgetHigh / 1000)}K`
      : `$${detail.budgetLow}–$${detail.budgetHigh}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`rounded-xl bg-gradient-to-br ${colors} border px-4 py-3 flex items-center gap-3`}
    >
      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
        <Palette size={15} className="text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/50 text-[10px] uppercase tracking-widest leading-none mb-0.5">{detail.category}</p>
        <p className="text-white font-semibold text-sm leading-tight truncate">{detail.label}</p>
        <p className="text-white/60 text-xs mt-0.5 truncate">{detail.color}</p>
      </div>
      <div className="shrink-0 flex items-center gap-1 bg-black/25 rounded-lg px-2.5 py-1.5">
        <DollarSign size={11} className="text-emerald-400" />
        <span className="text-emerald-300 font-semibold text-xs">{budgetStr}</span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

type Stage = 'idle' | 'loaded' | 'scanning' | 'results' | 'applied';

export function PinterestImport({ onApply, onClose }: PinterestImportProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [result, setResult] = useState<PinterestStyleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 3);
    if (accepted.length === 0) return;

    const previews = await Promise.all(
      accepted.map(async (f) => ({ file: f, preview: await fileToBase64(f) })),
    );
    setImages(previews);
    setStage('loaded');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleAnalyze = async () => {
    setError(null);
    setStage('scanning');
    try {
      const b64s = images.map((i) => i.preview);
      const res = await analyzePinterestScreenshots(b64s);
      setResult(res);
      setStage('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
      setStage('loaded');
    }
  };

  const handleApply = () => {
    if (!result) return;
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#ec4899', '#a855f7', '#f59e0b', '#10b981'],
    });
    setStage('applied');
    onApply({
      homeStyle: result.homeStyle,
      kitchenLevel: result.kitchenLevel,
      flooring: result.flooring,
      features: result.selectedFeatures,
      materialDetails: result.materialDetails,
    });
  };

  const reset = () => {
    setImages([]);
    setResult(null);
    setError(null);
    setStage('idle');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#1a0a2e] to-[#0f0620] border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Pinterest-inspired icon in ExpandEase colors */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Wand2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold leading-none">Style Scan</h2>
              <p className="text-purple-400/70 text-xs mt-0.5">Powered by Aria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">

            {/* ——— IDLE ——— */}
            {stage === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-5">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Drop your Pinterest board here.
                  </h3>
                  <p className="text-purple-300/70 text-sm leading-relaxed">
                    Aria reads your pins and instantly builds your wishlist — kitchen style, flooring, features, all of it. Up to 3 screenshots.
                  </p>
                </div>

                {/* Drop zone */}
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-pink-500/40 rounded-2xl p-10 text-center cursor-pointer hover:border-pink-400/70 hover:bg-pink-500/5 transition-all group"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload size={24} className="text-pink-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Upload your screenshots</p>
                      <p className="text-purple-400/60 text-sm mt-1">PNG, JPG or WEBP · up to 3 images</p>
                    </div>
                  </motion.div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </div>

                {/* How it works */}
                <div className="mt-5 flex gap-4 text-xs text-purple-400/60">
                  {['Open your Pinterest board', 'Take 1–3 screenshots', 'Drop them here — Aria does the rest'].map((step, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 text-center">
                      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-pink-400 font-bold text-xs">
                        {i + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ——— LOADED ——— */}
            {stage === 'loaded' && (
              <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-5">
                  <p className="text-white font-bold text-lg">
                    {images.length} screenshot{images.length > 1 ? 's' : ''} ready
                  </p>
                  <p className="text-purple-300/70 text-sm mt-1">Aria is ready to scan your style.</p>
                </div>

                {/* Image thumbnails */}
                <div className="flex gap-3 mb-5 justify-center">
                  {images.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20 shrink-0"
                    >
                      <img src={img.preview} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                  {/* Add more slot */}
                  {images.length < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-purple-400/60 hover:border-pink-400/50 hover:text-pink-400 transition-all shrink-0"
                    >
                      <ImageIcon size={18} />
                      <span className="text-xs">Add more</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                {error && (
                  <p className="text-red-400 text-sm text-center mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
                )}

                <div className="flex gap-3">
                  <button onClick={reset} className="flex-1 py-3 rounded-xl border border-white/15 text-purple-300 text-sm font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw size={14} /> Redo
                  </button>
                  <motion.button
                    onClick={handleAnalyze}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                  >
                    <Sparkles size={16} /> Scan my style with Aria
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ——— SCANNING ——— */}
            {stage === 'scanning' && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-5">
                  <motion.p
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="text-white font-bold text-lg"
                  >
                    Aria is reading your vision…
                  </motion.p>
                  <p className="text-purple-300/60 text-sm mt-1">Analyzing colors, textures, and design choices</p>
                </div>

                {/* Scanning images with overlay */}
                <div className="flex gap-3 justify-center mb-6">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-pink-400/40">
                      <img src={img.preview} alt="" className="w-full h-full object-cover opacity-60" />
                      {i === 0 && <ScanParticles />}
                    </div>
                  ))}
                </div>

                {/* Animated tags */}
                <div className="flex flex-wrap justify-center gap-2">
                  {['Style...', 'Kitchen...', 'Flooring...', 'Countertops...', 'Cabinets...', 'Colors...', 'Materials...', 'Budget...'].map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 0.5], scale: 1 }}
                      transition={{ delay: i * 0.4, duration: 1.2, repeat: Infinity, repeatDelay: 2.4 }}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-300/70 text-xs"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ——— RESULTS ——— */}
            {stage === 'results' && result && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Scrollable results area */}
                <div className="max-h-[52vh] overflow-y-auto space-y-3 pr-1 mb-3">
                  {/* Style hero */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl bg-gradient-to-br ${STYLE_GRADIENTS[result.homeStyle] ?? 'from-purple-600 to-pink-600'} p-4 relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative">
                      <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Your aesthetic</p>
                      <h3 className="text-white text-xl font-bold mb-0.5">{result.styleTagline}</h3>
                      <p className="text-white/70 text-xs">{CONFIDENCE_LABELS[result.confidence] ?? '✦ Match found'}</p>
                    </div>
                  </motion.div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <ResultCard label="Style" value={result.homeStyle} delay={0.05} />
                    <ResultCard label="Kitchen" value={result.kitchenLevel} delay={0.1} />
                    <ResultCard label="Flooring" value={result.flooring} delay={0.15} />
                  </div>

                  {/* Material details — the star of the show */}
                  {result.materialDetails && result.materialDetails.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.18 }}
                    >
                      <p className="text-xs text-pink-400/80 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                        <Palette size={11} />
                        {result.materialDetails.length} material picks · with budgets
                      </p>
                      <div className="space-y-2">
                        {result.materialDetails.map((detail, i) => (
                          <MaterialCard key={`${detail.category}-${i}`} detail={detail} delay={0.2 + i * 0.07} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Features */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <p className="text-xs text-purple-400/70 uppercase tracking-wider mb-3">
                      {result.selectedFeatures.length} features detected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.selectedFeatures.map((f, i) => (
                        <motion.span
                          key={f}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.28 + i * 0.03 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                        >
                          <CheckCircle2 size={10} />
                          {f}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="flex gap-3">
                  <button onClick={reset} className="px-4 py-3 rounded-xl border border-white/15 text-purple-300 text-sm font-medium hover:bg-white/5 transition-colors">
                    <RefreshCw size={14} />
                  </button>
                  <motion.button
                    onClick={handleApply}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Sparkles size={16} /> Apply to my wishlist
                    <ChevronRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ——— APPLIED ——— */}
            {stage === 'applied' && (
              <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30"
                >
                  <CheckCircle2 size={36} className="text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-1">Your wishlist is ready ✨</h3>
                <p className="text-gray-400 text-sm mb-1">
                  Aria applied your Pinterest style — features, materials, and budget picks — to your wishlist.
                </p>
                <p className="text-purple-400/60 text-xs mb-6">Aria saw your style. Now let's build it.</p>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-colors"
                >
                  View my wishlist
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

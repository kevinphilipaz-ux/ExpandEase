import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  FileText,
  HardHat,
  Clock,
  Shield,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useProjectOptional } from '../context/ProjectContext';
import {
  DEFAULT_CURRENT_HOME_VALUE,
  USER_RATE_ANNUAL,
  SECOND_LIEN_RATE_ANNUAL,
  MASTER_RENOVATION_ITEMS,
  CAD_PACKAGE_PRICE,
} from '../config/renovationDefaults';
import { resolveExistingBalance, calculateBlendedPayment } from '../utils/renovationMath';

const GENERATION_STEPS = [
  'Parsing your dream home preferences…',
  'Mapping rooms, finishes & style…',
  'Generating floor plan layout…',
  'Rendering 3D structure…',
  'Preparing CAD-ready package…',
  'Ready.',
];

interface RecommendationSectionProps {
  compact?: boolean;
  /** Sidebar: compact card for two-column layout so action is always visible */
  variant?: 'full' | 'sidebar';
}

export function RecommendationSection({ compact, variant = 'full' }: RecommendationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic values from project context
  const projectCtx = useProjectOptional();
  const fin = projectCtx?.project?.financial;
  const property = projectCtx?.project?.property;
  const onboarding = projectCtx?.project?.onboarding;

  const currentHomeValue = property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
  const totalCost = fin?.totalCost ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.cost, 0);
  const totalValueAdded = fin?.totalValue ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.valueAdded, 0);
  const postRenovationValue = currentHomeValue + totalValueAdded;
  const userRate = (onboarding?.mortgageRate ?? USER_RATE_ANNUAL * 100) / 100;

  const blendedPayment = useMemo(() => {
    const { balance } = resolveExistingBalance(
      currentHomeValue, userRate,
      fin?.existingMortgageBalance && fin.existingMortgageBalance > 0 ? fin.existingMortgageBalance : undefined,
      fin?.currentMonthlyPayment && fin.currentMonthlyPayment > 0 ? fin.currentMonthlyPayment : undefined,
    );
    const blended = calculateBlendedPayment(balance, totalCost, userRate, SECOND_LIEN_RATE_ANNUAL);
    return Math.round(blended.blendedPayment);
  }, [currentHomeValue, userRate, totalCost, fin?.existingMortgageBalance, fin?.currentMonthlyPayment]);

  const fmtCompact = (n: number) => n >= 1_000_000 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSeeIn3D = useCallback(() => {
    setIsGenerating(true);
    setCurrentStep(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step < GENERATION_STEPS.length) {
        setCurrentStep(step);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        timeoutRef.current = setTimeout(() => {
          setIsGenerating(false);
          navigate('/design-package');
          timeoutRef.current = null;
        }, 600);
      }
    }, 1800);
  }, [navigate]);

  if (compact) {
    return (
      <button
        onClick={handleSeeIn3D}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            See Your Design
          </>
        )}
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <motion.aside
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:sticky lg:top-24 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 space-y-4"
      >
        <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
          <CheckCircle2 size={16} />
          Your next step
        </div>
        <p className="text-white font-semibold text-sm">Choose one</p>
        <div className="space-y-3">
          <button
            onClick={() => window.alert('Your analysis summary is being prepared. In production, a PDF would download here.')}
            className="w-full py-2.5 px-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            Download summary (free)
          </button>
          <motion.button
            onClick={handleSeeIn3D}
            disabled={isGenerating}
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isGenerating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Get 3D design package</>
            )}
          </motion.button>
        </div>
        <p className="text-purple-300/70 text-xs">{fmtCompact(totalCost)} est. · +{fmtCompact(totalValueAdded)} value</p>
        {isGenerating &&
          createPortal(
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0612] text-white z-[2147483647]" aria-live="polite" aria-busy="true">
              <div className="absolute inset-0 bg-[#0a0612]" aria-hidden="true" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                <span className="text-sm text-purple-200">Building your view…</span>
              </div>
            </div>,
            document.body
          )}
      </motion.aside>
    );
  }

  if (variant === 'dashboard') {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <p className="text-emerald-300 font-medium text-sm flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            Analysis complete
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Your next step</h2>
          <p className="text-purple-300/80 text-sm mt-1 max-w-md mx-auto">Get your free summary or unlock your 3D design package.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
              <FileText className="text-purple-300" size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Get your analysis summary</h3>
            <p className="text-purple-300/80 text-sm mb-4 flex-grow">Costs, ROI, and financing options — free PDF to review anytime.</p>
            <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-3 block">No cost · Instant</span>
            <button
              onClick={() => window.alert('Your analysis summary is being prepared. In production, a PDF would download here.')}
              className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              Download summary
              <ArrowRight size={18} />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-pink-500/40 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md p-6 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-br-xl shadow-lg shadow-orange-500/30">$8,000 Value!</div>
            <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl">Recommended</div>
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-4 mt-2">
              <Sparkles className="text-pink-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Unlock your 3D design package</h3>
            <p className="text-purple-300/80 text-sm mb-4 flex-grow">See your renovated home before breaking ground. 3D renders, color elevations, floor plans — printed and mailed to your door.</p>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-pink-400 font-bold">${CAD_PACKAGE_PRICE} design package</span>
              <span className="text-purple-400 text-xs">$5K–$8K from a US firm</span>
            </div>
            <motion.button
              onClick={handleSeeIn3D}
              disabled={isGenerating}
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isGenerating ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> Get my design package <ArrowRight size={18} /></>}
            </motion.button>
          </motion.div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 py-4 px-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-center">
            <p className="text-purple-400 text-xs uppercase tracking-wider">Est. cost</p>
            <p className="font-bold text-white text-lg">{fmtCompact(totalCost)}</p>
          </div>
          <div className="w-px h-10 bg-white/20 hidden sm:block" />
          <div className="text-center">
            <p className="text-purple-400 text-xs uppercase tracking-wider">New value</p>
            <p className="font-bold text-emerald-400 text-lg">{fmtCompact(postRenovationValue)}</p>
          </div>
          <div className="w-px h-10 bg-white/20 hidden sm:block" />
          <div className="text-center">
            <p className="text-purple-400 text-xs uppercase tracking-wider">Monthly</p>
            <p className="font-bold text-white text-lg">${blendedPayment.toLocaleString()}</p>
          </div>
        </div>
        {isGenerating &&
          createPortal(
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0612] text-white z-[2147483647]" aria-live="polite" aria-busy="true">
              <div className="absolute inset-0 bg-[#0a0612]" aria-hidden="true" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                <span className="text-sm text-purple-200">Building your view…</span>
              </div>
            </div>,
            document.body
          )}
      </motion.section>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Big reveal card — one container so layout stays centered and decision is the focus */}
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-white/20 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md overflow-hidden shadow-xl shadow-black/10"
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-4"
            >
              <CheckCircle2 size={16} />
              Analysis complete — your turn
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Your results & next step</h2>
            <p className="text-purple-300/70 text-sm sm:text-base max-w-xl mx-auto">
              Here’s your summary. Get the free PDF or unlock the full 3D design package.
            </p>
          </div>

          {/* Comparison strip — centered, integrated (fixes off-center) */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 py-4 px-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-center">
              <p className="text-purple-400 text-xs uppercase tracking-wider mb-0.5">Est. cost</p>
              <p className="font-bold text-white">{fmtCompact(totalCost)}</p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-purple-400 text-xs uppercase tracking-wider mb-0.5">New value</p>
              <p className="font-bold text-emerald-400">{fmtCompact(postRenovationValue)}</p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-purple-400 text-xs uppercase tracking-wider mb-0.5">Monthly</p>
              <p className="font-bold text-white">${blendedPayment.toLocaleString()}</p>
            </div>
          </div>

          {/* Key metrics — compact row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Wallet, label: 'Est. Cost', value: fmtCompact(totalCost), color: 'text-white' },
              { icon: TrendingUp, label: 'Value Created', value: `+${fmtCompact(totalValueAdded)}`, color: 'text-emerald-400' },
              { icon: FileText, label: 'Plan Type', value: 'CAD-Ready', color: 'text-purple-300' },
              { icon: Clock, label: 'Build Time', value: '6 Months', color: 'text-blue-300' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="bg-white/10 rounded-xl p-3 border border-white/10 text-center"
                >
                  <Icon size={18} className="text-purple-400 mx-auto mb-1" />
                  <p className="text-purple-300/80 text-[10px] uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Decision: two-path choice — prominent, low friction */}
          <div>
            <p className="text-white font-semibold text-center mb-4">Choose one</p>
            <div className="grid md:grid-cols-2 gap-4">
        {/* Free: Get Your Analysis Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 flex flex-col"
        >
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
            <FileText className="text-purple-300" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Get Your Analysis Summary</h3>
          <p className="text-purple-300/80 text-sm mb-4 flex-grow">
            Review your numbers anytime. Download includes costs, ROI, and financing options.
          </p>
          <div className="mb-4">
            <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">No cost • Instant PDF</span>
          </div>
          <button
            onClick={() => {
              /* Simulate PDF download - could trigger actual PDF generation */
              window.alert('Your analysis summary is being prepared. In production, a PDF would download here.');
            }}
            className="w-full py-3.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            Download Analysis Summary
            <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Paid: Unlock 3D Design Package */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-pink-500/40 p-6 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-br-xl shadow-lg shadow-orange-500/30">$8,000 Value!</div>
          <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
            RECOMMENDED
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-4 mt-2">
            <Sparkles className="text-pink-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Unlock Your 3D Design Package</h3>
          <p className="text-purple-300/80 text-sm mb-4 flex-grow">
            See your renovated home before breaking ground. 3D renders, color elevations, floor plans — printed and mailed to your door.
          </p>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-pink-400 text-sm font-bold">${CAD_PACKAGE_PRICE} Design Package</span>
            <span className="text-xs text-purple-400">$5K–$8K from a US firm</span>
          </div>
          <motion.button
            onClick={handleSeeIn3D}
            disabled={isGenerating}
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Get My Design Package
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </motion.div>
            </div>
          </div>

          <p className="text-center text-purple-300/50 text-sm">
            Both options help you decide with confidence. The free summary has everything you need to compare costs and ROI.
          </p>
        </div>
      </motion.article>

      {isGenerating &&
        createPortal(
          <div
            className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0612] text-white"
            style={{ zIndex: 2147483647 }}
            aria-live="polite"
            aria-busy="true"
          >
            {/* Opaque background - no content shows through */}
            <div className="absolute inset-0 bg-[#0a0612]" aria-hidden="true" />
            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
              }}
              aria-hidden="true"
            />
            {/* Glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-purple-500/20 blur-[80px] pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 text-center px-6 max-w-md">
              <div className="flex items-center justify-center gap-2 mb-8">
                <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                <span className="text-sm font-semibold tracking-wider text-purple-200 uppercase">
                  Building your view
                </span>
              </div>
              <div className="space-y-3 text-left">
                {GENERATION_STEPS.map((label, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      i < currentStep
                        ? 'text-emerald-300/90'
                        : i === currentStep
                          ? 'text-white'
                          : 'text-white/30'
                    }`}
                  >
                    {i < currentStep ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : i === currentStep ? (
                      <span className="w-5 h-5 shrink-0 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                    ) : (
                      <span className="w-5 h-5 shrink-0 rounded-full border border-white/20" />
                    )}
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProjectOptional } from '../context/ProjectContext';
import { useAuthOptional } from '../context/AuthContext';
import { CADCheckoutModal } from '../components/CADCheckoutModal';
import { AuthUI } from '../components/AuthUI';
import { useMilestoneConfetti } from '../hooks/useMilestoneConfetti';
import { ItemizedBill } from '../components/feasibility/ItemizedBill';
import { TableOfContents, type TocItem } from '../components/ui/TableOfContents';
import type { Project } from '../types/project';
import { calculateTaxSavings, formatTaxBracket } from '../utils/taxBrackets';
import { SECOND_LIEN_RATE_ANNUAL, CAD_PACKAGE_US_PRICE_HIGH } from '../config/renovationDefaults';
import {
  Download,
  Share2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Bath,
  Ruler,
  Car,
  ArrowRight,
  CheckCircle2,
  Layers,
  Home,
  Calculator,
  HardHat,
  Clock,
  Shield,
  ChevronDown,
  Sparkles,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface RoomData {
  id: string;
  name: string;
  image: string;
  features: string[];
}

// ─────────────────────────────────────────────
//  Style-aware images (Unsplash, categorised)
// ─────────────────────────────────────────────

const STYLE_IMAGES: Record<string, Record<string, string>> = {
  kitchen: {
    Modern: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
    Farmhouse: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=1200&q=80',
    Contemporary: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=1200&q=80',
  },
  master: {
    Modern: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    Farmhouse: 'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80',
    Contemporary: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
  },
  living: {
    Modern: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    Farmhouse: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=80',
    Contemporary: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  },
  outdoor: {
    Modern: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    Farmhouse: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    Contemporary: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  garage: {
    Modern: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=80',
    Farmhouse: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=80',
    Contemporary: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=80',
  },
};

function getStyleImage(roomId: string, style: string): string {
  const map = STYLE_IMAGES[roomId] ?? STYLE_IMAGES.living;
  return map[style] ?? map.Modern ?? '';
}

// ─────────────────────────────────────────────
//  Dynamic room builder (finishes picker removed)
// ─────────────────────────────────────────────

function buildDynamicRooms(project: Project | undefined): RoomData[] {
  const w = project?.wishlist;
  const style = w?.homeStyle ?? 'Modern';
  const rooms: RoomData[] = [];

  // Kitchen (always shown)
  const kitchenFeats: string[] = [];
  if (w?.kitchenLevel) kitchenFeats.push(`${w.kitchenLevel} level finishes`);
  (w?.kitchenFeatures ?? []).slice(0, 4).forEach(f => kitchenFeats.push(f));
  rooms.push({
    id: 'kitchen',
    name: "Chef's Kitchen",
    image: getStyleImage('kitchen', style),
    features: kitchenFeats.length > 0
      ? kitchenFeats
      : ['Premium Finishes', 'Waterfall Island', 'Custom Cabinetry', 'Smart Appliances'],
  });

  // Master Suite (always shown)
  const masterFeats: string[] = [
    ...(w?.roomFeatures ?? []).filter(f =>
      ['Walk-in Closet', 'En-suite Bath', 'Balcony Access', 'Vaulted Ceiling', 'Sitting Area', 'Bay Window'].includes(f)
    ),
    ...(w?.bathroomFeatures ?? []).filter(f =>
      ['Walk-in Shower', 'Vessel Sinks', 'Steam Shower', 'Heated Floors', 'Makeup Vanity'].includes(f)
    ).slice(0, 2),
  ].slice(0, 4);
  rooms.push({
    id: 'master',
    name: 'Master Suite',
    image: getStyleImage('master', style),
    features: masterFeats.length > 0
      ? masterFeats
      : ['En-suite Spa Bath', 'Walk-in Closet', 'Vaulted Ceilings', 'Private Balcony'],
  });

  // Living Space (always shown)
  const livingFeats: string[] = [
    ...(w?.interiorDetails ?? []).slice(0, 3),
    ...(w?.roomFeatures ?? []).filter(f =>
      ['Hardwood Floors', 'Ceiling Fan', 'Built-in Shelves'].includes(f)
    ).slice(0, 1),
  ].slice(0, 4);
  rooms.push({
    id: 'living',
    name: 'Great Room',
    image: getStyleImage('living', style),
    features: livingFeats.length > 0
      ? livingFeats
      : ['Open Concept', 'Feature Fireplace', 'Hardwood Floors', 'Crown Molding'],
  });

  // Outdoor Living OR Garage
  const outdoorFeats = w?.outdoorFeatures ?? [];
  if (outdoorFeats.length > 0) {
    rooms.push({
      id: 'outdoor',
      name: 'Outdoor Living',
      image: getStyleImage('outdoor', style),
      features: outdoorFeats.slice(0, 4),
    });
  } else {
    rooms.push({
      id: 'garage',
      name: 'Garage & ADU',
      image: getStyleImage('garage', style),
      features: ['3-Car Capacity', 'EV Charging Ready', 'Upper Level Studio', 'Workshop Area'],
    });
  }

  return rooms;
}

// ─────────────────────────────────────────────
//  Home specs strip
// ─────────────────────────────────────────────

function buildSpecs(project: Project | undefined) {
  const prop = project?.property;
  const wish = project?.wishlist;
  const beforeBeds = prop?.beds ?? 3;
  const beforeBaths = prop?.baths ?? 2;
  const beforeSqft = prop?.sqft ?? 2100;
  const afterBeds = wish?.bedrooms ?? beforeBeds;
  const afterBaths = wish?.bathrooms ?? beforeBaths;
  const afterSqft = beforeSqft + (afterBeds - beforeBeds) * 250 + (afterBaths - beforeBaths) * 100;
  return [
    { label: 'Bedrooms', before: beforeBeds, after: afterBeds, icon: BedDouble },
    { label: 'Bathrooms', before: beforeBaths, after: afterBaths, icon: Bath },
    { label: 'Sq Footage', before: beforeSqft.toLocaleString(), after: afterSqft.toLocaleString(), icon: Ruler },
    { label: 'Garage', before: '2-Car', after: '3-Car + ADU', icon: Car },
  ];
}

// ─────────────────────────────────────────────
//  Monthly payment / savings helpers
// ─────────────────────────────────────────────

const MONTHLY_RATE_30YR = 0.00665; // ≈7% 30yr fixed monthly rate factor

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
}

// ─────────────────────────────────────────────
//  Auth prompt
// ─────────────────────────────────────────────

function DesignPackageAuthPrompt() {
  const auth = useAuthOptional();
  if (!auth?.isConfigured || auth.user) return null;
  return (
    <p className="text-amber-200/90 text-sm mt-2 flex items-center gap-2 flex-wrap">
      Create an account to save your plan on any device. <AuthUI />
    </p>
  );
}

// ─────────────────────────────────────────────
//  Designer Progress Screen
// ─────────────────────────────────────────────

interface ProgressStage {
  text: string;
  duration: number;
}

const PROGRESS_STAGES: ProgressStage[] = [
  { text: 'Analyzing your property data...', duration: 1000 },
  { text: 'Generating floor plan layouts...', duration: 1500 },
  { text: 'Selecting materials based on your preferences...', duration: 1000 },
  { text: 'Building your scope of work...', duration: 1000 },
  { text: 'Finalizing your design package...', duration: 500 },
];

function DesignerProgressScreen() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStageIndex >= PROGRESS_STAGES.length) return;

    const stage = PROGRESS_STAGES[currentStageIndex];
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const stageProgress = Math.min(elapsed / stage.duration, 1);

      // Calculate overall progress (cumulative from previous stages + current stage)
      const completedDuration = PROGRESS_STAGES.slice(0, currentStageIndex).reduce((sum, s) => sum + s.duration, 0);
      const totalDuration = PROGRESS_STAGES.reduce((sum, s) => sum + s.duration, 0);
      const overallProgress = ((completedDuration + stageProgress * stage.duration) / totalDuration) * 100;

      setProgress(Math.min(overallProgress, 100));

      if (stageProgress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCurrentStageIndex(prev => prev + 1);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentStageIndex]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 font-sans text-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Blueprint Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-md w-full px-6 text-center">
        {/* ExpandEase Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-4">
            <span className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} />
              ExpandEase Design Studio
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Generating Your Design
          </h1>
          <p className="text-purple-200/70 text-sm mt-3">
            This usually takes a moment
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 origin-left"
        >
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ width: { duration: 0.2 } }}
            />
          </div>
          <p className="text-xs text-purple-300/70 mt-2 font-mono">
            {Math.round(progress)}%
          </p>
        </motion.div>

        {/* Current Stage Text */}
        <motion.div
          key={currentStageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <p className="text-lg text-white font-medium">
            {currentStageIndex < PROGRESS_STAGES.length
              ? PROGRESS_STAGES[currentStageIndex].text
              : 'Almost ready...'}
          </p>
        </motion.div>

        {/* Animated dots */}
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <motion.div
              key={dot}
              className="w-2 h-2 rounded-full bg-pink-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                delay: dot * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main page
// ─────────────────────────────────────────────

export function DesignPackage() {
  const navigate = useNavigate();
  const projectCtx = useProjectOptional();
  const project = projectCtx?.project;

  // ── ALL hooks MUST be above any conditional return ──
  const [designReady, setDesignReady] = useState(false);
  const [showTaxBenefits, setShowTaxBenefits] = useState(true);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(true);
  const [showCADModal, setShowCADModal] = useState(false);

  const projectName = useMemo(() => {
    if (!project?.property?.address) return 'The Smith Residence';
    const firstPart = project.property.address.split(',')[0]?.trim() || project.property.address;
    return firstPart ? `${firstPart} Residence` : 'Your Residence';
  }, [project?.property?.address]);

  const rooms = useMemo(() => buildDynamicRooms(project), [project]);
  const specs = useMemo(() => buildSpecs(project), [project]);

  // Financials
  const totalCost = project?.financial?.totalCost ?? 415000;
  const totalValue = project?.financial?.totalValue ?? 1_650_000;
  const equityCreated = totalValue - totalCost;
  const roiPercent = totalCost > 0 ? Math.round((totalValue / totalCost) * 100) : 0;
  useMilestoneConfetti(equityCreated, roiPercent);

  const spaceAdded = project?.property && project?.wishlist
    ? Math.max(0,
        ((project.wishlist.bedrooms ?? 0) - (project.property.beds ?? 0)) * 250 +
        ((project.wishlist.bathrooms ?? 0) - (project.property.baths ?? 0)) * 100
      )
    : 1750;

  const renoMonthly = Math.round(totalCost * MONTHLY_RATE_30YR);
  const existingMonthly = project?.financial?.currentMonthlyPayment ?? 2200;
  const newMonthly = existingMonthly + renoMonthly;
  const taxSavings = calculateTaxSavings(totalCost, totalValue, SECOND_LIEN_RATE_ANNUAL, project?.onboarding?.income);
  const taxAdjustedPayment = newMonthly - taxSavings.totalTaxSavings;
  const comparableMonthly = Math.round(totalValue * MONTHLY_RATE_30YR);
  const displayPayment = showTaxBenefits ? taxAdjustedPayment : newMonthly;
  const displaySavings = Math.max(0, comparableMonthly - displayPayment);

  // Simulate design generation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDesignReady(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // ── Early return AFTER all hooks ──
  if (!designReady) {
    return <DesignerProgressScreen />;
  }

  const projectIdShort = project?.meta?.projectId
    ? project.meta.projectId.replace(/^EXP-/, '').slice(0, 8) + '-B'
    : '8492-B';

  const nextRoom = () => setActiveRoomIndex(prev => (prev + 1) % rooms.length);
  const prevRoom = () => setActiveRoomIndex(prev => (prev - 1 + rooms.length) % rooms.length);

  const activeRoom = rooms[activeRoomIndex];

  // Intelligent timeline estimates based on project scope
  const estimatedMonths = totalCost > 300000 ? '8–12' : totalCost > 150000 ? '5–8' : '3–5';

  const DESIGN_TOC: TocItem[] = [
    { id: 'design-journey', label: 'Your Journey', icon: FileCheck },
    { id: 'specs-strip', label: 'Home Specs' },
    { id: 'visuals', label: 'Visual Preview', icon: Layers },
    { id: 'rooms', label: 'Room Explorer' },
    { id: 'design-compare', label: 'Renovate vs. Buy', icon: Home },
    { id: 'design-breakdown', label: 'Cost Breakdown', icon: Calculator },
    { id: 'trust', label: 'Trust Indicators', icon: Shield },
    { id: 'design-next', label: "You're Ready", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 font-sans text-white relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <TableOfContents items={DESIGN_TOC} accent="pink" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles size={12} />
                Your Custom Design
              </span>
              <span className="text-purple-300 text-sm font-medium">Project #{projectIdShort}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              {projectName}
            </h1>
            <p className="text-base md:text-lg text-purple-200/80 max-w-2xl leading-relaxed">
              Your custom expansion is ready. More space, more value, same neighborhood—designed specifically for your family's needs.
            </p>
            {project?.wishlist?.aiStyleTagline && (
              <p className="mt-2 text-sm text-pink-300/80 flex items-center gap-1.5">
                <Sparkles size={12} />
                "{project.wishlist.aiStyleTagline}"
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={() => navigate('/analysis')}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={16} /> Back to Analysis
            </motion.button>
            <motion.button
              type="button"
              onClick={() => navigate('/contractor-review')}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium hover:scale-105 active:scale-95"
            >
              <Share2 size={16} /> Share with Contractor
            </motion.button>
            <div className="flex flex-col items-center gap-0.5">
              <motion.button
                type="button"
                onClick={() => setShowCADModal(true)}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold transition-all text-sm shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95"
              >
                <Sparkles size={18} /> Upgrade to 3D CAD
              </motion.button>
              <span className="text-emerald-400/60 text-[9px] font-semibold">${(CAD_PACKAGE_US_PRICE_HIGH / 1000).toFixed(0)}K+ Value</span>
            </div>
          </div>
          <DesignPackageAuthPrompt />
        </motion.header>

        {/* ── Journey Progress Timeline ── */}
        <motion.section
          id="design-journey"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 md:p-6">
            <p className="text-purple-300/70 text-xs font-bold uppercase tracking-wider mb-4">Your Journey</p>

            {/* High-level phases */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { label: 'Analysis', sub: 'Feasibility & numbers', done: true },
                { label: 'Summary', sub: 'Shared with spouse', done: true },
                { label: 'Design Package', sub: 'You are here', done: false, active: true },
                { label: 'Build', sub: 'Contractor takes over', done: false },
              ].map((phase, idx) => (
                <div
                  key={phase.label}
                  className={`relative p-3 rounded-xl text-center ${
                    phase.active
                      ? 'bg-pink-500/15 border border-pink-500/30'
                      : phase.done
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      phase.done ? 'bg-emerald-500 text-white' : phase.active ? 'bg-pink-500 text-white' : 'bg-white/20 text-white/50'
                    }`}>
                      {phase.done ? '✓' : idx + 1}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold ${phase.active ? 'text-pink-300' : phase.done ? 'text-emerald-300' : 'text-white/50'}`}>{phase.label}</p>
                  <p className="text-[10px] text-purple-300/50 mt-0.5">{phase.sub}</p>
                </div>
              ))}
            </div>

            {/* Design phase detail steps */}
            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-3 font-semibold">Design Phase Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { step: 'Property Analysis', time: '~1 day', done: true },
                { step: 'Floor Plan Layout', time: '~3 days', done: true },
                { step: 'Material Selection', time: '~2 days', active: true },
                { step: 'Scope of Work', time: '~3 days', done: false },
                { step: 'Cost Validation', time: '~2 days', done: false },
              ].map((s) => (
                <div key={s.step} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  s.active ? 'bg-pink-500/10 border border-pink-500/20' : s.done ? 'bg-white/5' : 'bg-white/[0.02]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    s.done ? 'bg-emerald-400' : s.active ? 'bg-pink-400 animate-pulse' : 'bg-white/20'
                  }`} />
                  <div>
                    <p className={`text-[10px] font-medium ${s.done ? 'text-emerald-300/80' : s.active ? 'text-pink-300' : 'text-white/40'}`}>{s.step}</p>
                    <p className="text-[9px] text-purple-300/40">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-purple-300/40 text-[10px] mt-3 text-center">
              Design phase timelines are estimates based on your project scope. Total estimated project duration: {estimatedMonths} months†
            </p>
          </div>
        </motion.section>

        {/* ── Tax-adjusted view toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-8"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTaxBenefits(!showTaxBenefits)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showTaxBenefits ? 'bg-emerald-500' : 'bg-white/20'}`}
              aria-label="Toggle tax benefits"
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showTaxBenefits ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-purple-200/80 text-xs font-medium">
              {showTaxBenefits ? 'Showing tax-adjusted payments' : 'Showing pre-tax payments'}
            </span>
          </div>
          <span className="text-purple-400/50 text-[10px] max-w-[260px] text-right leading-tight">
            {showTaxBenefits ? 'Annual deductions shown as monthly equivalent. Consult a tax professional.' : ''}
          </span>
        </motion.div>

        {/* ── Home Specs Strip ── */}
        <motion.section
          id="specs-strip"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {specs.map((spec, idx) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + idx * 0.06 }}
                className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 md:p-5 text-center shadow-xl shadow-black/10 overflow-hidden hover:bg-white/15 transition-all cursor-pointer group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] md:text-xs text-purple-200 uppercase tracking-wider font-semibold mb-2 relative z-10">
                  {spec.label}
                </p>
                <div className="flex items-center justify-center gap-2.5 relative z-10">
                  <div className="p-2 rounded-lg bg-pink-500/20 text-pink-300 flex-shrink-0">
                    <spec.icon size={16} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-gray-400 text-xs line-through">{spec.before}</span>
                      <ArrowRight size={10} className="text-purple-400" />
                      <span className="text-white font-bold text-lg">{spec.after}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Visual Preview ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          id="visuals"
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Your Proposed Home</h2>
              <p className="text-sm text-purple-200/70">Preview your expansion from every angle</p>
            </div>
            <motion.button
              type="button"
              onClick={() => setShowBlueprint(true)}
              whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-200 text-sm font-medium transition-all"
            >
              <Layers size={16} /> View Blueprints
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[520px]">
            {/* Main elevation */}
            <div className="md:col-span-2 relative group overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-black/20">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
                alt="Front Elevation"
                className="w-full h-64 md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Watermark overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px]">
                <div className="text-center">
                  <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">CONCEPTUAL PREVIEW</h3>
                  <p className="text-white/80 text-sm">Final renderings included with Design Package</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-5 md:p-6 relative z-10">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                  Main View
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Front Elevation</h3>
                <p className="text-gray-300 text-sm">
                  {project?.wishlist?.homeStyle ?? 'Modern'} craftsman style with expanded facade
                </p>
              </div>
            </div>

            {/* Side stack */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 relative group overflow-hidden rounded-2xl border border-white/10 shadow-xl min-h-[160px]">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
                  alt="Rear Profile"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px]">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-white mb-1">CONCEPTUAL PREVIEW</h4>
                    <p className="text-white/70 text-xs">Final renderings included with Design Package</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-4 relative z-10">
                  <h3 className="font-bold text-white">Rear Profile</h3>
                  <p className="text-gray-300 text-xs">Expanded living space</p>
                </div>
              </div>

              <button
                onClick={() => setShowBlueprint(true)}
                className="flex-1 relative group overflow-hidden rounded-2xl border border-blue-400/40 shadow-xl bg-gradient-to-br from-blue-900/60 to-blue-800/40 hover:from-blue-900/70 hover:to-blue-800/50 transition-all min-h-[140px]"
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                  <div className="w-11 h-11 rounded-full bg-blue-500/30 flex items-center justify-center border border-blue-400/50 group-hover:scale-110 transition-transform">
                    <Layers className="text-blue-200" size={22} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-blue-100 text-sm">View Blueprints</h3>
                    <p className="text-blue-300/70 text-xs">Floor plans & layouts</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </motion.section>

        {/* ── Room Explorer (no finishes picker) ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          id="rooms"
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Walk Through Your Future Home</h2>
              <p className="text-sm text-purple-200/70">
                Every room, every finish — designed around your family's life
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {rooms.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveRoomIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    activeRoomIndex === idx ? 'bg-pink-500 w-6' : 'bg-white/30 hover:bg-white/50 w-2'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
            {/* Room tabs */}
            <div className="flex overflow-x-auto border-b border-white/10 no-scrollbar">
              {rooms.map((room, idx) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomIndex(idx)}
                  className={`flex-1 min-w-[100px] px-4 py-4 text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeRoomIndex === idx
                      ? 'bg-white/10 text-white border-b-2 border-pink-500'
                      : 'text-purple-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            {/* Room content */}
            <div className="grid md:grid-cols-2 min-h-[480px]">
              {/* Image */}
              <div className="relative h-56 md:h-auto overflow-hidden bg-black/20">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeRoom.id}
                    src={activeRoom.image}
                    alt={activeRoom.name}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium">
                  {activeRoomIndex + 1} / {rooms.length}
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={prevRoom}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                    aria-label="Previous room"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextRoom}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                    aria-label="Next room"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Content — features only (no finishes) */}
              <div className="p-6 md:p-7 flex flex-col overflow-y-auto max-h-[600px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeRoom.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col"
                  >
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                      {activeRoom.name}
                    </h3>
                    <p className="text-purple-200/80 mb-5 text-sm">
                      {activeRoom.id === 'kitchen'
                        ? `${project?.wishlist?.kitchenLevel ?? 'Premium'} kitchen with ${activeRoom.features.length} custom features`
                        : activeRoom.id === 'master'
                        ? `Your private retreat — ${activeRoom.features.length} luxury features selected`
                        : activeRoom.id === 'living'
                        ? `Expanded great room with ${activeRoom.features.length} interior upgrades`
                        : `Outdoor living and curb appeal upgrades`}
                    </p>

                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
                      Included Features
                    </h4>
                    <ul className="space-y-2.5">
                      {activeRoom.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 text-gray-100 text-sm"
                        >
                          <div className="p-1.5 rounded-full bg-pink-500/20 text-pink-400 flex-shrink-0">
                            <CheckCircle2 size={13} />
                          </div>
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Renovate vs. Buy comparison ── */}
        <motion.section
          id="design-compare"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md rounded-2xl border border-emerald-500/20 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex-1">
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Home size={12} />
                  Why expand vs. buying a new home?
                </p>
                <h3 className="text-white font-bold text-lg mb-1">
                  You'd spend {fmtUSD(totalValue)} to move — or ${totalCost < 1 ? '—' : Math.round(totalCost / 1000) + 'K'} to stay and build your dream.
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  A comparable {(project?.wishlist?.bedrooms ?? 5)}-bed, {(project?.wishlist?.bathrooms ?? 4)}-bath home in your area would cost {fmtUSD(totalValue)} at 7% — without your custom finishes, your neighborhood, or your memories.
                </p>
              </div>
              <div className="flex gap-4 md:gap-6 shrink-0">
                <div className="text-center px-4 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Agent + Closing Costs</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400">$115K</p>
                  <p className="text-emerald-400/60 text-[10px]">you avoid paying</p>
                </div>
                <div className="text-center px-4 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Monthly Savings{showTaxBenefits ? '*' : ''}</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400">
                    ${displaySavings.toLocaleString()}
                  </p>
                  <p className="text-emerald-400/60 text-[10px]">
                    ${Math.round(displaySavings * 60 / 1000)}K saved over 5 years
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Itemized Cost Breakdown ── */}
        <motion.section
          id="design-breakdown"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 md:p-6">
            <ItemizedBill />
          </div>
        </motion.section>

        {/* ── Trust Indicators ── */}
        <motion.section
          id="trust"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: CheckCircle2, label: 'Fixed-Price SOW†', sub: 'Confirmed after site visit' },
              { icon: Clock, label: `${estimatedMonths} Month Est.†`, sub: 'Based on projects like yours' },
              { icon: TrendingUp, label: 'Borrow on Completed Value', sub: 'Finance the after value' },
              { icon: Shield, label: 'Clear SOW', sub: 'No hidden costs' },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 flex-shrink-0">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-purple-300/60 text-[10px]">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Next Steps / CTA ── */}
        <motion.section
          id="design-next"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-5 md:p-6">
            <div
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setShowNextSteps(!showNextSteps)}
            >
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-400" />
                  You're Ready to Build
                </h3>
                <p className="text-purple-200/70 text-sm">Your design is locked — here's how we make it real</p>
              </div>
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <ChevronDown
                  size={20}
                  className={`text-white transition-transform ${showNextSteps ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            <AnimatePresence>
              {showNextSteps && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                    {[
                      { step: '1', title: 'Send to Contractor', desc: 'Share this SOW — contractor reviews, visits your home, and confirms final pricing', time: 'This week', active: true },
                      { step: '2', title: 'Pull Permits', desc: 'ExpandEase manages city submission and approvals', time: `${totalCost > 200000 ? '6–10' : '4–6'} wks est.`, active: false },
                      { step: '3', title: 'Build It', desc: 'Vetted crew executes to spec — milestone payments, no surprises', time: `${totalCost > 300000 ? '6–9' : totalCost > 150000 ? '3–6' : '2–4'} months est.`, active: false },
                      { step: '4', title: 'Live in It', desc: 'Certificate of Occupancy, final walkthrough, keys in hand', time: `Month ${totalCost > 300000 ? '10–14' : totalCost > 150000 ? '6–10' : '4–7'}`, active: false },
                    ].map(step => (
                      <div
                        key={step.step}
                        className={`relative p-4 rounded-xl border ${
                          step.active ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              step.active ? 'bg-pink-500 text-white' : 'bg-white/20 text-white/70'
                            }`}
                          >
                            {step.step}
                          </span>
                          <span className="text-[10px] text-purple-300 uppercase tracking-wider">
                            {step.time}
                          </span>
                        </div>
                        <h4 className={`font-bold text-sm ${step.active ? 'text-white' : 'text-white/90'}`}>
                          {step.title}
                        </h4>
                        <p className="text-purple-200/60 text-xs mt-1">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
              <button
                onClick={() => navigate('/contractor-review')}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <HardHat size={18} /> Send to Contractor
              </button>
              <button className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all flex items-center justify-center gap-2">
                <Download size={18} /> Save PDF
              </button>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-6 border-t border-white/10"
        >
          <p className="text-purple-300/60 text-sm">
            Questions? Call us at{' '}
            <a href="tel:1-800-EXPAND" className="text-purple-300 hover:text-white transition-colors">
              1-800-EXPAND
            </a>{' '}
            or{' '}
            <button className="text-purple-300 hover:text-white underline transition-colors">
              schedule a call
            </button>
          </p>
        </motion.footer>
      </div>

      {/* ── Blueprint Modal ── */}
      <AnimatePresence>
        {showBlueprint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowBlueprint(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-[#0f172a] border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-4 border-b border-blue-500/20 bg-blue-900/20">
                <div className="flex items-center gap-2">
                  <Layers className="text-blue-400" size={20} />
                  <h3 className="text-blue-100 font-bold">Schematic Floor Plan</h3>
                </div>
                <button
                  onClick={() => setShowBlueprint(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative h-[600px] bg-[#0B1121] p-8 overflow-auto flex items-center justify-center">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(#1e3a8a 1px, transparent 1px),
                      linear-gradient(90deg, #1e3a8a 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />
                <div className="relative border-2 border-blue-500/50 p-12 rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 -mb-1 -mr-1" />
                  <div className="text-center space-y-4">
                    <Layers size={64} className="mx-auto text-blue-500/50" />
                    <div>
                      <h4 className="text-2xl font-bold text-blue-200">Blueprint View</h4>
                      <p className="text-blue-400/60">Schematic layout generated from your inputs</p>
                    </div>
                    <div className="flex gap-4 justify-center mt-8">
                      <div className="px-4 py-2 border border-blue-500/30 rounded text-blue-300 text-sm">
                        Total: {(
                          (project?.property?.sqft ?? 2100) +
                          spaceAdded
                        ).toLocaleString()} sqft
                      </div>
                      <div className="px-4 py-2 border border-blue-500/30 rounded text-blue-300 text-sm">
                        Scale: 1/4" = 1'
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex gap-2">
                  <button className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-colors">
                    <Maximize2 size={20} />
                  </button>
                  <button className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-colors">
                    <Download size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footnotes */}
      <div className="flex flex-col items-center gap-2 mt-4 mb-2 px-4">
        {showTaxBenefits && (
          <p className="text-gray-500 text-[10px] text-center max-w-lg">
            * Tax-adjusted amounts reflect estimated annual deductions at your {formatTaxBracket(project?.onboarding?.income)} federal bracket, displayed as a monthly equivalent. Lender qualification uses the pre-tax payment of {fmtUSD(newMonthly)}/mo.
          </p>
        )}
        <p className="text-gray-600 text-[10px] text-center max-w-lg">
          † All costs, timelines, and scope of work are estimates based on similar projects in your area. Final pricing and schedule are confirmed by your licensed contractor after an on-site evaluation. Every home has unique conditions — we give you the most accurate planning data available, and your contractor will refine it.
        </p>
      </div>

      <CADCheckoutModal isOpen={showCADModal} onClose={() => setShowCADModal(false)} />
    </div>
  );
}

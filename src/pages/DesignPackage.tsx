import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProjectOptional } from '../context/ProjectContext';
import { CADCheckoutModal } from '../components/CADCheckoutModal';
import { ValueWithPop } from '../components/ui/ValueWithPop';
import { useMilestoneConfetti } from '../hooks/useMilestoneConfetti';
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
  FileText,
  Calculator,
  HardHat,
  Clock,
  Users,
  Shield,
  MessageSquare,
  ChevronDown,
  Sparkles,
  TrendingUp
} from 'lucide-react';
// --- Types ---
interface RoomData {
  id: string;
  name: string;
  image: string;
  features: string[];
}
// --- Data ---
const ROOMS: RoomData[] = [
  {
    id: 'master',
    name: 'Master Suite',
    image:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Vaulted Ceilings',
      'Walk-in Closet',
      'En-suite Spa Bath',
      'Private Balcony Access']

  },
  {
    id: 'kitchen',
    name: "Chef's Kitchen",
    image:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Waterfall Island',
      'Custom Cabinetry',
      'Smart Appliances',
      "Butler's Pantry"]

  },
  {
    id: 'greatroom',
    name: 'Great Room',
    image:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Floor-to-Ceiling Windows',
      'Feature Fireplace',
      'Open Concept',
      'Hardwood Floors']

  },
  {
    id: 'garage',
    name: 'Garage & ADU',
    image:
      'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=80',
    features: [
      '3-Car Capacity',
      'EV Charging',
      'Upper Level Studio',
      'Workshop Area']

  }];

function buildSpecs(project: { property?: { beds?: number; baths?: number; sqft?: number }; wishlist?: { bedrooms?: number; bathrooms?: number } }) {
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
    { label: 'Garage', before: '2-Car', after: '3-Car + ADU', icon: Car }
  ];
}

export function DesignPackage() {
  const navigate = useNavigate();
  const projectCtx = useProjectOptional();
  const project = projectCtx?.project;
  const projectName = useMemo(() => {
    if (!project?.property?.address) return 'The Smith Residence';
    const addr = project.property.address;
    const firstPart = addr.split(',')[0]?.trim() || addr;
    return firstPart ? `${firstPart} Residence` : 'Your Residence';
  }, [project?.property?.address]);
  const projectIdShort = project?.meta?.projectId ? project.meta.projectId.replace(/^EXP-/, '').slice(0, 8) + '-B' : '8492-B';
  const specs = useMemo(() => buildSpecs(project ?? {}), [project]);
  const totalCost = project?.financial?.totalCost ?? 415000;
  const totalValue = project?.financial?.totalValue ?? 1650000;
  const equityCreated = totalValue - totalCost;
  const roiPercent = totalCost > 0 ? Math.round((totalValue / totalCost) * 100) : 0;
  useMilestoneConfetti(equityCreated, roiPercent);
  const spaceAdded = project?.property && project?.wishlist
    ? Math.max(0, ((project.wishlist.bedrooms ?? 0) - (project.property.beds ?? 0)) * 250 + ((project.wishlist.bathrooms ?? 0) - (project.property.baths ?? 0)) * 100)
    : 1750;
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [showCADModal, setShowCADModal] = useState(false);
  const nextRoom = () => setActiveRoomIndex((prev) => (prev + 1) % ROOMS.length);
  const prevRoom = () =>
    setActiveRoomIndex((prev) => (prev - 1 + ROOMS.length) % ROOMS.length);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

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
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* --- Progress Stepper --- */}
        <div className="mb-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { id: 'property', label: 'Property', icon: Home, status: 'completed' },
              { id: 'goals', label: 'Goals', icon: Sparkles, status: 'completed' },
              { id: 'finances', label: 'Finances', icon: Calculator, status: 'completed' },
              { id: 'design', label: 'Design', icon: FileText, status: 'current' },
              { id: 'build', label: 'Build', icon: HardHat, status: 'upcoming' }
            ].map((step, idx, arr) => (
              <React.Fragment key={step.id}>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${step.status === 'completed'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : step.status === 'current'
                          ? 'bg-white text-purple-900 shadow-lg shadow-white/20 ring-4 ring-white/20'
                          : 'bg-white/10 text-purple-300 border border-white/20'
                      }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${step.status === 'current' ? 'text-white' : 'text-purple-300'
                      }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
                {idx < arr.length - 1 && (
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-purple-400/30 mx-2 md:mx-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* --- Header --- */}
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
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={() => navigate('/contractor-review')}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium hover:scale-105 active:scale-95"
            >
              <Share2 size={16} /> Share with Contractor
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setShowCADModal(true)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold transition-all text-sm shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95"
            >
              <Sparkles size={18} /> Upgrade to 3D CAD
            </motion.button>
          </div>
        </motion.header>

        {/* --- Key Metrics Strip --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
        >
          {[
            { label: 'Equity Created', valueNode: <ValueWithPop value={equityCreated} format="currency" prefix="+" className="text-emerald-400" />, sub: 'instant value add', valueClass: 'text-emerald-400', subClass: 'text-emerald-300/70', trend: '+18%' },
            { label: 'Projected Value', value: totalValue >= 1e6 ? `$${(totalValue / 1e6).toFixed(2)}M` : `$${(totalValue / 1000).toFixed(0)}K`, sub: 'after completion', valueClass: 'text-white', subClass: 'text-purple-300/70' },
            { label: 'Space Added', value: `+${spaceAdded.toLocaleString()}`, unit: ' sq ft', sub: 'more space', valueClass: 'text-amber-300', subClass: 'text-amber-200/70' },
            { label: 'Monthly Savings', value: '$4,885', sub: 'vs. buying new', valueClass: 'text-emerald-400', subClass: 'text-emerald-300/70', highlight: true }
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
              className={`relative bg-white/10 backdrop-blur-md rounded-2xl border p-4 md:p-5 text-center shadow-xl shadow-black/10 overflow-hidden group hover:bg-white/15 transition-all cursor-pointer ${kpi.highlight ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/20'
                }`}
            >
              {kpi.highlight && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
              )}
              <p className="text-[10px] md:text-xs text-purple-200 uppercase tracking-wider font-semibold mb-1">{kpi.label}</p>
              <div className="flex items-baseline justify-center gap-1">
                <p className={`text-2xl md:text-3xl font-bold tabular-nums ${kpi.valueClass}`}>{'valueNode' in kpi && kpi.valueNode != null ? kpi.valueNode : kpi.value}</p>
                {kpi.unit && <span className="text-sm text-amber-200/60">{kpi.unit}</span>}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                {kpi.trend && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <TrendingUp size={10} /> {kpi.trend}
                  </span>
                )}
                <p className={`text-[10px] ${kpi.subClass}`}>{kpi.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* --- Visual Preview Section --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-200 text-sm font-medium transition-all"
            >
              <Layers size={16} /> View Blueprints
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[520px]">
            {/* Main Front Elevation */}
            <div className="md:col-span-2 relative group overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-black/20">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
                alt="Front Elevation"
                className="w-full h-64 md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-5 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                    Main View
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Front Elevation</h3>
                <p className="text-gray-300 text-sm">Modern craftsman style with expanded facade</p>
              </div>
            </div>

            {/* Side Stack */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 relative group overflow-hidden rounded-2xl border border-white/10 shadow-xl min-h-[160px]">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
                  alt="Rear Profile"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <h3 className="font-bold text-white">Rear Profile</h3>
                  <p className="text-gray-300 text-xs">Expanded living space</p>
                </div>
              </div>

              {/* Blueprint Button */}
              <button
                onClick={() => setShowBlueprint(true)}
                className="flex-1 relative group overflow-hidden rounded-2xl border border-blue-400/40 shadow-xl bg-gradient-to-br from-blue-900/60 to-blue-800/40 hover:from-blue-900/70 hover:to-blue-800/50 transition-all min-h-[140px]"
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
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

        {/* --- Room Explorer Section --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          id="rooms"
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Explore Your Spaces</h2>
              <p className="text-sm text-purple-200/70">Click through to see each room's features</p>
            </div>
            {/* Room Navigation Dots */}
            <div className="hidden md:flex items-center gap-2">
              {ROOMS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveRoomIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${activeRoomIndex === idx ? 'bg-pink-500 w-6' : 'bg-white/30 hover:bg-white/50'
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-white/10 no-scrollbar">
              {ROOMS.map((room, idx) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomIndex(idx)}
                  className={`flex-1 min-w-[100px] px-4 py-4 text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeRoomIndex === idx
                      ? 'bg-white/10 text-white border-b-2 border-pink-500'
                      : 'text-purple-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            {/* Slider Content */}
            <div className="grid md:grid-cols-2 min-h-[380px] md:min-h-[420px]">
              {/* Image Area */}
              <div className="relative h-56 md:h-auto overflow-hidden bg-black/20">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={ROOMS[activeRoomIndex].id}
                    src={ROOMS[activeRoomIndex].image}
                    alt={ROOMS[activeRoomIndex].name}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Room Counter Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium">
                  {activeRoomIndex + 1} / {ROOMS.length}
                </div>

                {/* Controls */}
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

              {/* Content Area */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={ROOMS[activeRoomIndex].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {ROOMS[activeRoomIndex].name}
                    </h3>
                    <p className="text-purple-200/80 mb-6 text-sm md:text-base">
                      Premium finishes and thoughtful design details
                    </p>

                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-4">
                      Included Features
                    </h4>
                    <ul className="space-y-3">
                      {ROOMS[activeRoomIndex].features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 text-gray-100 text-sm md:text-base"
                        >
                          <div className="p-1.5 rounded-full bg-pink-500/20 text-pink-400 flex-shrink-0">
                            <CheckCircle2 size={14} />
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

        {/* --- Project Details Section --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          id="details"
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Project Details</h2>
              <p className="text-sm text-purple-200/70">Specifications and financial breakdown</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Specs Grid */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 md:p-6">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Ruler size={18} className="text-purple-300" />
                Home Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {specs.map((spec, idx) => (
                  <motion.div
                    key={spec.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/5 rounded-xl p-3.5 border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                        <spec.icon size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-300 uppercase tracking-wider">{spec.label}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-xs line-through">{spec.before}</span>
                          <ArrowRight size={10} className="text-purple-400" />
                          <span className="text-white font-bold text-base">{spec.after}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Financial Impact Card */}
            <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/30 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-5 md:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />

              <div className="relative z-10">
                <h3 className="text-emerald-300 font-bold uppercase tracking-wider text-sm mb-5 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Financial Impact
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Construction Cost</p>
                    <p className="text-xl font-mono font-bold text-white">${(totalCost / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">New Home Value</p>
                    <p className="text-xl font-mono font-bold text-white">{totalValue >= 1e6 ? `$${(totalValue / 1e6).toFixed(2)}M` : `$${(totalValue / 1000).toFixed(0)}K`}</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                    <p className="text-emerald-400/80 text-[10px] uppercase tracking-wider">Equity Created</p>
                    <p className="text-xl font-mono font-bold text-emerald-400">+${(equityCreated / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">New Payment</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-gray-500 font-mono text-xs line-through">$2,200</span>
                      <span className="text-white font-mono font-bold text-lg">$3,865</span>
                    </div>
                  </div>
                </div>

                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Start Construction
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* --- Comparison Section --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md rounded-2xl border border-emerald-500/20 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex-1">
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Home size={12} />
                  vs. Buying a Comparable Home
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  A 5-bed, 4.5-bath, 3,850 sqft home in Phoenix lists at ~$1.65M with a 7% mortgage ($8,750/mo) plus $115K in agent fees and closing costs.
                </p>
              </div>
              <div className="flex gap-4 md:gap-6 shrink-0">
                <div className="text-center px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Upfront Savings</p>
                  <p className="text-xl font-mono font-bold text-emerald-400">$115K</p>
                  <p className="text-emerald-400/60 text-[10px]">no moving costs</p>
                </div>
                <div className="text-center px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Monthly Savings</p>
                  <p className="text-xl font-mono font-bold text-emerald-400">$4,885</p>
                  <p className="text-emerald-400/60 text-[10px]">$293K over 5 yrs</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* --- Trust Indicators --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: CheckCircle2, label: 'Fixed-Price Scope', sub: 'Locked before work starts' },
              { icon: Clock, label: '6-Month Timeline', sub: 'From permit to move-in' },
              { icon: TrendingUp, label: 'Borrow on Completed Value', sub: 'Finance the after value' },
              { icon: Shield, label: 'Clear SOW', sub: 'No hidden costs' }
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.05 }}
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

        {/* --- Next Steps Section --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowNextSteps(!showNextSteps)}>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-400" />
                  What Happens Next?
                </h3>
                <p className="text-purple-200/70 text-sm">Your path from design to dream home</p>
              </div>
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <ChevronDown size={20} className={`text-white transition-transform ${showNextSteps ? 'rotate-180' : ''}`} />
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
                      { step: '1', title: 'Finalize Design', desc: 'Review with architect', time: '1 week', active: true },
                      { step: '2', title: 'Get Permits', desc: 'City approvals', time: '4-6 weeks', active: false },
                      { step: '3', title: 'Construction', desc: 'Build your expansion', time: '4 months', active: false },
                      { step: '4', title: 'Move In', desc: 'Enjoy your new space', time: 'Month 6', active: false }
                    ].map((step, idx) => (
                      <div key={step.step} className={`relative p-4 rounded-xl border ${step.active ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.active ? 'bg-pink-500 text-white' : 'bg-white/20 text-white/70'}`}>
                            {step.step}
                          </span>
                          <span className="text-[10px] text-purple-300 uppercase tracking-wider">{step.time}</span>
                        </div>
                        <h4 className={`font-bold text-sm ${step.active ? 'text-white' : 'text-white/90'}`}>{step.title}</h4>
                        <p className="text-purple-200/60 text-xs mt-1">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showNextSteps && (
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => navigate('/contractor-review')}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <HardHat size={18} /> Create Final SOW
                </button>
                <button className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all flex items-center justify-center gap-2">
                  <MessageSquare size={18} /> Ask a Question
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {/* --- Footer CTA --- */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center py-6 border-t border-white/10"
        >
          <p className="text-purple-300/60 text-sm">
            Questions? Call us at <a href="tel:1-800-EXPAND" className="text-purple-300 hover:text-white transition-colors">1-800-EXPAND</a> or <button className="text-purple-300 hover:text-white underline transition-colors">schedule a call</button>
          </p>
        </motion.footer>
      </div>

      {/* --- Blueprint Modal --- */}
      <AnimatePresence>
        {showBlueprint &&
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              exit={{
                opacity: 0
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowBlueprint(false)} />

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95
              }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              exit={{
                opacity: 0,
                scale: 0.95
              }}
              className="relative w-full max-w-5xl bg-[#0f172a] border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">

              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b border-blue-500/20 bg-blue-900/20">
                <div className="flex items-center gap-2">
                  <Layers className="text-blue-400" size={20} />
                  <h3 className="text-blue-100 font-bold">
                    Schematic Floor Plan
                  </h3>
                </div>
                <button
                  onClick={() => setShowBlueprint(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">

                  <X size={20} />
                </button>
              </div>

              {/* Modal Content - Blueprint View */}
              <div className="relative h-[600px] bg-[#0B1121] p-8 overflow-auto flex items-center justify-center">
                {/* Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(#1e3a8a 1px, transparent 1px),
                      linear-gradient(90deg, #1e3a8a 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }} />


                {/* Placeholder Blueprint Graphic */}
                <div className="relative border-2 border-blue-500/50 p-12 rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 -mb-1 -mr-1"></div>

                  <div className="text-center space-y-4">
                    <Layers size={64} className="mx-auto text-blue-500/50" />
                    <div>
                      <h4 className="text-2xl font-bold text-blue-200">
                        Blueprint View
                      </h4>
                      <p className="text-blue-400/60">
                        Schematic layout generated from your inputs
                      </p>
                    </div>
                    <div className="flex gap-4 justify-center mt-8">
                      <div className="px-4 py-2 border border-blue-500/30 rounded text-blue-300 text-sm">
                        Total: 3,850 sqft
                      </div>
                      <div className="px-4 py-2 border border-blue-500/30 rounded text-blue-300 text-sm">
                        Scale: 1/4" = 1'
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Controls */}
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
        }
      </AnimatePresence>

      <CADCheckoutModal isOpen={showCADModal} onClose={() => setShowCADModal(false)} />
    </div>);

}
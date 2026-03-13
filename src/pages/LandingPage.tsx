import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WaitlistSection } from '../components/landing/WaitlistSection';
import { AuthUI } from '../components/AuthUI';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../context/OnboardingContext';
import { useProjectOptional } from '../context/ProjectContext';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';
import { TableOfContents } from '../components/ui/TableOfContents';
import type { TocItem } from '../components/ui/TableOfContents';
import { usePropertyData } from '../hooks/usePropertyData';
import {
  CAD_PACKAGE_PRICE,
  CAD_PACKAGE_US_PRICE_HIGH,
  ANALYSIS_MARKET_VALUE,
} from '../config/renovationDefaults';
import {
  MapPin,
  ArrowRight,
  TrendingUp,
  Home,
  DollarSign,
  Shield,
  Star,
  Zap,
  Building2,
  Calendar,
  X,
  Check,
  MessageSquare,
  Gift,
} from 'lucide-react';

const RENOVATION_SCENARIOS = [
  {
    title: "Luxury Kitchen Overhaul",
    location: "Scottsdale, AZ",
    invested: "$120K",
    valueAdded: "$195K",
    equityGain: "+$75K",
    rateSaved: "Kept 3.1% rate",
    moveCostAvoided: "$52K",
    icon: "kitchen",
  },
  {
    title: "Master Suite + ADU Addition",
    location: "Phoenix, AZ",
    invested: "$280K",
    valueAdded: "$450K",
    equityGain: "+$170K",
    rateSaved: "Kept 2.9% rate",
    moveCostAvoided: "$68K",
    icon: "suite",
  },
  {
    title: "Full Gut Remodel",
    location: "Tempe, AZ",
    invested: "$350K",
    valueAdded: "$560K",
    equityGain: "+$210K",
    rateSaved: "Kept 3.4% rate",
    moveCostAvoided: "$74K",
    icon: "remodel",
  }
];

const TRUST_LOGOS = [
  "Fixed-Price SOW*",
  "Borrow on Completed Value",
  "Keep Your Low Rate",
  "Licensed & Insured Contractors",
  "Integrated Permitting",
];

const STATS = [
  { value: "Future Value", label: "Borrow on Completed Value", icon: TrendingUp },
  { value: "Stay Put", label: "Keep Your Low Rate", icon: Home },
  { value: "Real-Time Estimates", label: "See the Numbers First", icon: Star },
  { value: "Your Timeline", label: "Plan at Your Pace", icon: Calendar },
];

type FunnelStep = 1 | 2 | 3;

const SCOPE_OPTIONS = [
  {
    id: 'kitchen',
    label: 'Luxury Kitchen Overhaul',
    description: 'Stone, custom cabinetry, hidden appliances.',
    image:
      'https://images.pexels.com/photos/37347/modern-kitchen-luxury-interior-37347.jpeg?auto=compress&w=1200'
  },
  {
    id: 'suite',
    label: 'French Country Master Suite Addition',
    description: 'Vaulted ceilings, spa bath, private terrace.',
    image:
      'https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&w=1200'
  },
  {
    id: 'adu',
    label: 'Backyard ADU / Guest House',
    description: 'Perfect for guests, in-laws, or rental.',
    image:
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&w=1200'
  },
  {
    id: 'full-gut',
    label: 'Full Gut Remodel',
    description: 'Reimagine everything. Layout, finishes, systems.',
    image:
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&w=1200'
  }
];

const INDUSTRY_QUOTES = [
  { quote: 'If my clients could keep their 3% rate and add a suite instead of buying new, I\'d recommend it every time. The math is a no-brainer.', name: 'Mortgage Advisor', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'The biggest problem with renovations has always been scope creep and surprise costs. A fixed-price scope of work changes the entire equation.', name: 'Lending Partner', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Borrowing on the as-completed value means homeowners can fund the renovation they actually want, not just what their current equity allows.', name: 'Real Estate Broker', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Photo-verified milestones and managed payments? That\'s the accountability that\'s been missing from this industry for decades.', name: 'General Contractor', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Homeowners in today\'s rate environment are sitting on gold. Expanding beats relocating by six figures in most cases I\'ve seen.', name: 'Real Estate Analyst', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&facepad=2' },
];

const LANDING_TOC: TocItem[] = [
  { id: 'landing-hero', label: 'Get Started' },
  { id: 'landing-math', label: 'The Math' },
  { id: 'landing-voices', label: 'Industry Perspective' },
  { id: 'landing-how', label: 'How It Works' },
  { id: 'landing-stories', label: 'Scenarios' },
  { id: 'landing-cta', label: 'Free Analysis' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { updateData } = useOnboarding();
  const projectCtx = useProjectOptional();
  const [address, setAddress] = useState('');
  const [funnelStep, setFunnelStep] = useState<FunnelStep>(1);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homeValue, setHomeValue] = useState(750000);
  const [renovationBudget, setRenovationBudget] = useState(200000);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setQuoteIndex(i => (i + 1) % INDUSTRY_QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const { subject, loading: propertyLoading } = usePropertyData(address.trim().length >= 5 ? address : '');

  const { useFallback: addressUseFallback } = useGooglePlacesAutocomplete(addressContainerRef, {
    onPlaceSelect: (formatted) => {
      setAddress(formatted);
      setFunnelStep(2);
    },
    enabled: funnelStep === 1,
  });

  // Use API property value when we have an address; otherwise default. Show home value on next page.
  useEffect(() => {
    if (address.trim().length < 5) {
      setHomeValue(750000);
      return;
    }
    if (!propertyLoading && subject.value > 0) {
      setHomeValue(subject.value);
    }
  }, [address, propertyLoading, subject.value]);

  /** Get current address from React state or from the Google Places input (so it works from nav or form).
   * When using the Google widget, the input is inside its shadow DOM so we must query there. */
  const getCurrentAddress = (): string => {
    let addressToUse = address.trim();
    if (!addressToUse && addressContainerRef.current) {
      const container = addressContainerRef.current;
      // Fallback: plain input in light DOM
      const lightInput = container.querySelector('input');
      if (lightInput) addressToUse = lightInput.value?.trim() || '';
      // Google PlaceAutocompleteElement: input is inside the widget's shadow DOM
      if (!addressToUse) {
        const widget = container.querySelector('.gmp-place-autocomplete-input');
        const shadowInput = (widget as HTMLElement & { shadowRoot?: ShadowRoot })?.shadowRoot?.querySelector('input');
        const raw = shadowInput?.value?.trim();
        if (raw) addressToUse = raw;
      }
    }
    return addressToUse;
  };

  /** Sync address to onboarding context and project, then navigate so onboarding page shows the address. */
  const goToOnboarding = (addressToUse: string) => {
    updateData({ address: addressToUse });
    setAddress(addressToUse);
    if (projectCtx) {
      projectCtx.updateProject({
        property: { ...projectCtx.project.property, address: addressToUse },
        onboarding: { ...projectCtx.project.onboarding, estimatedRenovationBudget: renovationBudget },
      });
    }
    navigate('/onboarding', { state: { address: addressToUse } });
  };

  const handleGetStarted = async () => {
    setIsSubmitting(true);
    const addressToUse = getCurrentAddress();
    await new Promise(resolve => setTimeout(resolve, 800));
    goToOnboarding(addressToUse);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(val);
  };

  // Calculate projected values: budget is user's estimated spend; we show home value on next page
  const renovationCost = renovationBudget;
  const valueIncrease = renovationCost * 1.6;
  const newValue = homeValue + valueIncrease;
  const equityCreated = valueIncrease - renovationCost;

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    const addr = getCurrentAddress();
    if (!addr) return;
    setAddress(addr);
    setFunnelStep(2);
  };

  const handleScopeSelect = (id: string) => {
    setSelectedScope(id);
    setTimeout(() => setFunnelStep(3), 220);
  };

  const stepVariants = {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.98 }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0612] text-white overflow-x-hidden">
      <TableOfContents items={LANDING_TOC} accent="pink" />
      {/* Announcement Bar — subtle pulse */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-center py-2 px-4 text-xs sm:text-sm animate-pulse-opacity" style={{ animationDuration: '6s' }}>
        <span className="font-medium">
          <Gift size={14} className="inline -mt-0.5 mr-1" />
          Keep your 3% rate. Skip $60K+ in fees. See what&apos;s possible — free.
          <span className="hidden sm:inline"> Design, permitting, vetted contractors, and milestone-verified construction. All in one platform.</span>
        </span>
      </div>

      {/* Navigation — minimal; hero wizard is the single entry */}
      <nav className="sticky top-0 z-50 bg-[#0a0612]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">ExpandEase</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-500/80" />
              Fixed-Price SOW*
            </span>
            <span className="flex items-center gap-2">
              <Zap size={14} className="text-blue-400/80" />
              Real-Time Estimates
            </span>
          </div>
        </div>
      </nav>

      {/* Hero: Headline → Subhead → Calculator + Math side by side, all on one view */}
      <section id="landing-hero" className="relative overflow-hidden bg-[#05030A]">
        {/* Abstract gradient orbs only — no photo cutoff; seamless AI-forward base */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top-center purple glow — very visible at top */}
          <div className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(168,85,247,0.25),_transparent_60%)] animate-pulse-glow" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(168,85,247,0.18),_transparent_50%)] animate-pulse-glow-slow" style={{ animationDelay: '-2s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_20%,rgba(236,72,153,0.15),_transparent_45%)] animate-pulse-glow" style={{ animationDelay: '-1s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_80%,rgba(52,211,153,0.12),_transparent_40%)] animate-pulse-glow-slow" style={{ animationDelay: '-3.5s' }} />
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-500/40 via-purple-500/35 to-sky-500/25 blur-3xl animate-pulse-glow" style={{ animationDelay: '-0.5s' }} />
          <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400/30 via-purple-400/25 to-pink-500/20 blur-3xl animate-pulse-glow-slow" style={{ animationDelay: '-2.5s' }} />
          {/* Seamless fade into page background — no hard line */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0612] via-[#0a0612]/80 to-transparent" aria-hidden />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
          {/* Headline + single subhead — centered */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 sm:mb-8 text-center"
          >
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block">Don&apos;t Move.</span>
              <span className="block bg-gradient-to-r from-fuchsia-400 via-purple-300 to-sky-300 bg-clip-text text-transparent">
                Improve.
              </span>
            </h1>
            <p className="mt-3 mx-auto max-w-xl text-sm text-zinc-300 sm:text-base">
              Keep your low rate and your neighborhood. We handle everything — design, permitting, vetted contractors, and milestone-verified construction — so you get your dream home without the chaos.
            </p>
          </motion.div>

          {/* Stats bar — visible on all screens */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="mx-auto mb-6 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          >
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
                  <Icon size={16} className="shrink-0 text-emerald-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-white">{stat.value}</p>
                    <p className="truncate text-[10px] text-zinc-400">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Calculator + Math side by side (calculator first on mobile) */}
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {/* Left: Savings calculator */}
            <motion.div
              id="scope-funnel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative order-first"
            >
            {/* Outer glow / halo — subtle pulse */}
            <div className="absolute -inset-[1px] rounded-[1.5rem] bg-gradient-to-br from-fuchsia-500/50 via-purple-500/40 to-emerald-400/30 opacity-80 blur-sm animate-pulse-opacity" aria-hidden style={{ animationDuration: '5s' }} />
            <div className="absolute -inset-[1px] rounded-[1.5rem] bg-gradient-to-br from-fuchsia-400/30 via-purple-400/20 to-emerald-400/20 opacity-60 animate-pulse-glow-slow" aria-hidden style={{ animationDuration: '5s', animationDelay: '-1s' }} />
            {/* Card */}
            <div className="relative w-full rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-white shadow-[0_0_40px_rgba(168,85,247,0.15),0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-5 lg:p-6 ring-1 ring-white/5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-medium text-purple-200">
                  EE
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  See what&apos;s possible
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 w-6 rounded-full transition-all ${
                      funnelStep >= s
                        ? 'bg-gradient-to-r from-fuchsia-400 via-purple-400 to-emerald-400'
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className={`relative ${funnelStep === 1 ? 'min-h-0' : 'min-h-[260px]'}`}>
              <AnimatePresence mode="wait">
                {funnelStep === 1 && (
                  <motion.div
                    key="step-1"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-2"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                        Step 1 — Address
                      </p>
                      <p className="text-sm text-zinc-200">
                        Enter your address and we&apos;ll show you what&apos;s possible.
                      </p>
                    </div>

                    <form onSubmit={handleAddressSubmit} className="space-y-2">
                      <div className="relative">
                        {/* Address bar glow — 2x intensity */}
                        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/40 via-purple-500/30 to-emerald-500/20 opacity-100 blur-[4px]" aria-hidden />
                        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-fuchsia-400/50 via-purple-400/40 to-emerald-400/30 opacity-100" aria-hidden />
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                            <MapPin className="h-4 w-4" />
                          </div>
                          {addressUseFallback ? (
                            <input
                              type="text"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Enter your home address..."
                              className="w-full rounded-2xl border border-white/15 bg-black/40 px-10 py-3 text-sm text-white placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition focus:border-fuchsia-400/50 focus:bg-black/50 focus:ring-2 focus:ring-fuchsia-400/30 focus:shadow-[0_0_40px_rgba(217,70,239,0.4)]"
                            />
                          ) : (
                            <div
                              ref={addressContainerRef}
                              className="min-h-[48px] w-full rounded-2xl border border-white/15 bg-black/40 px-10 py-1 text-sm text-white shadow-inner outline-none ring-0 transition focus-within:border-fuchsia-400/50 focus-within:bg-black/50 focus-within:ring-2 focus-within:ring-fuchsia-400/30 focus-within:shadow-[0_0_40px_rgba(217,70,239,0.4)] [&_.gmp-place-autocomplete-input]:!w-full [&_.gmp-place-autocomplete-input]:!bg-transparent [&_.gmp-place-autocomplete-input]:!border-0 [&_.gmp-place-autocomplete-input]:!text-white [&_.gmp-place-autocomplete-input]:!placeholder-zinc-500 [&_.gmp-place-autocomplete-input]:!px-0"
                            />
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        {/* Continue bar glow — high visibility */}
                        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/60 via-purple-500/50 to-pink-500/40 opacity-100 blur-[6px]" aria-hidden />
                        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-fuchsia-500/70 via-purple-500/60 to-pink-500/50 opacity-100" aria-hidden />
                        <button
                          type="submit"
                          className="relative w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 px-3 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(216,70,239,0.5)] transition hover:shadow-[0_0_40px_rgba(216,70,239,0.8)] hover:translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                          See What&apos;s Possible
                          <ArrowRight size={16} className="ml-2" aria-hidden />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {funnelStep === 2 && (
                  <motion.div
                    key="step-2"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                        Step 2 — Dream Scope
                      </p>
                      <p className="text-sm text-zinc-200">
                        Choose the upgrade that feels most like your dream outcome.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SCOPE_OPTIONS.map((option) => {
                        const isActive = selectedScope === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleScopeSelect(option.id)}
                            className={`group flex flex-col overflow-hidden rounded-2xl border bg-white/5 text-left text-xs transition focus:outline-none ${
                              isActive
                                ? 'border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.7)]'
                                : 'border-white/8 hover:border-purple-300/60 hover:bg-white/10'
                            }`}
                          >
                            <div
                              className="relative h-20 w-full overflow-hidden"
                              style={{
                                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(${option.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              <div className="absolute inset-0 border-b border-white/10" />
                            </div>
                            <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
                              <span className="text-[11px] font-medium text-zinc-50">
                                {option.label}
                              </span>
                              <span className="line-clamp-2 text-[10px] text-zinc-400">
                                {option.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-zinc-500">
                      We&apos;ll auto-calc cost, new value, and equity for your
                      neighborhood next.
                    </p>
                  </motion.div>
                )}

                {funnelStep === 3 && (
                  <motion.div
                    key="step-3"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                        Step 3 — Financial Reality Check
                      </p>
                      <p className="text-sm text-zinc-200">
                        Here&apos;s the mock impact of your{' '}
                        {selectedScope
                          ? SCOPE_OPTIONS.find((o) => o.id === selectedScope)?.label
                          : 'renovation'}
                        .
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/50 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                      <div className="mb-3 text-[11px] text-zinc-400">
                        <span>
                          {address || 'Your Property — Sample Estimate'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] text-zinc-400">
                              Estimated Renovation Cost
                            </p>
                            <p className="font-mono text-lg text-white">$300,000</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-zinc-400">
                              Cost to Move (Comparable Home)
                            </p>
                            <p className="font-mono text-lg text-red-400 line-through">
                              $68,500 in dead fees
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
                          <div>
                            <p className="text-[11px] text-emerald-300">
                              Net Upfront Savings
                            </p>
                            <p className="font-mono text-xl text-[#00FF00]">
                              $68,500
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] text-gray-500">
                        Estimates based on regional RSMeans data and average Maricopa County closing costs. Actuals may vary.
                      </p>

                      <button
                        type="button"
                        onClick={handleGetStarted}
                        disabled={isSubmitting}
                        className="mt-4 inline-flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 px-4 py-2.5 text-xs font-medium text-white shadow-[0_0_30px_rgba(216,70,239,0.6)] transition hover:translate-y-0.5 hover:shadow-[0_0_40px_rgba(216,70,239,0.9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-70"
                      >
                        <span>
                          {isSubmitting ? 'Analyzing…' : 'See Your Free Renovation Plan'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-pink-100">
                          <span>Lightning-fast</span>
                          <ArrowRight size={14} aria-hidden />
                        </span>
                      </button>
                      <p className="mt-1.5 text-center text-[10px] text-emerald-400/90 font-medium">
                        ${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ value — free for the first 50 homeowners
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            </div>
          </motion.div>

            {/* Right: Math summary — always visible next to calculator */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_0_30px_rgba(168,85,247,0.1)] backdrop-blur-xl ring-1 ring-white/5 sm:p-5 lg:p-6 order-last self-start"
            >
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                The math
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-400">Renovation Cost</p>
                    <p className="font-mono text-sm text-white">$300,000</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400">Value Added to Home</p>
                    <p className="font-mono text-sm text-emerald-400">$480,000</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1">
                  <span className="text-[10px] text-zinc-400">Equity increase</span>
                  <span className="font-mono text-xs text-emerald-400">+$180K</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1">
                  <span className="text-[10px] text-zinc-400">Monthly saved vs. 7%</span>
                  <span className="font-mono text-xs text-[#00FF00]">~$1,200</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-red-500/5 border border-red-400/20 px-2 py-1">
                  <span className="text-[10px] text-zinc-400">Cost to Move</span>
                  <span className="font-mono text-xs text-red-400 line-through">$68,500</span>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1.5 text-center">
                <p className="text-[10px] text-emerald-300 font-medium">
                  This analysis costs ${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ from an architect or contractor
                </p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">Yours is free.</p>
              </div>
              <p className="mt-2 text-[10px] text-gray-500 leading-snug">
                Estimates based on regional RSMeans data and average Maricopa County closing costs. Actuals may vary.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Math Section — same base as page; no visual break */}
      <section id="landing-math" className="relative py-20 px-4">
        {/* Subtle continuation of gradient atmosphere — gentle pulse */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(88,28,135,0.12),_transparent_70%)] animate-pulse-opacity" aria-hidden style={{ animationDuration: '7s' }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">The Math Doesn't Lie</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              See why smart homeowners are choosing to renovate instead of relocating.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Moving Card */}
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-red-500/20 relative">
              <div className="absolute -top-3 left-6 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                THE COST OF MOVING
              </div>
              <h3 className="text-xl font-bold text-white mb-6 mt-2">Selling & Buying New</h3>
              
              <ul className="space-y-3 mb-6">
                {[
                  { label: 'Agent Commissions (6%)', value: '-$45,000', color: 'text-red-400' },
                  { label: 'Closing Costs', value: '-$12,000', color: 'text-red-400' },
                  { label: 'Moving Expenses', value: '-$5,000', color: 'text-red-400' },
                  { label: 'New Mortgage Rate', value: '~7.0%', color: 'text-red-400' },
                  { label: 'Lost 3% Rate Forever', value: 'PRICELESS', color: 'text-red-500' },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-300 flex items-center gap-2">
                      <X size={14} className="text-red-500" />
                      {item.label}
                    </span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-red-500/10 rounded-xl p-4 text-center">
                <p className="text-red-400 text-xs uppercase mb-1">Total Dead Money</p>
                <p className="text-2xl font-black text-red-400">$60,000+</p>
              </div>
            </div>

            {/* Renovating Card */}
            <div className="bg-gradient-to-b from-purple-900/50 to-pink-900/30 rounded-2xl p-8 border border-pink-500/30 relative">
              <div className="absolute -top-3 left-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                THE EXPANDEASE WAY
              </div>
              <div className="absolute top-4 right-4">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-6 mt-2">Renovating Your Home</h3>
              
              <ul className="space-y-3 mb-6">
                {[
                  { label: 'Agent Commissions', value: '$0', color: 'text-emerald-400' },
                  { label: 'Closing Costs', value: '$0', color: 'text-emerald-400' },
                  { label: 'Keep Your Low Rate', value: 'LOCKED IN', color: 'text-emerald-400' },
                  { label: 'Customize Everything', value: '100%', color: 'text-emerald-400' },
                  { label: 'Average Equity Gain', value: '+$240K', color: 'text-emerald-400' },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-200 flex items-center gap-2">
                      <Check size={14} className="text-emerald-400" />
                      {item.label}
                    </span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
                <p className="text-emerald-400 text-xs uppercase mb-1">Wealth Building</p>
                <p className="text-2xl font-black text-emerald-400">+$180K+ Equity</p>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-emerald-400/90">
                <Gift size={13} />
                <span className="text-[11px] font-medium">
                  Includes free ${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ feasibility analysis + ${CAD_PACKAGE_PRICE} design package (${(CAD_PACKAGE_US_PRICE_HIGH / 1000).toFixed(0)}K+ value)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We've Heard — broker skepticism reframed (quote slider) */}
      <section id="landing-voices" className="py-20 px-4 relative bg-gradient-to-b from-[#0a0612] to-purple-950/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(168,85,247,0.08),_transparent_70%)] animate-pulse-opacity" aria-hidden style={{ animationDuration: '8s' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 justify-center mb-6">
            <MessageSquare size={22} className="text-pink-400" />
            <h2 className="text-3xl md:text-4xl font-bold text-center">What Industry Pros Are Saying</h2>
          </div>
          <p className="text-gray-400 text-center mb-6 max-w-2xl mx-auto">Lenders, brokers, and contractors on why expanding beats relocating.</p>
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 md:p-8 min-h-[180px]">
              <img src={INDUSTRY_QUOTES[quoteIndex].img} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/10 shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-gray-300 italic text-base md:text-lg mb-2">"{INDUSTRY_QUOTES[quoteIndex].quote}"</p>
                <p className="text-gray-500 text-sm">— {INDUSTRY_QUOTES[quoteIndex].name}</p>
              </div>
            </div>
            <div className="flex justify-center gap-2 pb-4">
              {INDUSTRY_QUOTES.map((_, i) => (
                <button key={i} onClick={() => setQuoteIndex(i)} aria-label={`Quote ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === quoteIndex ? 'bg-pink-500' : 'bg-white/30 hover:bg-white/50'}`} />
              ))}
            </div>
          </div>
          <p className="text-white font-medium text-center mt-4 text-sm md:text-base max-w-2xl mx-auto">
            The industry is catching on. <span className="text-pink-400">Expanding your home is the smartest financial move in today&apos;s rate environment.</span> Integrated design, pre-filed permitting, photo-verified milestones, and one signed source of truth. Start with a free feasibility analysis that would cost you ${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ anywhere else.
          </p>
        </div>
      </section>

      {/* How It Works — gradient pulse */}
      <section id="landing-how" className="py-20 px-4 relative bg-gradient-to-b from-[#0a0612] to-purple-950/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_30%,rgba(168,85,247,0.1),_transparent_60%)] animate-pulse-opacity" aria-hidden style={{ animationDuration: '6s' }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">From dream to done in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Tell Us Your Vision',
                desc: 'Share your address and renovation goals. Explore styles with Pinterest-inspired boards and instant visualization. Takes 60 seconds to start.',
                icon: Building2,
                color: 'from-pink-500 to-pink-600',
                valueTag: `Free — typically $${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ from an architect`,
              },
              {
                step: '02',
                title: 'Get Your Complete Plan',
                desc: `Get a full scope of work, cost estimates, equity projections, and financing options — generated automatically. Permitting is pre-filed. Every material spec locked. Your construction timeline is optimized so nothing stalls — no wasted days, no waiting.`,
                icon: TrendingUp,
                color: 'from-purple-500 to-purple-600',
                valueTag: `$${CAD_PACKAGE_PRICE} — $${(CAD_PACKAGE_US_PRICE_HIGH / 1000).toFixed(0)}K+ value from a US design firm`,
              },
              {
                step: '03',
                title: 'Build with Total Confidence',
                desc: 'Vetted contractors, milestone-verified payments, and photo-confirmed progress at every step. You always know what\'s happening, what\'s next, and what it costs. This is the renovation experience that didn\'t exist until now.',
                icon: DollarSign,
                color: 'from-blue-500 to-blue-600',
                valueTag: 'Managed construction — no surprise markups',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="relative group">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <div className="text-6xl font-black text-white/5 absolute top-0 right-0 -z-10">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                  <p className="mt-2 text-[11px] text-emerald-400/90 font-medium">{item.valueTag}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Renovation Scenarios — gradient pulse */}
      <section id="landing-stories" className="py-20 px-4 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(168,85,247,0.08),_transparent_65%)] animate-pulse-opacity" aria-hidden style={{ animationDuration: '7s' }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">What Your Renovation Could Look Like</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Real renovation scenarios based on regional data. See how expanding builds wealth instead of burning it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {RENOVATION_SCENARIOS.map((scenario) => (
              <div key={scenario.title} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-xs text-zinc-400 mb-1">{scenario.location}</p>
                <h3 className="text-lg font-bold text-white mb-4">{scenario.title}</h3>
                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm text-gray-400">Invested</span>
                    <span className="font-mono text-sm text-white">{scenario.invested}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm text-gray-400">Value Added</span>
                    <span className="font-mono text-sm text-emerald-400">{scenario.valueAdded}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-sm text-gray-400">Equity Gain</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{scenario.equityGain}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-xs text-emerald-300">{scenario.rateSaved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <X size={14} className="text-red-400" />
                  <span className="text-xs text-red-300">{scenario.moveCostAvoided} in move fees avoided</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-500 mt-4">Projections based on RSMeans regional cost data and Maricopa County market averages. Actual results vary by property.</p>
        </div>
      </section>

      {/* Trust Badges — gradient pulse */}
      <section className="py-12 px-4 relative border-y border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(168,85,247,0.06),_transparent_70%)] animate-pulse-opacity" aria-hidden style={{ animationDuration: '5s' }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {TRUST_LOGOS.map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-gray-400">
                <Shield size={18} className="text-emerald-400" />
                <span className="font-medium">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — gradient pulse */}
      <section id="landing-cta" className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 animate-pulse-opacity" style={{ animationDuration: '6s' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Your Dream Home Is the One You Already Own.
          </h2>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Fixed-price design. Integrated permitting. Milestone-verified construction. The most comprehensive renovation platform ever built — and it starts with a 60-second analysis.
          </p>
          <p className="text-sm text-emerald-400/90 font-medium mb-8">
            Free for the first 50 homeowners — a ${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ feasibility analysis, on us.
          </p>
          <motion.button
            type="button"
            onClick={handleGetStarted}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xl hover:from-pink-700 hover:to-purple-700 transition-all flex items-center gap-3 mx-auto group"
          >
            Get Your Free Analysis
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <p className="text-gray-500 mt-4">Takes 60 seconds • No credit card required</p>
        </div>
      </section>

      {/* Waitlist */}
      <WaitlistSection />

      {/* Footer */}
      <footer className="bg-black py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Home className="text-pink-500" size={24} />
              <span className="text-xl font-bold text-white">ExpandEase</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">How It Works</a>
              <Link to="/for-contractors" className="hover:text-white transition-colors">For Contractors</Link>
              <Link to="/for-lenders" className="hover:text-white transition-colors">For Lenders</Link>
              <AuthUI />
            </div>

            <div className="text-xs text-gray-600">
              <p>© 2026 ExpandEase. All rights reserved.</p>
            </div>
          </div>

          {/* Global Legal / Compliance Block — legible but recedes */}
          <div className="max-w-4xl border-t border-white/5 pt-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              *Average upfront savings based on 6% agent commissions, standard closing costs, and moving expenses for an $800,000+ home in the Phoenix metro area. Fixed-price guarantees apply only to the finalized Statement of Work post-site inspection. Unforeseen structural conditions excluded. ExpandEase is a technology platform; all financing is subject to credit approval and final After-Repair Value (ARV) appraisal by licensed lending partners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

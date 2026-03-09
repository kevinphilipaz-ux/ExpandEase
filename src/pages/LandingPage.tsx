import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WaitlistSection } from '../components/landing/WaitlistSection';
import { motion } from 'framer-motion';
import { useOnboarding } from '../context/OnboardingContext';
import { useProjectOptional } from '../context/ProjectContext';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';
import { usePropertyData } from '../hooks/usePropertyData';
import {
  MapPin,
  ArrowRight,
  TrendingUp,
  Home,
  DollarSign,
  Shield,
  CheckCircle2,
  Star,
  Users,
  Zap,
  Building2,
  Calendar,
  X,
  Check,
  MessageSquare
} from 'lucide-react';

const TESTIMONIALS = [
  {
    name: "Sarah & Mike T.",
    location: "Scottsdale, AZ",
    quote: "We increased our home's value by $340K for only $180K spent. The process was so smooth.",
    image: "ST",
    stars: 5
  },
  {
    name: "James R.",
    location: "Phoenix, AZ",
    quote: "Kept our 2.9% rate and got the kitchen of our dreams. Why would anyone move?",
    image: "JR",
    stars: 5
  },
  {
    name: "The Chen Family",
    location: "Tempe, AZ",
    quote: "From analysis to completion in 5 months. Our home is now worth $1.2M more.",
    image: "CF",
    stars: 5
  }
];

const TRUST_LOGOS = [
  "Fixed-Price Scope",
  "Borrow on Completed Value",
  "Keep Your Low Rate",
  "See Numbers First"
];

const STATS = [
  { value: "Future Value", label: "Borrow on Completed Value", icon: TrendingUp },
  { value: "Stay Put", label: "Keep Your Low Rate", icon: Home },
  { value: "Instant", label: "See the Numbers First", icon: Star },
  { value: "Your Timeline", label: "Plan at Your Pace", icon: Calendar },
];

const INDUSTRY_QUOTES = [
  { quote: 'Have you seen the percentage of people who get divorced during a renovation?', name: 'Mortgage broker', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Your wife will see how it looks midway through and hate it forever.', name: 'Lender', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Why not just buy a new house?', name: 'Broker', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&facepad=2' },
  { quote: "Winning over the renovation customer — that's a very big hill to climb.", name: 'Director, Business Dev', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Renovations cause marital strain; the process is so inherently unpleasant that customers may stay dissatisfied even after completion.', name: 'Industry veteran', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&facepad=2' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { updateData } = useOnboarding();
  const projectCtx = useProjectOptional();
  const [address, setAddress] = useState('');
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
    onPlaceSelect: setAddress,
    enabled: true,
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

  return (
    <div className="min-h-screen w-full bg-[#0a0612] text-white overflow-x-hidden">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-center py-2 px-4 text-xs sm:text-sm">
        <span className="font-medium">🎉 New: Get pre-qualified for renovation financing in 60 seconds</span>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0612]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">ExpandEase</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              Fixed-Price Guarantee
            </span>
            <span className="flex items-center gap-2">
              <Zap size={14} className="text-blue-400" />
              See Your Numbers First
            </span>
          </div>
          <button 
            onClick={() => goToOnboarding(getCurrentAddress())}
            className="px-5 py-2.5 min-h-[44px] bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors flex items-center"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
            alt="Modern home"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612]/50 via-[#0a0612]/80 to-[#0a0612]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 sm:py-16 w-full">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6"
              >
                <Zap size={16} />
                Average homeowner creates $240K in equity
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
                Don't Move.
                <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Improve.
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-4 max-w-lg">
                Keep your low mortgage rate. Keep your neighborhood. Transform your home into your dream space.
              </p>

              <p className="text-gray-400 mb-4 max-w-lg">
                Moving costs $60K+ in fees and you'd trade your 3% rate for 7%. See how much wealth you can build by renovating instead.
              </p>
              <p className="text-gray-500 text-sm italic mb-8 max-w-lg">
                Heard it before? "Just buy a new house." "Renovations wreck marriages." We get it — and that's why we built a process that removes the chaos: clear scope, fixed price, one source of truth.
              </p>

              {/* Social Proof */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex -space-x-2">
                  {['ST', 'JR', 'CF', 'MC'].map((initials, i) => (
                    <div
                      key={initials}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border-2 border-[#0a0612] flex items-center justify-center text-xs font-bold text-gray-800"
                      style={{ zIndex: 4 - i }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">See your renovation potential before you commit</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-md">
                {STATS.slice(0, 3).map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Icon size={14} className="text-pink-400" />
                        <span className="text-xl font-bold text-white">{stat.value}</span>
                      </div>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: Calculator Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl shadow-purple-900/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">See Your Potential</h3>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <TrendingUp size={12} />
                    LIVE CALCULATOR
                  </span>
                </div>

                {/* Address: Google PlaceAutocompleteElement when available; otherwise plain input so Vercel/production still works */}
                <div className="mb-6 relative z-[100] overflow-visible">
                  <div className="relative flex items-center bg-gray-900/50 border border-white/20 rounded-xl overflow-visible transition-[border-color,box-shadow] duration-200 focus-within:border-white/35 focus-within:ring-1 focus-within:ring-white/10 focus-within:ring-inset">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none" size={18} />
                    {addressUseFallback ? (
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your address (e.g. 123 Main St, City, State)"
                        className="flex-1 min-w-0 w-full py-3 pl-11 pr-4 bg-transparent border-0 text-white placeholder-gray-500 focus:outline-none focus:ring-0 focus:shadow-none"
                        style={{ minHeight: 48 }}
                        aria-label="Property address"
                      />
                    ) : (
                      <div ref={addressContainerRef} className="flex-1 min-w-0 [&_.gmp-place-autocomplete-input]:!w-full [&_.gmp-place-autocomplete-input]:!py-3 [&_.gmp-place-autocomplete-input]:!pl-11 [&_.gmp-place-autocomplete-input]:!pr-4 [&_.gmp-place-autocomplete-input]:!bg-transparent [&_.gmp-place-autocomplete-input]:!border-0 [&_.gmp-place-autocomplete-input]:!text-white [&_.gmp-place-autocomplete-input]:!placeholder-gray-500 [&_.gmp-place-autocomplete-input]:!focus:outline-none [&_.gmp-place-autocomplete-input]:!focus:ring-0 [&_.gmp-place-autocomplete-input]:!focus:shadow-none" style={{ minHeight: 48 }} />
                    )}
                  </div>
                  <input type="hidden" id="property-address" name="address" value={address} readOnly aria-hidden="true" />
                </div>

                {/* Estimated Renovation Budget Slider — home value comes from your address and is shown on the next page */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Estimated Renovation Budget</span>
                    <span className="text-white font-bold">{formatCurrency(renovationBudget)}</span>
                  </div>
                  <input
                    type="range"
                    min="75000"
                    max="2000000"
                    step="25000"
                    value={renovationBudget}
                    onChange={(e) => setRenovationBudget(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$75K</span>
                    <span>$2M+</span>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Renovation Cost</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(renovationCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">New Value</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(newValue)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Equity Created</span>
                      <span className="text-xl font-bold text-emerald-400">+{formatCurrency(equityCreated)}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  type="button"
                  onClick={handleGetStarted}
                  disabled={isSubmitting}
                  whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Analyzing...</span>
                  ) : (
                    <>
                      Get Your Free Analysis
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-gray-500 text-xs mt-3">
                  No credit card required • Instant results
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Math Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
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
            </div>
          </div>
        </div>
      </section>

      {/* What We've Heard — broker skepticism reframed (quote slider) */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0a0612] to-purple-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 justify-center mb-6">
            <MessageSquare size={22} className="text-pink-400" />
            <h2 className="text-3xl md:text-4xl font-bold text-center">We've heard it before.</h2>
          </div>
          <p className="text-gray-400 text-center mb-6 max-w-2xl mx-auto">From mortgage brokers and lenders — and we get it. That's why we built this.</p>
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
            That skepticism is exactly the point. <span className="text-pink-400">The process is broken.</span> We're fixing it — with clear scope, fixed price, and one source of truth before a single dollar is funded.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0a0612] to-purple-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">From dream to done in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Tell Us Your Vision',
                desc: 'Share your address, income, and renovation goals. Takes 60 seconds.',
                icon: Building2,
                color: 'from-pink-500 to-pink-600'
              },
              {
                step: '02',
                title: 'Get Your Analysis',
                desc: 'See real-time cost estimates, equity projections, and financing options.',
                icon: TrendingUp,
                color: 'from-purple-500 to-purple-600'
              },
              {
                step: '03',
                title: 'Start Building Wealth',
                desc: 'Connect with vetted contractors and secure "as-completed" financing.',
                icon: DollarSign,
                color: 'from-blue-500 to-blue-600'
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Real Homeowners, Real Results</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-sm font-bold text-gray-800">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-medium text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
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

      {/* Final CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Unlock Your Home's Potential?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover the smarter way to get your dream home—without moving. Get your free analysis.
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Home className="text-pink-500" size={24} />
            <span className="text-xl font-bold text-white">ExpandEase</span>
          </div>

          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">How It Works</a>
            <Link to="/for-contractors" className="hover:text-white transition-colors">For Contractors</Link>
            <Link to="/for-lenders" className="hover:text-white transition-colors">For Lenders</Link>
          </div>

          <div className="text-xs text-gray-600">
            <p>© 2025 ExpandEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

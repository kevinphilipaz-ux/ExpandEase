import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Share2,
  Download,
  Home,
  DollarSign,
  Zap,
  Clock,
  Lock,
  Eye,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  BedDouble,
  Bath,
  Ruler,
  Car,
  Shield,
} from 'lucide-react';
import { useProjectOptional } from '../context/ProjectContext';
import { calculateTaxSavings, formatTaxBracket } from '../utils/taxBrackets';
import { SECOND_LIEN_RATE_ANNUAL, CAD_PACKAGE_PRICE, CAD_PACKAGE_US_PRICE_HIGH, ANALYSIS_MARKET_VALUE } from '../config/renovationDefaults';

const MONTHLY_RATE_30YR = 0.00665;

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
}

function fmtFull(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function ProjectSummary() {
  const projectCtx = useProjectOptional();
  const project = projectCtx?.project;
  const navigate = useNavigate();
  const [showTaxBenefits, setShowTaxBenefits] = useState(true);

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-2">No project loaded</h1>
          <p className="text-white/70">Create or load a project to view its summary.</p>
        </div>
      </div>
    );
  }

  const { property, wishlist, financial, homeowner, meta, onboarding } = project;

  // ── Financial calculations ──
  const totalCost = financial?.totalCost || 0;
  const totalValueAdded = financial?.totalValue || 0;
  const currentHomeValue = property?.currentValue || 500000;
  const postRenovationValue = currentHomeValue + totalValueAdded;
  const currentPayment = financial?.currentMonthlyPayment || 2200;
  const renoMonthly = Math.round(totalCost * MONTHLY_RATE_30YR);
  const newMonthly = currentPayment + renoMonthly;
  const comparableMonthly = Math.round(postRenovationValue * MONTHLY_RATE_30YR);
  const monthlySavings = Math.max(0, comparableMonthly - newMonthly);
  const taxSavings = calculateTaxSavings(totalCost, totalValueAdded, SECOND_LIEN_RATE_ANNUAL, onboarding?.income);
  const taxAdjustedPayment = newMonthly - taxSavings.totalTaxSavings;
  const displayPayment = showTaxBenefits ? taxAdjustedPayment : newMonthly;
  const displaySavings = Math.max(0, comparableMonthly - displayPayment);
  const transactionCostsAvoided = Math.round(currentHomeValue * 0.08);
  const totalAdvantageVsMoving = transactionCostsAvoided + (monthlySavings * 60);

  const address = property.address || 'Your Home';
  const firstName = homeowner?.firstName || 'You';
  const style = wishlist?.homeStyle ?? 'Modern';

  // Specs
  const beforeBeds = property.beds || 3;
  const beforeBaths = property.baths || 2;
  const beforeSqft = property.sqft || 2100;
  const afterBeds = wishlist?.bedrooms || beforeBeds;
  const afterBaths = wishlist?.bathrooms || beforeBaths;
  const afterSqft = beforeSqft + (afterBeds - beforeBeds) * 250 + (afterBaths - beforeBaths) * 100;

  const specs = [
    { label: 'Bedrooms', before: beforeBeds, after: afterBeds, icon: BedDouble },
    { label: 'Bathrooms', before: beforeBaths, after: afterBaths, icon: Bath },
    { label: 'Sq Footage', before: beforeSqft.toLocaleString(), after: afterSqft.toLocaleString(), icon: Ruler },
    { label: 'Garage', before: '2-Car', after: '3-Car + ADU', icon: Car },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 font-sans text-white relative overflow-hidden">
      {/* Subtle grid background */}
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

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Header with nav ── */}
        <motion.header variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                Project Summary
              </span>
              <span className="text-purple-300 text-sm font-medium">#{meta?.projectId}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              {address}
            </h1>
            <p className="text-base md:text-lg text-purple-200/80 max-w-2xl leading-relaxed">
              Prepared for {firstName} — a complete overview of your renovation plan, the numbers behind it, and why it makes sense.
            </p>
            <p className="text-emerald-400/60 text-xs mt-2">
              This analysis typically costs ${(ANALYSIS_MARKET_VALUE / 1000).toFixed(0)}K+ from an architect or contractor — yours is included at no charge.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={() => navigate('/analysis')}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
            >
              <ChevronLeft size={16} /> Back to Analysis
            </motion.button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
              title="Copy link"
            >
              <Share2 size={16} /> Share Link
            </button>
            <button
              onClick={() => alert('PDF download coming soon!')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
              title="Download PDF"
            >
              <Download size={16} /> Save PDF
            </button>
          </div>
        </motion.header>

        {/* ── Tax-adjusted view toggle ── */}
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-6">
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

        {/* ── Hero: Property visualization + big number ── */}
        <motion.section variants={itemVariants} className="mb-8">
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-black/20">
            {/* Property image */}
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
              alt="Your home"
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-purple-900/60 to-transparent" />

            {/* Overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <TrendingUp size={12} />
                    You're better off renovating by
                  </p>
                  <h2 className="text-4xl md:text-5xl font-bold text-emerald-400 tracking-tight">
                    {fmtUSD(totalAdvantageVsMoving)}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    vs. selling and buying a comparable {afterBeds}-bed, {afterBaths}-bath in your area
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-4 py-3 text-center min-w-[100px]">
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Your Payment{showTaxBenefits ? '*' : ''}</p>
                    <p className="text-xl font-bold text-white">{fmtFull(displayPayment)}<span className="text-xs text-white/50">/mo</span></p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-4 py-3 text-center min-w-[100px]">
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">If You Moved</p>
                    <p className="text-xl font-bold text-white/50 line-through">{fmtFull(comparableMonthly)}<span className="text-xs">/mo</span></p>
                  </div>
                  <div className="bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-500/30 px-4 py-3 text-center min-w-[100px]">
                    <p className="text-emerald-300/70 text-[10px] uppercase tracking-wider mb-0.5">You Save</p>
                    <p className="text-xl font-bold text-emerald-400">{fmtFull(displaySavings)}<span className="text-xs text-emerald-400/70">/mo</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Before → After Specs ── */}
        <motion.section variants={itemVariants} className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {specs.map((spec, idx) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.06 }}
                className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 md:p-5 text-center shadow-xl shadow-black/10 overflow-hidden hover:bg-white/15 transition-all group"
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

        {/* ── Financial Advantage Cards ── */}
        <motion.section variants={itemVariants} className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-400" />
            Why Renovating Wins
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Post-reno value */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Home size={20} />
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider">Home After Reno</p>
                  <p className="text-2xl font-bold text-white">{fmtUSD(postRenovationValue)}</p>
                </div>
              </div>
              <p className="text-purple-200/60 text-xs">{fmtUSD(totalCost)} invested to get here — {style} finishes throughout</p>
            </div>

            {/* Transaction costs avoided */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider">Moving Costs Avoided</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmtUSD(transactionCostsAvoided)}</p>
                </div>
              </div>
              <p className="text-purple-200/60 text-xs">Agent commissions, closing costs, and moving expenses you skip</p>
            </div>

            {/* Monthly savings */}
            <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/30 text-emerald-300">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-emerald-300/70 text-xs uppercase tracking-wider">Monthly Savings{showTaxBenefits ? '*' : ''}</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmtFull(displaySavings)}<span className="text-sm text-emerald-400/50">/mo</span></p>
                </div>
              </div>
              <p className="text-emerald-200/50 text-xs">{fmtUSD(displaySavings * 60)} saved over 5 years vs. buying the same home</p>
            </div>
          </div>
        </motion.section>

        {/* ── Benefits You Keep ── */}
        <motion.section variants={itemVariants} className="mb-8">
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md rounded-2xl border border-emerald-500/20 p-5 md:p-6">
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              Plus, you keep everything you love
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Lock, title: 'Your Current Rate', desc: `${onboarding?.mortgageRate || 3.5}% locked — new buyers pay 7%+` },
                { icon: Home, title: 'Your Neighborhood', desc: 'Schools, commute, community — the things money can\'t buy' },
                { icon: Sparkles, title: 'Custom Finishes', desc: `${style} design selected by you — not a builder\'s spec` },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <p className="text-purple-200/60 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── What's Included — visual feature grid ── */}
        <motion.section variants={itemVariants} className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">What's In Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Kitchen',
                image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
                items: wishlist?.kitchenFeatures || ['Premium Finishes', 'Waterfall Island', 'Custom Cabinetry'],
              },
              {
                title: 'Bathrooms',
                image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80',
                items: wishlist?.bathroomFeatures || ['Walk-in Shower', 'Heated Floors', 'Vessel Sinks'],
              },
              {
                title: 'Living Spaces',
                image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
                items: wishlist?.roomFeatures || ['Open Concept', 'Hardwood Floors', 'Crown Molding'],
              },
              {
                title: 'Outdoor & More',
                image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
                items: (wishlist?.outdoorFeatures || []).concat(wishlist?.interiorDetails || []).slice(0, 4) || ['Covered Patio', 'Outdoor Kitchen', 'Landscaping'],
              },
            ].map((cat) => (
              <div key={cat.title} className="group relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-xl">
                {/* Image strip */}
                <div className="relative h-32 overflow-hidden">
                  <img src={cat.image} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-white font-bold text-lg">{cat.title}</h3>
                  </div>
                </div>
                {/* Features */}
                <div className="p-4">
                  <ul className="space-y-2">
                    {(cat.items.length > 0 ? cat.items : ['Custom features selected']).slice(0, 4).map((item, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {cat.items.length > 4 && (
                      <li className="text-purple-300/50 text-xs italic">+{cat.items.length - 4} more</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Trust Indicators ── */}
        <motion.section variants={itemVariants} className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Shield, label: 'Fixed-Price SOW†', sub: 'Confirmed after site visit' },
              { icon: Clock, label: `${totalCost > 300000 ? '8–12' : totalCost > 150000 ? '5–8' : '3–5'} Month Est.†`, sub: 'Based on projects like yours' },
              { icon: TrendingUp, label: 'Borrow on After-Value', sub: 'Finance the completed home' },
              { icon: Eye, label: 'No Hidden Costs', sub: 'Transparent line items' },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
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

        {/* ── CTA: Design Package upsell ── */}
        <motion.section variants={itemVariants} className="mb-8">
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row">
              {/* Image side */}
              <div className="relative md:w-2/5 h-48 md:h-auto overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
                  alt="Design preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-900/80 hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent md:hidden" />
              </div>
              {/* Content side */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 w-fit mb-4">
                  <Sparkles size={12} className="text-pink-300" />
                  <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Next Step</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Want to see exactly what this looks like?
                </h3>
                <p className="text-purple-200/70 text-sm mb-6 max-w-md">
                  Get room-by-room renderings, construction blueprints, and a contractor-ready scope of work — everything you need to break ground.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    'Visual renderings of every room',
                    'Construction blueprints & floor plans',
                    'Contractor-ready scope of work',
                    'Itemized cost breakdown',
                  ].map((item, idx) => (
                    <li key={idx} className="text-white/80 text-sm flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <motion.button
                    onClick={() => navigate('/design-package')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-xl shadow-pink-500/20 transition-all text-base"
                  >
                    <Sparkles size={18} />
                    Get Your Design Package — ${CAD_PACKAGE_PRICE}
                    <ArrowRight size={18} />
                  </motion.button>
                  <span className="text-emerald-400/70 text-xs font-semibold">${(CAD_PACKAGE_US_PRICE_HIGH / 1000).toFixed(0)}K+ Value — yours at cost</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Footnotes ── */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 mb-6">
          {showTaxBenefits && (
            <p className="text-white/40 text-xs text-center max-w-lg">
              * Tax-adjusted amounts reflect estimated annual deductions at your {formatTaxBracket(onboarding?.income)} federal bracket, displayed as a monthly equivalent. Lender qualification uses the pre-tax payment of {fmtFull(newMonthly)}/mo.
            </p>
          )}
          <p className="text-white/30 text-[10px] text-center max-w-lg">
            † All costs, timelines, and scope of work are estimates based on projects of similar size in your area. Final pricing and schedule are confirmed by your licensed contractor after an on-site evaluation. We give you the most accurate planning data available — but every home has its own surprises.
          </p>
        </motion.div>

        {/* ── Footer ── */}
        <motion.footer
          variants={itemVariants}
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
          <p className="text-purple-400/40 text-xs mt-2">
            ExpandEase provides estimates for planning purposes only. All financing is subject to credit approval.
          </p>
        </motion.footer>
      </motion.div>
    </div>
  );
}

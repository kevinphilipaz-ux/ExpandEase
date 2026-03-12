import React, { useState, useEffect, useMemo, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Wallet,
  ListChecks,
  Calculator,
  Lightbulb,
  CheckCircle2,
  Circle,
  Sparkles,
  Save,
  ChevronRight,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { useProjectOptional } from './context/ProjectContext';
import { useAuthOptional } from './context/AuthContext';
import { SaveWorkModal } from './components/SaveWorkModal';
import {
  DEFAULT_CURRENT_HOME_VALUE,
  USER_RATE_ANNUAL,
  SECOND_LIEN_RATE_ANNUAL,
  MASTER_RENOVATION_ITEMS,
} from './config/renovationDefaults';
import { resolveExistingBalance, calculateBlendedPayment } from './utils/renovationMath';
import { PropertyOverview } from './components/PropertyOverview';
import { PropertyWishlist } from './components/PropertyWishlist';
import { FinancialAnalysis } from './components/FinancialAnalysis';
import { FeasibilityGrid } from './components/FeasibilityGrid';
import { RecommendationSection } from './components/RecommendationSection';
import { ChatBanner } from './components/ChatBanner';

interface SectionProgress {
  property: number;
  wishlist: number;
  financial: number;
  feasibility: number;
}

/** Catches section render errors so we show a fallback instead of a blank screen. */
class SectionErrorBoundary extends Component<
  { children: React.ReactNode; sectionKey: string; onBack: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SectionErrorBoundary] Section failed to load:', error, errorInfo.componentStack);
  }

  componentDidUpdate(prevProps: { sectionKey: string }) {
    if (prevProps.sectionKey !== this.props.sectionKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 text-center">
          <p className="text-white font-medium mb-2">Something went wrong loading this section.</p>
          <p className="text-purple-200/80 text-sm mb-4">You can go back and try again.</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              this.props.onBack();
            }}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
          >
            Go back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const projectCtx = useProjectOptional();
  const auth = useAuthOptional();
  const project = projectCtx?.project;
  const [activeSection, setActiveSection] = useState<string>('property');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [progress, setProgress] = useState<SectionProgress>({
    property: 100,
    wishlist: 0,
    financial: 0,
    feasibility: 0
  });

  const currentHomeValue = project?.property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
  const estCost = project?.financial?.totalCost ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.cost, 0);
  const totalValueAdded = project?.financial?.totalValue ?? MASTER_RENOVATION_ITEMS.reduce((s, i) => s + i.valueAdded, 0);
  const newValue = currentHomeValue + totalValueAdded;
  const userRate = (project?.onboarding?.mortgageRate ?? USER_RATE_ANNUAL * 100) / 100;
  const quickPayment = useMemo(() => {
    const { balance } = resolveExistingBalance(
      currentHomeValue, userRate,
      project?.financial?.existingMortgageBalance && project.financial.existingMortgageBalance > 0
        ? project.financial.existingMortgageBalance : undefined,
      project?.financial?.currentMonthlyPayment && project.financial.currentMonthlyPayment > 0
        ? project.financial.currentMonthlyPayment : undefined,
    );
    const blended = calculateBlendedPayment(balance, estCost, userRate, SECOND_LIEN_RATE_ANNUAL);
    return Math.round(blended.blendedPayment);
  }, [currentHomeValue, userRate, estCost, project?.financial?.existingMortgageBalance, project?.financial?.currentMonthlyPayment]);
  const formatEst = (n: number) => n >= 1000000 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1000).toFixed(0)}K`;

  const handleProgressUpdate = (section: keyof SectionProgress, value: number) => {
    setProgress(prev => ({ ...prev, [section]: value }));
  };

  const totalProgress = Math.round(
    (progress.property + progress.wishlist + progress.financial + progress.feasibility) / 4
  );

  const sections = [
    { id: 'property', label: 'Property', icon: Home, component: PropertyOverview, progress: progress.property },
    { id: 'wishlist', label: 'Wishlist', icon: ListChecks, component: PropertyWishlist, progress: progress.wishlist },
    { id: 'financial', label: 'Analysis', icon: Wallet, component: FinancialAnalysis, progress: progress.financial },
    { id: 'feasibility', label: 'Feasibility', icon: Calculator, component: FeasibilityGrid, progress: progress.feasibility },
  ];

  const currentSectionIndex = sections.findIndex(s => s.id === activeSection);

  // Scroll to top of page whenever section changes so user always lands at top of next section
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 font-sans text-white relative overflow-hidden">
      {/* Subtle Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Moving glow on all sections (Property, Wishlist, Analysis, Feasibility) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 animate-analysis-glow-move"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 70% at 50% 50%, rgba(168, 85, 247, 0.65) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(236, 72, 153, 0.55) 0%, transparent 55%),
            radial-gradient(ellipse 70% 80% at 50% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)
          `,
          backgroundSize: '150% 150%, 140% 140%, 160% 160%',
          backgroundPosition: '0% 50%, 100% 50%, 50% 0%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 animate-pulse-page-glow"
        aria-hidden
        style={{
          background: 'radial-gradient(ellipse 150% 100% at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-purple-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Back button — show when not on first section (easy jump back on mobile) */}
            <div className="flex items-center gap-3 shrink-0">
              {currentSectionIndex > 0 ? (
                <motion.button
                  type="button"
                  onClick={() => {
                    const prevIndex = currentSectionIndex - 1;
                    setActiveSection(sections[prevIndex].id);
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="flex items-center gap-1.5 p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={`Back to ${sections[currentSectionIndex - 1].label}`}
                >
                  <ChevronLeft size={22} />
                  <span className="text-sm font-medium hidden sm:inline">Back</span>
                </motion.button>
              ) : (
                <div className="w-10" aria-hidden="true" />
              )}
            </div>
            {/* Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">Dream Home Analysis</h1>
                <p className="text-xs text-purple-300">Build your perfect renovation plan</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 max-w-md mx-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-purple-300">Analysis Progress</span>
                <span className="text-white font-medium">{totalProgress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Save Work / Saved */}
            <div className="flex items-center gap-2 text-sm">
              {auth?.user ? (
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => auth.signOut()}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-purple-300 hover:text-white hover:bg-white/10 transition-colors text-xs"
                    aria-label="Sign out"
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={16} />
                    <span className="hidden sm:inline text-xs">
                      Saved to your account{(() => {
                        const firstName = auth.user.user_metadata?.given_name ?? auth.user.user_metadata?.full_name?.split(' ')[0] ?? auth.user.email?.split('@')[0];
                        return firstName ? `, ${firstName}` : '';
                      })()}
                    </span>
                  </div>
                </div>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => setSaveModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors border border-white/10 animate-button-glow"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatType: 'loop' }}
                >
                  <Save size={16} />
                  <span className="hidden sm:inline text-xs font-medium">Save Work</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isCompleted = section.progress >= 100;
              // Only lock *future* sections whose previous section isn't far enough along.
              // Once you've reached a section (or any earlier one), you can always navigate back to it.
              const isLocked = idx > currentSectionIndex && idx > 0 && sections[idx - 1].progress < 50;
              const isNextSection = idx === currentSectionIndex + 1;

              return (
                <motion.button
                  type="button"
                  key={section.id}
                  onClick={() => !isLocked && setActiveSection(section.id)}
                  disabled={isLocked}
                  whileTap={isLocked ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isLocked
                      ? 'text-purple-400/50 cursor-not-allowed'
                      : isCompleted
                      ? 'text-emerald-300 hover:bg-white/10'
                      : 'text-purple-300 hover:bg-white/10'
                  } ${!isLocked && isNextSection ? 'animate-button-glow-2x' : ''}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <Icon size={16} />
                  )}
                  <span className="hidden sm:inline">{section.label}</span>
                  {isActive && section.progress > 0 && section.progress < 100 && (
                    <span className="text-xs text-purple-300">({section.progress}%)</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 relative z-10 min-w-0 overflow-hidden">
        {/* Section Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <SectionErrorBoundary
              sectionKey={activeSection}
              onBack={() => {
                const prevIndex = Math.max(0, currentSectionIndex - 1);
                setActiveSection(sections[prevIndex].id);
              }}
            >
              {(() => {
                const section = sections.find((s) => s.id === activeSection);
                if (!section) return null;
                const Component = section.component;
                const nextSection = sections[currentSectionIndex + 1];
                if (section.id === 'feasibility') {
                  return (
                    <div key={section.id} className="space-y-10" id="your-decision">
                      <RecommendationSection variant="dashboard" />
                      <Component
                        onProgressUpdate={(value: number) => handleProgressUpdate(section.id as keyof SectionProgress, value)}
                        isActive={true}
                        onNavigateTo={(sectionId: string) => setActiveSection(sectionId)}
                      />
                    </div>
                  );
                }
                if (section.id === 'wishlist') {
                  return (
                    <Component
                      key={section.id}
                      onProgressUpdate={(value: number) => handleProgressUpdate(section.id as keyof SectionProgress, value)}
                      isActive={true}
                      initialBedrooms={project?.property?.beds}
                      initialBathrooms={project?.property?.baths}
                      onFinishWishlist={nextSection ? () => setActiveSection(nextSection.id) : undefined}
                      nextSectionLabel={nextSection?.label ?? 'Analysis'}
                    />
                  );
                }
                return (
                  <Component
                    key={section.id}
                    onProgressUpdate={(value: number) => handleProgressUpdate(section.id as keyof SectionProgress, value)}
                    isActive={true}
                    {...(section.id === 'property' && nextSection && {
                      onNextSection: () => setActiveSection(nextSection.id),
                    })}
                  />
                );
              })()}
            </SectionErrorBoundary>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer — minimal when on last section; stats centered */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.button
            type="button"
            onClick={() => {
              const prevIndex = Math.max(0, currentSectionIndex - 1);
              setActiveSection(sections[prevIndex].id);
            }}
            disabled={currentSectionIndex === 0}
            whileTap={currentSectionIndex === 0 ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed order-2 sm:order-1 min-w-[140px] justify-center sm:justify-start border border-white/10 hover:border-white/20"
            aria-label={currentSectionIndex > 0 ? `Back to ${sections[currentSectionIndex - 1].label}` : undefined}
          >
            <ChevronLeft size={18} />
            {currentSectionIndex > 0 ? `Back to ${sections[currentSectionIndex - 1].label}` : 'Previous'}
          </motion.button>

          {/* Quick Stats — centered when on last section so nothing is off-center */}
          <div className="hidden md:flex items-center justify-center gap-6 text-sm flex-1 order-1 sm:order-2">
            <div className="text-center">
              <p className="text-purple-300 text-xs">Est. Cost</p>
              <p className="font-bold text-white">{formatEst(estCost)}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-purple-300 text-xs">New Value</p>
              <p className="font-bold text-emerald-400">{formatEst(newValue)}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-purple-300 text-xs">Monthly</p>
              <p className="font-bold text-white">${quickPayment.toLocaleString()}</p>
            </div>
          </div>

          {activeSection === 'wishlist' ? (
            <span className="text-purple-300/50 text-xs order-3">Complete your selections above, then use Next Section</span>
          ) : currentSectionIndex < sections.length - 1 ? (
            <motion.button
              type="button"
              onClick={() => {
                const nextIndex = Math.min(sections.length - 1, currentSectionIndex + 1);
                setActiveSection(sections[nextIndex].id);
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-purple-900 font-bold hover:bg-gray-100 transition-all order-3 animate-button-glow-2x"
            >
              Next Section
              <ChevronRight size={18} />
            </motion.button>
          ) : (
            <a
              href="#your-decision"
              className="text-purple-300 hover:text-white text-sm font-medium order-3"
            >
              Scroll to your options ↑
            </a>
          )}
        </div>

        {/* Help Footer */}
        <footer className="mt-12 text-center border-t border-white/10 pt-6">
          <p className="text-purple-300/60 text-sm">
            Questions? Open the chat in the bottom right or call <a href="tel:1-800-EXPAND" className="text-purple-300 hover:text-white">1-800-EXPAND</a>
          </p>
          <p className="text-purple-400/60 text-xs mt-2">Estimated costs and values — not a bid or guarantee. Get quotes from licensed contractors.</p>
        </footer>
      </main>

      <SaveWorkModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} />
      <ChatBanner />
    </div>
  );
}
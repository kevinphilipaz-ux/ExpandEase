import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useProjectOptional } from './context/ProjectContext';
import { PropertyOverview } from './components/PropertyOverview';
import { PropertyWishlist } from './components/PropertyWishlist';
import { FinancialAnalysis } from './components/FinancialAnalysis';
import { FeasibilityGrid } from './components/FeasibilityGrid';
import { RecommendationSection } from './components/RecommendationSection';

interface SectionProgress {
  property: number;
  wishlist: number;
  financial: number;
  feasibility: number;
}

export function App() {
  const projectCtx = useProjectOptional();
  const project = projectCtx?.project;
  const [activeSection, setActiveSection] = useState<string>('property');
  const [saved, setSaved] = useState(true);
  const [progress, setProgress] = useState<SectionProgress>({
    property: 100,
    wishlist: 0,
    financial: 0,
    feasibility: 0
  });

  const estCost = project?.financial?.totalCost ?? 575000;
  const newValue = project?.financial?.totalValue ?? 3640000;
  const monthlyPayment = project?.financial?.totalCost
    ? Math.round(project.financial.totalCost * 0.0065) // ~30-yr payment estimate
    : 3850;
  const formatEst = (n: number) => n >= 1000000 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1000).toFixed(0)}K`;

  // Auto-save indicator
  useEffect(() => {
    if (!saved) {
      const timer = setTimeout(() => setSaved(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleProgressUpdate = (section: keyof SectionProgress, value: number) => {
    setProgress(prev => ({ ...prev, [section]: value }));
    setSaved(false);
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

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-purple-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
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

            {/* Save Status */}
            <div className="flex items-center gap-2 text-sm">
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-emerald-400"
                  >
                    <CheckCircle2 size={16} />
                    <span className="hidden sm:inline text-xs">Saved</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-purple-300"
                  >
                    <Save size={16} className="animate-pulse" />
                    <span className="hidden sm:inline text-xs">Saving...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isCompleted = section.progress >= 100;
              const isLocked = idx > 0 && sections[idx - 1].progress < 50;

              return (
                <button
                  key={section.id}
                  onClick={() => !isLocked && setActiveSection(section.id)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isLocked
                      ? 'text-purple-400/50 cursor-not-allowed'
                      : isCompleted
                      ? 'text-emerald-300 hover:bg-white/10'
                      : 'text-purple-300 hover:bg-white/10'
                  }`}
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
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 relative z-10">
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
            {sections.map((section) => {
              const Component = section.component;
              if (section.id !== activeSection) return null;
              if (section.id === 'feasibility') {
                return (
                  <div key={section.id} className="space-y-10" id="your-decision">
                    <RecommendationSection variant="dashboard" />
                    <Component
                      onProgressUpdate={(value: number) => handleProgressUpdate(section.id as keyof SectionProgress, value)}
                      isActive={true}
                    />
                  </div>
                );
              }
              if (section.id === 'wishlist') {
                const nextSection = sections[currentSectionIndex + 1];
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
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer — minimal when on last section; stats centered */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => {
              const prevIndex = Math.max(0, currentSectionIndex - 1);
              setActiveSection(sections[prevIndex].id);
            }}
            disabled={currentSectionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Previous
          </button>

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
              <p className="font-bold text-white">${monthlyPayment.toLocaleString()}</p>
            </div>
          </div>

          {activeSection === 'wishlist' ? (
            <span className="text-purple-300/50 text-xs order-3">Continue with the button above</span>
          ) : currentSectionIndex < sections.length - 1 ? (
            <button
              onClick={() => {
                const nextIndex = Math.min(sections.length - 1, currentSectionIndex + 1);
                setActiveSection(sections[nextIndex].id);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-purple-900 font-bold hover:bg-gray-100 transition-all order-3"
            >
              Next Section
              <ChevronRight size={18} />
            </button>
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
            Questions? <button className="text-purple-300 hover:text-white underline">Chat with an expert</button> or call <a href="tel:1-800-EXPAND" className="text-purple-300 hover:text-white">1-800-EXPAND</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
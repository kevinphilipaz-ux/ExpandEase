import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Pencil,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Home,
  BedDouble,
  Sparkles,
  Palmtree,
  ArrowRight,
  CheckCircle2,
  Shield,
  Users,
  Clock3,
  Building2,
  Zap
} from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';

const GOALS = [
  { id: 'space', label: 'More Space', icon: BedDouble, desc: 'Add bedrooms, expand living areas', popular: true },
  { id: 'lifestyle', label: 'Lifestyle Upgrade', icon: Palmtree, desc: 'Pool, outdoor living, luxury', popular: false },
  { id: 'modern', label: 'Modernization', icon: Sparkles, desc: 'Kitchen, baths, smart home', popular: true },
  { id: 'everything', label: 'Major Renovation', icon: Home, desc: 'Transform the entire home', popular: false },
];

const TIMELINES = [
  { value: 'urgent', label: 'ASAP', icon: Zap, subtext: 'Ready to start now' },
  { value: '3_months', label: '3 Months', icon: Clock, subtext: 'Planning phase' },
  { value: '6_months', label: '6+ Months', icon: Clock3, subtext: 'Early exploration' },
  { value: 'dreaming', label: 'Just Dreaming', icon: Building2, subtext: 'No rush at all' },
];

const SOCIAL_PROOF = [
  { stat: 'Future Value', label: 'Borrow on Completed Value', icon: TrendingUp },
  { stat: 'Stay Put', label: 'Keep Your Low Rate', icon: Home },
  { stat: 'Instant', label: 'See the Numbers First', icon: Star },
];

const TRUST_BADGES = [
  { icon: Shield, label: 'Licensed & Insured' },
  { icon: CheckCircle2, label: 'Fixed-Price Guarantee' },
  { icon: Clock3, label: 'On-Time Delivery' },
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, updateData } = useOnboarding();
  const addressFromState = (location.state as { address?: string } | null)?.address?.trim() || '';
  const initialAddress = addressFromState || data.address || '';
  const [formData, setFormData] = useState({
    address: initialAddress,
    income: data.income || 150000,
    goal: data.goal || '',
    mortgageRate: data.mortgageRate || 3.5,
    timeline: data.timeline || '',
  });
  const [addressFieldValid, setAddressFieldValid] = useState(initialAddress.length > 5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  useGooglePlacesAutocomplete(addressContainerRef, {
    onPlaceSelect: (formattedAddress) => {
      setFormData((prev) => ({ ...prev, address: formattedAddress }));
      setAddressFieldValid(true);
      setIsEditingAddress(false);
    },
    enabled: true,
  });

  // When we received an address from the landing page via navigation state, keep context in sync
  useEffect(() => {
    if (addressFromState) {
      updateData({ address: addressFromState });
    }
  }, [addressFromState, updateData]);

  // Calculate form progress
  useEffect(() => {
    let progress = 0;
    if (addressFieldValid) progress += 25;
    if (formData.goal) progress += 25;
    if (formData.timeline) progress += 25;
    if (formData.income > 0) progress += 25;
    setFormProgress(progress);
  }, [formData, addressFieldValid]);

  const formatIncome = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    updateData({
      ...formData,
      address: formData.address.trim(),
    });

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    navigate('/analysis');
  };

  const isFormValid = addressFieldValid && formData.goal && formData.timeline;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0612] via-[#1a0e2e] to-[#2d1b4e] text-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
        </div>

        {/* Header */}
        <header className="relative z-10 px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Home size={24} className="text-white" />
            </div>
            <span className="font-bold text-xl">ExpandEase</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Users size={16} />
              15,000+ homeowners
            </span>
            <span className="flex items-center gap-2">
              <Shield size={16} />
              Licensed & Insured
            </span>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6"
            >
              <Zap size={16} />
              Get your free renovation plan in 60 seconds
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Unlock Your Home's
              <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Hidden Potential
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              See how much equity you can create, what your renovation will cost,
              and get a custom plan — all without leaving your home.
            </p>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {SOCIAL_PROOF.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="text-center"
                  >
                    <p className="text-2xl md:text-3xl font-bold text-white">{item.stat}</p>
                    <div className="flex items-center gap-1 justify-center text-gray-400 text-sm">
                      <Icon size={14} />
                      {item.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl shadow-purple-900/20">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-300">Completion</span>
                  <span className="text-white font-medium">{formProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${formProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Property Address: show address + small edit control; full input only when editing or no address yet */}
                <div className="address-input-wrap relative z-[100] overflow-visible">
                  <label className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3 block" htmlFor="address-onboarding-flow">
                    Property Address
                  </label>
                  {formData.address && !isEditingAddress ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-emerald-400/90" data-testid="carried-address">
                        Using: {formData.address}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(true)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/20 bg-white/5 text-gray-400 hover:text-pink-400 hover:border-pink-500/50 hover:bg-pink-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                        aria-label="Change address"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  ) : null}
                  <div
                    className={`relative flex items-center bg-gray-900/50 border border-white/20 rounded-xl overflow-visible ${formData.address && isEditingAddress ? 'mt-2' : ''} ${formData.address && !isEditingAddress ? 'hidden' : ''}`}
                  >
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none" size={20} />
                    <div ref={addressContainerRef} className="flex-1 min-w-0 [&_.gmp-place-autocomplete-input]:!w-full [&_.gmp-place-autocomplete-input]:!py-4 [&_.gmp-place-autocomplete-input]:!pl-12 [&_.gmp-place-autocomplete-input]:!pr-4 [&_.gmp-place-autocomplete-input]:!bg-transparent [&_.gmp-place-autocomplete-input]:!border-0 [&_.gmp-place-autocomplete-input]:!text-white [&_.gmp-place-autocomplete-input]:!focus:ring-2 [&_.gmp-place-autocomplete-input]:!focus:ring-pink-500/50" style={{ minHeight: 52 }} />
                  </div>
                  {formData.address && isEditingAddress ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <input type="hidden" id="address-onboarding-flow" name="address" value={formData.address} readOnly aria-hidden="true" />
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Income Slider */}
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3 block">
                      Household Income
                    </label>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-purple-400 font-mono font-bold text-xl">
                          {formatIncome(formData.income)}
                        </span>
                        <span className="text-gray-500 text-xs">/year</span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="500000"
                        step="10000"
                        value={formData.income}
                        onChange={(e) => setFormData(prev => ({ ...prev, income: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>$50k</span>
                        <span>$500k+</span>
                      </div>
                    </div>
                  </div>

                  {/* Mortgage Rate */}
                  <div>
                    <label className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3 block">
                      Current Mortgage Rate
                    </label>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-pink-400 font-mono font-bold text-xl">
                          {formData.mortgageRate}%
                        </span>
                        <span className="text-gray-500 text-xs">Interest</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        step="0.125"
                        value={formData.mortgageRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, mortgageRate: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>2%</span>
                        <span>8%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Goal Selection */}
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3 block">
                    What's Your Goal?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {GOALS.map((goal) => {
                      const Icon = goal.icon;
                      const isSelected = formData.goal === goal.id;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, goal: goal.id }))}
                          className={`relative p-4 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-pink-500/20 border-pink-500 shadow-lg shadow-pink-500/20'
                              : 'bg-gray-900/50 border-white/10 hover:bg-gray-800 hover:border-white/20'
                          }`}
                        >
                          {goal.popular && (
                            <span className="absolute top-2 right-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                          <Icon size={24} className={`mx-auto mb-2 ${isSelected ? 'text-pink-400' : 'text-gray-400'}`} />
                          <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>{goal.label}</p>
                          <p className="text-gray-500 text-xs mt-1 hidden sm:block">{goal.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline Selection */}
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3 block">
                    When Are You Looking to Start?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TIMELINES.map((timeline) => {
                      const Icon = timeline.icon;
                      const isSelected = formData.timeline === timeline.value;
                      return (
                        <button
                          key={timeline.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, timeline: timeline.value }))}
                          className={`p-4 rounded-xl border flex flex-col items-center transition-all ${
                            isSelected
                              ? 'bg-pink-500/20 border-pink-500'
                              : 'bg-gray-900/50 border-white/10 hover:bg-gray-800 hover:border-white/20'
                          }`}
                        >
                          <Icon size={20} className={`mb-2 ${isSelected ? 'text-pink-400' : 'text-gray-400'}`} />
                          <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>{timeline.label}</p>
                          <p className="text-gray-500 text-xs">{timeline.subtext}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Single CTA: everyone goes to analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 max-w-3xl mx-auto"
            >
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-900/20"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Taking you to your analysis...</span>
                ) : (
                  <>
                    Get Your Free Analysis
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-center text-gray-500 text-sm mt-4">
                No credit card required • You'll see your numbers, then choose how to proceed
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
                {TRUST_BADGES.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.label} className="flex items-center gap-2 text-gray-400 text-sm">
                      <Icon size={16} className="text-emerald-400" />
                      {badge.label}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0612]"
          >
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-[100px]" />

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">Analyzing Your Home...</h3>
              <p className="text-gray-400">This usually takes 10-15 seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Home, LineChart, MapPin, Edit2, Check, TrendingUp, BedDouble, Bath, Ruler, Calendar, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { useProjectOptional } from '../context/ProjectContext';
import { motion, AnimatePresence } from 'framer-motion';
import { usePropertyData } from '../hooks/usePropertyData';

function formatPrice(val: number): string {
  if (val >= 1000000) {
    return `$${(val / 1000000).toFixed(1)}M`;
  }
  return `$${(val / 1000).toFixed(0)}K`;
}

interface PropertyOverviewProps {
  onProgressUpdate?: (value: number) => void;
  isActive?: boolean;
}

export function PropertyOverview({ onProgressUpdate }: PropertyOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showComps, setShowComps] = useState(false);

  const projectCtx = useProjectOptional();
  let displayAddress = '512 N 41st St, Phoenix, AZ 85018';
  try {
    const { data } = useOnboarding();
    const addr = projectCtx?.project?.property?.address || data?.address;
    if (addr && addr.length > 5) displayAddress = addr;
  } catch {
    // Context not available, use default
  }

  const { subject, comps, loading, error, isRealData, retry } = usePropertyData(displayAddress);

  const [edits, setEdits] = useState({
    beds: subject.beds,
    baths: subject.baths,
    sqft: subject.sqft,
    yearBuilt: subject.yearBuilt,
    pool: subject.pool,
  });

  useEffect(() => {
    if (!loading && (subject.beds !== 0 || subject.sqft !== 0)) {
      setEdits({
        beds: subject.beds,
        baths: subject.baths,
        sqft: subject.sqft,
        yearBuilt: subject.yearBuilt,
        pool: subject.pool,
      });
    }
  }, [loading, subject.beds, subject.baths, subject.sqft, subject.yearBuilt, subject.pool]);

  useEffect(() => {
    if (!projectCtx || loading) return;
    if (subject.beds > 0 || subject.baths > 0) {
      projectCtx.updateProject({
        property: {
          ...projectCtx.project.property,
          beds: subject.beds,
          baths: subject.baths,
        },
      });
    }
  }, [loading, subject.beds, subject.baths, projectCtx]);

  useEffect(() => {
    onProgressUpdate?.(100);
  }, [onProgressUpdate]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Property</h2>
            <p className="text-purple-300/70 text-sm mt-1">Loading property details…</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20">
              <Home size={20} className="text-purple-300" />
            </div>
            <div className="flex-1">
              <p className="text-purple-300 text-xs uppercase tracking-wider">Property Address</p>
              <p className="text-lg font-semibold text-white">{displayAddress}</p>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Fetching value & comparables</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-white/10 rounded-2xl border border-white/20 p-8 flex items-center justify-center">
          <Loader2 size={32} className="text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner with retry */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3"
          >
            <p className="text-amber-200 text-sm">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Property</h2>
          <p className="text-purple-300/70 text-sm mt-1 flex items-center gap-2">
            Confirm your home details for accurate estimates
            {isRealData && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                Live data
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            if (isEditing && projectCtx) {
              projectCtx.updateProject({
                property: {
                  ...projectCtx.project.property,
                  address: displayAddress,
                  beds: edits.beds,
                  baths: edits.baths,
                  sqft: edits.sqft,
                  yearBuilt: edits.yearBuilt,
                  pool: edits.pool,
                  currentValue: subject.value > 0 ? subject.value : projectCtx.project.property.currentValue,
                  equity: subject.equity ?? projectCtx.project.property.equity,
                },
              });
            }
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
        >
          {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
          {isEditing ? 'Done' : 'Edit Details'}
        </button>
      </div>

      {/* Address Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20">
            <Home size={20} className="text-purple-300" />
          </div>
          <div className="flex-1">
            <p className="text-purple-300 text-xs uppercase tracking-wider">Property Address</p>
            <p className="text-lg font-semibold text-white">{displayAddress}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-purple-300 text-xs uppercase tracking-wider">Estimated Value</p>
            <p className="text-2xl font-bold text-emerald-400">{formatPrice(subject.value)}</p>
          </div>
        </div>
      </div>

      {/* Key Stats Grid - Inline Editable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Bedrooms', value: edits.beds, icon: BedDouble, key: 'beds', suffix: '', noComma: false },
          { label: 'Bathrooms', value: edits.baths, icon: Bath, key: 'baths', suffix: '', noComma: false },
          { label: 'Square Feet', value: edits.sqft, icon: Ruler, key: 'sqft', suffix: '', noComma: false },
          { label: 'Year Built', value: edits.yearBuilt, icon: Calendar, key: 'yearBuilt', suffix: '', noComma: true }
        ].map((stat) => {
          const Icon = stat.icon;
          const displayValue = stat.noComma ? String(stat.value) : stat.value.toLocaleString();
          return (
            <motion.div
              key={stat.key}
              className={`bg-white/5 backdrop-blur-md rounded-xl border p-4 transition-all ${
                isEditing ? 'border-pink-500/50 ring-1 ring-pink-500/20' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-purple-400" />
                <p className="text-purple-300 text-xs uppercase tracking-wider">{stat.label}</p>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={stat.value}
                  onChange={(e) => setEdits(prev => ({ ...prev, [stat.key]: Number(e.target.value) }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xl font-bold text-white focus:outline-none focus:border-pink-500"
                />
              ) : (
                <p className="text-2xl font-bold text-white">{displayValue}{stat.suffix}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className={`bg-white/5 rounded-xl p-4 border ${isEditing ? 'border-pink-500/50' : 'border-white/10'}`}>
          <p className="text-purple-300 text-xs uppercase tracking-wider mb-2">Pool</p>
          {isEditing ? (
            <div className="flex gap-2">
              {['Yes', 'No'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setEdits(prev => ({ ...prev, pool: opt === 'Yes' }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    (opt === 'Yes') === edits.pool
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 text-purple-300 hover:bg-white/20'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-lg font-semibold text-white">{edits.pool ? 'Yes' : 'No'}</p>
          )}
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-purple-300 text-xs uppercase tracking-wider mb-2">Home Type</p>
          <p className="text-lg font-semibold text-white">Single Family</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-purple-300 text-xs uppercase tracking-wider mb-2">Current Equity</p>
          <p className="text-lg font-semibold text-emerald-400">{formatPrice(subject.equity)}</p>
        </div>
      </div>

      {/* Comparable Properties - Expandable */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
        <button
          onClick={() => setShowComps(!showComps)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <LineChart size={18} className="text-purple-300" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Comparable Properties</p>
              <p className="text-purple-300/70 text-xs">
                {comps.length} {comps.length === 1 ? 'home' : 'homes'} {isRealData ? 'sold or listed' : 'sold'} within 1 mile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-emerald-400 text-sm">
              <TrendingUp size={14} />
              <span>Values trending up</span>
            </div>
            <motion.div
              animate={{ rotate: showComps ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={20} className="text-purple-400" style={{ transform: 'rotate(90deg)' }} />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {showComps && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {comps.length === 0 ? (
                  <p className="text-purple-300/70 text-sm py-4">No comparable properties found for this address.</p>
                ) : (
                  comps.map((comp, i) => (
                    <div
                      key={comp.address + i}
                      className="bg-white/5 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MapPin size={14} className="text-purple-400 shrink-0" />
                        <p className="text-sm font-medium truncate">{comp.address}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="font-bold text-white">{formatPrice(comp.price)}</span>
                        {comp.sqft > 0 && <span className="text-purple-300">{comp.sqft.toLocaleString()} sqft</span>}
                        {(comp.beds > 0 || comp.baths > 0) && (
                          <span className="text-purple-300 hidden sm:inline">
                            {comp.beds}bd/{comp.baths}ba
                          </span>
                        )}
                        {comp.daysOnMarket > 0 && (
                          <span className="text-gray-500 text-xs">{comp.daysOnMarket}d ago</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Tip */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 mt-0.5">
          <TrendingUp size={16} />
        </div>
        <div>
          <p className="text-blue-200 text-sm font-medium">Pro Tip</p>
          <p className="text-blue-200/70 text-xs mt-0.5">
            {isRealData
              ? 'Property value and comparables are from live market data. You can still edit details to refine estimates.'
              : 'Add a RentCast API key (VITE_RENTCAST_API_KEY) to see real property values and comparables for your address.'}
          </p>
        </div>
      </div>
    </div>
  );
}

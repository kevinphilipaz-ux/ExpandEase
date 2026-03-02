import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BedDouble,
  ChefHat,
  Waves,
  Sofa,
  Plus,
  Minus,
  Check,
  Umbrella,
  Utensils,
  Ruler } from
'lucide-react';
export interface ProjectBuilderOutput {
  estimatedBudgetMin: number;
  estimatedBudgetMax: number;
  equityMultiplier: number;
  additionsCost: number;
  renovationsCost: number;
}
interface ProjectBuilderProps {
  onUpdate: (output: ProjectBuilderOutput) => void;
}
type TierType = 'essential' | 'elevated' | 'luxury';
const TIERS = [
{
  id: 'essential',
  label: 'Essential',
  sub: 'High-Quality Standard',
  cost: '$300-400',
  multiplier: 0.8,
  equityMult: 1.2
},
{
  id: 'elevated',
  label: 'Elevated',
  sub: 'Designer Curated',
  cost: '$500-600',
  multiplier: 1.0,
  equityMult: 1.4
},
{
  id: 'luxury',
  label: 'Luxury',
  sub: 'Architect-Grade',
  cost: '$700+',
  multiplier: 1.4,
  equityMult: 1.6
}] as
const;
export function ProjectBuilder({ onUpdate }: ProjectBuilderProps) {
  // --- Add Space State ---
  const [masterSuite, setMasterSuite] = useState(false);
  const [bedsToAdd, setBedsToAdd] = useState(0);
  const [bathsToAdd, setBathsToAdd] = useState(0);
  // --- Upgrade State ---
  const [kitchen, setKitchen] = useState(true);
  const [pool, setPool] = useState(false);
  const [otherRooms, setOtherRooms] = useState(false);
  const [poolExtras, setPoolExtras] = useState<string[]>([]);
  // --- Shared State ---
  const [tier, setTier] = useState<TierType>('elevated');
  // Derived: is anything in "Add Space" active?
  const hasAdditions = masterSuite || bedsToAdd > 0 || bathsToAdd > 0;
  const hasOnlyUpgrades = !hasAdditions && (kitchen || pool || otherRooms);
  // New sqft calculation — master suite = 550sqft, full bath = 80sqft, half bath = 40sqft
  const newSqFt =
  (masterSuite ? 550 : 0) +
  bedsToAdd * 250 +
  Math.floor(bathsToAdd) * 80 + (
  bathsToAdd % 1 > 0 ? 40 : 0);
  // --- Smart Defaults ---
  const toggleMasterSuite = () => {
    if (!masterSuite) {
      setMasterSuite(true);
      if (bedsToAdd === 0) setBedsToAdd(1);
      if (bathsToAdd === 0) setBathsToAdd(1);
    } else {
      setMasterSuite(false);
    }
  };
  const handleBedsChange = (val: number) => {
    setBedsToAdd(val);
    // Auto-select master suite if adding 2+ bedrooms
    if (val >= 2 && !masterSuite) {
      setMasterSuite(true);
      if (bathsToAdd === 0) setBathsToAdd(1);
    }
  };
  const toggleKitchen = () => {
    const next = !kitchen;
    setKitchen(next);
    // Kitchen disables Essential tier
    if (next && tier === 'essential') setTier('elevated');
  };
  const togglePoolExtra = (extra: string) => {
    setPoolExtras((prev) =>
    prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  };
  // --- Calculations ---
  const stableOnUpdate = useCallback(onUpdate, []);
  useEffect(() => {
    // Additions cost
    let addCost = 0;
    if (masterSuite) addCost += 120000;
    addCost += bedsToAdd * 40000;
    // Full baths cost $25k, half baths cost $12.5k
    addCost += Math.floor(bathsToAdd) * 25000 + (bathsToAdd % 1 > 0 ? 12500 : 0);
    // Renovations cost
    let renoCost = 0;
    if (kitchen) renoCost += 85000;
    if (pool) {
      renoCost += 95000;
      if (poolExtras.includes('kitchen')) renoCost += 15000;
      if (poolExtras.includes('cabana')) renoCost += 25000;
    }
    if (otherRooms) renoCost += 55000;
    const baseTotal = addCost + renoCost;
    const selectedTier = TIERS.find((t) => t.id === tier);
    const multiplier = selectedTier?.multiplier || 1;
    const equityMult = selectedTier?.equityMult || 1.2;
    const calculatedTotal = baseTotal * multiplier;
    stableOnUpdate({
      estimatedBudgetMin: Math.round(calculatedTotal * 0.85),
      estimatedBudgetMax: Math.round(calculatedTotal * 1.15),
      equityMultiplier: equityMult,
      additionsCost: Math.round(addCost * multiplier),
      renovationsCost: Math.round(renoCost * multiplier)
    });
  }, [
  masterSuite,
  bedsToAdd,
  bathsToAdd,
  kitchen,
  pool,
  otherRooms,
  poolExtras,
  tier,
  stableOnUpdate]
  );
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-5">
      {/* ─── GROUP 1: ADD NEW SPACE ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-blue-500/30"></div>
          <label className="text-blue-300 text-[10px] uppercase tracking-wider font-bold shrink-0">
            Add New Space
          </label>
          <div className="h-px flex-1 bg-blue-500/30"></div>
        </div>

        {/* Master Suite Toggle */}
        <motion.button
          whileTap={{
            scale: 0.97
          }}
          onClick={toggleMasterSuite}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 border mb-3 ${masterSuite ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10 hover:text-white'}`}>

          <span className="flex items-center gap-2">
            <BedDouble
              size={14}
              className={masterSuite ? 'text-blue-400' : 'text-purple-400'} />

            Master Suite Addition
          </span>
          <span
            className={`text-[10px] font-mono ${masterSuite ? 'text-blue-300' : 'text-gray-500'}`}>

            +550 sqft
          </span>
        </motion.button>

        {/* Steppers - always visible */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          {/* Bedrooms to Add */}
          <div className="flex flex-col gap-1">
            <span className="text-blue-300/70 text-[10px] uppercase tracking-wider">
              Beds to Add
            </span>
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
              <button
                onClick={() => handleBedsChange(Math.max(0, bedsToAdd - 1))}
                className="p-1 hover:bg-white/10 rounded text-purple-200">

                <Minus size={12} />
              </button>
              <span className="w-6 text-center font-mono font-bold text-white text-sm">
                {bedsToAdd}
              </span>
              <button
                onClick={() => handleBedsChange(bedsToAdd + 1)}
                className="p-1 hover:bg-white/10 rounded text-purple-200">

                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Bathrooms to Add */}
          <div className="flex flex-col gap-1">
            <span className="text-blue-300/70 text-[10px] uppercase tracking-wider">
              Baths to Add
            </span>
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
              <button
                onClick={() => setBathsToAdd(Math.max(0, bathsToAdd - 0.5))}
                className="p-1 hover:bg-white/10 rounded text-purple-200">

                <Minus size={12} />
              </button>
              <span className="w-8 text-center font-mono font-bold text-white text-sm">
                {bathsToAdd % 1 > 0 ? bathsToAdd.toFixed(1) : bathsToAdd}
              </span>
              <button
                onClick={() => setBathsToAdd(bathsToAdd + 0.5)}
                className="p-1 hover:bg-white/10 rounded text-purple-200">

                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* New SqFt Counter */}
          <div className="flex flex-col gap-1">
            <span className="text-blue-300/70 text-[10px] uppercase tracking-wider">
              New SqFt
            </span>
            <div className="flex items-center gap-1 px-2 py-1.5">
              <Ruler size={12} className="text-blue-400" />
              <span
                className={`font-mono font-bold text-sm ${newSqFt > 0 ? 'text-blue-300' : 'text-gray-500'}`}>

                +{newSqFt.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── GROUP 2: UPGRADE EXISTING ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-purple-500/30"></div>
          <label className="text-purple-300 text-[10px] uppercase tracking-wider font-bold shrink-0">
            Upgrade Existing
          </label>
          <div className="h-px flex-1 bg-purple-500/30"></div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Kitchen */}
          <motion.button
            whileTap={{
              scale: 0.95
            }}
            onClick={toggleKitchen}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${kitchen ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10 hover:text-white'}`}>

            <ChefHat
              size={14}
              className={kitchen ? 'text-purple-300' : 'text-purple-400'} />

            Kitchen
          </motion.button>

          {/* Pool */}
          <motion.button
            whileTap={{
              scale: 0.95
            }}
            onClick={() => setPool(!pool)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${pool ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10 hover:text-white'}`}>

            <Waves
              size={14}
              className={pool ? 'text-purple-300' : 'text-purple-400'} />

            Pool & Outdoor
          </motion.button>

          {/* Other Rooms */}
          <motion.button
            whileTap={{
              scale: 0.95
            }}
            onClick={() => setOtherRooms(!otherRooms)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${otherRooms ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10 hover:text-white'}`}>

            <Sofa
              size={14}
              className={otherRooms ? 'text-purple-300' : 'text-purple-400'} />

            Other Rooms
          </motion.button>
        </div>

        {/* Pool Sub-options */}
        <AnimatePresence>
          {pool &&
          <motion.div
            initial={{
              height: 0,
              opacity: 0
            }}
            animate={{
              height: 'auto',
              opacity: 1
            }}
            exit={{
              height: 0,
              opacity: 0
            }}
            className="overflow-hidden">

              <div className="flex gap-2 mt-2 ml-2">
                <button
                onClick={() => togglePoolExtra('kitchen')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors ${poolExtras.includes('kitchen') ? 'bg-purple-500/20 border-purple-400 text-purple-200' : 'border-white/10 text-gray-400'}`}>

                  <Utensils size={10} /> Outdoor Kitchen
                </button>
                <button
                onClick={() => togglePoolExtra('cabana')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors ${poolExtras.includes('cabana') ? 'bg-purple-500/20 border-purple-400 text-purple-200' : 'border-white/10 text-gray-400'}`}>

                  <Umbrella size={10} /> Cabana
                </button>
              </div>
            </motion.div>
          }
        </AnimatePresence>

        {/* Micro-label */}
        <p className="text-[10px] text-gray-500 mt-2 ml-1">
          Existing footprint stays
        </p>
      </div>

      {/* ─── FINISH QUALITY TIER ─── */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <label className="text-purple-200 text-[10px] uppercase tracking-wider font-bold">
            Finish Quality
          </label>
          <span className="text-[10px] text-purple-400">
            Impacts 60% of cost
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((t) => {
            const isSelected = tier === t.id;
            const isDisabled = t.id === 'essential' && kitchen;
            return (
              <button
                key={t.id}
                disabled={isDisabled}
                onClick={() => setTier(t.id as TierType)}
                className={`relative flex flex-col items-center p-2 rounded-lg border transition-all duration-200 ${isDisabled ? 'opacity-40 cursor-not-allowed border-white/5 bg-transparent' : isSelected ? 'bg-gradient-to-b from-purple-900/40 to-pink-900/20 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>

                {isSelected &&
                <div className="absolute -top-1.5 -right-1.5 bg-pink-500 rounded-full p-0.5">
                    <Check size={8} className="text-white" />
                  </div>
                }
                <span
                  className={`text-[10px] font-bold uppercase mb-0.5 ${isSelected ? 'text-white' : 'text-gray-400'}`}>

                  {t.label}
                </span>
                <span className="text-[9px] text-gray-500 mb-1">
                  {t.cost}/sqft
                </span>
                <div
                  className={`h-0.5 w-8 rounded-full ${t.id === 'luxury' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : t.id === 'elevated' ? 'bg-purple-400' : 'bg-gray-600'}`} />

              </button>);

          })}
        </div>
      </div>
    </div>);

}
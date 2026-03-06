import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectOptional } from '../context/ProjectContext';
import {
  Home,
  ChefHat,
  Bath,
  BedDouble,
  Paintbrush,
  Columns,
  Trees,
  WrenchIcon,
  Plus,
  Minus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface PropertyWishlistProps {
  onProgressUpdate?: (value: number) => void;
  isActive?: boolean;
  /** From property lookup: prefill room counts and tiles */
  initialBedrooms?: number;
  initialBathrooms?: number;
  /** When user finishes the last category, call this to advance to next app section (removes duplicate "Next Section" confusion) */
  onFinishWishlist?: () => void;
  /** Label for next section, e.g. "Analysis" — used in the final button: "Finish wishlist & go to Analysis" */
  nextSectionLabel?: string;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

type RoomStatus = 'add' | 'renovate' | 'leave';

interface RoomTile {
  id: string;
  status: RoomStatus;
}

function buildTiles(prefix: string, count: number, existing: RoomTile[], defaultNewStatus: RoomStatus): RoomTile[] {
  const next: RoomTile[] = [];
  for (let i = 0; i < count; i++) {
    const id = `${prefix}-${i + 1}`;
    const prev = existing.find(t => t.id === id);
    if (prev) next.push(prev);
    else next.push({ id, status: i < existing.length ? 'leave' : defaultNewStatus });
  }
  return next;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'rooms', label: 'Rooms', icon: Home, description: 'Bedrooms, bathrooms & layout' },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat, description: 'Appliances, cabinets & finishes' },
  { id: 'bathrooms', label: 'Bathrooms', icon: Bath, description: 'Fixtures, tile & features' },
  { id: 'interior', label: 'Interior', icon: Paintbrush, description: 'Flooring, paint & details' },
  { id: 'exterior', label: 'Exterior', icon: Columns, description: 'Siding, windows & doors' },
  { id: 'outdoor', label: 'Outdoor', icon: Trees, description: 'Yard, pool & landscaping' },
  { id: 'systems', label: 'Systems', icon: WrenchIcon, description: 'HVAC, electrical & plumbing' },
];

/** Approximate cost and ROI per component — used for running total and per-item labels. Directional estimates. */
const COMPONENT_ESTIMATES: Record<string, { cost: number; roi: number }> = {
  // Room features
  'Walk-in Closet': { cost: 8500, roi: 0.95 },
  'En-suite Bath': { cost: 28000, roi: 0.88 },
  'Sitting Area': { cost: 6000, roi: 0.75 },
  'Ceiling Fan': { cost: 800, roi: 0.7 },
  'Bay Window': { cost: 4500, roi: 0.85 },
  'Balcony Access': { cost: 12000, roi: 0.8 },
  'Vaulted Ceiling': { cost: 15000, roi: 0.9 },
  'Hardwood Floors': { cost: 9000, roi: 1.0 },
  // Kitchen features
  'Gas Range': { cost: 2500, roi: 0.85 },
  'Double Oven': { cost: 4000, roi: 0.8 },
  'French Door Fridge': { cost: 3500, roi: 0.75 },
  'Dishwasher Drawer': { cost: 1200, roi: 0.7 },
  'Wine Cooler': { cost: 2200, roi: 0.6 },
  'Pot Filler': { cost: 900, roi: 0.75 },
  'Island with Seating': { cost: 12000, roi: 0.95 },
  'Walk-in Pantry': { cost: 15000, roi: 0.9 },
  'Under-cabinet Lighting': { cost: 600, roi: 0.8 },
  'Pot Rack': { cost: 400, roi: 0.5 },
  'Farm Sink': { cost: 1800, roi: 0.85 },
  'Garbage Disposal': { cost: 400, roi: 0.6 },
  // Bathroom features
  'Rain Shower': { cost: 1800, roi: 0.85 },
  'Freestanding Tub': { cost: 4500, roi: 0.8 },
  'Double Vanity': { cost: 3500, roi: 0.9 },
  'Smart Toilet': { cost: 2200, roi: 0.7 },
  'Vessel Sinks': { cost: 1200, roi: 0.75 },
  'Heated Towel Bar': { cost: 500, roi: 0.65 },
  'Heated Floors': { cost: 2800, roi: 0.85 },
  'Subway Tile': { cost: 1500, roi: 0.8 },
  'Mosaic Accent': { cost: 2200, roi: 0.75 },
  'Slab Shower': { cost: 5500, roi: 0.8 },
  'Natural Stone': { cost: 4000, roi: 0.85 },
  'Large Format': { cost: 3200, roi: 0.8 },
  'Steam Shower': { cost: 6500, roi: 0.75 },
  'Bidet': { cost: 800, roi: 0.7 },
  'Walk-in Shower': { cost: 5000, roi: 0.9 },
  'Makeup Vanity': { cost: 2500, roi: 0.8 },
  'Linen Closet': { cost: 3500, roi: 0.85 },
  'Skylight': { cost: 2800, roi: 0.8 },
  // Interior details
  'Crown Molding': { cost: 3500, roi: 0.85 },
  'Wainscoting': { cost: 4500, roi: 0.8 },
  'Coffered Ceiling': { cost: 8000, roi: 0.85 },
  'Built-in Shelves': { cost: 4000, roi: 0.9 },
  'Fireplace': { cost: 12000, roi: 0.9 },
  'Wet Bar': { cost: 15000, roi: 0.75 },
  'Home Office': { cost: 10000, roi: 0.85 },
  'Laundry Room': { cost: 14000, roi: 0.9 },
  // Exterior — siding/door/window (directional: e.g. wood siding adds more value than stone veneer)
  'Stucco': { cost: 18000, roi: 0.8 },
  'Brick': { cost: 22000, roi: 0.85 },
  'Stone Veneer': { cost: 14000, roi: 0.65 },
  'Hardie Board': { cost: 19000, roi: 0.9 },
  'Wood Siding': { cost: 24000, roi: 0.95 },
  'Metal Accents': { cost: 6000, roi: 0.75 },
  'Energy Efficient Windows': { cost: 12000, roi: 0.85 },
  'French Doors': { cost: 4500, roi: 0.88 },
  'Sliding Glass Door': { cost: 3500, roi: 0.82 },
  'Entry Door Upgrade': { cost: 2800, roi: 0.9 },
  'Skylights': { cost: 3500, roi: 0.78 },
  'Transom Windows': { cost: 2200, roi: 0.8 },
  // Outdoor
  'Covered Patio': { cost: 18000, roi: 0.85 },
  'Outdoor Kitchen': { cost: 25000, roi: 0.75 },
  'Fire Pit': { cost: 4500, roi: 0.8 },
  'Pergola': { cost: 8000, roi: 0.78 },
  'Sprinkler System': { cost: 4500, roi: 0.65 },
  'Fencing': { cost: 8000, roi: 0.75 },
  'Xeriscaping': { cost: 6000, roi: 0.7 },
  'Lawn Installation': { cost: 5000, roi: 0.6 },
  'Tree Planting': { cost: 2500, roi: 0.75 },
  'Garden Beds': { cost: 3500, roi: 0.8 },
  'Lighting': { cost: 3000, roi: 0.85 },
  'Water Features': { cost: 12000, roi: 0.7 },
  // Systems
  'New AC Unit': { cost: 8000, roi: 0.7 },
  'Furnace Upgrade': { cost: 5000, roi: 0.75 },
  'Smart Thermostat': { cost: 500, roi: 0.8 },
  'Zoned System': { cost: 12000, roi: 0.75 },
  'Air Purification': { cost: 3000, roi: 0.65 },
  'Ductwork': { cost: 6000, roi: 0.7 },
  'Panel Upgrade': { cost: 4000, roi: 0.8 },
  'EV Charger': { cost: 2000, roi: 0.85 },
  'Generator': { cost: 8000, roi: 0.7 },
  'Smart Lighting': { cost: 3000, roi: 0.75 },
  'Surge Protection': { cost: 1000, roi: 0.6 },
  'Rewiring': { cost: 15000, roi: 0.75 },
  'Repipe': { cost: 12000, roi: 0.7 },
  'Water Heater': { cost: 3000, roi: 0.75 },
  'Tankless': { cost: 6000, roi: 0.8 },
  'Water Softener': { cost: 2000, roi: 0.65 },
  'Sump Pump': { cost: 2000, roi: 0.85 },
  'Sewer Line': { cost: 8000, roi: 0.65 },
  // Home style (design-level impact)
  'Modern': { cost: 0, roi: 1 },
  'Craftsman': { cost: 8000, roi: 0.92 },
  'Colonial': { cost: 6000, roi: 0.9 },
  'Mediterranean': { cost: 12000, roi: 0.85 },
  'Farmhouse': { cost: 10000, roi: 0.9 },
  'Contemporary': { cost: 5000, roi: 0.88 },
  'Ranch': { cost: 0, roi: 1 },
  'Victorian': { cost: 18000, roi: 0.82 },
};

const formatEstimate = (n: number) =>
  n >= 1000 ? `~$${(n / 1000).toFixed(0)}K` : `~$${n}`;
const formatValue = (n: number) =>
  n >= 1000 ? `+$${(n / 1000).toFixed(1)}K value` : `+$${n} value`;

// Cost calculation helpers
const calculateCosts = (selections: Record<string, any>) => {
  const costs = {
    bedrooms: { base: 145000, perUnit: 10000, roi: 1.07 },
    bathrooms: { base: 165000, perUnit: 25000, roi: 0.85 },
    kitchen: {
      Standard: { cost: 35000, roi: 0.8 },
      Mid: { cost: 65000, roi: 0.9 },
      Premium: { cost: 120000, roi: 0.95 },
      Luxury: { cost: 180000, roi: 0.85 }
    },
    flooring: {
      Carpet: { cost: 22000, roi: 0.7 },
      Laminate: { cost: 35000, roi: 0.8 },
      Hardwood: { cost: 55000, roi: 1.1 },
      Tile: { cost: 48000, roi: 0.9 }
    },
    pool: {
      None: { cost: 0, roi: 0 },
      Basic: { cost: 45000, roi: 0.6 },
      Standard: { cost: 75000, roi: 0.75 },
      Luxury: { cost: 125000, roi: 0.7 }
    }
  };

  let totalCost = 0;
  let totalValue = 0;

  // Bedroom cost from tiles: add / renovate / leave (critical for price)
  const bedTiles: RoomTile[] = selections.bedTiles ?? buildTiles('bed', selections.bedrooms ?? 4, [], 'leave');
  const bedAdd = bedTiles.filter(t => t.status === 'add').length;
  const bedReno = bedTiles.filter(t => t.status === 'renovate').length;
  const bedRenoCostPer = 8000;
  const bedAddCost = bedAdd * costs.bedrooms.perUnit;
  const bedRenoCost = bedReno * bedRenoCostPer;
  const bedCost = bedAddCost + bedRenoCost;
  totalCost += Math.max(0, bedCost);
  totalValue += bedAddCost * costs.bedrooms.roi + bedRenoCost * 0.9;

  // Bathroom cost from tiles: add / renovate / leave
  const bathTiles: RoomTile[] = selections.bathTiles ?? buildTiles('bath', selections.bathrooms ?? 4, [], 'leave');
  const bathNew = bathTiles.filter(t => t.status === 'add').length;
  const bathReno = bathTiles.filter(t => t.status === 'renovate').length;
  const renoScope = selections.bathroomRenoScope || 'full';
  const renoCostPerBath: Record<string, { cost: number; roi: number }> = {
    full: { cost: 25000, roi: 0.85 },
    floors_fixtures: { cost: 12000, roi: 0.9 },
    cosmetic: { cost: 4000, roi: 0.75 }
  };
  const renoUnit = renoCostPerBath[renoScope] || renoCostPerBath.full;
  const bathAddCost = bathNew * costs.bathrooms.perUnit;
  const bathRenoCost = bathReno * renoUnit.cost;
  const bathCost = bathAddCost + bathRenoCost;
  totalCost += Math.max(0, bathCost);
  totalValue += bathAddCost * costs.bathrooms.roi + bathRenoCost * renoUnit.roi;

  // Kitchen
  const kitchenLevel = selections.kitchenLevel || 'Premium';
  if (costs.kitchen[kitchenLevel as keyof typeof costs.kitchen]) {
    const k = costs.kitchen[kitchenLevel as keyof typeof costs.kitchen];
    totalCost += k.cost;
    totalValue += k.cost * k.roi;
  }

  // Flooring
  const flooringType = selections.flooring || 'Hardwood';
  if (costs.flooring[flooringType as keyof typeof costs.flooring]) {
    const f = costs.flooring[flooringType as keyof typeof costs.flooring];
    totalCost += f.cost;
    totalValue += f.cost * f.roi;
  }

  // Pool
  const poolType = selections.pool || 'None';
  if (costs.pool[poolType as keyof typeof costs.pool]) {
    const p = costs.pool[poolType as keyof typeof costs.pool];
    totalCost += p.cost;
    totalValue += p.cost * p.roi;
  }

  // Home style
  const homeStyle = selections.homeStyle || 'Modern';
  const styleEst = COMPONENT_ESTIMATES[homeStyle];
  if (styleEst) {
    totalCost += styleEst.cost;
    totalValue += styleEst.cost * styleEst.roi;
  }

  // All checkbox/component arrays — every selection adds cost and value
  const detailKeys: (keyof typeof selections)[] = [
    'roomFeatures', 'kitchenFeatures', 'bathroomFeatures', 'interiorDetails',
    'exteriorDetails', 'outdoorFeatures', 'systemsDetails'
  ];
  for (const key of detailKeys) {
    const arr = (selections[key] as string[] | undefined) ?? [];
    for (const item of arr) {
      const est = COMPONENT_ESTIMATES[item];
      if (est) {
        totalCost += est.cost;
        totalValue += est.cost * est.roi;
      }
    }
  }

  return { totalCost, totalValue, roi: totalCost > 0 ? totalValue / totalCost : 0 };
};

export function PropertyWishlist({ onProgressUpdate, initialBedrooms, initialBathrooms, onFinishWishlist, nextSectionLabel = 'Analysis' }: PropertyWishlistProps) {
  const projectCtx = useProjectOptional();
  const projectWishlist = projectCtx?.project?.wishlist;
  const [activeCategory, setActiveCategory] = useState('rooms');
  const [selections, setSelections] = useState(() => {
    const beds = Math.max(1, Math.min(8, projectWishlist?.bedrooms ?? initialBedrooms ?? 4));
    const baths = Math.max(1, Math.min(8, projectWishlist?.bathrooms ?? initialBathrooms ?? 4));
    const existingTiles = buildTiles('bed', beds, [], 'leave');
    const existingBathTiles = buildTiles('bath', baths, [], 'leave');
    return {
      bedrooms: beds,
      bathrooms: baths,
      bedTiles: (projectWishlist?.bedTiles?.length ? projectWishlist.bedTiles : existingTiles) as RoomTile[],
      bathTiles: (projectWishlist?.bathTiles?.length ? projectWishlist.bathTiles : existingBathTiles) as RoomTile[],
      bathroomRenoScope: (projectWishlist?.bathroomRenoScope ?? 'full') as 'full' | 'floors_fixtures' | 'cosmetic',
      kitchenLevel: projectWishlist?.kitchenLevel ?? 'Premium',
      flooring: projectWishlist?.flooring ?? 'Hardwood',
      pool: projectWishlist?.pool ?? 'None',
      interiorFeatures: projectWishlist?.interiorFeatures ?? 'Custom',
      exteriorFeatures: projectWishlist?.exteriorFeatures ?? 'Standard',
      systemsUpgrade: projectWishlist?.systemsUpgrade ?? 'Standard',
      yardSize: projectWishlist?.yardSize ?? 'Medium',
      homeStyle: projectWishlist?.homeStyle ?? 'Modern',
      roomFeatures: projectWishlist?.roomFeatures ?? [],
      kitchenFeatures: projectWishlist?.kitchenFeatures ?? [],
      bathroomFeatures: projectWishlist?.bathroomFeatures ?? [],
      interiorDetails: projectWishlist?.interiorDetails ?? [],
      exteriorDetails: projectWishlist?.exteriorDetails ?? [],
      outdoorFeatures: projectWishlist?.outdoorFeatures ?? [],
      systemsDetails: projectWishlist?.systemsDetails ?? [],
    };
  });

  const toggleFeature = (key: 'roomFeatures' | 'kitchenFeatures' | 'bathroomFeatures' | 'interiorDetails' | 'exteriorDetails' | 'outdoorFeatures' | 'systemsDetails', item: string) => {
    setSelections(prev => {
      const arr = prev[key] ?? [];
      const next = arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
      return { ...prev, [key]: next };
    });
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
  };
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set(['rooms']));
  const [specialInstructions, setSpecialInstructions] = useState(projectCtx?.project?.notes?.specialInstructions ?? '');
  const isInitialMount = useRef(true);

  const { totalCost, totalValue, roi } = useMemo(() => calculateCosts(selections), [selections]);

  // Persist wishlist to project so Design Package and Contractor Review have full scope (CAD/contractor-ready)
  useEffect(() => {
    if (!projectCtx) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    projectCtx.updateProject({
      wishlist: {
        ...projectCtx.project.wishlist,
        ...selections,
        bedTiles: selections.bedTiles,
        bathTiles: selections.bathTiles,
      },
      financial: {
        ...projectCtx.project.financial,
        totalCost,
        totalValue,
      },
    });
  }, [selections, totalCost, totalValue]);

  // Update progress based on completed categories
  useEffect(() => {
    const progress = Math.round((completedCategories.size / CATEGORIES.length) * 100);
    onProgressUpdate?.(progress);
  }, [completedCategories, onProgressUpdate]);

  // When property lookup provides bed/bath counts, seed room counts and tiles (only if not already from project)
  useEffect(() => {
    if (projectWishlist?.bedrooms != null || projectWishlist?.bathrooms != null) return;
    if (initialBedrooms == null && initialBathrooms == null) return;
    setSelections(prev => {
      const beds = initialBedrooms != null ? Math.max(1, Math.min(8, initialBedrooms)) : prev.bedrooms;
      const baths = initialBathrooms != null ? Math.max(1, Math.min(8, initialBathrooms)) : prev.bathrooms;
      if (beds === prev.bedrooms && baths === prev.bathrooms) return prev;
      return {
        ...prev,
        bedrooms: beds,
        bathrooms: baths,
        bedTiles: buildTiles('bed', beds, prev.bedTiles ?? [], 'leave'),
        bathTiles: buildTiles('bath', baths, prev.bathTiles ?? [], 'leave')
      };
    });
  }, [initialBedrooms, initialBathrooms, projectWishlist?.bedrooms, projectWishlist?.bathrooms]);

  const updateSelection = (key: string, value: any) => {
    setSelections(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'bedrooms') {
        const count = Math.max(1, Math.min(8, Number(value) || 4));
        next.bedTiles = buildTiles('bed', count, prev.bedTiles ?? [], 'add');
      }
      if (key === 'bathrooms') {
        const count = Math.max(1, Math.min(8, Number(value) || 4));
        next.bathTiles = buildTiles('bath', count, prev.bathTiles ?? [], 'add');
      }
      return next;
    });
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
  };
  const setBedTileStatus = (index: number, status: RoomStatus) => {
    setSelections(prev => {
      const tiles = [...(prev.bedTiles ?? [])];
      if (tiles[index]) tiles[index] = { ...tiles[index], status };
      return { ...prev, bedTiles: tiles };
    });
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
  };
  const setBathTileStatus = (index: number, status: RoomStatus) => {
    setSelections(prev => {
      const tiles = [...(prev.bathTiles ?? [])];
      if (tiles[index]) tiles[index] = { ...tiles[index], status };
      return { ...prev, bathTiles: tiles };
    });
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
  };
  const applyQuickAction = (action: 'leave_all' | 'renovate_all') => {
    setSelections(prev => {
      const setStatus = (t: RoomTile) => (t.status === 'add' ? t.status : action === 'leave_all' ? 'leave' : 'renovate');
      return {
        ...prev,
        bedTiles: (prev.bedTiles ?? []).map(t => ({ ...t, status: setStatus(t) })),
        bathTiles: (prev.bathTiles ?? []).map(t => ({ ...t, status: setStatus(t) }))
      };
    });
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
  };

  const isLastCategory = CATEGORIES.findIndex(c => c.id === activeCategory) === CATEGORIES.length - 1;
  const nextCategory = !isLastCategory ? CATEGORIES[CATEGORIES.findIndex(c => c.id === activeCategory) + 1] : null;

  const handlePrimaryAction = () => {
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
    const currentIndex = CATEGORIES.findIndex(c => c.id === activeCategory);
    if (currentIndex < CATEGORIES.length - 1) {
      setActiveCategory(CATEGORIES[currentIndex + 1].id);
    } else {
      onFinishWishlist?.();
    }
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'rooms': {
        const bedTiles = selections.bedTiles ?? buildTiles('bed', selections.bedrooms ?? 4, [], 'leave');
        const bathTiles = selections.bathTiles ?? buildTiles('bath', selections.bathrooms ?? 4, [], 'leave');
        const bathRenoCount = bathTiles.filter(t => t.status === 'renovate').length;

        return (
          <div className="space-y-6">
            {/* Quick actions — same enclosure style */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-white font-medium mb-2">Quick actions</p>
              <p className="text-purple-300/70 text-xs mb-3">Apply to all existing rooms (rooms you&apos;re adding are unchanged)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyQuickAction('leave_all')}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-purple-200 text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  Leave existing alone
                </button>
                <button
                  onClick={() => applyQuickAction('renovate_all')}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-purple-200 text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  Renovate all existing
                </button>
              </div>
            </div>

            {/* Bedrooms: count + tiles */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BedDouble size={20} className="text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Bedrooms</p>
                    <p className="text-purple-300/70 text-xs">Total count (after project). Set each room below.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
                  <button
                    onClick={() => updateSelection('bedrooms', Math.max(1, selections.bedrooms - 1))}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-xl font-bold w-7 text-center text-white">{selections.bedrooms}</span>
                  <button
                    onClick={() => updateSelection('bedrooms', Math.min(8, selections.bedrooms + 1))}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {bedTiles.map((tile, i) => {
                  const isLeave = tile.status === 'leave';
                  return (
                    <div
                      key={tile.id}
                      className={`rounded-xl border p-3 transition-all ${
                        isLeave
                          ? 'bg-white/5 border-white/10 opacity-75'
                          : 'bg-white/5 border-white/10'
                      } ${isLeave ? 'ring-1 ring-white/5' : ''}`}
                    >
                      <p className={`font-medium text-sm mb-2 ${isLeave ? 'text-purple-400' : 'text-white'}`}>
                        Bed {i + 1}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(['add', 'renovate', 'leave'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setBedTileStatus(i, status)}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                              tile.status === status
                                ? 'bg-pink-500/20 border border-pink-500/50 text-white'
                                : 'bg-white/5 border border-white/10 text-purple-200 hover:bg-white/10'
                            }`}
                          >
                            {status === 'add' ? 'Add new' : status === 'renovate' ? 'Renovate' : "Don't touch"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bathrooms: count + tiles + scope */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bath size={20} className="text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Bathrooms</p>
                    <p className="text-purple-300/70 text-xs">Total count (after project). Set each room below.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
                  <button
                    onClick={() => updateSelection('bathrooms', Math.max(1, selections.bathrooms - 1))}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-xl font-bold w-7 text-center text-white">{selections.bathrooms}</span>
                  <button
                    onClick={() => updateSelection('bathrooms', Math.min(8, selections.bathrooms + 1))}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {bathTiles.map((tile, i) => {
                  const isLeave = tile.status === 'leave';
                  return (
                    <div
                      key={tile.id}
                      className={`rounded-xl border p-3 transition-all ${
                        isLeave
                          ? 'bg-white/5 border-white/10 opacity-75'
                          : 'bg-white/5 border-white/10'
                      } ${isLeave ? 'ring-1 ring-white/5' : ''}`}
                    >
                      <p className={`font-medium text-sm mb-2 ${isLeave ? 'text-purple-400' : 'text-white'}`}>
                        Bath {i + 1}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(['add', 'renovate', 'leave'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setBathTileStatus(i, status)}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                              tile.status === status
                                ? 'bg-pink-500/20 border border-pink-500/50 text-white'
                                : 'bg-white/5 border border-white/10 text-purple-200 hover:bg-white/10'
                            }`}
                          >
                            {status === 'add' ? 'Add new' : status === 'renovate' ? 'Renovate' : "Don't touch"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {bathRenoCount > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-purple-200 text-sm font-medium mb-2">Renovation scope (all renovated bathrooms)</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'full', label: 'Full redo' },
                      { id: 'floors_fixtures', label: 'Floors & fixtures' },
                      { id: 'cosmetic', label: 'Cosmetic only' }
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => updateSelection('bathroomRenoScope', id)}
                        className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                          selections.bathroomRenoScope === id
                            ? 'bg-pink-500/20 border-pink-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Room Features */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-white font-medium mb-3">Room Features</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Walk-in Closet', 'En-suite Bath', 'Sitting Area', 'Ceiling Fan', 'Bay Window', 'Balcony Access', 'Vaulted Ceiling', 'Hardwood Floors'].map((feature) => {
                  const est = COMPONENT_ESTIMATES[feature];
                  return (
                    <label key={feature} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={(selections.roomFeatures ?? []).includes(feature)}
                          onChange={() => toggleFeature('roomFeatures', feature)}
                          className="rounded border-white/20 text-pink-500 focus:ring-pink-500 bg-white/10 shrink-0"
                        />
                        <span className="text-sm text-purple-200 truncate">{feature}</span>
                      </div>
                      {est && (
                        <span className="text-xs text-purple-400 shrink-0 text-right">
                          {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'kitchen':
        return (
          <div className="space-y-6">
            {/* Kitchen Level */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-medium mb-3">Kitchen Level</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { level: 'Standard', cost: '$35K', desc: 'Basic appliances, laminate counters' },
                  { level: 'Mid', cost: '$65K', desc: 'Stainless appliances, quartz counters' },
                  { level: 'Premium', cost: '$120K', desc: 'Pro appliances, stone counters, custom cabinets' },
                  { level: 'Luxury', cost: '$180K', desc: 'Chef-grade appliances, marble, bespoke cabinetry' }
                ].map(({ level, cost, desc }) => (
                  <button
                    key={level}
                    onClick={() => updateSelection('kitchenLevel', level)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selections.kitchenLevel === level
                        ? 'bg-pink-500/20 border-pink-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className={`font-semibold ${selections.kitchenLevel === level ? 'text-white' : 'text-purple-200'}`}>{level}</p>
                    <p className="text-emerald-400 text-sm font-medium">{cost}</p>
                    <p className="text-purple-300/60 text-xs mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Kitchen Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-medium mb-3">Appliances</p>
                <div className="space-y-2">
                  {['Gas Range', 'Double Oven', 'French Door Fridge', 'Dishwasher Drawer', 'Wine Cooler', 'Pot Filler'].map((item) => {
                    const est = COMPONENT_ESTIMATES[item];
                    return (
                      <label key={item} className="flex items-center justify-between gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={(selections.kitchenFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('kitchenFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 shrink-0 text-right">
                            {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-medium mb-3">Features</p>
                <div className="space-y-2">
                  {['Island with Seating', 'Walk-in Pantry', 'Under-cabinet Lighting', 'Pot Rack', 'Farm Sink', 'Garbage Disposal'].map((item) => {
                    const est = COMPONENT_ESTIMATES[item];
                    return (
                      <label key={item} className="flex items-center justify-between gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={(selections.kitchenFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('kitchenFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 shrink-0 text-right">
                            {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'bathrooms':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Fixtures', items: ['Rain Shower', 'Freestanding Tub', 'Double Vanity', 'Smart Toilet', 'Vessel Sinks', 'Heated Towel Bar'] },
                { title: 'Tile', items: ['Heated Floors', 'Subway Tile', 'Mosaic Accent', 'Slab Shower', 'Natural Stone', 'Large Format'] },
                { title: 'Features', items: ['Steam Shower', 'Bidet', 'Walk-in Shower', 'Makeup Vanity', 'Linen Closet', 'Skylight'] }
              ].map(({ title, items }) => (
                <div key={title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white font-medium mb-3">{title}</p>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const est = COMPONENT_ESTIMATES[item];
                      return (
                        <label key={item} className="flex items-center justify-between gap-2 cursor-pointer group">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={(selections.bathroomFeatures ?? []).includes(item)}
                              onChange={() => toggleFeature('bathroomFeatures', item)}
                              className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                            />
                            <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{item}</span>
                          </div>
                          {est && (
                            <span className="text-xs text-purple-400 shrink-0 text-right">
                              {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'interior':
        return (
          <div className="space-y-6">
            {/* Flooring */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-medium mb-3">Flooring</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { type: 'Carpet', cost: '$22K', roi: '70%' },
                  { type: 'Laminate', cost: '$35K', roi: '80%' },
                  { type: 'Hardwood', cost: '$55K', roi: '110%' },
                  { type: 'Tile', cost: '$48K', roi: '90%' }
                ].map(({ type, cost, roi }) => (
                  <button
                    key={type}
                    onClick={() => updateSelection('flooring', type)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      selections.flooring === type
                        ? 'bg-pink-500/20 border-pink-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className={`font-semibold ${selections.flooring === type ? 'text-white' : 'text-purple-200'}`}>{type}</p>
                    <p className="text-emerald-400 text-sm">{cost}</p>
                    <p className="text-purple-300/60 text-xs">{roi} ROI</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Interior Features */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-medium mb-3">Interior Details</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Crown Molding', 'Wainscoting', 'Coffered Ceiling', 'Built-in Shelves', 'Fireplace', 'Wet Bar', 'Home Office', 'Laundry Room'].map((item) => {
                  const est = COMPONENT_ESTIMATES[item];
                  return (
                    <label key={item} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={(selections.interiorDetails ?? []).includes(item)}
                          onChange={() => toggleFeature('interiorDetails', item)}
                          className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                        />
                        <span className="text-sm text-purple-200 truncate">{item}</span>
                      </div>
                      {est && (
                        <span className="text-xs text-purple-400 shrink-0 text-right">
                          {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'exterior':
        return (
          <div className="space-y-6">
            {/* Home Style */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-medium mb-3">Home Style</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Modern', 'Craftsman', 'Colonial', 'Mediterranean', 'Farmhouse', 'Contemporary', 'Ranch', 'Victorian'].map((style) => {
                  const est = COMPONENT_ESTIMATES[style];
                  return (
                    <button
                      key={style}
                      onClick={() => updateSelection('homeStyle', style)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left ${
                        selections.homeStyle === style
                          ? 'bg-pink-500/20 border-pink-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10'
                      }`}
                    >
                      <span className="block">{style}</span>
                      {est && (est.cost > 0 || est.roi !== 1) && (
                        <span className="text-xs text-purple-400 mt-0.5 block">
                          {est.cost > 0 ? formatEstimate(est.cost) : '—'} · {formatValue(est.cost * est.roi)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exterior Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-medium mb-3">Siding & Materials</p>
                <div className="space-y-2">
                  {['Stucco', 'Brick', 'Stone Veneer', 'Hardie Board', 'Wood Siding', 'Metal Accents'].map((item) => {
                    const est = COMPONENT_ESTIMATES[item];
                    return (
                      <label key={item} className="flex items-center justify-between gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={(selections.exteriorDetails ?? []).includes(item)}
                            onChange={() => toggleFeature('exteriorDetails', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 shrink-0 text-right">
                            {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-medium mb-3">Windows & Doors</p>
                <div className="space-y-2">
                  {['Energy Efficient Windows', 'French Doors', 'Sliding Glass Door', 'Entry Door Upgrade', 'Skylights', 'Transom Windows'].map((item) => {
                    const est = COMPONENT_ESTIMATES[item];
                    return (
                      <label key={item} className="flex items-center justify-between gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={(selections.exteriorDetails ?? []).includes(item)}
                            onChange={() => toggleFeature('exteriorDetails', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 shrink-0 text-right">
                            {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'outdoor':
        return (
          <div className="space-y-6">
            {/* Pool Options */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-medium mb-3">Pool Options</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { type: 'None', cost: '$0', roi: '-' },
                  { type: 'Basic', cost: '$45K', roi: '60%' },
                  { type: 'Standard', cost: '$75K', roi: '75%' },
                  { type: 'Luxury', cost: '$125K', roi: '70%' }
                ].map(({ type, cost, roi }) => (
                  <button
                    key={type}
                    onClick={() => updateSelection('pool', type)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      selections.pool === type
                        ? 'bg-pink-500/20 border-pink-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className={`font-semibold ${selections.pool === type ? 'text-white' : 'text-purple-200'}`}>{type}</p>
                    <p className="text-emerald-400 text-sm">{cost}</p>
                    {roi !== '-' && <p className="text-purple-300/60 text-xs">{roi} ROI</p>}
                  </button>
                ))}
              </div>
            </div>

            {/* Yard & Landscaping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-medium mb-3">Yard Features</p>
                <div className="space-y-2">
                  {['Covered Patio', 'Outdoor Kitchen', 'Fire Pit', 'Pergola', 'Sprinkler System', 'Fencing'].map((item) => {
                    const est = COMPONENT_ESTIMATES[item];
                    return (
                      <label key={item} className="flex items-center justify-between gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={(selections.outdoorFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('outdoorFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 shrink-0 text-right">
                            {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-medium mb-3">Landscaping</p>
                <div className="space-y-2">
                  {['Xeriscaping', 'Lawn Installation', 'Tree Planting', 'Garden Beds', 'Lighting', 'Water Features'].map((item) => {
                    const est = COMPONENT_ESTIMATES[item];
                    return (
                      <label key={item} className="flex items-center justify-between gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={(selections.outdoorFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('outdoorFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 shrink-0 text-right">
                            {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'systems':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'HVAC',
                  items: [
                    { label: 'New AC Unit', cost: '+$8K' },
                    { label: 'Furnace Upgrade', cost: '+$5K' },
                    { label: 'Smart Thermostat', cost: '+$500' },
                    { label: 'Zoned System', cost: '+$12K' },
                    { label: 'Air Purification', cost: '+$3K' },
                    { label: 'Ductwork', cost: '+$6K' }
                  ]
                },
                {
                  title: 'Electrical',
                  items: [
                    { label: 'Panel Upgrade', cost: '+$4K' },
                    { label: 'EV Charger', cost: '+$2K' },
                    { label: 'Generator', cost: '+$8K' },
                    { label: 'Smart Lighting', cost: '+$3K' },
                    { label: 'Surge Protection', cost: '+$1K' },
                    { label: 'Rewiring', cost: '+$15K' }
                  ]
                },
                {
                  title: 'Plumbing',
                  items: [
                    { label: 'Repipe', cost: '+$12K' },
                    { label: 'Water Heater', cost: '+$3K' },
                    { label: 'Tankless', cost: '+$6K' },
                    { label: 'Water Softener', cost: '+$2K' },
                    { label: 'Sump Pump', cost: '+$2K' },
                    { label: 'Sewer Line', cost: '+$8K' }
                  ]
                }
              ].map(({ title, items }) => (
                <div key={title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white font-medium mb-3">{title}</p>
                  <div className="space-y-2">
                    {items.map(({ label }) => {
                      const est = COMPONENT_ESTIMATES[label];
                      return (
                        <label key={label} className="flex items-center justify-between gap-2 cursor-pointer group">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={(selections.systemsDetails ?? []).includes(label)}
                              onChange={() => toggleFeature('systemsDetails', label)}
                              className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                            />
                            <span className="text-sm text-purple-200 group-hover:text-white transition-colors truncate">{label}</span>
                          </div>
                          {est && (
                            <span className="text-xs text-purple-400 shrink-0 text-right">
                              {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Wishlist</h2>
          <p className="text-purple-300/70 text-sm mt-1">Select features for your dream home renovation</p>
        </div>
        {/* Running Total */}
        <div className="text-right hidden sm:block">
          <p className="text-purple-300 text-xs uppercase tracking-wider">Estimated Total</p>
          <p className="text-2xl font-bold text-white">${totalCost.toLocaleString()}</p>
          <div className="flex items-center gap-2 justify-end mt-1">
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              <TrendingUp size={14} />
              +${(totalValue - totalCost).toLocaleString()} equity
            </span>
            <span className="text-purple-400 text-xs">({Math.round(roi * 100)}% ROI)</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const isComplete = completedCategories.has(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-pink-500/20 border-pink-500/50 text-white'
                  : isComplete
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-purple-300 hover:bg-white/10'
              }`}
            >
              {isComplete ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              <span className="font-medium text-sm">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Category Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5"
        >
          {renderCategoryContent()}

          {/* Category Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-purple-300/70">
              {completedCategories.has(activeCategory) ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={14} /> Category complete
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <AlertCircle size={14} /> Make selections to complete this category
                </span>
              )}
            </div>
            <button
              onClick={handlePrimaryAction}
              className="px-6 py-2.5 rounded-xl bg-white text-purple-900 font-bold hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              {isLastCategory
                ? `Finish wishlist & go to ${nextSectionLabel}`
                : `Continue to ${nextCategory?.label ?? 'Next'}`}
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mobile Total */}
      <div className="sm:hidden bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-300 text-xs uppercase">Est. Total</p>
            <p className="text-xl font-bold text-white">${totalCost.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 text-sm flex items-center gap-1">
              <TrendingUp size={14} />
              +${(totalValue - totalCost).toLocaleString()}
            </p>
            <p className="text-purple-400 text-xs">{Math.round(roi * 100)}% ROI</p>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-medium text-sm">Overall Progress</p>
          <p className="text-purple-300 text-sm">{completedCategories.size} of {CATEGORIES.length} categories</p>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCategories.size / CATEGORIES.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Special instructions for contractor & architect — full scope for SOW */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <label className="block text-white font-medium text-sm mb-2" htmlFor="special-instructions">
          Special instructions for your contractor or architect
        </label>
        <textarea
          id="special-instructions"
          value={specialInstructions}
          onChange={(e) => {
            const v = e.target.value;
            setSpecialInstructions(v);
            projectCtx?.updateProject({ notes: { specialInstructions: v.trim() || undefined } });
          }}
          placeholder="e.g. Preserve the oak tree in the backyard, need ADA-friendly master bath, must complete by June..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-y text-sm"
        />
        <p className="text-purple-300/70 text-xs mt-1.5">Included in the Scope of Work so your contractor and lender see the full picture.</p>
      </div>
    </div>
  );
}

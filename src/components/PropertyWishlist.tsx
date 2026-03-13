import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectOptional } from '../context/ProjectContext';
import { ValueWithPop } from './ui/ValueWithPop';
import { InfoTooltip } from './ui/InfoTooltip';
import { CALCULATION_TOOLTIPS } from '../constants/calculationExplanations';
import { useMilestoneConfetti } from '../hooks/useMilestoneConfetti';
import { TinderMode, SwipeItem } from './TinderMode';
import { PinterestImport, type PinterestSelections } from './PinterestImport';
import { COMPONENT_ESTIMATES, FEATURE_IMAGES, FEATURE_DESCRIPTIONS } from '../config/componentEstimates';
import {
  MASTER_ITEMS_BY_ID,
  DEFAULT_CURRENT_HOME_VALUE,
  MARKET_RATE_ANNUAL,
  USER_RATE_ANNUAL,
  TERM_YEARS,
  ESTIMATED_LTV_WHEN_BALANCE_UNKNOWN,
} from '../config/renovationDefaults';
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
  ChevronRight,
  Zap,
  ListChecks,
  X,
} from 'lucide-react';
import {
  type BathType,
  type BathQualityTier,
  type KitchenLevel,
  BATH_TYPE_LABELS,
  BATH_TYPE_ICONS,
  BATH_QUALITY_LABELS,
  BATH_QUALITY_DESCRIPTIONS,
  BATH_SURFACES,
  bathSurfaceTotal,
  BATH_ADDITION_BASE,
  BATH_ADDITION_ROI,
  BATH_RENOVATION_ROI_BY_TIER,
  KITCHEN_SURFACES,
  kitchenSurfaceTotal,
} from '../config/surfaceCosts';

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
  /** Bath-specific: what type of bathroom is this? */
  bathType?: BathType;
  /** Bath-specific: override the global quality for this bath */
  qualityOverride?: BathQualityTier;
}

/** Default bath type based on position: bath-1 = master, the rest = full */
function defaultBathType(index: number): BathType {
  return index === 0 ? 'master' : 'full';
}

function buildTiles(prefix: string, count: number, existing: RoomTile[], defaultNewStatus: RoomStatus): RoomTile[] {
  const next: RoomTile[] = [];
  for (let i = 0; i < count; i++) {
    const id = `${prefix}-${i + 1}`;
    const prev = existing.find(t => t.id === id);
    if (prev) {
      // Ensure bath tiles have a type
      if (prefix === 'bath' && !prev.bathType) {
        next.push({ ...prev, bathType: defaultBathType(i) });
      } else {
        next.push(prev);
      }
    } else {
      next.push({
        id,
        status: i < existing.length ? 'leave' : defaultNewStatus,
        ...(prefix === 'bath' ? { bathType: defaultBathType(i) } : {}),
      });
    }
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


const formatEstimate = (n: number) =>
  n >= 1000 ? `~$${(n / 1000).toFixed(0)}K` : `~$${n}`;
const formatValue = (n: number) =>
  n >= 1000 ? `+$${(n / 1000).toFixed(1)}K value` : `+$${n} value`;

// Cost calculation helpers — base costs and ROI from single source of truth (renovationDefaults + componentEstimates)
const calculateCosts = (selections: Record<string, any>, homeSqft?: number) => {
  const masterSuite = MASTER_ITEMS_BY_ID['master-suite'];

  // Flooring & pool now use COMPONENT_ESTIMATES (per-sqft where applicable)
  const floorSqft = homeSqft || 2000;
  const floorTypes = ['Carpet', 'Laminate', 'Hardwood', 'Tile'] as const;
  const flooringCosts: Record<string, { cost: number; roi: number }> = {};
  for (const ft of floorTypes) {
    const est = COMPONENT_ESTIMATES[ft];
    if (est) {
      const scaled = est.perSqft && est.materialPerSqft != null && est.laborPerSqft != null
        ? Math.round((est.materialPerSqft + est.laborPerSqft) * floorSqft)
        : est.cost;
      flooringCosts[ft] = { cost: scaled, roi: est.roi };
    }
  }

  const poolTypes = ['None', 'Basic', 'Standard', 'Luxury'] as const;
  const poolCosts: Record<string, { cost: number; roi: number }> = { None: { cost: 0, roi: 0 } };
  for (const pt of poolTypes) {
    if (pt === 'None') continue;
    const est = COMPONENT_ESTIMATES[pt];
    if (est) poolCosts[pt] = { cost: est.cost, roi: est.roi };
  }

  const costs = {
    bedrooms: {
      base: masterSuite?.cost ?? 165000,
      perUnit: 10000,
      roi: (masterSuite?.roiPct ?? 130) / 100,
    },
    flooring: flooringCosts,
    pool: poolCosts,
  };

  let totalCost = 0;
  let totalValue = 0;

  // Bedroom cost from tiles: add / renovate / leave (first add = Master Suite from config, then perUnit for extra)
  const bedTiles: RoomTile[] = selections.bedTiles ?? buildTiles('bed', selections.bedrooms ?? 4, [], 'leave');
  const bedAdd = bedTiles.filter(t => t.status === 'add').length;
  const bedReno = bedTiles.filter(t => t.status === 'renovate').length;
  const bedRenoCostPer = 8000;
  const bedAddCost = bedAdd > 0 ? costs.bedrooms.base + (bedAdd - 1) * costs.bedrooms.perUnit : 0;
  const bedRenoCost = bedReno * bedRenoCostPer;
  const bedCost = bedAddCost + bedRenoCost;
  totalCost += Math.max(0, bedCost);
  totalValue += bedAddCost * costs.bedrooms.roi + bedRenoCost * 0.9;

  // Bathroom cost from tiles — per-bath surface-level calculation
  const bathTiles: RoomTile[] = selections.bathTiles ?? buildTiles('bath', selections.bathrooms ?? 4, [], 'leave');
  const globalBathQuality: BathQualityTier = selections.bathQuality ?? 'premium';
  for (const tile of bathTiles) {
    if (tile.status === 'leave') continue;
    const bt: BathType = tile.bathType ?? 'full';
    const quality: BathQualityTier = tile.qualityOverride ?? globalBathQuality;
    const surfaceCost = bathSurfaceTotal(quality, bt);
    if (tile.status === 'add') {
      // New addition = structural base + finish surfaces
      const baseCost = BATH_ADDITION_BASE[bt];
      const tileCost = baseCost + surfaceCost;
      totalCost += tileCost;
      totalValue += tileCost * BATH_ADDITION_ROI;
    } else {
      // Renovation = surfaces only, ROI from tier
      totalCost += surfaceCost;
      totalValue += surfaceCost * BATH_RENOVATION_ROI_BY_TIER[quality];
    }
  }

  // Kitchen — surface-level cost from surfaceCosts
  const kitchenLevel = selections.kitchenLevel || 'Premium';
  const kitchenRoi: Record<string, number> = { Standard: 0.80, Mid: 0.85, Premium: 0.70, Luxury: 0.65 };
  const kCost = kitchenSurfaceTotal(kitchenLevel as KitchenLevel);
  totalCost += kCost;
  totalValue += kCost * (kitchenRoi[kitchenLevel] ?? 0.70);

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
  // Per-sqft items scale with home size; exterior items use extSqft ≈ homeSqft
  const extSqft = homeSqft || 2000;
  const detailKeys: (keyof typeof selections)[] = [
    'roomFeatures', 'kitchenFeatures', 'bathroomFeatures', 'interiorDetails',
    'exteriorDetails', 'outdoorFeatures', 'systemsDetails'
  ];
  for (const key of detailKeys) {
    const arr = (selections[key] as string[] | undefined) ?? [];
    for (const item of arr) {
      const est = COMPONENT_ESTIMATES[item];
      if (est) {
        let itemCost = est.cost;
        if (est.perSqft && est.materialPerSqft != null && est.laborPerSqft != null) {
          const sqft = key === 'exteriorDetails' ? extSqft : floorSqft;
          itemCost = Math.round((est.materialPerSqft + est.laborPerSqft) * sqft);
        }
        totalCost += itemCost;
        totalValue += itemCost * est.roi;
      }
    }
  }

  return { totalCost, totalValue, roi: totalCost > 0 ? totalValue / totalCost : 0 };
};

function monthlyPaymentForLoan(principal: number, annualRateDecimal: number, termYears: number): number {
  if (principal <= 0) return 0;
  const r = annualRateDecimal / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function formatSummaryCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

/** Items in the same array cannot be selected together (e.g. one siding type, one landscaping base). */
const EXCLUSION_GROUPS: Record<string, string[][]> = {
  exteriorDetails: [
    ['Stucco', 'Brick', 'Stone Veneer', 'Hardie Board', 'Wood Siding', 'Metal Accents']
  ],
  outdoorFeatures: [
    ['Xeriscaping', 'Lawn Installation']
  ],
};

/* ─── Turbo Speed Entry Effect ──────────────────────────────────────────── */
/* Plays once on mount: speed lines burst outward + "TURBO" slam + flash.   */
/* animKey prop forces re-mount so re-entering turbo replays the effect.     */

const TURBO_LINES = Array.from({ length: 32 }, (_, i) => {
  const angle = i * (360 / 32);
  // Alternate thick accent lines every 4th to create starburst variety
  const isMajor = i % 4 === 0;
  const isMid   = i % 4 === 2;
  return {
    angle,
    targetLength: isMajor ? '70vmax' : isMid ? '52vmax' : '40vmax',
    height: isMajor ? 3 : isMid ? 2 : 1,
    color: isMajor
      ? 'rgba(250,204,21,0.95)'     // gold
      : isMid
        ? 'rgba(251,146,60,0.80)'   // orange
        : 'rgba(255,255,255,0.55)', // white
    delay: (i % 6) * 0.018,
  };
});

function TurboSpeedEntry({ animKey }: { animKey: number }) {
  return (
    <div
      key={animKey}
      className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
      style={{ zIndex: 260 }}
    >
      {/* ── Speed lines radiating from center ── */}
      {TURBO_LINES.map((line, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            height: `${line.height}px`,
            left: '50%',
            top: '50%',
            marginTop: `-${line.height / 2}px`,
            transformOrigin: '0 50%',
            rotate: line.angle,
            background: line.color,
            borderRadius: '0 3px 3px 0',
            boxShadow: line.height >= 3 ? `0 0 8px ${line.color}` : 'none',
          }}
          initial={{ width: 0, opacity: 1 }}
          animate={{ width: [0, line.targetLength, line.targetLength], opacity: [1, 1, 0] }}
          transition={{
            duration: 0.55,
            delay: line.delay,
            ease: [0.05, 0.6, 0.9, 1],
            opacity: { times: [0, 0.55, 1], duration: 0.55, delay: line.delay },
          }}
        />
      ))}

      {/* ── Central radial burst ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(250,204,21,1) 0%, rgba(251,146,60,0.7) 30%, transparent 70%)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ width: 0, height: 0, opacity: 0.9 }}
        animate={{ width: '180vmax', height: '180vmax', opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.1, 0.6, 0.9, 1] }}
      />

      {/* ── "TURBO" text slam ── */}
      <motion.div
        className="absolute flex flex-col items-center gap-1 select-none"
        style={{ zIndex: 261 }}
        initial={{ scale: 0.15, opacity: 0 }}
        animate={{
          scale:   [0.15, 1.18, 0.96, 1.04, 0.2],
          opacity: [0,    1,    1,    1,    0   ],
        }}
        transition={{
          duration: 0.82,
          times:    [0,    0.22, 0.40, 0.55, 0.92],
          ease: 'easeInOut',
        }}
      >
        <span
          className="font-black uppercase leading-none tracking-[0.22em]"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
            color: '#fbbf24',
            textShadow:
              '0 0 30px rgba(250,204,21,1), 0 0 60px rgba(250,204,21,0.6), 0 0 120px rgba(251,146,60,0.4)',
            WebkitTextStroke: '1px rgba(255,255,255,0.3)',
          }}
        >
          ⚡ TURBO ⚡
        </span>
        <span
          className="font-black uppercase tracking-[0.45em] text-orange-300"
          style={{
            fontSize: 'clamp(0.6rem, 2vw, 1rem)',
            textShadow: '0 0 20px rgba(251,146,60,0.8)',
            letterSpacing: '0.45em',
          }}
        >
          SPEED RUN ACTIVATED
        </span>
      </motion.div>
    </div>
  );
}

/* ─── Turbo Review Step ──────────────────────────────────────────────────── */
/* Shown inside the overlay after "Continue" on completion: grouped picks,   */
/* tap to remove, then "Looks good" → financial or "Detailed review" → tabs. */

const TURBO_REVIEW_CATEGORY_ORDER = ['Kitchen', 'Bathrooms', 'Rooms', 'Interior', 'Exterior', 'Outdoor', 'Systems'];

function TurboReviewStep({
  items,
  acceptedIds,
  onRemove,
  onLooksGood,
  onDetailedReview,
  nextSectionLabel: _nextSectionLabel,
}: {
  items: SwipeItem[];
  acceptedIds: string[];
  onRemove: (id: string) => void;
  onLooksGood: () => void;
  onDetailedReview: () => void;
  nextSectionLabel: string;
}) {
  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const grouped = useMemo(() => {
    const byCategory: Record<string, { id: string; label: string; cost: number }[]> = {};
    for (const id of acceptedIds) {
      const item = itemMap.get(id);
      if (!item) continue;
      const cat = item.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({ id: item.id, label: item.label, cost: item.cost });
    }
    return TURBO_REVIEW_CATEGORY_ORDER.filter(cat => (byCategory[cat]?.length ?? 0) > 0).map(cat => ({
      category: cat,
      entries: byCategory[cat] ?? [],
    }));
  }, [acceptedIds, itemMap]);

  const totalCost = acceptedIds.reduce((sum, id) => sum + (itemMap.get(id)?.cost ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full min-h-0 text-left"
    >
      <p className="text-gray-400 text-sm mb-3">
        Tap an item to remove it. Then confirm or open the full wishlist to edit.
      </p>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {grouped.map(({ category, entries }) => (
          <div key={category}>
            <h4 className="text-xs font-semibold text-yellow-400/90 uppercase tracking-wider mb-2">
              {category}
            </h4>
            <div className="space-y-1">
              {entries.map(({ id, label, cost }) => (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => onRemove(id)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-between items-center py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-left text-sm text-gray-200 hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <span>{label}</span>
                  <span className="text-gray-400 font-mono text-xs">{formatEstimate(cost)}</span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 pt-2 border-t border-white/10 space-y-2">
        <p className="text-xs text-gray-500 text-center">
          Total: {formatEstimate(totalCost)} · {acceptedIds.length} items
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDetailedReview}
            className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <ListChecks size={16} /> Detailed review
          </button>
          <button
            type="button"
            onClick={onLooksGood}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Looks good <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

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
      bathQuality: (projectWishlist?.bathQuality ?? 'premium') as BathQualityTier,
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
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter(x => x !== item) };
      }
      const groups = EXCLUSION_GROUPS[key];
      let next = [...arr];
      if (groups) {
        for (const group of groups) {
          if (group.includes(item)) {
            next = next.filter(x => !group.includes(x));
            break;
          }
        }
      }
      next = [...next, item];
      return { ...prev, [key]: next };
    });
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
  };
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set(['rooms']));
  const [specialInstructions, setSpecialInstructions] = useState(projectCtx?.project?.notes?.specialInstructions ?? '');
  const [viewMode, setViewMode] = useState<'detail' | 'tinder'>('detail');
  const [turboFullScreen, setTurboFullScreen] = useState(false);
  // When true, show the in-overlay review step (grouped picks, tap to remove) instead of TinderMode
  const [turboReviewActive, setTurboReviewActive] = useState(false);
  // Incremented each time turbo opens so TurboSpeedEntry re-mounts and replays
  const [turboEntryKey, setTurboEntryKey] = useState(0);
  const [showPinterestImport, setShowPinterestImport] = useState(false);
  const isInitialMount = useRef(true);

  // Build Tinder Mode items from COMPONENT_ESTIMATES — all swipeable features
  const tinderItems: SwipeItem[] = useMemo(() => {
    const categoryMap: Record<string, string> = {
      'Walk-in Closet': 'Rooms', 'En-suite Bath': 'Rooms', 'Sitting Area': 'Rooms', 'Ceiling Fan': 'Rooms',
      'Bay Window': 'Rooms', 'Balcony Access': 'Rooms', 'Vaulted Ceiling': 'Rooms', 'Hardwood Floors': 'Rooms',
      'Gas Range': 'Kitchen', 'Double Oven': 'Kitchen', 'French Door Fridge': 'Kitchen', 'Dishwasher Drawer': 'Kitchen',
      'Wine Cooler': 'Kitchen', 'Pot Filler': 'Kitchen', 'Island with Seating': 'Kitchen', 'Walk-in Pantry': 'Kitchen',
      'Under-cabinet Lighting': 'Kitchen', 'Pot Rack': 'Kitchen', 'Farm Sink': 'Kitchen', 'Garbage Disposal': 'Kitchen',
      'Rain Shower': 'Bathrooms', 'Freestanding Tub': 'Bathrooms', 'Double Vanity': 'Bathrooms', 'Smart Toilet': 'Bathrooms',
      'Vessel Sinks': 'Bathrooms', 'Heated Towel Bar': 'Bathrooms', 'Heated Floors': 'Bathrooms', 'Subway Tile': 'Bathrooms',
      'Mosaic Accent': 'Bathrooms', 'Slab Shower': 'Bathrooms', 'Natural Stone': 'Bathrooms', 'Large Format': 'Bathrooms',
      'Steam Shower': 'Bathrooms', 'Bidet': 'Bathrooms', 'Walk-in Shower': 'Bathrooms', 'Makeup Vanity': 'Bathrooms',
      'Linen Closet': 'Bathrooms', 'Skylight': 'Bathrooms',
      'Crown Molding': 'Interior', 'Wainscoting': 'Interior', 'Coffered Ceiling': 'Interior', 'Built-in Shelves': 'Interior',
      'Fireplace': 'Interior', 'Wet Bar': 'Interior', 'Home Office': 'Interior', 'Laundry Room': 'Interior',
      'Stucco': 'Exterior', 'Brick': 'Exterior', 'Stone Veneer': 'Exterior', 'Hardie Board': 'Exterior',
      'Wood Siding': 'Exterior', 'Metal Accents': 'Exterior', 'Energy Efficient Windows': 'Exterior',
      'French Doors': 'Exterior', 'Sliding Glass Door': 'Exterior', 'Entry Door Upgrade': 'Exterior',
      'Skylights': 'Exterior', 'Transom Windows': 'Exterior',
      'Covered Patio': 'Outdoor', 'Outdoor Kitchen': 'Outdoor', 'Fire Pit': 'Outdoor', 'Pergola': 'Outdoor',
      'Sprinkler System': 'Outdoor', 'Fencing': 'Outdoor', 'Xeriscaping': 'Outdoor', 'Lawn Installation': 'Outdoor',
      'Tree Planting': 'Outdoor', 'Garden Beds': 'Outdoor', 'Lighting': 'Outdoor', 'Water Features': 'Outdoor',
      'New AC Unit': 'Systems', 'Furnace Upgrade': 'Systems', 'Smart Thermostat': 'Systems', 'Zoned System': 'Systems',
      'Air Purification': 'Systems', 'Ductwork': 'Systems', 'Panel Upgrade': 'Systems', 'EV Charger': 'Systems',
      'Generator': 'Systems', 'Smart Lighting': 'Systems', 'Surge Protection': 'Systems', 'Rewiring': 'Systems',
      'Solar': 'Systems', 'Repipe': 'Systems', 'Water Heater': 'Systems', 'Tankless': 'Systems',
      'Water Softener': 'Systems', 'Sump Pump': 'Systems', 'Sewer Line': 'Systems',
    };
    return Object.entries(COMPONENT_ESTIMATES)
      .filter(([name]) => categoryMap[name] != null) // exclude home styles / flooring / pool
      .map(([name, est]) => ({
        id: name,
        label: name,
        category: categoryMap[name] || 'Other',
        cost: est.cost,
        valueAdded: Math.round(est.cost * est.roi),
        roi: est.roi,
        image: FEATURE_IMAGES[name],
        description: FEATURE_DESCRIPTIONS[name],
      }))
      .sort((a, b) => b.cost - a.cost); // show high-impact items first
  }, []);

  // Map a feature name back to its selection key (must be before any callback that uses it)
  const featureToKey = useCallback((name: string): 'roomFeatures' | 'kitchenFeatures' | 'bathroomFeatures' | 'interiorDetails' | 'exteriorDetails' | 'outdoorFeatures' | 'systemsDetails' => {
    const map: Record<string, 'roomFeatures' | 'kitchenFeatures' | 'bathroomFeatures' | 'interiorDetails' | 'exteriorDetails' | 'outdoorFeatures' | 'systemsDetails'> = {
      Rooms: 'roomFeatures', Kitchen: 'kitchenFeatures', Bathrooms: 'bathroomFeatures',
      Interior: 'interiorDetails', Exterior: 'exteriorDetails', Outdoor: 'outdoorFeatures', Systems: 'systemsDetails',
    };
    const item = tinderItems.find(i => i.id === name);
    return map[item?.category ?? ''] ?? 'roomFeatures';
  }, [tinderItems]);

  // Gather currently selected feature IDs for Tinder Mode initial state and for Turbo review step
  const currentlyAcceptedIds = useMemo(() => {
    const all: string[] = [
      ...(selections.roomFeatures ?? []),
      ...(selections.kitchenFeatures ?? []),
      ...(selections.bathroomFeatures ?? []),
      ...(selections.interiorDetails ?? []),
      ...(selections.exteriorDetails ?? []),
      ...(selections.outdoorFeatures ?? []),
      ...(selections.systemsDetails ?? []),
    ];
    return all;
  }, [selections]);

  const handleTurboReviewRemove = useCallback((id: string) => {
    const key = featureToKey(id);
    setSelections(prev => {
      const arr = prev[key] ?? [];
      return { ...prev, [key]: arr.filter(x => x !== id) };
    });
  }, [featureToKey]);

  const handleTurboLooksGood = useCallback(() => {
    setTurboReviewActive(false);
    setTurboFullScreen(false);
    onFinishWishlist?.();
  }, [onFinishWishlist]);

  const handleTurboDetailedReview = useCallback(() => {
    setTurboReviewActive(false);
    setTurboFullScreen(false);
    setViewMode('detail');
  }, []);

  const handleTinderSelectionChange = useCallback((accepted: string[], _rejected: string[]) => {
    // Update all feature arrays based on accepted list
    const grouped: Record<string, string[]> = {
      roomFeatures: [], kitchenFeatures: [], bathroomFeatures: [],
      interiorDetails: [], exteriorDetails: [], outdoorFeatures: [], systemsDetails: [],
    };
    for (const id of accepted) {
      const key = featureToKey(id);
      grouped[key].push(id);
    }
    setSelections(prev => ({
      ...prev,
      roomFeatures: grouped.roomFeatures,
      kitchenFeatures: grouped.kitchenFeatures,
      bathroomFeatures: grouped.bathroomFeatures,
      interiorDetails: grouped.interiorDetails,
      exteriorDetails: grouped.exteriorDetails,
      outdoorFeatures: grouped.outdoorFeatures,
      systemsDetails: grouped.systemsDetails,
    }));
    // Mark all categories as touched
    setCompletedCategories(new Set(CATEGORIES.map(c => c.id)));
  }, [featureToKey]);

  const handleTinderFinish = useCallback((accepted: string[], rejected: string[]) => {
    handleTinderSelectionChange(accepted, rejected);
    setTurboReviewActive(true); // stay in overlay → show review step (no close, no viewMode change yet)
  }, [handleTinderSelectionChange]);

  // Pinterest Style Scan — maps detected selections into the wishlist
  const handlePinterestApply = useCallback((pinterestSelections: PinterestSelections) => {
    setSelections(prev => {
      const next = { ...prev };

      // Top-level style picks
      if (pinterestSelections.homeStyle) next.homeStyle = pinterestSelections.homeStyle;
      if (pinterestSelections.kitchenLevel) next.kitchenLevel = pinterestSelections.kitchenLevel as typeof prev.kitchenLevel;
      if (pinterestSelections.flooring) next.flooring = pinterestSelections.flooring;

      // Distribute detected features into their correct category arrays
      const featureMap: Record<string, 'roomFeatures' | 'kitchenFeatures' | 'bathroomFeatures' | 'interiorDetails' | 'exteriorDetails' | 'outdoorFeatures' | 'systemsDetails'> = {
        'Walk-in Closet': 'roomFeatures', 'En-suite Bath': 'roomFeatures', 'Sitting Area': 'roomFeatures',
        'Ceiling Fan': 'roomFeatures', 'Bay Window': 'roomFeatures', 'Balcony Access': 'roomFeatures',
        'Vaulted Ceiling': 'roomFeatures', 'Hardwood Floors': 'roomFeatures',
        'Wine Cooler': 'kitchenFeatures', 'Pot Filler': 'kitchenFeatures', 'Island with Seating': 'kitchenFeatures',
        'Walk-in Pantry': 'kitchenFeatures', 'Under-cabinet Lighting': 'kitchenFeatures', 'Pot Rack': 'kitchenFeatures',
        'Farm Sink': 'kitchenFeatures', 'Garbage Disposal': 'kitchenFeatures',
        'Vessel Sinks': 'bathroomFeatures', 'Heated Towel Bar': 'bathroomFeatures', 'Heated Floors': 'bathroomFeatures',
        'Subway Tile': 'bathroomFeatures', 'Steam Shower': 'bathroomFeatures', 'Bidet': 'bathroomFeatures',
        'Walk-in Shower': 'bathroomFeatures', 'Makeup Vanity': 'bathroomFeatures',
        'Linen Closet': 'bathroomFeatures', 'Skylight': 'bathroomFeatures',
        'Crown Molding': 'interiorDetails', 'Wainscoting': 'interiorDetails', 'Coffered Ceiling': 'interiorDetails',
        'Built-in Shelves': 'interiorDetails', 'Fireplace': 'interiorDetails', 'Wet Bar': 'interiorDetails',
        'Home Office': 'interiorDetails', 'Laundry Room': 'interiorDetails',
        'New Siding': 'exteriorDetails', 'New Windows': 'exteriorDetails', 'New Garage Door': 'exteriorDetails',
        'New Roof': 'exteriorDetails', 'Front Door': 'exteriorDetails', 'Gutters': 'exteriorDetails',
        'Covered Patio': 'outdoorFeatures', 'Outdoor Kitchen': 'outdoorFeatures', 'Fire Pit': 'outdoorFeatures',
        'Pergola': 'outdoorFeatures', 'Sprinkler System': 'outdoorFeatures', 'Fencing': 'outdoorFeatures',
        'Solar': 'systemsDetails', 'Repipe': 'systemsDetails', 'Water Heater': 'systemsDetails', 'Tankless': 'systemsDetails',
      };

      // Merge Pinterest features into existing selections (union — don't remove what they already picked)
      for (const feature of pinterestSelections.features) {
        const key = featureMap[feature];
        if (!key) continue;
        const existing = next[key] ?? [];
        if (!existing.includes(feature)) {
          next[key] = [...existing, feature];
        }
      }

      return next;
    });

    // Mark all categories as touched so the completion indicator reflects the new state
    setCompletedCategories(new Set(CATEGORIES.map(c => c.id)));

    // Persist Aria's material picks into ProjectContext so DesignPackage and downstream
    // pages can use them as the default finishes schedule.
    if (pinterestSelections.materialDetails?.length && projectCtx) {
      projectCtx.updateProject({
        wishlist: { ...projectCtx.project.wishlist, materialDetails: pinterestSelections.materialDetails },
      });
    }

    setShowPinterestImport(false);
  }, [projectCtx]);

  const propertySqft = projectCtx?.project?.property?.sqft || undefined;
  const { totalCost, totalValue, roi } = useMemo(() => calculateCosts(selections, propertySqft), [selections, propertySqft]);
  const equityCreated = totalValue - totalCost;
  const roiPercent = Math.round(roi * 100);
  useMilestoneConfetti(equityCreated, roiPercent);

  const minBedrooms = Math.max(1, Math.min(8, (projectCtx?.project?.property?.beds && projectCtx.project.property.beds > 0) ? projectCtx.project.property.beds : (initialBedrooms ?? 1)));
  const minBathrooms = Math.max(1, Math.min(8, (projectCtx?.project?.property?.baths && projectCtx.project.property.baths > 0) ? projectCtx.project.property.baths : (initialBathrooms ?? 1)));

  useEffect(() => {
    if (selections.bedrooms < minBedrooms || selections.bathrooms < minBathrooms) {
      setSelections(prev => {
        const beds = Math.max(prev.bedrooms, minBedrooms);
        const baths = Math.max(prev.bathrooms, minBathrooms);
        if (beds === prev.bedrooms && baths === prev.bathrooms) return prev;
        return {
          ...prev,
          bedrooms: beds,
          bathrooms: baths,
          bedTiles: buildTiles('bed', beds, prev.bedTiles ?? [], 'add'),
          bathTiles: buildTiles('bath', baths, prev.bathTiles ?? [], 'add'),
        };
      });
    }
  }, [minBedrooms, minBathrooms, selections.bedrooms, selections.bathrooms]);

  const summaryMetrics = useMemo(() => {
    const currentValue = projectCtx?.project?.property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
    const rawBalance = projectCtx?.project?.financial?.existingMortgageBalance;
    // If user hasn't set balance (e.g. they're still on Wishlist), use estimated balance so "Save vs. comparable" isn't overstated (e.g. $0 balance made savings look like $4k+/mo).
    const existingBalance =
      typeof rawBalance === 'number' && rawBalance >= 0
        ? rawBalance
        : currentValue * ESTIMATED_LTV_WHEN_BALANCE_UNKNOWN;
    const userRateDecimal = (projectCtx?.project?.onboarding?.mortgageRate ?? USER_RATE_ANNUAL * 100) / 100;
    const postRenovationValue = currentValue + totalValue;
    const principalAfterReno = existingBalance + totalCost;
    const yourPaymentAfterReno = monthlyPaymentForLoan(principalAfterReno, userRateDecimal, TERM_YEARS);
    const comparableLoanAmount = 0.8 * postRenovationValue;
    const comparablePayment = monthlyPaymentForLoan(comparableLoanAmount, MARKET_RATE_ANNUAL, TERM_YEARS);
    const monthlySavings = Math.round(comparablePayment - yourPaymentAfterReno);
    return {
      postRenovationValue,
      monthlySavings,
      valueAdded: totalValue,
      usedEstimatedBalance: typeof rawBalance !== 'number' || rawBalance < 0,
    };
  }, [projectCtx?.project?.property?.currentValue, projectCtx?.project?.financial?.existingMortgageBalance, projectCtx?.project?.onboarding?.mortgageRate, totalCost, totalValue]);

  // Persist wishlist to project so Design Package and Contractor Review have full scope (CAD/contractor-ready)
  useEffect(() => {
    if (!projectCtx?.project) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const prev = projectCtx.project;
    projectCtx.updateProject({
      wishlist: {
        ...(prev.wishlist ?? {}),
        ...selections,
        bedTiles: selections.bedTiles,
        bathTiles: selections.bathTiles,
      },
      financial: {
        ...(prev.financial ?? {}),
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
      let next = { ...prev };
      if (key === 'bedrooms') {
        const count = Math.max(minBedrooms, Math.min(8, Number(value) ?? 4));
        next.bedrooms = count;
        next.bedTiles = buildTiles('bed', count, prev.bedTiles ?? [], 'add');
      } else if (key === 'bathrooms') {
        const count = Math.max(minBathrooms, Math.min(8, Number(value) ?? 4));
        next.bathrooms = count;
        next.bathTiles = buildTiles('bath', count, prev.bathTiles ?? [], 'add');
      } else {
        next = { ...next, [key]: value };
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
  const setBathTileType = (index: number, bathType: BathType) => {
    setSelections(prev => {
      const tiles = [...(prev.bathTiles ?? [])];
      if (tiles[index]) tiles[index] = { ...tiles[index], bathType };
      return { ...prev, bathTiles: tiles };
    });
    setCompletedCategories(prev => new Set([...prev, activeCategory]));
  };
  const setBathQualityOverride = (index: number, quality: BathQualityTier | undefined) => {
    setSelections(prev => {
      const tiles = [...(prev.bathTiles ?? [])];
      if (tiles[index]) tiles[index] = { ...tiles[index], qualityOverride: quality };
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
        const _bathRenoCount = bathTiles.filter(t => t.status === 'renovate').length; void _bathRenoCount;
        const existingTiles = [...bedTiles, ...bathTiles].filter(t => t.status !== 'add');
        const allExistingLeftAlone = existingTiles.length > 0 && existingTiles.every(t => t.status === 'leave');
        const allExistingRenovate = existingTiles.length > 0 && existingTiles.every(t => t.status === 'renovate');

        return (
          <div className="space-y-6">
            {/* Quick actions — same enclosure style */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-white font-medium mb-2">Quick actions</p>
              <p className="text-purple-300/70 text-xs mb-3">Apply to all existing rooms (rooms you&apos;re adding are unchanged)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyQuickAction('leave_all')}
                  className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                    allExistingLeftAlone
                      ? 'bg-pink-500/20 border-pink-500/50 text-white ring-1 ring-pink-500/30'
                      : 'border-white/10 bg-white/5 text-purple-200 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {allExistingLeftAlone && <CheckCircle2 size={16} className="text-pink-400 shrink-0" />}
                  Leave existing alone
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickAction('renovate_all')}
                  className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                    allExistingRenovate
                      ? 'bg-pink-500/20 border-pink-500/50 text-white ring-1 ring-pink-500/30'
                      : 'border-white/10 bg-white/5 text-purple-200 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {allExistingRenovate && <CheckCircle2 size={16} className="text-pink-400 shrink-0" />}
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
                    type="button"
                    onClick={() => updateSelection('bedrooms', Math.max(minBedrooms, selections.bedrooms - 1))}
                    disabled={selections.bedrooms <= minBedrooms}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/10"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-xl font-bold w-7 text-center text-white">{selections.bedrooms}</span>
                  <button
                    type="button"
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

            {/* Bathrooms: count + tiles + type + quality tier */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bath size={20} className="text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Bathrooms</p>
                    <p className="text-purple-300/70 text-xs">Total count (after project). Label each &amp; set scope.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
                  <button
                    type="button"
                    onClick={() => updateSelection('bathrooms', Math.max(minBathrooms, selections.bathrooms - 1))}
                    disabled={selections.bathrooms <= minBathrooms}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/10"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-xl font-bold w-7 text-center text-white">{selections.bathrooms}</span>
                  <button
                    type="button"
                    onClick={() => updateSelection('bathrooms', Math.min(8, selections.bathrooms + 1))}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Bath tiles — each with type label + status + optional quality override */}
              <div className="space-y-3">
                {bathTiles.map((tile, i) => {
                  const isLeave = tile.status === 'leave';
                  const bt = tile.bathType ?? defaultBathType(i);
                  const effectiveQuality = tile.qualityOverride ?? selections.bathQuality;
                  const isActive = tile.status !== 'leave'; // renovate or add
                  const surfaceCost = isActive ? bathSurfaceTotal(effectiveQuality, bt) : 0;
                  const addBase = tile.status === 'add' ? BATH_ADDITION_BASE[bt] : 0;
                  const totalBathCost = surfaceCost + addBase;

                  return (
                    <div
                      key={tile.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isLeave
                          ? 'bg-white/[0.03] border-white/[0.08] opacity-70'
                          : 'bg-white/5 border-white/15'
                      }`}
                    >
                      {/* Row 1: Type label + status buttons (mobile-friendly layout) */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 justify-center sm:justify-start">
                          {/* Bath type selector — compact dropdown pills */}
                          <select
                            value={bt}
                            onChange={(e) => setBathTileType(i, e.target.value as BathType)}
                            className="bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white appearance-none cursor-pointer hover:bg-white/15 transition-colors"
                            style={{ backgroundImage: 'none' }}
                          >
                            {(Object.keys(BATH_TYPE_LABELS) as BathType[]).map((t) => (
                              <option key={t} value={t}>{BATH_TYPE_ICONS[t]} {BATH_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
                          {(['add', 'renovate', 'leave'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => setBathTileStatus(i, status)}
                              className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                                tile.status === status
                                  ? status === 'add'
                                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200'
                                    : status === 'renovate'
                                    ? 'bg-pink-500/20 border border-pink-500/50 text-white'
                                    : 'bg-white/10 border border-white/20 text-purple-300'
                                  : 'bg-white/5 border border-white/10 text-purple-300/70 hover:bg-white/10'
                              }`}
                            >
                              {status === 'add' ? '+ Add' : status === 'renovate' ? 'Renovate' : "Leave"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Row 2 — only show surface detail for active baths */}
                      {isActive && (
                        <div className="mt-2 pt-2 border-t border-white/[0.08]">
                          {/* Quality override row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-purple-300/70 text-xs">
                              Finish level{tile.qualityOverride ? '' : ' (using global)'}:
                            </p>
                            <div className="flex items-center gap-1">
                              {(['standard', 'premium', 'luxury'] as const).map((q) => {
                                const isActive = effectiveQuality === q;
                                const isOverride = tile.qualityOverride === q;
                                return (
                                  <button
                                    key={q}
                                    onClick={() => setBathQualityOverride(i, isOverride ? undefined : q)}
                                    className={`py-1 px-2 rounded-md text-[11px] font-medium transition-all ${
                                      isActive
                                        ? isOverride
                                          ? 'bg-pink-500/25 border border-pink-500/60 text-white'
                                          : 'bg-purple-500/20 border border-purple-500/40 text-purple-200'
                                        : 'bg-white/5 border border-white/10 text-purple-400/60 hover:bg-white/10'
                                    }`}
                                  >
                                    {BATH_QUALITY_LABELS[q]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Surface cost preview — compact */}
                          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                            {(Object.entries(BATH_SURFACES[effectiveQuality]) as [string, { material: string; cost: number }][])
                              .filter(([key]) => {
                                // Half baths don't have wall tile or tub/shower
                                if (bt === 'half' && (key === 'wallTile' || key === 'tubShower')) return false;
                                return true;
                              })
                              .map(([key, surface]) => (
                                <div key={key} className="bg-black/20 rounded-lg px-2 py-1.5">
                                  <p className="text-purple-400/60 truncate">{key === 'floorTile' ? 'Floor' : key === 'wallTile' ? 'Walls' : key === 'tubShower' ? 'Tub/Shower' : key === 'vanity' ? 'Vanity' : key === 'fixtures' ? 'Fixtures' : 'Lighting'}</p>
                                  <p className="text-white/80 font-medium truncate">{surface.material.split(' ').slice(0, 2).join(' ')}</p>
                                </div>
                              ))}
                          </div>

                          {/* Cost summary line */}
                          <div className="flex items-center justify-between mt-2 pt-1.5">
                            <p className="text-purple-300/60 text-[11px]">
                              {tile.status === 'add' ? `Build ($${(addBase / 1000).toFixed(0)}K) + finishes` : 'Finish cost'}
                            </p>
                            <p className="text-emerald-400 font-semibold text-xs">
                              ~${(totalBathCost / 1000).toFixed(0)}K per bath
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Global bath quality tier — applies to all baths unless overridden */}
              {bathTiles.some(t => t.status !== 'leave') && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white text-sm font-medium mb-1">Default finish level</p>
                  <p className="text-purple-300/60 text-xs mb-3">Applies to all bathrooms. Tap a level on any bath above to override.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['standard', 'premium', 'luxury'] as const).map((tier) => {
                      const isSelected = selections.bathQuality === tier;
                      return (
                        <button
                          key={tier}
                          onClick={() => updateSelection('bathQuality', tier)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-pink-500/20 border-pink-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <p className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-purple-200'}`}>
                            {BATH_QUALITY_LABELS[tier]}
                          </p>
                          <p className="text-purple-300/60 text-[11px] mt-0.5 leading-tight">
                            {BATH_QUALITY_DESCRIPTIONS[tier]}
                          </p>
                          <p className="text-emerald-400 text-xs font-medium mt-1">
                            ~${(bathSurfaceTotal(tier, 'full') / 1000).toFixed(0)}K / full bath
                          </p>
                        </button>
                      );
                    })}
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
                    <motion.label
                      key={feature}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors border border-white/10"
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(selections.roomFeatures ?? []).includes(feature)}
                          onChange={() => toggleFeature('roomFeatures', feature)}
                          className="rounded border-white/20 text-pink-500 focus:ring-pink-500 bg-white/10 shrink-0"
                        />
                        <span className="text-sm text-purple-200">{feature}</span>
                      </div>
                      {est && (
                        <span className="text-xs text-purple-400 text-right">
                          {formatEstimate(est.cost)} · {formatValue(est.cost * est.roi)}
                        </span>
                      )}
                    </motion.label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'kitchen': {
        const kLevel = (selections.kitchenLevel || 'Premium') as KitchenLevel;
        const kSurfaces = KITCHEN_SURFACES[kLevel];
        const kTotal = kitchenSurfaceTotal(kLevel);
        const SURFACE_LABELS: Record<string, string> = {
          countertops: 'Countertops', cabinets: 'Cabinets', backsplash: 'Backsplash',
          appliances: 'Appliances', flooring: 'Kitchen Floor', lighting: 'Lighting', plumbing: 'Sink & Plumbing',
        };

        return (
          <div className="space-y-6">
            {/* Kitchen Level */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-medium mb-3">Kitchen Level</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['Standard', 'Mid', 'Premium', 'Luxury'] as const).map((level) => {
                  const total = kitchenSurfaceTotal(level);
                  const costStr = total >= 1000 ? `$${Math.round(total / 1000)}K` : `$${total}`;
                  const descs: Record<string, string> = {
                    Standard: 'Laminate counters, stock cabinets, standard appliances',
                    Mid: 'Granite/quartz counters, semi-custom cabinets, mid-range appliances',
                    Premium: 'Stone counters, custom cabinets, premium appliances',
                    Luxury: 'Marble waterfall, bespoke cabinetry, pro-grade appliances',
                  };
                  return (
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
                      <p className="text-emerald-400 text-sm font-medium">{costStr}</p>
                      <p className="text-purple-300/60 text-xs mt-1">{descs[level]}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surface breakdown for selected level */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-medium text-sm">Where your ${Math.round(kTotal / 1000)}K goes</p>
                <p className="text-purple-300/60 text-xs">{kLevel} level</p>
              </div>
              <div className="space-y-1.5">
                {(Object.entries(kSurfaces) as [string, { material: string; cost: number; laborPct: number }][]).map(([key, surface]) => {
                  const pct = Math.round((surface.cost / kTotal) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <p className="text-purple-300/70 text-xs w-24 shrink-0">{SURFACE_LABELS[key] ?? key}</p>
                      <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-pink-500/60 to-purple-500/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-white text-xs font-mono tabular-nums w-14 text-right">${(surface.cost / 1000).toFixed(1)}K</p>
                      <p className="text-purple-400/50 text-[10px] w-20 text-right truncate">{surface.material.split(' ').slice(0, 3).join(' ')}</p>
                    </div>
                  );
                })}
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
                      <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selections.kitchenFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('kitchenFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 text-right">
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
                      <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selections.kitchenFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('kitchenFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 text-right">
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
      }

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
                        <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(selections.bathroomFeatures ?? []).includes(item)}
                              onChange={() => toggleFeature('bathroomFeatures', item)}
                              className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                            />
                            <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{item}</span>
                          </div>
                          {est && (
                            <span className="text-xs text-purple-400 text-right">
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
                    <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(selections.interiorDetails ?? []).includes(item)}
                          onChange={() => toggleFeature('interiorDetails', item)}
                          className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                        />
                        <span className="text-sm text-purple-200">{item}</span>
                      </div>
                      {est && (
                        <span className="text-xs text-purple-400 text-right">
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
                      <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selections.exteriorDetails ?? []).includes(item)}
                            onChange={() => toggleFeature('exteriorDetails', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 text-right">
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
                      <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selections.exteriorDetails ?? []).includes(item)}
                            onChange={() => toggleFeature('exteriorDetails', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 text-right">
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
                      <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selections.outdoorFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('outdoorFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 text-right">
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
                      <label key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selections.outdoorFeatures ?? []).includes(item)}
                            onChange={() => toggleFeature('outdoorFeatures', item)}
                            className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                          />
                          <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{item}</span>
                        </div>
                        {est && (
                          <span className="text-xs text-purple-400 text-right">
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
                    { label: 'Rewiring', cost: '+$15K' },
                    { label: 'Solar', cost: '+$18K' }
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
                        <label key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(selections.systemsDetails ?? []).includes(label)}
                              onChange={() => toggleFeature('systemsDetails', label)}
                              className="rounded border-white/20 text-pink-500 bg-white/10 shrink-0"
                            />
                            <span className="text-sm text-purple-200 group-hover:text-white transition-colors">{label}</span>
                          </div>
                          {est && (
                            <span className="text-xs text-purple-400 text-right">
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
      {/* Think Big Banner */}
      <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10 px-5 py-4 flex items-start gap-3 overflow-hidden min-w-0">
        <div className="text-2xl shrink-0 mt-0.5">💡</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm tracking-wide uppercase break-words card-text-wrap">Think Big — Give Us Your Vision</p>
          <p className="text-purple-200/80 text-xs mt-1 break-words card-text-wrap">
            Don't hold back. Add everything you'd want in your dream home. We'll help you optimize toward your budget on the next step — no dream is too big to start with.
          </p>
        </div>
      </div>

      {/* Section Header + Mode Toggle + Metric Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Wishlist</h2>
            <p className="text-purple-300/70 text-sm mt-1">Select features for your dream home renovation.</p>
          </div>
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 shrink-0">
            {/* Style Scan / Pinterest import button */}
            <motion.button
              type="button"
              onClick={() => setShowPinterestImport(true)}
              whileHover={{ scale: 1.04, boxShadow: '0 0 22px rgba(230,0,35,0.35)' }}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-xl border border-[#e60023]/50 bg-gradient-to-r from-[#e60023]/15 via-pink-600/10 to-purple-600/10 text-white text-xs font-semibold overflow-hidden"
              style={{ boxShadow: '0 0 14px rgba(230,0,35,0.18)' }}
            >
              {/* Pulsing glow ring */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-[#e60023]/60 pointer-events-none"
                animate={{ scale: [1, 1.07, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Pinterest P logo */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-white text-sm leading-none select-none shadow"
                style={{ background: '#e60023', fontStyle: 'italic', letterSpacing: '-0.5px' }}
              >
                P
              </div>
              {/* Label */}
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-white font-bold text-xs tracking-wide">Style Scan</span>
                <span className="text-[#ff6680] text-[9px] font-medium opacity-90">import from Pinterest</span>
              </div>
            </motion.button>
          {/* Tinder / Detail Mode Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setViewMode('detail')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'detail'
                  ? 'bg-pink-500/20 border border-pink-500/50 text-white'
                  : 'text-purple-300 hover:bg-white/5'
              }`}
            >
              <ListChecks size={14} /> Detail
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('tinder'); setTurboFullScreen(true); setTurboReviewActive(false); setTurboEntryKey(k => k + 1); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'tinder'
                  ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-500/50 text-white'
                  : 'text-purple-300 hover:bg-white/5'
              }`}
            >
              <Zap size={14} /> TURBO MODE
            </button>
          </div>
          </div>
        </div>
        {/* Metric cards — horizontal row, compressed */}
        <div className="hidden sm:flex flex-nowrap gap-2">
          <div className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-purple-300 text-xs uppercase tracking-wider font-semibold truncate">Est. renovation cost</p>
            <p className="text-base font-bold text-white mt-1 truncate">${totalCost.toLocaleString()}</p>
          </div>
          <div className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-purple-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 min-w-0">
              <span className="truncate">Est. future value</span>
              <InfoTooltip content={CALCULATION_TOOLTIPS.postRenovationValue} label="How we calculate post-renovation value" />
            </p>
            <p className="text-base font-bold text-white mt-1 truncate">{formatSummaryCurrency(summaryMetrics.postRenovationValue)}</p>
          </div>
          <div className="flex-1 min-w-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-emerald-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 truncate">
              <TrendingUp size={12} strokeWidth={2.5} /> Value increase
            </p>
            <p className="text-emerald-200 text-base font-bold mt-1 truncate">
              <ValueWithPop value={summaryMetrics.valueAdded} format="currency" prefix="+" className="inline" /> value
            </p>
          </div>
          <div className="flex-1 min-w-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-emerald-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 min-w-0">
              <span className="truncate">Monthly savings</span>
              <InfoTooltip content={CALCULATION_TOOLTIPS.monthlySavings} label="How we calculate monthly savings" />
            </p>
            {summaryMetrics.monthlySavings > 0 ? (
              <p className="text-emerald-200 text-base font-bold mt-1 truncate">
                Save ${summaryMetrics.monthlySavings.toLocaleString()}/mo
              </p>
            ) : (
              <p className="text-purple-400 text-sm font-medium mt-1">Compare in Analysis</p>
            )}
            {summaryMetrics.monthlySavings > 0 && summaryMetrics.usedEstimatedBalance && (
              <p className="text-purple-300/90 text-xs font-medium mt-0.5 truncate">(est.; set in Analysis)</p>
            )}
          </div>
          <div className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-purple-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
              ROI
              <InfoTooltip content={CALCULATION_TOOLTIPS.roi} label="How we calculate ROI" />
            </p>
            <p className="text-base font-bold text-white mt-1">{roiPercent}%</p>
          </div>
        </div>
      </div>

      {/* ——— TURBO MODE ——— */}
      {viewMode === 'tinder' && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 text-sm font-bold mb-3 uppercase tracking-wider">
              <Zap size={14} className="text-yellow-400" /> ⚡ TURBO MODE
            </div>
            <p className="text-purple-300/70 text-sm">
              Swipe right to add &bull; Swipe left to skip &bull; How fast can you build your dream home?
            </p>
          </div>
          <TinderMode
            items={tinderItems}
            initialAccepted={currentlyAcceptedIds}
            onSelectionChange={handleTinderSelectionChange}
            onFinish={handleTinderFinish}
          />
        </div>
      )}

      {/* ——— DETAIL MODE ——— */}
      {/* Category Tabs */}
      {viewMode === 'detail' && <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const isComplete = completedCategories.has(cat.id);

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
            </motion.button>
          );
        })}
      </div>}

      {/* Active Category Content */}
      {viewMode === 'detail' && <AnimatePresence mode="wait">
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
            <motion.button
              type="button"
              onClick={handlePrimaryAction}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="px-6 py-2.5 rounded-xl bg-white text-purple-900 font-bold hover:bg-gray-100 transition-all flex items-center gap-2 animate-button-glow-2x"
            >
              {isLastCategory
                ? `Finish wishlist & go to ${nextSectionLabel}`
                : `Continue to ${nextCategory?.label ?? 'Next'}`}
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>}

      {/* Mobile: same metric cards in a compact grid */}
      <div className="sm:hidden space-y-2">
        <p className="text-purple-400/70 text-xs">Estimated costs — actual bids may vary.</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
            <p className="text-purple-300 text-xs uppercase tracking-wider font-semibold">Est. renovation cost</p>
            <p className="text-base font-bold text-white mt-1">${totalCost.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
            <p className="text-purple-300 text-xs uppercase tracking-wider font-semibold">Est. future value</p>
            <p className="text-base font-bold text-white mt-1">{formatSummaryCurrency(summaryMetrics.postRenovationValue)}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 col-span-2">
            <p className="text-emerald-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
              <TrendingUp size={12} strokeWidth={2.5} /> Value increase
            </p>
            <p className="text-emerald-200 text-base font-bold mt-1">
              <ValueWithPop value={summaryMetrics.valueAdded} format="currency" prefix="+" className="inline" /> value · {roiPercent}% ROI
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 col-span-2">
            <p className="text-emerald-300 text-xs uppercase tracking-wider font-semibold">Monthly savings</p>
            {summaryMetrics.monthlySavings > 0 ? (
              <p className="text-emerald-200 text-base font-bold mt-1">
                Save ${summaryMetrics.monthlySavings.toLocaleString()}/mo vs. comparable
                {summaryMetrics.usedEstimatedBalance && <span className="text-purple-300/90 text-xs font-medium"> (est.)</span>}
              </p>
            ) : (
              <p className="text-purple-400 text-sm font-medium mt-1">Compare in Analysis</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-purple-400/70 text-xs mb-2 hidden sm:block">Estimated costs — actual bids may vary.</p>
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

      {/* ─── Turbo Mode Full-Screen Overlay (portal → bypasses stacking context) ─── */}
      {createPortal(<AnimatePresence>
        {turboFullScreen && (
          <>
            {/* ── Cinematic speed-line burst + text slam ── */}
            <TurboSpeedEntry animKey={turboEntryKey} />

            {/* Main full-screen overlay — slams in with a hard scale punch */}
            <motion.div
              key="turbo-overlay"
              className="fixed inset-0 flex flex-col overflow-hidden"
              style={{ zIndex: 200, background: '#070a12' }}
              initial={{ scale: 1.12, opacity: 0 }}
              animate={{ scale: [1.12, 0.97, 1.01, 1], opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.15 } }}
              transition={{ duration: 0.45, times: [0, 0.35, 0.65, 1], ease: 'easeOut' }}
            >
              {/* Scanline texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)',
                  zIndex: 1,
                }}
              />
              {/* Radial speed-glow from center */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(234,179,8,0.07) 0%, transparent 70%)',
                  zIndex: 1,
                }}
              />
              {/* Neon border pulse */}
              <div
                className="absolute inset-0 pointer-events-none rounded-none"
                style={{
                  boxShadow: 'inset 0 0 0 2px rgba(234,179,8,0.25), inset 0 0 80px rgba(234,179,8,0.06)',
                  zIndex: 2,
                }}
              />

              {/* ── Header bar ── */}
              <div className="relative flex items-center gap-3 px-4 pt-4 pb-3 shrink-0" style={{ zIndex: 3 }}>
                {/* Title */}
                <div className="flex items-center gap-2 flex-1">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                  >
                    <Zap size={18} className="text-yellow-400" fill="currentColor" />
                  </motion.div>
                  <span className="text-yellow-400 font-black tracking-[0.18em] text-sm uppercase">
                    Turbo Mode
                  </span>
                  <span className="ml-1 text-[10px] font-bold text-yellow-300/70 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Speed Run
                  </span>
                </div>

                {/* Exit button */}
                <motion.button
                  onClick={() => { setTurboReviewActive(false); setTurboFullScreen(false); }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all text-sm font-semibold"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <X size={14} />
                  Exit
                </motion.button>
              </div>

              {/* Speed-lines separator */}
              <div
                className="w-full h-px shrink-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(234,179,8,0.4) 30%, rgba(234,179,8,0.8) 50%, rgba(234,179,8,0.4) 70%, transparent 100%)',
                  zIndex: 3,
                }}
              />

              {/* ── Turbo: review step or TinderMode ── */}
              <div className="relative flex-1 overflow-y-auto px-4 pt-4 pb-6 min-h-0 flex flex-col" style={{ zIndex: 3 }}>
                {turboReviewActive ? (
                  <TurboReviewStep
                    items={tinderItems}
                    acceptedIds={currentlyAcceptedIds}
                    onRemove={handleTurboReviewRemove}
                    onLooksGood={handleTurboLooksGood}
                    onDetailedReview={handleTurboDetailedReview}
                    nextSectionLabel={nextSectionLabel}
                  />
                ) : (
                  <TinderMode
                    items={tinderItems}
                    initialAccepted={currentlyAcceptedIds}
                    onSelectionChange={handleTinderSelectionChange}
                    onFinish={handleTinderFinish}
                    isFullScreen={true}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}

      {/* Pinterest Style Scan modal */}
      <AnimatePresence>
        {showPinterestImport && (
          <PinterestImport
            onApply={handlePinterestApply}
            onClose={() => setShowPinterestImport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Single source of truth for renovation costs, value-added, ROI, and financial constants.
 * Used by PropertyWishlist, FinancialAnalysis, and ProjectBuilder so totals stay in sync.
 */

/** Fallback current home value when project.property.currentValue is missing */
export const DEFAULT_CURRENT_HOME_VALUE = 850_000;

/** Market rate (e.g. for "comparable" loan / save-vs-comparable)
 *  Source: Freddie Mac PMMS — 30-yr fixed averaged ~6.9% in Q3 2025 */
export const MARKET_RATE_ANNUAL = 0.069;

/** User's assumed rate when not set (e.g. existing refi rate) */
export const USER_RATE_ANNUAL = 0.03;

/** Current average rate for renovation second lien (HELOC / ARV product)
 *  Source: Bankrate Mar 2026 — avg home equity loan 7.84%, avg HELOC 7.18%.
 *  Using home equity loan (fixed) rate since renovation draws are amortized. */
export const SECOND_LIEN_RATE_ANNUAL = 0.0784;

/** Current average rate for construction-to-permanent (replaces 1st mortgage)
 *  Source: LlamaLoan / JLC — avg construction loan rate 8.34% Q3 2025;
 *  construction-to-perm 30yr locked range 6.9%–8.2%. Using midpoint. */
export const CONSTRUCTION_TO_PERM_RATE_ANNUAL = 0.0785;

/** Loan term in years for payment calculations */
export const TERM_YEARS = 30;

/** When existing balance is unknown, assume this LTV of current value so "Save vs. comparable" isn't overstated */
export const ESTIMATED_LTV_WHEN_BALANCE_UNKNOWN = 0.75;

/** Annual home appreciation rate for break-even and projection calculations */
export const ANNUAL_APPRECIATION_RATE = 0.035;

/** Standard LTV limits by loan type */
export const LTV_LIMITS = {
  standardHeloc: 0.90,
  arvSecondLien: 0.90,
  constructionToPerm: 0.80,
} as const;

export type RenovationType = 'addition' | 'renovation';

export interface RenovationLineItem {
  id: string;
  label: string;
  category: string;
  /** Whether this is a new-space addition (ARV arbitrage) or an upgrade to existing space (Cost vs. Value) */
  type: RenovationType;
  cost: number;
  valueAdded: number;
  roiPct: number;
  amenity?: string;
  benefit?: string;
  /** Source for the ROI rate used */
  roiSource?: string;
}

/**
 * Master list of renovation line items.
 *
 * ADDITIONS use the local ARV arbitrage model:
 *   Build cost $250–$400/sqft (Phoenix 2025–2026) vs. market value $/sqft.
 *   ROI varies by submarket — Arcadia 85018 ($500+/sqft resale) supports ~140%;
 *   broader Phoenix ($311/sqft resale) is closer to 100–120%.
 *   Using 130% as a calibrated metro-wide default.
 *
 * RENOVATIONS use Cost vs. Value data (more conservative):
 *   Industry benchmarks from JLC/Zonda 2025 Cost vs. Value Report — Pacific region
 */
export const MASTER_RENOVATION_ITEMS: RenovationLineItem[] = [
  // ADDITIONS — Phoenix metro ARV arbitrage (2025–2026 calibrated)
  // Build ~$330/sqft avg, market ~$430/sqft blended (mix of Arcadia premium + metro avg)
  { id: 'master-suite', label: 'Master Suite Addition', category: 'Rooms', type: 'addition', cost: 165_000, valueAdded: 214_500, roiPct: 130, amenity: 'Larger bedrooms / master suite', benefit: 'More space and stronger comps', roiSource: 'Phoenix metro avg build cost ($250–400/sqft) vs. blended resale $/sqft — 2025 Angi/ProMatcher/Redfin' },
  { id: 'bath-add', label: 'Bathroom Additions', category: 'Bathrooms', type: 'addition', cost: 60_000, valueAdded: 78_000, roiPct: 130, amenity: 'Additional full baths', benefit: 'Better bed/bath ratio and daily comfort', roiSource: 'Phoenix metro avg build cost vs. blended resale $/sqft — 2025 Angi/ProMatcher/Redfin' },

  // RENOVATIONS — Cost vs. Value data (JLC/Zonda 2025 Pacific region)
  { id: 'kitchen', label: 'Kitchen Renovation', category: 'Kitchen', type: 'renovation', cost: 86_000, valueAdded: 60_200, roiPct: 70, amenity: 'New cabinets, counters & appliances', benefit: 'Premium finishes that buyers pay for', roiSource: 'JLC/Zonda 2025 Cost vs. Value Report — Pacific region; Phoenix avg $50–100K mid-to-premium' },
  { id: 'flooring', label: 'Flooring Throughout', category: 'Interior', type: 'renovation', cost: 55_000, valueAdded: 44_000, roiPct: 80, amenity: 'Hardwood & tile', benefit: 'Durable, desirable surfaces throughout', roiSource: 'JLC/Zonda 2025 Cost vs. Value Report — Pacific region' },
  { id: 'exterior', label: 'Exterior Updates', category: 'Exterior', type: 'renovation', cost: 60_000, valueAdded: 39_000, roiPct: 65, amenity: 'Siding, windows & doors', benefit: 'Curb appeal and efficiency', roiSource: 'JLC/Zonda 2025 Cost vs. Value Report — Pacific region' },
  { id: 'systems', label: 'Systems & Electrical', category: 'Systems', type: 'renovation', cost: 30_000, valueAdded: 18_000, roiPct: 60, amenity: 'HVAC, electrical & plumbing', benefit: 'Reliability and peace of mind', roiSource: 'JLC/Zonda 2025 Cost vs. Value Report — Pacific region' },
  { id: 'pool', label: 'Pool & Outdoor', category: 'Outdoor', type: 'renovation', cost: 80_000, valueAdded: 32_000, roiPct: 40, amenity: 'Pool & outdoor living', benefit: 'Lifestyle upgrade and outdoor flow', roiSource: 'Shasta Pools 2026 AZ avg $52–109K; NAR pool ROI data — Sun Belt adjusted' },
];

// ─── CAD Design Package Pricing ───────────────────────────────────
// Philippines-sourced: ~$500 CAD work + ~$75 large-format print/ship + admin
// Offered at cost as a hook — small profit center at best
/** Price we charge for the full design package (3D renders, elevations, floor plans, printed & mailed) */
export const CAD_PACKAGE_PRICE = 599;
/** What the same package costs from a US-based architect / visualization firm */
export const CAD_PACKAGE_US_PRICE_LOW = 5_000;
export const CAD_PACKAGE_US_PRICE_HIGH = 8_000;
/** What a typical contractor feasibility study / project consultation costs homeowners */
export const ANALYSIS_MARKET_VALUE = 10_000;
/** Turnaround time description */
export const CAD_TURNAROUND = '~2 weeks';
/** Design package deliverables (for display) */
export const CAD_DELIVERABLES = [
  '3D photorealistic renderings (exterior + interior)',
  'Color elevation drawings (all 4 sides)',
  'Before & after floor plans',
  'Large-format prints mailed to your door',
] as const;

/** Lookup by id for use in PropertyWishlist / calculators */
export const MASTER_ITEMS_BY_ID = Object.fromEntries(
  MASTER_RENOVATION_ITEMS.map((item) => [item.id, item])
);

/**
 * Surface-level cost data for bathrooms and kitchens by quality tier.
 * Used by PropertyWishlist (display), itemized cost calculations, and the
 * Itemized Project Estimate to show exactly where every dollar goes.
 *
 * All costs are per-room for baths and per-kitchen for kitchens.
 * Labor is included in the total — the split is tracked separately for trade-level rollups.
 */

/* ------------------------------------------------------------------ */
/*  Bath types                                                          */
/* ------------------------------------------------------------------ */

export type BathType = 'master' | 'full' | 'jack_and_jill' | 'half';

export const BATH_TYPE_LABELS: Record<BathType, string> = {
  master: 'Master',
  full: 'Full',
  jack_and_jill: 'Jack & Jill',
  half: 'Half / Powder',
};

/** Emoji for quick visual recognition */
export const BATH_TYPE_ICONS: Record<BathType, string> = {
  master: '👑',
  full: '🚿',
  jack_and_jill: '👧👦',
  half: '🪞',
};

/* ------------------------------------------------------------------ */
/*  Bath quality tiers                                                  */
/* ------------------------------------------------------------------ */

export type BathQualityTier = 'standard' | 'premium' | 'luxury';

export const BATH_QUALITY_LABELS: Record<BathQualityTier, string> = {
  standard: 'Standard',
  premium: 'Premium',
  luxury: 'Luxury',
};

export const BATH_QUALITY_DESCRIPTIONS: Record<BathQualityTier, string> = {
  standard: 'Builder-grade fixtures, ceramic tile, stock vanity',
  premium: 'Porcelain tile, semi-custom vanity, glass shower enclosure',
  luxury: 'Natural stone, custom vanity, frameless glass, designer fixtures',
};

export interface SurfaceCostItem {
  material: string;
  /** Typical installed cost (material + labor combined) */
  cost: number;
  /** Approx labor % of total cost — used for trade-level rollups */
  laborPct: number;
  /** Trade category for contractor bid grouping */
  trade: string;
}

export interface BathSurfaceSet {
  floorTile: SurfaceCostItem;
  wallTile: SurfaceCostItem;
  vanity: SurfaceCostItem;
  tubShower: SurfaceCostItem;
  fixtures: SurfaceCostItem;
  lighting: SurfaceCostItem;
}

export const BATH_SURFACES: Record<BathQualityTier, BathSurfaceSet> = {
  standard: {
    floorTile:  { material: 'Ceramic tile',              cost: 1200,  laborPct: 0.55, trade: 'Tile' },
    wallTile:   { material: 'Standard subway tile',      cost: 900,   laborPct: 0.55, trade: 'Tile' },
    vanity:     { material: 'Stock vanity + laminate top', cost: 650, laborPct: 0.30, trade: 'Cabinetry' },
    tubShower:  { material: 'Fiberglass tub/shower combo', cost: 1100, laborPct: 0.45, trade: 'Plumbing' },
    fixtures:   { material: 'Chrome builder-grade',       cost: 450,   laborPct: 0.35, trade: 'Plumbing' },
    lighting:   { material: 'Basic vanity bar light',     cost: 200,   laborPct: 0.40, trade: 'Electrical' },
  },
  premium: {
    floorTile:  { material: 'Porcelain tile (12×24)',     cost: 2400,  laborPct: 0.50, trade: 'Tile' },
    wallTile:   { material: 'Large-format porcelain',     cost: 2000,  laborPct: 0.50, trade: 'Tile' },
    vanity:     { material: 'Semi-custom vanity + quartz', cost: 2200, laborPct: 0.30, trade: 'Cabinetry' },
    tubShower:  { material: 'Tile walk-in shower + glass', cost: 5000, laborPct: 0.55, trade: 'Tile / Glass' },
    fixtures:   { material: 'Brushed nickel / brass',     cost: 950,   laborPct: 0.30, trade: 'Plumbing' },
    lighting:   { material: 'Recessed + accent sconces',  cost: 650,   laborPct: 0.45, trade: 'Electrical' },
  },
  luxury: {
    floorTile:  { material: 'Marble / natural stone',     cost: 5000,  laborPct: 0.45, trade: 'Tile' },
    wallTile:   { material: 'Full marble slab walls',     cost: 7000,  laborPct: 0.45, trade: 'Tile' },
    vanity:     { material: 'Custom double vanity + stone', cost: 5500, laborPct: 0.35, trade: 'Cabinetry' },
    tubShower:  { material: 'Frameless glass + freestanding tub', cost: 10000, laborPct: 0.50, trade: 'Tile / Plumbing' },
    fixtures:   { material: 'Designer (Kohler Purist / Brizo)', cost: 2500, laborPct: 0.25, trade: 'Plumbing' },
    lighting:   { material: 'Designer sconces + chandelier', cost: 1500, laborPct: 0.40, trade: 'Electrical' },
  },
};

/**
 * Half / powder baths only have: floor tile, vanity, fixtures, lighting (no wall tile, no tub/shower).
 * Costs are roughly 50% of a full bath at the same tier because the room is smaller.
 */
export const HALF_BATH_MULTIPLIER = 0.55;

/** Full bath surface cost total for a given tier */
export function bathSurfaceTotal(tier: BathQualityTier, bathType: BathType): number {
  const surfaces = BATH_SURFACES[tier];
  if (bathType === 'half') {
    // Floor + vanity + fixtures + lighting only, scaled down
    return Math.round(
      (surfaces.floorTile.cost + surfaces.vanity.cost + surfaces.fixtures.cost + surfaces.lighting.cost)
      * HALF_BATH_MULTIPLIER
    );
  }
  // Full / master / jack_and_jill get all surfaces
  return Object.values(surfaces).reduce((sum, s) => sum + s.cost, 0);
}

/** Labor cost for a bath at a given tier */
export function bathLaborTotal(tier: BathQualityTier, bathType: BathType): number {
  const surfaces = BATH_SURFACES[tier];
  if (bathType === 'half') {
    const items = [surfaces.floorTile, surfaces.vanity, surfaces.fixtures, surfaces.lighting];
    return Math.round(
      items.reduce((sum, s) => sum + s.cost * s.laborPct, 0) * HALF_BATH_MULTIPLIER
    );
  }
  return Math.round(Object.values(surfaces).reduce((sum, s) => sum + s.cost * s.laborPct, 0));
}

/* ------------------------------------------------------------------ */
/*  Kitchen surface tiers                                               */
/* ------------------------------------------------------------------ */

export type KitchenLevel = 'Standard' | 'Mid' | 'Premium' | 'Luxury';

export interface KitchenSurfaceSet {
  countertops: SurfaceCostItem;
  cabinets: SurfaceCostItem;
  backsplash: SurfaceCostItem;
  appliances: SurfaceCostItem;
  flooring: SurfaceCostItem;
  lighting: SurfaceCostItem;
  plumbing: SurfaceCostItem; // sink + faucet + disposal
}

export const KITCHEN_SURFACES: Record<KitchenLevel, KitchenSurfaceSet> = {
  Standard: {
    countertops: { material: 'Laminate countertops',           cost: 3000,  laborPct: 0.40, trade: 'Countertop Installer' },
    cabinets:    { material: 'Stock RTA cabinets',             cost: 9000,  laborPct: 0.35, trade: 'Cabinetry' },
    backsplash:  { material: 'Peel-and-stick tile',            cost: 800,   laborPct: 0.30, trade: 'Tile' },
    appliances:  { material: 'Standard stainless package',     cost: 5000,  laborPct: 0.10, trade: 'Appliance Install' },
    flooring:    { material: 'Vinyl plank (LVP)',              cost: 2500,  laborPct: 0.50, trade: 'Flooring' },
    lighting:    { material: 'Flush-mount + under-cabinet',    cost: 1200,  laborPct: 0.50, trade: 'Electrical' },
    plumbing:    { material: 'Standard sink + faucet',         cost: 1500,  laborPct: 0.45, trade: 'Plumbing' },
  },
  Mid: {
    countertops: { material: 'Granite or quartz',              cost: 7000,  laborPct: 0.35, trade: 'Countertop Installer' },
    cabinets:    { material: 'Semi-custom shaker cabinets',    cost: 18000, laborPct: 0.35, trade: 'Cabinetry' },
    backsplash:  { material: 'Ceramic subway tile',            cost: 2500,  laborPct: 0.55, trade: 'Tile' },
    appliances:  { material: 'Mid-range stainless (Samsung/LG)', cost: 8000, laborPct: 0.10, trade: 'Appliance Install' },
    flooring:    { material: 'Engineered hardwood',            cost: 4500,  laborPct: 0.50, trade: 'Flooring' },
    lighting:    { material: 'Recessed + pendant island light', cost: 2500, laborPct: 0.50, trade: 'Electrical' },
    plumbing:    { material: 'Undermount sink + pull-down faucet', cost: 3000, laborPct: 0.40, trade: 'Plumbing' },
  },
  Premium: {
    countertops: { material: 'Premium quartz or natural stone', cost: 14000, laborPct: 0.30, trade: 'Countertop Installer' },
    cabinets:    { material: 'Custom wood cabinets',           cost: 35000, laborPct: 0.40, trade: 'Cabinetry' },
    backsplash:  { material: 'Marble or handmade tile',        cost: 5000,  laborPct: 0.50, trade: 'Tile' },
    appliances:  { material: 'Premium (KitchenAid / Bosch)',   cost: 15000, laborPct: 0.10, trade: 'Appliance Install' },
    flooring:    { material: 'Wide-plank hardwood',            cost: 7000,  laborPct: 0.50, trade: 'Flooring' },
    lighting:    { material: 'Layered designer lighting',      cost: 4500,  laborPct: 0.45, trade: 'Electrical' },
    plumbing:    { material: 'Farm sink + pro faucet + disposal', cost: 5500, laborPct: 0.35, trade: 'Plumbing' },
  },
  Luxury: {
    countertops: { material: 'Calacatta marble waterfall',     cost: 22000, laborPct: 0.30, trade: 'Countertop Installer' },
    cabinets:    { material: 'Bespoke inset cabinetry',        cost: 55000, laborPct: 0.45, trade: 'Cabinetry' },
    backsplash:  { material: 'Bookmatched marble slab',        cost: 8000,  laborPct: 0.45, trade: 'Tile / Stone' },
    appliances:  { material: 'Pro-grade (Wolf / Sub-Zero / Miele)', cost: 30000, laborPct: 0.10, trade: 'Appliance Install' },
    flooring:    { material: 'Reclaimed hardwood or large-format porcelain', cost: 10000, laborPct: 0.50, trade: 'Flooring' },
    lighting:    { material: 'Architect-spec layered lighting', cost: 7000,  laborPct: 0.45, trade: 'Electrical' },
    plumbing:    { material: 'Pot filler + integrated disposal + designer fixtures', cost: 8000, laborPct: 0.35, trade: 'Plumbing' },
  },
};

/** Kitchen surface cost total for a given level */
export function kitchenSurfaceTotal(level: KitchenLevel): number {
  return Object.values(KITCHEN_SURFACES[level]).reduce((sum, s) => sum + s.cost, 0);
}

/* ------------------------------------------------------------------ */
/*  New bathroom addition cost (full build from studs)                  */
/* ------------------------------------------------------------------ */

/**
 * Adding a brand-new bathroom involves more than just surfaces — framing,
 * plumbing rough-in, electrical, drywall, permits, etc.
 * These are the structural/infrastructure costs ON TOP of the finish surfaces.
 */
export const BATH_ADDITION_BASE: Record<BathType, number> = {
  master:        32000,  // Framing + plumbing + electrical + drywall + permits for large bath
  full:          22000,
  jack_and_jill: 26000,  // Slightly more plumbing for double-entry
  half:          14000,  // Smaller footprint, less plumbing
};

/**
 * ROI multiplier for new bathroom additions — ARV arbitrage model.
 * Based on build cost vs. market value per sqft.
 */
export const BATH_ADDITION_ROI = 1.57;

/**
 * ROI multiplier for bathroom renovations — Cost vs. Value data.
 * Industry benchmark for bathroom remodel.
 */
export const BATH_RENOVATION_ROI_BY_TIER: Record<BathQualityTier, number> = {
  standard: 0.72,
  premium: 0.82,
  luxury: 0.75,
};

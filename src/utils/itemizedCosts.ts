/**
 * Itemized cost builder — takes full wishlist selections and produces
 * per-room, per-surface, per-trade line items with material/labor split.
 *
 * Used by ItemizedBill, FeasibilityGrid, and Design Package pages so
 * every dollar is traceable.
 */

import type { RenovationLineItem, RenovationType } from '../config/renovationDefaults';
import { MASTER_ITEMS_BY_ID } from '../config/renovationDefaults';
import { COMPONENT_ESTIMATES as SHARED_COMPONENT_ESTIMATES } from '../config/componentEstimates';
import {
  type BathType,
  type BathQualityTier,
  type KitchenLevel,
  BATH_TYPE_LABELS,
  BATH_QUALITY_LABELS,
  BATH_SURFACES,
  BATH_ADDITION_BASE,
  BATH_ADDITION_ROI,
  BATH_RENOVATION_ROI_BY_TIER,
  HALF_BATH_MULTIPLIER,
  KITCHEN_SURFACES,
  kitchenSurfaceTotal,
  bathSurfaceTotal,
  type SurfaceCostItem,
} from '../config/surfaceCosts';

/* ------------------------------------------------------------------ */
/*  Extended line item with surface-level detail                        */
/* ------------------------------------------------------------------ */

export interface ItemizedLineItem extends RenovationLineItem {
  /** Parent room/area this line item belongs to (e.g. "Master Bath", "Kitchen") */
  room: string;
  /** Surface or trade sub-item (e.g. "Floor Tile", "Vanity") */
  surface?: string;
  /** Specific material name (e.g. "Porcelain tile (12×24)") */
  material?: string;
  /** Material cost portion */
  materialCost?: number;
  /** Labor cost portion */
  laborCost?: number;
  /** Trade category for contractor grouping */
  trade?: string;
  /** Whether this is a roll-up summary or a detail line */
  isDetail?: boolean;
  /** Group key for collapsible sections */
  groupKey?: string;
}

/* ------------------------------------------------------------------ */
/*  Room tile shape (matches PropertyWishlist's local type)             */
/* ------------------------------------------------------------------ */

interface RoomTile {
  id: string;
  status: 'add' | 'renovate' | 'leave';
  bathType?: BathType;
  qualityOverride?: BathQualityTier;
}

/* ------------------------------------------------------------------ */
/*  Selections input shape                                              */
/* ------------------------------------------------------------------ */

export interface ItemizedSelections {
  bedrooms?: number;
  bathrooms?: number;
  bedTiles?: RoomTile[];
  bathTiles?: RoomTile[];
  bathQuality?: BathQualityTier;
  kitchenLevel?: string;
  flooring?: string;
  pool?: string;
  homeStyle?: string;
  // Feature arrays
  roomFeatures?: string[];
  kitchenFeatures?: string[];
  bathroomFeatures?: string[];
  interiorDetails?: string[];
  exteriorDetails?: string[];
  outdoorFeatures?: string[];
  systemsDetails?: string[];
}

/* ------------------------------------------------------------------ */
/*  Helper: surface item → line item detail                             */
/* ------------------------------------------------------------------ */

function surfaceToLine(
  roomLabel: string,
  groupKey: string,
  surfaceLabel: string,
  item: SurfaceCostItem,
  cost: number,
  type: RenovationType,
  roiPct: number,
): ItemizedLineItem {
  const laborCost = Math.round(cost * item.laborPct);
  const materialCost = cost - laborCost;
  return {
    id: `${groupKey}-${surfaceLabel.toLowerCase().replace(/\s+/g, '-')}`,
    label: surfaceLabel,
    category: 'Bathrooms',
    type,
    cost,
    valueAdded: Math.round(cost * (roiPct / 100)),
    roiPct,
    room: roomLabel,
    surface: surfaceLabel,
    material: item.material,
    materialCost,
    laborCost,
    trade: item.trade,
    isDetail: true,
    groupKey,
  };
}

/* ------------------------------------------------------------------ */
/*  Build bathroom line items                                           */
/* ------------------------------------------------------------------ */

function buildBathItems(
  bathTiles: RoomTile[],
  globalQuality: BathQualityTier,
): ItemizedLineItem[] {
  const items: ItemizedLineItem[] = [];

  for (let i = 0; i < bathTiles.length; i++) {
    const tile = bathTiles[i];
    if (tile.status === 'leave') continue;

    const bt: BathType = tile.bathType ?? 'full';
    const quality: BathQualityTier = tile.qualityOverride ?? globalQuality;
    const typeLabel = BATH_TYPE_LABELS[bt];
    const qualityLabel = BATH_QUALITY_LABELS[quality];
    const roomLabel = `${typeLabel} Bath ${i + 1}`;
    const groupKey = `bath-${i}`;
    const isAddition = tile.status === 'add';
    const roiPct = isAddition
      ? Math.round(BATH_ADDITION_ROI * 100)
      : Math.round(BATH_RENOVATION_ROI_BY_TIER[quality] * 100);

    // If addition, add the structural/infrastructure base cost
    if (isAddition) {
      const baseCost = BATH_ADDITION_BASE[bt];
      items.push({
        id: `${groupKey}-structure`,
        label: `${roomLabel} — Structure & Infrastructure`,
        category: 'Bathrooms',
        type: 'addition',
        cost: baseCost,
        valueAdded: Math.round(baseCost * BATH_ADDITION_ROI),
        roiPct: Math.round(BATH_ADDITION_ROI * 100),
        room: roomLabel,
        surface: 'Structure',
        material: 'Framing, plumbing rough-in, electrical, drywall, permits',
        laborCost: Math.round(baseCost * 0.65),
        materialCost: Math.round(baseCost * 0.35),
        trade: 'General / Plumbing / Electrical',
        isDetail: true,
        groupKey,
        roiSource: 'Arcadia 85018 median $/sqft vs. local builder cost data',
      });
    }

    // Surface finish items
    const surfaces = BATH_SURFACES[quality];
    const isHalf = bt === 'half';
    const multiplier = isHalf ? HALF_BATH_MULTIPLIER : 1;
    const type: RenovationType = isAddition ? 'addition' : 'renovation';

    // Floor tile — all bath types
    const floorCost = Math.round(surfaces.floorTile.cost * multiplier);
    items.push(surfaceToLine(roomLabel, groupKey, 'Floor Tile', surfaces.floorTile, floorCost, type, roiPct));

    // Wall tile — NOT for half baths
    if (!isHalf) {
      items.push(surfaceToLine(roomLabel, groupKey, 'Wall Tile', surfaces.wallTile, surfaces.wallTile.cost, type, roiPct));
    }

    // Vanity
    const vanityCost = Math.round(surfaces.vanity.cost * multiplier);
    items.push(surfaceToLine(roomLabel, groupKey, 'Vanity', surfaces.vanity, vanityCost, type, roiPct));

    // Tub/Shower — NOT for half baths
    if (!isHalf) {
      items.push(surfaceToLine(roomLabel, groupKey, 'Tub / Shower', surfaces.tubShower, surfaces.tubShower.cost, type, roiPct));
    }

    // Fixtures
    const fixCost = Math.round(surfaces.fixtures.cost * multiplier);
    items.push(surfaceToLine(roomLabel, groupKey, 'Fixtures', surfaces.fixtures, fixCost, type, roiPct));

    // Lighting
    const lightCost = Math.round(surfaces.lighting.cost * multiplier);
    items.push(surfaceToLine(roomLabel, groupKey, 'Lighting', surfaces.lighting, lightCost, type, roiPct));

    // Roll-up summary line for this bathroom
    const bathTotal = bathSurfaceTotal(quality, bt) + (isAddition ? BATH_ADDITION_BASE[bt] : 0);
    items.push({
      id: `${groupKey}-total`,
      label: `${roomLabel} (${qualityLabel} ${isAddition ? 'Addition' : 'Renovation'})`,
      category: 'Bathrooms',
      type,
      cost: bathTotal,
      valueAdded: Math.round(bathTotal * (roiPct / 100)),
      roiPct,
      room: roomLabel,
      isDetail: false,
      groupKey,
      benefit: isAddition ? 'Better bed/bath ratio and daily comfort' : `${qualityLabel} finish upgrade`,
      roiSource: isAddition
        ? 'Arcadia 85018 median $/sqft vs. local builder cost data'
        : 'Remodeling Magazine 2024 Cost vs. Value Report',
    });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Build kitchen line items                                            */
/* ------------------------------------------------------------------ */

function buildKitchenItems(level: KitchenLevel): ItemizedLineItem[] {
  const surfaces = KITCHEN_SURFACES[level];
  const groupKey = 'kitchen';
  const roiMap: Record<string, number> = { Standard: 80, Mid: 85, Premium: 70, Luxury: 65 };
  const roiPct = roiMap[level] ?? 70;
  const items: ItemizedLineItem[] = [];

  const surfaceEntries: [string, SurfaceCostItem][] = [
    ['Countertops', surfaces.countertops],
    ['Cabinets', surfaces.cabinets],
    ['Backsplash', surfaces.backsplash],
    ['Appliances', surfaces.appliances],
    ['Flooring', surfaces.flooring],
    ['Lighting', surfaces.lighting],
    ['Plumbing (Sink & Faucet)', surfaces.plumbing],
  ];

  for (const [label, item] of surfaceEntries) {
    const laborCost = Math.round(item.cost * item.laborPct);
    const materialCost = item.cost - laborCost;
    items.push({
      id: `kitchen-${label.toLowerCase().replace(/[\s&()]+/g, '-')}`,
      label,
      category: 'Kitchen',
      type: 'renovation',
      cost: item.cost,
      valueAdded: Math.round(item.cost * (roiPct / 100)),
      roiPct,
      room: 'Kitchen',
      surface: label,
      material: item.material,
      materialCost,
      laborCost,
      trade: item.trade,
      isDetail: true,
      groupKey,
    });
  }

  // Roll-up
  const total = kitchenSurfaceTotal(level);
  items.push({
    id: 'kitchen-total',
    label: `Kitchen Renovation (${level})`,
    category: 'Kitchen',
    type: 'renovation',
    cost: total,
    valueAdded: Math.round(total * (roiPct / 100)),
    roiPct,
    room: 'Kitchen',
    isDetail: false,
    groupKey,
    benefit: 'Premium finishes that buyers pay for',
    roiSource: 'Remodeling Magazine 2024 Cost vs. Value Report — Pacific region',
  });

  return items;
}

/* ------------------------------------------------------------------ */
/*  Build bedroom line items (simple — no surface detail)               */
/* ------------------------------------------------------------------ */

function buildBedroomItems(bedTiles: RoomTile[]): ItemizedLineItem[] {
  const items: ItemizedLineItem[] = [];
  const masterSuite = MASTER_ITEMS_BY_ID['master-suite'];
  const bedBase = masterSuite?.cost ?? 165000;
  const bedPerUnit = 10000;
  const bedRoi = (masterSuite?.roiPct ?? 157) / 100;

  const addTiles = bedTiles.filter(t => t.status === 'add');
  const renoTiles = bedTiles.filter(t => t.status === 'renovate');

  if (addTiles.length > 0) {
    const firstAddCost = bedBase;
    const extraAddCost = (addTiles.length - 1) * bedPerUnit;
    const totalAddCost = firstAddCost + extraAddCost;
    items.push({
      id: 'bed-additions',
      label: `Bedroom Additions (${addTiles.length})`,
      category: 'Rooms',
      type: 'addition',
      cost: totalAddCost,
      valueAdded: Math.round(totalAddCost * bedRoi),
      roiPct: Math.round(bedRoi * 100),
      room: 'Bedrooms',
      isDetail: false,
      groupKey: 'bedrooms',
      benefit: 'More space and stronger comps',
      roiSource: 'Arcadia 85018 median $/sqft vs. local builder cost data',
    });
  }

  if (renoTiles.length > 0) {
    const renoPerBed = 8000;
    const totalRenoCost = renoTiles.length * renoPerBed;
    items.push({
      id: 'bed-renovations',
      label: `Bedroom Renovations (${renoTiles.length})`,
      category: 'Rooms',
      type: 'renovation',
      cost: totalRenoCost,
      valueAdded: Math.round(totalRenoCost * 0.9),
      roiPct: 90,
      room: 'Bedrooms',
      isDetail: false,
      groupKey: 'bedrooms',
      benefit: 'Updated finishes and comfort',
      roiSource: 'Remodeling Magazine 2024 Cost vs. Value Report',
    });
  }

  return items;
}

/* COMPONENT_ESTIMATES imported from shared config (componentEstimates.ts) */
const COMPONENT_ESTIMATES = SHARED_COMPONENT_ESTIMATES;

/* ------------------------------------------------------------------ */
/*  Build feature / detail line items                                   */
/* ------------------------------------------------------------------ */

function buildFeatureItems(selections: ItemizedSelections): ItemizedLineItem[] {
  const items: ItemizedLineItem[] = [];

  const featureGroups: { key: keyof ItemizedSelections; category: string; groupKey: string }[] = [
    { key: 'roomFeatures', category: 'Rooms', groupKey: 'room-features' },
    { key: 'kitchenFeatures', category: 'Kitchen', groupKey: 'kitchen-features' },
    { key: 'bathroomFeatures', category: 'Bathrooms', groupKey: 'bath-features' },
    { key: 'interiorDetails', category: 'Interior', groupKey: 'interior' },
    { key: 'exteriorDetails', category: 'Exterior', groupKey: 'exterior' },
    { key: 'outdoorFeatures', category: 'Outdoor', groupKey: 'outdoor' },
    { key: 'systemsDetails', category: 'Systems', groupKey: 'systems' },
  ];

  for (const { key, category, groupKey } of featureGroups) {
    const arr = (selections[key] as string[] | undefined) ?? [];
    for (const name of arr) {
      const est = COMPONENT_ESTIMATES[name];
      if (!est) continue;
      items.push({
        id: `${groupKey}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        label: name,
        category,
        type: 'renovation',
        cost: est.cost,
        valueAdded: Math.round(est.cost * est.roi),
        roiPct: Math.round(est.roi * 100),
        room: category,
        isDetail: false,
        groupKey,
      });
    }
  }

  // Flooring
  const flooring = selections.flooring ?? 'Hardwood';
  const floorEst = COMPONENT_ESTIMATES[flooring];
  if (floorEst && floorEst.cost > 0) {
    items.push({
      id: 'flooring-main',
      label: `Flooring — ${flooring}`,
      category: 'Interior',
      type: 'renovation',
      cost: floorEst.cost,
      valueAdded: Math.round(floorEst.cost * floorEst.roi),
      roiPct: Math.round(floorEst.roi * 100),
      room: 'Flooring',
      isDetail: false,
      groupKey: 'flooring',
      roiSource: 'Remodeling Magazine 2024 Cost vs. Value Report — Pacific region',
    });
  }

  // Pool
  const pool = selections.pool ?? 'None';
  const poolEst = COMPONENT_ESTIMATES[pool];
  if (poolEst && poolEst.cost > 0) {
    items.push({
      id: 'pool-main',
      label: `Pool — ${pool}`,
      category: 'Outdoor',
      type: 'renovation',
      cost: poolEst.cost,
      valueAdded: Math.round(poolEst.cost * poolEst.roi),
      roiPct: Math.round(poolEst.roi * 100),
      room: 'Pool & Outdoor',
      isDetail: false,
      groupKey: 'pool',
      roiSource: 'National Association of Realtors pool ROI data — Sun Belt adjusted',
    });
  }

  // Home style
  const style = selections.homeStyle ?? 'Modern';
  const styleEst = COMPONENT_ESTIMATES[style];
  if (styleEst && styleEst.cost > 0) {
    items.push({
      id: 'style-main',
      label: `Home Style — ${style}`,
      category: 'Exterior',
      type: 'renovation',
      cost: styleEst.cost,
      valueAdded: Math.round(styleEst.cost * styleEst.roi),
      roiPct: Math.round(styleEst.roi * 100),
      room: 'Style',
      isDetail: false,
      groupKey: 'style',
    });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Main export: build full itemized breakdown                          */
/* ------------------------------------------------------------------ */

export interface ItemizedResult {
  /** All line items — detail and summary rows */
  allItems: ItemizedLineItem[];
  /** Summary-only rows (isDetail === false) — for high-level table */
  summaryItems: ItemizedLineItem[];
  /** Detail rows grouped by groupKey */
  detailsByGroup: Record<string, ItemizedLineItem[]>;
  /** Grand totals */
  totalCost: number;
  totalValue: number;
  netTotal: number;
  /** Trade-level rollup: trade → { materialCost, laborCost, totalCost } */
  tradeRollup: Record<string, { materialCost: number; laborCost: number; totalCost: number }>;
}

export function buildItemizedCosts(selections: ItemizedSelections): ItemizedResult {
  const bedTiles: RoomTile[] = selections.bedTiles ?? [];
  const bathTiles: RoomTile[] = selections.bathTiles ?? [];
  const globalBathQuality: BathQualityTier = selections.bathQuality ?? 'premium';
  const kitchenLevel = (selections.kitchenLevel ?? 'Premium') as KitchenLevel;

  const bedItems = buildBedroomItems(bedTiles);
  const bathItems = buildBathItems(bathTiles, globalBathQuality);
  const kitchenItems = buildKitchenItems(kitchenLevel);
  const featureItems = buildFeatureItems(selections);

  const allItems = [...bedItems, ...bathItems, ...kitchenItems, ...featureItems];
  const summaryItems = allItems.filter(i => !i.isDetail);
  const detailsByGroup: Record<string, ItemizedLineItem[]> = {};

  for (const item of allItems) {
    if (item.isDetail && item.groupKey) {
      if (!detailsByGroup[item.groupKey]) detailsByGroup[item.groupKey] = [];
      detailsByGroup[item.groupKey].push(item);
    }
  }

  // Use summary items for totals (avoid double-counting detail + summary)
  const totalCost = summaryItems.reduce((s, i) => s + i.cost, 0);
  const totalValue = summaryItems.reduce((s, i) => s + i.valueAdded, 0);

  // Trade rollup from detail items only
  const tradeRollup: Record<string, { materialCost: number; laborCost: number; totalCost: number }> = {};
  for (const item of allItems.filter(i => i.isDetail)) {
    const trade = item.trade ?? 'General';
    if (!tradeRollup[trade]) tradeRollup[trade] = { materialCost: 0, laborCost: 0, totalCost: 0 };
    tradeRollup[trade].materialCost += item.materialCost ?? 0;
    tradeRollup[trade].laborCost += item.laborCost ?? 0;
    tradeRollup[trade].totalCost += item.cost;
  }

  return {
    allItems,
    summaryItems,
    detailsByGroup,
    totalCost,
    totalValue,
    netTotal: totalValue - totalCost,
    tradeRollup,
  };
}

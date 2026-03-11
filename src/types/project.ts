/**
 * Single source of truth for the homeowner's dream home project.
 * Used by CAD designers, contractors, and lender partners.
 * All fields are populated from the app's input flows for defensibility.
 */

export type RoomStatus = 'add' | 'renovate' | 'leave';

export interface RoomTile {
  id: string;
  status: RoomStatus;
}

/** Homeowner & contact — for contracts and partner handoff */
export interface ProjectHomeowner {
  firstName: string;
  email?: string;
  phone?: string;
}

/** Current property facts (from API or user edits) — for CAD and SOW */
export interface ProjectProperty {
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  pool: boolean;
  homeType?: string;
  currentValue?: number;
  equity?: number;
}

/** Onboarding choices — goals and budget intent */
export interface ProjectOnboarding {
  goal: string;
  timeline: string;
  income: number;
  mortgageRate: number;
  /** Estimated renovation budget from landing hero (optional) */
  estimatedRenovationBudget?: number;
  /** Occupancy: for lender (primary = owner-occupied, affects approval) */
  occupancy?: 'primary' | 'secondary' | 'investment';
}

/** Homeowner notes for contractor/architect — special instructions, constraints */
export interface ProjectNotes {
  /** Free-text notes (e.g. "Preserve oak tree", "ADA considerations", "Must complete by June") */
  specialInstructions?: string;
}

/** Wishlist selections — full scope for contractor/CAD */
export interface ProjectWishlist {
  bedrooms: number;
  bathrooms: number;
  bedTiles: RoomTile[];
  bathTiles: RoomTile[];
  bathroomRenoScope: 'full' | 'floors_fixtures' | 'cosmetic';
  kitchenLevel: string;
  flooring: string;
  pool: string;
  interiorFeatures: string;
  exteriorFeatures: string;
  systemsUpgrade: string;
  yardSize: string;
  homeStyle: string;
  /** Optional: room feature checkboxes (Walk-in Closet, etc.) */
  roomFeatures?: string[];
  /** Optional: kitchen appliances/features */
  kitchenFeatures?: string[];
  /** Optional: bathroom fixtures/features */
  bathroomFeatures?: string[];
  /** Optional: interior detail checkboxes (Crown Molding, Fireplace, etc.) */
  interiorDetails?: string[];
  /** Optional: exterior materials, windows */
  exteriorDetails?: string[];
  /** Optional: outdoor/yard features */
  outdoorFeatures?: string[];
  /** Optional: HVAC, electrical, plumbing toggles */
  systemsDetails?: string[];
}

/** Financial summary — for lender and feasibility */
export interface ProjectFinancial {
  totalCost: number;
  totalValue: number;
  monthlyIncome: number;
  monthlyDebts: number;
  targetBudget?: number;
  /** Line item ids that are enabled (if using line-item model) */
  enabledLineItemIds?: string[];
  /** Current monthly mortgage payment (P&I only) — used to derive existing balance for accurate "savings vs. comparable" */
  currentMonthlyPayment?: number;
  /** Optional down payment at purchase (for context/display) */
  downPaymentAtPurchase?: number;
  /** Existing mortgage balance (for lender DTI / eligibility) — optional; overrides balance derived from current payment when set */
  existingMortgageBalance?: number;
  /** Extra $/month user is willing to consider (Analysis slider) — restores when they return */
  paymentSlider?: number;
}

/** Contractor sign-off (filled on Contractor Review) */
export interface ProjectContractor {
  contractorName: string;
  companyName: string;
  licenseNumber: string;
  bidAmount: string;
  estimatedWeeks: string;
  agreedAt?: string; // ISO timestamp
}

/** Metadata for defensibility — timestamps and version */
export interface ProjectMeta {
  projectId: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  version: number;
}

export interface Project {
  meta: ProjectMeta;
  homeowner: ProjectHomeowner;
  property: ProjectProperty;
  onboarding: ProjectOnboarding;
  wishlist: ProjectWishlist;
  financial: ProjectFinancial;
  /** Homeowner notes for contractor/architect (special instructions) */
  notes?: ProjectNotes;
  contractor?: ProjectContractor;
}

const STORAGE_KEY = 'expand_ease_project';

function genId(): string {
  return 'EXP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function now(): string {
  return new Date().toISOString();
}

function defaultWishlist(): ProjectWishlist {
  return {
    bedrooms: 4,
    bathrooms: 4,
    bedTiles: [],
    bathTiles: [],
    bathroomRenoScope: 'full',
    kitchenLevel: 'Premium',
    flooring: 'Hardwood',
    pool: 'None',
    interiorFeatures: 'Custom',
    exteriorFeatures: 'Standard',
    systemsUpgrade: 'Standard',
    yardSize: 'Medium',
    homeStyle: 'Modern',
  };
}

function defaultProperty(): ProjectProperty {
  return {
    address: '',
    beds: 0,
    baths: 0,
    sqft: 0,
    yearBuilt: 0,
    pool: false,
    homeType: 'Single Family',
  };
}

export function createEmptyProject(overrides?: Partial<Project>): Project {
  const id = genId();
  const t = now();
  return {
    meta: {
      projectId: id,
      createdAt: t,
      updatedAt: t,
      version: 1,
    },
    homeowner: { firstName: '' },
    property: defaultProperty(),
    onboarding: {
      goal: '',
      timeline: '',
      income: 150000,
      mortgageRate: 3.5,
    },
    wishlist: defaultWishlist(),
    financial: {
      totalCost: 0,
      totalValue: 0,
      monthlyIncome: 0,
      monthlyDebts: 0,
    },
    ...overrides,
  };
}

export function loadProjectFromStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Project;
    if (parsed?.meta?.projectId) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function saveProjectToStorage(project: Project): void {
  const next = {
    ...project,
    meta: {
      ...project.meta,
      updatedAt: now(),
      version: (project.meta?.version ?? 1) + 1,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getProjectStorageKey(): string {
  return STORAGE_KEY;
}

/**
 * ContractorReview — The most detailed homeowner-generated SOW a contractor will ever see.
 *
 * Philosophy: Contractors will say "you can't know all the variables." Our job is to arrive
 * with 100x more specification than they expect — every sub-component, every material spec,
 * every system requirement — drawn directly from the homeowner's verified selections.
 * This is defensible, lender-ready, and change-order resistant.
 */
import React, { useState, useMemo, useEffect, useReducer, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProjectOptional } from '../context/ProjectContext';
import type { Project, MaterialDetail, AuditEntry, ContractorEdits } from '../types/project';
import {
  FileSignature,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
  CalendarDays,
  HardHat,
  Zap,
  Droplets,
  Wind,
  Layers,
  Home,
  TreePine,
  ChevronDown,
  ChevronRight,
  Info,
  Wrench,
  Hammer,
  Palette,
  Package,
  Pencil,
  Stamp,
  ClipboardCheck,
  Building2,
  Sparkles,
  Camera,
  FileCheck,
  Award,
  Eye,
  Send,
  LayoutList,
  RotateCcw,
  TrendingUp,
  Clock,
  History,
  ArrowRight,
} from 'lucide-react';
import { TableOfContents } from '../components/ui/TableOfContents';
import type { TocItem } from '../components/ui/TableOfContents';

const PORTAL_TOC: TocItem[] = [
  { id: 'portal-permits', label: 'Permitting Status' },
  { id: 'portal-scope', label: 'Scope of Work' },
  { id: 'portal-signoff', label: 'Contractor Sign-off' },
  { id: 'portal-gantt', label: 'Construction Schedule' },
  { id: 'portal-stamping', label: 'Permitting Workflow' },
];

// ─────────────────────────────────────────────
//  Contractor Edits Reducer
// ─────────────────────────────────────────────

interface EditState {
  tradeOverrides: Record<string, { proposedBudget: number; duration: number }>;
  auditTrail: AuditEntry[];
  nextSeq: number;
}

type EditAction =
  | { type: 'EDIT_TRADE_BUDGET'; tradeId: string; tradeName: string; oldBudget: number; newBudget: number }
  | { type: 'EDIT_TRADE_DURATION'; tradeId: string; tradeName: string; oldDuration: number; newDuration: number }
  | { type: 'EDIT_ASSUMPTION'; field: string; oldValue: number; newValue: number; label: string }
  | { type: 'RESET_ALL'; originalBudgets: Record<string, number>; originalDurations: Record<string, number> };

function fmtDelta(val: number, prefix: string, suffix: string): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${prefix}${Math.round(val).toLocaleString()}${suffix}`;
}

function editReducer(state: EditState, action: EditAction): EditState {
  const ts = new Date().toISOString();

  switch (action.type) {
    case 'EDIT_TRADE_BUDGET': {
      const entry: AuditEntry = {
        seq: state.nextSeq,
        timestamp: ts,
        field: `${action.tradeName} — Budget`,
        oldValue: `$${Math.round(action.oldBudget).toLocaleString()}`,
        newValue: `$${Math.round(action.newBudget).toLocaleString()}`,
        delta: fmtDelta(action.newBudget - action.oldBudget, '$', ''),
      };
      const existing = state.tradeOverrides[action.tradeId] ?? { proposedBudget: action.oldBudget, duration: 0 };
      return {
        ...state,
        tradeOverrides: {
          ...state.tradeOverrides,
          [action.tradeId]: { ...existing, proposedBudget: action.newBudget },
        },
        auditTrail: [entry, ...state.auditTrail],
        nextSeq: state.nextSeq + 1,
      };
    }

    case 'EDIT_TRADE_DURATION': {
      const entry: AuditEntry = {
        seq: state.nextSeq,
        timestamp: ts,
        field: `${action.tradeName} — Phase Duration`,
        oldValue: `${action.oldDuration} weeks`,
        newValue: `${action.newDuration} weeks`,
        delta: fmtDelta(action.newDuration - action.oldDuration, '', ' wks'),
      };
      const existing = state.tradeOverrides[action.tradeId] ?? { proposedBudget: 0, duration: action.oldDuration };
      return {
        ...state,
        tradeOverrides: {
          ...state.tradeOverrides,
          [action.tradeId]: { ...existing, duration: action.newDuration },
        },
        auditTrail: [entry, ...state.auditTrail],
        nextSeq: state.nextSeq + 1,
      };
    }

    case 'EDIT_ASSUMPTION': {
      const isPrice = action.field === 'totalCost';
      const entry: AuditEntry = {
        seq: state.nextSeq,
        timestamp: ts,
        field: `Project — ${action.label}`,
        oldValue: isPrice ? `$${Math.round(action.oldValue).toLocaleString()}` : `${action.oldValue}`,
        newValue: isPrice ? `$${Math.round(action.newValue).toLocaleString()}` : `${action.newValue}`,
        delta: isPrice ? fmtDelta(action.newValue - action.oldValue, '$', '') : fmtDelta(action.newValue - action.oldValue, '', action.field === 'timelineWeeks' ? ' wks' : action.field === 'contingencyPct' ? '%' : ' sqft'),
      };
      return {
        ...state,
        auditTrail: [entry, ...state.auditTrail],
        nextSeq: state.nextSeq + 1,
      };
    }

    case 'RESET_ALL': {
      const entry: AuditEntry = {
        seq: state.nextSeq,
        timestamp: ts,
        field: 'ALL CHANGES',
        oldValue: `${state.auditTrail.length} edits`,
        newValue: 'Original values',
        delta: 'Reset',
      };
      return {
        tradeOverrides: {},
        auditTrail: [entry, ...state.auditTrail],
        nextSeq: state.nextSeq + 1,
      };
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface TradeLineItem {
  label: string;
  detail?: string;
  spec?: string;    // e.g. "200-amp, Square D Homeline"
  unit?: string;    // e.g. "LF", "SF", "EA"
}

interface Trade {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  items: TradeLineItem[];
  budgetPercent: number; // % of total construction cost
  sqftBased?: boolean; // true for trades that are naturally priced per sqft
  notes?: string;
}

interface FinishRow {
  surface: string;
  spec: string;
  color: string;
  budget: string;
  source: 'aria' | 'homeowner' | 'standard';
}

// ─────────────────────────────────────────────
//  Gantt types & builder
// ─────────────────────────────────────────────

interface GanttTrack {
  id: string;
  name: string;
  hex: string;
  start: number; // 1-indexed week
  end: number;
}

interface GanttMilestone {
  week: number;
  label: string;
  shortLabel: string;
  paymentPct: number | null;
  desc: string;
  gates: string[];
}

function buildGanttData(totalWeeks: number) {
  // Scale a baseline-24-week slot to the actual timeline
  const s = (n: number) => Math.max(1, Math.min(totalWeeks, Math.round((n / 24) * totalWeeks)));

  const tracks: GanttTrack[] = [
    { id: 'gc',      name: 'GC & Permitting',      hex: '#64748b', start: 1,         end: s(4)        },
    { id: 'demo',    name: 'Demo & Site Prep',      hex: '#f97316', start: s(2),      end: s(3)        },
    { id: 'fdn',     name: 'Foundation',            hex: '#92400e', start: s(3),      end: s(5)        },
    { id: 'frame',   name: 'Structural & Framing',  hex: '#d97706', start: s(5) + 1,  end: s(9)        },
    { id: 'roof',    name: 'Roofing',               hex: '#dc2626', start: s(8),      end: s(10)       },
    { id: 'windows', name: 'Windows & Ext. Doors',  hex: '#0369a1', start: s(9),      end: s(11)       },
    { id: 'elec_r',  name: 'Electrical Rough',      hex: '#ca8a04', start: s(9) + 1,  end: s(13)       },
    { id: 'plumb_r', name: 'Plumbing Rough',        hex: '#1d4ed8', start: s(9) + 1,  end: s(13)       },
    { id: 'hvac_r',  name: 'HVAC Rough',            hex: '#0e7490', start: s(9) + 1,  end: s(14)       },
    { id: 'insul',   name: 'Insulation & Air Seal', hex: '#15803d', start: s(12),     end: s(14)       },
    { id: 'ext_fin', name: 'Exterior Finishes',     hex: '#059669', start: s(11),     end: s(16)       },
    { id: 'drywall', name: 'Drywall & Plaster',     hex: '#6b7280', start: s(14) + 1, end: s(16)       },
    { id: 'paint',   name: 'Painting',              hex: '#7c3aed', start: s(16) + 1, end: s(18)       },
    { id: 'cabs',    name: 'Kitchen & Cabinets',    hex: '#9333ea', start: s(16) + 1, end: s(19)       },
    { id: 'tile',    name: 'Tile Work',             hex: '#be185d', start: s(17),     end: s(20)       },
    { id: 'floor',   name: 'Flooring',              hex: '#a21caf', start: s(18),     end: s(21)       },
    { id: 'trim',    name: 'Trim & Millwork',       hex: '#6d28d9', start: s(20),     end: s(22)       },
    { id: 'mep_t',   name: 'MEP Trim-out',          hex: '#1e40af', start: s(20),     end: s(22)       },
    { id: 'ctops',   name: 'Countertops',           hex: '#0f766e', start: s(19),     end: s(21)       },
    { id: 'fix',     name: 'Fixtures & Appliances', hex: '#0891b2', start: s(21),     end: s(23)       },
    { id: 'punch',   name: 'Punch-list & Final CO', hex: '#334155', start: s(22),     end: totalWeeks  },
  ];

  const milestones: GanttMilestone[] = [
    {
      week: 1, shortLabel: 'NTP', paymentPct: 10,
      label: 'Notice to Proceed',
      desc: 'Permits applied; site mobilized; 10% deposit released from escrow',
      gates: ['demo', 'fdn'],
    },
    {
      week: s(5), shortLabel: 'FDN', paymentPct: null,
      label: 'Foundation Inspection',
      desc: 'AHJ inspector sign-off on footings and slab — framing cannot start without this',
      gates: ['frame'],
    },
    {
      week: s(9), shortLabel: 'FRM', paymentPct: 25,
      label: 'Framing Inspection',
      desc: 'Wet-stamped framing approved by inspector; sheathing inspected before MEP begins',
      gates: ['elec_r', 'plumb_r', 'hvac_r', 'roof', 'windows'],
    },
    {
      week: s(13), shortLabel: 'MEP', paymentPct: 25,
      label: 'MEP Rough Approved',
      desc: 'All rough electrical, plumbing, and HVAC rough-in inspected and approved for close-up',
      gates: ['insul', 'drywall'],
    },
    {
      week: s(16), shortLabel: 'DRY', paymentPct: 20,
      label: 'Drywall & Exterior Complete',
      desc: 'Drywall finished Level 4/5; exterior siding and waterproofing done; finish trades can begin',
      gates: ['paint', 'cabs', 'tile', 'floor', 'trim'],
    },
    {
      week: s(23), shortLabel: 'PRE', paymentPct: 15,
      label: 'Pre-Final Inspection',
      desc: 'All finishes complete; punch list issued to GC; pre-CO inspection passed',
      gates: ['punch'],
    },
    {
      week: totalWeeks, shortLabel: 'CO', paymentPct: 5,
      label: 'Certificate of Occupancy',
      desc: 'CO issued by AHJ; final walkthrough signed by homeowner; final payment released',
      gates: [],
    },
  ];

  return { tracks, milestones };
}

// ─────────────────────────────────────────────
//  Trade builder — derives specifics from wishlist
// ─────────────────────────────────────────────

function buildTrades(project: Project | undefined): Trade[] {
  const w = project?.wishlist;
  const prop = project?.property;
  const bedDelta = Math.max(0, (w?.bedrooms ?? 0) - (prop?.beds ?? 0));
  const bathDelta = Math.max(0, (w?.bathrooms ?? 0) - (prop?.baths ?? 0));
  const sqftAdd = bedDelta * 250 + bathDelta * 100;
  const kitFeats = w?.kitchenFeatures ?? [];
  const bathFeats = w?.bathroomFeatures ?? [];
  const roomFeats = w?.roomFeatures ?? [];
  const intFeats = w?.interiorDetails ?? [];
  const extFeats = w?.exteriorDetails ?? [];
  const outdoorFeats = w?.outdoorFeatures ?? [];
  const sysFeats = w?.systemsDetails ?? [];

  const trades: Trade[] = [];

  // 1. General Contracting & Permitting
  trades.push({
    id: 'gc',
    name: 'General Contracting & Permitting',
    icon: HardHat,
    color: 'text-slate-600',
    budgetPercent: 7,
    items: [
      { label: 'Building permit — residential addition', spec: 'Including structural, MEP, energy compliance' },
      { label: 'Temporary power & site protection', detail: 'Construction fencing, dust barriers, daily cleanup' },
      { label: 'Structural engineering review & wet-stamped plans' },
      { label: 'Project management & superintendent on-site', detail: '5 days/week throughout construction' },
      { label: 'Debris removal & haul-off', spec: '(3) 30-yard dumpsters estimated' },
      { label: 'Final inspections & Certificate of Occupancy' },
      { label: 'Utility coordination (gas, water, electric)' },
    ],
    notes: 'All subcontractors must carry minimum $1M GL + workers comp. Licenses verified by ExpandEase.',
  });

  // 2. Demo & Site Prep
  const demoItems: TradeLineItem[] = [
    { label: 'Selective interior demolition per expansion layout' },
    { label: 'Bearing wall removal with temporary shoring', spec: 'Engineer-specified LVL beam installation' },
  ];
  if (bedDelta > 0 || sqftAdd > 0) {
    demoItems.push({ label: `Concrete footings / slab prep for ${sqftAdd} sq ft addition`, spec: '12" wide × 18" deep perimeter footings, min 3,000 PSI concrete' });
  }
  if (w?.pool && w.pool !== 'None') {
    demoItems.push({ label: 'Pool excavation & shell prep', spec: 'Per pool contractor SOW' });
  }
  trades.push({
    id: 'demo',
    name: 'Demolition & Site Preparation',
    icon: Hammer,
    color: 'text-orange-600',
    budgetPercent: 4,
    sqftBased: true,
    items: demoItems,
  });

  // 3. Structural / Framing
  const framingItems: TradeLineItem[] = [
    { label: `Addition framing — ${sqftAdd > 0 ? sqftAdd : 'N/A'} sq ft new construction`, spec: '2×6 exterior walls, 16" O.C.; engineered lumber throughout' },
    { label: 'LVL ridge beams and headers', spec: 'Per structural engineer specifications' },
    { label: 'Floor system — TJI joists or equivalent', unit: 'SF', spec: '11-7/8" TJI @ 16" O.C.' },
    { label: 'Interior framing — new partition walls', detail: '2×4 walls, 16" O.C., fire blocking at mid-height' },
    { label: 'Sheathing — exterior walls + roof deck', spec: '7/16" OSB wall sheathing; 5/8" CDX roof deck' },
    { label: 'Roof framing tie-in to existing structure', detail: 'Valley rafter, ridge extension, hip framing' },
  ];
  if (roomFeats.includes('Vaulted Ceiling')) {
    framingItems.push({ label: 'Vaulted ceiling framing', spec: 'Cathedral rafters per architectural plans, ridge beam required' });
  }
  if (roomFeats.includes('Balcony Access') || w?.outdoorFeatures?.includes('Covered Patio')) {
    framingItems.push({ label: 'Deck / balcony framing', spec: 'PT lumber, LedgerLOK fasteners, stainless hardware' });
  }
  trades.push({
    id: 'framing',
    name: 'Structural & Framing',
    icon: Layers,
    color: 'text-yellow-700',
    budgetPercent: 11,
    sqftBased: true,
    items: framingItems,
    notes: 'Framing inspection required before sheathing. Wet-stamped drawings on-site.',
  });

  // 4. Roofing
  trades.push({
    id: 'roofing',
    name: 'Roofing',
    icon: Home,
    color: 'text-red-600',
    budgetPercent: 5,
    items: [
      { label: 'Roof tie-in — addition ridge to existing', spec: 'Self-adhered underlayment, Ice & Water Shield at eaves and valleys' },
      { label: 'Roofing material — match existing', spec: extFeats.includes('New Roof') ? '30-year architectural shingles, full tear-off and re-roof' : 'Dimensional shingles to match existing color/profile' },
      { label: 'Flashing — valleys, chimney, kickout', spec: 'Pre-bent aluminum; step flashing at all wall tie-ins' },
      { label: 'Soffit, fascia, and gutters', spec: extFeats.includes('Gutters') ? '6" K-style aluminum gutters, 3×4 downspouts, underground drainage' : 'Match existing profile and color' },
      ...(extFeats.includes('New Roof') ? [{ label: 'Full home re-roof included per homeowner selection', spec: 'Owens Corning Duration series or equivalent, 130-mph wind rated' }] : []),
    ],
  });

  // 5. Windows & Exterior Doors
  const winItems: TradeLineItem[] = [
    { label: 'New windows — addition', spec: 'Andersen 400-series or equivalent, Low-E glass, U-0.30 min, ENERGY STAR certified', unit: 'EA' },
    { label: 'Window installation — flashing, trim, interior casing' },
  ];
  if (extFeats.includes('New Windows')) winItems.push({ label: 'Full home window replacement', spec: 'Per homeowner selection — all existing windows replaced with ENERGY STAR units' });
  if (extFeats.includes('New Garage Door')) winItems.push({ label: 'Garage door(s) — new', spec: '8-foot raised-panel, insulated steel, Wi-Fi opener, safety sensors' });
  if (extFeats.includes('Front Door')) winItems.push({ label: 'Front entry door replacement', spec: 'Fiberglass or steel insulated, multipoint lock, sidelights if applicable' });
  trades.push({
    id: 'windows',
    name: 'Windows & Exterior Doors',
    icon: Home,
    color: 'text-sky-600',
    budgetPercent: 6,
    items: winItems,
  });

  // 6. Electrical
  const elecItems: TradeLineItem[] = [
    { label: 'Main panel upgrade — 200A minimum', spec: 'Square D Homeline 200A, main breaker, surge protection device' },
    { label: 'Rough-in wiring — all new spaces', spec: '14/2 and 12/2 Romex per code; AFCI breakers in bedrooms; GFCI in wet areas' },
    { label: 'Recessed LED lighting throughout addition', spec: '4" wafer LED, 3000K, dimmable; quantity per room plan', unit: 'EA' },
    { label: 'Dedicated circuits — kitchen appliances', spec: 'Refrigerator, dishwasher, microwave, range (50A 240V), disposal — each dedicated circuit' },
    { label: 'USB-A/C combo outlets — all bedrooms and kitchen', unit: 'EA' },
    { label: 'Smoke & CO detector interconnected system', spec: 'Per IRC R314 — hardwired with battery backup' },
    { label: 'Exterior lighting — weatherproof fixtures, GFI protected' },
    { label: 'Low-voltage rough-in — structured media panel', spec: 'CAT6 to all bedrooms, living areas, and home office; coax to TV locations' },
  ];
  if (sysFeats.includes('Solar')) elecItems.push({ label: 'Solar-ready conduit and sub-panel rough-in', spec: '40A dedicated circuit, roof penetration sleeve, attic conduit run to main panel' });
  if (outdoorFeats.includes('Outdoor Kitchen') || sysFeats.includes('Solar')) elecItems.push({ label: 'EV charger rough-in', spec: '50A 240V circuit, NEMA 14-50 outlet in garage' });
  if (bathFeats.includes('Heated Floors')) elecItems.push({ label: 'In-floor electric heat rough-in — master bath', spec: 'Nuheat or Warmup system, dedicated 20A 240V circuit, programmable thermostat' });
  if (intFeats.includes('Home Office')) elecItems.push({ label: 'Home office — dedicated 20A circuit, Cat6 ×2, USB outlets, dedicated lighting circuit' });
  if (bathFeats.includes('Steam Shower')) elecItems.push({ label: 'Steam shower generator — electrical', spec: 'Dedicated 240V circuit, GFCI, generator within 25\' of shower' });
  trades.push({
    id: 'electrical',
    name: 'Electrical',
    icon: Zap,
    color: 'text-yellow-500',
    budgetPercent: 8,
    items: elecItems,
    notes: 'All work inspected by licensed electrician; permits pulled separately from GC package.',
  });

  // 7. Plumbing
  const plumItems: TradeLineItem[] = [
    { label: 'New fixture rough-ins — all bathrooms added', spec: 'PEX-A supply lines (uponor/wirsbo); ABS drain lines, properly vented per UPC' },
    { label: 'Kitchen plumbing rough-in', spec: 'Dual sink, dishwasher, ice maker, pot filler (if applicable), gas stub-out for range' },
  ];
  if (kitFeats.includes('Pot Filler')) plumItems.push({ label: 'Pot filler rough-in and trim-out', spec: '1/2" supply line, articulating arm, wall-mounted above range' });
  if (kitFeats.includes('Farm Sink')) plumItems.push({ label: 'Farm sink installation', spec: 'Apron-front cutout, drain assembly, garbage disposal rough-in and trim-out' });
  if (bathFeats.includes('Walk-in Shower') || bathFeats.includes('Steam Shower')) plumItems.push({ label: 'Shower valve rough-in and trim', spec: 'Pressure-balanced shower valve; thermostatic valve for steam; linear drain option' });
  if (bathFeats.includes('Vessel Sinks')) plumItems.push({ label: 'Vessel sink supply and drain', spec: '8" widespread faucet rough-in, pop-up drain assembly' });
  if (sysFeats.includes('Repipe')) plumItems.push({ label: 'Whole-home repipe', spec: 'Uponor PEX-A throughout; replace all galvanized / polybutylene supply lines; pressure test' });
  if (sysFeats.includes('Tankless') || sysFeats.includes('Water Heater')) {
    const whSpec = sysFeats.includes('Tankless')
      ? 'Navien NPE-180A or equivalent tankless — 4.5 GPM, recirculation pump, dedicated gas line'
      : '50-gallon power vent water heater, PRV, expansion tank';
    plumItems.push({ label: 'Water heater replacement', spec: whSpec });
  }
  if (outdoorFeats.includes('Outdoor Kitchen')) plumItems.push({ label: 'Outdoor kitchen plumbing rough-in', spec: 'Cold water supply, drain, gas stub-out' });
  if (outdoorFeats.includes('Sprinkler System')) plumItems.push({ label: 'Irrigation system — backflow preventer, main supply', spec: 'Rainbird or Hunter zone valves, connection to existing water meter' });
  if (kitFeats.includes('Wine Cooler')) plumItems.push({ label: 'Wine cooler / beverage center drain line' });
  trades.push({
    id: 'plumbing',
    name: 'Plumbing',
    icon: Droplets,
    color: 'text-blue-500',
    budgetPercent: 7,
    items: plumItems,
    notes: 'Pressure test at 100 PSI for 15 minutes required before drywall close-up.',
  });

  // 8. HVAC
  const hvacItems: TradeLineItem[] = [
    { label: 'HVAC design — Manual J load calculation for addition', spec: 'ACCA Manual J/S/D compliant; zoned per addition sq footage' },
    { label: 'New zone(s) for addition', spec: sqftAdd > 400 ? 'Dedicated air handler or variable-speed zone damper system' : 'Zone damper extension of existing system' },
    { label: 'Supply and return ductwork — addition', spec: 'Insulated flex duct (R-8) and sheet metal trunk lines; mastic-sealed joints' },
    { label: 'Ceiling registers — addition', spec: 'White steel registers, manually adjustable dampers', unit: 'EA' },
    { label: 'Return air grille sized per Manual D' },
    { label: 'Thermostat — smart programmable', spec: 'Ecobee or Nest per zone' },
  ];
  if (sqftAdd > 800) hvacItems.push({ label: 'New condenser unit — addition or replacement', spec: '3-5 ton unit, 16+ SEER, dual-speed compressor, refrigerant per local code' });
  trades.push({
    id: 'hvac',
    name: 'HVAC',
    icon: Wind,
    color: 'text-cyan-600',
    budgetPercent: 6,
    items: hvacItems,
    notes: 'HVAC inspection required at rough-in and final. Test and balance report on delivery.',
  });

  // 9. Insulation
  trades.push({
    id: 'insulation',
    name: 'Insulation & Air Sealing',
    icon: Package,
    color: 'text-green-600',
    budgetPercent: 3,
    sqftBased: true,
    items: [
      { label: 'Exterior wall insulation — addition', spec: '2×6 walls: R-21 unfaced batt + continuous R-5 foam sheathing' },
      { label: 'Ceiling / attic insulation', spec: 'R-49 blown-in fiberglass or spray foam per energy compliance path' },
      { label: 'Rim joist and band board spray foam', spec: '2" closed-cell SPF — R-12 minimum' },
      { label: 'Air sealing — top plates, penetrations, electrical boxes', spec: 'Blower-door tested to < 3 ACH50' },
      { label: 'Sound insulation — master bedroom and bath walls', spec: 'R-15 mineral wool (Rockwool SafeSound)' },
    ],
  });

  // 10. Exterior Finishes
  const extFinishItems: TradeLineItem[] = [];
  const siding = w?.materialDetails?.find(m => m.category === 'Exterior Siding');
  const sidingLabel = siding?.material ?? (extFeats.includes('New Siding') ? 'Hardie Board fiber cement' : 'Match existing siding profile');
  extFinishItems.push({ label: 'Exterior siding — addition', spec: `${sidingLabel}; moisture barrier (Tyvek or equal); furring strips if applicable` });
  if (extFeats.includes('New Siding')) extFinishItems.push({ label: 'Full home re-side per homeowner selection', spec: sidingLabel + ' — complete installation including trim, corner boards, J-channel' });
  extFinishItems.push({ label: 'Exterior trim — windows, corners, soffits', spec: 'PVC trim board; caulk all penetrations; prime + 2 coats exterior paint' });
  extFinishItems.push({ label: 'Exterior paint — addition', spec: 'Sherwin-Williams Duration or equal; prime + 2 finish coats' });
  if (outdoorFeats.includes('Covered Patio')) extFinishItems.push({ label: 'Covered patio structure', spec: 'Attached patio cover, 2×6 framing, matching roofline, stucco or siding to match home' });
  if (outdoorFeats.includes('Pergola')) extFinishItems.push({ label: 'Pergola installation', spec: 'Cedar or composite lumber, 4×6 posts, 2×8 rafters, post base anchors' });
  trades.push({
    id: 'exterior',
    name: 'Exterior Finishes',
    icon: Home,
    color: 'text-emerald-600',
    budgetPercent: 5,
    sqftBased: true,
    items: extFinishItems,
  });

  // 11. Drywall & Plaster
  trades.push({
    id: 'drywall',
    name: 'Drywall & Interior Plaster',
    icon: Layers,
    color: 'text-gray-500',
    budgetPercent: 4,
    sqftBased: true,
    items: [
      { label: 'Drywall installation — addition', spec: '5/8" Type-X on ceilings; 1/2" walls; moisture-resistant in all wet areas', unit: 'SF' },
      { label: 'Skim coat / level-5 finish — main living areas', spec: 'Level 5 finish on all walls and ceilings visible to natural light' },
      { label: 'Tape, bed, texture — bathrooms and utility spaces', spec: 'Level 4 finish, orange peel texture if applicable' },
      { label: 'Drywall repair — disturbed areas in existing home' },
      ...(intFeats.includes('Coffered Ceiling') ? [{ label: 'Coffered ceiling framing + drywall', spec: 'MDF box beams over drywall grid; Level 5 finish; LED cove lighting rough-in' }] : []),
    ],
  });

  // 12. Kitchen
  const kitItems: TradeLineItem[] = [
    { label: `Kitchen cabinets — ${w?.kitchenLevel ?? 'Premium'} level`, spec: 'Full-overlay, soft-close hinges and drawer slides; dovetail construction; installation per layout plan' },
  ];
  const countertopMat = w?.materialDetails?.find(m => m.category === 'Countertops');
  kitItems.push({ label: 'Countertops — fabrication and installation', spec: countertopMat ? `${countertopMat.material} (${countertopMat.color}); 3cm slab; eased edge; waterfall island end panel` : 'Quartz (Level 3), 3cm, eased edge profile; all seams bookmatched' });
  const backsplashMat = w?.materialDetails?.find(m => m.category === 'Backsplash');
  kitItems.push({ label: 'Backsplash tile — supply and installation', spec: backsplashMat ? `${backsplashMat.material} (${backsplashMat.color}); full height behind range; schluter trim edge` : 'Subway tile 3×12 or homeowner selection; full height behind range, standard height elsewhere' });
  if (kitFeats.includes('Island with Seating')) kitItems.push({ label: 'Kitchen island — structural and cabinetry', spec: 'Waterfall island, 36" high counter + 42" raised bar section; electrical and lighting below' });
  if (kitFeats.includes('Walk-in Pantry')) kitItems.push({ label: 'Walk-in pantry — shelving + door', spec: 'Wire or solid adjustable shelving, barn door or swing door' });
  if (kitFeats.includes('Under-cabinet Lighting')) kitItems.push({ label: 'Under-cabinet LED lighting', spec: 'Hardwired LED strip, dimmable, 2700K–3000K, linked to main kitchen switch' });
  if (kitFeats.includes('Pot Filler')) kitItems.push({ label: 'Pot filler — articulating wall-mount', spec: 'Rohl or equal; wall-mounted above range; wall patch around installation' });
  if (kitFeats.includes('Farm Sink')) kitItems.push({ label: 'Apron-front farmhouse sink', spec: '33" single-bowl fireclay or stainless; countertop modified for flush fit' });
  if (kitFeats.includes('Wine Cooler')) kitItems.push({ label: 'Wine cooler rough-in + trim-out', spec: 'Built-in under-counter unit; dual zone; wood-trim front to match cabinets' });
  if (kitFeats.includes('Pot Rack')) kitItems.push({ label: 'Pot rack — ceiling-mounted', spec: 'Wrought iron or brushed steel; structural blocking in ceiling above' });
  kitItems.push({ label: 'Appliance installation', spec: 'Refrigerator, range/cooktop, hood, dishwasher, microwave — labor only (appliances by homeowner or allowance)' });
  kitItems.push({ label: 'Cabinet hardware installation', spec: 'Pulls and knobs per homeowner selection (allowance: $1,200)' });
  trades.push({
    id: 'kitchen',
    name: 'Kitchen',
    icon: Wrench,
    color: 'text-violet-600',
    budgetPercent: 9,
    items: kitItems,
    notes: 'All cabinet shop drawings to be approved by homeowner before fabrication.',
  });

  // 13. Bathrooms
  const bathroomLevels = {
    full: 'Full renovation — demo to studs, new waterproofing, new everything',
    floors_fixtures: 'Floors and fixtures only — tile floors, new fixtures, refinish/replace vanity',
    cosmetic: 'Cosmetic — new fixtures, paint, hardware, no tile or plumbing move',
  };
  const bathScope = w?.bathroomRenoScope ?? 'full';
  const bathTileMat = w?.materialDetails?.find(m => m.category === 'Bath Tile');
  const bathItems: TradeLineItem[] = [
    { label: `Bathroom renovation scope: ${bathScope}`, spec: bathroomLevels[bathScope] },
    { label: 'Tile installation — floor', spec: bathTileMat ? `${bathTileMat.material} (${bathTileMat.color}); thin-set on Schluter Ditra or equal uncoupling membrane; grout per homeowner selection` : 'Porcelain 24×24 or homeowner selection; Schluter Ditra membrane' },
    { label: 'Tile installation — shower walls and niche', spec: bathTileMat ? `${bathTileMat.material} floor-to-ceiling; full waterproofed shower envelope (Schluter Kerdi or Wedi board)` : 'Full height shower tile on waterproofed substrate' },
    { label: 'Vanity + countertop installation', spec: 'Custom or semi-custom vanity; quartz or stone top; undermount sinks (2 if double)' },
    { label: 'Plumbing trim-out — toilet, faucets, shower valve, tub', spec: 'Kohler or equal per allowance schedule; all shutoff valves replaced' },
    { label: 'Exhaust fan — ENERGY STAR rated', spec: 'Broan or Panasonic WhisperCeiling; 110 CFM minimum; timer switch' },
    { label: 'Shower glass enclosure', spec: bathFeats.includes('Walk-in Shower') ? '3/8" frameless tempered glass; brushed nickel or matte black hardware; door sweep' : 'Semi-frameless glass, standard' },
    { label: 'Mirrors, towel bars, accessories', spec: 'Per allowance schedule ($600/bath)' },
  ];
  if (bathFeats.includes('Heated Floors')) bathItems.push({ label: 'In-floor radiant heat — master bath', spec: 'Nuheat cable system; 120V; thermostat with floor sensor; installed under tile' });
  if (bathFeats.includes('Steam Shower')) bathItems.push({ label: 'Steam shower — generator, steam head, controls', spec: 'MrSteam or ThermaSol generator; chromatherapy option; digital control panel; pitched ceiling' });
  if (bathFeats.includes('Heated Towel Bar')) bathItems.push({ label: 'Heated towel bar — hardwired', spec: '24" or 30" bar, 60W; timer switch or smart switch' });
  if (bathFeats.includes('Vessel Sinks')) bathItems.push({ label: 'Vessel sink installation', spec: 'Vessel-height vanity modification; tall faucet; drain assembly' });
  if (bathFeats.includes('Bidet')) bathItems.push({ label: 'Bidet seat or standalone bidet', spec: 'TOTO Washlet or equal; dedicated 20A GFCI outlet at toilet' });
  if (bathFeats.includes('Makeup Vanity')) bathItems.push({ label: 'Makeup vanity — built-in', spec: 'Sit-down height counter section; lighted mirror or backlit mirror; dedicated outlet' });
  if (bathFeats.includes('Skylight')) bathItems.push({ label: 'Skylight installation — master bath', spec: 'Velux fixed or vented 2×4 unit; curb mount; solar-powered blind option; interior drywall shaft' });
  trades.push({
    id: 'bathrooms',
    name: 'Bathrooms',
    icon: Droplets,
    color: 'text-blue-600',
    budgetPercent: 7,
    items: bathItems,
    notes: `Wet area waterproofing tested and inspected before tile installation. ${bathDelta > 0 ? `${bathDelta} new bathroom(s) added.` : ''}`,
  });

  // 14. Flooring
  const flooringMat = w?.materialDetails?.find(m => m.category === 'Flooring');
  const flooringType = flooringMat?.material ?? w?.flooring ?? 'Hardwood';
  trades.push({
    id: 'flooring',
    name: 'Flooring',
    icon: Layers,
    color: 'text-amber-700',
    budgetPercent: 6,
    sqftBased: true,
    items: [
      { label: `Primary flooring — ${flooringType}`, spec: flooringMat ? `${flooringMat.material} (${flooringMat.color}); installed throughout main living areas, bedrooms, hallways` : `${flooringType} — installation throughout main living areas` },
      { label: 'Subfloor prep — glue, screw, self-leveling compound', spec: 'Flatness tolerance: 3/16" in 10\' before install' },
      { label: 'Transitions and thresholds — all doorways and level changes', unit: 'EA' },
      { label: 'Base shoe / quarter-round at all walls', unit: 'LF' },
      ...(intFeats.includes('Hardwood Floors') || w?.flooring === 'Hardwood' ? [
        { label: 'Hardwood acclimation — 72 hours minimum on-site before install' },
        { label: 'Stair treads and risers — match flooring species and stain' },
      ] : []),
    ],
  });

  // 15. Interior Trim & Millwork
  const trimMat = w?.materialDetails?.find(m => m.category === 'Trim & Millwork');
  const trimItems: TradeLineItem[] = [
    { label: 'Base molding — addition and renovated areas', spec: trimMat ? `${trimMat.material}; ${trimMat.color}` : '3.5" Colonial or craftsman base; primed MDF; painted' },
    { label: 'Window and door casings — interior', spec: '2.5" flat or craftsman casing; mitered corners; nail and fill' },
    { label: 'Interior doors — new spaces', spec: '2-panel or flat solid-core; 6\'8" or 8\'0" height; pre-hung; slab doors in existing openings' },
    { label: 'Interior door hardware', spec: 'Per allowance ($150/door) — Emtek or equal in consistent finish' },
  ];
  if (intFeats.includes('Crown Molding')) trimItems.push({ label: 'Crown molding — main living areas', spec: '3.5" Crown, coped corners, painted — living room, dining, master bedroom, hallways' });
  if (intFeats.includes('Wainscoting')) trimItems.push({ label: 'Wainscoting / board & batten', spec: '36" height; 1×4 rails + 1×3 stiles; painted with semi-gloss; formal areas and master bath' });
  if (intFeats.includes('Coffered Ceiling')) trimItems.push({ label: 'Coffered ceiling — great room', spec: 'MDF box beams 8"×8"; painted; integrated LED cove lighting; Level 5 drywall finish' });
  if (intFeats.includes('Built-in Shelves')) trimItems.push({ label: 'Built-in shelving / entertainment center', spec: 'Custom MDF or solid wood; adjustable shelves; painted or stained; routed detail on face frame' });
  if (intFeats.includes('Fireplace')) trimItems.push({ label: 'Fireplace surround and mantle', spec: 'MDF or stone veneer surround; painted mantle shelf; gas fireplace per UL listing; remote ignition' });
  if (roomFeats.includes('Walk-in Closet')) trimItems.push({ label: 'Walk-in closet system — master', spec: 'California Closets or equal; double hanging, shelves, drawer bank, shoe shelf; wood or laminate finish' });
  if (intFeats.includes('Home Office')) trimItems.push({ label: 'Home office built-ins', spec: 'Desk surface with file drawer; upper shelving with doors; wainscoting accent wall' });
  trades.push({
    id: 'trim',
    name: 'Interior Trim & Millwork',
    icon: Palette,
    color: 'text-pink-600',
    budgetPercent: 5,
    items: trimItems,
  });

  // 16. Painting
  const wallMat = w?.materialDetails?.find(m => m.category === 'Walls');
  trades.push({
    id: 'painting',
    name: 'Interior Painting',
    icon: Palette,
    color: 'text-purple-500',
    budgetPercent: 3,
    sqftBased: true,
    items: [
      { label: 'Interior paint — addition and renovated spaces', spec: wallMat ? `${wallMat.material} — ${wallMat.color}; Sherwin-Williams Emerald or equal; 1 coat PVA primer + 2 finish coats` : 'Sherwin-Williams Emerald or equal; 1 primer + 2 finish coats; flat ceiling / eggshell walls / semi-gloss trim' },
      { label: 'Ceiling paint — flat white throughout', spec: 'Sherwin-Williams Ceiling Paint; 1 prime + 2 coats' },
      { label: 'Trim and doors — semi-gloss or satin', spec: 'All trim, casings, doors — brush/roll finish; 1 prime + 2 coats' },
      { label: 'Touch-up — all disturbed surfaces in existing home' },
      ...(wallMat?.material.toLowerCase().includes('venetian') ? [
        { label: 'Venetian plaster application — feature walls', spec: 'Two-coat Venetian plaster; burnished finish; feature walls per plan' },
      ] : []),
    ],
  });

  // 17. Outdoor / Hardscape (if applicable)
  if (outdoorFeats.length > 0) {
    const outdoorItems: TradeLineItem[] = [];
    if (outdoorFeats.includes('Covered Patio')) outdoorItems.push({ label: 'Covered patio — concrete slab and framing', spec: '4" slab on grade, #4 rebar 18" O.C., broom finish; framed cover per architectural plans' });
    if (outdoorFeats.includes('Outdoor Kitchen')) outdoorItems.push({ label: 'Outdoor kitchen rough-in and structure', spec: 'CMU or steel stud frame, stucco finish; BBQ, fridge, sink rough-ins; countertop slab' });
    if (outdoorFeats.includes('Fire Pit')) outdoorItems.push({ label: 'Fire pit — gas or wood burning', spec: 'Gas: 48" diameter, burner pan, key valve, CSA-approved; or wood-burning CMU block with cap' });
    if (outdoorFeats.includes('Pergola')) outdoorItems.push({ label: 'Pergola', spec: 'Cedar or powder-coated aluminum; 4×6 posts; 2×8 rafters 24" O.C.; footings per engineer' });
    if (outdoorFeats.includes('Fencing')) outdoorItems.push({ label: 'Fencing installation', spec: 'Block wall or wood fence per HOA; per LF estimate' });
    if (outdoorFeats.includes('Sprinkler System')) outdoorItems.push({ label: 'Irrigation system installation', spec: 'Zone valves, pop-up heads, drip lines for landscaping beds; Rainbird or Hunter controller' });
    trades.push({
      id: 'outdoor',
      name: 'Outdoor & Hardscape',
      icon: TreePine,
      color: 'text-green-700',
      budgetPercent: 4,
      items: outdoorItems,
    });
  }

  return trades;
}

// ─────────────────────────────────────────────
//  Finishes Schedule builder
// ─────────────────────────────────────────────

function buildFinishesSchedule(project: Project | undefined): FinishRow[] {
  const w = project?.wishlist;
  const mats: MaterialDetail[] = w?.materialDetails ?? [];
  const rows: FinishRow[] = [];

  const fmt = (m: MaterialDetail): FinishRow => ({
    surface: m.category,
    spec: m.material,
    color: m.color,
    budget: `$${Math.round(m.budgetLow / 1000)}K–$${Math.round(m.budgetHigh / 1000)}K`,
    source: m.isManualPick ? 'homeowner' : 'aria',
  });

  if (mats.length > 0) {
    mats.forEach(m => rows.push(fmt(m)));
  } else {
    // Build from wishlist selections as fallback
    if (w?.flooring) rows.push({ surface: 'Flooring', spec: `${w.flooring} — main living areas`, color: 'Per homeowner selection', budget: 'Per estimate', source: 'standard' });
    if (w?.kitchenLevel) rows.push({ surface: 'Countertops', spec: `${w.kitchenLevel} level quartz or stone`, color: 'Homeowner to select', budget: 'Per allowance', source: 'standard' });
    rows.push({ surface: 'Cabinets', spec: `${w?.kitchenLevel ?? 'Premium'} cabinetry — full overlay`, color: 'Homeowner to select paint color', budget: 'Per estimate', source: 'standard' });
    rows.push({ surface: 'Backsplash', spec: 'Tile per homeowner selection', color: 'TBD', budget: '$2K–$7K allowance', source: 'standard' });
    rows.push({ surface: 'Bath Tile', spec: 'Porcelain or stone per homeowner selection', color: 'TBD', budget: '$4K–$10K allowance', source: 'standard' });
  }

  return rows;
}

// ─────────────────────────────────────────────
//  Collapsible trade section
// ─────────────────────────────────────────────

interface TradeSectionProps {
  trade: Trade;
  totalCost: number;
  sqftAdd: number;
  ganttDuration: number; // default duration in weeks from Gantt data
  override?: { proposedBudget: number; duration: number };
  onBudgetChange: (tradeId: string, tradeName: string, oldBudget: number, newBudget: number) => void;
  onDurationChange: (tradeId: string, tradeName: string, oldDuration: number, newDuration: number) => void;
}

function TradeSection({ trade, totalCost, sqftAdd, ganttDuration, override, onBudgetChange, onDurationChange }: TradeSectionProps) {
  const [open, setOpen] = useState(true);
  const estimated = Math.round((trade.budgetPercent / 100) * totalCost);
  const currentBudget = override?.proposedBudget || estimated;
  const currentDuration = override?.duration || ganttDuration;
  const budgetDelta = currentBudget - estimated;
  const durationDelta = currentDuration - ganttDuration;
  const hasOverride = override && (override.proposedBudget !== 0 || override.duration !== 0);
  const hasBudgetChange = hasOverride && override.proposedBudget !== 0 && override.proposedBudget !== estimated;
  const hasDurationChange = hasOverride && override.duration !== 0 && override.duration !== ganttDuration;
  const sqftRate = trade.sqftBased && sqftAdd > 0 ? currentBudget / sqftAdd : 0;

  return (
    <div className={`border rounded-xl overflow-hidden ${hasOverride ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg bg-white border border-gray-200 ${trade.color}`}>
            <trade.icon size={18} />
          </div>
          <div>
            <span className="font-bold text-gray-900">{trade.name}</span>
            <span className="ml-2 text-xs text-gray-400">({trade.items.length} line items)</span>
            {hasOverride && (
              <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase">
                Edited
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-mono font-semibold text-gray-700">
            ~${(estimated / 1000).toFixed(0)}K ({trade.budgetPercent}%)
          </span>
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* ── Contractor Edit Fields ── */}
            <div className="px-4 pt-4 pb-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contractor Adjustments</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Proposed Budget */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Proposed Budget</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input
                        type="number"
                        value={currentBudget}
                        onChange={e => {
                          const v = Math.max(0, Number(e.target.value) || 0);
                          onBudgetChange(trade.id, trade.name, override?.proposedBudget || estimated, v);
                        }}
                        className={`w-full pl-6 pr-3 py-1.5 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          hasBudgetChange ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-white'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">Default: ${Math.round(estimated).toLocaleString()}</span>
                      {hasBudgetChange && (
                        <span className={`text-[10px] font-bold ${budgetDelta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {budgetDelta > 0 ? '+' : ''}${Math.round(budgetDelta).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {trade.sqftBased && sqftAdd > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1">= ${Math.round(sqftRate).toLocaleString()}/sqft</p>
                    )}
                  </div>
                  {/* Phase duration */}
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Phase Duration</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={currentDuration}
                        onChange={e => {
                          const v = Math.max(1, Math.min(52, Number(e.target.value) || 1));
                          onDurationChange(trade.id, trade.name, override?.duration || ganttDuration, v);
                        }}
                        className={`w-full px-3 py-1.5 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          hasDurationChange ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-white'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">wks</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">Default: {ganttDuration} wks</span>
                      {hasDurationChange && (
                        <span className={`text-[10px] font-bold ${durationDelta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {durationDelta > 0 ? '+' : ''}{durationDelta} wks
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Proposed budget summary */}
                {hasBudgetChange && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Original: <span className="font-mono">${(estimated / 1000).toFixed(0)}K</span>
                    </span>
                    <span className="font-bold text-gray-900">
                      Proposed: <span className="font-mono">${(currentBudget / 1000).toFixed(1)}K</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 pt-2 space-y-2">
              {trade.items.map((item, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="mt-1 w-4 h-4 rounded-full border-2 border-blue-200 bg-blue-50 flex-shrink-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                      {item.unit && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 shrink-0">{item.unit}</span>
                      )}
                    </div>
                    {item.spec && (
                      <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 mt-1 font-mono leading-relaxed">
                        {item.spec}
                      </p>
                    )}
                    {item.detail && (
                      <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
                    )}
                  </div>
                </div>
              ))}
              {trade.notes && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-2">
                  <Info size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">{trade.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Project Gantt chart
// ─────────────────────────────────────────────

function ProjectGantt({ totalWeeks, totalCost }: { totalWeeks: number; totalCost: number }) {
  const { tracks, milestones } = useMemo(() => buildGanttData(totalWeeks), [totalWeeks]);
  const [signedOff, setSignedOff] = useState<Record<number, boolean>>({});

  // How many trades active each week (for coverage heatmap)
  const weekCoverage = useMemo<number[]>(
    () => Array.from({ length: totalWeeks }, (_, i) => {
      const w = i + 1;
      return tracks.filter(t => w >= t.start && w <= t.end).length;
    }),
    [tracks, totalWeeks],
  );
  const maxCoverage = Math.max(...weekCoverage, 1);

  const LABEL_W = 172; // px — left trade-name column
  const CELL_W  = 42;  // px per week column
  const ROW_H   = 34;  // px per trade row
  const gridW   = totalWeeks * CELL_W;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* ── Header ── */}
      <div className="p-6 md:p-8 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarDays size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Construction Schedule</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalWeeks}-week optimized plan · every week has active trades on site · milestone-gated payments
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
            Milestone gate — next trade blocked until sign-off
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Milestone + escrow payment releases
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-12 h-3 rounded-sm bg-slate-500 inline-block" />
            Active trade
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(34,197,94,0.65)' }} />
            Daily coverage (trades on site)
          </span>
        </div>
      </div>

      {/* ── Scrollable Gantt grid ── */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_W + gridW + 'px' }} className="bg-slate-950">

          {/* Week-number header row */}
          <div
            className="flex sticky top-0 z-10"
            style={{ height: 28, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0f172a' }}
          >
            <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="flex items-center px-4 border-r border-white/10 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Trade</span>
            </div>
            <div className="flex">
              {Array.from({ length: totalWeeks }, (_, i) => {
                const w = i + 1;
                const ms = milestones.find(m => m.week === w);
                const isPayment = ms?.paymentPct != null;
                return (
                  <div
                    key={w}
                    style={{ width: CELL_W, minWidth: CELL_W }}
                    className={`flex items-center justify-center border-r ${
                      isPayment ? 'border-emerald-500/50' : ms ? 'border-amber-400/40' : 'border-white/5'
                    }`}
                  >
                    <span className={`text-[9px] font-bold ${
                      isPayment ? 'text-emerald-400' : ms ? 'text-amber-400' : 'text-white/20'
                    }`}>
                      {w}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone label row */}
          <div
            className="flex"
            style={{ height: 22, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0c1424' }}
          >
            <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="border-r border-white/10 shrink-0" />
            <div className="flex relative flex-1" style={{ height: 22 }}>
              {milestones.map((ms, i) => {
                const isPayment = ms.paymentPct != null;
                const leftPx = (ms.week - 1) * CELL_W + CELL_W / 2;
                return (
                  <div
                    key={i}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: leftPx, transform: 'translateX(-50%)', zIndex: 2 }}
                  >
                    {/* Diamond */}
                    <div
                      className={`w-3 h-3 rotate-45 mt-1.5 shrink-0 ${isPayment ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      title={ms.label}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trade bar rows */}
          {tracks.map((track, idx) => {
            const barLeft = (track.start - 1) * CELL_W;
            const barWidth = (track.end - track.start + 1) * CELL_W;
            const isEven = idx % 2 === 0;
            return (
              <div
                key={track.id}
                className="flex items-center"
                style={{
                  height: ROW_H,
                  background: isEven ? 'rgba(255,255,255,0.022)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Trade label */}
                <div
                  style={{ width: LABEL_W, minWidth: LABEL_W }}
                  className="px-4 border-r border-white/10 flex items-center shrink-0"
                >
                  <span className="text-[11px] text-white/65 font-medium truncate">{track.name}</span>
                </div>

                {/* Bar + milestone vertical lines */}
                <div className="relative flex-1" style={{ height: ROW_H }}>
                  {/* Milestone vertical rules */}
                  {milestones.map((ms, mi) => {
                    const x = (ms.week - 1) * CELL_W + CELL_W / 2 - 0.5;
                    return (
                      <div
                        key={mi}
                        className="absolute top-0 bottom-0 w-px pointer-events-none"
                        style={{
                          left: x,
                          background: ms.paymentPct != null
                            ? 'rgba(52,211,153,0.25)'
                            : 'rgba(251,191,36,0.2)',
                        }}
                      />
                    );
                  })}
                  {/* The colored bar */}
                  <div
                    className="absolute top-[5px] bottom-[5px] rounded-md flex items-center overflow-hidden"
                    style={{
                      left: barLeft,
                      width: barWidth,
                      backgroundColor: track.hex,
                      boxShadow: `0 0 10px ${track.hex}44`,
                    }}
                  >
                    {barWidth > 55 && (
                      <span className="px-2 text-[10px] font-semibold text-white/90 truncate leading-none">
                        {track.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Coverage heatmap row */}
          <div
            className="flex items-stretch"
            style={{ borderTop: '2px solid rgba(255,255,255,0.08)' }}
          >
            <div
              style={{ width: LABEL_W, minWidth: LABEL_W, height: ROW_H }}
              className="px-4 border-r border-white/10 flex items-center shrink-0"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                Trades on site
              </span>
            </div>
            <div className="flex">
              {weekCoverage.map((count, i) => {
                const w = i + 1;
                const ms = milestones.find(m => m.week === w);
                const intensity = count / maxCoverage;
                const bg = count === 0
                  ? 'rgba(239,68,68,0.5)'
                  : `rgba(34,197,94,${0.12 + intensity * 0.68})`;
                return (
                  <div
                    key={i}
                    title={`Week ${w}: ${count} trade${count !== 1 ? 's' : ''} active`}
                    style={{
                      width: CELL_W,
                      minWidth: CELL_W,
                      height: ROW_H,
                      background: bg,
                      borderLeft: ms
                        ? `2px solid ${ms.paymentPct != null ? '#10b981' : '#f59e0b'}`
                        : undefined,
                    }}
                    className="flex items-center justify-center border-r border-white/5"
                  >
                    <span className="text-[9px] font-bold text-white/80">{count > 0 ? count : '!'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment release row */}
          <div
            className="flex items-stretch"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#071a12' }}
          >
            <div
              style={{ width: LABEL_W, minWidth: LABEL_W, height: ROW_H + 8 }}
              className="px-4 border-r border-white/10 flex items-center shrink-0"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/60">
                $ Escrow release
              </span>
            </div>
            <div className="relative flex-1" style={{ height: ROW_H + 8 }}>
              {milestones.filter(ms => ms.paymentPct != null).map((ms, i) => {
                const amt = Math.round((ms.paymentPct! / 100) * totalCost);
                const leftPx = (ms.week - 1) * CELL_W + CELL_W / 2;
                return (
                  <div
                    key={i}
                    className="absolute top-1.5 flex flex-col items-center gap-0.5"
                    style={{ left: leftPx, transform: 'translateX(-50%)' }}
                  >
                    <div className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                      ${(amt / 1000).toFixed(0)}K
                    </div>
                    <div className="w-px h-3 bg-emerald-400/40" />
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── Milestone sign-off cards ── */}
      <div className="p-6 md:p-8 pt-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">Milestone Sign-off Checklist</h3>
          <span className="text-xs text-gray-400">
            {Object.values(signedOff).filter(Boolean).length} / {milestones.length} complete
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Each milestone must be signed off by the GC before gated trades begin and before the associated escrow draw is released. Creates a clear, auditable record for the homeowner, lender, and AHJ.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {milestones.map((ms, i) => {
            const isSigned = signedOff[i] ?? false;
            const amt = ms.paymentPct != null
              ? Math.round((ms.paymentPct / 100) * totalCost)
              : null;
            const prevSigned = i === 0 || signedOff[i - 1];
            return (
              <div
                key={i}
                className={`rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                  isSigned
                    ? 'bg-emerald-50 border-emerald-200'
                    : !prevSigned
                    ? 'bg-gray-50 border-gray-100 opacity-50'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {/* Badge row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSigned
                          ? 'bg-emerald-500 text-white'
                          : ms.paymentPct != null
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isSigned ? <CheckCircle2 size={14} /> : ms.shortLabel}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">Wk {ms.week}</span>
                  </div>
                  {amt != null && (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ${(amt / 1000).toFixed(0)}K
                    </span>
                  )}
                </div>

                {/* Label + desc */}
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-snug">{ms.label}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{ms.desc}</p>
                </div>

                {/* Gates notice */}
                {ms.gates.length > 0 && (
                  <p className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                    ⛔ Gates {ms.gates.length} trade{ms.gates.length > 1 ? 's' : ''} — sign off to unblock
                  </p>
                )}

                {/* Sign-off button */}
                <button
                  disabled={!prevSigned}
                  onClick={() => setSignedOff(prev => ({ ...prev, [i]: !prev[i] }))}
                  className={`mt-auto w-full py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSigned
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : !prevSigned
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent'
                  }`}
                >
                  <CheckCircle2 size={12} />
                  {isSigned ? 'Signed Off ✓' : 'Sign Off Phase'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//  Main page
// ─────────────────────────────────────────────

export function ContractorReview() {
  const navigate = useNavigate();
  const projectCtx = useProjectOptional();
  const project = projectCtx?.project;

  const projectName = useMemo(() => {
    if (!project?.property?.address) return 'The Smith Residence Expansion';
    const first = project.property.address.split(',')[0]?.trim() || project.property.address;
    return first ? `${first} Expansion` : 'Your Residence Expansion';
  }, [project?.property?.address]);

  const projectIdShort = project?.meta?.projectId
    ? project.meta.projectId.replace(/^EXP-/, '').slice(0, 8) + '-B'
    : '8492-B';

  const baseTotalCost = project?.financial?.totalCost ?? 415000;

  // ── Editable assumptions (light overrides, not saved to backend) ──────────────
  const baseSqftAdd = useMemo(() => {
    const w = project?.wishlist;
    const prop = project?.property;
    const bedDelta = Math.max(0, (w?.bedrooms ?? 0) - (prop?.beds ?? 0));
    const bathDelta = Math.max(0, (w?.bathrooms ?? 0) - (prop?.baths ?? 0));
    return bedDelta * 250 + bathDelta * 100 + 200; // base footprint
  }, [project]);
  const [assumptions, setAssumptions] = useState({
    totalCost: baseTotalCost,
    sqftAdd: baseSqftAdd || 650,
    contingencyPct: 10,
    timelineWeeks: 24,
  });
  const [showAssumptions, setShowAssumptions] = useState(false);
  // Sync if project loads late
  useEffect(() => {
    setAssumptions(prev => ({ ...prev, totalCost: baseTotalCost, sqftAdd: baseSqftAdd || prev.sqftAdd }));
  }, [baseTotalCost, baseSqftAdd]);
  const totalCost = assumptions.totalCost;

  const trades = useMemo(() => buildTrades(project), [project]);
  const finishesSchedule = useMemo(() => buildFinishesSchedule(project), [project]);
  const specialInstructions = project?.notes?.specialInstructions?.trim();

  // ── Contractor edits reducer (per-trade overrides + audit trail) ──────────────
  const [editState, editDispatch] = useReducer(editReducer, {
    tradeOverrides: {},
    auditTrail: [],
    nextSeq: 1,
  });

  // Get Gantt durations keyed by trade id for default values
  const ganttData = useMemo(() => buildGanttData(assumptions.timelineWeeks), [assumptions.timelineWeeks]);
  const ganttDurationMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const track of ganttData.tracks) {
      map[track.id] = track.end - track.start + 1;
    }
    return map;
  }, [ganttData]);

  // Map trade ids to gantt ids (some mismatches: 'framing' → 'frame', etc.)
  const tradeToGanttId = useCallback((tradeId: string): string => {
    const mapping: Record<string, string> = {
      gc: 'gc', demo: 'demo', framing: 'frame', roofing: 'roof',
      windows: 'windows', electrical: 'elec_r', plumbing: 'plumb_r',
      hvac: 'hvac_r', insulation: 'insul', exterior: 'ext_fin',
      drywall: 'drywall', kitchen: 'cabs', bathrooms: 'tile',
      flooring: 'floor', trim: 'trim', painting: 'paint', outdoor: 'punch',
    };
    return mapping[tradeId] ?? tradeId;
  }, []);

  const getGanttDuration = useCallback((tradeId: string): number => {
    return ganttDurationMap[tradeToGanttId(tradeId)] ?? 4;
  }, [ganttDurationMap, tradeToGanttId]);

  // Handlers for trade edits
  const handleTradeBudgetChange = useCallback((tradeId: string, tradeName: string, oldBudget: number, newBudget: number) => {
    editDispatch({ type: 'EDIT_TRADE_BUDGET', tradeId, tradeName, oldBudget, newBudget });
  }, []);

  const handleTradeDurationChange = useCallback((tradeId: string, tradeName: string, oldDuration: number, newDuration: number) => {
    editDispatch({ type: 'EDIT_TRADE_DURATION', tradeId, tradeName, oldDuration, newDuration });
  }, []);

  // Compute change summary
  const changeSummary = useMemo(() => {
    const budgetChanges: Array<{ name: string; original: number; proposed: number; delta: number; pctChange: number }> = [];
    const timelineChanges: Array<{ name: string; original: number; proposed: number; delta: number }> = [];

    for (const trade of trades) {
      const override = editState.tradeOverrides[trade.id];
      if (!override) continue;

      const estimated = Math.round((trade.budgetPercent / 100) * totalCost);
      const ganttDur = getGanttDuration(trade.id);

      if (override.proposedBudget && override.proposedBudget !== estimated) {
        budgetChanges.push({
          name: trade.name,
          original: estimated,
          proposed: override.proposedBudget,
          delta: override.proposedBudget - estimated,
          pctChange: estimated > 0 ? ((override.proposedBudget - estimated) / estimated) * 100 : 0,
        });
      }

      if (override.duration && override.duration !== ganttDur) {
        timelineChanges.push({
          name: trade.name,
          original: ganttDur,
          proposed: override.duration,
          delta: override.duration - ganttDur,
        });
      }
    }

    const totalBudgetDelta = budgetChanges.reduce((s, c) => s + c.delta, 0);
    const totalTimelineDelta = timelineChanges.reduce((s, c) => s + c.delta, 0);
    const hasChanges = budgetChanges.length > 0 || timelineChanges.length > 0;

    return { budgetChanges, timelineChanges, totalBudgetDelta, totalTimelineDelta, hasChanges };
  }, [trades, editState.tradeOverrides, totalCost, assumptions.sqftAdd, getGanttDuration]);

  const [agreed, setAgreed] = useState({ scope: false, fixedPrice: false, milestones: false, changeOrder: false });
  const [formData, setFormData] = useState({
    contractorName: project?.contractor?.contractorName ?? '',
    companyName: project?.contractor?.companyName ?? '',
    licenseNumber: project?.contractor?.licenseNumber ?? '',
    bidAmount: project?.contractor?.bidAmount ?? String(totalCost),
    estimatedWeeks: project?.contractor?.estimatedWeeks ?? String(assumptions.timelineWeeks),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project?.financial?.totalCost != null && !formData.contractorName) {
      setFormData(prev => ({ ...prev, bidAmount: String(project.financial.totalCost) }));
    }
  }, [project?.financial?.totalCost]);

  const allAgreed = Object.values(agreed).every(Boolean);
  const isFormValid = formData.contractorName && formData.companyName && formData.licenseNumber;
  const canSubmit = allAgreed && isFormValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);

    // Build contractor edits payload (only if changes were made)
    const hasEdits = editState.auditTrail.length > 0;
    const editsPayload: ContractorEdits | undefined = hasEdits ? {
      editedAt: new Date().toISOString(),
      editedBy: formData.contractorName,
      tradeOverrides: Object.fromEntries(
        Object.entries(editState.tradeOverrides).map(([id, o]) => [id, {
          proposedBudget: o.proposedBudget,
          proposedDuration: o.duration,
        }])
      ),
      assumptionOverrides: {
        ...(assumptions.totalCost !== baseTotalCost ? { totalCost: assumptions.totalCost } : {}),
        ...(assumptions.sqftAdd !== (baseSqftAdd || 650) ? { sqftAdded: assumptions.sqftAdd } : {}),
        ...(assumptions.contingencyPct !== 10 ? { contingencyPct: assumptions.contingencyPct } : {}),
        ...(assumptions.timelineWeeks !== 24 ? { timelineWeeks: assumptions.timelineWeeks } : {}),
      },
      auditTrail: editState.auditTrail,
    } : undefined;

    if (projectCtx) {
      projectCtx.updateProject({
        contractor: {
          contractorName: formData.contractorName,
          companyName: formData.companyName,
          licenseNumber: formData.licenseNumber,
          bidAmount: formData.bidAmount,
          estimatedWeeks: formData.estimatedWeeks,
          agreedAt: new Date().toISOString(),
          ...(editsPayload ? { edits: editsPayload } : {}),
        },
      });
    }
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/approved-project-plan', { state: { formData, project: projectCtx?.project } });
    }, 1500);
  };

  // Milestone amounts
  const milestones = [
    { phase: '1. Mobilization, Deposit & Permitting', pct: 10, desc: 'Pull all permits; site protection; temporary power' },
    { phase: '2. Foundation, Footings & Framing', pct: 25, desc: 'Concrete, framing complete, roof sheathed, windows in' },
    { phase: '3. Rough Mechanical, Electrical & Plumbing', pct: 25, desc: 'All MEP rough-in; inspected and approved' },
    { phase: '4. Insulation, Drywall, Exterior Finishes', pct: 20, desc: 'Drywall hung and finished; exterior complete' },
    { phase: '5. Interior Finishes (Floors, Cabinets, Tile)', pct: 15, desc: 'All finishes installed; painting complete' },
    { phase: '6. Final Punch-list & Certificate of Occupancy', pct: 5, desc: 'All items resolved; CO issued; final walkthrough signed' },
  ];

  const allowances = [
    { label: 'Lighting fixtures — all spaces', amount: 8500, note: 'Overages via Change Order' },
    { label: 'Plumbing fixtures (faucets, showers, toilets)', amount: 9000, note: 'Kohler or equal' },
    { label: 'Appliances', amount: 18000, note: 'Supply by homeowner or via allowance' },
    { label: 'Cabinet hardware', amount: 1800, note: 'Per door/drawer count' },
    { label: 'Landscape repair / finish grade', amount: 3500, note: 'Disturbed areas only' },
    { label: 'Window treatments / blinds rough-in', amount: 1200, note: 'Blocking + clips only' },
    { label: 'Mirrors and bathroom accessories', amount: 2400, note: '$600/bath × qty' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <TableOfContents items={PORTAL_TOC} accent="blue" theme="light" />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <HardHat className="text-white" size={20} />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              ExpandEase <span className="text-gray-300 font-normal">|</span> Contractor Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Pending Contractor Sign-off
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Coming soon banner */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-start gap-2">
          <Info size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>Contractor matching coming soon.</strong> This SOW is saved and ready. When we launch, you'll send this directly to our vetted contractor network for competitive bids.
          </div>
        </div>

        {/* ── Permitting & Compliance Status Pills ── */}
        <div id="portal-permits" className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Stamp,          label: 'Plans Stamped',         value: 'PE / Architect',  color: 'emerald', status: 'Verified' },
            { icon: Building2,      label: 'AHJ Jurisdiction',      value: project?.property?.address ? 'County Verified' : 'Pending Address', color: project?.property?.address ? 'blue' : 'amber', status: project?.property?.address ? 'Matched' : 'Awaiting' },
            { icon: ClipboardCheck, label: 'Inspection Checklist',  value: '7 Inspections',   color: 'violet', status: 'Generated' },
            { icon: FileCheck,      label: 'Permit Application',    value: 'Pre-filled',      color: 'sky',    status: 'Ready' },
          ].map((pill, i) => (
            <div key={i} className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${pill.color}-50`}>
                  <pill.icon size={18} className={`text-${pill.color}-600`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-${pill.color}-100 text-${pill.color}-700`}>
                  {pill.status}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">{pill.label}</p>
              <p className="text-sm font-bold text-gray-900">{pill.value}</p>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-${pill.color}-400 to-${pill.color}-600`} />
            </div>
          ))}
        </div>

        {/* Page title */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <p className="text-blue-600 font-bold tracking-wider text-xs uppercase mb-2">
            Project #{projectIdShort} — Full Scope of Work
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            {projectName}
          </h1>
          <p className="text-gray-500 text-lg max-w-3xl">
            This is a homeowner-verified, AI-generated Statement of Work. Every line item, material spec, and sub-component was derived from the homeowner's confirmed selections. Contractors are expected to bid to this scope — any deviation requires a Change Order.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-sm ${assumptions.totalCost !== baseTotalCost ? 'bg-amber-100 border border-amber-300' : 'bg-gray-100'}`}>
              <span className="text-gray-500">Total Budget: </span>
              <span className="font-bold text-gray-900">${totalCost.toLocaleString()}</span>
              {assumptions.totalCost !== baseTotalCost && <span className="text-amber-600 text-xs ml-1">(adjusted)</span>}
            </div>
            {project?.property?.address && (
              <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                <span className="text-gray-500">Address: </span>
                <span className="font-medium text-gray-900">{project.property.address}</span>
              </div>
            )}
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
              <span className="text-gray-500">Style: </span>
              <span className="font-medium text-gray-900">{project?.wishlist?.homeStyle ?? 'Modern'}</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
              <span className="text-gray-500">Trades: </span>
              <span className="font-medium text-gray-900">{trades.length} trade packages</span>
            </div>
          </div>

          {/* ── Editable Assumptions Panel ── */}
          <div className="mt-5">
            <button
              onClick={() => setShowAssumptions(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors group"
            >
              <div className="p-1 rounded-md bg-gray-100 group-hover:bg-blue-50 transition-colors">
                <Pencil size={13} />
              </div>
              <span>{showAssumptions ? 'Hide' : 'Edit'} Bid Assumptions</span>
              <ChevronDown size={14} className={`transition-transform ${showAssumptions ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showAssumptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2 mb-4">
                      <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        These assumptions drive all budget estimates on this page. Adjust them to reflect your assessment before submitting your bid. Changes are session-only and don't modify the homeowner's record.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total Cost */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Project Budget ($)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            value={assumptions.totalCost}
                            onChange={e => setAssumptions(prev => ({ ...prev, totalCost: Math.max(50000, Number(e.target.value) || 0) }))}
                            onBlur={e => {
                              const v = Math.max(50000, Number(e.target.value) || 0);
                              if (v !== baseTotalCost) editDispatch({ type: 'EDIT_ASSUMPTION', field: 'totalCost', oldValue: baseTotalCost, newValue: v, label: 'Total Project Budget' });
                            }}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          />
                        </div>
                      </div>
                      {/* Sq Ft Added */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sq Ft Being Added</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={assumptions.sqftAdd}
                            onChange={e => setAssumptions(prev => ({ ...prev, sqftAdd: Math.max(0, Number(e.target.value) || 0) }))}
                            onBlur={e => {
                              const v = Math.max(0, Number(e.target.value) || 0);
                              if (v !== (baseSqftAdd || 650)) editDispatch({ type: 'EDIT_ASSUMPTION', field: 'sqftAdded', oldValue: baseSqftAdd || 650, newValue: v, label: 'Sq Ft Being Added' });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">sf</span>
                        </div>
                      </div>
                      {/* Contingency % */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contingency %</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={assumptions.contingencyPct}
                            onChange={e => setAssumptions(prev => ({ ...prev, contingencyPct: Math.max(0, Math.min(30, Number(e.target.value) || 0)) }))}
                            onBlur={e => {
                              const v = Math.max(0, Math.min(30, Number(e.target.value) || 0));
                              if (v !== 10) editDispatch({ type: 'EDIT_ASSUMPTION', field: 'contingencyPct', oldValue: 10, newValue: v, label: 'Contingency %' });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                        </div>
                      </div>
                      {/* Timeline */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Est. Timeline (Weeks)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={4}
                            max={104}
                            value={assumptions.timelineWeeks}
                            onChange={e => {
                              const wks = Math.max(4, Math.min(104, Number(e.target.value) || 0));
                              setAssumptions(prev => ({ ...prev, timelineWeeks: wks }));
                              setFormData(prev => ({ ...prev, estimatedWeeks: String(wks) }));
                            }}
                            onBlur={e => {
                              const v = Math.max(4, Math.min(104, Number(e.target.value) || 0));
                              if (v !== 24) editDispatch({ type: 'EDIT_ASSUMPTION', field: 'timelineWeeks', oldValue: 24, newValue: v, label: 'Est. Timeline' });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">wks</span>
                        </div>
                      </div>
                    </div>
                    {/* Derived stats */}
                    <div className="mt-4 pt-4 border-t border-amber-200 grid sm:grid-cols-3 gap-3 text-xs text-amber-900">
                      <div>
                        <span className="font-semibold">$/sf: </span>
                        <span className="font-mono">${assumptions.sqftAdd > 0 ? Math.round(assumptions.totalCost / assumptions.sqftAdd).toLocaleString() : '—'}/sf</span>
                      </div>
                      <div>
                        <span className="font-semibold">Contingency reserve: </span>
                        <span className="font-mono">${Math.round(assumptions.totalCost * assumptions.contingencyPct / 100).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Hard costs (ex-contingency): </span>
                        <span className="font-mono">${Math.round(assumptions.totalCost * (1 - assumptions.contingencyPct / 100)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Change Summary Panel (appears when contractor makes edits) ── */}
        <AnimatePresence>
          {changeSummary.hasChanges && (
            <motion.section
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-md border-2 border-amber-300 p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Change Summary</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Contractor adjustments vs. original SOW estimates
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => editDispatch({ type: 'RESET_ALL', originalBudgets: {}, originalDurations: {} })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 border border-gray-200"
                  >
                    <RotateCcw size={12} />
                    Reset All
                  </button>
                </div>

                {/* Overall delta bar */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-xl border ${changeSummary.totalBudgetDelta > 0 ? 'bg-red-50 border-red-200' : changeSummary.totalBudgetDelta < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Budget Impact</p>
                    <p className={`text-2xl font-bold font-mono ${changeSummary.totalBudgetDelta > 0 ? 'text-red-700' : changeSummary.totalBudgetDelta < 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {changeSummary.totalBudgetDelta > 0 ? '+' : ''}{changeSummary.totalBudgetDelta !== 0 ? `$${Math.round(changeSummary.totalBudgetDelta).toLocaleString()}` : '$0'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border ${changeSummary.totalTimelineDelta > 0 ? 'bg-red-50 border-red-200' : changeSummary.totalTimelineDelta < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Net Timeline Impact</p>
                    <p className={`text-2xl font-bold font-mono ${changeSummary.totalTimelineDelta > 0 ? 'text-red-700' : changeSummary.totalTimelineDelta < 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {changeSummary.totalTimelineDelta > 0 ? '+' : ''}{changeSummary.totalTimelineDelta} weeks
                    </p>
                  </div>
                </div>

                {/* Per-trade budget changes */}
                {changeSummary.budgetChanges.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <DollarSign size={12} /> Budget Adjustments
                    </p>
                    <div className="space-y-1">
                      {changeSummary.budgetChanges.map((c, i) => {
                        const severity = Math.abs(c.pctChange) > 25 ? 'red' : Math.abs(c.pctChange) > 15 ? 'amber' : 'emerald';
                        return (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${severity}-500`} />
                              <span className="text-sm font-medium text-gray-900">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-mono">
                              <span className="text-gray-400">${(c.original / 1000).toFixed(0)}K</span>
                              <ArrowRight size={12} className="text-gray-300" />
                              <span className="font-bold text-gray-900">${(c.proposed / 1000).toFixed(1)}K</span>
                              <span className={`font-bold ${c.delta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                ({c.delta > 0 ? '+' : ''}{c.pctChange.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Per-trade timeline changes */}
                {changeSummary.timelineChanges.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock size={12} /> Timeline Adjustments
                    </p>
                    <div className="space-y-1">
                      {changeSummary.timelineChanges.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                          <div className="flex items-center gap-3 text-sm font-mono">
                            <span className="text-gray-400">{c.original} wks</span>
                            <ArrowRight size={12} className="text-gray-300" />
                            <span className="font-bold text-gray-900">{c.proposed} wks</span>
                            <span className={`font-bold ${c.delta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              ({c.delta > 0 ? '+' : ''}{c.delta} wks)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div id="portal-scope" className="grid lg:grid-cols-3 gap-8">
          {/* ── Left/Center: SOW ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Trade-by-trade scope */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Trade-by-Trade Scope of Work</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {trades.reduce((sum, t) => sum + t.items.length, 0)} individual line items across {trades.length} trade packages
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 pb-4">
                All work to local building code, permit requirements, and AHJ standards. Contractor responsible for obtaining all sub-permits unless noted. <span className="font-semibold text-blue-600">Blue spec lines</span> are material/installation specifications that must be honored to avoid Change Order.
              </p>
              <div className="space-y-3">
                {trades.map(trade => (
                  <TradeSection
                    key={trade.id}
                    trade={trade}
                    totalCost={totalCost}
                    sqftAdd={assumptions.sqftAdd}
                    ganttDuration={getGanttDuration(trade.id)}
                    override={editState.tradeOverrides[trade.id]}
                    onBudgetChange={handleTradeBudgetChange}
                    onDurationChange={handleTradeDurationChange}
                  />
                ))}
              </div>
            </section>

            {/* Finishes Schedule */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Palette size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Finishes Schedule</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {finishesSchedule.filter(r => r.source === 'aria').length > 0
                      ? `${finishesSchedule.filter(r => r.source === 'aria').length} materials pre-selected by Aria from homeowner's Pinterest board`
                      : 'Homeowner-specified materials and finishes'}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-500">Surface</th>
                      <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-500">Material / Spec</th>
                      <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-500">Color / Finish</th>
                      <th className="text-left py-2 text-xs font-bold uppercase tracking-wider text-gray-500">Budget Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishesSchedule.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-semibold text-gray-900">{row.surface}</td>
                        <td className="py-3 pr-4 text-gray-700">
                          {row.spec}
                          {row.source === 'aria' && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-pink-600 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded-full">
                              ✦ Aria
                            </span>
                          )}
                          {row.source === 'homeowner' && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                              ✓ Chosen
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-500">{row.color}</td>
                        <td className="py-3 font-mono text-emerald-700 font-semibold">{row.budget}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                * Finishes marked ✦ Aria were detected from homeowner's Pinterest board via AI vision. Finishes marked ✓ Chosen were manually selected by the homeowner in the Design Package. All others are standard allowance items.
              </p>
            </section>

            {/* Special Instructions */}
            {specialInstructions && (
              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <Info size={18} className="text-amber-600" />
                  Homeowner Special Instructions
                </h2>
                <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {specialInstructions}
                </p>
              </section>
            )}

            {/* Allowances */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Allowances</h2>
                  <p className="text-xs text-gray-500">Included in fixed price. Overages require Change Order approval.</p>
                </div>
              </div>
              <div className="space-y-2">
                {allowances.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div>
                      <span className="font-medium text-gray-800 text-sm">{a.label}</span>
                      <span className="ml-2 text-xs text-gray-400">{a.note}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">${a.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50 mt-2">
                  <span className="font-bold text-emerald-800">Total Allowances (included in bid)</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ${allowances.reduce((s, a) => s + a.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            {/* Exclusions */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Exclusions from This SOW</h2>
              <ul className="text-sm text-gray-600 space-y-2">
                {[
                  'HOA approval or architectural committee submissions — homeowner responsibility',
                  'Survey, soils report, or geotechnical report unless required by permit department',
                  'Landscaping beyond disturbed areas in construction footprint',
                  'Furniture, window treatments, and decorative items',
                  'Appliance purchase (installation labor included per allowance)',
                  'Any work not specifically listed in this SOW — requires written Change Order',
                  'Hazmat / asbestos abatement (if discovered, additional Change Order required)',
                  'Site utility upgrades beyond meter (water, gas, electric — utility company jurisdiction)',
                ].map((ex, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-300 mt-1">—</span>
                    {ex}
                  </li>
                ))}
              </ul>
            </section>

            {/* Milestone Payment Schedule */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Milestone Payment Schedule</h2>
                  <p className="text-xs text-gray-500">Funds held in escrow; released within 48 hrs of milestone verification</p>
                </div>
              </div>
              <div className="space-y-3">
                {milestones.map((m, i) => {
                  const amt = Math.round((m.pct / 100) * totalCost);
                  return (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 items-start">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{m.phase}</span>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-emerald-700">${amt.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 block">{m.pct}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-900 bg-gray-900 text-white">
                  <span className="font-bold">Total Fixed Price</span>
                  <span className="font-mono font-bold text-lg">${totalCost.toLocaleString()}</span>
                </div>
              </div>
            </section>

          </div>

          {/* ── Right: Sign-off Form ── */}
          <div id="portal-signoff" className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-24 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <FileSignature size={20} />
                  <h3 className="text-lg font-bold">Contractor Sign-off</h3>
                </div>
                <p className="text-blue-100 text-xs leading-relaxed">
                  By signing, you commit to the full SOW at the stated fixed price. Changes require a written Change Order via ExpandEase.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Total Fixed Price Bid
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input
                        type="text"
                        value={formData.bidAmount}
                        onChange={e => setFormData({ ...formData, bidAmount: e.target.value })}
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg font-bold"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">ExpandEase estimate: ${totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Estimated Duration (Weeks)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedWeeks}
                      onChange={e => setFormData({ ...formData, estimatedWeeks: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                      required
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Contractor Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.contractorName}
                      onChange={e => setFormData({ ...formData, contractorName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Company</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="LLC / Inc"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">License #</label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                        placeholder="AZ ROC #..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Acknowledgements */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contractor Acknowledgements</p>
                  {[
                    { key: 'scope' as const, text: 'I agree to the full Statement of Work as detailed above — all trades, specs, and sub-components.' },
                    { key: 'fixedPrice' as const, text: 'My bid is a fixed price covering all scoped work. No hidden costs or material escalation clauses.' },
                    { key: 'milestones' as const, text: 'I accept the escrow milestone payment schedule with 48-hour release windows.' },
                    { key: 'changeOrder' as const, text: 'Any scope changes must go through the ExpandEase Change Order system before work begins.' },
                  ].map(item => (
                    <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                      <div className="pt-0.5">
                        <div
                          onClick={() => setAgreed(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                            agreed[item.key]
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300 group-hover:border-blue-400'
                          }`}
                        >
                          {agreed[item.key] && <CheckCircle2 size={13} className="text-white" />}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 leading-relaxed">{item.text}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                    canSubmit
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                      <AlertCircle size={20} />
                    </motion.div>
                  ) : (
                    <>
                      <FileSignature size={20} />
                      Sign & Generate Golden Record
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={13} /> Legally binding — stored on ExpandEase
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ── Construction Schedule Gantt (full width) ── */}
        <div id="portal-gantt" className="mt-8">
          <ProjectGantt totalWeeks={assumptions.timelineWeeks} totalCost={totalCost} />
        </div>

        {/* ── Integrated Permitting & Stamping Workflow ── */}
        <div id="portal-stamping" className="mt-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
              <Stamp size={22} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Integrated Permitting & Plan Stamping</h2>
              <p className="text-slate-400 text-sm">Every permit, inspection, and stamp — managed inside the project, not in a filing cabinet.</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm mt-3 mb-8 max-w-3xl leading-relaxed">
            ExpandEase is the first platform to treat permitting as a <span className="text-emerald-400 font-semibold">first-class construction workflow</span>, not an afterthought.
            Plans are stamped by licensed professionals, permit applications are pre-filled from your SOW data, and every required inspection is sequenced directly into the Gantt timeline above.
          </p>

          {/* Stamping workflow steps */}
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            {[
              { step: 1, icon: LayoutList, title: 'SOW → Drawing Set', desc: 'AI converts your verified SOW into a preliminary drawing set with structural, MEP, and site plans.' },
              { step: 2, icon: Eye,        title: 'PE / Architect Review', desc: 'Licensed professional engineer reviews plans for code compliance and structural adequacy.' },
              { step: 3, icon: Stamp,      title: 'Plans Stamped', desc: 'Stamped drawings with PE seal, ready for AHJ submission. Digital + wet-stamp copies generated.' },
              { step: 4, icon: Send,       title: 'Permit Submitted', desc: 'Pre-filled application package submitted to your jurisdiction with all required attachments.' },
              { step: 5, icon: Award,      title: 'Permit Issued', desc: 'Permit number tracked in project. Inspection schedule auto-populates into Gantt milestones.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-4 h-full hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center">{s.step}</span>
                    <s.icon size={16} className="text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
                {i < 4 && <div className="hidden md:block absolute top-1/2 -right-2.5 w-5 text-slate-500 text-center">→</div>}
              </div>
            ))}
          </div>

          {/* Inspection checklist preview */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ClipboardCheck size={15} />
              Required Inspections — Auto-sequenced from Permit
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { name: 'Foundation / Footing', timing: 'Before pour', gate: 'FDN Milestone' },
                { name: 'Framing / Structural', timing: 'Before close-in', gate: 'FRM Milestone' },
                { name: 'Electrical Rough-in',  timing: 'Before drywall', gate: 'MEP Milestone' },
                { name: 'Plumbing Rough-in',    timing: 'Before drywall', gate: 'MEP Milestone' },
                { name: 'Mechanical (HVAC)',     timing: 'Before drywall', gate: 'MEP Milestone' },
                { name: 'Insulation',            timing: 'Before drywall', gate: 'DRY Milestone' },
                { name: 'Final / CO',            timing: 'Before occupancy', gate: 'CO Milestone' },
              ].map((insp, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-700/50 rounded-lg px-3 py-2.5">
                  <div className="w-4 h-4 mt-0.5 rounded border border-slate-500 shrink-0 flex items-center justify-center">
                    <span className="text-[8px] text-slate-500">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">{insp.name}</p>
                    <p className="text-[10px] text-slate-400">{insp.timing} · Linked → {insp.gate}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500 italic">
              Each inspection is auto-linked to its Gantt milestone. The contractor cannot sign off on a phase until the corresponding inspection passes.
            </p>
          </div>

          {/* AI + Platform value callout */}
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/30 rounded-xl p-4">
              <Sparkles size={18} className="text-violet-400 mb-2" />
              <h4 className="text-sm font-bold mb-1">Aria AI Companion</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Aria flags permit issues before submission, suggests code-compliant alternatives, and auto-generates inspection checklists from your jurisdiction's requirements.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-4">
              <Zap size={18} className="text-amber-400 mb-2" />
              <h4 className="text-sm font-bold mb-1">TurboMode™ Scheduling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">AI optimizes your construction timeline for zero idle days. Every trade is sequenced so the next crew arrives the moment the previous one finishes.</p>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/30 rounded-xl p-4">
              <Camera size={18} className="text-pink-400 mb-2" />
              <h4 className="text-sm font-bold mb-1">Photo-Verified Progress</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Contractors upload site photos at each milestone. Aria AI verifies work completion against the SOW before unlocking the next payment tranche.</p>
            </div>
          </div>
        </div>

        {/* ── Audit Trail — immutable transaction ledger ── */}
        <section className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <History size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Change Audit Trail</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Every assumption change is recorded as an immutable transaction. This ledger is saved with the contractor's proposal.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                {editState.auditTrail.length} entries
              </span>
            </div>
          </div>

          {editState.auditTrail.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                <History size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No changes recorded yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Edit any trade's $/sqft rate, phase duration, or project assumptions to start the audit trail.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200">
                    <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-12">#</th>
                    <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-28">Time</th>
                    <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Change</th>
                    <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-32">Old Value</th>
                    <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-8"></th>
                    <th className="text-left py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-32">New Value</th>
                    <th className="text-right py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 w-28">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {editState.auditTrail.map((entry, idx) => {
                    const isReset = entry.field === 'ALL CHANGES';
                    const isNegative = entry.delta.startsWith('-');
                    const isPositive = entry.delta.startsWith('+');
                    return (
                      <tr
                        key={entry.seq}
                        className={`border-b border-gray-100 ${isReset ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${idx === 0 ? 'ring-1 ring-inset ring-blue-100 bg-blue-50/30' : ''}`}
                      >
                        <td className="py-2.5 px-4 font-mono text-xs text-gray-400 font-bold">
                          {entry.seq}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className={`py-2.5 px-4 font-medium ${isReset ? 'text-red-700' : 'text-gray-900'}`}>
                          {entry.field}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-500 text-xs">
                          {entry.oldValue}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <ArrowRight size={10} className="text-gray-300 mx-auto" />
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-900 text-xs font-bold">
                          {entry.newValue}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono text-xs font-bold ${
                          isReset ? 'text-red-600' : isPositive ? 'text-red-600' : isNegative ? 'text-emerald-600' : 'text-gray-500'
                        }`}>
                          {entry.delta}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {editState.auditTrail.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Append-only ledger — entries are never deleted
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                First change: {new Date(editState.auditTrail[editState.auditTrail.length - 1].timestamp).toLocaleTimeString()}
                {' · '}
                Latest: {new Date(editState.auditTrail[0].timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

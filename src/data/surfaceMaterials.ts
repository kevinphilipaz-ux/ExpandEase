/**
 * Curated surface material catalog for DesignPackage room finishes picker.
 * Each option has visual swatch colors, budget ranges, and tier info.
 * Aria (Venice AI) picks are injected at runtime as the first option with isAriaPick=true.
 */

export type SurfaceCategory =
  | 'Countertops'
  | 'Flooring'
  | 'Cabinets'
  | 'Backsplash'
  | 'Walls'
  | 'Bath Tile'
  | 'Exterior Siding'
  | 'Trim & Millwork';

export interface MaterialOption {
  id: string;
  label: string;
  material: string;
  color: string;
  /** 1-3 CSS hex colors for the visual swatch */
  swatchColors: string[];
  budgetLow: number;
  budgetHigh: number;
  tier: 'standard' | 'premium' | 'luxury';
  /** Set at runtime when this is an Aria-detected pick */
  isAriaPick?: boolean;
}

export const SURFACE_CATALOG: Record<SurfaceCategory, MaterialOption[]> = {
  Countertops: [
    {
      id: 'cnt-calacatta',
      label: 'Calacatta Quartz',
      material: 'Calacatta quartz',
      color: 'White with soft grey veining',
      swatchColors: ['#F5F2EE', '#E0D8D0', '#C4B8AE'],
      budgetLow: 7000,
      budgetHigh: 12000,
      tier: 'luxury',
    },
    {
      id: 'cnt-white-quartz',
      label: 'White Quartz',
      material: 'Engineered quartz',
      color: 'Clean white, minimal pattern',
      swatchColors: ['#FAFAF8', '#F2EEEA'],
      budgetLow: 5000,
      budgetHigh: 9000,
      tier: 'premium',
    },
    {
      id: 'cnt-granite',
      label: 'Granite',
      material: 'Natural granite',
      color: 'Natural stone with movement',
      swatchColors: ['#6B5F55', '#4A4540', '#8C7E72'],
      budgetLow: 4000,
      budgetHigh: 8000,
      tier: 'premium',
    },
    {
      id: 'cnt-concrete',
      label: 'Concrete',
      material: 'Polished concrete',
      color: 'Warm grey, matte finish',
      swatchColors: ['#A8A09A', '#8C847E'],
      budgetLow: 7000,
      budgetHigh: 14000,
      tier: 'luxury',
    },
    {
      id: 'cnt-butcher-block',
      label: 'Butcher Block',
      material: 'Hard maple',
      color: 'Warm natural wood',
      swatchColors: ['#D4A96A', '#C49558'],
      budgetLow: 1800,
      budgetHigh: 4500,
      tier: 'standard',
    },
  ],

  Flooring: [
    {
      id: 'flr-white-oak',
      label: 'White Oak',
      material: 'White oak hardwood',
      color: 'Natural, matte finish',
      swatchColors: ['#D4C4A8', '#C4B090', '#B89C78'],
      budgetLow: 15000,
      budgetHigh: 24000,
      tier: 'luxury',
    },
    {
      id: 'flr-eng-hardwood',
      label: 'Engineered Wood',
      material: 'Engineered hardwood',
      color: 'Medium warm tones',
      swatchColors: ['#C4A87A', '#B89060'],
      budgetLow: 10000,
      budgetHigh: 20000,
      tier: 'premium',
    },
    {
      id: 'flr-lvp',
      label: 'Luxury Vinyl',
      material: 'LVP (luxury vinyl plank)',
      color: 'Wood-look, 100% waterproof',
      swatchColors: ['#B8A88C', '#A89878'],
      budgetLow: 7000,
      budgetHigh: 13000,
      tier: 'standard',
    },
    {
      id: 'flr-large-tile',
      label: 'Large Porcelain',
      material: 'Large-format porcelain tile',
      color: 'Neutral stone look',
      swatchColors: ['#D4CCC4', '#C4BCB4'],
      budgetLow: 10000,
      budgetHigh: 20000,
      tier: 'premium',
    },
    {
      id: 'flr-walnut',
      label: 'Walnut',
      material: 'Solid walnut hardwood',
      color: 'Rich dark brown',
      swatchColors: ['#5C4033', '#4A3028'],
      budgetLow: 20000,
      budgetHigh: 35000,
      tier: 'luxury',
    },
  ],

  Cabinets: [
    {
      id: 'cab-white-shaker',
      label: 'White Shaker',
      material: 'Painted shaker MDF',
      color: 'Warm white, aged brass hardware',
      swatchColors: ['#F5F0EB', '#EDE8E2'],
      budgetLow: 18000,
      budgetHigh: 32000,
      tier: 'premium',
    },
    {
      id: 'cab-navy',
      label: 'Navy Blue',
      material: 'Painted MDF',
      color: 'Deep navy, matte',
      swatchColors: ['#1E2D4A', '#263755'],
      budgetLow: 15000,
      budgetHigh: 28000,
      tier: 'premium',
    },
    {
      id: 'cab-natural-oak',
      label: 'Natural Oak',
      material: 'White oak veneer',
      color: 'Natural honey tone',
      swatchColors: ['#C4A870', '#B89858'],
      budgetLow: 22000,
      budgetHigh: 42000,
      tier: 'luxury',
    },
    {
      id: 'cab-sage',
      label: 'Sage Green',
      material: 'Painted MDF',
      color: 'Muted sage, matte finish',
      swatchColors: ['#7A9080', '#6A8070'],
      budgetLow: 15000,
      budgetHigh: 28000,
      tier: 'premium',
    },
    {
      id: 'cab-charcoal',
      label: 'Two-Tone Charcoal',
      material: 'Dark lowers, white uppers',
      color: 'Charcoal lower / white upper',
      swatchColors: ['#3A3A3A', '#F5F0EB'],
      budgetLow: 20000,
      budgetHigh: 38000,
      tier: 'luxury',
    },
  ],

  Backsplash: [
    {
      id: 'bsp-zellige',
      label: 'Zellige Tile',
      material: 'Zellige handmade tile',
      color: 'Warm cream, hand-glazed',
      swatchColors: ['#E8DCC8', '#D4C8B0'],
      budgetLow: 3000,
      budgetHigh: 7000,
      tier: 'luxury',
    },
    {
      id: 'bsp-subway',
      label: 'Subway Tile',
      material: 'Ceramic subway tile',
      color: 'Bright white, clean grout',
      swatchColors: ['#FAFAFA', '#F0EDEA'],
      budgetLow: 1500,
      budgetHigh: 4000,
      tier: 'standard',
    },
    {
      id: 'bsp-marble-slab',
      label: 'Marble Slab',
      material: 'Carrara marble',
      color: 'White with grey veining',
      swatchColors: ['#F5F3F0', '#EBE8E4'],
      budgetLow: 5000,
      budgetHigh: 10000,
      tier: 'luxury',
    },
    {
      id: 'bsp-terracotta',
      label: 'Terracotta',
      material: 'Mexican terracotta tile',
      color: 'Warm orange-terracotta',
      swatchColors: ['#C4704A', '#B86040'],
      budgetLow: 2000,
      budgetHigh: 5000,
      tier: 'standard',
    },
  ],

  Walls: [
    {
      id: 'wal-white',
      label: 'White Paint',
      material: 'Premium interior paint',
      color: 'Soft warm white',
      swatchColors: ['#FAFAF8', '#F5F2EE'],
      budgetLow: 2500,
      budgetHigh: 5000,
      tier: 'standard',
    },
    {
      id: 'wal-shiplap',
      label: 'Shiplap',
      material: 'Painted shiplap / board & batten',
      color: 'White or off-white',
      swatchColors: ['#F5F0EB', '#EAE0D8'],
      budgetLow: 4000,
      budgetHigh: 10000,
      tier: 'premium',
    },
    {
      id: 'wal-venetian',
      label: 'Venetian Plaster',
      material: 'Venetian plaster',
      color: 'Warm ivory, textured sheen',
      swatchColors: ['#E8E0D4', '#D8D0C4'],
      budgetLow: 6000,
      budgetHigh: 14000,
      tier: 'luxury',
    },
    {
      id: 'wal-sage',
      label: 'Sage / Earthy',
      material: 'Designer paint',
      color: 'Muted sage or warm terracotta',
      swatchColors: ['#8C9C8C', '#B87A5A'],
      budgetLow: 3000,
      budgetHigh: 6000,
      tier: 'standard',
    },
  ],

  'Bath Tile': [
    {
      id: 'bt-marble',
      label: 'Marble',
      material: 'Carrara marble tile',
      color: 'White with soft grey veining',
      swatchColors: ['#F5F3F0', '#EBE8E4'],
      budgetLow: 5000,
      budgetHigh: 12000,
      tier: 'luxury',
    },
    {
      id: 'bt-large-porcelain',
      label: 'Large Porcelain',
      material: 'Large-format porcelain',
      color: 'Light grey stone look',
      swatchColors: ['#D4D0CC', '#C8C4C0'],
      budgetLow: 4000,
      budgetHigh: 9000,
      tier: 'premium',
    },
    {
      id: 'bt-subway',
      label: 'Subway',
      material: 'White ceramic subway',
      color: 'Classic white, clean',
      swatchColors: ['#FAFAFA', '#F5F2EE'],
      budgetLow: 2000,
      budgetHigh: 5000,
      tier: 'standard',
    },
    {
      id: 'bt-zellige',
      label: 'Zellige',
      material: 'Zellige handmade tile',
      color: 'Warm white, textured',
      swatchColors: ['#E8DECE', '#D8CEBE'],
      budgetLow: 4000,
      budgetHigh: 8000,
      tier: 'luxury',
    },
  ],

  'Exterior Siding': [
    {
      id: 'ext-hardie',
      label: 'Hardie Board',
      material: 'James Hardie fiber cement',
      color: 'Durable, paint-ready',
      swatchColors: ['#8A9A8A', '#6A8070'],
      budgetLow: 14000,
      budgetHigh: 24000,
      tier: 'premium',
    },
    {
      id: 'ext-stucco',
      label: 'Stucco',
      material: 'Textured stucco',
      color: 'Warm white or desert tan',
      swatchColors: ['#E8E0D4', '#C8BEB0'],
      budgetLow: 13000,
      budgetHigh: 22000,
      tier: 'standard',
    },
    {
      id: 'ext-stone',
      label: 'Stone Veneer',
      material: 'Natural or cultured stone',
      color: 'Natural grey/tan tones',
      swatchColors: ['#9A9088', '#7A7068'],
      budgetLow: 20000,
      budgetHigh: 40000,
      tier: 'luxury',
    },
    {
      id: 'ext-wood',
      label: 'Cedar Siding',
      material: 'Cedar or redwood siding',
      color: 'Natural warm cedar',
      swatchColors: ['#A87848', '#885828'],
      budgetLow: 20000,
      budgetHigh: 35000,
      tier: 'luxury',
    },
  ],

  'Trim & Millwork': [
    {
      id: 'trm-crown',
      label: 'Crown Molding',
      material: 'Painted MDF crown & base',
      color: 'Crisp white',
      swatchColors: ['#FAFAFA', '#F5F2EE'],
      budgetLow: 3000,
      budgetHigh: 7000,
      tier: 'standard',
    },
    {
      id: 'trm-wainscoting',
      label: 'Wainscoting',
      material: 'Board & batten wainscoting',
      color: 'White or off-white',
      swatchColors: ['#F5F2EE', '#EDE8E2'],
      budgetLow: 4000,
      budgetHigh: 9000,
      tier: 'premium',
    },
    {
      id: 'trm-custom',
      label: 'Custom Coffered',
      material: 'Coffered ceilings + built-ins',
      color: 'White paint or natural wood',
      swatchColors: ['#FAFAFA', '#D4C4A8'],
      budgetLow: 10000,
      budgetHigh: 22000,
      tier: 'luxury',
    },
    {
      id: 'trm-minimal',
      label: 'Minimal / Clean',
      material: 'Simple painted baseboards',
      color: 'White',
      swatchColors: ['#FFFFFF'],
      budgetLow: 1500,
      budgetHigh: 4000,
      tier: 'standard',
    },
  ],
};

/** Which surface categories are relevant for each room type */
export const ROOM_SURFACES: Record<string, SurfaceCategory[]> = {
  kitchen: ['Countertops', 'Cabinets', 'Backsplash', 'Flooring'],
  master: ['Flooring', 'Bath Tile', 'Walls'],
  living: ['Flooring', 'Walls', 'Trim & Millwork'],
  outdoor: ['Exterior Siding'],
  garage: ['Exterior Siding'],
  bathroom: ['Bath Tile', 'Walls'],
};

/** Tier display helpers */
export const TIER_LABEL: Record<string, string> = {
  standard: 'Standard',
  premium: 'Premium',
  luxury: 'Luxury',
};

export const TIER_COLOR: Record<string, string> = {
  standard: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
  premium: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
  luxury: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
};

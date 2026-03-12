/**
 * Single source of truth for feature/component costs and ROI.
 * Used by PropertyWishlist (display + calculate), TinderMode (swipe cards),
 * and itemizedCosts (ItemizedBill breakdown).
 */

export interface ComponentEstimate {
  cost: number;
  roi: number;
}

export const COMPONENT_ESTIMATES: Record<string, ComponentEstimate> = {
  // ── Room features ──────────────────────────────────────────────────
  'Walk-in Closet':   { cost:  8500, roi: 0.95 },
  'En-suite Bath':    { cost: 28000, roi: 0.88 },
  'Sitting Area':     { cost:  6000, roi: 0.75 },
  'Ceiling Fan':      { cost:   800, roi: 0.70 },
  'Bay Window':       { cost:  4500, roi: 0.85 },
  'Balcony Access':   { cost: 12000, roi: 0.80 },
  'Vaulted Ceiling':  { cost: 15000, roi: 0.90 },
  'Hardwood Floors':  { cost:  9000, roi: 1.00 },

  // ── Kitchen features ───────────────────────────────────────────────
  'Gas Range':               { cost:  2500, roi: 0.85 },
  'Double Oven':             { cost:  4000, roi: 0.80 },
  'French Door Fridge':      { cost:  3500, roi: 0.75 },
  'Dishwasher Drawer':       { cost:  1200, roi: 0.70 },
  'Wine Cooler':             { cost:  2200, roi: 0.60 },
  'Pot Filler':              { cost:   900, roi: 0.75 },
  'Island with Seating':     { cost: 12000, roi: 0.95 },
  'Walk-in Pantry':          { cost: 15000, roi: 0.90 },
  'Under-cabinet Lighting':  { cost:   600, roi: 0.80 },
  'Pot Rack':                { cost:   400, roi: 0.50 },
  'Farm Sink':               { cost:  1800, roi: 0.85 },
  'Garbage Disposal':        { cost:   400, roi: 0.60 },

  // ── Bathroom features ──────────────────────────────────────────────
  'Rain Shower':      { cost:  1800, roi: 0.85 },
  'Freestanding Tub': { cost:  4500, roi: 0.80 },
  'Double Vanity':    { cost:  3500, roi: 0.90 },
  'Smart Toilet':     { cost:  2200, roi: 0.70 },
  'Vessel Sinks':     { cost:  1200, roi: 0.75 },
  'Heated Towel Bar': { cost:   500, roi: 0.65 },
  'Heated Floors':    { cost:  2800, roi: 0.85 },
  'Subway Tile':      { cost:  1500, roi: 0.80 },
  'Mosaic Accent':    { cost:  2200, roi: 0.75 },
  'Slab Shower':      { cost:  5500, roi: 0.80 },
  'Natural Stone':    { cost:  4000, roi: 0.85 },
  'Large Format':     { cost:  3200, roi: 0.80 },
  'Steam Shower':     { cost:  6500, roi: 0.75 },
  'Bidet':            { cost:   800, roi: 0.70 },
  'Walk-in Shower':   { cost:  5000, roi: 0.90 },
  'Makeup Vanity':    { cost:  2500, roi: 0.80 },
  'Linen Closet':     { cost:  3500, roi: 0.85 },
  'Skylight':         { cost:  2800, roi: 0.80 },

  // ── Interior details ────────────────────────────────────────────────
  'Crown Molding':    { cost:  3500, roi: 0.85 },
  'Wainscoting':      { cost:  4500, roi: 0.80 },
  'Coffered Ceiling': { cost:  8000, roi: 0.85 },
  'Built-in Shelves': { cost:  4000, roi: 0.90 },
  'Fireplace':        { cost: 12000, roi: 0.90 },
  'Wet Bar':          { cost: 15000, roi: 0.75 },
  'Home Office':      { cost: 10000, roi: 0.85 },
  'Laundry Room':     { cost: 14000, roi: 0.90 },

  // ── Exterior — siding / door / window ──────────────────────────────
  'Stucco':                    { cost: 18000, roi: 0.80 },
  'Brick':                     { cost: 22000, roi: 0.85 },
  'Stone Veneer':              { cost: 14000, roi: 0.65 },
  'Hardie Board':              { cost: 19000, roi: 0.90 },
  'Wood Siding':               { cost: 24000, roi: 0.95 },
  'Metal Accents':             { cost:  6000, roi: 0.75 },
  'Energy Efficient Windows':  { cost: 12000, roi: 0.85 },
  'French Doors':              { cost:  4500, roi: 0.88 },
  'Sliding Glass Door':        { cost:  3500, roi: 0.82 },
  'Entry Door Upgrade':        { cost:  2800, roi: 0.90 },
  'Skylights':                 { cost:  3500, roi: 0.78 },
  'Transom Windows':           { cost:  2200, roi: 0.80 },

  // ── Outdoor ────────────────────────────────────────────────────────
  'Covered Patio':    { cost: 18000, roi: 0.85 },
  'Outdoor Kitchen':  { cost: 25000, roi: 0.75 },
  'Fire Pit':         { cost:  4500, roi: 0.80 },
  'Pergola':          { cost:  8000, roi: 0.78 },
  'Sprinkler System': { cost:  4500, roi: 0.65 },
  'Fencing':          { cost:  8000, roi: 0.75 },
  'Xeriscaping':      { cost:  6000, roi: 0.70 },
  'Lawn Installation':{ cost:  5000, roi: 0.60 },
  'Tree Planting':    { cost:  2500, roi: 0.75 },
  'Garden Beds':      { cost:  3500, roi: 0.80 },
  'Lighting':         { cost:  3000, roi: 0.85 },
  'Water Features':   { cost: 12000, roi: 0.70 },

  // ── Systems ────────────────────────────────────────────────────────
  'New AC Unit':       { cost:  8000, roi: 0.70 },
  'Furnace Upgrade':   { cost:  5000, roi: 0.75 },
  'Smart Thermostat':  { cost:   500, roi: 0.80 },
  'Zoned System':      { cost: 12000, roi: 0.75 },
  'Air Purification':  { cost:  3000, roi: 0.65 },
  'Ductwork':          { cost:  6000, roi: 0.70 },
  'Panel Upgrade':     { cost:  4000, roi: 0.80 },
  'EV Charger':        { cost:  2000, roi: 0.85 },
  'Generator':         { cost:  8000, roi: 0.70 },
  'Smart Lighting':    { cost:  3000, roi: 0.75 },
  'Surge Protection':  { cost:  1000, roi: 0.60 },
  'Rewiring':          { cost: 15000, roi: 0.75 },
  'Solar':             { cost: 18000, roi: 0.75 },
  'Repipe':            { cost: 12000, roi: 0.70 },
  'Water Heater':      { cost:  3000, roi: 0.75 },
  'Tankless':          { cost:  6000, roi: 0.80 },
  'Water Softener':    { cost:  2000, roi: 0.65 },
  'Sump Pump':         { cost:  2000, roi: 0.85 },
  'Sewer Line':        { cost:  8000, roi: 0.65 },

  // ── Home styles (design-level exterior/curb impact) ────────────────
  'Modern':        { cost:     0, roi: 1.00 },
  'Craftsman':     { cost:  8000, roi: 0.92 },
  'Colonial':      { cost:  6000, roi: 0.90 },
  'Mediterranean': { cost: 12000, roi: 0.85 },
  'Farmhouse':     { cost: 10000, roi: 0.90 },
  'Contemporary':  { cost:  5000, roi: 0.88 },
  'Ranch':         { cost:     0, roi: 1.00 },
  'Victorian':     { cost: 18000, roi: 0.82 },
  'Traditional':   { cost: 10000, roi: 0.88 },

  // ── Whole-home flooring (size-based) ──────────────────────────────
  'Carpet':   { cost: 22000, roi: 0.70 },
  'Laminate': { cost: 35000, roi: 0.80 },
  'Hardwood': { cost: 55000, roi: 1.10 },
  'Tile':     { cost: 48000, roi: 0.90 },

  // ── Pool ──────────────────────────────────────────────────────────
  'Basic':    { cost:  45000, roi: 0.60 },
  'Standard': { cost:  95000, roi: 0.40 },
  'Luxury':   { cost: 125000, roi: 0.70 },
};

/**
 * Per-feature Unsplash image URLs.
 * Shows the actual finished feature rather than a generic category photo.
 * Falls back to CATEGORY_IMAGES in TinderMode for unmapped items.
 */
export const FEATURE_IMAGES: Record<string, string> = {
  // ── Room features ──────────────────────────────────────────────────
  'Walk-in Closet':   'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=400&fit=crop',
  'En-suite Bath':    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
  'Sitting Area':     'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
  'Bay Window':       'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=400&fit=crop',
  'Balcony Access':   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
  'Vaulted Ceiling':  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&h=400&fit=crop',
  'Hardwood Floors':  'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&h=400&fit=crop',

  // ── Kitchen features ───────────────────────────────────────────────
  'Gas Range':               'https://images.unsplash.com/photo-1556910096-6f5e72db68cd?w=600&h=400&fit=crop',
  'Island with Seating':     'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&h=400&fit=crop',
  'Walk-in Pantry':          'https://images.unsplash.com/photo-1556909195-b2f7b5c9b1c3?w=600&h=400&fit=crop',
  'Farm Sink':               'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  'Wine Cooler':             'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop',
  'Under-cabinet Lighting':  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',

  // ── Bathroom features ──────────────────────────────────────────────
  'Rain Shower':      'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&h=400&fit=crop',
  'Freestanding Tub': 'https://images.unsplash.com/photo-1552193049-b00b4a95d4e8?w=600&h=400&fit=crop',
  'Double Vanity':    'https://images.unsplash.com/photo-1620626011761-996317702149?w=600&h=400&fit=crop',
  'Steam Shower':     'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&h=400&fit=crop',
  'Walk-in Shower':   'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
  'Heated Floors':    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
  'Makeup Vanity':    'https://images.unsplash.com/photo-1620626011761-996317702149?w=600&h=400&fit=crop',
  'Slab Shower':      'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&h=400&fit=crop',
  'Natural Stone':    'https://images.unsplash.com/photo-1584622650303-b8e7e4f15244?w=600&h=400&fit=crop',
  'Skylight':         'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&h=400&fit=crop',

  // ── Interior details ────────────────────────────────────────────────
  'Crown Molding':    'https://images.unsplash.com/photo-1600210491892-03d54fall3af?w=600&h=400&fit=crop',
  'Coffered Ceiling': 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&h=400&fit=crop',
  'Built-in Shelves': 'https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=600&h=400&fit=crop',
  'Fireplace':        'https://images.unsplash.com/photo-1534119428213-bd2626145164?w=600&h=400&fit=crop',
  'Wet Bar':          'https://images.unsplash.com/photo-1572450226484-64c3e5e4c7ba?w=600&h=400&fit=crop',
  'Home Office':      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=400&fit=crop',
  'Wainscoting':      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop',
  'Laundry Room':     'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=400&fit=crop',

  // ── Exterior ─────────────────────────────────────────────────────
  'Wood Siding':               'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop',
  'Brick':                     'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
  'Hardie Board':              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'Stone Veneer':              'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
  'French Doors':              'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=400&fit=crop',
  'Energy Efficient Windows':  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'Entry Door Upgrade':        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
  'Sliding Glass Door':        'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=400&fit=crop',

  // ── Outdoor ────────────────────────────────────────────────────────
  'Covered Patio':    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop',
  'Outdoor Kitchen':  'https://images.unsplash.com/photo-1558618047-3b8f0b2e4f97?w=600&h=400&fit=crop',
  'Fire Pit':         'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=400&fit=crop&q=80',
  'Pergola':          'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=600&h=400&fit=crop',
  'Water Features':   'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=600&h=400&fit=crop',
  'Fencing':          'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',

  // ── Systems ────────────────────────────────────────────────────────
  'Solar':           'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop',
  'EV Charger':      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&h=400&fit=crop',
  'Smart Thermostat':'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop',
  'Generator':       'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',

  // ── Flooring ────────────────────────────────────────────────────────
  'Hardwood':   'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&h=400&fit=crop',
  'Tile':       'https://images.unsplash.com/photo-1584622650303-b8e7e4f15244?w=600&h=400&fit=crop',
  'Laminate':   'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&h=400&fit=crop',
  'Carpet':     'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',

  // ── Pool ──────────────────────────────────────────────────────────
  'Basic':    'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&h=400&fit=crop',
  'Standard': 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&h=400&fit=crop',
  'Luxury':   'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop',
};

/**
 * Brief educational descriptions for each feature shown on Turbo Mode swipe cards.
 * Teaches buyers why a feature matters in 1–2 punchy sentences.
 */
export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // ── Room features ──────────────────────────────────────────────────
  'Walk-in Closet':   'A must-have for master suites — buyers consistently rank it as a top-3 feature and appraisers reward it with higher per-sq-ft comps.',
  'En-suite Bath':    'Private bathrooms attached to bedrooms are near-mandatory for luxury buyers and can justify a premium of $15–30K on the sale price.',
  'Sitting Area':     'Transforms a bedroom into a private retreat. Popular in master suites, it signals spacious living without adding a full room.',
  'Ceiling Fan':      'One of the highest-ROI upgrades at any price point — buyers notice their absence and sellers often add them pre-listing.',
  'Bay Window':       'Adds natural light and visual square footage. Buyers perceive rooms as larger even when the footprint hasn\'t changed.',
  'Balcony Access':   'Outdoor connectivity from a bedroom commands a strong premium, especially in markets where indoor-outdoor living is prized.',
  'Vaulted Ceiling':  'The fastest way to make a room feel grand without expanding the footprint — a strong signal of quality construction.',
  'Hardwood Floors':  'The single most requested flooring by buyers and one of the few features that consistently returns more than it costs.',

  // ── Kitchen features ───────────────────────────────────────────────
  'Gas Range':               'Professional buyers prefer gas for precise heat control. It signals a "serious" kitchen and is often listed as a requirement.',
  'Double Oven':             'Beloved by families and entertainers alike. Doubles cooking capacity and signals a well-thought-out kitchen layout.',
  'French Door Fridge':      'The most popular fridge style with buyers — maximizes visibility and pairs well with premium kitchen renovations.',
  'Dishwasher Drawer':       'A space-efficient luxury detail that separates mid-range from high-end kitchens in buyer perception.',
  'Wine Cooler':             'Signals lifestyle and entertaining — a strong differentiator in the $500K+ price range.',
  'Pot Filler':              'A small detail that carries outsized visual impact — tells buyers the kitchen was designed by someone who actually cooks.',
  'Island with Seating':     'The #1 kitchen upgrade by demand. Opens up the floor plan, creates gathering space, and drives the highest kitchen ROI.',
  'Walk-in Pantry':          'Buyers with families treat this as a dealbreaker. The organized storage lifestyle it represents is enormously appealing.',
  'Under-cabinet Lighting':  'Inexpensive but makes granite and tile pop in listing photos. A strong cost-to-impact ratio.',
  'Pot Rack':                'Frees cabinet space and adds a culinary-professional ambiance — best in kitchens with high ceilings.',
  'Farm Sink':               'An aesthetic anchor for farmhouse and modern kitchens that photographs beautifully and commands emotional appeal.',
  'Garbage Disposal':        'Considered standard in most markets — its absence can actually hurt a sale more than its presence helps.',

  // ── Bathroom features ──────────────────────────────────────────────
  'Rain Shower':      'A spa-like upgrade that photographs strikingly. Buyers associate it with hotel-quality finishes.',
  'Freestanding Tub': 'A luxury focal point that anchors master bathrooms. Strong emotional appeal that can tip buyer decisions.',
  'Double Vanity':    'Essential for couples — its absence in a master bath is one of the most common buyer complaints.',
  'Smart Toilet':     'A differentiator in luxury tier — increasingly expected in high-end builds and renovations.',
  'Vessel Sinks':     'Makes a visual statement and modernizes older bath designs instantly.',
  'Heated Towel Bar': 'A small luxury detail that signals European-style refinement — very popular in cold-climate markets.',
  'Heated Floors':    'One of the most-loved home features among owners. Rarely regretted, and buyers treat it as a bonus.',
  'Subway Tile':      'Timeless, versatile, and never feels dated — a safe choice that appeals to the widest buyer pool.',
  'Mosaic Accent':    'Adds artistic detail and visual interest. Works best as a niche wall or border to avoid overwhelming the space.',
  'Slab Shower':      'Zero-grout, zero-maintenance luxury. Sellers list it as "seamless stone shower" — buyers love it.',
  'Natural Stone':    'Commands premium pricing at resale because buyers associate it with permanence and craftsmanship.',
  'Large Format':     'Large tiles make small bathrooms look significantly bigger — great ROI in tight spaces.',
  'Steam Shower':     'A true spa feature. Adds considerable appeal in luxury markets and to wellness-focused buyers.',
  'Bidet':            'Rapidly becoming mainstream. Buyers who travel internationally now expect them in master baths.',
  'Walk-in Shower':   'Standard in most mid-range and luxury renovations. Its absence in a master bath is a red flag for buyers.',
  'Makeup Vanity':    'Signals thoughtful design. Popular with buyers who value dedicated dressing areas.',
  'Linen Closet':     'Storage is always undersold — buyers immediately notice when a bathroom lacks it.',
  'Skylight':         'Natural light in a bathroom is a premium feature. Eliminates the closed-in feeling buyers dislike.',

  // ── Interior details ────────────────────────────────────────────────
  'Crown Molding':    'Signals craftsmanship and attention to detail. Adds perceived value out of proportion to its cost.',
  'Wainscoting':      'A classic architectural detail that makes hallways and dining rooms feel more substantial.',
  'Coffered Ceiling': 'A dramatic design move that makes living rooms feel like something out of a magazine spread.',
  'Built-in Shelves': 'Buyers love built-ins because they see it as "free storage." Also hard to remove — which buyers view as commitment.',
  'Fireplace':        'Emotionally resonant for buyers — listings with fireplaces spend fewer days on market and attract higher offers.',
  'Wet Bar':          'A serious entertaining amenity in a $700K+ home. Strong signal of an elevated lifestyle.',
  'Home Office':      'Post-pandemic, a dedicated office is now a top-3 requirement for a large segment of buyers.',
  'Laundry Room':     'A dedicated laundry room consistently ranks as one of the top features buyers want. Its absence is a dealbreaker for families.',

  // ── Exterior ────────────────────────────────────────────────────────
  'Stucco':                    'Durable, low-maintenance, and fire-resistant. Dominant in sun-belt markets and commands premium pricing there.',
  'Brick':                     'The gold standard for curb appeal longevity. Buyers associate brick with permanence and low future cost.',
  'Stone Veneer':              'Adds luxury character at a fraction of full-stone cost. Popular for accent walls and entry features.',
  'Hardie Board':              'The highest ROI exterior material — durable, paintable, and preferred by buyers in rain-heavy markets.',
  'Wood Siding':               'Rich, warm aesthetic. Commands the highest premium but requires the most maintenance — a luxury choice.',
  'Metal Accents':             'A modern detail that elevates traditional exteriors and photographs extremely well.',
  'Energy Efficient Windows':  'Buyers increasingly ask for utility bills. Energy-efficient windows make those numbers attractive.',
  'French Doors':              'One of the most photographed exterior features. Creates seamless indoor-outdoor flow buyers love.',
  'Sliding Glass Door':        'The go-to for connecting living rooms to backyards — expected in any home with outdoor living.',
  'Entry Door Upgrade':        'The front door is the first thing buyers touch. A stunning entry door can shift perception of the whole home.',
  'Skylights':                 'Natural light is the most requested feature by buyers. Skylights deliver it where windows can\'t.',
  'Transom Windows':           'Adds light and architectural interest above doors. A classic detail that reads as quality craftsmanship.',

  // ── Outdoor ────────────────────────────────────────────────────────
  'Covered Patio':    'Extends usable living square footage year-round. Buyers in warm climates treat it as a second living room.',
  'Outdoor Kitchen':  'A major lifestyle feature for entertaining buyers. Increasingly expected in the $800K+ tier.',
  'Fire Pit':         'Creates an outdoor gathering focal point. Adds evening usability to outdoor spaces year-round.',
  'Pergola':          'Adds structure and shade without blocking views. A popular compromise between covered and open patios.',
  'Sprinkler System': 'Saves buyers time and preserves landscaping investment. Buyers notice when it\'s missing.',
  'Fencing':          'Privacy and safety are primary buyer concerns — fencing delivers both and is especially valued by families.',
  'Xeriscaping':      'Drought-tolerant landscaping appeals to water-conscious buyers and significantly cuts utility costs.',
  'Lawn Installation':'Curb appeal is what gets buyers through the door. A manicured lawn is the cheapest way to boost first impressions.',
  'Tree Planting':    'Mature trees add significant appraised value — buyers understand trees take years to grow.',
  'Garden Beds':      'Low cost, high charm. Signals a lovingly maintained home to buyers on their walkthrough.',
  'Lighting':         'Landscape lighting extends curb appeal to evening hours and dramatically improves listing photos.',
  'Water Features':   'A luxury statement piece. Creates a relaxing ambiance that buyers remember after every other house blurs together.',

  // ── Systems ────────────────────────────────────────────────────────
  'New AC Unit':       'Buyers increasingly request HVAC inspection reports. A new unit eliminates a major negotiation chip.',
  'Furnace Upgrade':   'An older furnace is one of the first items a home inspector flags. A new one eliminates buyer concerns upfront.',
  'Smart Thermostat':  'A $500 upgrade that makes buyers feel like the home is modern and efficient. Strong perceived ROI.',
  'Zoned System':      'Multi-zone HVAC is a premium feature in larger homes — each family member controls their own temperature.',
  'Air Purification':  'Increasingly valued post-pandemic. HEPA and UV filtration systems appeal to health-conscious buyers.',
  'Ductwork':          'Updated ductwork is invisible but critical — it ensures the HVAC system actually works as rated.',
  'Panel Upgrade':     'A 200-amp panel is required for EV chargers, hot tubs, and high-end appliances. Buyers see it as future-proofing.',
  'EV Charger':        'With EV adoption accelerating, a Level 2 charger is becoming a dealbreaker for a growing segment of buyers.',
  'Generator':         'Especially valued in storm-prone markets — buyers with families see it as essential peace of mind.',
  'Smart Lighting':    'Programmable lighting scenes and motion controls signal a modern, connected home.',
  'Surge Protection':  'Inexpensive protection for expensive equipment. Sellers list it as a value-add in tech-savvy markets.',
  'Rewiring':          'Old knob-and-tube wiring is a red flag in inspection reports. Updated wiring removes a major buyer objection.',
  'Solar':             'With energy costs rising, solar panels pay for themselves faster than ever. Buyers value low utility bills.',
  'Repipe':            'PEX or copper repiping eliminates concerns about corrosion and leaks — a major buyer comfort factor.',
  'Water Heater':      'Buyers ask about water heater age in every home inspection. A new unit eliminates the concern entirely.',
  'Tankless':          'Endless hot water on demand. Buyers who\'ve had tankless before won\'t consider going back.',
  'Water Softener':    'In hard-water markets, a softener extends appliance life and is valued by buyers who know the cost.',
  'Sump Pump':         'In flood-prone areas, an operational sump pump can be the difference between a sale and a pass.',
  'Sewer Line':        'An updated sewer line removes one of the biggest unknowns in a pre-purchase inspection.',
};

/** Category-level fallback images (used when no per-feature image exists) */
export const CATEGORY_IMAGES: Record<string, string> = {
  Kitchen:   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  Bathrooms: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
  Rooms:     'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=400&fit=crop',
  Interior:  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop',
  Exterior:  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  Outdoor:   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  Systems:   'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  default:   'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
};

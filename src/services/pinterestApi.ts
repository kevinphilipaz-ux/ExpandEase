/**
 * Pinterest-style vision import — sends user's board screenshots to Venice AI vision
 * and returns structured renovation preferences mapped to ExpandEase wishlist fields.
 */

const VENICE_BASE = 'https://api.venice.ai/api/v1';
// Use a vision-capable model
const VISION_MODEL = 'qwen-2.5-vl-7b-instruct';

const VENICE_KEY =
  typeof import.meta.env?.VITE_VENICE_API_KEY === 'string'
    ? import.meta.env.VITE_VENICE_API_KEY
    : '';

export interface MaterialDetail {
  /** Surface category — e.g. "Countertops", "Flooring", "Cabinets" */
  category: string;
  /** Specific material — e.g. "Calacatta quartz", "White oak hardwood" */
  material: string;
  /** Color / finish description — e.g. "White with grey veining", "Warm honey" */
  color: string;
  /** Budget range low end in dollars (typical 2,500 sq ft home) */
  budgetLow: number;
  /** Budget range high end in dollars */
  budgetHigh: number;
  /** Short human-readable label — e.g. "Calacatta quartz countertops" */
  label: string;
}

export interface PinterestStyleResult {
  homeStyle: 'Modern' | 'Farmhouse' | 'Contemporary';
  kitchenLevel: 'Mid' | 'Premium' | 'Luxury';
  flooring: 'Hardwood' | 'Tile';
  selectedFeatures: string[];
  /** Material + color + budget picks detected from the images */
  materialDetails: MaterialDetail[];
  styleTagline: string;   // e.g. "Warm modern farmhouse with spa-like touches"
  confidence: 'high' | 'medium' | 'low';
}

const VISION_SYSTEM_PROMPT = `You are a home design AI analyzing Pinterest board screenshots to detect a homeowner's dream home aesthetic. Your job is to map what you see to specific renovation selections AND identify material, color, and budget specifics for each key surface.

AVAILABLE SELECTIONS — you MUST only use values from these exact lists:

homeStyle (pick one): "Modern", "Farmhouse", "Contemporary"

kitchenLevel (pick one): "Mid", "Premium", "Luxury"
- Mid = standard finishes, functional, clean
- Premium = quartz/stone counters, semi-custom cabinets, quality appliances
- Luxury = waterfall islands, custom cabinetry, professional-grade appliances, designer fixtures

flooring (pick one): "Hardwood", "Tile"
- Hardwood = warm wood tones, natural wood look, LVP/LVL
- Tile = stone, concrete, large-format tile, cool tones

selectedFeatures — pick ONLY from this EXACT list (use exact spelling):
Rooms: "Walk-in Closet", "En-suite Bath", "Sitting Area", "Ceiling Fan", "Bay Window", "Balcony Access", "Vaulted Ceiling", "Hardwood Floors"
Kitchen: "Wine Cooler", "Pot Filler", "Island with Seating", "Walk-in Pantry", "Under-cabinet Lighting", "Pot Rack", "Farm Sink", "Garbage Disposal"
Bathrooms: "Vessel Sinks", "Heated Towel Bar", "Heated Floors", "Subway Tile", "Steam Shower", "Bidet", "Walk-in Shower", "Makeup Vanity", "Linen Closet", "Skylight"
Interior: "Crown Molding", "Wainscoting", "Coffered Ceiling", "Built-in Shelves", "Fireplace", "Wet Bar", "Home Office", "Laundry Room"
Exterior: "New Siding", "New Windows", "New Garage Door", "New Roof", "Front Door", "Gutters"
Outdoor: "Covered Patio", "Outdoor Kitchen", "Fire Pit", "Pergola", "Sprinkler System", "Fencing"
Systems: "Solar", "Repipe", "Water Heater", "Tankless"

materialDetails — For EACH distinct surface or finish you can identify in the images, provide a material detail object. Include 3–8 items total. Each object must have:
  category: one of "Countertops", "Flooring", "Cabinets", "Backsplash", "Walls", "Bath Tile", "Exterior Siding", "Trim & Millwork"
  material: specific material name (e.g. "Calacatta quartz", "White oak hardwood", "Shaker MDF", "Zellige tile", "Brick veneer")
  color: color and finish description (e.g. "Warm white with soft grey veining", "Honey blonde", "Sage green matte", "Crisp white")
  budgetLow: integer — low end of realistic budget range in USD for a 2,500 sq ft home (just the number, no $ sign)
  budgetHigh: integer — high end of realistic budget range in USD (just the number, no $ sign)
  label: 4-8 word human-readable description (e.g. "Calacatta quartz waterfall countertops")

Budget reference ranges (typical 2,500 sq ft home):
  Countertops — Laminate: 2000–5000, Quartz: 5000–10000, Marble/Stone: 8000–18000, Granite: 4000–8000
  Flooring — LVP/LVL: 8000–14000, Engineered Hardwood: 12000–22000, Solid Hardwood: 18000–32000, Large-format Tile: 10000–20000
  Cabinets — Stock/RTA: 8000–15000, Semi-custom: 15000–30000, Custom: 28000–65000
  Backsplash — Standard subway: 1500–4000, Zellige/handmade tile: 3000–7000, Marble: 4000–9000
  Walls — Paint: 3000–6000, Shiplap/board&batten: 4000–10000, Venetian plaster: 6000–14000
  Bath Tile — Standard: 2000–5000, Marble/stone: 5000–12000, Large format porcelain: 4000–9000
  Exterior Siding — Hardie board: 15000–25000, Wood: 20000–35000, Brick: 20000–40000, Stucco: 14000–22000
  Trim & Millwork — Crown/wainscoting: 3000–8000, Full custom millwork: 8000–20000

styleTagline: A 6-10 word poetic description of the aesthetic you see

confidence: "high" if you can clearly identify the style, "medium" if mixed signals, "low" if unclear

INSTRUCTIONS:
- Be decisive. Pick the closest match even if not perfect.
- Select 6-14 features total that best match what you see in the images.
- For materialDetails, only include surfaces CLEARLY visible — do not guess if an image is unclear.
- Return ONLY a valid JSON object, no markdown, no explanation. Just JSON.

Example output:
{"homeStyle":"Farmhouse","kitchenLevel":"Luxury","flooring":"Hardwood","selectedFeatures":["Farm Sink","Island with Seating","Walk-in Pantry","Fireplace","Covered Patio","Walk-in Shower","Vessel Sinks"],"materialDetails":[{"category":"Countertops","material":"Calacatta quartz","color":"White with soft grey veining","budgetLow":7000,"budgetHigh":12000,"label":"Calacatta quartz waterfall countertops"},{"category":"Flooring","material":"White oak hardwood","color":"Natural with matte finish","budgetLow":15000,"budgetHigh":24000,"label":"Wide-plank white oak hardwood"},{"category":"Cabinets","material":"Shaker MDF","color":"Warm white with aged brass hardware","budgetLow":18000,"budgetHigh":32000,"label":"Warm white shaker cabinets"},{"category":"Backsplash","material":"Zellige tile","color":"Warm cream with hand-glazed texture","budgetLow":3500,"budgetHigh":7000,"label":"Handmade cream zellige backsplash"}],"styleTagline":"Warm modern farmhouse with spa-like touches","confidence":"high"}`;

export async function analyzePinterestScreenshots(
  base64Images: string[],
): Promise<PinterestStyleResult> {
  if (!VENICE_KEY) {
    throw new Error('Venice AI key not configured');
  }
  if (base64Images.length === 0) {
    throw new Error('No images provided');
  }

  // Build multi-image message content
  const imageContents = base64Images.map((b64) => ({
    type: 'image_url' as const,
    image_url: { url: b64 }, // already includes data:image/... prefix
  }));

  const body = {
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: 'Analyze these Pinterest board screenshots and return ONLY a JSON object with the renovation preferences you detect. Follow the system instructions exactly.',
          },
        ],
      },
    ],
    max_tokens: 1400,
    temperature: 0.2,
    system: VISION_SYSTEM_PROMPT,
  };

  const res = await fetch(`${VENICE_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VENICE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    interface ErrBody { error?: { message?: string } }
    const errBody = await res.json().catch(() => ({})) as ErrBody;
    throw new Error(errBody?.error?.message ?? `Vision API error ${res.status}`);
  }

  interface CompletionResponse {
    choices?: Array<{ message?: { content: string } }>;
  }
  const data = (await res.json()) as CompletionResponse;
  const raw = data?.choices?.[0]?.message?.content ?? '';

  // Parse JSON — strip any markdown fences if present
  const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(jsonStr) as PinterestStyleResult;
    // Sanitize — ensure arrays exist
    if (!Array.isArray(parsed.selectedFeatures)) parsed.selectedFeatures = [];
    if (!Array.isArray(parsed.materialDetails)) parsed.materialDetails = [];
    return parsed;
  } catch {
    throw new Error('Could not parse style results. Try with a clearer screenshot.');
  }
}

/** Convert a File to a base64 data URL */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

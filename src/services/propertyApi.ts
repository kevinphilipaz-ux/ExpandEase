/**
 * Property data API – RentCast (value estimate + comparables).
 * Set VITE_RENTCAST_API_KEY in .env to enable real data; otherwise demo data is used.
 */

const RENTCAST_BASE = 'https://api.rentcast.io/v1';
const API_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_RENTCAST_API_KEY;

export interface SubjectProperty {
  value: number;
  equity: number;
  sqft: number;
  beds: number;
  baths: number;
  pool: boolean;
  yearBuilt: number;
}

export interface CompProperty {
  address: string;
  price: number;
  sqft: number;
  beds: number;
  baths: number;
  yearBuilt: number;
  daysOnMarket: number;
}

export interface PropertyDataResult {
  subject: SubjectProperty;
  comps: CompProperty[];
}

/** RentCast AVM value response (relevant fields). */
interface RentCastSubject {
  formattedAddress?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  lastSalePrice?: number;
}

interface RentCastComp {
  formattedAddress?: string;
  price?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  daysOnMarket?: number;
}

interface RentCastValueResponse {
  price?: number;
  subjectProperty?: RentCastSubject;
  comparables?: RentCastComp[];
}

function normalizeAddress(addr: string): string {
  return addr.trim().replace(/\s*,\s*/, ', ');
}

/**
 * Fetch real property value and comparables from RentCast.
 * Returns null if no API key or on error (caller should use mock).
 */
export async function fetchPropertyValue(address: string): Promise<PropertyDataResult | null> {
  if (!API_KEY || typeof API_KEY !== 'string' || API_KEY.length < 5) {
    return null;
  }
  const normalized = normalizeAddress(address);
  const url = `${RENTCAST_BASE}/avm/value?address=${encodeURIComponent(normalized)}&compCount=10&maxRadius=1`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'X-Api-Key': API_KEY },
    });
    if (!res.ok) {
      if (res.status === 401) return null;
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json?.message) throw new Error(json.message);
      } catch {
        throw new Error(text || `HTTP ${res.status}`);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const data: RentCastValueResponse = await res.json();
    const subjectProp = data.subjectProperty;
    const value = typeof data.price === 'number' && data.price > 0 ? data.price : (subjectProp?.lastSalePrice ?? 0);
    const equity = Math.round(value * 0.45 / 1000) * 1000; // approximate; API doesn't provide loan balance
    const subject: SubjectProperty = {
      value,
      equity,
      sqft: subjectProp?.squareFootage ?? 0,
      beds: subjectProp?.bedrooms ?? 0,
      baths: subjectProp?.bathrooms ?? 0,
      pool: false, // RentCast AVM response doesn't include pool; could be enriched from /properties later
      yearBuilt: subjectProp?.yearBuilt ?? 0,
    };
    const comps: CompProperty[] = (data.comparables ?? []).slice(0, 10).map((c) => ({
      address: c.formattedAddress ?? '',
      price: c.price ?? 0,
      sqft: c.squareFootage ?? 0,
      beds: c.bedrooms ?? 0,
      baths: c.bathrooms ?? 0,
      yearBuilt: c.yearBuilt ?? 0,
      daysOnMarket: c.daysOnMarket ?? 0,
    })).filter((c) => c.address && c.price > 0);
    return { subject, comps };
  } catch {
    return null;
  }
}

export function isPropertyApiConfigured(): boolean {
  return !!(API_KEY && typeof API_KEY === 'string' && API_KEY.length >= 5);
}

// --- Mock data (same shape as API) for demo when no key or on error ---
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return function () {
    hash = (hash * 16807 + 0) % 2147483647;
    return (hash & 0x7fffffff) / 0x7fffffff;
  };
}

const STREET_NAMES = [
  'Camelback Rd', 'Indian School Rd', 'Shea Blvd', 'Scottsdale Rd', 'Tatum Blvd',
  'Cave Creek Rd', 'Pinnacle Peak Rd', 'Bell Rd', 'Thunderbird Rd', 'Greenway Pkwy',
  'Frank Lloyd Wright Blvd', 'Hayden Rd', 'Pima Rd', 'Via Linda', 'Cactus Rd',
  'Ray Rd', 'Chandler Blvd', 'Baseline Rd', 'Bethany Home Rd', 'Glendale Ave',
  'Northern Ave', 'Dunlap Ave', 'Peoria Ave',
];
const DIRECTIONS = ['N', 'S', 'E', 'W'];

export function getMockPropertyData(addressSeed: string): PropertyDataResult {
  const rand = seededRandom(addressSeed);
  const subjectBeds = Math.floor(rand() * 3) + 3;
  const subjectBaths = subjectBeds - Math.floor(rand() * 2);
  const subjectSqft = Math.round((1800 + rand() * 3200) / 100) * 100;
  const pricePerSqft = 250 + rand() * 450;
  const subjectValue = Math.round(subjectSqft * pricePerSqft / 10000) * 10000;
  const equityPct = 0.25 + rand() * 0.45;
  const subjectEquity = Math.round(subjectValue * equityPct / 1000) * 1000;
  const subjectPool = rand() > 0.4;
  const subjectYear = 1985 + Math.floor(rand() * 35);
  const cityMatch = addressSeed.match(/,\s*([^,]+),\s*(\w{2})\s*\d*/);
  const city = cityMatch ? cityMatch[1].trim() : 'Phoenix';
  const state = cityMatch ? cityMatch[2].trim() : 'AZ';
  const comps: CompProperty[] = [];
  for (let i = 0; i < 4; i++) {
    const sqftVariance = 0.75 + rand() * 0.5;
    const compSqft = Math.round(subjectSqft * sqftVariance / 50) * 50;
    const compBeds = Math.max(2, subjectBeds + Math.floor(rand() * 3) - 1);
    const bathOffset = rand() > 0.5 ? 0 : rand() > 0.5 ? 0.5 : -0.5;
    const compBaths = Math.max(1.5, compBeds - Math.floor(rand() * 2) + bathOffset);
    const compPriceVariance = 0.8 + rand() * 0.4;
    const compPrice = Math.round(compSqft * pricePerSqft * compPriceVariance / 5000) * 5000;
    const compYear = subjectYear + Math.floor(rand() * 15) - 7;
    const streetNum = 1000 + Math.floor(rand() * 19000);
    const dir = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
    const streetIdx = Math.floor(rand() * STREET_NAMES.length);
    comps.push({
      address: `${streetNum} ${dir} ${STREET_NAMES[streetIdx]}, ${city}, ${state}`,
      price: compPrice,
      sqft: compSqft,
      beds: compBeds,
      baths: Math.round(compBaths * 2) / 2,
      yearBuilt: compYear,
      daysOnMarket: Math.floor(rand() * 90) + 5,
    });
  }
  comps.sort((a, b) => b.price - a.price);
  return {
    subject: {
      value: subjectValue,
      equity: subjectEquity,
      sqft: subjectSqft,
      beds: subjectBeds,
      baths: subjectBaths,
      pool: subjectPool,
      yearBuilt: subjectYear,
    },
    comps,
  };
}

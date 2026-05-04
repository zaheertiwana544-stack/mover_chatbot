/**
 * MoveEasy Pricing Engine — v5 (Item-based only)
 * Bedroom fallback removed. All quotes use item list.
 *
 * Distance: zip → Nominatim → haversine × 1.25
 *           city name → Nominatim (fallback when no zip)
 */

const { ITEMS } = require('./itemCatalog');

// ── TRUCK TIERS by total weight ───────────────────────────────────────────────
const TRUCK_TIERS = [
  { maxWeight:  2000, label: 'Cargo Van',    crewSize: 2, localRate:  75, truckBase:  200 },
  { maxWeight:  5000, label: '16ft Truck',   crewSize: 2, localRate:  95, truckBase:  350 },
  { maxWeight:  9000, label: '20ft Truck',   crewSize: 3, localRate: 130, truckBase:  550 },
  { maxWeight: 14000, label: '26ft Truck',   crewSize: 3, localRate: 165, truckBase:  800 },
  { maxWeight: 22000, label: '2× 26ft Truck',crewSize: 4, localRate: 220, truckBase: 1200 },
  { maxWeight: Infinity, label: 'Freight',   crewSize: 5, localRate: 280, truckBase: 1800 },
];

const SPECIALTY_SURCHARGE = {
  piano_upright: 250, piano_grand: 600,
  pool_table: 350, safe_large: 200,
  hot_tub: 400, motorcycle: 150,
};

const FUEL_PCT      = 0.08;
const INSURANCE_PCT = 0.05;
const LABOR_PCT     = 0.15;

function distanceMultiplier(miles) {
  if (miles <   50) return 1.00;
  if (miles <  150) return 1.20;
  if (miles <  300) return 1.45;
  if (miles <  500) return 1.70;
  if (miles < 1000) return 2.00;
  if (miles < 2000) return 2.40;
  return 2.80;
}

// ── GEOCODING ──────────────────────────────────────────────────────────────────
const geocodeCache = new Map();

async function nominatimFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MoveEasy-App/1.0 (contact@moveeasy.com)' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error('Not found');
  return {
    lat:   parseFloat(data[0].lat),
    lng:   parseFloat(data[0].lon),
    city:  data[0].address?.city || data[0].address?.town || data[0].address?.village || '',
    state: data[0].address?.state || '',
  };
}

async function geocodeZip(zip) {
  const key = `zip:${zip}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  try {
    const result = await nominatimFetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1&addressdetails=1`
    );
    geocodeCache.set(key, result);
    return result;
  } catch (err) {
    console.warn(`geocodeZip "${zip}" failed:`, err.message);
    return null;
  }
}

async function geocodeCity(city, state) {
  const key = `city:${city},${state}`.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  try {
    const q = encodeURIComponent(state ? `${city}, ${state}, USA` : `${city}, USA`);
    const result = await nominatimFetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=1`
    );
    geocodeCache.set(key, result);
    return result;
  } catch (err) {
    console.warn(`geocodeCity "${city}, ${state}" failed:`, err.message);
    return null;
  }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.25);
}

async function getDistanceMiles(origin, destination) {
  // Same zip = same area, treat as local
  if (origin.zip && destination.zip && origin.zip === destination.zip) {
    return { miles: 5, originInfo: null, destInfo: null };
  }

  // Try zip first, fall back to city
  let c1 = origin.zip      ? await geocodeZip(origin.zip)            : null;
  let c2 = destination.zip ? await geocodeZip(destination.zip)        : null;
  if (!c1 && origin.city)       c1 = await geocodeCity(origin.city, origin.state);
  if (!c2 && destination.city)  c2 = await geocodeCity(destination.city, destination.state);

  if (c1 && c2) {
    return { miles: haversine(c1.lat, c1.lng, c2.lat, c2.lng), originInfo: c1, destInfo: c2 };
  }

  // Hard fallback
  console.warn('Distance fallback — geocoding unavailable for both locations');
  const sameState = (origin.state || '').toUpperCase() === (destination.state || '').toUpperCase();
  return { miles: sameState ? 150 : 700, originInfo: null, destInfo: null };
}

// ── ITEM-BASED PRICING ────────────────────────────────────────────────────────
function calcItemBased(itemList, miles) {
  const isLocal = miles < 50;
  let totalWeight = 0, totalVolume = 0, specialtySurcharge = 0, fragileCount = 0;
  const unknownItems = [];

  for (const { id, qty = 1 } of itemList) {
    const item = ITEMS[id];
    if (!item) { unknownItems.push(id); continue; }
    totalWeight += item.weight * qty;
    totalVolume += item.volume * qty;
    if (item.tier === 'fragile')   fragileCount += qty;
    if (item.tier === 'specialty') specialtySurcharge += (SPECIALTY_SURCHARGE[id] || 150) * qty;
  }

  // Minimum weight so we always get a real truck size
  if (totalWeight === 0) totalWeight = 200;

  const truck = TRUCK_TIERS.find(t => totalWeight <= t.maxWeight) || TRUCK_TIERS[TRUCK_TIERS.length - 1];

  let baseRate, fuelSurcharge, labor, insurance;
  let hourlyRate = null, minHours = null, estHours = null;

  if (isLocal) {
    const volHours  = Math.max(totalVolume * 0.012, truck.crewSize * 1.5);
    estHours  = Math.round(volHours * 2) / 2; // nearest 0.5
    minHours  = Math.max(2, truck.crewSize);
    hourlyRate = truck.localRate;
    baseRate   = Math.round(hourlyRate * estHours / 5) * 5;
    fuelSurcharge = Math.round(baseRate * FUEL_PCT / 5) * 5;
    labor      = 0;
    insurance  = Math.round(baseRate * INSURANCE_PCT / 5) * 5;
  } else {
    baseRate   = Math.round(truck.truckBase * distanceMultiplier(miles) / 10) * 10;
    fuelSurcharge = Math.round(baseRate * FUEL_PCT / 5) * 5;
    labor      = Math.round(baseRate * LABOR_PCT / 5) * 5;
    insurance  = Math.round(baseRate * INSURANCE_PCT / 5) * 5;
  }

  const packingSurcharge = fragileCount * 15;
  const addons = specialtySurcharge + packingSurcharge;
  const total  = baseRate + fuelSurcharge + labor + insurance + addons;

  return {
    pricingMode: 'item_based',
    isLocal,
    estimatedMiles: miles,
    moveType: isLocal ? 'local' : miles < 500 ? 'regional' : 'longDist',
    truckSize: truck.label,
    crewSize:  truck.crewSize,
    totalWeight: Math.round(totalWeight),
    totalVolume: Math.round(totalVolume),
    hourlyRate, minHours, estHours,
    baseRate, fuelSurcharge, labor, insurance,
    specialtySurcharge, packingSurcharge,
    addons, total,
    unknownItems,
  };
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
async function calculatePrice({ origin = {}, destination = {}, items = [] }) {
  if (!items || items.length === 0) {
    throw new Error('Item list is required. Please provide items to move.');
  }
  const { miles, originInfo, destInfo } = await getDistanceMiles(origin, destination);
  const pricing = calcItemBased(items, miles);
  return { ...pricing, originInfo, destInfo };
}

function formatQuoteForAI(pricing, { origin, destination, itemSummary }) {
  const p = pricing;

  const fmt = (loc) => {
    if (loc.zip && (loc.city || p.originInfo?.city)) {
      const city  = loc.city  || p.originInfo?.city  || '';
      const state = loc.state || p.originInfo?.state || '';
      return `${city}, ${state} (${loc.zip})`;
    }
    if (loc.city) return `${loc.city}${loc.state ? ', ' + loc.state : ''}`;
    return loc.zip || 'your location';
  };

  const lines = [
    `Here is your estimate for moving ${itemSummary || 'your items'} from ${fmt(origin)} to ${fmt(destination)} (approximately ${p.estimatedMiles} miles).`,
    '',
    `Truck: ${p.truckSize} · Crew: ${p.crewSize} movers · ${p.totalWeight} lbs total`,
    '',
  ];

  if (p.isLocal) {
    lines.push(`Move type: Local (hourly billing)`);
    lines.push(`Rate: $${p.hourlyRate}/hr · Estimated ${p.estHours} hours · ${p.minHours}-hour minimum`);
    lines.push(`Base charge: $${p.baseRate.toLocaleString()}`);
    lines.push(`Fuel: $${p.fuelSurcharge}`);
    lines.push(`Insurance: $${p.insurance}`);
  } else {
    lines.push(`Move type: ${p.moveType === 'regional' ? 'Regional' : 'Long Distance'}`);
    lines.push(`Base rate: $${p.baseRate.toLocaleString()}`);
    lines.push(`Fuel surcharge: $${p.fuelSurcharge}`);
    lines.push(`Labor: $${p.labor}`);
    lines.push(`Insurance: $${p.insurance}`);
  }

  if (p.specialtySurcharge > 0) lines.push(`Specialty handling: $${p.specialtySurcharge}`);
  if (p.packingSurcharge   > 0) lines.push(`Fragile item packing: $${p.packingSurcharge}`);

  lines.push('');
  lines.push(`Total estimate: $${p.total.toLocaleString()}`);
  lines.push('');

  if (p.isLocal) {
    lines.push(`Final charge based on actual hours, billed in 15-minute increments after the ${p.minHours}-hour minimum.`);
  } else {
    lines.push(`Valid for 7 days. No deposit required to book.`);
  }

  return lines.join('\n');
}

module.exports = { calculatePrice, formatQuoteForAI, calcItemBased, getDistanceMiles };

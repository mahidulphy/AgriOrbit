// Real reverse geocoding for map clicks.
// Primary: OSM Nominatim (no key, CORS-enabled). Fallback: geometric
// nearest-district matching on the local 64-district dataset when the
// service is unreachable. Never hard-codes coordinate-to-district rules.

import {
  BD_DISTRICTS,
  BDDistrict,
  getDistrictAdmin,
  insideBangladeshBBox,
  nearestDistrict,
  type DistrictId,
} from '../data/bdAdmin';

export interface ReverseGeocodeResult {
  district: BDDistrict;
  /** Raw Nominatim address fields that hinted at an upazila, if any. */
  addressHint: string;
  outsideBangladesh: boolean;
  /** True when the result came from the local geometric fallback. */
  approximate: boolean;
}

interface NominatimAddress {
  country_code?: string;
  state?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  neighbourhood?: string;
  municipality?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  error?: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const MIN_GAP_MS = 1100;
const TIMEOUT_MS = 8000;

const cache = new Map<string, ReverseGeocodeResult>();
let lastRequestAt = 0;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ district$/, '')
    .replace(/[^a-z]/g, '');
}

function matchDistrictName(raw: string | undefined): BDDistrict | undefined {
  if (!raw) return undefined;
  const norm = normalize(raw);
  if (!norm) return undefined;
  return (BD_DISTRICTS as readonly BDDistrict[]).find(
    (d) => normalize(d.nameEn) === norm || normalize(d.nameBn) === norm || d.id === norm,
  );
}

function fallbackResult(lat: number, lng: number): ReverseGeocodeResult {
  return {
    district: nearestDistrict(lat, lng),
    addressHint: '',
    outsideBangladesh: !insideBangladeshBBox(lat, lng),
    approximate: true,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const gap = Date.now() - lastRequestAt;
    if (gap < MIN_GAP_MS) await sleep(MIN_GAP_MS - gap);
    lastRequestAt = Date.now();

    const url =
      `${NOMINATIM_URL}?format=jsonv2&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}&zoom=12&addressdetails=1` +
      `&accept-language=en`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = (await res.json()) as NominatimResponse;
    const address = data.address;
    if (!address) throw new Error('Nominatim empty address');

    if ((address.country_code ?? '').toLowerCase() !== 'bd') {
      const outside: ReverseGeocodeResult = {
        district: nearestDistrict(lat, lng),
        addressHint: '',
        outsideBangladesh: true,
        approximate: false,
      };
      cache.set(key, outside);
      return outside;
    }

    const district =
      matchDistrictName(address.county) ??
      matchDistrictName(address.city) ??
      matchDistrictName(address.town) ??
      matchDistrictName(address.state) ??
      nearestDistrict(lat, lng);

    const hint = [
      address.suburb,
      address.neighbourhood,
      address.village,
      address.town,
      address.city,
      address.municipality,
    ]
      .filter(Boolean)
      .join(' | ');

    const result: ReverseGeocodeResult = {
      district,
      addressHint: hint,
      outsideBangladesh: false,
      approximate: false,
    };
    cache.set(key, result);
    return result;
  } catch {
    const result = fallbackResult(lat, lng);
    cache.set(key, result);
    return result;
  }
}

/** Match a reverse-geocode address hint against a district's curated upazilas. */
export function matchUpazila(
  upazilas: { id: string; nameEn: string; nameBn: string }[],
  addressHint: string,
): string | null {
  const normHint = addressHint.toLowerCase().replace(/[^a-z\u0980-\u09FF]/g, '');
  if (!normHint) return null;
  for (const upz of upazilas) {
    const en = upz.nameEn.toLowerCase().replace(/[^a-z]/g, '');
    if (en.length >= 4 && normHint.includes(en)) return upz.id;
  }
  return null;
}

export function getDistrictAdminOrFallback(id: string): BDDistrict {
  return getDistrictAdmin(id) ?? (BD_DISTRICTS as readonly BDDistrict[])[0];
}

export type { DistrictId };

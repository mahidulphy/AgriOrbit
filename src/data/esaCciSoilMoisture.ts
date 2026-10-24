/**
 * src/data/esaCciSoilMoisture.ts
 *
 * Types and accessors for the ESA CCI Soil Moisture (COMBINED product, 0.25° grid)
 * decadal comparison dataset (2001–2010 vs 2016–2025).
 */

import rawEsaCciJson from './esa-cci-soil-moisture.json' with { type: 'json' };
import type { SeasonId } from '../lib/fieldShift';

export interface EsaCciSeasonStats {
  thenSoil: number | null; // m³/m³
  nowSoil: number | null;
  dSoil: number | null;
  dSoilPct: number | null; // % change vs thenSoil
  thenDryDaysShare: number | null; // % of days < 20th percentile
  nowDryDaysShare: number | null;
  dDryDaysShare: number | null;
  status: 'valid' | 'not_enough_data';
  takeawayEn: string;
  takeawayBn: string;
}

export interface EsaCciDistrictRecord {
  rabi: EsaCciSeasonStats;
  kharif1: EsaCciSeasonStats;
  kharif2: EsaCciSeasonStats;
}

export interface EsaCciSoilMoistureDataset {
  _meta: {
    dataset: string;
    product: string;
    version: string;
    spatialResolution: string;
    unit: string;
    boundingBox: { latMin: number; latMax: number; lngMin: number; lngMax: number };
    periods: {
      then: [number, number];
      now: [number, number];
    };
    license: string;
    citation: string;
    generatedAt: string;
  };
  districts: Record<string, EsaCciDistrictRecord>;
}

export const ESA_CCI_DATA = rawEsaCciJson as unknown as EsaCciSoilMoistureDataset;

export function getDistrictEsaCci(districtId: string): EsaCciDistrictRecord | null {
  if (!districtId) return ESA_CCI_DATA.districts['rangpur'] ?? null;
  const normalized = districtId.toLowerCase().trim();
  return ESA_CCI_DATA.districts[normalized] ?? ESA_CCI_DATA.districts['rangpur'] ?? null;
}

export function getSeasonEsaCci(
  districtId: string,
  season: SeasonId
): EsaCciSeasonStats | null {
  const dist = getDistrictEsaCci(districtId);
  if (!dist) return null;
  return dist[season] ?? null;
}

/**
 * src/data/satellite.ts
 *
 * Real NASA Earthdata AppEEARS observations for all 64 Bangladesh districts.
 * Request: agriorbit_bd_districts_oct2026 (Task ID: 3d27655e-9af7-4df5-a83d-9785ec7600b9)
 *
 * Products:
 *  - NASA SMAP SPL3SMP_E.006 (9 km passive L-band microwave radiometry, m³/m³):
 *      SMAP is L-band microwave (~1.4 GHz) and is NOT blocked by clouds.
 *      Nulls indicate retrieval quality flag disqualifications (surface water fraction,
 *      dense vegetation scattering, radio-frequency interference [RFI], or complex terrain
 *      where bit 0 != 0) within the 14-day window.
 *      Values > 0.50 m³/m³ (e.g. Gopalganj 0.570) carry the flag "possible_water_contamination"
 *      and must NOT be used by the crop recommendation engine (treated as null).
 *  - NASA MODIS MOD13Q1.061 (250 m 16-day composite NDVI):
 *      Optical sensor; clouds obscure measurements. Only pixels with pixel_reliability
 *      QA 0 (good) or 1 (marginal) are retained. Cloudy pixels (QA 3) yield null.
 *  - NASA MODIS MOD11A2.061 (1 km 8-day composite Daytime & Nighttime LST, °C):
 *      Thermal infrared sensor; converted from Kelvin (K - 273.15). MODLAND QA filtered (<= 2K error).
 *
 * Point Type:
 *  - district_hq: all measurements extracted at district headquarters coordinates.
 */

import rawSatelliteJson from './satellite.json' with { type: 'json' };

export interface SmapRecord {
  value: number;
  date: string;
  pass: 'AM' | 'PM';
  recentCount: number;
  flag?: 'possible_water_contamination';
}

export interface NdviRecord {
  value: number;
  periodStart: string;
  reliability: number;
}

export interface LstRecord {
  value: number;
  periodStart: string;
}

export interface Sentinel1Record {
  floodedCroplandPct: number;
  observationWindow: {
    startDate: string;
    endDate: string;
    daysCount: number;
  };
  polarization: 'VV' | 'VV+VH';
  resolutionMeters: number;
  status: 'normal' | 'moderate_waterlogging' | 'severe_inundation' | 'unavailable';
  statusEn: string;
  statusBn: string;
  observedAt: string;
  source: 'ESA Sentinel-1 C-SAR';
}

export interface Sentinel2Record {
  ndvi10m: number;
  periodStart: string;
  cloudCoverPct: number;
  resolutionMeters: 10;
  status: 'optimal' | 'moderate' | 'vegetation_stress' | 'bare_soil';
  statusEn: string;
  statusBn: string;
  observedAt: string;
  source: 'ESA Sentinel-2 MSI';
  baselineNdvi: number;
  anomalyPct: number;
}

export interface JaxaRecord {
  gsmapRain30dMm: number;
  amsr2SoilMoisture: number;
  spi30dIndex: number;
  status: 'favorable' | 'moderate' | 'drought_alert' | 'discrepancy';
  statusEn: string;
  statusBn: string;
  observedAt: string;
  source: 'JAXA Earth API (GSMaP v8 / AMSR2)';
  rainDiscrepancyMm?: number;
  rainDiscrepancyPct?: number;
}

export interface InsatRecord {
  lstC: number;
  rain24hMm: number;
  heatSpikeConfirmed: boolean;
  divergenceNoticeEn?: string;
  divergenceNoticeBn?: string;
  observedAt: string;
  source: 'ISRO MOSDAC (INSAT-3DR)';
}

export interface NisarRecord {
  soilMoisture200m: number;
  observationDate: string;
  pass: 'Ascending' | 'Descending';
  resolutionMeters: 200;
  status: 'provisional_release';
  source: 'NASA-ISRO NISAR (L3 Provisional)';
}

export interface DistrictSatelliteRecord {
  smap: SmapRecord | null;
  ndvi: NdviRecord | null;
  lstDay: LstRecord | null;
  lstNight: LstRecord | null;
  sentinel1?: Sentinel1Record | null;
  sentinel2?: Sentinel2Record | null;
  jaxa?: JaxaRecord | null;
  insat?: InsatRecord | null;
  nisar?: NisarRecord | null;
}

export interface SatelliteDatasetMeta {
  request: string;
  requestId: string;
  pointType: string;
  products: {
    smap: string;
    ndvi: string;
    lst: string;
    sentinel1?: string;
    sentinel2?: string;
    jaxa?: string;
    insat?: string;
    nisar?: string;
  };
  generatedAt: string;
}

export const SATELLITE_DATA = rawSatelliteJson as unknown as Record<string, DistrictSatelliteRecord> & {
  _meta: SatelliteDatasetMeta;
};

/**
 * Returns the NASA satellite observations for a specific district.
 * Returns null if the district is not found.
 */
export function getDistrictSatellite(districtId: string): DistrictSatelliteRecord | null {
  if (!districtId) return null;
  const normId = districtId.toLowerCase().trim();
  const rec = (SATELLITE_DATA as Record<string, any>)[normId];
  if (!rec || typeof rec !== 'object' || normId === '_meta') return null;
  return rec as DistrictSatelliteRecord;
}

/**
 * Legacy interface for backward compatibility during migration.
 */
export interface SatelliteSnapshot {
  soil: number;
  soilAnomaly: number;
  ndvi: number;
  lst: number;
  date: string;
  placeholder: boolean;
}

/**
 * Backward compatibility map (derived from district satellite data).
 */
export const SATELLITE_BY_DIVISION: Record<string, SatelliteSnapshot> = {
  Rangpur: { soil: 0.21, soilAnomaly: 0, ndvi: 0.69, lst: 27.6, date: '2026-10-20', placeholder: false },
  Rajshahi: { soil: 0.22, soilAnomaly: 0, ndvi: 0.68, lst: 29.7, date: '2026-10-20', placeholder: false },
  Dhaka: { soil: 0.30, soilAnomaly: 0, ndvi: 0.39, lst: 31.4, date: '2026-10-20', placeholder: false },
  Mymensingh: { soil: 0.26, soilAnomaly: 0, ndvi: 0.39, lst: 29.9, date: '2026-10-20', placeholder: false },
  Sylhet: { soil: 0.27, soilAnomaly: 0, ndvi: 0.53, lst: 31.0, date: '2026-10-20', placeholder: false },
  Khulna: { soil: 0.30, soilAnomaly: 0, ndvi: 0.53, lst: 29.1, date: '2026-10-20', placeholder: false },
  Barishal: { soil: 0.35, soilAnomaly: 0, ndvi: 0.71, lst: 29.0, date: '2026-10-20', placeholder: false },
  Chattogram: { soil: 0.31, soilAnomaly: 0, ndvi: 0.41, lst: 30.2, date: '2026-10-20', placeholder: false },
};

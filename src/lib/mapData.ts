// Loads and joins the Phase 10 NASA caches for the interactive district map.
// Every value is a real downloaded value. Anything missing stays null so the
// UI can render grey "No data" instead of inventing a number.

import type { FeatureCollection, Geometry } from 'geojson';
import { BD_DISTRICTS, type DistrictId } from '../data/bdAdmin.ts';
import { SATELLITE_DATA, type DistrictSatelliteRecord } from '../data/satellite.ts';

export type MapLayerId = 'gpm' | 'gpmDiff' | 'erosion' | 'elevation' | 'grace' | 'soilMoisture';

export interface DistrictMapProps {
  districtId: string;
  nameEn: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  adm2Pcode?: string;
  sourceAreaSqKm?: number;
  validOn?: string;
}

export interface DistrictMetrics extends DistrictMapProps {
  lat: number;
  lng: number;
  gpm30d: number | null;
  power30d: number | null;
  gpmPowerDiff: number | null;
  powerSameWindow: number | null;
  gpmWindow: [string, string] | null;
  sameWindowDays: number | null;
  extremeRainDays: number | null;
  elevationM: number | null;
  meanSlopeDeg: number | null;
  slopeGt5Pct: number | null;
  sampledAreaKm2: number | null;
  smap: number | null;
  smapDate: string | null;
  smapPass: string | null;
  smapFlagged: boolean;
  graceRegionId: string | null;
}

export interface GraceSeriesPoint {
  month: string;
  date: string;
  lweCm: number | null;
  missing: boolean;
  deseasonalizedCm: number | null;
}

export interface GraceRegion {
  id: string;
  regionName: string;
  masconId: number;
  lat: number;
  lng: number;
  areaPctInsideBangladesh: number | null;
  districtIds: string[];
  latestMonth: string | null;
  latestCm: number | null;
  trend2016: number | null;
  trend2002: number | null;
  series: GraceSeriesPoint[];
  valueByMonth: Record<string, number | null>;
}

export interface GraceCellProps {
  regionId: string;
  masconId: number;
  cellLat: number;
  cellLon: number;
}

export interface MapBoundaryMeta {
  title?: string;
  source?: string;
  sourcePublisher?: string;
  sourceUrl?: string;
  license?: string;
  licenseUrl?: string;
  sourceValidOn?: string;
  simplification?: string;
  generatedAt?: string;
  note?: string;
}

export interface MapDataset {
  districts: FeatureCollection<Geometry, DistrictMapProps>;
  districtById: Record<string, DistrictMetrics>;
  grace: {
    regions: GraceRegion[];
    regionById: Record<string, GraceRegion>;
    cells: FeatureCollection<Geometry, GraceCellProps>;
    months: string[];
    gapStartIndex: number;
    gapEndIndex: number;
    gapLabel: string;
    latestMonth: string | null;
    minCm: number | null;
    maxCm: number | null;
  };
  meta: {
    boundaries: MapBoundaryMeta;
    gpm: Record<string, unknown>;
    nasadem: Record<string, unknown>;
    grace: Record<string, unknown>;
    satelliteGeneratedAt: string | null;
  };
}

const BASE = import.meta.env.BASE_URL || '/';
const url = (path: string) => `${BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(url(path));
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return (await res.json()) as T;
}

let cached: Promise<MapDataset> | null = null;

export function loadMapDataset(force = false): Promise<MapDataset> {
  if (!cached || force) {
    cached = buildDataset().catch((error) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function buildDataset(): Promise<MapDataset> {
  const [boundaries, gpmFile, nasademFile, graceFile] = await Promise.all([
    fetchJson<FeatureCollection<Geometry, DistrictMapProps> & { metadata?: MapBoundaryMeta }>(
      'geo/bd_districts.geojson'
    ),
    fetchJson<{ _metadata: Record<string, unknown>; districts: Record<string, any> }>(
      'cache/gpm/gpm_last30d_summary.json'
    ),
    fetchJson<{ _metadata: Record<string, unknown>; districts: Record<string, any> }>(
      'cache/nasadem/nasadem_elevation_slope_summary.json'
    ),
    fetchJson<{ _metadata: Record<string, unknown>; regions: Record<string, any> }>(
      'cache/grace/grace_regions.json'
    ),
  ]);

  const graceRegionIdsByDistrict: Record<string, string> = {};
  const regions: GraceRegion[] = Object.entries(graceFile.regions).map(([id, raw]) => {
    const series: GraceSeriesPoint[] = (raw.monthly_series ?? []).map((p: any) => ({
      month: String(p.month),
      date: String(p.date),
      lweCm: p.missing ? null : numOrNull(p.lwe_cm),
      missing: Boolean(p.missing),
      deseasonalizedCm: p.missing ? null : numOrNull(p.deseasonalized_cm),
    }));
    const valueByMonth: Record<string, number | null> = {};
    let latestMonth: string | null = null;
    let latestCm: number | null = null;
    for (const p of series) {
      valueByMonth[p.month] = p.lweCm;
      if (!p.missing && p.lweCm !== null) {
        latestMonth = p.month;
        latestCm = p.lweCm;
      }
    }
    const districtIds: string[] = (raw.districts ?? []).map((d: any) => String(d.id));
    for (const districtId of districtIds) graceRegionIdsByDistrict[districtId] = id;
    return {
      id,
      regionName: String(raw.regionName ?? `JPL mascon ${raw.mascon_id}`),
      masconId: Number(raw.mascon_id),
      lat: Number(raw.representative_cell_lat),
      lng: Number(raw.representative_cell_lon),
      areaPctInsideBangladesh: numOrNull(raw.area_pct_inside_bangladesh),
      districtIds,
      latestMonth,
      latestCm,
      trend2016: numOrNull(raw.trend_2016_present?.slope_cm_per_year),
      trend2002: numOrNull(raw.trend_2002_2010?.slope_cm_per_year),
      series,
      valueByMonth,
    };
  });

  const months = regions[0]?.series.map((p) => p.month) ?? [];
  const gapMeta = graceFile._metadata?.gap as { start?: string; end?: string } | undefined;
  const gapStart = String(gapMeta?.start ?? '2017-07');
  const gapEnd = String(gapMeta?.end ?? '2018-05');
  let gapStartIndex = months.indexOf(gapStart);
  let gapEndIndex = months.indexOf(gapEnd);
  if (gapStartIndex < 0 || gapEndIndex < 0) {
    gapStartIndex = -1;
    gapEndIndex = -1;
  }

  const allCm = regions.flatMap((r) =>
    r.series.filter((p) => !p.missing && p.lweCm !== null).map((p) => p.lweCm as number)
  );

  const cellFeatures: FeatureCollection<Geometry, GraceCellProps>['features'] = [];
  const seenCells = new Set<string>();
  for (const region of regions) {
    const raw = graceFile.regions[region.id];
    for (const cell of raw.cells ?? []) {
      const cellLat = Number(cell.cell_lat);
      const cellLon = Number(cell.cell_lon);
      const key = `${region.id}:${cellLat}:${cellLon}`;
      if (seenCells.has(key)) continue;
      seenCells.add(key);
      const h = 0.25;
      cellFeatures.push({
        type: 'Feature',
        properties: {
          regionId: region.id,
          masconId: region.masconId,
          cellLat,
          cellLon,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [cellLon - h, cellLat - h],
              [cellLon + h, cellLat - h],
              [cellLon + h, cellLat + h],
              [cellLon - h, cellLat + h],
              [cellLon - h, cellLat - h],
            ],
          ],
        },
      });
    }
  }

  const districtById: Record<string, DistrictMetrics> = {};
  for (const district of BD_DISTRICTS) {
    const gpm = gpmFile.districts[district.id] ?? {};
    const nasadem = nasademFile.districts[district.id] ?? {};
    const satellite = (SATELLITE_DATA as Record<string, DistrictSatelliteRecord | undefined>)[district.id];
    const smapRaw = satellite?.smap ?? null;
    const smapFlagged = smapRaw?.flag === 'possible_water_contamination';
    const smapValue =
      smapRaw && !smapFlagged && typeof smapRaw.value === 'number' && smapRaw.value > 0 && smapRaw.value <= 0.5
        ? smapRaw.value
        : null;
    const powerWindow = Array.isArray(gpm.power_30d_window) && gpm.power_30d_window.length === 2
      ? ([String(gpm.power_30d_window[0]), String(gpm.power_30d_window[1])] as [string, string])
      : null;
    districtById[district.id] = {
      districtId: district.id,
      nameEn: district.nameEn,
      nameBn: district.nameBn,
      division: district.division,
      divisionBn: district.divisionBn,
      lat: district.lat,
      lng: district.lng,
      gpm30d: numOrNull(gpm.gpm_30d_total_mm),
      power30d: numOrNull(gpm.power_30d_total_mm),
      gpmPowerDiff: numOrNull(gpm.difference_same_window_mm),
      powerSameWindow: numOrNull(gpm.power_same_window_total_mm),
      gpmWindow: powerWindow,
      sameWindowDays: numOrNull(gpm.power_same_window_days),
      extremeRainDays: numOrNull(gpm.extreme_rain_days_count),
      elevationM: numOrNull(nasadem.mean_elevation_m),
      meanSlopeDeg: numOrNull(nasadem.mean_slope_degrees),
      slopeGt5Pct: numOrNull(nasadem.area_pct_slope_gt5_degrees),
      sampledAreaKm2: numOrNull(nasadem.sampled_area_km2),
      smap: smapValue,
      smapDate: smapRaw?.date ?? null,
      smapPass: smapRaw?.pass ?? null,
      smapFlagged,
      graceRegionId: graceRegionIdsByDistrict[district.id] ?? null,
    };
  }

  // Attach stable app ids + names to the boundary features.
  const districtFeatures = boundaries.features.map((feature) => {
    const raw = feature.properties ?? ({} as DistrictMapProps);
    const district = districtById[raw.districtId as DistrictId];
    return {
      ...feature,
      properties: {
        ...raw,
        districtId: district?.districtId ?? raw.districtId,
        nameEn: district?.nameEn ?? raw.nameEn,
        nameBn: district?.nameBn ?? raw.nameBn,
        division: district?.division ?? raw.division,
        divisionBn: district?.divisionBn ?? raw.divisionBn,
      },
    };
  });

  return {
    districts: { ...boundaries, features: districtFeatures },
    districtById,
    grace: {
      regions,
      regionById: Object.fromEntries(regions.map((r) => [r.id, r])),
      cells: { type: 'FeatureCollection', features: cellFeatures },
      months,
      gapStartIndex,
      gapEndIndex,
      gapLabel: `${gapStart} – ${gapEnd}`,
      latestMonth: months[months.length - 1] ?? null,
      minCm: allCm.length ? Math.min(...allCm) : null,
      maxCm: allCm.length ? Math.max(...allCm) : null,
    },
    meta: {
      boundaries: boundaries.metadata ?? {},
      gpm: gpmFile._metadata ?? {},
      nasadem: nasademFile._metadata ?? {},
      grace: graceFile._metadata ?? {},
      satelliteGeneratedAt: (SATELLITE_DATA as { _meta?: { generatedAt?: string } })._meta?.generatedAt ?? null,
    },
  };
}

export function getDistrictLayerValue(
  district: DistrictMetrics,
  layer: Exclude<MapLayerId, 'grace'>
): number | null {
  switch (layer) {
    case 'gpm':
      return district.gpm30d;
    case 'gpmDiff':
      return district.gpmPowerDiff;
    case 'erosion':
      return district.slopeGt5Pct;
    case 'elevation':
      return district.elevationM;
    case 'soilMoisture':
      return district.smap;
    default:
      return null;
  }
}

export function getGraceValue(region: GraceRegion, month: string): number | null {
  return region.valueByMonth[month] ?? null;
}

export interface HotspotResult {
  dry: string[];
  erosion: string[];
  smapValidCount: number;
}

export const DRY_RULE = { gpmBelowMm: 25, smapBelow: 0.25 } as const;
export const EROSION_RULE = { slopeGt5AbovePct: 10 } as const;

export function computeHotspots(dataset: MapDataset): HotspotResult {
  const dry: string[] = [];
  const erosion: string[] = [];
  let smapValidCount = 0;
  for (const district of Object.values(dataset.districtById)) {
    if (district.smap !== null) smapValidCount += 1;
    if (district.gpm30d !== null && district.smap !== null) {
      if (district.gpm30d < DRY_RULE.gpmBelowMm && district.smap < DRY_RULE.smapBelow) {
        dry.push(district.districtId);
      }
    }
    if (district.slopeGt5Pct !== null && district.slopeGt5Pct > EROSION_RULE.slopeGt5AbovePct) {
      erosion.push(district.districtId);
    }
  }
  return { dry, erosion, smapValidCount };
}

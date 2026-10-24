/**
 * src/lib/satelliteService.ts
 *
 * Client-Side Satellite Telemetry Service for AgriOrbit
 *
 * Responsibilities:
 * 1. Synchronously provides baseline satellite observations from bundled `satellite.json` (instant, zero-layout-shift).
 * 2. Asynchronously queries Supabase table `satellite_observations` for the active district if Supabase is configured.
 * 3. Gracefully merges fresh daily SMAP, MODIS/VIIRS NDVI, and LST observations over baseline data.
 * 4. Accurately determines observation age and freshness (threshold: 7 days).
 * 5. If network or Supabase queries fail, reliably retains the last good observation with its real date. Never fakes values or dates.
 */

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  getDistrictSatellite,
  type DistrictSatelliteRecord,
  type SmapRecord,
  type NdviRecord,
  type LstRecord,
} from '../data/satellite';

/**
 * Checks whether an observation date is fresh (within `maxAgeDays`, default 7 days of current time).
 */
export function isObservationFresh(dateStr?: string | null, maxAgeDays = 7): boolean {
  if (!dateStr) return false;
  try {
    const obsTime = new Date(dateStr).getTime();
    if (isNaN(obsTime)) return false;
    const now = Date.now();
    const diffDays = Math.floor((now - obsTime) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= maxAgeDays;
  } catch {
    return false;
  }
}

/**
 * In-memory session cache for latest district observations from Supabase.
 */
const LIVE_OBS_CACHE = new Map<string, DistrictSatelliteRecord>();

/**
 * Asynchronously retrieves the latest satellite observations for a district from Supabase.
 * Returns null if Supabase is unconfigured, empty, or unreachable.
 */
export async function fetchDistrictSatelliteFromSupabase(
  districtId: string
): Promise<DistrictSatelliteRecord | null> {
  if (!isSupabaseConfigured() || !districtId) return null;

  const normId = districtId.toLowerCase().trim();
  const baseline = getDistrictSatellite(normId);
  if (!baseline) return null;

  try {
    const { data, error } = await supabase
      .from('satellite_observations')
      .select('district, source, value, observed_date, metadata, fetched_at')
      .eq('district', normId)
      .order('observed_date', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Clone baseline record to apply fresh observations
    const merged: DistrictSatelliteRecord = {
      ...baseline,
      smap: baseline.smap ? { ...baseline.smap } : null,
      ndvi: baseline.ndvi ? { ...baseline.ndvi } : null,
      lstDay: baseline.lstDay ? { ...baseline.lstDay } : null,
      lstNight: baseline.lstNight ? { ...baseline.lstNight } : null,
    };

    // 1. Find latest SMAP row
    const smapRow = data.find((r) => r.source === 'SMAP');
    if (smapRow && (!merged.smap || smapRow.observed_date >= merged.smap.date)) {
      merged.smap = {
        value: smapRow.value,
        date: smapRow.observed_date,
        pass: smapRow.metadata?.pass || 'AM',
        recentCount: 1,
        flag: smapRow.value > 0.5 ? 'possible_water_contamination' : undefined,
      };
    }

    // 2. Find latest NDVI row (MODIS or VIIRS)
    const ndviRow = data.find((r) => r.source.includes('NDVI'));
    if (ndviRow && (!merged.ndvi || ndviRow.observed_date >= merged.ndvi.periodStart)) {
      merged.ndvi = {
        value: ndviRow.value,
        periodStart: ndviRow.observed_date,
        reliability: ndviRow.metadata?.reliability ?? 0,
        source: ndviRow.metadata?.product || ndviRow.source.replace('_NDVI', ''),
      };
    }

    // 3. Find latest LST row
    const lstDayRow = data.find((r) => r.source === 'MODIS_LST_DAY');
    if (lstDayRow && (!merged.lstDay || lstDayRow.observed_date >= merged.lstDay.periodStart)) {
      merged.lstDay = {
        value: lstDayRow.value,
        periodStart: lstDayRow.observed_date,
      };
    }

    LIVE_OBS_CACHE.set(normId, merged);
    return merged;
  } catch (err) {
    console.warn(`[satelliteService] Failed to load fresh observations for ${districtId}:`, err);
    return null;
  }
}

/**
 * React hook to retrieve satellite data for the active district.
 * Starts with synchronous baseline snapshot and updates transparently if fresh Supabase rows exist.
 */
export function useDistrictSatellite(districtId: string): {
  satellite: DistrictSatelliteRecord | null;
  isSmapFresh: boolean;
  isNdviFresh: boolean;
  isLstFresh: boolean;
  loading: boolean;
} {
  const normId = districtId ? districtId.toLowerCase().trim() : '';
  const initial = LIVE_OBS_CACHE.get(normId) || getDistrictSatellite(normId);

  const [record, setRecord] = useState<DistrictSatelliteRecord | null>(initial);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const base = LIVE_OBS_CACHE.get(normId) || getDistrictSatellite(normId);
    setRecord(base);

    if (!isSupabaseConfigured() || !normId) {
      return;
    }

    setLoading(true);
    fetchDistrictSatelliteFromSupabase(normId)
      .then((fresh) => {
        if (isMounted && fresh) {
          setRecord(fresh);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [normId]);

  const isSmapFresh = record?.smap ? isObservationFresh(record.smap.date, 7) : false;
  const isNdviFresh = record?.ndvi ? isObservationFresh(record.ndvi.periodStart, 7) : false;
  const isLstFresh = record?.lstDay ? isObservationFresh(record.lstDay.periodStart, 7) : false;

  return {
    satellite: record,
    isSmapFresh,
    isNdviFresh,
    isLstFresh,
    loading,
  };
}

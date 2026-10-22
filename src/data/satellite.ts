// SMAP soil moisture + MODIS NDVI / land-surface-temperature, per division.
// NASA Earthdata & AppEEARS observation snapshots:
//   SMAP  -> NASA SPL3SMP_E (9 km), m³/m³
//   MODIS -> MOD13Q1 (NDVI) and MOD11A2 (LST, °C)

export interface SatelliteSnapshot {
  soil: number; // SMAP soil moisture, m³/m³
  soilAnomaly: number; // vs that month's normal, m³/m³ (+ wetter, − drier)
  ndvi: number; // MODIS NDVI, 0–1
  lst: number; // MODIS daytime land surface temp, °C
  date: string;
  placeholder: boolean;
}

const P = (soil: number, soilAnomaly: number, ndvi: number, lst: number): SatelliteSnapshot => ({
  soil,
  soilAnomaly,
  ndvi,
  lst,
  date: '2024-10-15',
  placeholder: true,
});

/** Keyed by division name (same spelling as districts.ts). */
export const SATELLITE_BY_DIVISION: Record<string, SatelliteSnapshot> = {
  Rangpur: P(0.27, -0.02, 0.62, 30.5),
  Rajshahi: P(0.22, -0.04, 0.55, 32.0),
  Dhaka: P(0.3, 0.0, 0.58, 31.0),
  Mymensingh: P(0.32, 0.01, 0.64, 30.0),
  Sylhet: P(0.36, 0.02, 0.7, 29.0),
  Khulna: P(0.33, 0.01, 0.6, 31.0),
  Barishal: P(0.35, 0.02, 0.63, 30.0),
  Chattogram: P(0.34, 0.01, 0.68, 30.0),
};

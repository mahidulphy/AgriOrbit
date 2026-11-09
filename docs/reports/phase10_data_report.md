# Phase 10 — NASA Earth Observation Ingest

Generated: 2026-11-09T07:07:53.806067+00:00

Target districts: Rangpur, Rajshahi, Sylhet (all 64 districts are cached).

> All values below come from downloaded NASA products. No value is estimated, interpolated, or synthesized. Where a source has no value, the report says so.

## 1. GPM IMERG daily precipitation

- Rolling product: `GPM_3IMERGDL.07` (V07 (GPM_3IMERGDL.07, 3B-DAY-L.MS.MRG.3IMERG.*.V07C))
- Run: Late Run (calibrated microwave + IR multi-satellite, ~14-hour latency)
- Resolution: 0.1° x 0.1° (~10 km); sampling: Nearest 0.1° IMERG grid cell to each district headquarters coordinate (docs/data/district_points.csv); no area aggregation.
- Rolling window: 2026-10-09 to 2026-11-07 (30 days)
- Full-history status: NOT YET INGESTED (rolling 30-day cache only)

| District | GPM 30-day total (mm) | POWER 30-day total (mm) | POWER window | GPM same-window (mm) | POWER same-window (mm) | Difference, same window (mm) | Days in same window | Extreme days >= 50 mm (30 d) |
|---|---|---|---|---|---|---|---|---|
| Rangpur | 80.1 | 21.5 | 2026-10-07 to 2026-11-05 | 80.1 | 15.5 | 64.6 | 28 | 0 |
| Rajshahi | 55.7 | 28.6 | 2026-10-07 to 2026-11-05 | 55.7 | 17.5 | 38.2 | 28 | 0 |
| Sylhet | 26.3 | 24.1 | 2026-10-07 to 2026-11-05 | 26.3 | 19.5 | 6.8 | 28 | 0 |

The same-window columns compare GPM and POWER only on dates present in both sources; POWER daily data ends 2026-11-05 while GPM ends 2026-11-07. The POWER 30-day column is POWER's own last-30-day window and is not the same period.

**Gap:** the full 2001-present daily series has not been ingested. The backfill script `scripts/backfill_gpm_history.py` is ready and uses Final through 2025-09-30 and Late from 2025-10-01. A GES DISC connection timeout prevented running it during this report.

## 2. GRACE / GRACE-FO total water storage (regional)

- Product: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`
- Source: NASA PO.DAAC / JPL — https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4/GRCTellus.JPL.200204_202608.GLO.RL06.3M.MSCNv04CRI.nc
- Effective resolution: Regional (~300 km); 0.5 degree JPL mascon grid; districts grouped by shared mascon cell
- Baseline: 2004-2009 mean; variable: lwe_thickness: terrestrial total water storage (TWS) anomaly in cm of liquid water equivalent relative to the 2004-2009 mean. TWS includes groundwater, soil moisture, surface water, snow/ice and vegetation water; it is NOT groundwater alone.
- Period: 2002-04-17 to 2026-08-16
- Gap: 2017-07 to 2018-05 — GRACE ended in 2017 and GRACE-FO science data resume in 2018; no values are interpolated.
- Deseasonalization: Mean seasonal cycle removed before trend fitting: for each calendar month the long-term mean TWS anomaly is subtracted across all valid years.

| District | Mascon region | Cell lat/lon | Districts sharing cell | Latest TWS anomaly (cm) | Latest date | Deseasonalized 2002-2010 trend (cm/yr) | Deseasonalized 2016-present trend (cm/yr) | Months used |
|---|---|---|---|---|---|---|---|---|
| Rangpur | Mascon cell 25.75N 89.25E | 25.75, 89.25 | 2 | -29.25 | 2026-08-16 | -2.90 ± 0.24 | -3.68 ± 0.28 | 102 / 111 |
| Rajshahi | Mascon cell 24.25N 88.75E | 24.25, 88.75 | 1 | 15.44 | 2026-08-16 | -2.36 ± 0.23 | +0.14 ± 0.25 | 102 / 111 |
| Sylhet | Mascon cell 24.75N 91.75E | 24.75, 91.75 | 1 | 36.28 | 2026-08-16 | -0.19 ± 0.28 | +1.29 ± 0.22 | 102 / 111 |

GRACE measures total water storage (groundwater + soil moisture + surface water + snow/ice + vegetation water), not groundwater alone. These are regional trends, not district-level trends.
Districts that share a mascon cell receive **identical** GRACE TWS values, series, and trend estimates; the values are not independently estimated per district. Shared cells among the target districts: Mascon cell 25.75N 89.25E (Lalmonirhat, Rangpur).
The 2017-07..2018-05 gap is absent from all trend fits; no values were interpolated across it.

## 3. NASADEM elevation and slope (district polygons)

- Product: `NASADEM_NC.001` — NASADEM Merged DEM Global 1 arc second V001
- Source: NASA LP DAAC — https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_NC.001
- Resolution: 1 arc-second (~30 m); polygons: HDX/OCHA COD-AB ADM2 bgd_admin2.geojson (valid_on 2023-05-21)
- Method: Mean of NASADEM_HGT nodes whose coordinates fall inside the ADM2 polygon; slope from central-difference gradients of the 1 arc-second DEM, averaged over interior pixels with all four neighbours valid. NASADEM values below -10 m are excluded as ocean/void artefacts (no terrestrial district lies below -10 m); they are excluded, never replaced. No interpolation or estimation.

| District | Mean elevation (m) | Min (m) | Max (m) | Mean slope (deg) | Mean slope (%) | Sampled area (km2) | Elevation pixels |
|---|---|---|---|---|---|---|---|
| Rangpur | 30.2 | 10.0 | 65.0 | 2.109 | 3.68 | 2369.43 | 2758245 |
| Rajshahi | 18.4 | -10.0 | 51.0 | 1.934 | 3.38 | 2429.06 | 2800495 |
| Sylhet | 13.1 | -10.0 | 147.0 | 2.762 | 4.82 | 3430.73 | 3969682 |

## 4. ECOSTRESS evapotranspiration and land surface temperature

- ET product: `ECO_L3T_JET.002` — ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m v002 (https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002)
- LST product: `ECO_L2T_LSTE.002` — ECOSTRESS Tiled Land Surface Temperature and Emissivity Instantaneous L2 Global 70 m v002 (https://doi.org/10.5067/ECOSTRESS/ECO_L2T_LSTE.002)
- Source: NASA LP DAAC via AppEEARS — https://appeears.earthdatacloud.nasa.gov/api/task/eb4fcd8a-53bd-4707-b8ba-7991d7e78960; resolution: 70 m x 70 m
- Period requested: 2019-01-01 to 2026-11-08; sampling: Point extraction at each district headquarters coordinate; one 70 m pixel per overpass.
- Temporal note: ECOSTRESS has a non-sun-synchronous, precessing ISS orbit; revisit times are irregular and vary from hours to days. Discrete observations are kept as-is; no temporal interpolation.
- Units: mm/day (native ECO_L3T_JET.002 ETdaily; LP DAAC ECO_L2-4 Grid Tile User Guide V2 section 5.4 defines ETdaily as the daily integrated ET in millimeters per day); degrees C (converted from native Kelvin)
- Unit note: The Earthdata catalog table labels ETdaily as W/m2, but the LP DAAC User Guide V2 section 5.4 defines ETdaily as the daily ET integrated over daylight hours in mm/day. The downloaded values (0-5.93, median 1.86) are consistent with mm/day. Native values are reported as mm/day without rescaling.
- QC: ETdaily retained when 0 <= ETdaily <= 100 mm/day; no QC layer exists in ECO_L3T_JET.002. LST retained only when cloud mask is Clear, L1B data quality is Good, the mandatory QA flag confirms the pixel was produced by TES, LST accuracy is not ">2 K (poor)", and 250 K < LST < 350 K.

| District | ET observations | Latest ET date | Latest ET (mm/day) | Latest PTJPLSMinst (W/m2) | LST observations | Latest LST date | Latest LST (C) | LST accuracy |
|---|---|---|---|---|---|---|---|---|
| Rangpur | 55 | 2026-10-06 | 2.252 | 109.50 | 125 | 2026-10-25 | 24.15 | 1.5 - 2 K (Marginal performance) |
| Rajshahi | 125 | 2026-10-06 | 1.996 | 93.59 | 265 | 2026-10-21 | 25.67 | 1.5 - 2 K (Marginal performance) |
| Sylhet | 68 | 2026-10-03 | 2.699 | 168.70 | 146 | 2026-10-22 | 26.63 | 1.5 - 2 K (Marginal performance) |

ECOSTRESS revisits are discrete and irregular (ISS orbit); the table reports the latest valid observation, not a daily composite. Cloudy/fill LST pixels are excluded, not filled.

## 5. MODIS NDVI 16-day composites

- Terra product: `MOD13Q1` — MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061 (061)
- Source: NASA LP DAAC via AppEEARS — https://appeears.earthdatacloud.nasa.gov/api/task/681b0ec9-0e86-4f27-8f5e-39d38ce2c014; resolution: 250 m; 16-day composite
- Sampling: Point extraction at each district headquarters coordinate; native 250 m MODIS pixel.
- Date labels: Dates are MODIS 16-day composite start dates as delivered by AppEEARS. The first and last composites can extend beyond the requested start/end because composites overlap those boundaries.
- QA: pixel_reliability 0 (good) and 1 (marginal) are marked valid; 2 (snow/ice) and 3 (cloudy) are retained in the series with valid=false and excluded from latest_valid. Composite dates with no usable source value are listed as missing, never filled.

| Product | District | Steps | Expected | Missing composites | Valid steps | First date | Latest date | Latest valid date | Latest valid NDVI |
|---|---|---|---|---|---|---|---|---|---|
| MOD13Q1 (Terra) | Rangpur | 595 | 595 | 0 | 419 | 2000-12-18 | 2026-10-16 | 2026-10-16 | 0.7467 |
| MOD13Q1 (Terra) | Rajshahi | 595 | 595 | 0 | 396 | 2000-12-18 | 2026-10-16 | 2026-10-16 | 0.3443 |
| MOD13Q1 (Terra) | Sylhet | 595 | 595 | 0 | 426 | 2000-12-18 | 2026-10-16 | 2026-10-16 | 0.5991 |
| MYD13Q1 (Aqua) | all three | pending | — | — | — | — | — | — | — |

**Aqua status:** AppEEARS task `82e2e7e6-c38e-4210-92e5-8e470bd23e0f` was still processing when this report was generated. No Aqua values are shown.

## 6. Phase 10 requirement checklist

| Requirement | Status |
|---|---|
| GPM rolling last-30-days + extreme-rain count | Complete |
| GPM daily 2001-present | Pending: backfill script ready; GES DISC timeout |
| NASADEM mean elevation/slope per district | Complete (polygon means) |
| GRACE monthly TWS, regional label, gap marked | Complete |
| ECOSTRESS ET + LST, discrete revisits | Complete |
| MOD13Q1 Terra 16-day NDVI | Complete |
| MYD13Q1 Aqua 16-day NDVI | Pending: AppEEARS task processing |
| `public/cache/{dataset}/` metadata | Complete |
| GitHub Actions daily/monthly pipeline | Configured for rolling GPM, GRACE, AppEEARS download/process |
| GPM full-history automation | Manual `scripts/backfill_gpm_history.py` ready |

## 7. Data quality notes

- GES DISC was unreachable (connection timeout) during the GPM full-history attempt on 2026-11-09; the existing rolling 30-day cache was fetched successfully earlier.
- ECOSTRESS LST rows are heavily cloud-filtered: 39779 of 51,473 LSTE rows were rejected across all 64 districts. This is expected for thermal infrared in monsoon conditions.
- GRACE has no data for 2017-07..2018-05 (GRACE/GRACE-FO gap); those months are absent, not interpolated.
- MODIS pixel reliability 2/3 rows remain in the time series with `valid=false`; they are retained for transparency and excluded from latest-valid values.
- Source gap: Rangamati MOD13Q1 has no usable value on 2025-09-14; the date is missing, not filled.
- NASADEM elevations below -10 m are excluded as ocean/void artefacts; no terrestrial district is below -10 m. No interpolation is used.

## 8. Cache locations

- `public/cache/gpm/` — rolling 30-day per district + summary; full history in `public/cache/gpm/history/` once ingested.
- `public/cache/grace/` — `grace_regions.json`, `grace_summary.json`.
- `public/cache/nasadem/` — per-district elevation/slope + summary.
- `public/cache/ecostress/` — per-district ET/LST series + summary.
- `public/cache/modis_ndvi/mod13q1/` and `myd13q1/` — per-district NDVI + summaries.

## 9. Source citations

- GPM IMERG: `GPM_3IMERGDF.07` / `GPM_3IMERGDL.07`, NASA GES DISC.
- GRACE: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`, NASA PO.DAAC / JPL.
- NASADEM: `NASADEM_NC.001`, NASA LP DAAC.
- ECOSTRESS: `ECO_L3T_JET.002`, `ECO_L2T_LSTE.002`, NASA LP DAAC via AppEEARS.
- MODIS: `MOD13Q1.061`, `MYD13Q1.061`, NASA LP DAAC via AppEEARS.
- District polygons: HDX/OCHA COD-AB `bgd_admin2.geojson` (valid_on 2023-05-21).

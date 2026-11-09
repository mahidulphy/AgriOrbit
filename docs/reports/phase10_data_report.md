# Phase 10 — NASA Earth Observation Ingest

Generated: 2026-11-09T07:44:50.764045+00:00

Target districts: Rangpur, Rajshahi, Sylhet (all 64 districts are cached).

> All values below come from downloaded NASA products. No value is estimated, interpolated, or synthesized. Where a source has no value, the report says so.

## 1. GPM IMERG daily precipitation

- Rolling product: `GPM_3IMERGDL.07` (V07 (GPM_3IMERGDL.07, 3B-DAY-L.MS.MRG.3IMERG.*.V07C))
- Run: Late Run (calibrated microwave + IR multi-satellite, ~14-hour latency)
- Resolution: 0.1° x 0.1° (~10 km); sampling: Nearest 0.1° IMERG grid cell to each district headquarters coordinate (docs/data/district_points.csv); no area aggregation.
- Rolling window: 2026-10-09 to 2026-11-07 (30 days)
- Grid dimensions: `precipitation(time, lon, lat)`; selection: `OPeNDAP request is precipitation[time][lon][lat]; the parser receives one row per longitude (48 rows) and 63 latitude values per row. District selection is arr[lon_index, lat_index], not arr[lat_index, lon_index].`
- Full-history status: NOT YET INGESTED (rolling 30-day cache only)

| District | HQ latitude | HQ longitude | Nearest 0.1° cell | Absolute lon index | Absolute lat index | GPM cell centre used |
|---|---|---|---|---|---|---|
| Rangpur | 25.7439 | 89.2752 | 25.75, 89.25 | 2692 | 1157 | 25.75N, 89.25E |
| Rajshahi | 24.3745 | 88.6042 | 24.35, 88.65 | 2686 | 1143 | 24.35N, 88.65E |
| Sylhet | 24.8999 | 91.8721 | 24.85, 91.85 | 2718 | 1148 | 24.85N, 91.85E |

The IMERG array is ordered `precipitation(time, lon, lat)`; district values are read as `arr[lon_index, lat_index]`, not `arr[lat_index, lon_index]`. The slice covers 48 longitude columns and 63 latitude values. The exact absolute indices are recorded in each district JSON.

| District | GPM 30-day total (mm) | POWER 30-day total (mm) | POWER window | GPM same-window (mm) | POWER same-window (mm) | Difference, same window (mm) | Days in same window | Extreme days >= 50 mm (30 d) |
|---|---|---|---|---|---|---|---|---|
| Rangpur | 80.1 | 21.5 | 2026-10-07 to 2026-11-05 | 80.1 | 15.5 | 64.6 | 28 | 0 |
| Rajshahi | 55.7 | 28.6 | 2026-10-07 to 2026-11-05 | 55.7 | 17.5 | 38.2 | 28 | 0 |
| Sylhet | 26.3 | 24.1 | 2026-10-07 to 2026-11-05 | 26.3 | 19.5 | 6.8 | 28 | 0 |

The same-window columns compare GPM and POWER only on dates present in both sources; POWER daily data ends 2026-11-05 while GPM ends 2026-11-07. The POWER 30-day column is POWER's own last-30-day window and is not the same period.

On 28–30 October, GPM recorded 22.74, 39.70 and 14.24 mm in Rangpur, while POWER recorded 0.00, 0.20 and 2.08 mm on the same dates. **POWER did not capture this event.**

### GPM vs POWER daily values, 9 October–5 November 2026

| Date | Rangpur GPM | Rangpur POWER | Rajshahi GPM | Rajshahi POWER | Sylhet GPM | Sylhet POWER |
|---|---|---|---|---|---|---|
| 2026-10-09 | 0.77 | 5.50 | 0.00 | 5.12 | 0.00 | 0.77 |
| 2026-10-10 | 0.00 | 3.61 | 0.00 | 2.31 | 0.00 | 0.44 |
| 2026-10-11 | 0.00 | 0.95 | 0.00 | 0.14 | 0.00 | 0.00 |
| 2026-10-12 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 2026-10-13 | 0.00 | 0.00 | 0.00 | 0.00 | 0.07 | 0.00 |
| 2026-10-14 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.06 |
| 2026-10-15 | 0.00 | 0.01 | 0.00 | 0.00 | 0.00 | 0.06 |
| 2026-10-16 | 0.00 | 0.33 | 0.00 | 0.17 | 0.00 | 0.25 |
| 2026-10-17 | 0.00 | 0.27 | 0.00 | 0.40 | 0.00 | 0.17 |
| 2026-10-18 | 0.00 | 0.43 | 0.00 | 0.01 | 0.00 | 0.00 |
| 2026-10-19 | 0.00 | 0.18 | 0.00 | 0.00 | 0.00 | 0.00 |
| 2026-10-20 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 2026-10-21 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 2026-10-22 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.03 |
| 2026-10-23 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 2026-10-24 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.19 |
| 2026-10-25 | 0.00 | 0.00 | 0.00 | 0.00 | 0.02 | 0.00 |
| 2026-10-26 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 2026-10-27 | 2.67 | 0.00 | 0.69 | 0.68 | 0.00 | 0.17 |
| 2026-10-28 | 22.74 | 0.00 | 15.41 | 0.53 | 23.39 | 2.86 |
| 2026-10-29 | 39.70 | 0.20 | 17.70 | 2.32 | 0.00 | 3.70 |
| 2026-10-30 | 14.24 | 2.08 | 20.18 | 1.22 | 2.21 | 5.39 |
| 2026-10-31 | 0.00 | 0.14 | 0.00 | 0.62 | 0.07 | 2.21 |
| 2026-11-01 | 0.00 | 1.56 | 1.68 | 2.43 | 0.00 | 1.85 |
| 2026-11-02 | 0.00 | 0.26 | 0.00 | 1.36 | 0.00 | 1.27 |
| 2026-11-03 | 0.00 | 0.00 | 0.00 | 0.01 | 0.55 | 0.03 |
| 2026-11-04 | 0.00 | 0.00 | 0.00 | 0.06 | 0.00 | 0.00 |
| 2026-11-05 | 0.00 | 0.01 | 0.00 | 0.08 | 0.00 | 0.02 |

All values are mm/day. GPM values are the downloaded IMERG Late daily accumulation; POWER values are the downloaded `PRECTOTCORR` daily values. Blank or `-999` POWER values are shown as `n/a`, not replaced.

**Gap:** the full 2001-present daily series has not been ingested. The backfill script `scripts/backfill_gpm_history.py` is ready and uses Final through 2025-09-30 and Late from 2025-10-01. A GES DISC connection timeout prevented running it during this report.

## 2. GRACE / GRACE-FO total water storage (regional)

- Product: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`
- Source: NASA PO.DAAC / JPL — https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4/GRCTellus.JPL.200204_202608.GLO.RL06.3M.MSCNv04CRI.nc
- Effective resolution: Regional (~300 km); native: 3-degree equal-area JPL mascons
- Sampling: Native JPL mascon_ID mapped on the 0.5-degree CRI grid; districts grouped by mascon_ID
- Baseline: 2004-2009 mean; variable: lwe_thickness: terrestrial total water storage (TWS) anomaly in cm of liquid water equivalent relative to the 2004-2009 mean. TWS includes groundwater, soil moisture, surface water, snow/ice and vegetation water; it is NOT groundwater alone.
- Period: 2002-04-17 to 2026-08-16
- Gap: 2017-07 to 2018-05 — GRACE ended in 2017 and GRACE-FO science data resume in 2018; no values are interpolated.
- Deseasonalization: Mean seasonal cycle removed before trend fitting: for each calendar month the long-term mean TWS anomaly is subtracted across all valid years.
- Area method: ADM0 subpixel intersection (10x10 subpixels per 0.5-degree cell, cos-lat area weights)

### The five JPL mascons at district headquarters

| Mascon | Area inside Bangladesh | Districts at HQ | District names |
|---|---|---|---|
| JPL mascon 1213 (`1213`) | 2.02% | 1 | Thakurgaon |
| JPL mascon 1214 (`1214`) | 10.94% | 6 | Dinajpur, Kurigram, Lalmonirhat, Nilphamari, Panchagarh, Rangpur |
| JPL mascon 1320 (`1320`) | 12.27% | 5 | Chapai Nawabganj, Chuadanga, Meherpur, Naogaon, Rajshahi |
| JPL mascon 1321 (`1321`) | 79.27% | 46 | Bagerhat, Barishal, Bogura, Brahmanbaria, Chandpur, Cumilla, Dhaka, Faridpur, Feni, Gaibandha, Gazipur, Gopalganj, Habiganj, Jamalpur, Jashore, Jhalokati, Jhenaidah, Joypurhat, Khagrachari, Khulna, Kishoreganj, Kushtia, Lakshmipur, Madaripur, Magura, Manikganj, Moulvibazar, Munshiganj, Mymensingh, Narail, Narayanganj, Narsingdi, Natore, Netrokona, Noakhali, Pabna, Pirojpur, Rajbari, Rangamati, Satkhira, Shariatpur, Sherpur, Sirajganj, Sunamganj, Sylhet, Tangail |
| JPL mascon 1431 (`1431`) | 18.43% | 6 | Bandarban, Barguna, Bhola, Chattogram, Cox's Bazar, Patuakhali |

Adjacent mascons that intersect Bangladesh but contain no district HQ: `1322` (0.10%); `1430` (8.22%). These are metadata only and are not counted as target regions.

| District | Mascon | District cell lat/lon | Area inside BD | Districts sharing mascon | Latest TWS anomaly (cm) | Latest date | Deseasonalized 2002-2010 trend (cm/yr) | Deseasonalized 2016-present trend (cm/yr) | Months used |
|---|---|---|---|---|---|---|---|---|---|
| Rangpur | JPL mascon 1214 | 25.75, 89.25 | 10.94% | 6 | -29.25 | 2026-08-16 | -2.90 ± 0.24 | -3.68 ± 0.28 | 102 / 111 |
| Rajshahi | JPL mascon 1320 | 24.25, 88.75 | 12.27% | 5 | 15.44 | 2026-08-16 | -2.36 ± 0.23 | +0.14 ± 0.25 | 102 / 111 |
| Sylhet | JPL mascon 1321 | 24.75, 91.75 | 79.27% | 46 | 36.28 | 2026-08-16 | -0.19 ± 0.28 | +1.29 ± 0.22 | 102 / 111 |

GRACE measures total water storage (groundwater + soil moisture + surface water + snow/ice + vegetation water), not groundwater alone. These are regional trends, not district-level trends.

The 0.5° CRI grid is not independent data. The product attributes state the native resolution is 3° equal-area mascons; all 0.5° cells inside one mascon carry the same TWS value. The 64 district HQs therefore map to **5** mascons, not 64 regions. All districts in a mascon receive identical values and trends by construction; the 46 districts in mascon 1321 share one series.

The 2017-07..2018-05 gap is absent from all trend fits; no values were interpolated across it.

### Rangpur recent monthly values (mascon 1214)

| Month | TWS anomaly (cm) | Deseasonalized anomaly (cm) |
|---|---|---|
| 2025-09 | -20.76 | -32.35 |
| 2025-10 | -26.22 | -24.09 |
| 2025-11 | -43.99 | -26.62 |
| 2025-12 | -56.06 | -24.94 |
| 2026-01 | -63.90 | -26.88 |
| 2026-02 | -73.82 | -35.04 |
| 2026-03 | -66.33 | -23.80 |
| 2026-04 | -57.00 | -20.75 |
| 2026-05 | -45.54 | -17.65 |
| 2026-06 | -29.06 | -16.03 |
| 2026-07 | -26.56 | -35.13 |
| 2026-08 | -29.25 | -42.43 |

August climatology for mascon 1214 is +13.18 cm; August 2026 is -29.25 cm, an anomaly of -42.43 cm versus the August mean. The recent values are the downloaded monthly mascon series, not a district-level estimate.

- JPL mascon 1214: August 2026 -29.25 cm vs August mean +13.18 cm (-42.43 cm).
- JPL mascon 1320: August 2026 +15.44 cm vs August mean +17.79 cm (-2.35 cm).
- JPL mascon 1321: August 2026 +36.28 cm vs August mean +33.55 cm (+2.73 cm).

## 3. NASADEM elevation and slope (district polygons)

- Product: `NASADEM_NC.001` — NASADEM Merged DEM Global 1 arc second V001
- Source: NASA LP DAAC — https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_NC.001
- Resolution: 1 arc-second (~30 m); polygons: HDX/OCHA COD-AB ADM2 bgd_admin2.geojson (valid_on 2023-05-21)
- Method: Mean of NASADEM_HGT nodes whose coordinates fall inside the ADM2 polygon; slope from central-difference gradients of the 1 arc-second DEM, averaged over interior pixels with all four neighbours valid. NASADEM values below -10 m are excluded as ocean/void artefacts (no terrestrial district lies below -10 m); they are excluded, never replaced. No interpolation or estimation.
- Slope weighting: cos(latitude), proportional to 30 m pixel area; median method: Area-weighted median from a 0.01-degree slope histogram; unweighted median also stored.
- Main erosion indicator: `area_pct_slope_gt5_degrees`
- Caveat: Slope is a relative terrain indicator, not an absolute erosion rate. In the flat delta, small slope differences below 2 degrees matter; the share of area above 5 degrees is reported as the main erosion indicator.

| District | Mean elevation (m) | Min (m) | Max (m) | Mean slope (deg) | Median slope (deg) | Area >2° (%) | Area >5° (%) | Sampled area (km2) | Elevation pixels |
|---|---|---|---|---|---|---|---|---|---|
| Rangpur | 30.2 | 10.0 | 65.0 | 2.109 | 2.056 | 52.13 | 3.23 | 2369.43 | 2758245 |
| Rajshahi | 18.4 | -10.0 | 51.0 | 1.934 | 1.855 | 47.26 | 2.42 | 2429.06 | 2800495 |
| Sylhet | 13.1 | -10.0 | 147.0 | 2.762 | 2.242 | 63.30 | 10.79 | 3430.73 | 3969682 |

Area shares are area-weighted by `cos(latitude)`; unweighted median values are stored in the per-district JSON. The area above 5° is reported as the main erosion indicator. Slope is a relative terrain indicator, not an erosion rate; in the flat delta, differences below 2° are also meaningful. Elevations below -10 m are excluded as ocean/void artefacts, never replaced.

## 4. ECOSTRESS evapotranspiration and land surface temperature

- ET product: `ECO_L3T_JET.002` — ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m v002 (https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002)
- LST product: `ECO_L2T_LSTE.002` — ECOSTRESS Tiled Land Surface Temperature and Emissivity Instantaneous L2 Global 70 m v002 (https://doi.org/10.5067/ECOSTRESS/ECO_L2T_LSTE.002)
- Source: NASA LP DAAC via AppEEARS — https://appeears.earthdatacloud.nasa.gov/api/task/eb4fcd8a-53bd-4707-b8ba-7991d7e78960; resolution: 70 m x 70 m
- Period requested: 2019-01-01 to 2026-11-08; sampling: Point extraction at each district headquarters coordinate; one 70 m pixel per overpass.
- Timezone: Asia/Dhaka (UTC+06:00; Bangladesh has no daylight saving); day/night rule: solar_elevation_deg > 0 = day; solar_elevation_deg <= 0 = night.
- Solar elevation: NOAA approximate solar position from UTC timestamp and overpass latitude/longitude; used only for the day/night flag.
- Temporal note: ECOSTRESS has a non-sun-synchronous, precessing ISS orbit; revisit times are irregular and vary from hours to days. Discrete observations are kept as-is; no temporal interpolation.
- Units: mm/day (native ECO_L3T_JET.002 ETdaily; LP DAAC ECO_L2-4 Grid Tile User Guide V2 section 5.4 defines ETdaily as the daily integrated ET in millimeters per day); degrees C (converted from native Kelvin)
- Unit note: The Earthdata catalog table labels ETdaily as W/m2, but the LP DAAC User Guide V2 section 5.4 defines ETdaily as the daily ET integrated over daylight hours in mm/day. The downloaded values (0-5.93, median 1.86) are consistent with mm/day. Native values are reported as mm/day without rescaling.
- QC: ETdaily retained when 0 <= ETdaily <= 100 mm/day; no QC layer exists in ECO_L3T_JET.002. LST retained only when cloud mask is Clear, L1B data quality is Good, the mandatory QA flag confirms the pixel was produced by TES, LST accuracy is not ">2 K (poor)", and 250 K < LST < 350 K.

| District | ET obs (day/night) | Latest ET local time | ET flag | Latest ET (mm/day) | LST obs (day/night) | Latest LST local time | LST flag | Latest LST (C) |
|---|---|---|---|---|---|---|---|---|
| Rangpur | 55 (54/1) | 2026-10-06 08:02 | day | 2.252 | 125 (43/82) | 2026-10-26 00:19 | night | 24.15 |
| Rajshahi | 125 (125/0) | 2026-10-06 08:02 | day | 1.996 | 265 (104/161) | 2026-10-22 01:51 | night | 25.67 |
| Sylhet | 68 (67/1) | 2026-10-03 08:47 | day | 2.699 | 146 (58/88) | 2026-10-23 01:05 | night | 26.63 |

| District | Daytime LST obs (solar elevation > 0) | Latest daytime LST local time | Latest daytime LST (C) |
|---|---|---|---|
| Rangpur | 43 | 2026-10-06 08:02 | 27.27 |
| Rajshahi | 104 | 2026-10-06 08:02 | 28.99 |
| Sylhet | 58 | 2026-03-12 17:41 | 29.41 |

ECOSTRESS revisits are discrete and irregular (ISS orbit); the tables report the latest valid observations, not daily composites. The latest LST is a nighttime overpass for all three targets; the daytime-only series is kept separately in `lst_series_daytime`. Every ET and LST observation in the JSON has UTC time, Dhaka local time, solar elevation and a day/night flag. ETdaily is a daylight-integrated daily product; the flag describes the overpass timestamp, not the ET integration window. Cloudy/fill LST pixels are excluded, not filled.

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

## 6. MCD12Q1 land cover at the district headquarters

- Product: `MCD12Q1.061` — MODIS/Terra Land Cover Type Yearly L3 Global 500 m SIN Grid V061 (061)
- Source: NASA LP DAAC — https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/MCD12Q1.061/MCD12Q1.A2023001.h26v06.061.2024252132255/MCD12Q1.A2023001.h26v06.061.2024252132255.hdf
- Granule: `MCD12Q1.A2023001.h26v06.061.2024252132255.hdf`; year: 2023; resolution: 500 m x 500 m
- Sampling: Nearest 500 m MCD12Q1 pixel at each district headquarters coordinate and its 5x5 pixel neighbourhood (2.5 km x 2.5 km). No district-wide area fraction is computed from this point sample.
- Caveat: A 500 m land-cover class can mix urban, cropland and water within one pixel. The HQ point class describes that pixel, not the whole district. MCD12Q1 is not used to mask NDVI, LST or ET in this report.

| District | Centre class | Centre class name | Urban? | Water? | 5x5 counts (code:count) | 5x5 urban fraction |
|---|---|---|---|---|---|---|
| Rangpur | 13 | Urban and Built-up Lands | yes | no | 9:1, 12:6, 13:10, 14:8 | 0.40 |
| Rajshahi | 13 | Urban and Built-up Lands | yes | no | 9:1, 13:24 | 0.96 |
| Sylhet | 13 | Urban and Built-up Lands | yes | no | 9:1, 13:24 | 0.96 |

Class codes: 9 Savannas, 12 Croplands, 13 Urban and Built-up Lands, 14 Cropland/Natural Vegetation Mosaics, 17 Water Bodies. Checks: Dhaka is class 13; the Bay of Bengal check is class 17 (water).

All three headquarters pixels are **urban**, so the current NDVI, LST and ET point series describe urban pixels, not cropland. **Proposal only, not implemented:** exclude classes 13 and 17, retain classes 12 and 14, and sample 5-10 separated 500 m cropland pixels per district or compute a cropland-area-weighted district mean. MCD12Q1 is not used to mask NDVI, LST or ET in this report.

## 7. Phase 10 requirement checklist

| Requirement | Status |
|---|---|
| GPM rolling last-30-days + extreme-rain count | Complete |
| GPM exact 0.1° cell, dimension order and daily GPM-vs-POWER appendix | Complete |
| GPM daily 2001-present | Pending: backfill script ready; GES DISC timeout |
| NASADEM mean elevation/slope per district | Complete (polygon means) |
| NASADEM median and area shares >2° / >5° | Complete; >5° reported as main erosion indicator |
| GRACE monthly TWS, regional label, gap marked | Complete |
| GRACE true 5 mascons, area % inside Bangladesh, district membership | Complete |
| ECOSTRESS ET + LST, discrete revisits | Complete |
| ECOSTRESS local overpass time, solar elevation, day/night, daytime LST series | Complete |
| MOD13Q1 Terra 16-day NDVI | Complete |
| MYD13Q1 Aqua 16-day NDVI | Pending: AppEEARS task processing |
| MCD12Q1 HQ land-cover check | Complete (three HQ pixels urban) |
| `public/cache/{dataset}/` metadata | Complete |
| GitHub Actions daily/monthly pipeline | Configured for rolling GPM, GRACE, AppEEARS download/process |
| GPM full-history automation | Manual `scripts/backfill_gpm_history.py` ready |

## 8. Data quality notes

- GES DISC was unreachable (connection timeout) during the GPM full-history attempt on 2026-11-09; the existing rolling 30-day cache was fetched successfully earlier.
- GPM cells are 0.1° and point-sampled at the HQ; the exact cell centres and absolute indices are in the GPM JSON. On 28–30 October 2026, POWER is near zero in Rangpur while GPM records the event; POWER did not capture this event.
- GRACE is a regional mascon product. The older 46-cell grouping was a display-grid duplicate; the corrected cache groups all districts by `mascon_ID` into 5 regions. Mascon 1321 contains 46 district HQs, so those districts necessarily share one series.
- GRACE area percentages are computed by subpixel intersection with the HDX ADM0 boundary; the adjacent mascons 1322 and 1430 also touch Bangladesh but have no district HQ and are not counted as target regions.
- NASADEM slope is a relative terrain indicator, not an erosion rate. The >5° area share is the main indicator; >2° is context. Median values come from a 0.01° slope histogram and are area-weighted by `cos(latitude)`; unweighted medians are also stored.
- ECOSTRESS latest LST is a nighttime overpass for all three districts. The daytime-only LST series (`lst_series_daytime`) is separate and uses solar elevation > 0. Solar elevation is an astronomical approximation used only for the flag.
- MCD12Q1 is a 500 m annual product; the three HQ pixels are urban. This is a point check, not a district-wide cropland fraction. No cropland resampling has been implemented.
- ECOSTRESS LST rows are heavily cloud-filtered: 39779 of 51,473 LSTE rows were rejected across all 64 districts. This is expected for thermal infrared in monsoon conditions.
- MODIS pixel reliability 2/3 rows remain in the time series with `valid=false`; they are retained for transparency and excluded from latest-valid values.
- Source gap: Rangamati MOD13Q1 has no usable value on 2025-09-14; the date is missing, not filled.

## 9. Cache locations

- `public/cache/gpm/` — rolling 30-day per district + summary; full history in `public/cache/gpm/history/` once ingested.
- `public/cache/grace/` — `grace_regions.json`, `grace_summary.json` (5 mascons).
- `public/cache/nasadem/` — per-district elevation/slope + summary.
- `public/cache/ecostress/` — per-district ET/LST series + summary.
- `public/cache/modis_ndvi/mod13q1/` and `myd13q1/` — per-district NDVI + summaries.
- `public/cache/landcover/mcd12q1_hq.json` — HQ land-cover check and 5x5 counts.

## 10. Source citations

- GPM IMERG: `GPM_3IMERGDF.07` / `GPM_3IMERGDL.07`, NASA GES DISC.
- GRACE: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`, NASA PO.DAAC / JPL.
- NASADEM: `NASADEM_NC.001`, NASA LP DAAC.
- ECOSTRESS: `ECO_L3T_JET.002`, `ECO_L2T_LSTE.002`, NASA LP DAAC via AppEEARS.
- MODIS: `MOD13Q1.061`, `MYD13Q1.061`, NASA LP DAAC via AppEEARS.
- Land cover: `MCD12Q1.061`, NASA LP DAAC.
- District polygons: HDX/OCHA COD-AB `bgd_admin2.geojson` (valid_on 2023-05-21).

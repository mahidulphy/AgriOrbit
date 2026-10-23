# NASA Earthdata Observations Provenance & Quality Assurance

This document details the provenance, product specifications, retrieval methods, and Quality Assurance (QA) filtering rules for satellite earth observation datasets integrated into **AgriOrbit**.

---

## 1. AppEEARS Request Metadata

- **Request Name**: `agriorbit_bd_districts_oct2026`
- **Task ID**: `3d27655e-9af7-4df5-a83d-9785ec7600b9`
- **Location Coverage**: All 64 administrative districts of Bangladesh matching `BD_DISTRICTS`
- **Point Extraction Type**: `district_hq` (all time-series and composites extracted at official district headquarters geographic coordinates)
- **Extracted By**: `scripts/import-appeears.ts`
- **Target Output File**: `src/data/satellite.json`

---

## 2. Products, Sensor Physics & Quality Assurance Rules

### A. Soil Moisture: NASA SMAP (`SPL3SMP_E.006`)
- **Product Title**: SMAP Enhanced L3 Radiometer Global Daily 9 km EASE-Grid Soil Moisture
- **Spatial Resolution**: 9 km
- **Physical Unit**: $\text{m}^3/\text{m}^3$ (volumetric water content, top 0–5 cm rootzone layer)
- **Sensor & Physics**: Passive L-band microwave radiometer (~1.41 GHz).
  > **Cloud Transparency**: L-band microwave radiation has a wavelength of approximately 21 cm, which **completely penetrates clouds, fog, haze, and light atmospheric rain**. Cloud cover does **not** block SMAP observations.
- **QA Filtering Rules**:
  - Nulls in AgriOrbit arise **strictly** from retrieval quality flag disqualifications:
    - Retains only observations where `Recommended_Quality_Description` confirms `"has recommended quality"` (i.e. bit 0 of `retrieval_qual_flag` is `0`).
    - Excluded observations are disqualified by factors such as:
      - Excessive surface water fraction / standing water bodies within the 9 km antenna footprint.
      - Dense vegetation scattering and biomass attenuation.
      - Radio-Frequency Interference (RFI) from terrestrial radars/transmitters.
      - Complex topography or frozen soil conditions.
  - Physical validity boundary: $0.02 \le \text{soil} \le 0.60\text{ m}^3/\text{m}^3$. Fill values (`-9999`) are omitted.
  - Time window: latest recommended quality retrieval within the last 14 days of data (evaluating AM descending pass first, then PM ascending pass). If no observation in the 14-day window meets recommended quality, the district value is set strictly to `null`.
- **Water Contamination Flag (`possible_water_contamination`)**:
  - Any SMAP retrieval $> 0.50\text{ m}^3/\text{m}^3$ (e.g. Gopalganj at $0.570\text{ m}^3/\text{m}^3$, located in the low-lying Beel Route and flood basin) is preserved in `satellite.json` with `"flag": "possible_water_contamination"`.
  - **Engine Behavior**: The recommendation engine (`engine.ts`) treats flagged values as `null` for crop scoring and alerts to prevent false agronomic decisions, while the user interface transparently displays the measurement alongside the caution note: *"may include open water"*.

---

### B. Vegetation Health: NASA MODIS NDVI (`MOD13Q1.061`)
- **Product Title**: MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid
- **Spatial Resolution**: 250 m
- **Physical Unit**: Normalized Difference Vegetation Index (dimensionless ratio, $-1.0$ to $+1.0$)
- **Sensor & Physics**: Optical radiometer (Visible Red ~645 nm and Near-Infrared ~858 nm surface reflectance).
  > **Cloud Sensitivity**: Optical wavelengths are **absorbed and scattered by atmospheric cloud cover**. Cloudy pixels cannot measure surface vegetation.
- **QA Filtering Rules**:
  - `MOD13Q1_061__250m_16_days_pixel_reliability`: Keep only `0` (Good Quality) or `1` (Marginal Quality).
  - Cloudy pixels (`QA = 3`) and snow/ice (`QA = 2`) are discarded.
  - For districts cloudy in the latest composite (`2026-09-30`), the extraction looks back to the preceding valid 16-day period (`2026-09-14`).
  - Districts with persistent cloud cover across all evaluated periods (e.g. Narayanganj) evaluate strictly to `null`.

---

### C. Surface Thermal Dynamics: NASA MODIS LST (`MOD11A2.061`)
- **Product Title**: MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1km SIN Grid
- **Spatial Resolution**: 1 km
- **Physical Unit**: $^\circ\text{C}$ (Daytime and Nighttime Land Surface Temperature)
- **Sensor & Physics**: Thermal infrared channels (split-window bands 31 & 32, ~11–12 µm).
- **QA Filtering Rules**:
  - Unproduced readings (`0.0 K`) are skipped.
  - QC flags (`QC_Day_MODLAND` and `QC_Night_MODLAND`): keep `0b00` (good quality); keep `0b01` only if `LST_Error_Flag` is `0b00` ($\le 1\text{ K}$) or `0b01` ($\le 2\text{ K}$).
  - Converted from Kelvin to Celsius via $T(^\circ\text{C}) = T(\text{K}) - 273.15$, rounded to 1 decimal place.

---

## 3. District Summary & Null Layer Distribution (64 Districts)

| Layer | Valid | Null | Scientific Basis for Nulls |
| :--- | :--- | :--- | :--- |
| **NASA SMAP Soil Moisture** | 27 | 37 | Sub-grid surface water fraction, dense canopy attenuation, or RFI flag within 14-day window. Never blocked by clouds. |
| **NASA MODIS NDVI** | 63 | 1 | Narayanganj had persistent optical cloud cover (`QA = 3`) across composite periods. |
| **NASA MODIS LST Day** | 64 | 0 | All 64 districts successfully observed on `2026-10-08` with error $\le 2\text{ K}$. |
| **NASA MODIS LST Night** | 64 | 0 | All 64 districts successfully observed on `2026-10-08` with error $\le 2\text{ K}$. |

---

## 4. Agronomic Engine Threshold Alignment

All soil moisture parameters across the recommendation engine (`src/lib/engine.ts`), crop metadata (`src/data/crops.ts`), and satellite data (`src/data/satellite.json`) share identical units:
- **Unit**: $\text{m}^3/\text{m}^3$ (volumetric water content)
- **Dry Soil Deficit Threshold (`drySoil`)**: $0.15\text{ m}^3/\text{m}^3$ (penalizes high water demand crops when 30-day rain $< 50\text{ mm}$)
- **Optimal Sowing Range (`optimalSoil`)**: $[0.25, 0.30]\text{ m}^3/\text{m}^3$ (triggers optimal sowing readiness bonus for Rabi crops)
- **Zero Fallback / Clean Null Rule**: When a district's soil moisture is `null` or flagged (`possible_water_contamination`), the engine cleanly skips all soil moisture rules without hallucinating fallback or default values.

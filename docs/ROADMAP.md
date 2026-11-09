# AgriOrbit Field Shift Roadmap

## Global Honesty Rules
- **Real downloaded data only**: If a download, login, or API call fails, STOP and report the exact error. Never synthesize, calibrate, estimate, or fill values.
- **Full metadata provenance**: Every stored data file includes source URL, product short name + version, spatial resolution, download date, and the coordinates or area sampled.
- **User verification first**: Nothing new appears in the UI until sample numbers are reviewed and approved.
- **Honest resolution labels**: Label resolution honestly (e.g., GRACE is regional, ~300 km effective, not field level).
- **Security & Secrets**: Secrets only from env vars (`.env.local` / GitHub Secrets). Never print secrets or credentials to logs or markdown.

---

## Roadmap Phases

### Phase 10: New NASA Data (Complete — documented gaps)
Ingest real NASA Earth observations for all 64 district coordinates (and district averages where applicable) using NASA Earthdata credentials:
1. **GPM IMERG Daily** (`GPM_3IMERGDL` Late, or Final where available): Daily precipitation in mm for 2001–present (or available archive range), plus a rolling last-30-days file updated daily. Extreme rain days count (> 50 mm).
2. **NASADEM / SRTMGL1** via AppEEARS: Static mean elevation and mean slope per district (for waterlogging and erosion risk).
3. **GRACE-FO / GRACE JPL Mascon** (`TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.x` / equivalent) via PO.DAAC: Monthly terrestrial water storage anomaly (cm), 2002–present, sampled per district. Explicitly labeled as regional (~300 km resolution).
4. **ECOSTRESS** via AppEEARS: Evapotranspiration (`ECO3ETPTJPL` or current ET product) and Land Surface Temperature (`ECO2LSTE`) for district coordinates, 2019–present. Non-interpolated discrete revisit dates.
5. **MODIS MOD13Q1 NDVI** 16-day time series (2001–present) per district via ORNL DAAC subset REST API (for bare-field detection in Phase 11).
- Store datasets in `public/cache/{dataset}/` with standardized metadata.
- Configure daily/monthly automated pipelines in GitHub Actions.
- Documented gaps at finalization: MYD13Q1 Aqua NDVI AppEEARS task still processing; GPM 2001–present daily history not ingested because GES DISC timed out. Do not poll or invent replacements.
- GRACE is grouped by native `mascon_ID`: 64 district HQs map to 5 JPL mascons, not 64 independent regions.

### Phase 10b: Soil Data (Planned)
- Ingest ISRIC SoilGrids 250 m texture (clay/sand/silt), pH and organic carbon for Bangladesh.
- Aggregate each variable to district polygons and mask to MCD12Q1 cropland classes 12 and 14.
- Report median, range, sample count and the product's native uncertainty; do not interpolate beyond the published grids.
- Use the result as soil-health, waterlogging and erosion context in later phases.

### Phase 11: Agronomic & Climate Analysis
- Soil moisture anomaly computation.
- Net climatic water balance (Rainfall - ET).
- Extreme hazard tracking: Heat stress days, cold-injury days, extreme-rain days (> 50 mm).
- Data-driven bare-field and seasonal crop stress detection from MODIS 16-day NDVI.
- Two statistical trend methodologies with uncertainty bounds.
- Harmonization to Bangladesh district administrative boundaries.

### Phase 12: Cropping Rotation Upgrade
- Expansion of crop attributes: Net water consumption, biological N-fixation, erosion mitigation, organic matter contribution, pest-cycle disruption, livestock forage utility, local market income potential.
- Include the existing Boro–Fallow–T. Aman rotation as the current-practice baseline in the 3-strategy comparison.
- Priority-alignment scoring matrix.
- Farmer equipment and labor availability inputs.
- Information-gaps disclosure per strategy.

### Phase 13: Interactive Spatial Map
- Geospatial district layers and time slider.
- Climate vulnerability hotspots (groundwater stress, heat vulnerability, waterlogging).
- Side-by-side dataset overlay comparison.

### Phase 14: Scientific Methods & Trust
- Complete dataset documentation, native sensor resolutions, and harmonization methodology.
- Satellite observations vs. in-situ ground truth comparison.
- Uncertainty boundaries, physical sensor limits, and areas requiring local Upazila Agriculture Officer / SAAO verification.

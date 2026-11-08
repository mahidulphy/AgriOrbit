# AGRIORBIT

**NASA observes. AgriOrbit explains. Farmers decide.**

Explainable agricultural decision-support for Bangladesh, powered by NASA Earth observations (NASA POWER, SMAP, MODIS), and local agronomy (BARI/BRRI).

Team: Bay of Orbits

## Product flow

Landing Page → Login / Sign Up → Welcome / Onboarding → Select Your Farm Location (district + upazila + real map, two-way synced) → Farmer Priority → Analyze My Field → Field Analysis Dashboard → Crop Suitability → 3-Season Rotation → Explain Why → Final Advisory

The dashboard is never the first screen; it appears only after the full journey.

## Run locally

Prerequisites: Node.js 18+

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Run the advisory tests:
   `npm test`
4. Build for production:
   `npm run build`
5. Type-check:
   `npm run lint`

## Project structure

- `src/App.tsx` — hash router: `#/analyze` opens the tool, anything else is the landing page
- `src/types.ts` — shared domain types (location model, NASA data, crops, rotation)
- `src/i18n.ts` / `src/lang.tsx` — every user-facing string in EN + বাংলা, one place
- `src/data/` — `districts.ts` (64 districts by division), `bdAdmin.ts`, `agriData.ts` (curated agronomy), `crops.ts` (crop database), `satellite.ts` (SMAP/MODIS snapshots), `fallback-rangpur.json` (bundled last resort)
- `src/lib/` — `power.ts` (NASA POWER + Open-Meteo fetch, shared with the Node script), `conditions.ts` (30-day conditions + Hargreaves ET₀), `fieldShift.ts` (decade climate comparison), `engine.ts` (rule-based scoring + rotation), `weatherAdvisory.ts`, `data.ts` (live → cache → bundled loader), `geocode.ts`, `location.ts`, `nasaContext.ts`, `cropSuitability.ts`, `nav.ts`
- `src/services/` — `gpm.ts` (GPM rainfall metrics), `weatherForecast.ts` (7-day forecast metrics)
- `src/components/landing/` — one section per landing screen (`Hero`, `HeroCard`, `Steps`, `FieldShiftSection`, `WhySection`, `DataSection`, `RotationSection`, `EditorialCropAtlas`, `FinalCta`)
- `src/components/journey/` — `AuthScreen`, `WelcomeOnboarding`, `FarmLocationStep`, `FarmerPrioritySetup`, `AnalyzeMyFieldTransition`, `DashboardView`
- `src/components/map/BangladeshMap.tsx` — reusable real MapLibre Bangladesh map (5 km field context via Turf)
- `src/components/HeroMap.tsx` — hero minimap with orbit arc + district dots
- `src/components/dashboard/` — dashboard tiles, SMS advisory button, risk alerts, mini map, feedback loop
- `src/components/` — `WeatherAdvisory.tsx`, `CropRecommendation.tsx`, `SeasonRotation.tsx`, `ExplainWhyModal.tsx`, `HowItWorksModal.tsx`
- `src/components/common/` + `src/components/ui/` — shared brand, language, footer, and layout UI
- `src/components/analyze/AnalyzePage.tsx` — analyze entry screen
- `public/vendor/` — vendored MapLibre web worker (required: the worker URL
  Vite dev rewrites does not exist, so `setWorkerUrl` points here; do not delete)
- `public/cache/` — offline JSON cache for all 64 districts (refresh: `node scripts/fetch-cache.ts --all`)
- `scripts/fetch-cache.ts` — refreshes the offline cache and the bundled Rangpur snapshot
- `src/lib/weatherAdvisory.test.ts` — Node test runner suite (`npm test`)

## Theme (SPACE × EARTH × AGRICULTURE)

Background `#050B14` • Surface `#0B1626` • Electric Cyan `#00E5FF` (NASA / satellite / data) • Electric Lime `#B8FF3D` (agriculture / positive / primary CTA) • Text `#FFFFFF` / `#8FA3B8` • Danger `#FF5C5C` (warnings only)

## Data Sources & Provenance

- **Weather & Agrometeorology**: NASA POWER Point API (daily precipitation, T2M, T2M_MAX, RH2M, surface solar radiation) with Open-Meteo 7-day numerical weather forecasts.
- **Soil Moisture**: NASA SMAP Enhanced L3 Daily 9km (SPL3SMP_E.006) via NSIDC/AppEEARS. Values > 0.50 m³/m³ are treated as open-water / invalid.
- **Vegetation Canopy & Surface Temperature**: NASA MODIS 250m NDVI (MOD13Q1 / MYD13Q1) and MODIS 1km Day/Night LST (MOD11A2) via NASA ORNL DAAC REST API. (MODIS only; VIIRS is not used in production).
- **Agronomic Guidance & Crop Benchmarks**: Compiled from BARI & BRRI published guidance across 37 Bangladesh crops (32 research-backed; 5 estimated: Soybean, Jute, Sugarcane, Cotton, and Tobacco).
- **Administrative Boundaries & Coordinates**: 64 district coordinates and 495 upazila boundary polygons are compiled from public sources (Bangladesh Bureau of Statistics administrative tables & UN OCHA COD-AB Bangladesh boundary datasets).

## Notes

- Data loads with a 3-level safety net: live NASA POWER + Open-Meteo, then `public/cache/<district>.json`, then the bundled Rangpur snapshot — the demo never shows a blank screen.
- Map clicks reverse-geocode via OSM Nominatim with a local geometric fallback.
- Curated agronomy profiles cover Rangpur, Rajshahi, Khulna, and Dhaka;
  other districts use labeled regional approximations until curated.
- Rule-based only: no machine learning, no black box — every score has a written reason.

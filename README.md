# AGRIORBIT

**NASA observes. AgriOrbit explains. Farmers decide.**

Explainable agricultural decision-support for Bangladesh, powered by NASA Earth observations (POWER, SMAP, MODIS) and local agronomy.

Team: Bay of Orbits

## Product flow

Landing Page → Login / Sign Up → Welcome / Onboarding → Farm Location → Field Location → Farmer Priority → Analyze My Field → Field Analysis Dashboard → Crop Suitability → 3-Season Rotation → Explain Why → Final Advisory

The dashboard is never the first screen; it appears only after the full journey.

## Run locally

Prerequisites: Node.js 18+

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Build for production:
   `npm run build`
4. Type-check:
   `npm run lint`

## Project structure

- `src/App.tsx` — journey state machine (landing → auth → … → dashboard)
- `src/types.ts` — shared domain types (districts, NASA data, crops, rotation)
- `src/data/agriData.ts` — curated district observations, crop database, rotation plans
- `src/lib/cropSuitability.ts` — deterministic priority-based suitability engine
- `src/components/common/` — shared brand, language, and footer UI
- `src/components/journey/` — one screen per product step
- `src/components/CropRecommendation.tsx` — crop suitability grid
- `src/components/SeasonRotation.tsx` — 3-season plan + final advisory
- `src/components/ExplainWhyModal.tsx` — transparent rule audit
- `src/components/HowItWorksModal.tsx` — NASA → AgriOrbit → Farmer explainer

## Theme (SPACE × EARTH × AGRICULTURE)

Background `#050B14` • Surface `#0B1626` • Electric Cyan `#00E5FF` (NASA / satellite / data) • Electric Lime `#B8FF3D` (agriculture / positive / primary CTA) • Text `#FFFFFF` / `#8FA3B8` • Danger `#FF5C5C` (warnings only)

## Notes

- No live NASA APIs, auth backend, database, or ML in this cleanup phase.
- Data is intentionally curated for Rangpur (demo focus), Rajshahi, Khulna, and Dhaka.

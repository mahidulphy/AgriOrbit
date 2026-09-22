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

## Theme

`#2E1065` `#6D28D9` `#A855F7` `#E9D5FF`

## Notes

- No live NASA APIs, auth backend, database, or ML in this cleanup phase.
- Data is intentionally curated for Rangpur (demo focus), Rajshahi, Khulna, and Dhaka.

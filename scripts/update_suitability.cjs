const fs = require('fs');

let code = fs.readFileSync('src/lib/cropSuitability.ts', 'utf8');

// Normalize CRLF to LF
code = code.replace(/\r\n/g, '\n');

// 1. Ensure import of cropById
if (!code.includes("import { cropById } from '../data/crops';")) {
  code = code.replace(
    "import { CROPS_DATABASE } from '../data/agriData';",
    "import { CROPS_DATABASE } from '../data/agriData';\nimport { cropById } from '../data/crops';"
  );
}

// 2. Add estimated note in evaluateCropWithNasa
const evalTarget = `  // ─────────────────────────────────────────────────────────────
  // RULE 1: DRY STRESS PENALTY`;

const evalReplacement = `  const cropMeta = cropById(crop.id);
  if (cropMeta?.data_confidence === 'estimated') {
    dynamicObservationsBn.push('এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।');
    dynamicObservationsEn.push('Estimated data: unverified with field trials; confirm with local upazila agriculture office.');
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 1: DRY STRESS PENALTY`;

if (code.includes(evalTarget)) {
  code = code.replace(evalTarget, evalReplacement);
}

// 3. Update getRankedCrops
const rankTarget = `export function getRankedCrops(
  primary: FarmerPriorityId,
  secondary: FarmerPriorityId | null = null,
  season: SeasonFilter = 'All',
  telemetry?: TelemetryContext,
): CropData[] {
  const allCrops = Object.values(CROPS_DATABASE).map((crop) =>
    evaluateCropWithNasa(crop, primary, secondary, telemetry),
  );
  const sorted = [...allCrops].sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  return season === 'All' ? sorted : sorted.filter((c) => c.seasonEn === season);
}`;

const rankReplacement = `export function getRankedCrops(
  primary: FarmerPriorityId,
  secondary: FarmerPriorityId | null = null,
  season: SeasonFilter = 'All',
  telemetry?: TelemetryContext,
): CropData[] {
  const allCrops = Object.values(CROPS_DATABASE)
    .filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx)
    .map((crop) => evaluateCropWithNasa(crop, primary, secondary, telemetry));

  const sorted = [...allCrops].sort((a, b) => {
    if (b.suitabilityScore !== a.suitabilityScore) {
      return b.suitabilityScore - a.suitabilityScore;
    }
    const cropA = cropById(a.id);
    const cropB = cropById(b.id);
    if (cropA?.data_confidence === 'research' && cropB?.data_confidence !== 'research') return -1;
    if (cropB?.data_confidence === 'research' && cropA?.data_confidence !== 'research') return 1;
    return a.nameEn.localeCompare(b.nameEn);
  });
  return season === 'All' ? sorted : sorted.filter((c) => c.seasonEn === season);
}`;

if (code.includes(rankTarget)) {
  code = code.replace(rankTarget, rankReplacement);
}

fs.writeFileSync('src/lib/cropSuitability.ts', code, 'utf8');
console.log('Successfully updated src/lib/cropSuitability.ts');

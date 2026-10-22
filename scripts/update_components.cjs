const fs = require('fs');

// 1. Update CropRecommendation.tsx
{
  let content = fs.readFileSync('src/components/CropRecommendation.tsx', 'utf8');

  // Fix badge placement
  content = content.replace(
    /\{\/\* Dynamic Rule Trigger Badges \*\/\}\r?\n\s*\{isEstimated && \([\s\S]*?\)\}\r?\n\s*<div className="flex flex-wrap items-center gap-2">/,
    `{/* Dynamic Rule Trigger Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {isEstimated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'en' ? 'Estimated data' : 'আনুমানিক তথ্য'}
                </span>
              )}`
  );

  // Dynamic heading count
  content = content.replace(
    "{language === 'en' ? 'NASA Data-Driven Crop Compatibility' : '১০টি প্রধান ফসলের উপযোগিতা মূল্যায়ন'}",
    "{language === 'en' ? 'NASA Data-Driven Crop Compatibility' : `${displayedCrops.length}টি প্রধান ফসলের উপযোগিতা মূল্যায়ন`}"
  );

  // Dynamic All tab count
  content = content.replace(
    "{s === 'All' && (language === 'en' ? 'All (10)' : 'সকল')}",
    "{s === 'All' && (language === 'en' ? `All (${displayedCrops.length})` : `সকল (${displayedCrops.length})`)}"
  );

  fs.writeFileSync('src/components/CropRecommendation.tsx', content, 'utf8');
  console.log('Updated CropRecommendation.tsx');
}

// 2. Update ExplainWhyModal.tsx
{
  let content = fs.readFileSync('src/components/ExplainWhyModal.tsx', 'utf8');

  // Add AlertCircle to lucide imports if not present, and import cropById
  if (!content.includes('AlertCircle')) {
    content = content.replace(
      "import { X, Check, Database,",
      "import { X, Check, Database, AlertCircle,"
    );
  }
  if (!content.includes("from '../data/crops'")) {
    content = content.replace(
      "import { priorityInfluenceText } from '../lib/cropSuitability';",
      "import { priorityInfluenceText } from '../lib/cropSuitability';\nimport { cropById } from '../data/crops';"
    );
  }

  // Add isEstimated flag
  if (!content.includes('isEstimated =')) {
    content = content.replace(
      "const deltas = crop.deltas ?? {",
      "const isEstimated = cropById(crop.id)?.data_confidence === 'estimated';\n\n  const deltas = crop.deltas ?? {"
    );
  }

  // Add Estimated Data alert banner right at the top of Modal Body
  if (!content.includes('এই ফসলের তথ্য এখনো যাচাই করা হয়নি')) {
    content = content.replace(
      `<div className="p-6 sm:p-8 space-y-6">`,
      `<div className="p-6 sm:p-8 space-y-6">
          {/* Estimated Data Warning Banner */}
          {isEstimated && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-300 font-mono text-xs uppercase tracking-wider">
                  {language === 'en' ? 'Estimated Data' : 'আনুমানিক তথ্য'}
                </div>
                <p className="mt-1 text-amber-200/90 leading-relaxed text-xs">
                  {language === 'en'
                    ? 'This crop’s data has not yet been field-verified; please confirm with your local agriculture extension office.'
                    : 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।'}
                </p>
              </div>
            </div>
          )}`
    );
  }

  // Also add Estimated badge in header next to % Match
  if (!content.includes('isEstimated && (\n                <span className="font-mono text-xs')) {
    content = content.replace(
      `<span className="font-mono text-base font-bold text-[#B8FF3D]">
                {crop.suitabilityScore}% Match
              </span>`,
      `<span className="font-mono text-base font-bold text-[#B8FF3D]">
                {crop.suitabilityScore}% Match
              </span>
              {isEstimated && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  {language === 'en' ? 'Estimated data' : 'আনুমানিক তথ্য'}
                </span>
              )}`
    );
  }

  fs.writeFileSync('src/components/ExplainWhyModal.tsx', content, 'utf8');
  console.log('Updated ExplainWhyModal.tsx');
}

// 3. Update DashboardView.tsx
{
  let content = fs.readFileSync('src/components/journey/DashboardView.tsx', 'utf8');

  content = content.replace(
    "<span>{language === 'en' ? 'See all 10 crops →' : 'সকল ১০টি ফসল →'}</span>",
    "<span>{language === 'en' ? `See all ${rankedCrops.length} crops →` : `সকল ${rankedCrops.length}টি ফসল →`}</span>"
  );

  fs.writeFileSync('src/components/journey/DashboardView.tsx', content, 'utf8');
  console.log('Updated DashboardView.tsx');
}

// 4. Update Steps.tsx
{
  let content = fs.readFileSync('src/components/landing/Steps.tsx', 'utf8');

  content = content.replace(
    "import { CROPS_DATABASE } from '../../data/agriData.ts';",
    "import { CROPS } from '../../data/crops.ts';"
  );
  content = content.replace(
    "const cropCount = Object.keys(CROPS_DATABASE).length;",
    "const cropCount = CROPS.filter(c => c.recommendable).length;"
  );

  fs.writeFileSync('src/components/landing/Steps.tsx', content, 'utf8');
  console.log('Updated Steps.tsx');
}

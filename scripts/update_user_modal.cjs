const fs = require('fs');

let content = fs.readFileSync('src/components/auth/UserProfileModal.tsx', 'utf8');

// 1. Add CROP_CATEGORIES import
content = content.replace(
  "import { CROPS } from '../../data/crops';",
  "import { CROPS } from '../../data/crops';\nimport { CROP_CATEGORIES } from '../../data/cropCategories';"
);

// 2. Replace unorganized crop chips with categorized groups
const oldCropList = `<div className="flex flex-wrap gap-2">
                  {CROPS.map((crop) => {
                    const selected = profile.previousCrops.includes(crop.id);
                    return (
                      <button
                        type="button"
                        key={crop.id}
                        onClick={() => toggleCrop(crop.id)}
                        className={\`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border \${
                          selected
                            ? 'bg-[#B8FF3D]/15 border-[#B8FF3D] text-[#B8FF3D] font-bold shadow-sm'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }\`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {isBn ? crop.nameBn : crop.nameEn}
                      </button>
                    );
                  })}
                </div>`;

const newCropList = `<div className="space-y-4">
                  {CROP_CATEGORIES.map((cat) => {
                    const catCrops = CROPS.filter((c) => c.category === cat.id);
                    if (catCrops.length === 0) return null;
                    return (
                      <div key={cat.id} className="p-3 rounded-xl bg-[#050B14] border border-white/5">
                        <div className="text-[11px] font-mono font-bold text-[#00E5FF] mb-2 uppercase tracking-wider">
                          {isBn ? cat.nameBn : cat.nameEn}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {catCrops.map((crop) => {
                            const selected = profile.previousCrops.includes(crop.id);
                            return (
                              <button
                                type="button"
                                key={crop.id}
                                onClick={() => toggleCrop(crop.id)}
                                className={\`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border \${
                                  selected
                                    ? 'bg-[#B8FF3D]/15 border-[#B8FF3D] text-[#B8FF3D] font-bold shadow-sm'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }\`}
                              >
                                {selected ? '✓ ' : '+ '}
                                {isBn ? crop.nameBn : crop.nameEn}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>`;

// Normalize line endings for replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldCropList.replace(/\r\n/g, '\n');
const normalizedNew = newCropList.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOld)) {
  content = normalizedContent.replace(normalizedOld, normalizedNew);
  fs.writeFileSync('src/components/auth/UserProfileModal.tsx', content, 'utf8');
  console.log('Successfully updated UserProfileModal.tsx');
} else {
  console.error('Could not find oldCropList in UserProfileModal.tsx');
  process.exit(1);
}

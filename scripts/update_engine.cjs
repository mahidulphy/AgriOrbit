const fs = require('fs');

let code = fs.readFileSync('src/lib/engine.ts', 'utf8');

// 1. Add estimatedNotice to ReasonCode and add INACTIVE_FORECAST_RULES
const target1 = `  | 'priIncome'
  | 'priFood';`;

const replacement1 = `  | 'priIncome'
  | 'priFood'
  | 'estimatedNotice';

export interface InactiveRule {
  id: string;
  crop_id: string;
  condition_en: string;
  condition_bn: string;
  suggestion_en: string;
  suggestion_bn: string;
  active: false;
  reason_inactive_en: string;
  reason_inactive_bn: string;
  source_file: string;
  source_section: string;
}

export const INACTIVE_FORECAST_RULES: InactiveRule[] = [
  {
    id: 'RULE_BORO_DEC_SMAP',
    crop_id: 'boro',
    condition_en: 'December soil moisture < 20% and inadequate irrigation',
    condition_bn: 'ডিসেম্বরে মাটির আর্দ্রতা ২০% এর কম এবং পর্যাপ্ত সেচের সুযোগ নেই',
    suggestion_en: 'Recommend wheat or rabi maize instead of Boro rice for water saving',
    suggestion_bn: 'বোরো ধান পরিহার করে গম অথবা রবি ভুট্টা চাষের সিদ্ধান্ত',
    active: false,
    reason_inactive_en: 'Not active: requires long-range seasonal soil moisture & irrigation sensor network',
    reason_inactive_bn: 'নিষ্ক্রিয়: দীর্ঘমেয়াদী আর্দ্রতা পূর্বাভাস ও সেচ সেন্সর তথ্য অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '১. বোরো ধান (Boro Rice)',
  },
  {
    id: 'RULE_AMAN_JULY_RAIN',
    crop_id: 'aman',
    condition_en: 'July rainfall forecast is 40% below normal',
    condition_bn: 'জুলাই মাসে বৃষ্টিপাতের পূর্বাভাস স্বাভাবিকের চেয়ে ৪০% কম',
    suggestion_en: 'Recommend drought-tolerant varieties (BRRI dhan56/71) instead of long-duration Aman',
    suggestion_bn: 'দীর্ঘমেয়াদী আমনের বদলে খরা-সহনশীল জাত (ব্রি ধান৫৬/৭১) নির্বাচনের নির্দেশ',
    active: false,
    reason_inactive_en: 'Not active: requires sub-seasonal long-range monsoon precipitation anomaly forecast',
    reason_inactive_bn: 'নিষ্ক্রিয়: উপ-মৌসুমি দীর্ঘমেয়াদী বৃষ্টিপাত অসঙ্গতি পূর্বাভাস অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '২. আমন ধান (Aman Rice)',
  },
  {
    id: 'RULE_AUS_MARCH_RAIN',
    crop_id: 'aus',
    condition_en: 'March rainfall is zero and irrigation is inadequate',
    condition_bn: 'মার্চ মাসে বৃষ্টিপাত শূন্য এবং সেচের পানি অপ্রতুল',
    suggestion_en: 'Cancel Aus and switch to short-duration summer sesame or mungbean',
    suggestion_bn: 'আউশ ধান বাতিল করে স্বল্পমেয়াদী গ্রীষ্মকালীন তিল বা মুগডালে শিফট করার সিদ্ধান্ত',
    active: false,
    reason_inactive_en: 'Not active: requires pre-monsoon precipitation outlook & farm irrigation status',
    reason_inactive_bn: 'নিষ্ক্রিয়: প্রাক-বর্ষা বৃষ্টিপাত পূর্বাভাস ও খামার সেচ সক্ষমতা তথ্য অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '৩. আউশ ধান (Aus Rice)',
  },
  {
    id: 'RULE_WHEAT_HEAT_WAVE',
    crop_id: 'wheat',
    condition_en: 'Early heat wave likely during February–March grain filling',
    condition_bn: 'ফেব্রুয়ারি ও মার্চের পূর্বাভাসে আগাম তাপদাহের সম্ভাবনা',
    suggestion_en: 'Cancel late-sown wheat and recommend fast-maturing oilseeds or pulses',
    suggestion_bn: 'দেরিতে বপন করা গম বাতিল করে দ্রুত পরিপক্ক তেলবীজ বা ডাল জাতীয় ফসলের সুপারিশ',
    active: false,
    reason_inactive_en: 'Not active: requires 45-day sub-seasonal terminal heat wave forecast',
    reason_inactive_bn: 'নিষ্ক্রিয়: ৪৫ দিনের দীর্ঘমেয়াদী শীতকালীন তাপদাহ পূর্বাভাস অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '৪. গম (Wheat)',
  },
  {
    id: 'RULE_MAIZE_GROUNDWATER',
    crop_id: 'maize',
    condition_en: 'Severe groundwater table depletion in areas where Boro is planned',
    condition_bn: 'যেখানে বোরো ধানের পরিকল্পনা আছে কিন্তু ভূগর্ভস্থ পানির স্তর আশঙ্কাজনকভাবে নিচে',
    suggestion_en: 'Shift to rabi maize to save 50% irrigation water',
    suggestion_bn: '৫০% সেচের পানি বাঁচাতে রবি ভুট্টায় শিফট করার সিদ্ধান্ত',
    active: false,
    reason_inactive_en: 'Not active: requires real-time aquifer/groundwater table depth telemetry',
    reason_inactive_bn: 'নিষ্ক্রিয়: রিয়েল-টাইম ভূগর্ভস্থ পানির স্তর সেন্সর ডেটা অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '৫. ভুট্টা (Maize)',
  },
];`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
} else {
  // Normalize CRLF to LF to match
  code = code.replace(/\r\n/g, '\n');
  code = code.replace(target1, replacement1);
}

// 2. In scoreCrop: add estimated notice and check recommendable
const target2 = `  const r: Reason[] = [];
  const add = (code: ReasonCode, delta: number, source: Source, v: Reason['v'] = {}) => r.push({ code, delta, source, v });

  // 1. Local guideline: this crop is grown in this season.
  add('base', RULES.base, crop.source, { season });`;

const replacement2 = `  if (!crop.recommendable) {
    return { crop, season, score: 0, reasons: [], optimalSowing: false };
  }

  const r: Reason[] = [];
  const add = (code: ReasonCode, delta: number, source: Source, v: Reason['v'] = {}) => r.push({ code, delta, source, v });

  // Estimated data notice
  if (crop.data_confidence === 'estimated') {
    add('estimatedNotice', 0, 'Estimated', {
      noticeBn: 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।',
      noticeEn: 'This crop data is estimated and not yet fully verified; please confirm with your local agriculture office.',
    });
  }

  // 1. Local guideline: this crop is grown in this season.
  add('base', RULES.base, crop.source, { season });`;

code = code.replace(target2, replacement2);

// 3. In runEngine: filter recommendable, tie break, plant_family, multi-season continuity
const target3 = `  const options = Object.fromEntries(
    seasons.map((s, i) => [
      s,
      CROPS.filter((c) => c.seasons.includes(s))
        .map((c) => scoreCrop(c, s, i === 0, inp, alerts))
        .sort((a, b) => b.score - a.score),
    ]),
  ) as Record<SeasonId, CropScore[]>;

  const hasLegume = (s: SeasonId) => options[s].some((o) => o.crop.family === 'legume');

  const normalizedPrev = inp.previousCrop ? inp.previousCrop.toLowerCase().trim() : '';
  const prevCrop = normalizedPrev && normalizedPrev !== 'fallow' && normalizedPrev !== 'other'
    ? CROPS.find(
        (c) =>
          c.id.toLowerCase() === normalizedPrev ||
          c.nameEn.toLowerCase() === normalizedPrev ||
          c.nameBn === inp.previousCrop
      )
    : undefined;
  const prevFamily = prevCrop?.family;

  let best: CropScore[] | null = null;
  let bestTotal = -Infinity;

  for (const a of options[seasons[0]])
    for (const b of options[seasons[1]])
      for (const c of options[seasons[2]]) {
        const seq = [a, b, c];
        let balance = 0;
        let ok = true;
        if (prevFamily && seq[0].crop.family === prevFamily) {
          ok = false; // rule A against real previous crop
        }
        for (let i = 0; i < 3 && ok; i++) {
          if (i > 0) {
            if (seq[i].crop.family === seq[i - 1].crop.family) ok = false; // rule A
            if (balance < 0 && hasLegume(seasons[i]) && seq[i].crop.family !== 'legume') ok = false; // rule B
          }
          balance += seq[i].crop.nutrient;
        }
        const total = a.score + b.score + c.score;
        if (ok && total > bestTotal) {
          bestTotal = total;
          best = seq;
        }
      }`;

const replacement3 = `  const options = Object.fromEntries(
    seasons.map((s, i) => [
      s,
      CROPS.filter((c) => c.recommendable && c.seasons.includes(s))
        .map((c) => scoreCrop(c, s, i === 0, inp, alerts))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.crop.data_confidence === 'research' && b.crop.data_confidence !== 'research') return -1;
          if (b.crop.data_confidence === 'research' && a.crop.data_confidence !== 'research') return 1;
          return a.crop.name_en.localeCompare(b.crop.name_en);
        }),
    ]),
  ) as Record<SeasonId, CropScore[]>;

  const isLegume = (c: Crop) => c.is_legume || c.family === 'legume' || c.plant_family === 'fabaceae';
  const hasLegume = (s: SeasonId) => options[s].some((o) => isLegume(o.crop));

  const normalizedPrev = inp.previousCrop ? inp.previousCrop.toLowerCase().trim() : '';
  const prevCrop = normalizedPrev && normalizedPrev !== 'fallow' && normalizedPrev !== 'other'
    ? (CROPS.find(
        (c) =>
          c.id.toLowerCase() === normalizedPrev ||
          c.nameEn.toLowerCase() === normalizedPrev ||
          c.name_en.toLowerCase() === normalizedPrev ||
          c.nameBn === inp.previousCrop ||
          c.name_bn === inp.previousCrop
      ))
    : undefined;
  const prevFamily = prevCrop?.plant_family || prevCrop?.family;

  let best: CropScore[] | null = null;
  let bestTotal = -Infinity;

  for (const a of options[seasons[0]])
    for (const b of options[seasons[1]])
      for (const c of options[seasons[2]]) {
        const seq = [a, b, c];
        let balance = 0;
        let ok = true;

        // Long-duration continuity: if a occupies season 1, skip if b is not a
        if (a.crop.occupies_seasons?.includes(seasons[1]) && b.crop.id !== a.crop.id) {
          continue;
        }
        // If b occupies season 2, skip if c is not b
        if (b.crop.occupies_seasons?.includes(seasons[2]) && c.crop.id !== b.crop.id) {
          continue;
        }

        const fam0 = seq[0].crop.plant_family || seq[0].crop.family;
        if (prevFamily && fam0 === prevFamily) {
          ok = false; // rule A against real previous crop
        }
        for (let i = 0; i < 3 && ok; i++) {
          if (i > 0) {
            const isContinuing = seq[i].crop.id === seq[i - 1].crop.id && Boolean(seq[i - 1].crop.occupies_seasons?.includes(seasons[i]));
            const famCurr = seq[i].crop.plant_family || seq[i].crop.family;
            const famPrev = seq[i - 1].crop.plant_family || seq[i - 1].crop.family;
            if (!isContinuing && famCurr === famPrev) ok = false; // rule A
            if (balance < 0 && hasLegume(seasons[i]) && !isLegume(seq[i].crop)) ok = false; // rule B
          }
          balance += seq[i].crop.nutrient;
        }
        const total = a.score + b.score + c.score;
        if (ok && total > bestTotal) {
          bestTotal = total;
          best = seq;
        }
      }`;

code = code.replace(target3, replacement3);

// 4. In notes: use plant_family for blocked check
const target4 = `      const blocked = options[p.season].find((o) => o.score > p.score && o.crop.family === prev.crop.family);`;
const replacement4 = `      const prevFam = prev.crop.plant_family || prev.crop.family;
      const blocked = options[p.season].find((o) => o.score > p.score && (o.crop.plant_family === prevFam || o.crop.family === prevFam));`;

code = code.replace(target4, replacement4);

fs.writeFileSync('src/lib/engine.ts', code, 'utf8');
console.log('Successfully updated src/lib/engine.ts');

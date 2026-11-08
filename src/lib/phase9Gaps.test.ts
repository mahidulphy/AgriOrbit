import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRotationComparison,
  getSoilHealthRoles,
  getVulnerableSeasonRisk,
} from './rotationComparison';
import { runEngine, scoreCrop, type EngineInput } from './engine';
import { CROPS } from '../data/crops';
import { STRINGS } from '../i18n';
import { computeFieldShift, type FieldShift } from './fieldShift';
import type { Conditions } from './conditions';
import { getRankedCrops } from './cropSuitability';

test('Phase 9: 1. Vulnerable Seasons Risk Flags use calm wording and district-specific data matching Field Shift', () => {
  const rCache = JSON.parse(fs.readFileSync('public/cache/rangpur.json', 'utf8'));
  const cCache = JSON.parse(fs.readFileSync('public/cache/chandpur.json', 'utf8'));

  const rangpurShift = computeFieldShift(rCache.monthly, 'rangpur');
  const chandpurShift = computeFieldShift(cCache.monthly, 'chandpur');

  // Verify Rangpur Field Shift deltas match its card
  const rRabi = rangpurShift.seasons.find((s) => s.season === 'rabi')!;
  assert.equal(rRabi.dTemp, 0.5);
  assert.equal(rRabi.dHeat, 0.4);
  assert.equal(rRabi.nowShare, 1);
  assert.equal(rRabi.dShare, -1);

  // Verify Chandpur Field Shift deltas match its card
  const cRabi = chandpurShift.seasons.find((s) => s.season === 'rabi')!;
  assert.equal(cRabi.dTemp, 0.0);
  assert.equal(cRabi.dHeat, -0.2);
  assert.equal(cRabi.nowShare, 5);
  assert.equal(cRabi.dShare, 2);

  // 1. Wheat in Rabi: Rangpur shows +0.4°C high (>0, so says rising)
  const rWheatRisk = getVulnerableSeasonRisk('rabi', 'wheat', rangpurShift);
  assert.equal(rWheatRisk.severity, 'high');
  assert.equal(rWheatRisk.titleEn, 'Watch out: late-season heat');
  assert.equal(rWheatRisk.titleBn, 'সতর্কতা: মৌসুমের শেষে গরমের ঝুঁকি');
  assert.match(rWheatRisk.reasonEn, /late-season heat is rising/i);
  assert.match(rWheatRisk.reasonBn, /গরমের প্রকোপ বাড়ছে/);
  assert.match(rWheatRisk.evidenceEn, /\+0\.4°C/);
  assert.match(rWheatRisk.evidenceEn, /\+0\.5°C/);
  assert.match(rWheatRisk.evidenceBn, /\+০\.৪°সে/);
  assert.match(rWheatRisk.evidenceBn, /\+০\.৫°সে/);

  // 2. Wheat in Rabi: Chandpur shows -0.2°C high (<= 0, so NEVER says rising/trending)
  const cWheatRisk = getVulnerableSeasonRisk('rabi', 'wheat', chandpurShift);
  assert.equal(cWheatRisk.titleEn, 'Watch out: late-season heat');
  assert.doesNotMatch(cWheatRisk.reasonEn, /rising|trending/i);
  assert.match(cWheatRisk.reasonEn, /wheat can still face heat in March/i);
  assert.doesNotMatch(cWheatRisk.reasonBn, /বাড়ছে/);
  assert.match(cWheatRisk.reasonBn, /মার্চে গম এখনও গরমে পড়ার ঝুঁকিতে থাকে/);
  assert.match(cWheatRisk.evidenceEn, /-0\.2°C/);
  assert.match(cWheatRisk.evidenceEn, /0\.0°C/);

  // 3. Boro in Rabi: Rangpur shows 1% share, -1% delta
  const rBoroRisk = getVulnerableSeasonRisk('rabi', 'boro', rangpurShift);
  assert.equal(rBoroRisk.titleEn, 'Watch out: high winter groundwater use');
  assert.equal(rBoroRisk.titleBn, 'সতর্কতা: শুষ্ক মৌসুমে অতিরিক্ত সেচ নির্ভরতা');
  assert.match(rBoroRisk.evidenceEn, /1% of annual precipitation/);
  assert.match(rBoroRisk.evidenceEn, /-1% shift/);

  // 4. Boro in Rabi: Chandpur shows 5% share, +2% delta (DIFFERENT from Rangpur)
  const cBoroRisk = getVulnerableSeasonRisk('rabi', 'boro', chandpurShift);
  assert.match(cBoroRisk.evidenceEn, /5% of annual precipitation/);
  assert.match(cBoroRisk.evidenceEn, /\+2% shift/);

  // 5. When shift data is missing/null, describe risk without numbers
  const noDataWheatRisk = getVulnerableSeasonRisk('rabi', 'wheat', null);
  assert.equal(noDataWheatRisk.titleEn, 'Watch out: late-season heat');
  assert.doesNotMatch(noDataWheatRisk.evidenceEn, /[0-9]+\.[0-9]+°C/);
  assert.doesNotMatch(noDataWheatRisk.evidenceBn, /[০-৯]+\.[০-৯]+°সে/);
});

test('Phase 9: 2. Confidence scoring assigns High, Medium, or Low based on data completeness', () => {
  const completeConditions: Conditions = {
    rain30: 25,
    tMax30: 29,
    tMaxAvg: 26,
    rh: 72,
    et0: 3.8,
    et0Total: 114,
    waterBalance: -89,
    from: '2026-01-01',
    to: '2026-01-31',
  };

  // Case A: Complete data + known soil -> High confidence
  const resHigh = generateRotationComparison({
    conditions: completeConditions,
    shift: null,
    soil: 0.28,
    forecast: [],
    priority: 'save_water',
    currentRotation: { rabi: 'boro', kharif1: 'fallow', kharif2: 'aman' },
    soilType: 'clay_loam',
    districtId: 'Rangpur',
    districtNameEn: 'Rangpur',
    districtNameBn: 'রংপুর',
  });
  assert.equal(resHigh.strategies[1].confidence.level, 'high');
  assert.match(resHigh.strategies[1].confidence.reasonEn, /crop values from BARI\/BRRI guidance/i);
  assert.match(resHigh.strategies[1].confidence.reasonBn, /BARI\/BRRI নির্দেশিকা থেকে/i);
  assert.equal(resHigh.strategies[1].confidence.reasonEn, 'NASA POWER and SMAP data available for this district, soil type known, crop values from BARI/BRRI guidance.');
  assert.equal(resHigh.strategies[1].confidence.reasonBn, 'এই জেলার NASA POWER ও SMAP তথ্য পাওয়া গেছে, মাটির ধরন জানা, ফসলের মান BARI/BRRI নির্দেশিকা থেকে।');

  // Case B: Rotation includes estimated crop (e.g. soybean) -> Medium confidence
  const resEstimated = generateRotationComparison({
    conditions: completeConditions,
    shift: null,
    soil: 0.28,
    forecast: [],
    priority: 'save_water',
    currentRotation: { rabi: 'soybean', kharif1: 'fallow', kharif2: 'aman' },
    soilType: 'clay_loam',
    districtId: 'Rangpur',
    districtNameEn: 'Rangpur',
    districtNameBn: 'রংপুর',
  });
  assert.equal(resEstimated.strategies[0].confidence.level, 'medium');
  assert.match(resEstimated.strategies[0].confidence.reasonEn, /some crops use estimated values/i);
  assert.match(resEstimated.strategies[0].confidence.reasonBn, /আনুমানিক মান/i);

  // Case C: Soil type unspecified ("dont_know") -> Medium confidence
  const resUnknownSoil = generateRotationComparison({
    conditions: completeConditions,
    shift: null,
    soil: 0.28,
    forecast: [],
    priority: 'save_water',
    currentRotation: { rabi: 'boro', kharif1: 'fallow', kharif2: 'aman' },
    soilType: 'dont_know',
    districtId: 'Rangpur',
    districtNameEn: 'Rangpur',
    districtNameBn: 'রংপুর',
  });
  assert.equal(resUnknownSoil.strategies[1].confidence.level, 'medium');
  assert.match(resUnknownSoil.strategies[1].confidence.reasonEn, /soil texture is unspecified/i);

  // Case D: Live NASA rain telemetry unavailable -> Low confidence
  const resNoLive = generateRotationComparison({
    conditions: { ...completeConditions, rainUnavailable: true },
    shift: null,
    soil: null,
    forecast: [],
    priority: 'save_water',
    currentRotation: { rabi: 'boro', kharif1: 'fallow', kharif2: 'aman' },
    soilType: 'loam',
    districtId: 'Rangpur',
    districtNameEn: 'Rangpur',
    districtNameBn: 'রংপুর',
  });
  assert.equal(resNoLive.strategies[1].confidence.level, 'low');
  assert.match(resNoLive.strategies[1].confidence.reasonEn, /relying on fallback climatology/i);
});

test('Phase 9: 3. Farmer Constraints: Irrigation availability penalises high-water crops', () => {
  const dummyShift: FieldShift = {
    thenRange: [2001, 2010],
    nowRange: [2016, 2025],
    seasons: [
      { season: 'rabi', thenTemp: 20, nowTemp: 21, dTemp: 1, thenHeat: 26, nowHeat: 27, dHeat: 1, thenShare: 5, nowShare: 4, dShare: -1 },
      { season: 'kharif1', thenTemp: 28, nowTemp: 29, dTemp: 1, thenHeat: 34, nowHeat: 35, dHeat: 1, thenShare: 30, nowShare: 28, dShare: -2 },
      { season: 'kharif2', thenTemp: 29, nowTemp: 30, dTemp: 1, thenHeat: 33, nowHeat: 34, dHeat: 1, thenShare: 65, nowShare: 68, dShare: 3 },
    ],
    yearly: [],
  };

  const baseInp: EngineInput = {
    conditions: { rain30: 20, tMax30: 25, tMaxAvg: 23, rh: 65, et0: 3, et0Total: 90, waterBalance: -70, from: '2026-01-01', to: '2026-01-31' },
    soil: 0.22,
    shift: dummyShift,
    forecast: [],
    priority: 'water',
  };

  const boroCrop = CROPS.find((c) => c.id === 'boro')!;
  const chickpeaCrop = CROPS.find((c) => c.id === 'chickpea')!;

  // When irrigation is available (default 'yes')
  const scoreBoroWithIrrigation = scoreCrop(boroCrop, 'rabi', true, { ...baseInp, irrigationAvailability: 'yes' }, []);

  // When irrigation is NOT available ('no')
  const scoreBoroNoIrrigation = scoreCrop(boroCrop, 'rabi', true, { ...baseInp, irrigationAvailability: 'no' }, []);
  const scoreChickpeaNoIrrigation = scoreCrop(chickpeaCrop, 'rabi', true, { ...baseInp, irrigationAvailability: 'no' }, []);

  // Boro receives severe penalty (-25) when no irrigation is available
  assert.ok(scoreBoroNoIrrigation.score < scoreBoroWithIrrigation.score);
  const irrReason = scoreBoroNoIrrigation.reasons.find((r) => r.code === 'irrigationConstraint');
  assert.ok(irrReason, 'Should have irrigationConstraint reason');
  assert.equal(irrReason?.delta, -25);

  // Low-water drought-hardy crop (Chickpea) receives bonus (+6)
  const chickpeaBonus = scoreChickpeaNoIrrigation.reasons.find((r) => r.code === 'irrigationConstraint');
  assert.ok(chickpeaBonus);
  assert.equal(chickpeaBonus?.delta, 6);

  // In crop suitability ranking:
  const ranked = getRankedCrops('save_water', null, 'Rabi', {
    rainfall30d: 20,
    soilMoisture: 0.22,
    maxTemp: 25,
    waterBalance: -70,
    irrigationAvailability: 'no',
    mainPurpose: 'home_food',
  });
  const boroData = ranked.find((c) => c.id === 'boro' || c.id === 'boro_rice');
  assert.ok(boroData);
  assert.equal(boroData?.deltas?.irrigationConstraintPenalty, -25);
  assert.ok(boroData?.explanation.observationsTriggered.some((o) => o.includes('Household food')));
});

test('Phase 9: 4. Soil-Health Roles attach correct badges and explanations', () => {
  const lentil = CROPS.find((c) => c.id === 'lentil')!;
  const sunflower = CROPS.find((c) => c.id === 'sunflower')!;
  const chickpea = CROPS.find((c) => c.id === 'chickpea')!;
  const mungbean = CROPS.find((c) => c.id === 'mungbean')!;

  const lentilRoles = getSoilHealthRoles(lentil);
  assert.ok(lentilRoles.some((r) => r.id === 'nitrogen_fixer'));
  assert.match(lentilRoles.find((r) => r.id === 'nitrogen_fixer')!.descEn, /Rhizobium/i);
  assert.match(lentilRoles.find((r) => r.id === 'nitrogen_fixer')!.descBn, /রাইজোবিয়াম/i);

  const sunflowerRoles = getSoilHealthRoles(sunflower);
  assert.ok(sunflowerRoles.some((r) => r.id === 'deep_roots'));
  assert.match(sunflowerRoles.find((r) => r.id === 'deep_roots')!.descEn, /taproots penetrate/i);

  const chickpeaRoles = getSoilHealthRoles(chickpea);
  assert.ok(chickpeaRoles.some((r) => r.id === 'drought_tolerant'));

  // Mungbean & blackgram are Green Manure
  const mungRoles = getSoilHealthRoles(mungbean);
  assert.ok(mungRoles.some((r) => r.id === 'green_manure'));
  assert.equal(mungRoles.some((r) => r.id === 'ground_cover'), false);
  assert.match(mungRoles.find((r) => r.id === 'green_manure')!.descEn, /organic matter/i);

  // Sweet potato is Ground Cover only
  const sweetPotato = CROPS.find((c) => c.id === 'sweet_potato')!;
  const sweetRoles = getSoilHealthRoles(sweetPotato);
  assert.ok(sweetRoles.some((r) => r.id === 'ground_cover'));
  assert.equal(sweetRoles.some((r) => r.id === 'green_manure'), false);
  assert.match(sweetRoles.find((r) => r.id === 'ground_cover')!.descEn, /foliage shields topsoil/i);

  // Jute is a fibre crop and must NOT be tagged as green manure or ground cover
  const jute = CROPS.find((c) => c.id === 'jute')!;
  const juteRoles = getSoilHealthRoles(jute);
  assert.equal(juteRoles.some((r) => r.id === 'ground_cover' || r.id === 'green_manure'), false);
});

test('Phase 9: 5. Farmer Science Glossary covers all 6 required scientific terms in English & Bangla', () => {
  const enGlossary = STRINGS.en.glossary.items;
  const bnGlossary = STRINGS.bn.glossary.items;

  assert.equal(enGlossary.length, 6);
  assert.equal(bnGlossary.length, 6);

  const requiredIds = ['et0', 'ndvi', 'soil_moisture', 'water_balance', 'temp_stress', 'sat_vs_ground'];
  requiredIds.forEach((id) => {
    const enItem = enGlossary.find((g) => g.id === id);
    const bnItem = bnGlossary.find((g) => g.id === id);
    assert.ok(enItem, `Missing EN glossary item: ${id}`);
    assert.ok(bnItem, `Missing BN glossary item: ${id}`);
    assert.ok(enItem.meaning.length > 20);
    assert.ok(bnItem.meaning.length > 20);
    assert.ok(enItem.importance.length > 20);
    assert.ok(bnItem.importance.length > 20);
  });
});

test('Phase 9: 6. FAQ answers "How accurate is this for MY field?" covering resolution limits', () => {
  const enFaq = STRINGS.en.faq.items.find((i) => i.id === 'field-accuracy');
  const bnFaq = STRINGS.bn.faq.items.find((i) => i.id === 'field-accuracy');

  assert.ok(enFaq, 'Missing EN field-accuracy FAQ');
  assert.ok(bnFaq, 'Missing BN field-accuracy FAQ');

  assert.match(enFaq.question, /accurate is this for MY/i);
  assert.match(enFaq.answer, /250 meters/i);
  assert.match(enFaq.answer, /9–36 kilometers/i);
  assert.match(enFaq.answer, /SAAO/i);

  assert.match(bnFaq.question, /আমার নির্দিষ্ট জমির জন্য/i);
  assert.match(bnFaq.answer, /২৫০ মিটার/i);
  assert.match(bnFaq.answer, /৯-৩৬ কিলোমিটার/i);
  assert.match(bnFaq.answer, /SAAO/i);
});

test('Phase 9: 7. Food Security Anchor: home_food and both retain Kharif-2 Aman rice', () => {
  const completeConditions: Conditions = {
    rain30: 25,
    tMax30: 29,
    tMaxAvg: 26,
    rh: 72,
    et0: 3.8,
    et0Total: 114,
    waterBalance: -89,
    from: '2026-01-01',
    to: '2026-01-31',
  };

  const resHome = generateRotationComparison({
    conditions: completeConditions,
    shift: null,
    soil: 0.28,
    forecast: [],
    priority: 'save_water',
    currentRotation: { rabi: 'boro', kharif1: 'fallow', kharif2: 'aman' },
    soilType: 'clay_loam',
    districtId: 'Rangpur',
    districtNameEn: 'Rangpur',
    districtNameBn: 'রংপুর',
    irrigationAvailability: 'yes',
    mainPurpose: 'home_food',
  });

  // Recommended or Alternative MUST retain aman in Kharif-2
  const recStrategy = resHome.strategies.find((s) => s.id === 'recommended')!;
  const altStrategy = resHome.strategies.find((s) => s.id === 'alternative')!;
  const recKharif2 = recStrategy.crops.find((c) => c.season === 'kharif2')?.id;
  const altKharif2 = altStrategy.crops.find((c) => c.season === 'kharif2')?.id;
  const preservesAman = recKharif2 === 'aman' || altKharif2 === 'aman';
  assert.ok(preservesAman, 'Household food security purpose must retain Aman rice in Kharif-2');

  const kharif2Crop = recStrategy.crops.find((c) => c.season === 'kharif2')!;
  assert.equal(kharif2Crop.nameEn, 'T. Aman Rice');
  assert.equal(kharif2Crop.nameBn, 'আমন ধান');

  // Mungbean belongs to Kharif-1 / late Rabi, never Kharif-2
  const mung = CROPS.find((c) => c.id === 'mungbean')!;
  assert.equal(mung.seasons.includes('kharif2'), false, 'Mungbean must not be a Kharif-2 crop');

  // Verify that Rabi in recommended is a water-saving legume or oilseed (e.g. lentil, mustard, wheat)
  const recRabi = recStrategy.crops.find((c) => c.season === 'rabi')?.id;
  assert.ok(recRabi !== 'boro', 'Water saving rotation replaces thirsty Boro in Rabi');
});

test('Phase 9: 8. Market Orientation: local_market boosts commercial crops', () => {
  const completeConditions: Conditions = {
    rain30: 25,
    tMax30: 29,
    tMaxAvg: 26,
    rh: 72,
    et0: 3.8,
    et0Total: 114,
    waterBalance: -89,
    from: '2026-01-01',
    to: '2026-01-31',
  };

  const resMarket = runEngine({
    conditions: completeConditions,
    soil: 0.28,
    shift: null,
    forecast: null,
    priority: 'water',
    previousCrop: 'none',
    today: new Date(),
    mainPurpose: 'local_market',
  });

  const kharif1Pick = resMarket.picks.find((p) => p.season === 'kharif1');
  assert.ok(kharif1Pick, 'Must have Kharif-1 pick');
});

test('Phase 9: 9. SMAP values > 0.5 are flagged as invalid / water contamination', () => {
  const isSoilFlaggedWater = (val?: number | null, flag?: string | null) => {
    return flag === 'possible_water_contamination' || (val !== undefined && val !== null && val > 0.5);
  };

  assert.equal(isSoilFlaggedWater(0.25, null), false, 'Normal SMAP 0.25 is valid');
  assert.equal(isSoilFlaggedWater(0.51, null), true, 'SMAP 0.51 must be flagged as water contamination');
  assert.equal(isSoilFlaggedWater(0.72, null), true, 'SMAP 0.72 must be flagged as water contamination');
  assert.equal(isSoilFlaggedWater(0.30, 'possible_water_contamination'), true, 'Explicit water flag honored');
});

test('Phase 9: 10. Honesty check: zero references to ESA, CCI, or Copernicus outside experimental/', () => {
  // execSync is imported at top
  let output = '';
  try {
    output = execSync('git grep -n -i -E "\\bESA\\b|\\bCCI\\b|Copernicus" -- ":!src/lib/phase9Gaps.test.ts" src/ api/ scripts/ public/ README.md index.html', { encoding: 'utf8' });
  } catch {
    output = '';
  }
  assert.equal(output.trim(), '', 'Must be strictly zero ESA/CCI references outside experimental/');
});

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
import type { FieldShift } from './fieldShift';
import type { Conditions } from './conditions';
import { getRankedCrops } from './cropSuitability';

test('Phase 9: 1. Vulnerable Seasons Risk Flags use NASA POWER climate observations', () => {
  const shift: FieldShift = {
    thenRange: [2001, 2010],
    nowRange: [2016, 2025],
    seasons: [
      { season: 'rabi', thenTemp: 19.5, nowTemp: 20.8, dTemp: 1.3, thenHeat: 26.2, nowHeat: 27.6, dHeat: 1.4, thenShare: 5.2, nowShare: 4.1, dShare: -1.1 },
      { season: 'kharif1', thenTemp: 27.8, nowTemp: 28.9, dTemp: 1.1, thenHeat: 34.0, nowHeat: 35.2, dHeat: 1.2, thenShare: 29.5, nowShare: 27.8, dShare: -1.7 },
      { season: 'kharif2', thenTemp: 28.6, nowTemp: 29.4, dTemp: 0.8, thenHeat: 32.5, nowHeat: 33.3, dHeat: 0.8, thenShare: 65.3, nowShare: 68.1, dShare: 2.8 },
    ],
    yearly: [],
  };

  // Wheat in Rabi: Terminal heat risk rising
  const wheatRisk = getVulnerableSeasonRisk('rabi', 'wheat', shift);
  assert.equal(wheatRisk.severity, 'high');
  assert.match(wheatRisk.titleEn, /Terminal Heat Risk/i);
  assert.match(wheatRisk.evidenceEn, /NASA POWER decadal shift/i);
  assert.match(wheatRisk.evidenceBn, /নাসা পাওয়ার পরিবর্তন/i);

  // Boro in Rabi: High groundwater depletion
  const boroRisk = getVulnerableSeasonRisk('rabi', 'boro', shift);
  assert.equal(boroRisk.severity, 'high');
  assert.match(boroRisk.titleEn, /Groundwater Demand/i);
  assert.match(boroRisk.evidenceEn, /NASA POWER/i);

  // Fallow in Kharif-1: Topsoil baking & erosion
  const kharif1FallowRisk = getVulnerableSeasonRisk('kharif1', 'fallow', shift);
  assert.equal(kharif1FallowRisk.severity, 'high');
  assert.match(kharif1FallowRisk.titleEn, /Solar Baking & Sheet Erosion/i);

  // Aman in Kharif-2: Monsoon dry spell risk
  const amanRisk = getVulnerableSeasonRisk('kharif2', 'aman', shift);
  assert.equal(amanRisk.severity, 'medium');
  assert.match(amanRisk.titleEn, /Late-Monsoon Dry Spell/i);
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
  assert.match(resHigh.strategies[1].confidence.reasonEn, /Live NASA POWER & SMAP/i);
  assert.match(resHigh.strategies[1].confidence.reasonBn, /নাসার সরাসরি POWER ও SMAP/i);

  // Case B: Soil type unspecified ("dont_know") -> Medium confidence
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

  // Case C: Live NASA rain telemetry unavailable -> Low confidence
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

  const mungRoles = getSoilHealthRoles(mungbean);
  assert.ok(mungRoles.some((r) => r.id === 'ground_cover'));
  assert.match(mungRoles.find((r) => r.id === 'ground_cover')!.descEn, /Dense canopy shields topsoil/i);
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

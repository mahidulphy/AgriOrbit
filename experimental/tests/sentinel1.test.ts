import test from 'node:test';
import assert from 'node:assert/strict';
import { getRankedCrops, WATERLOGGING_SENSITIVE_CROPS } from './cropSuitability';
import { evaluateWeatherAdvisory } from './weatherAdvisory';
import { getDistrictSatellite } from '../data/satellite';

test('1. WATERLOGGING_SENSITIVE_CROPS list includes expected pulse, vegetable, oilseed crops', () => {
  assert.ok(WATERLOGGING_SENSITIVE_CROPS.has('sesame'), 'sesame must be waterlogging sensitive');
  assert.ok(WATERLOGGING_SENSITIVE_CROPS.has('chili'), 'chili must be waterlogging sensitive');
  assert.ok(WATERLOGGING_SENSITIVE_CROPS.has('brinjal'), 'brinjal must be waterlogging sensitive');
  assert.ok(WATERLOGGING_SENSITIVE_CROPS.has('lentil'), 'lentil must be waterlogging sensitive');
  assert.ok(WATERLOGGING_SENSITIVE_CROPS.has('chickpea'), 'chickpea must be waterlogging sensitive');
  assert.ok(WATERLOGGING_SENSITIVE_CROPS.has('sweet_potato'), 'sweet_potato must be waterlogging sensitive');
  assert.ok(WATERLOGGING_SENSITIVE_CROPS.has('tomato'), 'tomato must be waterlogging sensitive');

  // Flood-tolerant crops must NOT be in the sensitive set
  assert.ok(!WATERLOGGING_SENSITIVE_CROPS.has('aman'), 'aman must NOT be waterlogging sensitive');
  assert.ok(!WATERLOGGING_SENSITIVE_CROPS.has('boro'), 'boro must NOT be waterlogging sensitive');
  assert.ok(!WATERLOGGING_SENSITIVE_CROPS.has('aus'), 'aus must NOT be waterlogging sensitive');
  assert.ok(!WATERLOGGING_SENSITIVE_CROPS.has('jute'), 'jute must NOT be waterlogging sensitive');
});

test('2. Sentinel-1 SAR flooded cropland > 10% applies -15 penalty to sensitive crops and leaves rice unaffected', () => {
  // Baseline without flooding
  const normalTele = {
    rainfall30d: 30,
    soilMoisture: 0.24,
    maxTemp: 28,
    waterBalance: 0,
    sentinel1FloodedCroplandPct: 4.5, // <= 10%
  };
  const normalRanked = getRankedCrops('save_water', undefined, 'All', normalTele);
  const normalSesame = normalRanked.find((c) => c.id === 'sesame')!;
  const normalAman = normalRanked.find((c) => c.id === 'aman')!;

  assert.equal(normalSesame.deltas?.sentinel1FloodPenalty ?? 0, 0, 'No penalty when flooded <= 10%');
  assert.equal(normalAman.deltas?.sentinel1FloodPenalty ?? 0, 0);

  // Flooded scenario (e.g. Rangpur 14.2%)
  const floodedTele = {
    rainfall30d: 30,
    soilMoisture: 0.24,
    maxTemp: 28,
    waterBalance: 0,
    sentinel1FloodedCroplandPct: 14.2, // > 10%
  };
  const floodedRanked = getRankedCrops('save_water', undefined, 'All', floodedTele);
  const floodedSesame = floodedRanked.find((c) => c.id === 'sesame')!;
  const floodedLentil = floodedRanked.find((c) => c.id === 'lentil')!;
  const floodedChili = floodedRanked.find((c) => c.id === 'chili')!;
  const floodedAman = floodedRanked.find((c) => c.id === 'aman')!;

  assert.equal(floodedSesame.deltas?.sentinel1FloodPenalty, -15, 'Sesame should receive -15 penalty');
  assert.equal(floodedLentil.deltas?.sentinel1FloodPenalty, -15, 'Lentil should receive -15 penalty');
  assert.equal(floodedChili.deltas?.sentinel1FloodPenalty, -15, 'Chili should receive -15 penalty');
  assert.equal(floodedAman.deltas?.sentinel1FloodPenalty ?? 0, 0, 'Aman rice should NOT receive penalty');

  // Verify dynamic explanations contain Rule SAR-01
  assert.ok(
    floodedSesame.explanation?.rulesSatisfied?.some((r) => r.includes('Rule SAR-01') && r.includes('-15')),
    'explanation.rulesSatisfied should explain Rule SAR-01'
  );
  assert.ok(
    floodedSesame.explanation?.rulesSatisfiedBn?.some((r) => r.includes('SAR-01') && (r.includes('১৫') || r.includes('-15'))),
    'explanation.rulesSatisfiedBn should explain Rule SAR-01 in Bangla'
  );
});

test('3. Sentinel-1 SAR null / missing data applies 0 penalty and does not crash', () => {
  const missingTele = {
    rainfall30d: 30,
    soilMoisture: 0.24,
    maxTemp: 28,
    waterBalance: 0,
    sentinel1FloodedCroplandPct: null,
  };
  const ranked = getRankedCrops('save_water', undefined, 'All', missingTele);
  const sesame = ranked.find((c) => c.id === 'sesame')!;
  assert.equal(sesame.deltas?.sentinel1FloodPenalty ?? 0, 0);
  assert.ok(
    !sesame.explanation?.rulesSatisfied?.some((r) => r.includes('Rule SAR-01')),
    'No Rule SAR-01 added when data is missing'
  );
});

import { computeForecastMetrics } from '../services/weatherForecast';
import { computeGpmMetricsFromDaily } from '../services/gpm';

test('4. WeatherAdvisory evaluates Sentinel-1 SAR cropland flooding parameter', () => {
  const days = [
    { date: '2026-10-10', tMax: 30, tMin: 23, rain: 2 },
    { date: '2026-10-11', tMax: 30, tMin: 23, rain: 2 },
    { date: '2026-10-12', tMax: 29, tMin: 22, rain: 2 },
    { date: '2026-10-13', tMax: 28, tMin: 22, rain: 2 },
    { date: '2026-10-14', tMax: 29, tMin: 23, rain: 2 },
    { date: '2026-10-15', tMax: 31, tMin: 24, rain: 2 },
    { date: '2026-10-16', tMax: 31, tMin: 24, rain: 3 },
  ];
  const forecast = computeForecastMetrics(days, 'cached', '2026-10-17');

  const dailyRain: Record<string, number> = {};
  for (let i = 1; i <= 30; i++) {
    dailyRain[`202609${String(i).padStart(2, '0')}`] = 2.5;
  }
  const gpm = computeGpmMetricsFromDaily(dailyRain, 'cached', '2026-10-17');

  const adv = evaluateWeatherAdvisory({
    gpm,
    forecast,
    soilMoisture: 0.22,
    districtId: 'rangpur',
    upazilaName: 'Mithapukur',
    sentinel1FloodedCroplandPct: 14.2,
  });

  const sarParam = adv.whyExplanation.thresholdsEvaluated.find(
    (p) => p.source === 'ESA Sentinel-1'
  );
  assert.ok(sarParam, 'ESA Sentinel-1 evaluated parameter must exist');
  assert.equal(sarParam.satisfied, true, 'Parameter should be satisfied when flooded > 10%');
  assert.ok(
    adv.whyExplanation.rulesTriggered.some((r) => r.includes('Rule SAR-01')),
    'Rule SAR-01 should be listed in rulesTriggered'
  );
});

test('5. Rangpur district satellite record contains calibrated Sentinel-1 hydrological data', () => {
  const rangpurSat = getDistrictSatellite('rangpur');
  assert.ok(rangpurSat?.sentinel1, 'Rangpur satellite data must include sentinel1');
  assert.equal(typeof rangpurSat.sentinel1.floodedCroplandPct, 'number');
  assert.ok(rangpurSat.sentinel1.floodedCroplandPct >= 0 && rangpurSat.sentinel1.floodedCroplandPct <= 100);
  assert.equal(rangpurSat.sentinel1.resolutionMeters, 10);
  assert.ok(rangpurSat.sentinel1.statusEn.includes('%'));
  assert.ok(rangpurSat.sentinel1.statusBn.includes('%'));
});

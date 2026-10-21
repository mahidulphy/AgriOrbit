import test from 'node:test';
import assert from 'node:assert/strict';
import { runEngine, scoreCrop, computeAlerts, RULES } from './engine.ts';
import { CROPS, cropById } from '../data/crops.ts';
import { computeFieldShift } from './fieldShift.ts';
import fallbackRangpur from '../data/fallback-rangpur.json';
import type { LocationCache } from './power.ts';

const cache = fallbackRangpur as LocationCache;
const shift = computeFieldShift(cache.monthly);

test('1. Drought rule: rain < 50mm AND soil < 0.15 penalizes thirsty crops', () => {
  const boro = cropById('boro');
  const lentil = cropById('lentil');

  const dryInput = {
    conditions: {
      rain30: 30, // < 50mm
      tMax30: 32,
      tMaxAvg: 30,
      rh: 65,
      et0: 3.5,
      et0Total: 105,
      waterBalance: -75,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.12, // < 0.15 m³/m³
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  const boroScore = scoreCrop(boro, 'rabi', true, dryInput, []);
  const dryReason = boroScore.reasons.find((r) => r.code === 'dry');
  assert.ok(dryReason, 'Boro should have dry penalty reason');
  assert.equal(dryReason.delta, -20, 'Boro rice should receive -20 penalty under drought');

  const lentilScore = scoreCrop(lentil, 'rabi', true, dryInput, []);
  assert.ok(lentilScore.score > boroScore.score, 'Lentil score should exceed Boro score in dry conditions');
});

test('2. Optimal sowing badge: soil 0.25 - 0.30 m³/m³ awards optimal sowing bonus', () => {
  const mustard = cropById('mustard');

  const optimalInput = {
    conditions: {
      rain30: 60,
      tMax30: 28,
      tMaxAvg: 26,
      rh: 70,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -30,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.27, // In 0.25-0.30 range
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  const score = scoreCrop(mustard, 'rabi', true, optimalInput, []);
  assert.equal(score.optimalSowing, true, 'optimalSowing should be true');
  assert.ok(score.reasons.some((r) => r.code === 'soilOptimal'), 'Reason soilOptimal should be present');
});

test('3. Heat stress: max temp > 35°C triggers heat alert and penalty on vulnerable crops', () => {
  const wheat = cropById('wheat');

  const hotInput = {
    conditions: {
      rain30: 60,
      tMax30: 37, // > 35°C
      tMaxAvg: 32,
      rh: 60,
      et0: 4.5,
      et0Total: 135,
      waterBalance: -75,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.24,
    shift,
    forecast: cache.forecast,
    priority: 'risk' as const,
  };

  const alerts = computeAlerts(hotInput);
  assert.ok(alerts.some((a) => a.code === 'heat'), 'Heat alert should be triggered');

  const score = scoreCrop(wheat, 'rabi', true, hotInput, alerts);
  assert.ok(score.reasons.some((r) => r.code === 'heatNow'), 'Wheat should receive heat penalty');
});

test('4. Rotation Rule A (Family Filter): never selects same botanical family consecutively', () => {
  const input = {
    conditions: {
      rain30: 45,
      tMax30: 31,
      tMaxAvg: 28,
      rh: 70,
      et0: 3.2,
      et0Total: 96,
      waterBalance: -51,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.22,
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  const result = runEngine(input);
  assert.equal(result.picks.length, 3, 'Should recommend exactly 3 seasonal crops');

  for (let i = 1; i < result.picks.length; i++) {
    const prev = result.picks[i - 1].crop;
    const curr = result.picks[i].crop;
    assert.notEqual(
      prev.family,
      curr.family,
      `Consecutive crops ${prev.nameEn} and ${curr.nameEn} cannot share botanical family ${prev.family}`
    );
  }
});

test('5. Rotation Rule B (Nitrogen Trigger): forces legume when running nutrient balance is negative', () => {
  // Plan with priority soil to inspect legume selection
  const input = {
    conditions: {
      rain30: 35,
      tMax30: 30,
      tMaxAvg: 27,
      rh: 72,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -55,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.18,
    shift,
    forecast: cache.forecast,
    priority: 'soil' as const,
  };

  const result = runEngine(input);
  assert.ok(result.picks.length === 3);

  // If previous crop depleted nitrogen (balance < 0), Kharif-1 or Rabi must include a legume
  const hasLegume = result.picks.some((p) => p.crop.family === 'legume');
  assert.ok(hasLegume, 'Recommended rotation sequence should include nitrogen-fixing legume');
});

test('6. Rotation Rule A with previous crop: blocks same botanical family as previousCrop from first pick', () => {
  const inputWithAman = {
    conditions: {
      rain30: 45,
      tMax30: 31,
      tMaxAvg: 28,
      rh: 70,
      et0: 3.2,
      et0Total: 96,
      waterBalance: -51,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.22,
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
    previousCrop: 'aman', // Grass family
  };

  const result = runEngine(inputWithAman);
  assert.equal(result.picks.length, 3);
  assert.notEqual(
    result.picks[0].crop.family,
    'grass',
    `First pick ${result.picks[0].crop.nameEn} cannot be in grass family because previousCrop was Aman (grass)`
  );
});

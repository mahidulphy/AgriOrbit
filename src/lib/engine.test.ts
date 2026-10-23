import test from 'node:test';
import assert from 'node:assert/strict';
import { runEngine, scoreCrop, computeAlerts, RULES, INACTIVE_FORECAST_RULES } from './engine.ts';
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

test('7. Engine robustness: all 36 recommendable crops score without crashing across seasons', () => {
  const baseInput = {
    conditions: {
      rain30: 45,
      tMax30: 28,
      tMaxAvg: 26,
      rh: 68,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -45,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.25,
    shift,
    forecast: cache.forecast,
    priority: 'income' as const,
  };

  const recommendable = CROPS.filter((c) => c.recommendable);
  assert.equal(recommendable.length, 36);

  for (const crop of recommendable) {
    for (const season of crop.seasons) {
      const score = scoreCrop(crop, season, true, baseInput, []);
      assert.ok(score.score >= 0 && score.score <= 100, `Crop ${crop.id} score ${score.score} out of bounds`);
      assert.ok(score.reasons.length > 0, `Crop ${crop.id} must have scoring reasons`);
    }
  }
});

test('8. Tobacco is strictly non-recommendable and never appears in picks or rotations', () => {
  const tobacco = cropById('tobacco');
  assert.equal(tobacco.recommendable, false);

  const input = {
    conditions: {
      rain30: 40,
      tMax30: 25,
      tMaxAvg: 22,
      rh: 60,
      et0: 2.5,
      et0Total: 75,
      waterBalance: -35,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.22,
    shift,
    forecast: cache.forecast,
    priority: 'income' as const,
  };

  const result = runEngine(input);
  for (const pick of result.picks) {
    assert.notEqual(pick.crop.id, 'tobacco', 'Tobacco must never be in rotation picks');
  }

  for (const season of result.seasons) {
    const seasonOptions = result.options[season];
    assert.ok(
      !seasonOptions.some((o) => o.crop.id === 'tobacco'),
      'Tobacco must never be in season options'
    );
  }
});

test('9. Estimated crops (Soybean, Jute, Sugarcane, Cotton) include transparent notice reason', () => {
  const estimatedIds = ['soybean', 'jute', 'sugarcane', 'cotton'];
  const input = {
    conditions: {
      rain30: 55,
      tMax30: 28,
      tMaxAvg: 25,
      rh: 70,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -35,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.28,
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  for (const id of estimatedIds) {
    const crop = cropById(id);
    const score = scoreCrop(crop, crop.seasons[0], true, input, []);
    const notice = score.reasons.find((r) => r.code === 'estimatedNotice');
    assert.ok(notice, `Estimated crop ${id} must include estimatedNotice reason`);
    assert.equal(notice.source, 'Estimated');
    assert.ok(String(notice.v.noticeBn).includes('স্থানীয় কৃষি অফিসে নিশ্চিত হোন'));
  }
});

test('10. Tie-breaking rule: research-backed crops rank higher than estimated crops on equal score', () => {
  const baseInput = {
    conditions: {
      rain30: 45,
      tMax30: 28,
      tMaxAvg: 26,
      rh: 68,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -45,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.25,
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  const result = runEngine(baseInput);
  for (const season of result.seasons) {
    const opts = result.options[season];
    for (let i = 0; i < opts.length - 1; i++) {
      if (opts[i].score === opts[i + 1].score) {
        if (opts[i].crop.data_confidence === 'estimated' && opts[i + 1].crop.data_confidence === 'research') {
          assert.fail(`Research crop ${opts[i+1].crop.id} should rank above estimated crop ${opts[i].crop.id} on equal score`);
        }
      }
    }
  }
});

test('11. Inactive decision rules: all 5 rules defined, marked active: false with missing data rationale', () => {
  assert.equal(INACTIVE_FORECAST_RULES.length, 5);
  const ruleIds = INACTIVE_FORECAST_RULES.map((r) => r.id);
  assert.ok(ruleIds.includes('RULE_BORO_DEC_SMAP'));
  assert.ok(ruleIds.includes('RULE_AMAN_JULY_RAIN'));
  assert.ok(ruleIds.includes('RULE_AUS_MARCH_RAIN'));
  assert.ok(ruleIds.includes('RULE_WHEAT_HEAT_WAVE'));
  assert.ok(ruleIds.includes('RULE_MAIZE_GROUNDWATER'));

  for (const rule of INACTIVE_FORECAST_RULES) {
    assert.equal(rule.active, false);
    assert.ok(rule.reason_inactive_en.length > 0);
    assert.ok(rule.reason_inactive_bn.length > 0);
    assert.ok(rule.suggestion_en.length > 0);
    assert.ok(rule.suggestion_bn.length > 0);
  }
});

test('12. Missing or flagged soil moisture (soil: null) skips soil rules cleanly', () => {
  const boro = cropById('boro');
  const mustard = cropById('mustard');

  const nullSoilInput = {
    conditions: {
      rain30: 30, // < 50mm, dry
      tMax30: 28,
      tMaxAvg: 26,
      rh: 70,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -60,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: null,
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  const alerts = computeAlerts(nullSoilInput);
  assert.ok(!alerts.some((a) => a.code === 'lowWater'), 'Should not trigger lowWater alert when soil is null');

  const boroScore = scoreCrop(boro, 'rabi', true, nullSoilInput, alerts);
  assert.ok(!boroScore.reasons.some((r) => r.source === 'SMAP'), 'Should not apply SMAP reasons when soil is null');

  const mustardScore = scoreCrop(mustard, 'rabi', true, nullSoilInput, alerts);
  assert.equal(mustardScore.optimalSowing, false, 'optimalSowing should be false when soil is null');
  assert.ok(!mustardScore.reasons.some((r) => r.source === 'SMAP'), 'Should not apply SMAP reasons when soil is null');

  const result = runEngine(nullSoilInput);
  assert.ok(result.picks.length === 3, 'Engine should successfully recommend 3 seasons even when soil is null');
});
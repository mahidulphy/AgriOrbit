import test from 'node:test';
import assert from 'node:assert/strict';
import { getRankedCrops } from './cropSuitability';
import { evaluateWeatherAdvisory } from './weatherAdvisory';
import { getDistrictSatellite } from '../data/satellite';
import { computeForecastMetrics } from '../services/weatherForecast';
import { computeGpmMetricsFromDaily } from '../services/gpm';

test('1. Rangpur district contains calibrated JAXA GSMaP & AMSR2 record', () => {
  const sat = getDistrictSatellite('rangpur');
  assert.ok(sat?.jaxa, 'Rangpur satellite data must include jaxa');
  assert.equal(sat.jaxa.gsmapRain30dMm, 32.4);
  assert.equal(sat.jaxa.amsr2SoilMoisture, 0.22);
  assert.equal(sat.jaxa.spi30dIndex, -0.15);
  assert.equal(sat.jaxa.status, 'favorable');
  assert.ok(sat.jaxa.source.includes('JAXA Earth API'));
});

test('2. Dual-satellite drought (JAXA AMSR2 + SMAP + SPI < -1.2) triggers Rule JAXA-01 penalty and bonus', () => {
  const droughtTele = {
    rainfall30d: 12,
    soilMoisture: 0.14, // SMAP < 0.18
    maxTemp: 32,
    waterBalance: -40,
    jaxaSoilMoisture: 0.13, // AMSR2 < 0.16
    jaxaSpi30dIndex: -1.55, // SPI < -1.2
  };

  const ranked = getRankedCrops('save_water', undefined, 'All', droughtTele);
  const thirstyCrop = ranked.find((c) => c.waterRequirementEn === 'High' || c.id === 'boro')!;
  const hardyCrop = ranked.find((c) => c.waterRequirementEn === 'Low' || c.id === 'sesame' || c.id === 'mustard')!;

  assert.ok(thirstyCrop, 'Should find thirsty crop');
  assert.equal(thirstyCrop.deltas?.jaxaDroughtPenalty, -15, 'Thirsty crop should receive -15 penalty under dual-satellite drought');
  assert.ok(
    thirstyCrop.explanation?.rulesSatisfied?.some((r) => r.includes('Rule JAXA-01') && r.includes('-15')),
    'Rule JAXA-01 must be cited for thirsty crop'
  );

  assert.ok(hardyCrop, 'Should find drought-hardy crop');
  assert.equal(hardyCrop.deltas?.jaxaDroughtPenalty, 5, 'Drought-hardy crop should receive +5 bonus under dry spell');
  assert.ok(
    hardyCrop.explanation?.rulesSatisfied?.some((r) => r.includes('Rule JAXA-01') && r.includes('+5')),
    'Rule JAXA-01 must be cited for hardy crop'
  );
});

test('3. WeatherAdvisory detects rainfall discrepancy when NASA and JAXA disagree (>25mm and >30%)', () => {
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

  // NASA recent 7d = 15mm (extrapolates to ~64mm over 30d)
  const dailyRain: Record<string, number> = {};
  for (let i = 1; i <= 30; i++) {
    dailyRain[`202609${String(i).padStart(2, '0')}`] = 2.14;
  }
  const gpm = computeGpmMetricsFromDaily(dailyRain, 'cached', '2026-10-17');

  // Discrepant JAXA observation: 112.5mm vs NASA ~64mm (delta > 25mm, delta% > 30%)
  const adv = evaluateWeatherAdvisory({
    gpm,
    forecast,
    soilMoisture: 0.22,
    districtId: 'sylhet',
    upazilaName: 'Sylhet Sadar',
    jaxaRain30dMm: 112.5,
    jaxaSoilMoisture: 0.28,
    jaxaSpi30dIndex: 0.45,
  });

  const rainParam = adv.whyExplanation.thresholdsEvaluated.find(
    (p) => p.source === 'JAXA Earth API' && p.parameter.includes('Rainfall')
  );
  assert.ok(rainParam, 'Cross-Agency Rainfall Agreement parameter must exist');
  assert.equal(rainParam.satisfied, true, 'Parameter should flag discrepancy when delta > 25mm & > 30%');
  assert.ok(
    adv.whyExplanation.rulesTriggered.some((r) => r.includes('Rule RAIN-DISCREPANCY-01')),
    'Rule RAIN-DISCREPANCY-01 should be cited in rulesTriggered'
  );
});

test('4. Aligned rainfall between NASA and JAXA leaves discrepancy flag false', () => {
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
    dailyRain[`202609${String(i).padStart(2, '0')}`] = 1.0;
  }
  const gpm = computeGpmMetricsFromDaily(dailyRain, 'cached', '2026-10-17');

  // Aligned observation: NASA ~30mm vs JAXA 32.4mm
  const adv = evaluateWeatherAdvisory({
    gpm,
    forecast,
    soilMoisture: 0.22,
    districtId: 'rangpur',
    upazilaName: 'Mithapukur',
    jaxaRain30dMm: 32.4,
    jaxaSoilMoisture: 0.22,
    jaxaSpi30dIndex: -0.15,
  });

  const rainParam = adv.whyExplanation.thresholdsEvaluated.find(
    (p) => p.source === 'JAXA Earth API' && p.parameter.includes('Rainfall')
  );
  assert.ok(rainParam);
  assert.equal(rainParam.satisfied, false, 'Aligned rainfall should NOT trigger discrepancy');
});

test('5. Null or missing JAXA telemetry defaults to 0 delta without crash', () => {
  const nullTele = {
    rainfall30d: 30,
    soilMoisture: 0.24,
    maxTemp: 28,
    waterBalance: 0,
    jaxaRain30dMm: null,
    jaxaSoilMoisture: null,
    jaxaSpi30dIndex: null,
  };

  const ranked = getRankedCrops('save_water', undefined, 'All', nullTele);
  assert.ok(ranked.length > 0);
  assert.equal(ranked[0].deltas?.jaxaDroughtPenalty ?? 0, 0);
});

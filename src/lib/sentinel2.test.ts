import test from 'node:test';
import assert from 'node:assert/strict';
import { getRankedCrops } from './cropSuitability';
import { evaluateWeatherAdvisory } from './weatherAdvisory';
import { getDistrictSatellite } from '../data/satellite';
import { computeForecastMetrics } from '../services/weatherForecast';
import { computeGpmMetricsFromDaily } from '../services/gpm';

test('1. Rangpur district contains calibrated ESA Sentinel-2 10m NDVI record', () => {
  const sat = getDistrictSatellite('rangpur');
  assert.ok(sat?.sentinel2, 'Rangpur satellite data must include sentinel2');
  assert.equal(sat.sentinel2.resolutionMeters, 10);
  assert.equal(sat.sentinel2.ndvi10m, 0.71);
  assert.equal(sat.sentinel2.status, 'optimal');
  assert.ok(sat.sentinel2.statusEn.includes('10m NDVI'));
  assert.ok(sat.sentinel2.statusBn.includes('১০মি NDVI'));
});

test('2. Sentinel-2 canopy stress (anomaly < -15%) triggers Rule VEG-02 penalty on demanding crops & bonus on catch crops', () => {
  // Stressed canopy telemetry (e.g. Chapai Nawabganj -24.1% anomaly)
  const stressedTele = {
    rainfall30d: 30,
    soilMoisture: 0.22,
    maxTemp: 28,
    waterBalance: 0,
    sentinel2Ndvi10m: 0.44,
    sentinel2AnomalyPct: -24.1,
  };

  const ranked = getRankedCrops('save_water', undefined, 'All', stressedTele);
  const demandingCrop = ranked.find((c) => (c.durationDays ?? 100) >= 120 || c.waterRequirementEn === 'High')!;
  const catchCrop = ranked.find((c) => ['mungbean', 'mustard', 'radish'].includes(c.id))!;

  assert.ok(demandingCrop, 'Must find a long-duration or demanding crop');
  assert.equal(demandingCrop.deltas?.sentinel2StressPenalty, -10, 'Demanding crop should receive -10 penalty under canopy stress');
  assert.ok(
    demandingCrop.explanation?.rulesSatisfied?.some((r) => r.includes('Rule VEG-02') && r.includes('-10')),
    'Rule VEG-02 must be cited in rulesSatisfied for demanding crop'
  );

  assert.ok(catchCrop, 'Must find a fast-maturing catch crop');
  assert.equal(catchCrop.deltas?.sentinel2StressPenalty, 5, 'Catch crop should receive +5 bonus under canopy stress');
  assert.ok(
    catchCrop.explanation?.rulesSatisfied?.some((r) => r.includes('Rule VEG-02') && r.includes('+5')),
    'Rule VEG-02 must be cited in rulesSatisfied for catch crop'
  );
});

test('3. Optimal / normal Sentinel-2 NDVI (anomaly >= -15%) applies 0 penalty', () => {
  const normalTele = {
    rainfall30d: 30,
    soilMoisture: 0.24,
    maxTemp: 28,
    waterBalance: 0,
    sentinel2Ndvi10m: 0.71,
    sentinel2AnomalyPct: 2.9,
  };

  const ranked = getRankedCrops('save_water', undefined, 'All', normalTele);
  for (const crop of ranked) {
    assert.equal(crop.deltas?.sentinel2StressPenalty ?? 0, 0, 'No stress penalty when NDVI is normal');
    assert.ok(
      !crop.explanation?.rulesSatisfied?.some((r) => r.includes('Rule VEG-02')),
      'Rule VEG-02 must not trigger when NDVI is optimal'
    );
  }
});

test('4. Null or missing Sentinel-2 data gracefully defaults to 0 delta without errors', () => {
  const missingTele = {
    rainfall30d: 30,
    soilMoisture: 0.24,
    maxTemp: 28,
    waterBalance: 0,
    sentinel2Ndvi10m: null,
    sentinel2AnomalyPct: null,
  };

  const ranked = getRankedCrops('save_water', undefined, 'All', missingTele);
  assert.ok(ranked.length > 0);
  assert.equal(ranked[0].deltas?.sentinel2StressPenalty ?? 0, 0);
});

test('5. WeatherAdvisory evaluates Sentinel-2 10m NDVI canopy health parameter', () => {
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
    districtId: 'chapai_nawabganj',
    upazilaName: 'Shibganj',
    sentinel2Ndvi10m: 0.44,
    sentinel2AnomalyPct: -24.1,
  });

  const s2Param = adv.whyExplanation.thresholdsEvaluated.find(
    (p) => p.source === 'ESA Sentinel-2'
  );
  assert.ok(s2Param, 'ESA Sentinel-2 evaluated parameter must exist in advisory');
  assert.equal(s2Param.satisfied, true, 'Parameter should be satisfied when canopy stress is detected');
  assert.ok(String(s2Param.observedValue).includes('0.44'));
});

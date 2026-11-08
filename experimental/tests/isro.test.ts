import test from 'node:test';
import assert from 'node:assert/strict';
import { getDistrictSatellite } from '../data/satellite.ts';
import { getRankedCrops } from './cropSuitability.ts';
import {
  evaluateWeatherAdvisory,
  DEFAULT_ADVISORY_THRESHOLDS,
} from './weatherAdvisory.ts';
import { computeForecastMetrics } from '../services/weatherForecast.ts';
import { computeGpmMetricsFromDaily } from '../services/gpm.ts';

test('1. Rangpur district contains calibrated ISRO INSAT-3DR and NASA-ISRO NISAR records', () => {
  const sat = getDistrictSatellite('rangpur');
  assert.ok(sat?.insat, 'Rangpur satellite data must include insat');
  assert.equal(sat.insat.lstC, 28.2);
  assert.equal(sat.insat.rain24hMm, 0);
  assert.equal(sat.insat.heatSpikeConfirmed, false);
  assert.ok(sat.insat.source.includes('ISRO MOSDAC'));

  assert.ok(sat?.nisar, 'Rangpur satellite data must include nisar');
  assert.equal(sat.nisar.soilMoisture200m, 0.23);
  assert.equal(sat.nisar.resolutionMeters, 200);
  assert.equal(sat.nisar.status, 'provisional_release');
  assert.ok(sat.nisar.source.includes('NISAR'));
});

test('2. Rajshahi district has heat spike confirmed by both NASA and ISRO INSAT-3DR (>35°C)', () => {
  const sat = getDistrictSatellite('rajshahi');
  assert.ok(sat?.insat, 'Rajshahi satellite data must include insat');
  assert.equal(sat.insat.lstC, 36.5);
  assert.equal(sat.insat.heatSpikeConfirmed, true);
});

test('3. Rule HEAT-ISRO-01 triggers dual-agency confirmation when NASA and ISRO both detect >35°C', () => {
  const ranked = getRankedCrops('save_water', undefined, 'All', {
    maxTemp: 36.5,
    rainfall30d: 40,
    soilMoisture: 0.22,
    waterBalance: -15,
    insatLstC: 36.8,
    insatHeatConfirmed: true,
  });

  const wheat = ranked.find((c) => c.id === 'wheat');
  assert.ok(wheat, 'Wheat must exist in ranked crops');
  assert.equal(wheat.deltas?.heatPenalty, -10, 'Wheat must receive -10 heat penalty');

  const dualAgencyRule = wheat.explanation?.rulesSatisfied?.some((r) =>
    r.includes('Rule HEAT-ISRO-01') && r.includes('Heat stress confirmed by 2 space agencies')
  );
  assert.ok(dualAgencyRule, 'Rule HEAT-ISRO-01 dual-agency confirmation must be present in rulesSatisfied');

  const dualAgencyObs = wheat.explanation?.observationsTriggered?.some((o) =>
    o.includes('NASA POWER (36.5°C) and ISRO INSAT-3DR (36.8°C) both confirm canopy heat')
  );
  assert.ok(dualAgencyObs, 'Dual-agency observation must cite both NASA and ISRO LST');
});

test('4. Rule HEAT-ISRO-01 records divergence notice when NASA > 35°C but ISRO <= 35°C', () => {
  const ranked = getRankedCrops('save_water', undefined, 'All', {
    maxTemp: 36.2,
    rainfall30d: 40,
    soilMoisture: 0.22,
    waterBalance: -15,
    insatLstC: 31.4,
    insatHeatConfirmed: false,
  });

  const wheat = ranked.find((c) => c.id === 'wheat');
  assert.ok(wheat, 'Wheat must exist');
  assert.equal(wheat.deltas?.heatPenalty, -10, 'Heat penalty retained cautiously');

  const divergenceObs = wheat.explanation?.observationsTriggered?.some((o) =>
    o.includes('Heat divergence: NASA flags 36.2°C, but ISRO INSAT-3DR geostationary LST is 31.4°C')
  );
  assert.ok(divergenceObs, 'Divergence observation must explain NASA vs ISRO difference');
});

test('5. NASA-ISRO NISAR 200m SAR radar soil moisture cross-verifies rootzone moisture', () => {
  const ranked = getRankedCrops('save_water', undefined, 'All', {
    maxTemp: 27.5,
    rainfall30d: 25,
    soilMoisture: 0.16,
    waterBalance: -25,
    nisarSoilMoisture200m: 0.17,
  });

  const boro = ranked.find((c) => c.id === 'boro_rice' || c.id === 'boro');
  assert.ok(boro, 'Boro must exist');

  const nisarObs = boro.explanation?.observationsTriggered?.some((o) =>
    o.includes('NASA-ISRO NISAR 200m SAR (0.17 m³/m³) confirms SMAP root-zone moisture deficit')
  );
  assert.ok(nisarObs, 'NISAR 200m high-resolution radar confirmation observation must be present');
});

test('6. WeatherAdvisory evaluates ISRO MOSDAC heat and NISAR 200m moisture parameters', () => {
  const mockForecastDays = [
    { date: '2026-10-24', tMax: 36.5, tMin: 24, rain: 0 },
    { date: '2026-10-25', tMax: 37.0, tMin: 25, rain: 0 },
    { date: '2026-10-26', tMax: 36.0, tMin: 24, rain: 0 },
    { date: '2026-10-27', tMax: 35.5, tMin: 23, rain: 0 },
    { date: '2026-10-28', tMax: 35.0, tMin: 22, rain: 0 },
    { date: '2026-10-29', tMax: 34.0, tMin: 21, rain: 0 },
    { date: '2026-10-30', tMax: 33.5, tMin: 21, rain: 0 },
  ];
  const forecast = computeForecastMetrics(mockForecastDays, 'cached');

  const dailyRain: Record<string, number> = {};
  for (let i = 1; i <= 30; i++) {
    dailyRain[`202609${String(i).padStart(2, '0')}`] = 0;
  }
  const gpm = computeGpmMetricsFromDaily(dailyRain, 'cached', '2026-10-24');

  const advisory = evaluateWeatherAdvisory({
    gpm,
    forecast,
    soilMoisture: 0.18,
    districtId: 'rajshahi',
    insatLstC: 36.5,
    insatHeatConfirmed: true,
    nisarSoilMoisture200m: 0.19,
    thresholds: DEFAULT_ADVISORY_THRESHOLDS,
  });

  const isroParam = advisory.whyExplanation.thresholdsEvaluated.find(
    (p) => p.source === 'ISRO MOSDAC' && p.parameter.includes('Canopy Heat')
  );
  assert.ok(isroParam, 'ISRO MOSDAC parameter must be evaluated');
  assert.equal(isroParam.satisfied, true, 'Dual-agency heat condition should be satisfied');
  assert.ok(String(isroParam.observedValue).includes('Confirmed by 2 agencies'));

  const nisarParam = advisory.whyExplanation.thresholdsEvaluated.find(
    (p) => p.source === 'NASA-ISRO NISAR' && p.parameter.includes('NISAR 200m')
  );
  assert.ok(nisarParam, 'NASA-ISRO NISAR parameter must be evaluated');
  assert.equal(nisarParam.observedValue, '0.19 m³/m³ (200m radar)');

  const heatRuleTriggered = advisory.whyExplanation.rulesTriggered.some((r) =>
    r.includes('Rule HEAT-ISRO-01') && r.includes('Heat stress confirmed by 2 space agencies')
  );
  assert.ok(heatRuleTriggered, 'Rule HEAT-ISRO-01 must be listed in triggered rules');
});

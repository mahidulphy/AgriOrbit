import test from 'node:test';
import assert from 'node:assert';
import {
  evaluateWeatherAdvisory,
  DEFAULT_ADVISORY_THRESHOLDS,
  type AdvisoryRuleContext,
} from './weatherAdvisory';
import { computeGpmMetricsFromDaily } from '../services/gpm';
import { computeForecastMetrics } from '../services/weatherForecast';
import type { ForecastDay } from './power';

// Helper to create mock GPM data
function createMockGpm(dailyMm: number, status: 'live' | 'cached' | 'bundled' = 'cached') {
  const dailyRecord: Record<string, number> = {};
  for (let i = 1; i <= 30; i++) {
    const d = i < 10 ? `2026100${i}` : `202610${i}`;
    dailyRecord[d] = dailyMm;
  }
  return computeGpmMetricsFromDaily(dailyRecord, status, '2026-10-06T12:00:00Z');
}

// Helper to create mock 7-day forecast
function createMockForecast(rainPerDayMm: number, status: 'live' | 'cached' | 'bundled' = 'cached') {
  const days: ForecastDay[] = [
    { date: '2026-10-07', tMax: 30, tMin: 23, rain: rainPerDayMm },
    { date: '2026-10-08', tMax: 30, tMin: 23, rain: rainPerDayMm },
    { date: '2026-10-09', tMax: 29, tMin: 22, rain: rainPerDayMm },
    { date: '2026-10-10', tMax: 28, tMin: 22, rain: rainPerDayMm },
    { date: '2026-10-11', tMax: 29, tMin: 23, rain: rainPerDayMm },
    { date: '2026-10-12', tMax: 31, tMin: 24, rain: rainPerDayMm },
    { date: '2026-10-13', tMax: 31, tMin: 24, rain: rainPerDayMm },
  ];
  return computeForecastMetrics(days, status, '2026-10-06T12:00:00Z');
}

test('1. Heavy rainfall forecast triggers heavy rain condition', () => {
  // 15 mm/day * 7 days = 105 mm total rain (exceeds heavyRain7dMm threshold of 65 mm)
  const forecast = createMockForecast(15);
  const gpm = createMockGpm(3); // Normal recent observation
  const soilMoisture = 0.24; // Moderate soil moisture

  const context: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture,
    districtId: 'rangpur',
    upazilaName: 'Mithapukur',
    season: 'Kharif-2',
  };

  const result = evaluateWeatherAdvisory(context);

  assert.strictEqual(result.conditionType, 'heavy_rain_moderate');
  assert.strictEqual(result.severity, 'warning');
  assert.strictEqual(result.forecast.totalRain7dMm, 105);
  assert.strictEqual(result.fieldCondition.soilMoistureStatus, 'Moderate');
  assert.match(result.headlineEn, /Heavy rainfall predicted/i);
  assert.match(result.advisory.recommendedActionEn, /Hold off on supplemental irrigation/i);
});

test('2. Low rainfall forecast triggers dry spell warning when moisture is low', () => {
  // 0.5 mm/day * 7 days = 3.5 mm total rain (< 10 mm dry spell threshold)
  const forecast = createMockForecast(0.5);
  const gpm = createMockGpm(1.0); // Deficit past rain
  const soilMoisture = 0.16; // Low soil moisture (< 0.20)

  const context: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture,
    districtId: 'rajshahi',
    upazilaName: 'Godagari',
    season: 'Rabi',
  };

  const result = evaluateWeatherAdvisory(context);

  assert.strictEqual(result.conditionType, 'dry_spell');
  assert.strictEqual(result.severity, 'warning');
  assert.strictEqual(result.fieldCondition.soilMoistureStatus, 'Low');
  assert.match(result.headlineEn, /Dry conditions persist/i);
  assert.match(result.advisory.recommendedActionEn, /Schedule light supplemental irrigation/i);
});

test('3. High rainfall + High soil moisture triggers saturated waterlogging danger', () => {
  // Heavy rain (12 mm/day * 7 = 84 mm) + High soil moisture (0.33 m³/m³ >= 0.28)
  const forecast = createMockForecast(12);
  const gpm = createMockGpm(8); // Elevated recent rain
  const soilMoisture = 0.33; // Near saturation

  const context: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture,
    districtId: 'rangpur',
    upazilaName: 'Mithapukur',
    season: 'Kharif-2',
  };

  const result = evaluateWeatherAdvisory(context);

  assert.strictEqual(result.conditionType, 'heavy_rain_saturated');
  assert.strictEqual(result.severity, 'danger');
  assert.strictEqual(result.fieldCondition.soilMoistureStatus, 'High');
  assert.match(result.advisory.recommendedActionEn, /Avoid unnecessary irrigation/i);
  // Crop specific note for Kharif-2: Aman rice seedbeds
  assert.ok(result.advisory.cropSpecificNoteEn);
  assert.match(result.advisory.cropSpecificNoteEn, /delaying Aman rice seedbed/i);
});

test('4. High rainfall + Low soil moisture triggers natural recharge advisory', () => {
  // Heavy rain (14 mm/day * 7 = 98 mm) + Low soil moisture (0.17 m³/m³ < 0.20)
  const forecast = createMockForecast(14);
  const gpm = createMockGpm(1);
  const soilMoisture = 0.17; // Low / dry topsoil

  const context: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture,
    districtId: 'dinajpur',
    upazilaName: 'Birganj',
    season: 'Kharif-1',
  };

  const result = evaluateWeatherAdvisory(context);

  assert.strictEqual(result.conditionType, 'heavy_rain_recharge');
  assert.strictEqual(result.severity, 'warning');
  assert.strictEqual(result.fieldCondition.soilMoistureStatus, 'Low');
  assert.match(result.headlineEn, /Heavy rain expected to recharge dry soil/i);
  assert.match(result.advisory.recommendedActionEn, /delaying planned irrigation/i);
  assert.match(result.advisory.agronomicRationaleEn, /saving diesel pumping expenses/i);
});

test('5. Crop-specific advisory conditions adapt by season', () => {
  const forecast = createMockForecast(12);
  const gpm = createMockGpm(7);
  const highSoil = 0.31;

  // Test Kharif-2 season (Aman rice seedbed protection)
  const kharifContext: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture: highSoil,
    districtId: 'rangpur',
    season: 'Kharif-2',
  };
  const kharifResult = evaluateWeatherAdvisory(kharifContext);
  assert.match(kharifResult.advisory.cropSpecificNoteEn!, /Aman rice seedbed/i);
  assert.match(kharifResult.advisory.cropSpecificNoteBn!, /আমন ধানের বীজতলা/i);

  // Test Rabi season (potato / pulse damping-off prevention)
  const rabiContext: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture: highSoil,
    districtId: 'rangpur',
    season: 'Rabi',
  };
  const rabiResult = evaluateWeatherAdvisory(rabiContext);
  assert.match(rabiResult.advisory.cropSpecificNoteEn!, /potato and winter pulse/i);
  assert.match(rabiResult.advisory.cropSpecificNoteBn!, /আলু ও রবি ডাল/i);
});

test('6. Cached data fallback provenance label is accurately displayed', () => {
  const forecast = createMockForecast(10, 'cached');
  const gpm = createMockGpm(4, 'cached');
  const soilMoisture = 0.23;

  const context: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture,
    districtId: 'rangpur',
  };

  const result = evaluateWeatherAdvisory(context);

  assert.strictEqual(result.dataSourceStatus.isLive, false);
  assert.match(result.dataSourceStatus.provenanceLabelEn, /Using cached observation/i);
  assert.match(result.dataSourceStatus.provenanceLabelBn, /সংরক্ষিত তথ্য/i);
  // Source badges must be strictly segregated
  assert.strictEqual(result.gpm.sourceBadge, 'NASA');
  assert.strictEqual(result.forecast.sourceBadge, 'FORECAST');
  assert.strictEqual(result.advisory.sourceBadge, 'AGRIORBIT');
});

test('7. No alert / Favorable conditions when thresholds are not met', () => {
  // Moderate, normal rain (3 mm/day * 7 = 21 mm) and optimal soil (0.24 m³/m³)
  const forecast = createMockForecast(3);
  const gpm = createMockGpm(3);
  const soilMoisture = 0.24;

  const context: AdvisoryRuleContext = {
    gpm,
    forecast,
    soilMoisture,
    districtId: 'dhaka',
    upazilaName: 'Savar',
    season: 'Rabi',
  };

  const result = evaluateWeatherAdvisory(context);

  assert.strictEqual(result.conditionType, 'favorable');
  assert.strictEqual(result.severity, 'success');
  assert.match(result.headlineEn, /Favorable weather and moisture/i);
  assert.match(result.advisory.recommendedActionEn, /Proceed with planned seasonal agronomic activities/i);
});

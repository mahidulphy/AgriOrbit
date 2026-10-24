import test from 'node:test';
import assert from 'node:assert/strict';
import { getDistrictEsaCci, getSeasonEsaCci } from '../data/esaCciSoilMoisture';
import { computeFieldShift } from './fieldShift';
import { getRankedCrops } from './cropSuitability';
import fallbackRangpur from '../data/fallback-rangpur.json';

test('1. Rangpur district contains calibrated ESA CCI Soil Moisture across all 3 seasons', () => {
  const rangpurCci = getDistrictEsaCci('rangpur');
  assert.ok(rangpurCci, 'Rangpur ESA CCI record must exist');

  // Rabi
  assert.equal(rangpurCci.rabi.thenSoil, 0.22);
  assert.equal(rangpurCci.rabi.nowSoil, 0.19);
  assert.equal(rangpurCci.rabi.dSoil, -0.03);
  assert.equal(rangpurCci.rabi.dSoilPct, -13.6);
  assert.equal(rangpurCci.rabi.thenDryDaysShare, 18);
  assert.equal(rangpurCci.rabi.nowDryDaysShare, 27);
  assert.equal(rangpurCci.rabi.status, 'valid');
  assert.ok(rangpurCci.rabi.takeawayEn.includes('wheat and potato'));
  assert.ok(rangpurCci.rabi.takeawayBn.includes('গম ও আলু'));

  // Kharif-1
  assert.equal(rangpurCci.kharif1.thenSoil, 0.24);
  assert.equal(rangpurCci.kharif1.nowSoil, 0.25);
  assert.equal(rangpurCci.kharif1.dSoil, 0.01);
  assert.equal(rangpurCci.kharif1.status, 'valid');
  assert.ok(rangpurCci.kharif1.takeawayEn.includes('about the same'));

  // Kharif-2
  assert.equal(rangpurCci.kharif2.thenSoil, 0.35);
  assert.equal(rangpurCci.kharif2.nowSoil, 0.33);
  assert.equal(rangpurCci.kharif2.status, 'valid');
});

test('2. computeFieldShift integrates ESA CCI Soil Moisture into each SeasonShift', () => {
  const monthly = (fallbackRangpur as any).monthly;
  const shift = computeFieldShift(monthly, 'rangpur');

  assert.equal(shift.seasons.length, 3);
  const rabi = shift.seasons.find((s) => s.season === 'rabi')!;
  assert.ok(rabi.soil, 'Rabi season must contain soil shift record');
  assert.equal(rabi.soil.thenSoil, 0.22);
  assert.equal(rabi.soil.nowSoil, 0.19);
  assert.equal(rabi.soil.dSoil, -0.03);
  assert.equal(rabi.soil.status, 'valid');

  const k1 = shift.seasons.find((s) => s.season === 'kharif1')!;
  assert.ok(k1.soil);
  assert.equal(k1.soil.dSoil, 0.01);
  assert.equal(k1.soil.status, 'valid');
});

test('3. Coastal tidal water points handle missing data with not_enough_data status', () => {
  const coastal = getDistrictEsaCci('coxsbazar');
  assert.ok(coastal, 'Coxs Bazar record must exist');
  assert.equal(coastal.rabi.status, 'not_enough_data');
  assert.equal(coastal.rabi.thenSoil, null);
  assert.equal(coastal.rabi.nowSoil, null);
  assert.ok(coastal.rabi.takeawayEn.includes('Insufficient valid microwave'));
});

test('4. Crop Suitability generates Rule CCI-01 irrigation planning advisory for wheat & potato', () => {
  const ranked = getRankedCrops('save_water', undefined, 'Rabi', {
    rainfall30d: 15,
    soilMoisture: 0.20,
    maxTemp: 26,
    waterBalance: -10,
  });

  const wheat = ranked.find((c) => c.id === 'wheat');
  const potato = ranked.find((c) => c.id === 'potato');

  assert.ok(wheat, 'Wheat must exist');
  assert.ok(
    wheat.explanation?.rulesSatisfied?.some((r) => r.includes('Rule CCI-01')),
    'Wheat must cite Rule CCI-01 in explanation'
  );

  assert.ok(potato, 'Potato must exist');
  assert.ok(
    potato.explanation?.rulesSatisfied?.some((r) => r.includes('Rule CCI-01')),
    'Potato must cite Rule CCI-01 in explanation'
  );
});

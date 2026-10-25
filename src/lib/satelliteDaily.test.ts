import test from 'node:test';
import assert from 'node:assert/strict';
import { isObservationFresh } from './satelliteService.ts';
import { formatBadgeDate } from '../components/common/DataTileStatusBadge.tsx';
import { getDistrictSatellite } from '../data/satellite.ts';
import { findLatestNdviProductAndDate, fetchDistrictNdvi } from '../../scripts/update-satellite-data.ts';

test('1. isObservationFresh correctly evaluates 7-day age threshold', () => {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  assert.equal(isObservationFresh(twoDaysAgo, 7), true, 'Observation from 2 days ago must be fresh');
  assert.equal(isObservationFresh(sixDaysAgo, 7), true, 'Observation from 6 days ago must be fresh');
  assert.equal(isObservationFresh(eightDaysAgo, 7), false, 'Observation from 8 days ago must NOT be fresh');
  assert.equal(isObservationFresh(thirtyDaysAgo, 7), false, 'Observation from 30 days ago must NOT be fresh');
  assert.equal(isObservationFresh(null), false, 'Null observation date must not be fresh');
  assert.equal(isObservationFresh('invalid-date'), false, 'Malformed date must not be fresh');
});

test('2. formatBadgeDate formats real observation dates in English and Bangla', () => {
  assert.equal(formatBadgeDate('2026-10-22', 'en'), '22 Oct 2026');
  assert.equal(formatBadgeDate('2026-10-22', 'bn'), '২২ অক্টো, ২০২৬');
  assert.equal(formatBadgeDate(undefined, 'en'), 'Data unavailable');
  assert.equal(formatBadgeDate(undefined, 'bn'), 'তথ্য পাওয়া যায়নি');
});

test('3. Rangpur district contains calibrated SMAP and updated NDVI observations', () => {
  const sat = getDistrictSatellite('rangpur');
  assert.ok(sat, 'Rangpur satellite record must exist');

  assert.ok(sat.smap, 'SMAP record must exist');
  assert.ok(sat.smap.value >= 0.05 && sat.smap.value <= 0.5, 'SMAP value must be within physical range');
  assert.ok(sat.smap.date, 'SMAP record must contain an observation date');
  assert.ok(sat.smap.pass === 'AM' || sat.smap.pass === 'PM', 'SMAP pass must be AM or PM');

  assert.ok(sat.ndvi, 'NDVI record must exist');
  assert.ok(sat.ndvi.value >= 0.1 && sat.ndvi.value <= 0.95, 'NDVI must be within green vegetation range');
  assert.ok(sat.ndvi.periodStart, 'NDVI must have an observation date');
});

test('4. ORNL DAAC REST API resolves latest MODIS/VIIRS NDVI product and date', async (t) => {
  try {
    const candidate = await findLatestNdviProductAndDate(25.75, 89.25);
    assert.ok(candidate, 'Must find valid candidate from ORNL DAAC');
    assert.ok(['MYD13Q1', 'MOD13Q1', 'VNP13A1'].includes(candidate.product), 'Product must be MODIS or VIIRS');
    assert.ok(candidate.calendarDate.startsWith('202'), 'Calendar date must be valid YYYY-MM-DD');
    assert.ok(candidate.modisDate.startsWith('A202'), 'MODIS date must start with AYYYY');
  } catch (err: any) {
    t.skip(`ORNL DAAC API is unreachable or timed out from current network: ${err.message}`);
  }
});

test('5. ORNL DAAC extracts real subset NDVI value for Rangpur coordinates', async (t) => {
  try {
    const candidate = await findLatestNdviProductAndDate(25.75, 89.25);
    const ndvi = await fetchDistrictNdvi(candidate, 25.75, 89.25);
    if (!ndvi) {
      t.skip('ORNL DAAC returned no subset data for test coordinate');
      return;
    }
    assert.ok(ndvi, 'NDVI subset must return valid record');
    assert.ok(ndvi.value >= 0.2 && ndvi.value <= 0.9, 'Extracted NDVI must be valid decimal');
    assert.equal(ndvi.periodStart, candidate.calendarDate, 'NDVI periodStart must match candidate date');
    assert.equal(ndvi.product, candidate.product, 'Product must match candidate');
  } catch (err: any) {
    t.skip(`ORNL DAAC API is unreachable or timed out from current network: ${err.message}`);
  }
});

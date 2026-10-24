import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUpazilasFor,
  getUpazila,
  getUpazilaName,
  locationFromDistrict,
  formatLocation,
  DISTRICT_WIDE_UPAZILA,
} from './location.ts';
import { BD_DISTRICTS, type DistrictId } from '../data/bdAdmin.ts';
import upazilasData from '../data/upazilas.json';

test('1. Full upazila dataset covers all 64 districts of Bangladesh', () => {
  assert.ok(upazilasData.length >= 495, `Expected at least 495 upazilas, got ${upazilasData.length}`);

  const districtsWithUpazilas = new Set(upazilasData.map((u: any) => u.district_id));
  assert.equal(BD_DISTRICTS.length, 64, 'Bangladesh must have exactly 64 administrative districts');

  for (const d of BD_DISTRICTS) {
    assert.ok(
      districtsWithUpazilas.has(d.id),
      `District ${d.nameEn} (${d.id}) must have upazila records`
    );
    const upzs = getUpazilasFor(d.id as DistrictId);
    assert.ok(upzs.length > 0, `getUpazilasFor('${d.id}') must return at least 1 upazila`);
  }
});

test('2. All upazilas have valid polygon centroids and official Bengali names', () => {
  for (const u of upazilasData as any[]) {
    assert.ok(u.id, 'Upazila must have an id');
    assert.ok(u.name_en, 'Upazila must have English name');
    assert.ok(u.name_bn, `Upazila ${u.id} must have Bengali name`);
    assert.notEqual(u.name_bn, u.name_en, `Upazila ${u.id} must have authentic Bengali text, not English fallback`);
    assert.ok(u.lat >= 20.0 && u.lat <= 27.0, `Lat ${u.lat} for ${u.id} must be within Bangladesh`);
    assert.ok(u.lon >= 88.0 && u.lon <= 93.0, `Lon ${u.lon} for ${u.id} must be within Bangladesh`);
    assert.ok(u.pcode && u.pcode.startsWith('BD'), `Pcode ${u.pcode} must be a valid UN OCHA PCODE`);
  }
});

test('3. Exact test case: Faridpur → Nagarkanda (ফরিদপুর → নগরকান্দা)', () => {
  const upzs = getUpazilasFor('faridpur');
  const nagarkanda = getUpazila('faridpur', 'nagarkanda');
  assert.ok(nagarkanda, 'Nagarkanda must exist in Faridpur');
  assert.equal(nagarkanda.nameEn, 'Nagarkanda');
  assert.equal(nagarkanda.nameBn, 'নগরকান্দা');
  assert.ok(Math.abs(nagarkanda.lat! - 23.4343) < 0.05, 'Lat must match centroid ~23.43');
  assert.ok(Math.abs(nagarkanda.lng! - 89.8956) < 0.05, 'Lon must match centroid ~89.89');

  const loc = locationFromDistrict('faridpur', 'nagarkanda');
  assert.equal(loc.district, 'faridpur');
  assert.equal(loc.upazila, nagarkanda.id);
  assert.equal(loc.latitude, nagarkanda.lat);
  assert.equal(loc.longitude, nagarkanda.lng);

  const formattedEn = formatLocation(loc, 'en');
  const formattedBn = formatLocation(loc, 'bn');
  assert.equal(formattedEn.label, 'Faridpur › Nagarkanda');
  assert.equal(formattedBn.label, 'ফরিদপুর › নগরকান্দা');
});

test('4. Exact test case: Rangpur → Pirganj (রংপুর → পীরগঞ্জ)', () => {
  const pirganj = getUpazila('rangpur', 'pirganj');
  assert.ok(pirganj, 'Pirganj must exist in Rangpur');
  assert.equal(pirganj.nameEn, 'Pirganj');
  assert.equal(pirganj.nameBn, 'পীরগঞ্জ');
  assert.ok(Math.abs(pirganj.lat! - 25.4258) < 0.05, 'Lat must match centroid ~25.42');
  assert.ok(Math.abs(pirganj.lng! - 89.2747) < 0.05, 'Lon must match centroid ~89.27');

  const loc = locationFromDistrict('rangpur', 'pirganj');
  const formattedBn = formatLocation(loc, 'bn');
  assert.equal(formattedBn.label, 'রংপুর › পীরগঞ্জ');
});

test('5. Exact test case: Rangpur → Mithapukur (রংপুর → মিঠাপুকুর)', () => {
  const mithapukur = getUpazila('rangpur', 'mithapukur');
  assert.ok(mithapukur, 'Mithapukur must exist in Rangpur');
  assert.equal(mithapukur.nameEn, 'Mithapukur');
  assert.equal(mithapukur.nameBn, 'মিঠাপুকুর');
  assert.ok(Math.abs(mithapukur.lat! - 25.5721) < 0.05, 'Lat must match centroid ~25.57');
  assert.ok(Math.abs(mithapukur.lng! - 89.2609) < 0.05, 'Lon must match centroid ~89.26');
});

test('6. Exact test case: Sylhet → Companiganj (সিলেট → কোম্পানীগঞ্জ)', () => {
  const comp = getUpazila('sylhet', 'companiganj');
  assert.ok(comp, 'Companiganj must exist in Sylhet');
  assert.equal(comp.nameEn, 'Companiganj');
  assert.equal(comp.nameBn, 'কোম্পানীগঞ্জ');
  assert.ok(Math.abs(comp.lat! - 25.0799) < 0.05, 'Lat must match centroid ~25.08');
  assert.ok(Math.abs(comp.lng! - 91.7731) < 0.05, 'Lon must match centroid ~91.77');

  const loc = locationFromDistrict('sylhet', 'companiganj');
  const formattedBn = formatLocation(loc, 'bn');
  assert.equal(formattedBn.label, 'সিলেট › কোম্পানীগঞ্জ');
});

test('7. Exact test case: Khulna → Dacope (খুলনা → দাকোপ)', () => {
  const dacope = getUpazila('khulna', 'dacope');
  assert.ok(dacope, 'Dacope must exist in Khulna');
  assert.equal(dacope.nameEn, 'Dacope');
  assert.equal(dacope.nameBn, 'দাকোপ');
  assert.ok(Math.abs(dacope.lat! - 22.2420) < 0.05, 'Lat must match centroid ~22.24');
  assert.ok(Math.abs(dacope.lng! - 89.5264) < 0.05, 'Lon must match centroid ~89.53');

  const loc = locationFromDistrict('khulna', 'dacope');
  const formattedBn = formatLocation(loc, 'bn');
  assert.equal(formattedBn.label, 'খুলনা › দাকোপ');
});

test('8. District-wide option correctly falls back to district HQ coordinates', () => {
  const loc = locationFromDistrict('faridpur', DISTRICT_WIDE_UPAZILA);
  assert.equal(loc.upazila, DISTRICT_WIDE_UPAZILA);
  assert.ok(Math.abs(loc.latitude - 23.6071) < 0.01, 'Must use Faridpur HQ lat');
  assert.ok(Math.abs(loc.longitude - 89.8426) < 0.01, 'Must use Faridpur HQ lng');

  const formattedEn = formatLocation(loc, 'en');
  const formattedBn = formatLocation(loc, 'bn');
  assert.equal(formattedEn.upazila, 'District-wide');
  assert.equal(formattedBn.upazila, 'সমগ্র জেলা');
  assert.equal(formattedEn.label, 'Faridpur');
  assert.equal(formattedBn.label, 'ফরিদপুর');
});

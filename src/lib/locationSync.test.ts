import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveFarmField,
  saveFarmerProfile,
  loadFarmerProfile,
  getActiveField,
  type FarmField,
  DEFAULT_INITIAL_FIELD,
} from './farmerProfileService';
import { getDistrictAdmin } from '../data/bdAdmin';
import { getUpazila, DISTRICT_WIDE_UPAZILA } from './location';

test('Location Sync: 1. saveFarmField resolves Chandpur coordinates accurately', async () => {
  const chandpurAdmin = getDistrictAdmin('chandpur');
  assert.ok(chandpurAdmin, 'Chandpur district admin must exist');

  const testField: FarmField = {
    ...DEFAULT_INITIAL_FIELD,
    id: 'field_test_chandpur',
    name: 'Chandpur Plot 1',
    district: 'chandpur',
    upazila: 'chandpur-sadar',
    isPrimary: true,
  };

  const saved = await saveFarmField(testField, 'test_user_chandpur_123');
  assert.equal(saved.field.district, 'chandpur');
  assert.equal(saved.field.districtId, 'chandpur');
  assert.equal(saved.field.upazila, 'chandpur-sadar');
  assert.ok(saved.field.latitude > 23.0 && saved.field.latitude < 24.0, 'Latitude must be in Chandpur range');
  assert.ok(saved.field.longitude > 90.0 && saved.field.longitude < 91.5, 'Longitude must be in Chandpur range');
});

test('Location Sync: 2. loadFarmerProfile recovers Chandpur field without falling back to Rangpur', async () => {
  const { profile, fields } = await loadFarmerProfile('test_user_chandpur_123');
  assert.ok(fields.length > 0, 'Fields list should contain saved field');
  const active = getActiveField(fields);
  assert.equal(active.district, 'chandpur', 'Active field must be Chandpur, not Rangpur');
  assert.equal(profile.districtId, 'chandpur', 'Profile districtId must match Chandpur');
});

test('Location Sync: 3. Change location to Faridpur -> Nagarkanda in profile updates field immediately', async () => {
  const faridpurAdmin = getDistrictAdmin('faridpur');
  const nagarkandaUpz = getUpazila('faridpur', 'nagarkanda');
  assert.ok(faridpurAdmin && nagarkandaUpz, 'Faridpur and Nagarkanda must exist');
  if (!nagarkandaUpz) throw new Error('Nagarkanda must exist');

  const updateRes = await saveFarmerProfile(
    {
      districtId: 'faridpur',
      upazilaId: 'nagarkanda',
      fullName: 'Mohammad Shahidul Islam',
    },
    'test_user_chandpur_123'
  );

  assert.equal(updateRes.success, true);

  const { profile, fields } = await loadFarmerProfile('test_user_chandpur_123');
  assert.equal(profile.districtId, 'faridpur');
  assert.equal(profile.upazilaId, 'nagarkanda');

  // Verify saveFarmField for Nagarkanda
  const nagarkandaField: FarmField = {
    ...DEFAULT_INITIAL_FIELD,
    id: 'field_test_faridpur',
    district: 'faridpur',
    upazila: 'nagarkanda',
    isPrimary: true,
  };

  const savedField = await saveFarmField(nagarkandaField, 'test_user_chandpur_123');
  assert.equal(savedField.field.district, 'faridpur');
  assert.equal(savedField.field.upazila, 'nagarkanda');
  const targetLat = nagarkandaUpz?.lat ?? 0;
  const targetLng = nagarkandaUpz?.lng ?? 0;
  assert.ok(Math.abs(savedField.field.latitude - targetLat) < 0.1, 'Latitude should match Nagarkanda centroid');
  assert.ok(Math.abs(savedField.field.longitude - targetLng) < 0.1, 'Longitude should match Nagarkanda centroid');
});

test('Location Sync: 4. getActiveField prioritizes primary field with valid district', () => {
  const dummyFields: FarmField[] = [
    {
      ...DEFAULT_INITIAL_FIELD,
      id: 'field_old_rangpur',
      district: 'rangpur',
      isPrimary: false,
    },
    {
      ...DEFAULT_INITIAL_FIELD,
      id: 'field_new_chandpur',
      district: 'chandpur',
      isPrimary: true,
    },
  ];

  const active = getActiveField(dummyFields);
  assert.equal(active.district, 'chandpur', 'getActiveField must choose primary field over secondary');
  assert.equal(active.isPrimary, true);
});

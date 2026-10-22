import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROPS, cropById, resolveCropId, FAMILY_LABEL, CROP_ID_MAP } from './crops.ts';
import { CROP_CATEGORIES } from './cropCategories.ts';

test('Crop Knowledge Base: Part 1 Categories match exact specification and order', () => {
  const expectedCategories = [
    { id: 'cereal', order: 1, name_en: 'Cereal Crops', name_bn: 'দানা জাতীয় ফসল' },
    { id: 'pulses', order: 2, name_en: 'Pulses: Nitrogen Fixers', name_bn: 'ডাল জাতীয় ফসল' },
    { id: 'oilseeds', order: 3, name_en: 'Oilseeds', name_bn: 'তেলজাতীয় ফসল' },
    { id: 'tubers', order: 4, name_en: 'Tuber Crops', name_bn: 'কন্দাল ফসল' },
    { id: 'cash_fiber', order: 5, name_en: 'Cash & Fiber Crops', name_bn: 'অর্থকরী ও আঁশ জাতীয় ফসল' },
    { id: 'spices_veg', order: 6, name_en: 'Spices & Major Veg', name_bn: 'প্রধান মসলা ও অর্থকরী সবজি' },
  ];

  assert.equal(CROP_CATEGORIES.length, 6);
  expectedCategories.forEach((exp, idx) => {
    assert.equal(CROP_CATEGORIES[idx].id, exp.id);
    assert.equal(CROP_CATEGORIES[idx].order, exp.order);
    assert.equal(CROP_CATEGORIES[idx].name_en, exp.name_en);
    assert.equal(CROP_CATEGORIES[idx].name_bn, exp.name_bn);
  });
});

test('Crop Knowledge Base: Total 37 crops with required schema attributes', () => {
  assert.equal(CROPS.length, 37, 'Must have exactly 37 crops in knowledge base');

  const validCategoryIds = new Set(CROP_CATEGORIES.map((c) => c.id));

  for (const crop of CROPS) {
    assert.ok(crop.id, 'Crop must have id');
    assert.ok(validCategoryIds.has(crop.category_id), `Crop ${crop.id} has invalid category ${crop.category_id}`);
    assert.ok(crop.name_en, `Crop ${crop.id} missing name_en`);
    assert.ok(crop.name_bn, `Crop ${crop.id} missing name_bn`);
    assert.ok(crop.plant_family, `Crop ${crop.id} missing plant_family`);
    assert.ok(Array.isArray(crop.seasons) && crop.seasons.length > 0, `Crop ${crop.id} must have seasons`);
    assert.ok(crop.sowing_window?.months_en, `Crop ${crop.id} missing sowing_window`);
    assert.ok(crop.harvest_window?.months_en, `Crop ${crop.id} missing harvest_window`);
    assert.ok(Array.isArray(crop.growth_stages), `Crop ${crop.id} must have growth stages array`);
    assert.ok(Array.isArray(crop.sources) && crop.sources.length > 0, `Crop ${crop.id} must have sources`);

    // Backwards-compatible aliases
    assert.equal(crop.nameEn, crop.name_en);
    assert.equal(crop.nameBn, crop.name_bn);
    assert.ok(typeof crop.tempMin === 'number');
    assert.ok(typeof crop.tempMax === 'number');
    assert.ok(typeof crop.soilMin === 'number');
    assert.ok(typeof crop.soilMax === 'number');
    assert.ok(['low', 'medium', 'high'].includes(crop.water));
    assert.ok(['low', 'medium', 'high'].includes(crop.cost));
  }
});

test('Crop Knowledge Base: Exactly 32 research crops and 5 estimated crops', () => {
  const research = CROPS.filter((c) => c.data_confidence === 'research');
  const estimated = CROPS.filter((c) => c.data_confidence === 'estimated');

  assert.equal(research.length, 32, 'Must have exactly 32 research crops');
  assert.equal(estimated.length, 5, 'Must have exactly 5 estimated crops');

  const estimatedIds = new Set(estimated.map((c) => c.id));
  const expectedEstimated = new Set(['soybean', 'jute', 'sugarcane', 'cotton', 'tobacco']);
  assert.deepEqual(estimatedIds, expectedEstimated);

  for (const crop of estimated) {
    assert.ok(
      crop.sources.some((s) => s.file === 'missing-values.json' && s.confidence === 'estimated'),
      `Crop ${crop.id} must trace source to missing-values.json`
    );
  }
});

test('Crop Knowledge Base: Exactly 36 recommendable crops and Tobacco is NOT recommendable', () => {
  const recommendable = CROPS.filter((c) => c.recommendable);
  const nonRecommendable = CROPS.filter((c) => !c.recommendable);

  assert.equal(recommendable.length, 36, 'Must have exactly 36 recommendable crops');
  assert.equal(nonRecommendable.length, 1, 'Must have exactly 1 non-recommendable crop');
  assert.equal(nonRecommendable[0].id, 'tobacco');
  assert.equal(nonRecommendable[0].data_complete, false);
  assert.equal(nonRecommendable[0].duration_days, null);
  assert.equal(nonRecommendable[0].water_need_mm, null);
  assert.equal(nonRecommendable[0].temperature_c.optimal_min, null);
  assert.equal(nonRecommendable[0].smap_optimal.min, null);

  for (const crop of recommendable) {
    assert.equal(crop.data_complete, true, `Recommendable crop ${crop.id} must be complete`);
    assert.ok(crop.duration_days !== null, `Recommendable crop ${crop.id} duration cannot be null`);
    assert.ok(crop.water_need_mm !== null, `Recommendable crop ${crop.id} water need cannot be null`);
  }
});

test('Crop Knowledge Base: Backward compatibility and ID resolution', () => {
  // Legacy aliases
  assert.equal(resolveCropId('boro_rice'), 'boro');
  assert.equal(resolveCropId('aus_rice'), 'aus');
  assert.equal(resolveCropId('aman_rice'), 'aman');
  assert.equal(resolveCropId('t_aman'), 'aman');

  // Bengali names
  assert.equal(resolveCropId('বোরো ধান'), 'boro');
  assert.equal(resolveCropId('রোপা আমন'), 'aman');
  assert.equal(resolveCropId('গম'), 'wheat');
  assert.equal(resolveCropId('মসুর ডাল'), 'lentil');
  assert.equal(resolveCropId('পাট'), 'jute');

  // Direct IDs
  assert.equal(resolveCropId('mustard'), 'mustard');
  assert.equal(resolveCropId('potato'), 'potato');
  assert.equal(resolveCropId('maize'), 'maize');

  // cropById lookup
  const boro = cropById('boro_rice');
  assert.ok(boro);
  assert.equal(boro.id, 'boro');

  const aman = cropById('রোপা আমন ধান');
  assert.ok(aman);
  assert.equal(aman.id, 'aman');
});

test('Crop Knowledge Base: Plant families and labels', () => {
  const families = new Set(CROPS.map((c) => c.plant_family));
  assert.ok(families.size >= 13, 'Must support at least 13 botanical families');

  for (const fam of families) {
    assert.ok(FAMILY_LABEL[fam], `Missing FAMILY_LABEL for ${fam}`);
    assert.ok(FAMILY_LABEL[fam].en, `Missing English label for family ${fam}`);
    assert.ok(FAMILY_LABEL[fam].bn, `Missing Bengali label for family ${fam}`);
  }
});

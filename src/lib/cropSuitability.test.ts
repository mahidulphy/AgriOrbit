import test from 'node:test';
import assert from 'node:assert';
import { getRankedCrops, formatPriorityLabel, PRIORITY_META, PRIORITY_INFLUENCE } from './cropSuitability';
import type { FarmerPriorityId } from '../types';

test('1. All 7 priorities return ranked crops without crashing', () => {
  const priorities: FarmerPriorityId[] = [
    'save_water',
    'lower_cost',
    'improve_soil',
    'reduce_risk',
    'higher_income',
    'quick_harvest',
    'family_food',
  ];

  for (const pri of priorities) {
    const crops = getRankedCrops(pri);
    assert.ok(crops.length > 0, `Priority ${pri} should return crops`);
    // Scores are in valid range
    for (const c of crops) {
      assert.ok(c.suitabilityScore >= 20 && c.suitabilityScore <= 100, `Score ${c.suitabilityScore} out of bounds`);
    }
    // Scores do not collapse to identical 98% across all crops
    const scores = new Set(crops.map((c) => c.suitabilityScore));
    assert.ok(scores.size >= 4, `Priority ${pri} should have varied scores across crops, found ${scores.size}`);
  }
});

test('2. Dual priorities apply 50% weight to secondary priority', () => {
  const single = getRankedCrops('save_water', null);
  const dual = getRankedCrops('save_water', 'quick_harvest');

  assert.ok(single.length === dual.length);
  // Mustard is quick harvest (80 days) - should gain secondary delta
  const mustardDual = dual.find((c) => c.id === 'mustard')!;
  assert.ok(mustardDual.deltas?.secondaryPriorityDelta !== undefined);
  assert.ok(mustardDual.deltas.secondaryPriorityDelta > 0, 'Mustard should gain points from secondary quick_harvest');
});

test('3. Higher income boosts high-value crops with explanation', () => {
  const crops = getRankedCrops('higher_income');
  const mustard = crops.find((c) => c.id === 'mustard')!;
  assert.ok(mustard.deltas && mustard.deltas.primaryPriorityDelta > 0);
  assert.ok(
    mustard.explanation.rulesSatisfied.some((r) => r.includes('Rule INC-01')),
    'Should include INC-01 approximate value disclaimer rule'
  );
});

test('4. Family food security boosts staple crops', () => {
  const crops = getRankedCrops('family_food');
  const lentil = crops.find((c) => c.id === 'lentil')!;
  assert.ok(lentil.deltas && lentil.deltas.primaryPriorityDelta > 0);
  assert.ok(
    lentil.explanation.rulesSatisfied.some((r) => r.includes('Rule STAPLE-01')),
    'Should include STAPLE-01 rule'
  );
});

test('5. Priority labels, metadata, and influence texts exist for all 7 priorities', () => {
  const priorities: FarmerPriorityId[] = [
    'save_water',
    'lower_cost',
    'improve_soil',
    'reduce_risk',
    'higher_income',
    'quick_harvest',
    'family_food',
  ];

  for (const pri of priorities) {
    const labelEn = formatPriorityLabel(pri, 'en');
    const labelBn = formatPriorityLabel(pri, 'bn');
    assert.ok(labelEn.length > 0);
    assert.ok(labelBn.length > 0);
    assert.ok(PRIORITY_META[pri].titleEn.length > 0);
    assert.ok(PRIORITY_META[pri].titleBn.length > 0);
    assert.ok(PRIORITY_INFLUENCE[pri].en.length > 0);
    assert.ok(PRIORITY_INFLUENCE[pri].bn.length > 0);
  }
});

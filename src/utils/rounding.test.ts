import test from 'node:test';
import assert from 'node:assert/strict';
import { largestRemainderRound, calcRoundedDelta, roundTo } from './rounding.ts';

test('largestRemainderRound: shares sum to exactly 100', () => {
  const rawShares = [34.6, 42.4, 23.0];
  const rounded = largestRemainderRound(rawShares, 100);
  assert.equal(rounded.reduce((a, b) => a + b, 0), 100);
});

test('largestRemainderRound: handles Rangpur then and now shares correctly', () => {
  // Test case where standard rounding might produce 101 or 99
  const raw1 = [1.2, 34.6, 64.2];
  const res1 = largestRemainderRound(raw1, 100);
  assert.equal(res1.reduce((a, b) => a + b, 0), 100);

  const raw2 = [0.8, 42.4, 56.8];
  const res2 = largestRemainderRound(raw2, 100);
  assert.equal(res2.reduce((a, b) => a + b, 0), 100);
});

test('calcRoundedDelta: calculates delta from displayed rounded values without mismatch', () => {
  // 18.56 rounds to 18.6, 19.14 rounds to 19.1 -> Delta must be exactly +0.5, not +0.6
  const { roundedThen, roundedNow, delta } = calcRoundedDelta(18.56, 19.14, 1);
  assert.equal(roundedThen, 18.6);
  assert.equal(roundedNow, 19.1);
  assert.equal(delta, 0.5);
  assert.equal(Number((roundedNow - roundedThen).toFixed(1)), delta);
});

test('calcRoundedDelta: handles negative cooling delta accurately', () => {
  // 28.58 rounds to 28.6, 27.91 rounds to 27.9 -> Delta must be -0.7, not -0.6
  const { roundedThen, roundedNow, delta } = calcRoundedDelta(28.58, 27.91, 1);
  assert.equal(roundedThen, 28.6);
  assert.equal(roundedNow, 27.9);
  assert.equal(delta, -0.7);
  assert.equal(Number((roundedNow - roundedThen).toFixed(1)), delta);
});

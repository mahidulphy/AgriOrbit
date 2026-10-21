/**
 * Utility for exact rounding, delta calculations, and largest-remainder percentage apportionment.
 */

/**
 * Largest-remainder (Hare-Niemeyer) rounding method.
 * Ensures an array of percentage shares sums to exactly targetSum (default 100).
 *
 * @param shares - Array of raw float percentages
 * @param targetSum - Target total sum, default 100
 * @returns Array of integer percentages summing to targetSum
 */
export function largestRemainderRound(shares: number[], targetSum: number = 100): number[] {
  if (!shares.length) return [];

  const totalRaw = shares.reduce((a, b) => a + b, 0);
  if (totalRaw <= 0) {
    return shares.map(() => 0);
  }

  // Normalize if raw shares don't roughly sum to 100
  const normalized = shares.map((s) => (s / totalRaw) * targetSum);
  const floors = normalized.map((s) => Math.floor(s));
  const remainders = normalized.map((s, idx) => ({ remainder: s - Math.floor(s), idx }));

  const currentSum = floors.reduce((a, b) => a + b, 0);
  const diff = targetSum - currentSum;

  // Sort descending by remainder
  remainders.sort((a, b) => b.remainder - a.remainder);

  const result = [...floors];
  for (let i = 0; i < diff && i < remainders.length; i++) {
    result[remainders[i].idx] += 1;
  }

  return result;
}

/**
 * Rounds a number to a fixed number of decimal places.
 */
export function roundTo(val: number, places: number = 1): number {
  const factor = Math.pow(10, places);
  return Math.round(val * factor) / factor;
}

/**
 * Calculates delta directly from the displayed rounded values, preventing human-facing
 * rounding mismatches (e.g. 18.6 -> 19.1 must display +0.5, not +0.6).
 */
export function calcRoundedDelta(thenVal: number, nowVal: number, places: number = 1): {
  roundedThen: number;
  roundedNow: number;
  delta: number;
} {
  const roundedThen = roundTo(thenVal, places);
  const roundedNow = roundTo(nowVal, places);
  const delta = roundTo(roundedNow - roundedThen, places);
  return { roundedThen, roundedNow, delta };
}

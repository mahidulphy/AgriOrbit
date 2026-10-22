const fs = require('fs');

let code = fs.readFileSync('src/lib/engine.test.ts', 'utf8');

// Ensure INACTIVE_FORECAST_RULES is imported
if (!code.includes('INACTIVE_FORECAST_RULES')) {
  code = code.replace(
    "import { runEngine, scoreCrop, computeAlerts, RULES } from './engine.ts';",
    "import { runEngine, scoreCrop, computeAlerts, RULES, INACTIVE_FORECAST_RULES } from './engine.ts';"
  );
}

const additionalTests = `
test('7. Engine robustness: all 36 recommendable crops score without crashing across seasons', () => {
  const baseInput = {
    conditions: {
      rain30: 45,
      tMax30: 28,
      tMaxAvg: 26,
      rh: 68,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -45,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.25,
    shift,
    forecast: cache.forecast,
    priority: 'income' as const,
  };

  const recommendable = CROPS.filter((c) => c.recommendable);
  assert.equal(recommendable.length, 36);

  for (const crop of recommendable) {
    for (const season of crop.seasons) {
      const score = scoreCrop(crop, season, true, baseInput, []);
      assert.ok(score.score >= 0 && score.score <= 100, \`Crop \${crop.id} score \${score.score} out of bounds\`);
      assert.ok(score.reasons.length > 0, \`Crop \${crop.id} must have scoring reasons\`);
    }
  }
});

test('8. Tobacco is strictly non-recommendable and never appears in picks or rotations', () => {
  const tobacco = cropById('tobacco');
  assert.equal(tobacco.recommendable, false);

  const input = {
    conditions: {
      rain30: 40,
      tMax30: 25,
      tMaxAvg: 22,
      rh: 60,
      et0: 2.5,
      et0Total: 75,
      waterBalance: -35,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.22,
    shift,
    forecast: cache.forecast,
    priority: 'income' as const,
  };

  const result = runEngine(input);
  for (const pick of result.picks) {
    assert.notEqual(pick.crop.id, 'tobacco', 'Tobacco must never be in rotation picks');
  }

  for (const season of result.seasons) {
    const seasonOptions = result.options[season];
    assert.ok(
      !seasonOptions.some((o) => o.crop.id === 'tobacco'),
      'Tobacco must never be in season options'
    );
  }
});

test('9. Estimated crops (Soybean, Jute, Sugarcane, Cotton) include transparent notice reason', () => {
  const estimatedIds = ['soybean', 'jute', 'sugarcane', 'cotton'];
  const input = {
    conditions: {
      rain30: 55,
      tMax30: 28,
      tMaxAvg: 25,
      rh: 70,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -35,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.28,
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  for (const id of estimatedIds) {
    const crop = cropById(id);
    const score = scoreCrop(crop, crop.seasons[0], true, input, []);
    const notice = score.reasons.find((r) => r.code === 'estimatedNotice');
    assert.ok(notice, \`Estimated crop \${id} must include estimatedNotice reason\`);
    assert.equal(notice.source, 'Estimated');
    assert.ok(String(notice.v.noticeBn).includes('স্থানীয় কৃষি অফিসে নিশ্চিত হোন'));
  }
});

test('10. Tie-breaking rule: research-backed crops rank higher than estimated crops on equal score', () => {
  const baseInput = {
    conditions: {
      rain30: 45,
      tMax30: 28,
      tMaxAvg: 26,
      rh: 68,
      et0: 3.0,
      et0Total: 90,
      waterBalance: -45,
      from: '2026-09-01',
      to: '2026-09-30',
    },
    soil: 0.25,
    shift,
    forecast: cache.forecast,
    priority: 'water' as const,
  };

  const result = runEngine(baseInput);
  for (const season of result.seasons) {
    const opts = result.options[season];
    for (let i = 0; i < opts.length - 1; i++) {
      if (opts[i].score === opts[i + 1].score) {
        if (opts[i].crop.data_confidence === 'estimated' && opts[i + 1].crop.data_confidence === 'research') {
          assert.fail(\`Research crop \${opts[i+1].crop.id} should rank above estimated crop \${opts[i].crop.id} on equal score\`);
        }
      }
    }
  }
});

test('11. Inactive decision rules: all 5 rules defined, marked active: false with missing data rationale', () => {
  assert.equal(INACTIVE_FORECAST_RULES.length, 5);
  const ruleIds = INACTIVE_FORECAST_RULES.map((r) => r.id);
  assert.ok(ruleIds.includes('RULE_BORO_DEC_SMAP'));
  assert.ok(ruleIds.includes('RULE_AMAN_JULY_RAIN'));
  assert.ok(ruleIds.includes('RULE_AUS_MARCH_RAIN'));
  assert.ok(ruleIds.includes('RULE_WHEAT_HEAT_WAVE'));
  assert.ok(ruleIds.includes('RULE_MAIZE_GROUNDWATER'));

  for (const rule of INACTIVE_FORECAST_RULES) {
    assert.equal(rule.active, false);
    assert.ok(rule.reason_inactive_en.length > 0);
    assert.ok(rule.reason_inactive_bn.length > 0);
    assert.ok(rule.suggestion_en.length > 0);
    assert.ok(rule.suggestion_bn.length > 0);
  }
});
`;

code = code.trim() + '\n' + additionalTests;
fs.writeFileSync('src/lib/engine.test.ts', code, 'utf8');
console.log('Successfully updated src/lib/engine.test.ts with additional tests');

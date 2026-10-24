import test from 'node:test';
import assert from 'node:assert';
import { formatAlertContent, buildAlertEmailHtml, processGenerateAlerts } from './alertGenerator';

/**
 * SYNTHETIC TEST FIXTURE (FOR UNIT TESTS ONLY)
 * This fixture is strictly used in this test file to verify formatting and alerting logic offline.
 * It is NEVER inserted into the database, never returned by API routes, and never rendered in the UI.
 */
export const SYNTHETIC_DEMO_FIELD_FIXTURE = {
  id: '00000000-0000-0000-0000-000000000001',
  user_id: '00000000-0000-0000-0000-000000000000',
  name: 'Demo Field',
  district: 'Dinajpur',
  districtBn: 'দিনাজপুর',
  latitude: 25.63,
  longitude: 88.64,
  syntheticAlert: {
    code: 'heat' as const,
    source: 'POWER' as const,
    v: { t: 36.8 },
    date: '2026-10-20',
  },
};

test('1. formatAlertContent: produces localized content with real numbers and dates', () => {
  const heatContent = formatAlertContent(
    { code: 'heat', source: 'POWER', v: { t: 36.5 } },
    'Plot 1',
    'Dinajpur',
    'দিনাজপুর',
    '2026-10-20'
  );

  assert.strictEqual(heatContent.severity, 'warning');
  assert.strictEqual(heatContent.data_source, 'NASA POWER');
  assert.match(heatContent.title_en, /Dinajpur \(36\.5°C\)/);
  assert.match(heatContent.title_bn, /দিনাজপুর \(৩৬\.৫° সে\.\)/);
  assert.match(heatContent.body_en, /36\.5°C/);
  assert.match(heatContent.body_en, /2026-10-20/);
  assert.match(heatContent.body_bn, /দিনাজপুর/);

  const floodContent = formatAlertContent(
    { code: 'flood', source: 'OpenMeteo', v: { rain: 180 } },
    'Plot 2',
    'Sylhet',
    'সিলেট',
    '2026-10-23'
  );

  assert.strictEqual(floodContent.severity, 'danger');
  assert.match(floodContent.title_en, /180mm forecast/);
  assert.match(floodContent.body_en, /180 mm/);
  assert.match(floodContent.body_bn, /সিলেট/);

  const dryContent = formatAlertContent(
    { code: 'lowWater', source: 'SMAP', v: { rain: 28, soil: 0.12 } },
    'Plot 3',
    'Rajshahi',
    'রাজশাহী',
    '2026-10-20'
  );

  assert.strictEqual(dryContent.severity, 'warning');
  assert.match(dryContent.title_en, /28mm rain/);
  assert.match(dryContent.title_en, /0\.12 m³\/m³/);
  assert.match(dryContent.body_bn, /রাজশাহী/);
});

test('2. buildAlertEmailHtml: constructs bilingual email with dashboard CTA and privacy text', () => {
  const html = buildAlertEmailHtml(
    [
      {
        user_id: 'user-1',
        field_id: 'field-1',
        alert_type: 'heat',
        severity: 'warning',
        title_en: 'Heat Stress Warning: Dinajpur (36.5°C)',
        title_bn: 'তাপপ্রবাহ সতর্কতা: দিনাজপুর (৩৬.৫° সে.)',
        body_en: 'Max temp reached 36.5°C on 2026-10-20.',
        body_bn: '২০২৬-১০-২০ তারিখে তাপমাত্রা ৩৬.৫° সে. ছাড়িয়েছে।',
        data_source: 'NASA POWER',
        data_date: '2026-10-20',
      },
    ],
    'https://agri-orbit.vercel.app'
  );

  assert.match(html, /AgriOrbit/);
  assert.match(html, /https:\/\/agri-orbit\.vercel\.app/);
  assert.match(html, /Heat Stress Warning/);
  assert.match(html, /তাপপ্রবাহ সতর্কতা/);
  assert.match(html, /Your email is used solely for field alerts/);
  assert.match(html, /Max 1 email per user per day/);
});

test('3. processGenerateAlerts: rejects requests missing or invalid Bearer CRON_SECRET', async () => {
  const resNoAuth = await processGenerateAlerts({
    cronSecret: 'test-secret-123',
    authHeader: undefined,
  });
  assert.strictEqual(resNoAuth.status, 401);

  const resWrongAuth = await processGenerateAlerts({
    cronSecret: 'test-secret-123',
    authHeader: 'Bearer wrong-secret',
  });
  assert.strictEqual(resWrongAuth.status, 401);

  const resValidAuth = await processGenerateAlerts({
    cronSecret: 'test-secret-123',
    authHeader: 'Bearer test-secret-123',
    dryRun: true,
  });
  assert.strictEqual(resValidAuth.status, 200);
  assert.strictEqual(resValidAuth.body.dryRun, true);
});

test('4. synthetic fixture: verify offline formatting for synthetic demo field', () => {
  const content = formatAlertContent(
    SYNTHETIC_DEMO_FIELD_FIXTURE.syntheticAlert,
    SYNTHETIC_DEMO_FIELD_FIXTURE.name,
    SYNTHETIC_DEMO_FIELD_FIXTURE.district,
    SYNTHETIC_DEMO_FIELD_FIXTURE.districtBn,
    SYNTHETIC_DEMO_FIELD_FIXTURE.syntheticAlert.date
  );

  assert.strictEqual(content.severity, 'warning');
  assert.match(content.title_en, /Dinajpur \(36\.8°C\)/);
  assert.match(content.title_bn, /দিনাজপুর \(৩৬\.৮° সে\.\)/);
  assert.match(content.body_en, /36\.8°C/);
  assert.match(content.body_en, /2026-10-20/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAppOrigin, getAuthRedirectUrl } from './authUrl.ts';

test('authUrl: getAppOrigin returns fallback when window is undefined', () => {
  const origin = getAppOrigin();
  assert.ok(origin.length > 0);
  assert.ok(!origin.endsWith('/'));
});

test('authUrl: getAuthRedirectUrl defaults to /auth/callback', () => {
  const url = getAuthRedirectUrl();
  assert.ok(url.endsWith('/auth/callback'));
  assert.ok(!url.includes('#'));
});

test('authUrl: getAuthRedirectUrl supports custom paths and query parameters', () => {
  const recoveryUrl = getAuthRedirectUrl('/auth/callback?type=recovery');
  assert.ok(recoveryUrl.includes('/auth/callback?type=recovery'));
  assert.ok(!recoveryUrl.includes('#'));
});

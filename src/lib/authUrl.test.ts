import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAppOrigin, getAuthRedirectUrl } from './authUrl.ts';

test('authUrl: getAppOrigin returns fallback when window is undefined', () => {
  const origin = getAppOrigin();
  assert.strictEqual(origin, 'https://agri-orbit.vercel.app');
  assert.ok(!origin.endsWith('/'));
});

test('authUrl: getAppOrigin maps any *.vercel.app preview domain to production domain', () => {
  const originalWindow = (globalThis as any).window;
  try {
    (globalThis as any).window = {
      location: {
        origin: 'https://agri-orbit-git-main-mahidulphys-projects.vercel.app',
        hostname: 'agri-orbit-git-main-mahidulphys-projects.vercel.app',
      },
    };
    assert.strictEqual(getAppOrigin(), 'https://agri-orbit.vercel.app');

    (globalThis as any).window = {
      location: {
        origin: 'https://agri-orbit-preview-123.vercel.app',
        hostname: 'agri-orbit-preview-123.vercel.app',
      },
    };
    assert.strictEqual(getAppOrigin(), 'https://agri-orbit.vercel.app');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('authUrl: getAppOrigin preserves localhost for local development', () => {
  const originalWindow = (globalThis as any).window;
  try {
    (globalThis as any).window = {
      location: {
        origin: 'http://localhost:5173',
        hostname: 'localhost',
      },
    };
    assert.strictEqual(getAppOrigin(), 'http://localhost:5173');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('authUrl: getAuthRedirectUrl defaults to origin root without path', () => {
  const url = getAuthRedirectUrl();
  assert.strictEqual(url, getAppOrigin());
  assert.ok(!url.includes('#'));
});

test('authUrl: getAuthRedirectUrl supports custom paths and query parameters', () => {
  const recoveryUrl = getAuthRedirectUrl('/auth/callback?type=recovery');
  assert.ok(recoveryUrl.includes('/auth/callback?type=recovery'));
  assert.ok(!recoveryUrl.includes('#'));
});

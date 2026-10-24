/**
 * Utility for resolving environment-specific application URLs and Supabase auth redirect destinations.
 *
 * Ensures:
 * - Local development dynamically uses the active Vite development origin (e.g. http://localhost:5173).
 * - Production uses the canonical deployed AgriOrbit domain (https://agri-orbit.vercel.app).
 * - Any preview deployment (*.vercel.app) automatically redirects to the canonical production domain
 *   to avoid Vercel Deployment Protection authentication barriers.
 * - Clean OAuth redirect targets using the application origin.
 */

function getEnvVar(key: string): string {
  try {
    // 1. Vite environment
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[key];
      if (typeof val === 'string') return val;
    }
  } catch {
    // fallback
  }

  try {
    // 2. Node / SSR / Test environment
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key];
      if (typeof val === 'string') return val;
    }
  } catch {
    // fallback
  }

  return '';
}

export function getAppOrigin(): string {
  // 1. In browser environments:
  if (typeof window !== 'undefined' && window.location?.origin) {
    const hostname = window.location.hostname || '';

    // Allow localhost, 127.0.0.1, or local networks for local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return window.location.origin.replace(/\/+$/, '');
    }

    // Any *.vercel.app deployment should always resolve to the production domain
    // to prevent landing on protected Vercel preview deployments
    if (hostname.endsWith('.vercel.app')) {
      return 'https://agri-orbit.vercel.app';
    }

    return window.location.origin.replace(/\/+$/, '');
  }

  // 2. Explicit environment variable overrides
  const envUrl = (
    getEnvVar('VITE_APP_URL') ||
    getEnvVar('VITE_SITE_URL')
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 3. Fallback to production AgriOrbit domain
  return 'https://agri-orbit.vercel.app';
}

/**
 * Generates the fully-qualified OAuth / email auth redirect URL.
 * Defaults to the application origin root (window.location.origin), avoiding 404s on static hosts.
 *
 * @param path - Optional callback path. If omitted or empty, returns application origin.
 * @returns Complete URL such as "https://agri-orbit.vercel.app" or "http://localhost:5173"
 */
export function getAuthRedirectUrl(path: string = ''): string {
  const origin = getAppOrigin();
  if (!path || path === '/') return origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

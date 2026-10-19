/**
 * Utility for resolving environment-specific application URLs and Supabase auth redirect destinations.
 *
 * Ensures:
 * - Local development dynamically uses the active Vite development origin (e.g. http://localhost:5173).
 * - Production uses the deployed AgriOrbit domain (e.g. https://agri-orbit.vercel.app).
 * - No hardcoded 'localhost:3000' or static ports.
 * - Standard path-based redirect URIs without hash fragments ('#') for clean OAuth 2.0 / GoTrue compatibility.
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
  // 1. In browser environments, use the active window origin (host + port)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  // 2. Explicit environment variable overrides
  const envUrl = (
    getEnvVar('VITE_SITE_URL') ||
    getEnvVar('VITE_APP_URL') ||
    getEnvVar('NEXT_PUBLIC_SITE_URL')
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 3. Fallback to production AgriOrbit domain
  return 'https://agri-orbit.vercel.app';
}

/**
 * Generates the fully-qualified OAuth / email auth redirect URL.
 *
 * @param path - The callback path (default: '/auth/callback')
 * @returns Complete URL such as "http://localhost:5173/auth/callback" or "https://agri-orbit.vercel.app/auth/callback"
 */
export function getAuthRedirectUrl(path: string = '/auth/callback'): string {
  const origin = getAppOrigin();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

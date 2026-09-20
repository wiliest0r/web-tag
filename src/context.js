/* global URL */
import { getDeviceSignals } from './fp.js';

const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'auth',
  'password',
  'pass',
  'key',
  'secret',
  'access_token',
  'api_key',
  'session',
  'session_id',
  'code',
  'state'
]);

/**
 * Strips or redacts sensitive query parameters (auth tokens, passwords, keys)
 * from URLs to prevent PII leakage into analytics.
 */
export function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  try {
    const isAbsolute = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
    const parsed = new URL(rawUrl, 'https://localhost');
    let modified = false;

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, '[REDACTED]');
        modified = true;
      }
    }

    if (!modified) return rawUrl;
    return isAbsolute ? parsed.toString() : parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return rawUrl;
  }
}

export function getPageContext() {
  if (typeof window === 'undefined') return {};
  return {
    url: sanitizeUrl(window.location.href),
    path: window.location.pathname,
    referrer: typeof document !== 'undefined' ? sanitizeUrl(document.referrer) || null : null,
    title: typeof document !== 'undefined' ? document.title : ''
  };
}

export function getScreenContext() {
  if (typeof window === 'undefined') return { width: 0, height: 0, density: 1 };
  return {
    width: window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0,
    height: window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0,
    density: window.devicePixelRatio || 1
  };
}

export function getUTMContext() {
  if (typeof window === 'undefined' || !window.location.search) return null;
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utm[key.replace('utm_', '')] = value;
    }
  });

  return Object.keys(utm).length > 0 ? utm : null;
}

export function getClientContext() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  return {
    page: getPageContext(),
    screen: getScreenContext(),
    device: getDeviceSignals(),
    locale: nav.language || null,
    timezone: typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || null
      : null,
    utm: getUTMContext()
  };
}
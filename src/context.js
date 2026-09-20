import { getDeviceSignals } from './fp.js';

export function getPageContext() {
  if (typeof window === 'undefined') return {};
  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
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
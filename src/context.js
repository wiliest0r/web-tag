export function getPageContext() {
  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || null,
    title: document.title
  };
}

export function getScreenContext() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth || 0,
    height: window.innerHeight || document.documentElement.clientHeight || 0,
    density: window.devicePixelRatio || 1
  };
}

export function getUTMContext() {
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
  return {
    page: getPageContext(),
    screen: getScreenContext(),
    locale: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    utm: getUTMContext()
  };
}

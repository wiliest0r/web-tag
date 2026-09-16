export function initPerformanceMonitoring(tracker) {
  if (typeof window === 'undefined' || !window.performance) return;

  // 1. Navigation Timing Metrics (collected upon window load)
  window.addEventListener('load', () => {
    setTimeout(() => {
      const [nav] = performance.getEntriesByType('navigation');
      if (nav) {
        tracker.track('performance_metric', {
          category: 'navigation_timing',
          ttfb_ms: Math.round(nav.responseStart - nav.requestStart),
          dns_time_ms: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
          tls_time_ms: nav.secureConnectionStart > 0 ? Math.round(nav.connectEnd - nav.secureConnectionStart) : 0,
          dom_interactive_ms: Math.round(nav.domInteractive),
          dom_content_loaded_ms: Math.round(nav.domContentLoadedEventEnd),
          page_load_time_ms: Math.round(nav.loadEventEnd),
          network: navigator.connection ? {
            effective_type: navigator.connection.effectiveType,
            rtt: navigator.connection.rtt,
            downlink: navigator.connection.downlink
          } : null
        });
      }
    }, 0);
  });

  // 2. Core Web Vitals via PerformanceObserver
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        tracker.track('performance_metric', {
          category: 'web_vitals',
          metric: 'LCP',
          value_ms: Math.round(lastEntry.startTime)
        });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Send CLS when page is hidden/closed
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          tracker.track('performance_metric', {
            category: 'web_vitals',
            metric: 'CLS',
            value: parseFloat(clsValue.toFixed(4))
          });
        }
      });
    } catch {
      // Ignore unsupported observers
    }
  }
}

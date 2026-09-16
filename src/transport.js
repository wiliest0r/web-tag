export function sendPayload(endpoint, payload) {
  const data = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([data], { type: 'application/json' });
    const queued = navigator.sendBeacon(endpoint, blob);
    if (queued) return;
  }

  if (typeof fetch !== 'undefined') {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true
    }).catch(() => {
      // Fail silently to avoid interrupting host page
    });
  }
}

# Web Tag (Openpixel Client SDK)

Ultra-lightweight (< 5 KB gzipped), asynchronous client-side analytics and telemetry tracker.

## Features
- **Zero-blocking Async Execution**: Collects context and queues events with minimal main-thread overhead.
- **SPA Routing Support**: Automatically detects navigation via `history.pushState`, `history.replaceState`, `popstate`, and `hashchange`.
- **Consent Management (CMP)**: Integrates with OneTrust, Cookiebot, and custom CMPs with offline event buffering.
- **Core Web Vitals & Network Diagnostics**: Measures TTFB, FCP, LCP, CLS, INP, connection quality, and client errors.
- **Transport**: Utilizes `navigator.sendBeacon` with fallback to `fetch(..., { keepalive: true })`.

## Usage
```html
<script>
  (function(w, d, s, r) {
    w[r] = w[r] || function() { (w[r].q = w[r].q || []).push(arguments); };
    var js = d.createElement(s);
    js.async = 1;
    js.src = '/client.js';
    var f = d.getElementsByTagName(s)[0];
    f.parentNode.insertBefore(js, f);
  })(window, document, 'script', 'openpixel');

  openpixel('init', 'APP-XYZ-123');
  openpixel('track', 'PageView');
</script>
```

## Build
```bash
npm install
npm run build
```

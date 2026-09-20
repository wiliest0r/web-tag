/**
 * Fast, zero-dependency client-side device & browser fingerprinting.
 * Combines Canvas 2D geometry/sub-pixel rendering, screen dimensions,
 * hardware concurrency, timezone, locale, and touch points.
 */

let cachedFingerprint = null;
let cachedSignals = null;

/**
 * 64-bit FNV-1a hash function returning a 16-character hex string.
 * Lightweight, fast, and collision-resistant for entropy strings.
 */
function fnv1a64(str) {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch >> 8), 0x01000193);
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return hex1 + hex2;
}

/**
 * Render an offscreen canvas to capture subpixel rendering, font anti-aliasing,
 * and GPU compositing differences.
 */
function getCanvasEntropy() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas_unsupported';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PlayTests, 😃 <canvas> 1.0', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('PlayTests, 😃 <canvas> 1.0', 4, 17);

    return canvas.toDataURL();
  } catch {
    return 'canvas_error';
  }
}

/**
 * Collect raw device signals and hardware entropy.
 */
export function getDeviceSignals() {
  if (cachedSignals) return cachedSignals;

  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const scr = typeof screen !== 'undefined' ? screen : {};

  cachedSignals = {
    screen: `${scr.width || 0}x${scr.height || 0}x${scr.colorDepth || 0}`,
    pixel_ratio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    cores: nav.hardwareConcurrency || 0,
    memory: nav.deviceMemory || 0,
    touch_points: nav.maxTouchPoints || 0,
    language: nav.language || '',
    timezone: typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      : '',
    tz_offset: new Date().getTimezoneOffset(),
    webdriver: Boolean(nav.webdriver),
    canvas_hash: fnv1a64(getCanvasEntropy())
  };

  return cachedSignals;
}

/**
 * Returns a persistent 64-bit device fingerprint hash.
 */
export function getDeviceFingerprint() {
  if (cachedFingerprint) return cachedFingerprint;

  const s = getDeviceSignals();
  const rawString = [
    s.screen,
    s.pixel_ratio,
    s.cores,
    s.memory,
    s.touch_points,
    s.language,
    s.timezone,
    s.tz_offset,
    s.canvas_hash
  ].join(':::');

  cachedFingerprint = fnv1a64(rawString);
  return cachedFingerprint;
}

/**
 * Extended asynchronous tier: optionally queries deeper signals
 * (e.g. WebGL unmasked GPU vendor/renderer) without blocking the main thread.
 */
export function loadExtendedFingerprint(callback) {
  if (typeof window === 'undefined') return;

  const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
  schedule(() => {
    let glVendor = 'unknown';
    let glRenderer = 'unknown';

    try {
      const glCanvas = document.createElement('canvas');
      const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
          glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
        }
      }
    } catch {
      // Ignore WebGL permission/context errors
    }

    const extendedFp = fnv1a64(`${getDeviceFingerprint()}:::${glVendor}:::${glRenderer}`);
    if (typeof callback === 'function') {
      callback({
        extended_fp: extendedFp,
        gpu_vendor: glVendor,
        gpu_renderer: glRenderer
      });
    }
  });
}
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const CLIENT_ID_KEY = '_op_cid';
const LEGACY_DEVICE_KEY = '_op_device_id';
const LEGACY_ANON_KEY = '_op_anon_id';
const SESSION_KEY = '_op_session_id';
const SESSION_TS_KEY = '_op_session_ts';

let inMemoryClientId = null;
let inMemorySessionId = null;
let inMemorySessionTs = 0;

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a persistent unique client identifier (GA4/Segment client_id standard).
 * Checks _op_cid -> fallback to _op_device_id -> fallback to _op_anon_id -> in-memory cache.
 */
export function getClientId() {
  if (inMemoryClientId) return inMemoryClientId;
  try {
    let id = (typeof localStorage !== 'undefined' && (
      localStorage.getItem(CLIENT_ID_KEY) ||
      localStorage.getItem(LEGACY_DEVICE_KEY) ||
      localStorage.getItem(LEGACY_ANON_KEY)
    )) || null;

    if (!id) {
      id = generateUUID();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    inMemoryClientId = id;
    return id;
  } catch {
    inMemoryClientId = generateUUID();
    return inMemoryClientId;
  }
}

/**
 * Backwards compatibility aliases
 */
export function getDeviceId() {
  return getClientId();
}

export function getAnonymousId() {
  return getClientId();
}

export function getSessionId() {
  const now = Date.now();
  try {
    let sessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : inMemorySessionId;
    const lastActivity = parseInt(
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_TS_KEY) : inMemorySessionTs.toString()) || '0',
      10
    );

    if (!sessionId || (now - lastActivity > SESSION_TIMEOUT_MS)) {
      sessionId = generateUUID();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }
      inMemorySessionId = sessionId;
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_TS_KEY, now.toString());
    }
    inMemorySessionTs = now;
    return sessionId;
  } catch {
    if (!inMemorySessionId || (now - inMemorySessionTs > SESSION_TIMEOUT_MS)) {
      inMemorySessionId = generateUUID();
    }
    inMemorySessionTs = now;
    return inMemorySessionId;
  }
}
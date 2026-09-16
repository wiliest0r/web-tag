const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ANON_ID_KEY = '_op_anon_id';
const SESSION_KEY = '_op_session_id';
const SESSION_TS_KEY = '_op_session_ts';

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

export function getAnonymousId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return generateUUID();
  }
}

export function getSessionId() {
  const now = Date.now();
  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    const lastActivity = parseInt(sessionStorage.getItem(SESSION_TS_KEY) || '0', 10);

    if (!sessionId || (now - lastActivity > SESSION_TIMEOUT_MS)) {
      sessionId = generateUUID();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    sessionStorage.setItem(SESSION_TS_KEY, now.toString());
    return sessionId;
  } catch {
    return generateUUID();
  }
}

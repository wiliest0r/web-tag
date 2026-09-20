import { getDeviceId, getSessionId, generateUUID } from './identity.js';
import { getDeviceFingerprint, loadExtendedFingerprint } from './fp.js';
import { getClientContext } from './context.js';
import { sendPayload } from './transport.js';
import { initPerformanceMonitoring } from './performance.js';
import { initErrorMonitoring } from './errors.js';
import { initSpaRouting } from './spa.js';
import { ConsentManager, ManualAdapter } from './consent.js';

export class Tracker {
  constructor() {
    this.appId = null;
    this.endpoint = null;
    this.userId = null;
    this.initialized = false;
    this.consentManager = null;
  }

  init(appId, options = {}) {
    if (this.initialized) return;

    this.appId = appId;
    this.endpoint = options.endpoint || '/v1/sync';
    this.userId = options.userId || null;

    // Initialize CMP Manager
    this.consentManager = new ConsentManager({
      requireConsent: options.requireConsent ?? false,
      cmpProvider: options.cmp || 'manual'
    });

    this.initialized = true;

    // Optionally schedule background extended fingerprinting without blocking
    if (options.extendedFp !== false) {
      loadExtendedFingerprint();
    }

    // Trigger initial standard events
    this.track('session_start');
    this.track('page_view');

    // Attach listeners
    this.attachAutoEvents();
    initPerformanceMonitoring(this);
    initErrorMonitoring(this);

    // Initialize SPA routing if enabled (default: true)
    if (options.enableSpa !== false) {
      initSpaRouting(this);
    }
  }

  consent(permissions = {}) {
    if (this.consentManager) {
      const allowed = permissions.analytics ?? true;
      ManualAdapter.setConsent(allowed);
      this.consentManager.updateConsent(allowed);
    }
  }

  identify(userId) {
    this.userId = userId;
  }

  track(eventName, properties = {}) {
    if (!this.initialized) return;

    const dispatch = () => {
      const deviceId = getDeviceId();
      const payload = {
        app_id: this.appId,
        device_id: deviceId,
        device_fp: getDeviceFingerprint(),
        anonymous_id: deviceId, // Kept for legacy ingestion tolerance
        session_id: getSessionId(),
        user_id: this.userId,
        event_id: generateUUID(),
        event_name: eventName,
        client_timestamp: new Date().toISOString(),
        context: getClientContext(),
        properties
      };
      sendPayload(this.endpoint, payload);
    };

    // If consent is pending/required, queue event until user confirms
    if (!this.consentManager.canTrack()) {
      this.consentManager.queueEvent(dispatch);
      return;
    }

    dispatch();
  }

  attachAutoEvents() {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.track('page_leave');
      }
    });

    document.addEventListener('click', (event) => {
      const target = event.target.closest('a, button, [data-track-click]');
      if (!target) return;

      this.track('click', {
        tag_name: target.tagName.toLowerCase(),
        element_id: target.id || null,
        element_class: target.className || null,
        text: target.innerText ? target.innerText.slice(0, 50).trim() : null,
        href: target.getAttribute('href') || null
      });
    }, { capture: true, passive: true });
  }
}
/**
 * CMP Adapter interface and provider integrations.
 */

// Adapter for OneTrust CMP
export const OneTrustAdapter = {
  name: 'onetrust',
  isReady() {
    return typeof window !== 'undefined' && typeof window.OnetrustActiveGroups === 'string';
  },
  hasConsent(category = 'C0002') { // C0002 = Performance/Analytics Cookies in OneTrust
    if (!this.isReady()) return false;
    return window.OnetrustActiveGroups.split(',').includes(category);
  },
  onConsentChange(callback) {
    if (typeof window === 'undefined') return;
    window.addEventListener('OneTrustGroupsUpdated', () => {
      callback(this.hasConsent());
    });
  }
};

// Adapter for Cookiebot CMP
export const CookiebotAdapter = {
  name: 'cookiebot',
  isReady() {
    return typeof window !== 'undefined' && Boolean(window.Cookiebot);
  },
  hasConsent() {
    return Boolean(window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.statistics);
  },
  onConsentChange(callback) {
    if (typeof window === 'undefined') return;
    window.addEventListener('CookiebotOnAccept', () => callback(this.hasConsent()));
    window.addEventListener('CookiebotOnDecline', () => callback(false));
  }
};

// Generic manual adapter (via openpixel('consent', { analytics: true }))
export const ManualAdapter = {
  name: 'manual',
  state: null,
  setConsent(allowed) {
    this.state = Boolean(allowed);
  },
  hasConsent() {
    return this.state;
  }
};

/**
 * ConsentManager: regulates event dispatch and persistence according to user consent.
 */
export class ConsentManager {
  constructor(options = {}) {
    this.requireConsent = Boolean(options.requireConsent);
    this.adapter = this.resolveAdapter(options.cmpProvider);
    this.pendingQueue = [];
    this.isConsentGranted = false;

    this.init();
  }

  resolveAdapter(provider) {
    switch (provider) {
      case 'onetrust': return OneTrustAdapter;
      case 'cookiebot': return CookiebotAdapter;
      default: return ManualAdapter;
    }
  }

  init() {
    if (!this.requireConsent) {
      this.isConsentGranted = true;
      return;
    }

    if (this.adapter.isReady && this.adapter.isReady()) {
      this.isConsentGranted = this.adapter.hasConsent();
    }

    if (typeof this.adapter.onConsentChange === 'function') {
      this.adapter.onConsentChange((granted) => {
        this.updateConsent(granted);
      });
    }
  }

  updateConsent(granted) {
    this.isConsentGranted = Boolean(granted);
    if (this.isConsentGranted) {
      this.drainQueue();
    }
  }

  canTrack() {
    return !this.requireConsent || this.isConsentGranted;
  }

  queueEvent(dispatchFn) {
    this.pendingQueue.push(dispatchFn);
  }

  drainQueue() {
    while (this.pendingQueue.length > 0) {
      const dispatch = this.pendingQueue.shift();
      try {
        dispatch();
      } catch {
        // Discard failed deferred dispatches
      }
    }
  }
}

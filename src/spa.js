/**
 * SPA Routing Listener: tracks virtual pageviews across client-side route transitions.
 */
export function initSpaRouting(tracker) {
  if (typeof window === 'undefined' || !window.history) return;

  let currentUrl = window.location.href;

  const triggerVirtualPageView = () => {
    // Delay slightly to allow the SPA framework (React, Vue, Next.js) to update document.title
    setTimeout(() => {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        const previousUrl = currentUrl;
        currentUrl = newUrl;

        tracker.track('page_view', {
          spa_navigation: true,
          previous_url: previousUrl
        });
      }
    }, 50);
  };

  // Monkey-patch history.pushState
  const originalPushState = history.pushState;
  if (typeof originalPushState === 'function') {
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      triggerVirtualPageView();
      return result;
    };
  }

  // Monkey-patch history.replaceState
  const originalReplaceState = history.replaceState;
  if (typeof originalReplaceState === 'function') {
    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      triggerVirtualPageView();
      return result;
    };
  }

  // Listen to browser back/forward and hash changes
  window.addEventListener('popstate', triggerVirtualPageView);
  window.addEventListener('hashchange', triggerVirtualPageView);
}

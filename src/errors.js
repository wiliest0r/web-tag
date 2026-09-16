export function initErrorMonitoring(tracker) {
  if (typeof window === 'undefined') return;

  const pageStartTime = Date.now();

  // Handle runtime exceptions
  window.addEventListener('error', (event) => {
    tracker.track('client_error', {
      error_type: event.error ? event.error.name : 'UncaughtError',
      error_message: event.message || 'Unknown error',
      source_file: event.filename || null,
      line_number: event.lineno || null,
      column_number: event.colno || null,
      stack_trace: event.error && event.error.stack ? event.error.stack.slice(0, 1000) : null,
      dom_state: document.readyState,
      visibility_state: document.visibilityState,
      time_since_load_ms: Date.now() - pageStartTime
    });
  });

  // Handle unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    tracker.track('client_error', {
      error_type: 'UnhandledPromiseRejection',
      error_message: reason instanceof Error ? reason.message : String(reason),
      stack_trace: reason instanceof Error && reason.stack ? reason.stack.slice(0, 1000) : null,
      dom_state: document.readyState,
      visibility_state: document.visibilityState,
      time_since_load_ms: Date.now() - pageStartTime
    });
  });
}

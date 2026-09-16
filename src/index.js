import { Tracker } from './tracker.js';

const trackerInstance = new Tracker();

function processCommand(args) {
  const [method, ...params] = args;
  if (typeof trackerInstance[method] === 'function') {
    trackerInstance[method](...params);
  }
}

// Drain queue from global stub if it exists
const queue = window.openpixel && window.openpixel.q ? window.openpixel.q : [];

// Expose tracker API globally
window.openpixel = function (...args) {
  processCommand(args);
};
window.openpixel.instance = trackerInstance;

// Process buffered calls
while (queue.length > 0) {
  processCommand(queue.shift());
}

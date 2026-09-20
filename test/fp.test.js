import test from 'node:test';
import assert from 'node:assert';
import { getClientSignature, getClientSignals, getDeviceFingerprint } from '../src/fp.js';
import { getClientId, getDeviceId, getAnonymousId, generateUUID } from '../src/identity.js';
import { sanitizeUrl } from '../src/context.js';

test('fp: generates deterministic 64-bit hex hash', () => {
  const sig1 = getClientSignature();
  const sig2 = getClientSignature();
  const legacyFp = getDeviceFingerprint();

  assert.strictEqual(typeof sig1, 'string');
  assert.strictEqual(sig1.length, 16);
  assert.strictEqual(sig1, sig2);
  assert.strictEqual(sig1, legacyFp);
  assert.match(sig1, /^[0-9a-f]{16}$/);
});

test('fp: captures structured client signals', () => {
  const signals = getClientSignals();

  assert.ok('screen' in signals);
  assert.ok('cores' in signals);
  assert.ok('pixel_ratio' in signals);
  assert.ok('canvas_hash' in signals);
  assert.strictEqual(signals.canvas_hash.length, 16);
});

test('identity: generates and retrieves valid client_id UUID', () => {
  const uuid = generateUUID();
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

  const clientId = getClientId();
  const deviceId = getDeviceId();
  const anonId = getAnonymousId();
  assert.strictEqual(clientId, deviceId);
  assert.strictEqual(clientId, anonId);
});
test('context: sanitizeUrl redacts sensitive query parameters', () => {
  const dirtyUrl = 'https://example.com/checkout?token=secret123&auth=bearer_abc&utm_source=google&password=super_secret_123';
  const cleanUrl = sanitizeUrl(dirtyUrl);
  assert.ok(!cleanUrl.includes('secret123'));
  assert.ok(!cleanUrl.includes('bearer_abc'));
  assert.ok(!cleanUrl.includes('super_secret_123'));
  assert.ok(cleanUrl.includes('token=%5BREDACTED%5D') || cleanUrl.includes('token=[REDACTED]'));
  assert.ok(cleanUrl.includes('utm_source=google'));
});
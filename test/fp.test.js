import test from 'node:test';
import assert from 'node:assert';
import { getDeviceFingerprint, getDeviceSignals } from '../src/fp.js';
import { getDeviceId, getAnonymousId, generateUUID } from '../src/identity.js';

test('fp: generates deterministic 64-bit hex hash', () => {
  const fp1 = getDeviceFingerprint();
  const fp2 = getDeviceFingerprint();

  assert.strictEqual(typeof fp1, 'string');
  assert.strictEqual(fp1.length, 16);
  assert.strictEqual(fp1, fp2);
  assert.match(fp1, /^[0-9a-f]{16}$/);
});

test('fp: captures structured device signals', () => {
  const signals = getDeviceSignals();

  assert.ok('screen' in signals);
  assert.ok('cores' in signals);
  assert.ok('pixel_ratio' in signals);
  assert.ok('canvas_hash' in signals);
  assert.strictEqual(signals.canvas_hash.length, 16);
});

test('identity: generates and retrieves valid device UUID', () => {
  const uuid = generateUUID();
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

  const deviceId = getDeviceId();
  const anonId = getAnonymousId();
  assert.strictEqual(deviceId, anonId);
});
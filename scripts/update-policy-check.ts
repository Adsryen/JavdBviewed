import assert from 'node:assert/strict';
import {
  normalizeReleaseVersion,
  shouldRunUpdateCheck,
} from '../src/services/update/checker';

const now = Date.parse('2026-05-19T08:00:00.000Z');

assert.equal(normalizeReleaseVersion('v1.20.1'), '1.20.1');
assert.equal(normalizeReleaseVersion('Release 1.20.1'), '1.20.1');
assert.equal(normalizeReleaseVersion('javdb-extension-v1.20.1-build-206.zip'), '1.20.1');

assert.equal(
  shouldRunUpdateCheck({
    autoUpdateCheck: false,
    updateCheckInterval: '24',
    lastCheckedAt: null,
    now,
  }).reason,
  'disabled',
);

assert.equal(
  shouldRunUpdateCheck({
    autoUpdateCheck: false,
    updateCheckInterval: '24',
    lastCheckedAt: new Date(now).toISOString(),
    now,
    force: true,
  }).reason,
  'force',
);

assert.equal(
  shouldRunUpdateCheck({
    autoUpdateCheck: true,
    updateCheckInterval: '24',
    lastCheckedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    now,
  }).reason,
  'cached',
);

assert.equal(
  shouldRunUpdateCheck({
    autoUpdateCheck: true,
    updateCheckInterval: '24',
    lastCheckedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
    now,
  }).reason,
  'expired',
);

assert.equal(
  shouldRunUpdateCheck({
    autoUpdateCheck: true,
    updateCheckInterval: 'bad-value',
    lastCheckedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
    now,
  }).intervalHours,
  24,
);

console.log('update policy checks passed');

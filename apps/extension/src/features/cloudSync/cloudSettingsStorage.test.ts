/**
 * @file cloudSettingsStorage.test.ts
 */
import { describe, expect, it } from 'vitest';
import { createDefaultCloudSettings, normalizeCloudBaseUrl } from './cloudSettingsStorage';

describe('normalizeCloudBaseUrl', () => {
  it('strips trailing slash and accepts host without scheme', () => {
    expect(normalizeCloudBaseUrl('http://127.0.0.1:8080/')).toBe('http://127.0.0.1:8080');
    expect(normalizeCloudBaseUrl('http://127.0.0.1:18080/')).toBe('http://127.0.0.1:18080');
    expect(normalizeCloudBaseUrl('127.0.0.1:8080')).toMatch(/127\.0\.0\.1:8080/);
  });
});

describe('createDefaultCloudSettings', () => {
  it('reuses shared device id when provided', () => {
    const s = createDefaultCloudSettings('shared-webdav-id');
    expect(s.deviceId).toBe('shared-webdav-id');
    expect(s.baseUrl).toContain('18080');
  });
});

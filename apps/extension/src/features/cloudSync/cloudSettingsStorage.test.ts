/**
 * @file cloudSettingsStorage.test.ts
 */
import { describe, expect, it } from 'vitest';
import { normalizeCloudBaseUrl } from './cloudSettingsStorage';

describe('normalizeCloudBaseUrl', () => {
  it('strips trailing slash and accepts host without scheme', () => {
    expect(normalizeCloudBaseUrl('http://127.0.0.1:8080/')).toBe('http://127.0.0.1:8080');
    expect(normalizeCloudBaseUrl('127.0.0.1:8080')).toMatch(/127\.0\.0\.1:8080/);
  });
});

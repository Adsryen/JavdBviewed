/**
 * @file firefoxManifest.test.ts
 * @description Firefox manifest 转换单测
 * @module scripts
 */
import { describe, expect, it } from 'vitest';
import {
  FIREFOX_GECKO_ID,
  FIREFOX_STRICT_MIN_VERSION,
  toFirefoxManifest,
} from './firefoxManifest';

describe('toFirefoxManifest', () => {
  it('maps service_worker to scripts, stamps gecko, strips use_dynamic_url', () => {
    const result = toFirefoxManifest({
      manifest_version: 3,
      name: 'Jav 助手',
      background: {
        service_worker: 'service-worker-loader.js',
        type: 'module',
      },
      permissions: ['storage'],
      web_accessible_resources: [
        {
          matches: ['<all_urls>'],
          resources: ['assets/*'],
          use_dynamic_url: false,
        },
      ],
    });

    expect(result.background).toEqual({
      scripts: ['service-worker-loader.js'],
      type: 'module',
    });
    expect(result.browser_specific_settings?.gecko).toEqual({
      id: FIREFOX_GECKO_ID,
      strict_min_version: FIREFOX_STRICT_MIN_VERSION,
    });
    expect(result.permissions).toEqual(['storage']);
    expect((result.background as { service_worker?: string }).service_worker).toBeUndefined();
    expect(result.web_accessible_resources?.[0]).toEqual({
      matches: ['<all_urls>'],
      resources: ['assets/*'],
    });
    expect(result.web_accessible_resources?.[0].use_dynamic_url).toBeUndefined();
  });

  it('rejects non-MV3 and missing service_worker', () => {
    expect(() =>
      toFirefoxManifest({
        manifest_version: 2,
        background: { scripts: ['bg.js'] },
      }),
    ).toThrow(/MV3/);

    expect(() =>
      toFirefoxManifest({
        manifest_version: 3,
        background: { scripts: ['bg.js'] },
      }),
    ).toThrow(/service_worker/);
  });
});
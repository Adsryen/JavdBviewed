/**
 * @file firefoxManifest.test.ts
 * @description Firefox manifest 转换单测
 * @module scripts
 */
import { describe, expect, it } from 'vitest';
import {
  COVERS_REFERER_RULESET,
  DECLARATIVE_NET_REQUEST_PERMISSION,
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
      permissions: ['storage', 'declarativeNetRequest'],
      web_accessible_resources: [
        {
          matches: ['<all_urls>'],
          resources: ['assets/*'],
          use_dynamic_url: false,
        },
      ],
      declarative_net_request: {
        rule_resources: [{ ...COVERS_REFERER_RULESET }],
      },
    });

    expect(result.background).toEqual({
      scripts: ['service-worker-loader.js'],
      type: 'module',
    });
    expect(result.browser_specific_settings?.gecko).toEqual({
      id: FIREFOX_GECKO_ID,
      strict_min_version: FIREFOX_STRICT_MIN_VERSION,
    });
    expect(result.permissions).toEqual(['storage', 'declarativeNetRequest']);
    expect((result.background as { service_worker?: string }).service_worker).toBeUndefined();
    expect(result.web_accessible_resources?.[0]).toEqual({
      matches: ['<all_urls>'],
      resources: ['assets/*'],
    });
    expect(result.web_accessible_resources?.[0].use_dynamic_url).toBeUndefined();
    expect(result.declarative_net_request?.rule_resources).toEqual([
      expect.objectContaining({
        id: 'covers_referer',
        enabled: true,
        path: 'rules/covers_referer.json',
      }),
    ]);
  });

  it('injects covers_referer ruleset when declarative_net_request is missing', () => {
    const result = toFirefoxManifest({
      manifest_version: 3,
      background: {
        service_worker: 'service-worker-loader.js',
        type: 'module',
      },
      permissions: ['declarativeNetRequest'],
    });

    expect(result.declarative_net_request?.rule_resources).toEqual([
      {
        id: 'covers_referer',
        enabled: true,
        path: 'rules/covers_referer.json',
      },
    ]);
    expect(result.permissions).toContain('declarativeNetRequest');
  });

  it('appends covers_referer when rule_resources is empty array', () => {
    const result = toFirefoxManifest({
      manifest_version: 3,
      background: {
        service_worker: 'bg.js',
      },
      declarative_net_request: {
        rule_resources: [],
      },
    });

    expect(result.declarative_net_request?.rule_resources).toEqual([
      expect.objectContaining({ id: 'covers_referer' }),
    ]);
    expect(result.permissions).toContain(DECLARATIVE_NET_REQUEST_PERMISSION);
  });

  it('appends covers_referer when other rule_resources exist without it', () => {
    const result = toFirefoxManifest({
      manifest_version: 3,
      background: {
        service_worker: 'bg.js',
      },
      permissions: [DECLARATIVE_NET_REQUEST_PERMISSION],
      declarative_net_request: {
        rule_resources: [{ id: 'other', enabled: true, path: 'rules/other.json' }],
      },
    });

    expect(result.declarative_net_request?.rule_resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'other', path: 'rules/other.json' }),
        expect.objectContaining({
          id: 'covers_referer',
          enabled: true,
          path: 'rules/covers_referer.json',
        }),
      ]),
    );
    expect(result.declarative_net_request?.rule_resources).toHaveLength(2);
  });

  it('adds declarativeNetRequest permission when ruleset is injected but permission missing', () => {
    const result = toFirefoxManifest({
      manifest_version: 3,
      background: {
        service_worker: 'bg.js',
      },
      permissions: ['storage'],
    });

    expect(result.permissions).toEqual(
      expect.arrayContaining(['storage', DECLARATIVE_NET_REQUEST_PERMISSION]),
    );
    expect(result.declarative_net_request?.rule_resources).toEqual([
      expect.objectContaining({ id: 'covers_referer' }),
    ]);
  });

  it('adds declarativeNetRequest permission when permissions field is absent', () => {
    const result = toFirefoxManifest({
      manifest_version: 3,
      background: {
        service_worker: 'bg.js',
      },
    });

    expect(result.permissions).toEqual([DECLARATIVE_NET_REQUEST_PERMISSION]);
    expect(result.declarative_net_request?.rule_resources).toEqual([
      expect.objectContaining({ id: 'covers_referer' }),
    ]);
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

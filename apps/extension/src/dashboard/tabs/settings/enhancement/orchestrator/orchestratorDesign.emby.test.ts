/**
 * @file orchestratorDesign.emby.test.ts
 * @description Emby 设计视图启用条件与 content 匹配对齐
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { isDesignEmbyEnabled } from './orchestratorDesign';

describe('isDesignEmbyEnabled', () => {
  it('is false when emby disabled even if match urls exist', () => {
    expect(
      isDesignEmbyEnabled({
        emby: {
          enabled: false,
          matchUrls: ['http://localhost:8096/*'],
        },
      } as any),
    ).toBe(false);
  });

  it('is true when enabled and mediaServers provide match url', () => {
    expect(
      isDesignEmbyEnabled({
        emby: {
          enabled: true,
          mediaServers: [{ url: 'http://192.168.1.10:8096', enabled: true }],
          matchUrls: [],
        },
      } as any),
    ).toBe(true);
  });

  it('is true when enabled and matchUrls present', () => {
    expect(
      isDesignEmbyEnabled({
        emby: {
          enabled: true,
          matchUrls: ['https://emby.example.com/*'],
        },
      } as any),
    ).toBe(true);
  });

  it('ignores legacy urlPatterns alone', () => {
    expect(
      isDesignEmbyEnabled({
        emby: {
          enabled: true,
          urlPatterns: ['http://legacy/*'],
          matchUrls: [],
          mediaServers: [],
        },
      } as any),
    ).toBe(false);
  });
});

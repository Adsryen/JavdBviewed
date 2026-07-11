/**
 * @file dnrRules.test.ts
 * @description 封面 referer DNR 动态安装单测
 * @module apps/background
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCoversRefererDynamicRule,
  COVERS_REFERER_DYNAMIC_RULE_ID,
  COVERS_REFERER_HEADER_VALUE,
  COVERS_REFERER_URL_FILTER,
  installCoversRefererDNR,
} from './dnrRules';

describe('buildCoversRefererDynamicRule', () => {
  it('matches static ruleset intent with urlFilter and image type', () => {
    const rule = buildCoversRefererDynamicRule();
    expect(rule.id).toBe(COVERS_REFERER_DYNAMIC_RULE_ID);
    expect(rule.priority).toBe(1);
    expect(rule.action.type).toBe('modifyHeaders');
    expect(rule.action.requestHeaders).toEqual([
      { header: 'referer', operation: 'set', value: COVERS_REFERER_HEADER_VALUE },
    ]);
    expect(rule.condition.urlFilter).toBe(COVERS_REFERER_URL_FILTER);
    expect(rule.condition.resourceTypes).toEqual(['image']);
    expect((rule.condition as { regexFilter?: string }).regexFilter).toBeUndefined();
  });
});

describe('installCoversRefererDNR', () => {
  const originalChrome = (globalThis as { chrome?: unknown }).chrome;
  let updateDynamicRules: ReturnType<typeof vi.fn>;
  let lastError: { message?: string } | undefined;

  beforeEach(() => {
    lastError = undefined;
    updateDynamicRules = vi.fn(
      (
        _options: unknown,
        callback?: () => void,
      ) => {
        if (callback) callback();
      },
    );

    (globalThis as { chrome: unknown }).chrome = {
      runtime: {
        get lastError() {
          return lastError;
        },
      },
      declarativeNetRequest: {
        updateDynamicRules,
      },
    };
  });

  afterEach(() => {
    if (originalChrome === undefined) {
      delete (globalThis as { chrome?: unknown }).chrome;
    } else {
      (globalThis as { chrome: unknown }).chrome = originalChrome;
    }
    vi.restoreAllMocks();
  });

  it('updates dynamic rule 20001 with urlFilter covers referer', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    installCoversRefererDNR();

    expect(updateDynamicRules).toHaveBeenCalledTimes(1);
    const [options] = updateDynamicRules.mock.calls[0] as [
      {
        removeRuleIds: number[];
        addRules: chrome.declarativeNetRequest.Rule[];
      },
    ];
    expect(options.removeRuleIds).toEqual([COVERS_REFERER_DYNAMIC_RULE_ID]);
    expect(options.addRules).toHaveLength(1);
    expect(options.addRules[0]).toMatchObject({
      id: COVERS_REFERER_DYNAMIC_RULE_ID,
      condition: { urlFilter: COVERS_REFERER_URL_FILTER, resourceTypes: ['image'] },
    });
    expect(info).toHaveBeenCalledWith(
      '[Background] DNR dynamic covers referer rule installed',
      expect.objectContaining({ ruleId: COVERS_REFERER_DYNAMIC_RULE_ID }),
    );
  });

  it('logs warn when runtime.lastError is set after update', () => {
    lastError = { message: 'Ruleset missing' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    installCoversRefererDNR();
    expect(updateDynamicRules).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      '[Background] Failed to install DNR dynamic covers referer rule:',
      'Ruleset missing',
    );
  });

  it('no-throws and warns when declarativeNetRequest is missing', () => {
    (globalThis as { chrome: unknown }).chrome = {
      runtime: {},
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => installCoversRefererDNR()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('declarativeNetRequest unavailable'),
    );
  });
});

/**
 * @file dnrRules.ts
 * @description 封面图 referer DNR：静态 ruleset 为主，动态规则冷启动幂等加固
 * @module apps/background
 *
 * 静态源：src/rules/covers_referer.json（manifest declarative_net_request）
 * 动态 id 20001 与静态 id 1 并存，避免 Firefox 等引擎在仅动态规则时重启后失效。
 * 条件统一用 urlFilter（||jdbstatic.com/covers/），不依赖 regexFilter。
 */

import { ensureChromeNamespace, getExtensionApi } from '../../platform/browser/extensionApi';

/** 动态加固规则 id（勿与静态 ruleset id 冲突） */
export const COVERS_REFERER_DYNAMIC_RULE_ID = 20001;

/** 与静态 ruleset 对齐的 urlFilter */
export const COVERS_REFERER_URL_FILTER = '||jdbstatic.com/covers/';

export const COVERS_REFERER_HEADER_VALUE = 'https://javdb.com/';

/** 构建与静态 ruleset 等价的动态规则（供安装与单测） */
export function buildCoversRefererDynamicRule(
  ruleId: number = COVERS_REFERER_DYNAMIC_RULE_ID,
): chrome.declarativeNetRequest.Rule {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
      requestHeaders: [
        {
          header: 'referer',
          operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
          value: COVERS_REFERER_HEADER_VALUE,
        },
      ],
    },
    condition: {
      urlFilter: COVERS_REFERER_URL_FILTER,
      resourceTypes: ['image' as chrome.declarativeNetRequest.ResourceType],
    },
  };
}

/**
 * 幂等安装封面 referer 动态规则（冷启动仍调用）。
 * 静态 ruleset 为主要路径；动态规则作引擎兼容与重启后加固。
 */
export function installCoversRefererDNR(): void {
  try {
    ensureChromeNamespace();
    const api = getExtensionApi();
    const dnr = api?.declarativeNetRequest;
    if (!dnr?.updateDynamicRules) {
      try {
        console.warn('[Background] declarativeNetRequest unavailable; covers referer relies on static ruleset if declared');
      } catch {
        // ignore
      }
      return;
    }

    const ruleId = COVERS_REFERER_DYNAMIC_RULE_ID;
    const rule = buildCoversRefererDynamicRule(ruleId);

    dnr.updateDynamicRules(
      {
        removeRuleIds: [ruleId],
        addRules: [rule],
      },
      () => {
        const lastError = api?.runtime?.lastError ?? getExtensionApi()?.runtime?.lastError;
        if (lastError?.message) {
          try {
            console.warn('[Background] Failed to install DNR dynamic covers referer rule:', lastError.message);
          } catch {
            // ignore
          }
          return;
        }
        try {
          console.info('[Background] DNR dynamic covers referer rule installed', {
            ruleId,
            urlFilter: COVERS_REFERER_URL_FILTER,
          });
        } catch {
          // ignore
        }
      },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    try {
      console.warn('[Background] Failed to install DNR rule:', message);
    } catch {
      // ignore
    }
  }
}

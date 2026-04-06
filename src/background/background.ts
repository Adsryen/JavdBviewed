// src/background/background.ts
// 背景入口：装配与注册各模块

// 确保 Service Worker 上下文已准备好
if (typeof self === 'undefined' || !(self as any).registration) {
  console.warn('[Background] Service Worker context not ready, waiting...');
}

// 先导入并安装 consoleProxy，确保后续所有日志都能被正确格式化
import { installConsoleProxyWithSettings } from './consoleConfig';
installConsoleProxyWithSettings();

// 然后再导入其他模块
import { installDrive115V2Proxy } from './drive115Proxy';
import { registerWebDAVRouter } from './webdav';
import { registerDbMessageRouter } from './dbRouter';
import { registerMiscRouter } from './miscHandlers';
import { ensureMigrationsStart } from './migrations';
import { newWorksScheduler } from '../services/newWorks';
import { registerNetProxyRouter } from './netProxy';
import { registerMonthlyAlarm, handleAlarm, compensateOnStartup, INSIGHTS_ALARM } from './scheduler';
import { getSettings, saveSettings } from '../utils/storage';

// 启动期安装/初始化
installDrive115V2Proxy();
ensureMigrationsStart();

/**
 * 动态注册内容脚本到备用域名
 * 这样当用户添加新的备用线路时，不需要重新编译扩展
 * @param showNotification 是否显示通知（用户手动添加时显示）
 */
// 保存线路管理的 tab 监听器
let routesTabListener: ((tabId: number, changeInfo: any, tab: chrome.tabs.Tab) => void) | null = null;

export async function registerDynamicContentScripts(showNotification: boolean = false): Promise<void> {
  try {
    const settings = await getSettings();
    const routes = settings?.routes;

    // 收集所有需要注入的 URL 前缀（用于前缀匹配）
    const urlPrefixes: string[] = [];
    const prefixSet = new Set<string>();

    if (routes?.javdb) {
      [routes.javdb.primary, ...(routes.javdb.alternatives?.filter((a: any) => a.enabled && a.url).map((a: any) => a.url) || [])]
        .forEach((u: string) => {
          try {
            const { origin } = new URL(u);
            prefixSet.add(origin + '/');
          } catch {}
        });
    }
    if (routes?.javbus) {
      [routes.javbus.primary, ...(routes.javbus.alternatives?.filter((a: any) => a.enabled && a.url).map((a: any) => a.url) || [])]
        .forEach((u: string) => {
          try {
            const { origin } = new URL(u);
            prefixSet.add(origin + '/');
          } catch {}
        });
    }

    urlPrefixes.push(...Array.from(prefixSet));

    // 移除旧监听器
    if (routesTabListener) {
      chrome.tabs.onUpdated.removeListener(routesTabListener);
      routesTabListener = null;
    }

    if (urlPrefixes.length === 0) {
      console.debug('[Background] No route domains to watch');
      return;
    }

    // 获取 manifest 中主 content script 的实际文件名
    const manifest = chrome.runtime.getManifest();
    const mainScript = manifest.content_scripts?.find(
      (cs: any) => cs.js?.some((j: string) => j.includes('index.ts-loader'))
    );
    const jsFiles: string[] = mainScript?.js || [];
    const cssFiles: string[] = mainScript?.css || [];

    if (jsFiles.length === 0) {
      console.warn('[Background] 未找到主 content script JS 文件');
      return;
    }

    routesTabListener = (tabId, changeInfo, tab) => {
      if (changeInfo.status !== 'complete' || !tab.url) return;
      const tabUrl = tab.url;
      const matched = urlPrefixes.some(prefix => tabUrl.startsWith(prefix));
      if (!matched) return;

      if (cssFiles.length > 0) {
        chrome.scripting.insertCSS({ target: { tabId }, files: cssFiles }).catch(() => {});
      }

      chrome.scripting.executeScript({
        target: { tabId },
        func: () => !!(window as any).__javdbExtensionInjected
      }).then(results => {
        if (results?.[0]?.result) return;
        chrome.scripting.executeScript({ target: { tabId }, files: jsFiles })
          .then(() => console.info(`[Background] 线路 content script 已注入: ${tabUrl}`))
          .catch((e) => console.warn(`[Background] 线路 content script 注入失败: ${e?.message || e}`));
      }).catch(() => {
        chrome.scripting.executeScript({ target: { tabId }, files: jsFiles }).catch(() => {});
      });
    };

    chrome.tabs.onUpdated.addListener(routesTabListener);
    console.info('[Background] 线路 tab 监听器已设置，前缀:', urlPrefixes);

    if (showNotification && urlPrefixes.length > 0) {
      try {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/favicons/light/favicon-128x128.png',
          title: 'Jav 助手 - 线路已更新',
          message: `已为 ${urlPrefixes.length} 个域名启用扩展功能，请刷新页面使用`,
          priority: 1
        });
      } catch {}
    }
  } catch (e: any) {
    console.warn('[Background] Error in registerDynamicContentScripts:', e?.message || e);
  }
}

// 启动时注册动态内容脚本
registerDynamicContentScripts();

// 启动时注册 Emby 动态内容脚本
(async () => {
  try {
    const settings = await getSettings();
    if (settings?.emby?.enabled) {
      const { registerEmbyDynamicScripts } = await import('./miscHandlers');
      await registerEmbyDynamicScripts(settings.emby);
    }
  } catch (e: any) {
    console.warn('[Background] 启动时注册 Emby 脚本失败:', e?.message || e);
  }
})();

/**
 * 自动更新线路配置
 * 从 GitHub 仓库获取最新的线路配置
 */
async function autoUpdateRoutes(): Promise<void> {
  try {
    const { RouteManager } = await import('../utils/routeManager');
    const routeManager = RouteManager.getInstance();
    
    // 检查并更新线路配置
    const updated = await routeManager.checkAndUpdateRoutes(false);
    
    if (updated) {
      console.info('[Background] 线路配置已自动更新');
      // 重新注册动态内容脚本（新线路可能需要新的域名）
      await registerDynamicContentScripts();
    }
  } catch (e: any) {
    console.warn('[Background] 自动更新线路配置失败:', e?.message || e);
  }
}

// 启动时检查更新
autoUpdateRoutes();

// 安装 DNR 规则：为 jdbstatic 封面请求补充 Referer
function installCoversRefererDNR(): void {
  try {
    const ruleId = 20001;
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId],
      addRules: [
        {
          id: ruleId,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              { header: 'referer', operation: 'set', value: 'https://javdb.com/' }
            ],
          },
          condition: {
            // 仅匹配 jdbstatic 的封面资源
            regexFilter: '^https?:\\/\\/([a-z0-9-]+\\.)?jdbstatic\\.com\\/covers\\/.*',
            resourceTypes: ['image']
          }
        }
      ]
    }, () => {
      try { console.info('[Background] DNR rule for covers referer installed'); } catch {}
    });
  } catch (e: any) {
    try { console.warn('[Background] Failed to install DNR rule:', e?.message || e); } catch {}
  }
}

// 注册所有消息路由
registerWebDAVRouter();
registerDbMessageRouter();
registerMiscRouter();
registerNetProxyRouter();
// 仅当用户开启“自动月报”时才注册闹钟
try {
  (async () => {
    try {
      const settings = await getSettings();
      const ins = settings?.insights || {};
      if (ins.autoMonthlyEnabled) {
        const minute = Number(ins.autoMonthlyMinuteOfDay ?? 10);
        registerMonthlyAlarm({ enabled: true, minuteOfDay: Number.isFinite(minute) ? minute : 10 });
      } else {
        try { chrome.alarms?.clear?.(INSIGHTS_ALARM); } catch {}
      }
    } catch {}
  })();
} catch {}

// 安装封面 Referer 规则
installCoversRefererDNR();

// 启动日志（通过 consoleProxy 持久化到 IDB）
try {
  console.info('[Background] Service Worker ready', { ts: new Date().toISOString() });
} catch {}

// 浏览器启动时：仅当用户开启“自动补偿”时尝试补偿
try {
  chrome.runtime.onStartup.addListener(async () => {
    try {
      await newWorksScheduler.initialize();
      try {
        const settings = await getSettings();
        const ins = settings?.insights || {};
        if (ins.autoCompensateOnStartupEnabled) {
          compensateOnStartup();
        }
      } catch {}
    } catch (e: any) {
      console.warn('[Background] Failed to initialize new works scheduler:', e?.message || e);
    }
  });
} catch {}
// ── 115 用户信息后台自动刷新 ──────────────────────────────────────────────────

const DRIVE115_USER_REFRESH_ALARM = 'drive115.daily_user_refresh';

/**
 * 向所有打开的 dashboard 页面广播消息，触发 115 用户信息 UI 刷新
 */
async function broadcastDrive115RefreshUserInfo(): Promise<void> {
  try {
    const extUrl = chrome.runtime.getURL('');
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && tab.url.startsWith(extUrl)) {
        chrome.tabs.sendMessage(tab.id, { type: 'drive115.refresh_user_info' }).catch(() => {});
      }
    }
  } catch {}
}

/**
 * 后台执行 115 用户信息刷新（刷新 token + 拉取用户信息并持久化）
 * 仅在 refresh_token 有效时执行
 */
async function backgroundRefreshDrive115UserInfo(): Promise<void> {
  try {
    const settings = await getSettings();
    const drv = (settings as any)?.drive115 || {};
    const enabled: boolean = !!drv.enabled && !!drv.enableV2;
    const rtStatus: string = drv.v2RefreshTokenStatus || 'unknown';
    const refreshToken: string = (drv.v2RefreshToken || '').trim();

    if (!enabled || !refreshToken) return;
    if (rtStatus === 'invalid' || rtStatus === 'expired') return;

    console.info('[Background] 115 后台自动刷新用户信息开始');

    const { getDrive115V2Service } = await import('../services/drive115v2');
    const svc = getDrive115V2Service();

    const result = await svc.fetchUserInfoAuto({ forceAutoRefresh: true });
    if (!result.success || !result.data) {
      console.warn('[Background] 115 后台刷新用户信息失败:', result.message);
      return;
    }

    const latest = await getSettings();
    const ns: any = { ...(latest || {}) };
    ns.drive115 = {
      ...((latest as any)?.drive115 || {}),
      v2UserInfo: result.data,
      v2UserInfoUpdatedAt: Date.now(),
      v2UserInfoExpired: false,
    };
    await saveSettings(ns);

    console.info('[Background] 115 后台刷新用户信息成功，已持久化');
    await broadcastDrive115RefreshUserInfo();
  } catch (e: any) {
    console.warn('[Background] 115 后台刷新用户信息异常:', e?.message || e);
  }
}

/**
 * 注册每日定时刷新 alarm（每 24 小时触发一次）
 */
function registerDrive115DailyAlarm(): void {
  try {
    chrome.alarms.get(DRIVE115_USER_REFRESH_ALARM, (existing) => {
      if (!existing) {
        chrome.alarms.create(DRIVE115_USER_REFRESH_ALARM, {
          delayInMinutes: 60,
          periodInMinutes: 1440,
        });
        console.info('[Background] 115 每日用户信息刷新 alarm 已注册');
      }
    });
  } catch {}
}

// 启动时按需注册每日刷新 alarm
try {
  (async () => {
    const settings = await getSettings();
    const drv = (settings as any)?.drive115 || {};
    if (drv.enabled && drv.enableV2 && drv.v2RefreshToken) {
      registerDrive115DailyAlarm();
    }
  })();
} catch {}

// ─────────────────────────────────────────────────────────────────────────────

// 监听 Alarm 回调
try {
  chrome.alarms.onAlarm.addListener((alarm) => {
    try {
      if (alarm?.name === DRIVE115_USER_REFRESH_ALARM) {
        backgroundRefreshDrive115UserInfo();
        return;
      }
      handleAlarm(alarm?.name || '');
    } catch {}
  });
} catch {}

// 监听设置变化：动态应用"自动月报"开关 + drive115 token 状态变化
try {
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes['settings']) {
      try {
        const settings = await getSettings();
        const ins = settings?.insights || {};
        if (ins.autoMonthlyEnabled) {
          const minute = Number(ins.autoMonthlyMinuteOfDay ?? 10);
          registerMonthlyAlarm({ enabled: true, minuteOfDay: Number.isFinite(minute) ? minute : 10 });
        } else {
          try { chrome.alarms?.clear?.(INSIGHTS_ALARM); } catch {}
        }

        // 如果线路配置发生变化，重新注册动态内容脚本
        const oldSettings = changes['settings']?.oldValue as any;
        const newSettings = changes['settings']?.newValue as any;
        const oldRoutes = oldSettings?.routes;
        const newRoutes = newSettings?.routes;
        if (JSON.stringify(oldRoutes) !== JSON.stringify(newRoutes)) {
          console.info('[Background] Routes config changed, re-registering dynamic content scripts');
          await registerDynamicContentScripts(true);
        }

        // 检测 refresh_token 状态：从非 valid 变为 valid 时立即刷新用户信息
        const oldDrv = oldSettings?.drive115 || {};
        const newDrv = newSettings?.drive115 || {};
        const wasValid = oldDrv.v2RefreshTokenStatus === 'valid';
        const isNowValid = newDrv.v2RefreshTokenStatus === 'valid';
        if (!wasValid && isNowValid) {
          console.info('[Background] 115 refresh_token 变为有效，立即刷新用户信息');
          setTimeout(() => { backgroundRefreshDrive115UserInfo(); }, 1500);
        }

        // 根据 drive115 启用状态动态管理每日 alarm
        const newEnabled = !!newDrv.enabled && !!newDrv.enableV2 && !!newDrv.v2RefreshToken;
        const oldEnabled = !!oldDrv.enabled && !!oldDrv.enableV2 && !!oldDrv.v2RefreshToken;
        if (newEnabled && !oldEnabled) {
          registerDrive115DailyAlarm();
        } else if (!newEnabled && oldEnabled) {
          try { chrome.alarms?.clear?.(DRIVE115_USER_REFRESH_ALARM); } catch {}
        }
      } catch {}
    }
  });
} catch {}


// 全局错误处理 - 捕获未处理的 Promise 拒绝（仅 DEBUG 模式输出）
self.addEventListener('unhandledrejection', (event) => {
  console.debug('[Background] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // 阻止错误在控制台显示
});

// 全局错误处理 - 捕获未捕获的错误（仅 DEBUG 模式输出）
self.addEventListener('error', (event) => {
  console.debug('[Background] Uncaught error:', event.error || event.message);
  event.preventDefault(); // 阻止错误在控制台显示
});
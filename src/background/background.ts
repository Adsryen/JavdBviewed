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
import { getSettings } from '../utils/storage';

// 启动期安装/初始化
installDrive115V2Proxy();
ensureMigrationsStart();

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

// 监听 Alarm 回调
try {
  chrome.alarms.onAlarm.addListener((alarm) => {
    try { handleAlarm(alarm?.name || ''); } catch {}
  });
} catch {}

// 监听设置变化：动态应用“自动月报”开关
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
      } catch {}
    }
  });
} catch {}


// 全局错误处理 - 捕获未处理的 Promise 拒绝
self.addEventListener('unhandledrejection', (event) => {
  console.warn('[Background] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // 阻止错误在控制台显示
});

// 全局错误处理 - 捕获未捕获的错误
self.addEventListener('error', (event) => {
  console.warn('[Background] Uncaught error:', event.error || event.message);
  event.preventDefault(); // 阻止错误在控制台显示
});

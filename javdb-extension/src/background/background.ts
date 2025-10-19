// src/background/background.ts
// 背景入口：装配与注册各模块

import { installDrive115V2Proxy } from './drive115Proxy';
import { installConsoleProxyWithSettings } from './consoleConfig';
import { registerWebDAVRouter } from './webdav';
import { registerDbMessageRouter } from './dbRouter';
import { registerMiscRouter } from './miscHandlers';
import { ensureMigrationsStart } from './migrations';
import { newWorksScheduler } from '../services/newWorks';
import { registerNetProxyRouter } from './netProxy';
import { registerMonthlyAlarm, handleAlarm, compensateOnStartup } from './scheduler';

// 启动期安装/初始化
installDrive115V2Proxy();
installConsoleProxyWithSettings();
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
try { registerMonthlyAlarm(); } catch {}

// 安装封面 Referer 规则
installCoversRefererDNR();

// 启动日志（通过 consoleProxy 持久化到 IDB）
try {
  console.info('[Background] Service Worker ready', { ts: new Date().toISOString() });
} catch {}

// 浏览器启动时初始化新作品调度器
try {
  chrome.runtime.onStartup.addListener(async () => {
    try {
      await newWorksScheduler.initialize();
      try { compensateOnStartup(); } catch {}
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


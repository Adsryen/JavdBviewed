// src/apps/background/miscMessageRouter.ts
// 抽离杂项 handlers 与消息路由

import { getValue, setValue } from '../../utils/storage';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../utils/config';
import { refreshRecordById } from '../../features/records/refresh';
import { viewedPut as idbViewedPut, logsAdd as idbLogsAdd, logsQuery as idbLogsQuery } from '../../platform/storage/indexedDb';
import { handleNewWorksRuntimeMessage } from '../../features/newWorks/backgroundMessages';
import {
  handleCheckVideoUrl,
  handleFetchAVPreviewPreview,
  handleFetchJavDBPreview,
  handleFetchJavSpylPreview,
} from '../../features/previews/backgroundHandlers';
import { registerEmbyDynamicScripts } from './embyDynamicContentScripts';
import {
  handleClearTaskDetails,
  handleGetAggregatedMetrics,
  handleGetTaskDetails,
  handleSaveOrchestratorMetrics,
  handleSaveTaskDetail,
  handleStopAllTasks,
} from './orchestratorMetrics';
import { requestScheduler } from '../../platform/network/requestScheduler';
import { WEBDAV_SYNC_ALARM } from './scheduler';
import type { UserProfile } from '../../types';
import { fetchJavbusAjaxViaTab } from '../../platform/browser/javbusTabFetch';

export { registerEmbyDynamicScripts };

const consoleMap: Record<'INFO' | 'WARN' | 'ERROR' | 'DEBUG', (message?: any, ...optionalParams: any[]) => void> = {
  INFO: console.info,
  WARN: console.warn,
  ERROR: console.error,
  DEBUG: console.debug,
};

async function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  const logFunction = consoleMap[level] || console.log;
  if (data !== undefined) logFunction(message, data); else logFunction(message);
  try {
    const entry = { timestamp: new Date().toISOString(), level, message, data } as any;
    await idbLogsAdd(entry);
  } catch (e) {
    console.error('[Background] Failed to write log to IDB:', e);
  }
}

export function registerMiscRouter(): void {
  try {
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      switch (message.type) {
        case 'ping':
        case 'ping-background':
          sendResponse({ success: true, message: 'pong' });
          return false;
        case 'fetch-user-profile': {
          // 从 JavDB 抓取用户资料与服务器统计，并写入本地缓存
          // 注意：异步处理需 return true 保持消息通道
          fetchUserProfileFromJavDB()
            .then((profile) => sendResponse({ success: true, profile }))
            .catch((error: any) => sendResponse({ success: false, error: error?.message || '获取账号信息失败' }));
          return true;
        }
        case 'get-logs': {
          const payload = message?.payload || {};
          idbLogsQuery({
            level: payload.level,
            minLevel: payload.minLevel,
            fromMs: payload.fromMs,
            toMs: payload.toMs,
            offset: payload.offset ?? 0,
            limit: payload.limit ?? 100,
            order: payload.order ?? 'desc',
            query: payload.query ?? '',
            hasDataOnly: payload.hasDataOnly ?? false,
            source: payload.source ?? 'ALL',
          }).then(({ items, total }) => {
            // 兼容旧调用：返回 logs 字段
            sendResponse({ success: true, items, total, logs: items });
          }).catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'log-message': {
          const { payload } = message;
          if (payload && payload.level && payload.message) {
            log(payload.level, payload.message, payload.data)
              .then(() => sendResponse({ success: true }))
              .catch((error) => sendResponse({ success: false, error: error.message }));
          } else {
            sendResponse({ success: false, error: 'Invalid log message payload' });
          }
          return true;
        }
        case 'clear-all-records':
          setValue(STORAGE_KEYS.VIEWED_RECORDS, {})
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        case 'refresh-record': {
          const { videoId } = message;
          if (!videoId) { sendResponse({ success: false, error: 'No videoId provided' }); return false; }
          refreshRecordById(videoId)
            .then((updatedRecord) => sendResponse({ success: true, record: updatedRecord }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'OPEN_TAB_BACKGROUND': {
          handleOpenTabBackground(message, sendResponse);
          return true;
        }
        case 'fetch-external-data':
          handleExternalDataFetch(message, sendResponse);
          return true;
        case 'FETCH_JAVBUS_AJAX_VIA_TAB':
          handleFetchJavbusAjaxViaTab(message, sendResponse);
          return true;
        case 'CHECK_VIDEO_URL':
          handleCheckVideoUrl(message, sendResponse);
          return true;
        case 'FETCH_JAVDB_PREVIEW':
          handleFetchJavDBPreview(message, sendResponse);
          return true;
        case 'FETCH_JAVSPYL_PREVIEW':
          handleFetchJavSpylPreview(message, sendResponse);
          return true;
        case 'FETCH_AVPREVIEW_PREVIEW':
          handleFetchAVPreviewPreview(message, sendResponse);
          return true;
        case 'FETCH_EXTERNAL_COVER':
          handleFetchExternalCover(message, sendResponse);
          return true;
        case 'DRIVE115_PUSH':
          handleDrive115Push(message, sendResponse);
          return true;
        case 'DRIVE115_VERIFY':
          handleDrive115Verify(message, sendResponse);
          return true;
        case 'DRIVE115_HEARTBEAT':
          sendResponse({ type: 'DRIVE115_HEARTBEAT_RESPONSE', success: true });
          return false;
        case 'UPDATE_WATCHED_STATUS': {
          handleUpdateWatchedStatus(message, sendResponse);
          return true;
        }
        case 'setup-alarms':
          setupAlarms().then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'new-works-manual-check':
        case 'new-works-check-single-actor':
        case 'new-works-manual-cancel':
        case 'new-works-scheduler-restart':
        case 'new-works-scheduler-status':
          return handleNewWorksRuntimeMessage(message, sendResponse);
        case 'privacy-lock':
          // 处理手动锁定请求
          handlePrivacyLock(sendResponse);
          return true;
        case 'orchestrator:saveMetrics': {
          sendResponse({ success: true, queued: true });
          void handleSaveOrchestratorMetrics(message.metrics)
            .catch((error) => {
              console.warn('[Background] Failed to save orchestrator metrics:', error);
            });
          return false;
        }
        case 'orchestrator:getAggregatedMetrics': {
          // 获取聚合的性能指标
          handleGetAggregatedMetrics()
            .then((metrics) => sendResponse({ success: true, metrics }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:saveTaskDetail': {
          // 保存任务详细信息
          handleSaveTaskDetail(message.taskDetail, _sender)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:getTaskDetails': {
          // 获取任务详细信息
          handleGetTaskDetails(message.options)
            .then((details) => sendResponse({ success: true, details }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:clearTaskDetails': {
          // 清空任务详细信息
          handleClearTaskDetails()
            .then((result) => sendResponse(result))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        case 'orchestrator:stopAllTasks': {
          handleStopAllTasks()
            .then((result) => sendResponse(result))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        }
        default:
          return false;
      }
    });
    // 初始化调度器配置，并监听 settings 变化
    applySchedulerConfigFromSettings().catch(() => {});
    setupAlarms().catch(() => {});
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes['settings']) {
          applySchedulerConfigFromSettings().catch(() => {});
          setupAlarms().catch(() => {});
          // 如果 Emby 设置发生变化，重新注册动态内容脚本
          const newSettings = changes['settings'].newValue as any;
          const oldSettings = changes['settings'].oldValue as any;
          const embyChanged = JSON.stringify(newSettings?.emby) !== JSON.stringify(oldSettings?.emby);
          if (embyChanged) {
            registerEmbyDynamicScripts(newSettings?.emby).catch(() => {});
          }
        }
      });
    } catch {}
  } catch {}
}

// ============== Helpers copied from previous background ==============

async function handleExternalDataFetch(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const url = message?.url;
    const options = (message?.options || {}) as any;
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return;
    }
    const responseType = options.responseType || 'text';

    // 超时控制
    const controller = new AbortController();
    const timeoutMs = typeof options.timeout === 'number' ? options.timeout : 10000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const reqInit: RequestInit = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal,
      ...(typeof options.referrer === 'string' ? { referrer: options.referrer } : {}),
      // credentials / mode 等保持默认
    };

    const response = await requestScheduler.enqueue(url, reqInit);
    let data: any;
    if (responseType === 'json') data = await response.json().catch(() => null);
    else if (responseType === 'blob') data = await response.blob();
    else data = await response.text();
    const headersObj: Record<string, string> = {};
    try { response.headers.forEach((v, k) => { headersObj[k] = v; }); } catch {}
    clearTimeout(timer);
    sendResponse({ success: true, data, status: response.status, headers: headersObj });
  } catch (error: any) {
    console.error('[Background] Failed to fetch external data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleFetchJavbusAjaxViaTab(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const pageUrl = String(message?.pageUrl || '');
    const timeoutMs = typeof message?.timeoutMs === 'number' ? message.timeoutMs : 15000;
    if (!/^https:\/\/(?:www\.)?javbus\.com\/[^/?#]+/i.test(pageUrl)) {
      sendResponse({ success: false, error: 'Invalid JAVBUS page URL' });
      return;
    }

    const result = await fetchJavbusAjaxViaTab(pageUrl, timeoutMs);
    sendResponse({ success: result.success, data: result, error: result.error });
  } catch (error: any) {
    console.error('[Background] JAVBUS tab ajax fetch failed:', error);
    sendResponse({ success: false, error: error?.message || String(error) });
  }
}

/**
 * 根据 settings.magnetSearch.concurrency 动态应用调度器配置
 */
async function applySchedulerConfigFromSettings(): Promise<void> {
  try {
    const settings = await getValue<any>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS as any);
    const cc = settings?.magnetSearch?.concurrency || {};
    requestScheduler.updateConfig({
      globalMaxConcurrent: typeof cc.bgGlobalMaxConcurrent === 'number' ? cc.bgGlobalMaxConcurrent : 4,
      perHostMaxConcurrent: typeof cc.bgPerHostMaxConcurrent === 'number' ? cc.bgPerHostMaxConcurrent : 1,
      perHostRateLimitPerMin: typeof cc.bgPerHostRateLimitPerMin === 'number' ? cc.bgPerHostRateLimitPerMin : 12,
    });
    console.info('[Background] RequestScheduler config applied:', {
      global: cc.bgGlobalMaxConcurrent, perHost: cc.bgPerHostMaxConcurrent, rate: cc.bgPerHostRateLimitPerMin
    });
  } catch (e) {
    console.warn('[Background] applySchedulerConfigFromSettings failed:', e);
  }
}

async function handleOpenTabBackground(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { url } = message;
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return;
    }
    const tab = await chrome.tabs.create({ url, active: false });
    sendResponse({ success: true, tabId: tab.id });
  } catch (error: any) {
    console.error('[Background] Failed to open background tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleFetchExternalCover(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { code } = message || {};
    if (!code) {
      sendResponse({ success: false, error: 'No code provided' });
      return;
    }

    // 尝试从 BlogJav 获取高质量封面
    const searchUrl = `https://blogjav.net/search?q=${encodeURIComponent(code)}`;
    const res = await fetch(searchUrl);

    if (!res.ok) {
      sendResponse({ success: false, error: `Failed to fetch BlogJav: ${res.status}` });
      return;
    }

    const html = await res.text();

    // 解析HTML查找封面图片
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 查找搜索结果中的图片
    const resultItems = doc.querySelectorAll('.post-item, .search-result-item, .video-item');

    for (const item of resultItems) {
      const titleElement = item.querySelector('.title, .post-title, h2, h3');
      const title = titleElement?.textContent?.trim().toUpperCase() || '';

      // 检查标题是否包含视频代码
      if (title.includes(code.toUpperCase().replace(/[-\s]/g, ''))) {
        const img = item.querySelector('img');
        const imgSrc = img?.getAttribute('src') || img?.getAttribute('data-src');

        if (imgSrc) {
          // 解析相对URL
          let imageUrl = imgSrc;
          if (imgSrc.startsWith('//')) {
            imageUrl = 'https:' + imgSrc;
          } else if (imgSrc.startsWith('/')) {
            imageUrl = 'https://blogjav.net' + imgSrc;
          }

          sendResponse({ success: true, imageUrl });
          return;
        }
      }
    }

    sendResponse({ success: false, error: 'Cover image not found' });
  } catch (error: any) {
    console.error('[Background] Failed to fetch external cover:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDrive115Push(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
    if (!tabs.length) {
      sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: '未找到 115.com 标签页' });
      return;
    }
    const tabId = tabs[0].id;
    if (!tabId) {
      sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: '标签页ID无效' });
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Background] DRIVE115_PUSH sendMessage failed:', { tabId, error: chrome.runtime.lastError.message });
        sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response || { type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: true });
      }
    });
  } catch (error: any) {
    console.error('[Background] Failed to handle DRIVE115_PUSH:', error);
    sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: error.message });
  }
}

async function handleDrive115Verify(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
    if (!tabs.length) {
      sendResponse({ success: false, error: '未找到 115.com 标签页' });
      return;
    }
    const tabId = tabs[0].id;
    if (!tabId) {
      sendResponse({ success: false, error: '标签页ID无效' });
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Background] DRIVE115_VERIFY sendMessage failed:', { tabId, error: chrome.runtime.lastError.message });
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response ?? { success: true });
      }
    });
  } catch (error: any) {
    console.error('[Background] Failed to handle DRIVE115_VERIFY:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateWatchedStatus(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const videoId = message?.videoId;
    if (!videoId) { sendResponse({ success: false, error: 'No videoId provided' }); return; }
    const record: any = { id: videoId, title: '', status: 'viewed', tags: [], createdAt: Date.now(), updatedAt: Date.now() };
    await idbViewedPut(record);
    sendResponse({ success: true, record });
  } catch (error: any) {
    console.error('[Background] Failed to update watched status:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function fetchUserProfileFromJavDB(): Promise<any> {
  try {
    const baseProfile = await getValue<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null).catch(() => null);


    // 使用统一调度器发起请求（自动限速/并发控制）
    const fetchHtml = async (url: string): Promise<{ ok: boolean; html?: string; finalUrl?: string; status?: number }> => {
      try {
        const res = await requestScheduler.enqueue(url, {
          method: 'GET',
          // 包含站点 Cookie 以访问登录页数据
          credentials: 'include' as any,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Referer': 'https://javdb.com/',
            'Cache-Control': 'no-cache',
          },
        } as RequestInit);
        const html = await res.text();
        return { ok: res.ok, html, finalUrl: (res as any).url, status: res.status };
      } catch {
        return { ok: false };
      }
    };


    // 仅从 /users/profile 页面解析计数（暂停其他来源）
    const parseWantCountFromHtml = (html: string): number | undefined => {
      try {
        // 匹配导航/侧栏：想看(97) 或 想看 (97)
        const m = html.match(/href=["']\/users\/want_watch_videos["'][\s\S]*?想看[\s\S]*?\(([0-9][0-9,\.]*)\)/i);
        if (m && m[1]) {
          const n = Number(String(m[1]).replace(/[\s,\.]/g, ''));
          if (isFinite(n)) return n;
        }
      } catch {}
      return undefined;
    };
    const parseWatchedCountFromHtml = (html: string): number | undefined => {
      try {
        // 匹配导航/侧栏：看過(4166)/看过(4166) 或带空格
        const m = html.match(/href=["']\/users\/watched_videos["'][\s\S]*?(?:看過|看过)[\s\S]*?\(([0-9][0-9,\.]*)\)/i);
        if (m && m[1]) {
          const n = Number(String(m[1]).replace(/[\s,\.]/g, ''));
          if (isFinite(n)) return n;
        }
      } catch {}
      return undefined;
    };


    const profileUrl = 'https://javdb.com/users/profile';
    const profileRes = await fetchHtml(profileUrl);

    // 登录判定：若被重定向到登录页或内容为空，则视为未登录
    const isLoggedIn = !!(
      profileRes.ok && profileRes.html && !((profileRes.finalUrl || '').includes('/sign_in'))
    );

    if (!isLoggedIn) {
      throw new Error('未登录 JavDB');
    }

    // 从 profile 页面解析服务器计数（仅此来源）
    const wantCount = profileRes.ok && profileRes.html ? (parseWantCountFromHtml(profileRes.html) ?? 0) : 0;
    const watchedCount = profileRes.ok && profileRes.html ? (parseWatchedCountFromHtml(profileRes.html) ?? 0) : 0;

    // 额外尝试获取用户详情（邮箱/用户名/类型）
    const tryFetchUserInfoDetail = async (): Promise<{ email?: string; username?: string; userType?: string } | null> => {
      const candidates = [
        'https://javdb.com/users/profile',
      ];
      for (const url of candidates) {
        try {
          const ret = await fetchHtml(url);
          if (ret.ok && ret.html && !((ret.finalUrl || '').includes('/sign_in'))) {
            const html = ret.html;
            // 从个人信息页列表提取（label+文本）
            const emailFromProfile = (html.match(/<span[^>]*class=["']label["'][^>]*>\s*(?:电邮地址|電郵地址|邮箱|電子郵件|电子邮件)\s*:<\/span>\s*([^<\n]+)/i) || [])[1]?.trim();
            const usernameFromProfile = (html.match(/<span[^>]*class=["']label["'][^>]*>\s*(?:用戶名|用户名|使用者名稱|使用者名称)\s*:<\/span>\s*([^<\n]+)/i) || [])[1]?.trim();
            const userTypeFromProfile = (html.match(/<span[^>]*class=["']label["'][^>]*>\s*(?:用戶類型|用户类型|使用者類型|使用者类型)\s*:<\/span>\s*([^<\n]+)/i) || [])[1]?.trim();
            // 从导航菜单提取用户名（例如 <a class="navbar-link" href="/users/profile">amixture</a>）
            const usernameFromAnchor = (html.match(/<a[^>]*href=["']\/users\/profile["'][^>]*>\s*([^<]{1,40})\s*<\/a>/i) || [])[1]?.trim();

            const emailMatch = html.match(/name="user\[email\]"[^>]*value="([^"]*)"/i) || html.match(/id="user_email"[^>]*value="([^"]*)"/i);
            const usernameMatch = html.match(/name="user\[username\]"[^>]*value="([^"]*)"/i) || html.match(/id="user_username"[^>]*value="([^"]*)"/i);
            const email = (emailMatch?.[1]?.trim()) || emailFromProfile;
            const username = (usernameMatch?.[1]?.trim()) || usernameFromProfile || usernameFromAnchor;
            // 严格以“用戶類型/用户类型”标签文本为准，避免因页面其它位置出现 VIP 文案而误判
            const userTypeRaw = (userTypeFromProfile || '').replace(/[，,]/g, '').trim();
            let userType: string | undefined = undefined;
            if (userTypeRaw) {
              if (/vip|premium/i.test(userTypeRaw)) userType = 'VIP';
              else if (/(普通用戶|普通用户|normal|regular)/i.test(userTypeRaw)) userType = '普通用户';
              else if (/(會員|会员)/.test(userTypeRaw)) userType = '会员';
              else userType = userTypeRaw;
            }
            if (email || username || userType) return { email, username, userType };
          }
        } catch {}
      }
      // 兜底：仅使用 profile 页面，暂停其他页面来源
      return null;
    };
    const detail = await tryFetchUserInfoDetail().catch(() => null);

    const now = Date.now();
    const profile = {
      email: (detail?.email ?? baseProfile?.email) || '',
      username: (detail?.username ?? baseProfile?.username) || '',
      userType: (detail?.userType ?? baseProfile?.userType) || '',
      isLoggedIn: true,
      lastUpdated: now,
      serverStats: {
        wantCount,
        watchedCount,
        lastSyncTime: now,
      },
    };

    // 写回缓存（便于内容页或后续快速展示）
    try { await setValue(STORAGE_KEYS.USER_PROFILE, profile); } catch {}
    return profile;
  } catch (e) {
    // 抛出错误，交由消息路由返回失败以便前端提示
    throw e instanceof Error ? e : new Error('获取账号信息失败');
  }
}

/**
 * 处理隐私锁定请求
 */
async function handlePrivacyLock(sendResponse: (response: any) => void): Promise<void> {
  try {
    // 通知所有dashboard页面锁定
    const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('dashboard/dashboard.html') });

    for (const tab of tabs) {
      if (tab.id) {
        try {
          console.log('[Background] Sending privacy-lock-trigger to dashboard tab:', { tabId: tab.id, url: tab.url });
          await chrome.tabs.sendMessage(tab.id, { type: 'privacy-lock-trigger' });
        } catch (error) {
          console.error('Failed to send lock message to tab:', error);
        }
      }
    }

    sendResponse({ success: true });
  } catch (error: any) {
    console.error('[Background] Failed to handle privacy lock:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function setupAlarms(): Promise<void> {
  try {
    if (!('alarms' in chrome) || !chrome.alarms) return;
    const settings = await getValue<any>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS as any);
    const webdav = settings?.webdav || {};
    try { await chrome.alarms.clear(WEBDAV_SYNC_ALARM); } catch {}
    if (!webdav.enabled || !webdav.autoSync) return;
    if (!webdav.url || !webdav.username || !webdav.password) return;
    let interval = Number(webdav.syncInterval ?? 30);
    if (!Number.isFinite(interval)) interval = 30;
    if (interval < 5) interval = 5;
    if (interval > 1440) interval = 1440;
    chrome.alarms.create(WEBDAV_SYNC_ALARM, { delayInMinutes: interval, periodInMinutes: interval });
  } catch {}
}

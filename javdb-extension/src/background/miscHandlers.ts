// src/background/miscHandlers.ts
// 抽离杂项 handlers 与消息路由

import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/config';
import { refreshRecordById } from './sync';
import { viewedPut as idbViewedPut, logsAdd as idbLogsAdd, logsQuery as idbLogsQuery } from './db';
import { newWorksScheduler, newWorksManager, newWorksCollector } from '../services/newWorks';
import { requestScheduler } from './requestScheduler';
import type { UserProfile } from '../types';

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
    console.error('Failed to write log to IDB:', e);
  }
}

export function registerMiscRouter(): void {
  try {
    // 手动检查的取消标记（模块级，保证在多次消息间共享）
    let manualCheckCancel = { cancelled: false };
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse): boolean | void => {
      if (!message || typeof message !== 'object') return false;
      switch (message.type) {
        case 'ping':
        case 'ping-background':
          sendResponse({ success: true, message: 'pong' });
          return true;
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
          if (!videoId) { sendResponse({ success: false, error: 'No videoId provided' }); return true; }
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
        case 'DRIVE115_PUSH':
          handleDrive115Push(message, sendResponse);
          return true;
        case 'DRIVE115_VERIFY':
          handleDrive115Verify(message, sendResponse);
          return true;
        case 'DRIVE115_HEARTBEAT':
          sendResponse({ type: 'DRIVE115_HEARTBEAT_RESPONSE', success: true });
          return true;
        case 'setup-alarms':
          setupAlarms().then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        
        case 'new-works-manual-check':
          (async () => {
            try {
              // 重置取消标记
              manualCheckCancel.cancelled = false;

              const config = await newWorksManager.getGlobalConfig();
              const subs = await newWorksManager.getSubscriptions();
              const active = subs.filter(s => s.enabled);
              const total = active.length;
              let processed = 0;
              let discovered = 0;               // 实际写入的新作品数量
              let identifiedTotal = 0;          // 解析到的原始数量
              let effectiveTotal = 0;           // 过滤（排除番号库等）后的数量
              const errors: string[] = [];

              // 覆盖过滤条件：排除本地番号库中任意状态的记录
              const cfg = {
                ...config,
                filters: {
                  ...config.filters,
                  excludeViewed: true,
                  excludeBrowsed: true,
                  excludeWant: true,
                },
              } as any;

              for (const sub of active) {
                if (manualCheckCancel.cancelled) break;
                try {
                  // 使用带统计的检查
                  const det = await newWorksCollector.checkActorNewWorksDetailed(sub, cfg);
                  identifiedTotal += det.identified;
                  effectiveTotal += det.effective;

                  if (det.works.length > 0) {
                    try { await newWorksManager.addNewWorks(det.works); } catch {}
                  }
                  discovered += det.works.length;
                } catch (e: any) {
                  errors.push(`检查演员 ${sub.actorName} 失败: ${e?.message || String(e)}`);
                } finally {
                  processed++;
                  try {
                    chrome.runtime.sendMessage({
                      type: 'new-works-progress',
                      payload: { processed, total, discovered, identifiedTotal, effectiveTotal, actorId: sub.actorId, actorName: sub.actorName },
                    });
                  } catch {}
                }
                // 按配置的请求间隔小憩（避免过快）
                try {
                  if (manualCheckCancel.cancelled) break;
                  const gap = Math.max(0, Number(cfg.requestInterval || 0)) * 1000;
                  if (gap > 0) await new Promise(r => setTimeout(r, gap));
                } catch {}
              }

              try { await newWorksManager.updateGlobalConfig({ lastGlobalCheck: Date.now() }); } catch {}
              sendResponse({ success: true, result: { discovered, errors, cancelled: manualCheckCancel.cancelled, identifiedTotal, effectiveTotal } });
            } catch (error: any) {
              sendResponse({ success: false, error: error?.message || 'manual check failed' });
            }
          })();
          return true;
        case 'new-works-manual-cancel':
          try {
            manualCheckCancel.cancelled = true;
            sendResponse({ success: true });
          } catch (error: any) {
            sendResponse({ success: false, error: error?.message || 'cancel failed' });
          }
          return true;
        case 'new-works-scheduler-restart':
          newWorksScheduler.restart()
            .then(() => sendResponse({ success: true }))
            .catch((error: any) => sendResponse({ success: false, error: error?.message || 'restart failed' }));
          return true;
        case 'new-works-scheduler-status':
          try {
            const status = newWorksScheduler.getStatus();
            sendResponse({ success: true, status });
          } catch (error: any) {
            sendResponse({ success: false, error: error.message });
          }
          return true;
        default:
          return false;
      }
    });
    // 初始化调度器配置，并监听 settings 变化
    applySchedulerConfigFromSettings().catch(() => {});
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes['settings']) {
          applySchedulerConfigFromSettings().catch(() => {});
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

async function handleCheckVideoUrl(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { url } = message;
    if (!url) { sendResponse({ success: false, error: 'No URL provided' }); return; }
    let available = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      available = response.ok;
      if (available) { sendResponse({ success: true, available: true }); return; }
    } catch {}
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-1023' }, signal: controller.signal });
      clearTimeout(timeoutId);
      available = response.ok || response.status === 206;
      if (available) { sendResponse({ success: true, available: true }); return; }
    } catch {}
    const knownBadDomains = [ 'smovie.caribbeancom.com', 'smovie.1pondo.tv', 'smovie.10musume.com', 'fms.pacopacomama.com' ];
    const isKnownBad = knownBadDomains.some(domain => url.includes(domain));
    available = !isKnownBad && false;
    sendResponse({ success: true, available });
  } catch (error: any) {
    console.error(`[Background] Failed to check video URL ${message.url}:`, error);
    sendResponse({ success: false, available: false });
  }
}

async function handleFetchJavSpylPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { code } = message;
    if (!code) { sendResponse({ success: false, error: 'No code provided' }); return; }
    const response = await fetch('https://v2.javspyl.tk/api/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://javspyl.tk', 'Referer': 'https://javspyl.tk/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      body: JSON.stringify({ ID: code })
    });
    if (!response.ok) { sendResponse({ success: false, error: `API request failed: ${response.status}` }); return; }
    const data = await response.json();
    const videoUrl = data?.info?.url;
    if (!videoUrl) { sendResponse({ success: false, error: 'No video URL found in response' }); return; }
    if (/\.m3u8?$/i.test(videoUrl)) { sendResponse({ success: false, error: 'M3U8 format not supported' }); return; }
    const finalUrl = videoUrl.includes('//') ? videoUrl : `https://${videoUrl}`;
    sendResponse({ success: true, videoUrl: finalUrl });
  } catch (error: any) {
    console.error(`[Background] Failed to fetch JavSpyl preview for ${message.code}:`, error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleFetchAVPreviewPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { code } = message;
    if (!code) { sendResponse({ success: false, error: 'No code provided' }); return; }
    const searchResponse = await fetch(`https://avpreview.com/zh/search?keywords=${code}`);
    if (!searchResponse.ok) { sendResponse({ success: false, error: 'Search request failed' }); return; }
    const searchHtml = await searchResponse.text();
    const parser = new DOMParser();
    const searchDoc = parser.parseFromString(searchHtml, 'text/html');
    const videoBoxes = Array.from(searchDoc.querySelectorAll('.container .videobox')) as Element[];
    const matchedBox = videoBoxes.find(item => {
      const titleElement = item.querySelector('h2 strong');
      return titleElement && titleElement.textContent === code;
    });
    if (!matchedBox) { sendResponse({ success: false, error: 'Video not found in search results' }); return; }
    const detailLink = matchedBox.querySelector('a')?.getAttribute('href');
    if (!detailLink) { sendResponse({ success: false, error: 'No detail link found' }); return; }
    const contentId = detailLink.split('/').pop();
    if (!contentId) { sendResponse({ success: false, error: 'No content ID found' }); return; }
    const apiUrl = new URL('https://avpreview.com/API/v1.0/index.php');
    apiUrl.searchParams.set('system', 'videos');
    apiUrl.searchParams.set('action', 'detail');
    apiUrl.searchParams.set('contentid', contentId);
    apiUrl.searchParams.set('sitecode', 'avpreview');
    apiUrl.searchParams.set('ip', '');
    apiUrl.searchParams.set('token', '');
    const apiResponse = await fetch(apiUrl.toString());
    if (!apiResponse.ok) { sendResponse({ success: false, error: 'API detail request failed' }); return; }
    const apiData = await apiResponse.json();
    let trailerUrl = apiData?.videos?.trailer as string | undefined;
    if (!trailerUrl) { sendResponse({ success: false, error: 'No trailer URL found' }); return; }
    trailerUrl = trailerUrl.replace('/hlsvideo/', '/litevideo/').replace('/playlist.m3u8', '');
    const finalContentId = trailerUrl.split('/').pop();
    const videoUrls = [ `${trailerUrl}/${finalContentId}_dmb_w.mp4`, `${trailerUrl}/${finalContentId}_mhb_w.mp4`, `${trailerUrl}/${finalContentId}_dm_w.mp4`, `${trailerUrl}/${finalContentId}_sm_w.mp4` ];
    for (const url of videoUrls) {
      try {
        const checkResponse = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        const available = checkResponse.ok || checkResponse.type === 'opaque';
        if (available) { sendResponse({ success: true, videoUrl: url }); return; }
      } catch {}
    }
    sendResponse({ success: false, error: 'No accessible video URL found' });
  } catch (error: any) {
    console.error(`[Background] Failed to fetch AVPreview preview for ${message.code}:`, error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleFetchJavDBPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { url } = message || {};
    if (!url) { sendResponse({ success: false, error: 'No URL provided' }); return; }
    const res = await fetch(url);
    if (!res.ok) { sendResponse({ success: false, error: `Failed to fetch JavDB page: ${res.status}` }); return; }
    const html = await res.text();
    const m = html.match(/id=\"preview-video\"[\s\S]*?<source[^>]*src=[\"']([^\"']+)[\"']/i);
    if (m && m[1]) { sendResponse({ success: true, videoUrl: m[1] }); }
    else { sendResponse({ success: false, error: 'Preview video not found' }); }
  } catch (error: any) {
    console.error('[Background] Failed to fetch JavDB preview:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDrive115Push(message: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
    if (!tabs.length) { sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: '未找到 115.com 标签页' }); return; }
    chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ type: 'DRIVE115_PUSH_RESPONSE', requestId: message?.requestId, success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response);
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
    if (!tabs.length) { sendResponse({ success: false, error: '未找到 115.com 标签页' }); return; }
    chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
      if (chrome.runtime.lastError) {
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

    const wantUrl = 'https://javdb.com/users/want_watch_videos';
    const watchedUrl = 'https://javdb.com/users/watched_videos';

    // 使用统一调度器发起请求（自动限速/并发控制）
    const fetchHtml = async (url: string): Promise<{ ok: boolean; html?: string; finalUrl?: string; status?: number }> => {
      try {
        const res = await requestScheduler.enqueue(url, {
          method: 'GET',
          // 包含站点 Cookie 以访问登录页数据
          credentials: 'include' as any,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cache-Control': 'no-cache',
          },
        } as RequestInit);
        const html = await res.text();
        return { ok: res.ok, html, finalUrl: (res as any).url, status: res.status };
      } catch {
        return { ok: false };
      }
    };

    const parseTotalFromHtml = (html: string): number | undefined => {
      try {
        // 常见“总数”文案匹配：共有/共/合计/合計/總計 等
        const m = html.match(/(?:共(?:有)?|合(?:计|計)|總(?:計)?|总计)\s*([0-9][0-9,\.]*)\s*(?:部|条|項|项|个|個|影片|作品)/i);
        if (m && m[1]) {
          const n = Number(String(m[1]).replace(/[\s,]/g, ''));
          if (isFinite(n)) return n;
        }
      } catch {}
      return undefined;
    };

    const extractMaxPage = (html: string): number | undefined => {
      try {
        const nums = Array.from(html.matchAll(/\?page=(\d+)/g)).map(m => Number(m[1])).filter(n => isFinite(n));
        if (nums.length) return Math.max(...nums);
      } catch {}
      return undefined;
    };

    const countItemsOnPage = (html: string): number => {
      try {
        // 与同步模块保持一致：匹配 /v/<id> 且排除 reviews 链接
        const set = new Set<string>();
        const re = /href="\/v\/([a-zA-Z0-9\-_]+)"(?![^>]*reviews)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(html)) !== null) set.add(m[1]);
        if (set.size > 0) return set.size;
        // 兜底：统计列表项 class="item" 的出现次数
        const it = html.match(/class="[^"]*\bitem\b[^"]*"/g);
        return it ? it.length : 0;
      } catch {
        return 0;
      }
    };

    const computeCount = async (baseUrl: string, htmlFirst: string): Promise<number> => {
      // 优先使用“总数”文案
      const direct = parseTotalFromHtml(htmlFirst);
      if (typeof direct === 'number') return direct;

      const totalPages = extractMaxPage(htmlFirst);
      if (typeof totalPages === 'number' && totalPages > 1) {
        // 抓取末页，计算最后一页条目数
        const last = await fetchHtml(`${baseUrl}?page=${totalPages}`);
        const lastCount = last.ok && last.html ? countItemsOnPage(last.html) : countItemsOnPage(htmlFirst);
        // JavDB 列表通常每页 20 条
        return (totalPages - 1) * 20 + lastCount;
      }
      // 单页或无法解析分页时，直接统计当前页项目数
      return countItemsOnPage(htmlFirst);
    };

    const [wantRes, watchedRes] = await Promise.all([fetchHtml(wantUrl), fetchHtml(watchedUrl)]);

    // 登录判定：若被重定向到登录页或内容为空，则视为未登录
    const isLoggedIn = !!(
      (wantRes.ok && wantRes.html && !((wantRes.finalUrl || '').includes('/sign_in')))
      || (watchedRes.ok && watchedRes.html && !((watchedRes.finalUrl || '').includes('/sign_in')))
    );

    if (!isLoggedIn) {
      throw new Error('未登录 JavDB');
    }

    const wantCount = wantRes.ok && wantRes.html ? await computeCount(wantUrl, wantRes.html) : 0;
    const watchedCount = watchedRes.ok && watchedRes.html ? await computeCount(watchedUrl, watchedRes.html) : 0;

    const now = Date.now();
    const profile = {
      email: baseProfile?.email || '',
      username: baseProfile?.username || '',
      userType: baseProfile?.userType || '',
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

async function setupAlarms(): Promise<void> { try { /* no-op */ } catch {} }


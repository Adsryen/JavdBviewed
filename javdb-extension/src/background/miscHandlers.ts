// src/background/miscHandlers.ts
// 抽离杂项 handlers 与消息路由

import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/config';
import { refreshRecordById } from './sync';
import { viewedPut as idbViewedPut, logsAdd as idbLogsAdd, logsQuery as idbLogsQuery } from './db';
import { newWorksScheduler } from '../services/newWorks';
import { requestScheduler } from './requestScheduler';

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
        case 'UPDATE_WATCHED_STATUS':
          handleUpdateWatchedStatus(message, sendResponse);
          return true;
        case 'fetch-user-profile':
          fetchUserProfileFromJavDB().then((profile) => sendResponse({ success: true, profile }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        case 'setup-alarms':
          setupAlarms().then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        case 'new-works-manual-check':
          newWorksScheduler.triggerManualCheck()
            .then((result) => sendResponse({ success: true, result }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;
        case 'new-works-scheduler-restart':
          newWorksScheduler.restart().then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
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
    const profile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
    return profile || { isLoggedIn: false };
  } catch {
    return { isLoggedIn: false };
  }
}

async function setupAlarms(): Promise<void> { try { /* no-op */ } catch {} }


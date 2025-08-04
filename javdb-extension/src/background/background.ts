// src/background/background.ts

import { getValue, setValue, getSettings, saveSettings } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { ExtensionSettings, LogEntry, LogLevel } from '../types';
import { refreshRecordById } from './sync';

// console.log('[Background] Service Worker starting up or waking up.');

const consoleMap: Record<LogLevel, (message?: any, ...optionalParams: any[]) => void> = {
    INFO: console.info,
    WARN: console.warn,
    ERROR: console.error,
    DEBUG: console.debug,
};

async function log(level: LogLevel, message: string, data?: any) {
    const logFunction = consoleMap[level] || console.log;
    logFunction(`[${level}] ${message}`, data); // Keep console logging

    try {
        const [logs, settings] = await Promise.all([
            getValue<LogEntry[]>(STORAGE_KEYS.LOGS, []),
            getSettings()
        ]);
        
        const newLogEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data, // No longer attempting a deep copy that fails on circular references
        };

        logs.push(newLogEntry);

        // Use the maxLogEntries from settings
        const maxEntries = settings.logging?.maxLogEntries || 1500;
        if (logs.length > maxEntries) {
            logs.splice(0, logs.length - maxEntries);
        }

        await setValue(STORAGE_KEYS.LOGS, logs);
    } catch (e) {
        console.error("Failed to write to persistent log:", e);
    }
}

const logger = {
    info: (message: string, data?: any) => log('INFO', message, data),
    warn: (message: string, data?: any) => log('WARN', message, data),
    error: (message: string, data?: any) => log('ERROR', message, data),
    debug: (message: string, data?: any) => log('DEBUG', message, data),
};

interface WebDAVFile {
    name: string;
    path: string;
    lastModified: string;
    isDirectory: boolean;
    size?: number;
}

async function performUpload(): Promise<{ success: boolean; error?: string }> {
    await logger.info('Attempting to perform WebDAV upload.');
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        const errorMsg = "WebDAV is not enabled or URL is not configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        // 获取所有需要同步的数据
        const recordsToSync = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
        const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
        const actorRecords = await getValue(STORAGE_KEYS.ACTOR_RECORDS, {});
        const logs = await getValue(STORAGE_KEYS.LOGS, []);
        const importStats = await getValue(STORAGE_KEYS.LAST_IMPORT_STATS, null);

        const dataToExport = {
            version: '2.0', // 添加版本号以支持向后兼容
            timestamp: new Date().toISOString(),
            settings: settings,
            data: recordsToSync,
            userProfile: userProfile,
            actorRecords: actorRecords, // 新增：演员库数据
            logs: logs, // 新增：持久化日志
            importStats: importStats // 新增：导入统计
        };
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        const filename = `javdb-extension-backup-${date}.json`;
        
        let fileUrl = settings.webdav.url;
        if (!fileUrl.endsWith('/')) fileUrl += '/';
        fileUrl += filename.startsWith('/') ? filename.substring(1) : filename;
        
        await logger.info(`Uploading to ${fileUrl}`);

        const response = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToExport, null, 2)
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        // Update last sync time
        const updatedSettings = await getSettings();
        updatedSettings.webdav.lastSync = new Date().toISOString();
        await saveSettings(updatedSettings);
        await logger.info('WebDAV upload successful, updated last sync time.');

        return { success: true };
    } catch (error: any) {
        await logger.error('WebDAV upload failed.', { error: error.message });
        return { success: false, error: error.message };
    }
}

async function performRestore(filename: string, options = {
    restoreSettings: true,
    restoreRecords: true,
    restoreUserProfile: true,
    restoreActorRecords: true, // 新增：恢复演员库
    restoreLogs: false, // 新增：恢复日志（默认关闭）
    restoreImportStats: false, // 新增：恢复导入统计（默认关闭）
    preview: false // 新增：预览模式
}): Promise<{ success: boolean; error?: string; data?: any }> {
    await logger.info(`Attempting to restore from WebDAV.`, { filename, options });
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        const errorMsg = "WebDAV is not enabled or URL is not configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        let finalUrl: string;
        const webdavBaseUrl = settings.webdav.url;

        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            finalUrl = filename;
        } else if (filename.startsWith('/')) {
            const origin = new URL(webdavBaseUrl).origin;
            finalUrl = new URL(filename, origin).href;
        } else {
            let base = webdavBaseUrl;
            if (!base.endsWith('/')) base += '/';
            finalUrl = new URL(filename, base).href;
        }

        await logger.info(`Attempting to restore from WebDAV URL: ${finalUrl}`);
        
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`)
            }
        });

        if (!response.ok) {
            throw new Error(`Download failed with status: ${response.status}`);
        }

        const fileContents = await response.text();
        const importData = JSON.parse(fileContents);

        await logger.info('Parsed backup data', {
            hasSettings: !!importData.settings,
            hasData: !!importData.data,
            hasUserProfile: !!importData.userProfile,
            hasActorRecords: !!importData.actorRecords,
            hasLogs: !!importData.logs,
            hasImportStats: !!importData.importStats,
            version: importData.version || '1.0',
            preview: options.preview
        });

        // 如果是预览模式，返回完整数据用于差异分析
        if (options.preview) {
            return {
                success: true,
                data: {
                    version: importData.version || '1.0',
                    timestamp: importData.timestamp,
                    settings: importData.settings || null,
                    data: importData.data || importData.viewed || null, // 兼容旧格式
                    viewed: importData.viewed || null, // 向后兼容
                    userProfile: importData.userProfile || null,
                    actorRecords: importData.actorRecords || null,
                    logs: importData.logs || null,
                    importStats: importData.importStats || null
                }
            };
        }

        // 恢复扩展设置
        if (importData.settings && options.restoreSettings) {
            await saveSettings(importData.settings);
            await logger.info('Restored settings');
        }

        // 恢复视频记录
        if (importData.data && options.restoreRecords) {
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
            await logger.info('Restored video records');
        } else if (options.restoreRecords) {
            // 向后兼容：旧版本的备份格式
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
            await logger.info('Restored video records (legacy format)');
        }

        // 恢复用户配置
        if (importData.userProfile && options.restoreUserProfile) {
            await setValue(STORAGE_KEYS.USER_PROFILE, importData.userProfile);
            await logger.info('Restored user profile');
        }

        // 恢复演员库数据
        if (importData.actorRecords && options.restoreActorRecords) {
            await setValue(STORAGE_KEYS.ACTOR_RECORDS, importData.actorRecords);
            await logger.info('Restored actor records', {
                actorCount: Object.keys(importData.actorRecords).length
            });
        }

        // 恢复日志（可选）
        if (importData.logs && options.restoreLogs) {
            await setValue(STORAGE_KEYS.LOGS, importData.logs);
            await logger.info('Restored logs', {
                logCount: Array.isArray(importData.logs) ? importData.logs.length : 0
            });
        }

        // 恢复导入统计（可选）
        if (importData.importStats && options.restoreImportStats) {
            await setValue(STORAGE_KEYS.LAST_IMPORT_STATS, importData.importStats);
            await logger.info('Restored import statistics');
        }
        
        return { success: true };
    } catch (error: any) {
        await logger.error('Failed to restore from WebDAV.', { error: error.message, filename });
        return { success: false, error: error.message };
    }
}

async function listFiles(): Promise<{ success: boolean; error?: string; files?: WebDAVFile[] }> {
    await logger.info('Attempting to list files from WebDAV.');
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        const errorMsg = "WebDAV is not enabled or URL is not configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        let url = settings.webdav.url;
        if (!url.endsWith('/')) url += '/';

        const response = await fetch(url, {
            method: 'PROPFIND',
            headers: {
                'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
                'Depth': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to list files with status: ${response.status}`);
        }

        const text = await response.text();
        await logger.debug("Received WebDAV PROPFIND response:", { response: text });

        const files = parseWebDAVResponse(text);
        await logger.debug("Parsed WebDAV files:", { files });

        return { success: true, files: files };
    } catch (error: any) {
        await logger.error('Failed to list WebDAV files.', { error: error.message });
        return { success: false, error: error.message };
    }
}

function parseWebDAVResponse(xmlString: string): WebDAVFile[] {
    const files: WebDAVFile[] = [];
    const simplifiedXml = xmlString.replace(/<(\/)?\w+:/g, '<$1');

    const responseRegex = /<response>(.*?)<\/response>/gs;
    const hrefRegex = /<href>(.*?)<\/href>/;
    const lastModifiedRegex = /<getlastmodified>(.*?)<\/getlastmodified>/;
    const contentLengthRegex = /<getcontentlength>(.*?)<\/getcontentlength>/;
    const collectionRegex = /<resourcetype>\s*<collection\s*\/>\s*<\/resourcetype>/;

    let match;
    while ((match = responseRegex.exec(simplifiedXml)) !== null) {
        const responseXml = match[1];
        const hrefMatch = responseXml.match(hrefRegex);
        if (hrefMatch) {
            const href = hrefMatch[1];
            const displayName = decodeURIComponent(href.split('/').filter(Boolean).pop() || '');

            if (collectionRegex.test(responseXml) || href.endsWith('/')) {
                continue;
            }

            if (displayName.includes('javdb-extension-backup')) {
                const lastModifiedMatch = responseXml.match(lastModifiedRegex);
                const lastModified = lastModifiedMatch ? new Date(lastModifiedMatch[1]).toLocaleString() : 'N/A';

                const contentLengthMatch = responseXml.match(contentLengthRegex);
                const size = contentLengthMatch ? parseInt(contentLengthMatch[1], 10) : undefined;

                files.push({
                    name: displayName,
                    path: href,
                    lastModified: lastModified,
                    isDirectory: false,
                    size: size,
                });
            }
        }
    }
    return files;
}

async function testWebDAVConnection(): Promise<{ success: boolean; error?: string }> {
    await logger.info('Testing WebDAV connection.');
    const settings = await getSettings();
    if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
        const errorMsg = "WebDAV connection details are not fully configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const response = await fetch(settings.webdav.url, {
            method: 'PROPFIND',
            headers: {
                'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
                'Depth': '0'
            }
        });

        if (response.ok) {
            return { success: true };
        } else {
            const errorMsg = `Connection test failed with status: ${response.status}`;
            await logger.warn(errorMsg);
            return { success: false, error: errorMsg };
        }
    } catch (error: any) {
        await logger.error('WebDAV connection test failed.', { error: error.message });
        return { success: false, error: error.message };
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // console.log(`[Background] onMessage listener triggered. Received message:`, message);
    // console.log(`[Background] Message type: ${message.type}`);

    try {
        switch (message.type) {
            case 'ping':
            case 'ping-background':
                // console.log('[Background] Ping received, sending pong.');
                sendResponse({ success: true, message: 'pong' });
                return true;
            case 'get-logs':
                // console.log('[Background] Processing get-logs request.');
                getValue(STORAGE_KEYS.LOGS, [])
                    .then(logs => {
                        // console.log(`[Background] Retrieved ${logs.length} log entries.`);
                        sendResponse({ success: true, logs });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to get logs:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'log-message':
                // console.log('[Background] Processing log-message request.');
                const { payload } = message;
                if (payload && payload.level && payload.message) {
                    log(payload.level, payload.message, payload.data)
                        .then(() => {
                            sendResponse({ success: true });
                        })
                        .catch(error => {
                            console.error('[Background] Failed to log message:', error);
                            sendResponse({ success: false, error: error.message });
                        });
                } else {
                    sendResponse({ success: false, error: 'Invalid log message payload' });
                }
                return true;
            case 'webdav-list-files':
                console.log('[Background] Processing webdav-list-files request.');
                listFiles()
                    .then(result => {
                        console.log(`[Background] WebDAV list files result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to list WebDAV files:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'webdav-restore':
                console.log('[Background] Processing webdav-restore request.');
                const { filename, options, preview } = message;
                const restoreOptions = { ...options, preview: preview || false };
                performRestore(filename, restoreOptions)
                    .then(result => {
                        console.log(`[Background] WebDAV restore result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to restore from WebDAV:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'webdav-test':
                console.log('[Background] Processing webdav-test request.');
                testWebDAVConnection()
                    .then(result => {
                        console.log(`[Background] WebDAV test result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to test WebDAV connection:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'webdav-upload':
                console.log('[Background] Processing webdav-upload request.');
                performUpload()
                    .then(result => {
                        console.log(`[Background] WebDAV upload result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to upload to WebDAV:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'clear-all-records':
                console.log('[Background] Processing clear-all-records request.');
                setValue(STORAGE_KEYS.VIEWED_RECORDS, {})
                    .then(() => {
                        console.log('[Background] All records cleared successfully.');
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to clear all records:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'refresh-record':
                const { videoId } = message;
                console.log(`[Background] Processing refresh-record for videoId: ${videoId}`);

                if (!videoId) {
                    console.error('[Background] Refresh request missing videoId. Sending error response.');
                    sendResponse({ success: false, error: 'No videoId provided.' });
                    return true;
                }

                console.log(`[Background] About to call refreshRecordById for: ${videoId}`);

                refreshRecordById(videoId)
                    .then(updatedRecord => {
                        console.log(`[Background] refreshRecordById successful for ${videoId}. Sending success response.`);
                        console.log(`[Background] Updated record:`, updatedRecord);
                        sendResponse({ success: true, record: updatedRecord });
                    })
                    .catch(error => {
                        console.error(`[Background] refreshRecordById failed for ${videoId}:`, error);
                        console.error(`[Background] Error stack:`, error.stack);
                        sendResponse({ success: false, error: error.message });
                    });

                // Return true to indicate that the response will be sent asynchronously.
                return true;
            case 'fetch-user-profile':
                console.log('[Background] Processing fetch-user-profile request.');
                fetchUserProfileFromJavDB()
                    .then(profile => {
                        console.log('[Background] User profile fetch result:', profile);
                        sendResponse({ success: true, profile });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to fetch user profile:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'setup-alarms':
                console.log('[Background] Processing setup-alarms request.');
                setupAlarms()
                    .then(() => {
                        console.log('[Background] Alarms setup completed.');
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to setup alarms:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            default:
                console.warn(`[Background] Received unknown message type: ${message.type}. Ignoring.`);
                return false;
        }
    } catch (error) {
        console.error(`[Background] Error in message handler:`, error);
        sendResponse({ success: false, error: 'Internal error in background script' });
        return true;
    }
});

async function triggerAutoSync(): Promise<void> {
    await logger.info('Checking if auto-sync should be triggered.');
    const settings = await getSettings();
    if (settings.webdav.enabled && settings.webdav.autoSync) {
        await logger.info('Performing daily auto-sync...');
        const response = await performUpload();
        if (response && response.success) {
            await logger.info('Daily auto-sync successful.');
            const newSettings: ExtensionSettings = await getSettings();
            newSettings.webdav.lastSync = new Date().toISOString();
            await saveSettings(newSettings);
        } else {
            await logger.error('Daily auto-sync failed.', { error: response ? response.error : 'No response.' });
        }
    } else {
        await logger.info('Auto-sync is disabled, skipping.');
    }
}

async function setupAlarms(): Promise<void> {
    await logger.info('Setting up alarms for auto-sync.');
    const settings = await getSettings();
    const interval = settings.webdav.syncInterval || 1440;

    const alarm = await chrome.alarms.get('daily-webdav-sync');
    if (alarm && alarm.periodInMinutes !== interval) {
        await chrome.alarms.clear('daily-webdav-sync');
        logger.info('Cleared existing alarm due to interval change.');
    }

    if (settings.webdav.enabled && settings.webdav.autoSync) {
        chrome.alarms.create('daily-webdav-sync', {
            delayInMinutes: 1,
            periodInMinutes: interval
        });
        await logger.info(`Created/updated auto-sync alarm with interval: ${interval} minutes.`);
    } else {
        const wasCleared = await chrome.alarms.clear('daily-webdav-sync');
        if (wasCleared) {
            logger.info('Auto-sync is disabled, clearing any existing alarms.');
        }
    }
}

chrome.runtime.onStartup.addListener(() => {
    setupAlarms();
    triggerAutoSync();
});

chrome.runtime.onInstalled.addListener(() => {
    setupAlarms();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-webdav-sync') {
    await logger.info(`Alarm '${alarm.name}' triggered, starting auto-sync.`);
    await triggerAutoSync();
  }
});

/**
 * 从JavDB获取用户账号信息
 */
async function fetchUserProfileFromJavDB(): Promise<any> {
    const logger = {
        info: (msg: string, data?: any) => log('INFO', msg, data),
        error: (msg: string, data?: any) => log('ERROR', msg, data),
        debug: (msg: string, data?: any) => log('DEBUG', msg, data)
    };

    try {
        await logger.info('开始从JavDB获取用户账号信息');

        // 创建AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 15000); // 15秒超时

        const response = await fetch('https://javdb.com/users/profile', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            credentials: 'include',
            signal: controller.signal
        });

        // 清除超时定时器
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        await logger.debug('收到JavDB响应', { htmlLength: html.length });

        // 检查是否为地区限制页面
        if (isRegionBlockedPage(html)) {
            const errorMsg = '由于版权限制，本站禁止了你的网络所在国家的访问';
            await logger.error('检测到地区限制页面', { htmlLength: html.length });

            // 发送通知消息到content script
            sendNotificationToActiveTab(errorMsg, 'error');

            throw new Error(errorMsg);
        }

        // 解析HTML获取用户信息
        const profile = parseUserProfileFromHTML(html);

        if (!profile.isLoggedIn) {
            throw new Error('用户未登录或登录状态已过期');
        }

        await logger.info('成功解析用户账号信息', profile);
        return profile;

    } catch (error: any) {
        await logger.error('获取用户账号信息失败', { error: error.message });

        // 处理超时错误
        if (error.name === 'AbortError') {
            const timeoutMsg = '请求超时，请检查网络连接或稍后重试';
            sendNotificationToActiveTab(timeoutMsg, 'error');
            throw new Error(timeoutMsg);
        }

        // 处理其他网络错误
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            const networkMsg = '网络连接失败，请检查网络设置';
            sendNotificationToActiveTab(networkMsg, 'error');
            throw new Error(networkMsg);
        }

        throw error;
    }
}

/**
 * 检测是否为地区限制页面
 */
function isRegionBlockedPage(html: string): boolean {
    // 检查地区限制的关键词
    const blockPatterns = [
        /Due to copyright restrictions, access to this site is prohibited/i,
        /由於版權限制，本站禁止了你的網路所在國家的訪問/i,
        /由于版权限制，本站禁止了你的网络所在国家的访问/i
    ];

    return blockPatterns.some(pattern => pattern.test(html));
}

/**
 * 发送通知消息到活动标签页
 */
function sendNotificationToActiveTab(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            const url = tabs[0].url || '';

            // 检查是否是javdb页面或扩展的dashboard页面
            if (url.includes('javdb') || url.includes('chrome-extension://')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'show-toast',
                    message,
                    toastType: type
                }).catch(() => {
                    // 如果发送失败，记录到控制台
                    console.log(`[Background] 无法发送通知到标签页: ${message}`);
                });
            } else {
                // 如果不是目标页面，也记录到控制台
                console.log(`[Background] 当前页面不支持toast通知 (${url}): ${message}`);
            }
        }
    });
}

/**
 * 从HTML中解析用户账号信息
 */
function parseUserProfileFromHTML(html: string): any {
    try {
        // 检查是否已登录（查找个人信息标题）
        const profileTitleMatch = html.match(/<h3[^>]*class="title[^"]*"[^>]*>個人信息<\/h3>/);
        if (!profileTitleMatch) {
            return {
                email: '',
                username: '',
                userType: '',
                isLoggedIn: false
            };
        }

        // 提取邮箱地址
        const emailMatch = html.match(/<span class="label">電郵地址:<\/span>\s*([^<]+)/);
        const email = emailMatch ? emailMatch[1].trim() : '';

        // 提取用户名
        const usernameMatch = html.match(/<span class="label">用戶名:<\/span>\s*([^<]+)/);
        const username = usernameMatch ? usernameMatch[1].trim() : '';

        // 提取用户类型
        const userTypeMatch = html.match(/<span class="label">用戶類型:<\/span>\s*([^<,]+)/);
        const userType = userTypeMatch ? userTypeMatch[1].trim() : '';

        // 提取服务器端统计数据
        const serverStats = parseServerStatsFromHTML(html);

        return {
            email,
            username,
            userType,
            isLoggedIn: true,
            serverStats
        };

    } catch (error: any) {
        console.error('解析用户账号信息失败:', error);
        return {
            email: '',
            username: '',
            userType: '',
            isLoggedIn: false
        };
    }
}

/**
 * 从HTML中解析服务器端统计数据
 */
function parseServerStatsFromHTML(html: string): any {
    try {
        // 提取想看数量：想看(33)
        const wantMatch = html.match(/<a[^>]*href="\/users\/want_watch_videos"[^>]*>想看\((\d+)\)<\/a>/);
        const wantCount = wantMatch ? parseInt(wantMatch[1], 10) : 0;

        // 提取看过数量：看過(3805)
        const watchedMatch = html.match(/<a[^>]*href="\/users\/watched_videos"[^>]*>看過\((\d+)\)<\/a>/);
        const watchedCount = watchedMatch ? parseInt(watchedMatch[1], 10) : 0;

        // 提取清单数量（可选）：我的清單
        // 注意：清单可能没有数量显示，所以这里设为可选
        const listsMatch = html.match(/<a[^>]*href="\/users\/lists"[^>]*>我的清單\((\d+)\)<\/a>/);
        const listsCount = listsMatch ? parseInt(listsMatch[1], 10) : undefined;

        return {
            wantCount,
            watchedCount,
            listsCount,
            lastSyncTime: Date.now()
        };

    } catch (error: any) {
        console.error('解析服务器端统计数据失败:', error);
        return {
            wantCount: 0,
            watchedCount: 0,
            listsCount: undefined,
            lastSyncTime: Date.now()
        };
    }
}
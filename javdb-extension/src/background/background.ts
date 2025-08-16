// src/background/background.ts

import { getValue, setValue, getSettings, saveSettings } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { ExtensionSettings, LogEntry, LogLevel } from '../types';
import { refreshRecordById } from './sync';
import { quickDiagnose, type DiagnosticResult } from '../utils/webdavDiagnostic';
import { newWorksScheduler } from '../services/newWorks';

// console.log('[Background] Service Worker starting up or waking up.');

const consoleMap: Record<LogLevel, (message?: any, ...optionalParams: any[]) => void> = {
    INFO: console.info,
    WARN: console.warn,
    ERROR: console.error,
    DEBUG: console.debug,
};

async function log(level: LogLevel, message: string, data?: any) {
    const logFunction = consoleMap[level] || console.log;
    // 只在有数据时才输出数据，避免输出 undefined
    if (data !== undefined) {
        logFunction(`[${level}] ${message}`, data);
    } else {
        logFunction(`[${level}] ${message}`);
    }

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
            actorRecords: actorRecords, // 演员库数据
            logs: logs, // 持久化日志
            importStats: importStats, // 导入统计
            newWorks: { // 新增：新作品数据
                subscriptions: await getValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {}),
                records: await getValue(STORAGE_KEYS.NEW_WORKS_RECORDS, {}),
                config: await getValue(STORAGE_KEYS.NEW_WORKS_CONFIG, {})
            }
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
            hasNewWorks: !!importData.newWorks,
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
                    importStats: importData.importStats || null,
                    newWorks: importData.newWorks || null
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

        // 新增：恢复新作品数据
        if (importData.newWorks) {
            if (importData.newWorks.subscriptions) {
                await setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, importData.newWorks.subscriptions);
            }
            if (importData.newWorks.records) {
                await setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, importData.newWorks.records);
            }
            if (importData.newWorks.config) {
                await setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, importData.newWorks.config);
            }
            await logger.info('Restored new works data');
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

        await logger.info(`Sending PROPFIND request to: ${url}`);

        // 增强的请求头，支持更多WebDAV服务器
        const headers: Record<string, string> = {
            'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
            'Depth': '1',
            'Content-Type': 'application/xml; charset=utf-8',
            'User-Agent': 'JavDB-Extension/1.0'
        };

        // 对于某些服务器，可能需要发送XML body
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
    <D:allprop/>
</D:propfind>`;

        const response = await fetch(url, {
            method: 'PROPFIND',
            headers: headers,
            body: xmlBody
        });

        await logger.info(`WebDAV response status: ${response.status} ${response.statusText}`);
        await logger.debug(`WebDAV response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            // 提供更详细的错误信息
            let errorDetail = `HTTP ${response.status}: ${response.statusText}`;

            if (response.status === 401) {
                errorDetail += ' - 认证失败，请检查用户名和密码';
            } else if (response.status === 403) {
                errorDetail += ' - 访问被拒绝，请检查权限设置';
            } else if (response.status === 404) {
                errorDetail += ' - 路径不存在，请检查WebDAV URL';
            } else if (response.status === 405) {
                errorDetail += ' - 服务器不支持PROPFIND方法';
            } else if (response.status >= 500) {
                errorDetail += ' - 服务器内部错误';
            }

            throw new Error(errorDetail);
        }

        const text = await response.text();
        await logger.debug("Received WebDAV PROPFIND response:", {
            responseLength: text.length,
            responsePreview: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        });

        if (!text || text.trim().length === 0) {
            throw new Error('服务器返回空响应');
        }

        const files = parseWebDAVResponse(text);
        await logger.info(`Successfully parsed ${files.length} files from WebDAV response`);
        await logger.debug("Parsed WebDAV files:", { files });

        if (files.length === 0) {
            await logger.warn('No backup files found in WebDAV response. This might be normal if no backups exist yet.');
        }

        return { success: true, files: files };
    } catch (error: any) {
        await logger.error('Failed to list WebDAV files.', {
            error: error.message,
            url: settings.webdav.url,
            username: settings.webdav.username ? '[CONFIGURED]' : '[NOT SET]'
        });
        return { success: false, error: error.message };
    }
}

function parseWebDAVResponse(xmlString: string): WebDAVFile[] {
    const files: WebDAVFile[] = [];

    // 更强大的XML命名空间处理，支持多种WebDAV服务器
    let simplifiedXml = xmlString;

    // 移除所有XML命名空间前缀，支持更多服务器格式
    simplifiedXml = simplifiedXml.replace(/<(\/)?\w+:/g, '<$1');
    simplifiedXml = simplifiedXml.replace(/\s+xmlns[^=]*="[^"]*"/g, '');

    // 多种response标签格式支持
    const responsePatterns = [
        /<response>(.*?)<\/response>/gs,
        /<multistatus[^>]*>(.*?)<\/multistatus>/gs,
        /<propstat[^>]*>(.*?)<\/propstat>/gs
    ];

    // 多种href标签格式支持
    const hrefPatterns = [
        /<href[^>]*>(.*?)<\/href>/i,
        /<displayname[^>]*>(.*?)<\/displayname>/i,
        /<name[^>]*>(.*?)<\/name>/i
    ];

    // 多种时间格式支持
    const timePatterns = [
        /<getlastmodified[^>]*>(.*?)<\/getlastmodified>/i,
        /<lastmodified[^>]*>(.*?)<\/lastmodified>/i,
        /<modificationtime[^>]*>(.*?)<\/modificationtime>/i,
        /<creationdate[^>]*>(.*?)<\/creationdate>/i
    ];

    // 多种大小格式支持
    const sizePatterns = [
        /<getcontentlength[^>]*>(.*?)<\/getcontentlength>/i,
        /<contentlength[^>]*>(.*?)<\/contentlength>/i,
        /<size[^>]*>(.*?)<\/size>/i
    ];

    // 多种目录检测格式支持
    const collectionPatterns = [
        /<resourcetype[^>]*>.*?<collection[^>]*\/>.*?<\/resourcetype>/i,
        /<resourcetype[^>]*>.*?<collection[^>]*>.*?<\/collection>.*?<\/resourcetype>/i,
        /<getcontenttype[^>]*>.*?directory.*?<\/getcontenttype>/i,
        /<iscollection[^>]*>true<\/iscollection>/i
    ];

    // 尝试不同的response模式
    for (const responsePattern of responsePatterns) {
        let match;
        responsePattern.lastIndex = 0; // 重置正则表达式状态

        while ((match = responsePattern.exec(simplifiedXml)) !== null) {
            const responseXml = match[1];

            // 尝试提取href/文件名
            let href = '';
            let displayName = '';

            for (const hrefPattern of hrefPatterns) {
                const hrefMatch = responseXml.match(hrefPattern);
                if (hrefMatch && hrefMatch[1]) {
                    href = hrefMatch[1].trim();
                    // 从href中提取文件名
                    if (href.includes('/')) {
                        displayName = decodeURIComponent(href.split('/').filter(Boolean).pop() || '');
                    } else {
                        displayName = decodeURIComponent(href);
                    }
                    break;
                }
            }

            if (!href || !displayName) continue;

            // 检查是否为目录
            let isDirectory = false;
            for (const collectionPattern of collectionPatterns) {
                if (collectionPattern.test(responseXml)) {
                    isDirectory = true;
                    break;
                }
            }

            // 如果是目录或者href以/结尾，跳过
            if (isDirectory || href.endsWith('/')) {
                continue;
            }

            // 只处理包含备份文件名的文件
            if (displayName.includes('javdb-extension-backup')) {
                // 尝试提取最后修改时间
                let lastModified = 'N/A';
                for (const timePattern of timePatterns) {
                    const timeMatch = responseXml.match(timePattern);
                    if (timeMatch && timeMatch[1]) {
                        try {
                            lastModified = new Date(timeMatch[1]).toLocaleString();
                            break;
                        } catch (e) {
                            // 如果日期解析失败，继续尝试其他格式
                            continue;
                        }
                    }
                }

                // 尝试提取文件大小
                let size: number | undefined;
                for (const sizePattern of sizePatterns) {
                    const sizeMatch = responseXml.match(sizePattern);
                    if (sizeMatch && sizeMatch[1]) {
                        const parsedSize = parseInt(sizeMatch[1], 10);
                        if (!isNaN(parsedSize)) {
                            size = parsedSize;
                            break;
                        }
                    }
                }

                files.push({
                    name: displayName,
                    path: href,
                    lastModified: lastModified,
                    isDirectory: false,
                    size: size,
                });
            }
        }

        // 如果找到了文件，就不需要尝试其他模式了
        if (files.length > 0) {
            break;
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
        let url = settings.webdav.url;
        if (!url.endsWith('/')) url += '/';

        await logger.info(`Testing connection to: ${url}`);

        // 增强的请求头
        const headers: Record<string, string> = {
            'Authorization': 'Basic ' + btoa(`${settings.webdav.username}:${settings.webdav.password}`),
            'Depth': '0',
            'Content-Type': 'application/xml; charset=utf-8',
            'User-Agent': 'JavDB-Extension/1.0'
        };

        // 简单的XML body用于测试
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
    <D:prop>
        <D:resourcetype/>
        <D:getcontentlength/>
        <D:getlastmodified/>
    </D:prop>
</D:propfind>`;

        const response = await fetch(url, {
            method: 'PROPFIND',
            headers: headers,
            body: xmlBody
        });

        await logger.info(`Test response: ${response.status} ${response.statusText}`);

        if (response.ok) {
            // 尝试读取响应内容以验证服务器是否正确支持WebDAV
            const responseText = await response.text();
            await logger.debug('Test response content:', {
                length: responseText.length,
                preview: responseText.substring(0, 200)
            });

            // 检查响应是否包含WebDAV相关内容
            if (responseText.includes('<?xml') || responseText.includes('<multistatus') || responseText.includes('<response')) {
                await logger.info('WebDAV connection test successful - server supports WebDAV protocol');
                return { success: true };
            } else {
                await logger.warn('Server responded but may not support WebDAV properly');
                return {
                    success: false,
                    error: '服务器响应成功但可能不支持WebDAV协议，请检查URL是否正确'
                };
            }
        } else {
            let errorMsg = `Connection test failed with status: ${response.status} ${response.statusText}`;

            // 提供针对性的错误提示
            if (response.status === 401) {
                errorMsg += ' - 认证失败，请检查用户名和密码';
            } else if (response.status === 403) {
                errorMsg += ' - 访问被拒绝，请检查账户权限';
            } else if (response.status === 404) {
                errorMsg += ' - WebDAV路径不存在，请检查URL';
            } else if (response.status === 405) {
                errorMsg += ' - 服务器不支持WebDAV';
            }

            await logger.warn(errorMsg);
            return { success: false, error: errorMsg };
        }
    } catch (error: any) {
        let errorMsg = error.message;

        // 网络错误的友好提示
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
            errorMsg = '网络连接失败，请检查网络连接和服务器地址';
        } else if (errorMsg.includes('CORS')) {
            errorMsg = 'CORS错误，可能是服务器配置问题';
        }

        await logger.error('WebDAV connection test failed.', {
            error: errorMsg,
            originalError: error.message,
            url: settings.webdav.url
        });
        return { success: false, error: errorMsg };
    }
}

async function diagnoseWebDAVConnection(): Promise<{ success: boolean; error?: string; diagnostic?: DiagnosticResult }> {
    await logger.info('Starting WebDAV diagnostic.');
    const settings = await getSettings();

    if (!settings.webdav.url || !settings.webdav.username || !settings.webdav.password) {
        const errorMsg = "WebDAV connection details are not fully configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const diagnostic = await quickDiagnose({
            url: settings.webdav.url,
            username: settings.webdav.username,
            password: settings.webdav.password
        });

        await logger.info('WebDAV diagnostic completed', diagnostic);

        return {
            success: true,
            diagnostic: diagnostic
        };
    } catch (error: any) {
        await logger.error('WebDAV diagnostic failed.', { error: error.message });
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
            case 'webdav-diagnose':
                console.log('[Background] Processing webdav-diagnose request.');
                diagnoseWebDAVConnection()
                    .then(result => {
                        console.log(`[Background] WebDAV diagnose result:`, result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('[Background] Failed to diagnose WebDAV connection:', error);
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
            case 'new-works-manual-check':
                console.log('[Background] Processing new-works-manual-check request.');
                newWorksScheduler.triggerManualCheck()
                    .then(result => {
                        console.log('[Background] Manual new works check completed:', result);
                        sendResponse({ success: true, result });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to perform manual new works check:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'new-works-scheduler-restart':
                console.log('[Background] Processing new-works-scheduler-restart request.');
                newWorksScheduler.restart()
                    .then(() => {
                        console.log('[Background] New works scheduler restarted.');
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error('[Background] Failed to restart new works scheduler:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            case 'new-works-scheduler-status':
                console.log('[Background] Processing new-works-scheduler-status request.');
                try {
                    const status = newWorksScheduler.getStatus();
                    sendResponse({ success: true, status });
                } catch (error) {
                    console.error('[Background] Failed to get new works scheduler status:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true;
            case 'fetch-external-data':
                console.log('[Background] Processing fetch-external-data request.');
                handleExternalDataFetch(message, sendResponse);
                return true;
            case 'DRIVE115_PUSH':
                console.log('[Background] Processing DRIVE115_PUSH request.');
                handleDrive115Push(message, sendResponse);
                return true;
            case 'DRIVE115_VERIFY':
                console.log('[Background] Processing DRIVE115_VERIFY request.');
                handleDrive115Verify(message, sendResponse);
                return true;
            case 'DRIVE115_HEARTBEAT':
                console.log('[Background] Received heartbeat from 115 content script');
                sendResponse({ type: 'DRIVE115_HEARTBEAT_RESPONSE', success: true });
                return true;
            case 'UPDATE_WATCHED_STATUS':
                console.log('[Background] Processing UPDATE_WATCHED_STATUS request.');
                handleUpdateWatchedStatus(message, sendResponse);
                return true; // 保持消息通道开放
            case 'OPEN_TAB_BACKGROUND':
                console.log('[Background] Processing OPEN_TAB_BACKGROUND request.');
                handleOpenTabBackground(message, sendResponse);
                return true;
            case 'CHECK_VIDEO_URL':
                console.log('[Background] Processing CHECK_VIDEO_URL request.');
                handleCheckVideoUrl(message, sendResponse);
                return true;
            case 'FETCH_JAVSPYL_PREVIEW':
                console.log('[Background] Processing FETCH_JAVSPYL_PREVIEW request.');
                handleFetchJavSpylPreview(message, sendResponse);
                return true;
            case 'FETCH_AVPREVIEW_PREVIEW':
                console.log('[Background] Processing FETCH_AVPREVIEW_PREVIEW request.');
                handleFetchAVPreviewPreview(message, sendResponse);
                return true;
            case 'FETCH_JAVDB_PREVIEW':
                console.log('[Background] Processing FETCH_JAVDB_PREVIEW request.');
                handleFetchJavDBPreview(message, sendResponse);
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

async function handleOpenTabBackground(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { url } = message;
        if (!url) {
            sendResponse({ success: false, error: 'No URL provided' });
            return;
        }

        // 在后台打开新标签页
        const tab = await chrome.tabs.create({
            url: url,
            active: false // 后台打开
        });

        console.log(`[Background] Opened background tab: ${url}`);
        sendResponse({ success: true, tabId: tab.id });
    } catch (error) {
        console.error('[Background] Failed to open background tab:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 检查视频URL是否可用
async function handleCheckVideoUrl(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { url } = message;
        if (!url) {
            sendResponse({ success: false, error: 'No URL provided' });
            return;
        }

        console.log(`[Background] Checking video URL: ${url}`);

        // 尝试多种方法验证URL
        let available = false;

        // 方法1: 尝试HEAD请求
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            available = response.type === 'opaque' || response.ok;
            console.log(`[Background] HEAD check for ${url}: available=${available}, type=${response.type}`);

            if (available) {
                sendResponse({ success: true, available: true });
                return;
            }
        } catch (headError) {
            console.log(`[Background] HEAD request failed for ${url}:`, headError.message);
        }

        // 方法2: 尝试带Range的GET请求
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    'Range': 'bytes=0-1023'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            available = response.type === 'opaque' || response.ok;
            console.log(`[Background] Range GET check for ${url}: available=${available}, type=${response.type}`);

            if (available) {
                sendResponse({ success: true, available: true });
                return;
            }
        } catch (rangeError) {
            console.log(`[Background] Range GET failed for ${url}:`, rangeError.message);
        }

        // 方法3: 对于视频文件，尝试创建video元素测试
        if (url.includes('.mp4') || url.includes('.webm') || url.includes('.avi')) {
            try {
                // 这个方法在background script中不可用，跳过
                console.log(`[Background] Video URL detected, but cannot test in background: ${url}`);
            } catch (videoError) {
                console.log(`[Background] Video test failed for ${url}:`, videoError.message);
            }
        }

        // 方法4: 基于域名的启发式判断
        const knownGoodDomains = [
            'commondatastorage.googleapis.com', // Google测试视频
            'sample.heyzo.com',
            'my.cdn.tokyo-hot.com'
        ];

        const knownBadDomains = [
            'smovie.caribbeancom.com',
            'smovie.1pondo.tv',
            'smovie.10musume.com',
            'fms.pacopacomama.com'
        ];

        const isKnownGood = knownGoodDomains.some(domain => url.includes(domain));
        const isKnownBad = knownBadDomains.some(domain => url.includes(domain));

        if (isKnownGood) {
            console.log(`[Background] Known good domain for ${url}, assuming available`);
            available = true;
        } else if (isKnownBad) {
            console.log(`[Background] Known problematic domain for ${url}, marking unavailable`);
            available = false;
        } else {
            console.log(`[Background] Unknown domain for ${url}, assuming unavailable`);
            available = false;
        }

        sendResponse({ success: true, available });
    } catch (error) {
        console.error(`[Background] Failed to check video URL ${message.url}:`, error);
        sendResponse({ success: false, available: false });
    }
}

// 从JavSpyl获取预览视频
async function handleFetchJavSpylPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { code } = message;
        if (!code) {
            sendResponse({ success: false, error: 'No code provided' });
            return;
        }

        console.log(`[Background] Fetching JavSpyl preview for: ${code}`);

        const response = await fetch('https://v2.javspyl.tk/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://javspyl.tk',
                'Referer': 'https://javspyl.tk/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({ ID: code })
        });

        console.log(`[Background] JavSpyl API response status: ${response.status}`);

        if (!response.ok) {
            console.log(`[Background] JavSpyl API request failed: ${response.status} ${response.statusText}`);
            sendResponse({ success: false, error: `API request failed: ${response.status}` });
            return;
        }

        const data = await response.json();
        console.log(`[Background] JavSpyl API response data:`, data);

        const videoUrl = data?.info?.url;

        if (!videoUrl) {
            console.log(`[Background] No video URL found in JavSpyl response for ${code}`);
            sendResponse({ success: false, error: 'No video URL found in response' });
            return;
        }

        if (/\.m3u8?$/i.test(videoUrl)) {
            console.log(`[Background] JavSpyl returned m3u8 URL, skipping: ${videoUrl}`);
            sendResponse({ success: false, error: 'M3U8 format not supported' });
            return;
        }

        const finalUrl = videoUrl.includes('//') ? videoUrl : `https://${videoUrl}`;
        console.log(`[Background] JavSpyl final video URL: ${finalUrl}`);

        // 简化验证 - 直接返回URL，让前端处理
        sendResponse({ success: true, videoUrl: finalUrl });
    } catch (error) {
        console.error(`[Background] Failed to fetch JavSpyl preview for ${message.code}:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

// 从AVPreview获取预览视频
async function handleFetchAVPreviewPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { code } = message;
        if (!code) {
            sendResponse({ success: false, error: 'No code provided' });
            return;
        }

        // 第一步：搜索视频
        const searchResponse = await fetch(`https://avpreview.com/zh/search?keywords=${code}`);
        if (!searchResponse.ok) {
            sendResponse({ success: false, error: 'Search request failed' });
            return;
        }

        const searchHtml = await searchResponse.text();
        const parser = new DOMParser();
        const searchDoc = parser.parseFromString(searchHtml, 'text/html');

        // 查找匹配的视频
        const videoBoxes = Array.from(searchDoc.querySelectorAll('.container .videobox'));
        const matchedBox = videoBoxes.find(item => {
            const titleElement = item.querySelector('h2 strong');
            return titleElement && titleElement.textContent === code;
        });

        if (!matchedBox) {
            sendResponse({ success: false, error: 'Video not found in search results' });
            return;
        }

        const detailLink = matchedBox.querySelector('a')?.getAttribute('href');
        if (!detailLink) {
            sendResponse({ success: false, error: 'No detail link found' });
            return;
        }

        const contentId = detailLink.split('/').pop();
        if (!contentId) {
            sendResponse({ success: false, error: 'No content ID found' });
            return;
        }

        // 第二步：获取视频详情
        const apiUrl = new URL('https://avpreview.com/API/v1.0/index.php');
        apiUrl.searchParams.set('system', 'videos');
        apiUrl.searchParams.set('action', 'detail');
        apiUrl.searchParams.set('contentid', contentId);
        apiUrl.searchParams.set('sitecode', 'avpreview');
        apiUrl.searchParams.set('ip', '');
        apiUrl.searchParams.set('token', '');

        const apiResponse = await fetch(apiUrl.toString());
        if (!apiResponse.ok) {
            sendResponse({ success: false, error: 'API detail request failed' });
            return;
        }

        const apiData = await apiResponse.json();
        let trailerUrl = apiData?.videos?.trailer;

        if (!trailerUrl) {
            sendResponse({ success: false, error: 'No trailer URL found' });
            return;
        }

        // 转换URL格式
        trailerUrl = trailerUrl.replace('/hlsvideo/', '/litevideo/').replace('/playlist.m3u8', '');
        const finalContentId = trailerUrl.split('/').pop();

        // 尝试不同的视频格式
        const videoUrls = [
            `${trailerUrl}/${finalContentId}_dmb_w.mp4`,
            `${trailerUrl}/${finalContentId}_mhb_w.mp4`,
            `${trailerUrl}/${finalContentId}_dm_w.mp4`,
            `${trailerUrl}/${finalContentId}_sm_w.mp4`,
        ];

        // 检查哪个URL可用
        for (const url of videoUrls) {
            try {
                const checkResponse = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                const available = checkResponse.ok || checkResponse.type === 'opaque';
                if (available) {
                    sendResponse({ success: true, videoUrl: url });
                    return;
                }
            } catch (err) {
                // 继续尝试下一个URL
            }
        }

        sendResponse({ success: false, error: 'No accessible video URL found' });
    } catch (error) {
        console.error(`[Background] Failed to fetch AVPreview preview for ${message.code}:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

// 从JavDB页面获取预览视频
async function handleFetchJavDBPreview(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { url } = message;
        if (!url) {
            sendResponse({ success: false, error: 'No URL provided' });
            return;
        }

        const response = await fetch(url);
        if (!response.ok) {
            sendResponse({ success: false, error: 'Failed to fetch JavDB page' });
            return;
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 查找预览视频
        const previewVideo = doc.querySelector('#preview-video source');
        const videoUrl = previewVideo?.getAttribute('src');

        if (!videoUrl) {
            sendResponse({ success: false, error: 'No preview video found on JavDB page' });
            return;
        }

        // 验证URL是否可用
        const checkResponse = await fetch(videoUrl, { method: 'HEAD', mode: 'no-cors' });
        const available = checkResponse.ok || checkResponse.type === 'opaque';

        if (available) {
            sendResponse({ success: true, videoUrl });
        } else {
            sendResponse({ success: false, error: 'Preview video URL not accessible' });
        }
    } catch (error) {
        console.error(`[Background] Failed to fetch JavDB preview for ${message.url}:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

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

chrome.runtime.onStartup.addListener(async () => {
    setupAlarms();
    triggerAutoSync();

    // 初始化新作品调度器
    try {
        await newWorksScheduler.initialize();
    } catch (error) {
        logger.error('初始化新作品调度器失败:', error);
    }
});

chrome.runtime.onInstalled.addListener(async () => {
    setupAlarms();

    // 初始化新作品调度器
    try {
        await newWorksScheduler.initialize();
    } catch (error) {
        logger.error('初始化新作品调度器失败:', error);
    }
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
 * 处理115推送请求
 */
async function handleDrive115Push(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        console.log('[Background] Routing DRIVE115_PUSH to 115.com tab, message:', message);

        // 查找115.com的标签页
        const tabs = await chrome.tabs.query({ url: '*://115.com/*' });
        console.log('[Background] Found 115.com tabs:', tabs.length);

        if (tabs.length === 0) {
            // 如果没有115.com标签页，创建一个
            console.log('[Background] No 115.com tab found, creating new tab');
            try {
                const newTab = await chrome.tabs.create({
                    url: 'https://115.com/',
                    active: false
                });
                console.log('[Background] Created new tab:', newTab.id);

                // 等待标签页加载完成
                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        chrome.tabs.onUpdated.removeListener(listener);
                        reject(new Error('标签页加载超时'));
                    }, 10000);

                    const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
                        if (tabId === newTab.id && changeInfo.status === 'complete') {
                            clearTimeout(timeout);
                            chrome.tabs.onUpdated.removeListener(listener);
                            console.log('[Background] New tab loaded successfully');
                            resolve();
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);
                });

                // 等待额外1秒确保content script加载
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 发送消息到新标签页
                console.log('[Background] Sending message to new tab');
                chrome.tabs.sendMessage(newTab.id!, message, (response) => {
                    console.log('[Background] Response from new tab:', response);
                    if (chrome.runtime.lastError) {
                        console.error('[Background] Error sending to new tab:', chrome.runtime.lastError);
                        sendResponse({
                            type: 'DRIVE115_PUSH_RESPONSE',
                            requestId: message.requestId,
                            success: false,
                            error: `发送消息到新标签页失败: ${chrome.runtime.lastError.message}`
                        });
                    } else {
                        sendResponse(response);
                    }
                });
            } catch (tabError) {
                console.error('[Background] Failed to create/load new tab:', tabError);
                sendResponse({
                    type: 'DRIVE115_PUSH_RESPONSE',
                    requestId: message.requestId,
                    success: false,
                    error: `创建115标签页失败: ${tabError instanceof Error ? tabError.message : '未知错误'}`
                });
            }
        } else {
            // 尝试发送消息到所有115.com标签页，直到找到一个能响应的
            console.log('[Background] Trying to send message to', tabs.length, '115.com tabs');
            let responseReceived = false;
            let attemptCount = 0;

            const tryNextTab = (tabIndex: number) => {
                if (tabIndex >= tabs.length) {
                    if (!responseReceived) {
                        console.error('[Background] No 115.com tab could handle the message');
                        sendResponse({
                            type: 'DRIVE115_PUSH_RESPONSE',
                            requestId: message.requestId,
                            success: false,
                            error: '所有115网盘标签页都无法响应，请刷新115网盘页面后重试'
                        });
                    }
                    return;
                }

                const tab = tabs[tabIndex];
                console.log(`[Background] Trying tab ${tabIndex + 1}/${tabs.length}, ID: ${tab.id}, URL: ${tab.url}`);

                chrome.tabs.sendMessage(tab.id!, message, (response) => {
                    attemptCount++;
                    console.log(`[Background] Response from tab ${tab.id}:`, response);

                    if (chrome.runtime.lastError) {
                        console.warn(`[Background] Tab ${tab.id} failed:`, chrome.runtime.lastError.message);
                        // 尝试下一个标签页
                        if (!responseReceived) {
                            tryNextTab(tabIndex + 1);
                        }
                    } else if (response && !responseReceived) {
                        responseReceived = true;
                        console.log(`[Background] Successfully got response from tab ${tab.id}`);
                        sendResponse(response);
                    }
                });
            };

            // 开始尝试第一个标签页
            tryNextTab(0);
        }
    } catch (error) {
        console.error('[Background] Failed to handle DRIVE115_PUSH:', error);
        sendResponse({
            type: 'DRIVE115_PUSH_RESPONSE',
            requestId: message.requestId,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
}

/**
 * 处理115验证请求
 */
async function handleDrive115Verify(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        console.log('[Background] Routing DRIVE115_VERIFY to 115.com tab');

        // 查找115.com的标签页
        const tabs = await chrome.tabs.query({ url: '*://115.com/*' });

        if (tabs.length === 0) {
            sendResponse({
                success: false,
                error: '请先打开115网盘页面'
            });
            return;
        }

        // 发送消息到115.com标签页
        chrome.tabs.sendMessage(tabs[0].id!, message, sendResponse);
    } catch (error) {
        console.error('[Background] Failed to handle DRIVE115_VERIFY:', error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
}

/**
 * 处理更新观看状态请求
 */
async function handleUpdateWatchedStatus(message: any, sendResponse: (response: any) => void): Promise<void> {
    console.log('[Background] handleUpdateWatchedStatus called with:', message);

    try {
        const { videoId, status } = message;

        console.log('[Background] Extracted params:', { videoId, status });

        if (!videoId || !status) {
            console.error('[Background] Missing required parameters:', { videoId, status });
            sendResponse({
                success: false,
                error: '缺少必需参数: videoId 或 status'
            });
            return;
        }

        console.log('[Background] Getting current storage data...');

        // 获取当前的观看状态数据
        const result = await chrome.storage.local.get(['viewedVideos']);
        console.log('[Background] Current storage result:', result);

        const viewedVideos = result.viewedVideos || {};
        console.log('[Background] Current viewedVideos:', Object.keys(viewedVideos).length, 'entries');

        // 更新状态
        const updatedEntry = {
            ...viewedVideos[videoId],
            status: status,
            watchedAt: Date.now(),
            source: 'auto_115_push'
        };

        viewedVideos[videoId] = updatedEntry;
        console.log('[Background] Updated entry for', videoId, ':', updatedEntry);

        // 保存更新后的数据
        console.log('[Background] Saving to storage...');
        await chrome.storage.local.set({ viewedVideos });
        console.log('[Background] Storage save completed');

        console.log(`[Background] Successfully updated watched status for ${videoId} to ${status}`);

        const response = {
            success: true,
            videoId,
            status
        };

        console.log('[Background] Sending response:', response);
        sendResponse(response);

    } catch (error) {
        console.error('[Background] Failed to update watched status:', error);
        const errorResponse = {
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        };
        console.log('[Background] Sending error response:', errorResponse);
        sendResponse(errorResponse);
    }
}

/**
 * 处理外部数据获取请求（用于多数据源聚合）
 */
async function handleExternalDataFetch(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
        const { url, options = {} } = message;

        if (!url) {
            sendResponse({ success: false, error: 'URL is required' });
            return;
        }

        console.log(`[Background] Fetching external data from: ${url}`);

        // 检测是否为磁力搜索请求，添加延迟避免被封IP
        const isMagnetSearch = url.includes('sukebei.nyaa.si') ||
                              url.includes('btdig.com') ||
                              url.includes('btsow.com') ||
                              url.includes('torrentz2.eu');

        if (isMagnetSearch) {
            // 为磁力搜索添加随机延迟 (500-2000ms)
            const delay = Math.floor(Math.random() * 1500) + 500;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 设置更完整的浏览器请求头
        const fetchOptions: RequestInit = {
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                ...options.headers
            },
            credentials: 'omit', // 不发送cookies避免隐私问题
            ...options
        };

        // 实现重试机制
        const maxRetries = options.retries || 3;
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // 设置超时
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);
                fetchOptions.signal = controller.signal;

                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // 根据响应类型处理数据
                let data;
                const responseType = options.responseType || 'text';

                switch (responseType) {
                    case 'json':
                        data = await response.json();
                        break;
                    case 'text':
                    case 'html':
                    case 'document':
                        data = await response.text();
                        break;
                    case 'blob':
                        data = await response.blob();
                        break;
                    default:
                        data = await response.text();
                }

                console.log(`[Background] Successfully fetched data from: ${url} (attempt ${attempt + 1})`);
                sendResponse({
                    success: true,
                    data,
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    attempt: attempt + 1
                });
                return;

            } catch (error: any) {
                lastError = error;
                console.warn(`[Background] Attempt ${attempt + 1} failed for ${url}:`, error.message);

                // 如果不是最后一次尝试，等待后重试
                if (attempt < maxRetries) {
                    const retryDelay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // 指数退避 + 随机抖动
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        // 所有重试都失败了
        throw lastError;

    } catch (error: any) {
        console.error(`[Background] Failed to fetch external data after all retries:`, error);

        let errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout';
        } else if (errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Network error or CORS restriction';
        } else if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
            errorMessage = 'Request blocked by ad blocker or security extension';
        }

        sendResponse({ success: false, error: errorMessage });
    }
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
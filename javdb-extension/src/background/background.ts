// src/background/background.ts

import { getValue, setValue, getSettings, saveSettings } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { ExtensionSettings, LogEntry, LogLevel } from '../types';

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
        const recordsToSync = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
        const dataToExport = {
            settings: settings,
            data: recordsToSync
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
        
        return { success: true };
    } catch (error: any) {
        await logger.error('WebDAV upload failed.', { error: error.message });
        return { success: false, error: error.message };
    }
}

async function performRestore(filename: string, options = { restoreSettings: true, restoreRecords: true }): Promise<{ success: boolean; error?: string }> {
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
        
        if (importData.settings && options.restoreSettings) {
            await saveSettings(importData.settings);
        }
        
        if (importData.data && options.restoreRecords) {
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
        } else if (options.restoreRecords) {
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
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
                
                files.push({
                    name: displayName,
                    path: href,
                    lastModified: lastModified,
                    isDirectory: false,
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
    switch (message.type) {
        case 'webdav-upload':
            performUpload().then(sendResponse);
            return true;
        case 'webdav-restore':
            performRestore(message.filename, message.options).then(sendResponse);
            return true;
        case 'webdav-list-files':
            listFiles().then(sendResponse);
            return true;
        case 'webdav-test':
            testWebDAVConnection().then(sendResponse);
            return true;
        case 'setup-alarms':
            setupAlarms();
            return false;
        case 'get-logs':
            getValue(STORAGE_KEYS.LOGS, []).then(logs => sendResponse({ success: true, logs }));
            return true;
        case 'clear-logs':
            setValue(STORAGE_KEYS.LOGS, []).then(() => sendResponse({ success: true }));
            return true;
        case 'clear-all-records':
            setValue(STORAGE_KEYS.VIEWED_RECORDS, {}).then(() => sendResponse({ success: true }));
            return true;
        case 'log-message':
            if (message.payload) {
                const { level, message: msg, data } = message.payload;
                log(level, msg, data).then(() => sendResponse({ success: true }));
            }
            return true; // Keep the message channel open for async response
        case 'ping-background':
            log('DEBUG', 'Background service pinged successfully.');
            sendResponse({ success: true, message: 'pong' });
            return true;
        default:
            return false;
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
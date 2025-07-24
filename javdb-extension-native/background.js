// background.js
// 负责长驻任务、WebDAV网络请求、消息转发等

// import * as WebDAV from './lib/webdav.js';
// const { createClient } = WebDAV;
import { getValue, setValue, getSettings, saveSettings } from './storage.js';
import { STORAGE_KEYS } from './config.js';
import { logger } from './lib/logger.js';
// import axios from 'axios';
// import httpAdapter from 'axios/lib/adapters/xhr.js';

// Force axios to use the XHR adapter in the service worker environment.
// axios.defaults.adapter = httpAdapter;

async function performUpload() {
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
        const date = new Date().toISOString().split('T')[0];
        const filename = `/javdb-extension-backup-${date}.json`;
        
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
        
        await logger.info('WebDAV upload successful.');
        return { success: true };
    } catch (error) {
        await logger.error('WebDAV upload failed.', { error: error.message });
        return { success: false, error: error.message };
    }
}

async function performRestore(filename, options = { restoreSettings: true, restoreRecords: true }) {
    await logger.info(`Attempting to restore from WebDAV.`, { filename, options });
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        const errorMsg = "WebDAV is not enabled or URL is not configured.";
        await logger.warn(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        let finalUrl;
        const webdavBaseUrl = settings.webdav.url;

        // Intelligent URL construction
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            finalUrl = filename; // It's already a full URL
        } else if (filename.startsWith('/')) {
            // It's a root-relative path, combine with origin
            const origin = new URL(webdavBaseUrl).origin;
            finalUrl = new URL(filename, origin).href;
        } else {
            // It's a relative path, combine with the full WebDAV path
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
        
        // --- Selective Restore Logic ---
        if (importData.settings && options.restoreSettings) {
            await saveSettings(importData.settings);
        }
        
        if (importData.data && options.restoreRecords) {
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
        } else if (options.restoreRecords) {
            // Handle legacy format (root object is the data)
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
        }
        // --- End of Selective Restore Logic ---
        
        await logger.info('Successfully restored from WebDAV.', { filename });
        return { success: true };
    } catch (error) {
        await logger.error('Failed to restore from WebDAV.', { error: error.message, filename });
        return { success: false, error: error.message };
    }
}

async function listFiles() {
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
        
        // Add logging for the raw response text
        await logger.debug("Received WebDAV PROPFIND response:", { response: text });

        // Custom lightweight XML parser to avoid DOMParser in Service Worker
        const files = parseWebDAVResponse(text);
        
        // Add logging for the parsed result
        await logger.debug("Parsed WebDAV files:", { files });

        await logger.info(`Successfully listed ${files.length} backup files from WebDAV.`);
        return { success: true, files: files };
    } catch (error) {
        await logger.error('Failed to list WebDAV files.', { error: error.message });
        return { success: false, error: error.message };
    }
}

function parseWebDAVResponse(xmlString) {
    const files = [];
    // A more robust regex-based parser that strips namespace prefixes first.
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
            const displayName = decodeURIComponent(href.split('/').filter(Boolean).pop());

            // Skip directories/collections
            if (collectionRegex.test(responseXml) || href.endsWith('/')) {
                continue;
            }
            
            // Filter for backup files
            if (displayName.includes('javdb-extension-backup')) {
                const lastModifiedMatch = responseXml.match(lastModifiedRegex);
                const lastModified = lastModifiedMatch ? new Date(lastModifiedMatch[1]).toLocaleString() : 'N/A';
                
                files.push({
                    name: displayName,
                    path: href, // Use original href for download path
                    lastModified: lastModified,
                    isDirectory: false,
                });
            }
        }
    }
    return files;
}


async function testWebDAVConnection() {
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
            await logger.info('WebDAV connection test successful.');
            return { success: true };
        } else {
            const errorMsg = `Connection test failed with status: ${response.status}`;
            await logger.warn(errorMsg);
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        await logger.error('WebDAV connection test failed.', { error: error.message });
        return { success: false, error: error.message };
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'webdav-upload') {
        performUpload().then(sendResponse);
        return true; 
    } else if (message.type === 'webdav-restore') {
        performRestore(message.filename, message.options).then(sendResponse);
        return true; 
    } else if (message.type === 'webdav-list-files') {
        listFiles().then(sendResponse);
        return true;
    } else if (message.type === 'webdav-test') {
        testWebDAVConnection().then(sendResponse);
        return true;
    } else if (message.type === 'setup-alarms') {
        setupAlarms();
        return false; // No response needed
    } else if (message.type === 'get-logs') {
        getValue('extension_logs', []).then(logs => sendResponse({ success: true, logs }));
        return true;
    }
});

async function triggerAutoSync() {
    await logger.info('Checking if auto-sync should be triggered.');
    const settings = await getSettings();
    if (settings.webdav.enabled && settings.webdav.autoSync) {
        await logger.info('Performing daily auto-sync...');
        const response = await performUpload();
        if (response && response.success) {
            await logger.info('Daily auto-sync successful.');
            const newSettings = await getSettings();
            newSettings.webdav.lastSync = new Date().toISOString();
            await saveSettings(newSettings);
        } else {
            await logger.error('Daily auto-sync failed.', { error: response ? response.error : 'No response.' });
        }
    } else {
        await logger.info('Auto-sync is disabled, skipping.');
    }
}

async function setupAlarms() {
    await logger.info('Setting up alarms for auto-sync.');
    const settings = await getSettings();
    const interval = settings.webdav.syncInterval || 1440; // Default to 24 hours (1440 minutes)

    chrome.alarms.get('daily-webdav-sync', (alarm) => {
        // This part remains tricky because it's a callback, not async/await.
        // However, the logger calls that matter are in the async parts.
        if (alarm && alarm.periodInMinutes !== interval) {
            chrome.alarms.clear('daily-webdav-sync', (wasCleared) => {
                if (wasCleared) {
                    logger.info('Cleared existing alarm due to interval change.');
                }
            });
        }
    });

    // Create the alarm if it's enabled
    if (settings.webdav.enabled && settings.webdav.autoSync) {
        chrome.alarms.create('daily-webdav-sync', {
            delayInMinutes: 1,
            periodInMinutes: parseInt(interval, 10)
        });
        await logger.info(`Created/updated auto-sync alarm with interval: ${interval} minutes.`);
    } else {
        // If auto-sync is disabled, make sure the alarm is cleared
        chrome.alarms.clear('daily-webdav-sync', (wasCleared) => {
             if (wasCleared) {
                logger.info('Auto-sync is disabled, clearing any existing alarms.');
             }
        });
    }
}


// Initial setup of alarms on startup
chrome.runtime.onStartup.addListener(() => {
    setupAlarms();
    triggerAutoSync(); // Also trigger a sync on startup
});

// Also setup alarms when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    setupAlarms();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'daily-webdav-sync') {
    // Use an IIFE to use async/await here.
    (async () => {
        await logger.info(`Alarm '${alarm.name}' triggered, starting auto-sync.`);
        await triggerAutoSync();
    })();
  }
});
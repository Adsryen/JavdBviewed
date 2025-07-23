// background.js
// 负责长驻任务、WebDAV网络请求、消息转发等

import { createClient } from 'webdav';
import { getValue, setValue, getSettings, saveSettings } from '../utils/storage.js';
import { STORAGE_KEYS } from '../utils/config.js';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/xhr.js';

// Force axios to use the XHR adapter in the service worker environment.
axios.defaults.adapter = httpAdapter;

async function performUpload() {
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        return { success: false, error: "WebDAV is not enabled or URL is not configured." };
    }

    const client = createClient(settings.webdav.url, {
        username: settings.webdav.username,
        password: settings.webdav.password
    });

    try {
        const recordsToSync = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
        const dataToExport = {
            settings: settings,
            data: recordsToSync
        };
        const date = new Date().toISOString().split('T')[0];
        const filename = `/javdb-extension-backup-${date}.json`;
        
        await client.putFileContents(filename, JSON.stringify(dataToExport, null, 2), { overwrite: true });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function performRestore(filename) {
    const settings = await getSettings();
    if (!settings.webdav.enabled || !settings.webdav.url) {
        return { success: false, error: "WebDAV is not enabled or URL is not configured." };
    }

    const client = createClient(settings.webdav.url, {
        username: settings.webdav.username,
        password: settings.webdav.password
    });

    try {
        const fileContents = await client.getFileContents(filename, { format: "text" });
        const importData = JSON.parse(fileContents);
        
        if (importData.settings && importData.data) {
            await saveSettings(importData.settings);
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
        } else {
            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'webdav-upload') {
        performUpload().then(sendResponse);
        return true; 
    } else if (message.type === 'webdav-restore') {
        performRestore(message.filename).then(sendResponse);
        return true; 
    }
});

async function triggerAutoSync() {
    const settings = await getSettings();
    if (settings.webdav.enabled && settings.webdav.autoSync) {
        console.log('Performing daily auto-sync...');
        const response = await performUpload();
        if (response && response.success) {
            console.log('Daily auto-sync successful.');
        } else {
            console.error('Daily auto-sync failed:', response ? response.error : 'No response.');
        }
    }
}

// Set up a daily alarm for auto-sync
chrome.alarms.create('daily-webdav-sync', {
  delayInMinutes: 1, // Start 1 minute after browser startup
  periodInMinutes: 1440 // Repeat every 24 hours
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'daily-webdav-sync') {
    triggerAutoSync();
  }
});

chrome.runtime.onStartup.addListener(() => {
    triggerAutoSync();
}); 
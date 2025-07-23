// background.js
// 负责长驻任务、WebDAV网络请求、消息转发等

import { createClient } from 'webdav';
import { Browser } from 'webdav/adapter';
import { getValue, setValue, getSettings, saveSettings } from '../utils/storage.js';
import { STORAGE_KEYS } from '../utils/config.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    async function handleWebdav() {
        const settings = await getSettings();
        if (!settings.webdav.enabled) {
            sendResponse({ success: false, error: "WebDAV is not enabled." });
            return;
        }

        const client = createClient(settings.webdav.url, {
            username: settings.webdav.username,
            password: settings.webdav.password,
            adapter: new Browser()
        });

        if (message.type === 'webdav-upload') {
            try {
                const recordsToSync = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
                const dataToExport = {
                    settings: settings,
                    data: recordsToSync
                };

                const date = new Date().toISOString().split('T')[0];
                const filename = `/javdb-extension-backup-${date}.json`;
                
                await client.putFileContents(filename, JSON.stringify(dataToExport, null, 2), { overwrite: true });
                sendResponse({ success: true });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        } else if (message.type === 'webdav-restore') {
            try {
                const fileContents = await client.getFileContents(message.filename, { format: "text" });
                const importData = JSON.parse(fileContents);
                
                if (importData.settings && importData.data) {
                    await saveSettings(importData.settings);
                    await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
                } else {
                    // Legacy format, just data
                    await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
                }
                sendResponse({ success: true });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        }
    }

    if (message.type.startsWith('webdav-')) {
        handleWebdav();
        return true; 
    }
});

async function triggerAutoSync() {
    const settings = await getSettings();
    if (settings.webdav.enabled && settings.webdav.autoSync) {
        console.log('Performing daily auto-sync...');
        chrome.runtime.sendMessage({ type: 'webdav-upload' }, (response) => {
            if (response && response.success) {
                console.log('Daily auto-sync successful.');
            } else {
                console.error('Daily auto-sync failed:', response ? response.error : 'No response.');
            }
        });
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
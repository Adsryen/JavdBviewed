// storage.js
// 封装 chrome.storage，兼容 GM_setValue/GM_getValue

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './config.js';

export function setValue(key, value) {
  return chrome.storage.local.set({ [key]: value });
}

export function getValue(key, defaultValue) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}

export async function getSettings() {
    const storedSettings = await getValue(STORAGE_KEYS.SETTINGS, {});
    // Deep merge to ensure all nested properties from default are present
    return {
        ...DEFAULT_SETTINGS,
        ...storedSettings,
        display: {
            ...DEFAULT_SETTINGS.display,
            ...(storedSettings.display || {}),
        },
        webdav: {
            ...DEFAULT_SETTINGS.webdav,
            ...(storedSettings.webdav || {}),
        },
    };
}

export function saveSettings(settings) {
    return setValue(STORAGE_KEYS.SETTINGS, settings);
} 
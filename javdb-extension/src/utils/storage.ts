// storage.ts
// 封装 chrome.storage，兼容 GM_setValue/GM_getValue

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './config';
import type { ExtensionSettings } from '../types';

export function setValue<T>(key: string, value: T): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}

export function getValue<T>(key: string, defaultValue: T): Promise<T> {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}

export async function getSettings(): Promise<ExtensionSettings> {
    const storedSettings = await getValue<Partial<ExtensionSettings>>(STORAGE_KEYS.SETTINGS, {});
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
        dataSync: {
            ...DEFAULT_SETTINGS.dataSync,
            ...(storedSettings.dataSync || {}),
        },
    };
}

export function saveSettings(settings: ExtensionSettings): Promise<void> {
    return setValue(STORAGE_KEYS.SETTINGS, settings);
} 
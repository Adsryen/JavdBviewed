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
    console.log('Loading settings from storage:', {
        key: STORAGE_KEYS.SETTINGS,
        hasStoredSettings: !!storedSettings,
        hasPrivacy: !!storedSettings.privacy
    });

    // Deep merge to ensure all nested properties from default are present
    const mergedSettings = {
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
            urls: {
                ...DEFAULT_SETTINGS.dataSync.urls,
                ...(storedSettings.dataSync?.urls || {}),
            },
        },
        dataEnhancement: {
            ...DEFAULT_SETTINGS.dataEnhancement,
            ...(storedSettings.dataEnhancement || {}),
        },
        userExperience: {
            ...DEFAULT_SETTINGS.userExperience,
            ...(storedSettings.userExperience || {}),
        },
        contentFilter: {
            ...DEFAULT_SETTINGS.contentFilter,
            ...(storedSettings.contentFilter || {}),
        },
        drive115: {
            ...DEFAULT_SETTINGS.drive115,
            ...(storedSettings.drive115 || {}),
        },
        actorSync: {
            ...DEFAULT_SETTINGS.actorSync,
            ...(storedSettings.actorSync || {}),
            urls: {
                ...DEFAULT_SETTINGS.actorSync.urls,
                ...(storedSettings.actorSync?.urls || {}),
            },
        },
        privacy: {
            ...DEFAULT_SETTINGS.privacy,
            ...(storedSettings.privacy || {}),
            screenshotMode: {
                ...DEFAULT_SETTINGS.privacy.screenshotMode,
                ...(storedSettings.privacy?.screenshotMode || {}),
            },
            privateMode: {
                ...DEFAULT_SETTINGS.privacy.privateMode,
                ...(storedSettings.privacy?.privateMode || {}),
            },
            passwordRecovery: {
                ...DEFAULT_SETTINGS.privacy.passwordRecovery,
                ...(storedSettings.privacy?.passwordRecovery || {}),
            },
        },
    };

    console.log('Merged settings privacy config:', mergedSettings.privacy);
    return mergedSettings;
}

export function saveSettings(settings: ExtensionSettings): Promise<void> {
    console.log('Saving settings to storage:', {
        key: STORAGE_KEYS.SETTINGS,
        hasPrivacy: !!settings.privacy,
        screenshotModeEnabled: settings.privacy?.screenshotMode?.enabled,
        protectedElementsCount: settings.privacy?.screenshotMode?.protectedElements?.length
    });
    return setValue(STORAGE_KEYS.SETTINGS, settings);
}
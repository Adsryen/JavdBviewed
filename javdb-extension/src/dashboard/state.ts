import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/config';
import type { ExtensionSettings, VideoRecord, LogEntry } from '../types';
import { logAsync } from './logger';
import { showMessage } from './ui/toast';

// --- Global State & Utilities ---

export interface DashboardState {
    settings: ExtensionSettings;
    records: VideoRecord[];
    logs: LogEntry[];
    isInitialized: boolean;
}

export const STATE: DashboardState = {
    settings: DEFAULT_SETTINGS,
    records: [],
    logs: [],
    isInitialized: false,
};

export async function initializeGlobalState(): Promise<void> {
    if (STATE.isInitialized) return;

    try {
        let settings = await getValue<ExtensionSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

        // --- Settings Migration Logic ---
        let settingsChanged = false;

        // --- Version Sync Logic ---
        const actualVersion = import.meta.env.VITE_APP_VERSION || 'N/A';
        if (settings.version !== actualVersion) {
            settings.version = actualVersion;
            settingsChanged = true;
            await logAsync('INFO', `版本号已更新到: ${actualVersion}`);
        }
        // --- End Version Sync Logic ---
        if (settings.searchEngines && Array.isArray(settings.searchEngines)) {
            const migratedEngines = settings.searchEngines.map((engine: any) => {
                let currentEngine = { ...engine };
                let hasChanged = false;

                // 1. Migrate from iconUrl to icon
                if (currentEngine.iconUrl && !currentEngine.icon) {
                    currentEngine.icon = currentEngine.iconUrl;
                    delete currentEngine.iconUrl;
                    hasChanged = true;
                }

                // 2. Correct the icon path for default engines if they are using a remote URL
                if (currentEngine.name === 'JavDB' && currentEngine.icon !== 'assets/favicon-32x32.png') {
                    currentEngine.icon = 'assets/favicon-32x32.png';
                    hasChanged = true;
                }
                if (currentEngine.name === 'Javbus' && currentEngine.icon !== 'assets/javbus.ico') {
                    currentEngine.icon = 'assets/javbus.ico';
                    hasChanged = true;
                }

                // 3. Ensure ID exists
                if (!currentEngine.id) {
                    currentEngine.id = `engine-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    hasChanged = true;
                }

                if(hasChanged) {
                    settingsChanged = true;
                }
                return currentEngine;
            });


            if (settingsChanged) {
                settings.searchEngines = migratedEngines;
            }
        }
        // --- End Migration Logic ---

        // Save settings if any changes were made
        if (settingsChanged) {
            await setValue(STORAGE_KEYS.SETTINGS, settings);
            await logAsync('INFO', '设置已更新并保存。');
        }

        STATE.settings = settings;

        try {
            const recordsData = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
            // 确保 recordsData 是对象且 Object.values 返回数组
            if (recordsData && typeof recordsData === 'object') {
                STATE.records = Object.values(recordsData);
            } else {
                console.warn('记录数据格式不正确:', recordsData);
                STATE.records = [];
            }

            // 确保 STATE.records 是数组
            if (!Array.isArray(STATE.records)) {
                console.warn('STATE.records 不是数组，重置为空数组:', STATE.records);
                STATE.records = [];
            }
        } catch (error) {
            console.error('加载记录数据失败:', error);
            STATE.records = [];
        }

        try {
            const logsData = await getValue<LogEntry[]>(STORAGE_KEYS.LOGS, []);
            // 确保 logsData 是数组
            if (Array.isArray(logsData)) {
                STATE.logs = logsData;
            } else {
                console.warn('日志数据不是数组格式:', logsData);
                STATE.logs = [];
            }
        } catch (error) {
            console.error('加载日志数据失败:', error);
            STATE.logs = [];
        }
    } catch (error: any) {
        console.error("Failed to initialize global state:", error);
        showMessage(`Failed to load settings: ${error.message}`, 'error');
        // 确保在出错时也有安全的默认值
        STATE.records = [];
        STATE.logs = [];
    }
    STATE.isInitialized = true;
    console.log("Global state initialized.", STATE);
} 
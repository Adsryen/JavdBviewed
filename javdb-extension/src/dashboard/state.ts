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
                await setValue(STORAGE_KEYS.SETTINGS, settings);
                await logAsync('INFO', '成功迁移并修正了搜索引擎设置。');
            }
        }
        // --- End Migration Logic ---

        STATE.settings = settings;

        const recordsData = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
        STATE.records = Object.values(recordsData);

        const logsData = await getValue<LogEntry[]>(STORAGE_KEYS.LOGS, []);
        STATE.logs = logsData;
    } catch (error: any) {
        console.error("Failed to initialize global state:", error);
        showMessage(`Failed to load settings: ${error.message}`, 'error');
    }
    STATE.isInitialized = true;
    console.log("Global state initialized.", STATE);
} 
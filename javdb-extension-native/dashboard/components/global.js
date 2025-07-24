import { getSettings as storageGetSettings, saveSettings as storageSaveSettings, getValue, setValue } from '../../storage.js';
import { STORAGE_KEYS, VIDEO_STATUS, DEFAULT_SETTINGS } from '../../config.js';

const STATE = {
    settings: DEFAULT_SETTINGS,
    records: [],
    isInitialized: false,
};

/**
 * Initializes the global state by loading settings and records from storage.
 * This must be called before any other state function is used.
 */
export async function initializeGlobalState() {
    if (STATE.isInitialized) {
        return;
    }
    STATE.settings = await storageGetSettings();
    STATE.records = Object.values(await getValue(STORAGE_KEYS.VIEWED_RECORDS, {}));
    STATE.isInitialized = true;
    console.log("Global state initialized.", STATE);
}

/**
 * Returns the entire state object.
 * @returns {object} The global state.
 */
export function getState() {
    return STATE;
}

/**
 * Returns the current settings object.
 * @returns {object} The settings object.
 */
export function getSettings() {
    return STATE.settings;
}

/**
 * Returns the array of viewed records.
 * @returns {Array<object>} The records array.
 */
export function getRecords() {
    return STATE.records;
}

/**
 * Saves the entire settings object to storage and updates the local state.
 * @param {object} newSettings - The new settings object to save.
 */
export async function saveSettings(newSettings) {
    await storageSaveSettings(newSettings);
    STATE.settings = newSettings;
}

/**
 * Updates a single record in the storage and local state.
 * @param {string} uid - The unique ID of the record.
 * @param {object} recordData - The new data for the record.
 */
export async function updateRecord(uid, recordData) {
    const allRecords = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
    allRecords[uid] = recordData;
    await setValue(STORAGE_KEYS.VIEWED_RECORDS, allRecords);
    
    // Update local state as well
    const recordIndex = STATE.records.findIndex(r => r.uid === uid);
    if (recordIndex > -1) {
        STATE.records[recordIndex] = recordData;
    } else {
        STATE.records.push(recordData);
    }
} 
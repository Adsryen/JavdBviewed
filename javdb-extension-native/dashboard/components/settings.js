import { getSettings, saveSettings } from './global.js';
import { showMessage } from '../../lib/utils.js';

// --- DOM Element Cache ---
let webdavEnabled, webdavUrl, webdavUser, webdavPass, webdavAutoSync, webdavSyncInterval,
    saveWebdavSettingsBtn, testWebdavConnectionBtn, lastSyncTime,
    hideViewed, hideBrowsed, hideVR,
    searchEngineList, addSearchEngineBtn;

/**
 * Initializes the Settings tab functionality.
 */
export function init() {
    cacheDOMElements();
    loadSettings();
    attachEventListeners();
}

/**
 * Caches all necessary DOM elements for the settings tab.
 */
function cacheDOMElements() {
    webdavEnabled = document.getElementById('webdavEnabled');
    webdavUrl = document.getElementById('webdavUrl');
    webdavUser = document.getElementById('webdavUser');
    webdavPass = document.getElementById('webdavPass');
    webdavAutoSync = document.getElementById('webdavAutoSync');
    webdavSyncInterval = document.getElementById('webdav-sync-interval');
    saveWebdavSettingsBtn = document.getElementById('saveWebdavSettings');
    testWebdavConnectionBtn = document.getElementById('testWebdavConnection');
    lastSyncTime = document.getElementById('last-sync-time');
    
    hideViewed = document.getElementById('hideViewed');
    hideBrowsed = document.getElementById('hideBrowsed');
    hideVR = document.getElementById('hideVR');

    searchEngineList = document.getElementById('search-engine-list');
    addSearchEngineBtn = document.getElementById('add-search-engine');
}

/**
 * Loads the current settings from global state and populates the form fields.
 */
function loadSettings() {
    const settings = getSettings();

    // WebDAV
    webdavEnabled.checked = settings.webdav.enabled;
    webdavUrl.value = settings.webdav.url;
    webdavUser.value = settings.webdav.username;
    webdavPass.value = settings.webdav.password;
    webdavAutoSync.checked = settings.webdav.autoSync;
    webdavSyncInterval.value = settings.webdav.syncInterval;
    lastSyncTime.textContent = settings.webdav.lastSync ? new Date(settings.webdav.lastSync).toLocaleString() : 'Never';
    document.getElementById('webdav-fields-container').style.display = settings.webdav.enabled ? 'block' : 'none';

    // Display
    hideViewed.checked = settings.display.hideViewed;
    hideBrowsed.checked = settings.display.hideBrowsed;
    hideVR.checked = settings.display.hideVR;

    // Search Engines
    renderSearchEngines();
}

/**
 * Attaches all event listeners for the settings tab.
 */
function attachEventListeners() {
    saveWebdavSettingsBtn.addEventListener('click', handleSaveSettings);
    webdavEnabled.addEventListener('change', () => {
        document.getElementById('webdav-fields-container').style.display = webdavEnabled.checked ? 'block' : 'none';
    });
    testWebdavConnectionBtn.addEventListener('click', handleTestWebDAV);
    
    hideViewed.addEventListener('change', handleSaveSettings);
    hideBrowsed.addEventListener('change', handleSaveSettings);
    hideVR.addEventListener('change', handleSaveSettings);

    addSearchEngineBtn.addEventListener('click', handleAddSearchEngine);
    searchEngineList.addEventListener('click', handleSearchEngineListClick);
}

/**
 * Handles saving all settings.
 */
async function handleSaveSettings() {
    const currentSettings = getSettings();
    const newSettings = {
        ...currentSettings,
        webdav: {
            enabled: webdavEnabled.checked,
            url: webdavUrl.value.trim(),
            username: webdavUser.value.trim(),
            password: webdavPass.value,
            autoSync: webdavAutoSync.checked,
            syncInterval: parseInt(webdavSyncInterval.value, 10),
            lastSync: currentSettings.webdav.lastSync // Preserve last sync time
        },
        display: {
            hideViewed: hideViewed.checked,
            hideBrowsed: hideBrowsed.checked,
            hideVR: hideVR.checked
        },
        // searchEngines are handled separately
    };
    
    await saveSettings(newSettings);
    // Potentially notify background script to reset alarms
    chrome.runtime.sendMessage({ type: 'setup-alarms' });
    showMessage('Settings saved successfully!');
}

/**
 * Handles the WebDAV connection test.
 */
function handleTestWebDAV() {
    // Save settings before testing
    handleSaveSettings().then(() => {
        testWebdavConnectionBtn.textContent = 'Testing...';
        testWebdavConnectionBtn.disabled = true;
        chrome.runtime.sendMessage({ type: 'webdav-test' }, response => {
            if (response.success) {
                showMessage('WebDAV connection successful!');
            } else {
                showMessage(`WebDAV connection failed: ${response.error}`, 'error');
            }
            testWebdavConnectionBtn.textContent = 'Test Connection';
            testWebdavConnectionBtn.disabled = false;
        });
    });
}

/**
 * Renders the list of custom search engines.
 */
function renderSearchEngines() {
    const settings = getSettings();
    searchEngineList.innerHTML = '';
    settings.searchEngines.forEach((engine, index) => {
        const div = document.createElement('div');
        div.className = 'search-engine-item';
        div.innerHTML = `
            <input type="text" value="${engine.name}" class="search-engine-name" data-index="${index}" placeholder="Name">
            <input type="text" value="${engine.url}" class="search-engine-url" data-index="${index}" placeholder="URL with {{ID}}">
            <label>
                <input type="radio" name="default-search-engine" ${engine.isDefault ? 'checked' : ''} data-index="${index}"> Default
            </label>
            <button class="button-like danger" data-action="delete" data-index="${index}"><i class="fas fa-trash"></i></button>
        `;
        searchEngineList.appendChild(div);
    });
}

/**
 * Handles adding a new search engine.
 */
async function handleAddSearchEngine() {
    const settings = getSettings();
    settings.searchEngines.push({ name: '', url: '', isDefault: settings.searchEngines.length === 0 });
    await saveSettings(settings);
    renderSearchEngines();
}

/**
 * Handles clicks within the search engine list (delete, set default, update).
 */
async function handleSearchEngineListClick(event) {
    const target = event.target;
    const action = target.dataset.action || (target.closest('button') || {}).dataset.action;
    const index = parseInt(target.dataset.index || (target.closest('[data-index]') || {}).dataset.index, 10);

    if (isNaN(index)) return;
    
    const settings = getSettings();

    if (action === 'delete') {
        settings.searchEngines.splice(index, 1);
        if (settings.searchEngines.length > 0 && !settings.searchEngines.some(e => e.isDefault)) {
            settings.searchEngines[0].isDefault = true; // Ensure there's always a default
        }
    } else {
        // Handle changes in name, URL, or default status
        const nameInputs = searchEngineList.querySelectorAll('.search-engine-name');
        const urlInputs = searchEngineList.querySelectorAll('.search-engine-url');
        const defaultRadios = searchEngineList.querySelectorAll('input[type="radio"]');

        settings.searchEngines.forEach((engine, i) => {
            engine.name = nameInputs[i].value.trim();
            engine.url = urlInputs[i].value.trim();
            engine.isDefault = defaultRadios[i].checked;
        });
        
        // Ensure only one default
        if (target.type === 'radio') {
            settings.searchEngines.forEach((engine, i) => engine.isDefault = (i === index));
        }
    }

    await saveSettings(settings);
    // Re-render to reflect potential default changes if one was deleted
    if(action === 'delete') renderSearchEngines(); 
    showMessage('Search engine settings updated.');
} 
import { STATE } from '../state';
import { saveSettings } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import type { ExtensionSettings } from '../../types';

// Import updateSyncStatus function
declare function updateSyncStatus(): void;

export function initSettingsTab(): void {
    const webdavEnabled = document.getElementById('webdavEnabled') as HTMLInputElement;
    const webdavUrl = document.getElementById('webdavUrl') as HTMLInputElement;
    const webdavUser = document.getElementById('webdavUser') as HTMLInputElement;
    const webdavPass = document.getElementById('webdavPass') as HTMLInputElement;
    const webdavAutoSync = document.getElementById('webdavAutoSync') as HTMLInputElement;
    const webdavSyncInterval = document.getElementById('webdav-sync-interval') as HTMLInputElement;
    const saveWebdavSettingsBtn = document.getElementById('saveWebdavSettings') as HTMLButtonElement;
    const testWebdavConnectionBtn = document.getElementById('testWebdavConnection') as HTMLButtonElement;
    const lastSyncTime = document.getElementById('last-sync-time') as HTMLSpanElement;

    const hideViewed = document.getElementById('hideViewed') as HTMLInputElement;
    const hideBrowsed = document.getElementById('hideBrowsed') as HTMLInputElement;
    const hideVR = document.getElementById('hideVR') as HTMLInputElement;

    const maxLogEntries = document.getElementById('maxLogEntries') as HTMLInputElement;

    function renderSearchEngines() {
        const searchEngineList = document.getElementById('search-engine-list') as HTMLDivElement;
        if (!searchEngineList) return;

        searchEngineList.innerHTML = ''; // Clear existing entries

        STATE.settings.searchEngines?.forEach((engine, index) => {
            if (!engine) {
                console.warn('Skipping invalid search engine entry at index:', index, engine);
                return; // Skips the current iteration
            }

            const engineDiv = document.createElement('div');
            engineDiv.className = 'search-engine-item';

            const iconSrc = engine.icon.startsWith('assets/')
                ? chrome.runtime.getURL(engine.icon)
                : engine.icon || 'assets/icon.png';

            engineDiv.innerHTML = `
                <div class="icon-preview">
                    <img src="${iconSrc}" alt="${engine.name}" onerror="this.onerror=null; this.src='${chrome.runtime.getURL('assets/icon.png')}';">
                </div>
                <input type="text" value="${engine.name}" class="name-input" data-index="${index}" placeholder="名称">
                <input type="text" value="${engine.urlTemplate}" class="url-template-input" data-index="${index}" placeholder="URL 模板">
                <input type="text" value="${engine.icon}" class="icon-url-input" data-index="${index}" placeholder="Icon URL">
                <div class="actions-container">
                    <button class="button-like danger delete-engine" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            searchEngineList.appendChild(engineDiv);
        });
    }

    function updateSearchEnginesFromUI() {
        const searchEngineList = document.getElementById('search-engine-list') as HTMLDivElement;
        const nameInputs = searchEngineList.querySelectorAll<HTMLInputElement>('.name-input');
        const urlInputs = searchEngineList.querySelectorAll<HTMLInputElement>('.url-template-input');
        const iconUrlInputs = searchEngineList.querySelectorAll<HTMLInputElement>('.icon-url-input');
        
        const newEngines: any[] = [];
        nameInputs.forEach((nameInput, index) => {
            const urlInput = urlInputs[index];
            const iconUrlInput = iconUrlInputs[index];
            if (nameInput.value && urlInput.value) {
                const originalEngine = STATE.settings.searchEngines[index] || {};
                newEngines.push({
                    id: originalEngine.id || `engine-${Date.now()}-${index}`,
                    name: nameInput.value,
                    urlTemplate: urlInput.value,
                    icon: iconUrlInput.value || ''
                });
            }
        });
        STATE.settings.searchEngines = newEngines;
    }

    function loadSettings() {
        const { webdav, display, logging, searchEngines } = STATE.settings;
        webdavEnabled.checked = webdav.enabled;
        webdavUrl.value = webdav.url;
        webdavUser.value = webdav.username;
        webdavPass.value = webdav.password;
        webdavAutoSync.checked = webdav.autoSync;
        webdavSyncInterval.value = String(webdav.syncInterval);
        lastSyncTime.textContent = webdav.lastSync ? new Date(webdav.lastSync).toLocaleString() : 'Never';

        // 更新UI状态
        updateWebDAVControlsState();
        (document.getElementById('webdav-fields-container') as HTMLDivElement).style.display = webdav.enabled ? 'block' : 'none';

        hideViewed.checked = display.hideViewed;
        hideBrowsed.checked = display.hideBrowsed;
        hideVR.checked = display.hideVR;

        maxLogEntries.value = String(logging?.maxLogEntries || 1500);

        if (searchEngines) {
            renderSearchEngines();
        }
    }

    async function handleSaveSettings() {
        updateSearchEnginesFromUI(); // Update search engines from UI before saving
        const newSettings: ExtensionSettings = {
            ...STATE.settings,
            webdav: {
                enabled: webdavEnabled.checked,
                url: webdavUrl.value.trim(),
                username: webdavUser.value.trim(),
                password: webdavPass.value,
                autoSync: webdavAutoSync.checked,
                syncInterval: parseInt(webdavSyncInterval.value, 10),
                lastSync: STATE.settings.webdav.lastSync
            },
            display: {
                hideViewed: hideViewed.checked,
                hideBrowsed: hideBrowsed.checked,
                hideVR: hideVR.checked
            },
            logging: {
                maxLogEntries: parseInt(maxLogEntries.value, 10) || 1500,
            },
            searchEngines: STATE.settings.searchEngines,
            version: import.meta.env.VITE_APP_VERSION || STATE.settings.version
        };
        await saveSettings(newSettings);
        STATE.settings = newSettings;
        chrome.runtime.sendMessage({ type: 'setup-alarms' });

        // 通知所有JavDB标签页设置已更新
        chrome.tabs.query({ url: '*://javdb.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { type: 'settings-updated' });
                }
            });
        });

        showMessage('Settings saved successfully!');
        logAsync('INFO', '用户设置已保存。', { settings: newSettings });

        // Update sync status display
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus();
        }
    }

    function handleTestWebDAV() {
        logAsync('INFO', '用户点击了“测试 WebDAV 连接”按钮。');
        handleSaveSettings().then(() => {
            testWebdavConnectionBtn.textContent = 'Testing...';
            testWebdavConnectionBtn.disabled = true;
            chrome.runtime.sendMessage({ type: 'webdav-test' }, response => {
                if (response.success) {
                    showMessage('WebDAV connection successful!');
                    logAsync('INFO', 'WebDAV 连接测试成功。');
                } else {
                    showMessage(`WebDAV connection failed: ${response.error}`, 'error');
                    logAsync('ERROR', 'WebDAV 连接测试失败。', { error: response.error });
                }
                testWebdavConnectionBtn.textContent = 'Test Connection';
                testWebdavConnectionBtn.disabled = false;
            });
        });
    }

    // 更新WebDAV控件状态的函数
    function updateWebDAVControlsState() {
        const webdavSubControls = document.getElementById('webdavSubControls');
        if (webdavSubControls) {
            if (webdavEnabled.checked) {
                webdavSubControls.classList.add('enabled');
            } else {
                webdavSubControls.classList.remove('enabled');
            }
        }
    }

    saveWebdavSettingsBtn.addEventListener('click', handleSaveSettings);
    webdavEnabled.addEventListener('change', () => {
        updateWebDAVControlsState();
        (document.getElementById('webdav-fields-container') as HTMLDivElement).style.display = webdavEnabled.checked ? 'block' : 'none';
    });
    testWebdavConnectionBtn.addEventListener('click', handleTestWebDAV);
    
    hideViewed.addEventListener('change', handleSaveSettings);
    hideBrowsed.addEventListener('change', handleSaveSettings);
    hideVR.addEventListener('change', handleSaveSettings);
    maxLogEntries.addEventListener('change', handleSaveSettings);

    const addSearchEngineBtn = document.getElementById('add-search-engine');
    addSearchEngineBtn?.addEventListener('click', () => {
        const newEngine = {
            id: `engine-${Date.now()}`,
            name: 'New Engine',
            urlTemplate: 'https://example.com/search?q={{ID}}',
            icon: 'https://www.google.com/s2/favicons?domain=example.com'
        };
        STATE.settings.searchEngines.push(newEngine);
        logAsync('INFO', '用户添加了一个新的搜索引擎。', { engine: newEngine });
        renderSearchEngines();
        handleSaveSettings();
    });

    const searchEngineList = document.getElementById('search-engine-list');
    searchEngineList?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const removeButton = target.closest('.delete-engine');
        if (removeButton) {
            const index = parseInt(removeButton.getAttribute('data-index')!, 10);
            const removedEngine = STATE.settings.searchEngines[index];
            logAsync('INFO', '用户删除了一个搜索引擎。', { engine: removedEngine });
            STATE.settings.searchEngines.splice(index, 1);
            renderSearchEngines();
            handleSaveSettings();
        }
    });

    searchEngineList?.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.classList.contains('name-input') || target.classList.contains('url-template-input') || target.classList.contains('icon-url-input')) {
            handleSaveSettings();
        }
    });

    loadSettings();
} 
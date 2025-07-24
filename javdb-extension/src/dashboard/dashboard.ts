import { getSettings, saveSettings, getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, VIDEO_STATUS, DEFAULT_SETTINGS } from '../utils/config';
import type { ExtensionSettings, VideoRecord, VideoStatus } from '../types';

// --- Global State & Utilities ---

interface DashboardState {
    settings: ExtensionSettings;
    records: VideoRecord[];
    isInitialized: boolean;
}

const STATE: DashboardState = {
    settings: DEFAULT_SETTINGS,
    records: [],
    isInitialized: false,
};

async function initializeGlobalState(): Promise<void> {
    if (STATE.isInitialized) return;
    STATE.settings = await getSettings();
    const recordsData = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
    STATE.records = Object.values(recordsData);
    STATE.isInitialized = true;
    console.log("Global state initialized.", STATE);
}

function showMessage(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
    const container = document.getElementById('message-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// --- Tab Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    await initializeGlobalState();
    initTabs();
    initRecordsTab();
    initSettingsTab();
    initAdvancedSettingsTab();
    initLogsTab();
});

function initTabs(): void {
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    const switchTab = (tabButton: Element | null) => {
        if (!tabButton) return;
        const tabId = tabButton.getAttribute('data-tab');
        if (!tabId) return;

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tabButton.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        if (history.pushState) {
            history.pushState(null, '', `#${tabId}`);
        } else {
            location.hash = `#${tabId}`;
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab));
    });

    const currentHash = window.location.hash.substring(1) || 'tab-records';
    const targetTab = document.querySelector(`.tab-link[data-tab="${currentHash}"]`);
    switchTab(targetTab || tabs[0]);
}

// --- Records Tab ---

function initRecordsTab(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const filterSelect = document.getElementById('filterSelect') as HTMLSelectElement;
    const videoList = document.getElementById('videoList') as HTMLUListElement;
    const paginationContainer = document.querySelector('.pagination') as HTMLDivElement;

    if (!searchInput || !videoList) return;

    let currentPage = 1;
    const recordsPerPage = 20;
    let filteredRecords: VideoRecord[] = [];

    function updateFilteredRecords() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value as 'all' | VideoStatus;

        filteredRecords = STATE.records.filter(record => {
            const matchesSearch = !searchTerm ||
                record.id.toLowerCase().includes(searchTerm) ||
                record.title.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' || record.status === filterValue;
            return matchesSearch && matchesFilter;
        });
    }

    function renderVideoList() {
        videoList.innerHTML = '';
        if (filteredRecords.length === 0) {
            videoList.innerHTML = '<li class="empty-list">No records match your criteria.</li>';
            return;
        }

        const startIndex = (currentPage - 1) * recordsPerPage;
        const recordsToRender = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

        const searchEngine = STATE.settings.searchEngines[0];

        recordsToRender.forEach(record => {
            const li = document.createElement('li');
            li.className = 'video-item';
            const searchUrl = searchEngine ? searchEngine.urlTemplate.replace('{{ID}}', encodeURIComponent(record.id)) : '#';

            li.innerHTML = `
                <span class="video-id"><a href="${searchUrl}" target="_blank">${record.id}</a></span>
                <span class="video-title">${record.title}</span>
                <span class="video-status status-${record.status}">${record.status}</span>
            `;
            videoList.appendChild(li);
        });
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredRecords.length / recordsPerPage);
        if (pageCount <= 1) return;

        for (let i = 1; i <= pageCount; i++) {
            const button = document.createElement('button');
            button.textContent = String(i);
            button.className = `page-button ${i === currentPage ? 'active' : ''}`;
            button.addEventListener('click', () => {
                currentPage = i;
                render();
            });
            paginationContainer.appendChild(button);
        }
    }

    function render() {
        renderVideoList();
        renderPagination();
    }

    searchInput.addEventListener('input', () => { currentPage = 1; updateFilteredRecords(); render(); });
    filterSelect.addEventListener('change', () => { currentPage = 1; updateFilteredRecords(); render(); });

    updateFilteredRecords();
    render();
}

// --- Settings Tab ---

function initSettingsTab(): void {
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

    function loadSettings() {
        const { webdav, display } = STATE.settings;
        webdavEnabled.checked = webdav.enabled;
        webdavUrl.value = webdav.url;
        webdavUser.value = webdav.username;
        webdavPass.value = webdav.password;
        webdavAutoSync.checked = webdav.autoSync;
        webdavSyncInterval.value = String(webdav.syncInterval);
        lastSyncTime.textContent = webdav.lastSync ? new Date(webdav.lastSync).toLocaleString() : 'Never';
        (document.getElementById('webdav-fields-container') as HTMLDivElement).style.display = webdav.enabled ? 'block' : 'none';

        hideViewed.checked = display.hideViewed;
        hideBrowsed.checked = display.hideBrowsed;
        hideVR.checked = display.hideVR;
    }

    async function handleSaveSettings() {
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
            }
        };
        await saveSettings(newSettings);
        STATE.settings = newSettings;
        chrome.runtime.sendMessage({ type: 'setup-alarms' });
        showMessage('Settings saved successfully!');
    }

    function handleTestWebDAV() {
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

    saveWebdavSettingsBtn.addEventListener('click', handleSaveSettings);
    webdavEnabled.addEventListener('change', () => {
        (document.getElementById('webdav-fields-container') as HTMLDivElement).style.display = webdavEnabled.checked ? 'block' : 'none';
    });
    testWebdavConnectionBtn.addEventListener('click', handleTestWebDAV);
    
    hideViewed.addEventListener('change', handleSaveSettings);
    hideBrowsed.addEventListener('change', handleSaveSettings);
    hideVR.addEventListener('change', handleSaveSettings);

    loadSettings();
}

// --- Advanced Settings Tab ---

function initAdvancedSettingsTab(): void {
    const jsonConfigTextarea = document.getElementById('jsonConfig') as HTMLTextAreaElement;
    const editJsonBtn = document.getElementById('editJsonBtn') as HTMLButtonElement;
    const saveJsonBtn = document.getElementById('saveJsonBtn') as HTMLButtonElement;

    if (!jsonConfigTextarea) return;

    function loadJsonConfig() {
        jsonConfigTextarea.value = JSON.stringify(STATE.settings, null, 2);
    }

    function enableJsonEdit() {
        jsonConfigTextarea.readOnly = false;
        jsonConfigTextarea.focus();
        editJsonBtn.classList.add('hidden');
        saveJsonBtn.classList.remove('hidden');
        showMessage('JSON editing enabled. Be careful!', 'warn');
    }

    async function handleSaveJson() {
        try {
            const newSettings = JSON.parse(jsonConfigTextarea.value);
            await saveSettings(newSettings);
            STATE.settings = newSettings;
            
            jsonConfigTextarea.readOnly = true;
            saveJsonBtn.classList.add('hidden');
            editJsonBtn.classList.remove('hidden');
            
            showMessage('JSON configuration saved successfully. Page will reload.');
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            showMessage(`Error saving JSON: ${error.message}`, 'error');
        }
    }

    editJsonBtn.addEventListener('click', enableJsonEdit);
    saveJsonBtn.addEventListener('click', handleSaveJson);
    loadJsonConfig();
}

// --- Logs Tab ---

function initLogsTab(): void {
    const logLevelFilter = document.getElementById('log-level-filter') as HTMLSelectElement;
    const refreshButton = document.getElementById('refresh-logs-button') as HTMLButtonElement;
    const clearLogsButton = document.getElementById('clear-logs-button') as HTMLButtonElement;
    const logBody = document.getElementById('log-body') as HTMLTableSectionElement;

    if (!logLevelFilter || !logBody) return;

    let allLogs: any[] = [];

    const renderLogs = () => {
        const filterValue = logLevelFilter.value;
        logBody.innerHTML = '';
        if (allLogs.length === 0) {
            logBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No logs found.</td></tr>';
            return;
        }

        const filteredLogs = allLogs.filter(log => filterValue === 'ALL' || log.level === filterValue);

        for (const log of filteredLogs.slice().reverse()) {
            const row = logBody.insertRow();
            row.innerHTML = `
                <td class="timestamp">${new Date(log.timestamp).toLocaleString()}</td>
                <td class="level level-${log.level}">${log.level}</td>
                <td class="message">${log.message}</td>
                <td class="data">${log.data ? `<pre>${JSON.stringify(log.data, null, 2)}</pre>` : ''}</td>
            `;
        }
    };

    const fetchLogs = () => {
        chrome.runtime.sendMessage({ type: 'get-logs' }, response => {
            if (response?.success) {
                allLogs = response.logs || [];
                renderLogs();
            } else {
                showMessage('Failed to fetch logs.', 'error');
            }
        });
    };

    const clearLogs = () => {
        if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
            setValue(STORAGE_KEYS.LOGS, []).then(() => {
                showMessage('Logs cleared successfully.');
                fetchLogs();
            });
        }
    };
    
    logLevelFilter.addEventListener('change', renderLogs);
    refreshButton.addEventListener('click', fetchLogs);
    clearLogsButton.addEventListener('click', clearLogs);

    fetchLogs();
} 
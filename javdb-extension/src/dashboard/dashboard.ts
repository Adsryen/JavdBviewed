// @ts-nocheck

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
    const container = document.getElementById('messageContainer');
    if (!container) {
        console.error("Message container not found!");
        return;
    }

    const div = document.createElement('div');
    // Map 'warn' to 'info' and handle 'success' correctly for CSS classes
    const displayType = type === 'warn' ? 'info' : type;
    div.className = `toast toast-${displayType}`;
    div.textContent = message;

    // Add an icon based on the type
    const icon = document.createElement('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-info-circle';
    }
    div.prepend(icon);

    container.appendChild(div);

    // Trigger the animation
    setTimeout(() => {
        div.classList.add('show');
    }, 10); // A small delay to allow the element to be painted first

    // Set a timer to remove the toast
    setTimeout(() => {
        div.classList.remove('show');
        // Remove the element from DOM after transition ends
        div.addEventListener('transitionend', () => div.remove());
    }, 5000); // Keep the toast on screen for 5 seconds
}

// --- Tab Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    await initializeGlobalState();
    initTabs();
    initRecordsTab();
    initSettingsTab();
    initAdvancedSettingsTab();
    initLogsTab();
    initSidebarActions();
    initStatsOverview(); // Add this line
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

// --- Stats Overview ---
function initStatsOverview(): void {
    const container = document.getElementById('stats-overview');
    if (!container) return;

    const totalRecords = STATE.records.length;
    const viewedCount = STATE.records.filter(r => r.status === VIDEO_STATUS.VIEWED).length;
    const wantCount = STATE.records.filter(r => r.status === VIDEO_STATUS.WANT).length;
    const browsedCount = STATE.records.filter(r => r.status === VIDEO_STATUS.BROWSED).length;

    container.innerHTML = `
        <div>
            <span class="stat-value">${totalRecords}</span>
            <span class="stat-label">总记录</span>
        </div>
        <div>
            <span class="stat-value">${viewedCount}</span>
            <span class="stat-label">已观看</span>
        </div>
        <div>
            <span class="stat-value">${browsedCount}</span>
            <span class="stat-label">已浏览</span>
        </div>
        <div>
            <span class="stat-value">${wantCount}</span>
            <span class="stat-label">想看</span>
        </div>
    `;
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
    
        const createPageButton = (page: number | string, active: boolean = false, disabled: boolean = false) => {
            const button = document.createElement('button');
            button.textContent = String(page);
            if (typeof page === 'number') {
                button.className = `page-button ${active ? 'active' : ''}`;
                button.addEventListener('click', () => {
                    currentPage = page;
                    render();
                });
            } else {
                button.className = 'page-button ellipsis';
                disabled = true;
            }
            if (disabled) {
                button.disabled = true;
            }
            paginationContainer.appendChild(button);
        };
    
        const maxPagesToShow = 7; // Max number of page buttons to show (including ellipsis)
        if (pageCount <= maxPagesToShow) {
            for (let i = 1; i <= pageCount; i++) {
                createPageButton(i, i === currentPage);
            }
        } else {
            // Logic for lots of pages: 1 ... 4 5 6 ... 99
            let pages = new Set<number>();
            pages.add(1);
            pages.add(pageCount);
            pages.add(currentPage);
            for (let i = -1; i <= 1; i++) {
                if (currentPage + i > 0 && currentPage + i <= pageCount) {
                    pages.add(currentPage + i);
                }
            }
            
            let sortedPages = Array.from(pages).sort((a, b) => a - b);
            
            let lastPage: number | null = null;
            for (const page of sortedPages) {
                if (lastPage !== null && page - lastPage > 1) {
                    createPageButton('...');
                }
                createPageButton(page, page === currentPage);
                lastPage = page;
            }
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

// --- Sidebar Actions ---
function initSidebarActions(): void {
    const importFileInput = document.getElementById('importFile') as HTMLInputElement;
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify({ settings: STATE.settings, data: STATE.records }, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            showMessage('Data exported successfully.');
        });
    }
    
    if (importFileInput) {
        importFileInput.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    await applyImportedData(text);
                } else {
                    showMessage('Failed to read file content.', 'error');
                }
            };
            reader.onerror = () => {
                showMessage(`Error reading file: ${reader.error}`, 'error');
            };
            reader.readAsText(file);
        });
    }
}


// --- Unified Import/Export Logic ---

async function applyImportedData(jsonData: string): Promise<void> {
    try {
        const importData = JSON.parse(jsonData);
        let settingsChanged = false;
        let recordsChanged = false;

        if (importData.settings && typeof importData.settings === 'object') {
            await saveSettings(importData.settings);
            STATE.settings = await getSettings(); // Re-fetch to ensure deep merge
            settingsChanged = true;
        }

        // FIX: Handle both array and object data formats for records
        if (importData.data && typeof importData.data === 'object' && importData.data !== null) {
            let recordsToSave: Record<string, VideoRecord>;
            
            if (Array.isArray(importData.data)) {
                // Handle array format
                STATE.records = importData.data;
                recordsToSave = importData.data.reduce((acc: Record<string, VideoRecord>, record: VideoRecord) => {
                    if (record && record.id) {
                        acc[record.id] = record;
                    }
                    return acc;
                }, {});
            } else {
                // Handle object format
                recordsToSave = importData.data as Record<string, VideoRecord>;
                STATE.records = Object.values(importData.data);
            }

            await setValue(STORAGE_KEYS.VIEWED_RECORDS, recordsToSave);
            recordsChanged = true;
        }

        if (settingsChanged || recordsChanged) {
            showMessage('Data imported successfully. Page will reload to apply all changes.');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showMessage('Imported file does not contain valid "settings" or "data" fields.', 'warn');
        }
    } catch (error: any) {
        showMessage(`Error applying imported data: ${error.message}`, 'error');
        console.error('Error applying imported data:', error);
    }
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
    const exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
    const importJsonBtn = document.getElementById('importJsonBtn') as HTMLButtonElement;
    const importFileInput = document.getElementById('importFileInput') as HTMLInputElement;

    if (!jsonConfigTextarea || !editJsonBtn || !saveJsonBtn || !exportJsonBtn || !importJsonBtn || !importFileInput) {
        console.error("One or more elements for Advanced Settings not found. Aborting init.");
        return;
    }

    function loadJsonConfig() {
        jsonConfigTextarea.value = JSON.stringify({ settings: STATE.settings, data: STATE.records }, null, 2);
    }

    function enableJsonEdit() {
        jsonConfigTextarea.readOnly = false;
        jsonConfigTextarea.focus();
        editJsonBtn.classList.add('hidden');
        saveJsonBtn.classList.remove('hidden');
        showMessage('JSON editing enabled. Be careful!', 'warn');
    }

    async function handleSaveJson() {
        await applyImportedData(jsonConfigTextarea.value);
        // Reset the UI after attempting to save
        jsonConfigTextarea.readOnly = true;
        saveJsonBtn.classList.add('hidden');
        editJsonBtn.classList.remove('hidden');
    }
    
    function handleExportData() {
        const dataStr = jsonConfigTextarea.value;
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        showMessage('Current JSON data exported successfully.');
    }

    function handleFileSelectedForTextarea(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                jsonConfigTextarea.value = text;
                // Automatically enable editing after loading a file
                enableJsonEdit();
                showMessage('File loaded into editor. Review and click "Save JSON" to apply.', 'info');
            }
        };
        reader.readAsText(file);
    }

    editJsonBtn.addEventListener('click', enableJsonEdit);
    saveJsonBtn.addEventListener('click', handleSaveJson);
    exportJsonBtn.addEventListener('click', handleExportData);
    importJsonBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleFileSelectedForTextarea);
    
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
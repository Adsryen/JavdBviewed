// import './dashboard.css';
import { getSettings, saveSettings, getValue, setValue } from './storage.js';
import { STORAGE_KEYS, VIDEO_STATUS } from './config.js';
// import * as WebDAV from './lib/webdav.js';
// const { createClient } = WebDAV;
// import httpAdapter from 'axios/lib/adapters/xhr.js';
// import axios from 'axios';

// Force axios to use the XHR adapter in the browser environment.
// axios.defaults.adapter = httpAdapter;

const STATE = {
    settings: {},
    records: []
};

document.addEventListener('DOMContentLoaded', async () => {
    STATE.settings = await getSettings();
    
    // Populate WebDAV settings using existing IDs from dashboard.html
    const webdavEnabled = document.getElementById('webdavEnabled');
    const webdavUrl = document.getElementById('webdavUrl');
    const webdavUsername = document.getElementById('webdavUser');
    const webdavPassword = document.getElementById('webdavPass');
    const webdavAutoSync = document.getElementById('webdavAutoSync');
    // Assuming you will add an ID for sync interval
    const webdavSyncInterval = document.getElementById('webdav-sync-interval'); 
    const lastSyncTime = document.getElementById('last-sync-time');

    if (webdavEnabled) webdavEnabled.checked = STATE.settings.webdav?.enabled || false;
    if (webdavUrl) webdavUrl.value = STATE.settings.webdav?.url || '';
    if (webdavUsername) webdavUsername.value = STATE.settings.webdav?.username || '';
    if (webdavPassword) webdavPassword.value = STATE.settings.webdav?.password || '';
    if (webdavAutoSync) webdavAutoSync.checked = STATE.settings.webdav?.autoSync || false;
    if (webdavSyncInterval) webdavSyncInterval.value = STATE.settings.webdav?.syncInterval || 1440;
    if (lastSyncTime) lastSyncTime.textContent = STATE.settings.webdav?.lastSync ? new Date(STATE.settings.webdav.lastSync).toLocaleString() : 'Never';

    // Save WebDAV settings
    const saveButton = document.getElementById('saveWebdavSettings');
    if(saveButton) {
        saveButton.addEventListener('click', async () => {
            STATE.settings.webdav = {
                enabled: webdavEnabled.checked,
                url: webdavUrl.value,
                username: webdavUsername.value,
                password: webdavPassword.value,
                autoSync: webdavAutoSync.checked,
                syncInterval: webdavSyncInterval ? webdavSyncInterval.value : 1440
            };
            await saveSettings(STATE.settings);
            alert('Settings saved!');
            chrome.runtime.sendMessage({ type: 'setup-alarms' });
        });
    }

    // Test WebDAV connection
    const testButton = document.getElementById('testWebdavConnection');
    if (testButton) {
        testButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'webdav-test' }, response => {
                if (response.success) {
                    alert('Connection successful!');
                } else {
                    alert(`Connection failed: ${response.error}`);
                }
            });
        });
    }

    // Manual Sync from sidebar
    const manualSyncButton = document.getElementById('syncNow');
    if(manualSyncButton) {
        manualSyncButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'webdav-upload' }, response => {
                if (response.success) {
                    alert('Sync successful!');
                    if(lastSyncTime) lastSyncTime.textContent = new Date().toLocaleString();
                } else {
                    alert(`Sync failed: ${response.error}`);
                }
            });
        });
    }

    // Restore from Cloud from sidebar
    const restoreButton = document.getElementById('syncDown');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileList = document.getElementById('fileList');
    
    if(restoreButton) {
        restoreButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'webdav-list-files' }, response => {
                if (response.success && fileList) {
                    fileList.innerHTML = ''; // Clear previous list
                    response.files.forEach(file => {
                        const li = document.createElement('li');
                        li.textContent = `${file.name} - ${file.lastModified}`;
                        li.dataset.path = file.path;
                        li.style.cursor = 'pointer';
                        li.addEventListener('click', () => {
                            if (confirm(`Are you sure you want to restore from ${file.name}? This will overwrite your local data.`)) {
                                chrome.runtime.sendMessage({ type: 'webdav-restore', filename: file.path }, restoreResponse => {
                                    if (restoreResponse.success) {
                                        alert('Restore successful!');
                                        if (fileListContainer) fileListContainer.classList.add('hidden');
                                        window.location.reload(); // Reload to reflect changes
                                    } else {
                                        alert(`Restore failed: ${restoreResponse.error}`);
                                    }
                                });
                            }
                        });
                        fileList.appendChild(li);
                    });
                    if (fileListContainer) fileListContainer.classList.remove('hidden');
                } else {
                    alert(`Failed to list files: ${response.error}`);
                }
            });
        });
    }
    
    // A cancel button is not in the original html, so this would fail.
    // document.getElementById('cancel-restore').addEventListener('click', () => {
    //     fileListContainer.classList.add('hidden');
    // });

    initializeTabs();
    initDashboardLogic();
    initSettingsLogic(); // Combines display and webdav settings
    initSearchEngineSettings(); // Initialize search engine settings
    initAdvancedSettingsLogic();
    initSidebar(); // For stats and info
    initHelpPanel();
});

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('messageContainer');
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;

    // Show the toast
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 100); // Small delay to allow CSS transition

    // Hide and remove the toast
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove from DOM after transition
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}


function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');

            const targetTabId = tab.dataset.tab;
            tabContents.forEach(content => {
                if (content.id === targetTabId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

function initSidebar() {
    const infoContainer = document.getElementById('infoContainer');
    infoContainer.innerHTML = `
        <div>Version: ${STATE.settings.version || 'N/A'}</div>
        <div>Author: Ryen</div>
    `;
    // Stats overview is now handled by initDashboardLogic
}

function initHelpPanel() {
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    
    if (helpBtn && helpPanel) {
        // First, inject the content structure for the modal
        const helpHTML = `
            <div class="help-content-wrapper">
                <div class="help-header">
                    <h2>功能说明</h2>
                    <button id="closeHelpBtn" title="关闭">&times;</button>
                </div>
                <div class="help-body">
                    <h3>数据概览与备份 (侧边栏)</h3>
                    <ul>
                        <li><strong>数据概览:</strong> 在侧边栏实时查看已观看、稍后观看和总记录数。</li>
                        <li><strong>本地备份:</strong> 通过 "导入/导出本地备份" 功能，可以手动备份和恢复您的所有观看记录为 JSON 文件，方便在不同设备间迁移。</li>
                        <li><strong>WebDAV 同步:</strong> "立即上传" 会将您当前的本地记录备份到云端。"从云端恢复" 则会列出云端备份供您恢复。</li>
                        <li><strong>清空记录:</strong> 此操作会删除所有本地存储的观看记录，请谨慎使用。</li>
                    </ul>
                    <h3>观看记录 (主面板)</h3>
                    <ul>
                        <li>在此处浏览、搜索和筛选您的所有观看记录。点击记录标题可直接跳转到对应的 JavDB 页面。</li>
                    </ul>
                    <h3>设置 (主面板)</h3>
                    <ul>
                        <li><strong>列表显示设置:</strong> 控制在 JavDB 网站上是否自动隐藏"已看"、"已浏览"或"VR"影片。这些设置是实时保存的。</li>
                        <li><strong>WebDAV 设置:</strong> 配置您的云存储信息（如坚果云、Nextcloud等）以启用云同步功能。启用 "每日自动上传" 后，扩展会在浏览器启动时自动为您备份一次。</li>
                    </ul>
                </div>
            </div>
        `;
        helpPanel.innerHTML = helpHTML;

        // Then, add event listeners
        helpBtn.addEventListener('click', () => {
            helpPanel.classList.add('visible');
        });

        // This allows closing the panel by clicking on the overlay or the close button
        helpPanel.addEventListener('click', (e) => {
            if (e.target === helpPanel || e.target.closest('#closeHelpBtn')) {
                helpPanel.classList.remove('visible');
            }
        });
    }
}

// =================================================================
// ============== JAVDB RECORDS DASHBOARD LOGIC ====================
// =================================================================
async function initDashboardLogic() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const videoList = document.getElementById('videoList');
    const paginationContainer = document.querySelector('.pagination');
    const statsOverview = document.getElementById('stats-overview');
    const importFile = document.getElementById('importFile');
    const exportBtn = document.getElementById('exportBtn');

    let currentPage = 1;
    const recordsPerPage = 20;

    async function loadRecords() {
        const viewedData = await getValue('viewed', {});
        STATE.records = Object.values(viewedData);
        render();
    }

    function render() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        
        let filteredRecords = STATE.records.filter(record => {
            const title = record.title || '';
            const id = record.id || '';
            const matchesSearch = title.toLowerCase().includes(searchTerm) || id.toLowerCase().includes(searchTerm);
            const matchesFilter = (filterValue === 'all') || (record.status === filterValue);
            return matchesSearch && matchesFilter;
        });

        filteredRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        renderStats(STATE.records); // Pass all records for global stats
        renderVideoList(filteredRecords);
        renderPagination(filteredRecords.length);
    }

    function renderStats(records) {
        const total = records.length;
        const viewedCount = records.filter(r => r.status === VIDEO_STATUS.VIEWED).length;
        const wantCount = records.filter(r => r.status === VIDEO_STATUS.WANT).length;
        const browsedCount = records.filter(r => r.status === VIDEO_STATUS.BROWSED).length;
        statsOverview.innerHTML = `
            <div><span class="stat-value">${total}</span><span class="stat-label">总记录</span></div>
            <div><span class="stat-value">${viewedCount}</span><span class="stat-label">已观看</span></div>
            <div><span class="stat-value">${wantCount}</span><span class="stat-label">我想看</span></div>
            <div><span class="stat-value">${browsedCount}</span><span class="stat-label">已浏览</span></div>
        `;
    }

    function renderVideoList(records) {
        videoList.innerHTML = '';
        const startIndex = (currentPage - 1) * recordsPerPage;
        const pageRecords = records.slice(startIndex, startIndex + recordsPerPage);

        if (pageRecords.length === 0) {
            videoList.innerHTML = '<li>没有找到符合条件的记录。</li>';
            return;
        }

        pageRecords.forEach(record => {
            const li = document.createElement('li');
            let statusText = '未知';
            switch (record.status) {
                case VIDEO_STATUS.VIEWED: statusText = '已观看'; break;
                case VIDEO_STATUS.WANT: statusText = '我想看'; break;
                case VIDEO_STATUS.BROWSED: statusText = '已浏览'; break;
            }

            const searchLinksHtml = STATE.settings.searchEngines.map(engine => {
                const searchUrl = engine.urlTemplate.replace('{{ID}}', encodeURIComponent(record.id));
                const iconHtml = engine.iconUrl 
                    ? `<img src="${engine.iconUrl}" alt="${engine.name}" class="search-engine-icon">`
                    : `<i class="fas fa-link"></i>`;
                return `<a href="${searchUrl}" target="_blank" title="在 ${engine.name} 中搜索">${iconHtml}</a>`;
            }).join('');

            li.innerHTML = `
                <div class="video-info" title="${record.id} - ${record.title}">${record.id} - ${record.title}</div>
                <span class="status-tag">${statusText}</span>
                <span class="timestamp">${new Date(record.timestamp).toLocaleString()}</span>
                <div class="search-links">${searchLinksHtml}</div>
            `;
            videoList.appendChild(li);
        });
    }

    function renderPagination(totalRecords) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        if (totalPages <= 1) return;

        function createButton(text, page, isDisabled = false, isActive = false) {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.disabled = isDisabled;
            if (isActive) btn.classList.add('active');
            if (text === "...") {
                btn.classList.add('ellipsis');
                btn.disabled = true;
            } else {
                 btn.addEventListener('click', () => {
                    if (page) {
                        currentPage = page;
                        render();
                    }
                });
            }
            return btn;
        }

        const pageButtons = [];
        const maxPagesToShow = 5; // The number of actual page number buttons to show

        // Previous and First
        pageButtons.push(createButton('«', 1, currentPage === 1));
        pageButtons.push(createButton('‹', currentPage - 1, currentPage === 1));
        
        if (totalPages <= maxPagesToShow + 2) { // Show all pages if not too many
            for (let i = 1; i <= totalPages; i++) {
                pageButtons.push(createButton(i, i, false, i === currentPage));
            }
        } else {
            // Logic for lots of pages
            if (currentPage < maxPagesToShow) {
                // Near the start
                for (let i = 1; i <= maxPagesToShow; i++) {
                    pageButtons.push(createButton(i, i, false, i === currentPage));
                }
                pageButtons.push(createButton("..."));
                pageButtons.push(createButton(totalPages, totalPages, false, totalPages === currentPage));
            } else if (currentPage > totalPages - maxPagesToShow + 1) {
                // Near the end
                pageButtons.push(createButton(1, 1, false, 1 === currentPage));
                pageButtons.push(createButton("..."));
                for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
                    pageButtons.push(createButton(i, i, false, i === currentPage));
                }
            } else {
                // In the middle
                pageButtons.push(createButton(1, 1, false, 1 === currentPage));
                pageButtons.push(createButton("..."));
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageButtons.push(createButton(i, i, false, i === currentPage));
                }
                pageButtons.push(createButton("..."));
                pageButtons.push(createButton(totalPages, totalPages, false, totalPages === currentPage));
            }
        }

        // Next and Last
        pageButtons.push(createButton('›', currentPage + 1, currentPage === totalPages));
        pageButtons.push(createButton('»', totalPages, currentPage === totalPages));

        pageButtons.forEach(btn => paginationContainer.appendChild(btn));
    }

    clearAllBtn.addEventListener('click', async () => {
        if (confirm('确定要清空所有本地观看记录吗？此操作不可逆！')) {
            await setValue('viewed', {});
            await loadRecords();
            showToast('已清空所有本地记录', 'success');
        }
    });

    // --- Import / Export ---
    exportBtn.addEventListener('click', async () => {
        const records = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});

        if (Object.keys(records).length === 0) {
            showToast("没有记录可导出。", 'info');
            return;
        }

        const dataToExport = {
            settings: STATE.settings,
            data: records
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `javdb_extension_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('导出成功！', 'success');
    });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                if (typeof importData !== 'object' || importData === null) {
                    throw new Error("无效的JSON格式。");
                }
                
                // New format with settings and data
                if (importData.settings && importData.data) {
                    if (confirm(`即将从文件恢复设置和 ${Object.keys(importData.data).length} 条记录。这将覆盖所有现有数据，确定吗？`)) {
                        STATE.settings = importData.settings;
                        await saveSettings(STATE.settings);
                        await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
                        await loadRecords();
                        await initSettingsLogic(); // Reload settings on screen
                        showToast("设置和数据导入成功！", 'success');
                    }
                } 
                // Tampermonkey script format { myIds: [], videoBrowseHistory: [] }
                else if (Array.isArray(importData.myIds) || Array.isArray(importData.videoBrowseHistory)) {
                    const myIds = new Set(importData.myIds || []);
                    const videoBrowseHistory = new Set(importData.videoBrowseHistory || []);
                    
                    const totalCount = myIds.size + videoBrowseHistory.size;

                    if (confirm(`检测到油猴脚本备份文件。即将合并 ${totalCount} 条记录。这将与您当前的观看记录合并，确定吗？`)) {
                        const existingData = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
                        let newRecordsCount = 0;
                        
                        myIds.forEach(id => {
                            if (!existingData[id]) {
                                existingData[id] = { id, title: 'N/A (Imported)', status: VIDEO_STATUS.VIEWED, timestamp: Date.now() };
                                newRecordsCount++;
                            } else if (existingData[id].status !== VIDEO_STATUS.VIEWED) {
                                existingData[id].status = VIDEO_STATUS.VIEWED; // Upgrade status
                            }
                        });

                        videoBrowseHistory.forEach(id => {
                            if (!existingData[id]) {
                                existingData[id] = { id, title: 'N/A (Imported)', status: VIDEO_STATUS.BROWSED, timestamp: Date.now() };
                                newRecordsCount++;
                            }
                        });

                        await setValue(STORAGE_KEYS.VIEWED_RECORDS, existingData);
                        await loadRecords();
                        showToast(`成功合并 ${newRecordsCount} 条新记录！`, 'success');
                    }
                }
                // Tampermonkey script format (or other simple array of objects with id) [ { id: '...' }, ... ]
                else if (Array.isArray(importData)) {
                    const validRecords = importData.filter(item => item && item.id);
                     if (confirm(`检测到旧版备份文件（数组格式）。即将合并 ${validRecords.length} 条记录。这将与您当前的观看记录合并，确定吗？`)) {
                        const existingData = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
                        let newRecordsCount = 0;
                        validRecords.forEach(record => {
                            if (!existingData[record.id]) {
                                existingData[record.id] = {
                                    id: record.id,
                                    title: record.title || 'N/A (Imported)',
                                    status: 'viewed',
                                    timestamp: Date.now()
                                };
                                newRecordsCount++;
                            }
                        });
                        await setValue(STORAGE_KEYS.VIEWED_RECORDS, existingData);
                        await loadRecords();
                        showToast(`成功合并 ${newRecordsCount} 条新记录！`, 'success');
                    }
                }
                // Legacy format (only data object)
                else {
                     if (confirm(`检测到旧版备份文件。即将导入 ${Object.keys(importData).length} 条记录。这将覆盖您当前的观看记录（但保留设置），确定吗？`)) {
                        await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
                        await loadRecords();
                        showToast("导入成功！", 'success');
                    }
                }
            } catch (error) {
                showToast(`导入失败: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    });

    searchInput.addEventListener('input', () => { currentPage = 1; render(); });
    filterSelect.addEventListener('change', () => { currentPage = 1; render(); });

    await loadRecords();
}

// =================================================================
// =================== SEARCH ENGINE SETTINGS ======================
// =================================================================
async function initSearchEngineSettings() {
    const listContainer = document.getElementById('search-engine-list');
    const addBtn = document.getElementById('add-search-engine');

    function render() {
        listContainer.innerHTML = '';
        STATE.settings.searchEngines.forEach((engine, index) => {
            const engineDiv = document.createElement('div');
            engineDiv.className = 'search-engine-item';
            engineDiv.innerHTML = `
                <input type="text" placeholder="名称 (e.g., JavDB)" value="${engine.name}" data-key="name" data-index="${index}">
                <input type="text" placeholder="URL 模板" value="${engine.urlTemplate}" data-key="urlTemplate" data-index="${index}" class="url-template-input">
                <input type="text" placeholder="图标 URL (可选)" value="${engine.iconUrl || ''}" data-key="iconUrl" data-index="${index}">
                <button class="delete-engine" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            listContainer.appendChild(engineDiv);
        });

        attachEventListeners();
    }

    function attachEventListeners() {
        document.querySelectorAll('.search-engine-item input').forEach(input => {
            input.addEventListener('change', (e) => {
                const { index, key } = e.target.dataset;
                STATE.settings.searchEngines[index][key] = e.target.value;
                save();
            });
        });

        document.querySelectorAll('.delete-engine').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                if (confirm(`确定要删除搜索引擎 "${STATE.settings.searchEngines[index].name}" 吗？`)) {
                    STATE.settings.searchEngines.splice(index, 1);
                    save().then(render);
                }
            });
        });
    }

    addBtn.addEventListener('click', () => {
        STATE.settings.searchEngines.push({ name: '', urlTemplate: '', iconUrl: '' });
        render();
    });

    async function save() {
        await saveSettings(STATE.settings);
        showToast('搜索引擎设置已保存', 'success');
    }

    render();
}


// =================================================================
// ==================== ADVANCED SETTINGS LOGIC ====================
// =================================================================
async function initAdvancedSettingsLogic() {
    const jsonConfigTextArea = document.getElementById('jsonConfig');
    const editJsonBtn = document.getElementById('editJsonBtn');
    const saveJsonBtn = document.getElementById('saveJsonBtn');

    async function loadConfig() {
        jsonConfigTextArea.value = JSON.stringify(STATE.settings, null, 2);
    }

    editJsonBtn.addEventListener('click', () => {
        jsonConfigTextArea.readOnly = false;
        jsonConfigTextArea.focus();
        editJsonBtn.classList.add('hidden');
        saveJsonBtn.classList.remove('hidden');
    });

    saveJsonBtn.addEventListener('click', async () => {
        try {
            const newSettings = JSON.parse(jsonConfigTextArea.value);
            STATE.settings = newSettings;
            await saveSettings(STATE.settings);
            
            jsonConfigTextArea.readOnly = true;
            editJsonBtn.classList.remove('hidden');
            saveJsonBtn.classList.add('hidden');
            
            showToast('高级配置已成功保存！', 'success');
            
            // Reload other tabs to reflect potential changes
            await initSettingsLogic();

        } catch (error) {
            showToast(`JSON 格式无效，请检查后重试。\n错误信息: ${error.message}`, 'error');
        }
    });

    await loadConfig();
}


// =================================================================
// ==================== SETTINGS LOGIC =============================
// =================================================================

// Centralized log manager
const logManager = {
    logElement: document.getElementById('log'),
    clearLogsBtn: document.getElementById('clearLogsBtn'),
    maxLogSize: 200, // Maximum number of log entries
    logs: [],

    async init() {
        this.logs = await getValue(STORAGE_KEYS.LOGS, []);
        this.render();
        this.clearLogsBtn.addEventListener('click', () => this.clear());
    },

    async log(message) {
        const timestamp = new Date().toLocaleString();
        const logEntry = `[${timestamp}] ${message}`;
        
        // Add to the start of the array
        this.logs.unshift(logEntry);

        // Trim old logs if size exceeds the maximum
        if (this.logs.length > this.maxLogSize) {
            this.logs.length = this.maxLogSize;
        }
        
        await this.save();
        this.render();
    },
    
    render() {
        this.logElement.textContent = this.logs.join('\n');
    },

    async save() {
        await setValue(STORAGE_KEYS.LOGS, this.logs);
    },
    
    async clear() {
        if (confirm('确定要清空所有日志记录吗？')) {
            this.logs = [];
            await this.save();
            this.render();
        }
    }
};


// Only bind events once
let settingsEventListenersBound = false;

async function initSettingsLogic() {
    // --- Element Cache ---
    const hideViewedCheckbox = document.getElementById('hideViewed');
    const hideBrowsedCheckbox = document.getElementById('hideBrowsed');
    const hideVRCheckbox = document.getElementById('hideVR');
    const webdavEnabled = document.getElementById('webdavEnabled');
    const webdavFieldsContainer = document.getElementById('webdav-fields-container');
    const urlInput = document.getElementById('webdavUrl');
    const userInput = document.getElementById('webdavUser');
    const passInput = document.getElementById('webdavPass');
    const autoSyncCheckbox = document.getElementById('webdavAutoSync');
    const saveWebdavSettingsBtn = document.getElementById('saveWebdavSettings');
    const testWebdavConnectionBtn = document.getElementById('testWebdavConnection');
    const syncNowBtn = document.getElementById('syncNow');
    const syncDownBtn = document.getElementById('syncDown');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileList = document.getElementById('fileList');

    // --- Logger Integration ---
    function log(message) {
        logManager.log(message);
    }
    
    // --- Load Functions ---
    async function loadDisplaySettings() {
        hideViewedCheckbox.checked = STATE.settings.display.hideViewed;
        hideBrowsedCheckbox.checked = STATE.settings.display.hideBrowsed;
        hideVRCheckbox.checked = STATE.settings.display.hideVR;
    }

    async function loadWebdavSettings() {
        webdavEnabled.checked = STATE.settings.webdav.enabled;
        urlInput.value = STATE.settings.webdav.url || '';
        userInput.value = STATE.settings.webdav.username || '';
        passInput.value = STATE.settings.webdav.password || '';
        autoSyncCheckbox.checked = STATE.settings.webdav.autoSync;
        toggleWebdavFields();
    }

    function toggleWebdavFields() {
        webdavFieldsContainer.classList.toggle('hidden', !webdavEnabled.checked);
    }
    
    // --- Action Functions ---
    async function saveDisplaySetting(key, value) {
        STATE.settings.display[key] = value;
        await saveSettings(STATE.settings);
    }

    async function saveWebdavConfig() {
        STATE.settings.webdav = {
            enabled: webdavEnabled.checked,
            url: urlInput.value.trim(),
            username: userInput.value.trim(),
            password: passInput.value,
            autoSync: autoSyncCheckbox.checked,
        };
        await saveSettings(STATE.settings);
        log('WebDAV 设置已保存');
        showToast('WebDAV 设置已保存', 'success');
        return STATE.settings.webdav;
    }

    async function testConnection() {
        const webdavSettings = await saveWebdavConfig(); // Also saves before testing
        if (!webdavSettings.enabled || !webdavSettings.url) {
            showToast('WebDAV 未启用或 URL 为空，跳过测试。', 'info');
            return;
        }

        log('正在测试 WebDAV 连接...');
        try {
            const response = await fetch(webdavSettings.url, {
                method: 'PROPFIND',
                headers: {
                  'Authorization': 'Basic ' + btoa(`${webdavSettings.username}:${webdavSettings.password}`),
                  'Depth': '0'
                }
            });

            if (response.ok || response.status === 405) { // 207 Multi-Status is also OK. 405 can mean folder exists.
                log('✅ WebDAV 连接成功！');
                showToast('✅ WebDAV 连接成功！', 'success');
                // listRemoteFiles();
            } else {
                throw new Error(`连接测试失败，状态码: ${response.status}`);
            }
        } catch (error) {
            log('❌ WebDAV 连接失败: ' + error.message);
            showToast('❌ WebDAV 连接失败: ' + error.message, 'error');
        }
    }

    function syncUp() {
        log('开始上传数据...');
        chrome.runtime.sendMessage({ type: 'webdav-upload' }, (response) => {
            if (response && response.success) {
                log('✅ 上传成功！');
                showToast('✅ 数据已成功上传至云端！', 'success');
                // listRemoteFiles();
            } else {
                const errorMsg = response ? response.error : '未知错误';
                log(`❌ 上传失败: ${errorMsg}`);
                showToast(`❌ 上传失败: ${errorMsg}`, 'error');
            }
        });
    }

    // --- Bind Events (only once) ---
    if (!settingsEventListenersBound) {
        hideViewedCheckbox.addEventListener('change', () => saveDisplaySetting('hideViewed', hideViewedCheckbox.checked));
        hideBrowsedCheckbox.addEventListener('change', () => saveDisplaySetting('hideBrowsed', hideBrowsedCheckbox.checked));
        hideVRCheckbox.addEventListener('change', () => saveDisplaySetting('hideVR', hideVRCheckbox.checked));

        webdavEnabled.addEventListener('change', async () => {
            toggleWebdavFields();
            STATE.settings.webdav.enabled = webdavEnabled.checked;
            await saveSettings(STATE.settings);
        });

        saveWebdavSettingsBtn.addEventListener('click', saveWebdavConfig);
        testWebdavConnectionBtn.addEventListener('click', testConnection);
        syncNowBtn.addEventListener('click', syncUp);
        // The 'syncDown' button's event listener is already correctly set at the top of the file.
        // The 'listRemoteFiles' function and its listener here were part of an incomplete refactor and have been removed.

        settingsEventListenersBound = true;
    }
    
    // --- Initial Load ---
    await loadDisplaySettings();
    await loadWebdavSettings();
    await logManager.init();
} 
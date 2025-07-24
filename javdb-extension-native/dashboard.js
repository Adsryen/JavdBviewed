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
            showToast('设置已保存!', 'success');
            chrome.runtime.sendMessage({ type: 'setup-alarms' });
        });
    }

    // Test WebDAV connection
    const testButton = document.getElementById('testWebdavConnection');
    if (testButton) {
        testButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'webdav-test' }, response => {
                if (response.success) {
                    showToast('连接成功!', 'success');
                } else {
                    showToast(`连接失败: ${response.error}`, 'error');
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
                    showToast('同步成功!', 'success');
                    if(lastSyncTime) lastSyncTime.textContent = new Date().toLocaleString();
                } else {
                    showToast(`同步失败: ${response.error}`, 'error');
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
            showToast('正在从云端获取文件列表...', 'info', 2000);
            chrome.runtime.sendMessage({ type: 'webdav-list-files' }, response => {
                if (response.success && fileList) {
                    if (response.files.length === 0) {
                        showToast('云端没有找到任何备份文件。', 'info');
                        return;
                    }

                    fileList.innerHTML = ''; // Clear previous list
                    response.files.forEach(file => {
                        const li = document.createElement('li');
                        li.textContent = `${file.name} - ${file.lastModified}`;
                        li.dataset.path = file.path;
                        li.style.cursor = 'pointer';
                        li.addEventListener('click', () => {
                            const message = `您确定要从 ${file.name} 恢复吗？`;
                            showConfirmationModal(message, { isRestore: true }, (options) => {
                                // onConfirm with options
                                showToast('正在恢复数据...', 'info');
                                chrome.runtime.sendMessage({ 
                                    type: 'webdav-restore', 
                                    filename: file.path,
                                    options: options // Pass user's choices to background
                                }, restoreResponse => {
                                    if (restoreResponse.success) {
                                        showToast('恢复成功！页面即将刷新...', 'success');
                                        if (fileListContainer) fileListContainer.classList.add('hidden');
                                        setTimeout(() => window.location.reload(), 2000); // Reload to reflect changes
                                    } else {
                                        showToast(`恢复失败: ${restoreResponse.error}`, 'error');
                                    }
                                });
                            });
                        });
                        fileList.appendChild(li);
                    });
                    
                    // --- UX Improvement ---
                    // 1. Switch to the 'Settings' tab.
                    const settingsTabButton = document.querySelector('.tab-link[data-tab="tab-settings"]');
                    if (settingsTabButton) {
                        settingsTabButton.click();
                    }

                    // 2. Show the file list container and scroll to it.
                    if (fileListContainer) {
                        fileListContainer.classList.remove('hidden');
                        // Use a short timeout to ensure the tab switch has completed and the element is visible.
                        setTimeout(() => {
                             fileListContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 150);
                    }
                } else {
                    showToast(`未能列出文件: ${response.error || '未知错误'}`, 'error');
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

function showConfirmationModal(message, config = {}, onConfirm, onCancel) {
    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const restoreOptions = document.getElementById('modalRestoreOptions');
    const restoreSettingsCheckbox = document.getElementById('modalRestoreSettings');
    const restoreRecordsCheckbox = document.getElementById('modalRestoreRecords');

    modalMessage.innerText = message;
    
    // Show/hide restore options based on config
    if (config.isRestore) {
        restoreOptions.classList.remove('hidden');
    } else {
        restoreOptions.classList.add('hidden');
    }

    modal.classList.add('visible');

    const confirmHandler = () => {
        let options = null;
        if (config.isRestore) {
            options = {
                restoreSettings: restoreSettingsCheckbox.checked,
                restoreRecords: restoreRecordsCheckbox.checked
            };
            // Prevent confirming with no options selected
            if (!options.restoreSettings && !options.restoreRecords) {
                showToast("请至少选择一个恢复选项。", "error");
                return;
            }
        }
        if (onConfirm) onConfirm(options);
        close();
    };

    const cancelHandler = () => {
        if (onCancel) onCancel();
        close();
    };

    const close = () => {
        modal.classList.remove('visible');
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        modal.removeEventListener('click', outsideClickHandler);
    };

    const outsideClickHandler = (e) => {
        if (e.target === modal) {
            cancelHandler();
        }
    };

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    modal.addEventListener('click', outsideClickHandler);
}

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('messageContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // Corrected class name

    // Add icon for better visual feedback
    const icon = document.createElement('i');
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        info: 'fas fa-info-circle'
    };
    if (icons[type]) {
        icon.className = icons[type];
        toast.prepend(icon);
    }
    
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); 

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentElement) {
                container.removeChild(toast);
            }
        });
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
                    const message = `即将从文件恢复备份。\n文件包含 ${Object.keys(importData.data).length} 条记录。`;
                    showConfirmationModal(message, { isRestore: true }, async (options) => {
                        // onConfirm with options
                        if (options.restoreSettings) {
                            STATE.settings = importData.settings;
                            await saveSettings(STATE.settings);
                        }
                        if (options.restoreRecords) {
                            await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
                        }
                        await loadRecords();
                        await initSettingsLogic(); // Reload settings on screen
                        showToast("选择性导入成功！", 'success');
                    });
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
    // REMOVED: Redundant button references
    // const syncNowBtn = document.getElementById('syncNow'); 
    // const syncDownBtn = document.getElementById('syncDown');
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

    // REMOVED: Redundant saveWebdavConfig, testConnection, and syncUp functions
    // The logic is handled by the listeners set up in DOMContentLoaded

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

        // REMOVED: Redundant event listeners for save, test, and sync buttons.
        // These are already set correctly in the main DOMContentLoaded listener.
        // saveWebdavSettingsBtn.addEventListener('click', saveWebdavConfig);
        // testWebdavConnectionBtn.addEventListener('click', testConnection);
        // syncNowBtn.addEventListener('click', syncUp);
        
        settingsEventListenersBound = true;
    }
    
    // --- Initial Load ---
    await loadDisplaySettings();
    await loadWebdavSettings();
    await logManager.init();
} 
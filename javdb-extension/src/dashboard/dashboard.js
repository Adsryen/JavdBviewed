import './dashboard.css';
import { getSettings, saveSettings, getValue, setValue } from '../utils/storage.js';
import { STORAGE_KEYS } from '../utils/config.js';
import { createClient } from 'webdav';

const CONFIG = {
    VERSION: '1.0.1', // Keep version in sync with manifest
    HIDE_WATCHED_VIDEOS_KEY: 'hideWatchedVideos',
    HIDE_VIEWED_VIDEOS_KEY: 'hideViewedVideos',
    HIDE_VR_VIDEOS_KEY: 'hideVRVideos',
    // Note: The concept of STORED_IDS_KEY and BROWSE_HISTORY_KEY from userscript
    // is replaced by a unified 'viewed' object in the extension,
    // which contains richer data (id, title, status, timestamp).
    WEBDEV_SETTINGS_KEY: 'webdavSettings'
};

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initDashboardLogic();
    initSettingsLogic(); // Combines display and webdav settings
    initAdvancedSettingsLogic();
    initSidebar(); // For stats and info
    initHelpPanel();
});

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
        <div>Version: ${CONFIG.VERSION}</div>
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

    let allRecords = [];
    let currentPage = 1;
    const recordsPerPage = 20;

    async function loadRecords() {
        const viewedData = await getValue('viewed', {});
        allRecords = Object.values(viewedData);
        render();
    }

    function render() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        
        let filteredRecords = allRecords.filter(record => {
            const title = record.title || '';
            const id = record.id || '';
            const matchesSearch = title.toLowerCase().includes(searchTerm) || id.toLowerCase().includes(searchTerm);
            const matchesFilter = (filterValue === 'all') || (record.status === filterValue);
            return matchesSearch && matchesFilter;
        });

        filteredRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        renderStats(allRecords); // Pass all records for global stats
        renderVideoList(filteredRecords);
        renderPagination(filteredRecords.length);
    }

    function renderStats(records) {
        const total = records.length;
        const viewedCount = records.filter(r => r.status === 'viewed').length;
        const laterCount = records.filter(r => r.status === 'later').length;
        statsOverview.innerHTML = `
            <div><span class="stat-value">${total}</span><span class="stat-label">总记录</span></div>
            <div><span class="stat-value">${viewedCount}</span><span class="stat-label">已观看</span></div>
            <div><span class="stat-value">${laterCount}</span><span class="stat-label">稍后看</span></div>
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
            li.innerHTML = `
                <a href="https://javdb.com/v/${record.id}" target="_blank" title="${record.id} - ${record.title}">${record.id} - ${record.title}</a>
                <span class="status-tag">${record.status === 'viewed' ? '已观看' : '稍后看'}</span>
                <span class="timestamp">${new Date(record.timestamp).toLocaleString()}</span>
            `;
            videoList.appendChild(li);
        });
    }

    function renderPagination(totalRecords) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.disabled = (i === currentPage);
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                render();
            });
            paginationContainer.appendChild(pageBtn);
        }
    }

    clearAllBtn.addEventListener('click', async () => {
        if (confirm('确定要清空所有本地观看记录吗？此操作不可逆！')) {
            await setValue('viewed', {});
            await loadRecords();
            // Also clear display settings if desired
            // await setValue(CONFIG.HIDE_WATCHED_VIDEOS_KEY, false);
            // ... etc
        }
    });

    // --- Import / Export ---
    exportBtn.addEventListener('click', async () => {
        const records = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
        const settings = await getSettings();

        if (Object.keys(records).length === 0) {
            alert("没有记录可导出。");
            return;
        }

        const dataToExport = {
            settings: settings,
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
                        await saveSettings(importData.settings);
                        await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData.data);
                        await loadRecords();
                        await initSettingsLogic(); // Reload settings on screen
                        alert("设置和数据导入成功！");
                    }
                } 
                // Legacy format (only data)
                else {
                     if (confirm(`检测到旧版备份文件。即将导入 ${Object.keys(importData).length} 条记录。这将覆盖您当前的观看记录（但保留设置），确定吗？`)) {
                        await setValue(STORAGE_KEYS.VIEWED_RECORDS, importData);
                        await loadRecords();
                        alert("导入成功！");
                    }
                }
            } catch (error) {
                alert(`导入失败: ${error.message}`);
            }
        };
        reader.readAsText(file);
    });

    searchInput.addEventListener('input', () => { currentPage = 1; render(); });
    filterSelect.addEventListener('change', () => { currentPage = 1; render(); });

    await loadRecords();
}

// =================================================================
// ==================== ADVANCED SETTINGS LOGIC ====================
// =================================================================
async function initAdvancedSettingsLogic() {
    const jsonConfigTextArea = document.getElementById('jsonConfig');
    const editJsonBtn = document.getElementById('editJsonBtn');
    const saveJsonBtn = document.getElementById('saveJsonBtn');

    async function loadConfig() {
        const settings = await getSettings();
        jsonConfigTextArea.value = JSON.stringify(settings, null, 2);
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
            await saveSettings(newSettings);
            
            jsonConfigTextArea.readOnly = true;
            editJsonBtn.classList.remove('hidden');
            saveJsonBtn.classList.add('hidden');
            
            alert('高级配置已成功保存！');
            
            // Reload other tabs to reflect potential changes
            await initSettingsLogic();

        } catch (error) {
            alert(`JSON 格式无效，请检查后重试。\n错误信息: ${error.message}`);
        }
    });

    await loadConfig();
}


// =================================================================
// ==================== SETTINGS LOGIC =============================
// =================================================================
async function initSettingsLogic() {
    // --- Display Settings ---
    const hideWatchedCheckbox = document.getElementById('hideWatchedVideos');
    const hideViewedCheckbox = document.getElementById('hideViewedVideos');
    const hideVRCheckbox = document.getElementById('hideVRVideos');

    async function loadDisplaySettings() {
        const settings = await getSettings();
        hideWatchedCheckbox.checked = settings.display.hideWatched;
        hideViewedCheckbox.checked = settings.display.hideViewed;
        hideVRCheckbox.checked = settings.display.hideVR;
    }

    async function saveDisplaySetting(key, value) {
        const settings = await getSettings();
        settings.display[key] = value;
        await saveSettings(settings);
    }

    hideWatchedCheckbox.addEventListener('change', () => saveDisplaySetting('hideWatched', hideWatchedCheckbox.checked));
    hideViewedCheckbox.addEventListener('change', () => saveDisplaySetting('hideViewed', hideViewedCheckbox.checked));
    hideVRCheckbox.addEventListener('change', () => saveDisplaySetting('hideVR', hideVRCheckbox.checked));

    // --- WebDAV Settings ---
    const webdavEnabled = document.getElementById('webdavEnabled');
    const webdavFieldsContainer = document.getElementById('webdav-fields-container');
    const urlInput = document.getElementById('webdavUrl');
    const userInput = document.getElementById('webdavUser');
    const passInput = document.getElementById('webdavPass');
    const autoSyncCheckbox = document.getElementById('webdavAutoSync');
    const saveAndTestBtn = document.getElementById('saveAndTest');
    const syncNowBtn = document.getElementById('syncNow'); // This one is in the sidebar
    const syncDownBtn = document.getElementById('syncDown'); // This one is in the sidebar
    const fileListContainer = document.getElementById('fileListContainer');
    const fileList = document.getElementById('fileList');
    const logElement = document.getElementById('log');

    function log(message) {
        const timestamp = new Date().toLocaleTimeString();
        logElement.textContent += `[${timestamp}] ${message}\n`;
        logElement.scrollTop = logElement.scrollHeight;
    }

    async function loadWebdavSettings() {
        const settings = await getSettings();
        
        webdavEnabled.checked = settings.webdav.enabled;
        urlInput.value = settings.webdav.url || '';
        userInput.value = settings.webdav.username || '';
        passInput.value = settings.webdav.password || '';
        autoSyncCheckbox.checked = settings.webdav.autoSync;
        
        toggleWebdavFields();
    }

    function toggleWebdavFields() {
        webdavFieldsContainer.classList.toggle('hidden', !webdavEnabled.checked);
    }

    webdavEnabled.addEventListener('change', async () => {
        toggleWebdavFields();
        const settings = await getSettings();
        settings.webdav.enabled = webdavEnabled.checked;
        await saveSettings(settings);
    });

    saveAndTestBtn.addEventListener('click', async function() {
        const settings = await getSettings();
        const newWebdavSettings = {
            enabled: webdavEnabled.checked,
            url: urlInput.value.trim(),
            username: userInput.value.trim(),
            password: passInput.value,
            autoSync: autoSyncCheckbox.checked,
        };
        settings.webdav = newWebdavSettings;
        await saveSettings(settings);
        log('WebDAV 设置已保存');
        
        if (newWebdavSettings.enabled && newWebdavSettings.url) {
            testConnection(newWebdavSettings);
        } else {
            log('WebDAV 未启用或 URL 为空，跳过测试。');
        }
    });
    
    async function testConnection(webdavSettings) {
        log('正在测试 WebDAV 连接...');
        try {
            const client = createClient(webdavSettings.url, {
                username: webdavSettings.username, password: webdavSettings.password,
            });
            await client.getDirectoryContents('/');
            log('✅ WebDAV 连接成功！');
            listRemoteFiles();
        } catch (error) {
            log('❌ WebDAV 连接失败: ' + error.message);
        }
    }

    syncNowBtn.addEventListener('click', () => {
        log('开始上传数据...');
        chrome.runtime.sendMessage({ type: 'webdav-upload' }, (response) => {
            if (response && response.success) {
                log('✅ 上传成功！');
                listRemoteFiles();
            } else {
                log(`❌ 上传失败: ${response ? response.error : '未知错误'}`);
            }
        });
    });

    syncDownBtn.addEventListener('click', listRemoteFiles);
    
    async function listRemoteFiles() {
        const settings = await getSettings();
        if (!settings.webdav || !settings.webdav.enabled || !settings.webdav.url) {
            fileListContainer.classList.add('hidden');
            return;
        }

        log('正在获取云端文件列表...');
        fileListContainer.classList.remove('hidden');
        fileList.innerHTML = '<li>加载中...</li>';

        try {
            const client = createClient(settings.webdav.url, {
                username: settings.webdav.username, password: settings.webdav.password,
            });
            const dirItems = (await client.getDirectoryContents('/'))
                .filter(item => item.type === 'file' && item.basename.endsWith('.json'));
            
            fileList.innerHTML = '';
            if (dirItems.length === 0) {
                fileList.innerHTML = '<li>未找到任何 .json 备份文件。</li>';
                return;
            }
            
            dirItems.sort((a,b) => new Date(b.lastmod) - new Date(a.lastmod)).forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.basename} (${new Date(item.lastmod).toLocaleString()})`;
                li.dataset.filename = item.filename;
                li.addEventListener('click', () => {
                    if(confirm(`确定要从 ${item.basename} 恢复数据吗？此操作会覆盖本地所有观看记录。`)) {
                        log(`请求从 ${item.basename} 恢复...`);
                        chrome.runtime.sendMessage({ type: 'webdav-restore', filename: item.filename }, (response) => {
                            if (response && response.success) {
                                log(`✅ 从 ${item.basename} 恢复成功！`);
                                initDashboardLogic(); // Re-initialize to show new data
                            } else {
                                log(`❌ 恢复失败: ${response ? response.error : '未知错误'}`);
                            }
                        });
                    }
                });
                fileList.appendChild(li);
            });
            log(`✅ 成功获取 ${dirItems.length} 个备份文件。`);
        } catch (error) {
            log(`❌ 获取文件列表失败: ${error.message}`);
            fileList.innerHTML = '<li>获取列表失败。</li>';
        }
    }
    
    // Initial Load
    await loadDisplaySettings();
    await loadWebdavSettings();
} 
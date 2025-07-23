import { getValue, setValue, getSettings, saveSettings } from '../utils/storage.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const importFile = document.getElementById('importFile');
    const customUploadBtn = document.getElementById('customUploadBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const toggleWatchedContainer = document.getElementById('toggleWatchedContainer');
    const toggleViewedContainer = document.getElementById('toggleViewedContainer');
    const toggleVRContainer = document.getElementById('toggleVRContainer');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const searchBox = document.getElementById('searchBox');
    const resultContainer = document.getElementById('resultContainer');
    const browseHistoryBox = document.getElementById('browseHistoryBox');
    const browseHistoryResultContainer = document.getElementById('browseHistoryResultContainer');
    const idCountDisplay = document.getElementById('idCountDisplay');
    const uploadTimeDisplay = document.getElementById('uploadTimeDisplay');
    const exportTimeDisplay = document.getElementById('exportTimeDisplay');
    const versionAuthorInfo = document.getElementById('versionAuthorInfo');

    // --- Functions ---
    
    // 0. Open Dashboard
    openDashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'dist/dashboard.html' });
    });

    // 1. Import/Upload
    customUploadBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const importData = JSON.parse(evt.target.result);
                let newWatched = new Set(await getValue(STORAGE_KEYS.STORED_IDS, []));
                let newViewed = new Set(await getValue(STORAGE_KEYS.BROWSE_HISTORY, []));

                // New format: { settings: {...}, data: {...} }
                if (importData.settings && importData.data) {
                    if (confirm(`即将从文件恢复设置和 ${Object.keys(importData.data).length} 条记录。这将覆盖所有现有数据，确定吗？`)) {
                        await saveSettings(importData.settings);
                        
                        // Convert data back to legacy format for popup
                        newWatched = new Set();
                        newViewed = new Set();
                        Object.values(importData.data).forEach(record => {
                            if (record.status === 'viewed') {
                                newWatched.add(record.id);
                            } else { // 'later' or other statuses
                                newViewed.add(record.id);
                            }
                        });
                        alert("设置和数据导入成功！");
                    } else {
                        return; // User cancelled
                    }
                }
                // Legacy format 1: { myIds: [...], videoBrowseHistory: [...] }
                else if (importData.myIds || importData.videoBrowseHistory) {
                    (importData.myIds || []).forEach(id => newWatched.add(id));
                    (importData.videoBrowseHistory || []).forEach(id => newViewed.add(id));
                     alert('数据导入成功！');
                }
                // Legacy format 2: [...]
                else if (Array.isArray(importData)) {
                    importData.forEach(item => item && item.id && newWatched.add(item.id));
                     alert('数据导入成功！');
                } else {
                    throw new Error("无法识别的备份文件格式。");
                }


                await setValue(STORAGE_KEYS.STORED_IDS, Array.from(newWatched));
                await setValue(STORAGE_KEYS.BROWSE_HISTORY, Array.from(newViewed));

                const now = new Date();
                const settings = await getSettings();
                settings.lastUploadTime = now.toISOString();
                await saveSettings(settings);
                uploadTimeDisplay.textContent = `上次上传时间：${now.toLocaleString()}`;

                updateAllDisplays();
                // No alert here, moved into conditions
            } catch (err) {
                alert('解析 JSON 失败: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    // 2. Toggle Buttons
    async function createToggleButton(key, container, textActive, textInactive) {
        const button = document.createElement('button');
        button.className = 'toggle-button';
        let settings;

        const updateState = (isActive) => {
            button.textContent = isActive ? textActive : textInactive;
            button.classList.toggle('active', isActive);
            button.classList.toggle('inactive', !isActive);
        };

        settings = await getSettings();
        updateState(settings.display[key]);

        button.addEventListener('click', async () => {
            settings = await getSettings();
            const newState = !settings.display[key];
            settings.display[key] = newState;
            await saveSettings(settings);
            updateState(newState);
            // Optionally reload the tab to apply changes
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        });

        container.appendChild(button);
        return button;
    }

    createToggleButton('hideWatched', toggleWatchedContainer, '当前：隐藏已看的番号', '当前：显示已看的番号');
    createToggleButton('hideViewed', toggleViewedContainer, '当前：隐藏已浏览的番号', '当前：显示已浏览的番号');
    createToggleButton('hideVR', toggleVRContainer, '当前：隐藏VR番号', '当前：显示VR番号');


    // 3. Export & Clear
    exportBtn.addEventListener('click', async () => {
        const myIds = await getValue(STORAGE_KEYS.STORED_IDS, []);
        const videoBrowseHistory = await getValue(STORAGE_KEYS.BROWSE_HISTORY, []);
        const settings = await getSettings();

        if (myIds.length === 0 && videoBrowseHistory.length === 0) {
            alert('没有存储任何数据。');
            return;
        }

        // Convert legacy data to new unified format
        const data = {};
        myIds.forEach(id => {
            if(!data[id]) data[id] = { id, status: 'viewed', timestamp: Date.now(), title: '' };
        });
        videoBrowseHistory.forEach(id => {
            // Avoid overwriting 'viewed' status if it exists
            if(!data[id]) data[id] = { id, status: 'later', timestamp: Date.now(), title: '' };
        });

        const dataToExport = { settings, data };
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `javdb-backup_${timestamp}.json`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const now = new Date();
        settings.lastExportTime = now.toISOString();
        await saveSettings(settings);
        exportTimeDisplay.textContent = `上次备份时间：${now.toLocaleString()}`;
    });

    clearBtn.addEventListener('click', async () => {
        if (confirm('确定要清除所有存储的番号和设置吗？此操作不可逆！')) {
            await setValue(STORAGE_KEYS.STORED_IDS, []);
            await setValue(STORAGE_KEYS.BROWSE_HISTORY, []);
            await saveSettings(DEFAULT_SETTINGS); // Reset all settings to default
            
            updateAllDisplays();
            alert('已清除所有数据。页面将刷新。');
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        }
    });

    // 4. Search
    const createSearchResultItem = (id, listKey, resultContainer) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';

        const idText = document.createElement('span');
        idText.textContent = id;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`确定要删除 ${id} 吗？`)) {
                const list = await getValue(listKey, []);
                await setValue(listKey, list.filter(x => x !== id));
                item.remove();
                updateCountDisplay();
            }
        });

        item.appendChild(idText);
        item.appendChild(deleteBtn);
        resultContainer.appendChild(item);
    };

    const handleSearch = async (inputBox, resultContainer, listKey) => {
        const searchTerm = inputBox.value.trim().toLowerCase();
        resultContainer.innerHTML = '';
        resultContainer.style.display = 'none';

        if (!searchTerm) return;

        const list = await getValue(listKey, []);
        const results = list.filter(id => id.toLowerCase().includes(searchTerm));

        if (results.length > 0) {
            results.forEach(id => createSearchResultItem(id, listKey, resultContainer));
            resultContainer.style.display = 'block';
        } else {
            resultContainer.innerHTML = '<div>未找到匹配项</div>';
            resultContainer.style.display = 'block';
        }
    };

    searchBox.addEventListener('input', () => handleSearch(searchBox, resultContainer, STORAGE_KEYS.STORED_IDS));
    browseHistoryBox.addEventListener('input', () => handleSearch(browseHistoryBox, browseHistoryResultContainer, STORAGE_KEYS.BROWSE_HISTORY));


    // 6. Info Displays
    async function updateCountDisplay() {
        const watchedCount = (await getValue(STORAGE_KEYS.STORED_IDS, [])).length;
        const browseCount = (await getValue(STORAGE_KEYS.BROWSE_HISTORY, [])).length;
        idCountDisplay.innerHTML = `<div>已看番号总数: ${watchedCount}</div><div>已浏览番号总数: ${browseCount}</div>`;
    }

    async function updateTimeDisplays() {
        const settings = await getSettings();
        const lastUpload = settings.lastUploadTime;
        uploadTimeDisplay.textContent = lastUpload ? `上次上传时间：${new Date(lastUpload).toLocaleString()}` : '';

        const lastExport = settings.lastExportTime;
        if (lastExport) {
            const lastExportDate = new Date(lastExport);
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (new Date() - lastExportDate > oneWeek) {
                exportTimeDisplay.innerHTML = `上次备份已超过一周，请及时<strong style="color: red;">备份</strong>！`;
            } else {
                exportTimeDisplay.textContent = `上次备份时间：${lastExportDate.toLocaleString()}`;
            }
        } else {
            exportTimeDisplay.innerHTML = `还未备份过，请及时<strong style="color: red;">备份</strong>！`;
        }
    }

    async function updateWebdavDisplay() {
        const settings = await getSettings();
        // webdavUrl.value = settings.webdav.url || ''; 
        // webdavPath.value = settings.webdav.path || ''; 
        // webdavUsername.value = settings.webdav.username || ''; 
        // webdavPassword.value = settings.webdav.password || ''; 
    }

    function updateAllDisplays() {
        updateCountDisplay();
        updateTimeDisplays();
        updateWebdavDisplay();
    }

    // 7. Help Panel
    function setupHelpPanel() {
        const helpContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 14px; line-height: 1.6;">
                <h3 style="font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px;">主面板功能</h3>
                <ul style="padding-left: 20px;">
                    <li style="margin-bottom: 8px;"><strong>上传/恢复番号备份:</strong> 点击选择一个之前通过"页面数据导出"或"导出存储番号"功能生成的 <code>.json</code> 文件。脚本会读取文件中的数据，并将其安全地合并到您当前的"已看"和"已浏览"列表中。这个"导出再导入"的流程是特意设计的，旨在为您提供<strong>最大程度的数据控制权和安全性</strong>，方便您在不同设备间同步数据或从备份中恢复。</li>
                    <li style="margin-bottom: 8px;"><strong>隐藏/显示开关:</strong>
                        <ul style="padding-left: 20px; margin-top: 8px;">
                            <li style="margin-bottom: 5px;"><strong>已看的番号:</strong> 切换是否在列表页隐藏您已标记为"看过"的影片。</li>
                            <li style="margin-bottom: 5px;"><strong>已浏览的番号:</strong> 切换是否隐藏您仅访问过详情页但未标记为"看过"的影片。</li>
                            <li style="margin-bottom: 5px;"><strong>VR番号:</strong> 切换是否隐藏所有VR影片。</li>
                            <li style="margin-top: 8px; color: #666; font-size: 12px;">注意：为了保证搜索结果的完整性，所有隐藏功能在搜索页面会自动禁用。</li>
                        </ul>
                    </li>
                    <li style="margin-bottom: 8px;"><strong>导出存储番号:</strong> 将当前脚本中存储的所有"已看"和"已浏览"番号数据导出为一个 <code>javdb-backup_...json</code> 文件，用于备份和迁移。</li>
                    <li style="margin-bottom: 8px;"><strong>清空存储番号:</strong> <strong style="color: #ff4a4a;">删除所有存储在脚本中的数据</strong>（包括"已看"、"已浏览"记录及所有设置）。此操作不可逆，请谨慎使用！</li>
                    <li style="margin-bottom: 8px;"><strong>搜索与管理:</strong>
                        <ul style="padding-left: 20px; margin-top: 8px;">
                            <li style="margin-bottom: 5px;"><strong>搜索已看的番号:</strong> 在"已看"列表中快速查找特定番号，并可以单独删除记录。</li>
                            <li><strong>查询浏览记录:</strong> 在"已浏览"历史中快速查找特定番号，并可以单独删除记录。</li>
                        </ul>
                    </li>
                    <li style="margin-bottom: 8px;"><strong>数据显示:</strong> 面板底部会实时显示已存储的"已看"和"已浏览"番号总数，以及上次导入文件的时间。</li>
                </ul>
                <h3 style="font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px;">列表页功能</h3>
                <ul style="padding-left: 20px;">
                    <li style="margin-bottom: 8px;"><strong>状态标记:</strong> 在影片列表（如演员页、热门影片等）中，脚本会自动为影片添加状态标签：
                        <ul style="padding-left: 20px; margin-top: 8px;">
                           <li style="margin-bottom: 5px;"> <span class="tag is-success is-light">我看過這部影片</span>: 表示该影片在您的"已看"列表中。</li>
                           <li style="margin-bottom: 5px;"> <span class="tag is-warning is-light">已浏览</span>: 表示您曾访问过该影片的详情页。</li>
                        </ul>
                    </li>
                    <li style="margin-bottom: 8px;"><strong>自动隐藏:</strong> 根据您在主面板中的开关设置，自动隐藏对应的"已看"、"已浏览"或"VR"影片。</li>
                    <li style="margin-bottom: 8px;"><strong>懒加载与翻页插件支持:</strong> 无论您是向下滚动无限加载，还是使用自动翻页插件，新加载的影片都会被自动处理（添加标签或隐藏）。</li>
                    <li style="margin-bottom: 8px;"><strong>页面数据导出 (特定页面):</strong> 在您的"看过"、"想看"、"收藏夹"等页面，顶部会出现一个导出工具。此功能会<strong>自动翻页</strong>抓取您指定页数或所有页的影片信息，并生成一个 <code>.json</code> 文件供您下载。这不仅仅是导出，更是一种<strong>安全备份机制</strong>。通过先导出为文件，可以确保在网络不稳定或操作中断时，您的原始数据不会损坏，保证了数据的完整性和安全性。</li>
                </ul>
                <h3 style="font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px;">详情页功能</h3>
                <ul style="padding-left: 20px;">
                    <li style="margin-bottom: 8px;"><strong>自动记录浏览:</strong> 当您访问一部影片的详情页时，脚本会在3-5秒的随机延迟后，自动将其番号记录到"已浏览"列表中。这可以避免误操作，并模拟真实浏览行为。如果记录失败，脚本会自动重试最多5次。</li>
                    <li style="margin-bottom: 8px;"><strong>状态提示:</strong>
                        <ul style="padding-left: 20px; margin-top: 8px;">
                            <li style="margin-bottom: 5px;"><strong>悬浮按钮变色:</strong> 如果当前影片处于"已看"或"已浏览"状态，左侧的悬浮球按钮会由默认的粉色变为<span style="color: #2ed573; font-weight: bold;">绿色</span>，给您最直观的提示。</li>
                            <li><strong>网页标签页图标 (Favicon) 变更:</strong> 同时，浏览器标签页的图标也会改变为一个特殊的"R"图标，方便您在多个标签页中快速识别已处理过的影片。</li>
                        </ul>
                    </li>
                </ul>
            </div>`;
        helpPanel.innerHTML = `
        <div class="help-header">
            <h2>功能说明</h2>
            <span id="closeHelpBtn">&times;</span>
        </div>` + helpContent; // The content will be dynamically loaded or inserted here.
        // For brevity, I'm assuming the help content is filled.
        // In a real scenario, you'd fetch this or have it directly in the HTML.
        
        helpBtn.addEventListener('click', () => {
            helpPanel.style.display = 'block';
            document.getElementById('panel').style.overflowY = 'hidden';
        });
        helpPanel.addEventListener('click', (e) => {
            if (e.target.id === 'closeHelpBtn') {
                helpPanel.style.display = 'none';
                document.getElementById('panel').style.overflowY = 'auto';
            }
        });
    }

    // --- Initial Load ---
    async function initialize() {
        updateAllDisplays();
        const settings = await getSettings();
        versionAuthorInfo.innerHTML = `Version: ${settings.version}<br>Author: Ryen`;
        setupHelpPanel(); // Help panel content is large, should be handled carefully
    }

    initialize();
}); 
import { getValue, setValue } from '../utils/storage.js';

const CONFIG = {
    VERSION: '2025.07.09.2235', // Keep version in sync with userscript
    HIDE_WATCHED_VIDEOS_KEY: 'hideWatchedVideos',
    HIDE_VIEWED_VIDEOS_KEY: 'hideViewedVideos',
    HIDE_VR_VIDEOS_KEY: 'hideVRVideos',
    STORED_IDS_KEY: 'myIds',
    BROWSE_HISTORY_KEY: 'videoBrowseHistory',
    LAST_UPLOAD_TIME_KEY: 'lastUploadTime',
    LAST_EXPORT_TIME_KEY: 'lastExportTime',
    WEBDEV_SETTINGS_KEY: 'webdavSettings'
};

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
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
    const webdavUrl = document.getElementById('webdavUrl');
    const webdavPath = document.getElementById('webdavPath');
    const webdavUsername = document.getElementById('webdavUsername');
    const webdavPassword = document.getElementById('webdavPassword');
    const testWebdavBtn = document.getElementById('testWebdavBtn');
    const uploadWebdavBtn = document.getElementById('uploadWebdavBtn');
    const searchBox = document.getElementById('searchBox');
    const resultContainer = document.getElementById('resultContainer');
    const browseHistoryBox = document.getElementById('browseHistoryBox');
    const browseHistoryResultContainer = document.getElementById('browseHistoryResultContainer');
    const idCountDisplay = document.getElementById('idCountDisplay');
    const uploadTimeDisplay = document.getElementById('uploadTimeDisplay');
    const exportTimeDisplay = document.getElementById('exportTimeDisplay');
    const versionAuthorInfo = document.getElementById('versionAuthorInfo');
    const messageContainer = document.getElementById('messageContainer');

    // --- Functions ---

    // New Toast Notification Function
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;

        messageContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, duration);
    }


    // 1. Import/Upload
    customUploadBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const jsonData = JSON.parse(evt.target.result);
                const watched = new Set(await getValue(CONFIG.STORED_IDS_KEY, []));
                const viewed = new Set(await getValue(CONFIG.BROWSE_HISTORY_KEY, []));

                if (Array.isArray(jsonData)) { // Legacy format
                    jsonData.forEach(item => item.id && watched.add(item.id));
                } else if (jsonData.myIds || jsonData.videoBrowseHistory) { // New format
                    (jsonData.myIds || []).forEach(id => watched.add(id));
                    (jsonData.videoBrowseHistory || []).forEach(id => viewed.add(id));
                }

                await setValue(CONFIG.STORED_IDS_KEY, Array.from(watched));
                await setValue(CONFIG.BROWSE_HISTORY_KEY, Array.from(viewed));

                const now = new Date().toLocaleString();
                await setValue(CONFIG.LAST_UPLOAD_TIME_KEY, now);
                uploadTimeDisplay.textContent = `上次上传时间：${now}`;

                updateCountDisplay();
                showToast('数据导入成功！', 'success');
            } catch (err) {
                showToast('解析 JSON 失败: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    });

    // 2. Toggle Buttons
    function createToggleButton(key, container, textActive, textInactive) {
        const button = document.createElement('button');
        button.className = 'toggle-button';

        const updateState = (isActive) => {
            button.textContent = isActive ? textActive : textInactive;
            button.classList.toggle('active', isActive);
            button.classList.toggle('inactive', !isActive);
        };

        getValue(key, false).then(updateState);

        button.addEventListener('click', async () => {
            const currentState = await getValue(key, false);
            const newState = !currentState;
            await setValue(key, newState);
            updateState(newState);
            // In dashboard, no need to reload tabs. User can do it manually.
        });

        container.appendChild(button);
        return button;
    }

    createToggleButton(CONFIG.HIDE_WATCHED_VIDEOS_KEY, toggleWatchedContainer, '当前：隐藏已看的番号', '当前：显示已看的番号');
    createToggleButton(CONFIG.HIDE_VIEWED_VIDEOS_KEY, toggleViewedContainer, '当前：隐藏已浏览的番号', '当前：显示已浏览的番号');
    createToggleButton(CONFIG.HIDE_VR_VIDEOS_KEY, toggleVRContainer, '当前：隐藏VR番号', '当前：显示VR番号');


    // 3. Export & Clear
    exportBtn.addEventListener('click', async () => {
        const myIds = await getValue(CONFIG.STORED_IDS_KEY, []);
        const videoBrowseHistory = await getValue(CONFIG.BROWSE_HISTORY_KEY, []);

        if (myIds.length === 0 && videoBrowseHistory.length === 0) {
            showToast('没有存储任何数据。', 'info');
            return;
        }

        const dataToExport = { myIds, videoBrowseHistory };
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
        await setValue(CONFIG.LAST_EXPORT_TIME_KEY, now.toISOString());
        exportTimeDisplay.textContent = `上次备份时间：${now.toLocaleString()}`;
        showToast('数据已成功导出。', 'success');
    });

    clearBtn.addEventListener('click', async () => {
        if (confirm('确定要清除所有存储的番号和设置吗？此操作不可逆！')) {
            await setValue(CONFIG.STORED_IDS_KEY, []);
            await setValue(CONFIG.BROWSE_HISTORY_KEY, []);
            await setValue(CONFIG.HIDE_WATCHED_VIDEOS_KEY, false);
            await setValue(CONFIG.HIDE_VIEWED_VIDEOS_KEY, false);
            await setValue(CONFIG.HIDE_VR_VIDEOS_KEY, false);
            await setValue(CONFIG.LAST_UPLOAD_TIME_KEY, '');
            await setValue(CONFIG.LAST_EXPORT_TIME_KEY, '');
            await setValue(CONFIG.WEBDEV_SETTINGS_KEY, { url: '', path: '', username: '', password: '' });

            updateAllDisplays();
            showToast('已清除所有数据。', 'success');
        }
    });

    // 4. WebDAV
    const saveWebdavSettings = async () => {
        const settings = {
            url: webdavUrl.value.trim(),
            path: webdavPath.value.trim(),
            username: webdavUsername.value.trim(),
            password: webdavPassword.value
        };
        await setValue(CONFIG.WEBDEV_SETTINGS_KEY, settings);
    };

    [webdavUrl, webdavPath, webdavUsername, webdavPassword].forEach(input => {
        input.addEventListener('change', saveWebdavSettings);
    });

    const sendMessageToBackground = (message) => {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                if(chrome.runtime.lastError) {
                  // Handle error, e.g., extension context invalidated
                  console.error(chrome.runtime.lastError.message);
                  resolve({ success: false, error: 'Extension context invalidated.' });
                } else {
                  resolve(response);
                }
            });
        });
    };

    testWebdavBtn.addEventListener('click', async () => {
        await saveWebdavSettings();
        const settings = await getValue(CONFIG.WEBDEV_SETTINGS_KEY);
        if (!settings.url) {
            showToast('WebDAV URL 不能为空', 'error');
            return;
        }
        showToast('正在测试连接...', 'info');
        const response = await sendMessageToBackground({ type: 'webdav-test', settings });
        showToast(response.success ? 'WebDAV 连接成功！' : `WebDAV 连接失败: ${response.error}`, response.success ? 'success' : 'error');
    });

    uploadWebdavBtn.addEventListener('click', async () => {
        await saveWebdavSettings();
        const settings = await getValue(CONFIG.WEBDEV_SETTINGS_KEY);
        if (!settings.url) {
            showToast('请先配置并测试 WebDAV 设置', 'error');
            return;
        }

        const myIds = await getValue(CONFIG.STORED_IDS_KEY, []);
        const videoBrowseHistory = await getValue(CONFIG.BROWSE_HISTORY_KEY, []);
        if (myIds.length === 0 && videoBrowseHistory.length === 0) {
            showToast('没有数据可以备份', 'info');
            return;
        }

        showToast('开始上传备份到 WebDAV...', 'info');
        const response = await sendMessageToBackground({ type: 'webdav-upload', settings, data: { myIds, videoBrowseHistory }});
        showToast(response.success ? '备份成功上传到 WebDAV！' : `上传失败: ${response.error}`, response.success ? 'success' : 'error');
    });

    // 5. Search
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

    searchBox.addEventListener('input', () => handleSearch(searchBox, resultContainer, CONFIG.STORED_IDS_KEY));
    browseHistoryBox.addEventListener('input', () => handleSearch(browseHistoryBox, browseHistoryResultContainer, CONFIG.BROWSE_HISTORY_KEY));


    // 6. Info Displays
    async function updateCountDisplay() {
        const watchedCount = (await getValue(CONFIG.STORED_IDS_KEY, [])).length;
        const browseCount = (await getValue(CONFIG.BROWSE_HISTORY_KEY, [])).length;
        idCountDisplay.innerHTML = `<div>已看番号总数: ${watchedCount}</div><div>已浏览番号总数: ${browseCount}</div>`;
    }

    async function updateTimeDisplays() {
        const lastUpload = await getValue(CONFIG.LAST_UPLOAD_TIME_KEY, '');
        uploadTimeDisplay.textContent = lastUpload ? `上次上传时间：${lastUpload}` : '';

        const lastExport = await getValue(CONFIG.LAST_EXPORT_TIME_KEY, '');
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
        const settings = await getValue(CONFIG.WEBDEV_SETTINGS_KEY, {});
        webdavUrl.value = settings.url || '';
        webdavPath.value = settings.path || '';
        webdavUsername.value = settings.username || '';
        webdavPassword.value = settings.password || '';
    }

    function updateAllDisplays() {
        updateCountDisplay();
        updateTimeDisplays();
        updateWebdavDisplay();
    }

    // 7. Help Panel
    function setupHelpPanel() {
        const helpContent = `
            <div class="help-content-wrapper">
                <div class="help-header">
                    <h2>功能说明</h2>
                    <button id="closeHelpBtn">&times;</button>
                </div>
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
                </div>
            </div>`;
        helpPanel.innerHTML = helpContent;

        helpBtn.addEventListener('click', () => {
            helpPanel.style.display = 'flex';
        });
        helpPanel.addEventListener('click', (e) => {
            // Close if the background or the close button is clicked
            if (e.target === helpPanel || e.target.id === 'closeHelpBtn') {
                helpPanel.style.display = 'none';
            }
        });
    }

    // --- Initial Load ---
    function initialize() {
        updateAllDisplays();
        versionAuthorInfo.innerHTML = `Version: ${CONFIG.VERSION}<br>Author: Ryen`;
        setupHelpPanel();
    }

    initialize();
}); 
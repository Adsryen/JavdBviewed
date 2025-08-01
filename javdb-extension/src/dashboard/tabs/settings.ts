import { STATE } from '../state';
import { saveSettings, getValue, setValue } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import type { ExtensionSettings, VideoRecord, OldVideoRecord } from '../../types';
import { STORAGE_KEYS } from '../../utils/config';

// Import updateSyncStatus function
declare function updateSyncStatus(): void;

export function initSettingsTab(): void {
    // Initialize settings navigation
    initSettingsNavigation();

    // Initialize network test functionality
    initNetworkTestFunctionality();

    // Initialize advanced settings functionality
    initAdvancedSettingsFunctionality();

    // Initialize sync settings functionality
    initSyncSettingsFunctionality();

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

    // 增强功能设置元素
    const enableMultiSource = document.getElementById('enableMultiSource') as HTMLInputElement;
    const enableImageCache = document.getElementById('enableImageCache') as HTMLInputElement;
    const enableVideoPreview = document.getElementById('enableVideoPreview') as HTMLInputElement;
    const enableTranslation = document.getElementById('enableTranslation') as HTMLInputElement;
    const enableRatingAggregation = document.getElementById('enableRatingAggregation') as HTMLInputElement;
    const enableActorInfo = document.getElementById('enableActorInfo') as HTMLInputElement;
    const cacheExpiration = document.getElementById('cacheExpiration') as HTMLInputElement;

    const enableQuickCopy = document.getElementById('enableQuickCopy') as HTMLInputElement;
    const enableContentFilter = document.getElementById('enableContentFilter') as HTMLInputElement;
    const enableKeyboardShortcuts = document.getElementById('enableKeyboardShortcuts') as HTMLInputElement;
    const enableMagnetSearch = document.getElementById('enableMagnetSearch') as HTMLInputElement;
    const showEnhancedTooltips = document.getElementById('showEnhancedTooltips') as HTMLInputElement;

    const saveEnhancementSettingsBtn = document.getElementById('saveEnhancementSettings') as HTMLButtonElement;

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
                : engine.icon || 'assets/alternate-search.png';

            engineDiv.innerHTML = `
                <div class="icon-preview">
                    <img src="${iconSrc}" alt="${engine.name}" onerror="this.onerror=null; this.src='${chrome.runtime.getURL('assets/alternate-search.png')}';">
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
        try {
            // 确保 STATE.settings 存在且有必要的属性
            const settings = STATE.settings || {};

            // 安全地解构设置对象，提供默认值
            const webdav = settings.webdav || {};
            const display = settings.display || {};
            const logging = settings.logging || {};
            const searchEngines = settings.searchEngines || [];
            const dataSync = settings.dataSync || {};
            const dataEnhancement = settings.dataEnhancement || {};
            const userExperience = settings.userExperience || {};

            // WebDAV 设置 - 提供默认值
            webdavEnabled.checked = webdav.enabled || false;
            webdavUrl.value = webdav.url || '';
            webdavUser.value = webdav.username || '';
            webdavPass.value = webdav.password || '';
            webdavAutoSync.checked = webdav.autoSync || false;
            webdavSyncInterval.value = String(webdav.syncInterval || 30);
            lastSyncTime.textContent = webdav.lastSync ? new Date(webdav.lastSync).toLocaleString() : 'Never';

            // 更新UI状态
            updateWebDAVControlsState();
            (document.getElementById('webdav-fields-container') as HTMLDivElement).style.display = (webdav.enabled || false) ? 'block' : 'none';

            // 显示设置 - 提供默认值
            hideViewed.checked = display.hideViewed || false;
            hideBrowsed.checked = display.hideBrowsed || false;
            hideVR.checked = display.hideVR || false;



            // 日志设置
            maxLogEntries.value = String(logging?.maxLogEntries || 1500);

            // 搜索引擎设置
            if (Array.isArray(searchEngines) && searchEngines.length > 0) {
                renderSearchEngines();
            }

            // 增强功能设置
            enableMultiSource.checked = dataEnhancement?.enableMultiSource || false;
            enableImageCache.checked = dataEnhancement?.enableImageCache || true;
            enableVideoPreview.checked = dataEnhancement?.enableVideoPreview || false;
            enableTranslation.checked = dataEnhancement?.enableTranslation || false;
            enableRatingAggregation.checked = dataEnhancement?.enableRatingAggregation || false;
            enableActorInfo.checked = dataEnhancement?.enableActorInfo || false;
            cacheExpiration.value = String(dataEnhancement?.cacheExpiration || 24);

            enableQuickCopy.checked = userExperience?.enableQuickCopy || false;
            enableContentFilter.checked = userExperience?.enableContentFilter || false;
            enableKeyboardShortcuts.checked = userExperience?.enableKeyboardShortcuts || false;
            enableMagnetSearch.checked = userExperience?.enableMagnetSearch || false;
            showEnhancedTooltips.checked = userExperience?.showEnhancedTooltips || true;
        } catch (error) {
            console.error('加载设置时出错:', error);
            // 在出错时设置安全的默认值
            webdavEnabled.checked = false;
            hideViewed.checked = false;
            hideBrowsed.checked = false;
            hideVR.checked = false;

            maxLogEntries.value = '1500';
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
                lastSync: STATE.settings?.webdav?.lastSync || ''
            },
            display: {
                hideViewed: hideViewed.checked,
                hideBrowsed: hideBrowsed.checked,
                hideVR: hideVR.checked
            },

            logging: {
                maxLogEntries: parseInt(maxLogEntries.value, 10) || 1500,
            },
            dataEnhancement: {
                enableMultiSource: enableMultiSource.checked,
                enableImageCache: enableImageCache.checked,
                enableVideoPreview: enableVideoPreview.checked,
                enableTranslation: enableTranslation.checked,
                enableRatingAggregation: enableRatingAggregation.checked,
                enableActorInfo: enableActorInfo.checked,
                cacheExpiration: parseInt(cacheExpiration.value, 10) || 24,
            },
            userExperience: {
                enableQuickCopy: enableQuickCopy.checked,
                enableContentFilter: enableContentFilter.checked,
                enableKeyboardShortcuts: enableKeyboardShortcuts.checked,
                enableMagnetSearch: enableMagnetSearch.checked,
                showEnhancedTooltips: showEnhancedTooltips.checked,
            },
            contentFilter: STATE.settings.contentFilter || {
                enabled: false,
                rules: [],
                highlightRules: [],
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

        // 刷新JSON配置显示
        await loadJsonConfig();

        // Update sync status display
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus();
        }
    }

    function handleTestWebDAV() {
        logAsync('INFO', '用户点击了“测试 WebDAV 连接”按钮。');
        handleSaveSettings().then(() => {
            logAsync('INFO', '用户开始测试WebDAV连接');
            showMessage('正在保存设置并测试连接...', 'info');
            testWebdavConnectionBtn.textContent = '连接测试中...';
            testWebdavConnectionBtn.disabled = true;

            logAsync('INFO', '正在向后台发送WebDAV连接测试请求');

            chrome.runtime.sendMessage({ type: 'webdav-test' }, response => {
                if (response && response.success) {
                    showMessage('🎉 WebDAV连接测试成功！服务器响应正常', 'success');
                    logAsync('INFO', 'WebDAV连接测试成功，服务器认证通过');
                } else {
                    const errorMsg = response?.error || '未知错误';
                    let userFriendlyMsg = '';

                    // 根据错误类型提供更友好的提示
                    if (errorMsg.includes('401')) {
                        userFriendlyMsg = '❌ WebDAV连接失败：用户名或密码错误，请检查认证信息';
                    } else if (errorMsg.includes('404')) {
                        userFriendlyMsg = '❌ WebDAV连接失败：服务器地址不存在，请检查URL是否正确';
                    } else if (errorMsg.includes('403')) {
                        userFriendlyMsg = '❌ WebDAV连接失败：没有访问权限，请检查账户权限设置';
                    } else if (errorMsg.includes('timeout') || errorMsg.includes('网络')) {
                        userFriendlyMsg = '❌ WebDAV连接失败：网络超时，请检查网络连接和服务器状态';
                    } else if (errorMsg.includes('not fully configured')) {
                        userFriendlyMsg = '❌ WebDAV连接失败：配置信息不完整，请填写完整的服务器地址、用户名和密码';
                    } else {
                        userFriendlyMsg = `❌ WebDAV连接失败：${errorMsg}`;
                    }

                    showMessage(userFriendlyMsg, 'error');
                    logAsync('ERROR', `WebDAV连接测试失败：${errorMsg}`, {
                        originalError: errorMsg,
                        userMessage: userFriendlyMsg
                    });
                }

                testWebdavConnectionBtn.textContent = '测试连接';
                testWebdavConnectionBtn.disabled = false;
            });
        }).catch(error => {
            showMessage('❌ 保存设置失败，无法进行连接测试', 'error');
            logAsync('ERROR', `保存WebDAV设置失败：${error.message}`);
            testWebdavConnectionBtn.textContent = '测试连接';
            testWebdavConnectionBtn.disabled = false;
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

    // 增强功能设置事件监听器
    saveEnhancementSettingsBtn.addEventListener('click', handleSaveSettings);
    enableMultiSource.addEventListener('change', handleSaveSettings);
    enableImageCache.addEventListener('change', handleSaveSettings);
    enableVideoPreview.addEventListener('change', handleSaveSettings);
    enableTranslation.addEventListener('change', handleSaveSettings);
    enableRatingAggregation.addEventListener('change', handleSaveSettings);
    enableActorInfo.addEventListener('change', handleSaveSettings);
    cacheExpiration.addEventListener('change', handleSaveSettings);
    enableQuickCopy.addEventListener('change', handleSaveSettings);
    enableContentFilter.addEventListener('change', handleSaveSettings);
    enableKeyboardShortcuts.addEventListener('change', handleSaveSettings);
    enableMagnetSearch.addEventListener('change', handleSaveSettings);
    showEnhancedTooltips.addEventListener('change', handleSaveSettings);

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

function initSettingsNavigation(): void {
    const navItems = document.querySelectorAll('.settings-nav-item');
    const panels = document.querySelectorAll('.settings-panel');
    const menuToggle = document.getElementById('settingsMenuToggle') as HTMLButtonElement;
    const sidebar = document.getElementById('settingsSidebar') as HTMLDivElement;

    // Handle navigation item clicks
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            if (!sectionId) return;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding panel
            panels.forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(sectionId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Handle mobile menu toggle
    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (window.innerWidth <= 768 &&
            !sidebar.contains(target) &&
            !menuToggle.contains(target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
        }
    });
}

/**
 * 初始化同步设置功能
 */
function initSyncSettingsFunctionality(): void {
    // 加载同步设置
    loadSyncSettings();

    // 保存同步设置
    const saveSyncBtn = document.getElementById('saveSyncSettings');
    if (saveSyncBtn) {
        saveSyncBtn.addEventListener('click', saveSyncSettings);
    }

    // 测试连接
    const testConnectionBtn = document.getElementById('testActorSyncConnection');
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', testActorSyncConnection);
    }

    // 测试解析
    const testParsingBtn = document.getElementById('testActorSyncParsing');
    if (testParsingBtn) {
        testParsingBtn.addEventListener('click', testActorSyncParsing);
    }

    // 启用/禁用控制
    const enabledCheckbox = document.getElementById('actorSyncEnabled') as HTMLInputElement;
    if (enabledCheckbox) {
        enabledCheckbox.addEventListener('change', toggleActorSyncControls);
        toggleActorSyncControls(); // 初始状态
    }
}

/**
 * 加载同步设置
 */
async function loadSyncSettings(): Promise<void> {
    try {
        const settings = STATE.settings;
        if (!settings) {
            console.warn('设置不存在，使用默认值');
            return;
        }

        const dataSync = settings.dataSync;
        const actorSync = settings.actorSync;

        // 视频数据同步URL配置
        const wantWatchUrlInput = document.getElementById('dataSyncWantWatchUrl') as HTMLInputElement;
        const watchedVideosUrlInput = document.getElementById('dataSyncWatchedVideosUrl') as HTMLInputElement;

        // 演员数据同步配置
        const enabledCheckbox = document.getElementById('actorSyncEnabled') as HTMLInputElement;
        const autoSyncCheckbox = document.getElementById('actorAutoSync') as HTMLInputElement;
        const syncIntervalInput = document.getElementById('actorSyncInterval') as HTMLInputElement;
        const collectionUrlInput = document.getElementById('actorSyncCollectionUrl') as HTMLInputElement;
        const detailUrlInput = document.getElementById('actorSyncDetailUrl') as HTMLInputElement;

        // 通用同步行为配置
        const requestIntervalInput = document.getElementById('dataSyncRequestInterval') as HTMLInputElement;
        const batchSizeInput = document.getElementById('dataSyncBatchSize') as HTMLInputElement;
        const maxRetriesInput = document.getElementById('dataSyncMaxRetries') as HTMLInputElement;

        // 演员同步特有配置
        const actorRequestIntervalInput = document.getElementById('actorSyncRequestInterval') as HTMLInputElement;
        const actorBatchSizeInput = document.getElementById('actorSyncBatchSize') as HTMLInputElement;
        const actorMaxRetriesInput = document.getElementById('actorSyncMaxRetries') as HTMLInputElement;

        // 安全地设置值，提供默认值
        // 视频数据同步
        if (wantWatchUrlInput) wantWatchUrlInput.value = dataSync?.urls?.wantWatch || 'https://javdb.com/users/want_watch_videos';
        if (watchedVideosUrlInput) watchedVideosUrlInput.value = dataSync?.urls?.watchedVideos || 'https://javdb.com/users/watched_videos';
        if (requestIntervalInput) requestIntervalInput.value = (dataSync?.requestInterval || 3).toString();
        if (batchSizeInput) batchSizeInput.value = (dataSync?.batchSize || 20).toString();
        if (maxRetriesInput) maxRetriesInput.value = (dataSync?.maxRetries || 3).toString();

        // 演员数据同步
        if (enabledCheckbox) enabledCheckbox.checked = actorSync?.enabled || false;
        if (autoSyncCheckbox) autoSyncCheckbox.checked = actorSync?.autoSync || false;
        if (syncIntervalInput) syncIntervalInput.value = (actorSync?.syncInterval || 1440).toString();
        if (collectionUrlInput) collectionUrlInput.value = actorSync?.urls?.collectionActors || 'https://javdb.com/users/collection_actors';
        if (detailUrlInput) detailUrlInput.value = actorSync?.urls?.actorDetail || 'https://javdb.com/actors/{{ACTOR_ID}}';
        if (actorRequestIntervalInput) actorRequestIntervalInput.value = (actorSync?.requestInterval || 3).toString();
        if (actorBatchSizeInput) actorBatchSizeInput.value = (actorSync?.batchSize || 20).toString();
        if (actorMaxRetriesInput) actorMaxRetriesInput.value = (actorSync?.maxRetries || 3).toString();

    } catch (error) {
        console.error('加载同步设置时出错:', error);
        showMessage('加载同步设置失败', 'error');
    }
}

/**
 * 保存同步设置
 */
async function saveSyncSettings(): Promise<void> {
    try {
        const settings = STATE.settings;

        // 视频数据同步URL配置
        const wantWatchUrlInput = document.getElementById('dataSyncWantWatchUrl') as HTMLInputElement;
        const watchedVideosUrlInput = document.getElementById('dataSyncWatchedVideosUrl') as HTMLInputElement;

        // 演员数据同步配置
        const enabledCheckbox = document.getElementById('actorSyncEnabled') as HTMLInputElement;
        const autoSyncCheckbox = document.getElementById('actorAutoSync') as HTMLInputElement;
        const syncIntervalInput = document.getElementById('actorSyncInterval') as HTMLInputElement;
        const collectionUrlInput = document.getElementById('actorSyncCollectionUrl') as HTMLInputElement;
        const detailUrlInput = document.getElementById('actorSyncDetailUrl') as HTMLInputElement;

        // 通用同步行为配置
        const requestIntervalInput = document.getElementById('dataSyncRequestInterval') as HTMLInputElement;
        const batchSizeInput = document.getElementById('dataSyncBatchSize') as HTMLInputElement;
        const maxRetriesInput = document.getElementById('dataSyncMaxRetries') as HTMLInputElement;

        // 演员同步特有配置
        const actorRequestIntervalInput = document.getElementById('actorSyncRequestInterval') as HTMLInputElement;
        const actorBatchSizeInput = document.getElementById('actorSyncBatchSize') as HTMLInputElement;
        const actorMaxRetriesInput = document.getElementById('actorSyncMaxRetries') as HTMLInputElement;

        // 验证输入
        const requestInterval = parseInt(requestIntervalInput?.value || '3');
        const batchSize = parseInt(batchSizeInput?.value || '20');
        const maxRetries = parseInt(maxRetriesInput?.value || '3');
        const syncInterval = parseInt(syncIntervalInput?.value || '1440');
        const actorRequestInterval = parseInt(actorRequestIntervalInput?.value || '3');
        const actorBatchSize = parseInt(actorBatchSizeInput?.value || '20');
        const actorMaxRetries = parseInt(actorMaxRetriesInput?.value || '3');

        // 验证数据同步配置
        if (requestInterval < 1 || requestInterval > 60) {
            showMessage('视频同步请求间隔必须在1-60秒之间', 'error');
            return;
        }

        if (batchSize < 10 || batchSize > 100) {
            showMessage('视频同步批量处理大小必须在10-100之间', 'error');
            return;
        }

        if (maxRetries < 1 || maxRetries > 10) {
            showMessage('视频同步最大重试次数必须在1-10之间', 'error');
            return;
        }

        // 验证演员同步配置
        if (syncInterval < 60 || syncInterval > 10080) {
            showMessage('演员同步间隔必须在60-10080分钟之间', 'error');
            return;
        }

        if (actorRequestInterval < 3 || actorRequestInterval > 60) {
            showMessage('演员同步请求间隔必须在3-60秒之间', 'error');
            return;
        }

        if (actorBatchSize < 10 || actorBatchSize > 50) {
            showMessage('演员同步批量处理大小必须在10-50之间', 'error');
            return;
        }

        if (actorMaxRetries < 1 || actorMaxRetries > 10) {
            showMessage('演员同步最大重试次数必须在1-10之间', 'error');
            return;
        }

        // 更新数据同步设置
        settings.dataSync = {
            requestInterval,
            batchSize,
            maxRetries,
            urls: {
                wantWatch: wantWatchUrlInput?.value || 'https://javdb.com/users/want_watch_videos',
                watchedVideos: watchedVideosUrlInput?.value || 'https://javdb.com/users/watched_videos',
                collectionActors: collectionUrlInput?.value || 'https://javdb.com/users/collection_actors',
            },
        };

        // 更新演员同步设置
        settings.actorSync = {
            enabled: enabledCheckbox?.checked || false,
            autoSync: autoSyncCheckbox?.checked || false,
            syncInterval,
            batchSize: actorBatchSize,
            maxRetries: actorMaxRetries,
            requestInterval: actorRequestInterval,
            urls: {
                collectionActors: collectionUrlInput?.value || 'https://javdb.com/users/collection_actors',
                actorDetail: detailUrlInput?.value || 'https://javdb.com/actors/{{ACTOR_ID}}',
            },
        };

        // 保存设置
        await saveSettings(settings);
        STATE.settings = settings;

        showMessage('同步设置已保存', 'success');
        logAsync('INFO', '同步设置已保存', { dataSync: settings.dataSync, actorSync: settings.actorSync });

    } catch (error) {
        console.error('保存同步设置时出错:', error);
        showMessage('保存同步设置失败', 'error');
    }
}







/**
 * 切换演员同步控制状态
 */
function toggleActorSyncControls(): void {
    const enabledCheckbox = document.getElementById('actorSyncEnabled') as HTMLInputElement;
    const isEnabled = enabledCheckbox?.checked || false;

    // 获取所有需要控制的元素
    const controlElements = [
        'actorAutoSync',
        'actorSyncInterval',
        'actorSyncCollectionUrl',
        'actorSyncDetailUrl',
        'actorSyncRequestInterval',
        'actorSyncBatchSize',
        'actorSyncMaxRetries',
        'testActorSyncConnection',
        'testActorSyncParsing'
    ];

    controlElements.forEach(id => {
        const element = document.getElementById(id) as HTMLInputElement | HTMLButtonElement;
        if (element) {
            element.disabled = !isEnabled;
        }
    });
}

/**
 * 测试演员同步连接
 */
async function testActorSyncConnection(): Promise<void> {
    const testResultsDiv = document.getElementById('actorSyncTestResults');
    const testBtn = document.getElementById('testActorSyncConnection') as HTMLButtonElement;

    if (!testResultsDiv || !testBtn) return;

    try {
        testBtn.disabled = true;
        testBtn.textContent = '测试中...';

        const collectionUrlInput = document.getElementById('actorSyncCollectionUrl') as HTMLInputElement;
        const url = collectionUrlInput?.value || 'https://javdb.com/users/collection_actors';

        const response = await fetch(url + '?page=1', {
            method: 'HEAD', // 只获取头部信息
            mode: 'no-cors' // 避免CORS问题
        });

        testResultsDiv.innerHTML = `
            <div class="test-result-success">
                <i class="fas fa-check-circle"></i>
                连接测试成功！可以访问演员列表页面。
            </div>
        `;

    } catch (error) {
        testResultsDiv.innerHTML = `
            <div class="test-result-error">
                <i class="fas fa-exclamation-circle"></i>
                连接测试失败：${error instanceof Error ? error.message : '未知错误'}
            </div>
        `;
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = '测试连接';
    }
}

/**
 * 测试演员同步解析
 */
async function testActorSyncParsing(): Promise<void> {
    const testResultsDiv = document.getElementById('actorSyncTestResults');
    const testBtn = document.getElementById('testActorSyncParsing') as HTMLButtonElement;

    if (!testResultsDiv || !testBtn) return;

    try {
        testBtn.disabled = true;
        testBtn.textContent = '测试中...';

        testResultsDiv.innerHTML = `
            <div class="test-result-info">
                <i class="fas fa-info-circle"></i>
                解析测试功能正在开发中，将在后续版本中提供。
            </div>
        `;

    } catch (error) {
        testResultsDiv.innerHTML = `
            <div class="test-result-error">
                <i class="fas fa-exclamation-circle"></i>
                解析测试失败：${error instanceof Error ? error.message : '未知错误'}
            </div>
        `;
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = '测试解析';
    }
}

function initNetworkTestFunctionality(): void {
    const startButton = document.getElementById('start-ping-test') as HTMLButtonElement;
    const urlInput = document.getElementById('ping-url') as HTMLInputElement;
    const resultsContainer = document.getElementById('ping-results') as HTMLDivElement;
    const buttonText = startButton?.querySelector('.button-text') as HTMLSpanElement;
    const spinner = startButton?.querySelector('.spinner') as HTMLDivElement;

    if (!startButton || !urlInput || !resultsContainer || !buttonText || !spinner) {
        console.warn('Network test elements not found, skipping initialization');
        return;
    }

    startButton.addEventListener('click', async () => {
        const urlValue = urlInput.value.trim();
        if (!urlValue) {
            resultsContainer.innerHTML = '<div class="ping-result-item failure"><i class="fas fa-times-circle icon"></i><span>❌ 请输入有效的URL地址</span></div>';
            showMessage('请先输入要测试的网址', 'warn');
            return;
        }

        // 显示开始测试的提示
        showMessage('🚀 开始网络延迟测试...', 'info');
        logAsync('INFO', `用户开始测试网络连接: ${urlValue}`);

        startButton.disabled = true;
        buttonText.textContent = '测试中...';
        spinner.classList.remove('hidden');
        resultsContainer.innerHTML = '';

        // 添加测试开始的提示
        resultsContainer.innerHTML = '<div class="ping-result-item" style="background: #e3f2fd; border-color: #2196f3;"><i class="fas fa-rocket icon" style="color: #2196f3;"></i><span>🔄 正在准备网络测试...</span></div>';

        const onProgress = (message: string, success: boolean, latency?: number) => {
            const item = document.createElement('div');
            item.classList.add('ping-result-item');
            item.classList.add(success ? 'success' : 'failure');
            const iconClass = success ? 'fa-check-circle' : 'fa-times-circle';
            let content = `<i class="fas ${iconClass} icon"></i>`;

            // 优化显示内容，提供更友好的中文提示
            if (typeof latency !== 'undefined') {
                if (success) {
                    if (latency < 100) {
                        content += `<span>✅ ${message} - 响应时间: ${latency}ms (优秀)</span>`;
                    } else if (latency < 300) {
                        content += `<span>✅ ${message} - 响应时间: ${latency}ms (良好)</span>`;
                    } else {
                        content += `<span>✅ ${message} - 响应时间: ${latency}ms (较慢)</span>`;
                    }
                } else {
                    content += `<span>❌ ${message} - 耗时: ${latency}ms</span>`;
                }
            } else {
                content += `<span>${success ? '🔄' : '❌'} ${message}</span>`;
            }

            item.innerHTML = content;
            resultsContainer.appendChild(item);

            // 记录详细的网络测试日志
            logAsync(success ? 'INFO' : 'WARN', `网络测试: ${message}${latency ? ` (${latency}ms)` : ''}`);
        };

        const urlsToTest: string[] = [];
        if (urlValue.match(/^https?:\/\//)) {
            urlsToTest.push(urlValue);
        } else {
            urlsToTest.push(`https://${urlValue}`);
            urlsToTest.push(`http://${urlValue}`);
        }

        for (const url of urlsToTest) {
            await runPingTest(url, resultsContainer, onProgress);
            // Add a separator if there are more tests to run
            if (urlsToTest.length > 1 && url !== urlsToTest[urlsToTest.length - 1]) {
                const separator = document.createElement('hr');
                separator.style.marginTop = '20px';
                separator.style.marginBottom = '20px';
                separator.style.border = 'none';
                separator.style.borderTop = '1px solid #ccc';
                resultsContainer.appendChild(separator);
            }
        }

        startButton.disabled = false;
        buttonText.textContent = '开始测试';
        spinner.classList.add('hidden');

        // 显示测试完成的提示
        showMessage('✅ 网络延迟测试完成！', 'success');
        logAsync('INFO', `网络连接测试完成: ${urlValue}`);
    });
}

async function ping(
    url: string,
    onProgress: (message: string, success: boolean, latency?: number) => void,
    count = 4
): Promise<number[]> {
    const latencies: number[] = [];
    const testUrl = url;

    onProgress(`正在连接 ${testUrl}`, true);

    for (let i = 0; i < count; i++) {
        const startTime = Date.now();
        try {
            const cacheBuster = `?t=${new Date().getTime()}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            await fetch(testUrl + cacheBuster, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const latency = Date.now() - startTime;
            latencies.push(latency);
            onProgress(`第${i + 1}次请求成功`, true, latency);

            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            const latency = Date.now() - startTime;
            let errorMessage = '未知错误';
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = '连接超时 (5秒)';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = '网络连接失败';
                } else {
                    errorMessage = error.message;
                }
            }
            onProgress(`第${i + 1}次请求失败: ${errorMessage}`, false, latency);
            latencies.push(-1);
        }
    }
    return latencies;
}

async function runPingTest(
    url: string,
    resultsContainer: HTMLDivElement,
    onProgress: (message: string, success: boolean, latency?: number) => void
) {
    try {
        const latencies = await ping(url, onProgress, 4);

        // Remove the "Pinging..." message for this specific test
        const pingingMessage = Array.from(resultsContainer.children).find(child => child.textContent?.includes(`正在 Ping ${url}`));
        if (pingingMessage) {
            resultsContainer.removeChild(pingingMessage);
        }

        const validLatencies = latencies.filter(l => l >= 0);
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'ping-summary';

        if (validLatencies.length > 0) {
            const sum = validLatencies.reduce((a, b) => a + b, 0);
            const avg = Math.round(sum / validLatencies.length);
            const min = Math.min(...validLatencies);
            const max = Math.max(...validLatencies);
            const loss = ((latencies.length - validLatencies.length) / latencies.length) * 100;

            // Determine status colors based on performance
            const avgClass = avg < 100 ? 'success' : avg < 300 ? 'warning' : 'danger';
            const lossClass = loss === 0 ? 'success' : loss < 25 ? 'warning' : 'danger';

            summaryDiv.innerHTML = `
                <h5>网络测试统计 - ${url}</h5>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">平均延迟</div>
                        <div class="stat-value ${avgClass}">${avg}ms</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">最短延迟</div>
                        <div class="stat-value">${min}ms</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">最长延迟</div>
                        <div class="stat-value">${max}ms</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">丢包率</div>
                        <div class="stat-value ${lossClass}">${loss.toFixed(1)}%</div>
                    </div>
                </div>
                <p><strong>数据包统计:</strong> 已发送 ${latencies.length} 个，已接收 ${validLatencies.length} 个，丢失 ${latencies.length - validLatencies.length} 个</p>
            `;
        } else {
            summaryDiv.innerHTML = `
                <h5>网络测试统计 - ${url}</h5>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">测试结果</div>
                        <div class="stat-value danger">全部失败</div>
                    </div>
                </div>
                <p style="color: #dc3545; font-weight: 500;">所有 ping 请求均失败。请检查 URL 或您的网络连接。</p>
            `;
        }
        resultsContainer.appendChild(summaryDiv);
    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ping-result-item failure';
        const message = error instanceof Error ? error.message : String(error);
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle icon"></i><span>测试 ${url} 过程中出现错误: ${message}</span>`;
        resultsContainer.appendChild(errorDiv);
    }
}

function initAdvancedSettingsFunctionality(): void {
    const jsonConfigTextarea = document.getElementById('jsonConfig') as HTMLTextAreaElement;
    const editJsonBtn = document.getElementById('editJsonBtn') as HTMLButtonElement;
    const saveJsonBtn = document.getElementById('saveJsonBtn') as HTMLButtonElement;
    const exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
    const rawLogsTextarea = document.getElementById('rawLogsTextarea') as HTMLTextAreaElement;
    const refreshRawLogsBtn = document.getElementById('refreshRawLogsBtn') as HTMLButtonElement;
    const testLogBtn = document.getElementById('testLogBtn') as HTMLButtonElement;
    const rawRecordsTextarea = document.getElementById('rawRecordsTextarea') as HTMLTextAreaElement;
    const refreshRawRecordsBtn = document.getElementById('refreshRawRecordsBtn') as HTMLButtonElement;
    const checkDataStructureBtn = document.getElementById('checkDataStructureBtn') as HTMLButtonElement;

    if (!jsonConfigTextarea || !editJsonBtn || !saveJsonBtn || !exportJsonBtn || !rawLogsTextarea || !refreshRawLogsBtn || !testLogBtn || !rawRecordsTextarea || !refreshRawRecordsBtn || !checkDataStructureBtn) {
        console.error("One or more elements for Advanced Settings not found. Aborting init.");
        return;
    }

    // Load initial settings
    loadJsonConfig();

    // Edit JSON button
    editJsonBtn.addEventListener('click', () => {
        jsonConfigTextarea.readOnly = false;
        jsonConfigTextarea.style.backgroundColor = '#0d1117';
        jsonConfigTextarea.style.color = '#c9d1d9';
        editJsonBtn.classList.add('hidden');
        saveJsonBtn.classList.remove('hidden');
    });

    // Save JSON button
    saveJsonBtn.addEventListener('click', async () => {
        try {
            const configText = jsonConfigTextarea.value;
            const parsedConfig = JSON.parse(configText);

            // Update STATE and save
            Object.assign(STATE.settings, parsedConfig);
            await saveSettings(STATE.settings);

            jsonConfigTextarea.readOnly = true;
            jsonConfigTextarea.style.backgroundColor = '#161b22';
            jsonConfigTextarea.style.color = '#8b949e';
            saveJsonBtn.classList.add('hidden');
            editJsonBtn.classList.remove('hidden');

            showMessage('设置已保存', 'success');
            logAsync('高级设置已通过JSON编辑器更新', 'INFO');
        } catch (error) {
            showMessage('JSON格式错误，请检查语法', 'error');
            logAsync(`JSON格式错误: ${error instanceof Error ? error.message : '未知错误'}`, 'ERROR');
        }
    });

    // Export JSON button
    exportJsonBtn.addEventListener('click', async () => {
        try {
            const allData = {
                settings: STATE.settings,
                videoRecords: await getValue('videoRecords', {}),
                userProfile: await getValue('userProfile', {}),
                logs: await getValue('logs', [])
            };

            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `javdb-complete-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showMessage('完整备份已导出', 'success');
            logAsync('用户导出了完整备份', 'INFO');
        } catch (error) {
            showMessage('导出失败', 'error');
            logAsync(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`, 'ERROR');
        }
    });

    // Raw logs functionality
    refreshRawLogsBtn.addEventListener('click', async () => {
        try {
            // 从 STATE 直接获取日志，而不是重新从 storage 读取
            const logs = STATE.logs || [];
            rawLogsTextarea.value = JSON.stringify(logs, null, 2);
            rawLogsTextarea.classList.remove('hidden');
            showMessage('日志数据已刷新', 'success');
            logAsync('用户刷新并显示了原始日志。', 'INFO');
        } catch (error) {
            const errorMessage = `加载日志时出错: ${error instanceof Error ? error.message : '未知错误'}`;
            rawLogsTextarea.value = errorMessage;
            rawLogsTextarea.classList.remove('hidden');
            showMessage('加载日志失败', 'error');
            logAsync(`显示原始日志时出错: ${error instanceof Error ? error.message : '未知错误'}`, 'ERROR');
        }
    });

    testLogBtn.addEventListener('click', async () => {
        console.log("Attempting to send a test log message...");
        await logAsync('这是一条来自dashboard的测试日志消息', 'INFO');
        showMessage('测试日志已添加，正在刷新日志显示...', 'success');
        // 刷新日志显示
        setTimeout(async () => {
            try {
                const logs = STATE.logs || [];
                rawLogsTextarea.value = JSON.stringify(logs, null, 2);
                rawLogsTextarea.classList.remove('hidden');
            } catch (error) {
                console.error('刷新日志显示失败:', error);
            }
        }, 100);
    });

    // Raw records functionality
    refreshRawRecordsBtn.addEventListener('click', () => {
        try {
            const records = STATE.records || [];
            rawRecordsTextarea.value = JSON.stringify(records, null, 2);
            rawRecordsTextarea.classList.remove('hidden');
            showMessage('记录数据已刷新', 'success');
            logAsync('用户刷新并显示了原始番号库数据。', 'INFO');
        } catch (error) {
            const errorMessage = `加载记录时出错: ${error instanceof Error ? error.message : '未知错误'}`;
            rawRecordsTextarea.value = errorMessage;
            rawRecordsTextarea.classList.remove('hidden');
            showMessage('加载记录失败', 'error');
            logAsync(`显示原始番号库数据时出错: ${error instanceof Error ? error.message : '未知错误'}`, 'ERROR');
        }
    });

    checkDataStructureBtn.addEventListener('click', () => {
        checkDataStructure();
    });
}

async function loadJsonConfig(): Promise<void> {
    const jsonConfigTextarea = document.getElementById('jsonConfig') as HTMLTextAreaElement;
    if (!jsonConfigTextarea) return;

    try {
        const settings = STATE.settings;
        jsonConfigTextarea.value = JSON.stringify(settings, null, 2);
    } catch (error) {
        jsonConfigTextarea.value = '// 加载设置时出错\n' + (error instanceof Error ? error.message : '未知错误');
    }
}

const DEFAULT_VIDEO_RECORD: Omit<VideoRecord, 'id'> = {
    title: '',
    status: 'browsed',
    tags: [],
    createdAt: 0,
    updatedAt: 0,
    releaseDate: null,
    javdbUrl: null,
    javdbImage: null,
};

function checkDataStructure(): void {
    (async () => {
        try {
            const modal = document.getElementById('data-check-modal') as HTMLElement;
            if (!modal) {
                console.error('Data check modal element not found!');
                showMessage('无法找到数据检查窗口，请刷新页面后重试。', 'error');
                return;
            }

            const message = modal.querySelector('#data-check-modal-message') as HTMLElement;
            const diffContainer = modal.querySelector('.diff-container') as HTMLElement;
            const actions = modal.querySelector('#data-check-modal-actions') as HTMLElement;
            const confirmBtn = modal.querySelector('#data-check-confirm-btn') as HTMLButtonElement;
            const cancelBtn = modal.querySelector('#data-check-cancel-btn') as HTMLButtonElement;

            if (!message || !diffContainer || !actions || !confirmBtn || !cancelBtn) {
                console.error('Data check modal elements not found!');
                showMessage('数据检查窗口元素缺失，请刷新页面后重试。', 'error');
                return;
            }

            // Show modal
            modal.classList.remove('hidden');
            modal.classList.add('visible');

            // Hide diff and actions initially
            diffContainer.style.display = 'none';
            actions.style.display = 'none';

            message.textContent = '正在检查数据结构...';

            const records = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {}) as Record<string, VideoRecord | OldVideoRecord>;
            const recordsArray = Object.values(records);
            const totalRecords = recordsArray.length;

            if (totalRecords === 0) {
                message.textContent = '没有找到任何记录，无需检查。';
                return;
            }

            const recordsToFix: (VideoRecord | OldVideoRecord)[] = [];
            const fixedRecordsPreview: Record<string, VideoRecord> = {};

            for (let i = 0; i < totalRecords; i++) {
                const record = recordsArray[i];
                if (!record || !record.id) continue;

                let changed = false;
                const addedFields: string[] = [];
                const newRecord: VideoRecord = { ...DEFAULT_VIDEO_RECORD, ...record };

                // Check and add missing fields
                if (!('createdAt' in newRecord) || typeof newRecord.createdAt === 'undefined') {
                    newRecord.createdAt = Date.now();
                    addedFields.push('createdAt');
                    changed = true;
                }
                if (!('updatedAt' in newRecord) || typeof newRecord.updatedAt === 'undefined') {
                    newRecord.updatedAt = newRecord.createdAt || Date.now();
                    addedFields.push('updatedAt');
                    changed = true;
                }
                if (!('title' in newRecord) || typeof newRecord.title === 'undefined') {
                    newRecord.title = '';
                    addedFields.push('title');
                    changed = true;
                }

                if (changed) {
                    recordsToFix.push(record);
                    fixedRecordsPreview[record.id] = newRecord;
                    console.log(`[数据结构检查] 记录 ${record.id} 需要修复，添加字段: ${addedFields.join(', ')}`);
                }

                if (i % 20 === 0 || i === totalRecords - 1) {
                    message.textContent = `正在检查... (${i + 1}/${totalRecords})`;
                    await new Promise(resolve => requestAnimationFrame(resolve));
                }
            }

            if (recordsToFix.length > 0) {
                const diffBefore = modal.querySelector('#data-check-diff-before') as HTMLElement;
                const diffAfter = modal.querySelector('#data-check-diff-after') as HTMLElement;

                if (!diffBefore || !diffAfter) {
                    console.error('Diff <pre> 元素未找到。');
                    return;
                }

                message.textContent = `检查完成！发现 ${recordsToFix.length} 条记录的结构需要修复。这是一个示例：`;

                try {
                    // 使用自定义的 JSON 序列化来显示 undefined 和 null 值
                    const jsonReplacer = (key: string, value: any) => {
                        if (value === undefined) {
                            return 'undefined';
                        }
                        if (value === null) {
                            return null; // 保持 null 值显示
                        }
                        return value;
                    };

                    diffBefore.textContent = JSON.stringify(recordsToFix[0], jsonReplacer, 2);
                    diffAfter.textContent = JSON.stringify(fixedRecordsPreview[recordsToFix[0].id], jsonReplacer, 2);
                } catch (e) {
                    message.textContent = '无法显示修复示例，因为数据结构过于复杂或存在循环引用。';
                }

                diffContainer.style.display = '';
                actions.style.display = '';

                const hideModal = () => {
                    modal.classList.remove('visible');
                    modal.classList.add('hidden');
                };

                const onConfirm = async () => {
                    hideModal();
                    showMessage('正在修复记录...', 'info');

                    // 调试日志：显示修复前后的数据
                    console.log('[数据结构修复] 修复前记录数量:', Object.keys(records).length);
                    console.log('[数据结构修复] 待修复记录数量:', recordsToFix.length);
                    console.log('[数据结构修复] 修复预览数据:', fixedRecordsPreview);

                    const allRecords = { ...records, ...fixedRecordsPreview };
                    console.log('[数据结构修复] 合并后记录数量:', Object.keys(allRecords).length);

                    // 显示一个修复示例
                    const firstFixedId = Object.keys(fixedRecordsPreview)[0];
                    if (firstFixedId) {
                        console.log('[数据结构修复] 修复示例 - 原记录:', records[firstFixedId]);
                        console.log('[数据结构修复] 修复示例 - 新记录:', fixedRecordsPreview[firstFixedId]);
                    }

                    await setValue(STORAGE_KEYS.VIEWED_RECORDS, allRecords);
                    console.log('[数据结构修复] 数据已保存到存储');

                    showMessage(`成功修复了 ${recordsToFix.length} 条记录。页面将刷新。`, 'success');
                    logAsync(`数据结构修复完成，共修复 ${recordsToFix.length} 条记录。`, 'INFO');
                    setTimeout(() => window.location.reload(), 1500);
                };

                const onCancel = () => {
                    hideModal();
                    logAsync('用户取消了数据结构修复操作。', 'INFO');
                };

                confirmBtn.onclick = onConfirm;
                cancelBtn.onclick = onCancel;
            } else {
                message.textContent = '数据结构检查完成，所有记录都符合标准，无需修复。';
                setTimeout(() => {
                    modal.classList.remove('visible');
                    modal.classList.add('hidden');
                }, 2000);
            }
        } catch (error) {
            console.error('[数据结构检查] 出现错误:', error);
            showMessage('数据结构检查过程中出现错误，请查看控制台了解详情。', 'error');
            logAsync(`数据结构检查错误: ${error instanceof Error ? error.message : '未知错误'}`, 'ERROR');
        }
    })();
}
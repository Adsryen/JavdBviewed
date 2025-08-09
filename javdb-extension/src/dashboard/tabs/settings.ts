import { STATE } from '../state';
import { saveSettings, getValue, setValue } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import type { ExtensionSettings, VideoRecord, OldVideoRecord, ActorRecord } from '../../types';
import { STORAGE_KEYS } from '../../utils/config';
import { actorManager } from '../../services/actorManager';
import { initPrivacySettings } from './privacy';
import { onSettingsChanged } from '../../utils/logController';

// Import updateSyncStatus function
declare function updateSyncStatus(): void;

// 全局变量声明，用于在不同函数间共享
let handleSaveSettings: () => Promise<void>;

export function initSettingsTab(): void {
    // 定义 handleSaveSettings 函数，使其在整个 initSettingsTab 作用域内可用
    handleSaveSettings = async function() {
        try {
            console.log('[Settings] 开始保存设置...');

            // 显示保存状态指示器
            const saveStatus = document.getElementById('enhancementSaveStatus');
            if (saveStatus) {
                saveStatus.style.display = 'block';
            }

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
                    verboseMode: verboseMode.checked,
                    showPrivacyLogs: showPrivacyLogs.checked,
                    showStorageLogs: showStorageLogs.checked,
                },
                dataEnhancement: {
                    enableMultiSource: false, // 开发中，强制禁用
                    enableImageCache: false, // 开发中，强制禁用
                    enableVideoPreview: false, // 开发中，强制禁用
                    enableTranslation: enableTranslation.checked,
                    enableRatingAggregation: false, // 开发中，强制禁用
                    enableActorInfo: false, // 开发中，强制禁用
                    cacheExpiration: parseInt(cacheExpiration.value, 10) || 24,
                },
                translation: translationProvider ? {
                    provider: translationProvider.value as 'traditional' | 'ai',
                    traditional: {
                        service: traditionalTranslationService?.value as 'google' | 'baidu' | 'youdao' || 'google',
                        apiKey: traditionalApiKey?.value || undefined,
                        sourceLanguage: 'ja',
                        targetLanguage: 'zh-CN',
                    },
                    ai: {
                        useGlobalModel: useGlobalAiModel?.checked === true,
                        customModel: customTranslationModel?.value || undefined,
                    },
                } : STATE.settings.translation || {
                    provider: 'traditional',
                    traditional: {
                        service: 'google',
                        sourceLanguage: 'ja',
                        targetLanguage: 'zh-CN',
                    },
                    ai: {
                        useGlobalModel: true,
                    },
                },
                userExperience: {
                    enableQuickCopy: enableQuickCopy.checked,
                    enableContentFilter: enableContentFilter.checked,
                    enableKeyboardShortcuts: false, // 开发中，强制禁用
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

            console.log('[Settings] 设置保存成功');
            showMessage('设置已自动保存！', 'success');
            logAsync('INFO', '用户设置已保存。', { settings: newSettings });

            // 更新日志控制器配置
            onSettingsChanged();

            // 刷新JSON配置显示
            await loadJsonConfig();

            // Update sync status display
            if (typeof updateSyncStatus === 'function') {
                updateSyncStatus();
            }
        } catch (error) {
            console.error('[Settings] 保存设置时出错:', error);
            showMessage('保存设置失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
            logAsync('ERROR', '保存设置失败', { error: error instanceof Error ? error.message : String(error) });
        } finally {
            // 隐藏保存状态指示器
            const saveStatus = document.getElementById('enhancementSaveStatus');
            if (saveStatus) {
                setTimeout(() => {
                    saveStatus.style.display = 'none';
                }, 1000);
            }
        }
    };

    // Initialize settings navigation
    initSettingsNavigation();

    // Initialize network test functionality
    initNetworkTestFunctionality();

    // Initialize privacy settings functionality
    initPrivacySettings();

    // Initialize advanced settings functionality
    initAdvancedSettingsFunctionality();

    // Initialize sync settings functionality
    initSyncSettingsFunctionality();

    // Initialize global actions functionality
    initGlobalActionsFunctionality();

    const webdavEnabled = document.getElementById('webdavEnabled') as HTMLInputElement;
    const webdavUrl = document.getElementById('webdavUrl') as HTMLInputElement;
    const webdavUser = document.getElementById('webdavUser') as HTMLInputElement;
    const webdavPass = document.getElementById('webdavPass') as HTMLInputElement;
    const webdavAutoSync = document.getElementById('webdavAutoSync') as HTMLInputElement;
    const webdavSyncInterval = document.getElementById('webdav-sync-interval') as HTMLInputElement;
    const saveWebdavSettingsBtn = document.getElementById('saveWebdavSettings') as HTMLButtonElement;
    const testWebdavConnectionBtn = document.getElementById('testWebdavConnection') as HTMLButtonElement;
    const diagnoseWebdavConnectionBtn = document.getElementById('diagnoseWebdavConnection') as HTMLButtonElement;
    const lastSyncTime = document.getElementById('last-sync-time') as HTMLSpanElement;

    const hideViewed = document.getElementById('hideViewed') as HTMLInputElement;
    const hideBrowsed = document.getElementById('hideBrowsed') as HTMLInputElement;
    const hideVR = document.getElementById('hideVR') as HTMLInputElement;



    const maxLogEntries = document.getElementById('maxLogEntries') as HTMLInputElement;
    const verboseMode = document.getElementById('verboseMode') as HTMLInputElement;
    const showPrivacyLogs = document.getElementById('showPrivacyLogs') as HTMLInputElement;
    const showStorageLogs = document.getElementById('showStorageLogs') as HTMLInputElement;

    // 增强功能设置元素
    const enableMultiSource = document.getElementById('enableMultiSource') as HTMLInputElement;
    const enableImageCache = document.getElementById('enableImageCache') as HTMLInputElement;
    const enableVideoPreview = document.getElementById('enableVideoPreview') as HTMLInputElement;
    const enableTranslation = document.getElementById('enableTranslation') as HTMLInputElement;
    const enableRatingAggregation = document.getElementById('enableRatingAggregation') as HTMLInputElement;
    const enableActorInfo = document.getElementById('enableActorInfo') as HTMLInputElement;
    const cacheExpiration = document.getElementById('cacheExpiration') as HTMLInputElement;

    // 翻译配置元素
    const translationConfig = document.getElementById('translationConfig') as HTMLDivElement;
    const currentTranslationService = document.getElementById('currentTranslationService') as HTMLSpanElement;
    const translationProvider = document.getElementById('translationProvider') as HTMLSelectElement;
    const traditionalTranslationConfig = document.getElementById('traditionalTranslationConfig') as HTMLDivElement;
    const traditionalTranslationService = document.getElementById('traditionalTranslationService') as HTMLSelectElement;
    const traditionalApiKeyGroup = document.getElementById('traditionalApiKeyGroup') as HTMLDivElement;
    const traditionalApiKey = document.getElementById('traditionalApiKey') as HTMLInputElement;
    const aiTranslationConfig = document.getElementById('aiTranslationConfig') as HTMLDivElement;
    const useGlobalAiModel = document.getElementById('useGlobalAiModel') as HTMLInputElement;
    const customAiModelGroup = document.getElementById('customAiModelGroup') as HTMLDivElement;
    const customTranslationModel = document.getElementById('customTranslationModel') as HTMLSelectElement;

    // 检查翻译配置元素是否存在
    if (!translationConfig || !currentTranslationService || !translationProvider) {
        console.warn('翻译配置元素未找到，跳过翻译功能初始化');
        return;
    }

    const enableQuickCopy = document.getElementById('enableQuickCopy') as HTMLInputElement;
    const enableContentFilter = document.getElementById('enableContentFilter') as HTMLInputElement;
    const enableKeyboardShortcuts = document.getElementById('enableKeyboardShortcuts') as HTMLInputElement;
    const enableMagnetSearch = document.getElementById('enableMagnetSearch') as HTMLInputElement;
    const showEnhancedTooltips = document.getElementById('showEnhancedTooltips') as HTMLInputElement;

    function renderSearchEngines() {
        const searchEngineList = document.getElementById('search-engine-list') as HTMLDivElement;
        if (!searchEngineList) return;

        searchEngineList.innerHTML = ''; // Clear existing entries

        STATE.settings.searchEngines?.forEach((engine, index) => {
            if (!engine) {
                console.warn('Skipping invalid search engine entry at index:', index, engine);
                return; // Skips the current iteration
            }

            // 跳过包含测试数据的搜索引擎
            if (engine.urlTemplate && engine.urlTemplate.includes('example.com')) {
                console.warn('跳过包含 example.com 的搜索引擎:', engine);
                return;
            }

            if (engine.icon && engine.icon.includes('google.com/s2/favicons')) {
                console.warn('跳过使用 Google favicon 服务的搜索引擎:', engine);
                return;
            }

            const engineDiv = document.createElement('div');
            engineDiv.className = 'search-engine-item';

            const iconSrc = engine.icon.startsWith('assets/')
                ? chrome.runtime.getURL(engine.icon)
                : engine.icon || 'assets/alternate-search.png';

            engineDiv.innerHTML = `
                <div class="icon-preview">
                    <img src="${iconSrc}" alt="${engine.name}" class="engine-icon" data-fallback="${chrome.runtime.getURL('assets/alternate-search.png')}">
                </div>
                <input type="text" value="${engine.name}" class="name-input" data-index="${index}" placeholder="名称">
                <input type="text" value="${engine.urlTemplate}" class="url-template-input" data-index="${index}" placeholder="URL 模板">
                <input type="text" value="${engine.icon}" class="icon-url-input" data-index="${index}" placeholder="Icon URL">
                <div class="actions-container">
                    <button class="button-like danger delete-engine" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>
            `;

            // 添加错误处理事件监听器（符合CSP）
            const img = engineDiv.querySelector('.engine-icon') as HTMLImageElement;
            if (img) {
                img.addEventListener('error', function() {
                    this.src = this.dataset.fallback || chrome.runtime.getURL('assets/alternate-search.png');
                });
            }

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
            const translation = settings.translation || {};
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
            verboseMode.checked = logging?.verboseMode || false;
            showPrivacyLogs.checked = logging?.showPrivacyLogs || false;
            showStorageLogs.checked = logging?.showStorageLogs || false;

            // 搜索引擎设置
            if (Array.isArray(searchEngines) && searchEngines.length > 0) {
                renderSearchEngines();
            }

            // 增强功能设置 - 开发中的功能强制禁用
            enableMultiSource.checked = false; // 开发中，强制禁用
            enableImageCache.checked = false; // 开发中，强制禁用
            enableVideoPreview.checked = false; // 开发中，强制禁用
            enableTranslation.checked = dataEnhancement?.enableTranslation || false;
            enableRatingAggregation.checked = false; // 开发中，强制禁用
            enableActorInfo.checked = false; // 开发中，强制禁用
            cacheExpiration.value = String(dataEnhancement?.cacheExpiration || 24);

            // 翻译配置设置
            loadTranslationSettings(translation);

            enableQuickCopy.checked = userExperience?.enableQuickCopy || false;
            enableContentFilter.checked = userExperience?.enableContentFilter || false;
            enableKeyboardShortcuts.checked = false; // 开发中，强制禁用
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
            verboseMode.checked = false;
            showPrivacyLogs.checked = false;
            showStorageLogs.checked = false;
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

    function handleDiagnoseWebDAV() {
        logAsync('INFO', '用户点击了"诊断 WebDAV 连接"按钮。');
        handleSaveSettings().then(() => {
            logAsync('INFO', '用户开始诊断WebDAV连接');
            showMessage('正在保存设置并进行详细诊断...', 'info');
            diagnoseWebdavConnectionBtn.textContent = '诊断中...';
            diagnoseWebdavConnectionBtn.disabled = true;

            logAsync('INFO', '正在向后台发送WebDAV诊断请求');

            chrome.runtime.sendMessage({ type: 'webdav-diagnose' }, response => {
                if (response && response.success) {
                    // 显示详细的诊断结果
                    let resultMessage = '🔍 WebDAV连接诊断完成\n\n';

                    if (response.diagnostic.serverType) {
                        resultMessage += `📡 服务器类型: ${response.diagnostic.serverType}\n`;
                    }

                    if (response.diagnostic.supportedMethods && response.diagnostic.supportedMethods.length > 0) {
                        resultMessage += `🛠️ 支持的方法: ${response.diagnostic.supportedMethods.join(', ')}\n`;
                    }

                    if (response.diagnostic.responseFormat) {
                        resultMessage += `📄 响应格式: ${response.diagnostic.responseFormat}\n`;
                    }

                    if (response.diagnostic.issues && response.diagnostic.issues.length > 0) {
                        resultMessage += `\n⚠️ 发现的问题:\n`;
                        response.diagnostic.issues.forEach((issue: string, index: number) => {
                            resultMessage += `${index + 1}. ${issue}\n`;
                        });
                    }

                    if (response.diagnostic.recommendations && response.diagnostic.recommendations.length > 0) {
                        resultMessage += `\n💡 建议:\n`;
                        response.diagnostic.recommendations.forEach((rec: string, index: number) => {
                            resultMessage += `${index + 1}. ${rec}\n`;
                        });
                    }

                    // 使用alert显示详细结果，因为内容较多
                    alert(resultMessage);

                    if (response.diagnostic.success) {
                        showMessage('✅ 诊断完成，连接正常', 'success');
                        logAsync('INFO', 'WebDAV诊断成功', response.diagnostic);
                    } else {
                        showMessage('⚠️ 诊断完成，发现问题，请查看详细信息', 'warn');
                        logAsync('WARN', 'WebDAV诊断发现问题', response.diagnostic);
                    }
                } else {
                    const errorMsg = response?.error || '诊断失败';
                    showMessage(`❌ WebDAV诊断失败：${errorMsg}`, 'error');
                    logAsync('ERROR', `WebDAV诊断失败：${errorMsg}`);
                }

                diagnoseWebdavConnectionBtn.textContent = '诊断连接';
                diagnoseWebdavConnectionBtn.disabled = false;
            });
        }).catch(error => {
            showMessage('❌ 保存设置失败，无法进行诊断', 'error');
            logAsync('ERROR', `保存WebDAV设置失败：${error.message}`);
            diagnoseWebdavConnectionBtn.textContent = '诊断连接';
            diagnoseWebdavConnectionBtn.disabled = false;
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
    diagnoseWebdavConnectionBtn.addEventListener('click', handleDiagnoseWebDAV);



    hideViewed.addEventListener('change', handleSaveSettings);
    hideBrowsed.addEventListener('change', handleSaveSettings);
    hideVR.addEventListener('change', handleSaveSettings);
    maxLogEntries.addEventListener('change', handleSaveSettings);
    verboseMode.addEventListener('change', handleSaveSettings);
    showPrivacyLogs.addEventListener('change', handleSaveSettings);
    showStorageLogs.addEventListener('change', handleSaveSettings);

    // 增强功能设置事件监听器
    enableMultiSource.addEventListener('change', handleSaveSettings);
    enableImageCache.addEventListener('change', handleSaveSettings);
    enableVideoPreview.addEventListener('change', handleSaveSettings);
    enableTranslation.addEventListener('change', handleTranslationToggle);
    enableRatingAggregation.addEventListener('change', handleSaveSettings);
    enableActorInfo.addEventListener('change', handleSaveSettings);
    cacheExpiration.addEventListener('change', handleSaveSettings);

    // 翻译配置事件监听器（添加空值检查）
    if (translationProvider) {
        translationProvider.addEventListener('change', handleTranslationProviderChange);
    }
    if (traditionalTranslationService) {
        traditionalTranslationService.addEventListener('change', handleTraditionalServiceChange);
    }
    if (traditionalApiKey) {
        traditionalApiKey.addEventListener('change', handleSaveSettings);
    }
    if (useGlobalAiModel) {
        useGlobalAiModel.addEventListener('change', handleAiModelToggle);
    }
    if (customTranslationModel) {
        customTranslationModel.addEventListener('change', handleSaveSettings);
    }
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
            urlTemplate: 'https://www.google.com/search?q={{ID}}',
            icon: chrome.runtime.getURL('assets/alternate-search.png') // 使用本地图标避免404
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

    // Initialize actors management
    initActorsManagement();

    // Initialize translation settings
    initTranslationSettings();

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

/**
 * 初始化演员库管理功能
 */
function initActorsManagement(): void {
    const loadActorsBtn = document.getElementById('loadActorsBtn') as HTMLButtonElement;
    const editActorsBtn = document.getElementById('editActorsBtn') as HTMLButtonElement;
    const saveActorsBtn = document.getElementById('saveActorsBtn') as HTMLButtonElement;
    const exportActorsBtn = document.getElementById('exportActorsBtn') as HTMLButtonElement;
    const importActorsBtn = document.getElementById('importActorsBtn') as HTMLButtonElement;
    const importActorsFile = document.getElementById('importActorsFile') as HTMLInputElement;
    const actorsConfigTextarea = document.getElementById('actorsConfig') as HTMLTextAreaElement;
    const actorsStats = document.getElementById('actorsStats') as HTMLDivElement;

    if (!loadActorsBtn || !editActorsBtn || !saveActorsBtn || !exportActorsBtn ||
        !importActorsBtn || !importActorsFile || !actorsConfigTextarea || !actorsStats) {
        console.error('演员库管理: 找不到必要的DOM元素');
        return;
    }

    let currentActorsData: ActorRecord[] = [];

    // 加载演员库数据
    async function loadActorsData(): Promise<void> {
        try {
            loadActorsBtn.disabled = true;
            loadActorsBtn.textContent = '加载中...';

            currentActorsData = await actorManager.getAllActors();

            // 更新统计信息
            updateActorsStats(currentActorsData);

            // 显示JSON数据
            actorsConfigTextarea.value = JSON.stringify(currentActorsData, null, 2);
            actorsConfigTextarea.placeholder = '';

            // 启用相关按钮
            editActorsBtn.disabled = false;
            exportActorsBtn.disabled = false;

            showMessage(`成功加载 ${currentActorsData.length} 个演员记录`, 'success');
            logAsync('INFO', '演员库数据已加载到高级配置页面');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            showMessage(`加载演员库失败: ${errorMessage}`, 'error');
            logAsync('ERROR', '加载演员库失败', { error: errorMessage });
        } finally {
            loadActorsBtn.disabled = false;
            loadActorsBtn.textContent = '加载演员库';
        }
    }

    // 更新统计信息
    function updateActorsStats(actors: ActorRecord[]): void {
        const totalCount = actors.length;
        const femaleCount = actors.filter(a => a.gender === 'female').length;
        const maleCount = actors.filter(a => a.gender === 'male').length;
        const unknownCount = actors.filter(a => a.gender === 'unknown').length;

        document.getElementById('totalActorsCount')!.textContent = totalCount.toString();
        document.getElementById('femaleActorsCount')!.textContent = femaleCount.toString();
        document.getElementById('maleActorsCount')!.textContent = maleCount.toString();
        document.getElementById('unknownGenderCount')!.textContent = unknownCount.toString();

        actorsStats.style.display = totalCount > 0 ? 'block' : 'none';
    }

    // 编辑演员库
    function editActorsData(): void {
        actorsConfigTextarea.readOnly = false;
        actorsConfigTextarea.style.backgroundColor = '#0d1117';
        actorsConfigTextarea.style.color = '#c9d1d9';
        editActorsBtn.classList.add('hidden');
        saveActorsBtn.classList.remove('hidden');
        loadActorsBtn.disabled = true;
        exportActorsBtn.disabled = true;
        importActorsBtn.disabled = true;
    }

    // 保存演员库
    async function saveActorsData(): Promise<void> {
        try {
            const configText = actorsConfigTextarea.value;
            const parsedActors = JSON.parse(configText) as ActorRecord[];

            // 验证数据格式
            if (!Array.isArray(parsedActors)) {
                throw new Error('数据格式错误：应该是演员记录数组');
            }

            // 验证每个演员记录的必要字段
            for (let i = 0; i < parsedActors.length; i++) {
                const actor = parsedActors[i];
                if (!actor.id || !actor.name) {
                    throw new Error(`第 ${i + 1} 个演员记录缺少必要字段 (id, name)`);
                }
                if (!['female', 'male', 'unknown'].includes(actor.gender)) {
                    throw new Error(`第 ${i + 1} 个演员记录的性别字段无效: ${actor.gender}`);
                }
            }

            // 清空现有数据并导入新数据
            await actorManager.clearAllActors();
            await actorManager.saveActors(parsedActors);

            currentActorsData = parsedActors;
            updateActorsStats(currentActorsData);

            // 恢复只读状态
            actorsConfigTextarea.readOnly = true;
            actorsConfigTextarea.style.backgroundColor = '#161b22';
            actorsConfigTextarea.style.color = '#8b949e';
            saveActorsBtn.classList.add('hidden');
            editActorsBtn.classList.remove('hidden');
            loadActorsBtn.disabled = false;
            exportActorsBtn.disabled = false;
            importActorsBtn.disabled = false;

            showMessage(`演员库已保存，共 ${parsedActors.length} 个演员`, 'success');
            logAsync('INFO', '演员库已通过高级配置页面更新', { count: parsedActors.length });

            // 触发演员库更新事件
            const refreshEvent = new CustomEvent('actors-data-updated');
            document.dispatchEvent(refreshEvent);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            showMessage(`保存失败: ${errorMessage}`, 'error');
            logAsync('ERROR', '保存演员库失败', { error: errorMessage });
        }
    }

    // 导出演员库
    function exportActorsData(): void {
        try {
            if (currentActorsData.length === 0) {
                showMessage('没有可导出的演员数据', 'warn');
                return;
            }

            const dataStr = JSON.stringify(currentActorsData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `actors-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showMessage(`演员库已导出，共 ${currentActorsData.length} 个演员`, 'success');
            logAsync('INFO', '演员库已导出', { count: currentActorsData.length });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            showMessage(`导出失败: ${errorMessage}`, 'error');
            logAsync('ERROR', '导出演员库失败', { error: errorMessage });
        }
    }

    // 导入演员库
    function importActorsData(): void {
        importActorsFile.click();
    }

    // 处理文件导入
    async function handleFileImport(event: Event): Promise<void> {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        try {
            const text = await file.text();
            const importedActors = JSON.parse(text) as ActorRecord[];

            // 验证数据格式
            if (!Array.isArray(importedActors)) {
                throw new Error('文件格式错误：应该是演员记录数组');
            }

            // 验证每个演员记录
            for (let i = 0; i < importedActors.length; i++) {
                const actor = importedActors[i];
                if (!actor.id || !actor.name) {
                    throw new Error(`第 ${i + 1} 个演员记录缺少必要字段 (id, name)`);
                }
            }

            // 询问导入模式
            const replace = confirm(
                `检测到 ${importedActors.length} 个演员记录。\n\n` +
                `点击"确定"替换现有数据\n` +
                `点击"取消"合并到现有数据`
            );

            const result = await actorManager.importActors(importedActors, replace ? 'replace' : 'merge');

            // 重新加载数据
            await loadActorsData();

            showMessage(
                `导入完成: 新增 ${result.imported} 个，更新 ${result.updated} 个，跳过 ${result.skipped} 个`,
                'success'
            );
            logAsync('INFO', '演员库导入完成', result);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            showMessage(`导入失败: ${errorMessage}`, 'error');
            logAsync('ERROR', '导入演员库失败', { error: errorMessage });
        } finally {
            // 清空文件输入
            target.value = '';
        }
    }

    // 绑定事件
    loadActorsBtn.addEventListener('click', loadActorsData);
    editActorsBtn.addEventListener('click', editActorsData);
    saveActorsBtn.addEventListener('click', saveActorsData);
    exportActorsBtn.addEventListener('click', exportActorsData);
    importActorsBtn.addEventListener('click', importActorsData);
    importActorsFile.addEventListener('change', handleFileImport);
}

/**
 * 初始化全局操作功能
 */
function initGlobalActionsFunctionality(): void {
    // 获取按钮元素
    const clearAllBtn = document.getElementById('clearAllBtn') as HTMLButtonElement;
    const exportAllBtn = document.getElementById('exportAllBtn') as HTMLButtonElement;
    const importAllBtn = document.getElementById('importAllBtn') as HTMLButtonElement;
    const importAllFile = document.getElementById('importAllFile') as HTMLInputElement;
    const clearCacheBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement;
    const clearTempDataBtn = document.getElementById('clearTempDataBtn') as HTMLButtonElement;
    const resetSettingsBtn = document.getElementById('resetSettingsBtn') as HTMLButtonElement;
    const reloadExtensionBtn = document.getElementById('reloadExtensionBtn') as HTMLButtonElement;

    // 清空所有本地记录
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirmationModal({
                title: '确认清空所有本地记录',
                message: '您确定要清空所有本地记录吗？此操作不可撤销，且无法通过 WebDAV 恢复！',
                onConfirm: () => {
                    logAsync('INFO', '用户确认清空所有本地记录。');
                    chrome.runtime.sendMessage({ type: 'clear-all-records' }, response => {
                        if (response?.success) {
                            showMessage('所有本地记录已成功清空。', 'success');
                            logAsync('INFO', '所有本地记录已被成功清空。');
                            // Refresh the page or relevant parts to reflect the change
                            location.reload();
                        } else {
                            showMessage('清空记录失败，请稍后重试。', 'error');
                            logAsync('ERROR', '清空所有本地记录时发生错误。', { error: response.error });
                        }
                    });
                },
                onCancel: () => {
                    logAsync('INFO', '用户取消了清空所有本地记录的操作。');
                }
            });
        });
    }

    // 导出所有数据
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', async () => {
            try {
                logAsync('INFO', '用户点击了"导出所有数据"按钮。');

                // 获取所有数据
                const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
                const actorRecords = await actorManager.getAllActors();

                const dataToExport = {
                    settings: STATE.settings,
                    videoRecords: STATE.records.reduce((acc, record) => {
                        acc[record.id] = record;
                        return acc;
                    }, {} as Record<string, VideoRecord>),
                    actorRecords: actorRecords.reduce((acc, actor) => {
                        acc[actor.id] = actor;
                        return acc;
                    }, {} as Record<string, ActorRecord>),
                    userProfile: userProfile,
                    exportTime: new Date().toISOString(),
                    version: chrome.runtime.getManifest().version
                };

                const dataStr = JSON.stringify(dataToExport, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showMessage('数据导出成功', 'success');
                logAsync('INFO', '所有数据已成功导出');
            } catch (error) {
                console.error('导出数据失败:', error);
                showMessage('导出数据失败', 'error');
                logAsync('ERROR', '导出数据失败', { error: error.message });
            }
        });
    }

    // 导入数据
    if (importAllBtn && importAllFile) {
        importAllBtn.addEventListener('click', () => {
            importAllFile.click();
        });

        importAllFile.addEventListener('change', async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importData = JSON.parse(text);

                // 验证数据格式
                if (!importData.settings && !importData.videoRecords && !importData.actorRecords) {
                    throw new Error('无效的备份文件格式');
                }

                showConfirmationModal({
                    title: '确认导入数据',
                    message: '导入数据将覆盖当前的所有设置和记录。您确定要继续吗？',
                    onConfirm: async () => {
                        try {
                            // 导入设置
                            if (importData.settings) {
                                await saveSettings(importData.settings);
                                STATE.settings = importData.settings;
                            }

                            // 导入视频记录
                            if (importData.videoRecords) {
                                const videoRecords = Object.values(importData.videoRecords) as VideoRecord[];
                                await setValue(STORAGE_KEYS.VIDEO_RECORDS, importData.videoRecords);
                                STATE.records = videoRecords;
                            }

                            // 导入演员记录
                            if (importData.actorRecords) {
                                const actorRecords = Object.values(importData.actorRecords) as ActorRecord[];
                                await actorManager.clearAllActors();
                                await actorManager.saveActors(actorRecords);
                            }

                            // 导入用户资料
                            if (importData.userProfile) {
                                await setValue(STORAGE_KEYS.USER_PROFILE, importData.userProfile);
                            }

                            showMessage('数据导入成功，页面将刷新', 'success');
                            logAsync('INFO', '数据导入成功');

                            // 刷新页面以应用新数据
                            setTimeout(() => location.reload(), 1000);
                        } catch (error) {
                            console.error('导入数据失败:', error);
                            showMessage('导入数据失败', 'error');
                            logAsync('ERROR', '导入数据失败', { error: error.message });
                        }
                    },
                    onCancel: () => {
                        logAsync('INFO', '用户取消了数据导入操作');
                    }
                });
            } catch (error) {
                console.error('解析导入文件失败:', error);
                showMessage('文件格式错误，请选择有效的备份文件', 'error');
                logAsync('ERROR', '解析导入文件失败', { error: error.message });
            } finally {
                // 清空文件输入
                (event.target as HTMLInputElement).value = '';
            }
        });
    }

    // 清空缓存
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            showConfirmationModal({
                title: '确认清空缓存',
                message: '这将清除所有缓存的图片、头像等临时文件。确定继续吗？',
                onConfirm: async () => {
                    try {
                        // 清除扩展的缓存存储
                        await chrome.storage.local.remove(['imageCache', 'avatarCache', 'coverCache']);

                        showMessage('缓存已清空', 'success');
                        logAsync('INFO', '用户清空了缓存');
                    } catch (error) {
                        console.error('清空缓存失败:', error);
                        showMessage('清空缓存失败', 'error');
                        logAsync('ERROR', '清空缓存失败', { error: error.message });
                    }
                },
                onCancel: () => {
                    logAsync('INFO', '用户取消了清空缓存操作');
                }
            });
        });
    }

    // 清空临时数据
    if (clearTempDataBtn) {
        clearTempDataBtn.addEventListener('click', () => {
            showConfirmationModal({
                title: '确认清空临时数据',
                message: '这将清除搜索历史、临时设置等非关键数据。确定继续吗？',
                onConfirm: async () => {
                    try {
                        // 清除临时数据
                        await chrome.storage.local.remove(['searchHistory', 'tempSettings', 'sessionData']);

                        showMessage('临时数据已清空', 'success');
                        logAsync('INFO', '用户清空了临时数据');
                    } catch (error) {
                        console.error('清空临时数据失败:', error);
                        showMessage('清空临时数据失败', 'error');
                        logAsync('ERROR', '清空临时数据失败', { error: error.message });
                    }
                },
                onCancel: () => {
                    logAsync('INFO', '用户取消了清空临时数据操作');
                }
            });
        });
    }

    // 重置所有设置
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            showConfirmationModal({
                title: '确认重置所有设置',
                message: '这将把所有设置恢复为默认值，但会保留您的数据记录。确定继续吗？',
                onConfirm: async () => {
                    try {
                        // 获取默认设置
                        const defaultSettings: ExtensionSettings = {
                            hideViewed: false,
                            hideBrowsed: false,
                            hideVR: false,
                            recordsPerPage: 50,
                            webdav: {
                                enabled: false,
                                url: '',
                                username: '',
                                password: '',
                                autoSync: false,
                                syncInterval: 24
                            },
                            dataSync: {
                                enabled: false,
                                autoSync: false,
                                syncInterval: 60,
                                batchSize: 50,
                                maxRetries: 3,
                                requestInterval: 2,
                                urls: {
                                    collection: 'https://javdb.com/users/collection',
                                    detail: 'https://javdb.com/v/{{VIDEO_ID}}'
                                }
                            },
                            actorSync: {
                                enabled: false,
                                autoSync: false,
                                syncInterval: 60,
                                batchSize: 20,
                                maxRetries: 3,
                                requestInterval: 3,
                                urls: {
                                    collectionActors: 'https://javdb.com/users/collection_actors',
                                    actorDetail: 'https://javdb.com/actors/{{ACTOR_ID}}'
                                }
                            },
                            enhancement: {
                                enableMultiSource: true,
                                enableImageCache: true,
                                enableVideoPreview: false,
                                enableTranslation: false,
                                enableRatingAggregation: true,
                                enableActorInfo: true,
                                cacheExpiration: 7
                            },
                            searchEngines: [],
                            drive115: {
                                enabled: false,
                                cookie: '',
                                autoDownload: false,
                                downloadPath: '',
                                maxConcurrent: 3
                            },
                            logs: {
                                maxEntries: 1000
                            }
                        };

                        // 保存默认设置
                        await saveSettings(defaultSettings);
                        STATE.settings = defaultSettings;

                        showMessage('设置已重置为默认值，页面将刷新', 'success');
                        logAsync('INFO', '用户重置了所有设置');

                        // 刷新页面以应用新设置
                        setTimeout(() => location.reload(), 1000);
                    } catch (error) {
                        console.error('重置设置失败:', error);
                        showMessage('重置设置失败', 'error');
                        logAsync('ERROR', '重置设置失败', { error: error.message });
                    }
                },
                onCancel: () => {
                    logAsync('INFO', '用户取消了重置设置操作');
                }
            });
        });
    }

    // 重新加载扩展
    if (reloadExtensionBtn) {
        reloadExtensionBtn.addEventListener('click', () => {
            showConfirmationModal({
                title: '确认重新加载扩展',
                message: '这将重新加载扩展程序，当前页面会关闭。确定继续吗？',
                onConfirm: () => {
                    logAsync('INFO', '用户重新加载了扩展');
                    chrome.runtime.reload();
                },
                onCancel: () => {
                    logAsync('INFO', '用户取消了重新加载扩展操作');
                }
            });
        });
    }
}

    // 翻译配置相关函数
    function initTranslationSettings(): void {
        // 初始化翻译配置显示/隐藏逻辑
        updateTranslationConfigVisibility();

        // 初始化AI模型列表（如果需要显示的话）
        if (useGlobalAiModel && !useGlobalAiModel.checked && customAiModelGroup) {
            loadAvailableAiModels();
        }
    }

    function loadTranslationSettings(translation: any): void {
        // 检查元素是否存在
        if (!translationProvider || !traditionalTranslationService || !traditionalApiKey ||
            !useGlobalAiModel || !customTranslationModel) {
            return;
        }

        // 设置翻译提供商
        translationProvider.value = translation?.provider || 'traditional';

        // 设置传统翻译服务
        traditionalTranslationService.value = translation?.traditional?.service || 'google';
        traditionalApiKey.value = translation?.traditional?.apiKey || '';

        // 设置AI翻译配置
        useGlobalAiModel.checked = translation?.ai?.useGlobalModel === true;
        customTranslationModel.value = translation?.ai?.customModel || '';

        // 更新UI显示
        updateTranslationConfigVisibility();
        updateCurrentServiceDisplay();
        updateProviderConfigVisibility();
        updateTraditionalApiKeyVisibility();
        updateAiModelVisibility();
    }

    async function handleTranslationToggle(): Promise<void> {
        updateTranslationConfigVisibility();
        await handleSaveSettings();
    }

    async function handleTranslationProviderChange(): Promise<void> {
        updateCurrentServiceDisplay();
        updateProviderConfigVisibility();
        await handleSaveSettings();
    }

    async function handleTraditionalServiceChange(): Promise<void> {
        updateCurrentServiceDisplay();
        updateTraditionalApiKeyVisibility();
        await handleSaveSettings();
    }

    async function handleAiModelToggle(): Promise<void> {
        updateAiModelVisibility();
        await handleSaveSettings();
    }

    function updateTranslationConfigVisibility(): void {
        if (!translationConfig) return;

        if (enableTranslation.checked) {
            translationConfig.style.display = 'block';
        } else {
            translationConfig.style.display = 'none';
        }
    }

    function updateCurrentServiceDisplay(): void {
        if (!translationProvider || !traditionalTranslationService || !currentTranslationService) return;

        const provider = translationProvider.value;
        let serviceName = '';

        if (provider === 'traditional') {
            const service = traditionalTranslationService.value;
            switch (service) {
                case 'google':
                    serviceName = 'Google 翻译';
                    break;
                case 'baidu':
                    serviceName = '百度翻译';
                    break;
                case 'youdao':
                    serviceName = '有道翻译';
                    break;
                default:
                    serviceName = '传统翻译服务';
            }
        } else {
            serviceName = 'AI翻译服务';
        }

        currentTranslationService.textContent = serviceName;
    }

    function updateProviderConfigVisibility(): void {
        if (!translationProvider || !traditionalTranslationConfig || !aiTranslationConfig) return;

        const provider = translationProvider.value;

        if (provider === 'traditional') {
            traditionalTranslationConfig.style.display = 'block';
            aiTranslationConfig.style.display = 'none';
        } else {
            traditionalTranslationConfig.style.display = 'none';
            aiTranslationConfig.style.display = 'block';
        }
    }

    function updateTraditionalApiKeyVisibility(): void {
        if (!traditionalTranslationService || !traditionalApiKeyGroup) return;

        const service = traditionalTranslationService.value;

        if (service === 'baidu' || service === 'youdao') {
            traditionalApiKeyGroup.style.display = 'block';
        } else {
            traditionalApiKeyGroup.style.display = 'none';
        }
    }

    function updateAiModelVisibility(): void {
        if (!useGlobalAiModel || !customAiModelGroup) return;

        if (useGlobalAiModel.checked) {
            customAiModelGroup.style.display = 'none';
        } else {
            customAiModelGroup.style.display = 'block';
            // 从AI设置中加载可用模型列表
            loadAvailableAiModels();
        }
    }

    async function loadAvailableAiModels(): Promise<void> {
        try {
            if (!customTranslationModel) return;

            console.log('[Settings] 开始加载AI模型列表...');

            // 动态导入AI服务以避免循环依赖
            const { aiService } = await import('../../services/ai/aiService');

            // 清空现有选项
            customTranslationModel.innerHTML = '<option value="">正在加载模型...</option>';

            try {
                // 从AI服务获取真实的模型列表
                const models = await aiService.getAvailableModels();

                console.log(`[Settings] 成功获取${models.length}个AI模型`);

                // 清空现有选项
                customTranslationModel.innerHTML = '<option value="">选择翻译专用模型</option>';

                if (models.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '请先在AI设置中配置API并测试连接';
                    option.disabled = true;
                    customTranslationModel.appendChild(option);
                } else {
                    // 按模型类型分组
                    const groupedModels: Record<string, typeof models> = {};

                    models.forEach(model => {
                        const modelId = model.id.toLowerCase();
                        let group = 'Other';

                        if (modelId.includes('gpt')) {
                            group = 'OpenAI';
                        } else if (modelId.includes('claude')) {
                            group = 'Anthropic';
                        } else if (modelId.includes('gemini')) {
                            group = 'Google';
                        } else if (modelId.includes('qwen')) {
                            group = 'Qwen';
                        } else if (modelId.includes('glm') || modelId.includes('chatglm')) {
                            group = 'ZhiPu';
                        } else if (modelId.includes('deepseek')) {
                            group = 'DeepSeek';
                        } else if (modelId.includes('moonshot')) {
                            group = 'Moonshot';
                        }

                        if (!groupedModels[group]) {
                            groupedModels[group] = [];
                        }
                        groupedModels[group].push(model);
                    });

                    // 按组添加模型选项
                    Object.entries(groupedModels).forEach(([provider, providerModels]) => {
                        if (providerModels.length > 0) {
                            const optgroup = document.createElement('optgroup');
                            optgroup.label = provider;

                            providerModels.forEach(model => {
                                const option = document.createElement('option');
                                option.value = model.id;
                                option.textContent = model.name || model.id;
                                optgroup.appendChild(option);
                            });

                            customTranslationModel.appendChild(optgroup);
                        }
                    });
                }
            } catch (aiError) {
                console.warn('[Settings] 从AI服务获取模型列表失败:', aiError);

                // 如果AI服务获取失败，提供静态的常见模型列表作为后备
                customTranslationModel.innerHTML = '<option value="">选择翻译专用模型</option>';

                const fallbackModels = [
                    { group: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o-mini'] },
                    { group: 'Anthropic', models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'] },
                    { group: 'Google', models: ['gemini-pro', 'gemini-1.5-flash'] },
                    { group: 'Qwen', models: ['qwen-turbo', 'qwen-plus'] }
                ];

                fallbackModels.forEach(({ group, models }) => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = group;

                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        optgroup.appendChild(option);
                    });

                    customTranslationModel.appendChild(optgroup);
                });

                // 添加提示信息
                const infoOption = document.createElement('option');
                infoOption.value = '';
                infoOption.textContent = '提示：请在AI设置中测试连接以获取完整模型列表';
                infoOption.disabled = true;
                infoOption.style.fontStyle = 'italic';
                customTranslationModel.appendChild(infoOption);
            }
        } catch (error) {
            console.error('[Settings] 加载AI模型列表失败:', error);
            if (customTranslationModel) {
                customTranslationModel.innerHTML = '<option value="">加载模型列表失败</option>';
            }
        }
    }

// 确认对话框函数（如果不存在的话）
function showConfirmationModal(options: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}): void {
    const isConfirmed = confirm(`${options.title}\n\n${options.message}`);
    if (isConfirmed) {
        options.onConfirm();
    } else {
        options.onCancel();
    }
}
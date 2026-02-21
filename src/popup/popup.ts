import { getSettings, saveSettings } from '../utils/storage';
import type { ExtensionSettings } from '../types';

// 安全获取设置，带重试机制
async function getSettingsSafely(maxRetries = 3): Promise<ExtensionSettings | null> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // 等待一小段时间，让 Service Worker 初始化
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            }
            return await getSettings();
        } catch (error) {
            console.warn(`[Popup] Failed to get settings (attempt ${i + 1}/${maxRetries}):`, error);
            if (i === maxRetries - 1) {
                return null;
            }
        }
    }
    return null;
}

// 获取主题
async function getTheme(): Promise<'light' | 'dark'> {
    try {
        const result = await chrome.storage.local.get('theme_preference');
        const theme = result.theme_preference;
        if (theme === 'light' || theme === 'dark') {
            return theme;
        }
        return 'light';
    } catch (error) {
        console.error('[Popup] Failed to get theme:', error);
        return 'light';
    }
}

// 保存主题
async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
        await chrome.storage.local.set({ theme_preference: theme });
        console.log('[Popup] Theme saved:', theme);
    } catch (error) {
        console.error('[Popup] Failed to save theme:', error);
        throw error;
    }
}

// 初始化主题
async function initTheme() {
    try {
        const theme = await getTheme();
        console.log('[Popup] Theme loaded:', theme);
        document.documentElement.setAttribute('data-theme', theme);
        console.log('[Popup] data-theme attribute set to:', document.documentElement.getAttribute('data-theme'));
        
        // 更新主题切换按钮图标
        updateThemeSwitcherIcon(theme);
        // 更新标题 logo
        updateTitleLogo(theme);
    } catch (error) {
        console.error('[Popup] Failed to init theme:', error);
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeSwitcherIcon('light');
        updateTitleLogo('light');
    }
}

// 监听storage变化，实现跨页面主题同步
function setupThemeSync() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.theme_preference) {
            const newTheme = changes.theme_preference.newValue;
            if (newTheme === 'light' || newTheme === 'dark') {
                console.log('[Popup] Theme changed from storage:', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
                updateThemeSwitcherIcon(newTheme);
                updateTitleLogo(newTheme);
            }
        }
    });
}

// 更新主题切换按钮图标
function updateThemeSwitcherIcon(theme: 'light' | 'dark') {
    const themeSwitcherBtn = document.getElementById('theme-switcher-btn');
    const icon = themeSwitcherBtn?.querySelector('.theme-icon');
    
    if (icon) {
        if (theme === 'light') {
            icon.className = 'fas fa-sun theme-icon';
            themeSwitcherBtn!.title = '切换到深色模式';
        } else {
            icon.className = 'fas fa-moon theme-icon';
            themeSwitcherBtn!.title = '切换到浅色模式';
        }
    }
}

// 切换主题
async function toggleTheme() {
    const themeSwitcherBtn = document.getElementById('theme-switcher-btn');
    if (!themeSwitcherBtn) return;
    
    try {
        // 添加切换动画
        themeSwitcherBtn.classList.add('switching');
        
        // 获取当前主题
        const currentTheme = await getTheme();
        const newTheme: 'light' | 'dark' = currentTheme === 'light' ? 'dark' : 'light';
        
        // 保存新主题
        await saveTheme(newTheme);
        
        // 应用新主题
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeSwitcherIcon(newTheme);
        updateTitleLogo(newTheme);
        
        console.log('[Popup] Theme switched to:', newTheme);
        
        // 移除动画类
        setTimeout(() => {
            themeSwitcherBtn.classList.remove('switching');
        }, 500);
    } catch (error) {
        console.error('[Popup] Failed to toggle theme:', error);
        themeSwitcherBtn.classList.remove('switching');
    }
}

function initVersionInfo() {
    const versionContainer = document.getElementById('versionAuthorInfo');
    if (versionContainer) {
        let manifestVersion = '';
        try {
            manifestVersion = chrome?.runtime?.getManifest?.().version || '';
        } catch {}

        const envVersion = import.meta.env.VITE_APP_VERSION || '';
        const buildId = import.meta.env.VITE_APP_BUILD_ID || '';
        const version = manifestVersion || envVersion || 'N/A';

        const buildSuffix = buildId ? `\nBuild: ${buildId}` : '';
        versionContainer.textContent = `Version: ${version}${buildSuffix}`;
    }
}

function updateTitleLogo(theme: 'light' | 'dark') {
    const img = document.getElementById('titleLogo') as HTMLImageElement | null;
    if (img) {
        const faviconPath = theme === 'dark'
            ? 'assets/favicons/dark/favicon-32x32.png'
            : 'assets/favicons/light/favicon-32x32.png';
        
        img.src = chrome.runtime.getURL(faviconPath);
    }
}

async function initTitleLogo() {
    const theme = await getTheme();
    updateTitleLogo(theme);
}

document.addEventListener('DOMContentLoaded', async () => {
    const dashboardButton = document.getElementById('dashboard-button') as HTMLButtonElement;
    const popupLockBtn = document.getElementById('popup-lock-btn') as HTMLButtonElement;
    const themeSwitcherBtn = document.getElementById('theme-switcher-btn') as HTMLButtonElement;
    const helpBtn = document.getElementById('helpBtn') as HTMLButtonElement;
    const helpPanel = document.getElementById('helpPanel') as HTMLDivElement;
    const toggleWatchedContainer = document.getElementById('toggleWatchedContainer') as HTMLDivElement;
    const toggleViewedContainer = document.getElementById('toggleViewedContainer') as HTMLDivElement;
    const toggleVRContainer = document.getElementById('toggleVRContainer') as HTMLDivElement;
    const toggleWantContainer = document.getElementById('toggleWantContainer') as HTMLDivElement;
    const toggleHideBlacklistedActorsContainer = document.getElementById('toggleHideBlacklistedActorsContainer') as HTMLDivElement;
    const toggleHideNonFavoritedActorsContainer = document.getElementById('toggleHideNonFavoritedActorsContainer') as HTMLDivElement;
    const toggleTreatSubscribedContainer = document.getElementById('toggleTreatSubscribedContainer') as HTMLDivElement;
    const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    const volumeValue = document.getElementById('volumeValue') as HTMLSpanElement;
    const muteBtn = document.getElementById('muteBtn') as HTMLButtonElement;

    const versionAuthorInfo = document.getElementById('versionAuthorInfo') as HTMLSpanElement;

    // 初始化手动锁定按钮
    async function initPopupLockButton() {
        if (!popupLockBtn) return;

        try {
            const settings = await getSettingsSafely();
            
            // 只有在私密模式启用时才显示
            if (settings?.privacy?.privateMode?.enabled) {
                popupLockBtn.style.display = 'inline-flex';
            }

            // 点击锁定
            popupLockBtn.addEventListener('click', async () => {
                try {
                    // 发送锁定消息到background
                    chrome.runtime.sendMessage({ type: 'privacy-lock' }, (response) => {
                        // 检查 lastError
                        if (chrome.runtime.lastError) {
                            console.error('Lock message error:', chrome.runtime.lastError);
                            alert('锁定失败，请重试');
                            return;
                        }
                        if (response?.success) {
                            window.close(); // 关闭popup
                        } else {
                            alert('锁定失败，请重试');
                        }
                    });
                } catch (error) {
                    console.error('Failed to lock:', error);
                    alert('锁定失败，请重试');
                }
            });
        } catch (error) {
            console.error('Failed to init popup lock button:', error);
        }
    }

    // Open Dashboard
    if (dashboardButton) {
        dashboardButton.title = '高级设置 & 数据管理';
        dashboardButton.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('dashboard/dashboard.html'));
            }
        });
    }

    // 主题切换按钮
    if (themeSwitcherBtn) {
        themeSwitcherBtn.addEventListener('click', toggleTheme);
    }

    // Toggle Buttons
    async function createToggleButton(
        key: keyof ExtensionSettings['display'],
        container: HTMLElement,
        textShowing: string,
        textHiding: string
    ) {
        const button = document.createElement('button');
        button.className = 'toggle-button';
        let settings: ExtensionSettings | null;

        const updateState = (isHiding: boolean) => {
            // isHiding=true means the feature is enabled (hiding content)
            // isHiding=false means the feature is disabled (showing content)
            const label = isHiding ? `当前：${textHiding}` : `当前：${textShowing}`;
            button.textContent = label;
            button.title = label;
            button.classList.toggle('active', isHiding);
        };

        settings = await getSettingsSafely();
        if (settings) {
            updateState(!!settings.display[key]);
        }

        button.addEventListener('click', async () => {
            settings = await getSettingsSafely();
            if (!settings) {
                console.error('Failed to get settings');
                return;
            }
            const current = !!settings.display[key];
            const newState = !current;
            (settings.display[key] as boolean) = newState;
            await saveSettings(settings);
            updateState(newState);

            // 发送消息通知内容脚本设置已更新
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.url?.includes('javdb')) {
                    if (tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'settings-updated' });
                        // 仍然刷新页面以确保所有更改生效
                        chrome.tabs.reload(tabs[0].id);
                    }
                }
            });
        });

        container.innerHTML = '';
        container.appendChild(button);
    }

    // ListEnhancement Toggle Buttons
    async function createListEnhancementToggle(
        key: keyof ExtensionSettings['listEnhancement'],
        container: HTMLElement,
        textTrue: string,
        textFalse: string
    ) {
        const button = document.createElement('button');
        button.className = 'toggle-button';

        const updateState = (flag: boolean) => {
            const label = flag ? `当前：${textTrue}` : `当前：${textFalse}`;
            button.textContent = label;
            button.title = label;
            button.classList.toggle('active', flag);
        };

        let settings = await getSettingsSafely();
        if (settings) {
            const current = !!(settings.listEnhancement as any)?.[key];
            updateState(current);
        }

        button.addEventListener('click', async () => {
            settings = await getSettingsSafely();
            if (!settings) {
                console.error('Failed to get settings');
                return;
            }
            if (!settings.listEnhancement) {
                settings.listEnhancement = {
                    enabled: true,
                    enableClickEnhancement: true,
                    enableVideoPreview: true,
                    enableScrollPaging: false,
                    enableListOptimization: true,
                    previewDelay: 1000,
                    previewVolume: 0.2,
                    enableRightClickBackground: true,
                } as any;
            }
            const currentVal = !!(settings.listEnhancement as any)[key];
            (settings.listEnhancement as any)[key] = !currentVal;
            await saveSettings(settings);
            updateState(!currentVal);

            // 通知内容脚本设置已更新（并刷新当前tab，保持与现有逻辑一致）
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.url?.includes('javdb')) {
                    if (tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'settings-updated' });
                        chrome.tabs.reload(tabs[0].id);
                    }
                }
            });
        });

        container.innerHTML = '';
        container.appendChild(button);
    }

    // Help Panel
    function setupHelpPanel() {
        const helpContent = `
            <div class="help-header">
                <h2>功能说明</h2>
                <span id="closeHelpBtn" title="关闭">&times;</span>
            </div>
            <div class="help-body">
                <p><strong>显示/隐藏开关:</strong> 快速切换在JavDB网站上是否隐藏特定类型的影片。更改后会自动刷新当前页面。</p>
                <p><strong>预览视频音量:</strong> 设置详情页预览视频的默认音量。网站默认静音，扩展会自动应用您设置的音量。</p>
                <p><strong>高级设置:</strong> 点击进入功能更全面的仪表盘，进行数据管理、WebDAV备份同步、日志查看等高级操作。</p>
            </div>`;
        helpPanel.innerHTML = helpContent;
        
        helpBtn.addEventListener('click', () => {
            helpPanel.style.display = 'block';
        });

        const closeBtn = helpPanel.querySelector('#closeHelpBtn') as HTMLSpanElement;
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                helpPanel.style.display = 'none';
            });
        }
    }
    
    // Volume Control
    async function setupVolumeControl() {
        // 从设置对象中获取当前音量设置
        const settings = await getSettingsSafely();
        if (!settings) {
            console.error('Failed to get settings for volume control');
            return;
        }
        // 使用 ?? 而不是 || 来处理 0 值
        const currentVolumeFloat = settings.listEnhancement?.previewVolume ?? 0.2;
        const currentVolume = Math.round(currentVolumeFloat * 100);
        
        console.log('[Popup] Initial volume from settings:', currentVolumeFloat, 'display:', currentVolume);

        // 更新滑块和显示值
        volumeSlider.value = currentVolume.toString();
        volumeValue.textContent = `${currentVolume}%`;

        // 更新静音按钮图标
        const updateMuteIcon = (volume: number) => {
            const icon = muteBtn.querySelector('i');
            if (!icon) return;
            
            if (volume === 0) {
                icon.className = 'fas fa-volume-xmark';
                muteBtn.title = '取消静音';
            } else if (volume <= 33) {
                icon.className = 'fas fa-volume-low';
                muteBtn.title = '静音';
            } else if (volume <= 66) {
                icon.className = 'fas fa-volume-low';
                muteBtn.title = '静音';
            } else {
                icon.className = 'fas fa-volume-high';
                muteBtn.title = '静音';
            }
        };

        updateMuteIcon(currentVolume);

        // 保存静音前的音量
        let volumeBeforeMute = currentVolume > 0 ? currentVolume : 50;

        // 静音按钮点击事件
        muteBtn.addEventListener('click', async () => {
            const currentVol = parseInt(volumeSlider.value);
            console.log('[Popup] Mute button clicked, current volume:', currentVol);
            
            if (currentVol === 0) {
                // 取消静音，恢复之前的音量
                const restoreVolume = volumeBeforeMute > 0 ? volumeBeforeMute : 50;
                console.log('[Popup] Unmuting, restore to:', restoreVolume);
                
                volumeSlider.value = restoreVolume.toString();
                volumeValue.textContent = `${restoreVolume}%`;
                updateMuteIcon(restoreVolume);
                
                // 保存设置
                const currentSettings = await getSettingsSafely();
                if (currentSettings?.listEnhancement) {
                    currentSettings.listEnhancement.previewVolume = restoreVolume / 100;
                    await saveSettings(currentSettings);
                    console.log('[Popup] Settings saved, volume:', restoreVolume / 100);
                    
                    // 通知内容脚本
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0]?.url?.includes('javdb') && tabs[0].id) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'volume-changed',
                                volume: restoreVolume / 100
                            });
                        }
                    });
                }
            } else {
                // 静音
                volumeBeforeMute = currentVol;
                console.log('[Popup] Muting, save current volume:', volumeBeforeMute);
                
                volumeSlider.value = '0';
                volumeValue.textContent = '0%';
                updateMuteIcon(0);
                
                // 保存设置
                const currentSettings = await getSettingsSafely();
                if (currentSettings?.listEnhancement) {
                    currentSettings.listEnhancement.previewVolume = 0;
                    await saveSettings(currentSettings);
                    console.log('[Popup] Settings saved, volume: 0');
                    
                    // 通知内容脚本
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0]?.url?.includes('javdb') && tabs[0].id) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'volume-changed',
                                volume: 0
                            });
                        }
                    });
                }
            }
        });

        // 监听滑块变化 - 使用防抖来避免频繁保存
        let saveTimeout: number | null = null;
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt((e.target as HTMLInputElement).value);
            console.log('[Popup] Slider input, volume:', volume);
            volumeValue.textContent = `${volume}%`;
            updateMuteIcon(volume);

            // 如果用户手动调整音量到非0，更新volumeBeforeMute
            if (volume > 0) {
                volumeBeforeMute = volume;
            }

            // 清除之前的定时器
            if (saveTimeout !== null) {
                clearTimeout(saveTimeout);
            }

            // 延迟保存，避免频繁写入
            saveTimeout = window.setTimeout(async () => {
                console.log('[Popup] Saving volume after input:', volume);
                // 获取当前设置并更新音量
                const currentSettings = await getSettingsSafely();
                if (!currentSettings) {
                    console.error('Failed to get settings for volume update');
                    return;
                }
                if (!currentSettings.listEnhancement) {
                    currentSettings.listEnhancement = {
                        enabled: true,
                        enableClickEnhancement: true,
                        enableVideoPreview: true,
                        enableScrollPaging: false,
                        enableListOptimization: true,
                        previewDelay: 1000,
                        previewVolume: 0.2,
                        enableRightClickBackground: true
                    };
                }
                currentSettings.listEnhancement.previewVolume = volume / 100;

                // 保存设置
                await saveSettings(currentSettings);
                console.log('[Popup] Settings saved from slider, volume:', volume / 100);

                // 通知内容脚本音量已更改
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.url?.includes('javdb')) {
                        if (tabs[0].id) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'volume-changed',
                                volume: volume / 100
                            });
                        }
                    }
                });
            }, 300); // 300ms 防抖
        });
    }

    // Initializer Function
    async function initialize() {
        createToggleButton('hideViewed', toggleWatchedContainer, '显示已看的作品', '隐藏已看的作品');
        createToggleButton('hideBrowsed', toggleViewedContainer, '显示已浏览的作品', '隐藏已浏览的作品');
        createToggleButton('hideVR', toggleVRContainer, '显示VR作品', '隐藏VR作品');
        createToggleButton('hideWant', toggleWantContainer, '显示想看的作品', '隐藏想看的作品');

        // 演员过滤开关（列表）
        await createListEnhancementToggle('hideBlacklistedActorsInList', toggleHideBlacklistedActorsContainer, '隐藏含黑名单演员', '显示含黑名单演员');
        await createListEnhancementToggle('hideNonFavoritedActorsInList', toggleHideNonFavoritedActorsContainer, '隐藏未收藏演员的作品', '显示未收藏演员的作品');
        await createListEnhancementToggle('treatSubscribedAsFavorited', toggleTreatSubscribedContainer, '订阅视为收藏', '订阅不视为收藏');

        await setupVolumeControl();
        await initPopupLockButton();

        const manifest = chrome.runtime.getManifest();
        versionAuthorInfo.textContent = `v${manifest.version}`;

        setupHelpPanel();
    }

    await initTheme();
    setupThemeSync(); // 设置主题同步监听
    initialize();
    initVersionInfo();
});
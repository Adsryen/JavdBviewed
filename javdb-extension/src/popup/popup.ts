import { getSettings, saveSettings } from '../utils/storage';
import type { ExtensionSettings } from '../types';

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

function initTitleLogo() {
    const img = document.getElementById('titleLogo') as HTMLImageElement | null;
    if (img) {
        img.src = chrome.runtime.getURL('assets/favicon-32x32.png');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const dashboardButton = document.getElementById('dashboard-button') as HTMLButtonElement;
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

    const versionAuthorInfo = document.getElementById('versionAuthorInfo') as HTMLSpanElement;

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

    // Toggle Buttons
    async function createToggleButton(
        key: keyof ExtensionSettings['display'],
        container: HTMLElement,
        textShowing: string,
        textHiding: string
    ) {
        const button = document.createElement('button');
        button.className = 'toggle-button';
        let settings: ExtensionSettings;

        const updateState = (isHiding: boolean) => {
            // isHiding=true means the feature is enabled (hiding content)
            // isHiding=false means the feature is disabled (showing content)
            const label = isHiding ? `当前：${textHiding}` : `当前：${textShowing}`;
            button.textContent = label;
            button.title = label;
            button.classList.toggle('active', isHiding);
        };

        settings = await getSettings();
        updateState(!!settings.display[key]);

        button.addEventListener('click', async () => {
            settings = await getSettings();
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

        let settings = await getSettings();
        const current = !!(settings.listEnhancement as any)?.[key];
        updateState(current);

        button.addEventListener('click', async () => {
            settings = await getSettings();
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
        const settings = await getSettings();
        const currentVolumeFloat = settings.listEnhancement?.previewVolume || 0.2;
        const currentVolume = Math.round(currentVolumeFloat * 100);

        // 更新滑块和显示值
        volumeSlider.value = currentVolume.toString();
        volumeValue.textContent = `${currentVolume}%`;

        // 监听滑块变化
        volumeSlider.addEventListener('input', async (e) => {
            const volume = parseInt((e.target as HTMLInputElement).value);
            volumeValue.textContent = `${volume}%`;

            // 获取当前设置并更新音量
            const currentSettings = await getSettings();
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
            currentSettings.listEnhancement.previewVolume = volume / 100; // 转换为0-1范围

            // 保存设置
            await saveSettings(currentSettings);

            // 通知内容脚本音量已更改
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.url?.includes('javdb')) {
                    if (tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'volume-changed',
                            volume: volume / 100 // 转换为0-1范围
                        });
                    }
                }
            });
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

        const manifest = chrome.runtime.getManifest();
        versionAuthorInfo.textContent = `v${manifest.version}`;

        setupHelpPanel();
    }

    initialize();
    initVersionInfo();
    initTitleLogo();
});
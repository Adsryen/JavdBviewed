import { getSettings, saveSettings, getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, VIDEO_STATUS } from '../utils/config';
import type { ExtensionSettings, VideoRecord } from '../types';

function initVersionInfo() {
    const versionContainer = document.getElementById('versionAuthorInfo');
    if (versionContainer) {
        const version = import.meta.env.VITE_APP_VERSION || 'N/A';
        versionContainer.textContent = `Version: ${version}`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const dashboardButton = document.getElementById('dashboard-button') as HTMLButtonElement;
    const helpBtn = document.getElementById('helpBtn') as HTMLButtonElement;
    const helpPanel = document.getElementById('helpPanel') as HTMLDivElement;
    const toggleWatchedContainer = document.getElementById('toggleWatchedContainer') as HTMLDivElement;
    const toggleViewedContainer = document.getElementById('toggleViewedContainer') as HTMLDivElement;
    const toggleVRContainer = document.getElementById('toggleVRContainer') as HTMLDivElement;

    const versionAuthorInfo = document.getElementById('versionAuthorInfo') as HTMLSpanElement;

    // Open Dashboard
    if (dashboardButton) {
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
            button.textContent = isHiding ? `当前：${textHiding}` : `当前：${textShowing}`;
            button.classList.toggle('active', isHiding);
        };

        settings = await getSettings();
        updateState(settings.display[key]);

        button.addEventListener('click', async () => {
            settings = await getSettings();
            const newState = !settings.display[key];
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

    // Help Panel
    function setupHelpPanel() {
        const helpContent = `
            <div class="help-header">
                <h2>功能说明</h2>
                <span id="closeHelpBtn" title="关闭">&times;</span>
            </div>
            <div class="help-body">
                <p><strong>显示/隐藏开关:</strong> 快速切换在JavDB网站上是否隐藏特定类型的影片。更改后会自动刷新当前页面。</p>
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
    
    // Initializer Function
    async function initialize() {
        createToggleButton('hideViewed', toggleWatchedContainer, '显示已看的番号', '隐藏已看的番号');
        createToggleButton('hideBrowsed', toggleViewedContainer, '显示已浏览的番号', '隐藏已浏览的番号');
        createToggleButton('hideVR', toggleVRContainer, '显示VR番号', '隐藏VR番号');
        
        const manifest = chrome.runtime.getManifest();
        versionAuthorInfo.textContent = `v${manifest.version}`;
        
        setupHelpPanel();
    }

    initialize();
    initVersionInfo();
}); 
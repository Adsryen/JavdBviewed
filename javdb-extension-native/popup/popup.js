import { getValue, getSettings, saveSettings } from '../storage.js';
import { STORAGE_KEYS, VIDEO_STATUS } from '../config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dashboardButton = document.getElementById('dashboard-button');
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const toggleWatchedContainer = document.getElementById('toggleWatchedContainer');
    const toggleViewedContainer = document.getElementById('toggleViewedContainer');
    const toggleVRContainer = document.getElementById('toggleVRContainer');
    const idCountDisplay = document.getElementById('idCountDisplay');
    const versionAuthorInfo = document.getElementById('versionAuthorInfo');

    // --- Event Listeners & Initializers ---

    // 1. Open Dashboard
    if (dashboardButton) {
        dashboardButton.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('dashboard/dashboard.html'));
            }
        });
    }

    // 2. Toggle Buttons
    async function createToggleButton(key, container, textActive, textInactive) {
        const button = document.createElement('button');
        button.className = 'toggle-button';
        let settings;

        const updateState = (isActive) => {
            button.textContent = isActive ? textActive : textInactive;
            button.classList.toggle('active', !isActive); // Visually "active" means the filter is NOT active
        };

        settings = await getSettings();
        updateState(settings.display[key]);

        button.addEventListener('click', async () => {
            settings = await getSettings();
            const newState = !settings.display[key];
            settings.display[key] = newState;
            await saveSettings(settings);
            updateState(newState);

            // Reload active tab to apply changes immediately
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.url?.includes('javdb')) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });

        container.innerHTML = '';
        container.appendChild(button);
    }

    // 3. Info Displays
    async function updateCountDisplay() {
        const viewedData = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
        const records = Object.values(viewedData);
        const viewedCount = records.filter(r => r.status === VIDEO_STATUS.viewed).length;
        const wantCount = records.filter(r => r.status === VIDEO_STATUS.want).length;
        idCountDisplay.innerHTML = `
            <div><span class="count">${viewedCount}</span><span class="label">已观看</span></div>
            <div><span class="count">${wantCount}</span><span class="label">想看</span></div>
        `;
    }

    // 4. Help Panel
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

        helpPanel.querySelector('#closeHelpBtn')?.addEventListener('click', () => {
            helpPanel.style.display = 'none';
        });
    }
    
    // --- Initializer Function ---
    async function initialize() {
        updateCountDisplay();
        createToggleButton('hideViewed', toggleWatchedContainer, '显示已看', '隐藏已看');
        createToggleButton('hideBrowsed', toggleViewedContainer, '显示浏览', '隐藏浏览');
        createToggleButton('hideVR', toggleVRContainer, '显示VR', '隐藏VR');
        
        const manifest = chrome.runtime.getManifest();
        versionAuthorInfo.textContent = `v${manifest.version}`;
        
        setupHelpPanel();
    }

    initialize();
}); 
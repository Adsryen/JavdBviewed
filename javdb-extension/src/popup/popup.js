import { getValue, setValue, getSettings, saveSettings } from '../utils/storage.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const toggleWatchedContainer = document.getElementById('toggleWatchedContainer');
    const toggleViewedContainer = document.getElementById('toggleViewedContainer');
    const toggleVRContainer = document.getElementById('toggleVRContainer');
    const idCountDisplay = document.getElementById('idCountDisplay');
    const versionAuthorInfo = document.getElementById('versionAuthorInfo');

    // --- Removed elements that are now in dashboard ---
    // const importFile = document.getElementById('importFile');
    // const customUploadBtn = document.getElementById('customUploadBtn');
    // const fileNameDisplay = document.getElementById('fileNameDisplay');
    // const exportBtn = document.getElementById('exportBtn');
    // const clearBtn = document.getElementById('clearBtn');
    // const searchBox = document.getElementById('searchBox');
    // const resultContainer = document.getElementById('resultContainer');
    // const browseHistoryBox = document.getElementById('browseHistoryBox');
    // const browseHistoryResultContainer = document.getElementById('browseHistoryResultContainer');
    // const uploadTimeDisplay = document.getElementById('uploadTimeDisplay');
    // const exportTimeDisplay = document.getElementById('exportTimeDisplay');

    // --- Functions ---
    
    // 0. Open Dashboard
    openDashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'dist/dashboard.html' });
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
        // The key for display settings is now nested, e.g., 'hideWatched' not 'display.hideWatched'
        updateState(settings.display[key]);

        button.addEventListener('click', async () => {
            settings = await getSettings();
            const newState = !settings.display[key];
            settings.display[key] = newState;
            await saveSettings(settings);
            updateState(newState);
            // Optionally reload the tab to apply changes
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });

        container.innerHTML = ''; // Clear previous button if any
        container.appendChild(button);
        return button;
    }

    createToggleButton('hideWatched', toggleWatchedContainer, '隐藏已看', '显示已看');
    createToggleButton('hideViewed', toggleViewedContainer, '隐藏已浏览', '显示已浏览');
    createToggleButton('hideVR', toggleVRContainer, '隐藏VR', '显示VR');

    // 6. Info Displays
    async function updateCountDisplay() {
        const viewedData = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
        const records = Object.values(viewedData);
        const watchedCount = records.filter(r => r.status === 'viewed').length;
        const laterCount = records.filter(r => r.status === 'later').length;
        idCountDisplay.innerHTML = `<div>已观看: ${watchedCount}</div><div>稍后看: ${laterCount}</div>`;
    }

    // 7. Help Panel
    function setupHelpPanel() {
        // Simplified help panel. Most features are in the dashboard now.
        const helpContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 14px; line-height: 1.6;">
                <h3 style="font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px;">主要功能</h3>
                <ul style="padding-left: 20px;">
                    <li style="margin-bottom: 8px;"><strong>打开仪表盘:</strong> 点击进入功能更全面的仪表盘，进行数据管理、备份和云同步。</li>
                    <li style="margin-bottom: 8px;"><strong>隐藏/显示开关:</strong> 快速切换在JavDB网站上是否隐藏特定类型的影片。更改后会自动刷新当前页面。</li>
                </ul>
            </div>`;
        helpPanel.innerHTML = `
        <div class="help-header">
            <h2>功能说明</h2>
            <span id="closeHelpBtn">&times;</span>
        </div>` + helpContent;
        
        helpBtn.addEventListener('click', () => {
            helpPanel.style.display = 'block';
        });

        const closeHelpBtn = helpPanel.querySelector('#closeHelpBtn');
        closeHelpBtn.addEventListener('click', (e) => {
                helpPanel.style.display = 'none';
        });
    }

    // --- Initial Load ---
    async function initialize() {
        updateCountDisplay();
        const settings = await getSettings();
        versionAuthorInfo.innerHTML = `Version: ${settings.version || 'N/A'}<br>Author: Ryen`;
        setupHelpPanel();
    }

    initialize();
}); 
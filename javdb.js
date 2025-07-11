// ==UserScript==
// @name         JavDB列表页显示是否已看
// @namespace    http://tampermonkey.net/
// @version      2025.07.09.2235
// @description  在演员列表页，显示每部影片是否已看，就难得点进去看了
// @author       Ryen
// @match        https://javdb.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=javdb.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @license      GPL-3.0-only
// @downloadURL https://update.sleazyfork.org/scripts/505534/JavDB%E5%88%97%E8%A1%A8%E9%A1%B5%E6%98%BE%E7%A4%BA%E6%98%AF%E5%90%A6%E5%B7%B2%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/505534/JavDB%E5%88%97%E8%A1%A8%E9%A1%B5%E6%98%BE%E7%A4%BA%E6%98%AF%E5%90%A6%E5%B7%B2%E7%9C%8B.meta.js
// ==/UserScript==

// --- Script Configuration ---
const CONFIG = {
    DEBUG: false,
    PERFORMANCE_MODE: true, // 性能日志开关 - 设置为 true 可以显示加载时间
    VERSION: '2025.07.09.2235',

    // --- UI & Animation ---
    MESSAGE_FADE_DURATION: 500,      // 消息渐变持续时间 (ms)
    MESSAGE_DISPLAY_DURATION: 3000,  // 消息显示持续时间 (ms)
    MAX_MESSAGES: 3,                 // 最大显示消息数量
    CIRCLE_BUTTON_POSITION: { left: -40, top: 60 }, // 悬浮按钮位置

    // --- Feature Toggles & Storage Keys ---
    HIDE_WATCHED_VIDEOS_KEY: 'hideWatchedVideos',
    HIDE_VIEWED_VIDEOS_KEY: 'hideViewedVideos',
    HIDE_VR_VIDEOS_KEY: 'hideVRVideos',
    STORED_IDS_KEY: 'myIds',
    BROWSE_HISTORY_KEY: 'videoBrowseHistory',
    LAST_UPLOAD_TIME_KEY: 'lastUploadTime',
    LAST_EXPORT_TIME_KEY: 'lastExportTime',

    // --- Data Export ---
    VIDEOS_PER_PAGE: 20, // 列表页每页视频数量
    EXPORT_PAUSE_DELAY: 3000, // 导出时翻页暂停时间 (ms)

    // --- Content Processing ---
    NEW_ITEM_CHECK_INTERVAL: 1000, // 检查新加载项目的间隔 (ms)
    VIDEO_ID_RECORD_DELAY_MIN: 3, // 记录番号前最小延迟 (s)
    VIDEO_ID_RECORD_DELAY_MAX: 5, // 记录番号前最大延迟 (s)
    VIDEO_ID_RECORD_RETRIES: 5,   // 记录番号失败后重试次数
    VIDEO_ID_RECORD_RETRY_DELAY: 3000, // 记录番号重试前的等待时间 (ms)

    // --- Video Status Indicator ---
    STATUS_CHECK_INTERVAL: 2000, // 详情页检查状态间隔 (ms)
    STATUS_WATCHED_COLOR: '#2ed573', // 已看/已浏览状态颜色
    STATUS_DEFAULT_COLOR: '#ed0085', // 默认状态颜色
    CUSTOM_FAVICON_URL: 'https://res.cloudinary.com/djsqosyyr/image/upload/v1749926977/picgo/d43f78db1a3c01c621580b4a55b06bd7.png', // 已看/已浏览状态的图标
};
// --- End of Script Configuration ---


// 调试开关
const DEBUG = CONFIG.DEBUG;

// 版本
const VERSION = CONFIG.VERSION;
const fadeDuration = CONFIG.MESSAGE_FADE_DURATION;
const displayDuration = CONFIG.MESSAGE_DISPLAY_DURATION;
const maxMessages = CONFIG.MAX_MESSAGES;
let counter = 0; // 初始化计数器
let lastItemCount = 0; // 存储上一次的电影项目数量

let storedIds = new Set(); // 使用 Set 存储唯一 ID

const styleMap = {
    '我看過這部影片': 'tag is-success is-light',
    '我想看這部影片': 'tag is-info is-light',
    '未看过': 'tag is-gray',
    '已浏览': 'tag is-warning is-light',
};

// 在这里定义 hideWatchedVideos
let hideWatchedVideos = GM_getValue(CONFIG.HIDE_WATCHED_VIDEOS_KEY, false);
console.log('初始化 hideWatchedVideos:', hideWatchedVideos);

// 在 styleMap 下面添加新的变量
let hideViewedVideos = GM_getValue(CONFIG.HIDE_VIEWED_VIDEOS_KEY, false);
console.log('初始化 hideViewedVideos:', hideViewedVideos);

// 在 styleMap 下面添加新的变量
let hideVRVideos = GM_getValue(CONFIG.HIDE_VR_VIDEOS_KEY, false);
console.log('初始化 hideVRVideos:', hideVRVideos);

const indicatorTexts = ['我看過這部影片', '我想看這部影片'];

const validUrlPatterns = [
    /https:\/\/javdb\.com\/users\/want_watch_videos.*/,
    /https:\/\/javdb\.com\/users\/watched_videos.*/,
    /https:\/\/javdb\.com\/users\/list_detail.*/,
    /https:\/\/javdb\.com\/lists.*/
];

// 消息容器
const messageContainer = document.createElement('div');
messageContainer.style.position = 'fixed';
messageContainer.style.bottom = '20px';
messageContainer.style.right = '20px';
messageContainer.style.zIndex = '9999';
messageContainer.style.pointerEvents = 'none';
messageContainer.style.maxWidth = '500px';
messageContainer.style.display = 'flex';
messageContainer.style.flexDirection = 'column';
document.body.appendChild(messageContainer);

// 渐入效果
function fadeIn(el) {
    el.style.opacity = 0;
    el.style.display = 'block';

    const startTime = performance.now();
    function animate(time) {
        const elapsed = time - startTime;
        el.style.opacity = Math.min((elapsed / fadeDuration), 1);
        if (elapsed < fadeDuration) {
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

// 渐出效果
function fadeOut(el) {
    const startTime = performance.now();
    function animate(time) {
        const elapsed = time - startTime;
        el.style.opacity = 1 - Math.min((elapsed / fadeDuration), 1);
        if (elapsed < fadeDuration) {
            requestAnimationFrame(animate);
        } else {
            el.remove();
        }
    }
    requestAnimationFrame(animate);
}

// 显示信息
function logToScreen(message, bgColor = 'rgba(169, 169, 169, 0.8)', textColor = 'white') {

    const messageBox = document.createElement('div');
    messageBox.style.padding = '10px';
    messageBox.style.borderRadius = '5px';
    messageBox.style.backgroundColor = bgColor;
    messageBox.style.color = textColor;
    messageBox.style.fontSize = '12px';
    messageBox.style.marginBottom = '10px';
    messageBox.style.pointerEvents = 'none';
    messageBox.style.wordWrap = 'break-word';
    messageBox.style.maxWidth = '100%';

    messageBox.innerHTML = message;
    messageContainer.appendChild(messageBox);


    fadeIn(messageBox);


    setTimeout(() => {
        fadeOut(messageBox);
    }, displayDuration);


    if (messageContainer.childElementCount > maxMessages) {
        fadeOut(messageContainer.firstChild);
    }
}

// 新增：显示备份提醒气泡
function showBackupReminderBubble() {
    const lastExportTime = GM_getValue(CONFIG.LAST_EXPORT_TIME_KEY);
    let backupNeeded = false;
    let message = '';

    if (!lastExportTime) {
        backupNeeded = true;
        message = '还未备份过，请及时备份！';
    } else {
        const lastExportDate = new Date(lastExportTime);
        const now = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (now - lastExportDate > oneWeek) {
            backupNeeded = true;
            message = '上次备份已超过一周，请及时备份！';
        }
    }

    if (!backupNeeded) {
        return;
    }

    // 延迟一点时间确保圆形按钮已经渲染
    setTimeout(() => {
        const circleButton = document.getElementById('unique-circle');
        if (!circleButton) {
            debugLog("无法找到圆形按钮，无法显示备份提醒。");
            return;
        }

        const bubble = document.createElement('div');
        bubble.style.position = 'fixed';
        bubble.style.background = '#ff4a4a';
        bubble.style.color = 'white';
        bubble.style.padding = '10px 15px';
        bubble.style.borderRadius = '8px';
        bubble.style.zIndex = '10002';
        bubble.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        bubble.style.fontSize = '14px';
        bubble.style.fontWeight = '500';
        bubble.style.opacity = '0';
        bubble.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        bubble.style.transform = 'translateX(-20px)';
        bubble.style.whiteSpace = 'nowrap';

        const pointer = document.createElement('div');
        pointer.style.position = 'absolute';
        pointer.style.top = '50%';
        pointer.style.left = '-10px';
        pointer.style.transform = 'translateY(-50%)';
        pointer.style.width = '0';
        pointer.style.height = '0';
        pointer.style.borderStyle = 'solid';
        pointer.style.borderWidth = '8px 8px 8px 0';
        pointer.style.borderColor = 'transparent #ff4a4a transparent transparent';
        bubble.appendChild(pointer);
        bubble.appendChild(document.createTextNode(message));

        document.body.appendChild(bubble);

        const circleRect = circleButton.getBoundingClientRect();
        bubble.style.left = `${circleRect.right + 15}px`;
        bubble.style.top = `${circleRect.top + (circleRect.height - bubble.offsetHeight) / 2}px`;

        // Fade in and slide in
        setTimeout(() => {
            bubble.style.opacity = '1';
            bubble.style.transform = 'translateX(0)';
        }, 100);

        // Fade out and remove after 5 seconds
        setTimeout(() => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.parentNode.removeChild(bubble);
                }
            }, 500); // Wait for transition to finish
        }, 5000);
    }, 500); // 等待圆形按钮被创建
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}



// 创建调试日志函数
function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

// 添加全局变量声明
let exportButton = null;
let stopButton = null;
let isExporting = false;
let exportState = {
    allowExport: false,
    currentPage: 1,
    maxPage: null
};
let uploadTimeDisplay;
let idCountDisplay;
let exportTimeDisplay;

// 将 updateCountDisplay 函数移到全局作用域
function updateCountDisplay() {
    if (!idCountDisplay) {
        return; // 如果 idCountDisplay 还没有初始化，直接返回
    }
    const watchedCount = storedIds.size;
    const browseHistory = new Set(GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []));
    const browseCount = browseHistory.size;

    idCountDisplay.innerHTML = `
        <div style="margin-bottom: 5px;">已看番号总数: ${watchedCount}</div>
        <div>已浏览番号总数: ${browseCount}</div>
    `;
}

(function () {
    'use strict';
    debugLog('开始初始化面板...');

    const isSearchPage = window.location.href.startsWith('https://javdb.com/search?');
    let panelVisible = false;
    const circlePosition = CONFIG.CIRCLE_BUTTON_POSITION;
    let lastUploadTime = "";

    // 面板样式优化
    const panel = document.createElement('div');
    debugLog('创建面板元素');
    panel.style.position = 'fixed';
    panel.style.border = 'none';
    panel.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
    panel.style.padding = '20px';
    panel.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    panel.style.maxWidth = '340px';
    panel.style.width = '90vw';
    panel.style.maxHeight = '90vh';
    panel.style.overflowY = 'auto';
    panel.style.overflowX = 'hidden';
    panel.style.borderRadius = '12px';
    panel.style.display = 'none';
    panel.style.zIndex = 10001;
    panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    // 确保面板被添加到文档中
    document.body.appendChild(panel);
    debugLog('面板已添加到文档中');

    // 添加滚动条样式
    panel.style.scrollbarWidth = 'thin'; // Firefox
    panel.style.scrollbarColor = '#ccc transparent'; // Firefox
    // Webkit浏览器的滚动条样式
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        #${panel.id}::-webkit-scrollbar {
            width: 6px;
        }
        #${panel.id}::-webkit-scrollbar-track {
            background: transparent;
        }
        #${panel.id}::-webkit-scrollbar-thumb {
            background-color: #ccc;
            border-radius: 3px;
        }
    `;
    document.head.appendChild(styleSheet);

    // 修改面板位置计算
    function updatePanelPosition(panel, top) {
        debugLog('更新面板位置');
        const windowHeight = window.innerHeight;
        const panelHeight = panel.offsetHeight;
        debugLog('窗口高度:', windowHeight, '面板高度:', panelHeight);

        let finalTop = top;

        if (top + panelHeight > windowHeight - 20) {
            finalTop = Math.max(20, windowHeight - panelHeight - 20);
        }

        finalTop = Math.max(20, finalTop);

        panel.style.top = `${finalTop}px`;
        panel.style.left = '10px';
        debugLog('面板最终位置:', finalTop);
    }

    // 创建标题
    const title = document.createElement('div');
    title.textContent = '番号数据上传与搜索';
    title.style.display = 'flex';
    title.style.alignItems = 'center';
    title.style.fontWeight = '600';
    title.style.fontSize = '16px';
    title.style.marginBottom = '15px';
    title.style.color = '#333';
    title.style.borderBottom = '1px solid #eee';
    title.style.paddingBottom = '10px';
    debugLog('创建标题');

    // 说明按钮
    const helpButton = document.createElement('span');
    helpButton.textContent = '❓';
    helpButton.style.cursor = 'pointer';
    helpButton.style.marginLeft = '10px';
    helpButton.style.fontSize = '16px';
    helpButton.title = '帮助与说明';
    title.appendChild(helpButton);

    // 帮助符号
    /* const titleHelpIcon = document.createElement('span');
    titleHelpIcon.textContent = 'ℹ️';
    titleHelpIcon.style.cursor = 'pointer';
    titleHelpIcon.style.marginLeft = '10px';
    titleHelpIcon.title = '目前只过滤"看过"，更新脚本数据会被清空';
    title.appendChild(titleHelpIcon);
    */

    // 创建一个容器来包含上传按钮和帮助图标
    const uploadContainer = document.createElement('div');
    uploadContainer.style.cssText = `
        position: relative;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
    `;

    // 创建自定义的文件上传按钮
    const customUploadButton = document.createElement('label');
    customUploadButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #4a9eff;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    // 添加图标
    const uploadIcon = document.createElement('span');
    uploadIcon.innerHTML = '📁'; // 使用 emoji 作为图标
    uploadIcon.style.marginRight = '8px';
    customUploadButton.appendChild(uploadIcon);

    // 添加文本
    const buttonText = document.createElement('span');
    buttonText.textContent = '上传已看番号JSON';
    customUploadButton.appendChild(buttonText);

    // 创建实际的文件输入框但隐藏它
    const uploadButton = document.createElement('input');
    uploadButton.type = 'file';
    uploadButton.accept = '.json';
    uploadButton.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
    `;

    // 添加文件名显示区域
    const fileNameDisplay = document.createElement('span');
    fileNameDisplay.style.cssText = `
        margin-left: 10px;
        color: #666;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
    `;

    // 帮助图标
    const uploadHelpIcon = document.createElement('a');
    uploadHelpIcon.href = 'https://javdb.com/users/watched_videos';
    uploadHelpIcon.target = '_blank';
    uploadHelpIcon.textContent = 'ℹ️';
    uploadHelpIcon.style.cssText = `
        cursor: pointer;
        padding: 4px;
        flex-shrink: 0;
        text-decoration: none;
        color: inherit;
    `;
    uploadHelpIcon.title = '点击前往"看过"页面进行导出文件 (在新标签页中打开)';

    // 将所有元素添加到容器中
    customUploadButton.appendChild(uploadButton);
    uploadContainer.appendChild(customUploadButton);
    uploadContainer.appendChild(fileNameDisplay);
    uploadContainer.appendChild(uploadHelpIcon);

    // 添加悬停效果
    customUploadButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#3d8ae5';
        this.style.transform = 'translateY(-1px)';
    });

    customUploadButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#4a9eff';
        this.style.transform = 'translateY(0)';
    });

    // 更新文件名显示
    uploadButton.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
        } else {
            fileNameDisplay.textContent = '';
        }
    });

    // 开关按钮样式优化
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.gap = '8px';
    toggleContainer.style.marginTop = '10px';
    toggleContainer.style.marginBottom = '15px';

    // 优化按钮样式的函数
    function styleButton(button, isActive) {
        button.style.flex = '1';
        button.style.padding = '8px 12px';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '6px';
        button.style.cursor = 'pointer';
        button.style.transition = 'all 0.3s ease';
        button.style.backgroundColor = isActive ? '#808080' : '#2ed573'; // 修改为：隐藏为灰色(#808080)，显示为绿色
    }

    // 修改开关按钮样式优化和事件处理
    const toggleHideButton = document.createElement('button');
    styleButton(toggleHideButton, hideWatchedVideos);
    toggleHideButton.textContent = hideWatchedVideos ? '当前：隐藏已看的番号' : '当前：显示已看的番号';

    // 帮助符号
    /*const toggleHelpIcon = document.createElement('span');
    toggleHelpIcon.textContent = 'ℹ️';
    toggleHelpIcon.style.cursor = 'pointer';
    toggleHelpIcon.style.padding = '4px';
    toggleHelpIcon.title = '点击切换';
    */

    // 将按钮和帮助符号添加到容器
    toggleContainer.appendChild(toggleHideButton);
    //toggleContainer.appendChild(toggleHelpIcon);

    // 添加按钮悬停效果
    toggleHideButton.addEventListener('mouseover', function () {
        this.style.opacity = '0.9';
    });
    toggleHideButton.addEventListener('mouseout', function () {
        this.style.opacity = '1';
    });

    // 添加开关按钮点击事件
    toggleHideButton.addEventListener('click', function () {
        debugLog('开关按钮被点击');
        hideWatchedVideos = !hideWatchedVideos;
        debugLog('切换 hideWatchedVideos 为:', hideWatchedVideos);

        // 更新按钮文本和颜色
        this.textContent = hideWatchedVideos ? '当前：隐藏已看的番号' : '当前：显示已看的番号';
        styleButton(this, hideWatchedVideos); // 更新按钮样式

        // 保存设置
        GM_setValue(CONFIG.HIDE_WATCHED_VIDEOS_KEY, hideWatchedVideos);

        if (!hideWatchedVideos) {
            // 如果切换到显示模式，自动刷新页面
            debugLog('切换到显示模式，准备刷新页面');
            location.reload();
        } else {
            // 如果切换到隐藏模式，直接处理当前页面
            processLoadedItems();
        }
    });

    // 添加开关按钮到面板
    panel.appendChild(toggleContainer);

    // 在创建 toggleContainer 后添加新的容器和按钮
    const toggleViewedContainer = document.createElement('div');
    toggleViewedContainer.style.display = 'flex';
    toggleViewedContainer.style.alignItems = 'center';
    toggleViewedContainer.style.gap = '8px';
    toggleViewedContainer.style.marginTop = '10px';
    toggleViewedContainer.style.marginBottom = '15px';

    const toggleViewedButton = document.createElement('button');
    styleButton(toggleViewedButton, hideViewedVideos);
    toggleViewedButton.textContent = hideViewedVideos ? '当前：隐藏已浏览的番号' : '当前：显示已浏览的番号';

    /*const toggleViewedHelpIcon = document.createElement('span');
    toggleViewedHelpIcon.textContent = 'ℹ️';
    toggleViewedHelpIcon.style.cursor = 'pointer';
    toggleViewedHelpIcon.style.padding = '4px';
    toggleViewedHelpIcon.title = '点击切换';
    */
    toggleViewedContainer.appendChild(toggleViewedButton);
    //toggleViewedContainer.appendChild(toggleViewedHelpIcon);

    // 添加按钮事件
    toggleViewedButton.addEventListener('click', function() {
        hideViewedVideos = !hideViewedVideos;
        this.textContent = hideViewedVideos ? '当前：隐藏已浏览的番号' : '当前：显示已浏览的番号';
        styleButton(this, hideViewedVideos); // 更新按钮样式

        GM_setValue(CONFIG.HIDE_VIEWED_VIDEOS_KEY, hideViewedVideos);

        if (!hideViewedVideos) {
            location.reload();
        } else {
            processLoadedItems();
        }
    });

    // 在 panel.appendChild(toggleContainer) 后添加
    panel.appendChild(toggleViewedContainer);

    // 在面板中添加切换 VR 视频的按钮
    const toggleVRContainer = document.createElement('div');
    toggleVRContainer.style.display = 'flex';
    toggleVRContainer.style.alignItems = 'center';
    toggleVRContainer.style.gap = '8px';
    toggleVRContainer.style.marginTop = '10px';
    toggleVRContainer.style.marginBottom = '15px';

    const toggleVRButton = document.createElement('button');
    styleButton(toggleVRButton, hideVRVideos);
    toggleVRButton.textContent = hideVRVideos ? '当前：隐藏VR番号' : '当前：显示VR番号';

    // 添加按钮点击事件
    toggleVRButton.addEventListener('click', function () {
        hideVRVideos = !hideVRVideos;
        this.textContent = hideVRVideos ? '当前：隐藏VR番号' : '当前：显示VR番号';
        styleButton(this, hideVRVideos); // 更新按钮样式
        GM_setValue(CONFIG.HIDE_VR_VIDEOS_KEY, hideVRVideos);

        // 切换到显示模式时刷新页面
        if (!hideVRVideos) {
            location.reload();
        } else {
            processLoadedItems(); // 处理当前页面以应用更改
        }
    });

    // 添加到面板
    toggleVRContainer.appendChild(toggleVRButton);
    panel.appendChild(toggleVRContainer);

    // 在搜索页面，禁用切换按钮
    if (isSearchPage) {
        [toggleHideButton, toggleViewedButton, toggleVRButton].forEach(button => {
            button.disabled = true;
            button.style.backgroundColor = '#b0b0b0'; // 禁用的灰色
            button.textContent = '搜索页禁用';
            button.style.cursor = 'not-allowed';
            button.title = '此功能在搜索页面禁用，以显示所有结果。';
        });
    }

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '15px';
    buttonContainer.style.marginBottom = '15px';
    debugLog('创建按钮容器');

    // 导出按钮样式优化
    const exportButton = document.createElement('button');
    exportButton.innerHTML = '💾 导出存储番号';  // 添加下载图标
    exportButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #4a9eff;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        white-space: nowrap;
    `;

    // 清除按钮样式优化
    const clearButton = document.createElement('button');
    clearButton.innerHTML = '🗑️ 清空存储番号';  // 添加垃圾桶图标
    clearButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #ff4a4a;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        white-space: nowrap;
    `;

    // 定义导出函数
    function exportStoredData() {
        debugLog('开始导出存储的番号...');
        try {
            const myIds = GM_getValue(CONFIG.STORED_IDS_KEY, []);
            const videoBrowseHistory = GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []);

            if (myIds.length === 0 && videoBrowseHistory.length === 0) {
                logToScreen('没有存储任何数据，已停止导出。', 'rgba(255, 193, 7, 0.8)', 'white');
                return;
            }

            const dataToExport = {
                myIds: myIds,
                videoBrowseHistory: videoBrowseHistory,
            };

            const json = JSON.stringify(dataToExport, null, 2);
            const jsonBlob = new Blob([json], { type: 'application/json' });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            const downloadLink = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            downloadLink.download = `javdb-backup_${timestamp}.json`;
            downloadLink.href = jsonUrl;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(jsonUrl);

            // 更新上次导出时间
            const now = new Date();
            GM_setValue(CONFIG.LAST_EXPORT_TIME_KEY, now.toISOString());
            if (exportTimeDisplay) {
                exportTimeDisplay.textContent = `上次备份时间：${now.toLocaleString()}`;
            }

            logToScreen('存储的数据已成功导出。', 'rgba(76, 175, 80, 0.8)', 'white');
            debugLog('存储的数据导出成功。');
        } catch (error) {
            console.error('导出存储数据时出错:', error);
            logToScreen('导出存储数据时出错，请查看控制台。', 'rgba(244, 67, 54, 0.8)', 'white');
        }
    }

    // 定义清除函数
    function handleClear(e) {
        e.preventDefault();
        e.stopPropagation();

        debugLog('开始清除数据...');
        if (confirm('确定要清除所有存储的番号吗？')) {
            try {
                // 清除内存中的数据
                storedIds = new Set();

                // 定义要从 GM 存储中清除的键
                const keysToClear = [
                    CONFIG.STORED_IDS_KEY,
                    CONFIG.LAST_UPLOAD_TIME_KEY,
                    CONFIG.LAST_EXPORT_TIME_KEY,
                    CONFIG.HIDE_WATCHED_VIDEOS_KEY,
                    CONFIG.HIDE_VIEWED_VIDEOS_KEY,
                    CONFIG.HIDE_VR_VIDEOS_KEY,
                    CONFIG.BROWSE_HISTORY_KEY,
                    'storedIds', // for legacy cleanup
                ];

                // 清除所有 GM 存储
                keysToClear.forEach(key => {
                    if (GM_getValue(key) !== undefined) {
                        debugLog('清除 GM 存储:', key);
                        GM_deleteValue(key);
                    }
                });

                // 清除所有相关的 localStorage
                const localStorageKeys = ['allVideosInfo', 'exportState'];
                localStorageKeys.forEach(key => {
                    debugLog('清除 localStorage:', key);
                    localStorage.removeItem(key);
                });

                // 重新初始化必要的值
                GM_setValue(CONFIG.STORED_IDS_KEY, []);
                GM_setValue(CONFIG.LAST_UPLOAD_TIME_KEY, '');
                lastUploadTime = '';

                // 更新显示
                idCountDisplay.textContent = `已存储 0 个番号`;
                uploadTimeDisplay.textContent = '';

                debugLog('数据清除完成');
                debugLog('当前 storedIds size:', storedIds.size);
                debugLog('当前 GM storage:', GM_getValue(CONFIG.STORED_IDS_KEY, []).length);

                // 强制刷新页面
                alert('已清除所有存储的番号，页面将刷新');
                window.location.href = window.location.href;
            } catch (error) {
                console.error('清除数据时出错:', error);
                alert('清除数据时出错，请查看控制台');
            }
        }
        return false;
    }

    // 添加按钮事件监听器
    exportButton.addEventListener('click', exportStoredData);
    clearButton.addEventListener('click', handleClear);

    // 修改这段代码
    [exportButton, clearButton].forEach(button => {
        button.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-1px)';
            if (this === exportButton) {
                this.style.backgroundColor = '#3d8ae5';
            } else {
                this.style.backgroundColor = '#e54a4a';
            }
        });

        button.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
            if (this === exportButton) {
                this.style.backgroundColor = '#4a9eff';
            } else {
                this.style.backgroundColor = '#ff4a4a';
            }
        });

        // 修改禁用状态的处理方式
        const updateDisabledStyle = function() {
            if (this.disabled) {
                this.style.opacity = '0.6';
                this.style.cursor = 'not-allowed';
            } else {
                this.style.opacity = '1';
                this.style.cursor = 'pointer';
            }
        };

        // 监听 disabled 属性变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'disabled') {
                    updateDisabledStyle.call(button);
                }
            });
        });

        observer.observe(button, {
            attributes: true,
            attributeFilter: ['disabled']
        });

        // 初始化禁用状态样式
        updateDisabledStyle.call(button);
    });

    // 将按钮添加到按钮容器
    buttonContainer.appendChild(exportButton);
    buttonContainer.appendChild(clearButton);
    debugLog('按钮已添加到容器');

    // 创建搜索框和结果容器
    const searchContainer = document.createElement('div');
    searchContainer.style.marginBottom = '15px';

    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = '搜索已看的番号';
    searchBox.style.width = '100%';
    searchBox.style.padding = '8px 12px';
    searchBox.style.border = '1px solid #ddd';
    searchBox.style.borderRadius = '6px';
    searchBox.style.marginBottom = '10px';
    searchBox.style.boxSizing = 'border-box';

    // 创建搜索结果容器
    const resultContainer = document.createElement('div');
    resultContainer.style.maxHeight = '200px';
    resultContainer.style.overflowY = 'auto';
    resultContainer.style.border = '1px solid #eee';
    resultContainer.style.borderRadius = '6px';
    resultContainer.style.padding = '10px';
    resultContainer.style.display = 'none';
    resultContainer.style.backgroundColor = '#f9f9f9';

    // 搜索处理函数
    function handleSearch() {
        const searchTerm = searchBox.value.trim().toLowerCase();
        const storedIdsArray = Array.from(storedIds);

        if (searchTerm === '') {
            resultContainer.style.display = 'none';
            return;
        }

        const results = storedIdsArray.filter(id =>
            id.toLowerCase().includes(searchTerm)
        );

        resultContainer.innerHTML = '';

        if (results.length > 0) {
            results.forEach(id => {
                const resultItem = document.createElement('div');
                resultItem.style.display = 'flex';
                resultItem.style.justifyContent = 'space-between';
                resultItem.style.alignItems = 'center';
                resultItem.style.padding = '5px';
                resultItem.style.borderBottom = '1px solid #eee';

                const idText = document.createElement('span');
                idText.textContent = id;
                idText.style.cursor = 'pointer';

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '删除';
                deleteBtn.style.cssText = `
                    padding: 2px 8px;
                    background-color: #ff4757;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                `;

                deleteBtn.addEventListener('mouseover', () => {
                    deleteBtn.style.opacity = '0.8';
                });

                deleteBtn.addEventListener('mouseout', () => {
                    deleteBtn.style.opacity = '1';
                });

                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`确定要删除 ${id} 吗？`)) {
                        storedIds.delete(id);
                        GM_setValue(CONFIG.STORED_IDS_KEY, Array.from(storedIds));
                        resultItem.style.opacity = '0';
                        setTimeout(() => {
                            resultItem.remove();
                            if (resultContainer.children.length === 0) {
                                const noResult = document.createElement('div');
                                noResult.textContent = '未找到匹配的番号';
                                noResult.style.padding = '5px';
                                noResult.style.color = '#666';
                                resultContainer.appendChild(noResult);
                            }
                            updateCountDisplay();
                        }, 300);
                        logToScreen(`已删除: ${id}`, 'rgba(255, 71, 87, 0.8)', 'white');
                    }
                });

                resultItem.appendChild(idText);
                resultItem.appendChild(deleteBtn);
                resultContainer.appendChild(resultItem);

                resultItem.addEventListener('mouseover', () => {
                    resultItem.style.backgroundColor = '#eee';
                });

                resultItem.addEventListener('mouseout', () => {
                    resultItem.style.backgroundColor = 'transparent';
                });
            });
            resultContainer.style.display = 'block';
        } else {
            const noResult = document.createElement('div');
            noResult.textContent = '未找到匹配的番号';
            noResult.style.padding = '5px';
            noResult.style.color = '#666';
            resultContainer.appendChild(noResult);
            resultContainer.style.display = 'block';
        }
    }

    // 添加搜索事件监听
    searchBox.addEventListener('input', handleSearch);

    // 添加点击外部关闭搜索结果的功能
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            resultContainer.style.display = 'none';
        }
    });

    // 将搜索框和结果容器添加到搜索容器
    searchContainer.appendChild(searchBox);
    searchContainer.appendChild(resultContainer);

    // 创建ID计数显示
    idCountDisplay = document.createElement('div');
    idCountDisplay.style.marginTop = '15px';
    idCountDisplay.style.color = '#666';
    idCountDisplay.style.fontSize = '13px';
    idCountDisplay.style.textAlign = 'center';

    // 在加载存储的 ID 和上传时间时更新显示
    const rawData = GM_getValue(CONFIG.STORED_IDS_KEY);
    const savedUploadTime = GM_getValue(CONFIG.LAST_UPLOAD_TIME_KEY);
    if (rawData) {
        storedIds = new Set(rawData); // 如果之前存过数据，加载到 Set
        updateCountDisplay(); // 使用新的更新函数
    }
    if (savedUploadTime) {
        lastUploadTime = savedUploadTime; // 恢复最新上传时间
        if (uploadTimeDisplay) {
            uploadTimeDisplay.textContent = `上次上传时间：${lastUploadTime}`;
        }
    }

    // 创建上传时间显示
    uploadTimeDisplay = document.createElement('div');
    uploadTimeDisplay.style.marginTop = '5px';
    uploadTimeDisplay.style.color = '#666';
    uploadTimeDisplay.style.fontSize = '13px';
    uploadTimeDisplay.style.textAlign = 'center';
    uploadTimeDisplay.textContent = lastUploadTime ? `上次上传时间：${lastUploadTime}` : '';
    debugLog('创建上传时间显示');

    // 创建浏览记录查询功能
    const browseHistoryContainer = document.createElement('div');
    browseHistoryContainer.style.marginBottom = '15px';

    const browseHistoryBox = document.createElement('input');
    browseHistoryBox.type = 'text';
    browseHistoryBox.placeholder = '查询浏览记录';
    browseHistoryBox.style.width = '100%';
    browseHistoryBox.style.padding = '8px 12px';
    browseHistoryBox.style.border = '1px solid #ddd';
    browseHistoryBox.style.borderRadius = '6px';
    browseHistoryBox.style.marginBottom = '10px';
    browseHistoryBox.style.boxSizing = 'border-box';

    // 创建浏览记录结果容器
    const browseHistoryResultContainer = document.createElement('div');
    browseHistoryResultContainer.style.maxHeight = '200px';
    browseHistoryResultContainer.style.overflowY = 'auto';
    browseHistoryResultContainer.style.border = '1px solid #eee';
    browseHistoryResultContainer.style.borderRadius = '6px';
    browseHistoryResultContainer.style.padding = '10px';
    browseHistoryResultContainer.style.display = 'none';
    browseHistoryResultContainer.style.backgroundColor = '#f9f9f9';

    // 查询处理函数
    function handleBrowseHistorySearch() {
        const searchTerm = browseHistoryBox.value.trim().toLowerCase();
        const storedVideoIds = Array.from(new Set(GM_getValue(CONFIG.BROWSE_HISTORY_KEY, [])));

        if (searchTerm === '') {
            browseHistoryResultContainer.style.display = 'none';
            return;
        }

        const results = storedVideoIds.filter(id => id.toLowerCase().includes(searchTerm));

        browseHistoryResultContainer.innerHTML = '';

        if (results.length > 0) {
            results.forEach(id => {
                const resultItem = document.createElement('div');
                resultItem.style.display = 'flex';
                resultItem.style.justifyContent = 'space-between';
                resultItem.style.alignItems = 'center';
                resultItem.style.padding = '5px';
                resultItem.style.borderBottom = '1px solid #eee';

                const idText = document.createElement('span');
                idText.textContent = id;
                idText.style.cursor = 'pointer';

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '删除';
                deleteBtn.style.cssText = `
                    padding: 2px 8px;
                    background-color: #ff4757;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                `;

                deleteBtn.addEventListener('mouseover', () => {
                    deleteBtn.style.opacity = '0.8';
                });

                deleteBtn.addEventListener('mouseout', () => {
                    deleteBtn.style.opacity = '1';
                });

                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`确定要删除浏览记录 ${id} 吗？`)) {
                        const browseHistory = new Set(GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []));
                        browseHistory.delete(id);
                        GM_setValue(CONFIG.BROWSE_HISTORY_KEY, Array.from(browseHistory));
                        resultItem.style.opacity = '0';
                        setTimeout(() => {
                            resultItem.remove();
                            if (browseHistoryResultContainer.children.length === 0) {
                                const noResult = document.createElement('div');
                                noResult.textContent = '未找到匹配的浏览记录';
                                noResult.style.padding = '5px';
                                noResult.style.color = '#666';
                                browseHistoryResultContainer.appendChild(noResult);
                            }
                            updateCountDisplay();
                        }, 300);
                        logToScreen(`已删除浏览记录: ${id}`, 'rgba(255, 71, 87, 0.8)', 'white');
                    }
                });

                resultItem.appendChild(idText);
                resultItem.appendChild(deleteBtn);
                browseHistoryResultContainer.appendChild(resultItem);

                resultItem.addEventListener('mouseover', () => {
                    resultItem.style.backgroundColor = '#eee';
                });

                resultItem.addEventListener('mouseout', () => {
                    resultItem.style.backgroundColor = 'transparent';
                });
            });
            browseHistoryResultContainer.style.display = 'block';
        } else {
            const noResult = document.createElement('div');
            noResult.textContent = '未找到匹配的浏览记录';
            noResult.style.padding = '5px';
            noResult.style.color = '#666';
            browseHistoryResultContainer.appendChild(noResult);
            browseHistoryResultContainer.style.display = 'block';
        }
    }

    // 添加搜索事件监听
    browseHistoryBox.addEventListener('input', handleBrowseHistorySearch);

    // 将浏览记录查询框和结果容器添加到面板
    browseHistoryContainer.appendChild(browseHistoryBox);
    browseHistoryContainer.appendChild(browseHistoryResultContainer);

    // 在面板的最后添加版本和作者信息
    const versionAuthorInfo = document.createElement('div');
    versionAuthorInfo.style.cssText = `
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        color: #999;
        font-size: 12px;
        text-align: center;
    `;
    versionAuthorInfo.innerHTML = `Version: ${VERSION}<br>Author: Ryen`;

    // 将所有元素添加到面板
    panel.appendChild(title);
    panel.appendChild(uploadContainer);
    panel.appendChild(toggleContainer);
    panel.appendChild(toggleViewedContainer);
    panel.appendChild(toggleVRContainer);
    panel.appendChild(buttonContainer);
    panel.appendChild(searchContainer);
    panel.appendChild(browseHistoryContainer); // 添加浏览记录查询功能
    panel.appendChild(idCountDisplay);
    panel.appendChild(uploadTimeDisplay);

    // 创建上次导出时间显示
    exportTimeDisplay = document.createElement('div');
    exportTimeDisplay.style.marginTop = '5px';
    exportTimeDisplay.style.color = '#666';
    exportTimeDisplay.style.fontSize = '13px';
    exportTimeDisplay.style.textAlign = 'center';
    panel.appendChild(exportTimeDisplay);

    const lastExportTime = GM_getValue(CONFIG.LAST_EXPORT_TIME_KEY);
    if (lastExportTime) {
        const lastExportDate = new Date(lastExportTime);
        const now = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (now - lastExportDate > oneWeek) {
            exportTimeDisplay.innerHTML = `上次备份已超过一周，请及时<strong style="color: red;">备份</strong>！`;
        } else {
            exportTimeDisplay.textContent = `上次备份时间：${lastExportDate.toLocaleString()}`;
        }
    } else {
        exportTimeDisplay.innerHTML = `还未备份过，请及时<strong style="color: red;">备份</strong>！`;
    }

    // 创建帮助面板
    const helpPanel = document.createElement('div');
    helpPanel.style.display = 'none';
    helpPanel.style.position = 'absolute';
    helpPanel.style.top = '0';
    helpPanel.style.left = '0';
    helpPanel.style.width = '100%';
    helpPanel.style.height = '100%';
    helpPanel.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    helpPanel.style.zIndex = '10002';
    helpPanel.style.overflowY = 'auto';
    helpPanel.style.padding = '20px';
    helpPanel.style.boxSizing = 'border-box';
    panel.appendChild(helpPanel);

    const helpContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 14px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; align-items: center; position: sticky; top: -20px; background: white; z-index: 1; padding: 10px 20px; margin: -20px -20px 15px -20px; border-bottom: 1px solid #eee;">
                <h2 style="font-size: 18px; font-weight: 600; margin: 0;">功能说明</h2>
                <span id="closeHelpButton" style="cursor: pointer; font-size: 24px; font-weight: bold; line-height: 1; color: #999;">&times;</span>
            </div>

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
    `;
    helpPanel.innerHTML = helpContent;

    // 帮助按钮事件
    helpButton.addEventListener('click', () => {
        helpPanel.style.display = 'block';
    });

    const closeHelpBtn = helpPanel.querySelector('#closeHelpButton');
    closeHelpBtn.addEventListener('click', () => {
        helpPanel.style.display = 'none';
    });
    closeHelpBtn.addEventListener('mouseover', () => {
        closeHelpBtn.style.color = '#333';
    });
    closeHelpBtn.addEventListener('mouseout', () => {
        closeHelpBtn.style.color = '#999';
    });


    panel.appendChild(versionAuthorInfo); // 将版本和作者信息放在最下面

    // 处理文件上传
    uploadButton.addEventListener('change', handleFileUpload);

    const circle = createCircle(circlePosition.left, circlePosition.top);

    // 调用函数以检查是否需要显示备份提醒
    showBackupReminderBubble();

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const jsonData = JSON.parse(e.target.result);

                // 检查导入的数据格式
                if (Array.isArray(jsonData)) {
                    // 旧格式处理
                    jsonData.forEach(item => {
                        if (item.id) {
                            storedIds.add(item.id);
                        }
                    });
                } else if (jsonData.videoBrowseHistory && jsonData.myIds) {
                    // 新格式处理
                    jsonData.videoBrowseHistory.forEach(id => {
                        storedIds.add(id); // 添加到 storedIds
                    });
                    jsonData.myIds.forEach(id => {
                        storedIds.add(id); // 添加到 storedIds
                    });

                    // 更新 videoBrowseHistory
                    const existingVideoBrowseHistory = GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []);
                    const updatedVideoBrowseHistory = new Set([...existingVideoBrowseHistory, ...jsonData.videoBrowseHistory]);
                    GM_setValue(CONFIG.BROWSE_HISTORY_KEY, Array.from(updatedVideoBrowseHistory)); // 更新存储
                }

                GM_setValue(CONFIG.STORED_IDS_KEY, Array.from(storedIds));

                lastUploadTime = new Date().toLocaleString();
                GM_setValue(CONFIG.LAST_UPLOAD_TIME_KEY, lastUploadTime);
                uploadTimeDisplay.textContent = `最新上传时间: ${lastUploadTime}`;

                alert('数据已保存');
                updateCountDisplay(); // 使用新的更新函数
            } catch (error) {
                console.error('解析 JSON 失败:', error);
                alert('解析 JSON 失败');
            }
        };

        reader.readAsText(file);
    }

    function createCircle(left, top) {
        debugLog('创建圆形按钮...');
        const existingCircle = document.getElementById('unique-circle');
        if (existingCircle) {
            debugLog('移除已存在的圆形按钮');
            existingCircle.remove();
        }

        const circle = document.createElement('div');
        circle.id = 'unique-circle';
        circle.style.position = 'fixed';
        circle.style.width = '60px';
        circle.style.height = '60px';
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = CONFIG.STATUS_DEFAULT_COLOR;
        circle.style.cursor = 'pointer';
        circle.style.zIndex = 10000;
        circle.style.left = `${left}px`;
        circle.style.top = `${top}px`;
        circle.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        circle.style.transition = 'all 0.3s ease';
        document.body.appendChild(circle);

        // 创建内部文字容器
        const label = document.createElement('div');
        label.textContent = '番';
        label.style.fontSize = '20px';
        label.style.color = 'white';
        label.style.textAlign = 'center';
        label.style.lineHeight = '60px';
        label.style.fontWeight = 'bold';
        label.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.2)';
        circle.appendChild(label);

        // 悬停效果
        circle.addEventListener('mouseenter', function () {
            circle.style.transition = 'all 0.3s ease';
            circle.style.left = '0px';
            circle.style.backgroundColor = CONFIG.STATUS_DEFAULT_COLOR;
            circle.style.transform = 'scale(1.05)';
            circle.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
        });

        // Helper to convert hex to rgba
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        circle.addEventListener('mouseleave', function () {
            circle.style.transition = 'all 0.3s ease';
            circle.style.left = '-40px';
            circle.style.backgroundColor = hexToRgba(CONFIG.STATUS_DEFAULT_COLOR, 0.7);
            circle.style.transform = 'scale(1)';
            circle.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        });

        // 点击效果
        circle.addEventListener('mousedown', function() {
            circle.style.transform = 'scale(0.95)';
        });

        circle.addEventListener('mouseup', function() {
            circle.style.transform = 'scale(1.05)';
        });

        // 修改圆形按钮点击事件处理
        circle.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            debugLog('圆形按钮被点击');
            panel.style.display = 'block';
            panelVisible = true;
            debugLog('面板显示状态:', panelVisible);

            setTimeout(() => {
                updatePanelPosition(panel, parseInt(circle.style.top));
            }, 0);

            setupMouseLeave(panel);
        });

        return circle;
    }

    // 修改 setupMouseLeave 函数
    function setupMouseLeave(panel) {
        let timeoutId = null;

        panel.addEventListener('mouseenter', () => {
            debugLog('鼠标进入面板');
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        });

        panel.addEventListener('mouseleave', (e) => {
            debugLog('鼠标离开面板');
            if (!panel.contains(e.relatedTarget)) {
                timeoutId = setTimeout(() => {
                    debugLog('关闭面板');
                    panel.style.display = 'none';
                    panelVisible = false;
                }, 1000);
            }
        });

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target.id !== 'unique-circle') {
                debugLog('点击面板外部，关闭面板');
                panel.style.display = 'none';
                panelVisible = false;
            }
        });
    }

    // 添加调试信息
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                debugLog('面板样式变化:', panel.style.cssText);
            }
        });
    });

    observer.observe(panel, { attributes: true });
})();


(function () {

    const url = window.location.href;


    const validUrlPatterns = [
        /https:\/\/javdb\.com\/users\/want_watch_videos.*/,
        /https:\/\/javdb\.com\/users\/watched_videos.*/,
        /https:\/\/javdb\.com\/users\/list_detail.*/,
        /https:\/\/javdb\.com\/lists.*/
    ];


    const isValidUrl = validUrlPatterns.some(pattern => pattern.test(url));
    if (!isValidUrl) {
        return;
    }



    let allVideosInfo = JSON.parse(localStorage.getItem('allVideosInfo')) || [];
    let exportState = {
        allowExport: false,
        currentPage: 1,
        maxPage: null
    };

    function getVideosInfo() {
        const videoElements = document.querySelectorAll('.item');
        return Array.from(videoElements).map((element) => {
            const title = element.querySelector('.video-title').textContent.trim();
            const [id, ...titleWords] = title.split(' ');
            const releaseDate = element.querySelector('.meta').textContent.replace(/[^0-9-]/g, '');
            return { id, releaseDate };
        });
    }

    // 获取总视频数量
    function getTotalVideoCount() {
        const activeLink = document.querySelector('a.is-active');
        if (activeLink) {
            const text = activeLink.textContent;
            const match = text.match(/\((\d+)\)/);
            if (match) {
                console.log(`总视频数量: ${match[1]}`);
                return parseInt(match[1], 10);
            }
        }
        return 0; // 默认返回0
    }

    // 计算最大页数
    function calculateMaxPages(totalCount, itemsPerPage) {
        const maxPages = Math.ceil(totalCount / itemsPerPage);
        console.log(`总视频数量: ${totalCount}, 每页视频数量: ${itemsPerPage}，最大页数: ${maxPages}`);
        return maxPages;
    }

    // 修改翻页逻辑
    function scrapeAllPages() {
        const itemsPerPage = CONFIG.VIDEOS_PER_PAGE; // 每页视频数量
        const totalCount = getTotalVideoCount(); // 获取总视频数量
        const maxPages = calculateMaxPages(totalCount, itemsPerPage); // 计算最大页数

        if (exportState.currentPage > maxPages) {
            exportScrapedData();
            return;
        }

        const videosInfo = getVideosInfo();
        allVideosInfo = allVideosInfo.concat(videosInfo);

        // 更新 URL
        if (exportState.currentPage > 1) {
            const newUrl = `https://javdb.com/users/watched_videos?page=${exportState.currentPage}`;
            location.href = newUrl; // 通过 URL 变更翻页
        } else {
            exportState.currentPage++; // 只在第一页时增加页码
            localStorage.setItem('exportState', JSON.stringify(exportState));
            scrapeAllPages(); // 继续抓取下一页
        }

        // 每导出5页后暂停3秒
        if (exportState.currentPage % 5 === 0) {
            setTimeout(() => {
                scrapeAllPages(); // 继续抓取
            }, CONFIG.EXPORT_PAUSE_DELAY); // 暂停3秒
        }
    }

    function exportScrapedData() {
        debugLog('开始导出抓取的番号...');
        try {
            const allVideosInfo = JSON.parse(localStorage.getItem('allVideosInfo') || '[]');
            if (allVideosInfo.length === 0) {
                logToScreen('没有抓取到任何数据，已停止导出。', 'rgba(255, 193, 7, 0.8)', 'white');
                return;
            }

            const json = JSON.stringify(allVideosInfo, null, 2);
            const jsonBlob = new Blob([json], {
                type: 'application/json'
            });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            const downloadLink = document.createElement('a');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

            let fileName = 'javdb-export';
            const url = window.location.href;
            if (url.includes('/watched_videos')) {
                fileName = 'watched-videos';
            } else if (url.includes('/want_watch_videos')) {
                fileName = 'want-watch-videos';
            } else if (url.includes('/list_detail')) {
                const listTitle = document.querySelector('.title.is-4');
                if (listTitle) fileName = listTitle.textContent.trim();
            } else if (url.includes('/lists')) {
                 const listTitle = document.querySelector('.title.is-4');
                if (listTitle) fileName = listTitle.textContent.trim();
            }

            downloadLink.download = `${fileName}_${timestamp}.json`;
            downloadLink.href = jsonUrl;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(jsonUrl);
            logToScreen('抓取的数据已成功导出。', 'rgba(76, 175, 80, 0.8)', 'white');
            debugLog('抓取的数据导出成功。');
        } catch (error) {
            console.error('导出抓取数据时出错:', error);
            logToScreen('导出抓取数据时出错，请查看控制台。', 'rgba(244, 67, 54, 0.8)', 'white');
        } finally {
            localStorage.removeItem('allVideosInfo');
            localStorage.removeItem('exportState');
        }
    }

    // 添加获取当前页码的函数
    function getCurrentPage() {
        // 从 URL 中获取页码
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        // 如果 URL 中没有页码参数，则返回 1
        return page ? parseInt(page) : 1;
    }

    function startExport() {
        const maxPageInput = document.getElementById('maxPageInput');
        if (!maxPageInput) {
            console.error('找不到页数输入框');
            return;
        }

        const itemsPerPage = CONFIG.VIDEOS_PER_PAGE;
        const totalCount = getTotalVideoCount();
        const maxPages = calculateMaxPages(totalCount, itemsPerPage);

        // 如果用户输入了页数，使用用户输入的值，否则使用最大页数
        const pagesToExport = maxPageInput.value ? parseInt(maxPageInput.value) : maxPages;

        // 确保不超过最大页数
        const currentPage = getCurrentPage();
        const targetPage = Math.min(currentPage + pagesToExport - 1, maxPages);

        if (targetPage < currentPage) {
            alert('请输入有效的页数');
            return;
        }

        exportState.currentPage = currentPage;
        exportState.maxPage = targetPage;
        exportState.allowExport = true;

        localStorage.setItem('exportState', JSON.stringify(exportState));
        localStorage.setItem('allVideosInfo', JSON.stringify([])); // 清空之前的数据

        exportButton.textContent = `导出中...(${currentPage}/${targetPage})`;
        exportButton.disabled = true;
        stopButton.disabled = false;
        isExporting = true;

        // 开始从当前页抓取数据
        scrapeCurrentPage();
    }

    // 新增函数：抓取当前页面数据
    function scrapeCurrentPage() {
        if (!isExporting || exportState.currentPage > exportState.maxPage) {
            finishExport();
            return;
        }

        const startTime = performance.now();

        const videosInfo = getVideosInfo();
        const currentAllVideos = JSON.parse(localStorage.getItem('allVideosInfo') || '[]');
        const newAllVideos = currentAllVideos.concat(videosInfo);
        localStorage.setItem('allVideosInfo', JSON.stringify(newAllVideos));

        if (CONFIG.PERFORMANCE_MODE) {
            const endTime = performance.now();
            const processingTime = (endTime - startTime).toFixed(2);
            console.log(`成功获取到 ${videosInfo.length} 个视频数据，当前页: ${exportState.currentPage}，处理时间: ${processingTime}ms`);
        }

        // 更新进度显示
        exportButton.textContent = `导出中...(${exportState.currentPage}/${exportState.maxPage})`;

        // 前往下一页
        exportState.currentPage++;
        localStorage.setItem('exportState', JSON.stringify(exportState));

        if (exportState.currentPage <= exportState.maxPage) {
            const newUrl = `${window.location.pathname}?page=${exportState.currentPage}`;
            window.location.href = newUrl;
        } else {
            finishExport();
        }
    }

    // 新增函数：完成导出
    function finishExport() {
        const allVideosInfo = JSON.parse(localStorage.getItem('allVideosInfo') || '[]');
        if (allVideosInfo.length > 0) {
            exportScrapedData();
        }

        // 重置状态
        isExporting = false;
        exportState.allowExport = false;
        exportState.currentPage = 1;
        exportState.maxPage = null;
        localStorage.setItem('exportState', JSON.stringify(exportState));

        exportButton.textContent = '导出完成';
        exportButton.disabled = false;
        stopButton.disabled = true;
    }

    function createExportButton() {
        const maxPageInput = document.createElement('input');
        maxPageInput.type = 'number';
        maxPageInput.id = 'maxPageInput';
        maxPageInput.placeholder = '当前页往后导出的页数，留空导全部';  // 修改提示文本
        maxPageInput.style.cssText = `
            margin-right: 10px;
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            width: auto;
            min-width: 50px;
            box-sizing: border-box;
            transition: all 0.3s ease;
            outline: none;
            background-color: white;
        `;
        maxPageInput.min = '1';

        // 获取最大页数并设置为 max 属性
        const itemsPerPage = CONFIG.VIDEOS_PER_PAGE;
        const totalCount = getTotalVideoCount();
        const maxPages = calculateMaxPages(totalCount, itemsPerPage);
        maxPageInput.max = maxPages;

        // 创建一个容器来包含上传按钮和帮助图标
        const uploadContainer = document.createElement('div');
        uploadContainer.style.position = 'relative';
        uploadContainer.style.marginBottom = '15px';
        uploadContainer.style.display = 'flex'; // 使用flex布局
        uploadContainer.style.alignItems = 'center'; // 垂直居中
        uploadContainer.style.gap = '8px'; // 元素之间的间距
        uploadContainer.style.width = '100%';

        // 创建一个包装上传按钮的容器
        const uploadButtonWrapper = document.createElement('div');
        uploadButtonWrapper.style.flex = '1'; // 占据剩余空间
        uploadButtonWrapper.style.minWidth = '0'; // 防止内容溢出
        uploadContainer.appendChild(uploadButtonWrapper);
        uploadButtonWrapper.appendChild(maxPageInput);

        // 初始化输入框宽度
        setTimeout(() => {
            const tempSpan = document.createElement('span');
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.position = 'absolute';
            tempSpan.style.whiteSpace = 'nowrap';
            tempSpan.style.font = window.getComputedStyle(maxPageInput).font;
            tempSpan.textContent = maxPageInput.placeholder;
            document.body.appendChild(tempSpan);

            // 设置输入框宽度为占位符文本宽度加上内边距
            const width = tempSpan.offsetWidth;
            maxPageInput.style.width = (width + 50) + 'px';

            document.body.removeChild(tempSpan);
        }, 0);

        // 输入框焦点样式
        maxPageInput.addEventListener('focus', function() {
            this.style.borderColor = '#4a9eff';
            this.style.boxShadow = '0 0 0 2px rgba(74, 158, 255, 0.2)';
        });

        maxPageInput.addEventListener('blur', function() {
            this.style.borderColor = '#ddd';
            this.style.boxShadow = 'none';
        });

        exportButton = document.createElement('button');
        exportButton.textContent = '导出 json';
        exportButton.className = 'button is-small';
        exportButton.style.cssText = `
            padding: 6px 16px;
            background-color: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            outline: none;
            height: auto;
        `;

        stopButton = document.createElement('button');
        stopButton.textContent = '停止导出';
        stopButton.className = 'button is-small';
        stopButton.style.cssText = `
            margin-left: 10px;
            padding: 6px 16px;
            background-color: #ff4757;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            outline: none;
            height: auto;
        `;
        stopButton.disabled = true;

        // 按钮悬停效果
        [exportButton, stopButton].forEach(button => {
            button.addEventListener('mouseover', function() {
                if (!this.disabled) {
                    this.style.opacity = '0.9';
                    this.style.transform = 'translateY(-1px)';
                }
            });

            button.addEventListener('mouseout', function() {
                if (!this.disabled) {
                    this.style.opacity = '1';
                    this.style.transform = 'translateY(0)';
                }
            });

            // 修改禁用状态的处理方式
            const updateDisabledStyle = function() {
                if (this.disabled) {
                    this.style.opacity = '0.6';
                    this.style.cursor = 'not-allowed';
                } else {
                    this.style.opacity = '1';
                    this.style.cursor = 'pointer';
                }
            };

            // 监听 disabled 属性变化
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'disabled') {
                        updateDisabledStyle.call(button);
                    }
                });
            });

            observer.observe(button, {
                attributes: true,
                attributeFilter: ['disabled']
            });

            // 初始化禁用状态样式
            updateDisabledStyle.call(button);
        });

        // 添加按钮点击效果
        [exportButton, stopButton].forEach(button => {
            button.addEventListener('mousedown', function() {
                if (!this.disabled) {
                    this.style.transform = 'translateY(1px)';
                }
            });

            button.addEventListener('mouseup', function() {
                if (!this.disabled) {
                    this.style.transform = 'translateY(-1px)';
                }
            });
        });

        stopButton.addEventListener('click', () => {
            isExporting = false;
            stopButton.disabled = true;
            exportButton.disabled = false;
            exportButton.textContent = '导出已停止';
            localStorage.removeItem('allVideosInfo');
            localStorage.removeItem('exportState');
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.appendChild(exportButton);
        buttonContainer.appendChild(stopButton);

        // 创建最终的容器
        const exportContainer = document.createElement('div');
        exportContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px;
            border-radius: 6px;
            background-color: rgba(255, 255, 255, 0.8);
        `;
        exportContainer.appendChild(maxPageInput);
        exportContainer.appendChild(buttonContainer);

        if (url.includes('/list_detail')) {
            document.querySelector('.breadcrumb').querySelector('ul').appendChild(exportContainer);
        } else {
            document.querySelector('.toolbar').appendChild(exportContainer);
        }

        exportButton.addEventListener('click', () => {
            if (!isExporting) {
                startExport();
            }
        });
    }


    function checkExportState() {
        const savedExportState = localStorage.getItem('exportState');
        if (savedExportState) {
            exportState = JSON.parse(savedExportState);

            if (exportState.allowExport) {
                exportButton.textContent = '导出中...';
                exportButton.disabled = true;
                stopButton.disabled = false;
                isExporting = true;

                // 继续抓取当前页面
                waitForDOMAndScrape();
            }
        }
    }

    function waitForDOMAndScrape() {
        // 使用更智能的DOM检测机制
        function checkAndScrape() {
            const videoElements = document.querySelectorAll('.item');
            if (videoElements.length > 0) {
                // 如果找到视频元素，立即开始处理
                scrapeCurrentPage();
            } else {
                // 如果还没找到，继续等待
                setTimeout(checkAndScrape, 200); // 每200ms检查一次
            }
        }

        // 检查页面是否已经加载完成
        if (document.readyState === 'complete') {
            checkAndScrape();
        } else {
            window.addEventListener('load', checkAndScrape);
        }
    }

    if (url.includes('/watched_videos')
        || url.includes('/want_watch_videos')
        || url.includes('/list_detail')
        || url.includes('/lists')
    ) {
        createExportButton();
        checkExportState();
    }
})();

// 修改 modifyItemAtCurrentPage 函数
function modifyItemAtCurrentPage(itemToModify) {
    const isSearchPage = window.location.href.startsWith('https://javdb.com/search?');

    // 从 GM 存储中读取最新的隐藏设置，以确保对动态加载的内容也有效
    let hideWatchedVideos = GM_getValue(CONFIG.HIDE_WATCHED_VIDEOS_KEY, false);
    let hideViewedVideos = GM_getValue(CONFIG.HIDE_VIEWED_VIDEOS_KEY, false);
    let hideVRVideos = GM_getValue(CONFIG.HIDE_VR_VIDEOS_KEY, false);

    // 如果是搜索页面，则禁用隐藏功能
    if (isSearchPage) {
        hideWatchedVideos = false;
        hideViewedVideos = false;
        hideVRVideos = false;
    }

    // 获取番号
    const videoTitle = itemToModify.querySelector('div.video-title > strong')?.textContent.trim();
    // 获取 data-title
    const dataTitle = itemToModify.querySelector('div.video-title > span.x-btn')?.getAttribute('data-title');

    if (!videoTitle) {
        debugLog('未找到视频标题');
        return;
    }

    debugLog('处理番号:', videoTitle);

    const browseHistory = new Set(GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []));
    const watchedVideos = new Set(GM_getValue(CONFIG.STORED_IDS_KEY, []));

    debugLog('浏览历史数量:', browseHistory.size);
    debugLog('已看番号数量:', watchedVideos.size);
    debugLog(`${videoTitle} 是否在浏览历史中:`, browseHistory.has(videoTitle));
    debugLog(`${videoTitle} 是否在已看列表中:`, watchedVideos.has(videoTitle));

    // 检查是否需要隐藏VR番号
    if (hideVRVideos && dataTitle.includes('【VR】')) {
        debugLog(`${videoTitle} 是VR番号，hideVRVideos=${hideVRVideos}，准备隐藏`);
        const itemContainer = itemToModify.closest('.item');
        if (itemContainer) {
            itemContainer.style.transition = 'opacity 0.3s';
            itemContainer.style.opacity = '0';
            setTimeout(() => {
                itemContainer.remove();
                debugLog(`${videoTitle} 已隐藏并移除`);
            }, 300);
        }
        return;
    }

    // 检查是否需要隐藏已浏览的番号
    if (hideViewedVideos && browseHistory.has(videoTitle)) {
        debugLog(`${videoTitle} 在浏览历史中，hideViewedVideos=${hideViewedVideos}，准备隐藏`);
        const itemContainer = itemToModify.closest('.item');
        if (itemContainer) {
            itemContainer.style.transition = 'opacity 0.3s';
            itemContainer.style.opacity = '0';
            setTimeout(() => {
                itemContainer.remove();
                debugLog(`${videoTitle} 已隐藏并移除`);
            }, 300);
        }
        return;
    }

    // 检查是否是已看的番号并需要隐藏
    if (watchedVideos.has(videoTitle) && hideWatchedVideos) {
        debugLog(`${videoTitle} 在已看列表中，hideWatchedVideos=${hideWatchedVideos}，准备隐藏`);
        const itemContainer = itemToModify.closest('.item');
        if (itemContainer) {
            itemContainer.style.transition = 'opacity 0.3s';
            itemContainer.style.opacity = '0';
            setTimeout(() => {
                itemContainer.remove();
                debugLog(`${videoTitle} 已隐藏并移除`);
            }, 300);
        }
        return;
    }

    // 只处理真正已看的番号的标签
    if (watchedVideos.has(videoTitle)) {
        debugLog(`${videoTitle} 在已看列表中，准备添加标签`);
        let tags = itemToModify.closest('.item').querySelector('.tags.has-addons');
        if (!tags) {
            debugLog(`${videoTitle} 未找到标签容器`);
            return;
        }

        let tagClass = styleMap['我看過這部影片'];

        // 检查是否已经存在相同的标记
        let existingTags = Array.from(tags.querySelectorAll('span'));
        let tagExists = existingTags.some(tag => tag.textContent === '我看過這部影片');
        debugLog(`${videoTitle} 是否已有标签:`, tagExists);

        // 如果不存在对应的标签，则添加新的标签
        if (!tagExists) {
            let newTag = document.createElement('span');
            newTag.className = tagClass;
            newTag.textContent = '我看過這部影片';
            tags.appendChild(newTag);
            debugLog(`成功为 ${videoTitle} 添加已看标签`);
            logToScreen(`我看過這部影片: ${videoTitle}`, 'rgba(76, 175, 80, 0.8)', 'white');
        } else {
            debugLog(`${videoTitle} 已有标签，跳过添加`);
        }
    } else if (browseHistory.has(videoTitle)) {
        debugLog(`${videoTitle} 在浏览历史中，准备添加已浏览标签`);
        let tags = itemToModify.closest('.item').querySelector('.tags.has-addons');
        if (!tags) {
            debugLog(`${videoTitle} 未找到标签容器`);
            return;
        }

        let tagClass = styleMap['已浏览'];
        if (!tagClass) {
            debugLog('未找到已浏览标签的样式');
            return;
        }

        // 检查是否已存在标签
        let existingTags = Array.from(tags.querySelectorAll('span'));
        let tagExists = existingTags.some(tag => ['我看過這部影片', '已浏览'].includes(tag.textContent));
        debugLog(`${videoTitle} 是否已有标签:`, tagExists);

        if (!tagExists) {
            let newTag = document.createElement('span');
            newTag.className = tagClass;
            newTag.textContent = '已浏览';
            tags.appendChild(newTag);
            debugLog(`成功为 ${videoTitle} 添加已浏览标签`);
            logToScreen(`已浏览: ${videoTitle}`, 'rgba(255, 159, 67, 0.8)', 'white');
        } else {
            debugLog(`${videoTitle} 已有标签，跳过添加`);
        }
    } else {
        debugLog(`${videoTitle} 不在已看或已浏览列表中，不添加标签`);
    }
}

async function processLoadedItems() {
    debugLog('开始处理页面项目');
    debugLog('当前 hideWatchedVideos 状态:', GM_getValue(CONFIG.HIDE_WATCHED_VIDEOS_KEY, false));
    debugLog('当前 hideViewedVideos 状态:', GM_getValue(CONFIG.HIDE_VIEWED_VIDEOS_KEY, false));
    debugLog('当前 hideVRVideos 状态:', GM_getValue(CONFIG.HIDE_VR_VIDEOS_KEY, false));

    const url = window.location.href;
    debugLog('当前URL:', url);

    const isValidUrl = validUrlPatterns.some(pattern => pattern.test(url));
    if (isValidUrl) {
        debugLog('URL匹配特殊模式，跳过处理');
        return;
    }

    let items = Array.from(document.querySelectorAll('.movie-list .item a'));
    debugLog('找到项目数量:', items.length);

    // 从每个 item 的 <a> 中找到对应的 <strong> 内容
    items.forEach((item, index) => {
        debugLog(`处理第 ${index + 1} 个项目`);
        let strongElement = item.querySelector('div.video-title > strong');
        if (strongElement) {
            let title = strongElement.textContent.trim();
            if (title) {
                debugLog(`处理番号: ${title}`);
                modifyItemAtCurrentPage(item);
            } else {
                debugLog('项目标题为空');
            }
        } else {
            debugLog('未找到标题元素');
        }
    });
}

// 使用 MutationObserver 监听由"自动翻页"等插件动态添加的项目，这比 setInterval 更高效
const targetNode = document.querySelector('.movie-list');
if (targetNode) {
    // 初始加载时处理页面上已有的项目
    processLoadedItems();

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                let newItemsCount = 0;
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const itemsToProcess = [];
                        // 检查节点本身是否为 .item
                        if (node.matches && node.matches('.item')) {
                            itemsToProcess.push(node);
                        }
                        // 检查节点是否为包含 .item 的容器
                        else if (node.querySelectorAll) {
                            node.querySelectorAll('.item').forEach(item => itemsToProcess.push(item));
                        }

                        if (itemsToProcess.length > 0) {
                            newItemsCount += itemsToProcess.length;
                            itemsToProcess.forEach(itemNode => {
                                const itemLink = itemNode.querySelector('a');
                                if (itemLink) {
                                    modifyItemAtCurrentPage(itemLink);
                                }
                            });
                        }
                    }
                });
                if (newItemsCount > 0) {
                     logToScreen(`通过翻页插件加载了 ${newItemsCount} 个新项目`, 'rgba(0, 255, 255, 0.8)', 'white');
                }
            }
        });
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });
    debugLog('MutationObserver 已启动，正在监视 .movie-list 的变化。');
} else {
    // 如果没有 .movie-list，仍然像以前一样处理项目
    processLoadedItems();
    debugLog("未找到 '.movie-list' 元素，MutationObserver 未启动。");
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
    if (panelVisible) {
        updatePanelPosition(panel, parseInt(panel.style.top));
    }
});

// 修改随机延迟函数的参数范围为3-5秒
function getRandomDelay(min = CONFIG.VIDEO_ID_RECORD_DELAY_MIN, max = CONFIG.VIDEO_ID_RECORD_DELAY_MAX) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

// 修改记录番号浏览记录函数
async function recordVideoId() {
    const videoIdPattern = /<strong>番號:<\/strong>\s*&nbsp;<span class="value"><a href="\/video_codes\/([A-Z]+)">([A-Z]+)<\/a>-(\d+)<\/span>/;
    const panelBlock = document.querySelector('.panel-block.first-block');

    if (panelBlock) {
        const match = panelBlock.innerHTML.match(videoIdPattern);
        if (match) {
            const videoId = `${match[1]}-${match[3]}`;

            // 随机等待3-5秒
            const delay = getRandomDelay();
            debugLog(`等待 ${delay/1000} 秒后开始验证记录...`);
            await sleep(delay);

            // 最大重试次数
            const maxRetries = CONFIG.VIDEO_ID_RECORD_RETRIES;
            let retryCount = 0;
            let recordSuccess = false;

            while (!recordSuccess && retryCount < maxRetries) {
                try {
                    // 获取当前存储的浏览记录
                    const storedVideoIds = new Set(GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []));

                    // 如果已经存在，直接返回
                    if (storedVideoIds.has(videoId)) {
                        debugLog(`番号已存在: ${videoId}`);
                        return;
                    }

                    // 添加新的番号
                    storedVideoIds.add(videoId);
                    GM_setValue(CONFIG.BROWSE_HISTORY_KEY, Array.from(storedVideoIds));

                    // 等待一小段时间后验证
                    await sleep(500);

                    // 验证是否成功保存
                    const verifyStorage = new Set(GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []));
                    if (verifyStorage.has(videoId)) {
                        debugLog(`成功记录番号: ${videoId}`);
                        logToScreen(`成功记录番号: ${videoId}`, 'rgba(76, 175, 80, 0.8)', 'white');
                        updateCountDisplay();
                        recordSuccess = true;
                        break;
                    } else {
                        throw new Error('验证失败');
                    }
                } catch (error) {
                    retryCount++;
                    debugLog(`第 ${retryCount} 次记录失败: ${videoId}, 错误: ${error.message}`);
                    logToScreen(`第 ${retryCount} 次记录失败，将在3秒后重试...`, 'rgba(255, 193, 7, 0.8)', 'white');

                    if (retryCount < maxRetries) {
                        await sleep(CONFIG.VIDEO_ID_RECORD_RETRY_DELAY); // 失败后等待3秒再重试
                    }
                }
            }

            if (!recordSuccess) {
                debugLog(`达到最大重试次数(${maxRetries})，番号记录失败: ${videoId}`);
                logToScreen(`番号记录失败，请刷新页面重试`, 'rgba(244, 67, 54, 0.8)', 'white');
            }
        } else {
            debugLog('未找到匹配的番号格式');
        }
    } else {
        debugLog('未找到包含番号的元素');
    }
}

// 在页面加载时调用记录函数
if (window.location.href.startsWith('https://javdb.com/v/')) {
    recordVideoId();
}

// -- 新增功能：定时检查当前影片状态并更新图标颜色 --
(function() {
    'use strict';

    // 定义常量
    const GREEN_COLOR = CONFIG.STATUS_WATCHED_COLOR; // 绿色，用于标记已看/已浏览
    const ORIGINAL_COLOR = CONFIG.STATUS_DEFAULT_COLOR; // 原始颜色
    let originalFaviconUrl = null;

    function getFaviconLink() {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        return link;
    }

    function setFavicon(url) {
        const head = document.head;
        const existingFavicons = document.querySelectorAll("link[rel~='icon']");
        existingFavicons.forEach(icon => icon.remove());

        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        if (url.endsWith('.png')) {
            newFavicon.type = 'image/png';
        }
        newFavicon.href = url;
        head.appendChild(newFavicon);
    }

    originalFaviconUrl = getFaviconLink().href;

    /**
     * 检查当前视频页面的观看状态，并更新圆形按钮的颜色。
     */
    function checkCurrentVideoStatus() {
        const currentFaviconHref = getFaviconLink().href;
        // 此功能仅在视频详情页执行 (e.g., /v/xxxx)
        if (!window.location.href.startsWith('https://javdb.com/v/')) {
            if (originalFaviconUrl && currentFaviconHref !== originalFaviconUrl) {
                setFavicon(originalFaviconUrl);
            }
            return;
        }

        // 查找包含番号信息的元素
        const panelBlock = document.querySelector('.panel-block.first-block');
        if (!panelBlock) {
            return; // 如果元素未加载，则稍后重试
        }

        // 使用正则表达式从页面提取番号
        const videoIdPattern = /<strong>番號:<\/strong>\s*&nbsp;<span class="value"><a href="\/video_codes\/([A-Z]+)">[A-Z]+<\/a>-(\d+)<\/span>/;
        const match = panelBlock.innerHTML.match(videoIdPattern);
        if (!match) {
            return; // 未匹配到番号
        }

        const videoId = `${match[1]}-${match[2]}`;

        // 从 GM 存储中获取"已看"和"已浏览"列表
        const watchedVideos = new Set(GM_getValue(CONFIG.STORED_IDS_KEY, []));
        const browseHistory = new Set(GM_getValue(CONFIG.BROWSE_HISTORY_KEY, []));

        // 判断当前视频是否在任一列表中
        const isWatchedOrViewed = watchedVideos.has(videoId) || browseHistory.has(videoId);

        // 获取圆形按钮元素
        const circle = document.getElementById('unique-circle');
        if (circle) {
            const targetColor = isWatchedOrViewed ? GREEN_COLOR : ORIGINAL_COLOR;
            // 仅在颜色不同时才更新，以减少不必要的DOM操作
            if (circle.style.backgroundColor !== targetColor) {
                circle.style.backgroundColor = targetColor;
            }
        }

        if (isWatchedOrViewed) {
            if (currentFaviconHref !== CONFIG.CUSTOM_FAVICON_URL) {
                setFavicon(CONFIG.CUSTOM_FAVICON_URL);
            }
        } else {
            if (originalFaviconUrl && currentFaviconHref !== originalFaviconUrl) {
                setFavicon(originalFaviconUrl);
            }
        }
    }

    // 每2秒执行一次检查
    setInterval(checkCurrentVideoStatus, CONFIG.STATUS_CHECK_INTERVAL);
})();
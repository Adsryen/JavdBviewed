// src/content/content.ts

import { getSettings, getValue, setValue } from '../utils/storage';
import { VIDEO_STATUS } from '../utils/config';
import { safeUpdateStatus } from '../utils/statusPriority';
import type { ExtensionSettings, VideoRecord } from '../types';

interface ContentState {
    settings: ExtensionSettings | null;
    records: Record<string, VideoRecord>;
    isSearchPage: boolean;
    observer: MutationObserver | null;
    debounceTimer: number | null;
    originalFaviconUrl: string;
}

const STATE: ContentState = {
    settings: null,
    records: {},
    isSearchPage: false,
    observer: null,
    debounceTimer: null,
    originalFaviconUrl: '',
};

const SELECTORS = {
    MOVIE_LIST_ITEM: '.movie-list .item',
    VIDEO_TITLE: 'div.video-title > strong',
    VIDEO_ID: '.uid, .item-id > strong',
    TAGS_CONTAINER: '.tags.has-addons',
    FAVICON: "link[rel~='icon']",
    VIDEO_DETAIL_ID: '.panel-block.first-block',
    VIDEO_DETAIL_RELEASE_DATE: '.movie-meta-info > span:nth-child(2)',
    VIDEO_DETAIL_TAGS: '.panel-block .tags .tag',
    SEARCH_RESULT_PAGE: '.container .column.is-9',
    EXPORT_TOOLBAR: '.toolbar, .breadcrumb ul',
};

const log = (...args: any[]) => console.log('[JavDB Ext]', ...args);

// 弹幕提示相关配置
const TOAST_CONFIG = {
    FADE_DURATION: 500,
    DISPLAY_DURATION: 3000,
    MAX_MESSAGES: 3,
    Z_INDEX: 10000
};

// --- Toast Message System ---

function loadFontAwesome(): void {
    // 检查是否已经加载了Font Awesome
    if (document.querySelector('link[href*="font-awesome"]') || document.querySelector('link[href*="fontawesome"]')) {
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
}

function createToastContainer(): HTMLElement {
    let container = document.getElementById('javdb-ext-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'javdb-ext-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: ${TOAST_CONFIG.Z_INDEX};
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column-reverse;
            align-items: flex-end;
            gap: 8px;
        `;
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    // 确保Font Awesome已加载
    loadFontAwesome();

    const container = createToastContainer();

    // 限制最大消息数量
    while (container.children.length >= TOAST_CONFIG.MAX_MESSAGES) {
        const lastChild = container.lastChild as HTMLElement;
        if (lastChild) {
            fadeOutToast(lastChild);
        }
    }

    const toast = document.createElement('div');

    // 根据类型设置渐变背景
    let backgroundGradient: string;
    let iconClass: string;

    switch (type) {
        case 'success':
            backgroundGradient = 'linear-gradient(to right, #2a9d8f, #4CAF50)';
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            backgroundGradient = 'linear-gradient(to right, #e76f51, #d90429)';
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'info':
        default:
            backgroundGradient = 'linear-gradient(to right, #2a9d8f, #264653)';
            iconClass = 'fas fa-info-circle';
            break;
    }

    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 22px;
        border-radius: 10px;
        background: ${backgroundGradient};
        color: #fff;
        font-family: "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;
        font-size: 15px;
        font-weight: 500;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        min-width: 280px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        word-wrap: break-word;
    `;

    // 创建图标元素
    const icon = document.createElement('i');
    icon.className = iconClass;
    icon.style.cssText = `
        font-size: 22px;
        line-height: 1;
        flex-shrink: 0;
    `;

    // 创建文本元素
    const textElement = document.createElement('span');
    textElement.textContent = message;

    // 组装toast
    toast.appendChild(icon);
    toast.appendChild(textElement);
    container.appendChild(toast);

    // 触发动画
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // 自动消失
    setTimeout(() => {
        fadeOutToast(toast);
    }, TOAST_CONFIG.DISPLAY_DURATION);
}

function fadeOutToast(toast: HTMLElement): void {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, TOAST_CONFIG.FADE_DURATION);
}

// --- Core Logic ---

async function initialize(): Promise<void> {
    log('Extension initializing...');

    const [settings, records] = await Promise.all([
        getSettings(),
        getValue<Record<string, VideoRecord>>('viewed', {}),
    ]);
    STATE.settings = settings;
    STATE.records = records;
    log(`Loaded ${Object.keys(STATE.records).length} records.`);

    STATE.isSearchPage = !!document.querySelector(SELECTORS.SEARCH_RESULT_PAGE);
    if (STATE.isSearchPage) {
        log('Search page detected, hiding functions will be disabled.');
    }

    const faviconLink = document.querySelector<HTMLLinkElement>(SELECTORS.FAVICON);
    if (faviconLink) {
        STATE.originalFaviconUrl = faviconLink.href;
        log(`Original favicon URL saved: ${STATE.originalFaviconUrl}`);
    } else {
        log('No favicon link found');
    }

    processVisibleItems();
    setupObserver();

    if (window.location.pathname.startsWith('/v/')) {
        await handleVideoDetailPage();

        // 初始状态检查
        setTimeout(() => {
            checkAndUpdateVideoStatus();
        }, 1000);

        // 定期检查状态（每2秒）
        setInterval(checkAndUpdateVideoStatus, 2000);
    }

    initExportFeature();
}

function processVisibleItems(): void {
    document.querySelectorAll<HTMLElement>(SELECTORS.MOVIE_LIST_ITEM).forEach(processItem);
}

function setupObserver(): void {
    const targetNode = document.querySelector('.movie-list');
    if (!targetNode) return;

    STATE.observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                if (STATE.debounceTimer) clearTimeout(STATE.debounceTimer);
                STATE.debounceTimer = window.setTimeout(processVisibleItems, 300);
            }
        });
    });

    STATE.observer.observe(targetNode, { childList: true, subtree: true });
}

function shouldHide(videoId: string): boolean {
    if (STATE.isSearchPage || !STATE.settings) return false;
    
    const { hideViewed, hideBrowsed } = STATE.settings.display;
    const record = STATE.records[videoId];

    if (!record) return false;

    const isViewed = record.status === VIDEO_STATUS.VIEWED;
    const isBrowsed = record.status === VIDEO_STATUS.BROWSED;
    
    if (hideViewed && isViewed) return true;
    if (hideBrowsed && isBrowsed) return true;
    
    return false;
}

function processItem(item: HTMLElement): void {
    const videoIdElement = item.querySelector<HTMLElement>(SELECTORS.VIDEO_ID);
    if (!videoIdElement) return;
    
    const videoId = videoIdElement.textContent?.trim();
    if (!videoId) return;

    item.querySelectorAll('.custom-status-tag').forEach(tag => tag.remove());

    const tagContainer = item.querySelector<HTMLElement>(SELECTORS.TAGS_CONTAINER);
    if (!tagContainer) return;
    
    const record = STATE.records[videoId];

    if (record) {
        switch (record.status) {
            case VIDEO_STATUS.VIEWED:
                addTag(tagContainer, '已观看', 'is-success');
                break;
            case VIDEO_STATUS.WANT:
                addTag(tagContainer, '我想看', 'is-info');
                break;
            case VIDEO_STATUS.BROWSED:
                addTag(tagContainer, '已浏览', 'is-warning');
                break;
        }
    }

    const isVR = item.querySelector('.tag.is-link')?.textContent?.trim() === 'VR';
    if (STATE.settings?.display.hideVR && isVR) {
        item.style.display = 'none';
        return;
    }
    
    if (shouldHide(videoId)) {
        item.style.display = 'none';
    }
}

function addTag(container: HTMLElement, text: string, style: string): void {
    const tag = document.createElement('span');
    tag.className = `tag ${style} is-light custom-status-tag`;
    tag.textContent = text;
    container.appendChild(tag);
}

// --- Page-Specific Logic ---

async function handleVideoDetailPage(): Promise<void> {
    log('Analyzing video detail page...');

    // 尝试多种方式获取视频ID
    let videoId: string | undefined;

    // 方法1: 从页面标题中获取 (新的页面结构)
    const titleElement = document.querySelector<HTMLElement>('h2.title.is-4 strong:first-child');
    if (titleElement) {
        videoId = titleElement.textContent?.trim();
        log(`Found video ID from title: ${videoId}`);
    }

    // 方法2: 从panel-block中获取 (旧的页面结构)
    if (!videoId) {
        const panelBlock = document.querySelector<HTMLElement>(SELECTORS.VIDEO_DETAIL_ID);
        if (panelBlock) {
            const fullIdText = panelBlock.querySelector<HTMLElement>('.title.is-4');
            if (fullIdText) {
                videoId = fullIdText.textContent?.trim();
                log(`Found video ID from panel-block: ${videoId}`);
            }
        }
    }

    // 方法3: 从URL中提取
    if (!videoId) {
        const urlMatch = window.location.pathname.match(/\/v\/([^\/]+)/);
        if (urlMatch) {
            videoId = urlMatch[1].toUpperCase();
            log(`Found video ID from URL: ${videoId}`);
        }
    }

    if (!videoId) {
        log('Could not find video ID using any method. Aborting.');
        return;
    }
    
    log(`Found video ID: ${videoId}`);
    const record = STATE.records[videoId];
    const now = Date.now();
    const currentUrl = window.location.href;

    if (record) {
        log(`Record for ${videoId} already exists. Status: ${record.status}.`);
        record.updatedAt = now;
        if (!record.javdbUrl) {
            record.javdbUrl = currentUrl;
            log(`Added missing javdbUrl for ${videoId}.`);
        }

        // 尝试将状态升级为'browsed'，但只有在优先级允许的情况下
        const oldStatus = record.status;
        const newStatus = safeUpdateStatus(record.status, VIDEO_STATUS.BROWSED);
        let statusChanged = false;

        if (newStatus !== oldStatus) {
            record.status = newStatus;
            statusChanged = true;
            log(`Updated status for ${videoId} from '${oldStatus}' to '${newStatus}' (priority upgrade).`);
        } else {
            log(`Status for ${videoId} remains '${record.status}' (no upgrade needed or not allowed).`);
        }

        await setValue('viewed', STATE.records);
        log(`Updated 'updatedAt' for ${videoId}.`);

        // 显示相应的弹幕提示
        if (statusChanged) {
            showToast(`状态已更新: ${videoId}`, 'success');
        } else {
            showToast(`无需更新: ${videoId}`, 'info');
        }

        setFavicon(chrome.runtime.getURL("assets/jav.png"));
    } else {
        log(`No record found for ${videoId}. Scheduling to add as 'browsed'.`);
        setTimeout(async () => {
            // Re-check in case it was added in the meantime
            if (STATE.records[videoId]) {
                log(`${videoId} was added while waiting for timeout. Aborting duplicate add.`);
                return;
            }

            const title = document.title.replace(/ \| JavDB.*/, '').trim();
            const releaseDateElement = document.querySelector<HTMLElement>(SELECTORS.VIDEO_DETAIL_RELEASE_DATE);
            const tags = Array.from(document.querySelectorAll<HTMLAnchorElement>(SELECTORS.VIDEO_DETAIL_TAGS))
                .map(tag => tag.innerText.trim())
                .filter(Boolean);

            const newRecord: VideoRecord = {
                id: videoId,
                title: title,
                status: VIDEO_STATUS.BROWSED,
                createdAt: now,
                updatedAt: now,
                tags: tags,
                releaseDate: releaseDateElement?.textContent?.trim() || undefined,
                javdbUrl: currentUrl,
            };

            STATE.records[videoId] = newRecord;
            await setValue('viewed', STATE.records);
            log(`Successfully added new record for ${videoId}`, newRecord);

            // 显示成功记录提示
            showToast(`成功记录番号: ${videoId}`, 'success');

            setFavicon(chrome.runtime.getURL("assets/jav.png"));
        }, getRandomDelay(2000, 4000));
    }
}

// --- Status Check and Visual Feedback ---

function checkAndUpdateVideoStatus(): void {
    // 只在视频详情页执行
    if (!window.location.pathname.startsWith('/v/')) {
        return;
    }

    // 尝试多种方式获取视频ID
    let videoId: string | undefined;

    // 方法1: 从页面标题中获取 (新的页面结构)
    const titleElement = document.querySelector<HTMLElement>('h2.title.is-4 strong:first-child');
    if (titleElement) {
        videoId = titleElement.textContent?.trim();
    }

    // 方法2: 从panel-block中获取 (旧的页面结构)
    if (!videoId) {
        const panelBlock = document.querySelector<HTMLElement>(SELECTORS.VIDEO_DETAIL_ID);
        if (panelBlock) {
            const fullIdText = panelBlock.querySelector<HTMLElement>('.title.is-4');
            if (fullIdText) {
                videoId = fullIdText.textContent?.trim();
            }
        }
    }

    // 方法3: 从URL中提取
    if (!videoId) {
        const urlMatch = window.location.pathname.match(/\/v\/([^\/]+)/);
        if (urlMatch) {
            videoId = urlMatch[1].toUpperCase();
        }
    }

    if (!videoId) {
        return;
    }

    const record = STATE.records[videoId];
    const isRecorded = !!record;

    // 更新favicon（只在需要时）
    updateFaviconForStatus(isRecorded);

    // 更新页面标题（只在需要时）
    if (isRecorded) {
        updatePageTitleWithStatus(videoId, record.status);
    } else {
        // 如果没有记录，确保标题没有状态标记
        if (currentTitleStatus !== null) {
            const currentTitle = document.title;
            if (currentTitle.includes('[已观看]') || currentTitle.includes('[我想看]') || currentTitle.includes('[已浏览]')) {
                const cleanTitle = currentTitle.replace(/ \[.*?\]$/, '');
                if (cleanTitle !== currentTitle) {
                    log(`Removing status from title: "${currentTitle}" -> "${cleanTitle}"`);
                    document.title = cleanTitle;
                    currentTitleStatus = null;
                }
            }
        }
    }
}

function updateFaviconForStatus(isRecorded: boolean): void {
    const targetState = isRecorded ? 'extension' : 'original';

    // 如果状态没有改变，跳过设置
    if (currentFaviconState === targetState) {
        return;
    }

    if (isRecorded) {
        // 使用扩展的图标作为已记录状态的favicon
        const extensionIconUrl = chrome.runtime.getURL("assets/jav.png");
        log(`Setting favicon to extension icon: ${extensionIconUrl}`);
        setFavicon(extensionIconUrl);
        currentFaviconState = 'extension';
    } else {
        // 恢复原始favicon
        if (STATE.originalFaviconUrl) {
            log(`Restoring original favicon: ${STATE.originalFaviconUrl}`);
            setFavicon(STATE.originalFaviconUrl);
            currentFaviconState = 'original';
        } else {
            log('No original favicon URL to restore');
        }
    }
}

function updatePageTitleWithStatus(_videoId: string, status: string): void {
    // 如果状态没有改变，跳过设置
    if (currentTitleStatus === status) {
        return;
    }

    const originalTitle = document.title.replace(/ \[.*?\]$/, ''); // 移除之前的状态标记
    let statusText = '';

    switch (status) {
        case VIDEO_STATUS.VIEWED:
            statusText = '[已观看]';
            break;
        case VIDEO_STATUS.WANT:
            statusText = '[我想看]';
            break;
        case VIDEO_STATUS.BROWSED:
            statusText = '[已浏览]';
            break;
    }

    if (statusText) {
        const newTitle = `${originalTitle} ${statusText}`;
        log(`Updating page title from "${document.title}" to "${newTitle}"`);
        document.title = newTitle;
        currentTitleStatus = status;

        // 确保标题真的被设置了
        setTimeout(() => {
            if (document.title !== newTitle) {
                log(`Title not set correctly, retrying...`);
                document.title = newTitle;
            }
        }, 100);
    }
}

// --- Utils ---

function setFavicon(url: string): void {
    // 移除所有现有的favicon链接
    document.querySelectorAll('link[rel*="icon"]').forEach(link => link.remove());

    // 创建新的favicon链接
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = url.endsWith('.png') ? 'image/png' : 'image/x-icon';
    link.href = url + '?t=' + Date.now(); // 添加时间戳防止缓存

    // 添加到head
    document.head.appendChild(link);

    // 强制刷新favicon（Chrome特定的hack）
    const oldLink = document.createElement('link');
    oldLink.rel = 'icon';
    oldLink.href = 'data:image/x-icon;base64,';
    document.head.appendChild(oldLink);

    setTimeout(() => {
        oldLink.remove();
    }, 100);

    log(`Favicon set to: ${url}`);
}

function getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// --- Export Feature ---

let isExporting = false;
let exportButton: HTMLButtonElement | null;
let stopButton: HTMLButtonElement | null;

function initExportFeature(): void {
    const validUrlPatterns = [
      /https:\/\/javdb\.com\/users\/want_watch_videos.*/,
      /https:\/\/javdb\.com\/users\/watched_videos.*/,
      /https:\/\/javdb\.com\/users\/list_detail.*/,
      /https:\/\/javdb\.com\/lists.*/
    ];

    if (validUrlPatterns.some(pattern => pattern.test(window.location.href))) {
        createExportUI();
    }
}

function createExportUI(): void {
    const maxPageInput = document.createElement('input');
    maxPageInput.type = 'number';
    maxPageInput.id = 'maxPageInput';
    maxPageInput.placeholder = '页数(空则全部)';
    maxPageInput.className = 'input is-small';
    maxPageInput.style.width = '120px';
    maxPageInput.style.marginRight = '8px';

    exportButton = document.createElement('button');
    exportButton.textContent = '导出页面数据';
    exportButton.className = 'button is-small is-primary';
    exportButton.addEventListener('click', startExport);

    stopButton = document.createElement('button');
    stopButton.textContent = '停止';
    stopButton.className = 'button is-small is-danger';
    stopButton.style.marginLeft = '8px';
    stopButton.disabled = true;
    stopButton.addEventListener('click', stopExport);

    const container = document.createElement('div');
    container.className = 'level-item';
    container.appendChild(maxPageInput);
    container.appendChild(exportButton);
    container.appendChild(stopButton);
    
    const target = document.querySelector<HTMLElement>(SELECTORS.EXPORT_TOOLBAR);
    if (target) {
        target.appendChild(container);
    }
}

async function startExport(): Promise<void> {
    const maxPageInput = document.getElementById('maxPageInput') as HTMLInputElement | null;
    const totalCount = getTotalVideoCount();
    const maxPages = Math.ceil(totalCount / 20);
    const pagesToExport = maxPageInput?.value ? parseInt(maxPageInput.value) : maxPages;
    const currentPage = new URLSearchParams(window.location.search).get('page') || '1';
    
    isExporting = true;
    if (exportButton) exportButton.disabled = true;
    if (stopButton) stopButton.disabled = false;
    
    let allVideos: {id: string, title: string}[] = [];
    
    for (let i = 0; i < pagesToExport; i++) {
        if (!isExporting) break;
        
        const pageNum = parseInt(currentPage) + i;
        if (pageNum > maxPages) break;
        
        if (exportButton) exportButton.textContent = `导出中... ${pageNum}/${maxPages}`;
        
        if (i > 0) {
            const url = new URL(window.location.href);
            url.searchParams.set('page', String(pageNum));
            window.location.href = url.href;
            await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        }
        
        allVideos = allVideos.concat(scrapeVideosFromPage());
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (allVideos.length > 0) {
        downloadExportedData(allVideos);
    }
    
    finishExport();
}

function scrapeVideosFromPage(): {id: string, title: string}[] {
    return Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.MOVIE_LIST_ITEM)).map(item => {
        const idElement = item.querySelector<HTMLElement>(SELECTORS.VIDEO_ID);
        const titleElement = item.querySelector<HTMLElement>(SELECTORS.VIDEO_TITLE);
        return {
            id: idElement?.textContent?.trim() || '',
            title: titleElement?.textContent?.trim() || ''
        };
    });
}

function downloadExportedData(data: any[]): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `javdb-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getTotalVideoCount(): number {
    const activeLink = document.querySelector<HTMLAnchorElement>('a.is-active');
    if (activeLink) {
        const match = activeLink.textContent?.match(/\((\d+)\)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
}

function stopExport(): void {
    isExporting = false;
    finishExport();
}

function finishExport(): void {
    isExporting = false;
    if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = '导出页面数据';
    }
    if (stopButton) {
        stopButton.disabled = true;
    }
}

// --- Entry Point ---

// 防止重复初始化
let isInitialized = false;

// 跟踪当前状态，避免重复设置
let currentFaviconState: 'original' | 'extension' | null = null;
let currentTitleStatus: string | null = null;

export function onExecute() {
    if (isInitialized) {
        log('Extension already initialized, skipping...');
        return;
    }
    isInitialized = true;
    initialize().catch(err => console.error('[JavDB Ext] Initialization failed:', err));
}

// 立即执行初始化
onExecute();
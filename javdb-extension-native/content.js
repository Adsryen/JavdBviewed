// content.js
// 注入到 javdb.com 页面，负责页面 DOM 操作、UI 注入、状态标记等
import { getValue, setValue, getSettings } from './storage.js';
import { sleep } from './utils.js';
import { VIDEO_STATUS } from './config.js';

const STATE = {
    settings: {},
    records: {}, // Unified records object
    isSearchPage: false,
    observer: null,
    debounceTimer: null,
    originalFaviconUrl: ''
};

const SELECTORS = {
    MOVIE_LIST_ITEM: '.movie-list .item',
    VIDEO_TITLE: 'div.video-title > strong',
    VIDEO_ID: '.uid, .item-id > strong',
    TAGS_CONTAINER: '.tags.has-addons',
    FAVICON: "link[rel~='icon']",
    VIDEO_DETAIL_ID: '.panel-block.first-block',
    SEARCH_RESULT_PAGE: '.container .column.is-9',
    EXPORT_TOOLBAR: '.toolbar, .breadcrumb ul'
};

const log = (...args) => console.log('[JavDB Ext]', ...args);

// --- Core Logic ---

async function initialize() {
    log('Extension initializing...');

    // 1. Fetch all necessary data and settings at once
    const [settings, records] = await Promise.all([
        getSettings(),
        getValue('viewed', {})
    ]);
    STATE.settings = settings;
    STATE.records = records;
    log(`Loaded ${Object.keys(STATE.records).length} records.`);

    // 2. Check page context
    STATE.isSearchPage = !!document.querySelector(SELECTORS.SEARCH_RESULT_PAGE);
    if (STATE.isSearchPage) {
        log('Search page detected, hiding functions will be disabled.');
    }

    // 3. Store original favicon
    const faviconLink = document.querySelector(SELECTORS.FAVICON);
    if (faviconLink) {
        STATE.originalFaviconUrl = faviconLink.href;
    }

    // 4. Initial processing of visible items
    processVisibleItems();

    // 5. Setup MutationObserver to handle dynamic content
    setupObserver();

    // 6. Handle specific page logic
    if (window.location.pathname.startsWith('/v/')) {
        handleVideoDetailPage();
    }
    
    // 7. Initialize export functionality on relevant pages
    initExportFeature();
}


function processVisibleItems() {
    document.querySelectorAll(SELECTORS.MOVIE_LIST_ITEM).forEach(item => processItem(item));
}

function setupObserver() {
    const targetNode = document.querySelector('.movie-list');
    if (!targetNode) return;

    STATE.observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                clearTimeout(STATE.debounceTimer);
                STATE.debounceTimer = setTimeout(processVisibleItems, 300);
            }
        });
    });

    STATE.observer.observe(targetNode, { childList: true, subtree: true });
}

function shouldHide(videoId) {
    if (STATE.isSearchPage) return false;
    
    const { hideViewed, hideBrowsed, hideVR } = STATE.settings.display;
    const record = STATE.records[videoId];

    if (!record && !hideVR) return false; // No reason to hide if no record and not hiding VR

    const isViewed = record && record.status === VIDEO_STATUS.VIEWED;
    const isBrowsed = record && record.status === VIDEO_STATUS.BROWSED;
    
    // VR hiding logic needs to be based on item content, so we pass the item to shouldHide
    // This part is a placeholder for a better implementation within processItem
    // const isVR = item.querySelector('.tag.is-link')?.textContent.trim() === 'VR';
    
    if (hideViewed && isViewed) return true;
    if (hideBrowsed && isBrowsed) return true;
    // if (hideVR && isVR) return true; // VR logic handled in processItem
    
    return false;
}

function processItem(item) {
    const videoIdElement = item.querySelector(SELECTORS.VIDEO_ID);
    if (!videoIdElement) return;
    
    const videoId = videoIdElement.textContent.trim();
    if (!videoId) return;

    // Remove existing tags to avoid duplication
    item.querySelectorAll('.custom-status-tag').forEach(tag => tag.remove());

    const tagContainer = item.querySelector(SELECTORS.TAGS_CONTAINER);
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

    // VR hiding logic
    const isVR = item.querySelector('.tag.is-link')?.textContent.trim() === 'VR';
    if (STATE.settings.display.hideVR && isVR) {
        item.style.display = 'none';
        return;
    }
    
    if (shouldHide(videoId)) {
        item.style.display = 'none';
    }
}

function addTag(container, text, style) {
    const tag = document.createElement('span');
    tag.className = `tag ${style} is-light custom-status-tag`;
    tag.textContent = text;
    container.appendChild(tag);
}

// --- Page-Specific Logic ---

async function handleVideoDetailPage() {
    // Extract video ID from the panel, as it's more reliable
    const panelBlock = document.querySelector(SELECTORS.VIDEO_DETAIL_ID);
    if (!panelBlock) return;

    const idElement = panelBlock.querySelector('a[href*="/video_codes/"]');
    if (!idElement) return;

    const videoId = idElement.textContent + panelBlock.textContent.match(/-(\d+)/)?.[0];
    if (!videoId) return;

    const record = STATE.records[videoId];

    if (record) {
        setFavicon(chrome.runtime.getURL("icons/jav.png"));
    } else {
        // If no record exists, mark it as browsed after a delay
        setTimeout(async () => {
            const currentRecords = await getValue('viewed', {});
            if (!currentRecords[videoId]) {
                currentRecords[videoId] = {
                    id: videoId,
                    title: document.title, // A more meaningful title
                    status: VIDEO_STATUS.BROWSED,
                    timestamp: Date.now()
                };
                await setValue('viewed', currentRecords);
                log(`${videoId} added to history as 'browsed'.`);
                setFavicon(chrome.runtime.getURL("icons/jav.png"));
            }
        }, getRandomDelay(3000, 5000));
    }
}

// --- Utils ---

function setFavicon(url) {
    let link = document.querySelector(SELECTORS.FAVICON);
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    if (url.endsWith('.png')) {
        link.type = 'image/png';
    }
    link.href = url;
}

function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


// --- Export Feature ---
// This part remains largely unchanged as it's a separate utility
// and doesn't depend heavily on the main settings.
// We'll just ensure it's initialized correctly.

let isExporting = false;
let exportButton, stopButton;

function initExportFeature() {
    const validUrlPatterns = [
      /https:\/\/javdb\.com\/users\/want_watch_videos.*/,
      /https:\/\/javdb\.com\/users\/watched_videos.*/,
      /https:\/\/javdb\.com\/users\/list_detail.*/,
      /https:\/\/javdb\.com\/lists.*/
    ];

    if (validUrlPatterns.some(pattern => pattern.test(window.location.href))) {
        createExportUI();
        checkExportState();
    }
}

function createExportUI() {
    // ... (The implementation of createExportButton from the original script)
    // For brevity, assuming the UI creation code is here.
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
    
    const target = document.querySelector(SELECTORS.EXPORT_TOOLBAR);
    if (target) {
        target.appendChild(container);
    }
}

async function startExport() {
    const maxPageInput = document.getElementById('maxPageInput');
    const totalCount = getTotalVideoCount();
    const maxPages = Math.ceil(totalCount / 20); // Assuming 20 items per page
    const pagesToExport = maxPageInput.value ? parseInt(maxPageInput.value) : maxPages;
    const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
    
    isExporting = true;
    exportButton.disabled = true;
    stopButton.disabled = false;
    
    let allVideos = [];
    
    for (let i = 0; i < pagesToExport; i++) {
        if (!isExporting) break;
        
        const pageNum = parseInt(currentPage) + i;
        if (pageNum > maxPages) break;
        
        exportButton.textContent = `导出中... ${pageNum}/${maxPages}`;
        
        if (i > 0) { // Navigate to next page if not the first page
            const url = new URL(window.location.href);
            url.searchParams.set('page', pageNum);
            window.location.href = url.href;
            await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        }
        
        allVideos = allVideos.concat(scrapeVideosFromPage());
        await sleep(1000); // Pause between pages
    }
    
    if (allVideos.length > 0) {
        downloadExportedData(allVideos);
    }
    
    finishExport();
}

function scrapeVideosFromPage() {
    return Array.from(document.querySelectorAll(SELECTORS.MOVIE_LIST_ITEM)).map(item => {
        const idElement = item.querySelector(SELECTORS.VIDEO_ID);
        const titleElement = item.querySelector(SELECTORS.VIDEO_TITLE);
        return {
            id: idElement ? idElement.textContent.trim() : '',
            title: titleElement ? titleElement.textContent.trim() : ''
        };
    });
}

function downloadExportedData(data) {
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

function getTotalVideoCount() {
    const activeLink = document.querySelector('a.is-active');
    if (activeLink) {
        const match = activeLink.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
}


function stopExport() {
    isExporting = false;
    finishExport();
}

function finishExport() {
    isExporting = false;
    exportButton.disabled = false;
    stopButton.disabled = true;
    exportButton.textContent = '导出页面数据';
}


async function checkExportState() {
    // This function can be simplified or removed if we don't need to persist export state across page loads.
    // For now, we will rely on manual start/stop.
}


// --- Entry Point ---
initialize().catch(err => console.error('[JavDB Ext] Initialization failed:', err)); 
// src/content/content.ts

import { getSettings, getValue, setValue } from '../utils/storage';
import { VIDEO_STATUS } from '../utils/config';
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
    SEARCH_RESULT_PAGE: '.container .column.is-9',
    EXPORT_TOOLBAR: '.toolbar, .breadcrumb ul',
};

const log = (...args: any[]) => console.log('[JavDB Ext]', ...args);

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
    }

    processVisibleItems();
    setupObserver();

    if (window.location.pathname.startsWith('/v/')) {
        await handleVideoDetailPage();
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
    const panelBlock = document.querySelector<HTMLElement>(SELECTORS.VIDEO_DETAIL_ID);
    if (!panelBlock) return;

    const idElement = panelBlock.querySelector<HTMLAnchorElement>('a[href*="/video_codes/"]');
    if (!idElement) return;

    const videoIdMatch = panelBlock.textContent?.match(/-(\d+)/);
    const videoId = idElement.textContent + (videoIdMatch ? videoIdMatch[0] : '');
    if (!videoId) return;

    const record = STATE.records[videoId];

    if (record) {
        setFavicon(chrome.runtime.getURL("icons/jav.png"));
    } else {
        setTimeout(async () => {
            const currentRecords = await getValue<Record<string, VideoRecord>>('viewed', {});
            if (!currentRecords[videoId]) {
                currentRecords[videoId] = {
                    id: videoId,
                    title: document.title,
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

function setFavicon(url: string): void {
    let link = document.querySelector<HTMLLinkElement>(SELECTORS.FAVICON);
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
initialize().catch(err => console.error('[JavDB Ext] Initialization failed:', err)); 
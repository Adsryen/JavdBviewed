// src/content/index.ts

import { getSettings, getValue } from '../utils/storage';
import type { VideoRecord } from '../types';
import { STATE, SELECTORS, log } from './state';
import { processVisibleItems, setupObserver } from './itemProcessor';
import { handleVideoDetailPage } from './videoDetail';
import { checkAndUpdateVideoStatus } from './statusManager';
import { initExportFeature } from './export';
import { concurrencyMonitor, storageManager } from './concurrency';
import { testConcurrentOperations, testHighConcurrency } from './concurrencyTest';

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
    log('Display settings:', STATE.settings.display);

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

// --- Entry Point ---

// 防止重复初始化
let isInitialized = false;

export function onExecute() {
    if (isInitialized) {
        log('Extension already initialized, skipping...');
        return;
    }
    isInitialized = true;
    initialize().catch(err => console.error('[JavDB Ext] Initialization failed:', err));
}

// 监听来自popup或dashboard的设置更新消息
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'settings-updated') {
        log('Settings updated, reloading settings and reprocessing items');
        // 重新加载设置并重新处理页面项目
        getSettings().then(settings => {
            STATE.settings = settings;
            log('Updated display settings:', STATE.settings.display);
            processVisibleItems();
        });
    }
});

// 立即执行初始化
onExecute();

// 在开发环境中暴露测试和监控功能到全局
if (typeof window !== 'undefined') {
    // 直接使用已导入的模块，避免动态导入的404错误
    (window as any).concurrencyMonitor = concurrencyMonitor;
    (window as any).storageManager = storageManager;
    (window as any).testConcurrency = {
        basic: testConcurrentOperations,
        high: testHighConcurrency
    };

    log('Successfully exposed concurrency tools to window object');
}

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
import { initDrive115Features } from './drive115';
import { globalCache } from '../utils/cache';
import { defaultDataAggregator } from '../services/dataAggregator';
import { quickCopyManager } from './quickCopy';
import { getValue, setValue } from '../utils/storage';
import { contentFilterManager } from './contentFilter';
import { keyboardShortcutsManager } from './keyboardShortcuts';
import { magnetSearchManager } from './magnetSearch';
import { anchorOptimizationManager } from './anchorOptimization';
import { showToast } from './toast';
import { initializeContentPrivacy } from './privacy';
import { listEnhancementManager } from './enhancements/listEnhancement';

// --- Utility Functions ---

/**
 * 移除不需要的按钮（官方App和Telegram频道）
 */
function removeUnwantedButtons(): void {
    // 等待页面加载完成后移除按钮
    setTimeout(() => {
        try {
            // 查找并移除官方App按钮和Telegram按钮
            const appButtons = document.querySelectorAll('a[href*="app.javdb"], a[href*="t.me/javdbnews"]');
            appButtons.forEach(button => {
                if (button.textContent?.includes('官方App') ||
                    button.textContent?.includes('JavDB公告') ||
                    button.textContent?.includes('Telegram')) {
                    log(`Removing unwanted button: ${button.textContent}`);
                    button.remove();
                }
            });

            // 也可以通过CSS隐藏这些按钮
            const style = document.createElement('style');
            style.textContent = `
                a[href*="app.javdb"]:not([href*="javdb.com"]),
                a[href*="t.me/javdbnews"] {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);

            log('Unwanted buttons removal completed');
        } catch (error) {
            log('Error removing unwanted buttons:', error);
        }
    }, 1000);
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
    log('Display settings:', STATE.settings.display);

    // 初始化缓存系统
    if (settings.dataEnhancement.enableImageCache) {
        log('Cache system initialized');
        // 启动缓存清理
        globalCache.cleanup().catch(err => log('Cache cleanup error:', err));
    }

    // 初始化数据聚合器
    if (settings.dataEnhancement.enableMultiSource) {
        log('Data aggregator initialized');
        defaultDataAggregator.updateConfig({
            enableCache: settings.dataEnhancement.enableImageCache,
            cacheExpiration: settings.dataEnhancement.cacheExpiration,
            sources: {
                blogJav: {
                    enabled: settings.dataEnhancement.enableMultiSource,
                    baseUrl: 'https://blogjav.net',
                    timeout: 10000,
                },
                translator: {
                    enabled: settings.dataEnhancement.enableTranslation && settings.translation?.provider === 'traditional',
                    service: settings.translation?.traditional?.service || 'google',
                    apiKey: settings.translation?.traditional?.apiKey,
                    timeout: 5000,
                    sourceLanguage: settings.translation?.traditional?.sourceLanguage || 'ja',
                    targetLanguage: settings.translation?.traditional?.targetLanguage || 'zh-CN',
                },
                javLibrary: {
                    enabled: settings.dataEnhancement.enableRatingAggregation || settings.dataEnhancement.enableActorInfo,
                    baseUrl: 'https://www.javlibrary.com',
                    timeout: 15000,
                    language: 'en',
                },
                javStore: { enabled: false, baseUrl: '', timeout: 10000 },
                javSpyl: { enabled: false, baseUrl: '', timeout: 10000 },
                dmm: { enabled: false, baseUrl: '', timeout: 10000 },
                fc2: { enabled: false, baseUrl: '', timeout: 10000 },
            },
        });

        // 配置AI翻译服务
        if (settings.dataEnhancement.enableTranslation && settings.translation?.provider === 'ai') {
            defaultDataAggregator.updateAITranslatorConfig({
                enabled: true,
                useGlobalModel: settings.translation.ai?.useGlobalModel !== false,
                customModel: settings.translation.ai?.customModel,
                timeout: 30000,
                maxRetries: 2,
                sourceLanguage: 'ja',
                targetLanguage: 'zh-CN',
            });
        }
    }

    // 初始化用户体验优化功能
    if (settings.userExperience.enableQuickCopy) {
        log('Quick copy manager initialized');
        quickCopyManager.updateConfig({
            enabled: true,
            showButtons: true,
            showTooltips: settings.userExperience.showEnhancedTooltips,
            enableKeyboardShortcuts: settings.userExperience.enableKeyboardShortcuts,
            items: ['video-id', 'title', 'url', 'magnet', 'actor'],
        });
        quickCopyManager.initialize();
    }

    if (settings.userExperience.enableContentFilter) {
        const keywordRules = settings.contentFilter?.keywordRules || [];
        log(`Keyword filter manager initialized with ${keywordRules.length} rules`);
        if (keywordRules.length > 0) {
            log('Keyword rules:', keywordRules.map(r => `${r.name}: ${r.keyword} (${r.action})`));
        }
        contentFilterManager.updateConfig({
            enabled: true,
            showFilteredCount: true,
            keywordRules: keywordRules,
        });
        // 注意：不在这里立即初始化，而是在默认隐藏功能处理完后再初始化
    }

    if (settings.userExperience.enableKeyboardShortcuts) {
        log('Keyboard shortcuts manager initialized');
        keyboardShortcutsManager.updateConfig({
            enabled: true,
            showHelp: true,
            enableGlobalShortcuts: true,
            enablePageSpecificShortcuts: true,
        });
        keyboardShortcutsManager.initialize();
    }

    // 移除官方App和Telegram按钮
    removeUnwantedButtons();

    if (settings.userExperience.enableMagnetSearch) {
        log('Magnet search manager initialized');

        // 从设置中获取磁力搜索源配置
        const magnetSearchConfig = settings.magnetSearch || {};
        const sources = magnetSearchConfig.sources || {};

        magnetSearchManager.updateConfig({
            enabled: true,
            showInlineResults: true,
            showFloatingButton: true,
            autoSearch: true, // 启用自动搜索
            sources: {
                sukebei: sources.sukebei !== false, // 默认启用
                btdig: sources.btdig !== false, // 默认启用
                btsow: sources.btsow !== false, // 默认启用
                torrentz2: sources.torrentz2 || false, // 默认禁用
                custom: [],
            },
            maxResults: 20,
        });
        magnetSearchManager.initialize();
    }

    if (settings.userExperience.enableAnchorOptimization) {
        log('Anchor optimization manager initialized');
        anchorOptimizationManager.updateConfig({
            enabled: true,
            showPreviewButton: settings.anchorOptimization?.showPreviewButton !== false,
            buttonPosition: settings.anchorOptimization?.buttonPosition || 'right-center',
            customButtons: [],
        });
        anchorOptimizationManager.initialize();
    }

    // 初始化列表增强功能
    if (settings.userExperience.enableListEnhancement !== false) {
        log('List enhancement manager initialized');
        listEnhancementManager.updateConfig({
            enabled: true,
            enableClickEnhancement: settings.listEnhancement?.enableClickEnhancement !== false,
            enableVideoPreview: settings.listEnhancement?.enableVideoPreview !== false,
            enableListOptimization: settings.listEnhancement?.enableListOptimization !== false,
            previewDelay: settings.listEnhancement?.previewDelay || 1000,
            previewVolume: settings.listEnhancement?.previewVolume || 0.2,
            enableRightClickBackground: settings.listEnhancement?.enableRightClickBackground !== false,
        });
        listEnhancementManager.initialize();
    }

    // 初始化隐私保护功能
    try {
        log('Privacy system initializing...');
        await initializeContentPrivacy();
        log('Privacy system initialized successfully');
    } catch (error) {
        log('Privacy system initialization failed:', error);
    }

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

    // 在默认隐藏功能处理完后，再初始化智能内容过滤
    if (settings.userExperience.enableContentFilter) {
        setTimeout(() => {
            contentFilterManager.initialize();
            log('Content filter initialized after default hide processing');
        }, 100); // 短暂延迟确保默认隐藏功能先执行
    }

    if (window.location.pathname.startsWith('/v/')) {
        await handleVideoDetailPage();

        // 初始状态检查
        setTimeout(() => {
            checkAndUpdateVideoStatus();
        }, 1000);

        // 初始化115功能
        setTimeout(() => {
            initDrive115Features();
        }, 1500);

        // 定期检查状态（每2秒）
        setInterval(checkAndUpdateVideoStatus, 2000);
    } else {
        // 在列表页也初始化115功能
        setTimeout(() => {
            initDrive115Features();
        }, 2000);
    }

    initExportFeature();
}

// --- Entry Point ---

// 防止重复初始化
let isInitialized = false;

export function onExecute() {
    if (isInitialized) {
        // 静默跳过重复初始化
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

            // 在默认隐藏功能处理完后，重新应用智能过滤
            if (settings.userExperience.enableContentFilter) {
                setTimeout(() => {
                    contentFilterManager.applyFilters();
                    log('Content filter reapplied after settings update');
                }, 100);
            }
        });
    } else if (message.type === 'show-toast') {
        // 处理来自background script的toast通知
        log('Received toast message:', message.message, message.toastType);
        try {
            showToast(message.message, message.toastType || 'info');
        } catch (err) {
            console.error('[JavDB Ext] Failed to show toast:', err);
        }
    } else if (message.type === 'UPDATE_CONTENT_FILTER') {
        // 更新内容过滤规则
        if (message.keywordRules) {
            // 先重新处理默认隐藏功能，然后再更新智能过滤
            processVisibleItems();
            setTimeout(() => {
                contentFilterManager.updateKeywordRules(message.keywordRules);
                log(`Content filter rules updated: ${message.keywordRules.length} rules`);
            }, 100);
        }
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

// === 音量控制功能 - 基于验证成功的调试脚本 ===
let currentVolume = 0.75; // 默认75%

async function initVolumeControl() {
    try {
        // 获取音量设置
        currentVolume = (await getValue('previewVideoVolume', 75)) / 100;
        log(`🎵 Volume control init: ${Math.round(currentVolume * 100)}%`);

        // 监听popup消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'volume-changed') {
                currentVolume = message.volume;
                log(`🎚️ Volume updated: ${Math.round(currentVolume * 100)}%`);
                applyVolumeToAllVideos();
                sendResponse({ success: true });
            }
        });

        // 监听点击事件 - 使用与调试脚本相同的逻辑
        document.addEventListener('click', (e) => {
            const target = e.target as Element;
            const link = target.closest('a[data-fancybox], a[href*="preview-video"]');

            if (link) {
                log('🎬 Preview clicked!');

                // 使用调试脚本验证成功的延迟策略
                setTimeout(() => handleVideos(), 500);
                setTimeout(() => handleVideos(), 1000);
                setTimeout(() => handleVideos(), 2000);
            }
        });

        log(`✅ Volume control ready`);

    } catch (error) {
        log(`❌ Volume control failed:`, error);
    }
}

function handleVideos() {
    const videos = document.querySelectorAll('video');
    log(`📹 Found ${videos.length} videos`);

    videos.forEach((video, index) => {
        const v = video as HTMLVideoElement;
        const style = getComputedStyle(v);

        log(`Video ${index + 1}: id=${v.id}, display=${style.display}, muted=${v.muted}, volume=${v.volume}`);

        // 如果是预览视频且可见，应用音量控制
        if (isPreviewVideo(v) && style.display !== 'none') {
            applyVolume(v);
        }
    });
}

function isPreviewVideo(video: HTMLVideoElement): boolean {
    return video.id === 'preview-video' ||
           video.className.includes('fancybox-video');
}

function applyVolume(video: HTMLVideoElement) {
    log(`🔧 Applying volume ${Math.round(currentVolume * 100)}% to: ${video.id}`);

    try {
        log(`  Before: muted=${video.muted}, volume=${video.volume}`);

        // 直接设置，就像手动测试一样
        video.muted = false;
        video.volume = currentVolume;

        log(`  After: muted=${video.muted}, volume=${video.volume}`);

        // 添加视觉指示器
        addVolumeIndicator(video);

    } catch (error) {
        log(`❌ Apply volume error:`, error);
    }
}

function applyVolumeToAllVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        const v = video as HTMLVideoElement;
        if (isPreviewVideo(v)) {
            applyVolume(v);
        }
    });
}

function addVolumeIndicator(video: HTMLVideoElement) {
    try {
        const container = video.parentElement;
        if (!container) return;

        // 移除已存在的指示器
        const existing = container.querySelector('.volume-indicator');
        if (existing) existing.remove();

        // 创建指示器
        const indicator = document.createElement('div');
        indicator.className = 'volume-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        indicator.textContent = `🔊 ${Math.round(currentVolume * 100)}%`;

        // 确保容器有相对定位
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        container.appendChild(indicator);

        // 显示动画
        setTimeout(() => indicator.style.opacity = '1', 100);

        // 3秒后隐藏
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) indicator.remove();
            }, 300);
        }, 3000);

    } catch (error) {
        log(`❌ Add indicator error:`, error);
    }
}

// 初始化音量控制
initVolumeControl();

// 暴露到全局以便调试
if (typeof window !== 'undefined') {
    (window as any).javdbVolumeControl = {
        checkVideos: () => {
            const videos = document.querySelectorAll('video');
            console.log(`Found ${videos.length} videos:`, videos);
            return videos;
        },
        forceApply: (volume = 0.75) => {
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                video.muted = false;
                video.volume = volume;
                console.log(`Applied volume ${volume} to video:`, video);
            });
        },
        getCurrentVolume: () => currentVolume,
        handleVideos: handleVideos
    };
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    try {
        // 清理内容过滤器
        if (contentFilterManager) {
            contentFilterManager.destroy();
        }

        // 清理快捷复制管理器
        if (quickCopyManager) {
            quickCopyManager.destroy?.();
        }

        // 清理键盘快捷键管理器
        if (keyboardShortcutsManager) {
            keyboardShortcutsManager.destroy?.();
        }

        log('Resources cleaned up on page unload');
    } catch (error) {
        log('Error during cleanup:', error);
    }
});

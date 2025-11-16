// src/content/index.ts

import { getSettings, getValue } from '../utils/storage';
import type { VideoRecord } from '../types';
import { STATE, SELECTORS, log, currentFaviconState, currentTitleStatus } from './state';
import { processVisibleItems, setupObserver } from './itemProcessor';
import { handleVideoDetailPage } from './videoDetail';
import { checkAndUpdateVideoStatus } from './statusManager';
import { initExportFeature } from './export';
import { initDrive115Features } from './drive115';
import { globalCache } from '../utils/cache';
import { defaultDataAggregator } from '../services/dataAggregator';
import { quickCopyManager } from './quickCopy';
import { contentFilterManager } from './contentFilter';
import { keyboardShortcutsManager } from './keyboardShortcuts';
import { magnetSearchManager } from './magnetSearch';
import { anchorOptimizationManager } from './anchorOptimization';
import { showToast } from './toast';
import { initializeContentPrivacy } from './privacy';
import { listEnhancementManager } from './enhancements/listEnhancement';
import { actorEnhancementManager } from './enhancements/actorEnhancement';
import { embyEnhancementManager } from './embyEnhancement';
import { initOrchestrator } from './initOrchestrator';
import { initInsightsCollector } from './insightsCollector';
import { installConsoleProxy } from '../utils/consoleProxy';
import { performanceOptimizer } from './performanceOptimizer';

// 预览音量的模块级状态（避免 ReferenceError: currentVolume is not defined）
let currentVolume: number = 0.2;

// 安装统一控制台代理（仅影响扩展自身，默认DEBUG，上海时区，显示来源+颜色）
installConsoleProxy({
    level: 'DEBUG',
    format: { showTimestamp: true, timestampStyle: 'hms', timeZone: 'Asia/Shanghai', showSource: true, color: true },
    categories: {
        general: { enabled: true, match: () => true, label: 'CS', color: '#27ae60' },
    },
});

// 从设置应用控制台显示配置到代理
async function applyConsoleSettingsFromStorage_CS() {
    try {
        const settings = await getSettings();
        const logging: any = settings.logging || {};
        const ctrl: any = (window as any).__JDB_CONSOLE__;
        if (!ctrl) return;
        if (logging.consoleLevel) ctrl.setLevel(logging.consoleLevel);
        if (logging.consoleFormat) {
            ctrl.setFormat({
                showTimestamp: logging.consoleFormat.showTimestamp ?? true,
                showSource: logging.consoleFormat.showSource ?? true,
                color: logging.consoleFormat.color ?? true,
                timeZone: logging.consoleFormat.timeZone || 'Asia/Shanghai',
            });
        }
        if (logging.consoleCategories) {
            const cfg = ctrl.getConfig();
            const allKeys = Object.keys(cfg?.categories || {});
            for (const key of allKeys) {
                const flag = logging.consoleCategories[key];
                if (flag === false) ctrl.disable(key);
                else if (flag === true) ctrl.enable(key);
            }
        }
    } catch (e) {
        console.warn('[ConsoleProxy] Failed to apply settings in CS:', e);
    }
}

applyConsoleSettingsFromStorage_CS();

try {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes['settings']) {
            applyConsoleSettingsFromStorage_CS();
        }
    });
} catch {}

// --- Utility Functions ---

/**
 * 移除不需要的按钮（官方App和Telegram频道）
 */
function removeUnwantedButtons(): void {
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
}

// --- Core Logic ---

async function initialize(): Promise<void> {
    log('Extension initializing...');

    // 首先初始化性能优化器
    performanceOptimizer.initialize();

    const [settings, records] = await Promise.all([
        getSettings(),
        getValue<Record<string, VideoRecord>>('viewed', {}),
    ]);
    STATE.settings = settings;
    STATE.records = records;
    log(`Loaded ${Object.keys(STATE.records).length} records.`);
    log('Display settings:', STATE.settings.display);

    // 提前保存原始 favicon，供后续状态切换使用（优先级最高的 UI 反馈）
    const earlyFaviconLink = document.querySelector<HTMLLinkElement>(SELECTORS.FAVICON);
    if (earlyFaviconLink) {
        STATE.originalFaviconUrl = earlyFaviconLink.href;
        log(`Original favicon URL saved (early): ${STATE.originalFaviconUrl}`);
    } else {
        log('No favicon link found (early)');
    }

    // 若为影片详情页，优先执行：识别/回写 + 立即更新网页 icon（不再等待 1s 延迟）
    if (window.location.pathname.startsWith('/v/')) {
        await handleVideoDetailPage();
        // 立刻检查并更新状态（包括 favicon 与标题）
        checkAndUpdateVideoStatus();
        // 定期复查以应对动态变动（从 2s 调整为 5s），并在稳定后停止
        let lastStatusSignature = '';
        let stableCount = 0;
        const statusIntervalId = setInterval(() => {
            try {
                checkAndUpdateVideoStatus();
                // 通过标题 + favicon 状态组合判断是否稳定
                const signature = `${document.title}|${currentFaviconState ?? 'null'}|${currentTitleStatus ?? 'null'}`;
                if (signature === lastStatusSignature && signature.includes('null') === false) {
                    stableCount++;
                } else {
                    stableCount = 0;
                    lastStatusSignature = signature;
                }
                // 连续稳定 3 次（约 15 秒）后停止轮询
                if (stableCount >= 3) {
                    clearInterval(statusIntervalId);
                    log('Status appears stable. Stopping status polling.');
                }
            } catch (e) {
                // 安全兜底：异常不影响后续执行
                log('Status polling error:', e);
            }
        }, 5000);
        // 初始化115功能：改由编排器延时调度，保持原 1500ms 行为
        initOrchestrator.add('high', () => initDrive115Features(), { label: 'drive115:init:video', delayMs: 1500 });

        // 初始化观影标签采集器（仅影片详情页，延时以等待页面标签渲染）
        initOrchestrator.add('deferred', () => initInsightsCollector(), { label: 'insights:collector', delayMs: 1200 });
    }

    // 初始化缓存系统
    if (settings.dataEnhancement.enableImageCache) {
        log('Cache system initialized');
        // 启动缓存清理
        globalCache.cleanup().catch(err => log('Cache cleanup error:', err));
    }

    // 应用磁力搜索的并发与超时（来源于 settings.magnetSearch）
    const magnetCfg = (settings as any).magnetSearch || {};
    const pageMaxConcurrentRequests = (magnetCfg.concurrency?.pageMaxConcurrentRequests ?? 2) as number;
    const magnetRequestTimeout = (magnetCfg.timeoutMs ?? 6000) as number;
    performanceOptimizer.updateConfig({ maxConcurrentRequests: pageMaxConcurrentRequests, requestTimeout: magnetRequestTimeout });

    // 初始化/更新数据聚合器（无论是否启用多源，都严格按设置开启/关闭各来源，避免默认配置引发不必要的网络请求）
    log('Data aggregator configured according to settings');
    defaultDataAggregator.updateConfig({
        enableCache: settings.dataEnhancement.enableImageCache,
        cacheExpiration: settings.dataEnhancement.cacheExpiration,
        sources: {
            // 仅当启用了多源增强时才启用 BlogJav，且降低超时与重试，避免长时间阻塞
            blogJav: {
                enabled: settings.dataEnhancement.enableMultiSource === true,
                baseUrl: 'https://blogjav.net',
                timeout: 8000,
                maxRetries: 1,
            },
            // 仅当需要评分/演员信息时启用 JavLibrary，设置更保守的超时与重试
            javLibrary: {
                enabled: (settings.dataEnhancement.enableRatingAggregation === true) || (settings.dataEnhancement.enableActorInfo === true),
                baseUrl: 'https://www.javlibrary.com',
                timeout: 12000,
                maxRetries: 1,
                language: 'en',
            },
            // 传统翻译：当 provider=traditional 且全局翻译开启时启用（方案B：单一开关）
            translator: {
                enabled: (settings.translation?.provider === 'traditional') &&
                         (settings.dataEnhancement.enableTranslation === true),
                service: settings.translation?.traditional?.service || 'google',
                apiKey: settings.translation?.traditional?.apiKey,
                timeout: 5000,
                maxRetries: 1,
                sourceLanguage: settings.translation?.traditional?.sourceLanguage || 'ja',
                targetLanguage: settings.translation?.traditional?.targetLanguage || 'zh-CN',
            },
            // 其余数据源保持关闭
            javStore: { enabled: false, baseUrl: '', timeout: 10000 },
            javSpyl: { enabled: false, baseUrl: '', timeout: 10000 },
            dmm: { enabled: false, baseUrl: '', timeout: 10000 },
            fc2: { enabled: false, baseUrl: '', timeout: 10000 },
        },
    });

    // 无论是否启用多源，都根据翻译设置初始化 AI 翻译配置，确保定点翻译可用
    if (settings.dataEnhancement.enableTranslation && settings.translation?.provider === 'ai') {
        console.log('[JavDB Extension] Initializing AI translator with settings:', {
            enableTranslation: settings.dataEnhancement.enableTranslation,
            provider: settings.translation?.provider,
            aiEnabled: settings.ai?.enabled,
            selectedModel: settings.ai?.selectedModel
        });
        
        defaultDataAggregator.updateAITranslatorConfig({
            enabled: true,
            useGlobalModel: true, // 已写死使用 AI 设置中的模型
            timeout: 30000,
            maxRetries: 2,
            sourceLanguage: 'ja',
            targetLanguage: 'zh-CN',
        });
        
        console.log('[JavDB Extension] AI translator configuration updated');
    } else {
        console.log('[JavDB Extension] AI translator not initialized:', {
            enableTranslation: settings.dataEnhancement.enableTranslation,
            provider: settings.translation?.provider,
            reason: !settings.dataEnhancement.enableTranslation ? 'Translation disabled' : 'Provider not AI'
        });
    }

    // 页面类型判断
    const path = window.location.pathname;
    const isVideoPage = path.startsWith('/v/');
    const isActorPage = path.startsWith('/actors/');

    // 初始化用户体验优化功能（通过编排器注册到合适阶段）
    if (settings.userExperience.enableQuickCopy) {
        quickCopyManager.updateConfig({
            enabled: true,
            showButtons: true,
            showTooltips: settings.userExperience.showEnhancedTooltips,
            enableKeyboardShortcuts: settings.userExperience.enableKeyboardShortcuts,
            items: ['video-id', 'title', 'url', 'magnet', 'actor'],
        });
        initOrchestrator.add('high', () => quickCopyManager.initialize(), { label: 'ux:quickCopy:init' });
    }

    if (settings.userExperience.enableKeyboardShortcuts) {
        keyboardShortcutsManager.updateConfig({
            enabled: true,
            showHelp: true,
            enableGlobalShortcuts: true,
            enablePageSpecificShortcuts: true,
        });
        initOrchestrator.add('high', () => keyboardShortcutsManager.initialize(), { label: 'ux:shortcuts:init' });
    }

    // 隐私保护统一在 high 阶段 await（由 orchestrator.run() 处理）
    initOrchestrator.add('high', async () => {
        log('Privacy system initializing...');
        await initializeContentPrivacy();
        log('Privacy system initialized successfully');
    }, { label: 'privacy:init' });

    // 移除官方App和Telegram按钮（用 orchestrator 延时 1000ms 保持原体验）
    initOrchestrator.add('high', () => removeUnwantedButtons(), { label: 'ui:remove-unwanted', delayMs: 1000 });

    if (settings.userExperience.enableMagnetSearch) {
        // 改为 idle 阶段，确保最后执行（空闲 + 更长延迟）
        console.log('[JavDB Ext] Scheduling magnet search in idle phase (last)');
        initOrchestrator.add('idle', () => {
            try {
                log('Magnet search manager deferred initialization');
                const magnetSearchConfig = (settings as any).magnetSearch || {};
                const sources = magnetSearchConfig.sources || {};
                magnetSearchManager.updateConfig({
                    enabled: true,
                    showInlineResults: true,
                    showFloatingButton: true,
                    autoSearch: true,
                    sources: {
                        sukebei: sources.sukebei !== false,
                        btdig: sources.btdig !== false,
                        btsow: sources.btsow !== false,
                        torrentz2: sources.torrentz2 || false,
                        custom: [],
                    },
                    maxResults: 15, // 减少最大结果数
                    timeout: 6000, // 减少超时时间
                });
                magnetSearchManager.initialize();
            } catch (e) {
                log('Deferred magnet search initialization failed:', e);
            }
        }, { label: 'ux:magnet:autoSearch', idle: true, idleTimeout: 15000, delayMs: 8000 }); // 增加延迟时间
    }

    if (settings.userExperience.enableAnchorOptimization) {
        anchorOptimizationManager.updateConfig({
            enabled: true,
            showPreviewButton: settings.anchorOptimization?.showPreviewButton !== false,
            buttonPosition: settings.anchorOptimization?.buttonPosition || 'right-center',
            customButtons: [],
        });
        // 列表/演员页优先，影片页影响较小，归为 deferred
        initOrchestrator.add('deferred', () => anchorOptimizationManager.initialize(), { label: 'ux:anchorOptimization:init', idle: true, delayMs: 2000 });
    }

    // 初始化列表增强功能（列表/演员页常用）
    if (settings.userExperience.enableListEnhancement !== false) {
        listEnhancementManager.updateConfig({
            enabled: true,
            enableClickEnhancement: settings.listEnhancement?.enableClickEnhancement !== false,
            enableVideoPreview: settings.listEnhancement?.enableVideoPreview !== false,
            enableListOptimization: settings.listEnhancement?.enableListOptimization !== false,
            enableScrollPaging: settings.listEnhancement?.enableScrollPaging === true,
            previewDelay: settings.listEnhancement?.previewDelay || 1000,
            previewVolume: settings.listEnhancement?.previewVolume || 0.2,
            enableRightClickBackground: settings.listEnhancement?.enableRightClickBackground !== false,
            enableActorWatermark: settings.listEnhancement?.enableActorWatermark === true,
            actorWatermarkPosition: (settings.listEnhancement as any)?.actorWatermarkPosition || 'top-right',
            actorWatermarkOpacity: (typeof (settings.listEnhancement as any)?.actorWatermarkOpacity === 'number') ? (settings.listEnhancement as any).actorWatermarkOpacity : 0.8,
            // 新增：演员过滤
            hideBlacklistedActorsInList: (settings.listEnhancement as any)?.hideBlacklistedActorsInList === true,
            hideNonFavoritedActorsInList: (settings.listEnhancement as any)?.hideNonFavoritedActorsInList === true,
            treatSubscribedAsFavorited: (settings.listEnhancement as any)?.treatSubscribedAsFavorited !== false,
        });
        if (!isVideoPage) {
            initOrchestrator.add('high', () => listEnhancementManager.initialize(), { label: 'listEnhancement:init' });
            // 在列表增强注入完成后，二次处理列表，确保【隐藏VR】在首屏也稳定生效
            initOrchestrator.add('high', () => {
                try {
                    log('Reprocessing items after listEnhancement initialization');
                    processVisibleItems();
                } catch (e) {
                    log('Reprocess after listEnhancement failed:', e as any);
                }
            }, { label: 'list:reprocess:after-listEnhancement', delayMs: 500 });
        }
    }

    // 初始化演员页增强功能（仅演员页 critical）
    if (settings.actorEnhancement?.enabled !== false && isActorPage) {
        actorEnhancementManager.updateConfig({
            enabled: true,
            autoApplyTags: settings.actorEnhancement?.autoApplyTags !== false,
            defaultTags: settings.actorEnhancement?.defaultTags || ['s', 'd'],
            defaultSortType: settings.actorEnhancement?.defaultSortType || 0,
            // 新增：演员页“影片分段显示”配置
            enableTimeSegmentationDivider: (settings.actorEnhancement as any)?.enableTimeSegmentationDivider === true,
            timeSegmentationMonths: (settings.actorEnhancement as any)?.timeSegmentationMonths || 6,
        });
        initOrchestrator.add('critical', () => actorEnhancementManager.init(), { label: 'actorEnhancement:init' });
    }

    // 初始化Emby增强功能（延后执行）
    if (settings.emby?.enabled) {
        initOrchestrator.add('deferred', async () => {
            try {
                await embyEnhancementManager.initialize();
            } catch (error) {
                log('Failed to initialize Emby enhancement:', error as any);
            }
        }, { label: 'embyEnhancement:init', idle: true, delayMs: 3000 });
    }

    // 隐私保护功能已通过编排器在 high 阶段初始化

    // 更稳健地识别搜索结果页：不仅依赖 DOM，还检查 URL
    const url = new URL(window.location.href);
    const isSearchPath = url.pathname === '/search';
    const hasQParam = url.searchParams.has('q');
    STATE.isSearchPage = !!document.querySelector(SELECTORS.SEARCH_RESULT_PAGE) || (isSearchPath && hasQParam);
    if (STATE.isSearchPage) {
        log('Search page detected (/search?q=...), hiding functions will be disabled.');
    }

    // 注意：原始 favicon 已在上方提前保存，这里无需再次保存

    // 将列表观察初始化纳入编排器（列表/演员页 critical）
    const pathNow = window.location.pathname;
    if (!pathNow.startsWith('/v/')) {
        initOrchestrator.add('critical', () => {
            processVisibleItems();
            setupObserver();
        }, { label: 'list:observe:init' });
    }

    // 在默认隐藏功能处理完后，再初始化智能内容过滤（统一由编排器调度）
    if (settings.userExperience.enableContentFilter) {
        initOrchestrator.add('deferred', () => {
            contentFilterManager.initialize();
            log('Content filter initialized after default hide processing');
        }, { label: 'contentFilter:initialize', delayMs: 500 });
    }

    if (!window.location.pathname.startsWith('/v/')) {
        // 在列表页也初始化115功能（由编排器统一延时调度）
        initOrchestrator.add('high', () => initDrive115Features(), { label: 'drive115:init:list', delayMs: 2000 });
    }

    // 启动统一编排器（处理 deferred / idle 阶段任务）
    try {
        await initOrchestrator.run();
    } catch (e) {
        log('Init orchestrator run failed:', e);
    }

    initExportFeature();
}

// --- Messaging Bridge for Orchestrator Visualization ---
try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            try {
                if (message && message.type === 'orchestrator:getState') {
                    const o: any = (window as any).__initOrchestrator__;
                    if (o && typeof o.getState === 'function') {
                        const state = o.getState();
                        sendResponse({ ok: true, state });
                    } else {
                        sendResponse({ ok: false, error: 'orchestrator not initialized yet' });
                    }
                    return true; // async response
                }
            } catch (err) {
                sendResponse({ ok: false, error: String(err) });
                return true;
            }
            return undefined;
        });
    }
} catch {}

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

// 监听来自popup或dashboard的设置更新// 消息监听器
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'settings-updated') {
        log('Settings updated, reloading settings and reprocessing items');
        // 重新加载设置并重新处理页面项目
        getSettings().then(settings => {
            STATE.settings = settings;
            log('Updated display settings:', STATE.settings.display);
            processVisibleItems();

            // 同步列表增强的“演员过滤”开关，并立即重应用（无需等待刷新）
            try {
                listEnhancementManager.updateConfig({
                    hideBlacklistedActorsInList: (settings.listEnhancement as any)?.hideBlacklistedActorsInList === true,
                    hideNonFavoritedActorsInList: (settings.listEnhancement as any)?.hideNonFavoritedActorsInList === true,
                    treatSubscribedAsFavorited: (settings.listEnhancement as any)?.treatSubscribedAsFavorited !== false,
                });
                listEnhancementManager.reapplyActorHidingForAll?.();
            } catch (e) {
                log('Failed to reapply actor-based list hiding after settings update:', e as any);
            }

            // 在默认隐藏功能处理完后，重新应用智能过滤
            if (settings.userExperience.enableContentFilter) {
                setTimeout(() => {
                    // 使用公开方法触发重新应用：更新关键字规则会在已初始化时清理并重新应用过滤
                    const keywordRules = settings.contentFilter?.keywordRules || [];
                    contentFilterManager.updateKeywordRules(keywordRules);
                    log('Content filter reapplied after settings update');
                }, 100);
            }

            // 刷新 Emby 增强（应用右侧快捷按钮显示开关等）
            try {
                embyEnhancementManager.refresh?.();
            } catch (e) {
                log('Failed to refresh Emby enhancement after settings update:', e as any);
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
    } else if (message.type === 'ACTOR_ENHANCEMENT_SAVE_FILTER') {
        // 保存当前演员页过滤器
        actorEnhancementManager.saveCurrentTagFilter()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error: any) => {
                console.error('保存演员页过滤器失败:', error);
                sendResponse({ success: false, error: (error && error.message) || String(error) });
            });
        return true; // 保持消息通道开放
    } else if (message.type === 'ACTOR_ENHANCEMENT_CLEAR_FILTERS') {
        // 清除所有保存的过滤器
        actorEnhancementManager.clearSavedFilters()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error: any) => {
                console.error('清除演员页过滤器失败:', error);
                sendResponse({ success: false, error: (error && error.message) || String(error) });
            });
        return true; // 保持消息通道开放
    } else if (message.type === 'ACTOR_ENHANCEMENT_GET_STATUS') {
        // 获取演员页增强状态
        try {
            const status = actorEnhancementManager.getStatus();
            sendResponse(status);
        } catch (error: any) {
            console.error('获取演员页状态失败:', error);
            sendResponse({ error: error.message });
        }
        return true; // 保持消息通道开放
    }
    return false; // 确保所有分支都有返回值（同步处理）
});

async function initVolumeControl() {
    try {
        // 从设置对象中获取音量设置
        const settings = await getSettings();
        currentVolume = settings.listEnhancement?.previewVolume || 0.2;
        log(`🎵 Volume control init: ${Math.round(currentVolume * 100)}%`);

        // 监听popup消息
        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
    
    // 暴露列表增强管理器以便调试和测试
    (window as any).listEnhancementManager = listEnhancementManager;
    
    // 暴露演员页增强管理器以便调试和测试
    (window as any).actorEnhancementManager = actorEnhancementManager;
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    try {
        // 清理性能优化器
        if (performanceOptimizer) {
            performanceOptimizer.cleanup();
        }

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

        // 清理Emby增强管理器
        if (embyEnhancementManager) {
            embyEnhancementManager.destroy();
        }

        // 清理磁力搜索管理器
        if (magnetSearchManager) {
            magnetSearchManager.destroy?.();
        }

        log('Resources cleaned up on page unload');
    } catch (error) {
        log('Error during cleanup:', error);
    }
});

// 监听扩展上下文失效
if (typeof chrome !== 'undefined' && chrome.runtime) {
    // 监听runtime错误
    chrome.runtime.onConnect.addListener((port) => {
        port.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
                log('[Context] Extension context may be invalidated:', chrome.runtime.lastError.message);
                // 执行清理操作
                performanceOptimizer?.cleanup();
            }
        });
    });
}

// 监听页面可见性变化，在页面隐藏时减少资源消耗
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时，暂停一些非关键任务
        log('[Performance] Page hidden, reducing resource usage');
        performanceOptimizer?.updateConfig({
            maxConcurrentRequests: 1,
            domBatchSize: 2,
            domThrottleDelay: 200,
            enableMemoryCleanup: true,
            memoryCleanupInterval: 20000,
        });
        try {
            // 降档：仅保留 SUK + BTD，减少结果与超时
            magnetSearchManager.updateConfig({
                sources: { sukebei: true, btdig: true, btsow: false, torrentz2: false, custom: [] },
                maxResults: 8,
                timeout: 4000,
            });
        } catch {}
    } else {
        // 页面显示时，恢复正常配置
        log('[Performance] Page visible, restoring normal resource usage');
        try {
            const s = STATE.settings as any;
            const mc = (s?.magnetSearch?.concurrency?.pageMaxConcurrentRequests ?? 2) as number;
            performanceOptimizer?.updateConfig({
                maxConcurrentRequests: mc,
                domBatchSize: 5,
                domThrottleDelay: 100,
            });
            // 恢复用户设定的磁力源、结果数与超时
            const magnetSearchConfig = s?.magnetSearch || {};
            const sources = magnetSearchConfig.sources || {};
            magnetSearchManager.updateConfig({
                sources: {
                    sukebei: sources.sukebei !== false,
                    btdig: sources.btdig !== false,
                    btsow: sources.btsow !== false,
                    torrentz2: sources.torrentz2 || false,
                    custom: [],
                },
                maxResults: (magnetSearchConfig.maxResults ?? 15),
                timeout: (magnetSearchConfig.timeoutMs ?? 6000),
            });
        } catch {
            performanceOptimizer?.updateConfig({ maxConcurrentRequests: 2, domBatchSize: 5, domThrottleDelay: 100 });
        }
    }
});

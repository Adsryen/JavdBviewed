// @ts-nocheck

import { initializeGlobalState, STATE, cleanupSearchEngines } from './state';
import { initTabs } from './tabs/navigation';
import { ensureModalsMounted } from './modals/init';
// initAdvancedSettingsTab 已迁移到模块化设置系统
// initLogsTab 已迁移到模块化设置系统
// initAISettingsTab 已迁移到模块化设置系统
// initializeNetworkTestTab 已迁移到模块化设置系统
// drive115 功能已迁移到模块化设置系统
import { initModal } from './import';
import { log } from '../utils/logController';
// import { logAsync } from './logger';
// import { showMessage } from './ui/toast';
// import { VIDEO_STATUS } from '../utils/config';
// import { showWebDAVRestoreModal } from './webdavRestore';
// import { setValue, getValue } from '../utils/storage';
// import { STORAGE_KEYS } from '../utils/config';
import { initUserProfileSection } from './userProfile';
// import { initDataSyncSection } from './dataSync';
import './ui/dataViewModal'; // 确保 dataViewModal 被初始化
import { getDrive115V2Service } from '../services/drive115v2';
import { installConsoleProxy } from '../utils/consoleProxy';
import { ensureMounted } from './loaders/partialsLoader';
import { ensureStylesLoaded } from './loaders/stylesLoader';
import { loadPartial, initThemeListener } from './loaders/partialsLoader';
import { applyConsoleSettingsFromStorage_DB, bindConsoleSettingsListener } from './console/settings';
import { bindInsightsListeners } from './listeners/insights';
import { initTopbarIcons } from './topbar/icons';
import { initVersionBadge } from './topbar/versionChecker';
import { initSidebarActions as initSidebarActionsModule, updateSyncStatus as updateSyncStatusModule } from './sidebar/actions';
import { setupDashboardPrivacyMonitoring as setupDashboardPrivacyMonitoringModule } from './privacy/dashboardMonitor';
import { runQASelfCheck as runQASelfCheckModule } from './qa/selfCheck';
import { bindUiListeners } from './listeners/ui';
import { initStatsOverview, initHomeSectionsOverview } from './home/overview';
import { initOrUpdateHomeCharts, bindHomeChartsRangeControls, bindHomeRefreshButton } from './home/charts';
import { STORAGE_KEYS } from '../utils/config';
import { getSettings } from '../utils/storage';
import { handleCloudflareVerification } from './dataSync/cloudflareVerification';
// 主题系统
import { themeManager } from './services/themeManager';
import { ThemeSwitcher } from './components/themeSwitcher';

// 立即初始化主题系统（在 DOM 加载之前）
// 这样可以避免页面闪烁，并确保 data-theme 属性被正确设置
(async () => {
    try {
        await themeManager.initialize();
        console.log('[Dashboard] 主题系统已提前初始化');
    } catch (error) {
        console.error('[Dashboard] 主题系统提前初始化失败:', error);
    }
})();

installConsoleProxy({
    level: 'DEBUG',
    format: { showTimestamp: true, timestampStyle: 'hms', timeZone: 'Asia/Shanghai', showSource: true, color: true },
    categories: {
        general: { enabled: true, match: () => true, label: 'DB', color: '#8e44ad' },
        ai: { enabled: true, match: /\[AI\]|\bAI\b/i, label: 'AI', color: '#e67e22' },
        insights: { enabled: true, match: /\[INSIGHTS\]|Insights|报告|统计/i, label: 'INSIGHTS', color: '#2ecc71' },
        newworks: { enabled: true, match: /\[NewWorks|NewWorksManager|NEWWORKS\]|新作品/i, label: 'NEWWORKS', color: '#f39c12' },
        actor: { enabled: true, match: /\[Actor|ActorManager\]|演员|Actor/i, label: 'ACTOR', color: '#2980b9' },
        sync: { enabled: true, match: /\[Sync|DataSync\]|同步|WebDAV|Sync/i, label: 'SYNC', color: '#3498db' },
        drive115: { enabled: true, match: /\[(Drive115|115V?2?)\]|115网盘|Drive115/i, label: '115', color: '#d35400' },
        privacy: { enabled: true, match: /\[(Privacy|PrivacyManager|LockScreen)\]|隐私|Privacy|Lock/i, label: 'PRIVACY', color: '#c0392b' },
    },
});

applyConsoleSettingsFromStorage_DB();
bindConsoleSettingsListener();

// 首页聚合工具已迁移到 ./home/charts

// 监听 Insights 变更，自动刷新首页图表
bindInsightsListeners();
// 监听 UI 级消息（toast等）
bindUiListeners();

// 监听来自 background 的 Cloudflare 验证请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'cloudflare-verification-request') {
        const url = message.url;
        
        // 处理验证
        handleCloudflareVerification(url).then((result) => {
            sendResponse(result);
        }).catch((error) => {
            sendResponse({ success: false, error: error.message || '验证失败' });
        });
        
        return true; // 保持消息通道开启
    }
});

function updateDrive115SidebarVisibility(enabledParam?: boolean, enableV2Param?: boolean): void {
    const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
    if (!section) return;
    const enabled = typeof enabledParam === 'boolean' ? enabledParam : !!STATE.settings?.drive115?.enabled;
    const enableV2 = typeof enableV2Param === 'boolean' ? enableV2Param : !!STATE.settings?.drive115?.enableV2;
    // 只要任一开启就显示
    section.style.display = (enabled || enableV2) ? '' : 'none';
}

// 预置一个全局占位，避免在真实函数绑定前被调用导致 ReferenceError
(window as any).initDrive115QuotaSidebar = (window as any).initDrive115QuotaSidebar || (() => {});
// 如需暴露为全局，待真实函数声明后再绑定到 window（避免作用域问题导致引用错误）

// 隐私监控实现已迁移到 ./privacy/dashboardMonitor

// Ensure global hook exists to avoid early reference errors
(window as any).initDrive115QuotaSidebar = (window as any).initDrive115QuotaSidebar || (() => {});

async function initDrive115QuotaSidebar(): Promise<void> {
    try {
        const enabled = !!STATE.settings?.drive115?.enabled;
        const enableV2 = !!STATE.settings?.drive115?.enableV2;
        const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
        if (!(enabled || enableV2)) {
            if (section) section.style.display = 'none';
            return;
        }

        if (enabled && !enableV2) {
            if (section) section.style.display = '';
            const box = document.getElementById('drive115QuotaSidebar');
            if (box) box.innerHTML = '';
            return;
        }

        if (section) section.style.display = '';
        const box = document.getElementById('drive115QuotaSidebar');
        if (!box) return;

        const svc = getDrive115V2Service();
        const tokenRet = await svc.getValidAccessToken();
        if (!('success' in tokenRet) || !tokenRet.success) {
    box.innerHTML = '<div style="font-size:12px; color:#999;">'
        + '无法获取配额：' + ((tokenRet as any)?.message || '未启用或缺少凭据')
        + '<div style="margin-top:6px;">'
        + '<a href="#tab-settings/drive115-settings" style="color:#4a90e2; text-decoration:none;">前往设置 115</a>'
        + '</div>'
        + '</div>';
    return;
}

        const quotaRet = await svc.getQuotaInfo({ accessToken: tokenRet.accessToken });
        if (!quotaRet.success) {
            box.innerHTML = `<div style="font-size:12px; color:#d9534f;">获取配额失败：${quotaRet.message || '未知错误'}</div>`;
            return;
        }

        renderDrive115QuotaSidebar(quotaRet.data || {} as any);
    } catch (e) {
        const box = document.getElementById('drive115QuotaSidebar');
        if (box) box.innerHTML = `<div style="font-size:12px; color:#d9534f;">获取配额异常</div>`;
        console.error('initDrive115QuotaSidebar error:', e);
    }
}

function renderDrive115QuotaSidebar(info: { total?: number; used?: number; surplus?: number; list?: any[] }): void {
    const box = document.getElementById('drive115QuotaSidebar');
    if (!box) return;

    const total = typeof info.total === 'number' ? info.total : undefined;
    const used = typeof info.used === 'number' ? info.used : undefined;
    const surplus = typeof info.surplus === 'number'
        ? info.surplus
        : (typeof used === 'number' && typeof total === 'number' ? Math.max(0, total - used) : undefined);

    const percent = (() => {
        if (typeof used === 'number' && typeof total === 'number' && total > 0) return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
        if (typeof surplus === 'number' && typeof total === 'number' && total > 0) return Math.max(0, Math.min(100, Math.round(((total - surplus) / total) * 100)));
        return undefined;
    })();

    const fmt = (n?: number) => (typeof n === 'number' ? String(n) : '-');

    const barHtml = (percent !== undefined)
        ? `
        <div style="height:8px; background:#eee; border-radius:6px; overflow:hidden;">
            <div style="height:100%; width:${percent}%; background:linear-gradient(90deg,#4a90e2,#50c9c3);"></div>
        </div>
        <div style="font-size:11px; color:#777; margin-top:4px;">已用 ${percent}%</div>
        `
        : '<div style="font-size:12px; color:#999;">暂无总量信息</div>';

    box.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>总量</span>
                <span>${fmt(total)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>已用</span>
                <span>${fmt(used)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>剩余</span>
                <span>${fmt(surplus)}</span>
            </div>
            ${barHtml}
            <div style="margin-top:2px;">
                <a href="#tab-settings/drive115-settings" style="color:#4a90e2; text-decoration:none; font-size:12px;">查看详情与刷新</a>
            </div>
        </div>
    `;
}

// 首页 ECharts 兜底渲染已迁移到 ./home/charts

document.addEventListener('DOMContentLoaded', async () => {
    // 添加全局事件委托来处理设置页面的返回按钮
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        console.log('[Dashboard] 点击事件触发，target:', target.tagName, target.className);
        const backBtn = target.closest('[data-action="back-to-settings"]');
        if (backBtn) {
            console.log('[Dashboard] 找到返回按钮，阻止默认行为');
            e.preventDefault();
            e.stopPropagation();
            console.log('[Dashboard] 返回按钮被点击，导航到设置页');
            
            // 使用 history.pushState 避免锚点跳转
            const newUrl = window.location.pathname + window.location.search + '#tab-settings';
            history.pushState(null, '', newUrl);
            
            // 手动触发 hashchange 事件
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    }, true); // 使用捕获阶段
    
    // 1. 首先初始化主题系统（在任何 UI 渲染之前）
    try {
        await themeManager.initialize();
        console.log('[Dashboard] 主题系统已初始化');
        
        // 初始化主题监听器，确保动态组件应用主题
        initThemeListener();
        console.log('[Dashboard] 主题监听器已初始化');
    } catch (error) {
        console.error('[Dashboard] 主题系统初始化失败:', error);
    }

    // Ensure layout skeleton is mounted before any DOM access
    try {
        await ensureMounted('#app-root', 'layout/skeleton.html');
    } catch {}

    // 监听来自background的锁定消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'privacy-lock-trigger') {
            try {
                const { getPrivacyManager } = require('../services/privacy');
                const privacyManager = getPrivacyManager();
                privacyManager.lock().catch((error: any) => {
                    console.error('Failed to lock from message:', error);
                });
                sendResponse({ success: true });
            } catch (error) {
                console.error('Failed to handle lock trigger:', error);
                sendResponse({ success: false });
            }
        }
        return true;
    });

    // Mount layout fragments and ensure layout styles are present
    try {
        // 顶层 Topbar（品牌横跨整个容器）
        await ensureMounted('#layout-topbar-root', 'layout/topbar.html');
        // 左侧侧栏与顶部 tabs 导航
        await ensureMounted('#layout-sidebar-root', 'layout/sidebar.html');
        await ensureMounted('#layout-tabs-nav-root', 'layout/tabs-nav.html');
        // 注入对应样式
        await ensureStylesLoaded([
            './styles/04-components/layout.css',
        ]);
    } catch {}

    await initializeGlobalState();

    try {
        if (!(window as any).__SETTINGS_ON_CHANGED_BOUND__) {
            chrome.storage.onChanged.addListener((changes, areaName) => {
                try {
                    if (areaName !== 'local') return;
                    if (!changes || !changes[STORAGE_KEYS.SETTINGS]) return;
                    getSettings().then((s) => {
                        try { STATE.settings = s; } catch {}
                        try { updateSyncStatusModule(); } catch {}
                    }).catch(() => {});
                } catch {}
            });
            (window as any).__SETTINGS_ON_CHANGED_BOUND__ = true;
        }
    } catch {}
    // Modals 常驻挂载
    try { await ensureModalsMounted(); } catch {}

    // 日志控制器已在模块加载时自动初始化，这里无需重复初始化

    // 清理搜索引擎配置中的测试数据
    await cleanupSearchEngines();

    // QA 自检（开发期）：检查基础样式与模态框唯一性/挂载状态
    try { runQASelfCheckModule(); } catch {}

    // 初始化隐私保护系统
    try {
        log.privacy('Initializing privacy system for Dashboard...');
        const { initializePrivacySystem } = await import('../services/privacy');
        await initializePrivacySystem();
        log.privacy('Privacy system initialized successfully for Dashboard');

        // 设置 Dashboard 特定的隐私监控
        setupDashboardPrivacyMonitoringModule();

        // 初始化倒计时显示
        const { initializeIdleTimerDisplay } = await import('./privacy/idleTimer');
        initializeIdleTimerDisplay();

        // 初始化手动锁定按钮
        const { initializeManualLockButton } = await import('./privacy/manualLock');
        await initializeManualLockButton();
    } catch (error) {
        console.error('Failed to initialize privacy system for Dashboard:', error);
    }

    initTopbarIcons();
    
    // 初始化主题切换器（挂载到 Topbar）
    try {
        const topbarRight = document.querySelector('.topbar-right');
        if (topbarRight) {
            const themeSwitcher = new ThemeSwitcher(themeManager);
            // 在帮助按钮之前插入主题切换器
            const helpBtn = document.getElementById('helpBtn');
            if (helpBtn) {
                topbarRight.insertBefore(themeSwitcher.getElement(), helpBtn);
            } else {
                themeSwitcher.mount(topbarRight as HTMLElement);
            }
            console.log('[Dashboard] 主题切换器已挂载');
        } else {
            console.warn('[Dashboard] 未找到 .topbar-right 容器，主题切换器未挂载');
        }
    } catch (error) {
        console.error('[Dashboard] 主题切换器挂载失败:', error);
    }
    
    // 初始化版本检测和显示（异步，不阻塞页面）
    initVersionBadge().catch(error => {
        console.error('Failed to initialize version badge:', error);
    });

    // 通过统一路由按需初始化 115 服务

    // 监听首页初始化事件（由 navigation.ts 触发），集中处理首页的概览与图表
    try {
        if (!(window as any).__HOME_INIT_REQUIRED_BOUND__) {
            window.addEventListener('home:init-required' as any, async () => {
                try { bindHomeChartsRangeControls(); } catch {}
                try { await initStatsOverview(); } catch {}
                try { await initHomeSectionsOverview(); } catch {}
                try { await initOrUpdateHomeCharts(); } catch {}
                try { bindHomeRefreshButton(); } catch {}
            });
            (window as any).__HOME_INIT_REQUIRED_BOUND__ = true;
        }
    } catch {}

    await initTabs();
    // initActorsTab(); // 延迟初始化，仅在用户点击“演员库”标签页时加载
    // initNewWorksTab(); // 延迟初始化，仅在用户点击“新作”标签页时加载
    // initSyncTab(); // lazy: moved to tab click and hash init
    // initSettingsTab(); // lazy: moved to tab click and hash init
    // initAdvancedSettingsTab(); // 已迁移到模块化设置系统
    // initAISettingsTab(); // 已迁移到模块化设置系统
    // initDrive115Tab(); // 已迁移到模块化设置系统
    // initLogsTab(); // 已迁移到模块化设置系统
    initSidebarActionsModule();
    initUserProfileSection();
    // initDataSyncSection(); // 移除重复调用，由 initSyncTab 处理
    initInfoContainer();
    initHelpSystem();
    initModal();
    // 根据设置控制 115 侧边栏显示，并在启用时（V2）加载配额
    updateDrive115SidebarVisibility();
    if (STATE.settings?.drive115?.enableV2) {
        (window as any).initDrive115QuotaSidebar?.();
    }
    updateSyncStatusModule();
    // 监听来自设置页的配额刷新事件
    window.addEventListener('drive115:refreshQuota' as any, () => {
        (window as any).initDrive115QuotaSidebar?.();
    });
    // 监听 115 启用状态变更，动态显示侧边栏并在启用（V2）时加载配额
    window.addEventListener('drive115:enabled-changed' as any, (e: any) => {
        const enabled = !!(e?.detail?.enabled);
        const enableV2 = !!(e?.detail?.enableV2);
        updateDrive115SidebarVisibility(enabled, enableV2);
        if (enableV2 || enabled) {
            // V1 或 V2 任一启用先更新容器；仅在 V2 时加载配额
            if (enableV2) (window as any).initDrive115QuotaSidebar?.();
        }
    });
    try {
        if (!(window as any).__HOME_TAB_SHOW_BOUND__) {
            window.addEventListener('tab:show' as any, async (e: any) => {
                const id = e?.detail?.tabId;
                if (id === 'tab-home') {
                    try { bindHomeChartsRangeControls(); } catch {}
                    try { await initOrUpdateHomeCharts(); } catch {}
                }
            });
            (window as any).__HOME_TAB_SHOW_BOUND__ = true;
        }
    } catch {}
});

/**
 * 初始化演员库标签页
 */
async function initActorsTab(): Promise<void> {
    try {
        const { actorsTab } = await import('./tabs/actors');
        await actorsTab.initActorsTab();
    } catch (error) {
        console.error('初始化演员库标签页失败:', error);
    }
}

/**
 * 初始化新作标签页
 */
async function initNewWorksTab(): Promise<void> {
    try {
        const { newWorksTab } = await import('./tabs/newWorks');
        await newWorksTab.initialize();
    } catch (error) {
        console.error('初始化新作标签页失败:', error);
    }
}

/**
 * 初始化数据同步标签页
 */
async function initSyncTab(): Promise<void> {
    try {
        const { syncTab } = await import('./tabs/sync');
        await syncTab.initSyncTab();
    } catch (error) {
        console.error('初始化数据同步标签页失败:', error);
    }
}

function initInfoContainer(): void {
    const infoContainer = document.getElementById('versionInfoSidebar') || document.getElementById('infoContainer');
    if (!infoContainer) return;

    let manifestVersion = '';
    try {
        manifestVersion = chrome?.runtime?.getManifest?.().version || '';
    } catch {}

    const envVersion = import.meta.env.VITE_APP_VERSION || '';
    const version = manifestVersion || envVersion || 'N/A';
    const buildId = import.meta.env.VITE_APP_BUILD_ID || '';
    const versionState = import.meta.env.VITE_APP_VERSION_STATE || 'unknown';

    const getStateTitle = (state: string): string => {
    switch (state) {
        case 'clean':
            return '此版本基于干净且完全提交的 Git 工作区构建。';
        case 'dev':
            return '此版本包含暂存或未提交的更改（dev/staged）。';
        case 'dirty':
            return '警告：此版本包含未提交或未暂存的本地修改（dirty）。';
        default:
            return '无法确定此版本的构建状态。';
    }
};

    const buildLine = buildId
        ? `
        <div class="info-item">
            <span class="info-label">Build:</span>
            <span class="info-value version-state-${versionState}" title="${getStateTitle(versionState)}">${buildId}</span>
        </div>`
        : '';

    infoContainer.innerHTML = `
        <div class="info-item">
            <span class="info-label">Version:</span>
            <span class="info-value version-state-${versionState}" title="${getStateTitle(versionState)}">${version}</span>
        </div>${buildLine}
    `;
}

async function initHelpSystem(): Promise<void> {
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const closeHelpBtn = document.getElementById('closeHelpBtn');

    if (!helpBtn || !helpPanel || !closeHelpBtn) return;

    // 动态导入 HelpPanelManager
    const { HelpPanelManager } = await import('./help/helpPanelManager');

    // 从 partial 动态加载帮助内容
    let html = '';
    try {
        html = await loadPartial('help/feature-help.html');
    } catch (error) {
        console.error('[initHelpSystem] 加载帮助内容失败:', error);
        html = '';
    }

    // 创建帮助面板管理器
    const helpManager = new HelpPanelManager(helpPanel);

    // 初始化管理器
    try {
        await helpManager.init(html);
    } catch (error) {
        console.error('[initHelpSystem] 初始化帮助面板失败:', error);
        // 降级：显示错误提示
        const bodyContainer = helpPanel.querySelector('.help-body-container');
        if (bodyContainer) {
            bodyContainer.innerHTML = '<div style="padding:30px;color:#888;">帮助内容加载失败，请刷新页面重试。</div>';
        }
    }

    // 显示帮助面板
    helpBtn.addEventListener('click', () => {
        helpManager.show();
    });

    // 关闭帮助面板
    const closeHelp = () => {
        helpManager.hide();
    };

    closeHelpBtn.addEventListener('click', closeHelp);

    // 点击背景关闭
    helpPanel.addEventListener('click', (e) => {
        if (e.target === helpPanel) {
            closeHelp();
        }
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpPanel.classList.contains('visible')) {
            closeHelp();
        }
    });
}













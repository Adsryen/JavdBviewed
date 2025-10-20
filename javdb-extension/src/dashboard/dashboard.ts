// @ts-nocheck

import { initializeGlobalState, STATE, cleanupSearchEngines } from './state';
import { initializeTabById, prefetchModuleById } from './tabs/registry';
// initAdvancedSettingsTab 已迁移到模块化设置系统
// initLogsTab 已迁移到模块化设置系统
// initAISettingsTab 已迁移到模块化设置系统
// initializeNetworkTestTab 已迁移到模块化设置系统
// drive115 功能已迁移到模块化设置系统
import { initModal, showImportModal, handleFileRestoreClick } from './import';
import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import { log } from '../utils/logController';
import { VIDEO_STATUS } from '../utils/config';
import { showWebDAVRestoreModal } from './webdavRestore';
import { setValue, getValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import { initUserProfileSection } from './userProfile';
import { initDataSyncSection } from './dataSync';
import type { VideoRecord, OldVideoRecord, VideoStatus } from '../types';
import './ui/dataViewModal'; // 纭繚dataViewModal琚垵濮嬪寲
import { getDrive115V2Service } from '../services/drive115v2';
import { installConsoleProxy } from '../utils/consoleProxy';
import { ensureMounted, loadPartial, injectPartial } from './loaders/partialsLoader';
import { ensureStylesLoaded, prefetchStyles } from './loaders/stylesLoader';
import { dbViewedStats, dbActorsStats, dbNewWorksStats } from './dbClient';
installConsoleProxy({
    level: 'DEBUG',
    format: { showTimestamp: true, timestampStyle: 'hms', timeZone: 'Asia/Shanghai', showSource: true, color: true },
    categories: {
        general: { enabled: true, match: () => true, label: 'DB', color: '#8e44ad' },
        ai: { enabled: true, match: /\[AI\]|\bAI\b/i, label: 'AI', color: '#e67e22' },
        insights: { enabled: true, match: /\[INSIGHTS\]|Insights|报告|统计/i, label: 'INSIGHTS', color: '#2ecc71' },
    },
});
async function applyConsoleSettingsFromStorage_DB() {
    try {
        const { getSettings } = await import('../utils/storage');
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
        console.warn('[ConsoleProxy] Failed to apply settings in DB:', e);
    }
}

applyConsoleSettingsFromStorage_DB();

try {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes['settings']) {
            applyConsoleSettingsFromStorage_DB();
        }
    });
} catch {}

function updateDrive115SidebarVisibility(enabledParam?: boolean, enableV2Param?: boolean): void {
    const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
    if (!section) return;
    const enabled = typeof enabledParam === 'boolean' ? enabledParam : !!STATE.settings?.drive115?.enabled;
    const enableV2 = typeof enableV2Param === 'boolean' ? enableV2Param : !!STATE.settings?.drive115?.enableV2;
    // 鍙浠讳竴寮€鍚氨鏄剧ず
    section.style.display = (enabled || enableV2) ? '' : 'none';
}

// 棰勭疆涓€涓叏灞€鍗犱綅锛岄伩鍏嶅叾浠栨ā鍧楀湪鐪熷疄鍑芥暟缁戝畾鍓嶈皟鐢ㄥ鑷?ReferenceError
(window as any).initDrive115QuotaSidebar = (window as any).initDrive115QuotaSidebar || (() => {});
// 鏆撮湶缁欏叏灞€锛岄伩鍏嶄綔鐢ㄥ煙闂瀵艰嚧寮曠敤閿欒锛堝湪鐪熷疄鍑芥暟澹版槑鍚庝細琚鐩栦负瀹炵幇锛?(window as any).initDrive115QuotaSidebar = initDrive115QuotaSidebar;

/**
 * 璁剧疆Dashboard闅愮淇濇姢鐩戝惉 - 绠€鍖栫増锛屽彧鐩戝惉鏍囩鍒囨崲
 */
async function setupDashboardPrivacyMonitoring() {
    try {
        // simplified stub; can be extended if needed
    } catch (error) {
        console.warn('Failed to setup Dashboard privacy monitoring (stub):', error);
    }
}

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
const TAB_PARTIALS: Record<string, { name: string; styles?: string[] }> = {
    // 首页（首屏）
    'tab-home': {
        name: 'tabs/home.html',
        styles: [
            './styles/_home.css',
            './styles/_stats.css'
        ],
    },
    // 号码库
    'tab-records': {
        name: 'tabs/records.html',
        styles: [
            './styles/_records.css',
        ],
    },
    // 演员库
    'tab-actors': {
        name: 'tabs/actors.html',
        styles: [
            './actors.css',
        ],
    },
    // 新作品
    'tab-new-works': {
        name: 'tabs/new-works.html',
        styles: [
            './styles/_newWorks.css',
        ],
    },
    // 数据同步
    'tab-sync': {
        name: 'tabs/sync.html',
        styles: [
            './styles/_dataSync.css',
        ],
    },
    // 115 任务
    'tab-drive115-tasks': {
      name: 'tabs/drive115-tasks.html',
      styles: [
        './styles/drive115Tasks.css',
      ],
    },
    'tab-insights': {
      name: 'tabs/insights.html',
      styles: [
      ],
    },
    // 设置（基础样式，其余细分样式由各子面板自行导入或保留全局）
    'tab-settings': {
      name: 'tabs/settings.html',
      styles: [
        './styles/settings/index.css',
            './styles/settings/settings.css',
        ],
    },
    // 日志
    'tab-logs': {
    // ... (rest of the code remains the same)
        name: 'tabs/logs.html',
        styles: [
            './styles/logs.css',
            './styles/settings/logs.css',
        ],
    },
};

// 悬停预取：避免重复预取
const prefetchedTabs = new Set<string>();

async function prefetchTabResources(tabId: string): Promise<void> {
    try {
        const cfg = (TAB_PARTIALS as any)[tabId];
        if (!cfg) return;
        // 预取 partial（raw 内联命中则无网络）
        loadPartial(cfg.name).catch(() => {});
        // 预取 CSS（不应用，仅热身缓存）
        if (cfg.styles && cfg.styles.length) {
            await prefetchStyles(cfg.styles);
        }
        prefetchedTabs.add(tabId);
    } catch {}
}

async function mountTabIfNeeded(tabId: string): Promise<void> {
    try {
        const cfg = (TAB_PARTIALS as any)[tabId];
        if (!cfg) return;

        const selector = `#${tabId}`;
        const el = document.querySelector(selector) as HTMLElement | null;

        // 先尝试仅在空容器时挂载，兼容已迁移完成的占位容器
        await ensureMounted(selector, cfg.name);

        // 如果仍然是旧的内联DOM（未标记partialLoaded），执行一次性替换为partial
        if (el && (el as any).dataset?.partialLoaded !== 'true') {
            const html = await loadPartial(cfg.name);
            if (html) {
                await injectPartial(selector, html, { mode: 'replace' });
            }
        }

        if (cfg.styles && cfg.styles.length) {
            await ensureStylesLoaded(cfg.styles);
        }
    } catch (e) {
        console.warn('[Dashboard] mountTabIfNeeded failed for', tabId, e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure layout skeleton is mounted before any DOM access
    try {
        await ensureMounted('#app-root', 'layout/skeleton.html');
    } catch {}

    // Mount layout fragments and ensure layout styles are present
    try {
        // 顶层 Topbar（品牌横跨整个容器）
        await ensureMounted('#layout-topbar-root', 'layout/topbar.html');
        // 左侧侧栏与顶部 tabs 导航
        await ensureMounted('#layout-sidebar-root', 'layout/sidebar.html');
        await ensureMounted('#layout-tabs-nav-root', 'layout/tabs-nav.html');
        // 注入对应样式
        await ensureStylesLoaded([
            './styles/layout/topbar.css',
            './styles/layout/sidebar.css',
            './styles/layout/tabs-nav.css',
        ]);
    } catch {}

    await initializeGlobalState();
    // Modals 常驻挂载：若页面已存在内联模态，则跳过挂载以避免重复 ID
    try {
        const haveInlineModals = !!document.getElementById('confirmationModal')
            || !!document.getElementById('smartRestoreModal')
            || !!document.getElementById('webdavRestoreModal')
            || !!document.getElementById('conflictResolutionModal')
            || !!document.getElementById('restoreResultModal')
            || !!document.getElementById('dataViewModal')
            || !!document.getElementById('import-modal')
            || !!document.getElementById('migration-modal')
            || !!document.getElementById('data-check-modal')
            || !!document.getElementById('helpPanel');
        if (!haveInlineModals) {
            await ensureMounted('#dashboard-modals-root', 'modals/dashboard-modals.html');
            try { window.dispatchEvent(new CustomEvent('modals:mounted')); } catch {}
        } else {
            // 即便内联存在，也广播一次，方便监听方完成初始化
            try { window.dispatchEvent(new CustomEvent('modals:mounted')); } catch {}
        }
    } catch {}

    // 鏃ュ織鎺у埗鍣ㄥ凡鍦ㄦā鍧楀姞杞芥椂鑷姩鍒濆鍖栵紝杩欓噷涓嶉渶瑕侀噸澶嶅垵濮嬪寲

    // 娓呯悊鎼滅储寮曟搸閰嶇疆涓殑娴嬭瘯鏁版嵁
    await cleanupSearchEngines();

    // QA 自检（开发期）：检查基础样式与模态框唯一性/挂载状态
    try { runQASelfCheck(); } catch {}

    // 鍒濆鍖栭殣绉佷繚鎶ょ郴缁?
    try {
        log.privacy('Initializing privacy system for Dashboard...');
        const { initializePrivacySystem } = await import('../services/privacy');
        await initializePrivacySystem();
        log.privacy('Privacy system initialized successfully for Dashboard');

        // 璁剧疆Dashboard鐗瑰畾鐨勯殣绉佺洃鍚?
        setupDashboardPrivacyMonitoring();
    } catch (error) {
        console.error('Failed to initialize privacy system for Dashboard:', error);
    }

    // 璁剧疆鏍囬鍥炬爣URL
    const titleIcon = document.getElementById('title-icon') as HTMLImageElement;
    if (titleIcon) {
        titleIcon.src = chrome.runtime.getURL('assets/favicon-32x32.png');
        titleIcon.onload = () => {
            titleIcon.style.display = 'block';
        };
        titleIcon.onerror = () => {
            // 濡傛灉鍥剧墖鍔犺浇澶辫触锛岄殣钘忓浘鐗囧厓绱?
            titleIcon.style.display = 'none';
        };
    }

    // 顶部导航品牌图标
    const brandIcon = document.getElementById('brand-icon') as HTMLImageElement;
    if (brandIcon) {
        brandIcon.src = chrome.runtime.getURL('assets/favicon-32x32.png');
        brandIcon.onload = () => {
            brandIcon.style.display = 'block';
        };
        brandIcon.onerror = () => {
            brandIcon.style.display = 'none';
        };
    }

    // 115 鏈嶅姟閫氳繃缁熶竴璺敱鎸夐渶鍒濆鍖栵紝鏃犻渶鍦ㄦ鏄惧紡鍒濆鍖?

    await initTabs();
    await mountTabIfNeeded('tab-home');
    await initializeTabById('tab-home');
    try { await initStatsOverview(); } catch {}
    try { await initHomeSectionsOverview(); } catch {}
    bindHomeRefreshButton();
    // initActorsTab(); // 寤惰繜鍒濆鍖栵紝鍙湪鐢ㄦ埛鐐瑰嚮婕斿憳搴撴爣绛鹃〉鏃舵墠鍔犺浇
    // initNewWorksTab(); // 寤惰繜鍒濆鍖栵紝鍙湪鐢ㄦ埛鐐瑰嚮鏂颁綔鍝佹爣绛鹃〉鏃舵墠鍔犺浇
    // initSyncTab(); // lazy: moved to tab click and hash init
    // initSettingsTab(); // lazy: moved to tab click and hash init
    // initAdvancedSettingsTab(); // 宸茶縼绉诲埌妯″潡鍖栬缃郴缁?
    // initAISettingsTab(); // 宸茶縼绉诲埌妯″潡鍖栬缃郴缁?
    // initDrive115Tab(); // 宸茶縼绉诲埌妯″潡鍖栬缃郴缁?
    // initLogsTab(); // 宸茶縼绉诲埌妯″潡鍖栬缃郴缁?
    initSidebarActions();
    initUserProfileSection();
    // initDataSyncSection(); // 绉婚櫎閲嶅璋冪敤锛岀敱 initSyncTab 澶勭悊
    initStatsOverview();
    initInfoContainer();
    initHelpSystem();
    initModal();
    // 鏍规嵁璁剧疆鎺у埗 115 渚ц竟鏍忔樉绀猴紝骞跺湪鍚敤鏃讹紙V2锛夊姞杞介厤棰?
    updateDrive115SidebarVisibility();
    if (STATE.settings?.drive115?.enableV2) {
        (window as any).initDrive115QuotaSidebar?.();
    }
    updateSyncStatus();
    // 鐩戝惉鏉ヨ嚜璁剧疆椤电殑閰嶉鍒锋柊浜嬩欢
    window.addEventListener('drive115:refreshQuota' as any, () => {
        (window as any).initDrive115QuotaSidebar?.();
    });
    // 鐩戝惉 115 鍚敤鐘舵€佸彉鏇达紝鍔ㄦ€佹樉闅愪晶杈规爮骞跺湪鍚敤锛圴2锛夋椂鍔犺浇閰嶉
    window.addEventListener('drive115:enabled-changed' as any, (e: any) => {
        const enabled = !!(e?.detail?.enabled);
        const enableV2 = !!(e?.detail?.enableV2);
        updateDrive115SidebarVisibility(enabled, enableV2);
        if (enableV2 || enabled) {
            // V1 鎴?V2 浠讳竴寮€鍚厛鏇存柊瀹瑰櫒锛涗粎褰?V2 鏃跺姞杞介厤棰?
            if (enableV2) (window as any).initDrive115QuotaSidebar?.();
        }
    });
});

/**
 * 鍒濆鍖栨紨鍛樺簱鏍囩椤?
 */
async function initActorsTab(): Promise<void> {
    try {
        const { actorsTab } = await import('./tabs/actors');
        await actorsTab.initActorsTab();
    } catch (error) {
        console.error('鍒濆鍖栨紨鍛樺簱鏍囩椤靛け璐?', error);
    }
}

/**
 * 鍒濆鍖栨柊浣滃搧鏍囩椤?
 */
async function initNewWorksTab(): Promise<void> {
    try {
        const { newWorksTab } = await import('./tabs/newWorks');
        await newWorksTab.initialize();
    } catch (error) {
        console.error('鍒濆鍖栨柊浣滃搧鏍囩椤靛け璐?', error);
    }
}

/**
 * 鍒濆鍖栨暟鎹悓姝ユ爣绛鹃〉
 */
async function initSyncTab(): Promise<void> {
    try {
        const { syncTab } = await import('./tabs/sync');
        await syncTab.initSyncTab();
    } catch (error) {
        console.error('鍒濆鍖栨暟鎹悓姝ユ爣绛鹃〉澶辫触:', error);
    }
}

async function initTabs(): Promise<void> {
    try {
        const tabs = document.querySelectorAll('.tab-link');
        const contents = document.querySelectorAll('.tab-content');

        // 纭繚 NodeList 瀛樺湪涓斾笉涓虹┖
        if (!tabs || tabs.length === 0) {
            console.warn('鏈壘鍒版爣绛鹃〉閾炬帴鍏冪礌');
            return;
        }

        if (!contents || contents.length === 0) {
            console.warn('鏈壘鍒版爣绛鹃〉鍐呭鍏冪礌');
            return;
        }

        const switchTab = (tabButton: Element | null) => {
            if (!tabButton) return;
            const tabId = tabButton.getAttribute('data-tab');
            if (!tabId) return;

            try {
                // 在移除 active 前记录之前的激活 tab，用于分发 hide
                let prevId: string | null = null;
                try {
                    const prevActive = document.querySelector('.tab-link.active') as Element | null;
                    prevId = prevActive?.getAttribute('data-tab');
                } catch {}

                // 瀹夊叏鍦伴亶鍘?NodeList
                if (tabs && tabs.forEach) {
                    tabs.forEach(t => t.classList.remove('active'));
                }
                if (contents && contents.forEach) {
                    contents.forEach(c => c.classList.remove('active'));
                }

                // 分发隐藏事件（上一个激活的 tab）
                try {
                    if (prevId) window.dispatchEvent(new CustomEvent('tab:hide', { detail: { tabId: prevId } }));
                } catch {}

                tabButton.classList.add('active');
                document.getElementById(tabId)?.classList.add('active');

                if (history.pushState) {
                    history.pushState(null, '', `#${tabId}`);
                } else {
                    location.hash = `#${tabId}`;
                }

                // 分发显示事件（当前激活的 tab）
                try {
                    window.dispatchEvent(new CustomEvent('tab:show', { detail: { tabId } }));
                } catch {}
            } catch (error) {
                console.error('鍒囨崲鏍囩椤垫椂鍑洪敊:', error);
            }
        };

        // 瀹夊叏鍦颁负姣忎釜鏍囩椤垫坊鍔犱簨浠剁洃鍚櫒
        if (tabs && tabs.forEach) {
            tabs.forEach(tab => {
                try {
                    // 悬停预取资源，提升首次点击体验
                    tab.addEventListener('mouseenter', () => {
                        const id = tab.getAttribute('data-tab') || '';
                        if (!id || prefetchedTabs.has(id)) return;
                        // 预取模块代码与资源
                        try { prefetchModuleById(id); } catch {}
                        prefetchTabResources(id);
                    });

                    tab.addEventListener('click', async () => {
                        switchTab(tab);
                        const tabId = tab.getAttribute('data-tab');
                        await mountTabIfNeeded(tabId || '');
                        await initializeTabById(tabId || '');
                    });
                } catch (error) {
                    console.error('涓烘爣绛鹃〉娣诲姞浜嬩欢鐩戝惉鍣ㄦ椂鍑洪敊:', error);
                }
            });
        }

        // 瑙ｆ瀽褰撳墠hash锛屾敮鎸佷簩绾ц矾寰?
        const fullHash = window.location.hash.substring(1) || 'tab-home';
        const [mainTab, subSection] = fullHash.split('/');
        const targetTab = document.querySelector(`.tab-link[data-tab="${mainTab}"]`);
        switchTab(targetTab || (tabs.length > 0 ? tabs[0] : null));
        await mountTabIfNeeded(mainTab);

        // 濡傛灉鏄缃〉闈笖鏈夊瓙椤甸潰锛屽瓨鍌ㄥ瓙椤甸潰淇℃伅渚涜缃〉闈娇鐢?
        if (mainTab === 'tab-settings' && subSection) {
            // 灏嗗瓙椤甸潰淇℃伅瀛樺偍鍒板叏灞€鐘舵€佷腑锛屼緵璁剧疆椤甸潰鍒濆鍖栨椂浣跨敤
            (window as any).initialSettingsSection = subSection;
        }

        await initializeTabById(mainTab);
        if (mainTab === 'tab-home') {
            try { await initStatsOverview(); } catch {}
            try { await initHomeSectionsOverview(); } catch {}
            bindHomeRefreshButton();
        }

        // 娣诲姞hashchange浜嬩欢鐩戝惉鍣紝澶勭悊URL鍙樺寲
        window.addEventListener('hashchange', async () => {
            const newHash = window.location.hash.substring(1) || 'tab-home';
            const [newMainTab, newSubSection] = newHash.split('/');

            // 濡傛灉涓绘爣绛鹃〉鍙戠敓鍙樺寲锛屽垏鎹富鏍囩椤?
            const currentActiveTab = document.querySelector('.tab-link.active');
            const currentTabId = currentActiveTab?.getAttribute('data-tab');

            if (currentTabId !== newMainTab) {
                const newTargetTab = document.querySelector(`.tab-link[data-tab="${newMainTab}"]`);
                if (newTargetTab) {
                    switchTab(newTargetTab);
                    await mountTabIfNeeded(newMainTab);
                }
            }

            // 统一初始化当前主标签页
            await initializeTabById(newMainTab);
            if (newMainTab === 'tab-home') {
                try { await initStatsOverview(); } catch {}
                try { await initHomeSectionsOverview(); } catch {}
                bindHomeRefreshButton();
            }

            // 濡傛灉鏄缃〉闈笖鏈夊瓙椤甸潰锛岄€氱煡璁剧疆椤甸潰鍒囨崲
            if (newMainTab === 'tab-settings' && newSubSection) {
                // 瑙﹀彂鑷畾涔変簨浠讹紝閫氱煡璁剧疆椤甸潰鍒囨崲瀛愰〉闈?
                window.dispatchEvent(new CustomEvent('settingsSubSectionChange', {
                    detail: { section: newSubSection }
                }));
            }
        });
    } catch (error) {
        console.error('鍒濆鍖栨爣绛鹃〉鏃跺嚭閿?', error);
    }
}

async function initStatsOverview(): Promise<void> {
    const container = document.getElementById('stats-overview');
    if (!container) return;

    try {
        const s = await dbViewedStats();
        const total = s.total ?? 0;
        const viewed = s.byStatus?.viewed ?? 0;
        const browsed = s.byStatus?.browsed ?? 0;
        const want = s.byStatus?.want ?? 0;

        container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">${total}</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">${viewed}</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">${browsed}</span>
                <span class="stat-label">已浏览</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">${want}</span>
                <span class="stat-label">想看</span>
            </div>
        `;
    } catch (error) {
        console.error('初始化统计概览时出错:', error);
        container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">0</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">0</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">0</span>
                <span class="stat-label">已浏览</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">0</span>
                <span class="stat-label">想看</span>
            </div>
        `;
    }
}

// 首页：迁移“番号库/演员库/新作品”的概览统计到首页
async function initHomeSectionsOverview(): Promise<void> {
    try {
        // 番号库概览
        const recordsBox = document.getElementById('homeRecordsStatsContainer');
        if (recordsBox) {
            try {
                const s = await dbViewedStats();
                const total = s.total ?? 0;
                const viewed = s.byStatus?.viewed ?? 0;
                const browsed = s.byStatus?.browsed ?? 0;
                const want = s.byStatus?.want ?? 0;
                recordsBox.innerHTML = `
                    <div class="stat-item" data-stat="total"><span class="stat-label">总记录</span><span class="stat-value">${total}</span></div>
                    <div class="stat-item" data-stat="viewed"><span class="stat-label">已观看</span><span class="stat-value">${viewed}</span></div>
                    <div class="stat-item" data-stat="browsed"><span class="stat-label">已浏览</span><span class="stat-value">${browsed}</span></div>
                    <div class="stat-item" data-stat="want"><span class="stat-label">想看</span><span class="stat-value">${want}</span></div>
                    <div class="stat-item" data-stat="last7"><span class="stat-label">近7天新增</span><span class="stat-value">${s.last7Days ?? 0}</span></div>
                    <div class="stat-item" data-stat="last30"><span class="stat-label">近30天新增</span><span class="stat-value">${s.last30Days ?? 0}</span></div>
                `;
            } catch (e) {
                recordsBox.innerHTML = '<div class="stat-item"><span class="stat-label">加载失败</span><span class="stat-value">-</span></div>';
            }
        }

        // 演员库概览
        const actorsBox = document.getElementById('homeActorsStatsContainer');
        if (actorsBox) {
            try {
                const a = await dbActorsStats();
                const female = a.byGender?.female ?? 0;
                const male = a.byGender?.male ?? 0;
                const unknown = a.byGender?.unknown ?? 0;
                const censored = a.byCategory?.censored ?? 0;
                const uncensored = a.byCategory?.uncensored ?? 0;
                actorsBox.innerHTML = `
                    <div class="stat-item" data-stat="total"><span class="stat-label">总演员数</span><span class="stat-value">${a.total ?? 0}</span></div>
                    <div class="stat-item" data-stat="female"><span class="stat-label">女性</span><span class="stat-value">${female}</span></div>
                    <div class="stat-item" data-stat="male"><span class="stat-label">男性</span><span class="stat-value">${male}</span></div>
                    <div class="stat-item" data-stat="unknown"><span class="stat-label">未知</span><span class="stat-value">${unknown}</span></div>
                    <div class="stat-item" data-stat="censored"><span class="stat-label">有码</span><span class="stat-value">${censored}</span></div>
                    <div class="stat-item" data-stat="uncensored"><span class="stat-label">无码</span><span class="stat-value">${uncensored}</span></div>
                    <div class="stat-item" data-stat="blacklisted"><span class="stat-label">黑名单</span><span class="stat-value">${a.blacklisted ?? 0}</span></div>
                    <div class="stat-item" data-stat="recentlyAdded"><span class="stat-label">最近新增</span><span class="stat-value">${a.recentlyAdded ?? 0}</span></div>
                    <div class="stat-item" data-stat="recentlyUpdated"><span class="stat-label">最近更新</span><span class="stat-value">${a.recentlyUpdated ?? 0}</span></div>
                `;
            } catch (e) {
                actorsBox.innerHTML = '<div class="stat-item"><span class="stat-label">加载失败</span><span class="stat-value">-</span></div>';
            }
        }

        // 新作品概览
        const worksBox = document.getElementById('homeNewWorksStatsContainer');
        if (worksBox) {
            try {
                const w = await dbNewWorksStats();
                worksBox.innerHTML = `
                    <div class="stat-item" data-stat="total"><span class="stat-label">总记录</span><span class="stat-value">${w.total ?? 0}</span></div>
                    <div class="stat-item" data-stat="unread"><span class="stat-label">未读</span><span class="stat-value">${w.unread ?? 0}</span></div>
                    <div class="stat-item" data-stat="today"><span class="stat-label">今日发现</span><span class="stat-value">${w.today ?? 0}</span></div>
                    <div class="stat-item" data-stat="week"><span class="stat-label">本周发现</span><span class="stat-value">${w.week ?? 0}</span></div>
                `;
            } catch (e) {
                worksBox.innerHTML = '<div class="stat-item"><span class="stat-label">加载失败</span><span class="stat-value">-</span></div>';
            }
        }
    } catch (e) {
        // 忽略首页缺失容器的情况
    }
}

async function refreshHomeOverview(): Promise<void> {
    await initStatsOverview();
    await initHomeSectionsOverview();
}

function bindHomeRefreshButton(): void {
    const btn = document.getElementById('homeRefreshBtn') as HTMLButtonElement | null;
    if (!btn) return;
    if ((btn as any)._bound) return;
    btn.addEventListener('click', async () => {
        try {
            btn.disabled = true;
            btn.classList.add('loading');
            await refreshHomeOverview();
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    });
    (btn as any)._bound = true;
}

function initInfoContainer(): void {
    const infoContainer = document.getElementById('versionInfoSidebar') || document.getElementById('infoContainer');
    if (!infoContainer) return;

    const version = import.meta.env.VITE_APP_VERSION || 'N/A';
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

    infoContainer.innerHTML = `
        <div class="info-item">
            <span class="info-label">Version:</span>
            <span class="info-value version-state-${versionState}" title="${getStateTitle(versionState)}">${version}</span>
        </div>
    `;
}

function initHelpSystem(): void {
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const helpBody = helpPanel?.querySelector('.help-body');

    if (!helpBtn || !helpPanel || !closeHelpBtn || !helpBody) return;

    // 甯姪鍐呭
    const helpContent = `
        <h3><i class="fas fa-rocket"></i> 蹇€熷紑濮?/h3>
        <ul>
            <li><strong>鎵撳紑浠〃鐩橈細</strong>鐐瑰嚮鎵╁睍鍥炬爣 鈫?杩涘叆鈥滅鐞嗛潰鏉库€濄€?/li>
            <li><strong>棣栨閰嶇疆锛?/strong>鍦ㄢ€滆缃?鈫?WebDAV鍚屾/鍔熻兘澧炲己/115缃戠洏/闅愮淇濇姢鈥濈瓑澶勫畬鎴愬紑鍏充笌鍙傛暟閰嶇疆銆?/li>
            <li><strong>绔嬪嵆浣撻獙锛?/strong>鍦ㄢ€滅暘鍙峰簱/婕斿憳搴?鏂颁綔鍝佲€濅腑娴忚銆佺瓫閫夈€佹壒閲忕鐞嗕綘鐨勮褰曘€?/li>
        </ul>

        <h3><i class="fas fa-database"></i> 鏁版嵁绠＄悊</h3>
        <ul>
            <li><strong>鐣彿搴擄細</strong>鍏ㄩ潰鐨勬湰鍦拌褰曞簱锛屾敮鎸佹悳绱€佹爣绛剧瓫閫夈€佹帓搴忋€佸垎椤点€佹壒閲忓埛鏂?鍒犻櫎绛夈€?/li>
            <li><strong>婕斿憳搴擄細</strong>鍚屾 JavDB 鏀惰棌婕斿憳锛屾敮鎸佹€у埆/鍒嗙被/鎷夐粦绛涢€変笌鎺掑簭锛屾敮鎸侀〉澶у皬璋冭妭銆?/li>
            <li><strong>鏂颁綔鍝侊細</strong>璁㈤槄婕斿憳骞惰嚜鍔ㄥ彂鐜板叾鏂颁綔锛屾彁渚涜繃婊ら厤缃€佺姸鎬佸悓姝ャ€佹竻鐞嗗凡璇讳笌鍒嗛〉娴忚銆?/li>
            <li><strong>鏁版嵁瀵煎叆/瀵煎嚭锛?/strong>鏈湴 JSON 澶囦唤涓庢仮澶嶏紱鏀寔 WebDAV 浜戠璺ㄨ澶囧浠戒笌鎭㈠銆?/li>
            <li><strong>缁熻姒傝锛?/strong>瀹炴椂缁熻鈥滃凡瑙傜湅/宸叉祻瑙?鎯崇湅鈥濈瓑鏁伴噺锛屼究浜庢€昏涓庢竻鐞嗐€?/li>
        </ul>

        <h3><i class="fas fa-user-circle"></i> 璐﹀彿淇℃伅</h3>
        <ul>
            <li><strong>璐﹀彿鐧诲綍锛?/strong>鏄剧ず骞剁鐞嗕綘鐨?JavDB 璐﹀彿淇℃伅锛堥偖绠便€佺敤鎴峰悕銆佺敤鎴风被鍨嬬瓑锛夈€?/li>
            <li><strong>浠呯敤浜庡悓姝ワ細</strong>璐﹀彿鍑嵁鍙湪鏈湴鐢ㄤ簬涓?JavDB 鐨勬暟鎹悓姝ワ紝瀹夊叏瀛樺偍銆?/li>
        </ul>

        <h3><i class="fas fa-sync-alt"></i> 鏁版嵁鍚屾锛圝avDB 鈬?鏈湴锛?/h3>
        <ul>
            <li><strong>鍚屾鍏ㄩ儴锛?/strong>浠?JavDB 鎷夊彇鈥滃凡瑙傜湅 + 鎯崇湅鈥濈殑鎵€鏈夎褰曞埌鏈湴銆?/li>
            <li><strong>鍒嗙被鍚屾锛?/strong>鍙崟鐙媺鍙栤€滄兂鐪嬧€濇垨鈥滃凡鐪嬧€濊褰曪紝鎸夐渶鏇存柊銆?/li>
            <li><strong>鏀惰棌婕斿憳锛?/strong>鏀寔鍚屾鏀惰棌婕斿憳锛屽苟鍙崟鐙ˉ鍏?鏇存柊婕斿憳鎬у埆淇℃伅銆?/li>
            <li><strong>杩涘害涓庡彇娑堬細</strong>灞曠ず鈥滆幏鍙栧垪琛?鎷夊彇璇︽儏鈥濅袱闃舵杩涘害锛屽彲闅忔椂鍙栨秷銆?/li>
        </ul>

        <h3><i class="fas fa-cloud"></i> WebDAV 澶囦唤涓庢仮澶?/h3>
        <ul>
            <li><strong>鑷姩/鎵嬪姩锛?/strong>鏀寔鎵嬪姩涓婁紶/涓嬭浇锛涘彲鎸夐渶寮€鍚嚜鍔ㄥ浠斤紝淇濇寔澶氳澶囦竴鑷淬€?/li>
            <li><strong>鏈嶅姟鍏煎锛?/strong>閫傞厤鍧氭灉浜戙€丯extcloud銆乀eraCloud銆乊andex 绛変富娴?WebDAV 鏈嶅姟銆?/li>
            <li><strong>鎭㈠鍚戝锛?/strong>鎻愪緵鈥滃揩鎹?鍚戝/涓撳鈥濅笁绉嶆ā寮忥紝鏀寔鏅鸿兘鍚堝苟銆佺瓥鐣ラ€夋嫨涓庡樊寮傚垎鏋愩€?/li>
            <li><strong>鍙€夊唴瀹癸細</strong>鍙垎鍒仮澶嶁€滄墿灞曡缃?瑙傜湅璁板綍/璐﹀彿淇℃伅/婕斿憳搴?鏃ュ織/鏂颁綔鍝佲€濈瓑鏁版嵁绫诲埆銆?/li>
        </ul>

        <h3><i class="fas fa-cloud-download-alt"></i> 115 缃戠洏闆嗘垚</h3>
        <ul>
            <li><strong>鎺ㄩ€佷笅杞斤細</strong>鍦ㄨ鎯呴〉鍙竴閿皢纾佸姏閾炬帴鎺ㄩ€佽嚦 115 绂荤嚎涓嬭浇銆?/li>
            <li><strong>楠岃瘉鐮佸鐞嗭細</strong>鑷姩澶勭悊楠岃瘉娴佺▼锛屽け璐ュ彲閲嶈瘯锛涙垚鍔熷彲鑷姩鑱斿姩鏍囪鐘舵€併€?/li>
            <li><strong>閰嶉渚ф爮锛?/strong>鑻ュ紑鍚?115-V2锛屽皢鍦ㄤ晶杈规爮鏄剧ず缃戠洏閰嶉锛堟€婚/宸茬敤/鍓╀綑锛夈€?/li>
        </ul>

        <h3><i class="fas fa-tv"></i> Emby 澧炲己</h3>
        <ul>
            <li><strong>淇℃伅鑱斿姩锛?/strong>鍦?Emby 椤甸潰澧炲己灞曠ず涓庤烦杞綋楠岋紙濡備笌鐣彿銆佹紨鍛樹俊鎭仈鍔級銆?/li>
        </ul>

        <h3><i class="fas fa-eye"></i> 鏄剧ず涓庡唴瀹硅繃婊?/h3>
        <ul>
            <li><strong>鍒楄〃闅愯棌锛?/strong>鍙湪璁块棶 JavDB 鏃惰嚜鍔ㄩ殣钘忊€滃凡鐪?宸叉祻瑙?VR鈥濆奖鐗囷紝鍑€鍖栧垪琛ㄣ€?/li>
            <li><strong>鏍峰紡鑷畾涔夛細</strong>鍙皟鏁存爣璁伴鑹层€佹樉绀轰綅缃笌鏍峰紡锛屽吋椤惧彲璇绘€т笌瀵嗗害銆?/li>
        </ul>

        <h3><i class="fas fa-search"></i> 鎼滅储寮曟搸璺宠浆</h3>
        <ul>
            <li><strong>鑷畾涔夊紩鎿庯細</strong>涓虹暘鍙风偣鍑婚厤缃涓閮ㄦ悳绱㈢珯鐐癸紝浣跨敤 <code>{{ID}}</code> 浣滀负鍗犱綅绗︺€?/li>
            <li><strong>鍥炬爣涓庨『搴忥細</strong>鍙缃睍绀哄浘鏍囦笌椤哄簭锛屼究浜庡揩閫熷垎娴佹绱€?/li>
        </ul>

        <h3><i class="fas fa-magic"></i> 鍔熻兘澧炲己</h3>
        <ul>
            <li><strong>纾侀摼鑱氬悎锛?/strong>鑷姩鑱氬悎绔欏唴澶栫鍔涜祫婧愬苟楂樹寒锛堝弬瑙佲€滃姛鑳藉寮?纾佸姏鑱氬悎鈥濓級銆?/li>
            <li><strong>蹇€熷鍒讹細</strong>涓€閿鍒剁暘鍙?鏍囬/纾侀摼绛変俊鎭紝鎻愬崌鏁寸悊鏁堢巼銆?/li>
            <li><strong>閿氱偣浼樺寲锛?/strong>鏀硅壇閾炬帴浜や簰锛氬乏閿墠鍙般€佸彸閿悗鍙版墦寮€锛涙敮鎸佹偓娴瑙堬紙鑻ユ湁婧愶級銆?/li>
            <li><strong>璇︽儏澧炲己锛?/strong>鍦ㄨ棰戣鎯呴〉鎻愪緵蹇嵎鏍囪銆佽烦杞笌杈呭姪淇℃伅灞曠ず銆?/li>
        </ul>

        <h3><i class="fas fa-shield-alt"></i> 闅愮淇濇姢</h3>
        <ul>
            <li><strong>鎴浘妯″紡锛?/strong>涓€閿ā绯婃晱鎰熷尯鍩燂紱鍒囨崲鏍囩鍚庤嚜鍔ㄦ仮澶嶉殣绉佹晥鏋溿€?/li>
            <li><strong>闅愮璁剧疆锛?/strong>鍙湪鈥滆缃?鈫?闅愮淇濇姢鈥濅腑鑷畾涔夌瓥鐣ヤ笌寮哄害銆?/li>
        </ul>

        <h3><i class="fas fa-keyboard"></i> 蹇嵎閿?/h3>
        <ul>
            <li><code>Ctrl + Shift + M</code>锛氬揩閫熸爣璁板綋鍓嶈棰戜负鈥滃凡瑙傜湅鈥濄€?/li>
            <li><code>Ctrl + Shift + W</code>锛氬揩閫熸爣璁板綋鍓嶈棰戜负鈥滄兂鐪嬧€濄€?/li>
            <li><strong>澶氶€夋搷浣滐細</strong>鏀寔 Ctrl/Shift 缁勫悎澶氶€夛紱鐐瑰嚮鐘舵€佹爣绛惧彲蹇€熺瓫閫夈€?/li>
        </ul>

        <h3><i class="fas fa-list-alt"></i> 鏃ュ織涓庤瘖鏂?/h3>
        <ul>
            <li><strong>杩愯鏃ュ織锛?/strong>璁板綍鎿嶄綔銆佸憡璀︿笌閿欒锛屾敮鎸佹寜绾у埆绛涢€夈€佹竻绌恒€佸鍑恒€?/li>
            <li><strong>缃戠粶娴嬭瘯锛?/strong>娴嬭瘯 WebDAV 杩為€氭€с€佸搷搴旀椂闂翠笌鍚屾鎬ц兘锛屼究浜庤瘖鏂€?/li>
        </ul>

        <h3><i class="fas fa-tools"></i> 楂樼骇宸ュ叿</h3>
        <ul>
            <li><strong>鏁版嵁缁撴瀯妫€鏌ワ細</strong>鑷姩妫€娴嬪苟淇鍘嗗彶鏁版嵁鏍煎紡闂锛屼繚鎸佷竴鑷存€с€?/li>
            <li><strong>鏁版嵁杩佺Щ锛?/strong>浠庢棫鐗堟湰鍗囩骇鍚庤嚜鍔ㄨ縼绉绘暟鎹粨鏋勶紝闄勮繘搴︽樉绀恒€?/li>
            <li><strong>JSON 缂栬緫锛?/strong>涓鸿繘闃剁敤鎴锋彁渚涘師濮?JSON 鏌ョ湅涓庣紪杈戣兘鍔涳紙璇疯皑鎱庢搷浣滐級銆?/li>
        </ul>

        <h3><i class="fas fa-question-circle"></i> 甯歌闂</h3>
        <ul>
            <li><strong>鏁版嵁涓㈠け锛?/strong>鍙€氳繃 WebDAV 鎭㈠锛涙垨瀵煎叆浣犲厛鍓嶅鍑虹殑鏈湴 JSON 澶囦唤銆?/li>
            <li><strong>鍚屾寮傚父锛?/strong>妫€鏌ョ綉缁滀笌鐧诲綍鐘舵€侊紝鏌ョ湅鈥滄棩蹇椻€濊幏鍙栬缁嗛敊璇苟瀹氫綅銆?/li>
            <li><strong>鎬ц兘寤鸿锛?/strong>澶ч噺璁板綍鏃跺缓璁畾鏈熸竻鐞嗘棤鐢ㄦ暟鎹紝鍚堢悊璁剧疆骞跺彂浠ユ彁鍗囦綋楠屻€?/li>
        </ul>

        <div class="help-footer">
            <p><i class="fas fa-info-circle"></i> <strong>鎻愮ず锛?/strong>鎵€鏈夋暟鎹粯璁ゅ瓨鍌ㄥ湪鏈湴娴忚鍣ㄤ腑锛屽缓璁紑鍚?WebDAV 鑷姩澶囦唤浠ラ伩鍏嶄涪澶便€?/p>
            <p><i class="fas fa-github"></i> 娆㈣繋鍦?GitHub 鎻愪氦 Issue/Discussion 鍙嶉闂鎴栨彁鍑哄缓璁€?/p>
        </div>
    `;

    helpBody.innerHTML = helpContent;

    // 鏄剧ず甯姪闈㈡澘
    helpBtn.addEventListener('click', () => {
        helpPanel.classList.remove('hidden');
        helpPanel.classList.add('visible');
    });

    // 鍏抽棴甯姪闈㈡澘
    const closeHelp = () => {
        helpPanel.classList.remove('visible');
        helpPanel.classList.add('hidden');
    };

    closeHelpBtn.addEventListener('click', closeHelp);

    // 鐐瑰嚮鑳屾櫙鍏抽棴
    helpPanel.addEventListener('click', (e) => {
        if (e.target === helpPanel) {
            closeHelp();
        }
    });

    // ESC閿叧闂?
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpPanel.classList.contains('visible')) {
            closeHelp();
        }
    });
}

function updateSyncStatus(): void {
    try {
        const lastSyncTimeElement = document.getElementById('lastSyncTime') as HTMLSpanElement;
        const lastSyncTimeSettings = document.getElementById('last-sync-time') as HTMLSpanElement;
        const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;

        // 瀹夊叏鍦拌幏鍙?lastSync 鏃堕棿
        const webdavSettings = STATE.settings?.webdav || {};
        const lastSync = webdavSettings.lastSync || '';

        // Update sidebar sync status
        if (lastSyncTimeElement && syncIndicator) {
            updateSyncDisplay(lastSyncTimeElement, syncIndicator, lastSync);
        }

        // Update settings page sync time
        if (lastSyncTimeSettings) {
            lastSyncTimeSettings.textContent = lastSync ? new Date(lastSync).toLocaleString('zh-CN') : '浠庢湭';
        }
    } catch (error) {
        console.error('鏇存柊鍚屾鐘舵€佹椂鍑洪敊:', error);
        // 鍦ㄥ嚭閿欐椂璁剧疆榛樿鐘舵€?
        const lastSyncTimeElement = document.getElementById('lastSyncTime') as HTMLSpanElement;
        const lastSyncTimeSettings = document.getElementById('last-sync-time') as HTMLSpanElement;
        const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;

        if (lastSyncTimeElement) {
            lastSyncTimeElement.textContent = '浠庢湭';
        }
        if (lastSyncTimeSettings) {
            lastSyncTimeSettings.textContent = '浠庢湭';
        }
        if (syncIndicator) {
            syncIndicator.className = 'sync-indicator';
            const statusText = syncIndicator.querySelector('.sync-status-text');
            if (statusText) {
                statusText.textContent = '未同步';
            }
        }
    }
}
function updateSyncDisplay(lastSyncTimeElement: HTMLSpanElement, syncIndicator: HTMLDivElement, lastSync: string): void {
    if (lastSync) {
        const syncDate = new Date(lastSync);
        const now = new Date();
        const diffMs = now.getTime() - syncDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timeText = '';
        if (diffDays > 0) {
            timeText = `${diffDays}天前`;
        } else if (diffHours > 0) {
            timeText = `${diffHours}小时前`;
        } else {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            timeText = diffMinutes > 0 ? `${diffMinutes}分钟前` : '刚刚';
        }

        lastSyncTimeElement.textContent = timeText;
        lastSyncTimeElement.title = syncDate.toLocaleString('zh-CN');

        // Update sync status
        syncIndicator.className = 'sync-indicator';
        if (diffDays > 7) {
            syncIndicator.classList.add('error');
            syncIndicator.querySelector('.sync-status-text')!.textContent = '需要同步';
        } else if (diffDays > 1) {
            syncIndicator.classList.add('synced');
            syncIndicator.querySelector('.sync-status-text')!.textContent = '已同步';
        } else {
            syncIndicator.classList.add('synced');
            syncIndicator.querySelector('.sync-status-text')!.textContent = '最新';
        }
    } else {
        lastSyncTimeElement.textContent = '从未';
        lastSyncTimeElement.title = '尚未进行过同步';
        syncIndicator.className = 'sync-indicator';
        const text = syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement | null;
        if (text) text.textContent = '未同步';
    }
}
function setSyncingStatus(isUploading: boolean = false): void {
    const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;
    if (!syncIndicator) return;

    syncIndicator.className = 'sync-indicator syncing';
    const statusText = syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement | null;
    if (statusText) {
        statusText.textContent = isUploading ? '上传中...' : '同步中...';
    }
}
function initSidebarActions(): void {
    // 初始化侧边栏折叠功能
    initSidebarToggle();

    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    const syncNowBtn = document.getElementById('syncNow') as HTMLButtonElement;
    const syncDownBtn = document.getElementById('syncDown') as HTMLButtonElement;
    const fileListContainer = document.getElementById('fileListContainer') as HTMLDivElement;
    const fileList = document.getElementById('fileList') as HTMLUListElement;

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            logAsync('INFO', '用户点击了“导出到本地”按钮');

            const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);
            const actorRecords = await getValue(STORAGE_KEYS.ACTOR_RECORDS, {});

            const dataToExport = {
                settings: STATE.settings,
                data: STATE.records.reduce((acc, record) => {
                    acc[record.id] = record as any;
                    return acc;
                }, {} as Record<string, VideoRecord>),
                userProfile,
                actorRecords
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            showMessage('数据导出成功（包含账号信息与演员库）', 'success');
            logAsync('INFO', '本地数据导出成功（包含账号信息与演员库）');
        });
    }

    const importFileInput = document.getElementById('importFile') as HTMLInputElement;
    if (importFileInput) {
        importFileInput.addEventListener('change', (event) => {
            logAsync('INFO', '用户选择了本地文件进行导入');
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                logAsync('WARN', '用户取消了文件选择');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    showImportModal(text);
                } else {
                    showMessage('Failed to read file content.', 'error');
                    logAsync('ERROR', '无法读取文件内容，内容非字符串');
                }
            };
            reader.onerror = () => {
                showMessage(`Error reading file: ${reader.error}`, 'error');
                logAsync('ERROR', '读取导入文件时发生错误', { error: reader.error as any });
            };
            reader.readAsText(file);

            importFileInput.value = '';
        });
    }

    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', () => {
            syncNowBtn.textContent = '正在上传...';
            syncNowBtn.disabled = true;
            setSyncingStatus(true);
            logAsync('INFO', '用户点击“立即上传至云端”，开始上传数据');

            chrome.runtime.sendMessage({ type: 'webdav-upload' }, (response) => {
                syncNowBtn.textContent = '立即上传至云端';
                syncNowBtn.disabled = false;

                if (response?.success) {
                    showMessage('数据已成功上传至云端', 'success');
                    logAsync('INFO', '数据成功上传至云端');
                    setTimeout(() => updateSyncStatus(), 500);
                } else {
                    showMessage(`上传失败: ${response?.error}`, 'error');
                    logAsync('ERROR', '数据上传至云端失败', { error: response?.error });
                    setTimeout(() => updateSyncStatus(), 500);
                }
            });
        });
    }

    if (syncDownBtn) {
        syncDownBtn.addEventListener('click', () => {
            logAsync('INFO', '用户点击“从云端恢复”，打开恢复弹窗');
            showWebDAVRestoreModal();
        });
    }
}

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'show-toast') {
        // 鍦╠ashboard椤甸潰鏄剧ずtoast閫氱煡
        showMessage(message.message, message.toastType || 'info');
    }
});

/**
 * 鍒濆鍖栦晶杈规爮鏀剁缉鍔熻兘
 */
function initSidebarToggle(): void {
    const SIDEBAR_STATE_KEY = 'sidebar-collapsed';
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    const toggleBtn = document.getElementById('sidebarToggleBtn') as HTMLButtonElement;

    if (!sidebar || !toggleBtn) {
        console.warn('侧边栏或切换按钮未找到');
        return;
    }

    const restoreSidebarState = async () => {
        try {
            const isCollapsed = await getValue(SIDEBAR_STATE_KEY, false);
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        } catch (error) {
            console.error('恢复侧边栏状态失败', error);
        }
    };

    const saveSidebarState = async (isCollapsed: boolean) => {
        try {
            await setValue(SIDEBAR_STATE_KEY, isCollapsed);
        } catch (error) {
            console.error('保存侧边栏状态失败', error);
        }
    };

    const toggleSidebar = () => {
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            saveSidebarState(false);
        } else {
            sidebar.classList.add('collapsed');
            saveSidebarState(true);
        }
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.style.transform = sidebar.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    };

    toggleBtn.addEventListener('click', toggleSidebar);
    restoreSidebarState();
}

// Export functions for use in other modules
export { updateSyncStatus };

  // Make updateSyncStatus available globally
  (window as any).updateSyncStatus = updateSyncStatus;

function runQASelfCheck(): void {
    try {
        const requiredLinks = [
            './styles/main.css',
            './styles/_tabs.css',
            './styles/_modal.css',
            './styles/_toast.css',
            './styles/_stats.css',
            './styles/_userProfile.css',
            './styles/components/toggle.css',
        ];
        const missingHeadCss = requiredLinks.filter(href => !document.querySelector(`link[href$="${href}"]`));

        const modalsRoot = document.getElementById('dashboard-modals-root');
        const modalIds = [
            'confirmationModal', 'smartRestoreModal', 'import-modal', 'migration-modal',
            'data-check-modal', 'helpPanel', 'webdavRestoreModal', 'conflictResolutionModal',
            'restoreResultModal', 'dataViewModal', 'filterRuleModal', 'orchestratorModal',
        ];
        const missingModals: string[] = [];
        const duplicateModals: string[] = [];
        for (const id of modalIds) {
            const nodes = document.querySelectorAll(`[id="${id}"]`);
            if (nodes.length === 0) missingModals.push(id);
            if (nodes.length > 1) duplicateModals.push(id);
        }

        if (!modalsRoot) {
            console.warn('[QA] 未找到 #dashboard-modals-root');
        }
        if (missingHeadCss.length) {
            console.warn('[QA] 缺少基础样式（<head> 未加载）：', missingHeadCss);
        }
        if (missingModals.length) {
            console.warn('[QA] 缺少以下模态框 ID：', missingModals);
        }
        if (duplicateModals.length) {
            console.warn('[QA] 发现重复的模态框 ID：', duplicateModals);
        }
        if (modalsRoot && missingHeadCss.length === 0 && missingModals.length === 0 && duplicateModals.length === 0) {
            console.info('[QA] 基础自检通过：样式与模态框挂载正常');
        }
    } catch (e) {
        console.warn('[QA] 自检异常：', e);
    }
}













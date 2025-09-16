// @ts-nocheck

import { initializeGlobalState, STATE, cleanupSearchEngines } from './state';
import { initRecordsTab } from './tabs/records';
import { actorsTab } from './tabs/actors';
import { newWorksTab } from './tabs/newWorks';
import { syncTab } from './tabs/sync';
import { logsTab } from './tabs/logs';
import { initSettingsTab } from './tabs/settings';
// initAdvancedSettingsTab 已迁移到模块化设置系统中
// initLogsTab 已迁移到模块化设置系统中
// initAISettingsTab 已迁移到模块化设置系统中
// initializeNetworkTestTab 已迁移到模块化设置系统中
// drive115 功能已迁移到模块化设置系统中
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
import './ui/dataViewModal'; // 确保dataViewModal被初始化
import { getDrive115V2Service } from '../services/drive115v2';
import { Drive115TasksManager } from './tabs/drive115Tasks';

// 根据设置显隐左侧 115 网盘侧边栏容器（规则：V1 或 V2 任一开启即显示）
function updateDrive115SidebarVisibility(enabledParam?: boolean, enableV2Param?: boolean): void {
    const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
    if (!section) return;
    const enabled = typeof enabledParam === 'boolean' ? enabledParam : !!STATE.settings?.drive115?.enabled;
    const enableV2 = typeof enableV2Param === 'boolean' ? enableV2Param : !!STATE.settings?.drive115?.enableV2;
    // 只要任一开启就显示
    section.style.display = (enabled || enableV2) ? '' : 'none';
}

// 预置一个全局占位，避免其他模块在真实函数绑定前调用导致 ReferenceError
(window as any).initDrive115QuotaSidebar = (window as any).initDrive115QuotaSidebar || (() => {});
// 暴露给全局，避免作用域问题导致引用错误（在真实函数声明后会被覆盖为实现）
(window as any).initDrive115QuotaSidebar = initDrive115QuotaSidebar;

/**
 * 设置Dashboard隐私保护监听 - 简化版，只监听标签切换
 */
async function setupDashboardPrivacyMonitoring() {
    try {
        log.privacy('Setting up simplified Dashboard privacy monitoring...');

        const reapplyPrivacy = async () => {
            try {
                if (window.privacyManager) {
                    const state = window.privacyManager.getState();
                    if (state.isBlurred) {
                        log.privacy('Reapplying privacy protection after tab change...');
                        await window.privacyManager.forceReapplyScreenshotMode();
                    }

async function initDrive115QuotaSidebar(): Promise<void> {
    try {
        // 侧边栏显示规则：V1 或 V2 任一开启
        const enabled = !!STATE.settings?.drive115?.enabled;
        const enableV2 = !!STATE.settings?.drive115?.enableV2;
        const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
        if (!(enabled || enableV2)) {
            if (section) section.style.display = 'none';
            return;
        }

        // 若启用但不是V2（即V1模式），显示容器但不加载配额
        if (enabled && !enableV2) {
            if (section) section.style.display = '';
            const box = document.getElementById('drive115QuotaSidebar');
            if (box) box.innerHTML = '';
            return;
        }

        // V2 启用：确保容器显示并加载配额
        if (section) section.style.display = '';
        const box = document.getElementById('drive115QuotaSidebar');
        if (!box) return;

        const svc = getDrive115V2Service();
        // 获取可用 accessToken（自动刷新）
        const tokenRet = await svc.getValidAccessToken();
        if (!('success' in tokenRet) || !tokenRet.success) {
            box.innerHTML = `
                <div style="font-size:12px; color:#999;">
                    无法获取配额：${(tokenRet as any)?.message || '未启用或缺少凭据'}
                    <div style="margin-top:6px;">
                        <a href="#tab-settings/drive115-settings" style="color:#4a90e2; text-decoration:none;">前往设置 115</a>
                    </div>
                </div>
            `;
            return;
        }

        const quotaRet = await svc.getQuotaInfo({ accessToken: tokenRet.accessToken });

/**
 * 顶层定义：初始化左侧 115 配额侧边栏（V2）。
 * 注意：与上方局部作用域中的同名函数不同，此处为模块级，确保在 DOMContentLoaded 中可用。
 */
async function initDrive115QuotaSidebar(): Promise<void> {
    try {
        // 侧边栏显示规则：V1 或 V2 任一开启
        const enabled = !!STATE.settings?.drive115?.enabled;
        const enableV2 = !!STATE.settings?.drive115?.enableV2;
        const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
        if (!(enabled || enableV2)) {
            if (section) section.style.display = 'none';
            return;
        }

        // 若启用但不是V2（即V1模式），显示容器但不加载配额
        if (enabled && !enableV2) {
            if (section) section.style.display = '';
            const box = document.getElementById('drive115QuotaSidebar');
            if (box) box.innerHTML = '';
            return;
        }

        // V2 启用：确保容器显示并加载配额
        if (section) section.style.display = '';
        const box = document.getElementById('drive115QuotaSidebar');
        if (!box) return;

        const svc = getDrive115V2Service();
        // 获取可用 accessToken（自动刷新）
        const tokenRet = await svc.getValidAccessToken();
        if (!('success' in tokenRet) || !tokenRet.success) {
            box.innerHTML = `
                <div style="font-size:12px; color:#999;">
                    无法获取配额：${(tokenRet as any)?.message || '未启用或缺少凭据'}
                    <div style="margin-top:6px;">
                        <a href="#tab-settings/drive115-settings" style="color:#4a90e2; text-decoration:none;">前往设置 115</a>
                    </div>
                </div>
            `;
            return;
        }

        const quotaRet = await svc.getQuotaInfo({ accessToken: tokenRet.accessToken });
        if (!quotaRet.success) {
            box.innerHTML = `
                <div style="font-size:12px; color:#d9534f;">获取配额失败：${quotaRet.message || '未知错误'}</div>
            `;
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
    const surplus = typeof info.surplus === 'number' ? info.surplus : (typeof used === 'number' && typeof total === 'number' ? Math.max(0, total - used) : undefined);

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
        : '<div style="font-size:12px; color:#999;">暂无总额信息</div>';

    box.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>总额</span>
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
        if (!quotaRet.success) {
            box.innerHTML = `
                <div style="font-size:12px; color:#d9534f;">获取配额失败：${quotaRet.message || '未知错误'}</div>
            `;
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
    const surplus = typeof info.surplus === 'number' ? info.surplus : (typeof used === 'number' && typeof total === 'number' ? Math.max(0, total - used) : undefined);

    // 进度百分比（如果能算出来）
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
        : '<div style="font-size:12px; color:#999;">暂无总额信息</div>';

    box.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>总额</span>
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
                }
            } catch (error) {
                console.error('Failed to reapply privacy:', error);
            }
        };

        // 只监听hash变化（标签页切换）- 最简单可靠的方式
        let lastHash = window.location.hash;
        const checkHashChange = () => {
            const currentHash = window.location.hash;
            if (currentHash !== lastHash) {
                log.privacy(`Tab changed from ${lastHash} to ${currentHash}`);
                lastHash = currentHash;
                setTimeout(reapplyPrivacy, 300); // 减少延迟时间
            }
        };

        // 定期检查hash变化（避免事件监听器的复杂性）
        setInterval(checkHashChange, 1000);

        log.privacy('Simplified Dashboard privacy monitoring setup complete');
    } catch (error) {
        console.error('Failed to setup Dashboard privacy monitoring:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initializeGlobalState();

    // 日志控制器已在模块加载时自动初始化，这里不需要重复初始化

    // 清理搜索引擎配置中的测试数据
    await cleanupSearchEngines();

    // 初始化隐私保护系统
    try {
        log.privacy('Initializing privacy system for Dashboard...');
        const { initializePrivacySystem } = await import('../services/privacy');
        await initializePrivacySystem();
        log.privacy('Privacy system initialized successfully for Dashboard');

        // 设置Dashboard特定的隐私监听
        setupDashboardPrivacyMonitoring();
    } catch (error) {
        console.error('Failed to initialize privacy system for Dashboard:', error);
    }

    // 设置标题图标URL
    const titleIcon = document.getElementById('title-icon') as HTMLImageElement;
    if (titleIcon) {
        titleIcon.src = chrome.runtime.getURL('assets/favicon-32x32.png');
        titleIcon.onload = () => {
            titleIcon.style.display = 'block';
        };
        titleIcon.onerror = () => {
            // 如果图片加载失败，隐藏图片元素
            titleIcon.style.display = 'none';
        };
    }

    // 115 服务通过统一路由按需初始化，无需在此显式初始化

    await initTabs();
    initRecordsTab();
    // initActorsTab(); // 延迟初始化，只在用户点击演员库标签页时才加载
    // initNewWorksTab(); // 延迟初始化，只在用户点击新作品标签页时才加载
    initSyncTab();
    initSettingsTab();
    // initAdvancedSettingsTab(); // 已迁移到模块化设置系统
    // initAISettingsTab(); // 已迁移到模块化设置系统
    // initDrive115Tab(); // 已迁移到模块化设置系统
    // initLogsTab(); // 已迁移到模块化设置系统
    initSidebarActions();
    initUserProfileSection();
    // initDataSyncSection(); // 移除重复调用，由 initSyncTab 处理
    initStatsOverview();
    initInfoContainer();
    initHelpSystem();
    initModal();
    // 根据设置控制 115 侧边栏显示，并在启用时（V2）加载配额
    updateDrive115SidebarVisibility();
    if (STATE.settings?.drive115?.enableV2) {
        (window as any).initDrive115QuotaSidebar?.();
    }
    updateSyncStatus();
    // 监听来自设置页的配额刷新事件
    window.addEventListener('drive115:refreshQuota' as any, () => {
        (window as any).initDrive115QuotaSidebar?.();
    });
    // 监听 115 启用状态变更，动态显隐侧边栏并在启用（V2）时加载配额
    window.addEventListener('drive115:enabled-changed' as any, (e: any) => {
        const enabled = !!(e?.detail?.enabled);
        const enableV2 = !!(e?.detail?.enableV2);
        updateDrive115SidebarVisibility(enabled, enableV2);
        if (enableV2 || enabled) {
            // V1 或 V2 任一开启先更新容器；仅当 V2 时加载配额
            if (enableV2) (window as any).initDrive115QuotaSidebar?.();
        }
    });
});

/**
 * 初始化演员库标签页
 */
async function initActorsTab(): Promise<void> {
    try {
        await actorsTab.initActorsTab();
    } catch (error) {
        console.error('初始化演员库标签页失败:', error);
    }
}

/**
 * 初始化新作品标签页
 */
async function initNewWorksTab(): Promise<void> {
    try {
        await newWorksTab.initialize();
    } catch (error) {
        console.error('初始化新作品标签页失败:', error);
    }
}

/**
 * 初始化数据同步标签页
 */
async function initSyncTab(): Promise<void> {
    try {
        await syncTab.initSyncTab();
    } catch (error) {
        console.error('初始化数据同步标签页失败:', error);
    }
}

async function initTabs(): Promise<void> {
    try {
        const tabs = document.querySelectorAll('.tab-link');
        const contents = document.querySelectorAll('.tab-content');

        // 确保 NodeList 存在且不为空
        if (!tabs || tabs.length === 0) {
            console.warn('未找到标签页链接元素');
            return;
        }

        if (!contents || contents.length === 0) {
            console.warn('未找到标签页内容元素');
            return;
        }

        const switchTab = (tabButton: Element | null) => {
            if (!tabButton) return;
            const tabId = tabButton.getAttribute('data-tab');
            if (!tabId) return;

            try {
                // 安全地遍历 NodeList
                if (tabs && tabs.forEach) {
                    tabs.forEach(t => t.classList.remove('active'));
                }
                if (contents && contents.forEach) {
                    contents.forEach(c => c.classList.remove('active'));
                }

                tabButton.classList.add('active');
                document.getElementById(tabId)?.classList.add('active');

                if (history.pushState) {
                    history.pushState(null, '', `#${tabId}`);
                } else {
                    location.hash = `#${tabId}`;
                }
            } catch (error) {
                console.error('切换标签页时出错:', error);
            }
        };

        // 安全地为每个标签页添加事件监听器
        if (tabs && tabs.forEach) {
            tabs.forEach(tab => {
                try {
                    tab.addEventListener('click', async () => {
                        switchTab(tab);
                        const tabId = tab.getAttribute('data-tab');

                        // 延迟初始化演员库标签页
                        if (tabId === 'tab-actors' && !actorsTab.isInitialized) {
                            try {
                                await initActorsTab();
                            } catch (error) {
                                console.error('延迟初始化演员库标签页失败:', error);
                            }
                        }

                        // 延迟初始化新作品标签页
                        if (tabId === 'tab-new-works' && !newWorksTab.isInitialized) {
                            try {
                                await initNewWorksTab();
                            } catch (error) {
                                console.error('延迟初始化新作品标签页失败:', error);
                            }
                        }

                        // 延迟初始化日志标签页
                        if (tabId === 'tab-logs' && !logsTab.isInitialized) {
                            try {
                                await logsTab.initialize();
                            } catch (error) {
                                console.error('延迟初始化日志标签页失败:', error);
                            }
                        }

                        // 延迟初始化115任务标签页
                        if (tabId === 'tab-drive115-tasks') {
                            try {
                                if (!window.drive115TasksManager) {
                                    window.drive115TasksManager = new Drive115TasksManager();
                                    await window.drive115TasksManager.initialize();
                                }
                            } catch (error) {
                                console.error('延迟初始化115任务标签页失败:', error);
                            }
                        }
                    });
                } catch (error) {
                    console.error('为标签页添加事件监听器时出错:', error);
                }
            });
        }

        // 解析当前hash，支持二级路径
        const fullHash = window.location.hash.substring(1) || 'tab-records';
        const [mainTab, subSection] = fullHash.split('/');
        const targetTab = document.querySelector(`.tab-link[data-tab="${mainTab}"]`);
        switchTab(targetTab || (tabs.length > 0 ? tabs[0] : null));

        // 如果是设置页面且有子页面，存储子页面信息供设置页面使用
        if (mainTab === 'tab-settings' && subSection) {
            // 将子页面信息存储到全局状态中，供设置页面初始化时使用
            (window as any).initialSettingsSection = subSection;
        }

        // 页面加载时根据当前 hash 初始化对应的标签页
        if (mainTab === 'tab-actors' && !actorsTab.isInitialized) {
            initActorsTab().catch(error => {
                console.error('页面加载时初始化演员库标签页失败:', error);
            });
        }

        if (mainTab === 'tab-new-works' && !newWorksTab.isInitialized) {
            initNewWorksTab().catch(error => {
                console.error('页面加载时初始化新作品标签页失败:', error);
            });
        }

        // 添加hashchange事件监听器，处理URL变化
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.substring(1) || 'tab-records';
            const [newMainTab, newSubSection] = newHash.split('/');

            // 如果主标签页发生变化，切换主标签页
            const currentActiveTab = document.querySelector('.tab-link.active');
            const currentTabId = currentActiveTab?.getAttribute('data-tab');

            if (currentTabId !== newMainTab) {
                const newTargetTab = document.querySelector(`.tab-link[data-tab="${newMainTab}"]`);
                if (newTargetTab) {
                    switchTab(newTargetTab);

                    // 延迟初始化相关标签页
                    if (newMainTab === 'tab-actors' && !actorsTab.isInitialized) {
                        initActorsTab().catch(error => {
                            console.error('延迟初始化演员库标签页失败:', error);
                        });
                    }

                    if (newMainTab === 'tab-new-works' && !newWorksTab.isInitialized) {
                        initNewWorksTab().catch(error => {
                            console.error('延迟初始化新作品标签页失败:', error);
                        });
                    }
                }
            }

            // 如果是设置页面且有子页面，通知设置页面切换
            if (newMainTab === 'tab-settings' && newSubSection) {
                // 触发自定义事件，通知设置页面切换子页面
                window.dispatchEvent(new CustomEvent('settingsSubSectionChange', {
                    detail: { section: newSubSection }
                }));
            }
        });
    } catch (error) {
        console.error('初始化标签页时出错:', error);
    }
}

function initStatsOverview(): void {
    const container = document.getElementById('stats-overview');
    if (!container) return;

    try {
        // 确保 STATE.records 是数组
        const records = Array.isArray(STATE.records) ? STATE.records : [];

        const totalRecords = records.length;
        const viewedCount = records.filter(r => r && r.status === VIDEO_STATUS.VIEWED).length;
        const wantCount = records.filter(r => r && r.status === VIDEO_STATUS.WANT).length;
        const browsedCount = records.filter(r => r && r.status === VIDEO_STATUS.BROWSED).length;

        container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">${totalRecords}</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">${viewedCount}</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">${browsedCount}</span>
                <span class="stat-label">已浏览</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">${wantCount}</span>
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

function initInfoContainer(): void {
    const infoContainer = document.getElementById('versionInfoSidebar') || document.getElementById('infoContainer');
    if (!infoContainer) return;

    const version = import.meta.env.VITE_APP_VERSION || 'N/A';
    const versionState = import.meta.env.VITE_APP_VERSION_STATE || 'unknown';

    const getStateTitle = (state: string): string => {
        switch (state) {
            case 'clean':
                return '此版本基于一个干净的、已完全提交的 Git 工作区构建。';
            case 'dev':
                return '此版本包含已暂存但尚未提交的更改 (dev/staged)。';
            case 'dirty':
                return '警告：此版本包含未跟踪或未暂存的本地修改 (dirty)！';
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

    // 帮助内容
    const helpContent = `
        <h3><i class="fas fa-rocket"></i> 快速开始</h3>
        <ul>
            <li><strong>打开仪表盘：</strong>点击扩展图标 → 进入“管理面板”。</li>
            <li><strong>首次配置：</strong>在“设置 → WebDAV同步/功能增强/115网盘/隐私保护”等处完成开关与参数配置。</li>
            <li><strong>立即体验：</strong>在“番号库/演员库/新作品”中浏览、筛选、批量管理你的记录。</li>
        </ul>

        <h3><i class="fas fa-database"></i> 数据管理</h3>
        <ul>
            <li><strong>番号库：</strong>全面的本地记录库，支持搜索、标签筛选、排序、分页、批量刷新/删除等。</li>
            <li><strong>演员库：</strong>同步 JavDB 收藏演员，支持性别/分类/拉黑筛选与排序，支持页大小调节。</li>
            <li><strong>新作品：</strong>订阅演员并自动发现其新作，提供过滤配置、状态同步、清理已读与分页浏览。</li>
            <li><strong>数据导入/导出：</strong>本地 JSON 备份与恢复；支持 WebDAV 云端跨设备备份与恢复。</li>
            <li><strong>统计概览：</strong>实时统计“已观看/已浏览/想看”等数量，便于总览与清理。</li>
        </ul>

        <h3><i class="fas fa-user-circle"></i> 账号信息</h3>
        <ul>
            <li><strong>账号登录：</strong>显示并管理你的 JavDB 账号信息（邮箱、用户名、用户类型等）。</li>
            <li><strong>仅用于同步：</strong>账号凭据只在本地用于与 JavDB 的数据同步，安全存储。</li>
        </ul>

        <h3><i class="fas fa-sync-alt"></i> 数据同步（JavDB ⇨ 本地）</h3>
        <ul>
            <li><strong>同步全部：</strong>从 JavDB 拉取“已观看 + 想看”的所有记录到本地。</li>
            <li><strong>分类同步：</strong>可单独拉取“想看”或“已看”记录，按需更新。</li>
            <li><strong>收藏演员：</strong>支持同步收藏演员，并可单独补全/更新演员性别信息。</li>
            <li><strong>进度与取消：</strong>展示“获取列表/拉取详情”两阶段进度，可随时取消。</li>
        </ul>

        <h3><i class="fas fa-cloud"></i> WebDAV 备份与恢复</h3>
        <ul>
            <li><strong>自动/手动：</strong>支持手动上传/下载；可按需开启自动备份，保持多设备一致。</li>
            <li><strong>服务兼容：</strong>适配坚果云、Nextcloud、TeraCloud、Yandex 等主流 WebDAV 服务。</li>
            <li><strong>恢复向导：</strong>提供“快捷/向导/专家”三种模式，支持智能合并、策略选择与差异分析。</li>
            <li><strong>可选内容：</strong>可分别恢复“扩展设置/观看记录/账号信息/演员库/日志/新作品”等数据类别。</li>
        </ul>

        <h3><i class="fas fa-cloud-download-alt"></i> 115 网盘集成</h3>
        <ul>
            <li><strong>推送下载：</strong>在详情页可一键将磁力链接推送至 115 离线下载。</li>
            <li><strong>验证码处理：</strong>自动处理验证流程，失败可重试；成功可自动联动标记状态。</li>
            <li><strong>配额侧栏：</strong>若开启 115-V2，将在侧边栏显示网盘配额（总额/已用/剩余）。</li>
        </ul>

        <h3><i class="fas fa-tv"></i> Emby 增强</h3>
        <ul>
            <li><strong>信息联动：</strong>在 Emby 页面增强展示与跳转体验（如与番号、演员信息联动）。</li>
        </ul>

        <h3><i class="fas fa-eye"></i> 显示与内容过滤</h3>
        <ul>
            <li><strong>列表隐藏：</strong>可在访问 JavDB 时自动隐藏“已看/已浏览/VR”影片，净化列表。</li>
            <li><strong>样式自定义：</strong>可调整标记颜色、显示位置与样式，兼顾可读性与密度。</li>
        </ul>

        <h3><i class="fas fa-search"></i> 搜索引擎跳转</h3>
        <ul>
            <li><strong>自定义引擎：</strong>为番号点击配置多个外部搜索站点，使用 <code>{{ID}}</code> 作为占位符。</li>
            <li><strong>图标与顺序：</strong>可设置展示图标与顺序，便于快速分流检索。</li>
        </ul>

        <h3><i class="fas fa-magic"></i> 功能增强</h3>
        <ul>
            <li><strong>磁链聚合：</strong>自动聚合站内外磁力资源并高亮（参见“功能增强/磁力聚合”）。</li>
            <li><strong>快速复制：</strong>一键复制番号/标题/磁链等信息，提升整理效率。</li>
            <li><strong>锚点优化：</strong>改良链接交互：左键前台、右键后台打开；支持悬浮预览（若有源）。</li>
            <li><strong>详情增强：</strong>在视频详情页提供快捷标记、跳转与辅助信息展示。</li>
        </ul>

        <h3><i class="fas fa-shield-alt"></i> 隐私保护</h3>
        <ul>
            <li><strong>截图模式：</strong>一键模糊敏感区域；切换标签后自动恢复隐私效果。</li>
            <li><strong>隐私设置：</strong>可在“设置 → 隐私保护”中自定义策略与强度。</li>
        </ul>

        <h3><i class="fas fa-keyboard"></i> 快捷键</h3>
        <ul>
            <li><code>Ctrl + Shift + M</code>：快速标记当前视频为“已观看”。</li>
            <li><code>Ctrl + Shift + W</code>：快速标记当前视频为“想看”。</li>
            <li><strong>多选操作：</strong>支持 Ctrl/Shift 组合多选；点击状态标签可快速筛选。</li>
        </ul>

        <h3><i class="fas fa-list-alt"></i> 日志与诊断</h3>
        <ul>
            <li><strong>运行日志：</strong>记录操作、告警与错误，支持按级别筛选、清空、导出。</li>
            <li><strong>网络测试：</strong>测试 WebDAV 连通性、响应时间与同步性能，便于诊断。</li>
        </ul>

        <h3><i class="fas fa-tools"></i> 高级工具</h3>
        <ul>
            <li><strong>数据结构检查：</strong>自动检测并修复历史数据格式问题，保持一致性。</li>
            <li><strong>数据迁移：</strong>从旧版本升级后自动迁移数据结构，附进度显示。</li>
            <li><strong>JSON 编辑：</strong>为进阶用户提供原始 JSON 查看与编辑能力（请谨慎操作）。</li>
        </ul>

        <h3><i class="fas fa-question-circle"></i> 常见问题</h3>
        <ul>
            <li><strong>数据丢失：</strong>可通过 WebDAV 恢复；或导入你先前导出的本地 JSON 备份。</li>
            <li><strong>同步异常：</strong>检查网络与登录状态，查看“日志”获取详细错误并定位。</li>
            <li><strong>性能建议：</strong>大量记录时建议定期清理无用数据，合理设置并发以提升体验。</li>
        </ul>

        <div class="help-footer">
            <p><i class="fas fa-info-circle"></i> <strong>提示：</strong>所有数据默认存储在本地浏览器中，建议开启 WebDAV 自动备份以避免丢失。</p>
            <p><i class="fas fa-github"></i> 欢迎在 GitHub 提交 Issue/Discussion 反馈问题或提出建议。</p>
        </div>
    `;

    helpBody.innerHTML = helpContent;

    // 显示帮助面板
    helpBtn.addEventListener('click', () => {
        helpPanel.classList.remove('hidden');
        helpPanel.classList.add('visible');
    });

    // 关闭帮助面板
    const closeHelp = () => {
        helpPanel.classList.remove('visible');
        helpPanel.classList.add('hidden');
    };

    closeHelpBtn.addEventListener('click', closeHelp);

    // 点击背景关闭
    helpPanel.addEventListener('click', (e) => {
        if (e.target === helpPanel) {
            closeHelp();
        }
    });

    // ESC键关闭
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

        // 安全地获取 lastSync 时间
        const webdavSettings = STATE.settings?.webdav || {};
        const lastSync = webdavSettings.lastSync || '';

        // Update sidebar sync status
        if (lastSyncTimeElement && syncIndicator) {
            updateSyncDisplay(lastSyncTimeElement, syncIndicator, lastSync);
        }

        // Update settings page sync time
        if (lastSyncTimeSettings) {
            lastSyncTimeSettings.textContent = lastSync ? new Date(lastSync).toLocaleString('zh-CN') : '从未';
        }
    } catch (error) {
        console.error('更新同步状态时出错:', error);
        // 在出错时设置默认状态
        const lastSyncTimeElement = document.getElementById('lastSyncTime') as HTMLSpanElement;
        const lastSyncTimeSettings = document.getElementById('last-sync-time') as HTMLSpanElement;
        const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;

        if (lastSyncTimeElement) {
            lastSyncTimeElement.textContent = '从未';
        }
        if (lastSyncTimeSettings) {
            lastSyncTimeSettings.textContent = '从未';
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
            if (diffMinutes > 0) {
                timeText = `${diffMinutes}分钟前`;
            } else {
                timeText = '刚刚';
            }
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
        syncIndicator.querySelector('.sync-status-text')!.textContent = '未同步';
    }
}

function setSyncingStatus(isUploading: boolean = false): void {
    const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;
    if (!syncIndicator) return;

    syncIndicator.className = 'sync-indicator syncing';
    const statusText = syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement;
    if (statusText) {
        statusText.textContent = isUploading ? '上传中...' : '同步中...';
    }
}

function initSidebarActions(): void {
    // 初始化侧边栏收缩功能
    initSidebarToggle();

    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    const syncNowBtn = document.getElementById('syncNow') as HTMLButtonElement;
    const syncDownBtn = document.getElementById('syncDown') as HTMLButtonElement;
    const fileListContainer = document.getElementById('fileListContainer') as HTMLDivElement;
    const fileList = document.getElementById('fileList') as HTMLUListElement;
    // clearAllBtn has been moved to settings tab - global actions section

    // clearAllBtn functionality has been moved to settings tab - global actions section

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            logAsync('INFO', '用户点击了“导出到本地”按钮。');
            // 获取用户账号信息
            const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);

            const dataToExport = {
                settings: STATE.settings,
                data: STATE.records.reduce((acc, record) => {
                    acc[record.id] = record;
                    return acc;
                }, {} as Record<string, VideoRecord>),
                userProfile: userProfile
            };
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            showMessage('数据导出成功（包含账号信息）', 'success');
            logAsync('INFO', '本地数据导出成功，包含用户账号信息。');
        });
    }

    const importFileInput = document.getElementById('importFile') as HTMLInputElement;

    if (importFileInput) {
        importFileInput.addEventListener('change', (event) => {
            logAsync('INFO', '用户选择了本地文件进行导入。');
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                logAsync('WARN', '用户取消了文件选择。');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    showImportModal(text);
                } else {
                    showMessage('Failed to read file content.', 'error');
                    logAsync('ERROR', '无法读取文件内容，内容非字符串。');
                }
            };
            reader.onerror = () => {
                showMessage(`Error reading file: ${reader.error}`, 'error');
                logAsync('ERROR', '读取导入文件时发生错误。', { error: reader.error });
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
            logAsync('INFO', '用户点击"立即上传至云端"，开始上传数据。');

            chrome.runtime.sendMessage({ type: 'webdav-upload' }, response => {
                syncNowBtn.textContent = '立即上传至云端';
                syncNowBtn.disabled = false;

                if (response?.success) {
                    showMessage('数据已成功上传至云端！', 'success');
                    logAsync('INFO', '数据成功上传至云端。');
                    // Update sync status after successful upload
                    setTimeout(() => {
                        updateSyncStatus();
                    }, 500);
                } else {
                    showMessage(`上传失败: ${response.error}`, 'error');
                    logAsync('ERROR', '数据上传至云端失败。', { error: response.error });
                    // Reset sync status on error
                    setTimeout(() => {
                        updateSyncStatus();
                    }, 500);
                }
            });
        });
    }

    if (syncDownBtn) {
        syncDownBtn.addEventListener('click', () => {
            logAsync('INFO', '用户点击"从云端恢复"，打开恢复弹窗。');
            showWebDAVRestoreModal();
        });
    }
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'show-toast') {
        // 在dashboard页面显示toast通知
        showMessage(message.message, message.toastType || 'info');
    }
});

/**
 * 初始化侧边栏收缩功能
 */
function initSidebarToggle(): void {
    const SIDEBAR_STATE_KEY = 'sidebar-collapsed';
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    const toggleBtn = document.getElementById('sidebarToggleBtn') as HTMLButtonElement;

    if (!sidebar || !toggleBtn) {
        console.warn('侧边栏或切换按钮未找到');
        return;
    }

    // 从存储中恢复侧边栏状态
    const restoreSidebarState = async () => {
        try {
            const isCollapsed = await getValue(SIDEBAR_STATE_KEY, false);
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                // 更新按钮图标
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        } catch (error) {
            console.error('恢复侧边栏状态失败:', error);
        }
    };

    // 保存侧边栏状态
    const saveSidebarState = async (isCollapsed: boolean) => {
        try {
            await setValue(SIDEBAR_STATE_KEY, isCollapsed);
        } catch (error) {
            console.error('保存侧边栏状态失败:', error);
        }
    };

    // 切换侧边栏状态
    const toggleSidebar = () => {
        const isCollapsed = sidebar.classList.contains('collapsed');

        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            saveSidebarState(false);
        } else {
            sidebar.classList.add('collapsed');
            saveSidebarState(true);
        }

        // 更新按钮图标方向
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            if (sidebar.classList.contains('collapsed')) {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        }
    };

    // 绑定点击事件
    toggleBtn.addEventListener('click', toggleSidebar);

    // 恢复状态
    restoreSidebarState();
}

// Export functions for use in other modules
export { updateSyncStatus };

// Make updateSyncStatus available globally
(window as any).updateSyncStatus = updateSyncStatus;
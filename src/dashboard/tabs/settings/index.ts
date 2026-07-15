/**
 * 设置模块主入口文件
 * 导出所有设置子模块和管理器
 *
 * 这个文件是新的模块化设置系统的核心入口点。
 * 它负责：
 * 1. 导出所有设置相关的类型和接口
 * 2. 导出所有设置子模块的实例
 * 3. 提供统一的初始化和管理函数
 * 4. 管理设置面板的生命周期
 */

// 基础设施
export * from './types';
export * from './base/interfaces';

// 设置面板管理器
export { settingsPanelManager } from './base/SettingsPanelManager';

// 注意：设置子模块现在通过动态导入加载，避免循环依赖和构建冲突

async function mountSettingsSearchOnIndex(): Promise<void> {
    const { mountDashboardSettingsSearch } = await import('../../../apps/dashboard/settingsSearchBootstrap');
    await mountDashboardSettingsSearch();
}

async function revealSettingsSearchTargetOnPage(): Promise<void> {
    const { revealDashboardSettingsSearchTarget } = await import('../../../apps/dashboard/settingsSearchBootstrap');
    await revealDashboardSettingsSearchTarget();
}

/**
 * 初始化所有设置面板
 *
 * 这个函数负责：
 * 1. 动态导入所有设置模块（避免循环依赖）
 * 2. 将设置面板注册到管理器中
 * 3. 批量初始化所有面板
 *
 * 注意：新增设置模块时，需要在这里添加相应的导入和注册代码
 */
export async function initAllSettingsPanels(): Promise<void> {
    try {
        console.log('[Settings] 开始初始化模块化设置系统...');

        const { settingsPanelManager } = await import('./base/SettingsPanelManager');
        const { getDisplaySettings } = await import('./display');
        const { getSearchEngineSettings } = await import('./searchEngine');
        const { getWebdavSettings } = await import('./webdav');
        const { getSyncSettings } = await import('./sync');
        const { getEnhancementSettings } = await import('./enhancement');
        const { getNetworkTestSettings } = await import('./networkTest');
        const { getGlobalActionsSettings } = await import('./globalActions');
        const { getPrivacySettings } = await import('./privacy');
        const { getAdvancedSettings } = await import('./advanced');
        const { getLoggingSettings } = await import('./logging');
        const { getAiSettings } = await import('./ai');
        const { getInsightsSettings } = await import('./insights');
        const { getDrive115SettingsV2 } = await import('./drive115');
        const { getEmbySettings } = await import('./emby');
        const { getUpdateSettings } = await import('./update');

        // 注册所有设置面板
        // 所有12个主要设置模块都已完成迁移！
        settingsPanelManager.registerPanel(await getDisplaySettings());
        settingsPanelManager.registerPanel(await getSearchEngineSettings());
        settingsPanelManager.registerPanel(await getWebdavSettings());
        settingsPanelManager.registerPanel(await getSyncSettings());
        settingsPanelManager.registerPanel(await getEnhancementSettings());
        settingsPanelManager.registerPanel(await getNetworkTestSettings());
        settingsPanelManager.registerPanel(await getGlobalActionsSettings());
        settingsPanelManager.registerPanel(await getPrivacySettings());
        settingsPanelManager.registerPanel(await getAdvancedSettings());
        settingsPanelManager.registerPanel(await getLoggingSettings());
        settingsPanelManager.registerPanel(await getAiSettings());
        settingsPanelManager.registerPanel(await getInsightsSettings());
        // 使用 v2 独立控制器，避免对 v1 的任何依赖
        settingsPanelManager.registerPanel(await getDrive115SettingsV2());
        settingsPanelManager.registerPanel(await getEmbySettings());
        settingsPanelManager.registerPanel(await getUpdateSettings());

        // 初始化所有面板
        await settingsPanelManager.initAllPanels();

        console.log('[Settings] 所有设置面板初始化完成');
    } catch (error) {
        console.error('[Settings] 初始化设置面板失败:', error);
        throw error;
    }
}

/**
 * 保存所有设置面板
 *
 * 批量保存所有已注册的设置面板的数据
 * 这个函数会并行保存所有面板，提高性能
 */
export async function saveAllSettingsPanels(): Promise<void> {
    try {
        console.log('[Settings] 开始保存所有设置面板...');
        const { settingsPanelManager } = await import('./base/SettingsPanelManager');
        await settingsPanelManager.saveAllPanels();
        console.log('[Settings] 所有设置面板保存完成');
    } catch (error) {
        console.error('[Settings] 保存设置面板失败:', error);
        throw error;
    }
}

/**
 * 销毁所有设置面板
 *
 * 清理所有设置面板的资源，包括：
 * 1. 移除事件监听器
 * 2. 清理定时器
 * 3. 重置状态
 */
export function destroyAllSettingsPanels(): void {
    try {
        console.log('[Settings] 开始销毁所有设置面板...');
        const { settingsPanelManager } = require('./base/SettingsPanelManager');
        settingsPanelManager.destroyAllPanels();
        console.log('[Settings] 所有设置面板已销毁');
    } catch (error) {
        console.error('[Settings] 销毁设置面板失败:', error);
    }
}

/**
 * 初始化设置页面
 * 根据当前 URL 初始化对应的设置模块
 */
export async function initSettingsPage(): Promise<void> {
    try {
        const hash = window.location.hash.substring(1);
        
        // 如果是设置导航页，不需要初始化任何模块
        if (hash === 'tab-settings') {
            console.log('[Settings] 设置导航页，无需初始化模块');
            await mountSettingsSearchOnIndex();
            return;
        }
        
        // 解析子路径（支持 tab-settings/ai-settings 格式）
        const [mainTab, subSection] = hash.split('/');
        
        if (mainTab !== 'tab-settings' || !subSection) {
            return;
        }
        
        // React 全页路径：显示设置已自包含加载/保存，跳过遗留 DisplaySettings.init
        if (
            subSection === 'display-settings' ||
            document.querySelector('[data-display-settings-react]')
        ) {
            console.log('[Settings] 显示设置由 React 页接管，跳过遗留 init');
            await revealSettingsSearchTargetOnPage();
            return;
        }

        // 根据子路径初始化对应的设置模块
        const moduleMap: Record<string, () => Promise<void>> = {
            'display-settings': async () => {
                const { getDisplaySettings } = await import('./display');
                const panel = await getDisplaySettings();
                panel.init();
            },
            'ai-settings': async () => {
                const { getAiSettings } = await import('./ai');
                const panel = await getAiSettings();
                panel.init();
            },
            'search-engine-settings': async () => {
                const { getSearchEngineSettings } = await import('./searchEngine');
                const panel = await getSearchEngineSettings();
                panel.init();
            },
            'privacy-settings': async () => {
                const { getPrivacySettings } = await import('./privacy');
                const panel = await getPrivacySettings();
                panel.init();
            },
            'global-actions': async () => {
                const { getGlobalActionsSettings } = await import('./globalActions');
                const panel = await getGlobalActionsSettings();
                panel.init();
            },
            'emby-settings': async () => {
                const { getEmbySettings } = await import('./emby');
                const panel = await getEmbySettings();
                panel.init();
            },
            'enhancement-settings': async () => {
                const { getEnhancementSettings } = await import('./enhancement');
                const panel = await getEnhancementSettings();
                panel.init();
            },
            'webdav-settings': async () => {
                const { getWebdavSettings } = await import('./webdav');
                const panel = await getWebdavSettings();
                panel.init();
            },
            'sync-settings': async () => {
                const { getSyncSettings } = await import('./sync');
                const panel = await getSyncSettings();
                panel.init();
            },
            'drive115-settings': async () => {
                const { getDrive115SettingsV2 } = await import('./drive115');
                const panel = await getDrive115SettingsV2();
                panel.init();
            },
            'insights-settings': async () => {
                const { getInsightsSettings } = await import('./insights');
                const panel = await getInsightsSettings();
                panel.init();
            },
            'log-settings': async () => {
                const { getLoggingSettings } = await import('./logging');
                const panel = await getLoggingSettings();
                panel.init();
            },
            'advanced-settings': async () => {
                const { getAdvancedSettings } = await import('./advanced');
                const panel = await getAdvancedSettings();
                panel.init();
            },
            'network-test-settings': async () => {
                const { getNetworkTestSettings } = await import('./networkTest');
                const panel = await getNetworkTestSettings();
                panel.init();
            },
            'update-settings': async () => {
                const { getUpdateSettings } = await import('./update');
                const panel = await getUpdateSettings();
                panel.init();
            },
            'about-settings': async () => {
                const { getUpdateSettings } = await import('./update');
                const panel = await getUpdateSettings();
                panel.init();
            },
        };

        const initFn = moduleMap[subSection];
        if (initFn) {
            console.log(`[Settings] 初始化设置模块: ${subSection}`);
            await initFn();
            await revealSettingsSearchTargetOnPage();
        } else {
            console.log(`[Settings] 未找到对应的设置模块: ${subSection}`);
        }
    } catch (error) {
        console.error('[Settings] 初始化设置页面失败:', error);
    }
}

/**
 * 完整的设置标签页初始化函数
 * 新架构：直接初始化对应的设置面板，不需要侧边栏切换
 */
export async function initSettingsTab(): Promise<void> {
    try {
        console.debug('========== initSettingsTab 开始 ==========');
        const hash = window.location.hash.substring(1);
        const [mainTab, subSection] = hash.split('/');
        
        console.debug('hash:', hash);
        console.debug('mainTab:', mainTab);
        console.debug('subSection:', subSection);
        
        // 如果没有子路径，说明是在设置导航页
        if (!subSection) {
            console.debug('设置导航页，挂载 React 入口');
            try {
                const { mountSettingsIndexPage } = await import('../../../apps/dashboard/pages/settings/mountSettingsIndexPage');
                mountSettingsIndexPage('#tab-settings');
            } catch (error) {
                console.error('[Settings] React 设置入口挂载失败:', error);
            }
            await mountSettingsSearchOnIndex();
            return;
        }
        
        // 有子路径，只初始化对应的单个设置面板
        console.debug('初始化设置面板:', subSection);

        // React 全页路径：显示设置已自包含，跳过遗留 init
        if (
            subSection === 'display-settings' ||
            document.querySelector('[data-display-settings-react]')
        ) {
            console.debug('显示设置由 React 页接管，跳过遗留 init');
            await revealSettingsSearchTargetOnPage();
            return;
        }

        // 根据子路径初始化对应的设置模块
        const moduleMap: Record<string, () => Promise<void>> = {
            'display-settings': async () => {
                const { getDisplaySettings } = await import('./display');
                const panel = await getDisplaySettings();
                panel.init();
            },
            'ai-settings': async () => {
                const { getAiSettings } = await import('./ai');
                const panel = await getAiSettings();
                panel.init();
            },
            'search-engine-settings': async () => {
                const { getSearchEngineSettings } = await import('./searchEngine');
                const panel = await getSearchEngineSettings();
                panel.init();
            },
            'privacy-settings': async () => {
                const { getPrivacySettings } = await import('./privacy');
                const panel = await getPrivacySettings();
                panel.init();
            },
            'global-actions': async () => {
                const { getGlobalActionsSettings } = await import('./globalActions');
                const panel = await getGlobalActionsSettings();
                panel.init();
            },
            'emby-settings': async () => {
                const { getEmbySettings } = await import('./emby');
                const panel = await getEmbySettings();
                panel.init();
            },
            'enhancement-settings': async () => {
                const { getEnhancementSettings } = await import('./enhancement');
                const panel = await getEnhancementSettings();
                panel.init();
            },
            'webdav-settings': async () => {
                const { getWebdavSettings } = await import('./webdav');
                const panel = await getWebdavSettings();
                panel.init();
            },
            'sync-settings': async () => {
                const { getSyncSettings } = await import('./sync');
                const panel = await getSyncSettings();
                panel.init();
            },
            'drive115-settings': async () => {
                const { getDrive115SettingsV2 } = await import('./drive115');
                const panel = await getDrive115SettingsV2();
                panel.init();
            },
            'insights-settings': async () => {
                const { getInsightsSettings } = await import('./insights');
                const panel = await getInsightsSettings();
                panel.init();
            },
            'log-settings': async () => {
                const { getLoggingSettings } = await import('./logging');
                const panel = await getLoggingSettings();
                panel.init();
            },
            'advanced-settings': async () => {
                const { getAdvancedSettings } = await import('./advanced');
                const panel = await getAdvancedSettings();
                panel.init();
            },
            'network-test-settings': async () => {
                const { getNetworkTestSettings } = await import('./networkTest');
                const panel = await getNetworkTestSettings();
                panel.init();
            },
            'update-settings': async () => {
                const { getUpdateSettings } = await import('./update');
                const panel = await getUpdateSettings();
                panel.init();
            },
            'about-settings': async () => {
                const { getUpdateSettings } = await import('./update');
                const panel = await getUpdateSettings();
                panel.init();
            },
        };

        const initFn = moduleMap[subSection];
        if (initFn) {
            console.debug(`初始化单个设置模块: ${subSection}`);
            await initFn();
            await revealSettingsSearchTargetOnPage();
        } else {
            console.warn(`未找到对应的设置模块: ${subSection}`);
        }

        console.debug('设置标签页初始化完成');
    } catch (error) {
        console.error('设置标签页初始化失败:', error);
        throw error;
    }
}

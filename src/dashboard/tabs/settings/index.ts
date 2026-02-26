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

        // 确保“报告（Insights）”面板 DOM 存在（在初始化各面板之前）
        function ensureInsightsPanelDom(): void {
            try {
                const content = document.querySelector('.settings-content') as HTMLElement | null;
                if (!content) return;
                if (document.getElementById('insights-settings')) return;

                const panel = document.createElement('div');
                panel.className = 'settings-panel';
                panel.id = 'insights-settings';
                panel.innerHTML = `
                    <div class="settings-panel-header">
                        <h3>报告（Insights）设置</h3>
                        <p class="settings-description">配置报告生成所用的聚合参数，仅影响本地统计与 AI 提示词输入。</p>
                    </div>
                    <div class="settings-panel-body">
                        <div class="settings-section">
                            <h4><i class="fas fa-sliders-h"></i> 聚合参数</h4>
                            <div class="form-group">
                                <label for="insightsTopN">TopN 标签数量:</label>
                                <input type="number" id="insightsTopN" class="number-input" min="1" max="50" value="10">
                                <p class="input-description">展示的热门标签数量（1-50，默认10）。</p>
                            </div>
                            <div class="form-group">
                                <label for="insightsChangeThresholdRatio">显著变化阈值（0-1）:</label>
                                <input type="number" id="insightsChangeThresholdRatio" class="number-input" step="0.01" min="0" max="1" value="0.08">
                                <p class="input-description">按占比绝对变化判断“上升/下降”的阈值（默认0.08）。</p>
                            </div>
                            <div class="form-group">
                                <label for="insightsMinTagCount">最小计数过滤:</label>
                                <input type="number" id="insightsMinTagCount" class="number-input" min="0" max="999" value="3">
                                <p class="input-description">低计数标签将被视为噪声并忽略（默认3）。</p>
                            </div>
                            <div class="form-group">
                                <label for="insightsRisingLimit">上升标签展示条数:</label>
                                <input type="number" id="insightsRisingLimit" class="number-input" min="0" max="50" value="5">
                                <p class="input-description">“上升”列表中最多展示的标签数量（默认5）。</p>
                            </div>
                            <div class="form-group">
                                <label for="insightsFallingLimit">下降标签展示条数:</label>
                                <input type="number" id="insightsFallingLimit" class="number-input" min="0" max="50" value="5">
                                <p class="input-description">“下降”列表中最多展示的标签数量（默认5）。</p>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h4><i class="fas fa-filter"></i> 统计状态口径（compare 模式）</h4>
                            <div class="form-group">
                                <label for="insightsStatusScope">统计口径：</label>
                                <select id="insightsStatusScope" class="text-input">
                                    <option value="viewed">仅“已看”（默认）</option>
                                    <option value="viewed_browsed">“已看 + 已浏览”</option>
                                    <option value="viewed_browsed_want">“已看 + 已浏览 + 想看”（全部）</option>
                                </select>
                                <p class="input-description">仅影响“番号库 compare 模式”的基线与当月新增；不影响观看日表口径。</p>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h4><i class="fas fa-database"></i> 数据源模式</h4>
                            <div class="form-group">
                                <label for="insightsSource">数据源：</label>
                                <select id="insightsSource" class="text-input">
                                    <option value="views">观看日表（当前实现）</option>
                                    <option value="compare">番号库 compare（基线 vs 新增）</option>
                                    <option value="auto">自动（样本足够用 compare，否则回退 views）</option>
                                </select>
                                <p class="input-description">“compare/auto”将基于番号库的更新时间（updatedAt）与状态口径进行统计。</p>
                            </div>
                            <div class="form-group">
                                <label for="insightsMinMonthlySamples">最小样本量（compare/auto 回退阈值）:</label>
                                <input type="number" id="insightsMinMonthlySamples" class="number-input" min="0" max="999" value="10">
                                <p class="input-description">当月新增样本数小于该值时（仅 auto 模式），自动回退到“观看日表”口径。</p>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h4><i class="fas fa-clock"></i> 自动生成</h4>
                            <div class="form-group-checkbox">
                                <input type="checkbox" id="insightsAutoMonthlyEnabled">
                                <label for="insightsAutoMonthlyEnabled">自动月报（按月定时）</label>
                            </div>
                            <p class="input-description">默认关闭；开启后每月 1 日 00:10 生成上月报告（后台可调整分钟）。</p>
                            <div class="form-group-checkbox">
                                <input type="checkbox" id="insightsAutoCompensateEnabled">
                                <label for="insightsAutoCompensateEnabled">启动补偿（错过后自动补生成）</label>
                            </div>
                            <p class="input-description">默认关闭；仅在开启后才会在浏览器启动/扩展唤醒时补偿生成。</p>
                            <div class="form-group" style="margin-top:8px;">
                                <label for="insightsAutoMinuteOfDay">触发分钟（0-1439）：</label>
                                <input type="number" id="insightsAutoMinuteOfDay" class="number-input" min="0" max="1439" value="10">
                                <p class="input-description">表示在每月 1 日的 00:00 后延迟的分钟数，例如 10 表示 00:10 触发。</p>
                            </div>
                            <div id="insights-auto-tip" style="display:none;margin-top:8px;padding:8px 10px;border:1px solid #fde68a;background:#fef3c7;color:#92400e;border-radius:6px;font-size:12px;"></div>
                        </div>
                    </div>
                `;

                // 插入到 AI 面板后方（如存在），否则追加到内容末尾
                const aiPanel = document.getElementById('ai-settings');
                if (aiPanel && aiPanel.parentElement === content) {
                    content.insertBefore(panel, aiPanel.nextSibling);
                } else {
                    content.appendChild(panel);
                }
            } catch {}
        }

        // 先确保 DOM 存在
        ensureInsightsPanelDom();

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
            return;
        }
        
        // 解析子路径（支持 tab-settings/ai-settings 格式）
        const [mainTab, subSection] = hash.split('/');
        
        if (mainTab !== 'tab-settings' || !subSection) {
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
        };
        
        const initFn = moduleMap[subSection];
        if (initFn) {
            console.log(`[Settings] 初始化设置模块: ${subSection}`);
            await initFn();
        } else {
            console.log(`[Settings] 未找到对应的设置模块: ${subSection}，使用旧架构`);
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
        
        // 如果没有子路径，说明是在设置导航页，不需要初始化任何面板
        if (!subSection) {
            console.debug('设置导航页，无需初始化面板');
            return;
        }
        
        // 有子路径，只初始化对应的单个设置面板
        console.debug('初始化设置面板:', subSection);
        
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
        };
        
        const initFn = moduleMap[subSection];
        if (initFn) {
            console.debug(`初始化单个设置模块: ${subSection}`);
            await initFn();
        } else {
            console.warn(`未找到对应的设置模块: ${subSection}`);
        }

        console.debug('设置标签页初始化完成');
    } catch (error) {
        console.error('设置标签页初始化失败:', error);
        throw error;
    }
}

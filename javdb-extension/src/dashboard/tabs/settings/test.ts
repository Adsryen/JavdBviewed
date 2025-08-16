/**
 * 设置模块化系统测试文件
 */

import { initAllSettingsPanels, saveAllSettingsPanels, settingsPanelManager } from './index';

/**
 * 测试设置模块化系统
 */
export async function testSettingsModularSystem(): Promise<void> {
    console.log('[Test] 开始测试设置模块化系统...');

    try {
        // 测试初始化
        console.log('[Test] 测试初始化所有设置面板...');
        await initAllSettingsPanels();
        
        // 检查面板数量
        const panelCount = settingsPanelManager.getPanelCount();
        console.log(`[Test] 已注册 ${panelCount} 个设置面板`);
        
        // 列出所有面板
        const panelIds = settingsPanelManager.getPanelIds();
        console.log('[Test] 已注册的面板:', panelIds);
        
        // 测试获取特定面板
        const displayPanel = settingsPanelManager.getPanel('display-settings');
        if (displayPanel) {
            console.log('[Test] 成功获取显示设置面板:', displayPanel.panelName);
        }
        
        const searchEnginePanel = settingsPanelManager.getPanel('search-engine-settings');
        if (searchEnginePanel) {
            console.log('[Test] 成功获取搜索引擎设置面板:', searchEnginePanel.panelName);
        }
        
        // 测试保存所有设置
        console.log('[Test] 测试保存所有设置面板...');
        await saveAllSettingsPanels();
        
        console.log('[Test] 设置模块化系统测试完成！');
        
    } catch (error) {
        console.error('[Test] 设置模块化系统测试失败:', error);
        throw error;
    }
}

// 如果在浏览器环境中，将测试函数暴露到全局
if (typeof window !== 'undefined') {
    (window as any).testSettingsModularSystem = testSettingsModularSystem;
}

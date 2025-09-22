/**
 * AI设置模块入口
 */

import type { AISettingsPanel } from './AISettings';

// 注意：AISettingsPanel 类通过动态导入加载，避免循环依赖

// 延迟创建AI设置实例，避免循环依赖
let _aiSettings: AISettingsPanel | null = null;

export async function getAiSettings(): Promise<AISettingsPanel> {
    if (!_aiSettings) {
        const { AISettingsPanel } = await import('./AISettings');
        _aiSettings = new AISettingsPanel();
    }
    return _aiSettings;
}

// 为了保持向后兼容，提供一个getter
export const aiSettings = {
    get instance() {
        return getAiSettings();
    }
};

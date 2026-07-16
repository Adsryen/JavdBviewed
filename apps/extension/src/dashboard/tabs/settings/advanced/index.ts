/**
 * 高级配置设置模块入口
 */
import type { AdvancedSettings } from './AdvancedSettings';

// 注意：AdvancedSettings 类通过动态导入加载，避免循环依赖

// 延迟创建高级配置设置实例，避免循环依赖
let _advancedSettings: AdvancedSettings | null = null;

export async function getAdvancedSettings(): Promise<AdvancedSettings> {
    if (!_advancedSettings) {
        const { AdvancedSettings } = await import('./AdvancedSettings');
        _advancedSettings = new AdvancedSettings();
    }
    return _advancedSettings;
}

// 为了保持向后兼容，提供一个getter
export const advancedSettings = {
    get instance() {
        return getAdvancedSettings();
    }
};

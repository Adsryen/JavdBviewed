/**
 * 显示设置模块入口
 */

import type { DisplaySettings } from './DisplaySettings';

// 注意：DisplaySettings 类通过动态导入加载，避免循环依赖

// 延迟创建显示设置实例，避免循环依赖
let _displaySettings: DisplaySettings | null = null;

export async function getDisplaySettings(): Promise<DisplaySettings> {
    if (!_displaySettings) {
        const { DisplaySettings } = await import('./DisplaySettings');
        _displaySettings = new DisplaySettings();
    }
    return _displaySettings;
}

// 为了保持向后兼容，提供一个getter
export const displaySettings = {
    get instance() {
        return getDisplaySettings();
    }
};

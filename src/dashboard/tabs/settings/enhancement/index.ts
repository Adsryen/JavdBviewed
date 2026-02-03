/**
 * 功能增强设置模块入口
 */

import type { EnhancementSettings } from './EnhancementSettings';

// 注意：EnhancementSettings 类通过动态导入加载，避免循环依赖

// 延迟创建功能增强设置实例，避免循环依赖
let _enhancementSettings: EnhancementSettings | null = null;

export async function getEnhancementSettings(): Promise<EnhancementSettings> {
    if (!_enhancementSettings) {
        const { EnhancementSettings } = await import('./EnhancementSettings');
        _enhancementSettings = new EnhancementSettings();
    }
    return _enhancementSettings;
}

// 为了保持向后兼容，提供一个getter
export const enhancementSettings = {
    get instance() {
        return getEnhancementSettings();
    }
};

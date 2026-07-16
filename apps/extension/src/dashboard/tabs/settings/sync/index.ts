/**
 * 同步设置模块入口
 */

import type { SyncSettings } from './SyncSettings';

// 注意：SyncSettings 类通过动态导入加载，避免循环依赖

// 延迟创建同步设置实例，避免循环依赖
let _syncSettings: SyncSettings | null = null;

export async function getSyncSettings(): Promise<SyncSettings> {
    if (!_syncSettings) {
        const { SyncSettings } = await import('./SyncSettings');
        _syncSettings = new SyncSettings();
    }
    return _syncSettings;
}

// 为了保持向后兼容，提供一个getter
export const syncSettings = {
    get instance() {
        return getSyncSettings();
    }
};

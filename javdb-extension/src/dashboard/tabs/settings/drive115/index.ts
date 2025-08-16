/**
 * 115网盘设置模块入口
 */

import type { ISettingsPanel } from '../types';

// 注意：Drive115SettingsPanel 类通过动态导入加载，避免循环依赖

// 延迟创建115网盘设置实例，避免循环依赖
let _drive115Settings: ISettingsPanel | null = null;

export async function getDrive115Settings(): Promise<ISettingsPanel> {
    if (!_drive115Settings) {
        const { Drive115SettingsPanel } = await import('./Drive115Settings');
        _drive115Settings = new Drive115SettingsPanel();
    }
    return _drive115Settings;
}

// 为了保持向后兼容，提供一个getter
export const drive115Settings = {
    get instance() {
        return getDrive115Settings();
    }
};

/**
 * 115网盘设置模块入口
 */

import type { ISettingsPanel } from '../types';

// 注意：Drive115SettingsPanel 类通过动态导入加载，避免循环依赖

// 延迟创建115网盘设置实例，避免循环依赖
let _drive115Settings: ISettingsPanel | null = null;
let _drive115SettingsV2: ISettingsPanel | null = null;

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

// v2 独立入口：仅加载 v2 控制器，不依赖 v1 文件
export async function getDrive115SettingsV2(): Promise<ISettingsPanel> {
    if (!_drive115SettingsV2) {
        const { Drive115SettingsPanelV2 } = await import('./v2/Drive115SettingsV2');
        _drive115SettingsV2 = new Drive115SettingsPanelV2();
    }
    return _drive115SettingsV2;
}

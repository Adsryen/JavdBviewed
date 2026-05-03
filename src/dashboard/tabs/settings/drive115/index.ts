/**
 * 115网盘设置模块入口
 * 单版本：仅保留 v2 控制器。
 */

import type { ISettingsPanel } from '../types';

let _drive115SettingsV2: ISettingsPanel | null = null;

export async function getDrive115SettingsV2(): Promise<ISettingsPanel> {
    if (!_drive115SettingsV2) {
        const { Drive115SettingsPanelV2 } = await import('./v2/Drive115SettingsV2');
        _drive115SettingsV2 = new Drive115SettingsPanelV2();
    }
    return _drive115SettingsV2;
}

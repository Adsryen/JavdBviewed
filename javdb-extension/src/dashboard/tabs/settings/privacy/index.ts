/**
 * 隐私保护设置模块入口
 */

import type { PrivacySettings } from './PrivacySettings';

// 注意：PrivacySettings 类通过动态导入加载，避免循环依赖

// 延迟创建隐私保护设置实例，避免循环依赖
let _privacySettings: PrivacySettings | null = null;

export async function getPrivacySettings(): Promise<PrivacySettings> {
    if (!_privacySettings) {
        const { PrivacySettings } = await import('./PrivacySettings');
        _privacySettings = new PrivacySettings();
    }
    return _privacySettings;
}

// 为了保持向后兼容，提供一个getter
export const privacySettings = {
    get instance() {
        return getPrivacySettings();
    }
};

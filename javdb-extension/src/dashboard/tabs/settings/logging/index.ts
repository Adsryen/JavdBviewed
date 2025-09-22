/**
 * 日志设置模块入口
 */

import type { LoggingSettings } from './LoggingSettings';

// 注意：LoggingSettings 类通过动态导入加载，避免循环依赖

// 延迟创建日志设置实例，避免循环依赖
let _loggingSettings: LoggingSettings | null = null;

export async function getLoggingSettings(): Promise<LoggingSettings> {
    if (!_loggingSettings) {
        const { LoggingSettings } = await import('./LoggingSettings');
        _loggingSettings = new LoggingSettings();
    }
    return _loggingSettings;
}

// 为了保持向后兼容，提供一个getter
export const loggingSettings = {
    get instance() {
        return getLoggingSettings();
    }
};

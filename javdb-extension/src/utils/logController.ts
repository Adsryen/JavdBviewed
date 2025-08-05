// 日志控制器 - 根据用户设置控制日志输出级别

import { getSettings } from './storage';

export interface LogControllerConfig {
    verboseMode: boolean;
    showPrivacyLogs: boolean;
    showStorageLogs: boolean;
}

class LogController {
    private config: LogControllerConfig = {
        verboseMode: false,
        showPrivacyLogs: false,
        showStorageLogs: false
    };

    private initialized = false;

    /**
     * 初始化日志控制器
     */
    async initialize(): Promise<void> {
        try {
            const settings = await getSettings();
            this.config = {
                verboseMode: settings.logging?.verboseMode || false,
                showPrivacyLogs: settings.logging?.showPrivacyLogs || false,
                showStorageLogs: settings.logging?.showStorageLogs || false
            };
            this.initialized = true;
        } catch (error) {
            console.warn('Failed to initialize log controller, using defaults');
            this.initialized = true;
        }
    }

    /**
     * 更新配置
     */
    updateConfig(config: Partial<LogControllerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * 检查是否应该显示详细日志
     */
    shouldShowVerbose(): boolean {
        return this.config.verboseMode;
    }

    /**
     * 检查是否应该显示隐私相关日志
     */
    shouldShowPrivacyLogs(): boolean {
        return this.config.showPrivacyLogs;
    }

    /**
     * 检查是否应该显示存储相关日志
     */
    shouldShowStorageLogs(): boolean {
        return this.config.showStorageLogs;
    }

    /**
     * 条件性日志输出 - 详细模式
     */
    verbose(message: string, ...args: any[]): void {
        if (this.shouldShowVerbose()) {
            console.log(`[VERBOSE] ${message}`, ...args);
        }
    }

    /**
     * 条件性日志输出 - 隐私相关
     */
    privacy(message: string, ...args: any[]): void {
        if (this.shouldShowPrivacyLogs()) {
            console.log(`[PRIVACY] ${message}`, ...args);
        }
    }

    /**
     * 条件性日志输出 - 存储相关
     */
    storage(message: string, ...args: any[]): void {
        if (this.shouldShowStorageLogs()) {
            console.log(`[STORAGE] ${message}`, ...args);
        }
    }

    /**
     * 条件性调试信息
     */
    debug(category: 'privacy' | 'storage' | 'verbose', message: string, ...args: any[]): void {
        switch (category) {
            case 'privacy':
                this.privacy(message, ...args);
                break;
            case 'storage':
                this.storage(message, ...args);
                break;
            case 'verbose':
                this.verbose(message, ...args);
                break;
        }
    }

    /**
     * 始终显示的重要日志
     */
    info(message: string, ...args: any[]): void {
        console.log(`[INFO] ${message}`, ...args);
    }

    /**
     * 始终显示的警告日志
     */
    warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${message}`, ...args);
    }

    /**
     * 始终显示的错误日志
     */
    error(message: string, ...args: any[]): void {
        console.error(`[ERROR] ${message}`, ...args);
    }

    /**
     * 获取当前配置
     */
    getConfig(): LogControllerConfig {
        return { ...this.config };
    }

    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// 创建全局实例
const logController = new LogController();

// 自动初始化
logController.initialize().catch(console.error);

export { logController };

/**
 * 便捷的日志函数
 */
export const log = {
    verbose: (message: string, ...args: any[]) => logController.verbose(message, ...args),
    privacy: (message: string, ...args: any[]) => logController.privacy(message, ...args),
    storage: (message: string, ...args: any[]) => logController.storage(message, ...args),
    debug: (category: 'privacy' | 'storage' | 'verbose', message: string, ...args: any[]) => 
        logController.debug(category, message, ...args),
    info: (message: string, ...args: any[]) => logController.info(message, ...args),
    warn: (message: string, ...args: any[]) => logController.warn(message, ...args),
    error: (message: string, ...args: any[]) => logController.error(message, ...args),
};

/**
 * 更新日志控制器配置
 */
export async function updateLogControllerConfig(): Promise<void> {
    try {
        const settings = await getSettings();
        logController.updateConfig({
            verboseMode: settings.logging?.verboseMode || false,
            showPrivacyLogs: settings.logging?.showPrivacyLogs || false,
            showStorageLogs: settings.logging?.showStorageLogs || false
        });
    } catch (error) {
        console.error('Failed to update log controller config:', error);
    }
}

/**
 * 在设置更改时调用此函数来更新日志配置
 */
export function onSettingsChanged(): void {
    updateLogControllerConfig();
}

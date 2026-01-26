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
            console.log('[LogController] Initialized with config:', JSON.stringify(this.config));
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
        // 如果未初始化，默认不显示详细日志
        if (!this.initialized) {
            return false;
        }
        return this.config.verboseMode;
    }

    /**
     * 检查是否应该显示隐私相关日志
     */
    shouldShowPrivacyLogs(): boolean {
        // 如果未初始化，默认不显示隐私日志
        if (!this.initialized) {
            return false;
        }
        return this.config.showPrivacyLogs;
    }

    /**
     * 检查是否应该显示存储相关日志
     */
    shouldShowStorageLogs(): boolean {
        // 如果未初始化，默认不显示存储日志
        if (!this.initialized) {
            return false;
        }
        return this.config.showStorageLogs;
    }

    /**
     * 条件性日志输出 - 详细模式
     */
    verbose(message: string, ...args: any[]): void {
        // 强制检查：只有在明确启用详细模式时才显示
        if (this.initialized && this.config.verboseMode === true) {
            console.log(`[VERBOSE] ${message}`, ...args);
        }
        // 如果未初始化或详细模式未启用，则不显示任何内容
    }

    /**
     * 条件性日志输出 - 隐私相关
     */
    privacy(message: string, ...args: any[]): void {
        // 强制检查：只有在明确启用隐私日志时才显示
        if (this.initialized && this.config.showPrivacyLogs === true) {
            console.log(`[PRIVACY] ${message}`, ...args);
        }
    }

    /**
     * 条件性日志输出 - 存储相关
     */
    storage(message: string, ...args: any[]): void {
        // 强制检查：只有在明确启用存储日志时才显示
        if (this.initialized && this.config.showStorageLogs === true) {
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
        // 持久化到后台 IDB
        try {
            // 仅在扩展环境下发送
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                const entry: any = {
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: message,
                };
                if (args && args.length > 0) entry.data = args.length === 1 ? args[0] : args;
                chrome.runtime.sendMessage({ type: 'DB:LOGS_ADD', payload: { entry } });
            }
        } catch {}
    }

    /**
     * 始终显示的警告日志
     */
    warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${message}`, ...args);
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                const entry: any = {
                    timestamp: new Date().toISOString(),
                    level: 'WARN',
                    message: message,
                };
                if (args && args.length > 0) entry.data = args.length === 1 ? args[0] : args;
                chrome.runtime.sendMessage({ type: 'DB:LOGS_ADD', payload: { entry } });
            }
        } catch {}
    }

    /**
     * 始终显示的错误日志
     */
    error(message: string, ...args: any[]): void {
        console.error(`[ERROR] ${message}`, ...args);
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                const entry: any = {
                    timestamp: new Date().toISOString(),
                    level: 'ERROR',
                    message: message,
                };
                if (args && args.length > 0) entry.data = args.length === 1 ? args[0] : args;
                chrome.runtime.sendMessage({ type: 'DB:LOGS_ADD', payload: { entry } });
            }
        } catch {}
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

// 延迟初始化，确保在设置加载后进行
setTimeout(() => {
    logController.initialize().catch(console.error);
}, 100);

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
        
        // 同时更新 consoleProxy 的配置
        try {
            const g: any = (typeof window !== 'undefined') ? window : (globalThis as any);
            const consoleControl = g.__JDB_CONSOLE__;
            if (consoleControl && settings.logging) {
                // 更新日志级别
                if ((settings.logging as any).consoleLevel) {
                    consoleControl.setLevel((settings.logging as any).consoleLevel);
                }
                
                // 更新格式选项
                if ((settings.logging as any).consoleFormat) {
                    consoleControl.setFormat((settings.logging as any).consoleFormat);
                }
                
                // 更新模块启用/禁用状态
                const modules = (settings.logging as any).logModules || {};
                const categories = (settings.logging as any).consoleCategories || {};
                
                // 合并新旧配置（向后兼容）
                const allModules = { ...categories, ...modules };
                
                // 遍历所有模块，更新启用状态
                for (const [key, enabled] of Object.entries(allModules)) {
                    if (enabled) {
                        consoleControl.enable(key);
                    } else {
                        consoleControl.disable(key);
                    }
                }
            }
        } catch (e) {
            console.warn('[LogController] 更新 consoleProxy 配置失败:', e);
        }
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

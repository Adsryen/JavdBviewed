/**
 * 数据同步模块主入口文件
 */

import { logAsync } from '../logger';
import { showMessage } from '../ui/toast';
import { SyncUI } from './ui';
import { SyncManagerFactory } from './syncers';
import type { SyncType } from './types';
import type { SyncMode } from '../config/syncConfig';
import { SyncCancelledError } from './types';
import { userService } from '../services/userService';
import { on, emit } from '../services/eventBus';

// 全局初始化标志
let isDataSyncInitialized = false;
let areEventsInitialized = false;

// 导出公共接口
export { SyncStatus } from './types';
export type { SyncType, SyncProgress, SyncResult } from './types';
export { SyncManagerFactory } from './syncers';
export { getApiClient } from './api';

/**
 * 初始化数据同步功能
 */
export async function initDataSyncSection(): Promise<void> {
    if (isDataSyncInitialized) {
        // logAsync('DEBUG', '数据同步功能已初始化，跳过重复初始化');
        return;
    }

    try {
        // logAsync('INFO', '初始化数据同步功能');

        // 初始化UI
        const ui = SyncUI.getInstance();
        await ui.init();

        // 绑定同步事件
        bindSyncEvents();

        // 绑定事件总线监听器
        bindEventBusListeners();

        isDataSyncInitialized = true;
        // logAsync('INFO', '数据同步功能初始化完成');
    } catch (error: any) {
        logAsync('ERROR', '数据同步功能初始化失败', { error: error.message });
    }
}

/**
 * 刷新数据同步区域
 */
export async function refreshDataSyncSection(): Promise<void> {
    try {
        const ui = SyncUI.getInstance();
        await ui.refresh();
    } catch (error: any) {
        logAsync('ERROR', '刷新数据同步区域失败', { error: error.message });
    }
}

/**
 * 绑定同步事件
 */
function bindSyncEvents(): void {
    if (areEventsInitialized) {
        return; // 防止重复绑定事件
    }

    // 监听同步请求事件
    document.addEventListener('sync-requested', handleSyncRequest as EventListener);

    // 监听取消同步事件
    document.addEventListener('sync-cancel-requested', handleCancelSyncRequest as EventListener);

    // 监听页面卸载事件，清理资源
    window.addEventListener('beforeunload', cleanup);

    areEventsInitialized = true;
}

/**
 * 绑定事件总线监听器
 */
function bindEventBusListeners(): void {
    // 监听数据同步刷新请求
    on('data-sync-refresh-requested', () => {
        // logAsync('DEBUG', '收到数据同步刷新请求');
        refreshDataSyncSection();
    });

    // 监听用户登录状态变化
    on('user-login-status-changed', ({ isLoggedIn }) => {
        // logAsync('DEBUG', '用户登录状态变化', { isLoggedIn });
        const ui = SyncUI.getInstance();
        ui.checkUserLoginStatus();
    });

    // 监听用户退出登录
    on('user-logout', () => {
        // logAsync('DEBUG', '用户退出登录，重置同步状态');
        resetSyncState();
    });
}

/**
 * 处理同步请求
 */
async function handleSyncRequest(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { type, mode } = customEvent.detail as { type: SyncType; mode?: SyncMode };

    if (!type) {
        showMessage('同步类型无效', 'error');
        return;
    }

    const ui = SyncUI.getInstance();

    try {
        // 检查是否已在同步中
        if (SyncManagerFactory.isSyncing(type)) {
            showMessage(`${SyncManagerFactory.getSyncTypeDisplayName(type)}同步正在进行中，请稍候...`, 'warn');
            return;
        }

        // 设置UI状态
        ui.setButtonLoadingState(type, true);
        ui.setAllButtonsDisabled(true);
        ui.showSyncProgress(true);

        // 执行同步
        const result = await SyncManagerFactory.executeSync(type, {
            mode,
            // 进度回调
            onProgress: (progress) => {
                ui.updateProgress(progress);
            },
            // 完成回调
            onComplete: (result) => {
                ui.showSyncProgress(false);
                if (result.success) {
                    ui.showSuccess(result.message, result.details);
                    showMessage(result.message, 'success');
                } else {
                    ui.showError(result.message);
                    showMessage(result.message, 'error');
                }
            },
            // 错误回调
            onError: (error) => {
                ui.showSyncProgress(false);
                ui.showError(error.message);
                showMessage(error.message, 'error');
            }
        });

    } catch (error: any) {
        if (error instanceof SyncCancelledError) {
            // 用户取消同步，显示信息而不是错误
            logAsync('INFO', '同步被用户取消', { type, reason: error.message });
            ui.showSyncProgress(false);
            showMessage('同步已取消', 'info');
        } else {
            // 真正的错误
            logAsync('ERROR', '同步请求处理失败', { type, error: error.message });
            ui.showSyncProgress(false);
            ui.showError(error.message);
            showMessage(error.message, 'error');
        }
    } finally {
        // 恢复UI状态
        ui.setButtonLoadingState(type, false);
        ui.setAllButtonsDisabled(false);
    }
}

/**
 * 处理取消同步请求
 */
async function handleCancelSyncRequest(): Promise<void> {
    try {
        logAsync('INFO', '收到取消同步请求');
        const success = await cancelCurrentSync();

        if (success) {
            showMessage('同步已取消', 'info');
        } else {
            showMessage('取消同步失败', 'error');
        }
    } catch (error: any) {
        logAsync('ERROR', '处理取消同步请求失败', { error: error.message });
        showMessage('取消同步失败', 'error');
    }
}

/**
 * 取消当前同步操作
 */
export async function cancelCurrentSync(): Promise<boolean> {
    try {
        // 取消所有正在进行的同步
        SyncManagerFactory.cancelAllSync();

        // 重置UI状态
        const ui = SyncUI.getInstance();
        ui.reset();

        return true;
    } catch (error: any) {
        logAsync('ERROR', '取消同步失败', { error: error.message });
        return false;
    }
}

/**
 * 获取同步状态
 */
export function getSyncStatus() {
    return {
        isAnySyncing: SyncManagerFactory.isAnySyncing(),
        syncingTypes: {
            viewed: SyncManagerFactory.isSyncing('viewed'),
            want: SyncManagerFactory.isSyncing('want'),
            actors: SyncManagerFactory.isSyncing('actors'),
            all: SyncManagerFactory.isSyncing('all')
        }
    };
}

/**
 * 重置同步状态
 */
export function resetSyncState(): void {
    try {
        const ui = SyncUI.getInstance();

        // 取消所有同步
        SyncManagerFactory.cancelAllSync();

        // 重置UI
        ui.reset();

        logAsync('INFO', '同步状态已重置');
    } catch (error: any) {
        logAsync('ERROR', '重置同步状态失败', { error: error.message });
    }
}

/**
 * 获取同步统计信息
 */
export async function getSyncStatistics() {
    try {
        // 这里可以添加统计信息的获取逻辑
        // 暂时返回基本状态
        return getSyncStatus();
    } catch (error: any) {
        logAsync('ERROR', '获取同步统计失败', { error: error.message });
        return null;
    }
}

/**
 * 检查同步功能可用性
 */
export async function checkSyncAvailability(): Promise<{
    available: boolean;
    reason?: string;
}> {
    try {
        // 检查用户登录状态
        const userProfile = await userService.getUserProfile();

        if (!userProfile || !userProfile.isLoggedIn) {
            return {
                available: false,
                reason: '用户未登录'
            };
        }

        // 检查网络连接
        if (!navigator.onLine) {
            return {
                available: false,
                reason: '网络连接不可用'
            };
        }

        return {
            available: true
        };
    } catch (error: any) {
        return {
            available: false,
            reason: error.message
        };
    }
}

/**
 * 清理资源
 */
function cleanup(): void {
    try {
        // 移除事件监听器
        document.removeEventListener('sync-requested', handleSyncRequest as EventListener);
        window.removeEventListener('beforeunload', cleanup);
        
        // 重置状态
        resetSyncState();
        
        logAsync('INFO', '数据同步模块资源已清理');
    } catch (error: any) {
        logAsync('ERROR', '清理数据同步模块资源失败', { error: error.message });
    }
}

/**
 * 模块信息
 */
export const MODULE_INFO = {
    name: 'DataSync',
    version: '1.0.0',
    description: 'JavDB数据同步模块',
    author: 'JavDB Extension Team'
};

// 默认导出主要功能
export default {
    init: initDataSyncSection,
    refresh: refreshDataSyncSection,
    cancel: cancelCurrentSync,
    getStatus: getSyncStatus,
    reset: resetSyncState,
    getStats: getSyncStatistics,
    checkAvailability: checkSyncAvailability
};

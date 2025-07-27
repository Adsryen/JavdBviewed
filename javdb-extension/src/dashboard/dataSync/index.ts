/**
 * 数据同步模块主入口文件
 */

import { logAsync } from '../logger';
import { showMessage } from '../ui/toast';
import { SyncUI } from './ui';
import { getSyncManager } from './core';
import type { SyncType } from './types';

// 导出公共接口
export type { SyncType, SyncStatus, SyncProgress, SyncResult } from './types';
export { getSyncManager } from './core';
export { getApiClient } from './api';

/**
 * 初始化数据同步功能
 */
export async function initDataSyncSection(): Promise<void> {
    try {
        logAsync('INFO', '初始化数据同步功能');
        
        // 初始化UI
        const ui = SyncUI.getInstance();
        await ui.init();
        
        // 绑定同步事件
        bindSyncEvents();
        
        logAsync('INFO', '数据同步功能初始化完成');
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
    // 监听同步请求事件
    document.addEventListener('sync-requested', handleSyncRequest);
    
    // 监听页面卸载事件，清理资源
    window.addEventListener('beforeunload', cleanup);
}

/**
 * 处理同步请求
 */
async function handleSyncRequest(event: CustomEvent): Promise<void> {
    const { type } = event.detail as { type: SyncType };
    
    if (!type) {
        showMessage('同步类型无效', 'error');
        return;
    }

    const ui = SyncUI.getInstance();
    const syncManager = getSyncManager();

    try {
        // 检查是否已在同步中
        if (syncManager.isSyncing()) {
            showMessage('正在同步中，请稍候...', 'warn');
            return;
        }

        // 设置UI状态
        ui.setButtonLoadingState(type, true);
        ui.setAllButtonsDisabled(true);
        ui.showSyncProgress(true);

        // 执行同步
        const result = await syncManager.sync(
            type,
            undefined, // 使用默认配置
            // 进度回调
            (progress) => {
                ui.updateProgress(progress);
            },
            // 完成回调
            (result) => {
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
            (error) => {
                ui.showSyncProgress(false);
                ui.showError(error.message);
                showMessage(error.message, 'error');
            }
        );

    } catch (error: any) {
        logAsync('ERROR', '同步请求处理失败', { type, error: error.message });
        ui.showSyncProgress(false);
        ui.showError(error.message);
        showMessage(error.message, 'error');
    } finally {
        // 恢复UI状态
        ui.setButtonLoadingState(type, false);
        ui.setAllButtonsDisabled(false);
    }
}

/**
 * 取消当前同步操作
 */
export async function cancelCurrentSync(): Promise<boolean> {
    try {
        const syncManager = getSyncManager();
        const success = await syncManager.cancelSync();
        
        if (success) {
            const ui = SyncUI.getInstance();
            ui.reset();
        }
        
        return success;
    } catch (error: any) {
        logAsync('ERROR', '取消同步失败', { error: error.message });
        return false;
    }
}

/**
 * 获取同步状态
 */
export function getSyncStatus() {
    const syncManager = getSyncManager();
    return {
        status: syncManager.getCurrentStatus(),
        context: syncManager.getCurrentContext(),
        isSyncing: syncManager.isSyncing()
    };
}

/**
 * 重置同步状态
 */
export function resetSyncState(): void {
    try {
        const syncManager = getSyncManager();
        const ui = SyncUI.getInstance();
        
        syncManager.reset();
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
        const syncManager = getSyncManager();
        return await syncManager.getStats();
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
        const { getUserProfile } = await import('../userProfile');
        const userProfile = await getUserProfile();
        
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
        document.removeEventListener('sync-requested', handleSyncRequest);
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

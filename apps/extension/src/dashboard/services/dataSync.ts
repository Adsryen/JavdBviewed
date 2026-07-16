// src/dashboard/services/dataSync.ts
// 数据同步服务

import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';

/**
 * 初始化数据同步功能
 */
export async function initDataSyncFunctionality(): Promise<void> {
    try {
        // 数据同步功能初始化
        // 这里可以添加具体的初始化逻辑
        logAsync('INFO', '数据同步功能初始化完成');
    } catch (error) {
        console.error('Failed to initialize data sync functionality:', error);
        logAsync('ERROR', '数据同步功能初始化失败', { error: error.message });
        throw error;
    }
}

// getLocalStats 函数已移除，因为已经有专门的数据概览页面提供统计信息

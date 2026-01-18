/**
 * 同步进度管理模块
 */

import { getValue, setValue } from '../../utils/storage';
import { logAsync } from '../logger';
import type { SavedSyncProgress } from '../config/syncConfig';
import type { SyncType } from '../config/syncConfig';

const PROGRESS_STORAGE_KEY = 'sync_progress';

/**
 * 保存同步进度
 */
export async function saveSyncProgress(progress: SavedSyncProgress): Promise<void> {
    try {
        await setValue(PROGRESS_STORAGE_KEY, progress);
        logAsync('INFO', '同步进度已保存', {
            type: progress.type,
            page: progress.currentPage,
            videoIndex: progress.currentVideoIndex,
            synced: progress.syncedCount
        });
    } catch (error: any) {
        logAsync('ERROR', '保存同步进度失败', { error: error.message });
    }
}

/**
 * 获取保存的同步进度
 */
export async function getSavedSyncProgress(type: SyncType, userEmail: string): Promise<SavedSyncProgress | null> {
    try {
        const progress = await getValue<SavedSyncProgress>(PROGRESS_STORAGE_KEY, null);
        
        if (!progress) {
            return null;
        }
        
        // 检查是否匹配当前同步类型和用户
        if (progress.type !== type || progress.userEmail !== userEmail) {
            return null;
        }
        
        // 检查进度是否过期（超过24小时）
        const now = Date.now();
        const age = now - progress.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (age > maxAge) {
            logAsync('INFO', '同步进度已过期，将被清除', { age: Math.round(age / 1000 / 60) + '分钟' });
            await clearSyncProgress();
            return null;
        }
        
        logAsync('INFO', '找到保存的同步进度', {
            type: progress.type,
            page: progress.currentPage,
            videoIndex: progress.currentVideoIndex,
            synced: progress.syncedCount,
            age: Math.round(age / 1000 / 60) + '分钟前'
        });
        
        return progress;
    } catch (error: any) {
        logAsync('ERROR', '获取同步进度失败', { error: error.message });
        return null;
    }
}

/**
 * 清除同步进度
 */
export async function clearSyncProgress(): Promise<void> {
    try {
        await setValue(PROGRESS_STORAGE_KEY, null);
        logAsync('INFO', '同步进度已清除');
    } catch (error: any) {
        logAsync('ERROR', '清除同步进度失败', { error: error.message });
    }
}

/**
 * 检查是否有未完成的同步
 */
export async function hasUnfinishedSync(type: SyncType, userEmail: string): Promise<boolean> {
    const progress = await getSavedSyncProgress(type, userEmail);
    return progress !== null;
}

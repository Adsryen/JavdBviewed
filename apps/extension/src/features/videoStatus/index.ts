/**
 * @file index.ts
 * @description 影片状态管理（已看/想看/已浏览）统一导出
 * @module features/videoStatus
 */
export {
    checkAndUpdateVideoStatus,
    updateFaviconForStatus,
    updatePageTitleWithStatus,
} from './statusManager';

export {
    canUpgradeStatus,
    getHigherPriorityStatus,
    getStatusDisplayName,
    getStatusPriority,
    getStatusesByPriority,
    safeUpdateStatus,
} from './statusPriority';

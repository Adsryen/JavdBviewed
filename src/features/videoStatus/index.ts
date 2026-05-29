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

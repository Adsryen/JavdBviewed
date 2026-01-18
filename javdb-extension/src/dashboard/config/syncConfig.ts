/**
 * 数据同步配置模块
 */

// 同步类型
export type SyncType = 'all' | 'viewed' | 'want' | 'actors' | 'actors-gender' | 'lists';

// 同步模式（用于已观看、想看和演员同步）
export type SyncMode = 'full' | 'incremental' | 'basic' | 'gender';

// 同步模式配置
export interface SyncModeOption {
    mode: SyncMode;
    title: string;
    description: string;
    icon: string;
}

// 同步选项配置
export interface SyncOption {
    id: string;
    type: SyncType;
    title: string;
    description: string;
    icon: string;
    color: string;
    enabled: boolean;
    comingSoon?: boolean;
}

// 同步配置
export interface SyncConfig {
    batchSize: number; // 批量同步大小
    retryCount: number; // 重试次数
    retryDelay: number; // 重试延迟（毫秒）
    timeout: number; // 超时时间（毫秒）
    mode?: SyncMode; // 同步模式（可选）
    incrementalTolerance?: number; // 增量同步容忍度（遇到已存在记录后还要同步的数量）
    resumeFromProgress?: boolean; // 是否从上次进度继续
}

// 同步进度保存接口
export interface SavedSyncProgress {
    type: SyncType;
    userEmail: string;
    currentPage: number;
    currentVideoIndex: number;
    totalPages: number;
    videoCount: number;
    syncedCount: number;
    errorCount: number;
    newRecords: number;
    updatedRecords: number;
    timestamp: number;
    mode: SyncMode;
}

// 默认同步配置
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    batchSize: 50,
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
    mode: 'full',
    incrementalTolerance: 20
};

// 同步选项配置
export const SYNC_OPTIONS: SyncOption[] = [
    {
        id: 'syncAllData',
        type: 'all',
        title: '同步全部',
        description: '已观看 + 想看',
        icon: 'fas fa-sync-alt',
        color: '#28a745',
        enabled: true
    },
    {
        id: 'syncViewedData',
        type: 'viewed',
        title: '同步已观看',
        description: '已观看视频',
        icon: 'fas fa-check',
        color: '#28a745',
        enabled: true
    },
    {
        id: 'syncWantData',
        type: 'want',
        title: '同步想看',
        description: '想看视频',
        icon: 'fas fa-star',
        color: '#ffc107',
        enabled: true
    },
    {
        id: 'syncActorsData',
        type: 'actors',
        title: '同步演员',
        description: '收藏演员',
        icon: 'fas fa-users',
        color: '#6f42c1',
        enabled: true
    },
    {
        id: 'syncListsData',
        type: 'lists',
        title: '同步清单',
        description: '我的清单 + 收藏的清单',
        icon: 'fas fa-sync-alt',
        color: '#17a2b8',
        enabled: true
    }
];

// 同步模式选项配置
export const SYNC_MODE_OPTIONS: SyncModeOption[] = [
    {
        mode: 'full',
        title: '全量同步',
        description: '同步所有已观看视频（不管本地是否已存在）',
        icon: 'fas fa-sync-alt'
    },
    {
        mode: 'incremental',
        title: '同步缺失',
        description: '只同步缺失的视频（遇到已存在记录时停止）',
        icon: 'fas fa-plus-circle'
    }
];

/**
 * 获取同步配置
 */
export function getSyncConfig(overrides?: Partial<SyncConfig>): SyncConfig {
    return {
        ...DEFAULT_SYNC_CONFIG,
        ...overrides
    };
}

/**
 * 获取同步模式显示名称
 */
export function getSyncModeDisplayName(mode: SyncMode): string {
    const option = SYNC_MODE_OPTIONS.find(opt => opt.mode === mode);
    return option?.title || mode;
}

/**
 * 检查是否支持同步类型
 */
export function isSyncTypeSupported(type: SyncType): boolean {
    switch (type) {
        case 'all':
        case 'viewed':
        case 'want':
        case 'actors':
        case 'actors-gender':
        case 'lists':
            return true; // 演员同步和性别更新已实现
        default:
            return false;
    }
}

/**
 * 获取同步类型的显示名称
 */
export function getSyncTypeDisplayName(type: SyncType): string {
    const option = SYNC_OPTIONS.find(opt => opt.type === type);
    return option?.title || type;
}

/**
 * 根据同步类型获取同步选项
 */
export function getSyncOptionByType(type: SyncType): SyncOption | undefined {
    return SYNC_OPTIONS.find(opt => opt.type === type);
}

/**
 * 获取启用的同步选项
 */
export function getEnabledSyncOptions(): SyncOption[] {
    return SYNC_OPTIONS.filter(opt => opt.enabled);
}

/**
 * 验证同步类型是否有效
 */
export function isValidSyncType(type: string): type is SyncType {
    return ['all', 'viewed', 'want', 'actors', 'lists'].includes(type);
}

/**
 * 数据同步配置模块
 */

// 同步类型
export type SyncType = 'all' | 'viewed' | 'want' | 'actors';

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
}

// 默认同步配置
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    batchSize: 50,
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000
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
        enabled: false,
        comingSoon: true
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
 * 检查是否支持同步类型
 */
export function isSyncTypeSupported(type: SyncType): boolean {
    switch (type) {
        case 'all':
        case 'viewed':
        case 'want':
            return true;
        case 'actors':
            return false; // 暂未实现
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
    return ['all', 'viewed', 'want', 'actors'].includes(type);
}

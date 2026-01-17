// src/utils/statusPriority.ts

import { VIDEO_STATUS, STATUS_PRIORITY } from './config';
import type { VideoStatus } from '../types';

/**
 * 检查是否可以将状态从 currentStatus 升级到 newStatus
 * 只允许向更高优先级升级，不允许降级
 * 
 * @param currentStatus 当前状态
 * @param newStatus 新状态
 * @returns 是否可以升级
 */
export function canUpgradeStatus(currentStatus: VideoStatus, newStatus: VideoStatus): boolean {
    const currentPriority = STATUS_PRIORITY[currentStatus];
    const newPriority = STATUS_PRIORITY[newStatus];
    
    // 只允许升级到更高优先级的状态
    return newPriority > currentPriority;
}

/**
 * 获取两个状态中优先级更高的状态
 * 
 * @param status1 状态1
 * @param status2 状态2
 * @returns 优先级更高的状态
 */
export function getHigherPriorityStatus(status1: VideoStatus, status2: VideoStatus): VideoStatus {
    const priority1 = STATUS_PRIORITY[status1];
    const priority2 = STATUS_PRIORITY[status2];
    
    return priority1 >= priority2 ? status1 : status2;
}

/**
 * 安全地更新状态，确保只能向上升级
 * 
 * @param currentStatus 当前状态
 * @param newStatus 要设置的新状态
 * @returns 实际应该设置的状态（如果不能升级则返回当前状态）
 */
export function safeUpdateStatus(currentStatus: VideoStatus, newStatus: VideoStatus): VideoStatus {
    if (canUpgradeStatus(currentStatus, newStatus)) {
        return newStatus;
    }
    return currentStatus;
}

/**
 * 获取状态的优先级数值
 * 
 * @param status 状态
 * @returns 优先级数值（越大优先级越高）
 */
export function getStatusPriority(status: VideoStatus): number {
    return STATUS_PRIORITY[status];
}

/**
 * 获取状态的中文显示名称
 * 
 * @param status 状态
 * @returns 中文显示名称
 */
export function getStatusDisplayName(status: VideoStatus): string {
    switch (status) {
        case VIDEO_STATUS.VIEWED:
            return '已观看';
        case VIDEO_STATUS.WANT:
            return '我想看';
        case VIDEO_STATUS.BROWSED:
            return '已浏览';
        case VIDEO_STATUS.UNTRACKED:
            return '未标记';
        default:
            return '未知状态';
    }
}

/**
 * 获取所有状态按优先级排序（从高到低）
 * 
 * @returns 按优先级排序的状态数组
 */
export function getStatusesByPriority(): VideoStatus[] {
    return [
        VIDEO_STATUS.VIEWED,  // 优先级 3
        VIDEO_STATUS.WANT,    // 优先级 2
        VIDEO_STATUS.BROWSED,  // 优先级 1
        VIDEO_STATUS.UNTRACKED // 优先级 0
    ];
}

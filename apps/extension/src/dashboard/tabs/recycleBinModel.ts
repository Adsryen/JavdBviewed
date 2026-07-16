/**
 * @file recycleBinModel.ts
 * @description 回收站纯数据/展示助手（无 DOM）
 * @module dashboard/tabs
 */

import type { ActorRecord, VideoRecord } from '../../types';

export const RECYCLE_BIN_PAGE_SIZE = 20;
export const RECYCLE_BIN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * 格式化剩余保留天数（30 天自动清理）
 */
export function formatRecycleRemainingDays(
  deletedAt: number,
  now: number = Date.now(),
): string {
  const elapsed = now - deletedAt;
  const remaining = RECYCLE_BIN_RETENTION_MS - elapsed;
  if (remaining <= 0) return '即将清理';
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return `${days} 天`;
}

/**
 * 格式化删除时间
 */
export function formatRecycleDeletedAt(deletedAt: number): string {
  return new Date(deletedAt).toLocaleString('zh-CN');
}

/**
 * 番号封面 URL
 */
export function getRecycleVideoCoverUrl(record: VideoRecord): string | null {
  return record.javdbImage || record.coverImage || null;
}

/**
 * 番号 JavDB 链接
 */
export function getRecycleVideoJavdbUrl(record: VideoRecord): string | null {
  if (record.javdbUrl) return record.javdbUrl;
  if (record.id) return `https://javdb.com/search?q=${encodeURIComponent(record.id)}`;
  return null;
}

/**
 * 演员详情链接
 */
export function getRecycleActorUrl(actor: ActorRecord): string | null {
  return actor.profileUrl || null;
}

/**
 * 分页页码范围（0-based currentPage）
 */
export function buildRecyclePaginationPages(
  total: number,
  currentPage: number,
  pageSize: number = RECYCLE_BIN_PAGE_SIZE,
): { totalPages: number; page: number; hasPrev: boolean; hasNext: boolean } {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(0, currentPage), totalPages - 1);
  return {
    totalPages,
    page,
    hasPrev: page > 0,
    hasNext: page < totalPages - 1,
  };
}

/**
 * 从当前列表 id 计算「全选」后的选中集合
 */
export function selectAllRecycleIds(ids: string[]): Set<string> {
  return new Set(ids);
}

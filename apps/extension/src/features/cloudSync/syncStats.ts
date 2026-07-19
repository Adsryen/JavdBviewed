/**
 * @file syncStats.ts
 * @description 同步实体/结果分类统计（纯函数，便于单测）
 * @module features/cloudSync
 */
import type { SyncEntity } from '@javdb/sync-protocol';

/** 用户可见的类型中文名 */
export const SYNC_TYPE_LABELS: Record<string, string> = {
  video: '视频/番号',
  actor: '演员',
  list: '清单',
  new_work: '新作品',
  new_work_subscription: '新作品订阅',
  user_profile: '用户资料',
  search_preset: '搜索方案',
  preference: '跨端偏好',
  magnet: '磁力缓存',
  insights_view: 'Insights 日统计',
  insights_report: 'Insights 月报',
  new_work_daily_stat: '新作品每日统计',
  storage_item: '扩展存储',
};

export type TypeCountMap = Record<string, number>;

export function countByType(entities: readonly SyncEntity[]): TypeCountMap {
  const out: TypeCountMap = {};
  for (const e of entities) {
    const t = e.type || 'unknown';
    out[t] = (out[t] ?? 0) + 1;
  }
  return out;
}

export function formatTypeCounts(counts: TypeCountMap): string {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!entries.length) return '无';
  return entries
    .map(([type, n]) => `${SYNC_TYPE_LABELS[type] || type} ${n}`)
    .join(' · ');
}

/** 将 API / 网络错误转成用户可读中文 */
export function humanizeCloudError(err: unknown): string {
  if (err == null) return '未知错误';
  if (typeof err === 'string') return err;

  const anyErr = err as { status?: number; message?: string; name?: string };
  const status = anyErr.status;
  const raw = String(anyErr.message || err);

  // 密码错误 vs 会话过期要分开，避免误导用户去「重新登录」却仍输错密
  if (/invalid credentials/i.test(raw)) {
    return '账号或密码错误（默认引导多为 admin / javdbviewed；若改过 CLOUD_ADMIN_PASSWORD 或旧数据卷，以实际配置为准）';
  }
  if (status === 401 || /unauthorized|invalid refresh/i.test(raw)) {
    return '未授权或登录已过期，请重新登录';
  }
  if (status === 409 || /user exists/i.test(raw)) {
    return '账号已存在，请直接登录';
  }
  if (status === 404) {
    return '接口不存在，请检查 Cloud 地址与版本是否匹配';
  }
  if (status === 0 || /failed to fetch|networkerror|load failed|econnrefused/i.test(raw)) {
    return '无法连接 Cloud，请确认服务已启动且地址正确';
  }
  if (/请先登录/i.test(raw)) {
    return raw;
  }
  if (status && status >= 500) {
    return `服务器错误（${status}），请查看 Cloud 日志`;
  }
  if (status) {
    return `${raw}（HTTP ${status}）`;
  }
  return raw || '操作失败';
}

/**
 * @file taskPolicy.ts
 * @description 任务调度策略 —— 定义任务桶（bucket）分类和并发限制
 * @module platform/tasks
 *
 * 任务按 label 前缀分桶，每个桶有独立的并发上限，
 * 防止同一类任务（如翻译、磁力搜索）占用过多资源。
 */

/** 各任务桶的最大并发数 */
export const TASK_BUCKET_LIMITS: Record<string, number> = {
  videoStatus: 6,                                     // 视频状态查询
  translate: 1,                                       // 翻译（严格串行，避免 API 限流）
  actorMarks: 3,                                      // 演员标记
  actorRemarks: 3,                                    // 演员备注（Wiki 数据）
  drive115: 4,                                        // 115 网盘操作
  'drive115-push': 3,                                 // 115 推送
  insights: 3,                                        // AI 分析报告
  videoFavoriteRating: 3,                             // 收藏评分
  contentFilter: 3,                                   // 内容过滤
  'ui-light': 8,                                      // UI 轻量任务
  'video-light': 8,                                   // 视频页轻量任务
  auxiliary: 20,                                      // 辅助任务（宽限）
};

/** 根据任务 label 前缀解析所属桶 */
export function resolveTaskBucket(label: string): string {
  if (label.startsWith('videoStatus:')) return 'videoStatus';
  if (label.includes('translate')) return 'translate';
  if (label.startsWith('actorMarks')) return 'actorMarks';
  if (label.startsWith('actorRemarks')) return 'actorRemarks';
  if (label === 'drive115:push') return 'drive115-push';
  if (label.startsWith('drive115')) return 'drive115';
  if (label.startsWith('insights')) return 'insights';
  if (label.startsWith('videoFavoriteRating')) return 'videoFavoriteRating';
  if (label.startsWith('contentFilter')) return 'contentFilter';
  if (label.startsWith('ui:remove-unwanted') || label.includes(':panel')) return 'ui-light';
  if (label.startsWith('videoEnhancement:') || label.startsWith('ux:magnet:')) return 'video-light';
  return 'auxiliary';
}

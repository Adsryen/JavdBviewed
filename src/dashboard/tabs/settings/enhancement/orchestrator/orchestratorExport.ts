import type { OrchestratorTimelineFilter } from './orchestratorUtils';

export type OrchestratorTimelineItem = { phase: string; label: string; status: string; ts: number; detail?: any; durationMs?: number };
export type OrchestratorPhaseMap = Record<'critical' | 'high' | 'deferred' | 'idle', string[]>;

export function buildPhasesExportText(phases: OrchestratorPhaseMap, getTaskDescription: (label: string) => string): string {
  const order: Array<'critical' | 'high' | 'deferred' | 'idle'> = ['critical', 'high', 'deferred', 'idle'];
  const phaseTitle: Record<'critical' | 'high' | 'deferred' | 'idle', string> = {
    critical: '关键（critical）',
    high: '优先（high）',
    deferred: '延迟（deferred）',
    idle: '空闲（idle）',
  };

  const lines: string[] = [];
  lines.push('已注册任务（按阶段）');
  order.forEach((phase) => {
    lines.push(`[${phaseTitle[phase]}]`);
    const items = phases[phase] || [];
    if (items.length === 0) {
      lines.push('- （无任务）');
    } else {
      items.forEach((label) => {
        const desc = getTaskDescription(label);
        lines.push(`- ${label}\t${desc || ''}`.trimEnd());
      });
    }
    lines.push('');
  });

  return lines.join('\n');
}

export function filterTimelineForExport(timeline: OrchestratorTimelineItem[], filters: OrchestratorTimelineFilter): OrchestratorTimelineItem[] {
  return (timeline || []).filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.phase !== 'all' && item.phase !== filters.phase) return false;
    if (filters.keyword && !(`${item.label}`.toLowerCase().includes(filters.keyword))) return false;
    return true;
  });
}

export function buildTimelineExportText(mode: string, list: OrchestratorTimelineItem[]): string {
  const header = mode === 'design'
    ? '时间(相对)\t状态\t阶段\t任务'
    : '时间(ms)\t状态\t阶段\t任务\t耗时';

  const lines: string[] = [];
  lines.push('事件时间线');
  lines.push(header);

  list.forEach((item) => {
    const timeStr = item.ts !== undefined
      ? (mode === 'design' ? `${Math.round(item.ts)} ms` : `${item.ts.toFixed(1)} ms`)
      : '';
    const statusStr = (item.status || '').toUpperCase();
    const phaseStr = item.phase || '';
    const labelStr = item.label || '';
    if (mode === 'design') {
      lines.push(`${timeStr}\t${statusStr}\t${phaseStr}\t${labelStr}`);
    } else {
      const durStr = typeof item.durationMs === 'number' ? `${Math.round(item.durationMs)} ms` : '-';
      lines.push(`${timeStr}\t${statusStr}\t${phaseStr}\t${labelStr}\t${durStr}`);
    }
    if (item.detail) {
      lines.push(`  详情: ${String(item.detail)}`);
    }
  });

  return lines.join('\n');
}


export function getTaskDisplayNameForExport(label: string): string {
  const taskNameMap: Record<string, string> = {
    'drive115:init:video': '115功能初始化-视频页 (drive115:init:video)',
    'drive115:init:list': '115功能初始化-列表页 (drive115:init:list)',
    'drive115:push': '115推送任务 (drive115:push)',
    'insights:collector': '观影标签采集器 (insights:collector)',
    'actorRemarks:actorPage': '演员备注-演员页 (actorRemarks:actorPage)',
    'actorRemarks:run': '演员备注-运行 (actorRemarks:run)',
    'actorMarks:page': '演员标识-页面标记 (actorMarks:page)',
    'ux:magnet:autoSearch': '磁力搜索自动检索 (ux:magnet:autoSearch)',
    'anchorOptimization:init': '锚点优化初始化 (anchorOptimization:init)',
    'superRankingNav:init': '超级排行榜导航初始化 (superRankingNav:init)',
    'emby:badge': 'Emby徽标增强 (emby:badge)',
    'passwordHelper:init': '密码助手初始化 (passwordHelper:init)',
    'contentFilter:initialize': '内容过滤初始化 (contentFilter:initialize)',
    'videoEnhancement:clickEnhancement': '视频增强-点击增强 (videoEnhancement:clickEnhancement)',
    'videoEnhancement:initCore': '视频增强-核心初始化 (videoEnhancement:initCore)',
    'videoEnhancement:loadData': '视频增强-加载聚合数据 (videoEnhancement:loadData)',
    'videoEnhancement:translateCurrentTitle': '视频增强-标题定点翻译 (videoEnhancement:translateCurrentTitle)',
    'videoEnhancement:runCover': '视频增强-封面处理 (videoEnhancement:runCover)',
    'videoEnhancement:runTitle': '视频增强-标题处理 (videoEnhancement:runTitle)',
    'videoEnhancement:runReviewBreaker': '视频增强-评论破解 (videoEnhancement:runReviewBreaker)',
    'videoEnhancement:runRelatedLists': '视频增强-相关清单解锁 (videoEnhancement:runRelatedLists)',
    'videoEnhancement:runFC2Breaker': '视频增强-FC2破解 (videoEnhancement:runFC2Breaker)',
    'videoEnhancement:panel': '视频增强-面板注入 (videoEnhancement:panel)',
    'videoEnhancement:finish': '视频增强-完成 (videoEnhancement:finish)',
    'videoFavoriteRating:init': '视频收藏评分初始化 (videoFavoriteRating:init)',
  };
  return taskNameMap[label] || label;
}

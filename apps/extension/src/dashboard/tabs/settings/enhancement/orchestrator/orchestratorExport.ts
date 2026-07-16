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


import { getTaskLabelDisplay } from '../taskLabelCatalog';

export function getTaskDisplayNameForExport(label: string): string {
  return getTaskLabelDisplay(label);
}

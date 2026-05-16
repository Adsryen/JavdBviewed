import type { OrchestratorDesignTask } from './orchestratorDesign';

export type OrchestratorTimelineFilter = {
  status: 'all' | 'running' | 'done' | 'error' | 'scheduled' | 'registered' | 'queued' | 'leased' | 'paused' | 'canceled';
  phase: 'all' | 'critical' | 'high' | 'deferred' | 'idle';
  keyword: string;
};

export function getDesignTaskMeta(tasks: OrchestratorDesignTask[], label: string): OrchestratorDesignTask | null {
  return tasks.find(task => task.label === label) || null;
}

export function getTimelineFilters(statusValue?: string, phaseValue?: string, keywordValue?: string): OrchestratorTimelineFilter {
  const status = (statusValue || 'all') as OrchestratorTimelineFilter['status'];
  const phase = (phaseValue || 'all') as OrchestratorTimelineFilter['phase'];
  const keyword = (keywordValue || '').trim().toLowerCase();
  return { status, phase, keyword };
}

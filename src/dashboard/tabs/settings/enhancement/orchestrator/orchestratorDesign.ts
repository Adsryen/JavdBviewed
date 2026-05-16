import { STATE } from '../../../../state';
import type { ExtensionSettings } from '../../../../../types';

export type OrchestratorDesignTask = {
  phase: 'critical' | 'high' | 'deferred' | 'idle';
  label: string;
  priority?: number;
  timeout?: number;
  visibilityPolicy?: string;
  source: 'video' | 'actor' | 'list' | 'global';
  enabled: boolean;
};

export type OrchestratorTimelineItem = {
  phase: 'critical' | 'high' | 'deferred' | 'idle';
  label: string;
  status: 'registered';
  ts: number;
  detail?: string;
  durationMs?: number;
};

export function buildDesignTasks(doGetSettings: () => ExtensionSettings): OrchestratorDesignTask[] {
  const settings = (STATE.settings || doGetSettings() || {}) as ExtensionSettings & Record<string, any>;
  const tasks: OrchestratorDesignTask[] = [];
  const pushTask = (task: OrchestratorDesignTask) => tasks.push(task);

  const videoTasks: OrchestratorDesignTask[] = [
    { phase: 'idle', label: 'drive115:init:video', source: 'video', enabled: true },
    { phase: 'idle', label: 'insights:collector', source: 'video', enabled: true },
    ...getVideoDetailDesignBlueprints(settings).map((task) => ({
      phase: task.phase,
      label: task.label,
      priority: task.priority,
      timeout: task.timeout,
      visibilityPolicy: task.visibilityPolicy,
      source: 'video' as const,
      enabled: true,
    })),
  ];
  videoTasks.forEach(pushTask);

  if ((settings.videoEnhancement as any)?.enableActorQuickActions !== false) {
    pushTask({ phase: 'high', label: 'actorQuickActions:init', priority: 6, visibilityPolicy: 'background_allowed', source: 'video', enabled: true });
  }

  if (settings.userExperience?.enableKeyboardShortcuts) {
    pushTask({ phase: 'high', label: 'ux:shortcuts:init', priority: 8, source: 'global', enabled: true });
  }

  pushTask({
    phase: 'high',
    label: 'ui:remove-unwanted',
    priority: 3,
    visibilityPolicy: 'background_allowed',
    source: 'global',
    enabled: true,
  });

  if (settings.userExperience?.enableMagnetSearch) {
    pushTask({ phase: 'idle', label: 'ux:magnet:autoSearch', source: 'global', enabled: true });
  }

  if (settings.userExperience?.enableAnchorOptimization) {
    pushTask({ phase: 'deferred', label: 'anchorOptimization:init', source: 'global', enabled: true });
  }

  if (settings.userExperience?.enablePasswordHelper) {
    pushTask({ phase: 'idle', label: 'passwordHelper:init', source: 'global', enabled: true });
  }

  if (settings.userExperience?.enableContentFilter) {
    pushTask({ phase: 'idle', label: 'contentFilter:initialize', source: 'global', enabled: true });
  }

  if ((settings.videoEnhancement as any)?.showLoadingIndicator !== false) {
    pushTask({ phase: 'critical', label: 'enhancementUI:showLoadingIndicator', priority: 13, visibilityPolicy: 'background_allowed', source: 'global', enabled: true });
  }

  if (settings.userExperience?.enableListEnhancement !== false) {
    pushTask({ phase: 'critical', label: 'list:observe:init', visibilityPolicy: 'background_allowed', source: 'list', enabled: true });
    pushTask({ phase: 'high', label: 'listEnhancement:init', priority: 7, visibilityPolicy: 'background_allowed', source: 'list', enabled: true });
    pushTask({ phase: 'high', label: 'list:reprocess:after-listEnhancement', priority: 6, visibilityPolicy: 'background_allowed', source: 'list', enabled: true });
    pushTask({ phase: 'idle', label: 'drive115:init:list', source: 'list', enabled: true });
  }

  const actorEnhancementEnabled = settings.userExperience?.enableActorEnhancement !== false;
  if (actorEnhancementEnabled) {
    pushTask({ phase: 'critical', label: 'actorEnhancement:init', visibilityPolicy: 'background_allowed', source: 'actor', enabled: true });
    pushTask({ phase: 'critical', label: 'actorEnhancement:actionButtons', priority: 9, visibilityPolicy: 'background_allowed', source: 'actor', enabled: (settings.actorEnhancement as any)?.enableActionButtons !== false });
  }

  const actorRemarksEnabled = (settings.videoEnhancement as any)?.enabled === true && (settings.videoEnhancement as any)?.enableActorRemarks === true;
  if (actorRemarksEnabled) {
    pushTask({ phase: 'idle', label: 'actorRemarks:actorPage', timeout: Number((settings.videoEnhancement as any)?.actorRemarksTaskTimeoutSeconds || 10) * 1000, source: 'actor', enabled: true });
  }

  const includeEmby = isDesignEmbyEnabled(settings);
  if (includeEmby) {
    pushTask({ phase: 'deferred', label: 'emby:badge', source: 'global', enabled: true });
  }

  const deduped = new Map<string, OrchestratorDesignTask>();
  tasks.forEach((task) => {
    const current = deduped.get(task.label);
    if (!current) {
      deduped.set(task.label, task);
      return;
    }
    const currentPriority = current.priority ?? 5;
    const nextPriority = task.priority ?? 5;
    if (nextPriority > currentPriority) {
      deduped.set(task.label, task);
    }
  });

  return Array.from(deduped.values()).sort((a, b) => {
    const phaseOrder = { critical: 0, high: 1, deferred: 2, idle: 3 };
    const phaseDiff = phaseOrder[a.phase] - phaseOrder[b.phase];
    if (phaseDiff !== 0) return phaseDiff;
    const priorityDiff = (b.priority ?? 5) - (a.priority ?? 5);
    if (priorityDiff !== 0) return priorityDiff;
    return a.label.localeCompare(b.label);
  });
}

export function getVideoDetailDesignBlueprints(settings: ExtensionSettings & Record<string, any>): Array<Pick<OrchestratorDesignTask, 'phase' | 'label' | 'priority' | 'timeout' | 'visibilityPolicy'>> {
  const blueprints: Array<Pick<OrchestratorDesignTask, 'phase' | 'label' | 'priority' | 'timeout' | 'visibilityPolicy'>> = [];
  const enableVideoEnhancement = settings?.videoEnhancement?.enabled === true;
  const enableMultiSource = (settings as any)?.dataEnhancement?.enableMultiSource;
  const enableTranslation = (settings as any)?.dataEnhancement?.enableTranslation;
  const actorRemarksTaskTimeoutMs = getActorRemarksTaskTimeoutMsForDesign(settings);

  if (enableVideoEnhancement || enableMultiSource || enableTranslation) {
    blueprints.push(
      { phase: 'critical', label: 'videoStatus:initialSync', priority: 12, visibilityPolicy: 'background_allowed' },
      { phase: 'high', label: 'videoEnhancement:initCore', priority: 8, visibilityPolicy: 'background_allowed' },
      { phase: 'high', label: 'videoEnhancement:clickEnhancement', priority: 10, visibilityPolicy: 'background_allowed' },
      { phase: 'deferred', label: 'videoEnhancement:loadData', timeout: 10000 },
      { phase: 'deferred', label: 'videoEnhancement:translateCurrentTitle', timeout: 15000 },
      { phase: 'idle', label: 'videoEnhancement:runCover' },
      { phase: 'idle', label: 'videoEnhancement:runTitle' },
      { phase: 'idle', label: 'videoEnhancement:runFC2Breaker' },
      { phase: 'idle', label: 'videoEnhancement:runReviewBreaker' },
      { phase: 'idle', label: 'videoEnhancement:finish' },
    );
  }

  if (enableVideoEnhancement && (settings as any)?.videoEnhancement?.enableActorRemarks === true) {
    blueprints.push({ phase: 'idle', label: 'actorRemarks:run', timeout: actorRemarksTaskTimeoutMs });
  }

  if (enableVideoEnhancement && (settings as any)?.videoEnhancement?.enableVideoFavoriteRating === true) {
    blueprints.push({ phase: 'high', label: 'videoFavoriteRating:init', priority: 4, visibilityPolicy: 'background_allowed' });
  }

  if ((settings as any)?.videoEnhancement?.enableActorNameMarks !== false) {
    blueprints.push({ phase: 'idle', label: 'actorMarks:page' });
  }

  blueprints.push({ phase: 'idle', label: 'videoEnhancement:panel' });
  return blueprints;
}

export function getActorRemarksTaskTimeoutMsForDesign(settings: ExtensionSettings & Record<string, any>): number {
  const seconds = Number((settings as any)?.videoEnhancement?.actorRemarksTaskTimeoutSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return 12000;
  return Math.max(1000, Math.round(seconds * 1000));
}

export function groupDesignTasksByPhase(tasks: OrchestratorDesignTask[]): Record<'critical' | 'high' | 'deferred' | 'idle', string[]> {
  const phases: Record<'critical' | 'high' | 'deferred' | 'idle', string[]> = {
    critical: [],
    high: [],
    deferred: [],
    idle: [],
  };
  tasks.filter(task => task.enabled).forEach((task) => {
    phases[task.phase].push(task.label);
  });
  return phases;
}

export function buildDesignTaskDetail(task: OrchestratorDesignTask): string {
  const sourceMap: Record<OrchestratorDesignTask['source'], string> = {
    video: '影片页',
    actor: '演员页',
    list: '列表页',
    global: '全局',
  };
  const detailParts = [
    `来源: ${sourceMap[task.source]}`,
    `优先级: ${task.priority ?? 5}`,
  ];
  if (task.visibilityPolicy) detailParts.push(`可见性: ${task.visibilityPolicy}`);
  if (typeof task.timeout === 'number' && task.timeout > 0) detailParts.push(`超时: ${task.timeout}ms`);
  return detailParts.join(' ｜ ');
}

export function buildDesignTimeline(tasks: OrchestratorDesignTask[]): OrchestratorTimelineItem[] {
  const timeline: OrchestratorTimelineItem[] = [];
  const groups: Record<'critical' | 'high' | 'deferred' | 'idle', OrchestratorDesignTask[]> = {
    critical: tasks.filter(task => task.enabled && task.phase === 'critical'),
    high: tasks.filter(task => task.enabled && task.phase === 'high'),
    deferred: tasks.filter(task => task.enabled && task.phase === 'deferred'),
    idle: tasks.filter(task => task.enabled && task.phase === 'idle'),
  };

  let currentTs = 0;
  groups.critical.forEach((task) => {
    timeline.push({ phase: task.phase, label: task.label, status: 'registered', ts: currentTs, detail: buildDesignTaskDetail(task) });
    currentTs += 10;
  });

  const highTs = currentTs;
  groups.high.forEach((task) => {
    timeline.push({ phase: task.phase, label: task.label, status: 'registered', ts: highTs, detail: buildDesignTaskDetail(task) });
  });

  currentTs += groups.high.length > 0 ? 20 : 0;
  groups.deferred.forEach((task) => {
    timeline.push({ phase: task.phase, label: task.label, status: 'registered', ts: currentTs, detail: buildDesignTaskDetail(task) });
    currentTs += 10;
  });

  currentTs += groups.idle.length > 0 ? 30 : 0;
  groups.idle.forEach((task) => {
    timeline.push({ phase: task.phase, label: task.label, status: 'registered', ts: currentTs, detail: buildDesignTaskDetail(task) });
    currentTs += 10;
  });

  return timeline;
}

export function isDesignEmbyEnabled(settings: ExtensionSettings & Record<string, any>): boolean {
  const rawPatterns = (settings as any)?.emby?.urlPatterns;
  return Array.isArray(rawPatterns) && rawPatterns.some((pattern: any) => typeof pattern === 'string' && pattern.trim().length > 0);
}

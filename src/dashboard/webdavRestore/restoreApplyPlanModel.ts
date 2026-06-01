import type { MergeOptions } from '../../features/webdavSync/application/dataDiff';

export interface RestoreStorageKeys {
  viewedRecords: string;
  actorRecords: string;
  settings: string;
  userProfile: string;
  logs: string;
  importStats: string;
  newWorksSubscriptions: string;
  newWorksRecords: string;
  newWorksConfig: string;
}

export type RestoreStorageWriteKind =
  | 'videoRecords'
  | 'actorRecords'
  | 'settings'
  | 'userProfile'
  | 'logs'
  | 'importStats'
  | 'newWorksSubscriptions'
  | 'newWorksRecords'
  | 'newWorksConfig';

export interface RestoreStorageWritePlan {
  kind: RestoreStorageWriteKind;
  key: string;
  value: any;
}

export function sanitizeRestoredActorRecords(actorRecords: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(actorRecords || {}).map(([id, actor]) => {
      const { blacklisted, ...rest } = actor || {};
      return [id, rest];
    }),
  );
}

export function buildMergeStorageWritePlans(
  mergedData: any,
  options: MergeOptions,
  keys: RestoreStorageKeys,
): RestoreStorageWritePlan[] {
  const plans: RestoreStorageWritePlan[] = [];
  if (!mergedData) return plans;

  if (options.restoreRecords && mergedData.videoRecords) {
    plans.push({ kind: 'videoRecords', key: keys.viewedRecords, value: mergedData.videoRecords });
  }

  if (options.restoreNewWorks && mergedData.newWorks) {
    const newWorks = mergedData.newWorks;
    if (newWorks.subscriptions) {
      plans.push({ kind: 'newWorksSubscriptions', key: keys.newWorksSubscriptions, value: newWorks.subscriptions });
    }
    if (newWorks.records) {
      plans.push({ kind: 'newWorksRecords', key: keys.newWorksRecords, value: newWorks.records });
    }
    if (newWorks.config) {
      plans.push({ kind: 'newWorksConfig', key: keys.newWorksConfig, value: newWorks.config });
    }
  }

  if (options.restoreActorRecords && mergedData.actorRecords) {
    plans.push({
      kind: 'actorRecords',
      key: keys.actorRecords,
      value: sanitizeRestoredActorRecords(mergedData.actorRecords),
    });
  }

  if (options.restoreSettings && mergedData.settings) {
    plans.push({ kind: 'settings', key: keys.settings, value: mergedData.settings });
  }

  if (options.restoreUserProfile && mergedData.userProfile) {
    plans.push({ kind: 'userProfile', key: keys.userProfile, value: mergedData.userProfile });
  }

  if (options.restoreLogs && mergedData.logs) {
    plans.push({ kind: 'logs', key: keys.logs, value: mergedData.logs });
  }

  if (options.restoreImportStats && mergedData.importStats) {
    plans.push({ kind: 'importStats', key: keys.importStats, value: mergedData.importStats });
  }

  return plans;
}

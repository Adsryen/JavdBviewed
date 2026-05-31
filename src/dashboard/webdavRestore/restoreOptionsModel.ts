type StorageKeys = {
  VIEWED_RECORDS: string;
  SETTINGS: string;
  LAST_IMPORT_STATS: string;
  USER_PROFILE: string;
  ACTOR_RECORDS: string;
  NEW_WORKS_SUBSCRIPTIONS: string;
  NEW_WORKS_RECORDS: string;
  NEW_WORKS_CONFIG: string;
};

const STORAGE_KEYS: StorageKeys = {
  VIEWED_RECORDS: 'viewed',
  SETTINGS: 'settings',
  LAST_IMPORT_STATS: 'last_import_stats',
  USER_PROFILE: 'user_profile',
  ACTOR_RECORDS: 'actor_records',
  NEW_WORKS_SUBSCRIPTIONS: 'new_works_subscriptions',
  NEW_WORKS_RECORDS: 'new_works_records',
  NEW_WORKS_CONFIG: 'new_works_config',
};

export type RestoreOptionDataKey =
  | 'settings'
  | 'data'
  | 'userProfile'
  | 'actorRecords'
  | 'logs'
  | 'magnetPushLogs'
  | 'newWorks'
  | 'importStats'
  | 'magnets';

export type RestoreOptionState = 'available' | 'warning' | 'unavailable';

export interface RestoreOptionDefinition {
  id: string;
  dataKey: RestoreOptionDataKey;
  required: boolean;
  name: string;
}

export interface RestoreOptionViewModel extends RestoreOptionDefinition {
  state: RestoreOptionState;
  disabled: boolean;
  checked: boolean;
  dataset: any;
  statsText?: string;
  message?: string;
}

export const RESTORE_OPTION_DEFINITIONS: RestoreOptionDefinition[] = [
  { id: 'webdavRestoreSettings', dataKey: 'settings', required: true, name: '扩展设置' },
  { id: 'webdavRestoreRecords', dataKey: 'data', required: true, name: '观看记录' },
  { id: 'webdavRestoreUserProfile', dataKey: 'userProfile', required: true, name: '账号信息' },
  { id: 'webdavRestoreActorRecords', dataKey: 'actorRecords', required: false, name: '演员库' },
  { id: 'webdavRestoreLogs', dataKey: 'logs', required: false, name: '日志记录' },
  { id: 'webdavRestoreMagnetPushLogs', dataKey: 'magnetPushLogs', required: false, name: '磁力推送日志' },
  { id: 'webdavRestoreNewWorks', dataKey: 'newWorks', required: false, name: '新作品（订阅/记录/配置）' },
  { id: 'webdavRestoreImportStats', dataKey: 'importStats', required: false, name: '导入统计' },
  { id: 'webdavRestoreMagnets', dataKey: 'magnets', required: false, name: '磁链缓存' },
];

export function buildRestoreOptionViewModels(cloudData: any): RestoreOptionViewModel[] {
  return RESTORE_OPTION_DEFINITIONS.map((definition) => {
    const dataset = resolveOptionDataset(cloudData, definition.dataKey);
    const hasData = hasOptionData(definition.dataKey, dataset);

    if (hasData) {
      return {
        ...definition,
        state: 'available',
        disabled: false,
        checked: true,
        dataset,
        statsText: buildOptionStatsText(definition.dataKey, dataset),
      };
    }

    if (definition.required) {
      return {
        ...definition,
        state: 'warning',
        disabled: false,
        checked: true,
        dataset,
        message: `${definition.name}数据在备份中缺失`,
      };
    }

    return {
      ...definition,
      state: 'unavailable',
      disabled: true,
      checked: false,
      dataset,
      message: `${definition.name}在此备份中不可用`,
    };
  });
}

export function summarizeRestoreOptionViewModels(viewModels: RestoreOptionViewModel[]): {
  availableOptions: number;
  unavailableOptions: number;
} {
  return {
    availableOptions: viewModels.filter(item => item.state !== 'unavailable').length,
    unavailableOptions: viewModels.filter(item => item.state === 'unavailable').length,
  };
}

function resolveOptionDataset(cloudData: any, dataKey: RestoreOptionDataKey): any {
  const sa = cloudData?.storageAll || {};

  switch (dataKey) {
    case 'data':
      return cloudData?.data || cloudData?.viewed || sa[STORAGE_KEYS.VIEWED_RECORDS] ||
        (Array.isArray(cloudData?.idb?.viewedRecords) ? cloudData.idb.viewedRecords : undefined);
    case 'actorRecords':
      return cloudData?.actorRecords || sa[STORAGE_KEYS.ACTOR_RECORDS] ||
        (Array.isArray(cloudData?.idb?.actors) ? cloudData.idb.actors : undefined);
    case 'magnetPushLogs':
      return cloudData?.magnetPushLogs || cloudData?.data?.magnetPushLogs ||
        (Array.isArray(cloudData?.idb?.magnetPushLogs) ? cloudData.idb.magnetPushLogs : undefined);
    case 'settings':
      return cloudData?.settings || sa[STORAGE_KEYS.SETTINGS];
    case 'userProfile':
      return cloudData?.userProfile ?? sa[STORAGE_KEYS.USER_PROFILE];
    case 'logs':
      return cloudData?.logs || (Array.isArray(cloudData?.idb?.logs) ? cloudData.idb.logs : undefined);
    case 'newWorks': {
      const subs = countObjectEntries(cloudData?.newWorks?.subscriptions || sa[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS]);
      const recs = countObjectEntries(cloudData?.newWorks?.records || sa[STORAGE_KEYS.NEW_WORKS_RECORDS]);
      const cfg = countObjectEntries(cloudData?.newWorks?.config || sa[STORAGE_KEYS.NEW_WORKS_CONFIG]);
      return cloudData?.newWorks || { subscriptions: subs, records: recs, config: cfg };
    }
    case 'importStats':
      return cloudData?.importStats ?? sa[STORAGE_KEYS.LAST_IMPORT_STATS];
    case 'magnets':
      return Array.isArray(cloudData?.idb?.magnets) ? cloudData.idb.magnets : [];
    default:
      return cloudData ? cloudData[dataKey] : undefined;
  }
}

function hasOptionData(dataKey: RestoreOptionDataKey, dataset: any): boolean {
  if (dataKey === 'newWorks') {
    return countNewWorksDataset(dataset) > 0;
  }
  if (Array.isArray(dataset)) return dataset.length > 0;
  if (dataset && typeof dataset === 'object') return Object.keys(dataset).length > 0;
  return Boolean(dataset);
}

function buildOptionStatsText(dataKey: RestoreOptionDataKey, data: any): string | undefined {
  switch (dataKey) {
    case 'data':
      return `包含 ${countCollection(data)} 条观看记录`;
    case 'actorRecords':
      return `包含 ${countCollection(data)} 个演员信息`;
    case 'logs':
      return Array.isArray(data) ? `包含 ${data.length} 条日志记录` : undefined;
    case 'settings':
      return data && typeof data === 'object' ? `包含 ${Object.keys(data).length} 项设置` : undefined;
    case 'userProfile':
      return data?.email ? `账号: ${data.email}` : undefined;
    case 'importStats':
      if (data?.lastImportTime) {
        const date = new Date(data.lastImportTime);
        return `最后导入: ${date.toLocaleDateString()}`;
      }
      return undefined;
    case 'newWorks': {
      const subs = countNewWorksPart(data?.subscriptions);
      const recs = countNewWorksPart(data?.records);
      return `订阅 ${subs} · 记录 ${recs}`;
    }
    case 'magnets':
      return `包含 ${countCollection(data)} 条磁链缓存`;
    default:
      return undefined;
  }
}

function countCollection(data: any): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') return Object.keys(data).length;
  return 0;
}

function countObjectEntries(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  return Object.keys(data).length;
}

function countNewWorksDataset(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  return countNewWorksPart(data.subscriptions) + countNewWorksPart(data.records) + countNewWorksPart(data.config);
}

function countNewWorksPart(data: any): number {
  if (typeof data === 'number') return data;
  if (data && typeof data === 'object') return Object.keys(data).length;
  return 0;
}

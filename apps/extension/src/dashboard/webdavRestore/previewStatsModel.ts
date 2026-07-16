interface StorageKeys {
  VIEWED_RECORDS: string;
  ACTOR_RECORDS: string;
  NEW_WORKS_SUBSCRIPTIONS: string;
  NEW_WORKS_RECORDS: string;
}

const STORAGE_KEYS: StorageKeys = {
  VIEWED_RECORDS: 'viewed',
  ACTOR_RECORDS: 'actor_records',
  NEW_WORKS_SUBSCRIPTIONS: 'new_works_subscriptions',
  NEW_WORKS_RECORDS: 'new_works_records',
};

export interface CloudPreviewStatsInput {
  cloudData: any;
  previewCounts?: Record<string, unknown>;
}

export interface CloudPreviewStats {
  videoCount: number;
  actorCount: number;
  newWorksSubscriptionCount: number;
  newWorksRecordCount: number;
  magnetCount: number;
  magnetPushLogCount: number;
}

export interface CloudPreviewStatItem {
  id: string;
  label: string;
  value: number;
  fixed: boolean;
}

export function buildCloudPreviewStats(input: CloudPreviewStatsInput): CloudPreviewStats {
  const cloudData = input.cloudData || {};
  const previewCounts = input.previewCounts || {};
  const storageAll = cloudData.storageAll || {};

  return {
    videoCount: countFromPreviewOrFallback(
      previewCounts.viewed,
      () => countObjectEntries(cloudData.data || cloudData.viewed || storageAll[STORAGE_KEYS.VIEWED_RECORDS]) ||
        countArrayEntries(cloudData.idb?.viewedRecords),
    ),
    actorCount: countFromPreviewOrFallback(
      previewCounts.actors,
      () => countArrayEntries(cloudData.idb?.actors) ||
        countObjectEntries(cloudData.actorRecords) ||
        countObjectEntries(storageAll[STORAGE_KEYS.ACTOR_RECORDS]),
    ),
    newWorksSubscriptionCount: countObjectEntries(cloudData.newWorks?.subscriptions || storageAll[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS]),
    newWorksRecordCount: countObjectEntries(cloudData.newWorks?.records || storageAll[STORAGE_KEYS.NEW_WORKS_RECORDS]),
    magnetCount: countFromPreviewOrFallback(
      previewCounts.magnets,
      () => countArrayEntries(cloudData.idb?.magnets),
    ),
    magnetPushLogCount: countFromPreviewOrFallback(
      previewCounts.magnetPushLogs,
      () => countArrayEntries(cloudData.idb?.magnetPushLogs),
    ),
  };
}

export function buildCloudPreviewStatItems(stats: CloudPreviewStats): CloudPreviewStatItem[] {
  return [
    { id: 'quickVideoCount', label: '观看记录', value: stats.videoCount, fixed: true },
    { id: 'quickActorCount', label: '演员记录', value: stats.actorCount, fixed: true },
    { id: 'quickNewWorksSubsCount', label: '新作品订阅', value: stats.newWorksSubscriptionCount, fixed: true },
    { id: 'quickNewWorksRecsCount', label: '新作品记录', value: stats.newWorksRecordCount, fixed: true },
    { id: 'quickMagnetCount', label: '磁链缓存', value: stats.magnetCount, fixed: false },
    { id: 'quickMagnetPushLogCount', label: '磁力推送日志', value: stats.magnetPushLogCount, fixed: false },
  ];
}

export function buildExtraStatItemHtml(item: CloudPreviewStatItem): string {
  return `
                    <span class="stat-number" id="${escapeHtml(item.id)}">${item.value}</span>
                    <span class="stat-label">${escapeHtml(item.label)}</span>
                `;
}

function countFromPreviewOrFallback(value: unknown, fallback: () => number): number {
  const previewCount = Number(value ?? NaN);
  return Number.isNaN(previewCount) ? fallback() : previewCount;
}

function countArrayEntries(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function countObjectEntries(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  return Object.keys(value).length;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @file syncSettingsModel.ts
 * @description 同步设置纯数据模型：默认值、映射、校验
 * @module apps/dashboard/pages/settings/sync
 */
import type { ExtensionSettings } from '../../../../../types';

export type SyncSettingsFormState = {
  wantWatchUrl: string;
  watchedVideosUrl: string;
  requestInterval: number;
  batchSize: number;
  maxRetries: number;
  actorEnabled: boolean;
  actorAutoSync: boolean;
  actorSyncInterval: number;
  actorCollectionUrl: string;
  actorDetailUrl: string;
  actorRequestInterval: number;
  actorBatchSize: number;
  actorMaxRetries: number;
};

export const DEFAULT_SYNC_SETTINGS_FORM: SyncSettingsFormState = {
  wantWatchUrl: 'https://javdb.com/users/want_watch_videos',
  watchedVideosUrl: 'https://javdb.com/users/watched_videos',
  requestInterval: 3,
  batchSize: 20,
  maxRetries: 3,
  actorEnabled: false,
  actorAutoSync: false,
  actorSyncInterval: 1440,
  actorCollectionUrl: 'https://javdb.com/users/collection_actors',
  actorDetailUrl: 'https://javdb.com/actors/{{ACTOR_ID}}',
  actorRequestInterval: 3,
  actorBatchSize: 20,
  actorMaxRetries: 3,
};

function n(v: unknown, def: number): number {
  const x = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isFinite(x) ? x : def;
}

export function mapSettingsToSyncForm(
  settings: Partial<ExtensionSettings> | null | undefined,
): SyncSettingsFormState {
  const dataSync = settings?.dataSync as any;
  const actorSync = settings?.actorSync as any;
  return {
    wantWatchUrl: dataSync?.urls?.wantWatch || DEFAULT_SYNC_SETTINGS_FORM.wantWatchUrl,
    watchedVideosUrl:
      dataSync?.urls?.watchedVideos || DEFAULT_SYNC_SETTINGS_FORM.watchedVideosUrl,
    requestInterval: n(dataSync?.requestInterval, 3),
    batchSize: n(dataSync?.batchSize, 20),
    maxRetries: n(dataSync?.maxRetries, 3),
    actorEnabled: !!actorSync?.enabled,
    actorAutoSync: !!actorSync?.autoSync,
    actorSyncInterval: n(actorSync?.syncInterval, 1440),
    actorCollectionUrl:
      actorSync?.urls?.collectionActors || DEFAULT_SYNC_SETTINGS_FORM.actorCollectionUrl,
    actorDetailUrl: actorSync?.urls?.actorDetail || DEFAULT_SYNC_SETTINGS_FORM.actorDetailUrl,
    actorRequestInterval: n(actorSync?.requestInterval, 3),
    actorBatchSize: n(actorSync?.batchSize, 20),
    actorMaxRetries: n(actorSync?.maxRetries, 3),
  };
}

export function applySyncFormToSettings(
  current: ExtensionSettings,
  form: SyncSettingsFormState,
): ExtensionSettings {
  return {
    ...current,
    dataSync: {
      ...(current.dataSync || {}),
      requestInterval: form.requestInterval,
      batchSize: form.batchSize,
      maxRetries: form.maxRetries,
      urls: {
        ...((current.dataSync as any)?.urls || {}),
        wantWatch: form.wantWatchUrl,
        watchedVideos: form.watchedVideosUrl,
        collectionActors: form.actorCollectionUrl,
      },
    },
    actorSync: {
      ...(current.actorSync || {}),
      enabled: form.actorEnabled,
      autoSync: form.actorAutoSync,
      syncInterval: form.actorSyncInterval,
      batchSize: form.actorBatchSize,
      maxRetries: form.actorMaxRetries,
      requestInterval: form.actorRequestInterval,
      urls: {
        ...((current.actorSync as any)?.urls || {}),
        collectionActors: form.actorCollectionUrl,
        actorDetail: form.actorDetailUrl,
      },
    },
  };
}

export function validateSyncForm(form: SyncSettingsFormState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (form.requestInterval < 1 || form.requestInterval > 60) {
    errors.push('视频同步请求间隔必须在1-60秒之间');
  }
  if (form.batchSize < 10 || form.batchSize > 100) {
    errors.push('视频同步批量处理大小必须在10-100之间');
  }
  if (form.maxRetries < 1 || form.maxRetries > 10) {
    errors.push('视频同步最大重试次数必须在1-10之间');
  }
  if (form.actorSyncInterval < 60 || form.actorSyncInterval > 10080) {
    errors.push('演员同步间隔必须在60-10080分钟之间');
  }
  if (form.actorRequestInterval < 3 || form.actorRequestInterval > 60) {
    errors.push('演员同步请求间隔必须在3-60秒之间');
  }
  if (form.actorBatchSize < 10 || form.actorBatchSize > 50) {
    errors.push('演员同步批量处理大小必须在10-50之间');
  }
  if (form.actorMaxRetries < 1 || form.actorMaxRetries > 10) {
    errors.push('演员同步最大重试次数必须在1-10之间');
  }
  return { isValid: errors.length === 0, errors };
}

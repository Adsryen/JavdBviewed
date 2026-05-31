import type { VideoRecord, VideoStatus } from '../../../types';

export type BackupVersion = 'v1' | 'v2' | 'unknown';

export type BackupMigrationLogger = (
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  message: string,
  data?: any,
) => void;

export interface BackupMigrationOptions {
  now?: () => number;
  logger?: BackupMigrationLogger;
}

export function detectBackupVersion(data: any): BackupVersion {
  if (!data || typeof data !== 'object') return 'unknown';

  if (data.version || data.timestamp || (data.data && typeof data.data === 'object')) {
    return 'v2';
  }

  if (data.viewed || data.browsed || data.want) {
    return 'v1';
  }

  const firstKey = Object.keys(data)[0];
  if (firstKey && data[firstKey] && typeof data[firstKey] === 'object') {
    const rec = data[firstKey] as any;
    if ((rec.status === 'viewed' || rec.status === 'unviewed') && !rec.createdAt) {
      return 'v1';
    }
    if (rec.createdAt || rec.updatedAt) {
      return 'v2';
    }
  }

  return 'unknown';
}

export function migrateOldRecord(record: any, now: number = Date.now()): VideoRecord {
  if (record.createdAt && record.updatedAt) {
    return record as VideoRecord;
  }

  let status: VideoStatus = 'browsed';
  if (record.status === 'viewed') {
    status = 'viewed';
  } else if (record.status === 'want') {
    status = 'want';
  } else if (record.status === 'unviewed') {
    status = 'browsed';
  }

  return {
    ...record,
    id: record.id,
    title: record.title || record.id,
    status,
    tags: record.tags || [],
    listIds: record.listIds || [],
    createdAt: record.createdAt || now,
    updatedAt: now,
    releaseDate: record.releaseDate,
    javdbUrl: record.javdbUrl,
    javdbImage: record.javdbImage,
    enhancedData: record.enhancedData,
  };
}

export function migrateBackupData(oldData: any, options: BackupMigrationOptions = {}): any {
  const version = detectBackupVersion(oldData);
  const logger = options.logger;

  logger?.('INFO', 'WebDAV恢复：检测到备份数据版本', { version });

  if (version === 'v2') {
    return oldData;
  }

  if (version === 'v1') {
    logger?.('INFO', 'WebDAV恢复：开始迁移旧版本数据格式');

    const now = options.now?.() ?? Date.now();
    const migratedData: any = {
      version: '2.1',
      timestamp: new Date(now).toISOString(),
      data: {},
      actorRecords: oldData.actorRecords || {},
      settings: oldData.settings,
      userProfile: oldData.userProfile,
      logs: oldData.logs || [],
      importStats: oldData.importStats,
      newWorks: oldData.newWorks || {},
    };

    const recordsSource = oldData.data || oldData.viewed || oldData;
    if (recordsSource && typeof recordsSource === 'object') {
      const migratedRecords: Record<string, VideoRecord> = {};
      let migratedCount = 0;

      for (const [id, record] of Object.entries(recordsSource)) {
        if (record && typeof record === 'object') {
          migratedRecords[id] = migrateOldRecord(record as any, now);
          migratedCount++;
        }
      }

      migratedData.data = migratedRecords;
      logger?.('INFO', 'WebDAV恢复：已迁移视频记录', { count: migratedCount });
    }

    if (oldData.browsed && typeof oldData.browsed === 'object') {
      let browsedCount = 0;
      for (const [id, record] of Object.entries(oldData.browsed)) {
        if (record && typeof record === 'object' && !migratedData.data[id]) {
          const migrated = migrateOldRecord(record as any, now);
          migrated.status = 'browsed';
          migratedData.data[id] = migrated;
          browsedCount++;
        }
      }
      if (browsedCount > 0) {
        logger?.('INFO', 'WebDAV恢复：已迁移browsed记录', { count: browsedCount });
      }
    }

    if (oldData.want && typeof oldData.want === 'object') {
      let wantCount = 0;
      for (const [id, record] of Object.entries(oldData.want)) {
        if (record && typeof record === 'object' && !migratedData.data[id]) {
          const migrated = migrateOldRecord(record as any, now);
          migrated.status = 'want';
          migratedData.data[id] = migrated;
          wantCount++;
        }
      }
      if (wantCount > 0) {
        logger?.('INFO', 'WebDAV恢复：已迁移want记录', { count: wantCount });
      }
    }

    logger?.('INFO', 'WebDAV恢复：旧版本数据迁移完成', {
      totalRecords: Object.keys(migratedData.data).length,
      actors: Object.keys(migratedData.actorRecords).length,
    });

    return migratedData;
  }

  logger?.('WARN', 'WebDAV恢复：无法识别备份数据版本，尝试原样导入');
  return oldData;
}

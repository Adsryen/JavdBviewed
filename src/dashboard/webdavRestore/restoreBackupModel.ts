export interface RestoreBackupDataInput {
  data: any;
  now: Date;
  originalFile?: string;
}

export interface RestoreBackupData {
  timestamp: number;
  version: '2.0';
  data: any;
  metadata: {
    createdBy: 'smart-restore';
    originalFile?: string;
  };
}

export function formatRestoreBackupTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

export function formatRestoreBackupDownloadTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace(/[:.]/g, '-');
}

export function buildRestoreBackupKey(prefix: string, timestamp: string): string {
  return `${prefix}_${timestamp}`;
}

export function buildRestoreBackupDownloadName(date: Date): string {
  return `restore-backup-${formatRestoreBackupDownloadTimestamp(date)}.json`;
}

export function buildRestoreBackupData(input: RestoreBackupDataInput): RestoreBackupData {
  return {
    timestamp: input.now.getTime(),
    version: '2.0',
    data: input.data,
    metadata: {
      createdBy: 'smart-restore',
      originalFile: input.originalFile,
    },
  };
}

export function selectRestoreBackupKeys(keys: string[], prefix: string): string[] {
  return keys.filter((key) => key.startsWith(prefix)).sort();
}

export function findLatestRestoreBackupKey(keys: string[], prefix: string): string | null {
  const restoreBackupKeys = selectRestoreBackupKeys(keys, prefix);
  return restoreBackupKeys.at(-1) ?? null;
}

export function selectOldRestoreBackupKeys(keys: string[], prefix: string, keepCount: number): string[] {
  const restoreBackupKeys = selectRestoreBackupKeys(keys, prefix);
  if (restoreBackupKeys.length <= keepCount) return [];

  return restoreBackupKeys.slice(0, restoreBackupKeys.length - keepCount);
}

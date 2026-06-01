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

export function buildRestoreBackupKey(prefix: string, timestamp: string): string {
  return `${prefix}_${timestamp}`;
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

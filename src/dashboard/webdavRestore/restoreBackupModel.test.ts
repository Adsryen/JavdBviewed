import { describe, expect, it } from 'vitest';
import {
  buildRestoreBackupData,
  buildRestoreBackupKey,
  formatRestoreBackupTimestamp,
} from './restoreBackupModel';

describe('WebDAV restore backup model', () => {
  it('formats restore backup timestamp for storage keys', () => {
    expect(formatRestoreBackupTimestamp(new Date('2026-06-01T00:01:02.345Z'))).toBe('2026-06-01T00-01-02-345Z');
  });

  it('builds restore backup storage key', () => {
    expect(buildRestoreBackupKey('restore_backup', '2026-06-01T00-01-02-345Z')).toBe('restore_backup_2026-06-01T00-01-02-345Z');
  });

  it('builds restore backup payload with original file metadata', () => {
    const data = { viewedRecords: { 'AAA-001': { id: 'AAA-001' } } };
    const backup = buildRestoreBackupData({
      data,
      now: new Date('2026-06-01T00:01:02.345Z'),
      originalFile: 'javdb-extension-backup-2026-06-01.zip',
    });

    expect(backup).toEqual({
      timestamp: Date.parse('2026-06-01T00:01:02.345Z'),
      version: '2.0',
      data,
      metadata: {
        createdBy: 'smart-restore',
        originalFile: 'javdb-extension-backup-2026-06-01.zip',
      },
    });
  });
});

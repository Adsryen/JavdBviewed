import { describe, expect, it } from 'vitest';
import {
  buildRestoreBackupData,
  buildRestoreBackupKey,
  buildRestoreBackupDownloadName,
  findLatestRestoreBackupKey,
  formatRestoreBackupTimestamp,
  selectOldRestoreBackupKeys,
  selectRestoreBackupKeys,
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

  it('selects restore backup keys in chronological key order', () => {
    expect(
      selectRestoreBackupKeys(
        [
          'unrelated',
          'restore_backup_2026-06-01T00-03-00-000Z',
          'restore_backup_2026-06-01T00-01-00-000Z',
          'restore_backup_2026-06-01T00-02-00-000Z',
        ],
        'restore_backup',
      ),
    ).toEqual([
      'restore_backup_2026-06-01T00-01-00-000Z',
      'restore_backup_2026-06-01T00-02-00-000Z',
      'restore_backup_2026-06-01T00-03-00-000Z',
    ]);
  });

  it('finds the latest restore backup key', () => {
    expect(
      findLatestRestoreBackupKey(
        [
          'restore_backup_2026-06-01T00-01-00-000Z',
          'restore_backup_2026-06-01T00-04-00-000Z',
          'restore_backup_2026-06-01T00-03-00-000Z',
        ],
        'restore_backup',
      ),
    ).toBe('restore_backup_2026-06-01T00-04-00-000Z');
  });

  it('returns null when latest restore backup key is missing', () => {
    expect(findLatestRestoreBackupKey(['other_key'], 'restore_backup')).toBeNull();
  });

  it('selects old restore backup keys beyond keep count', () => {
    expect(
      selectOldRestoreBackupKeys(
        [
          'restore_backup_2026-06-01T00-04-00-000Z',
          'restore_backup_2026-06-01T00-01-00-000Z',
          'restore_backup_2026-06-01T00-03-00-000Z',
          'restore_backup_2026-06-01T00-02-00-000Z',
        ],
        'restore_backup',
        2,
      ),
    ).toEqual([
      'restore_backup_2026-06-01T00-01-00-000Z',
      'restore_backup_2026-06-01T00-02-00-000Z',
    ]);
  });

  it('keeps all restore backup keys when keep count covers them', () => {
    expect(
      selectOldRestoreBackupKeys(
        ['restore_backup_2026-06-01T00-01-00-000Z'],
        'restore_backup',
        5,
      ),
    ).toEqual([]);
  });

  it('builds restore backup download file name', () => {
    expect(buildRestoreBackupDownloadName(new Date('2026-06-01T00:01:02.345Z'))).toBe(
      'restore-backup-2026-06-01T00-01-02.json',
    );
  });
});

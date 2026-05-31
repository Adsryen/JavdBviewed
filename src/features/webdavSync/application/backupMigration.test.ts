import { describe, expect, it, vi } from 'vitest';
import { detectBackupVersion, migrateBackupData } from './backupMigration';

describe('WebDAV backup migration', () => {
  it('detects legacy, current, and unknown backup shapes', () => {
    expect(detectBackupVersion({ viewed: {} })).toBe('v1');
    expect(detectBackupVersion({ version: '2.1', data: {} })).toBe('v2');
    expect(detectBackupVersion({ ABC123: { status: 'viewed' } })).toBe('v1');
    expect(detectBackupVersion({ ABC123: { createdAt: 1, updatedAt: 2 } })).toBe('v2');
    expect(detectBackupVersion(null)).toBe('unknown');
  });

  it('migrates old viewed, browsed, and want maps into v2 video records', () => {
    const logger = vi.fn();
    const migrated = migrateBackupData(
      {
        viewed: {
          'AAA-001': { id: 'AAA-001', title: 'Viewed title', status: 'viewed' },
        },
        browsed: {
          'BBB-002': { id: 'BBB-002', status: 'unviewed' },
        },
        want: {
          'CCC-003': { id: 'CCC-003', title: 'Want title', status: 'want', tags: ['tag'] },
        },
        actorRecords: { actor1: { name: 'Actor' } },
        logs: [{ message: 'ok' }],
      },
      {
        now: () => 1234567890,
        logger,
      },
    );

    expect(migrated).toMatchObject({
      version: '2.1',
      data: {
        'AAA-001': {
          id: 'AAA-001',
          title: 'Viewed title',
          status: 'viewed',
          tags: [],
          listIds: [],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
        'BBB-002': {
          id: 'BBB-002',
          title: 'BBB-002',
          status: 'browsed',
          tags: [],
          listIds: [],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
        'CCC-003': {
          id: 'CCC-003',
          title: 'Want title',
          status: 'want',
          tags: ['tag'],
          listIds: [],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      },
      actorRecords: { actor1: { name: 'Actor' } },
      logs: [{ message: 'ok' }],
    });
    expect(logger).toHaveBeenCalledWith('INFO', 'WebDAV恢复：旧版本数据迁移完成', {
      totalRecords: 3,
      actors: 1,
    });
  });
});

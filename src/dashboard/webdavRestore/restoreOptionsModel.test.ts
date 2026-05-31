import { describe, expect, it } from 'vitest';
import { buildRestoreOptionViewModels } from './restoreOptionsModel';

describe('WebDAV restore options model', () => {
  it('marks available backup sections with checked enabled options and stats text', () => {
    const viewModels = buildRestoreOptionViewModels({
      settings: { display: {}, webdav: {} },
      data: {
        'AAA-001': { id: 'AAA-001' },
        'BBB-002': { id: 'BBB-002' },
      },
      userProfile: { email: 'user@example.com' },
      actorRecords: {
        actor1: { id: 'actor1' },
      },
      logs: [{ message: 'ok' }],
      newWorks: {
        subscriptions: { actor1: {} },
        records: { work1: {}, work2: {} },
      },
      importStats: { lastImportTime: '2026-05-30T00:00:00.000Z' },
      idb: {
        magnets: [{ hash: 'a' }, { hash: 'b' }, { hash: 'c' }],
      },
    });

    expect(viewModels.find(item => item.id === 'webdavRestoreRecords')).toMatchObject({
      state: 'available',
      disabled: false,
      checked: true,
      statsText: '包含 2 条观看记录',
    });
    expect(viewModels.find(item => item.id === 'webdavRestoreUserProfile')?.statsText).toBe('账号: user@example.com');
    expect(viewModels.find(item => item.id === 'webdavRestoreNewWorks')?.statsText).toBe('订阅 1 · 记录 2');
    expect(viewModels.find(item => item.id === 'webdavRestoreMagnets')?.statsText).toBe('包含 3 条磁链缓存');
  });

  it('keeps required missing sections enabled with warning state', () => {
    const viewModels = buildRestoreOptionViewModels({});

    expect(viewModels.find(item => item.id === 'webdavRestoreSettings')).toMatchObject({
      state: 'warning',
      disabled: false,
      checked: true,
      message: '扩展设置数据在备份中缺失',
    });
    expect(viewModels.find(item => item.id === 'webdavRestoreRecords')).toMatchObject({
      state: 'warning',
      disabled: false,
      checked: true,
      message: '观看记录数据在备份中缺失',
    });
  });

  it('disables optional missing sections with unavailable state', () => {
    const viewModels = buildRestoreOptionViewModels({});

    expect(viewModels.find(item => item.id === 'webdavRestoreActorRecords')).toMatchObject({
      state: 'unavailable',
      disabled: true,
      checked: false,
      message: '演员库在此备份中不可用',
    });
  });

  it('uses storageAll and idb fallback sources', () => {
    const viewModels = buildRestoreOptionViewModels({
      storageAll: {
        viewed: { 'AAA-001': {} },
        actor_records: { actor1: {}, actor2: {} },
        new_works_subscriptions: { actor1: {} },
        new_works_records: { work1: {} },
        new_works_config: { enabled: true },
      },
      idb: {
        logs: [{ message: 'log' }],
        magnetPushLogs: [{ id: 'push' }],
      },
    });

    expect(viewModels.find(item => item.id === 'webdavRestoreRecords')?.statsText).toBe('包含 1 条观看记录');
    expect(viewModels.find(item => item.id === 'webdavRestoreActorRecords')?.statsText).toBe('包含 2 个演员信息');
    expect(viewModels.find(item => item.id === 'webdavRestoreLogs')?.statsText).toBe('包含 1 条日志记录');
    expect(viewModels.find(item => item.id === 'webdavRestoreNewWorks')?.statsText).toBe('订阅 1 · 记录 1');
    expect(viewModels.find(item => item.id === 'webdavRestoreMagnetPushLogs')).toMatchObject({
      state: 'available',
      disabled: false,
      checked: true,
    });
  });
});

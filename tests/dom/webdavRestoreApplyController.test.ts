import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreApplyController } from '../../src/dashboard/webdavRestore/restoreApplyController';

const storageKeys = {
  VIEWED_RECORDS: 'viewed',
  ACTOR_RECORDS: 'actor_records',
  SETTINGS: 'settings',
  USER_PROFILE: 'user_profile',
  LOGS: 'persistent_logs',
  LAST_IMPORT_STATS: 'last_import_stats',
  NEW_WORKS_SUBSCRIPTIONS: 'new_works_subscriptions',
  NEW_WORKS_RECORDS: 'new_works_records',
  NEW_WORKS_CONFIG: 'new_works_config',
  RESTORE_BACKUP: 'restore_backup',
};

function mountRestoreApplyDom(): void {
  document.body.innerHTML = `
    <div id="webdavRestoreModal">
      <button id="webdavRestoreConfirm"></button>
      <button id="webdavRestoreCancel"></button>
      <input type="checkbox" id="webdavRestoreSettings" checked>
      <input type="checkbox" id="webdavRestoreRecords" checked>
      <input type="checkbox" id="webdavRestoreUserProfile" checked>
      <input type="checkbox" id="webdavRestoreActorRecords" checked>
      <input type="checkbox" id="webdavRestoreLogs">
      <input type="checkbox" id="webdavRestoreMagnetPushLogs">
      <input type="checkbox" id="webdavRestoreImportStats" checked>
    </div>
  `;
}

function validVideoRecord(id = 'AAA-001'): any {
  return {
    id,
    title: 'Title',
    status: 'viewed',
    createdAt: 1,
    updatedAt: 2,
    tags: [],
  };
}

function validActorRecord(id = 'actor-a'): any {
  return {
    id,
    name: 'Actor A',
    gender: 'female',
    category: 'censored',
    aliases: [],
  };
}

function validSettings(): any {
  return {
    display: {},
    webdav: {},
    dataSync: {},
    actorSync: {},
  };
}

function createController(overrides: Partial<ConstructorParameters<typeof WebDAVRestoreApplyController>[0]> = {}) {
  const storage = new Map<string, any>();
  const removedStorage: Array<string | string[]> = [];
  const setValue = vi.fn(async (key: string, value: any) => {
    storage.set(key, value);
  });
  const getValue = vi.fn(async (key: string, fallback: any) => storage.get(key) ?? fallback);
  const getAllStorage = vi.fn(async () => Object.fromEntries(storage));
  const removeStorage = vi.fn(async (keys: string | string[]) => {
    removedStorage.push(keys);
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      storage.delete(key);
    }
  });

  const options = {
    storageKeys,
    getSelectedFile: () => ({ name: 'javdb-extension-backup-2026-06-01.zip', path: '/backup.zip' }),
    getRestoreContext: () => ({
      diffResult: {
        videoRecords: { summary: {} },
        actorRecords: { summary: {} },
      } as any,
      cloudData: { settings: validSettings() },
      localData: { viewedRecords: { OLD: validVideoRecord('OLD') } },
    }),
    getConflictResolutions: () => ({}),
    queryInModal: (selector: string) => document.querySelector(selector),
    setValue,
    getValue,
    getAllStorage,
    removeStorage,
    clearMagnetPushLogs: vi.fn(async () => undefined),
    addMagnetPushLogs: vi.fn(async () => undefined),
    mergeData: vi.fn(() => ({
      success: true,
      mergedData: {
        videoRecords: { 'AAA-001': validVideoRecord('AAA-001') },
        actorRecords: { 'actor-a': validActorRecord('actor-a') },
        settings: validSettings(),
        userProfile: { username: 'tester' },
        importStats: { total: 1 },
      },
      summary: {
        videoRecords: { total: 1, added: 1, updated: 0, kept: 0 },
        actorRecords: { total: 1, added: 1, updated: 0, kept: 0 },
      },
    })),
    showMessage: vi.fn(),
    showRestoreResult: vi.fn(),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    logError: vi.fn(),
    reloadPage: vi.fn(),
    now: () => new Date('2026-06-01T00:01:02.345Z'),
    setTimeout: (callback: () => void) => {
      callback();
      return 1 as any;
    },
    ...overrides,
  };

  return {
    controller: new WebDAVRestoreApplyController(options),
    options,
    storage,
    removedStorage,
  };
}

describe('WebDAV restore apply controller', () => {
  beforeEach(() => {
    mountRestoreApplyDom();
    vi.restoreAllMocks();
  });

  it('runs smart merge restore, creates a pre-restore backup, writes validated data, and shows result', async () => {
    const { controller, options, storage } = createController();

    await controller.handleConfirmRestore();

    expect(options.mergeData).toHaveBeenCalledWith(
      { viewedRecords: { OLD: validVideoRecord('OLD') } },
      { settings: validSettings() },
      { videoRecords: { summary: {} }, actorRecords: { summary: {} } },
      expect.objectContaining({
        strategy: 'overwrite',
        restoreSettings: true,
        restoreRecords: true,
        restoreUserProfile: true,
        restoreActorRecords: true,
        restoreLogs: false,
        restoreMagnetPushLogs: false,
        restoreImportStats: true,
      }),
    );
    expect(storage.get('restore_backup_2026-06-01T00-01-02-345Z')).toMatchObject({
      version: '2.0',
      metadata: {
        createdBy: 'smart-restore',
        originalFile: 'javdb-extension-backup-2026-06-01.zip',
      },
    });
    expect(storage.get('viewed')).toEqual({ 'AAA-001': validVideoRecord('AAA-001') });
    expect(storage.get('actor_records')).toEqual({ 'actor-a': validActorRecord('actor-a') });
    expect(storage.get('settings')).toEqual(validSettings());
    expect(options.showRestoreResult).toHaveBeenCalledTimes(1);
    expect(options.logInfo).toHaveBeenCalledWith('智能合并恢复成功', {
      summary: {
        videoRecords: { total: 1, added: 1, updated: 0, kept: 0 },
        actorRecords: { total: 1, added: 1, updated: 0, kept: 0 },
      },
    });
    expect((document.getElementById('webdavRestoreConfirm') as HTMLButtonElement).disabled).toBe(true);
  });

  it('warns and skips restore when preview context is incomplete', async () => {
    const { controller, options } = createController({
      getRestoreContext: () => ({
        diffResult: null,
        cloudData: null,
        localData: null,
      }),
    });

    await controller.handleConfirmRestore();

    expect(options.showMessage).toHaveBeenCalledWith('请先点击"分析"按钮预览恢复内容，预览是必经步骤', 'warn');
    expect(options.mergeData).not.toHaveBeenCalled();
    expect(options.setValue).not.toHaveBeenCalled();
  });

  it('rolls back from the latest restore backup and removes the consumed backup', async () => {
    const { controller, options, storage, removedStorage } = createController();
    storage.set('restore_backup_2026-06-01T00-01-00-000Z', { data: { viewedRecords: { old: true } } });
    storage.set('restore_backup_2026-06-01T00-02-00-000Z', {
      data: {
        viewedRecords: { 'AAA-001': validVideoRecord('AAA-001') },
        actorRecords: { 'actor-a': validActorRecord('actor-a') },
        settings: validSettings(),
        magnetPushLogs: [{ id: 'log-1' }],
      },
    });

    await controller.rollbackLastRestore();

    expect(storage.get('viewed')).toEqual({ 'AAA-001': validVideoRecord('AAA-001') });
    expect(storage.get('actor_records')).toEqual({ 'actor-a': validActorRecord('actor-a') });
    expect(options.clearMagnetPushLogs).toHaveBeenCalledTimes(1);
    expect(options.addMagnetPushLogs).toHaveBeenCalledWith([{ id: 'log-1' }]);
    expect(removedStorage).toEqual(['restore_backup_2026-06-01T00-02-00-000Z']);
    expect(options.showMessage).toHaveBeenCalledWith('已成功回滚到恢复前状态，页面即将刷新', 'success');
    expect(options.reloadPage).toHaveBeenCalledTimes(1);
  });

  it('cleans old restore backups beyond keep count', async () => {
    const { controller, options, storage, removedStorage } = createController();
    storage.set('restore_backup_2026-06-01T00-01-00-000Z', { data: {} });
    storage.set('restore_backup_2026-06-01T00-02-00-000Z', { data: {} });
    storage.set('restore_backup_2026-06-01T00-03-00-000Z', { data: {} });
    storage.set('restore_backup_2026-06-01T00-04-00-000Z', { data: {} });

    await controller.cleanupOldBackups(2);

    expect(removedStorage).toEqual([[
      'restore_backup_2026-06-01T00-01-00-000Z',
      'restore_backup_2026-06-01T00-02-00-000Z',
    ]]);
    expect(options.logInfo).toHaveBeenCalledWith('清理旧备份完成', {
      deleted: 2,
      remaining: 2,
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreUnifiedExecutorController } from '../../src/dashboard/webdavRestore/restoreUnifiedExecutorController';

function mountUnifiedRestoreDom(): void {
  document.body.innerHTML = `
    <div id="webdavRestoreModal">
      <input type="checkbox" id="webdavRestoreMagnetPushLogsSimple" checked>
      <input type="checkbox" id="webdavRestoreMagnets">
      <input type="checkbox" id="webdavAutoBackupBeforeRestore" checked>
    </div>
  `;
}

function createController(overrides: Partial<ConstructorParameters<typeof WebDAVRestoreUnifiedExecutorController>[0]> = {}) {
  const sendRuntimeMessage = vi.fn((message: any, callback: (response: any) => void) => {
    callback({
      success: true,
      summary: {
        categories: {
          viewed: { replaced: true, written: 2 },
        },
      },
    });
  });
  const options = {
    queryInModal: (selector: string) => document.querySelector(selector),
    getSelectedFile: () => ({ name: 'javdb-extension-backup-2026-06-01.zip', path: '/backup.zip' }),
    getCloudData: () => ({ data: { 'AAA-001': {} } }),
    requireAuthIfRestricted: vi.fn(async () => true),
    showConfirm: vi.fn(async () => true),
    showMessage: vi.fn(),
    showRestoreProgress: vi.fn(),
    showRestoreResults: vi.fn(),
    clearProgressTimer: vi.fn(),
    sendRuntimeMessage,
    logInfo: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };

  return {
    controller: new WebDAVRestoreUnifiedExecutorController(options),
    options,
  };
}

describe('WebDAV restore unified executor controller', () => {
  beforeEach(() => {
    mountUnifiedRestoreDom();
    vi.restoreAllMocks();
  });

  it('authenticates, confirms, runs unified restore, and shows results', async () => {
    const { controller, options } = createController();

    await controller.executeRestore({
      strategy: 'smart',
      restoreSettings: true,
      restoreRecords: true,
      restoreUserProfile: false,
      restoreActorRecords: true,
      restoreLogs: false,
      restoreMagnetPushLogs: false,
      restoreImportStats: true,
      restoreNewWorks: true,
    });

    expect(options.requireAuthIfRestricted).toHaveBeenCalledWith('webdav-sync', expect.any(Function), {
      title: '需要密码验证',
      message: '恢复云端备份将修改本地数据，请先完成密码验证。',
    });
    expect(options.showConfirm).toHaveBeenCalledWith(expect.objectContaining({
      title: '⚠️ 确认覆盖式恢复',
      confirmText: '确定恢复',
      cancelText: '取消',
      type: 'danger',
      isHtml: true,
    }));
    expect(options.showConfirm.mock.calls[0][0].message).toContain('<li>扩展设置</li>');
    expect(options.showConfirm.mock.calls[0][0].message).toContain('<li>观看记录</li>');
    expect(options.showConfirm.mock.calls[0][0].message).toContain('<li>磁力推送日志</li>');
    expect(options.showRestoreProgress).toHaveBeenCalledTimes(1);
    expect(options.sendRuntimeMessage).toHaveBeenCalledWith({
      type: 'WEB_DAV:RESTORE_UNIFIED',
      filename: '/backup.zip',
      options: {
        categories: {
          settings: true,
          userProfile: false,
          viewed: true,
          actors: true,
          newWorks: true,
          logs: false,
          magnetPushLogs: true,
          importStats: true,
          magnets: false,
        },
        autoBackupBeforeRestore: true,
      },
    }, expect.any(Function));
    expect(options.clearProgressTimer).toHaveBeenCalledTimes(1);
    expect(options.showRestoreResults).toHaveBeenCalledWith(
      { categories: { viewed: { replaced: true, written: 2 } } },
      { data: { 'AAA-001': {} } },
    );
  });

  it('stops when authentication is cancelled', async () => {
    const { controller, options } = createController({
      requireAuthIfRestricted: vi.fn(async () => false),
    });

    await controller.executeRestore({
      strategy: 'smart',
      restoreSettings: true,
      restoreRecords: true,
      restoreUserProfile: true,
      restoreActorRecords: true,
      restoreLogs: false,
      restoreImportStats: false,
    });

    expect(options.showMessage).toHaveBeenCalledWith('已取消：未通过密码验证', 'warn');
    expect(options.showConfirm).not.toHaveBeenCalled();
    expect(options.sendRuntimeMessage).not.toHaveBeenCalled();
  });

  it('clears progress and reports error when unified restore fails', async () => {
    const { controller, options } = createController({
      sendRuntimeMessage: vi.fn((_message, callback) => {
        callback({ success: false, error: 'restore failed' });
      }),
    });

    await controller.executeRestore({
      strategy: 'smart',
      restoreSettings: true,
      restoreRecords: true,
      restoreUserProfile: true,
      restoreActorRecords: true,
      restoreLogs: false,
      restoreImportStats: false,
    });

    expect(options.clearProgressTimer).toHaveBeenCalledTimes(1);
    expect(options.logError).toHaveBeenCalledWith('恢复操作失败', { error: 'restore failed' });
    expect(options.showMessage).toHaveBeenCalledWith('恢复失败: restore failed', 'error');
  });
});

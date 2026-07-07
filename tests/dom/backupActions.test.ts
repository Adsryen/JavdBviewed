/**
 * @file backupActions.test.ts
 * @description 备份页操作按钮 DOM 行为测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actionMocks = vi.hoisted(() => ({
  logAsync: vi.fn(() => Promise.resolve()),
  showMessage: vi.fn(),
  showWebDAVRestoreModal: vi.fn(),
  getValue: vi.fn(() => Promise.resolve(0)),
  setValue: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/dashboard/logger', () => ({
  logAsync: actionMocks.logAsync,
}));

vi.mock('../../src/dashboard/ui/toast', () => ({
  showMessage: actionMocks.showMessage,
}));

vi.mock('../../src/dashboard/webdavRestore', () => ({
  showWebDAVRestoreModal: actionMocks.showWebDAVRestoreModal,
}));

vi.mock('../../src/utils/storage', () => ({
  getValue: actionMocks.getValue,
  setValue: actionMocks.setValue,
}));

vi.mock('../../src/dashboard/state', () => ({
  STATE: {
    settings: {
      webdav: {
        warningDays: 7,
      },
    },
  },
}));

describe('backup page actions', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    mountBackupActionDom();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports through the backup data runtime message and restores the icon button markup', async () => {
    const sendMessage = installChromeRuntimeResponse({
      success: true,
      data: {
        version: 'test',
        data: {},
      },
    });
    const createObjectUrl = vi.fn(() => 'blob:backup');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { initBackupActions } = await import('../../src/dashboard/sidebar/actions');
    const exportButton = document.getElementById('exportBtn') as HTMLButtonElement;
    const originalHtml = exportButton.innerHTML;

    initBackupActions(document);
    exportButton.click();

    expect(exportButton.disabled).toBe(true);
    expect(exportButton.innerHTML).toContain('fa-spinner');

    await flushAsyncAction();

    expect(sendMessage).toHaveBeenCalledWith({ type: 'collect-backup-data' }, expect.any(Function));
    expect(exportButton.disabled).toBe(false);
    expect(exportButton.innerHTML).toBe(originalHtml);
    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:backup');
    expect(actionMocks.showMessage).toHaveBeenCalledWith('数据导出成功', 'success');
  });

  it('uploads through the WebDAV runtime message and restores the icon button markup', async () => {
    const sendMessage = installChromeRuntimeResponse({ success: true });
    const { initBackupActions } = await import('../../src/dashboard/sidebar/actions');
    const uploadButton = document.getElementById('syncNow') as HTMLButtonElement;
    const originalHtml = uploadButton.innerHTML;

    initBackupActions(document);
    uploadButton.click();

    expect(uploadButton.disabled).toBe(true);
    expect(uploadButton.innerHTML).toContain('fa-spinner');

    await flushAsyncAction();

    expect(sendMessage).toHaveBeenCalledWith({ type: 'webdav-upload' }, expect.any(Function));
    expect(uploadButton.disabled).toBe(false);
    expect(uploadButton.innerHTML).toBe(originalHtml);
    expect(actionMocks.showMessage).toHaveBeenCalledWith('数据已成功上传至云端', 'success');
  });

  it('shows the runtime port error and still restores the upload button markup', async () => {
    installChromeRuntimeResponse(undefined, 'The message port closed before a response was received.');
    const { initBackupActions } = await import('../../src/dashboard/sidebar/actions');
    const uploadButton = document.getElementById('syncNow') as HTMLButtonElement;
    const originalHtml = uploadButton.innerHTML;

    initBackupActions(document);
    uploadButton.click();
    await flushAsyncAction();

    expect(uploadButton.disabled).toBe(false);
    expect(uploadButton.innerHTML).toBe(originalHtml);
    expect(actionMocks.showMessage).toHaveBeenCalledWith(
      '上传失败: The message port closed before a response was received.',
      'error',
    );
  });

  it('opens the existing WebDAV restore modal from the backup page button', async () => {
    const { initBackupActions } = await import('../../src/dashboard/sidebar/actions');

    initBackupActions(document);
    document.getElementById('syncDown')?.click();

    expect(actionMocks.showWebDAVRestoreModal).toHaveBeenCalledTimes(1);
  });
});

function mountBackupActionDom(): void {
  document.body.innerHTML = `
    <section class="card backup-page">
      <label for="importFile" class="backup-action-btn backup-action-btn-secondary">
        <i class="fas fa-file-import"></i>
        <span>导入本地备份</span>
      </label>
      <input type="file" id="importFile" class="backup-file-input" accept=".json">
      <button id="exportBtn" type="button" class="backup-action-btn backup-action-btn-primary">
        <i class="fas fa-file-export"></i>
        <span>导出本地备份</span>
      </button>
      <button id="syncNow" type="button" class="backup-action-btn backup-action-btn-primary">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>立即上传至云端</span>
      </button>
      <button id="syncDown" type="button" class="backup-action-btn backup-action-btn-success">
        <i class="fas fa-cloud-download-alt"></i>
        <span>从云端恢复</span>
      </button>
      <span id="lastSyncTime">从未</span>
      <div class="sync-indicator" id="syncIndicator">
        <span class="sync-dot"></span>
        <span class="sync-status-text">未同步</span>
      </div>
      <div id="webdavWarningBanner"></div>
      <div id="webdavWarningMessage"></div>
    </section>
  `;
}

function installChromeRuntimeResponse(response: unknown, runtimeError?: string): ReturnType<typeof vi.fn> {
  const runtime = {
    lastError: undefined as { message?: string } | undefined,
    sendMessage: vi.fn((_message: unknown, callback?: (response: unknown) => void) => {
      if (runtimeError) {
        runtime.lastError = { message: runtimeError };
      }
      if (callback) {
        callback(response);
      }
      runtime.lastError = undefined;
    }),
  };

  vi.stubGlobal('chrome', { runtime });
  return runtime.sendMessage;
}

async function flushAsyncAction(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

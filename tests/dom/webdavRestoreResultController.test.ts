import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreResultController } from '../../src/dashboard/webdavRestore/restoreResultController';

function mountRestoreResultModals(): void {
  document.body.innerHTML = `
    <div id="webdavRestoreModal" class="visible"></div>
    <div id="restoreResultModal" class="hidden">
      <button id="restoreResultConfirm"></button>
      <button id="restoreResultModalClose"></button>
      <button id="downloadBackup"></button>
      <div id="operationSummaryGrid"></div>
    </div>
  `;
}

describe('WebDAV restore result controller', () => {
  beforeEach(() => {
    mountRestoreResultModals();
    vi.restoreAllMocks();
  });

  it('shows restore result modal and renders operation summary', () => {
    const controller = new WebDAVRestoreResultController({
      backupPrefix: 'restore_backup',
      getAllStorage: vi.fn(),
      showMessage: vi.fn(),
      logError: vi.fn(),
      reloadPage: vi.fn(),
    });

    controller.show({
      summary: {
        videoRecords: { added: 1, updated: 2, kept: 3 },
        actorRecords: { added: 4, updated: 5, kept: 6 },
        newWorks: {
          subscriptions: { added: 7, updated: 8 },
          records: { added: 9, updated: 10 },
        },
      },
    });

    expect(document.getElementById('webdavRestoreModal')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('restoreResultModal')?.classList.contains('visible')).toBe(true);
    expect(document.getElementById('operationSummaryGrid')?.textContent).toContain('新增视频记录');
    expect(document.getElementById('operationSummaryGrid')?.textContent).toContain('10');
  });

  it('hides result modal and reloads after close delay', () => {
    vi.useFakeTimers();
    const reloadPage = vi.fn();
    const controller = new WebDAVRestoreResultController({
      backupPrefix: 'restore_backup',
      getAllStorage: vi.fn(),
      showMessage: vi.fn(),
      logError: vi.fn(),
      reloadPage,
    });

    controller.show({
      summary: {
        videoRecords: { added: 0, updated: 0, kept: 0 },
        actorRecords: { added: 0, updated: 0, kept: 0 },
      },
    });
    document.getElementById('restoreResultConfirm')?.click();

    expect(document.getElementById('restoreResultModal')?.classList.contains('hidden')).toBe(true);
    expect(reloadPage).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(reloadPage).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('downloads latest restore backup and reports success', async () => {
    const showMessage = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:restore');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickedDownloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
      clickedDownloads.push(this.download);
    });

    const controller = new WebDAVRestoreResultController({
      backupPrefix: 'restore_backup',
      getAllStorage: vi.fn().mockResolvedValue({
        'restore_backup_2026-05-01T00-00-00-000Z': { old: true },
        'restore_backup_2026-06-01T00-00-00-000Z': { latest: true },
      }),
      showMessage,
      logError: vi.fn(),
      reloadPage: vi.fn(),
      now: () => new Date('2026-06-01T00:01:02.345Z'),
    });

    controller.show({
      summary: {
        videoRecords: { added: 0, updated: 0, kept: 0 },
        actorRecords: { added: 0, updated: 0, kept: 0 },
      },
    });
    document.getElementById('downloadBackup')?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickedDownloads).toEqual(['restore-backup-2026-06-01T00-01-02.json']);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:restore');
    expect(showMessage).toHaveBeenCalledWith('备份文件下载成功', 'success');
  });

  it('warns when no restore backup exists', async () => {
    const showMessage = vi.fn();
    const controller = new WebDAVRestoreResultController({
      backupPrefix: 'restore_backup',
      getAllStorage: vi.fn().mockResolvedValue({ other: true }),
      showMessage,
      logError: vi.fn(),
      reloadPage: vi.fn(),
    });

    controller.show({
      summary: {
        videoRecords: { added: 0, updated: 0, kept: 0 },
        actorRecords: { added: 0, updated: 0, kept: 0 },
      },
    });
    document.getElementById('downloadBackup')?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(showMessage).toHaveBeenCalledWith('没有找到备份文件', 'warn');
  });
});

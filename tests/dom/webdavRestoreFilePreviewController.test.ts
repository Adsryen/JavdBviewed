import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreFilePreviewController } from '../../src/dashboard/webdavRestore/restoreFilePreviewController';

function mountRestoreFilePreviewDom(): void {
  document.body.innerHTML = `
    <div id="dashboard-modals-root">
      <div id="webdavRestoreModal" class="modal-overlay visible preview-active">
        <div id="webdavRestoreLoading" class="hidden"><p>旧文案</p></div>
        <div id="webdavRestoreError" class="hidden">
          <span id="webdavRestoreErrorMessage"></span>
        </div>
        <div id="webdavRestoreContent" class="hidden">
          <div class="restore-description hidden">
            <span id="webdavBackupCount">0</span>
            <span id="webdavBackupRange">未知</span>
          </div>
          <div class="file-list-container hidden">
            <ul id="webdavFileList"></ul>
          </div>
        </div>
        <div id="webdavDataPreview" class="hidden"></div>
        <div id="webdavRestoreOptions"></div>
        <div id="restoreModeStats">
          <div class="stat-item"><span id="quickVideoCount">0</span></div>
          <div class="stat-item"><span id="quickActorCount">0</span></div>
          <div class="stat-item"><span id="quickNewWorksSubsCount">0</span></div>
          <div class="stat-item"><span id="quickNewWorksRecsCount">0</span></div>
        </div>
        <button id="quickRestoreBtn"></button>
        <button id="webdavRestoreConfirm" class="hidden" disabled></button>
        <button id="webdavRestoreBack" class="hidden"></button>
      </div>
    </div>
  `;
}

function createController() {
  let selectedFile: any = null;
  let cloudData: any = null;
  const messages: any[] = [];
  const resetRestorePreviewContext = vi.fn();
  const configureRestoreOptions = vi.fn();
  const startWizardRestore = vi.fn();
  const ensureFooterInModal = vi.fn();

  const sendRuntimeMessage = vi.fn((message: any, callback: (response: any) => void) => {
    messages.push(message);

    if (message.type === 'webdav-list-files') {
      callback({
        success: true,
        files: [
          {
            name: 'javdb-extension-backup-2026-05-31-00-00-00.zip',
            path: '/old.zip',
            lastModified: '2026-05-31T00:00:00.000Z',
            size: 1024,
          },
          {
            name: 'javdb-extension-backup-2026-06-01-00-00-00.zip',
            path: '/latest.zip',
            lastModified: '2026-06-01T00:00:00.000Z',
            size: 2048,
          },
        ],
      });
      return;
    }

    if (message.type === 'WEB_DAV:RESTORE_PREVIEW') {
      callback({
        success: true,
        raw: {
          version: '2.1',
          data: {
            'AAA-001': { id: 'AAA-001', title: 'A' },
          },
          idb: {
            actors: [{ id: 'actor-a' }],
            magnets: [{ id: 'magnet-a' }],
            magnetPushLogs: [{ id: 'log-a' }, { id: 'log-b' }],
          },
          newWorks: {
            subscriptions: { actorA: true },
            records: { workA: true, workB: true },
          },
        },
        preview: {
          counts: {
            viewed: 5,
            actors: 2,
            magnets: 3,
            magnetPushLogs: 4,
          },
        },
      });
    }
  });

  const controller = new WebDAVRestoreFilePreviewController({
    getRestoreModal: () => document.getElementById('webdavRestoreModal') as HTMLElement | null,
    queryInModal: (selector) => document.querySelector(selector),
    hideElement: (id) => document.getElementById(id)?.classList.add('hidden'),
    showElement: (id) => document.getElementById(id)?.classList.remove('hidden'),
    showError: vi.fn((message: string) => {
      document.getElementById('webdavRestoreError')?.classList.remove('hidden');
      const element = document.getElementById('webdavRestoreErrorMessage');
      if (element) element.textContent = message;
    }),
    showMessage: vi.fn(),
    configureRestoreOptions,
    startWizardRestore,
    ensureFooterInModal,
    setSelectedFile: (file) => {
      selectedFile = file;
    },
    resetRestorePreviewContext,
    setCloudData: (data) => {
      cloudData = data;
    },
    sendRuntimeMessage,
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    logError: vi.fn(),
  });

  return {
    controller,
    getSelectedFile: () => selectedFile,
    getCloudData: () => cloudData,
    messages,
    resetRestorePreviewContext,
    configureRestoreOptions,
    startWizardRestore,
    ensureFooterInModal,
    sendRuntimeMessage,
  };
}

describe('WebDAV restore file preview controller', () => {
  beforeEach(() => {
    mountRestoreFilePreviewDom();
    vi.restoreAllMocks();
  });

  it('loads backup list, selects latest file, and updates the backup summary', async () => {
    const { controller, getSelectedFile, ensureFooterInModal } = createController();

    controller.fetchFileList();
    await Promise.resolve();

    const items = Array.from(document.querySelectorAll('.webdav-file-item'));
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('javdb-extension-backup-2026-06-01-00-00-00.zip');
    expect(items[0].classList.contains('selected')).toBe(true);
    expect(items[0].classList.contains('latest-file')).toBe(true);
    expect(getSelectedFile()?.path).toBe('/latest.zip');
    expect(document.getElementById('webdavBackupCount')?.textContent).toBe('2');
    expect(document.getElementById('webdavBackupRange')?.textContent).toBe('2026-05-31 ~ 2026-06-01');
    expect(ensureFooterInModal).toHaveBeenCalled();
  });

  it('selects a file, resets preview state, loads cloud stats, and binds quick restore', async () => {
    const {
      controller,
      getSelectedFile,
      getCloudData,
      messages,
      resetRestorePreviewContext,
      configureRestoreOptions,
      startWizardRestore,
    } = createController();

    controller.fetchFileList();
    await Promise.resolve();

    const oldItem = document.querySelectorAll('.webdav-file-item')[1] as HTMLElement;
    oldItem.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(getSelectedFile()?.path).toBe('/old.zip');
    expect(resetRestorePreviewContext).toHaveBeenCalledTimes(1);
    expect(messages).toContainEqual({ type: 'WEB_DAV:RESTORE_PREVIEW', filename: '/old.zip' });
    expect(getCloudData()).toMatchObject({ version: '2.1' });
    expect(configureRestoreOptions).toHaveBeenCalledWith(getCloudData());
    expect(document.getElementById('quickVideoCount')?.textContent).toBe('5');
    expect(document.getElementById('quickActorCount')?.textContent).toBe('2');
    expect(document.getElementById('quickNewWorksSubsCount')?.textContent).toBe('1');
    expect(document.getElementById('quickNewWorksRecsCount')?.textContent).toBe('2');
    expect(document.getElementById('quickMagnetCount')?.textContent).toBe('3');
    expect(document.getElementById('quickMagnetPushLogCount')?.textContent).toBe('4');
    expect(document.getElementById('webdavDataPreview')?.classList.contains('hidden')).toBe(false);
    expect((document.getElementById('webdavRestoreConfirm') as HTMLButtonElement).disabled).toBe(false);

    document.getElementById('quickRestoreBtn')?.click();

    expect(startWizardRestore).toHaveBeenCalledTimes(1);
  });
});

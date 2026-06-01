import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreModalShellController } from '../../src/dashboard/webdavRestore/restoreModalShellController';

function mountRestoreShellDom(): void {
  document.body.innerHTML = `
    <button id="webdavRestoreBack">外部返回</button>
    <button id="webdavRestoreCancel">外部取消</button>
    <div id="dashboard-modals-root">
      <div id="webdavRestoreModal" class="modal-overlay hidden preview-active">
        <div class="modal-content">
          <div class="modal-body">
            <div id="webdavRestoreLoading" class="hidden"><p>Loading</p></div>
            <div id="webdavRestoreError" class="hidden">
              <span id="webdavRestoreErrorMessage"></span>
            </div>
            <div id="webdavRestoreContent">
              <div class="restore-description hidden"></div>
              <div class="file-list-container hidden"></div>
              <ul id="webdavFileList"><li>old</li></ul>
            </div>
            <div id="webdavDataPreview"></div>
            <div id="webdavRestoreOptions"></div>
          </div>
          <div class="modal-footer"></div>
          <button id="webdavRestoreModalClose"></button>
          <button id="webdavRestoreConfirm"></button>
          <button id="webdavRestoreRetry"></button>
        </div>
      </div>
    </div>
  `;
}

function createController(overrides: Partial<ConstructorParameters<typeof WebDAVRestoreModalShellController>[0]> = {}) {
  let selectedFile: any = { path: '/backup.zip' };
  const options = {
    setSelectedFile: (file: any) => {
      selectedFile = file;
    },
    fetchFileList: vi.fn(),
    startWizardRestore: vi.fn(),
    logInfo: vi.fn(),
    ...overrides,
  };

  return {
    controller: new WebDAVRestoreModalShellController(options),
    options,
    getSelectedFile: () => selectedFile,
  };
}

describe('WebDAV restore modal shell controller', () => {
  beforeEach(() => {
    mountRestoreShellDom();
    vi.restoreAllMocks();
  });

  it('opens modal, creates footer buttons, resets state, binds events, and fetches files', () => {
    const { controller, options, getSelectedFile } = createController();

    controller.showWebDAVRestoreModal();

    const modal = document.getElementById('webdavRestoreModal') as HTMLElement;
    expect(modal.classList.contains('visible')).toBe(true);
    expect(modal.classList.contains('hidden')).toBe(false);
    expect(modal.classList.contains('preview-active')).toBe(false);
    expect(document.body.classList.contains('modal-open')).toBe(true);
    expect(getSelectedFile()).toBeNull();
    expect(document.querySelectorAll('#webdavRestoreBack')).toHaveLength(1);
    expect(document.querySelectorAll('#webdavRestoreCancel')).toHaveLength(1);
    expect(document.querySelector('.modal-footer #webdavRestoreBack')?.textContent).toContain('返回');
    expect(document.getElementById('webdavFileList')?.innerHTML).toBe('');
    expect(document.getElementById('webdavRestoreLoading')?.classList.contains('hidden')).toBe(false);
    expect((document.getElementById('webdavRestoreConfirm') as HTMLButtonElement).disabled).toBe(true);
    expect(document.getElementById('webdavRestoreConfirm')?.classList.contains('hidden')).toBe(true);
    expect(options.fetchFileList).toHaveBeenCalledTimes(1);

    document.getElementById('webdavRestoreRetry')?.click();
    expect(options.fetchFileList).toHaveBeenCalledTimes(2);

    (document.getElementById('webdavRestoreConfirm') as HTMLButtonElement).disabled = false;
    document.getElementById('webdavRestoreConfirm')?.click();
    expect(options.startWizardRestore).toHaveBeenCalledTimes(1);
  });

  it('closes modal from close button and background click', () => {
    const { controller, options } = createController();

    controller.showWebDAVRestoreModal();
    document.getElementById('webdavRestoreModalClose')?.click();

    expect(document.getElementById('webdavRestoreModal')?.classList.contains('hidden')).toBe(true);
    expect(document.body.classList.contains('modal-open')).toBe(false);
    expect(options.logInfo).toHaveBeenCalledWith('用户关闭了WebDAV恢复弹窗');

    controller.showWebDAVRestoreModal();
    const modal = document.getElementById('webdavRestoreModal') as HTMLElement;
    modal.click();

    expect(modal.classList.contains('hidden')).toBe(true);
  });

  it('shows error state and returns from preview to file list', () => {
    const { controller } = createController();

    controller.showError('获取失败');

    expect(document.getElementById('webdavRestoreError')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('webdavRestoreContent')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('webdavRestoreErrorMessage')?.textContent).toBe('获取失败');

    controller.applyRestoreFileListBackState();

    expect(document.getElementById('webdavDataPreview')?.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('.restore-description')?.classList.contains('hidden')).toBe(false);
    expect(document.querySelector('.file-list-container')?.classList.contains('hidden')).toBe(false);
    expect((document.getElementById('webdavRestoreConfirm') as HTMLButtonElement).disabled).toBe(true);
    expect(document.getElementById('webdavRestoreConfirm')?.classList.contains('hidden')).toBe(true);
  });

  it('scopes query helpers to the visible restore modal', () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="scopedOnly">outside</button>');
    const { controller } = createController();
    controller.showWebDAVRestoreModal();
    document.getElementById('webdavRestoreModal')?.insertAdjacentHTML('beforeend', '<button id="scopedOnly">inside</button>');

    expect(controller.queryInModal('#scopedOnly')?.textContent).toBe('inside');
  });
});

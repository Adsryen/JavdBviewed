import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreProgressResultsController } from '../../src/dashboard/webdavRestore/restoreProgressResultsController';

function mountRestoreModal(): void {
  document.body.innerHTML = `
    <div id="dashboard-modals-root">
      <div id="webdavRestoreModal" class="modal-overlay visible">
        <div class="modal-content">
          <div class="modal-body">
            <div id="webdavRestoreLoading"><p>旧加载文案</p></div>
            <div id="webdavRestoreError"></div>
            <div id="webdavRestoreOptions"></div>
            <div id="webdavDataPreview"></div>
            <div id="webdavRestoreContent"></div>
          </div>
          <div class="modal-footer">
            <button id="webdavRestoreConfirm"></button>
            <button id="webdavRestoreBack"></button>
            <button id="webdavRestoreCancel"></button>
          </div>
        </div>
      </div>
    </div>
  `;
}

describe('WebDAV restore progress/results controller', () => {
  beforeEach(() => {
    mountRestoreModal();
    vi.restoreAllMocks();
  });

  it('shows restore progress, hides existing modal body content, and updates elapsed time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    const controller = new WebDAVRestoreProgressResultsController({
      getRestoreModal: () => document.getElementById('webdavRestoreModal') as HTMLElement | null,
      hideElement: vi.fn(),
      showElement: vi.fn(),
      fetchFileList: vi.fn(),
      closeModal: vi.fn(),
    });

    controller.showProgress();
    vi.setSystemTime(new Date('2026-06-01T00:01:04.000Z'));
    vi.advanceTimersByTime(1000);

    expect(document.getElementById('restoreProgressContainer')).toBeTruthy();
    expect(document.getElementById('webdavRestoreLoading')?.style.display).toBe('none');
    expect(document.getElementById('webdavRestoreContent')?.style.display).toBe('none');
    expect(document.getElementById('elapsedTime')?.textContent).toBe('01:05');

    controller.clearProgressTimer();
    vi.useRealTimers();
  });

  it('shows restore results and returns to the backup list', () => {
    const hideElement = vi.fn((id: string) => document.getElementById(id)?.classList.add('hidden'));
    const showElement = vi.fn((id: string) => document.getElementById(id)?.classList.remove('hidden'));
    const fetchFileList = vi.fn();
    const controller = new WebDAVRestoreProgressResultsController({
      getRestoreModal: () => document.getElementById('webdavRestoreModal') as HTMLElement | null,
      hideElement,
      showElement,
      fetchFileList,
      closeModal: vi.fn(),
    });

    controller.showProgress();
    controller.showResults(
      {
        categories: {
          viewed: { replaced: true, written: 2, durationMs: 12 },
          settings: { reason: 'not_selected' },
        },
      },
      {
        idb: { viewedRecords: [{ id: 'AAA-001' }, { id: 'BBB-002' }] },
        settings: { theme: 'dark' },
      },
    );

    expect(document.getElementById('restoreProgressContainer')).toBeNull();
    expect(document.getElementById('restoreResultsContainer')).toBeTruthy();
    expect(document.querySelector('.modal-footer')?.getAttribute('style')).toContain('display: none');
    expect(document.getElementById('webdavRestoreConfirm')?.style.display).toBe('none');
    expect(document.getElementById('restoreResultsContainer')?.textContent).toContain('观看记录');
    expect(document.getElementById('restoreResultsContainer')?.textContent).toContain('云端：2 条');

    document.getElementById('resultsBackBtn')?.click();

    expect(document.getElementById('restoreResultsContainer')).toBeNull();
    expect(document.getElementById('webdavRestoreLoading')?.style.display).toBe('');
    expect(document.getElementById('webdavRestoreLoading')?.classList.contains('hidden')).toBe(false);
    expect(document.querySelector('#webdavRestoreLoading p')?.textContent).toBe('正在获取云端文件列表...');
    expect(fetchFileList).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.modal-footer')?.getAttribute('style')).toBe('');
    expect((document.getElementById('webdavRestoreConfirm') as HTMLButtonElement | null)?.disabled).toBe(true);
    expect(document.getElementById('webdavRestoreBack')?.classList.contains('hidden')).toBe(true);
  });

  it('closes modal and restores footer buttons when results are done', () => {
    const closeModal = vi.fn();
    const controller = new WebDAVRestoreProgressResultsController({
      getRestoreModal: () => document.getElementById('webdavRestoreModal') as HTMLElement | null,
      hideElement: vi.fn(),
      showElement: vi.fn(),
      fetchFileList: vi.fn(),
      closeModal,
    });

    controller.showResults({ categories: { settings: { replaced: true } } }, { settings: { theme: 'dark' } });
    document.getElementById('resultsDoneBtn')?.click();

    expect(closeModal).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.modal-footer')?.getAttribute('style')).toBe('');
    expect(document.getElementById('webdavRestoreConfirm')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('webdavRestoreBack')?.style.display).toBe('');
    expect(document.getElementById('webdavRestoreCancel')?.style.display).toBe('');
  });
});

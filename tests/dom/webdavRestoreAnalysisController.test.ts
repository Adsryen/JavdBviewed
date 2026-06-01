import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreAnalysisController } from '../../src/dashboard/webdavRestore/restoreAnalysisController';

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
};

function mountRestoreAnalysisDom(): void {
  document.body.innerHTML = `
    <div id="dashboard-modals-root">
      <div id="webdavRestoreModal" class="modal-overlay visible preview-active">
        <div id="webdavRestoreLoading" class="hidden"><p>旧文案</p></div>
        <div id="webdavRestoreContent" class="hidden">
          <div class="restore-description"></div>
          <div class="file-list-container"></div>
        </div>
        <div id="webdavDataPreview" class="hidden"></div>
        <button id="webdavRestoreAnalyze"></button>
        <button id="webdavRestoreConfirm" class="hidden" disabled></button>
        <button id="webdavRestoreBack" class="hidden"></button>
      </div>
    </div>
  `;
}

function createDiffResult(): any {
  return {
    videoRecords: {
      conflicts: [{ id: 'AAA-001' }],
      summary: { conflictCount: 1 },
    },
    actorRecords: {
      conflicts: [{ id: 'actor-a' }, { id: 'actor-b' }],
      summary: { conflictCount: 2 },
    },
  };
}

function createController(overrides: Partial<ConstructorParameters<typeof WebDAVRestoreAnalysisController>[0]> = {}) {
  const diffResult = createDiffResult();
  let cloudData: any = null;
  let localData: any = null;
  let currentDiffResult: any = null;

  const getValue = vi.fn(async (key: string, fallback: any) => {
    const values: Record<string, any> = {
      viewed: { 'AAA-001': { id: 'AAA-001' } },
      actor_records: { actorA: { id: 'actorA' } },
      settings: { theme: 'dark' },
      user_profile: { username: 'tester' },
      persistent_logs: [{ message: 'log' }],
      last_import_stats: { total: 1 },
      new_works_subscriptions: { actorA: true },
      new_works_records: { workA: true },
      new_works_config: { enabled: true },
    };
    return values[key] ?? fallback;
  });
  const sendRuntimeMessage = vi.fn((message: any, callback: (response: any) => void) => {
    callback({
      success: true,
      raw: {
        data: { 'BBB-002': { id: 'BBB-002' } },
        actorRecords: { actorB: { id: 'actorB' } },
      },
    });
  });
  const analyzeDataDifferences = vi.fn(() => diffResult);
  const initializeRestoreInterface = vi.fn();
  const showMessage = vi.fn();

  const controller = new WebDAVRestoreAnalysisController({
    storageKeys,
    getRestoreModal: () => document.getElementById('webdavRestoreModal') as HTMLElement | null,
    queryInModal: (selector) => document.querySelector(selector),
    hideElement: (id) => document.getElementById(id)?.classList.add('hidden'),
    showElement: (id) => document.getElementById(id)?.classList.remove('hidden'),
    getSelectedFile: () => ({ name: 'javdb-extension-backup-2026-06-01.zip', path: '/backup.zip' }),
    setCloudData: (data) => {
      cloudData = data;
    },
    setLocalData: (data) => {
      localData = data;
    },
    setDiffResult: (data) => {
      currentDiffResult = data;
    },
    getValue,
    sendRuntimeMessage,
    analyzeDataDifferences,
    initializeRestoreInterface,
    showMessage,
    logInfo: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  });

  return {
    controller,
    getValue,
    sendRuntimeMessage,
    analyzeDataDifferences,
    initializeRestoreInterface,
    showMessage,
    getCloudData: () => cloudData,
    getLocalData: () => localData,
    getDiffResult: () => currentDiffResult,
    diffResult,
  };
}

describe('WebDAV restore analysis controller', () => {
  beforeEach(() => {
    mountRestoreAnalysisDom();
    vi.restoreAllMocks();
  });

  it('loads cloud and local data, analyzes differences, and enters preview state', async () => {
    const {
      controller,
      sendRuntimeMessage,
      getValue,
      analyzeDataDifferences,
      initializeRestoreInterface,
      getCloudData,
      getLocalData,
      getDiffResult,
      diffResult,
    } = createController();

    await controller.performDataAnalysis();

    expect(sendRuntimeMessage).toHaveBeenCalledWith(
      { type: 'WEB_DAV:RESTORE_PREVIEW', filename: '/backup.zip' },
      expect.any(Function),
    );
    expect(getValue).toHaveBeenCalledWith('viewed', {});
    expect(getValue).toHaveBeenCalledWith('new_works_config', {});
    expect(getCloudData()).toMatchObject({ data: { 'BBB-002': { id: 'BBB-002' } } });
    expect(getLocalData()).toMatchObject({
      viewedRecords: { 'AAA-001': { id: 'AAA-001' } },
      newWorks: {
        subscriptions: { actorA: true },
        records: { workA: true },
        config: { enabled: true },
      },
    });
    expect(analyzeDataDifferences).toHaveBeenCalledWith(getLocalData(), getCloudData());
    expect(getDiffResult()).toBe(diffResult);
    expect(initializeRestoreInterface).toHaveBeenCalledWith(diffResult);
    expect(document.getElementById('webdavRestoreModal')?.classList.contains('preview-active')).toBe(true);
    expect(document.getElementById('webdavRestoreLoading')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('webdavDataPreview')?.classList.contains('hidden')).toBe(false);
    expect(document.querySelector('.restore-description')?.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('.file-list-container')?.classList.contains('hidden')).toBe(true);
    expect((document.getElementById('webdavRestoreConfirm') as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows an error message and leaves loading state on preview failure', async () => {
    const { controller, showMessage, initializeRestoreInterface } = createController({
      sendRuntimeMessage: (_message, callback) => {
        callback({ success: false, error: 'preview failed' });
      },
    });

    await controller.performDataAnalysis();

    expect(showMessage).toHaveBeenCalledWith('分析失败: preview failed', 'error');
    expect(initializeRestoreInterface).not.toHaveBeenCalled();
    expect(document.getElementById('webdavRestoreLoading')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('webdavRestoreContent')?.classList.contains('hidden')).toBe(false);
  });
});

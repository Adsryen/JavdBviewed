import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreWizardController } from '../../src/dashboard/webdavRestore/restoreWizardController';

function createDiffResult(): any {
  return {
    videoRecords: {
      summary: {
        totalLocal: 12,
        totalCloud: 20,
        localOnlyCount: 1,
        cloudOnlyCount: 2,
        conflictCount: 3,
      },
    },
    actorRecords: {
      summary: {
        totalLocal: 4,
        totalCloud: 5,
        localOnlyCount: 0,
        cloudOnlyCount: 1,
        conflictCount: 2,
      },
    },
    newWorks: {
      subscriptions: {
        summary: {
          totalLocal: 6,
          cloudOnlyCount: 1,
          conflictCount: 1,
        },
      },
      records: {
        summary: {
          totalLocal: 8,
          cloudOnlyCount: 1,
          conflictCount: 1,
        },
      },
    },
  };
}

function mountRestoreWizardDom(): void {
  document.body.innerHTML = `
    <div id="webdavRestoreModal">
      <div id="webdavDataPreview" class="hidden"></div>
      <button id="quickRestoreBtn"></button>
      <span id="quickVideoCount">-</span>
      <span id="quickActorCount">-</span>
      <span id="quickNewWorksSubsCount">-</span>
      <span id="quickNewWorksRecsCount">-</span>
      <span id="quickConflictCount">-</span>
      <div id="expertImpactPreview"></div>
      <div id="impactSummary"></div>
      <div class="impact-preview"></div>
      <button class="mode-tab active" data-mode="quick"></button>
      <button class="mode-tab" data-mode="wizard"></button>
      <div id="quickMode" class="restore-mode-content active"></div>
      <div id="wizardMode" class="restore-mode-content"></div>
      <div class="step"></div>
      <div class="step"></div>
      <div class="step"></div>
      <div class="wizard-step-content"></div>
      <div class="wizard-step-content"></div>
      <div class="wizard-step-content"></div>
      <input type="radio" name="wizardStrategy" value="smart" checked>
      <input type="radio" name="wizardStrategy" value="cloud">
      <div id="previewContent"></div>
      <button id="wizardPrevBtn"></button>
      <button id="wizardNextBtn"></button>
      <button id="wizardStartBtn" class="hidden"></button>
      <div class="restore-options-grid">
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreSettings" checked>
          <label for="webdavRestoreSettings">扩展设置</label>
        </div>
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreRecords" checked>
          <label for="webdavRestoreRecords">观看记录</label>
        </div>
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreUserProfile">
          <label for="webdavRestoreUserProfile">账号信息</label>
        </div>
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreActorRecords" checked>
          <label for="webdavRestoreActorRecords">演员库</label>
        </div>
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreLogs">
          <label for="webdavRestoreLogs">日志记录</label>
        </div>
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreMagnetPushLogs">
          <label for="webdavRestoreMagnetPushLogs">磁力推送日志</label>
        </div>
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreImportStats" checked>
          <label for="webdavRestoreImportStats">导入统计</label>
        </div>
        <div class="form-group-checkbox">
          <input type="checkbox" id="webdavRestoreNewWorks" checked>
          <label for="webdavRestoreNewWorks">新作品</label>
        </div>
      </div>
      <div id="contentSelectionGrid"></div>
      <div id="confirmationSummary"></div>
    </div>
  `;
}

describe('WebDAV restore wizard controller', () => {
  beforeEach(() => {
    mountRestoreWizardDom();
    vi.restoreAllMocks();
  });

  it('initializes restore interface, renders stats, binds quick restore, and removes legacy impact UI', () => {
    const executeRestore = vi.fn();
    const configureRestoreOptions = vi.fn();
    const controller = new WebDAVRestoreWizardController({
      getRestoreModal: () => document.getElementById('webdavRestoreModal') as HTMLElement | null,
      queryInModal: (selector) => document.querySelector(selector),
      updateElement: (id, text) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
      },
      showElement: (id) => document.getElementById(id)?.classList.remove('hidden'),
      configureRestoreOptions,
      executeRestore,
      showMessage: vi.fn(),
      showSmartRestoreModal: ({ onConfirm }) => onConfirm(),
      showConfirm: vi.fn(),
      logInfo: vi.fn(),
      getRestoreContext: () => ({
        diffResult: createDiffResult(),
        cloudData: { settings: {} },
        localData: { viewedRecords: {} },
      }),
      defaultStrategy: 'smart',
    });

    controller.initializeRestoreInterface(createDiffResult(), { settings: {} });

    expect(document.getElementById('quickVideoCount')?.textContent).toBe('12');
    expect(document.getElementById('quickActorCount')?.textContent).toBe('4');
    expect(document.getElementById('quickNewWorksSubsCount')?.textContent).toBe('6');
    expect(document.getElementById('quickNewWorksRecsCount')?.textContent).toBe('8');
    expect(document.getElementById('quickConflictCount')?.textContent).toBe('7');
    expect(document.getElementById('webdavDataPreview')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('expertImpactPreview')).toBeNull();
    expect(document.getElementById('impactSummary')).toBeNull();
    expect(document.querySelector('.impact-preview')).toBeNull();
    expect(configureRestoreOptions).toHaveBeenCalledWith({ settings: {} });

    document.getElementById('quickRestoreBtn')?.click();

    expect(executeRestore).toHaveBeenCalledWith({
      strategy: 'smart',
      restoreSettings: false,
      restoreRecords: true,
      restoreUserProfile: true,
      restoreActorRecords: true,
      restoreLogs: false,
      restoreImportStats: true,
      restoreNewWorks: true,
    });
  });

  it('walks the wizard flow and starts restore with selected options', () => {
    const executeRestore = vi.fn();
    const controller = new WebDAVRestoreWizardController({
      getRestoreModal: () => document.getElementById('webdavRestoreModal') as HTMLElement | null,
      queryInModal: (selector) => document.querySelector(selector),
      updateElement: (id, text) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
      },
      showElement: vi.fn(),
      configureRestoreOptions: vi.fn(),
      executeRestore,
      showMessage: vi.fn(),
      showSmartRestoreModal: vi.fn(),
      showConfirm: vi.fn(),
      logInfo: vi.fn(),
      getRestoreContext: () => ({
        diffResult: createDiffResult(),
        cloudData: { settings: {} },
        localData: { viewedRecords: {} },
      }),
      defaultStrategy: 'smart',
    });

    controller.initializeWizardMode(createDiffResult());

    expect(document.querySelectorAll('.step')[0].classList.contains('active')).toBe(true);
    expect((document.getElementById('wizardPrevBtn') as HTMLButtonElement).disabled).toBe(true);
    expect(document.getElementById('previewContent')?.textContent).toContain('将会保留');

    document.getElementById('wizardNextBtn')?.click();
    const copiedRecordCheckbox = document.querySelector<HTMLInputElement>('#contentSelectionGrid #webdavRestoreRecords');
    expect(copiedRecordCheckbox).toBeTruthy();
    expect(document.querySelectorAll('.step')[1].classList.contains('active')).toBe(true);

    document.getElementById('wizardNextBtn')?.click();
    expect(document.getElementById('confirmationSummary')?.textContent).toContain('恢复策略');
    expect(document.getElementById('confirmationSummary')?.textContent).toContain('观看记录');
    expect(document.getElementById('wizardNextBtn')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('wizardStartBtn')?.classList.contains('hidden')).toBe(false);

    document.getElementById('wizardStartBtn')?.click();

    expect(executeRestore).toHaveBeenCalledWith({
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
  });
});

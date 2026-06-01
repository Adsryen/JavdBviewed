import type { DataDiffResult } from '../../features/webdavSync/application/dataDiff';
import {
  buildAnalysisLoadingEnterState,
  buildAnalysisLoadingLeaveState,
  buildAnalysisPreviewEnterState,
} from './restoreModalStateModel';

export interface RestoreAnalysisStorageKeys {
  VIEWED_RECORDS: string;
  ACTOR_RECORDS: string;
  SETTINGS: string;
  USER_PROFILE: string;
  LOGS: string;
  LAST_IMPORT_STATS: string;
  NEW_WORKS_SUBSCRIPTIONS: string;
  NEW_WORKS_RECORDS: string;
  NEW_WORKS_CONFIG: string;
}

export interface RestoreAnalysisSelectedFile {
  name: string;
  path: string;
}

export interface WebDAVRestoreAnalysisControllerOptions {
  storageKeys: RestoreAnalysisStorageKeys;
  getRestoreModal: () => HTMLElement | null;
  queryInModal: <T extends HTMLElement = HTMLElement>(selector: string) => T | null;
  hideElement: (id: string) => void;
  showElement: (id: string) => void;
  getSelectedFile: () => RestoreAnalysisSelectedFile | null;
  setCloudData: (data: any) => void;
  setLocalData: (data: any) => void;
  setDiffResult: (diffResult: DataDiffResult) => void;
  getValue: (key: string, fallback: any) => Promise<any>;
  sendRuntimeMessage: (message: any, callback: (response: any) => void) => void;
  analyzeDataDifferences: (localData: any, cloudData: any) => DataDiffResult;
  initializeRestoreInterface: (diffResult: DataDiffResult) => void;
  showMessage: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
  logError: (message: string, payload?: Record<string, unknown>) => void;
}

export class WebDAVRestoreAnalysisController {
  constructor(private readonly options: WebDAVRestoreAnalysisControllerOptions) {}

  async performDataAnalysis(): Promise<void> {
    const selectedFile = this.options.getSelectedFile();
    if (!selectedFile) return;

    const modal = this.options.getRestoreModal();
    modal?.classList.remove('preview-active');

    this.options.logInfo('开始分析数据差异', { filename: selectedFile.name });

    try {
      this.showAnalysisLoading();

      const cloudResponse = await new Promise<any>((resolve) => {
        this.options.sendRuntimeMessage({
          type: 'WEB_DAV:RESTORE_PREVIEW',
          filename: selectedFile.path,
        }, resolve);
      });

      if (!cloudResponse?.success) {
        throw new Error(cloudResponse?.error || '预览失败');
      }

      const cloudData = cloudResponse.raw || cloudResponse.data || {};
      this.options.setCloudData(cloudData);

      const localData = await this.getCurrentLocalData();
      this.options.setLocalData(localData);

      const diffResult = this.options.analyzeDataDifferences(localData, cloudData);
      this.options.setDiffResult(diffResult);

      const { restoreContent, previewElement } = this.applyAnalysisPreviewEnterState();

      this.options.logInfo('webdavRestoreContent容器状态', {
        exists: !!restoreContent,
        isHidden: restoreContent?.classList.contains('hidden'),
        display: restoreContent ? getComputedStyle(restoreContent).display : 'N/A',
        offsetHeight: restoreContent?.offsetHeight,
        offsetWidth: restoreContent?.offsetWidth,
      });

      this.options.logInfo('显示webdavDataPreview后验证', {
        isHidden: previewElement?.classList.contains('hidden'),
        display: previewElement ? getComputedStyle(previewElement).display : 'N/A',
        styleDisplay: previewElement?.style.display,
        offsetHeight: previewElement?.offsetHeight,
        offsetWidth: previewElement?.offsetWidth,
      });

      this.options.initializeRestoreInterface(diffResult);

      this.options.logInfo('数据差异分析完成', {
        videoConflicts: diffResult.videoRecords.conflicts.length,
        actorConflicts: diffResult.actorRecords.conflicts.length,
      });
    } catch (error: any) {
      this.options.logError('数据差异分析失败', { error: error.message });
      this.options.showMessage(`分析失败: ${error.message}`, 'error');
      this.hideAnalysisLoading();
    }
  }

  private applyAnalysisPreviewEnterState(): { restoreContent: HTMLElement | null; previewElement: HTMLElement | null } {
    const state = buildAnalysisPreviewEnterState();
    const modal = this.options.getRestoreModal();

    state.hiddenElementIds.forEach(this.options.hideElement);
    state.shownElementIds.forEach(this.options.showElement);

    const restoreContent = this.options.queryInModal<HTMLElement>('#' + state.restoreContentElementId);
    if (restoreContent) {
      restoreContent.classList.remove('hidden');
      Object.assign(restoreContent.style, state.restoreContentStyle);
    }

    const restoreDescription = modal?.querySelector(state.hiddenContentSelector);
    const fileListContainer = modal?.querySelector(state.hiddenListSelector);
    if (restoreDescription) restoreDescription.classList.add('hidden');
    if (fileListContainer) fileListContainer.classList.add('hidden');
    state.modalClassNamesToAdd.forEach(className => modal?.classList.add(className));

    const previewElement = this.options.queryInModal<HTMLElement>('#' + state.previewElementId);
    if (previewElement) {
      Object.assign(previewElement.style, state.previewElementStyle);
      previewElement.classList.remove('hidden');
    }

    state.hiddenButtonIds.forEach((id) => this.options.queryInModal<HTMLElement>('#' + id)?.classList.add('hidden'));
    state.enabledButtonIds.forEach((id) => {
      const button = this.options.queryInModal<HTMLButtonElement>('#' + id);
      if (button) button.disabled = false;
    });
    state.shownButtonIds.forEach((id) => this.options.queryInModal<HTMLElement>('#' + id)?.classList.remove('hidden'));

    const confirmBtn = this.options.queryInModal<HTMLButtonElement>('#webdavRestoreConfirm');
    if (confirmBtn) {
      confirmBtn.innerHTML = state.confirmButtonHtml;
      confirmBtn.title = state.confirmButtonTitle;
    }

    return { restoreContent, previewElement };
  }

  private async getCurrentLocalData(): Promise<any> {
    const keys = this.options.storageKeys;
    const [
      viewedRecords,
      actorRecords,
      settings,
      userProfile,
      logs,
      importStats,
      nwSubs,
      nwRecords,
      nwConfig,
    ] = await Promise.all([
      this.options.getValue(keys.VIEWED_RECORDS, {}),
      this.options.getValue(keys.ACTOR_RECORDS, {}),
      this.options.getValue(keys.SETTINGS, {}),
      this.options.getValue(keys.USER_PROFILE, {}),
      this.options.getValue(keys.LOGS, []),
      this.options.getValue(keys.LAST_IMPORT_STATS, {}),
      this.options.getValue(keys.NEW_WORKS_SUBSCRIPTIONS, {}),
      this.options.getValue(keys.NEW_WORKS_RECORDS, {}),
      this.options.getValue(keys.NEW_WORKS_CONFIG, {}),
    ]);

    return {
      viewedRecords,
      actorRecords,
      settings,
      userProfile,
      logs,
      importStats,
      newWorks: {
        subscriptions: nwSubs || {},
        records: nwRecords || {},
        config: nwConfig || {},
      },
    };
  }

  private showAnalysisLoading(): void {
    const state = buildAnalysisLoadingEnterState();
    const loadingElement = document.getElementById('webdavRestoreLoading');
    const loadingText = loadingElement?.querySelector('p');

    if (loadingText) loadingText.textContent = state.loadingText;

    state.hiddenElementIds.forEach(this.options.hideElement);
    state.shownElementIds.forEach(this.options.showElement);
  }

  private hideAnalysisLoading(): void {
    const state = buildAnalysisLoadingLeaveState();
    state.hiddenElementIds.forEach(this.options.hideElement);
    state.shownElementIds.forEach(this.options.showElement);
  }
}

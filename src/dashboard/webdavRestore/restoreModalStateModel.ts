export interface RestoreModalResetState {
  modalClassNamesToRemove: string[];
  hiddenElementIds: string[];
  shownElementIds: string[];
  disabledButtonIds: string[];
  hiddenButtonIds: string[];
  clearedElementIds: string[];
}

export interface AnalysisLoadingEnterState {
  loadingText: string;
  hiddenElementIds: string[];
  shownElementIds: string[];
}

export interface AnalysisLoadingLeaveState {
  hiddenElementIds: string[];
  shownElementIds: string[];
}

export interface CloudPreviewLoadingState {
  loadingText: string;
  modalClassNamesToRemove: string[];
  hiddenElementIds: string[];
  shownElementIds: string[];
}

export interface CloudPreviewEnterState {
  modalClassNamesToAdd: string[];
  hiddenElementIds: string[];
  shownElementIds: string[];
  hiddenContentSelector: string;
  hiddenListSelector: string;
  enabledButtonIds: string[];
  shownButtonIds: string[];
  confirmButtonHtml: string;
  confirmButtonTitle: string;
}

export function buildRestoreModalResetState(): RestoreModalResetState {
  return {
    modalClassNamesToRemove: ['preview-active'],
    hiddenElementIds: [
      'webdavRestoreContent',
      'webdavRestoreError',
      'webdavRestoreOptions',
    ],
    shownElementIds: ['webdavRestoreLoading'],
    disabledButtonIds: ['webdavRestoreConfirm'],
    hiddenButtonIds: ['webdavRestoreConfirm'],
    clearedElementIds: ['webdavFileList'],
  };
}

export function buildAnalysisLoadingEnterState(): AnalysisLoadingEnterState {
  return {
    loadingText: '正在分析数据差异...',
    hiddenElementIds: ['webdavRestoreContent'],
    shownElementIds: ['webdavRestoreLoading'],
  };
}

export function buildAnalysisLoadingLeaveState(): AnalysisLoadingLeaveState {
  return {
    hiddenElementIds: ['webdavRestoreLoading'],
    shownElementIds: ['webdavRestoreContent'],
  };
}

export function buildCloudPreviewLoadingState(): CloudPreviewLoadingState {
  return {
    loadingText: '正在读取云端备份统计...',
    modalClassNamesToRemove: ['preview-active'],
    hiddenElementIds: [
      'webdavRestoreError',
      'webdavRestoreContent',
    ],
    shownElementIds: ['webdavRestoreLoading'],
  };
}

export function buildCloudPreviewEnterState(): CloudPreviewEnterState {
  return {
    modalClassNamesToAdd: ['preview-active'],
    hiddenElementIds: ['webdavRestoreLoading'],
    shownElementIds: [
      'webdavRestoreContent',
      'webdavDataPreview',
    ],
    hiddenContentSelector: '#webdavRestoreContent .restore-description',
    hiddenListSelector: '#webdavRestoreContent .file-list-container',
    enabledButtonIds: ['webdavRestoreConfirm'],
    shownButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreBack',
    ],
    confirmButtonHtml: '<i class="fas fa-download"></i> 开始覆盖式恢复',
    confirmButtonTitle: '开始执行覆盖式恢复',
  };
}

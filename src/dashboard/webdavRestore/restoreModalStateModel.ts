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

export interface AnalysisPreviewEnterState {
  modalClassNamesToAdd: string[];
  hiddenElementIds: string[];
  shownElementIds: string[];
  hiddenContentSelector: string;
  hiddenListSelector: string;
  restoreContentElementId: string;
  restoreContentStyle: Record<string, string>;
  previewElementId: string;
  previewElementStyle: Record<string, string>;
  hiddenButtonIds: string[];
  enabledButtonIds: string[];
  shownButtonIds: string[];
  confirmButtonHtml: string;
  confirmButtonTitle: string;
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

export interface RestoreSubmitLoadingState {
  disabledButtonIds: string[];
  confirmButtonHtml: string;
}

export interface RestoreSubmitErrorState {
  enabledButtonIds: string[];
  shownButtonIds: string[];
  confirmButtonHtml: string;
}

export interface FileListLoadingState {
  hiddenElementIds: string[];
  shownElementIds: string[];
}

export interface FileListEnterState {
  hiddenElementIds: string[];
  shownElementIds: string[];
  shownContentSelector: string;
  shownListSelector: string;
  clearedElementIds: string[];
}

export interface FileSelectionState {
  hiddenElementIds: string[];
  disabledButtonIds: string[];
  hiddenButtonIds: string[];
  confirmButtonHtml: string;
  confirmButtonTitle: string;
}

export interface RestoreFileListBackState {
  hiddenElementIds: string[];
  shownContentSelector: string;
  shownListSelector: string;
  disabledButtonIds: string[];
  hiddenButtonIds: string[];
}

export interface RestoreErrorState {
  hiddenElementIds: string[];
  shownElementIds: string[];
  errorMessageElementId: string;
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

export function buildAnalysisPreviewEnterState(): AnalysisPreviewEnterState {
  return {
    modalClassNamesToAdd: ['preview-active'],
    hiddenElementIds: ['webdavRestoreLoading'],
    shownElementIds: ['webdavDataPreview'],
    hiddenContentSelector: '#webdavRestoreContent .restore-description',
    hiddenListSelector: '#webdavRestoreContent .file-list-container',
    restoreContentElementId: 'webdavRestoreContent',
    restoreContentStyle: {
      display: 'block',
      height: 'auto',
      minHeight: '400px',
      overflow: 'visible',
    },
    previewElementId: 'webdavDataPreview',
    previewElementStyle: {
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      position: 'relative',
      zIndex: '1000',
    },
    hiddenButtonIds: ['webdavRestoreAnalyze'],
    enabledButtonIds: ['webdavRestoreConfirm'],
    shownButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreBack',
    ],
    confirmButtonHtml: '<i class="fas fa-download"></i> 开始恢复',
    confirmButtonTitle: '开始执行覆盖式恢复',
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

export function buildRestoreSubmitLoadingState(): RestoreSubmitLoadingState {
  return {
    disabledButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreCancel',
    ],
    confirmButtonHtml: '<i class="fas fa-spinner fa-spin"></i> 合并中...',
  };
}

export function buildRestoreSubmitErrorState(): RestoreSubmitErrorState {
  return {
    enabledButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreCancel',
    ],
    shownButtonIds: ['webdavRestoreConfirm'],
    confirmButtonHtml: '<i class="fas fa-download"></i> 开始恢复',
  };
}

export function buildFileListLoadingState(): FileListLoadingState {
  return {
    hiddenElementIds: [
      'webdavRestoreContent',
      'webdavRestoreError',
    ],
    shownElementIds: ['webdavRestoreLoading'],
  };
}

export function buildFileListEnterState(): FileListEnterState {
  return {
    hiddenElementIds: [
      'webdavRestoreLoading',
      'webdavRestoreError',
      'webdavDataPreview',
    ],
    shownElementIds: ['webdavRestoreContent'],
    shownContentSelector: '#webdavRestoreContent .restore-description',
    shownListSelector: '#webdavRestoreContent .file-list-container',
    clearedElementIds: ['webdavFileList'],
  };
}

export function buildFileSelectionState(): FileSelectionState {
  return {
    hiddenElementIds: [
      'webdavRestoreOptions',
      'webdavDataPreview',
    ],
    disabledButtonIds: ['webdavRestoreConfirm'],
    hiddenButtonIds: ['webdavRestoreConfirm'],
    confirmButtonHtml: '<i class="fas fa-download"></i> 开始覆盖式恢复',
    confirmButtonTitle: '选择备份后即可恢复',
  };
}

export function buildRestoreFileListBackState(): RestoreFileListBackState {
  return {
    hiddenElementIds: ['webdavDataPreview'],
    shownContentSelector: '#webdavRestoreContent .restore-description',
    shownListSelector: '#webdavRestoreContent .file-list-container',
    disabledButtonIds: ['webdavRestoreConfirm'],
    hiddenButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreBack',
    ],
  };
}

export function buildRestoreErrorState(): RestoreErrorState {
  return {
    hiddenElementIds: [
      'webdavRestoreLoading',
      'webdavRestoreContent',
    ],
    shownElementIds: ['webdavRestoreError'],
    errorMessageElementId: 'webdavRestoreErrorMessage',
  };
}

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

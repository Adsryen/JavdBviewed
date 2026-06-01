import { describe, expect, it } from 'vitest';
import {
  buildAnalysisLoadingEnterState,
  buildAnalysisLoadingLeaveState,
  buildRestoreModalResetState,
} from './restoreModalStateModel';

describe('WebDAV restore modal state model', () => {
  it('builds reset state for a newly opened restore modal', () => {
    expect(buildRestoreModalResetState()).toEqual({
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
    });
  });

  it('builds state for entering restore analysis loading', () => {
    expect(buildAnalysisLoadingEnterState()).toEqual({
      loadingText: '正在分析数据差异...',
      hiddenElementIds: ['webdavRestoreContent'],
      shownElementIds: ['webdavRestoreLoading'],
    });
  });

  it('builds state for leaving restore analysis loading', () => {
    expect(buildAnalysisLoadingLeaveState()).toEqual({
      hiddenElementIds: ['webdavRestoreLoading'],
      shownElementIds: ['webdavRestoreContent'],
    });
  });
});

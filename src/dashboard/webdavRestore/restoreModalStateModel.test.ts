import { describe, expect, it } from 'vitest';
import {
  buildAnalysisLoadingEnterState,
  buildAnalysisLoadingLeaveState,
  buildAnalysisPreviewEnterState,
  buildCloudPreviewEnterState,
  buildCloudPreviewLoadingState,
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

  it('builds state for loading cloud preview statistics', () => {
    expect(buildCloudPreviewLoadingState()).toEqual({
      loadingText: '正在读取云端备份统计...',
      modalClassNamesToRemove: ['preview-active'],
      hiddenElementIds: [
        'webdavRestoreError',
        'webdavRestoreContent',
      ],
      shownElementIds: ['webdavRestoreLoading'],
    });
  });

  it('builds state for entering cloud preview statistics view', () => {
    expect(buildCloudPreviewEnterState()).toEqual({
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
    });
  });

  it('builds state for entering analyzed restore preview', () => {
    expect(buildAnalysisPreviewEnterState()).toEqual({
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
    });
  });
});

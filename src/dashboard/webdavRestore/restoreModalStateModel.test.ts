import { describe, expect, it } from 'vitest';
import {
  buildAnalysisLoadingEnterState,
  buildAnalysisLoadingLeaveState,
  buildAnalysisPreviewEnterState,
  buildCloudPreviewEnterState,
  buildCloudPreviewLoadingState,
  buildFileListEnterState,
  buildFileListLoadingState,
  buildFileSelectionState,
  buildRestoreErrorState,
  buildRestoreFileListBackState,
  buildRestoreSubmitErrorState,
  buildRestoreSubmitLoadingState,
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

  it('builds state for submitting restore merge', () => {
    expect(buildRestoreSubmitLoadingState()).toEqual({
      disabledButtonIds: [
        'webdavRestoreConfirm',
        'webdavRestoreCancel',
      ],
      confirmButtonHtml: '<i class="fas fa-spinner fa-spin"></i> 合并中...',
    });
  });

  it('builds state for restoring buttons after submit failure', () => {
    expect(buildRestoreSubmitErrorState()).toEqual({
      enabledButtonIds: [
        'webdavRestoreConfirm',
        'webdavRestoreCancel',
      ],
      shownButtonIds: ['webdavRestoreConfirm'],
      confirmButtonHtml: '<i class="fas fa-download"></i> 开始恢复',
    });
  });

  it('builds state for loading backup file list', () => {
    expect(buildFileListLoadingState()).toEqual({
      hiddenElementIds: [
        'webdavRestoreContent',
        'webdavRestoreError',
      ],
      shownElementIds: ['webdavRestoreLoading'],
    });
  });

  it('builds state for entering backup file list', () => {
    expect(buildFileListEnterState()).toEqual({
      hiddenElementIds: [
        'webdavRestoreLoading',
        'webdavRestoreError',
        'webdavDataPreview',
      ],
      shownElementIds: ['webdavRestoreContent'],
      shownContentSelector: '#webdavRestoreContent .restore-description',
      shownListSelector: '#webdavRestoreContent .file-list-container',
      clearedElementIds: ['webdavFileList'],
    });
  });

  it('builds state after selecting a backup file', () => {
    expect(buildFileSelectionState()).toEqual({
      hiddenElementIds: [
        'webdavRestoreOptions',
        'webdavDataPreview',
      ],
      disabledButtonIds: ['webdavRestoreConfirm'],
      hiddenButtonIds: ['webdavRestoreConfirm'],
      confirmButtonHtml: '<i class="fas fa-download"></i> 开始覆盖式恢复',
      confirmButtonTitle: '选择备份后即可恢复',
    });
  });

  it('builds state for returning to backup file list', () => {
    expect(buildRestoreFileListBackState()).toEqual({
      hiddenElementIds: ['webdavDataPreview'],
      shownContentSelector: '#webdavRestoreContent .restore-description',
      shownListSelector: '#webdavRestoreContent .file-list-container',
      disabledButtonIds: ['webdavRestoreConfirm'],
      hiddenButtonIds: [
        'webdavRestoreConfirm',
        'webdavRestoreBack',
      ],
    });
  });

  it('builds state for showing restore error', () => {
    expect(buildRestoreErrorState()).toEqual({
      hiddenElementIds: [
        'webdavRestoreLoading',
        'webdavRestoreContent',
      ],
      shownElementIds: ['webdavRestoreError'],
      errorMessageElementId: 'webdavRestoreErrorMessage',
    });
  });
});

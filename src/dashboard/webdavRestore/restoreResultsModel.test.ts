import { describe, expect, it } from 'vitest';
import {
  buildRestoreResultsEnterUiState,
  buildRestoreResultsContainerSpec,
  buildRestoreResultsDoneState,
  buildRestoreResultsLeaveUiState,
  buildRestoreResultsReturnToListState,
  buildRestoreResultItemHtml,
  buildRestoreResultItems,
  buildRestoreResultsHtml,
} from './restoreResultsModel';

describe('WebDAV restore results model', () => {
  it('builds result rows for all restore categories with cloud details', () => {
    const items = buildRestoreResultItems(
      {
        categories: {
          settings: { replaced: true, durationMs: 12.4 },
          viewed: { written: 2 },
          actors: { reason: 'missing' },
          logs: { reason: 'not_selected' },
          magnetPushLogs: { error: 'failed' },
          newWorks: { hasSubs: true, hasRecords: false, hasConfig: false },
        },
      },
      {
        settings: { display: true },
        data: { 'AAA-001': {}, 'BBB-002': {} },
        actorRecords: { actor1: {} },
        newWorks: {
          subscriptions: { actor1: {} },
          records: { work1: {}, work2: {} },
        },
        logs: [{ id: 1 }],
        idb: {
          magnets: [{ hash: 'a' }],
        },
      },
    );

    expect(items).toHaveLength(9);
    expect(items.find(item => item.key === 'settings')).toMatchObject({
      title: '扩展设置',
      statusText: '已覆盖',
      statusClass: 'status-success',
      iconClass: 'fas fa-check text-success',
    });
    expect(items.find(item => item.key === 'settings')?.details).toEqual(['云端：有', '12 ms']);
    expect(items.find(item => item.key === 'viewed')?.details).toEqual(['云端：2 条', '写入：2 条']);
    expect(items.find(item => item.key === 'actors')?.details).toEqual(['云端：1 条']);
    expect(items.find(item => item.key === 'logs')?.details).toEqual(['云端：1 条', '未选择']);
    expect(items.find(item => item.key === 'magnetPushLogs')).toMatchObject({
      statusText: '失败',
      statusClass: 'status-error',
      iconClass: 'fas fa-times text-danger',
    });
    expect(items.find(item => item.key === 'newWorks')?.details).toEqual(['云端：订阅 1 · 记录 2']);
    expect(items.find(item => item.key === 'magnets')?.details).toEqual(['云端：1 条', '未选择']);
  });

  it('uses storageAll and IDB fallback counts', () => {
    const items = buildRestoreResultItems(
      {
        categories: {
          viewed: { written: 3 },
          actors: { written: 2 },
          importStats: { replaced: true, reason: 'legacy-import' },
        },
      },
      {
        storageAll: {
          viewed: { 'AAA-001': {}, 'BBB-002': {}, 'CCC-003': {} },
          actor_records: { actor1: {}, actor2: {} },
          user_profile: { email: 'user@example.com' },
          last_import_stats: { lastImportTime: '2026-05-30T00:00:00.000Z' },
        },
        idb: {
          logs: [{ id: 1 }, { id: 2 }],
        },
      },
    );

    expect(items.find(item => item.key === 'viewed')?.details).toContain('云端：3 条');
    expect(items.find(item => item.key === 'actors')?.details).toContain('云端：2 条');
    expect(items.find(item => item.key === 'userProfile')?.details).toEqual(['云端：有', '未选择']);
    expect(items.find(item => item.key === 'importStats')?.details).toEqual(['云端：有', 'legacy-import']);
  });

  it('marks missing entries as skipped by default', () => {
    const items = buildRestoreResultItems({}, {});

    expect(items.every(item => item.statusText === '跳过')).toBe(true);
    expect(items.every(item => item.statusClass === 'status-skipped')).toBe(true);
    expect(items.find(item => item.key === 'settings')?.details).toEqual(['云端：无', '未选择']);
  });

  it('builds full results html with action buttons', () => {
    const html = buildRestoreResultsHtml([
      {
        key: 'settings',
        title: '扩展设置',
        statusText: '已覆盖',
        statusClass: 'status-success',
        iconClass: 'fas fa-check text-success',
        details: ['云端：有', '12 ms'],
      },
    ]);

    expect(html).toContain('恢复完成');
    expect(html).toContain('数据已成功覆盖，以下是详细结果：');
    expect(html).toContain('扩展设置');
    expect(html).toContain('云端：有 · 12 ms');
    expect(html).toContain('id="resultsBackBtn"');
    expect(html).toContain('id="resultsDoneBtn"');
  });

  it('builds the restore results container spec', () => {
    const spec = buildRestoreResultsContainerSpec(
      {
        categories: {
          settings: { replaced: true },
        },
      },
      {
        settings: true,
      },
    );

    expect(spec).toEqual({
      id: 'restoreResultsContainer',
      className: 'restore-results-container',
      html: expect.stringContaining('恢复完成'),
    });
    expect(spec.html).toContain('扩展设置');
  });

  it('omits empty result details in item html', () => {
    const html = buildRestoreResultItemHtml({
      key: 'logs',
      title: '日志记录',
      statusText: '跳过',
      statusClass: 'status-skipped',
      iconClass: 'fas fa-minus text-muted',
      details: [],
    });

    expect(html).toContain('日志记录');
    expect(html).toContain('status-skipped');
    expect(html).not.toContain('result-details');
  });

  it('builds UI state for entering results view', () => {
    expect(buildRestoreResultsEnterUiState()).toEqual({
      hiddenElementIds: [
        'webdavRestoreLoading',
        'webdavRestoreError',
        'webdavRestoreOptions',
        'webdavDataPreview',
        'webdavRestoreContent',
      ],
      hiddenButtonIds: [
        'webdavRestoreConfirm',
        'webdavRestoreBack',
        'webdavRestoreCancel',
      ],
      hideFooters: true,
    });
  });

  it('builds UI state for leaving results view', () => {
    expect(buildRestoreResultsLeaveUiState()).toEqual({
      hiddenElementIds: [
        'webdavRestoreError',
        'webdavDataPreview',
      ],
      loadingText: '正在获取云端文件列表...',
      restoreButtonIds: [
        'webdavRestoreConfirm',
        'webdavRestoreBack',
        'webdavRestoreCancel',
      ],
      showFooters: true,
    });
  });

  it('builds state for returning from results to backup list', () => {
    expect(buildRestoreResultsReturnToListState()).toEqual({
      resultsContainerId: 'restoreResultsContainer',
      modalBodySelector: '.modal-body',
      restoredChildDisplay: '',
      hiddenElementIds: [
        'webdavRestoreError',
        'webdavDataPreview',
      ],
      shownElementIds: ['webdavRestoreLoading'],
      loadingTextElementSelector: '#webdavRestoreLoading p',
      loadingText: '正在获取云端文件列表...',
      restoreButtonIds: [
        'webdavRestoreConfirm',
        'webdavRestoreBack',
        'webdavRestoreCancel',
      ],
      actionButtonOptions: {
        disableConfirm: true,
        hideBack: true,
      },
      footerDisplay: '',
    });
  });

  it('builds state for closing completed restore results', () => {
    expect(buildRestoreResultsDoneState()).toEqual({
      restoreButtonIds: [
        'webdavRestoreConfirm',
        'webdavRestoreBack',
        'webdavRestoreCancel',
      ],
      actionButtonOptions: {
        hideConfirm: true,
      },
      footerDisplay: '',
    });
  });
});

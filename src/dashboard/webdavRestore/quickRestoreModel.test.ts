import { describe, expect, it } from 'vitest';
import {
  buildQuickRestoreConfirmHtml,
  buildQuickRestoreMergeOptions,
  buildQuickRestoreModalStats,
} from './quickRestoreModel';

const diffResult: any = {
  videoRecords: {
    summary: {
      totalLocal: 1200,
      cloudOnlyCount: 11,
      conflictCount: 7,
    },
  },
  actorRecords: {
    summary: {
      totalLocal: 80,
      cloudOnlyCount: 3,
      conflictCount: 2,
    },
  },
  newWorks: {
    subscriptions: {
      summary: {
        conflictCount: 1,
      },
    },
    records: {
      summary: {
        conflictCount: 4,
      },
    },
  },
};

describe('WebDAV quick restore model', () => {
  it('builds smart restore modal stats from diff result', () => {
    expect(buildQuickRestoreModalStats(diffResult)).toEqual({
      localRecordsCount: 1200,
      localActorsCount: 80,
      cloudNewDataCount: 14,
      conflictsCount: 9,
    });
  });

  it('builds fallback confirmation html', () => {
    const html = buildQuickRestoreConfirmHtml(diffResult);

    expect(html).toContain('确认执行一键智能恢复');
    expect(html).toContain('保留本地视频记录：<strong>1,200</strong> 条');
    expect(html).toContain('保留本地演员收藏：<strong>80</strong> 个');
    expect(html).toContain('添加云端新增数据：<strong>14</strong> 项');
    expect(html).toContain('自动处理冲突：<strong>9</strong> 个');
  });

  it('builds default quick restore merge options', () => {
    expect(buildQuickRestoreMergeOptions()).toEqual({
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

  it('treats missing summary numbers as zero', () => {
    expect(buildQuickRestoreModalStats({})).toEqual({
      localRecordsCount: 0,
      localActorsCount: 0,
      cloudNewDataCount: 0,
      conflictsCount: 0,
    });
  });
});

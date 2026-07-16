import { describe, expect, it } from 'vitest';
import {
  buildRestoreCategoryModes,
  buildRestoreCategorySelection,
  buildRestoreExecuteConfirmHtml,
  getRestoreCategoryLabel,
  getSelectedRestoreCategories,
} from './restoreExecuteConfirmModel';

describe('WebDAV restore execute confirm model', () => {
  it('maps restore category keys to labels', () => {
    expect(getRestoreCategoryLabel('settings')).toBe('扩展设置');
    expect(getRestoreCategoryLabel('userProfile')).toBe('账号信息');
    expect(getRestoreCategoryLabel('viewed')).toBe('观看记录');
    expect(getRestoreCategoryLabel('actors')).toBe('演员库');
    expect(getRestoreCategoryLabel('newWorks')).toBe('新作品');
    expect(getRestoreCategoryLabel('lists')).toBe('清单 / 系列 / 番号');
    expect(getRestoreCategoryLabel('logs')).toBe('日志记录');
    expect(getRestoreCategoryLabel('magnetPushLogs')).toBe('磁力推送日志');
    expect(getRestoreCategoryLabel('importStats')).toBe('导入统计');
    expect(getRestoreCategoryLabel('magnets')).toBe('磁链缓存');
    expect(getRestoreCategoryLabel('custom')).toBe('custom');
  });

  it('returns selected restore category keys in object order', () => {
    expect(getSelectedRestoreCategories({
      settings: true,
      viewed: false,
      actors: true,
    })).toEqual(['settings', 'actors']);
  });

  it('builds restore category selection from merge options and extra switches', () => {
    expect(buildRestoreCategorySelection({
      mergeOptions: {
        strategy: 'smart',
        restoreSettings: true,
        restoreRecords: true,
        restoreUserProfile: false,
        restoreActorRecords: true,
        restoreLogs: false,
        restoreMagnetPushLogs: true,
        restoreImportStats: true,
        restoreNewWorks: true,
        restoreLists: false,
      },
      restoreMagnetPushLogs: false,
      restoreMagnets: true,
    })).toEqual({
      settings: true,
      userProfile: false,
      viewed: true,
      actors: true,
      newWorks: true,
      lists: false,
      logs: false,
      magnetPushLogs: false,
      importStats: true,
      magnets: true,
    });
  });

  it('builds restore category modes from defaults and explicit overrides', () => {
    expect(buildRestoreCategoryModes({
      mergeOptions: {
        strategy: 'smart',
        restoreSettings: true,
        restoreRecords: true,
        restoreUserProfile: true,
        restoreActorRecords: true,
        restoreLogs: false,
        restoreMagnetPushLogs: false,
        restoreImportStats: true,
        restoreNewWorks: true,
        restoreLists: true,
        categoryModes: {
          viewed: 'replace',
          actors: 'skip',
        },
      },
      restoreMagnetPushLogs: false,
      restoreMagnets: true,
      explicitModes: {
        lists: 'merge',
        magnets: 'skip',
      },
    })).toEqual({
      settings: 'replace',
      userProfile: 'replace',
      viewed: 'replace',
      actors: 'skip',
      newWorks: 'merge',
      lists: 'merge',
      logs: 'skip',
      magnetPushLogs: 'skip',
      importStats: 'replace',
      magnets: 'skip',
    });
  });

  it('builds confirm html for enabled auto backup', () => {
    const html = buildRestoreExecuteConfirmHtml({
      categories: {
        settings: true,
        actors: true,
        logs: false,
      },
      categoryModes: {
        settings: 'replace',
        actors: 'merge',
        logs: 'skip',
      },
      autoBackupBeforeRestore: true,
    });

    expect(html).toContain('确认恢复策略');
    expect(html).toContain('将要恢复的类别：');
    expect(html).toContain('扩展设置');
    expect(html).toContain('覆盖');
    expect(html).toContain('演员库');
    expect(html).toContain('合并');
    expect(html).not.toContain('<li>日志记录</li>');
    expect(html).toContain('alert-success');
    expect(html).toContain('恢复前将自动备份当前数据');
    expect(html).toContain('覆盖类别会先清空本地同类数据');
  });

  it('builds confirm html for disabled auto backup', () => {
    const html = buildRestoreExecuteConfirmHtml({
      categories: {
        settings: true,
      },
      categoryModes: {
        settings: 'replace',
      },
      autoBackupBeforeRestore: false,
    });

    expect(html).toContain('alert-warning');
    expect(html).toContain('未启用自动备份');
  });
});

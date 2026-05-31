import { describe, expect, it } from 'vitest';
import {
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
      },
      restoreMagnetPushLogs: false,
      restoreMagnets: true,
    })).toEqual({
      settings: true,
      userProfile: false,
      viewed: true,
      actors: true,
      newWorks: true,
      logs: false,
      magnetPushLogs: false,
      importStats: true,
      magnets: true,
    });
  });

  it('builds confirm html for enabled auto backup', () => {
    const html = buildRestoreExecuteConfirmHtml({
      categories: {
        settings: true,
        actors: true,
        logs: false,
      },
      autoBackupBeforeRestore: true,
    });

    expect(html).toContain('警告：替换式恢复将清空现有数据！');
    expect(html).toContain('将要恢复的类别：');
    expect(html).toContain('<li>扩展设置</li>');
    expect(html).toContain('<li>演员库</li>');
    expect(html).not.toContain('<li>日志记录</li>');
    expect(html).toContain('alert-success');
    expect(html).toContain('恢复前将自动备份当前数据');
    expect(html).toContain('此操作不可撤销，确定要继续吗？');
  });

  it('builds confirm html for disabled auto backup', () => {
    const html = buildRestoreExecuteConfirmHtml({
      categories: {
        settings: true,
      },
      autoBackupBeforeRestore: false,
    });

    expect(html).toContain('alert-warning');
    expect(html).toContain('未启用自动备份');
  });
});

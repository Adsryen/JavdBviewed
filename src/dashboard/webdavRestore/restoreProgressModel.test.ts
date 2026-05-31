import { describe, expect, it } from 'vitest';
import { buildRestoreProgressHtml, formatElapsedTime } from './restoreProgressModel';

describe('WebDAV restore progress model', () => {
  it('builds restore progress html with initial status and timer placeholders', () => {
    const html = buildRestoreProgressHtml();

    expect(html).toContain('正在执行覆盖式恢复');
    expect(html).toContain('请耐心等待，恢复过程中请勿关闭页面');
    expect(html).toContain('id="progressCategories"');
    expect(html).toContain('id="progressSummary"');
    expect(html).toContain('id="overallProgress"');
    expect(html).toContain('准备中...');
    expect(html).toContain('id="elapsedTime"');
    expect(html).toContain('00:00');
  });

  it('formats elapsed seconds as mm:ss', () => {
    expect(formatElapsedTime(0)).toBe('00:00');
    expect(formatElapsedTime(9)).toBe('00:09');
    expect(formatElapsedTime(65)).toBe('01:05');
    expect(formatElapsedTime(3605)).toBe('60:05');
  });
});

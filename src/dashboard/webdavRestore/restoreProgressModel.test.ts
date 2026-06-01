import { describe, expect, it } from 'vitest';
import {
  buildRestoreProgressContainerSpec,
  buildRestoreProgressEnterState,
  buildRestoreProgressHtml,
  buildRestoreProgressLeaveState,
  formatElapsedTime,
} from './restoreProgressModel';

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

  it('builds restore progress container spec', () => {
    expect(buildRestoreProgressContainerSpec()).toEqual({
      id: 'restoreProgressContainer',
      className: 'restore-progress-container',
      html: buildRestoreProgressHtml(),
    });
  });

  it('builds progress enter and leave states for modal body children', () => {
    expect(buildRestoreProgressEnterState()).toEqual({
      modalId: 'webdavRestoreModal',
      modalBodySelector: '.modal-body',
      hiddenChildDisplay: 'none',
    });

    expect(buildRestoreProgressLeaveState()).toEqual({
      progressContainerId: 'restoreProgressContainer',
      restoredChildDisplay: '',
    });
  });
});

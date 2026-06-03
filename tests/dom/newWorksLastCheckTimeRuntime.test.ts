import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatNewWorksLastCheckTime,
  updateNewWorksLastCheckTimeDisplay,
} from '../../src/dashboard/tabs/newWorksLastCheckTimeRuntime';

describe('new works last check time runtime', () => {
  const now = new Date('2026-05-02T12:00:00+08:00').getTime();

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="lastCheckTimeDisplay" style="display:none;">
        <strong id="lastCheckTimeText">未检查</strong>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('formats relative last check time labels', () => {
    expect(formatNewWorksLastCheckTime(now - 30_000, now)).toBe('刚刚');
    expect(formatNewWorksLastCheckTime(now - 5 * 60_000, now)).toBe('5分钟前');
    expect(formatNewWorksLastCheckTime(now - 3 * 60 * 60_000, now)).toBe('3小时前');
    expect(formatNewWorksLastCheckTime(now - 2 * 24 * 60 * 60_000, now)).toBe('2天前');
  });

  it('shows formatted last check time and hides empty state', () => {
    updateNewWorksLastCheckTimeDisplay(now - 5 * 60_000, { now });

    expect(document.getElementById('lastCheckTimeText')?.textContent).toBe('上次检查：5分钟前');
    expect((document.getElementById('lastCheckTimeDisplay') as HTMLElement).style.display).toBe('flex');

    updateNewWorksLastCheckTimeDisplay(undefined, { now });
    expect((document.getElementById('lastCheckTimeDisplay') as HTMLElement).style.display).toBe('none');
  });
});

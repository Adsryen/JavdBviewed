import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVSettingsDifferenceController } from '../../src/dashboard/webdavRestore/settingsDifferenceController';

describe('WebDAV settings difference controller', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    vi.restoreAllMocks();
  });

  it('opens settings difference modal and animates it', () => {
    const controller = new WebDAVSettingsDifferenceController({ logInfo: vi.fn() });
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    controller.show({
      local: { theme: 'dark' },
      cloud: { theme: 'light' },
    });

    const modal = document.querySelector('.settings-diff-modal') as HTMLElement | null;
    expect(modal).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
    expect(modal?.innerHTML).toContain('扩展设置差异对比');
    expect(modal?.innerHTML).toContain('"theme": "dark"');
    expect(modal?.style.opacity).toBe('1');
    expect(modal?.style.transform).toBe('scale(1)');
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('replaces existing settings difference modal when opened again', () => {
    const controller = new WebDAVSettingsDifferenceController({ logInfo: vi.fn() });

    controller.show({ local: { old: true }, cloud: {} });
    controller.show({ local: { next: true }, cloud: {} });

    const modals = document.querySelectorAll('.settings-diff-modal');
    expect(modals).toHaveLength(1);
    expect(modals[0].innerHTML).toContain('"next": true');
    expect(modals[0].innerHTML).not.toContain('"old": true');
  });

  it('closes from header button, footer button, backdrop, and Escape', () => {
    vi.useFakeTimers();
    const logInfo = vi.fn();
    const controller = new WebDAVSettingsDifferenceController({ logInfo });

    controller.show({ local: { a: 1 }, cloud: { a: 2 } });
    document.getElementById('closeSettingsDiff')?.click();
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.settings-diff-modal')).toBeNull();
    expect(document.body.style.overflow).toBe('');

    controller.show({ local: { a: 1 }, cloud: { a: 2 } });
    document.getElementById('closeSettingsDiffFooter')?.click();
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.settings-diff-modal')).toBeNull();

    controller.show({ local: { a: 1 }, cloud: { a: 2 } });
    document.querySelector('.settings-diff-modal')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.settings-diff-modal')).toBeNull();

    controller.show({ local: { a: 1 }, cloud: { a: 2 } });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.settings-diff-modal')).toBeNull();
    expect(logInfo).toHaveBeenCalledWith('设置差异弹窗已关闭');

    vi.useRealTimers();
  });

  it('keeps modal open when clicking content area', () => {
    const controller = new WebDAVSettingsDifferenceController({ logInfo: vi.fn() });

    controller.show({ local: { a: 1 }, cloud: { a: 2 } });
    document.querySelector('.settings-diff-modal > div')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelector('.settings-diff-modal')).toBeTruthy();
  });
});

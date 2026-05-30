import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  attachListClickEnhancement,
  extractMovieIdFromJavdbVideoUrl,
  isFc2ListVideoCode,
} from '../../src/features/listEnhancement/ui/clickEnhancement';

function createItem(url = 'https://javdb.com/v/abc123'): HTMLElement {
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `<a href="${url}"><span>cover</span></a>`;
  document.body.appendChild(item);
  return item;
}

describe('list click enhancement', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('detects FC2 video codes and extracts movie id from JavDB video url', () => {
    expect(isFc2ListVideoCode('FC2-123456')).toBe(true);
    expect(isFc2ListVideoCode('abc FC2PPV 123')).toBe(true);
    expect(isFc2ListVideoCode('ABC-123')).toBe(false);
    expect(extractMovieIdFromJavdbVideoUrl('https://javdb.com/v/abc123?foo=1')).toBe('abc123');
    expect(extractMovieIdFromJavdbVideoUrl('https://javdb.com/search?q=abc')).toBeNull();
  });

  it('navigates normal videos on left click', async () => {
    const item = createItem();
    const navigateTo = vi.fn();
    attachListClickEnhancement(item, {
      videoInfo: { code: 'ABC-001', title: 'Title', url: 'https://javdb.com/v/abc123' },
      enableRightClickBackground: false,
      navigateTo,
      openFc2Dialog: vi.fn(),
      sendRuntimeMessage: vi.fn(),
      showToast: vi.fn(),
      openWindow: vi.fn(),
      logger: vi.fn(),
      now: () => 1000,
      setTimeout: window.setTimeout.bind(window),
    });

    item.querySelector('a')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(navigateTo).toHaveBeenCalledWith('https://javdb.com/v/abc123');
  });

  it('opens FC2 dialog instead of navigating', async () => {
    const item = createItem();
    const navigateTo = vi.fn();
    const openFc2Dialog = vi.fn().mockResolvedValue(undefined);
    attachListClickEnhancement(item, {
      videoInfo: { code: 'FC2-123456', title: 'Title', url: 'https://javdb.com/v/fc2abc' },
      enableRightClickBackground: false,
      navigateTo,
      openFc2Dialog,
      sendRuntimeMessage: vi.fn(),
      showToast: vi.fn(),
      openWindow: vi.fn(),
      logger: vi.fn(),
      now: () => 1000,
      setTimeout: window.setTimeout.bind(window),
    });

    item.querySelector('a')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(openFc2Dialog).toHaveBeenCalledWith('fc2abc', 'FC2-123456', 'https://javdb.com/v/fc2abc');
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('shows an error toast when FC2 movie id cannot be parsed', async () => {
    const item = createItem();
    const showToast = vi.fn();
    attachListClickEnhancement(item, {
      videoInfo: { code: 'FC2-123456', title: 'Title', url: 'https://javdb.com/search?q=fc2' },
      enableRightClickBackground: false,
      navigateTo: vi.fn(),
      openFc2Dialog: vi.fn(),
      sendRuntimeMessage: vi.fn(),
      showToast,
      openWindow: vi.fn(),
      logger: vi.fn(),
      now: () => 1000,
      setTimeout: window.setTimeout.bind(window),
    });

    item.querySelector('a')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(showToast).toHaveBeenCalledWith('无法解析FC2视频ID', 'error');
  });

  it('opens right click target in background tab with debounce', () => {
    vi.useFakeTimers();
    const item = createItem();
    const sendRuntimeMessage = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();
    attachListClickEnhancement(item, {
      videoInfo: { code: 'ABC-001', title: 'Title', url: 'https://javdb.com/v/abc123' },
      enableRightClickBackground: true,
      navigateTo: vi.fn(),
      openFc2Dialog: vi.fn(),
      sendRuntimeMessage,
      showToast,
      openWindow: vi.fn(),
      logger: vi.fn(),
      now: () => 1000,
      setTimeout: window.setTimeout.bind(window),
    });

    const link = item.querySelector('a') as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 2 }));
    link.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(sendRuntimeMessage).toHaveBeenCalledTimes(1);
    expect(sendRuntimeMessage).toHaveBeenCalledWith({
      type: 'OPEN_TAB_BACKGROUND',
      url: 'https://javdb.com/v/abc123',
    });
  });
});

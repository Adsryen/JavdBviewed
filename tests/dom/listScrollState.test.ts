import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createListScrollStateController,
} from '../../src/features/listEnhancement/ui/listScrollState';

describe('list scroll state controller', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('marks the list as scrolling and restores pointer events after the delay', () => {
    vi.useFakeTimers();
    const list = document.createElement('div');
    list.className = 'movie-list';
    document.body.appendChild(list);

    const controller = createListScrollStateController({
      document,
      window,
      restoreDelayMs: 100,
    });

    controller.init();
    window.dispatchEvent(new Event('scroll'));

    expect(controller.isScrolling()).toBe(true);
    expect(list.style.pointerEvents).toBe('none');

    vi.advanceTimersByTime(99);
    expect(controller.isScrolling()).toBe(true);
    expect(list.style.pointerEvents).toBe('none');

    vi.advanceTimersByTime(1);
    expect(controller.isScrolling()).toBe(false);
    expect(list.style.pointerEvents).toBe('');

    controller.cleanup();
  });

  it('cleans up the scroll listener and pending timer', () => {
    vi.useFakeTimers();
    const list = document.createElement('div');
    list.className = 'movie-list';
    document.body.appendChild(list);

    const controller = createListScrollStateController({
      document,
      window,
      restoreDelayMs: 100,
    });

    controller.init();
    window.dispatchEvent(new Event('scroll'));
    controller.cleanup();
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('scroll'));

    expect(controller.isScrolling()).toBe(false);
    expect(list.style.pointerEvents).toBe('');
  });
});

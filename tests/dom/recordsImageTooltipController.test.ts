import { describe, expect, it, vi } from 'vitest';
import { bindRecordsImageTooltip } from '../../src/dashboard/tabs/records/imageTooltipController';

function dispatchMouse(target: HTMLElement, type: string, x = 120, y = 80) {
  target.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
  }));
}

describe('records image tooltip controller', () => {
  it('shows loading image tooltip, positions it, and hides on mouseleave', () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <a id="target">MKMP-577</a>
      <div id="tooltip" class="image-tooltip"></div>
    `;
    const target = document.getElementById('target') as HTMLElement;
    const tooltip = document.getElementById('tooltip') as HTMLDivElement;
    Object.defineProperty(tooltip, 'getBoundingClientRect', {
      value: () => ({ width: 160, height: 240, left: 0, top: 0, right: 160, bottom: 240 }),
    });

    bindRecordsImageTooltip({
      target,
      tooltip,
      imageUrl: 'https://example.com/cover.jpg',
      title: '测试标题',
      showDelayMs: 120,
    });

    dispatchMouse(target, 'mouseenter', 100, 100);
    const img = tooltip.querySelector('img') as HTMLImageElement;

    expect(tooltip.style.display).toBe('block');
    expect(tooltip.style.opacity).toBe('0');
    expect(img.src).toBe('https://example.com/cover.jpg');
    expect(img.alt).toBe('测试标题');
    expect(tooltip.querySelector('.image-tooltip-loading')?.textContent).toBe('加载中...');

    dispatchMouse(target, 'mousemove', 200, 130);
    vi.advanceTimersByTime(120);
    expect(tooltip.style.opacity).toBe('1');
    expect(tooltip.style.left).toBeTruthy();
    expect(tooltip.style.top).toBeTruthy();

    img.dispatchEvent(new Event('load'));
    expect(img.style.opacity).toBe('1');
    expect((tooltip.querySelector('.image-tooltip-loading') as HTMLElement).style.display).toBe('none');

    dispatchMouse(target, 'mouseleave');
    expect(tooltip.style.display).toBe('none');
    expect(tooltip.style.opacity).toBe('0');
    vi.useRealTimers();
  });

  it('shows image load failure state', () => {
    document.body.innerHTML = `
      <div id="target"></div>
      <div id="tooltip"></div>
    `;
    const target = document.getElementById('target') as HTMLElement;
    const tooltip = document.getElementById('tooltip') as HTMLDivElement;

    bindRecordsImageTooltip({
      target,
      tooltip,
      imageUrl: 'https://example.com/missing.jpg',
      title: 'missing',
    });

    dispatchMouse(target, 'mouseenter');
    const img = tooltip.querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));

    expect(img.style.display).toBe('none');
    expect(tooltip.querySelector('.image-tooltip-loading')?.textContent).toBe('图片加载失败');
  });
});

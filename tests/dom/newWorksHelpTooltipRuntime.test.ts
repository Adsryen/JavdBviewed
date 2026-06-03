import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachNewWorksHelpTooltip } from '../../src/dashboard/tabs/newWorksHelpTooltipRuntime';

describe('new works help tooltip runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<i id="helpIcon"></i>';
    const helpIcon = document.getElementById('helpIcon')!;
    helpIcon.getBoundingClientRect = () => ({
      left: 100,
      top: 80,
      right: 120,
      bottom: 100,
      width: 20,
      height: 20,
      x: 100,
      y: 80,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('creates one tooltip on hover and positions it near the icon', () => {
    const helpIcon = document.getElementById('helpIcon')!;

    attachNewWorksHelpTooltip(helpIcon, '帮助文案');
    helpIcon.dispatchEvent(new Event('mouseenter'));
    helpIcon.dispatchEvent(new Event('mouseenter'));

    const tooltip = document.querySelector<HTMLElement>('.help-tooltip')!;
    expect(document.querySelectorAll('.help-tooltip')).toHaveLength(1);
    expect(tooltip.textContent).toBe('帮助文案');
    expect(tooltip.style.opacity).toBe('1');
    expect(tooltip.style.left).toBe('110px');
    expect(tooltip.style.top).toBe('70px');
  });

  it('fades and removes tooltip after mouse leaves', () => {
    const helpIcon = document.getElementById('helpIcon')!;

    attachNewWorksHelpTooltip(helpIcon, '帮助文案');
    helpIcon.dispatchEvent(new Event('mouseenter'));
    helpIcon.dispatchEvent(new Event('mouseleave'));

    expect(document.querySelector<HTMLElement>('.help-tooltip')?.style.opacity).toBe('0');
    vi.advanceTimersByTime(200);
    expect(document.querySelector('.help-tooltip')).toBeNull();
  });
});

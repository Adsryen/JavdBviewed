import { beforeEach, describe, expect, it } from 'vitest';
import { AnchorOptimizationManager } from '../../src/features/anchorOptimization/content';

describe('AnchorOptimizationManager themed floating buttons', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    (window as any).__JDB_VERBOSE = false;
  });

  it('uses theme variables for floating anchor button colors', () => {
    const manager = new AnchorOptimizationManager() as any;

    const button = manager.createButton({
      id: 'magnet-links',
      label: '磁鏈下載',
      icon: 'M',
      target: '#magnet-links',
      enabled: true,
      order: 1,
    }) as HTMLElement;

    const styleText = document.getElementById('optimized-anchor-button-styles')?.textContent || '';

    expect(styleText).toContain('--jdb-anchor-btn-bg');
    expect(styleText).toContain('html[data-theme="dark"] .optimized-anchor-buttons');
    expect(button.style.background).toBe('');
    expect(button.style.border).toBe('');
    expect(button.style.color).toBe('');
    expect(button.classList.contains('optimized-anchor-btn')).toBe(true);
  });
});

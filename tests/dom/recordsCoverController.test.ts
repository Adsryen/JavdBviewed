import { describe, expect, it, vi } from 'vitest';
import { createRecordsCoverElement, insertRecordsCoverElement, observeRecordsCoverImage } from '../../src/dashboard/tabs/records/coverController';

describe('records cover controller', () => {
  it('creates lazy cover element from enhanced cover url and binds tooltip', () => {
    const bindTooltip = vi.fn();
    const cover = createRecordsCoverElement({
      title: '测试标题',
      coverUrl: 'https://example.com/cover.jpg',
      tooltipImageUrl: 'https://example.com/big.jpg',
      fallbackUrl: 'chrome-extension://test/assets/alternate-search.png',
      tooltip: document.createElement('div') as HTMLDivElement,
      bindTooltip,
    });

    const img = cover.querySelector('img') as HTMLImageElement;
    expect(cover.className).toBe('video-cover skeleton');
    expect(img.className).toBe('video-cover-img');
    expect(img.alt).toBe('测试标题');
    expect(img.getAttribute('data-src')).toBe('https://example.com/cover.jpg');
    expect(bindTooltip).toHaveBeenCalledWith(expect.objectContaining({
      target: cover,
      imageUrl: 'https://example.com/big.jpg',
      title: '测试标题',
      showDelayMs: 120,
    }));
  });

  it('uses fallback image and removes skeleton when cover url is missing', () => {
    const cover = createRecordsCoverElement({
      title: '测试标题',
      coverUrl: '',
      tooltipImageUrl: '',
      fallbackUrl: 'chrome-extension://test/assets/alternate-search.png',
      tooltip: null,
      bindTooltip: vi.fn(),
    });

    const img = cover.querySelector('img') as HTMLImageElement;
    expect(cover.classList.contains('skeleton')).toBe(false);
    expect(img.src).toBe('chrome-extension://test/assets/alternate-search.png');
    expect(img.classList.contains('loaded')).toBe(true);
  });

  it('inserts cover before existing content and registers lazy observer when needed', () => {
    document.body.innerHTML = '<li id="row"><span>content</span></li>';
    const row = document.getElementById('row') as HTMLLIElement;
    const cover = createRecordsCoverElement({
      title: '测试标题',
      coverUrl: 'https://example.com/cover.jpg',
      tooltipImageUrl: '',
      fallbackUrl: 'fallback.png',
      tooltip: null,
      bindTooltip: vi.fn(),
    });
    const observer = { observe: vi.fn() };

    insertRecordsCoverElement(row, cover);
    observeRecordsCoverImage(cover, observer);

    expect(row.firstElementChild).toBe(cover);
    expect(observer.observe).toHaveBeenCalledWith(cover.querySelector('img'));
  });
});

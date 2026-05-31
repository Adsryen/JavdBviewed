import { beforeEach, describe, expect, it } from 'vitest';
import { VideoDetailEnhancer } from '../../src/features/videoDetail';
import { MagnetSearchManager, type MagnetResult } from '../../src/features/magnets';

function magnet(overrides: Partial<MagnetResult> = {}): MagnetResult {
  return {
    name: 'JUR-730 1080p Chinese Subtitle',
    magnet: 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678',
    size: '7.1 GiB',
    sizeBytes: 7623566950,
    date: '2026-05-24',
    source: 'Sukebei',
    quality: '1080p',
    hasSubtitle: true,
    ...overrides,
  };
}

describe('detail area visual polish', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    (window as any).__JDB_VERBOSE = false;
  });

  it('adds compact card styling classes to unified magnet rows', () => {
    const manager = new MagnetSearchManager() as any;

    manager.addUnifiedMagnetStyles();
    const item = manager.createUnifiedMagnetItem(magnet(), 0);
    document.body.innerHTML = `
      <div class="top-meta"></div>
      <div><div id="magnets-content"></div></div>
    `;
    manager.showManualSearchButton(true);
    const styleText = document.getElementById('unified-magnet-list-styles')?.textContent || '';

    expect(styleText).toContain('--jdb-magnet-card-bg');
    expect(styleText).toContain('.jdb-magnet-manual-search');
    expect(styleText).not.toContain('border-left');
    expect(item.classList.contains('jdb-magnet-row')).toBe(true);
    expect(item.querySelector('.jdb-magnet-meta')).toBeTruthy();
    expect(item.querySelector('.jdb-magnet-tags')).toBeTruthy();
    expect(document.querySelector('.jdb-magnet-manual-search')).toBeTruthy();
  });

  it('shows combined source labels for deduplicated unified magnet rows', () => {
    const manager = new MagnetSearchManager() as any;

    const item = manager.createUnifiedMagnetItem(magnet({
      source: 'JavDB / Sukebei',
      sources: ['JavDB', 'Sukebei'],
    }), 0);
    const sourceTags = Array.from(item.querySelectorAll('.jdb-magnet-source-tag')).map((tag) => tag.textContent);

    expect(item.querySelector('.jdb-magnet-meta')?.textContent).toContain('来源 JavDB / Sukebei');
    expect(sourceTags).toEqual(['JavDB', 'Sukebei']);
  });

  it('filters unified magnet rows by source without losing the complete result set', async () => {
    const manager = new MagnetSearchManager({ maxResults: 20 }) as any;
    document.body.innerHTML = '<div id="magnets-content"></div>';

    manager.processAndDisplayAllMagnets([
      magnet({ name: 'javdb-only', source: 'JavDB' }),
      magnet({
        name: 'javdb-sukebei',
        source: 'JavDB / Sukebei',
        sources: ['JavDB', 'Sukebei'],
        magnet: 'magnet:?xt=urn:btih:abcdefabcdefabcdefabcdefabcdefabcdefabcd',
      }),
      magnet({
        name: 'javbus-only',
        source: 'JAVBUS',
        magnet: 'magnet:?xt=urn:btih:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      }),
    ], { notify: false });

    await new Promise(resolve => setTimeout(resolve, 180));
    await new Promise(resolve => requestAnimationFrame(resolve));

    const filters = Array.from(document.querySelectorAll<HTMLButtonElement>('.jdb-magnet-source-filter'));
    expect(filters.map(button => button.textContent)).toEqual(expect.arrayContaining(['全部 3', 'JavDB 2', 'Sukebei 1', 'JAVBUS 1']));

    filters.find(button => button.dataset.jdbMagnetSourceFilter === 'javdb')?.click();
    await new Promise(resolve => setTimeout(resolve, 180));
    await new Promise(resolve => requestAnimationFrame(resolve));

    const visibleTitles = Array.from(document.querySelectorAll<HTMLElement>('#magnets-content .jdb-magnet-title')).map(item => item.textContent);
    expect(visibleTitles).toEqual(['javdb-only', 'javdb-sukebei']);
    expect((manager.currentMagnetResults as MagnetResult[]).map(result => result.name)).toEqual(['javdb-only', 'javdb-sukebei', 'javbus-only']);
    expect(document.querySelector('.jdb-magnet-source-filter.is-active')?.textContent).toBe('JavDB 2');
  });

  it('summarizes found, deduplicated, and displayed magnet counts in the completion toast', () => {
    const manager = new MagnetSearchManager({ maxResults: 20 }) as any;
    document.body.innerHTML = '<div id="magnets-content"></div>';
    const duplicateHash = '1234567890abcdef1234567890abcdef12345678';

    manager.processAndDisplayAllMagnets([
      magnet({
        name: 'merged',
        source: 'JavDB / Sukebei',
        sources: ['JavDB', 'Sukebei'],
        magnet: `magnet:?xt=urn:btih:${duplicateHash}`,
      }),
      magnet({ name: 'other', source: 'BTdig', magnet: 'magnet:?xt=urn:btih:abcdefabcdefabcdefabcdefabcdefabcdefabcd' }),
    ], { discoveredCount: 3 });

    const toastText = document.querySelector('.javdb-ext-toast-message')?.textContent || '';
    expect(toastText).toContain('发现 3 条');
    expect(toastText).toContain('去重 1 条');
    expect(toastText).toContain('显示 2 条');
  });

  it('styles and paginates native JavDB magnet rows before manual search loads', () => {
    const manager = new MagnetSearchManager() as any;
    const nativeRows = Array.from({ length: 12 }, (_, index) => `
      <div class="item columns is-desktop ${index % 2 === 0 ? 'odd' : ''}">
        <div class="magnet-name column is-four-fifths">
          <a href="magnet:?xt=urn:btih:${String(index).padStart(40, '0')}">
            <span class="name">SNOS-242-${index + 1}.torrent</span>
            <br>
            <span class="meta">${index + 1}.00GB</span>
            <br>
            <div class="tags"><span class="tag is-primary is-small is-light">高清</span></div>
          </a>
        </div>
        <div class="buttons column">
          <button class="button is-info is-small copy-to-clipboard" type="button">复制</button>
          <button class="button is-success is-small drive115-push-btn" style="margin-left: 5px;">推送115</button>
        </div>
        <div class="date column"><span class="time">2026-05-${String(index + 1).padStart(2, '0')}</span></div>
      </div>
    `).join('');
    document.body.innerHTML = `
      <div class="top-meta">
        <div class="tags"><span class="tag is-light magnet-search-tag">SUK搜索</span></div>
        <div class="moj-content" style="display: none;"><a><img src="ad.jpg"></a></div>
      </div>
      <div id="magnets-content" class="magnet-links">${nativeRows}</div>
    `;

    manager.addUnifiedMagnetStyles();
    manager.applyNativeMagnetPresentation();
    const styleText = document.getElementById('unified-magnet-list-styles')?.textContent || '';
    const rows = Array.from(document.querySelectorAll<HTMLElement>('#magnets-content > .item.columns.is-desktop'));

    expect(styleText).toContain('#magnets-content > .item.columns.is-desktop');
    expect(styleText).toContain('.top-meta .moj-content');
    expect(styleText).toContain('.top-meta.jdb-magnet-meta-bar');
    expect(styleText).toContain('.magnet-search-tag.is-success');
    expect(styleText).toContain('#magnets-content .jdb-native-magnet-row');
    expect(styleText).toContain('#magnets-content .jdb-native-magnet-row br');
    expect(styleText).toContain('display: none !important');
    expect(rows[0].classList.contains('jdb-magnet-row')).toBe(true);
    expect(rows[0].classList.contains('jdb-native-magnet-row')).toBe(true);
    expect(rows[0].querySelector('.jdb-magnet-title')).toBeTruthy();
    expect(rows[0].querySelector('.jdb-magnet-meta')).toBeTruthy();
    expect(rows[0].querySelector('.jdb-magnet-tags')).toBeTruthy();
    expect(rows.filter(row => !row.classList.contains('jdb-magnet-page-hidden'))).toHaveLength(10);
    expect(document.querySelector('.jdb-magnet-pagination')).toBeTruthy();

    document.querySelector<HTMLButtonElement>('.jdb-magnet-pagination [data-jdb-magnet-next]')?.click();
    expect(rows.filter(row => !row.classList.contains('jdb-magnet-page-hidden'))).toHaveLength(2);
    expect(rows[10].classList.contains('jdb-magnet-page-hidden')).toBe(false);
  });

  it('adds compact card styling classes to injected review rows', () => {
    const enhancer = new VideoDetailEnhancer() as any;

    const item = enhancer.createNativeReviewElement({
      id: 'review-1',
      author: '测试用户',
      content: '评论内容',
      rating: 8,
      date: '2026-05-24T00:00:00.000Z',
      likes: 12,
    });
    const host = document.createElement('div');
    const dl = document.createElement('dl');
    host.appendChild(dl);
    document.body.appendChild(host);
    enhancer.addReviewBreakerBanner(dl, 8, 4);
    const styleText = document.getElementById('jdb-review-breaker-styles')?.textContent || '';

    expect(styleText).toContain('--jdb-review-card-bg');
    expect(styleText).not.toContain('border-left');
    expect(item.classList.contains('jdb-review-card')).toBe(true);
    expect(item.querySelector('.jdb-review-author')?.textContent).toContain('测试用户');
    expect(item.querySelector('.jdb-review-meta')).toBeTruthy();
    expect(item.querySelector('.jdb-review-content')).toBeTruthy();
    expect(item.querySelector<HTMLButtonElement>('.jdb-review-like-button')).toBeNull();
    expect(item.querySelector('.jdb-review-like-count')?.textContent).toContain('12');
    expect(document.getElementById('jhs-review-banner')?.textContent).toContain('JavDB 助手');
  });
});

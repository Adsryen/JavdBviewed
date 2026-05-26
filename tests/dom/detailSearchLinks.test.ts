import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultHttpClient } from '../../src/services/dataAggregator/httpClient';
import {
  buildDetailSearchLinks,
  findDetailSearchInsertionTarget,
  renderDetailSearchLinks,
} from '../../src/content/detailSearchLinks';

describe('detail search links', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('builds links from configured search engines and removes duplicate templates', () => {
    const links = buildDetailSearchLinks('SSIS-795', [
      { id: 'javdb', name: 'JavDB', urlTemplate: 'https://javdb.com/search?q={{ID}}', icon: '' },
      { id: 'copy', name: 'JavDB Copy', urlTemplate: 'https://javdb.com/search?q={{ id }}', icon: '' },
      { id: 'bad', name: 'Bad', urlTemplate: '', icon: '' },
    ]);

    expect(links).toEqual([
      {
        name: 'JavDB',
        url: 'https://javdb.com/search?q=SSIS-795',
        icon: 'chrome-extension://test-runtime/assets/javdb.ico',
        category: 'search',
      },
    ]);
  });

  it('hides FC2-only detail links for standard video ids', () => {
    const links = buildDetailSearchLinks('SSIS-795', [
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: '', contexts: ['detail'] },
      { id: 'fc2ppvdb', name: 'FC2PPVDB', urlTemplate: 'https://fc2ppvdb.com/articles/{{FC2_ID}}', icon: '', match: 'fc2', contexts: ['detail'] },
    ]);

    expect(links.map(link => link.name)).toEqual(['SubTitleCat']);
  });

  it('renders FC2-only detail links for FC2 video ids with numeric placeholders', () => {
    const links = buildDetailSearchLinks('FC2-4903984', [
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: '', contexts: ['detail'] },
      { id: 'fc2ppvdb', name: 'FC2PPVDB', urlTemplate: 'https://fc2ppvdb.com/articles/{{FC2_ID}}', icon: '', match: 'fc2', contexts: ['detail'] },
    ]);

    expect(links.map(link => link.name)).toEqual(['SubTitleCat', 'FC2PPVDB']);
    expect(links[1].url).toBe('https://fc2ppvdb.com/articles/4903984');
  });

  it('places the search row below online availability when it is present', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
        <div class="review-buttons"></div>
        <div id="jdb-online-availability-panel" class="panel-block">在线可看</div>
      </nav>
    `;

    const target = findDetailSearchInsertionTarget();

    expect(target?.parent).toBe(document.querySelector('.movie-panel-info'));
    expect(target?.before).toBe(document.querySelector('#jdb-online-availability-panel')?.nextSibling);
  });

  it('uses the online availability slot when the online panel has not rendered yet', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
        <div class="review-buttons"></div>
        <div class="panel-block">stats</div>
      </nav>
    `;

    const target = findDetailSearchInsertionTarget();

    expect(target?.parent).toBe(document.querySelector('.movie-panel-info'));
    expect(target?.before).toBe(document.querySelector('.review-buttons')?.nextSibling);
  });

  it('renders a compact external search panel on detail pages', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', icon: 'assets/javbus.ico' },
    ]);

    const panel = document.getElementById('jdb-external-search-panel');
    const link = panel?.querySelector<HTMLAnchorElement>('a');
    const icon = link?.querySelector<HTMLImageElement>('img');

    expect(panel?.className).toContain('panel-block');
    expect(panel?.textContent).toContain('外部搜索:');
    expect(link?.textContent).toBe('JavBus');
    expect(link?.href).toBe('https://javbus.com/search/SSIS-795');
    expect(icon?.src).toBe('chrome-extension://test-runtime/assets/javbus.ico');
  });

  it('renders subtitle search links in a separate detail panel', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', icon: 'assets/javbus.ico', category: 'search' },
      { id: 'missav', name: 'MISSAV', urlTemplate: 'https://missav.ws/search/{{ID}}', icon: 'assets/missav.ico', category: 'resource' },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: 'assets/subtitlecat.ico', category: 'subtitle', contexts: ['detail'] },
    ]);

    const externalPanel = document.getElementById('jdb-external-search-panel');
    const subtitlePanel = document.getElementById('jdb-subtitle-search-panel');

    expect(externalPanel?.textContent).toContain('外部搜索:');
    expect(externalPanel?.textContent).toContain('JavBus');
    expect(externalPanel?.textContent).toContain('MISSAV');
    expect(externalPanel?.textContent).not.toContain('SubTitleCat');
    expect(subtitlePanel?.textContent).toContain('字幕搜索:');
    expect(subtitlePanel?.textContent).toContain('SubTitleCat');
  });

  it('hides subtitle search panel when the detail option is disabled', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', icon: 'assets/javbus.ico', category: 'search' },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: 'assets/subtitlecat.ico', category: 'subtitle', contexts: ['detail'] },
    ], { showSubtitleSearch: false });

    expect(document.getElementById('jdb-external-search-panel')?.textContent).toContain('JavBus');
    expect(document.getElementById('jdb-subtitle-search-panel')).toBeNull();
  });

  it('hides external search panel while keeping subtitle search when the external search option is disabled', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', icon: 'assets/javbus.ico', category: 'search' },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: 'assets/subtitlecat.ico', category: 'subtitle', contexts: ['detail'] },
    ], { showExternalSearch: false });

    expect(document.getElementById('jdb-external-search-panel')).toBeNull();
    expect(document.getElementById('jdb-subtitle-search-panel')?.textContent).toContain('SubTitleCat');
  });

  it('removes detail external entry panels when the unified panel option is disabled', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', icon: 'assets/javbus.ico', category: 'search' },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: 'assets/subtitlecat.ico', category: 'subtitle', contexts: ['detail'] },
    ]);

    renderDetailSearchLinks('SSIS-795', [
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', icon: 'assets/javbus.ico', category: 'search' },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: 'assets/subtitlecat.ico', category: 'subtitle', contexts: ['detail'] },
    ], { enabled: false });

    expect(document.getElementById('jdb-external-search-panel')).toBeNull();
    expect(document.getElementById('jdb-subtitle-search-panel')).toBeNull();
  });

  it('hides disabled search engines from detail panels', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', icon: 'assets/javbus.ico', category: 'search', enabled: false },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/search?q={{ID}}', icon: 'assets/subtitlecat.ico', category: 'subtitle', contexts: ['detail'] },
    ]);

    expect(document.getElementById('jdb-external-search-panel')).toBeNull();
    expect(document.getElementById('jdb-subtitle-search-panel')?.textContent).toContain('SubTitleCat');
  });

  it('opens 迅雷字幕 in a detail-page modal instead of navigating to the API URL', async () => {
    vi.spyOn(defaultHttpClient, 'getJson').mockResolvedValue({
      data: [
        {
          name: 'SSIS-795.zh.srt',
          ext: 'srt',
          url: 'https://subtitle.test/SSIS-795.zh.srt',
        },
      ],
    });
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'xunlei-subtitle', name: '迅雷字幕', urlTemplate: 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name={{ID}}', icon: 'assets/xunlei.png', category: 'subtitle', contexts: ['detail'] },
    ]);

    const link = document.querySelector<HTMLAnchorElement>('#jdb-subtitle-search-panel a')!;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const modal = document.querySelector('.jdb-xunlei-subtitle-modal');
    const downloadLink = modal?.querySelector<HTMLAnchorElement>('a[href="https://subtitle.test/SSIS-795.zh.srt"]');

    expect(defaultHttpClient.getJson).toHaveBeenCalledWith(
      'https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name=SSIS-795',
      expect.objectContaining({ responseType: 'json' }),
    );
    expect(modal?.textContent).toContain('迅雷字幕');
    expect(modal?.textContent).toContain('SSIS-795.zh.srt');
    expect(downloadLink?.textContent).toContain('下载');
  });
});

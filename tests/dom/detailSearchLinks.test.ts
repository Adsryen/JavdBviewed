import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultHttpClient } from '../../src/platform/network/httpClient';
import {
  buildDetailSearchLinks,
  findDetailSearchInsertionTarget,
  renderDetailSearchLinks,
} from '../../src/features/externalSearch';

describe('detail search links', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
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

  it('renders real 迅雷字幕 API result fields for MKMP-577', async () => {
    vi.spyOn(defaultHttpClient, 'getJson').mockResolvedValue({
      code: 0,
      result: 'ok',
      data: [
        {
          gcid: '7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91',
          cid: '7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91',
          url: 'https://subtitle.v.geilijiasu.com/71/72/7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91.srt',
          ext: 'srt',
          name: 'MKMP-577.srt',
          duration: 7932000,
          languages: [''],
          source: 0,
          score: 0,
          fingerprintf_score: 0,
          extra_name: '（网友上传）',
          mt: 2,
        },
        {
          gcid: 'A2F74670796A4B00E16369697BF01C2E454FD884',
          cid: 'A2F74670796A4B00E16369697BF01C2E454FD884',
          url: 'https://subtitle.v.geilijiasu.com/A2/F7/A2F74670796A4B00E16369697BF01C2E454FD884.srt',
          ext: 'srt',
          name: 'VOAY44lUVFzs56Arorr06Ia2A1_MKMP-577^.srt',
          duration: 7932000,
          languages: ['zh'],
          source: 0,
          score: 0,
          fingerprintf_score: 0,
          extra_name: '（网友上传）',
          mt: 2,
        },
      ],
    });
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">MKMP-577</div>
      </nav>
    `;

    renderDetailSearchLinks('MKMP-577', [
      { id: 'xunlei-subtitle', name: '迅雷字幕', urlTemplate: 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name={{ID}}', icon: 'assets/xunlei.png', category: 'subtitle', contexts: ['detail'] },
    ]);

    document.querySelector<HTMLAnchorElement>('#jdb-subtitle-search-panel a')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const modal = document.querySelector('.jdb-xunlei-subtitle-modal');
    const rows = modal?.querySelectorAll('.jdb-xunlei-subtitle-row');
    const downloadLink = modal?.querySelector<HTMLAnchorElement>('a[href="https://subtitle.v.geilijiasu.com/71/72/7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91.srt"]');

    expect(rows).toHaveLength(2);
    expect(modal?.textContent).toContain('MKMP-577.srt');
    expect(modal?.textContent).toContain('VOAY44lUVFzs56Arorr06Ia2A1_MKMP-577^.srt');
    expect(modal?.textContent).toContain('ZH');
    expect(downloadLink?.textContent).toContain('下载');
  });

  it('renders 迅雷字幕 results with compact metadata tags and copy action', async () => {
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockClear();
    vi.spyOn(defaultHttpClient, 'getJson').mockResolvedValue({
      code: 0,
      result: 'ok',
      data: [
        {
          gcid: '7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91',
          cid: '7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91',
          url: 'https://subtitle.v.geilijiasu.com/71/72/7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91.srt',
          ext: 'srt',
          name: 'MKMP-577.srt',
          duration: 7932000,
          languages: [''],
          extra_name: '（网友上传）',
          score: 0,
        },
        {
          gcid: 'A2F74670796A4B00E16369697BF01C2E454FD884',
          cid: 'A2F74670796A4B00E16369697BF01C2E454FD884',
          url: 'https://subtitle.v.geilijiasu.com/A2/F7/A2F74670796A4B00E16369697BF01C2E454FD884.srt',
          ext: 'srt',
          name: 'MKMP-577.srt',
          duration: 7932000,
          languages: ['zh'],
          extra_name: '（网友上传）',
          score: 92,
        },
      ],
    });
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">MKMP-577</div>
      </nav>
    `;

    renderDetailSearchLinks('MKMP-577', [
      { id: 'xunlei-subtitle', name: '迅雷字幕', urlTemplate: 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name={{ID}}', icon: 'assets/xunlei.png', category: 'subtitle', contexts: ['detail'] },
    ]);

    document.querySelector<HTMLAnchorElement>('#jdb-subtitle-search-panel a')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const modal = document.querySelector('.jdb-xunlei-subtitle-modal');
    const title = modal?.querySelector('#jdb-xunlei-subtitle-title');
    const tagTexts = Array.from(modal?.querySelectorAll('.jdb-xunlei-subtitle-tag') || [])
      .map(tag => tag.textContent?.trim());
    const copyButton = modal?.querySelector<HTMLButtonElement>('.jdb-xunlei-subtitle-copy');

    expect(title?.textContent).toBe('迅雷字幕 · MKMP-577 · 2 条');
    expect(tagTexts).toEqual(expect.arrayContaining([
      'SRT',
      '未知语言',
      'ZH',
      '网友上传',
      '02:12:12',
      'Hash 7172AEEC',
      'Hash A2F74670',
      '匹配 92',
    ]));
    expect(copyButton?.textContent).toContain('复制链接');

    copyButton?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://subtitle.v.geilijiasu.com/71/72/7172AEEC50DD7ACBACC6D0EBEA4EB1734629AB91.srt');
    expect(copyButton?.textContent).toContain('已复制');
  });

  it('renders an empty state when 迅雷字幕 returns no results', async () => {
    vi.spyOn(defaultHttpClient, 'getJson').mockResolvedValue({ data: [] });
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">MKMP-577</div>
      </nav>
    `;

    renderDetailSearchLinks('MKMP-577', [
      { id: 'xunlei-subtitle', name: '迅雷字幕', urlTemplate: 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name={{ID}}', icon: 'assets/xunlei.png', category: 'subtitle', contexts: ['detail'] },
    ]);

    document.querySelector<HTMLAnchorElement>('#jdb-subtitle-search-panel a')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const modal = document.querySelector('.jdb-xunlei-subtitle-modal');

    expect(modal?.querySelector('#jdb-xunlei-subtitle-title')?.textContent).toBe('迅雷字幕 · MKMP-577 · 0 条');
    expect(modal?.textContent).toContain('暂无字幕');
  });

  it('renders an error state when 迅雷字幕 request fails', async () => {
    vi.spyOn(defaultHttpClient, 'getJson').mockRejectedValue(new Error('Request timeout'));
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">MKMP-577</div>
      </nav>
    `;

    renderDetailSearchLinks('MKMP-577', [
      { id: 'xunlei-subtitle', name: '迅雷字幕', urlTemplate: 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name={{ID}}', icon: 'assets/xunlei.png', category: 'subtitle', contexts: ['detail'] },
    ]);

    document.querySelector<HTMLAnchorElement>('#jdb-subtitle-search-panel a')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const modal = document.querySelector('.jdb-xunlei-subtitle-modal');
    const state = modal?.querySelector('.jdb-xunlei-subtitle-state.is-error');

    expect(state?.textContent).toContain('加载失败：Request timeout');
  });

  it('closes the 迅雷字幕 modal from the close button and Escape key', async () => {
    vi.spyOn(defaultHttpClient, 'getJson').mockResolvedValue({ data: [] });
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">MKMP-577</div>
      </nav>
    `;

    renderDetailSearchLinks('MKMP-577', [
      { id: 'xunlei-subtitle', name: '迅雷字幕', urlTemplate: 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name={{ID}}', icon: 'assets/xunlei.png', category: 'subtitle', contexts: ['detail'] },
    ]);

    document.querySelector<HTMLAnchorElement>('#jdb-subtitle-search-panel a')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    document.querySelector<HTMLButtonElement>('.jdb-xunlei-subtitle-close')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.jdb-xunlei-subtitle-modal')).toBeNull();

    document.querySelector<HTMLAnchorElement>('#jdb-subtitle-search-panel a')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    document.querySelector<HTMLElement>('.jdb-xunlei-subtitle-modal')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(document.querySelector('.jdb-xunlei-subtitle-modal')).toBeNull();
  });

  it('injects detail search styles once and keeps dark-theme subtitle variables', () => {
    document.documentElement.dataset.theme = 'dark';
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
    ]);

    const externalStyles = document.querySelectorAll('#jdb-external-search-styles');
    const subtitleStyles = document.querySelectorAll('#jdb-xunlei-subtitle-styles');
    const externalStyleText = externalStyles[0]?.textContent || '';
    const subtitleStyleText = subtitleStyles[0]?.textContent || '';

    expect(externalStyles).toHaveLength(1);
    expect(subtitleStyles).toHaveLength(1);
    expect(externalStyleText).toContain('.jdb-external-search-links');
    expect(subtitleStyleText).toContain('html[data-theme="dark"] .jdb-xunlei-subtitle-modal');
    expect(subtitleStyleText).toContain('--jdb-xunlei-bg: #1f2937');

    delete document.documentElement.dataset.theme;
  });

  it('falls back to the generic search icon when a configured icon fails to load', () => {
    document.body.innerHTML = `
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block">SSIS-795</div>
      </nav>
    `;

    renderDetailSearchLinks('SSIS-795', [
      { id: 'custom-site', name: 'Custom', urlTemplate: 'https://example.test/search/{{ID}}', icon: 'assets/custom-missing.png', category: 'search' },
    ]);

    const icon = document.querySelector<HTMLImageElement>('.jdb-external-search-icon')!;
    icon.dispatchEvent(new Event('error'));

    expect(icon.src).toBe('chrome-extension://test-runtime/assets/alternate-search.png');
  });
});

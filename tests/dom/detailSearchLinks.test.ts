import { afterEach, describe, expect, it } from 'vitest';
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
      },
    ]);
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
});

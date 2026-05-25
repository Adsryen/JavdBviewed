import { beforeEach, describe, expect, it } from 'vitest';
import {
  applySuperRankingNav,
  destroySuperRankingNav,
  initializeSuperRankingNav,
  SUPER_RANKING_FC2_URL,
  SUPER_RANKING_PLAYBACK_URL,
  SUPER_RANKING_ITEMS,
  SUPER_RANKING_TOP250_URL,
  isSuperRankingSupportedHost,
} from '../../src/content/superRankingNav';

function renderRankingNavbar(): void {
  document.body.innerHTML = `
    <div class="navbar-item has-dropdown is-hoverable">
      <a class="navbar-link" href="/rankings/movies?p=daily&amp;t=censored">排行榜</a>
      <div class="navbar-dropdown is-boxed">
        <a class="navbar-item" href="/rankings/playback">热播</a>
        <a class="navbar-item" href="/rankings/top">TOP250</a>
        <a class="navbar-item" href="/rankings/movies?p=daily&amp;t=censored">有碼</a>
        <a class="navbar-item" href="/rankings/movies?p=daily&amp;t=uncensored">無碼</a>
        <a class="navbar-item" href="/rankings/movies?p=daily&amp;t=western">歐美</a>
        <a class="navbar-item" href="/rankings/movies?p=daily&amp;t=fc2">FC2</a>
        <a class="navbar-item" href="/rankings/fanza_award">FANZA(DMM)成人獎</a>
      </div>
    </div>
  `;
}

function renderRankingTabs(): void {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="tabs">
      <ul>
        <li><a href="/rankings/movies?p=daily&amp;t=fc2">FC2</a></li>
      </ul>
    </div>
  `);
}

const ORIGINAL_RANKING_HREFS = [
  '/rankings/playback',
  '/rankings/top',
  '/rankings/movies?p=daily&t=censored',
  '/rankings/movies?p=daily&t=uncensored',
  '/rankings/movies?p=daily&t=western',
  '/rankings/movies?p=daily&t=fc2',
  '/rankings/fanza_award',
];

describe('super ranking navigation', () => {
  beforeEach(() => {
    destroySuperRankingNav();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('renames JavDB ranking nav and keeps native non-VIP ranking entries', () => {
    renderRankingNavbar();

    expect(applySuperRankingNav()).toBe(true);

    const link = document.querySelector<HTMLAnchorElement>('.navbar-link');
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('.navbar-dropdown > a.navbar-item'));

    expect(link?.textContent?.trim()).toBe('超级排行榜');
    expect(link?.getAttribute('href')).toBe('/rankings/movies?p=daily&t=censored');
    expect(anchors).toHaveLength(SUPER_RANKING_ITEMS.length);
    expect(anchors.map(anchor => anchor.textContent?.trim())).toEqual(SUPER_RANKING_ITEMS.map(item => item.text));
    expect(anchors.map(anchor => anchor.getAttribute('href'))).toEqual(SUPER_RANKING_ITEMS.map(item => item.href));
    expect(anchors[0].getAttribute('href')).toBe(SUPER_RANKING_PLAYBACK_URL);
    expect(anchors[1].getAttribute('href')).toBe(SUPER_RANKING_TOP250_URL);
    expect(anchors.find(anchor => anchor.textContent?.trim() === 'FC2')?.getAttribute('href')).toBe(SUPER_RANKING_FC2_URL);
  });

  it('routes FC2 to the free advanced search page used by the reference script', () => {
    expect(SUPER_RANKING_FC2_URL).toBe('/advanced_search?type=3&score_min=0&d=1');
  });

  it('routes native FC2 tabs to the free advanced search page and restores them on destroy', () => {
    renderRankingNavbar();
    renderRankingTabs();

    applySuperRankingNav();

    const fc2Tab = document.querySelector<HTMLAnchorElement>('.tabs a');
    expect(fc2Tab?.getAttribute('href')).toBe(SUPER_RANKING_FC2_URL);

    destroySuperRankingNav();

    expect(fc2Tab?.getAttribute('href')).toBe('/rankings/movies?p=daily&t=fc2');
  });

  it('is idempotent when applied repeatedly', () => {
    renderRankingNavbar();

    applySuperRankingNav();
    applySuperRankingNav();

    const anchors = document.querySelectorAll<HTMLAnchorElement>('.navbar-dropdown > a.navbar-item');
    expect(anchors).toHaveLength(SUPER_RANKING_ITEMS.length);
  });

  it('re-applies the nav after browser history restoration', async () => {
    renderRankingNavbar();

    initializeSuperRankingNav('javdb.com');

    const link = document.querySelector<HTMLAnchorElement>('.navbar-link');
    const dropdown = document.querySelector<HTMLElement>('.navbar-dropdown');
    expect(link?.textContent?.trim()).toBe('超级排行榜');

    if (link && dropdown) {
      link.textContent = '排行榜';
      dropdown.innerHTML = '<a class="navbar-item" href="/rankings/playback">热播</a>';
    }

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('.navbar-dropdown > a.navbar-item'));
    expect(link?.textContent?.trim()).toBe('超级排行榜');
    expect(anchors.map(anchor => anchor.getAttribute('href'))).toEqual(SUPER_RANKING_ITEMS.map(item => item.href));
  });

  it('restores the original ranking nav when destroyed', () => {
    renderRankingNavbar();

    applySuperRankingNav();
    destroySuperRankingNav();

    const link = document.querySelector<HTMLAnchorElement>('.navbar-link');
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('.navbar-dropdown > a.navbar-item'));

    expect(link?.textContent?.trim()).toBe('排行榜');
    expect(link?.getAttribute('href')).toBe('/rankings/movies?p=daily&t=censored');
    expect(anchors.map(anchor => anchor.textContent?.trim())).toEqual(SUPER_RANKING_ITEMS.map(item => item.text));
    expect(anchors.map(anchor => anchor.getAttribute('href'))).toEqual(ORIGINAL_RANKING_HREFS);
  });

  it('removes rendered special page content when destroyed', () => {
    document.body.innerHTML = '<div id="jdb-super-ranking-page">special ranking page</div>';

    destroySuperRankingNav();

    expect(document.getElementById('jdb-super-ranking-page')).toBeNull();
  });

  it('supports JavDB hosts across all routes and skips JavBus hosts', () => {
    expect(isSuperRankingSupportedHost('javdb.com')).toBe(true);
    expect(isSuperRankingSupportedHost('www.javdb.com')).toBe(true);
    expect(isSuperRankingSupportedHost('javdb570.com')).toBe(true);
    expect(isSuperRankingSupportedHost('foo.javdb570.com')).toBe(true);
    expect(isSuperRankingSupportedHost('javbus.com')).toBe(false);
    expect(isSuperRankingSupportedHost('www.javbus.com')).toBe(false);
  });
});

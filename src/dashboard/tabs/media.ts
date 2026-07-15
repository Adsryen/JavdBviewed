/**
 * @file media.ts
 * @description 媒体库标签页 Phase A：浏览 UI 壳（演示数据，后续接真实索引）
 * @module dashboard/tabs
 */

import { resolveDashboardNavState } from './navModel';

export type MediaBrowseSource = 'all' | 'emby' | 'jellyfin' | '115' | 'offline';

export type MediaBrowseItem = {
  code: string;
  title: string;
  source: Exclude<MediaBrowseSource, 'all'>;
  year: string;
  hue: number;
};

const PREVIEW_ITEMS: MediaBrowseItem[] = [
  { code: 'SSIS-458', title: '恋人未满的同居生活', source: 'emby', year: '2022', hue: 330 },
  { code: 'STARS-712', title: '第一次的温泉旅行', source: 'jellyfin', year: '2023', hue: 200 },
  { code: 'MIDV-401', title: '雨夜之后', source: 'emby', year: '2023', hue: 255 },
  { code: 'PRED-512', title: '都市夜行', source: 'jellyfin', year: '2024', hue: 170 },
  { code: 'IPX-987', title: '白衬衫与星期一', source: 'emby', year: '2021', hue: 20 },
  { code: 'CAWD-558', title: '海边的旧相机', source: '115', year: '2022', hue: 190 },
  { code: 'JUL-998', title: '隔壁的灯还亮着', source: 'emby', year: '2020', hue: 280 },
  { code: 'ABW-340', title: '夜间便利店', source: 'jellyfin', year: '2023', hue: 40 },
  { code: 'FSDSS-620', title: '玻璃温室', source: 'emby', year: '2024', hue: 145 },
  { code: 'ADN-480', title: '未寄出的信', source: 'jellyfin', year: '2022', hue: 300 },
  { code: 'HMN-445', title: '地铁末班车', source: '115', year: '2021', hue: 220 },
  { code: 'SSIS-790', title: '蓝色窗帘', source: 'emby', year: '2023', hue: 210 },
];

type MediaPageRuntime = {
  root: HTMLElement;
  filter: MediaBrowseSource;
  query: string;
  heroIndex: number;
  heroTimer: number | null;
  bound: boolean;
  onHashChange?: () => void;
};

let runtime: MediaPageRuntime | null = null;

function cover(item: MediaBrowseItem): string {
  const h = item.hue;
  return `linear-gradient(125deg, hsl(${h} 48% 48%), hsl(${(h + 36) % 360} 42% 28%) 50%, hsl(${(h + 18) % 360} 28% 14%))`;
}

function sourceLabel(source: MediaBrowseItem['source']): string {
  if (source === 'emby') return 'Emby';
  if (source === 'jellyfin') return 'Jellyfin';
  if (source === '115') return '115';
  return '本地';
}

function sourceClass(source: MediaBrowseItem['source']): string {
  if (source === 'emby') return 'source-emby';
  if (source === 'jellyfin') return 'source-jellyfin';
  return 'source-115';
}

function relativePos(i: number, active: number, len: number): number {
  let d = i - active;
  if (d > len / 2) d -= len;
  if (d < -len / 2) d += len;
  return d;
}

function subPathToFilter(subPath?: string): MediaBrowseSource {
  if (subPath === 'emby') return 'emby';
  if (subPath === 'jellyfin') return 'jellyfin';
  if (subPath === '115') return '115';
  return 'all';
}

function applyFilterFromHash(): void {
  if (!runtime) return;
  const state = resolveDashboardNavState(window.location.hash);
  if (state.tabId !== 'tab-media') return;
  const next = subPathToFilter(state.subPath);
  runtime.filter = next;
  syncFilterChips();
  renderGrid();
}

function syncFilterChips(): void {
  if (!runtime) return;
  runtime.root.querySelectorAll<HTMLElement>('[data-media-filter]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.mediaFilter === runtime!.filter);
  });
}

function filteredItems(): MediaBrowseItem[] {
  if (!runtime) return [];
  const q = runtime.query.trim().toLowerCase();
  return PREVIEW_ITEMS.filter((item) => {
    if (runtime!.filter !== 'all' && item.source !== runtime!.filter) return false;
    if (!q) return true;
    return item.code.toLowerCase().includes(q) || item.title.toLowerCase().includes(q);
  });
}

function heroItems(): MediaBrowseItem[] {
  return PREVIEW_ITEMS.slice(0, 5);
}

function renderHero(): void {
  if (!runtime) return;
  const track = runtime.root.querySelector<HTMLElement>('#mediaHeroTrack');
  const dots = runtime.root.querySelector<HTMLElement>('#mediaHeroDots');
  if (!track || !dots) return;

  const list = heroItems();
  const len = list.length;
  track.innerHTML = list.map((item, i) => {
    const pos = relativePos(i, runtime!.heroIndex, len);
    const posAttr = pos >= -2 && pos <= 2 ? String(pos) : 'hide';
    return `
      <button type="button" class="media-hero-slide" data-index="${i}" data-pos="${posAttr}" aria-current="${pos === 0 ? 'true' : 'false'}">
        <div class="media-hero-art" style="background:${cover(item)}"></div>
        <div class="media-hero-copy">
          <span class="media-hero-code">${item.code}</span>
          <h3>${item.title}</h3>
          <div class="media-hero-meta">
            <span>${sourceLabel(item.source)}</span>
            <span>·</span>
            <span>${item.year}</span>
            <span>·</span>
            <span>预览</span>
          </div>
          <div class="media-hero-actions">
            <span class="media-hero-btn primary">查看条目</span>
            <span class="media-hero-btn ghost">${sourceLabel(item.source)}</span>
          </div>
        </div>
      </button>
    `;
  }).join('');

  dots.innerHTML = list.map((_, i) => `
    <button type="button" class="media-hero-dot${i === runtime!.heroIndex ? ' is-active' : ''}" data-dot="${i}" aria-label="第 ${i + 1} 张"></button>
  `).join('');
}

function renderGrid(): void {
  if (!runtime) return;
  const grid = runtime.root.querySelector<HTMLElement>('#mediaLibraryGrid');
  const count = runtime.root.querySelector<HTMLElement>('#mediaLibraryCount');
  const empty = runtime.root.querySelector<HTMLElement>('#mediaLibraryEmpty');
  if (!grid || !count || !empty) return;

  const list = filteredItems();
  count.textContent = `${list.length} 部 · 横向封面 16:9`;
  empty.hidden = list.length > 0;
  grid.hidden = list.length === 0;

  grid.innerHTML = list.map((item) => `
    <button type="button" class="media-film-card" data-code="${item.code}">
      <div class="media-film-cover">
        <div class="media-film-cover-art" style="background:${cover(item)}"></div>
        <div class="media-film-cover-shade"></div>
        <div class="media-film-badges">
          <span class="media-badge ${sourceClass(item.source)}">${sourceLabel(item.source)}</span>
          <span class="media-badge status">预览</span>
        </div>
        <div class="media-film-cover-foot">
          <span class="media-film-code">${item.code}</span>
          <div class="media-film-title">${item.title}</div>
        </div>
        <div class="media-play-hit" aria-hidden="true">
          <span><i class="fas fa-play" style="font-size:14px;margin-left:2px"></i></span>
        </div>
      </div>
      <div class="media-film-meta">
        <span>${sourceLabel(item.source)}</span>
        <span>${item.year}</span>
      </div>
    </button>
  `).join('');
}

function setHero(index: number): void {
  if (!runtime) return;
  const len = heroItems().length;
  runtime.heroIndex = ((index % len) + len) % len;
  renderHero();
}

function restartHeroTimer(): void {
  if (!runtime) return;
  if (runtime.heroTimer !== null) {
    window.clearInterval(runtime.heroTimer);
  }
  runtime.heroTimer = window.setInterval(() => {
    setHero(runtime!.heroIndex + 1);
  }, 4500);
}

function bindEvents(): void {
  if (!runtime || runtime.bound) return;
  runtime.bound = true;
  const root = runtime.root;

  root.querySelectorAll<HTMLElement>('[data-media-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const next = (chip.dataset.mediaFilter || 'all') as MediaBrowseSource;
      runtime!.filter = next;
      syncFilterChips();
      // 页内筛选即可，不再改 hash 触发已移除的二级子菜单
      renderGrid();
    });
  });

  const search = root.querySelector<HTMLInputElement>('#mediaLibrarySearch');
  search?.addEventListener('input', () => {
    runtime!.query = search.value || '';
    renderGrid();
  });

  root.querySelector('#mediaHeroPrev')?.addEventListener('click', () => {
    setHero(runtime!.heroIndex - 1);
    restartHeroTimer();
  });
  root.querySelector('#mediaHeroNext')?.addEventListener('click', () => {
    setHero(runtime!.heroIndex + 1);
    restartHeroTimer();
  });

  root.querySelector('#mediaHeroDots')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-dot]');
    if (!btn) return;
    setHero(Number(btn.dataset.dot));
    restartHeroTimer();
  });

  const track = root.querySelector<HTMLElement>('#mediaHeroTrack');
  track?.addEventListener('click', (e) => {
    const slide = (e.target as HTMLElement).closest<HTMLElement>('.media-hero-slide');
    if (!slide) return;
    const idx = Number(slide.dataset.index);
    if (Number.isNaN(idx)) return;
    if (idx === runtime!.heroIndex) return;
    setHero(idx);
    restartHeroTimer();
  });

  // swipe
  if (track) {
    let startX = 0;
    track.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    track.addEventListener('pointerup', (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) setHero(runtime!.heroIndex + 1);
      else setHero(runtime!.heroIndex - 1);
      restartHeroTimer();
    });
  }

  // wheel
  const carousel = root.querySelector<HTMLElement>('.media-hero-carousel');
  if (carousel) {
    let lockedUntil = 0;
    carousel.addEventListener('wheel', (e) => {
      const dx = e.deltaX;
      const dy = e.deltaY;
      const dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(dominant) < 8) return;
      e.preventDefault();
      const now = Date.now();
      if (now < lockedUntil) return;
      lockedUntil = now + 320;
      if (dominant > 0) setHero(runtime!.heroIndex + 1);
      else setHero(runtime!.heroIndex - 1);
      restartHeroTimer();
    }, { passive: false });
  }

  runtime.onHashChange = () => applyFilterFromHash();
  window.addEventListener('hashchange', runtime.onHashChange);
}

export async function initMediaTab(): Promise<void> {
  const root = document.getElementById('tab-media');
  if (!root) return;

  const page = root.querySelector<HTMLElement>('[data-media-page]');
  if (!page) return;

  if (!runtime || runtime.root !== page) {
    if (runtime?.heroTimer !== null && runtime?.heroTimer !== undefined) {
      window.clearInterval(runtime.heroTimer);
    }
    if (runtime?.onHashChange) {
      window.removeEventListener('hashchange', runtime.onHashChange);
    }
    runtime = {
      root: page,
      filter: 'all',
      query: '',
      heroIndex: 0,
      heroTimer: null,
      bound: false,
    };
  }

  bindEvents();
  applyFilterFromHash();
  renderHero();
  renderGrid();
  restartHeroTimer();
}

export function getMediaPreviewItemCountForTest(): number {
  return PREVIEW_ITEMS.length;
}

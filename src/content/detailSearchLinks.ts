import {
  buildSearchEngineUrl,
  getSearchEngineCategory,
  getSearchEnginesForVideo,
  resolveSearchEngineIcon,
  type SearchEngineTemplate,
} from '../utils/searchEngines';
import { defaultHttpClient } from '../services/dataAggregator/httpClient';

export interface DetailSearchLink {
  name: string;
  url: string;
  icon: string;
  category: string;
}

export interface DetailSearchInsertionTarget {
  parent: Element;
  before: ChildNode | null;
}

export interface RenderDetailSearchLinksOptions {
  showSubtitleSearch?: boolean;
}

export function buildDetailSearchLinks(
  videoId: string,
  searchEngines: unknown,
  category?: string,
): DetailSearchLink[] {
  if (!videoId) return [];

  const engines = getSearchEnginesForVideo(searchEngines, videoId, 'detail');
  return engines
    .filter((engine: SearchEngineTemplate) => String(engine.name || '').trim() && String(engine.urlTemplate || '').trim())
    .filter((engine: SearchEngineTemplate) => {
      if (!category) return true;
      return getSearchEngineCategory(engine) === category;
    })
    .map((engine: SearchEngineTemplate) => ({
      name: String(engine.name).trim(),
      url: buildSearchEngineUrl(String(engine.urlTemplate), videoId),
      icon: resolveSearchEngineIcon(engine),
      category: getSearchEngineCategory(engine),
    }));
}

export function findDetailSearchInsertionTarget(): DetailSearchInsertionTarget | null {
  const onlinePanel = document.getElementById('jdb-online-availability-panel');
  if (onlinePanel?.parentElement) {
    return { parent: onlinePanel.parentElement, before: onlinePanel.nextSibling };
  }

  const moviePanel = document.querySelector('.movie-panel-info');
  const directReviewButtons = moviePanel
    ? Array.from(moviePanel.children).find(child => child.classList.contains('review-buttons'))
    : null;
  if (directReviewButtons?.parentElement) {
    return { parent: directReviewButtons.parentElement, before: directReviewButtons.nextSibling };
  }

  const reviewButtons = document.querySelector('.review-buttons');
  if (reviewButtons?.parentElement) {
    return { parent: reviewButtons.parentElement, before: reviewButtons.nextSibling };
  }

  const firstBlock = moviePanel?.querySelector('.panel-block.first-block')
    || moviePanel?.querySelector('.panel-block');

  if (firstBlock?.parentElement) {
    return { parent: firstBlock.parentElement, before: firstBlock.nextSibling };
  }

  return null;
}

export function renderDetailSearchLinks(
  videoId: string,
  searchEngines: unknown,
  options: RenderDetailSearchLinksOptions = {},
): HTMLElement | null {
  document.getElementById('jdb-external-search-panel')?.remove();
  document.getElementById('jdb-subtitle-search-panel')?.remove();

  const allLinks = buildDetailSearchLinks(videoId, searchEngines);
  const externalLinks = allLinks.filter(link => link.category !== 'subtitle');
  const subtitleLinks = allLinks.filter(link => link.category === 'subtitle');
  const showSubtitleSearch = options.showSubtitleSearch !== false;

  if (externalLinks.length === 0 && (!showSubtitleSearch || subtitleLinks.length === 0)) return null;

  const target = findDetailSearchInsertionTarget();
  if (!target) return null;

  const firstPanel = externalLinks.length > 0
    ? createDetailSearchPanel('jdb-external-search-panel', '外部搜索:', externalLinks, videoId)
    : null;
  const subtitlePanel = showSubtitleSearch && subtitleLinks.length > 0
    ? createDetailSearchPanel('jdb-subtitle-search-panel', '字幕搜索:', subtitleLinks, videoId)
    : null;

  let before = target.before;
  if (firstPanel) {
    target.parent.insertBefore(firstPanel, before);
    before = firstPanel.nextSibling;
  }
  if (subtitlePanel) {
    target.parent.insertBefore(subtitlePanel, before);
  }

  injectDetailSearchStyles();
  return firstPanel || subtitlePanel;
}

function createDetailSearchPanel(id: string, labelText: string, links: DetailSearchLink[], videoId: string): HTMLElement {
  const panel = document.createElement('div');
  panel.id = id;
  panel.className = 'panel-block jdb-external-search-panel';

  const label = document.createElement('strong');
  label.textContent = labelText;
  panel.appendChild(label);

  const value = document.createElement('span');
  value.className = 'value jdb-external-search-links';
  value.style.marginLeft = '0.5rem';

  links.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'tag is-info is-light is-small jdb-external-search-link';
    if (isXunleiSubtitleLink(item)) {
      link.classList.add('jdb-xunlei-subtitle-trigger');
      link.addEventListener('click', (event) => {
        event.preventDefault();
        openXunleiSubtitleModal(videoId, item.url);
      });
    }

    const icon = document.createElement('img');
    icon.className = 'jdb-external-search-icon';
    icon.src = item.icon;
    icon.alt = '';
    icon.onerror = () => {
      icon.src = chrome.runtime.getURL('assets/alternate-search.png');
    };

    const text = document.createElement('span');
    text.textContent = item.name;

    link.appendChild(icon);
    link.appendChild(text);
    value.appendChild(link);
  });

  panel.appendChild(value);
  return panel;
}

interface XunleiSubtitleItem {
  name: string;
  ext?: string;
  url?: string;
  language?: string;
  rate?: number | string;
}

interface XunleiSubtitleResponse {
  data?: unknown;
  subtitles?: unknown;
}

function isXunleiSubtitleLink(item: DetailSearchLink): boolean {
  return /api-shoulei-ssl\.xunlei\.com\/oracle\/subtitle/i.test(item.url)
    || /迅雷/.test(item.name);
}

function openXunleiSubtitleModal(videoId: string, apiUrl: string): void {
  document.querySelector('.jdb-xunlei-subtitle-modal')?.remove();
  injectDetailSearchStyles();

  const modal = document.createElement('div');
  modal.className = 'jdb-xunlei-subtitle-modal';
  modal.innerHTML = `
    <div class="jdb-xunlei-subtitle-backdrop" data-jdb-xunlei-close></div>
    <div class="jdb-xunlei-subtitle-dialog" role="dialog" aria-modal="true" aria-labelledby="jdb-xunlei-subtitle-title">
      <div class="jdb-xunlei-subtitle-header">
        <div>
          <h3 id="jdb-xunlei-subtitle-title">迅雷字幕</h3>
          <p>${escapeHtml(videoId)}</p>
        </div>
        <button type="button" class="jdb-xunlei-subtitle-close" data-jdb-xunlei-close aria-label="关闭">×</button>
      </div>
      <div class="jdb-xunlei-subtitle-body">
        <div class="jdb-xunlei-subtitle-state">加载中...</div>
      </div>
    </div>
  `;

  modal.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('[data-jdb-xunlei-close]')) {
      modal.remove();
    }
  });
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') modal.remove();
  });

  document.body.appendChild(modal);
  modal.querySelector<HTMLElement>('.jdb-xunlei-subtitle-close')?.focus();
  void loadXunleiSubtitleResults(modal, apiUrl);
}

async function loadXunleiSubtitleResults(modal: HTMLElement, apiUrl: string): Promise<void> {
  const body = modal.querySelector<HTMLElement>('.jdb-xunlei-subtitle-body');
  if (!body) return;

  try {
    const response = await defaultHttpClient.getJson<XunleiSubtitleResponse>(apiUrl, {
      timeout: 10000,
      retries: 0,
      responseType: 'json',
    });
    const items = normalizeXunleiSubtitleItems(response);
    if (items.length === 0) {
      body.innerHTML = '<div class="jdb-xunlei-subtitle-state">暂无字幕</div>';
      return;
    }

    body.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'jdb-xunlei-subtitle-list';

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'jdb-xunlei-subtitle-row';

      const title = document.createElement('div');
      title.className = 'jdb-xunlei-subtitle-name';
      title.textContent = item.name || '未命名字幕';

      const meta = document.createElement('div');
      meta.className = 'jdb-xunlei-subtitle-meta';
      meta.textContent = [
        item.ext ? item.ext.toUpperCase() : '',
        item.language || '',
        item.rate ? `匹配 ${item.rate}` : '',
      ].filter(Boolean).join(' · ');

      const actions = document.createElement('div');
      actions.className = 'jdb-xunlei-subtitle-actions';
      if (item.url) {
        const download = document.createElement('a');
        download.href = item.url;
        download.target = '_blank';
        download.rel = 'noopener noreferrer';
        download.className = 'jdb-xunlei-subtitle-download';
        download.textContent = '下载';
        actions.appendChild(download);
      }

      row.appendChild(title);
      row.appendChild(meta);
      row.appendChild(actions);
      list.appendChild(row);
    });

    body.appendChild(list);
  } catch (error) {
    body.innerHTML = `<div class="jdb-xunlei-subtitle-state is-error">加载失败：${escapeHtml(error instanceof Error ? error.message : String(error))}</div>`;
  }
}

function normalizeXunleiSubtitleItems(response: XunleiSubtitleResponse): XunleiSubtitleItem[] {
  const raw = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.subtitles)
      ? response.subtitles
      : [];

  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      name: String(item.name || item.sname || item.title || '').trim(),
      ext: String(item.ext || item.type || '').trim(),
      url: String(item.url || item.surl || item.download_url || '').trim(),
      language: String(item.language || item.lang || '').trim(),
      rate: item.rate as number | string | undefined,
    }))
    .filter(item => item.name || item.url);
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectDetailSearchStyles(): void {
  if (document.getElementById('jdb-external-search-styles')) return;

  const style = document.createElement('style');
  style.id = 'jdb-external-search-styles';
  style.textContent = `
    .jdb-external-search-panel {
      align-items: center;
      gap: 0;
    }

    .jdb-external-search-links {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      min-width: 0;
    }

    .jdb-external-search-link {
      display: inline-flex !important;
      align-items: center;
      gap: 0.25rem;
      text-decoration: none !important;
      margin: 0 !important;
      max-width: 9rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .jdb-external-search-icon {
      width: 0.875rem;
      height: 0.875rem;
      object-fit: contain;
      flex: 0 0 auto;
    }

    .jdb-xunlei-subtitle-modal {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      --jdb-xunlei-bg: #ffffff;
      --jdb-xunlei-panel: #f8fafc;
      --jdb-xunlei-border: rgba(15, 23, 42, 0.12);
      --jdb-xunlei-text: #1f2937;
      --jdb-xunlei-muted: #64748b;
      --jdb-xunlei-action-bg: #e1f5fe;
      --jdb-xunlei-action-text: #0277bd;
    }

    html[data-theme="dark"] .jdb-xunlei-subtitle-modal {
      --jdb-xunlei-bg: #1f2937;
      --jdb-xunlei-panel: #111827;
      --jdb-xunlei-border: rgba(148, 163, 184, 0.22);
      --jdb-xunlei-text: #e5e7eb;
      --jdb-xunlei-muted: #9ca3af;
      --jdb-xunlei-action-bg: rgba(14, 165, 233, 0.18);
      --jdb-xunlei-action-text: #bae6fd;
    }

    .jdb-xunlei-subtitle-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.42);
      backdrop-filter: blur(6px);
    }

    .jdb-xunlei-subtitle-dialog {
      position: relative;
      width: min(760px, 100%);
      max-height: min(72vh, 620px);
      display: flex;
      flex-direction: column;
      border: 1px solid var(--jdb-xunlei-border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--jdb-xunlei-bg);
      color: var(--jdb-xunlei-text);
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
    }

    .jdb-xunlei-subtitle-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--jdb-xunlei-border);
      background: var(--jdb-xunlei-panel);
    }

    .jdb-xunlei-subtitle-header h3 {
      margin: 0 0 4px;
      font-size: 16px;
      line-height: 1.3;
    }

    .jdb-xunlei-subtitle-header p {
      margin: 0;
      color: var(--jdb-xunlei-muted);
      font-size: 12px;
    }

    .jdb-xunlei-subtitle-close {
      width: 30px;
      height: 30px;
      border: 1px solid var(--jdb-xunlei-border);
      border-radius: 6px;
      background: var(--jdb-xunlei-bg);
      color: var(--jdb-xunlei-muted);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }

    .jdb-xunlei-subtitle-body {
      overflow: auto;
      padding: 12px;
      background: var(--jdb-xunlei-bg);
    }

    .jdb-xunlei-subtitle-state {
      padding: 22px 12px;
      text-align: center;
      color: var(--jdb-xunlei-muted);
    }

    .jdb-xunlei-subtitle-state.is-error {
      color: #dc2626;
    }

    .jdb-xunlei-subtitle-list {
      display: grid;
      gap: 8px;
    }

    .jdb-xunlei-subtitle-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--jdb-xunlei-border);
      border-radius: 7px;
      background: var(--jdb-xunlei-panel);
    }

    .jdb-xunlei-subtitle-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
    }

    .jdb-xunlei-subtitle-meta {
      color: var(--jdb-xunlei-muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .jdb-xunlei-subtitle-actions {
      display: inline-flex;
      justify-content: flex-end;
    }

    .jdb-xunlei-subtitle-download {
      display: inline-flex;
      align-items: center;
      height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      background: var(--jdb-xunlei-action-bg);
      color: var(--jdb-xunlei-action-text) !important;
      text-decoration: none !important;
      font-size: 12px;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .jdb-xunlei-subtitle-modal {
        align-items: flex-end;
        padding: 10px;
      }

      .jdb-xunlei-subtitle-row {
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .jdb-xunlei-subtitle-meta {
        grid-column: 1 / -1;
        order: 3;
      }
    }
  `;
  document.head.appendChild(style);
}

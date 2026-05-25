import {
  buildSearchEngineUrl,
  dedupeSearchEngines,
  resolveSearchEngineIcon,
  type SearchEngineTemplate,
} from '../utils/searchEngines';

export interface DetailSearchLink {
  name: string;
  url: string;
  icon: string;
}

export interface DetailSearchInsertionTarget {
  parent: Element;
  before: ChildNode | null;
}

export function buildDetailSearchLinks(videoId: string, searchEngines: unknown): DetailSearchLink[] {
  if (!videoId) return [];

  const { engines } = dedupeSearchEngines(searchEngines);
  return engines
    .filter((engine: SearchEngineTemplate) => String(engine.name || '').trim() && String(engine.urlTemplate || '').trim())
    .map((engine: SearchEngineTemplate) => ({
      name: String(engine.name).trim(),
      url: buildSearchEngineUrl(String(engine.urlTemplate), videoId),
      icon: resolveSearchEngineIcon(engine),
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

export function renderDetailSearchLinks(videoId: string, searchEngines: unknown): HTMLElement | null {
  const existing = document.getElementById('jdb-external-search-panel');
  if (existing) existing.remove();

  const links = buildDetailSearchLinks(videoId, searchEngines);
  if (links.length === 0) return null;

  const target = findDetailSearchInsertionTarget();
  if (!target) return null;

  const panel = document.createElement('div');
  panel.id = 'jdb-external-search-panel';
  panel.className = 'panel-block jdb-external-search-panel';

  const label = document.createElement('strong');
  label.textContent = '外部搜索:';
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
  target.parent.insertBefore(panel, target.before);
  injectDetailSearchStyles();
  return panel;
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
  `;
  document.head.appendChild(style);
}

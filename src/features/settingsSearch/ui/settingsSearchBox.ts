import type { SettingsSearchItem } from '../domain/types';
import { findSettingsResults } from '../application/findSettingsResults';
import { resolveSettingsTarget } from '../application/resolveSettingsTarget';
import { storeSettingsSearchTarget } from './settingsSearchHighlight';
import type { SettingsSearchResult } from '../domain/types';

export interface MountSettingsSearchOptions {
  container: HTMLElement;
  index: SettingsSearchItem[];
}

export function mountSettingsSearch(options: MountSettingsSearchOptions): void {
  const { container, index } = options;
  if (container.querySelector('.jdb-settings-search')) return;

  const root = document.createElement('div');
  root.className = 'jdb-settings-search';
  root.innerHTML = `
    <div class="jdb-settings-search-input-wrap">
      <i class="fas fa-search" aria-hidden="true"></i>
      <input type="search" class="jdb-settings-search-input" placeholder="搜索设置，例如 字幕、115、WebDAV、磁力" autocomplete="off">
      <button type="button" class="jdb-settings-search-clear" aria-label="清空搜索" hidden>×</button>
    </div>
    <div class="jdb-settings-search-results" role="listbox" hidden style="display: none;"></div>
  `;

  const header = container.querySelector('.settings-index-header');
  if (header?.parentElement) {
    header.insertAdjacentElement('afterend', root);
  } else {
    container.prepend(root);
  }

  const input = root.querySelector<HTMLInputElement>('.jdb-settings-search-input')!;
  const clearBtn = root.querySelector<HTMLButtonElement>('.jdb-settings-search-clear')!;
  const resultsBox = root.querySelector<HTMLElement>('.jdb-settings-search-results')!;
  let currentResults: SettingsSearchResult[] = [];
  let selectedIndex = -1;

  const setResultsVisible = (visible: boolean) => {
    resultsBox.hidden = !visible;
    resultsBox.style.display = visible ? '' : 'none';
  };

  const syncClearButton = () => {
    clearBtn.hidden = input.value.length === 0;
  };

  const jumpToResult = (result: SettingsSearchResult | undefined) => {
    if (!result) return;
    const target = resolveSettingsTarget(result);
    storeSettingsSearchTarget(target);
    window.location.hash = target.hash;
  };

  const updateSelection = () => {
    resultsBox.querySelectorAll<HTMLButtonElement>('.jdb-settings-search-result').forEach((button, idx) => {
      const selected = idx === selectedIndex;
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.classList.toggle('is-selected', selected);
    });
  };

  const render = () => {
    syncClearButton();
    const results = findSettingsResults(index, input.value);
    const hasQuery = input.value.trim().length > 0;
    currentResults = hasQuery ? results : [];
    selectedIndex = -1;
    setResultsVisible(hasQuery);
    if (hasQuery && results.length === 0) {
      resultsBox.innerHTML = '<div class="jdb-settings-search-empty">没有找到相关设置</div>';
      return;
    }

    resultsBox.innerHTML = results.map((result, idx) => `
      <button type="button" class="jdb-settings-search-result" data-index="${idx}" role="option" aria-selected="false">
        <span class="jdb-settings-search-result-title">${escapeHtml(result.title)}</span>
        <span class="jdb-settings-search-result-meta">${escapeHtml(result.pageTitle)}${result.sectionTitle ? ` · ${escapeHtml(result.sectionTitle)}` : ''}</span>
      </button>
    `).join('');

    resultsBox.querySelectorAll<HTMLButtonElement>('.jdb-settings-search-result').forEach(button => {
      button.addEventListener('click', () => {
        jumpToResult(results[Number(button.dataset.index || '0')]);
      });
      button.addEventListener('mouseenter', () => {
        selectedIndex = Number(button.dataset.index || '-1');
        updateSelection();
      });
    });
    updateSelection();
  };

  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && currentResults.length > 0) {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentResults.length;
      updateSelection();
      return;
    }
    if (event.key === 'ArrowUp' && currentResults.length > 0) {
      event.preventDefault();
      selectedIndex = selectedIndex <= 0 ? currentResults.length - 1 : selectedIndex - 1;
      updateSelection();
      return;
    }
    if (event.key === 'Enter') {
      jumpToResult(currentResults[selectedIndex] || findSettingsResults(index, input.value, 1)[0]);
    }
    if (event.key === 'Escape') {
      input.value = '';
      render();
    }
  });
  clearBtn.addEventListener('click', () => {
    input.value = '';
    currentResults = [];
    selectedIndex = -1;
    render();
    input.focus();
  });
  syncClearButton();
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

import { fetchXunleiSubtitleResponse } from '../adapters/xunleiSubtitleApi';
import { formatXunleiSubtitleDuration, normalizeXunleiSubtitleItems } from '../domain/normalizeXunleiSubtitle';
import type { XunleiSubtitleItem } from '../domain/types';

export function isXunleiSubtitleLink(item: { name: string; url: string }): boolean {
  return /api-shoulei-ssl\.xunlei\.com\/oracle\/subtitle/i.test(item.url)
    || /迅雷/.test(item.name);
}

export function openXunleiSubtitleModal(videoId: string, apiUrl: string): void {
  document.querySelector('.jdb-xunlei-subtitle-modal')?.remove();
  injectXunleiSubtitleStyles();

  const modal = document.createElement('div');
  modal.className = 'jdb-xunlei-subtitle-modal';
  modal.innerHTML = `
    <div class="jdb-xunlei-subtitle-backdrop" data-jdb-xunlei-close></div>
    <div class="jdb-xunlei-subtitle-dialog" role="dialog" aria-modal="true" aria-labelledby="jdb-xunlei-subtitle-title">
      <div class="jdb-xunlei-subtitle-header">
        <div>
          <h3 id="jdb-xunlei-subtitle-title" data-video-id="${escapeHtml(videoId)}">迅雷字幕</h3>
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
    const response = await fetchXunleiSubtitleResponse(apiUrl);
    const items = normalizeXunleiSubtitleItems(response);
    const title = modal.querySelector<HTMLElement>('#jdb-xunlei-subtitle-title');
    if (title) {
      title.textContent = `迅雷字幕 · ${title.dataset.videoId || '影片'} · ${items.length} 条`;
    }

    if (items.length === 0) {
      body.innerHTML = '<div class="jdb-xunlei-subtitle-state">暂无字幕</div>';
      return;
    }

    body.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'jdb-xunlei-subtitle-list';

    items.forEach((item) => {
      list.appendChild(createXunleiSubtitleRow(item));
    });

    body.appendChild(list);
  } catch (error) {
    body.innerHTML = `<div class="jdb-xunlei-subtitle-state is-error">加载失败：${escapeHtml(error instanceof Error ? error.message : String(error))}</div>`;
  }
}

function createXunleiSubtitleRow(item: XunleiSubtitleItem): HTMLElement {
  const row = document.createElement('div');
  row.className = 'jdb-xunlei-subtitle-row';

  const title = document.createElement('div');
  title.className = 'jdb-xunlei-subtitle-name';
  title.textContent = item.name || '未命名字幕';

  row.appendChild(title);
  row.appendChild(createXunleiSubtitleMeta(item));
  row.appendChild(createXunleiSubtitleActions(item));

  return row;
}

function createXunleiSubtitleActions(item: XunleiSubtitleItem): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'jdb-xunlei-subtitle-actions';
  if (!item.url) return actions;

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'jdb-xunlei-subtitle-copy';
  copy.textContent = '复制链接';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(item.url || '');
      copy.textContent = '已复制';
      window.setTimeout(() => {
        copy.textContent = '复制链接';
      }, 1200);
    } catch {
      copy.textContent = '复制失败';
      window.setTimeout(() => {
        copy.textContent = '复制链接';
      }, 1200);
    }
  });

  const download = document.createElement('a');
  download.href = item.url;
  download.target = '_blank';
  download.rel = 'noopener noreferrer';
  download.className = 'jdb-xunlei-subtitle-download';
  download.textContent = '下载';
  actions.appendChild(copy);
  actions.appendChild(download);

  return actions;
}

function createXunleiSubtitleMeta(item: XunleiSubtitleItem): HTMLElement {
  const meta = document.createElement('div');
  meta.className = 'jdb-xunlei-subtitle-meta';

  [
    item.ext ? item.ext.toUpperCase() : '',
    item.language || '未知语言',
    item.sourceLabel || '',
    formatXunleiSubtitleDuration(item.duration),
    item.hash ? `Hash ${item.hash}` : '',
    item.rate ? `匹配 ${item.rate}` : '',
  ].filter(Boolean).forEach((text) => {
    const tag = document.createElement('span');
    tag.className = 'jdb-xunlei-subtitle-tag';
    tag.textContent = text;
    meta.appendChild(tag);
  });

  return meta;
}

export function injectXunleiSubtitleStyles(): void {
  if (document.getElementById('jdb-xunlei-subtitle-styles')) return;

  const style = document.createElement('style');
  style.id = 'jdb-xunlei-subtitle-styles';
  style.textContent = `
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
      gap: 8px;
      padding: 8px 10px;
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
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 4px;
      color: var(--jdb-xunlei-muted);
      font-size: 12px;
      min-width: 0;
    }

    .jdb-xunlei-subtitle-tag {
      display: inline-flex;
      align-items: center;
      max-width: 9rem;
      min-height: 22px;
      padding: 0 7px;
      border: 1px solid var(--jdb-xunlei-border);
      border-radius: 999px;
      background: var(--jdb-xunlei-bg);
      color: var(--jdb-xunlei-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .jdb-xunlei-subtitle-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .jdb-xunlei-subtitle-download,
    .jdb-xunlei-subtitle-copy {
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

    .jdb-xunlei-subtitle-copy {
      border: 1px solid var(--jdb-xunlei-border);
      cursor: pointer;
      background: var(--jdb-xunlei-bg);
      color: var(--jdb-xunlei-text) !important;
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
        justify-content: flex-start;
      }
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

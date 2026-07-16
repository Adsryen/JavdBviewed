import type { NewWorkRecord } from '../../types';

export interface BuildNewWorkItemHtmlOptions {
  selected?: boolean;
}

export interface BuildNewWorksPaginationHtmlInput {
  total: number;
  currentPage: number;
  pageSize: number;
}

export function buildNewWorksLoadingHtml(): string {
  return `
                <div class="new-works-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <div>加载中...</div>
                </div>
            `;
}

export function buildNewWorksEmptyHtml(): string {
  return `
                    <div class="new-works-empty">
                        <i class="fas fa-inbox"></i>
                        <h3>暂无新作品</h3>
                        <p>添加演员订阅后，系统会自动检查新作品</p>
                    </div>
                `;
}

export function buildNewWorksErrorHtml(): string {
  return '<div class="error-message">加载新作品列表失败</div>';
}

export function buildNewWorkItemHtml(work: NewWorkRecord, options: BuildNewWorkItemHtmlOptions = {}): string {
  const readClass = work.isRead ? 'read' : 'unread';
  const selectedClass = options.selected ? 'selected' : '';
  const tagsHtml = buildNewWorkTagsHtml(work.tags || []);

  return `
            <li class="new-work-item ${readClass} ${selectedClass}" data-work-id="${work.id}" data-javdb-url="${work.javdbUrl}">
                <div class="new-work-checkbox">
                    <input type="checkbox" ${options.selected ? 'checked' : ''}>
                </div>
                ${buildNewWorkCoverHtml(work)}
                <div class="new-work-info">
                    <h3 class="new-work-title">${work.title}</h3>
                    <div class="new-work-meta">
                        <span class="new-work-actor">
                            <i class="fas fa-user"></i>
                            ${work.actorName}
                        </span>
                        <span class="new-work-date">
                            <i class="fas fa-calendar"></i>
                            发现于 ${formatNewWorkDate(work.discoveredAt)}
                        </span>
                        ${work.releaseDate ? `
                            <span class="new-work-release">
                                <i class="fas fa-film"></i>
                                发行于 ${work.releaseDate}
                            </span>
                        ` : ''}
                    </div>
                    ${tagsHtml}
                </div>
                <div class="new-work-actions">
                    ${!work.isRead ? '<button class="new-work-action-btn mark-read-btn" data-action="mark-read"><i class="fas fa-check-circle"></i> 标为已读</button>' : ''}
                    <button class="new-work-action-btn visit-btn" data-action="visit"><i class="fas fa-play"></i> 去看看</button>
                    <button class="new-work-action-btn delete-btn" data-action="delete"><i class="fas fa-times"></i> 移除</button>
                </div>
            </li>
        `;
}

export function buildNewWorksPaginationHtml(input: BuildNewWorksPaginationHtmlInput): string {
  const pageCount = Math.ceil(input.total / input.pageSize);
  if (pageCount <= 1) {
    return '';
  }

  let paginationHtml = '';

  if (input.currentPage > 1) {
    paginationHtml += `<button class="page-button" data-page="${input.currentPage - 1}">上一页</button>`;
  } else {
    paginationHtml += '<button class="page-button" disabled>上一页</button>';
  }

  const startPage = Math.max(1, input.currentPage - 2);
  const endPage = Math.min(pageCount, input.currentPage + 2);

  for (let page = startPage; page <= endPage; page++) {
    const activeClass = page === input.currentPage ? 'active' : '';
    paginationHtml += `<button class="page-button ${activeClass}" data-page="${page}">${page}</button>`;
  }

  if (input.currentPage < pageCount) {
    paginationHtml += `<button class="page-button" data-page="${input.currentPage + 1}">下一页</button>`;
  } else {
    paginationHtml += '<button class="page-button" disabled>下一页</button>';
  }

  return paginationHtml;
}

function buildNewWorkCoverHtml(work: NewWorkRecord): string {
  if (!work.coverImage) {
    return '<div class="new-work-cover-wrap"><div class="new-work-cover"></div></div>';
  }

  return `
                <div class="new-work-cover-wrap">
                    <img src="${work.coverImage}" alt="${work.title}" class="new-work-cover">
                    <img src="${work.coverImage}" alt="${work.title}" class="new-work-cover-preview">
                </div>
                `;
}

function buildNewWorkTagsHtml(tags: string[]): string {
  if (tags.length === 0) {
    return '';
  }

  return `<div class="new-work-tags">
                ${tags.slice(0, 3).map((tag: string) => `<span class="new-work-tag">${tag}</span>`).join('')}
                ${tags.length > 3 ? `<span class="new-work-tag">+${tags.length - 3}</span>` : ''}
               </div>`;
}

function formatNewWorkDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

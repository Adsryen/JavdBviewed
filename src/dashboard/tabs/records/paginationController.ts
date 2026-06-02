import { buildRecordsPaginationModel, type RecordsPaginationItem } from './paginationModel';

export interface RenderRecordsPaginationOptions {
  container: HTMLElement;
  totalCount: number;
  recordsPerPage: number;
  currentPage: number;
  onPageChange: (page: number, pageCount: number) => void;
}

function createPaginationButton(item: RecordsPaginationItem, pageCount: number, onPageChange: (page: number, pageCount: number) => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerHTML = item.html;
  button.disabled = item.disabled;
  if ('title' in item && item.title) button.title = item.title;

  const classNames = ['page-button'];
  if (item.kind === 'page' && item.active) classNames.push('active');
  if (item.kind === 'ellipsis') classNames.push('ellipsis');
  button.className = classNames.join(' ');

  if (item.kind !== 'ellipsis') {
    button.addEventListener('click', () => onPageChange(item.page, pageCount));
  }

  return button;
}

export function renderRecordsPagination(options: RenderRecordsPaginationOptions): void {
  options.container.innerHTML = '';

  const pagination = buildRecordsPaginationModel({
    totalCount: options.totalCount,
    recordsPerPage: options.recordsPerPage,
    currentPage: options.currentPage,
  });
  if (!pagination.visible) return;

  pagination.items.forEach((item) => {
    options.container.appendChild(createPaginationButton(item, pagination.pageCount, options.onPageChange));
  });
}

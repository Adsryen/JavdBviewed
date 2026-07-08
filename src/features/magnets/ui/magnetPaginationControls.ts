/**
 * @file magnetPaginationControls.ts
 * @description Magnet pagination controls DOM helper
 * @module features/magnets
 */
import type { MagnetPaginationState } from '../application/pagination';

export function renderMagnetPaginationControls(container: Element, pagination: MagnetPaginationState, total: number, onPageChange: (page: number) => void, className = 'jdb-magnet-pagination'): void {
  if (!pagination.enabled) return;

  const controls = document.createElement('div');
  controls.className = className;

  const prev = document.createElement('button');
  prev.className = 'button is-small';
  prev.dataset.jdbMagnetPrev = '1';
  prev.textContent = '上一页';
  prev.disabled = pagination.currentPage <= 1;
  prev.addEventListener('click', () => onPageChange(pagination.currentPage - 1));

  const pageInfo = document.createElement('span');
  pageInfo.className = 'jdb-magnet-page-info';
  pageInfo.textContent = `${pagination.currentPage}/${pagination.totalPages} · 共 ${total} 条`;

  const next = document.createElement('button');
  next.className = 'button is-small';
  next.dataset.jdbMagnetNext = '1';
  next.textContent = '下一页';
  next.disabled = pagination.currentPage >= pagination.totalPages;
  next.addEventListener('click', () => onPageChange(pagination.currentPage + 1));

  controls.appendChild(prev);
  controls.appendChild(pageInfo);
  controls.appendChild(next);
  container.appendChild(controls);
}

export type ActorPaginationItem = number | 'ellipsis';

export function getActorPaginationItems(currentPage: number, totalPages: number): ActorPaginationItem[] {
  if (totalPages <= 0) {
    return [];
  }

  const normalizedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const pagesToShow = new Set<number>([1, totalPages]);

  for (let i = -2; i <= 2; i++) {
    const page = normalizedCurrentPage + i;
    if (page > 1 && page < totalPages) {
      pagesToShow.add(page);
    }
  }
  if (normalizedCurrentPage > 1 && normalizedCurrentPage < totalPages) {
    pagesToShow.add(normalizedCurrentPage);
  }

  const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);
  const items: ActorPaginationItem[] = [];
  let lastPage: number | null = null;
  for (const page of sortedPages) {
    if (lastPage !== null && page - lastPage > 1) {
      items.push('ellipsis');
    }
    items.push(page);
    lastPage = page;
  }
  return items;
}

export function buildActorPaginationHtml(currentPage: number, totalPages: number, total: number): string {
  if (totalPages <= 0) {
    return '';
  }

  return `
            <div class="pagination-info">
                共 ${total} 个演员，第 ${currentPage}/${totalPages} 页
            </div>
            <div class="pagination">
                ${buildActorPaginationButtonsHtml(currentPage, totalPages)}
            </div>
        `;
}

function buildActorPaginationButtonsHtml(currentPage: number, totalPages: number): string {
  const buttons: string[] = [];

  buttons.push(`<button class="page-button" data-page="1" ${currentPage === 1 ? 'disabled' : ''} title="首页">
            <i class="fas fa-angles-left"></i>
        </button>`);
  buttons.push(`<button class="page-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} title="上一页">
            <i class="fas fa-angle-left"></i>
        </button>`);

  for (const item of getActorPaginationItems(currentPage, totalPages)) {
    if (item === 'ellipsis') {
      buttons.push('<button class="page-button ellipsis" disabled>...</button>');
      continue;
    }
    const isActive = item === currentPage ? ' active' : '';
    buttons.push(`<button class="page-button${isActive}" data-page="${item}">${item}</button>`);
  }

  buttons.push(`<button class="page-button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} title="下一页">
            <i class="fas fa-angle-right"></i>
        </button>`);
  buttons.push(`<button class="page-button" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''} title="末页">
            <i class="fas fa-angles-right"></i>
        </button>`);

  return buttons.join('');
}

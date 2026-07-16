export type EnhancementTaskDetailsAuxHost = any;

export function updateTaskDetailsPagination(host: EnhancementTaskDetailsAuxHost, total: number, totalPages: number): void {
  if (host.taskDetailsCount) host.taskDetailsCount.textContent = String(total);
  if (host.taskDetailsPagination) host.taskDetailsPagination.textContent = `第 ${host.taskDetailsCurrentPage} / ${totalPages} 页`;
  if (host.taskDetailsPrevPage) host.taskDetailsPrevPage.disabled = host.taskDetailsCurrentPage <= 1;
  if (host.taskDetailsNextPage) host.taskDetailsNextPage.disabled = host.taskDetailsCurrentPage >= totalPages;
}

export function taskDetailsPrevPageHandler(host: EnhancementTaskDetailsAuxHost): void {
  if (host.taskDetailsCurrentPage > 1) {
    host.taskDetailsCurrentPage--;
    host.renderTaskDetailsTable();
    const total = host.getRenderedTaskDetailsCount();
    const totalPages = Math.max(1, Math.ceil(total / host.taskDetailsPageSize));
    host.updateTaskDetailsPagination(total, totalPages);
  }
}

export function taskDetailsNextPageHandler(host: EnhancementTaskDetailsAuxHost): void {
  const total = host.getRenderedTaskDetailsCount();
  const totalPages = Math.max(1, Math.ceil(total / host.taskDetailsPageSize));
  if (host.taskDetailsCurrentPage < totalPages) {
    host.taskDetailsCurrentPage++;
  }
  host.renderTaskDetailsTable();
  host.updateTaskDetailsPagination(total, totalPages);
}

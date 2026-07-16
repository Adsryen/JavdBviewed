import type { TaskDetailsController } from './taskDetailsController';
import { getTaskLabelShort } from '../taskLabelCatalog';

export function taskDetailsSortHandler(controller: TaskDetailsController, field: string): void {
  if (controller.host.taskDetailsSortField === field) {
    controller.host.taskDetailsSortOrder = controller.host.taskDetailsSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    controller.host.taskDetailsSortField = field;
    controller.host.taskDetailsSortOrder = 'desc';
  }

  controller.host.renderTaskDetailsTable();

  if (controller.host.taskDetailsTable) {
    const headers = controller.host.taskDetailsTable.querySelectorAll('thead th[data-sort]');
    headers.forEach((header: Element) => {
      const icon = header.querySelector('i');
      if (!icon) return;
      const headerField = header.getAttribute('data-sort');
      icon.className = headerField === field
        ? (controller.host.taskDetailsSortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down')
        : 'fas fa-sort';
    });
  }
}

export function taskDetailsSearchHandler(controller: TaskDetailsController): void {
  if (!controller.host.taskDetailsSearch) return;

  const query = controller.host.taskDetailsSearch.value.trim().toLowerCase();
  controller.host.taskDetailsSearchQuery = query;

  if (!query) {
    controller.host.taskDetailsFilteredData = [];
    controller.host.taskDetailsPageSummaryFilteredData = [];
  } else {
    controller.host.taskDetailsFilteredData = controller.host.taskDetailsData.filter((task: any) => {
      const label = (task.label || '').toLowerCase();
      const pageUrl = (task.pageUrl || '').toLowerCase();
      const subtask = (task.subtaskLabel || '').toLowerCase();
      const detail = (task.detail || '').toLowerCase();
      const mainId = (task.mainId || '').toLowerCase();
      const pageInstanceId = (task.pageInstanceId || '').toLowerCase();

      const displayName = (getTaskLabelShort(task.label) || task.label || '').toLowerCase();

      return label.includes(query)
        || pageUrl.includes(query)
        || subtask.includes(query)
        || detail.includes(query)
        || displayName.includes(query)
        || mainId.includes(query)
        || pageInstanceId.includes(query);
    });

    controller.host.taskDetailsPageSummaryFilteredData = controller.host.taskDetailsPageSummaryData.filter((item: any) => {
      const pageUrl = (item.pageUrl || '').toLowerCase();
      const mainId = (item.mainId || '').toLowerCase();
      const pageType = (item.pageType || '').toLowerCase();
      const pageInstanceId = (item.pageInstanceId || '').toLowerCase();
      const detail = (item.detail || '').toLowerCase();
      return pageUrl.includes(query)
        || mainId.includes(query)
        || pageType.includes(query)
        || pageInstanceId.includes(query)
        || detail.includes(query);
    });
  }

  controller.host.taskDetailsCurrentPage = 1;
  controller.host.renderTaskDetailsTable();
  const total = controller.host.getRenderedTaskDetailsCount();
  const totalPages = Math.max(1, Math.ceil(total / controller.host.taskDetailsPageSize));
  controller.host.updateTaskDetailsPagination(total, totalPages);
}

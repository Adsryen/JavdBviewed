import {
  renderRecordsPagination,
  type RenderRecordsPaginationOptions,
} from './paginationController';

export interface CreateRecordsPaginationRuntimeOptions {
  container: HTMLElement;
  isServerModeActive: () => boolean;
  getServerTotal: () => number;
  getFilteredCount: () => number;
  getRecordsPerPage: () => number;
  getCurrentPage: () => number;
  setCurrentPage: (page: number) => void;
  renderPage: () => void;
  renderPagination?: (options: RenderRecordsPaginationOptions) => void;
}

export interface RecordsPaginationRuntime {
  render: () => void;
}

export function createRecordsPaginationRuntime(
  options: CreateRecordsPaginationRuntimeOptions,
): RecordsPaginationRuntime {
  const renderPagination = options.renderPagination || renderRecordsPagination;

  const render = () => {
    const totalCount = options.isServerModeActive()
      ? options.getServerTotal()
      : options.getFilteredCount();

    renderPagination({
      container: options.container,
      totalCount,
      recordsPerPage: options.getRecordsPerPage(),
      currentPage: options.getCurrentPage(),
      onPageChange: (page, pageCount) => {
        if (page < 1 || page > pageCount) return;
        options.setCurrentPage(page);
        options.renderPage();
      },
    });
  };

  return { render };
}

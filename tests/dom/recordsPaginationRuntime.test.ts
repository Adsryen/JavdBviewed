import { describe, expect, it, vi } from 'vitest';
import { createRecordsPaginationRuntime } from '../../src/dashboard/tabs/records/paginationRuntime';
import type { RenderRecordsPaginationOptions } from '../../src/dashboard/tabs/records/paginationController';

describe('records pagination runtime', () => {
  it('renders with server total when server mode is active', () => {
    document.body.innerHTML = '<div id="pagination"></div>';
    const renderPagination = vi.fn();

    const runtime = createRecordsPaginationRuntime({
      container: document.getElementById('pagination') as HTMLElement,
      isServerModeActive: () => true,
      getServerTotal: () => 100,
      getFilteredCount: () => 25,
      getRecordsPerPage: () => 10,
      getCurrentPage: () => 3,
      setCurrentPage: vi.fn(),
      renderPage: vi.fn(),
      renderPagination,
    });

    runtime.render();

    expect(renderPagination).toHaveBeenCalledWith(expect.objectContaining({
      totalCount: 100,
      recordsPerPage: 10,
      currentPage: 3,
    }));
  });

  it('updates page and renders only when target page is inside bounds', () => {
    document.body.innerHTML = '<div id="pagination"></div>';
    const setCurrentPage = vi.fn();
    const renderPage = vi.fn();
    let capturedOnPageChange: RenderRecordsPaginationOptions['onPageChange'] | null = null;

    const runtime = createRecordsPaginationRuntime({
      container: document.getElementById('pagination') as HTMLElement,
      isServerModeActive: () => false,
      getServerTotal: () => 0,
      getFilteredCount: () => 25,
      getRecordsPerPage: () => 10,
      getCurrentPage: () => 1,
      setCurrentPage,
      renderPage,
      renderPagination: (options) => {
        capturedOnPageChange = options.onPageChange;
      },
    });

    runtime.render();
    capturedOnPageChange?.(2, 3);
    capturedOnPageChange?.(0, 3);
    capturedOnPageChange?.(4, 3);

    expect(setCurrentPage).toHaveBeenCalledTimes(1);
    expect(setCurrentPage).toHaveBeenCalledWith(2);
    expect(renderPage).toHaveBeenCalledTimes(1);
  });
});

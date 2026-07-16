import { describe, expect, it, vi } from 'vitest';
import { createRecordsStateRefreshController } from './stateRefreshController';

describe('records state refresh controller', () => {
  it('resets page before refreshing and rendering', () => {
    const events: string[] = [];
    const controller = createRecordsStateRefreshController({
      resetCurrentPage: () => events.push('reset'),
      updateFilteredRecords: () => events.push('update'),
      render: () => events.push('render'),
      updateBatchUI: () => events.push('batch'),
    });

    controller.resetAndRender();

    expect(events).toEqual(['reset', 'update', 'render']);
  });

  it('refreshes and renders without resetting the page', () => {
    const resetCurrentPage = vi.fn();
    const updateFilteredRecords = vi.fn();
    const render = vi.fn();
    const updateBatchUI = vi.fn();
    const controller = createRecordsStateRefreshController({
      resetCurrentPage,
      updateFilteredRecords,
      render,
      updateBatchUI,
    });

    controller.refreshAndRender();

    expect(resetCurrentPage).not.toHaveBeenCalled();
    expect(updateFilteredRecords).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(updateBatchUI).not.toHaveBeenCalled();
  });

  it('refreshes batch state and batch ui in order', () => {
    const events: string[] = [];
    const controller = createRecordsStateRefreshController({
      resetCurrentPage: () => events.push('reset'),
      updateFilteredRecords: () => events.push('update'),
      render: () => events.push('render'),
      updateBatchUI: () => events.push('batch'),
    });

    controller.refreshAndRenderBatch();

    expect(events).toEqual(['update', 'render', 'batch']);
  });
});

export interface CreateRecordsStateRefreshControllerOptions {
  resetCurrentPage: () => void;
  updateFilteredRecords: () => void;
  render: () => void;
  updateBatchUI: () => void;
}

export interface RecordsStateRefreshController {
  resetAndRender: () => void;
  refreshAndRender: () => void;
  refreshAndRenderBatch: () => void;
}

export function createRecordsStateRefreshController(
  options: CreateRecordsStateRefreshControllerOptions,
): RecordsStateRefreshController {
  const resetAndRender = () => {
    options.resetCurrentPage();
    options.updateFilteredRecords();
    options.render();
  };

  const refreshAndRender = () => {
    options.updateFilteredRecords();
    options.render();
  };

  const refreshAndRenderBatch = () => {
    options.updateFilteredRecords();
    options.render();
    options.updateBatchUI();
  };

  return {
    resetAndRender,
    refreshAndRender,
    refreshAndRenderBatch,
  };
}

import type { VideoRecord } from '../../../types';

export interface RecordsBatchSelectionElements {
  batchOperations: HTMLElement;
  selectAllCheckbox: HTMLInputElement;
  selectedCount: HTMLElement;
  batchActionsBtn?: HTMLButtonElement | null;
}

export interface CreateRecordsBatchSelectionControllerOptions extends RecordsBatchSelectionElements {
  selectedRecords: Set<string>;
  getCurrentRecords: () => VideoRecord[];
  onRender?: () => void;
}

export interface RecordsBatchSelectionController {
  clearAllSelection: () => void;
  handleSelectAll: () => void;
  handleRecordSelection: (recordId: string, isSelected: boolean) => void;
  updateBatchUI: () => void;
}

function setRecordRowSelected(recordId: string, isSelected: boolean): void {
  const row = document.querySelector(`[data-record-id="${recordId}"]`) as HTMLElement | null;
  if (!row) return;
  row.classList.toggle('selected', isSelected);
}

export function createRecordsBatchSelectionController(
  options: CreateRecordsBatchSelectionControllerOptions,
): RecordsBatchSelectionController {
  const updateBatchUI = () => {
    const count = options.selectedRecords.size;
    options.selectedCount.textContent = `已选择 ${count} 项`;
    options.batchOperations.style.display = count > 0 ? 'flex' : 'none';

    if (options.batchActionsBtn) {
      options.batchActionsBtn.disabled = count === 0;
    }

    const currentRecords = options.getCurrentRecords();
    const currentSelectedCount = currentRecords.filter(record => options.selectedRecords.has(record.id)).length;

    if (currentSelectedCount === 0) {
      options.selectAllCheckbox.checked = false;
      options.selectAllCheckbox.indeterminate = false;
      return;
    }

    if (currentSelectedCount === currentRecords.length) {
      options.selectAllCheckbox.checked = true;
      options.selectAllCheckbox.indeterminate = false;
      return;
    }

    options.selectAllCheckbox.checked = false;
    options.selectAllCheckbox.indeterminate = true;
  };

  const handleSelectAll = () => {
    const currentRecords = options.getCurrentRecords();
    if (options.selectAllCheckbox.checked) {
      currentRecords.forEach(record => options.selectedRecords.add(record.id));
    } else {
      currentRecords.forEach(record => options.selectedRecords.delete(record.id));
    }

    updateBatchUI();
    options.onRender?.();
  };

  const handleRecordSelection = (recordId: string, isSelected: boolean) => {
    if (isSelected) {
      options.selectedRecords.add(recordId);
    } else {
      options.selectedRecords.delete(recordId);
    }

    setRecordRowSelected(recordId, isSelected);
    updateBatchUI();
  };

  const clearAllSelection = () => {
    options.selectedRecords.clear();
    document.querySelectorAll('.video-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    updateBatchUI();
  };

  return {
    clearAllSelection,
    handleSelectAll,
    handleRecordSelection,
    updateBatchUI,
  };
}

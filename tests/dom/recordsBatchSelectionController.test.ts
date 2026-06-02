import { describe, expect, it, vi } from 'vitest';
import { createRecordsBatchSelectionController } from '../../src/dashboard/tabs/records/batchSelectionController';
import type { VideoRecord } from '../../src/types';

function createRecord(id: string): VideoRecord {
  return {
    id,
    title: id,
    status: 'viewed',
    createdAt: 1,
    updatedAt: 2,
  };
}

function setupDom() {
  document.body.innerHTML = `
    <div id="batchOperations"></div>
    <input id="selectAllCheckbox" type="checkbox" />
    <span id="selectedCount"></span>
    <button id="batchActionsBtn"></button>
    <ul>
      <li class="video-item" data-record-id="AAA-001"></li>
      <li class="video-item selected" data-record-id="AAA-002"></li>
    </ul>
  `;

  return {
    batchOperations: document.getElementById('batchOperations') as HTMLDivElement,
    selectAllCheckbox: document.getElementById('selectAllCheckbox') as HTMLInputElement,
    selectedCount: document.getElementById('selectedCount') as HTMLSpanElement,
    batchActionsBtn: document.getElementById('batchActionsBtn') as HTMLButtonElement,
  };
}

describe('records batch selection controller', () => {
  it('updates batch bar and select all state from selected records', () => {
    const elements = setupDom();
    const selectedRecords = new Set<string>(['AAA-001']);
    const controller = createRecordsBatchSelectionController({
      ...elements,
      selectedRecords,
      getCurrentRecords: () => [createRecord('AAA-001'), createRecord('AAA-002')],
    });

    controller.updateBatchUI();

    expect(elements.selectedCount.textContent).toBe('已选择 1 项');
    expect(elements.batchOperations.style.display).toBe('flex');
    expect(elements.batchActionsBtn.disabled).toBe(false);
    expect(elements.selectAllCheckbox.checked).toBe(false);
    expect(elements.selectAllCheckbox.indeterminate).toBe(true);
  });

  it('marks select all as checked when every current record is selected', () => {
    const elements = setupDom();
    const selectedRecords = new Set<string>(['AAA-001', 'AAA-002']);
    const controller = createRecordsBatchSelectionController({
      ...elements,
      selectedRecords,
      getCurrentRecords: () => [createRecord('AAA-001'), createRecord('AAA-002')],
    });

    controller.updateBatchUI();

    expect(elements.selectAllCheckbox.checked).toBe(true);
    expect(elements.selectAllCheckbox.indeterminate).toBe(false);
  });

  it('selects and unselects the current page when select all changes', () => {
    const elements = setupDom();
    const selectedRecords = new Set<string>(['OLD-001']);
    const onRender = vi.fn();
    const controller = createRecordsBatchSelectionController({
      ...elements,
      selectedRecords,
      getCurrentRecords: () => [createRecord('AAA-001'), createRecord('AAA-002')],
      onRender,
    });

    elements.selectAllCheckbox.checked = true;
    controller.handleSelectAll();

    expect([...selectedRecords].sort()).toEqual(['AAA-001', 'AAA-002', 'OLD-001']);
    expect(onRender).toHaveBeenCalledTimes(1);

    elements.selectAllCheckbox.checked = false;
    controller.handleSelectAll();

    expect([...selectedRecords]).toEqual(['OLD-001']);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('toggles one record and clears all row selection classes', () => {
    const elements = setupDom();
    const selectedRecords = new Set<string>(['AAA-002']);
    const controller = createRecordsBatchSelectionController({
      ...elements,
      selectedRecords,
      getCurrentRecords: () => [createRecord('AAA-001'), createRecord('AAA-002')],
    });

    controller.handleRecordSelection('AAA-001', true);
    expect(selectedRecords.has('AAA-001')).toBe(true);
    expect(document.querySelector('[data-record-id="AAA-001"]')?.classList.contains('selected')).toBe(true);

    controller.clearAllSelection();

    expect(selectedRecords.size).toBe(0);
    expect(document.querySelectorAll('.video-item.selected')).toHaveLength(0);
    expect(elements.batchOperations.style.display).toBe('none');
  });
});

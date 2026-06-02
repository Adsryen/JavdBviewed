import { describe, expect, it, vi } from 'vitest';
import { createRecordsListPickerRuntime } from '../../src/dashboard/tabs/records/listPickerRuntime';
import type { ListRecord, VideoRecord } from '../../src/types';

function createRecord(overrides: Partial<VideoRecord> = {}): VideoRecord {
  return {
    id: 'ABC-123',
    title: '测试影片',
    status: 'viewed',
    listIds: ['list-1'],
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

function createList(overrides: Partial<ListRecord> = {}): ListRecord {
  return {
    id: 'list-1',
    name: '清单一',
    type: 'mine',
    source: 'javdb',
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

function setupDom() {
  document.body.innerHTML = `
    <div id="listPickerPanel" style="display:block"></div>
    <div id="listPickerTitle"></div>
    <div id="listPickerList"></div>
    <div id="listPickerBatchFooter"></div>
  `;
}

describe('records list picker runtime', () => {
  it('closes the list picker panel', () => {
    setupDom();
    const runtime = createRecordsListPickerRuntime({
      selectedRecords: new Set(),
      getVisibleRecords: () => [],
      loadLists: vi.fn(),
      patchList: vi.fn(),
      bulkPatchList: vi.fn(),
      showMessage: vi.fn(),
      render: vi.fn(),
      escapeHtml: value => value,
    });

    runtime.close();

    expect((document.getElementById('listPickerPanel') as HTMLElement).style.display).toBe('none');
  });

  it('opens a single record picker through the lazy controller', async () => {
    setupDom();
    const runtime = createRecordsListPickerRuntime({
      selectedRecords: new Set(),
      getVisibleRecords: () => [createRecord()],
      loadLists: vi.fn(async () => [createList()]),
      patchList: vi.fn(async () => undefined),
      bulkPatchList: vi.fn(),
      showMessage: vi.fn(),
      render: vi.fn(),
      escapeHtml: value => value,
    });

    await runtime.openSingle(createRecord());

    expect((document.getElementById('listPickerPanel') as HTMLElement).style.display).toBe('');
    expect(document.getElementById('listPickerTitle')?.textContent).toBe('添加到清单：ABC-123');
  });

  it('applies single list changes to DB and visible records', async () => {
    setupDom();
    const visibleRecord = createRecord({ listIds: ['list-1'] });
    const patchList = vi.fn(async () => undefined);
    const render = vi.fn();
    const runtime = createRecordsListPickerRuntime({
      selectedRecords: new Set(),
      getVisibleRecords: () => [visibleRecord],
      loadLists: vi.fn(async () => []),
      patchList,
      bulkPatchList: vi.fn(),
      showMessage: vi.fn(),
      render,
      escapeHtml: value => value,
    });

    await runtime.executeListChange(['ABC-123'], 'list-2', 'add');

    expect(patchList).toHaveBeenCalledWith('ABC-123', 'list-2', 'add');
    expect(visibleRecord.listIds).toEqual(['list-1', 'list-2']);
    expect(render).toHaveBeenCalled();
  });

  it('applies batch list changes and reports partial failures', async () => {
    setupDom();
    const first = createRecord({ id: 'A', listIds: [] });
    const second = createRecord({ id: 'B', listIds: ['list-1'] });
    const showMessage = vi.fn();
    const runtime = createRecordsListPickerRuntime({
      selectedRecords: new Set(['A', 'B']),
      getVisibleRecords: () => [first, second],
      loadLists: vi.fn(async () => []),
      patchList: vi.fn(),
      bulkPatchList: vi.fn(async () => ({ successCount: 1, failCount: 1 })),
      showMessage,
      render: vi.fn(),
      escapeHtml: value => value,
    });

    await runtime.executeListChange(['A', 'B'], 'list-1', 'remove');

    expect(showMessage).toHaveBeenCalledWith('移除完成：成功 1 条，失败 1 条', 'warning');
    expect(first.listIds).toEqual([]);
    expect(second.listIds).toEqual([]);
  });
});

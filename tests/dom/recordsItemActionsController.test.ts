import { describe, expect, it, vi } from 'vitest';
import { createRecordsItemActionsController } from '../../src/dashboard/tabs/records/itemActionsController';
import type { VideoRecord } from '../../src/types';

function createRecord(overrides: Partial<VideoRecord> = {}): VideoRecord {
  return {
    id: 'ABC-123',
    title: '测试影片',
    status: 'viewed',
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

function createController(overrides: Partial<Parameters<typeof createRecordsItemActionsController>[0]> = {}) {
  const records = [createRecord()];
  const selectedRecords = new Set<string>();
  return createRecordsItemActionsController({
    getRecords: () => records,
    selectedRecords,
    saveRecord: vi.fn().mockResolvedValue(undefined),
    deleteRecord: vi.fn().mockResolvedValue(undefined),
    sendRuntimeMessage: vi.fn().mockResolvedValue({ success: true, record: createRecord({ title: '刷新后' }) }),
    showMessage: vi.fn(),
    showConfirmationModal: vi.fn(),
    openEditModal: vi.fn(),
    updateFilteredRecords: vi.fn(),
    render: vi.fn(),
    isFavoritesFilterActive: () => false,
    ...overrides,
  });
}

describe('records item actions controller', () => {
  it('toggles favorite state, persists the record and updates button state', async () => {
    const saveRecord = vi.fn().mockResolvedValue(undefined);
    const showMessage = vi.fn();
    const controller = createController({ saveRecord, showMessage });
    const record = createRecord();
    const button = document.createElement('button');

    await controller.onToggleFavorite(record, button);

    expect(record.isFavorite).toBe(true);
    expect(record.favoritedAt).toBeTypeOf('number');
    expect(saveRecord).toHaveBeenCalledWith(record);
    expect(button.className).toBe('action-button favorite-button favorited');
    expect(showMessage).toHaveBeenCalledWith('已添加到收藏', 'success');
  });

  it('refreshes a record through background runtime and updates local records', async () => {
    const records = [createRecord()];
    const updateFilteredRecords = vi.fn();
    const render = vi.fn();
    const showMessage = vi.fn();
    const controller = createController({
      getRecords: () => records,
      updateFilteredRecords,
      render,
      showMessage,
      sendRuntimeMessage: vi.fn()
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true, record: createRecord({ title: '刷新后' }) }),
    });
    const button = document.createElement('button');

    await controller.onRefresh(records[0], button);

    expect(records[0].title).toBe('刷新后');
    expect(updateFilteredRecords).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();
    expect(showMessage).toHaveBeenCalledWith("'ABC-123' 已成功刷新。", 'success');
    expect(button.disabled).toBe(false);
  });

  it('opens confirmation and deletes a confirmed record', async () => {
    const records = [createRecord()];
    const selectedRecords = new Set(['ABC-123']);
    const deleteRecord = vi.fn().mockResolvedValue(undefined);
    const render = vi.fn();
    const showMessage = vi.fn();
    const showConfirmationModal = vi.fn(({ onConfirm }) => onConfirm());
    const controller = createController({
      getRecords: () => records,
      selectedRecords,
      deleteRecord,
      render,
      showMessage,
      showConfirmationModal,
    });

    controller.onDelete(records[0], document.createElement('button'));
    await Promise.resolve();

    expect(deleteRecord).toHaveBeenCalledWith('ABC-123');
    expect(records).toHaveLength(0);
    expect(selectedRecords.has('ABC-123')).toBe(false);
    expect(render).toHaveBeenCalled();
    expect(showMessage).toHaveBeenCalledWith('记录 "ABC-123" 已删除', 'success');
  });
});

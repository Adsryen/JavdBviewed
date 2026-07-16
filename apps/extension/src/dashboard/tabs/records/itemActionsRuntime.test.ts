import { describe, expect, it, vi } from 'vitest';
import { createRecordsItemActionsRuntime } from './itemActionsRuntime';
import type { VideoRecord, VideoStatus } from '../../../types';

function record(id: string, title = id): VideoRecord {
  return {
    id,
    title,
    status: 'viewed',
    createdAt: 1,
    updatedAt: 2,
  };
}

const videoStatus = {
  UNTRACKED: 'untracked' as VideoStatus,
  VIEWED: 'viewed' as VideoStatus,
  BROWSED: 'browsed' as VideoStatus,
  WANT: 'want' as VideoStatus,
};

describe('records item actions runtime', () => {
  it('opens edit modal with a save handler wired to records persistence', async () => {
    const original = record('AAA-001');
    const updated = record('BBB-002', '新标题');
    const records = [original];
    const saveRecord = vi.fn(async () => {});
    const deleteRecord = vi.fn(async () => {});
    const showMessage = vi.fn();
    const render = vi.fn();
    const openEditModal = vi.fn();

    const controller = createRecordsItemActionsRuntime({
      getRecords: () => records,
      selectedRecords: new Set<string>(),
      saveRecord,
      deleteRecord,
      sendRuntimeMessage: vi.fn(),
      showMessage,
      showConfirmationModal: vi.fn(),
      openEditModal,
      videoStatus,
      updateFilteredRecords: vi.fn(),
      render,
      isFavoritesFilterActive: () => false,
    });

    controller.onEdit(original, {} as HTMLButtonElement);
    const modalOptions = openEditModal.mock.calls[0][0];
    const result = await modalOptions.onSave(updated, original);

    expect(modalOptions.record).toBe(original);
    expect(modalOptions.videoStatus).toBe(videoStatus);
    expect(modalOptions.showMessage).toBe(showMessage);
    expect(deleteRecord).toHaveBeenCalledWith('AAA-001');
    expect(saveRecord).toHaveBeenCalledWith(updated);
    expect(records).toEqual([updated]);
    expect(render).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: '记录ID从 "AAA-001" 更改为 "BBB-002"', type: 'success' });
  });
});

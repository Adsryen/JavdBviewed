import { describe, expect, it, vi } from 'vitest';
import { createRecordsEditSaveHandler } from './editSaveService';
import type { VideoRecord } from '../../../types';

function record(id: string, title = id): VideoRecord {
  return {
    id,
    title,
    status: 'viewed',
    createdAt: 1,
    updatedAt: 2,
  };
}

function createHandler(records: VideoRecord[]) {
  const saveRecord = vi.fn(async () => {});
  const deleteRecord = vi.fn(async () => {});
  const showMessage = vi.fn();
  const render = vi.fn();
  const handler = createRecordsEditSaveHandler({
    getRecords: () => records,
    saveRecord,
    deleteRecord,
    showMessage,
    render,
  });

  return {
    handler,
    saveRecord,
    deleteRecord,
    showMessage,
    render,
  };
}

describe('records edit save service', () => {
  it('shows an error and skips persistence when the new id already exists', async () => {
    const original = record('AAA-001');
    const records = [original, record('BBB-002')];
    const { handler, saveRecord, deleteRecord, showMessage, render } = createHandler(records);

    const result = await handler.save(record('BBB-002'), original);

    expect(result).toBeUndefined();
    expect(showMessage).toHaveBeenCalledWith('ID "BBB-002" 已存在，请使用其他ID', 'error');
    expect(deleteRecord).not.toHaveBeenCalled();
    expect(saveRecord).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
    expect(records.map(item => item.id)).toEqual(['AAA-001', 'BBB-002']);
  });

  it('deletes the old id, saves the new record, and removes stale originals when id changes', async () => {
    const original = record('AAA-001');
    const updated = record('CCC-003', '更新标题');
    const staleOriginal = record('AAA-001', '重复旧记录');
    const records = [original, staleOriginal];
    const { handler, saveRecord, deleteRecord, render } = createHandler(records);

    const result = await handler.save(updated, original);

    expect(deleteRecord).toHaveBeenCalledWith('AAA-001');
    expect(saveRecord).toHaveBeenCalledWith(updated);
    expect(records.map(item => item.id)).toEqual(['CCC-003']);
    expect(records[0]).toBe(updated);
    expect(render).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: '记录ID从 "AAA-001" 更改为 "CCC-003"', type: 'success' });
  });

  it('continues saving when deleting the old id fails during an id change', async () => {
    const original = record('AAA-001');
    const updated = record('CCC-003');
    const records = [original];
    const { handler, saveRecord, deleteRecord } = createHandler(records);
    deleteRecord.mockRejectedValueOnce(new Error('delete failed'));

    const result = await handler.save(updated, original);

    expect(saveRecord).toHaveBeenCalledWith(updated);
    expect(records.map(item => item.id)).toEqual(['CCC-003']);
    expect(result?.type).toBe('success');
  });

  it('saves and replaces the existing record when id stays the same', async () => {
    const original = record('AAA-001');
    const updated = record('AAA-001', '更新标题');
    const records = [original];
    const { handler, saveRecord, deleteRecord, render } = createHandler(records);

    const result = await handler.save(updated, original);

    expect(deleteRecord).not.toHaveBeenCalled();
    expect(saveRecord).toHaveBeenCalledWith(updated);
    expect(records).toEqual([updated]);
    expect(render).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: '记录 "AAA-001" 已更新', type: 'success' });
  });
});

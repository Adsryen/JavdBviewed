import { describe, expect, it, vi } from 'vitest';
import { createRecordsExportController } from '../../src/dashboard/tabs/records/exportController';
import type { VideoRecord } from '../../src/types';

function createRecord(overrides: Partial<VideoRecord> = {}): VideoRecord {
  return {
    id: 'ABC-123',
    title: '测试影片',
    status: 'viewed',
    tags: ['tag-a'],
    createdAt: 1,
    updatedAt: 2,
    listIds: ['list-1'],
    javdbUrl: 'https://javdb.com/v/abc',
    javdbImage: 'https://example.com/cover.jpg',
    ...overrides,
  };
}

describe('records export controller', () => {
  it('opens export modal and exports JSON after confirmation', async () => {
    const showMessage = vi.fn();
    const downloadFile = vi.fn();
    const controller = createRecordsExportController({
      getExportCountText: () => '当前筛选条件下共 1 条记录',
      getRecords: vi.fn().mockResolvedValue([createRecord()]),
      getListName: (id) => id,
      showMessage,
      downloadFile,
    });

    await controller.handleExportRecords();
    (document.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(downloadFile).toHaveBeenCalledWith(expect.objectContaining({
      filename: expect.stringMatching(/^javdb-records-\d{4}-\d{2}-\d{2}\.json$/),
      type: 'application/json;charset=utf-8',
    }));
    const payload = JSON.parse(downloadFile.mock.calls[0][0].content);
    expect(payload.totalCount).toBe(1);
    expect(payload.records[0].id).toBe('ABC-123');
    expect(showMessage).toHaveBeenCalledWith('成功导出 1 条记录（JSON格式）', 'success');
  });

  it('exports CSV when excel format is selected', async () => {
    const downloadFile = vi.fn();
    const controller = createRecordsExportController({
      getExportCountText: () => '共 1 条记录',
      getRecords: vi.fn().mockResolvedValue([createRecord()]),
      getListName: (id) => id === 'list-1' ? '清单一' : id,
      showMessage: vi.fn(),
      downloadFile,
    });

    await controller.handleExportRecords();
    (document.querySelector('input[value="excel"]') as HTMLInputElement).checked = true;
    (document.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(downloadFile).toHaveBeenCalledWith(expect.objectContaining({
      filename: expect.stringMatching(/^javdb-records-\d{4}-\d{2}-\d{2}\.csv$/),
      type: 'text/csv;charset=utf-8',
    }));
    expect(downloadFile.mock.calls[0][0].content).toContain('"ABC-123","测试影片","viewed","tag-a","清单一"');
  });
});

/**
 * @file recordsExportController.test.ts
 * @description records export controller 测试
 * @module tests/dom
 */
import { describe, expect, it, vi } from 'vitest';
import { createRecordsExportController } from '../../apps/extension/src/dashboard/tabs/records/exportController';
import type { VideoRecord } from '../../apps/extension/src/types';

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

  it('exports numeric IDs with ="value" format to prevent Excel auto-conversion', async () => {
    const downloadFile = vi.fn();
    const controller = createRecordsExportController({
      getExportCountText: () => '共 2 条记录',
      getRecords: vi.fn().mockResolvedValue([
        createRecord({ id: '123456', title: '全数字番号作品' }),
        createRecord({ id: 'ABC-789', title: '字母番号作品' }),
      ]),
      getListName: (id) => id,
      showMessage: vi.fn(),
      downloadFile,
    });

    await controller.handleExportRecords();
    (document.querySelector('input[value="excel"]') as HTMLInputElement).checked = true;
    (document.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const content = downloadFile.mock.calls[0][0].content;
    // 纯数字番号使用 ="123456" 格式防止 Excel 自动转换
    expect(content).toContain('"=""123456"""');
    // 非纯数字番号使用标准双引号格式
    expect(content).toContain('"ABC-789"');
  });

  it('exports formula-like IDs safely', async () => {
    const downloadFile = vi.fn();
    const controller = createRecordsExportController({
      getExportCountText: () => '共 1 条记录',
      getRecords: vi.fn().mockResolvedValue([
        createRecord({ id: '=SUM(A1)', title: '公式番号' }),
      ]),
      getListName: (id) => id,
      showMessage: vi.fn(),
      downloadFile,
    });

    await controller.handleExportRecords();
    (document.querySelector('input[value="excel"]') as HTMLInputElement).checked = true;
    (document.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const content = downloadFile.mock.calls[0][0].content;
    // 以 = 开头的值使用 ="=SUM(A1)" 格式防止 Excel 当作公式
    expect(content).toContain('"=""=SUM(A1)"""');
  });

  it('exports only selected records when "仅导出选中" is chosen', async () => {
    const downloadFile = vi.fn();
    const showMessage = vi.fn();
    const allRecords = [
      createRecord({ id: 'ABC-001', title: '影片1' }),
      createRecord({ id: 'ABC-002', title: '影片2' }),
      createRecord({ id: 'ABC-003', title: '影片3' }),
    ];
    const controller = createRecordsExportController({
      getExportCountText: () => '当前筛选条件下共 3 条记录',
      getRecords: vi.fn().mockResolvedValue(allRecords),
      getListName: (id) => id,
      showMessage,
      downloadFile,
      getSelectedRecordIds: () => ['ABC-001', 'ABC-003'],
      getSelectedCountText: () => '仅导出选中记录（2 条）',
    });

    await controller.handleExportRecords();

    // 验证弹窗中有导出范围选项
    const scopeAll = document.querySelector('input[value="all"]') as HTMLInputElement;
    const scopeSelected = document.querySelector('input[value="selected"]') as HTMLInputElement;
    expect(scopeAll).not.toBeNull();
    expect(scopeSelected).not.toBeNull();

    // 选择「仅导出选中记录」
    scopeSelected.checked = true;
    (document.querySelector('input[value="json"]') as HTMLInputElement).checked = true;
    (document.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const payload = JSON.parse(downloadFile.mock.calls[0][0].content);
    expect(payload.totalCount).toBe(2);
    expect(payload.records.map((r: VideoRecord) => r.id)).toEqual(['ABC-001', 'ABC-003']);
    expect(showMessage).toHaveBeenCalledWith('成功导出 2 条记录（仅选中）（JSON格式）', 'success');
  });

  it('falls back to export all when no selected records', async () => {
    const downloadFile = vi.fn();
    const allRecords = [
      createRecord({ id: 'ABC-001', title: '影片1' }),
      createRecord({ id: 'ABC-002', title: '影片2' }),
    ];
    const controller = createRecordsExportController({
      getExportCountText: () => '当前筛选条件下共 2 条记录',
      getRecords: vi.fn().mockResolvedValue(allRecords),
      getListName: (id) => id,
      showMessage: vi.fn(),
      downloadFile,
      getSelectedRecordIds: () => [],
      getSelectedCountText: () => '仅导出选中记录（0 条）',
    });

    await controller.handleExportRecords();

    // 无选中时不显示导出范围选项
    const scopeAll = document.querySelector('input[name="exportScope"]');
    expect(scopeAll).toBeNull();

    (document.querySelector('.custom-confirm-ok') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const payload = JSON.parse(downloadFile.mock.calls[0][0].content);
    expect(payload.totalCount).toBe(2);
  });
});

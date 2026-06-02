import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRecordsEditModal } from '../../src/dashboard/tabs/records/editModalController';
import { VIDEO_STATUS } from '../../src/utils/config';
import type { VideoRecord } from '../../src/types';

function createRecord(overrides: Partial<VideoRecord> = {}): VideoRecord {
  return {
    id: 'ABC-123',
    title: '测试标题',
    status: VIDEO_STATUS.VIEWED,
    tags: ['高清'],
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  };
}

describe('records edit modal controller', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders edit fields and closes from cancel', () => {
    openRecordsEditModal({
      record: createRecord(),
      videoStatus: VIDEO_STATUS,
      showMessage: vi.fn(),
      onSave: vi.fn(),
    });

    expect(document.querySelector('.edit-record-modal')).toBeTruthy();
    expect((document.querySelector('#edit-id') as HTMLInputElement).value).toBe('ABC-123');
    expect((document.querySelector('#edit-title') as HTMLInputElement).value).toBe('测试标题');

    (document.querySelector('#cancel-edit') as HTMLButtonElement).click();

    expect(document.querySelector('.edit-record-modal')).toBeNull();
  });

  it('validates required fields before saving', () => {
    const showMessage = vi.fn();
    const onSave = vi.fn();
    openRecordsEditModal({
      record: createRecord(),
      videoStatus: VIDEO_STATUS,
      showMessage,
      onSave,
    });

    (document.querySelector('#edit-title') as HTMLInputElement).value = '';
    (document.querySelector('#edit-title') as HTMLInputElement).dispatchEvent(new Event('input'));
    (document.querySelector('#save-record') as HTMLButtonElement).click();

    expect(onSave).not.toHaveBeenCalled();
    expect(showMessage).toHaveBeenCalledWith('ID和标题是必填字段', 'error');
  });

  it('saves edited json through callback and closes on success', async () => {
    const showMessage = vi.fn();
    const onSave = vi.fn().mockResolvedValue({ message: '保存成功', type: 'success' });
    openRecordsEditModal({
      record: createRecord(),
      videoStatus: VIDEO_STATUS,
      showMessage,
      onSave,
    });

    (document.querySelector('#edit-id') as HTMLInputElement).value = 'ABC-456';
    (document.querySelector('#edit-title') as HTMLInputElement).value = '新标题';
    (document.querySelector('#edit-title') as HTMLInputElement).dispatchEvent(new Event('input'));
    (document.querySelector('#save-record') as HTMLButtonElement).click();
    await Promise.resolve();

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 'ABC-456',
      title: '新标题',
    }), expect.objectContaining({ id: 'ABC-123' }));
    expect(showMessage).toHaveBeenCalledWith('保存成功', 'success');
    expect(document.querySelector('.edit-record-modal')).toBeNull();
  });

  it('toggles field locks and syncs manually edited fields to json', () => {
    openRecordsEditModal({
      record: createRecord({ manuallyEditedFields: [] }),
      videoStatus: VIDEO_STATUS,
      showMessage: vi.fn(),
      onSave: vi.fn(),
    });

    (document.querySelector('[data-field-name="director"] .field-lock') as HTMLElement).click();
    const json = JSON.parse((document.querySelector('#edit-json') as HTMLTextAreaElement).value);

    expect(json.manuallyEditedFields).toContain('director');
  });
});

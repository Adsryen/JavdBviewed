import { describe, expect, it, vi } from 'vitest';
import { createRecordsBatchAddTagController } from '../../src/dashboard/tabs/records/batchAddTagController';

describe('records batch add tag controller', () => {
  it('opens a modal and submits trimmed tags', () => {
    const onSubmit = vi.fn();
    const showMessage = vi.fn();
    const controller = createRecordsBatchAddTagController({
      getSelectedCount: () => 2,
      onSubmit,
      showMessage,
    });

    controller.openBatchAddTag();

    const modal = document.querySelector('.custom-confirm-modal') as HTMLElement;
    const input = modal.querySelector('#batchTagInput') as HTMLInputElement;
    const okBtn = modal.querySelector('.custom-confirm-ok') as HTMLButtonElement;

    input.value = '  tag-a, tag-b；tag-c  ';
    okBtn.click();

    expect(onSubmit).toHaveBeenCalledWith(['tag-a', 'tag-b', 'tag-c']);
    expect(document.querySelector('.custom-confirm-modal')).toBeNull();
    expect(showMessage).not.toHaveBeenCalled();
  });

  it('keeps the modal open and shows a warning when input is empty', () => {
    const onSubmit = vi.fn();
    const showMessage = vi.fn();
    const controller = createRecordsBatchAddTagController({
      getSelectedCount: () => 1,
      onSubmit,
      showMessage,
    });

    controller.openBatchAddTag();

    const modal = document.querySelector('.custom-confirm-modal') as HTMLElement;
    const okBtn = modal.querySelector('.custom-confirm-ok') as HTMLButtonElement;
    okBtn.click();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(showMessage).toHaveBeenCalledWith('请输入至少一个标签', 'warning');
    expect(document.querySelector('.custom-confirm-modal')).not.toBeNull();
  });
});

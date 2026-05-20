import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '../../src/dashboard/components/confirmModal';

describe('ConfirmModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    vi.useFakeTimers();
  });

  it('renders default message content as text', () => {
    const modal = new ConfirmModal();
    void modal.show({
      title: '<img src=x>',
      message: '<img src=x onerror=alert(1)>Keep text',
      confirmText: '<b>OK</b>',
      cancelText: '<i>Cancel</i>',
    });

    expect(document.querySelector('.modal-body img')).toBeNull();
    expect(document.querySelector('.confirm-message')?.textContent).toBe('<img src=x onerror=alert(1)>Keep text');
    expect(document.querySelector('.modal-header h3')?.textContent).toBe('<img src=x>');
    expect(document.querySelector('#confirmOk')?.textContent).toBe('<b>OK</b>');
    expect(document.querySelector('#confirmCancel')?.textContent).toBe('<i>Cancel</i>');
  });

  it('resolves true on confirm and removes the modal after closing', async () => {
    const modal = new ConfirmModal();
    const result = modal.show({ message: 'Delete item?', type: 'danger' });

    document.querySelector<HTMLButtonElement>('#confirmOk')?.click();
    await vi.advanceTimersByTimeAsync(300);

    await expect(result).resolves.toBe(true);
    expect(document.querySelector('.confirm-modal')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('resolves false when Escape is pressed', async () => {
    const modal = new ConfirmModal();
    const result = modal.show({ message: 'Close?' });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await vi.advanceTimersByTimeAsync(300);

    await expect(result).resolves.toBe(false);
    expect(document.querySelector('.confirm-modal')).toBeNull();
  });
});

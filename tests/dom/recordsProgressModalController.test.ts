import { describe, expect, it } from 'vitest';
import { hideRecordsProgressModal, showRecordsProgressModal, updateRecordsProgressModal } from '../../src/dashboard/tabs/records/progressModalController';

describe('records progress modal controller', () => {
  it('shows, updates and hides a progress modal', () => {
    const modal = showRecordsProgressModal('处理中...', 4);

    expect(document.body.contains(modal)).toBe(true);
    expect(modal.className).toBe('batch-progress');
    expect(modal.querySelector('.batch-progress-text')?.textContent).toBe('处理中...');
    expect(modal.querySelector('.batch-progress-details')?.textContent).toBe('0 / 4');

    updateRecordsProgressModal(modal, 2, 4, '已完成 2/4');

    expect((modal.querySelector('.batch-progress-fill') as HTMLElement).style.width).toBe('50%');
    expect(modal.querySelector('.batch-progress-details')?.textContent).toBe('已完成 2/4');

    hideRecordsProgressModal(modal);
    expect(document.body.contains(modal)).toBe(false);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import {
  getSelectedBatchCurrentPageWork,
  setBatchOpenSelectedButtonLoading,
} from '../../src/dashboard/tabs/newWorksSelectedBatchRuntime';

describe('new works selected batch runtime', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('updates selected batch open button loading and idle states', () => {
    document.body.innerHTML = '<button id="batchOpenSelectedBtn"></button>';
    const button = document.getElementById('batchOpenSelectedBtn') as HTMLButtonElement;

    setBatchOpenSelectedButtonLoading({ loading: true, selectedCount: 2 });

    expect(button.disabled).toBe(true);
    expect(button.innerHTML).toContain('正在打开');

    setBatchOpenSelectedButtonLoading({ loading: false, selectedCount: 0 });

    expect(button.disabled).toBe(true);
    expect(button.innerHTML).toContain('批量打开（已选）');

    setBatchOpenSelectedButtonLoading({ loading: false, selectedCount: 1 });

    expect(button.disabled).toBe(false);
  });

  it('reads current page work url and read state from rendered list item', () => {
    document.body.innerHTML = `
      <li class="new-work-item read" data-work-id="work-1" data-javdb-url="https://javdb.com/v/work-1"></li>
    `;

    expect(getSelectedBatchCurrentPageWork('work-1')).toEqual({
      id: 'work-1',
      url: 'https://javdb.com/v/work-1',
      isRead: true,
    });
  });

  it('returns undefined when current page item or url is missing', () => {
    document.body.innerHTML = '<li class="new-work-item unread" data-work-id="work-1"></li>';

    expect(getSelectedBatchCurrentPageWork('work-1')).toBeUndefined();
    expect(getSelectedBatchCurrentPageWork('missing')).toBeUndefined();
  });
});

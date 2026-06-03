import { describe, expect, it } from 'vitest';
import { UNREAD_BATCH_OPEN_COOLDOWN_MS } from '../../src/dashboard/tabs/newWorksBatchOpenPolicy';
import { createNewWorksTabState } from '../../src/dashboard/tabs/newWorksTabState';

describe('new works tab state', () => {
  it('keeps page, filters and selected works in a dedicated state controller', () => {
    const state = createNewWorksTabState();

    expect(state.getPage()).toBe(1);
    expect(state.filters).toEqual({
      search: '',
      filter: 'unread',
      sort: 'discoveredAt_desc',
    });

    state.setPage(3);
    state.filters.search = 'alice';
    state.selectedWorks.add('work-1');
    state.selectedWorks.add('work-2');

    expect(state.getPage()).toBe(3);
    expect(state.filters.search).toBe('alice');
    expect(Array.from(state.selectedWorks)).toEqual(['work-1', 'work-2']);

    state.clearSelection();
    expect(state.selectedWorks.size).toBe(0);
  });

  it('tracks unread batch open cooldown from an injectable clock', () => {
    let now = 10_000;
    const state = createNewWorksTabState({ now: () => now });

    expect(state.getUnreadBatchOpenCooldownRemaining()).toBe(0);
    expect(state.getUnreadBatchOpenCooldownSeconds()).toBe(0);

    state.startUnreadBatchOpenCooldown();
    now += 4_200;

    expect(state.getUnreadBatchOpenCooldownRemaining()).toBe(UNREAD_BATCH_OPEN_COOLDOWN_MS - 4_200);
    expect(state.getUnreadBatchOpenCooldownSeconds()).toBe(11);

    now += UNREAD_BATCH_OPEN_COOLDOWN_MS;
    expect(state.getUnreadBatchOpenCooldownRemaining()).toBe(0);
    expect(state.getUnreadBatchOpenCooldownSeconds()).toBe(0);
  });
});

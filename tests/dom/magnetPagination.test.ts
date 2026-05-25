import { describe, expect, it } from 'vitest';
import { buildMagnetPaginationState } from '../../src/content/magnetPagination';

describe('magnet pagination', () => {
  it('does not paginate result sets up to the threshold', () => {
    const state = buildMagnetPaginationState(10, 1);

    expect(state.enabled).toBe(false);
    expect(state.pageSize).toBe(10);
    expect(state.totalPages).toBe(1);
    expect(state.startIndex).toBe(0);
    expect(state.endIndex).toBe(10);
  });

  it('paginates result sets above 10 items and clamps page number', () => {
    const state = buildMagnetPaginationState(33, 99);

    expect(state.enabled).toBe(true);
    expect(state.pageSize).toBe(10);
    expect(state.currentPage).toBe(4);
    expect(state.totalPages).toBe(4);
    expect(state.startIndex).toBe(30);
    expect(state.endIndex).toBe(33);
  });

  it('shows the second page as the remaining native-size slice', () => {
    const state = buildMagnetPaginationState(11, 2);

    expect(state.enabled).toBe(true);
    expect(state.pageSize).toBe(10);
    expect(state.currentPage).toBe(2);
    expect(state.totalPages).toBe(2);
    expect(state.startIndex).toBe(10);
    expect(state.endIndex).toBe(11);
  });
});

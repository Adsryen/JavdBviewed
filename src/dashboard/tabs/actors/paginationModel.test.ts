import { describe, expect, it } from 'vitest';
import { buildActorPaginationHtml, getActorPaginationItems } from './paginationModel';

describe('actors pagination model', () => {
  it('keeps first, last, nearby pages and ellipsis for long ranges', () => {
    expect(getActorPaginationItems(6, 12)).toEqual([1, 'ellipsis', 4, 5, 6, 7, 8, 'ellipsis', 12]);
  });

  it('marks edge buttons disabled at the first and last page', () => {
    const firstPageHtml = buildActorPaginationHtml(1, 3, 42);
    expect(firstPageHtml).toContain('共 42 个演员，第 1/3 页');
    expect(firstPageHtml).toContain('data-page="1" disabled title="首页"');
    expect(firstPageHtml).toContain('data-page="0" disabled title="上一页"');

    const lastPageHtml = buildActorPaginationHtml(3, 3, 42);
    expect(lastPageHtml).toContain('data-page="4" disabled title="下一页"');
    expect(lastPageHtml).toContain('data-page="3" disabled title="末页"');
  });

  it('returns an empty string when total pages is zero', () => {
    expect(buildActorPaginationHtml(1, 0, 0)).toBe('');
  });
});

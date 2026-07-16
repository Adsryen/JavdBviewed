import { describe, expect, it } from 'vitest';
import { buildRecordsPaginationModel, clampRecordsPage } from './paginationModel';

describe('records pagination model', () => {
  it('returns hidden model when only one page is needed', () => {
    expect(buildRecordsPaginationModel({ totalCount: 10, recordsPerPage: 10, currentPage: 1 })).toEqual({
      visible: false,
      pageCount: 1,
      items: [],
    });
  });

  it('builds first page controls with next and last enabled', () => {
    const model = buildRecordsPaginationModel({ totalCount: 100, recordsPerPage: 10, currentPage: 1 });
    expect(model.visible).toBe(true);
    expect(model.pageCount).toBe(10);
    expect(model.items.map((item) => item.kind === 'page' ? item.page : item.kind)).toEqual([
      'first',
      'previous',
      1,
      2,
      3,
      'ellipsis',
      10,
      'next',
      'last',
    ]);
    expect(model.items[0]).toMatchObject({ kind: 'first', disabled: true });
    expect(model.items.at(-1)).toMatchObject({ kind: 'last', disabled: false, page: 10 });
  });

  it('builds middle page controls with ellipses around the current window', () => {
    const model = buildRecordsPaginationModel({ totalCount: 200, recordsPerPage: 10, currentPage: 10 });
    expect(model.items.map((item) => item.kind === 'page' ? item.page : item.kind)).toEqual([
      'first',
      'previous',
      1,
      'ellipsis',
      8,
      9,
      10,
      11,
      12,
      'ellipsis',
      20,
      'next',
      'last',
    ]);
    expect(model.items.find((item) => item.kind === 'page' && item.page === 10)).toMatchObject({ active: true });
  });

  it('clamps current page before building controls', () => {
    const model = buildRecordsPaginationModel({ totalCount: 95, recordsPerPage: 10, currentPage: 99 });
    expect(model.pageCount).toBe(10);
    expect(model.items.find((item) => item.kind === 'page' && item.page === 10)).toMatchObject({ active: true });
    expect(model.items.at(-2)).toMatchObject({ kind: 'next', disabled: true, page: 10 });
    expect(clampRecordsPage(0, 5)).toBe(1);
    expect(clampRecordsPage(8, 5)).toBe(5);
  });
});

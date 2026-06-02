export type RecordsPaginationItem =
  | { kind: 'first' | 'previous' | 'next' | 'last'; page: number; disabled: boolean; title: string; html: string }
  | { kind: 'page'; page: number; active: boolean; disabled: false; title?: string; html: string }
  | { kind: 'ellipsis'; disabled: true; html: string };

export interface RecordsPaginationModel {
  visible: boolean;
  pageCount: number;
  items: RecordsPaginationItem[];
}

export interface BuildRecordsPaginationModelInput {
  totalCount: number;
  recordsPerPage: number;
  currentPage: number;
  windowRadius?: number;
}

export function clampRecordsPage(page: number, pageCount: number): number {
  if (pageCount <= 0) return 1;
  if (page < 1) return 1;
  if (page > pageCount) return pageCount;
  return page;
}

export function buildRecordsPaginationModel(input: BuildRecordsPaginationModelInput): RecordsPaginationModel {
  const recordsPerPage = Math.max(1, Math.floor(input.recordsPerPage || 1));
  const pageCount = Math.max(1, Math.ceil(Math.max(0, input.totalCount) / recordsPerPage));
  const currentPage = clampRecordsPage(Math.floor(input.currentPage || 1), pageCount);
  const windowRadius = input.windowRadius ?? 2;

  if (pageCount <= 1) {
    return { visible: false, pageCount, items: [] };
  }

  const items: RecordsPaginationItem[] = [
    { kind: 'first', page: 1, disabled: currentPage === 1, title: '首页', html: '<i class="fas fa-angles-left"></i>' },
    { kind: 'previous', page: currentPage - 1, disabled: currentPage === 1, title: '上一页', html: '<i class="fas fa-angle-left"></i>' },
  ];

  const pagesToShow = new Set<number>([1, pageCount]);
  for (let offset = -windowRadius; offset <= windowRadius; offset += 1) {
    const page = currentPage + offset;
    if (page > 1 && page < pageCount) pagesToShow.add(page);
  }
  if (currentPage > 1 && currentPage < pageCount) pagesToShow.add(currentPage);

  const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);
  let lastPage: number | null = null;

  for (const page of sortedPages) {
    if (lastPage !== null && page - lastPage > 1) {
      items.push({ kind: 'ellipsis', disabled: true, html: '...' });
    }
    items.push({ kind: 'page', page, active: page === currentPage, disabled: false, html: String(page) });
    lastPage = page;
  }

  items.push(
    { kind: 'next', page: Math.min(pageCount, currentPage + 1), disabled: currentPage === pageCount, title: '下一页', html: '<i class="fas fa-angle-right"></i>' },
    { kind: 'last', page: pageCount, disabled: currentPage === pageCount, title: '末页', html: '<i class="fas fa-angles-right"></i>' },
  );

  return { visible: true, pageCount, items };
}

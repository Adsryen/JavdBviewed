export interface MagnetPaginationState {
  enabled: boolean;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export const MAGNET_PAGINATION_THRESHOLD = 10;
export const MAGNET_PAGINATION_PAGE_SIZE = 10;

export function buildMagnetPaginationState(totalItems: number, requestedPage: number): MagnetPaginationState {
  const enabled = totalItems > MAGNET_PAGINATION_THRESHOLD;
  const pageSize = enabled ? MAGNET_PAGINATION_PAGE_SIZE : Math.max(totalItems, 1);
  const totalPages = enabled ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const normalizedPage = Number.isFinite(requestedPage) ? Math.round(requestedPage) : 1;
  const currentPage = Math.min(totalPages, Math.max(1, normalizedPage));
  const startIndex = enabled ? (currentPage - 1) * pageSize : 0;
  const endIndex = enabled ? Math.min(totalItems, startIndex + pageSize) : totalItems;

  return {
    enabled,
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
  };
}

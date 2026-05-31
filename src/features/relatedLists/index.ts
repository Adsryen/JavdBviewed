// src/features/relatedLists/index.ts

import { log } from '../contentState';
import { bgFetchJSON } from '../../platform/network/clientFetch';
import { ReviewBreakerService } from '../reviewUnlock';

export interface RelatedListItem {
  relatedId: string;
  name: string;
  description?: string;
  movieCount: number;
  collectionCount: number;
  viewCount: number;
  createTime: string;
}

export interface RelatedListsResponse {
  success: boolean;
  data?: RelatedListItem[];
  error?: string;
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export class RelatedListsService {
  private static readonly API_BASE = 'https://jdforrepam.com/api';

  static async getRelatedLists(movieId: string, page: number = 1, limit: number = 20): Promise<RelatedListsResponse> {
    try {
      const safePage = Math.max(1, Math.round(Number(page) || 1));
      const safeLimit = Math.max(1, Math.min(100, Math.round(Number(limit) || 20)));
      const signature = await ReviewBreakerService.generateSignature();
      const params = new URLSearchParams({
        movie_id: movieId,
        page: String(safePage),
        limit: String(safeLimit),
      });
      const url = `${this.API_BASE}/v1/lists/related?${params.toString()}`;

      log(`[RelatedLists] Fetching related lists for movie: ${movieId}, page: ${safePage}`);
      const { success, status, data, error } = await bgFetchJSON<any>({
        url,
        method: 'GET',
        headers: {
          jdSignature: signature,
        },
        timeoutMs: 15000,
      });

      if (!success) {
        const serverMsg = data && (data.message || data.error || data.msg);
        const errText = serverMsg ? `HTTP ${status}: ${serverMsg}` : (error || `HTTP ${status}`);
        throw new Error(errText);
      }

      const payload = data?.data || {};
      const lists = Array.isArray(payload?.lists) ? payload.lists : [];
      const mapped = lists.map((item: any): RelatedListItem => ({
        relatedId: String(item.id || ''),
        name: String(item.name || ''),
        description: item.description ? String(item.description) : '',
        movieCount: Number(item.movies_count || 0),
        collectionCount: Number(item.collections_count || 0),
        viewCount: Number(item.views_count || 0),
        createTime: this.formatCreatedAt(item.created_at),
      })).filter((item: RelatedListItem) => item.relatedId && item.name);

      const responsePage = this.parsePositiveInteger(
        payload.current_page
          ?? payload.currentPage
          ?? payload.page
          ?? payload.pagination?.current_page
          ?? payload.pagination?.currentPage
          ?? payload.pagination?.page,
        safePage,
      );
      const pageSize = this.parsePositiveInteger(
        payload.per_page
          ?? payload.perPage
          ?? payload.page_size
          ?? payload.pageSize
          ?? payload.limit
          ?? payload.pagination?.per_page
          ?? payload.pagination?.perPage
          ?? payload.pagination?.page_size
          ?? payload.pagination?.pageSize
          ?? payload.pagination?.limit,
        safeLimit,
      );
      const explicitTotalPages = this.parsePositiveInteger(
        payload.total_pages
          ?? payload.totalPages
          ?? payload.last_page
          ?? payload.lastPage
          ?? payload.pagination?.total_pages
          ?? payload.pagination?.totalPages
          ?? payload.pagination?.last_page
          ?? payload.pagination?.lastPage,
        0,
      );
      const totalCount = this.parsePositiveInteger(
        payload.total
          ?? payload.total_count
          ?? payload.totalCount
          ?? payload.pagination?.total
          ?? payload.pagination?.total_count
          ?? payload.pagination?.totalCount,
        0,
      );
      const hasMoreFlag = this.parseOptionalBoolean(
        payload.has_more ?? payload.hasMore ?? payload.pagination?.has_more ?? payload.pagination?.hasMore,
      );
      const totalPages = explicitTotalPages || (totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0);
      const hasMore = typeof hasMoreFlag === 'boolean'
        ? hasMoreFlag
        : totalPages > 0
          ? responsePage < totalPages
          : totalCount > 0
            ? responsePage * pageSize < totalCount
            : mapped.length >= safeLimit;

      return {
        success: true,
        data: mapped,
        page: responsePage,
        totalPages: totalPages || undefined,
        hasMore,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log('[RelatedLists] Error fetching related lists:', error);
      return {
        success: false,
        error: `获取相关清单失败: ${errorMsg}`,
      };
    }
  }

  private static parsePositiveInteger(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }

  private static parseOptionalBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0') return false;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    return undefined;
  }

  private static formatCreatedAt(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value * 1000).toLocaleDateString('zh-CN');
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) {
        return new Date(parsed).toLocaleDateString('zh-CN');
      }
      return value;
    }

    return '';
  }
}

export const relatedListsService = RelatedListsService;

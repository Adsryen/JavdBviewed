import type { VideoRecord } from '../../../types';
import type { ViewedPageParams, ViewedQueryParams } from '../../dbClient';
import type { RecordsAdvancedCondition } from './advancedConditionModel';
import type { RecordsSearchTokens } from './searchQueryModel';

export type RecordsSortOrderBy = 'updatedAt' | 'createdAt' | 'id' | 'title';
export type RecordsSortOrder = 'asc' | 'desc';

export interface RecordsSort {
  orderBy: RecordsSortOrderBy;
  order: RecordsSortOrder;
}

export interface ResolveRecordsListFilterIdsInput {
  selectedListIds: Set<string>;
  parsedListIds: string[];
  parsedListNames: string[];
  listNameById: Map<string, string>;
}

export interface ShouldUseRecordsQueryModeInput {
  searchTerm: string;
  selectedTags: Set<string>;
  selectedListIds: Set<string>;
  parsedTokens: RecordsSearchTokens;
  advancedConditions: RecordsAdvancedCondition[];
  sort: RecordsSort | null;
  favoritesFilterActive: boolean;
}

export interface BuildRecordsViewedQueryParamsInput {
  parsedTokens: RecordsSearchTokens;
  selectedTags: Set<string>;
  selectedListIds: Set<string>;
  listNameById: Map<string, string>;
  status: VideoRecord['status'] | 'all';
  sort: RecordsSort | null;
  offset: number;
  limit: number;
  advancedConditions: RecordsAdvancedCondition[];
  favoritesFilterActive: boolean;
}

export interface BuildRecordsViewedPageParamsInput {
  status: VideoRecord['status'] | 'all';
  sort: RecordsSort;
  offset: number;
  limit: number;
}

export function parseRecordsSortValue(sortValue = 'updatedAt_desc'): RecordsSort | null {
  if (sortValue.startsWith('updatedAt_')) {
    return { orderBy: 'updatedAt', order: sortValue.endsWith('_asc') ? 'asc' : 'desc' };
  }
  if (sortValue.startsWith('createdAt_')) {
    return { orderBy: 'createdAt', order: sortValue.endsWith('_asc') ? 'asc' : 'desc' };
  }
  if (sortValue.startsWith('id_')) {
    return { orderBy: 'id', order: sortValue.endsWith('_asc') ? 'asc' : 'desc' };
  }
  if (sortValue.startsWith('title_')) {
    return { orderBy: 'title', order: sortValue.endsWith('_asc') ? 'asc' : 'desc' };
  }
  return null;
}

export function resolveRecordsListFilterIds(input: ResolveRecordsListFilterIdsInput): string[] {
  const ids = new Set<string>();
  Array.from(input.selectedListIds).forEach((id) => { if (id) ids.add(String(id)); });
  (input.parsedListIds || []).forEach((id) => { if (id) ids.add(String(id)); });

  const nameTokens = (input.parsedListNames || [])
    .map(name => String(name).toLowerCase())
    .filter(Boolean);
  if (nameTokens.length > 0) {
    for (const [id, name] of input.listNameById.entries()) {
      const normalizedName = String(name || '').toLowerCase();
      if (nameTokens.some(token => normalizedName.includes(token))) {
        ids.add(String(id));
      }
    }
  }

  return Array.from(ids);
}

export function shouldUseRecordsQueryMode(input: ShouldUseRecordsQueryModeInput): boolean {
  const parsed = input.parsedTokens;
  return Boolean(
    input.searchTerm ||
    input.selectedTags.size > 0 ||
    input.selectedListIds.size > 0 ||
    input.advancedConditions.length > 0 ||
    parsed.tags.length > 0 ||
    parsed.listIds.length > 0 ||
    parsed.listNames.length > 0 ||
    !input.sort ||
    input.sort.orderBy === 'id' ||
    input.sort.orderBy === 'title' ||
    input.favoritesFilterActive
  );
}

export function buildRecordsViewedQueryParams(input: BuildRecordsViewedQueryParamsInput): ViewedQueryParams {
  const parsed = input.parsedTokens;
  const params: ViewedQueryParams = {
    search: parsed.text || undefined,
    status: input.status,
    tags: Array.from(new Set([...Array.from(input.selectedTags), ...parsed.tags])),
    listIds: resolveRecordsListFilterIds({
      selectedListIds: input.selectedListIds,
      parsedListIds: parsed.listIds,
      parsedListNames: parsed.listNames,
      listNameById: input.listNameById,
    }),
    orderBy: input.sort ? input.sort.orderBy : 'updatedAt',
    order: input.sort ? input.sort.order : 'desc',
    offset: input.offset,
    limit: input.limit,
    adv: input.advancedConditions.map(condition => ({
      field: condition.field,
      op: condition.op,
      value: condition.value,
    })),
  };

  if (input.favoritesFilterActive) {
    params.isFavorite = true;
  }

  return params;
}

export function buildRecordsViewedPageParams(input: BuildRecordsViewedPageParamsInput): ViewedPageParams {
  const orderBy = input.sort.orderBy === 'createdAt' ? 'createdAt' : 'updatedAt';
  const params: ViewedPageParams = {
    offset: input.offset,
    limit: input.limit,
    orderBy,
    order: input.sort.order,
  };
  if (input.status !== 'all') {
    params.status = input.status;
  }
  return params;
}

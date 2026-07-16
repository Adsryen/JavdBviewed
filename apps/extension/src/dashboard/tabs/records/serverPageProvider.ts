import type { VideoRecord } from '../../../types';
import type { ViewedPageParams, ViewedQueryParams } from '../../dbClient';
import type { RecordsAdvancedCondition } from './advancedConditionModel';
import {
  buildRecordsViewedPageParams,
  buildRecordsViewedQueryParams,
  shouldUseRecordsQueryMode,
  type RecordsSort,
} from './queryModel';
import { parseRecordsSearchTokens } from './searchQueryModel';

export interface LoadRecordsServerPageInput {
  currentPage: number;
  recordsPerPage: number;
  searchText: string;
  status: VideoRecord['status'] | 'all';
  sort: RecordsSort | null;
  selectedTags: Set<string>;
  selectedListIds: Set<string>;
  listNameById: Map<string, string>;
  advancedConditions: RecordsAdvancedCondition[];
  favoritesFilterActive: boolean;
  queryRecords: (params: ViewedQueryParams) => Promise<{ items?: VideoRecord[]; total?: number }>;
  pageRecords: (params: ViewedPageParams) => Promise<{ items?: VideoRecord[]; total?: number }>;
  now?: () => number;
}

export interface LoadRecordsServerPageResult {
  items: VideoRecord[];
  total: number;
  durationMs: number;
}

export async function loadRecordsServerPage(input: LoadRecordsServerPageInput): Promise<LoadRecordsServerPageResult> {
  const now = input.now || (() => performance.now());
  const queryStart = now();
  const parsed = parseRecordsSearchTokens(input.searchText);
  const searchTerm = parsed.text;
  const offset = (input.currentPage - 1) * input.recordsPerPage;

  let response: { items?: VideoRecord[]; total?: number };
  if (shouldUseRecordsQueryMode({
    searchTerm,
    selectedTags: input.selectedTags,
    selectedListIds: input.selectedListIds,
    parsedTokens: parsed,
    advancedConditions: input.advancedConditions,
    sort: input.sort,
    favoritesFilterActive: input.favoritesFilterActive,
  })) {
    response = await input.queryRecords(buildRecordsViewedQueryParams({
      parsedTokens: parsed,
      selectedTags: input.selectedTags,
      selectedListIds: input.selectedListIds,
      listNameById: input.listNameById,
      status: input.status,
      sort: input.sort,
      offset,
      limit: input.recordsPerPage,
      advancedConditions: input.advancedConditions,
      favoritesFilterActive: input.favoritesFilterActive,
    }));
  } else {
    response = await input.pageRecords(buildRecordsViewedPageParams({
      status: input.status,
      sort: input.sort!,
      offset,
      limit: input.recordsPerPage,
    }));
  }

  return {
    items: Array.isArray(response.items) ? response.items : [],
    total: Number.isFinite(response.total) ? Number(response.total) : 0,
    durationMs: now() - queryStart,
  };
}

import type { VideoRecord } from '../../../types';
import type { ViewedQueryParams } from '../../dbClient';
import type { RecordsAdvancedCondition } from './advancedConditionModel';
import { buildRecordsViewedQueryParams, type RecordsSort } from './queryModel';
import { parseRecordsSearchTokens } from './searchQueryModel';

export interface GetRecordsForExportDataInput {
  serverModeActive: boolean;
  filteredRecords: VideoRecord[];
  searchText: string;
  status: VideoRecord['status'] | 'all';
  sort: RecordsSort | null;
  selectedTags: Set<string>;
  selectedListIds: Set<string>;
  listNameById: Map<string, string>;
  advancedConditions: RecordsAdvancedCondition[];
  queryRecords: (params: ViewedQueryParams) => Promise<{ items?: VideoRecord[]; total?: number }>;
  showProgress: (title: string, total: number) => HTMLElement | null;
  hideProgress: (modal: HTMLElement | null) => void;
}

export async function getRecordsForExportData(input: GetRecordsForExportDataInput): Promise<VideoRecord[]> {
  if (!input.serverModeActive) {
    return input.filteredRecords;
  }

  const progressModal = input.showProgress('正在准备导出数据...', 1);
  try {
    const parsed = parseRecordsSearchTokens(input.searchText);
    const queryParams = buildRecordsViewedQueryParams({
      parsedTokens: parsed,
      selectedTags: input.selectedTags,
      selectedListIds: input.selectedListIds,
      listNameById: input.listNameById,
      status: input.status,
      sort: input.sort,
      offset: 0,
      limit: 999999,
      advancedConditions: input.advancedConditions,
      favoritesFilterActive: false,
    });

    const response = await input.queryRecords(queryParams);
    return response.items || [];
  } finally {
    input.hideProgress(progressModal);
  }
}

import type { VideoRecord } from '../../../types';
import type { ViewedQueryParams } from '../../dbClient';
import type { RecordsAdvancedCondition } from './advancedConditionModel';
import type { RecordsSort } from './queryModel';
import type { RecordsExportController } from './exportController';
import {
  getRecordsForExportData,
  type GetRecordsForExportDataInput,
} from './exportDataProvider';

type StatusFilter = VideoRecord['status'] | 'all';

export interface CreateRecordsExportRuntimeOptions {
  isServerModeActive: () => boolean;
  getFilteredRecords: () => VideoRecord[];
  getSearchText: () => string;
  getStatus: () => StatusFilter;
  getSort: () => RecordsSort | null;
  selectedTags: Set<string>;
  selectedListIds: Set<string>;
  listNameById: Map<string, string>;
  getAdvancedConditions: () => RecordsAdvancedCondition[];
  queryRecords: (params: ViewedQueryParams) => Promise<{ items?: VideoRecord[]; total?: number }>;
  showProgress: (title: string, total: number) => HTMLElement | null;
  hideProgress: (modal: HTMLElement | null) => void;
  exportController: RecordsExportController;
  getExportData?: (input: GetRecordsForExportDataInput) => Promise<VideoRecord[]>;
}

export interface RecordsExportRuntime {
  handleExportRecords: () => Promise<void>;
  getRecordsForExport: () => Promise<VideoRecord[]>;
}

export function createRecordsExportRuntime(options: CreateRecordsExportRuntimeOptions): RecordsExportRuntime {
  const getExportData = options.getExportData || getRecordsForExportData;

  const getRecordsForExport = async (): Promise<VideoRecord[]> => {
    const serverModeActive = options.isServerModeActive();
    const filteredRecords = options.getFilteredRecords();
    if (!serverModeActive) return filteredRecords;

    return getExportData({
      serverModeActive,
      filteredRecords,
      searchText: options.getSearchText(),
      status: options.getStatus(),
      sort: options.getSort(),
      selectedTags: options.selectedTags,
      selectedListIds: options.selectedListIds,
      listNameById: options.listNameById,
      advancedConditions: options.getAdvancedConditions(),
      queryRecords: options.queryRecords,
      showProgress: options.showProgress,
      hideProgress: options.hideProgress,
    });
  };

  return {
    handleExportRecords: () => options.exportController.handleExportRecords(),
    getRecordsForExport,
  };
}

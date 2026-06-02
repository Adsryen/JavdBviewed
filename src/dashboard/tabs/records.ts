import { STATE } from '../state';
import { VIDEO_STATUS, STORAGE_KEYS } from '../../utils/config';
import type { VideoRecord, VideoStatus } from '../../types';
import { showMessage } from '../ui/toast';
import { showConfirmationModal } from '../ui/modal';
import { dbViewedPage, dbViewedStats, dbViewedDelete, dbViewedBulkDelete, dbViewedQuery, dbViewedPut } from '../dbClient';
import { dbListsGetAllNormalized, dbViewedPatchList, dbViewedBulkPatchList } from '../dbClient';
import {
    parseRecordsSearchTokens,
} from './records/searchQueryModel';
import { createRecordsCoverRuntimeController } from './records/coverRuntimeController';
import { createRecordsAdvancedConditionsController } from './records/advancedConditionsController';
import { createRecordsViewToolbarController } from './records/viewToolbarController';
import { createRecordsBatchSelectionController } from './records/batchSelectionController';
import { createRecordsExportController } from './records/exportController';
import { createRecordsSearchSuggestController } from './records/searchSuggestController';
import { createRecordsStatsController } from './records/statsController';
import { createRecordsListMetaController } from './records/listMetaController';
import { createRecordsSearchResultCountController } from './records/searchResultCountController';
import { createRecordsRenderCoordinator } from './records/renderCoordinator';
import { bindAdvancedSearchToggleDelegation } from './records/advancedSearchToggleBinding';
import { collectRecordsPageElements, ensureUntrackedStatusOption } from './records/pageElements';
import { refreshRecordsSingleRecord } from './records/refreshRecordService';
import { hideRecordsProgressModal, showRecordsProgressModal } from './records/progressModalController';
import { createRecordsQueryRuntime, type RecordsQueryRuntime } from './records/queryRuntime';
import { createRecordsStateRefreshController, type RecordsStateRefreshController } from './records/stateRefreshController';
import { createRecordsItemActionsRuntime } from './records/itemActionsRuntime';
import { createRecordsBatchOperationsRuntime, type RecordsBatchOperationsRuntime } from './records/batchOperationsRuntime';
import { createRecordsFilterRuntime, type RecordsFilterRuntime } from './records/filterRuntime';
import { createRecordsViewRuntime, type RecordsViewRuntime } from './records/viewRuntime';
import { createRecordsLifecycleRuntime } from './records/lifecycleRuntime';
import { type RecordsAdvancedCondition as AdvCondition } from './records/advancedConditionModel';

// 防重复初始化（避免多次绑定事件导致重复行为）
let RECORDS_TAB_INITIALIZED = false;

export function initRecordsTab(): void {
    if (RECORDS_TAB_INITIALIZED) {
        console.warn('[RecordsTab] initRecordsTab() called more than once, skipping re-init');
        return;
    }
    RECORDS_TAB_INITIALIZED = true;
    const pageElements = collectRecordsPageElements();
    const {
        searchInput,
        filterSelect,
        sortSelect,
        videoList,
        paginationContainer,
        recordsPerPageSelect,
        searchResultCount,
    } = pageElements.required;
    ensureUntrackedStatusOption(filterSelect, {
        untracked: VIDEO_STATUS.UNTRACKED,
        viewed: VIDEO_STATUS.VIEWED,
    });

    const {
        advConditionsEl,
        quickTimeField,
        quickTimeValue,
        quickTimeUnit,
    } = pageElements.advanced;
    const searchSuggest = pageElements.searchSuggest;
    const {
        batchOperations,
        selectAllCheckbox,
        selectedCount,
        batchActionsBtn,
        batchActionsDropdown,
        batchModifyListBtn,
        batchAddTagBtn,
        batchRefreshBtn,
        batchDeleteBtn,
        cancelBatchBtn,
    } = pageElements.batch;
    const {
        toggleCoversBtn,
        toggleViewModeBtn,
        myFavoritesBtn,
    } = pageElements.toolbar;
    let currentViewMode: 'list' | 'card' = STATE.settings.recordsViewMode || 'list'; // 从设置中读取，默认列表视图
    let favoritesFilterActive = false;

    const coverRuntimeController = createRecordsCoverRuntimeController({
        fallbackUrl: chrome.runtime.getURL('assets/alternate-search.png'),
    });

    // 选择状态
    let selectedRecords = new Set<string>();

    // Tags filter state
    let selectedTags = new Set<string>();
    // 由搜索输入解析出的标签（自动同步到 selectedTags）
    let tokenSelectedTags = new Set<string>();
    let allTags = new Set<string>();
    let allTagsStale = true;

    let selectedListIds = new Set<string>();
    let tokenSelectedListIds = new Set<string>();

    let selectedSeriesIds = new Set<string>();
    let tokenSelectedSeriesIds = new Set<string>();
    let selectedLabelIds = new Set<string>();
    let tokenSelectedLabelIds = new Set<string>();

    const listMetaController = createRecordsListMetaController({
        loadLists: dbListsGetAllNormalized,
        shouldRenderAfterLoad: () => {
            try {
                const hasAnyLists = (Array.isArray(STATE.records) ? STATE.records : [])
                    .some((record: any) => Array.isArray(record?.listIds) && record.listIds.length > 0);
                return hasAnyLists || selectedSeriesIds.size > 0 || selectedLabelIds.size > 0;
            } catch {
                return false;
            }
        },
        onAfterLoaded: () => render(),
    });
    const {
        listIdToName,
        listIdToSource,
        seriesIdToName,
        labelIdToName,
        seriesIdToRecord,
        labelIdToRecord,
    } = listMetaController.maps;
    const ensureListMetaLoaded = () => {
        void listMetaController.ensureLoaded();
    };

    const escapeHtml = (s: string) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // ---------- 搜索框 tag 自动补全 ----------
    // 简单防抖实现
    function debounce<F extends (...args: any[]) => void>(fn: F, wait = 150) {
        let t: number | undefined;
        return (...args: Parameters<F>) => {
            if (t) window.clearTimeout(t);
            t = window.setTimeout(() => fn(...args), wait);
        };
    }
    function ensureAllTagsCollected() {
        try { if (allTagsStale) { collectAllTags(); allTagsStale = false; } } catch {}
    }

    // 解析搜索文本中的标签前缀，如：tag:素人  或  #无码
    const parseSearchTokens = parseRecordsSearchTokens;

    // 立即初始化 Tooltip 容器
    coverRuntimeController.ensureTooltipElement();

    // 高级搜索按钮 - 事件委托兜底（避免早期返回导致监听未绑定）
    bindAdvancedSearchToggleDelegation();

    // Advanced search state
    let advConditions: AdvCondition[] = [];

    // 已移除：高级搜索方案相关逻辑（保存/载入/删除）

    // 已移除：rebuildAdvRows（方案功能去除后不再需要）

    if (!searchInput || !videoList || !sortSelect || !recordsPerPageSelect || !paginationContainer) return;

    let currentPage = 1;
    let recordsPerPage = STATE.settings.recordsPerPage || 10;
    let filteredRecords: VideoRecord[] = [];
    // IDB 分页模式
    let serverModeActive = false;
    let serverPageItems: VideoRecord[] = [];
    let serverTotal = 0;
    let lastQueryDurationMs: number | null = null;
    let viewRuntime: RecordsViewRuntime;
    let queryRuntime: RecordsQueryRuntime;
    let stateRefreshController: RecordsStateRefreshController;
    let filterRuntime: RecordsFilterRuntime;
    let batchOperationsRuntime: RecordsBatchOperationsRuntime;
    const searchResultCountController = createRecordsSearchResultCountController({
        container: searchResultCount,
        searchInput,
        filterSelect,
        getTotalCount: () => serverModeActive ? serverTotal : filteredRecords.length,
        getDurationMs: () => lastQueryDurationMs,
        getSelectedTagsCount: () => selectedTags.size,
        getSelectedListIdsCount: () => selectedListIds.size,
        getSelectedSeriesIdsCount: () => selectedSeriesIds.size,
        getSelectedLabelIdsCount: () => selectedLabelIds.size,
        getAdvancedConditionsCount: () => advConditions.length,
    });
    const updateSearchResultCount = () => searchResultCountController.update();
    const exportController = createRecordsExportController({
        getExportCountText: () => filteredRecords.length > 0
            ? `当前筛选条件下共 ${filteredRecords.length} 条记录`
            : `共 ${STATE.records.length} 条记录`,
        getRecords: async () => viewRuntime.getRecordsForExport(),
        getListName: (listId) => listIdToName.get(String(listId)) || String(listId),
        showMessage,
    });
    const itemActionsController = createRecordsItemActionsRuntime({
        getRecords: () => STATE.records,
        selectedRecords,
        saveRecord: dbViewedPut,
        deleteRecord: dbViewedDelete,
        sendRuntimeMessage: (message) => chrome.runtime.sendMessage(message),
        showMessage,
        showConfirmationModal,
        videoStatus: VIDEO_STATUS,
        updateFilteredRecords,
        render,
        isFavoritesFilterActive: () => favoritesFilterActive,
    });
    const searchSuggestController = createRecordsSearchSuggestController({
        input: searchInput,
        suggest: searchSuggest,
        getTags: () => allTags,
        ensureTagsLoaded: ensureAllTagsCollected,
        onApply: () => {
            stateRefreshController.resetAndRender();
        },
    });
    const advancedConditionsController = createRecordsAdvancedConditionsController({
        container: advConditionsEl,
        quickTimeField,
        quickTimeValue,
        quickTimeUnit,
        quickTimePreview: document.getElementById('quickTimePreview') as HTMLSpanElement,
        getConditions: () => advConditions,
        setConditions: (conditions) => {
            advConditions = conditions;
        },
        onConditionsChange: () => {
            stateRefreshController.resetAndRender();
        },
        showMessage,
    });
    const statsController = createRecordsStatsController({
        container: document.getElementById('recordsStatsContainer'),
        searchInput,
        filterSelect,
        selectedTags,
        tokenSelectedTags,
        selectedListIds,
        tokenSelectedListIds,
        refreshTagsFilter: () => tagsFilterController.refresh(),
        refreshListsFilter: () => {
            try { listsFilterController.refresh(); } catch {}
        },
        setAdvancedConditions: (conditions) => {
            advConditions = conditions;
        },
        renderAdvancedConditions: () => advancedConditionsController.renderConditions(),
        onFilterApplied: () => {
            stateRefreshController.resetAndRender();
        },
        getRecords: () => STATE.records,
        isServerModeActive: () => serverModeActive,
        loadServerStats: dbViewedStats,
    });
    const batchSelectionController = createRecordsBatchSelectionController({
        batchOperations,
        selectAllCheckbox,
        selectedCount,
        batchActionsBtn,
        selectedRecords,
        getCurrentRecords: () => (
            serverModeActive
                ? serverPageItems
                : filteredRecords.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage)
        ),
        onRender: () => render(),
    });
    batchOperationsRuntime = createRecordsBatchOperationsRuntime({
        selectedRecords,
        getVisibleRecords: () => (serverModeActive ? serverPageItems : filteredRecords),
        loadLists: dbListsGetAllNormalized,
        patchList: dbViewedPatchList,
        bulkPatchList: dbViewedBulkPatchList,
        showMessage,
        render,
        escapeHtml,
        getSelectedIds: () => Array.from(selectedRecords),
        refreshRecord: (recordId) => refreshRecordsSingleRecord(recordId, (message, callback) => {
            chrome.runtime.sendMessage(message, callback);
        }),
        deleteRecords: async (selectedIds) => {
            await dbViewedBulkDelete(selectedIds);
            const idSet = new Set(selectedIds);
            STATE.records = Array.isArray(STATE.records)
                ? STATE.records.filter(record => !idSet.has(record.id))
                : [];
        },
        clearSelection: () => {
            selectedRecords.clear();
        },
        afterMutation: () => {
            stateRefreshController.refreshAndRenderBatch();
        },
        toolbarElements: {
            selectAllCheckbox,
            batchActionsBtn,
            batchActionsDropdown,
            batchModifyListBtn,
            batchAddTagBtn,
            batchRefreshBtn,
            batchDeleteBtn,
            cancelBatchBtn,
        },
        onSelectAll: () => batchSelectionController.handleSelectAll(),
        onClearSelection: () => batchSelectionController.clearAllSelection(),
        getRecordById: async (id) => {
            const { dbViewedGet } = await import('../dbClient');
            return dbViewedGet(id);
        },
        putRecord: dbViewedPut,
    });
    const viewToolbarController = createRecordsViewToolbarController({
        toggleCoversBtn,
        toggleViewModeBtn,
        favoritesButton: myFavoritesBtn,
        videoList,
        getCoversEnabled: () => !!STATE.settings.showCoversInRecords,
        setCoversEnabled: (enabled) => {
            STATE.settings.showCoversInRecords = enabled;
        },
        getViewMode: () => currentViewMode,
        setViewMode: (mode) => {
            currentViewMode = mode;
            STATE.settings.recordsViewMode = mode;
        },
        getFavoritesActive: () => favoritesFilterActive,
        setFavoritesActive: (active) => {
            favoritesFilterActive = active;
        },
        persistSettings: () => {
            chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: STATE.settings });
        },
        onFilterChanged: () => {
            stateRefreshController.resetAndRender();
        },
        onRender: () => render(),
    });
    recordsPerPageSelect.value = String(recordsPerPage);

    function updateFilteredRecords() {
        filterRuntime.updateFilteredRecords();
    }

    function renderVideoList() {
        viewRuntime.renderVideoList();
    }

    function renderPagination() {
        viewRuntime.renderPagination();
    }

    async function updateStats() {
        await statsController.updateStats();
    }

    queryRuntime = createRecordsQueryRuntime({
        searchInput,
        filterSelect,
        sortSelect,
        videoList,
        getCurrentPage: () => currentPage,
        getRecordsPerPage: () => recordsPerPage,
        selectedTags,
        selectedListIds,
        selectedSeriesIds,
        selectedLabelIds,
        listNameById: listIdToName,
        getAdvancedConditions: () => advConditions,
        isFavoritesFilterActive: () => favoritesFilterActive,
        queryRecords: dbViewedQuery,
        pageRecords: dbViewedPage,
        setServerModeActive: (active) => {
            serverModeActive = active;
        },
        setServerPageItems: (items) => {
            serverPageItems = items;
        },
        setServerTotal: (total) => {
            serverTotal = total;
        },
        setLastQueryDurationMs: (duration) => {
            lastQueryDurationMs = duration;
        },
        renderVideoList,
        renderPagination,
        updateSearchResultCount,
        showMessage,
    });

    const renderCoordinator = createRecordsRenderCoordinator({
        videoList,
        shouldUseIDB: queryRuntime.shouldUseIDB,
        setServerModeActive: (active) => {
            serverModeActive = active;
        },
        renderServerPage: queryRuntime.renderServerPage,
        updateFilteredRecords,
        renderVideoList,
        renderPagination,
        updateStats,
    });

    function render() {
        renderCoordinator.render();
    }

    stateRefreshController = createRecordsStateRefreshController({
        resetCurrentPage: () => {
            currentPage = 1;
        },
        updateFilteredRecords,
        render,
        updateBatchUI,
    });

    function collectAllTags() {
        allTags.clear();
        STATE.records.forEach(record => {
            if (record.tags && Array.isArray(record.tags)) {
                record.tags.forEach(tag => allTags.add(tag));
            }
        });
    }

    const handleFilterSelectionChanged = () => {
        stateRefreshController.resetAndRender();
    };

    filterRuntime = createRecordsFilterRuntime({
        elements: {
            searchInput,
            filterSelect,
            sortSelect,
            filters: pageElements.filters,
        },
        getRecords: () => STATE.records,
        selectedTags,
        selectedListIds,
        selectedSeriesIds,
        selectedLabelIds,
        getTokenSelectedTags: () => tokenSelectedTags,
        setTokenSelectedTags: (value) => {
            tokenSelectedTags = value;
        },
        getTokenSelectedListIds: () => tokenSelectedListIds,
        setTokenSelectedListIds: (value) => {
            tokenSelectedListIds = value;
        },
        getTokenSelectedSeriesIds: () => tokenSelectedSeriesIds,
        setTokenSelectedSeriesIds: (value) => {
            tokenSelectedSeriesIds = value;
        },
        getTokenSelectedLabelIds: () => tokenSelectedLabelIds,
        setTokenSelectedLabelIds: (value) => {
            tokenSelectedLabelIds = value;
        },
        getAllTags: () => {
            collectAllTags();
            return Array.from(allTags).map(String);
        },
        listNameById: listIdToName,
        listSourceById: listIdToSource,
        seriesNameById: seriesIdToName,
        labelNameById: labelIdToName,
        seriesIdToRecord,
        labelIdToRecord,
        ensureListMetaLoaded,
        getAdvancedConditions: () => advConditions,
        isFavoritesFilterActive: () => favoritesFilterActive,
        setFilteredRecords: (records) => {
            filteredRecords = records;
        },
        onFilterChanged: handleFilterSelectionChanged,
        escapeHtml,
    });
    const syncDropdownBackdrop = filterRuntime.syncDropdownBackdrop;
    const filterControllers = filterRuntime.filterControllers;
    const tagsFilterController = filterControllers.tags;
    const listsFilterController = filterControllers.lists;
    const seriesFilterController = filterControllers.series;
    const labelsFilterController = filterControllers.labels;
    viewRuntime = createRecordsViewRuntime({
        videoList,
        paginationContainer,
        getSourceRecords: () => serverModeActive ? serverPageItems : (Array.isArray(filteredRecords) ? filteredRecords : []),
        isServerModeActive: () => serverModeActive,
        getServerTotal: () => serverTotal,
        getFilteredCount: () => filteredRecords.length,
        getCurrentPage: () => currentPage,
        setCurrentPage: (page) => {
            currentPage = page;
        },
        getRecordsPerPage: () => recordsPerPage,
        getViewMode: () => currentViewMode,
        getCoversEnabled: () => !!STATE.settings.showCoversInRecords,
        coverRuntime: coverRuntimeController,
        updateSearchResultCount,
        ensureListMetaLoaded,
        selectedRecordIds: selectedRecords,
        selectedTags,
        selectedListIds,
        listNameById: listIdToName,
        getSearchEngines: () => Array.isArray(STATE.settings?.searchEngines) ? STATE.settings.searchEngines : [],
        fallbackIconUrl: chrome.runtime.getURL('assets/alternate-search.png'),
        escapeHtml,
        onToggleRecordSelection: handleRecordSelection,
        onFilterChanged: handleFilterSelectionChanged,
        refreshTags: () => tagsFilterController.refresh(),
        refreshLists: () => listsFilterController.refresh(),
        actionCallbacks: {
            onToggleFavorite: itemActionsController.onToggleFavorite,
            onEdit: itemActionsController.onEdit,
            onRefresh: itemActionsController.onRefresh,
            onDelete: itemActionsController.onDelete,
            onOpenListPicker: (targetRecord) => {
                batchOperationsRuntime.listPickerRuntime.openSingle(targetRecord);
            },
        },
        onRenderRecordError: (error, record) => {
            if (record?.id) {
                console.error('[Records] 渲染记录项时出错:', error, record);
                return;
            }
            console.error('[Records] 渲染视频列表时出错:', error);
        },
        getFilteredRecords: () => filteredRecords,
        getSearchText: () => (searchInput?.value || '').trim(),
        getStatus: () => (filterSelect?.value || 'all') as 'all' | VideoStatus,
        getSort: () => queryRuntime.parseSort(),
        getAdvancedConditions: () => advConditions,
        queryRecords: dbViewedQuery,
        showProgress: showRecordsProgressModal,
        hideProgress: hideRecordsProgressModal,
        exportController,
        renderPage: () => {
            render();
        },
    });
    // 已移除：精确查询事件监听器

    // Advanced search 切换使用文档级事件委托（见前文注入），此处不再重复绑定

    // 已移除：高级搜索方案事件绑定（保存/载入/删除）

    // 已移除：初始化预置下拉

    const triggerSuggest = searchSuggestController.createDebouncedUpdate();
    const triggerFilter = debounce(() => stateRefreshController.resetAndRender(), 150);

    createRecordsLifecycleRuntime({
        pageElements,
        getRecordsPerPage: () => recordsPerPage,
        setRecordsPerPage: (value) => {
            recordsPerPage = value;
            STATE.settings.recordsPerPage = value;
        },
        persistRecordsPerPage: () => {
            chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: STATE.settings });
        },
        resetCurrentPage: () => {
            currentPage = 1;
        },
        updateFilteredRecords,
        render,
        syncDropdownBackdrop,
        triggerSuggest,
        triggerFilter,
        viewToolbar: viewToolbarController,
        batchToolbar: batchOperationsRuntime.batchToolbarController,
        searchSuggest: searchSuggestController,
        filters: {
            tags: tagsFilterController,
            lists: listsFilterController,
            series: seriesFilterController,
            labels: labelsFilterController,
        },
        advancedConditions: advancedConditionsController,
        addAdvancedCondition: (condition) => {
            advConditions.push(condition);
        },
        setAdvancedConditions: (conditions) => {
            advConditions = conditions;
        },
        listPickerRuntime: batchOperationsRuntime.listPickerRuntime,
        coverRuntime: coverRuntimeController,
        handleExportRecords: () => viewRuntime.handleExportRecords(),
        updateBatchUI,
        debounce,
    }).bind();

    function handleRecordSelection(recordId: string, isSelected: boolean) {
        batchSelectionController.handleRecordSelection(recordId, isSelected);
    }

    function updateBatchUI() {
        batchSelectionController.updateBatchUI();
    }

}

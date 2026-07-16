import type { VideoRecord } from '../../../types';

export interface RenderRecordsListOptions {
  videoList: HTMLUListElement;
  sourceRecords: VideoRecord[];
  serverModeActive: boolean;
  currentPage: number;
  recordsPerPage: number;
  viewMode: 'list' | 'card';
  coversEnabled: boolean;
  setupCoverObserver: () => void;
  teardownCoverObserver: () => void;
  updateSearchResultCount: () => void;
  ensureListMetaLoaded: () => void;
  createItemElement: (record: VideoRecord) => HTMLLIElement;
  onRenderRecordError?: (error: unknown, record: VideoRecord) => void;
}

function sliceRecords(records: VideoRecord[], serverModeActive: boolean, currentPage: number, recordsPerPage: number): VideoRecord[] {
  if (serverModeActive) return records;
  const startIndex = (currentPage - 1) * recordsPerPage;
  return records.slice(startIndex, startIndex + recordsPerPage);
}

export function renderRecordsList(options: RenderRecordsListOptions): void {
  try {
    options.videoList.innerHTML = '';
    options.ensureListMetaLoaded();

    const sourceRecords = Array.isArray(options.sourceRecords) ? options.sourceRecords : [];
    const shouldShowCover = options.viewMode === 'card' || options.coversEnabled;
    if (shouldShowCover) options.setupCoverObserver(); else options.teardownCoverObserver();

    options.updateSearchResultCount();

    if (sourceRecords.length === 0) {
      options.videoList.innerHTML = '<li class="empty-list">没有符合条件的记录。</li>';
      return;
    }

    const recordsToRender = sliceRecords(sourceRecords, options.serverModeActive, options.currentPage, options.recordsPerPage);
    if (!Array.isArray(recordsToRender)) return;

    recordsToRender.forEach((record) => {
      try {
        if (!record || typeof record !== 'object') return;

        const li = options.createItemElement(record);
        options.videoList.appendChild(li);
      } catch (error) {
        options.onRenderRecordError?.(error, record);
      }
    });
  } catch (error) {
    options.videoList.innerHTML = '<li class="empty-list error">渲染列表时出现错误，请刷新重试。</li>';
    options.onRenderRecordError?.(error, { id: '', title: '', status: 'browsed' } as VideoRecord);
  }
}

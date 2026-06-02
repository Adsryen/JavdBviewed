import type { ListRecord } from '../../../types';
import {
  getCollectionExternalId,
  isVideoListRecord,
} from '../../../shared/utils/listRecordHelpers';

export interface RecordsListMetaMaps {
  listIdToName: Map<string, string>;
  listIdToSource: Map<string, string>;
  seriesIdToName: Map<string, string>;
  labelIdToName: Map<string, string>;
  seriesIdToRecord: Map<string, ListRecord>;
  labelIdToRecord: Map<string, ListRecord>;
}

export interface CreateRecordsListMetaControllerOptions {
  loadLists: () => Promise<ListRecord[]>;
  shouldRenderAfterLoad: () => boolean;
  onAfterLoaded: () => void;
}

export interface RecordsListMetaController {
  maps: RecordsListMetaMaps;
  ensureLoaded: () => Promise<void>;
  isLoaded: () => boolean;
  isLoading: () => boolean;
}

function createMaps(): RecordsListMetaMaps {
  return {
    listIdToName: new Map<string, string>(),
    listIdToSource: new Map<string, string>(),
    seriesIdToName: new Map<string, string>(),
    labelIdToName: new Map<string, string>(),
    seriesIdToRecord: new Map<string, ListRecord>(),
    labelIdToRecord: new Map<string, ListRecord>(),
  };
}

function clearMaps(maps: RecordsListMetaMaps): void {
  maps.listIdToName.clear();
  maps.listIdToSource.clear();
  maps.seriesIdToName.clear();
  maps.labelIdToName.clear();
  maps.seriesIdToRecord.clear();
  maps.labelIdToRecord.clear();
}

function applyListRecord(maps: RecordsListMetaMaps, record: ListRecord): void {
  if (!record?.id) return;

  if (record.type === 'series') {
    const externalId = getCollectionExternalId(record);
    maps.seriesIdToName.set(externalId, String(record.name || externalId));
    maps.seriesIdToRecord.set(externalId, record);
    return;
  }

  if (record.type === 'label') {
    const externalId = getCollectionExternalId(record);
    maps.labelIdToName.set(externalId, String(record.name || externalId));
    maps.labelIdToRecord.set(externalId, record);
    return;
  }

  if (isVideoListRecord(record)) {
    maps.listIdToName.set(String(record.id), String(record.name || record.id));
    maps.listIdToSource.set(String(record.id), String(record.source || 'javdb'));
  }
}

export function createRecordsListMetaController(
  options: CreateRecordsListMetaControllerOptions,
): RecordsListMetaController {
  const maps = createMaps();
  let loaded = false;
  let loadingPromise: Promise<void> | null = null;

  const ensureLoaded = async (): Promise<void> => {
    if (loaded) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = options.loadLists()
      .then((lists) => {
        clearMaps(maps);
        (lists || []).forEach(record => applyListRecord(maps, record));
        loaded = true;
      })
      .catch(() => {
        loaded = true;
      })
      .finally(() => {
        loadingPromise = null;
        if (options.shouldRenderAfterLoad()) {
          options.onAfterLoaded();
        }
      });

    return loadingPromise;
  };

  return {
    maps,
    ensureLoaded,
    isLoaded: () => loaded,
    isLoading: () => Boolean(loadingPromise),
  };
}

import { STORAGE_KEYS } from '../../utils/config';
import {
  viewedGetAll as defaultViewedGetAll,
  viewedTagIndexGetAll as defaultViewedTagIndexGetAll,
} from '../../platform/storage/indexedDb';
import {
  buildViewedRecordSourceFromTagIndexRows,
  buildViewedTagStatsFromSources,
} from '../../features/records/tagStats';

type SendResponse = (response: any) => void;

const storageChunkPrefixFor = (key: string) => `__chunk__:${key}::`;
const storageChunkMetaFor = (key: string) => `__chunks_meta__:${key}`;

export async function getLegacyViewedRecordsFromStorage(): Promise<Record<string, unknown>> {
  const key = STORAGE_KEYS.VIEWED_RECORDS;
  const prefix = storageChunkPrefixFor(key);
  const metaKey = storageChunkMetaFor(key);
  const metaResult = await chrome.storage.local.get([metaKey]) as Record<string, any>;
  const meta = metaResult?.[metaKey];

  if (meta && typeof meta.chunks === 'number') {
    const count = Math.max(0, Number(meta.chunks || 0));
    if (count <= 0) return {};
    const chunkKeys = Array.from({ length: count }, (_value, index) => `${prefix}${index + 1}`);
    const chunks = await chrome.storage.local.get(chunkKeys) as Record<string, any>;
    const records: Record<string, unknown> = {};
    for (const chunkKey of chunkKeys) {
      const chunk = chunks?.[chunkKey];
      if (chunk && typeof chunk === 'object') Object.assign(records, chunk);
    }
    return records;
  }

  const direct = await chrome.storage.local.get([key]) as Record<string, any>;
  const value = direct?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export interface GetAllTagsDependencies {
  viewedGetAll?: typeof defaultViewedGetAll;
  viewedTagIndexGetAll?: typeof defaultViewedTagIndexGetAll;
  getLegacyViewedRecords?: () => Promise<Record<string, unknown>>;
}

export async function handleGetAllTags(
  message: any,
  sendResponse: SendResponse,
  deps: GetAllTagsDependencies = {},
): Promise<void> {
  const viewedGetAll = deps.viewedGetAll ?? defaultViewedGetAll;
  const viewedTagIndexGetAll = deps.viewedTagIndexGetAll ?? defaultViewedTagIndexGetAll;
  const getLegacyViewedRecords = deps.getLegacyViewedRecords ?? getLegacyViewedRecordsFromStorage;

  const limit = Number(message?.payload?.limit ?? 50);
  try {
    const [idbRecords, tagIndexRows, legacyRecords] = await Promise.all([
      viewedGetAll().catch(() => []),
      viewedTagIndexGetAll().catch(() => []),
      getLegacyViewedRecords().catch(() => ({})),
    ]);
    const tagIndexRecords = buildViewedRecordSourceFromTagIndexRows(tagIndexRows);
    const tags = buildViewedTagStatsFromSources([idbRecords, tagIndexRecords, legacyRecords], limit);
    sendResponse({ success: true, tags });
  } catch (error: any) {
    sendResponse({ success: false, error: error?.message || 'get tags failed', tags: [] });
  }
}

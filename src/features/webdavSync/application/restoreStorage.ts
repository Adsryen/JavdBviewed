import type { WebDAVClientLog } from '../infrastructure/webdavClient';

export const RESTORE_BATCH_SIZE = 1000;

export function chunk<T>(arr: T[], size: number): T[][] {
  if (!Array.isArray(arr) || size <= 0) return [arr as any];
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

export function toArrayFromObjMap<T = any>(maybeMap: any): T[] {
  if (!maybeMap) return [];
  if (Array.isArray(maybeMap)) return maybeMap as T[];
  if (typeof maybeMap === 'object') return Object.values(maybeMap) as T[];
  return [];
}

export async function clearStore(db: any, storeName: string, logger?: WebDAVClientLog): Promise<void> {
  try {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    await tx.complete;
    logger?.('DEBUG', `Store cleared successfully: ${storeName}`);
  } catch (error: any) {
    logger?.('ERROR', `Failed to clear store: ${storeName}`, { error: error.message });
    throw error;
  }
}

export async function putRecordsInBatches(
  db: any,
  storeName: string,
  records: any[],
  batchSize = RESTORE_BATCH_SIZE,
  logger?: WebDAVClientLog,
): Promise<number> {
  if (!Array.isArray(records) || records.length === 0) return 0;
  let written = 0;

  for (const part of chunk(records, batchSize)) {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const putPromises = part.map(record => store.put(record));
      await Promise.all(putPromises);
      await tx.complete;
      written += part.length;

      logger?.('DEBUG', `Batch write completed for ${storeName}`, {
        batchSize: part.length,
        totalWritten: written,
        remaining: records.length - written,
      });
    } catch (error: any) {
      logger?.('ERROR', `Batch write failed for ${storeName}`, {
        error: error.message,
        batchSize: part.length,
        written,
      });
      continue;
    }
  }

  return written;
}

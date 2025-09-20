// src/background/db.ts
// IndexedDB 封装（使用 idb），为大体量数据（如 viewed 番号库）提供高效持久化

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { VideoRecord } from '../types';

interface JavdbDB extends DBSchema {
  viewedRecords: {
    key: string; // video id
    value: VideoRecord;
    indexes: {
      by_status: string;
      by_updatedAt: number;
      by_createdAt: number;
    };
  };
}

const DB_NAME = 'javdb_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JavdbDB>> | null = null;

export async function initDB(): Promise<IDBPDatabase<JavdbDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JavdbDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<JavdbDB>, oldVersion: number) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('viewedRecords', {
            keyPath: 'id',
          });
          store.createIndex('by_status', 'status');
          store.createIndex('by_updatedAt', 'updatedAt');
          store.createIndex('by_createdAt', 'createdAt');
        }
      }
    });
  }
  return dbPromise;
}

// ----- viewedRecords API -----

export async function viewedPut(record: VideoRecord): Promise<void> {
  const db = await initDB();
  await db.put('viewedRecords', record);
}

export async function viewedBulkPut(records: VideoRecord[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('viewedRecords', 'readwrite');
  try {
    for (const r of records) {
      await tx.store.put(r);
    }
    await tx.done;
  } catch (e) {
    try { await tx.done; } catch {}
    throw e;
  }
}

export async function viewedGet(videoId: string): Promise<VideoRecord | undefined> {
  const db = await initDB();
  return db.get('viewedRecords', videoId);
}

export async function viewedCount(): Promise<number> {
  const db = await initDB();
  return db.count('viewedRecords');
}

export async function viewedGetAll(): Promise<VideoRecord[]> {
  const db = await initDB();
  return db.getAll('viewedRecords');
}

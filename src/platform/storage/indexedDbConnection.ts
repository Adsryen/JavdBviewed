import { openDB, type IDBPDatabase } from 'idb';
import type { VideoRecord } from '../../types';
import type { JavdbDB, PersistedLogEntry } from './indexedDbSchema';
import { deriveLogCategory, deriveLogSource } from './indexedDbLogFields';
import {
  extractRecordListKeys,
  extractRecordTagKeys,
  makeViewedListIndexRecord,
  makeViewedTagIndexRecord,
  normalizeViewedRecord,
} from './indexedDbViewedIndexes';

const DB_NAME = 'javdb_v1';
const DB_VERSION = 14;

let dbPromise: Promise<IDBPDatabase<JavdbDB>> | null = null;

export function resetDBConnection(): void {
  dbPromise = null;
}

export async function initDB(): Promise<IDBPDatabase<JavdbDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JavdbDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<JavdbDB>, oldVersion: number, _newVersion: number, tx: any) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('viewedRecords', { keyPath: 'id' });
          store.createIndex('by_status', 'status');
          store.createIndex('by_updatedAt', 'updatedAt');
          store.createIndex('by_createdAt', 'createdAt');
        }
        if (oldVersion < 2) {
          const logs = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
          logs.createIndex('by_timestamp', 'timestampMs');
          logs.createIndex('by_level', 'level');

          const actors = db.createObjectStore('actors', { keyPath: 'id' });
          actors.createIndex('by_name', 'name');
          actors.createIndex('by_updatedAt', 'updatedAt');
          actors.createIndex('by_gender', 'gender');
          actors.createIndex('by_category', 'category');
          actors.createIndex('by_blacklisted', 'blacklisted');
          actors.createIndex('by_createdAt', 'createdAt');

          const nw = db.createObjectStore('newWorks', { keyPath: 'id' });
          nw.createIndex('by_actorId', 'actorId');
          nw.createIndex('by_discoveredAt', 'discoveredAt');
          nw.createIndex('by_status', 'status');
          nw.createIndex('by_isRead', 'isRead');

          const mg = db.createObjectStore('magnets', { keyPath: 'key' });
          mg.createIndex('by_videoId', 'videoId');
          mg.createIndex('by_source', 'source');
          mg.createIndex('by_createdAt', 'createdAt');
          mg.createIndex('by_expireAt', 'expireAt');
        }
        if (oldVersion < 3) {
          try {
            const store = tx.objectStore('viewedRecords');
            try { store.createIndex('by_status_updatedAt', ['status', 'updatedAt']); } catch {}
            try { store.createIndex('by_status_createdAt', ['status', 'createdAt']); } catch {}
          } catch {}
        }
        if (oldVersion < 4) {
          try {
            const iv = db.createObjectStore('insightsViews', { keyPath: 'date' });
            iv.createIndex('by_date', 'date');
          } catch {}
          try {
            const ir = db.createObjectStore('insightsReports', { keyPath: 'month' });
            ir.createIndex('by_month', 'month');
            ir.createIndex('by_createdAt', 'createdAt');
          } catch {}
        }
        if (oldVersion < 5) {
          try {
            const ls = db.createObjectStore('lists', { keyPath: 'id' });
            ls.createIndex('by_type', 'type');
            ls.createIndex('by_updatedAt', 'updatedAt');
          } catch {}
        }
        if (oldVersion < 6) {
          // Reserved migration step.
        }
        if (oldVersion < 7) {
          try {
            const actorsStore = tx.objectStore('actors');
            const existingIndexes = Array.from(actorsStore.indexNames);
            if (!existingIndexes.includes('by_gender')) {
              try { actorsStore.createIndex('by_gender', 'gender'); } catch {}
            }
            if (!existingIndexes.includes('by_category')) {
              try { actorsStore.createIndex('by_category', 'category'); } catch {}
            }
            if (!existingIndexes.includes('by_blacklisted')) {
              try { actorsStore.createIndex('by_blacklisted', 'blacklisted'); } catch {}
            }
            if (!existingIndexes.includes('by_createdAt')) {
              try { actorsStore.createIndex('by_createdAt', 'createdAt'); } catch {}
            }
          } catch {}
          try {
            const newWorksStore = tx.objectStore('newWorks');
            const existingIndexes = Array.from(newWorksStore.indexNames);
            if (!existingIndexes.includes('by_isRead')) {
              try { newWorksStore.createIndex('by_isRead', 'isRead'); } catch {}
            }
          } catch {}
        }
        if (oldVersion < 8) {
          try {
            const listsStore = tx.objectStore('lists');
            const existingIndexes = Array.from(listsStore.indexNames);
            if (!existingIndexes.includes('by_source')) {
              try { listsStore.createIndex('by_source', 'source'); } catch {}
            }
          } catch {}
        }
        if (oldVersion < 9) {
          try {
            db.createObjectStore('newWorksDailyStats', { keyPath: 'date' });
          } catch {}
        }

        if (oldVersion < 10) {
          try {
            const viewedStore = tx.objectStore('viewedRecords');
            const existingIndexes = Array.from(viewedStore.indexNames);
            if (!existingIndexes.includes('by_favorite_updatedAt')) {
              try { viewedStore.createIndex('by_favorite_updatedAt', ['favoriteIndexed', 'updatedAt']); } catch {}
            }
            if (!existingIndexes.includes('by_favorite_createdAt')) {
              try { viewedStore.createIndex('by_favorite_createdAt', ['favoriteIndexed', 'createdAt']); } catch {}
            }
            if (!existingIndexes.includes('by_status_favorite_updatedAt')) {
              try { viewedStore.createIndex('by_status_favorite_updatedAt', ['status', 'favoriteIndexed', 'updatedAt']); } catch {}
            }
            if (!existingIndexes.includes('by_status_favorite_createdAt')) {
              try { viewedStore.createIndex('by_status_favorite_createdAt', ['status', 'favoriteIndexed', 'createdAt']); } catch {}
            }
          } catch {}
          try {
            const logsStore = tx.objectStore('logs');
            const existingIndexes = Array.from(logsStore.indexNames);
            if (!existingIndexes.includes('by_level_timestamp')) {
              try { logsStore.createIndex('by_level_timestamp', ['level', 'timestampMs']); } catch {}
            }
            if (!existingIndexes.includes('by_source_timestamp')) {
              try { logsStore.createIndex('by_source_timestamp', ['source', 'timestampMs']); } catch {}
            }
            if (!existingIndexes.includes('by_category_timestamp')) {
              try { logsStore.createIndex('by_category_timestamp', ['category', 'timestampMs']); } catch {}
            }
            const request = logsStore.openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (!cursor) return;
              const value = (cursor.value || {}) as PersistedLogEntry;
              const sourceValue = value.source || deriveLogSource(String(value.message || ''));
              const categoryValue = value.category || deriveLogCategory(String(value.message || ''));
              if (value.source !== sourceValue || value.category !== categoryValue) {
                cursor.update({ ...value, source: sourceValue, category: categoryValue });
              }
              cursor.continue();
            };
          } catch {}
          try {
            const viewedStore = tx.objectStore('viewedRecords');
            const request = viewedStore.openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (!cursor) return;
              const value = (cursor.value || {}) as VideoRecord & { favoriteIndexed?: number };
              const favoriteIndexed = value.isFavorite === true ? 1 : 0;
              if (value.favoriteIndexed !== favoriteIndexed) {
                cursor.update({ ...value, favoriteIndexed });
              }
              cursor.continue();
            };
          } catch {}
        }

        if (oldVersion < 11) {
          try {
            const tagStore = db.createObjectStore('viewedByTag', { keyPath: 'key' });
            tagStore.createIndex('by_tag', 'tag');
            tagStore.createIndex('by_videoId', 'videoId');
          } catch {}
          try {
            const listStore = db.createObjectStore('viewedByList', { keyPath: 'key' });
            listStore.createIndex('by_listId', 'listId');
            listStore.createIndex('by_videoId', 'videoId');
          } catch {}
          try {
            const viewedStore = tx.objectStore('viewedRecords');
            const tagStore = tx.objectStore('viewedByTag');
            const listStore = tx.objectStore('viewedByList');
            const request = viewedStore.openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (!cursor) return;
              const value = normalizeViewedRecord((cursor.value || {}) as VideoRecord);
              const videoId = String(value.id || '');
              for (const tag of extractRecordTagKeys(value)) {
                try { tagStore.put(makeViewedTagIndexRecord(tag, videoId)); } catch {}
              }
              for (const listId of extractRecordListKeys(value)) {
                try { listStore.put(makeViewedListIndexRecord(listId, videoId)); } catch {}
              }
              cursor.continue();
            };
          } catch {}
        }
        if (oldVersion < 12) {
          try {
            const store = db.createObjectStore('magnetPushLogs', { keyPath: 'id', autoIncrement: true });
            store.createIndex('by_timestamp', 'timestampMs');
            store.createIndex('by_type', 'type');
            store.createIndex('by_videoId', 'videoId');
          } catch {}
        }
      }
    });
  }
  return dbPromise;
}

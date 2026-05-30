import type { DBSchema } from 'idb';
import type { ActorRecord, ListRecord, LogEntry, NewWorkRecord, VideoRecord } from '../../types';
import type { ReportMonthly, ViewsDaily } from '../../types/insights';

export const MAX_INDEX_NUMBER = Number.MAX_SAFE_INTEGER;

export interface PersistedLogEntry extends LogEntry {
  id?: number;
  timestampMs: number;
  timestampISO?: string;
  source?: 'GENERAL' | 'DRIVE115';
  category?: string;
}

export interface PersistedMagnetPushLogEntry {
  id?: number;
  type: 'push_start' | 'push_success' | 'push_failed';
  videoId: string;
  message: string;
  timestamp: number;
  timestampMs: number;
  timestampISO?: string;
  source: 'DRIVE115';
  category: 'DRIVE115';
  data?: any;
}

export interface MagnetCacheRecord {
  key: string;
  videoId: string;
  source: string;
  name: string;
  magnet: string;
  size?: string;
  sizeBytes?: number;
  date?: string;
  seeders?: number;
  leechers?: number;
  hasSubtitle?: boolean;
  quality?: string;
  createdAt: number;
  expireAt?: number;
}

export interface ViewedTagIndexRecord {
  key: string;
  tag: string;
  videoId: string;
}

export interface ViewedListIndexRecord {
  key: string;
  listId: string;
  videoId: string;
}

export interface NewWorksDailyStat {
  date: string;
  total: number;
  unread: number;
}

export interface JavdbDB extends DBSchema {
  viewedRecords: {
    key: string;
    value: VideoRecord;
    indexes: {
      by_status: string;
      by_updatedAt: number;
      by_createdAt: number;
      by_status_updatedAt: [string, number];
      by_status_createdAt: [string, number];
      by_favorite_updatedAt: [number, number];
      by_favorite_createdAt: [number, number];
      by_status_favorite_updatedAt: [string, number, number];
      by_status_favorite_createdAt: [string, number, number];
    };
  };
  viewedByTag: {
    key: string;
    value: ViewedTagIndexRecord;
    indexes: {
      by_tag: string;
      by_videoId: string;
    };
  };
  viewedByList: {
    key: string;
    value: ViewedListIndexRecord;
    indexes: {
      by_listId: string;
      by_videoId: string;
    };
  };
  lists: {
    key: string;
    value: ListRecord;
    indexes: {
      by_type: string;
      by_updatedAt: number;
      by_source: string;
    };
  };
  logs: {
    key: number;
    value: PersistedLogEntry;
    indexes: {
      by_timestamp: number;
      by_level: string;
      by_level_timestamp: [string, number];
      by_source_timestamp: [string, number];
      by_category_timestamp: [string, number];
    };
  };
  actors: {
    key: string;
    value: ActorRecord;
    indexes: {
      by_name: string;
      by_updatedAt: number;
      by_gender: string;
      by_category: string;
      by_blacklisted: number;
      by_createdAt: number;
    };
  };
  newWorks: {
    key: string;
    value: NewWorkRecord;
    indexes: {
      by_actorId: string;
      by_discoveredAt: number;
      by_status: string;
      by_isRead: number;
    };
  };
  magnets: {
    key: string;
    value: MagnetCacheRecord;
    indexes: {
      by_videoId: string;
      by_source: string;
      by_createdAt: number;
      by_expireAt: number;
    };
  };
  magnetPushLogs: {
    key: number;
    value: PersistedMagnetPushLogEntry;
    indexes: {
      by_timestamp: number;
      by_type: string;
      by_videoId: string;
    };
  };
  insightsViews: {
    key: string;
    value: ViewsDaily;
    indexes: {
      by_date: string;
    };
  };
  insightsReports: {
    key: string;
    value: ReportMonthly;
    indexes: {
      by_month: string;
      by_createdAt: number;
    };
  };
  newWorksDailyStats: {
    key: string;
    value: NewWorksDailyStat;
    indexes: Record<string, never>;
  };
}

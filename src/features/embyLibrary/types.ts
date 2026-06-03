export type EmbyServerType = 'emby' | 'jellyfin';

export interface EmbyMediaServer {
  id: string;
  type: EmbyServerType;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
}

export interface EmbyLibraryStatusSettings {
  enabled: boolean;
  showOnList: boolean;
  showOnDetail: boolean;
}

export interface EmbyRealtimeCheckSettings {
  enabled: boolean;
  concurrency: number;
  batchSize: number;
  cacheTtlMinutes: number;
}

export interface EmbyLibraryIndexEntry {
  serverType: EmbyServerType;
  serverName: string;
  serverUrl: string;
  itemId: string;
  serverId?: string;
  itemName: string;
  path?: string;
  updatedAt: number;
}

export interface EmbyLibraryIndex {
  entries: Record<string, EmbyLibraryIndexEntry[]>;
  updatedAt: number;
}

export interface EmbyLibraryServerResult {
  serverId: string;
  serverType: EmbyServerType;
  serverName: string;
  success: boolean;
  itemCount: number;
  indexedCount: number;
  error?: string;
  checkedAt: number;
}

export interface EmbyLibraryState extends EmbyLibraryIndex {
  serverResults?: EmbyLibraryServerResult[];
}

export interface EmbyMediaItem {
  Id?: string;
  Name?: string;
  Path?: string;
  ServerId?: string;
}

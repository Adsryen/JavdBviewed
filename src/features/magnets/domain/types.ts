export interface MagnetResult {
  name: string;
  magnet: string;
  size: string;
  sizeBytes: number;
  date: string;
  seeders?: number;
  leechers?: number;
  source: string;
  sources?: string[];
  quality?: string;
  hasSubtitle: boolean;
}

export type MagnetSourceKey = 'sukebei' | 'btdig' | 'btsow' | 'torrentz2' | 'javbus';
export type MagnetSourceSearchState = 'idle' | 'searching' | 'success' | 'failed';

export interface MagnetSearchConfig {
  enabled: boolean;
  showInlineResults: boolean;
  showFloatingButton: boolean;
  autoSearch: boolean;
  blockMojContent: boolean;
  sources: {
    sukebei: boolean;
    btdig: boolean;
    btsow: boolean;
    torrentz2: boolean;
    javbus: boolean;
    custom: string[];
  };
  maxResults: number;
  timeout: number;
}

export interface MagnetSourceRunState {
  status: MagnetSourceSearchState;
  resultCount?: number;
  error?: string;
}

export interface MagnetExternalSearchResult {
  discoveredCount: number;
  duplicateCount: number;
  uniqueResults: MagnetResult[];
  sourceStates: Partial<Record<MagnetSourceKey, MagnetSourceRunState>>;
}

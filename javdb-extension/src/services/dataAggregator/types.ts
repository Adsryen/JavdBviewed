// src/services/dataAggregator/types.ts
// 数据聚合器类型定义

export interface DataSource {
  name: string;
  baseUrl: string;
  enabled: boolean;
  timeout: number;
  retryCount: number;
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  proxy?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  timestamp: number;
  cached?: boolean;
}

export interface ImageData {
  url: string;
  type: 'cover' | 'thumbnail' | 'preview';
  width?: number;
  height?: number;
  size?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface VideoData {
  url: string;
  type: 'preview' | 'trailer' | 'sample';
  duration?: number;
  format?: string;
  quality?: string;
  size?: number;
}

export interface RatingData {
  source: string;
  score: number;
  total: number;
  count?: number;
  url?: string;
  lastUpdated?: number;
}

export interface ActorData {
  name: string;
  avatar?: string;
  profileUrl?: string;
  aliases?: string[];
  birthDate?: string;
  measurements?: {
    height?: number;
    bust?: number;
    waist?: number;
    hips?: number;
  };
  tags?: string[];
}

export interface StudioData {
  name: string;
  logo?: string;
  website?: string;
  description?: string;
}

export interface SeriesData {
  name: string;
  description?: string;
  totalEpisodes?: number;
  studio?: string;
}

export interface VideoMetadata {
  id: string;
  title?: string;
  originalTitle?: string;
  translatedTitle?: string;
  releaseDate?: string;
  duration?: number;
  director?: string;
  studio?: StudioData;
  series?: SeriesData;
  genre?: string[];
  tags?: string[];
  description?: string;
  images?: ImageData[];
  videos?: VideoData[];
  ratings?: RatingData[];
  actors?: ActorData[];
  lastUpdated?: number;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
  service: string;
  timestamp: number;
}

export interface MagnetData {
  name: string;
  link: string;
  size: string;
  sizeBytes: number;
  date: string;
  seeders?: number;
  leechers?: number;
  source: string;
  hasSubtitle: boolean;
  quality?: string;
  format?: string;
  resolution?: string;
}

export interface SearchResult {
  videos?: VideoMetadata[];
  magnets?: MagnetData[];
  totalCount?: number;
  hasMore?: boolean;
  nextPage?: string;
}

// 数据源配置
export interface DataSourceConfig {
  blogJav: {
    enabled: boolean;
    baseUrl: string;
    timeout: number;
    maxRetries: number;
  };
  javStore: {
    enabled: boolean;
    baseUrl: string;
    timeout: number;
  };
  javSpyl: {
    enabled: boolean;
    baseUrl: string;
    timeout: number;
  };
  javLibrary: {
    enabled: boolean;
    baseUrl: string;
    timeout: number;
    maxRetries: number;
    language: 'en' | 'ja' | 'cn';
  };
  dmm: {
    enabled: boolean;
    baseUrl: string;
    timeout: number;
  };
  fc2: {
    enabled: boolean;
    baseUrl: string;
    timeout: number;
  };
  translator: {
    enabled: boolean;
    service: 'google' | 'baidu' | 'youdao';
    apiKey?: string;
    timeout: number;
    maxRetries: number;
    sourceLanguage: string;
    targetLanguage: string;
  };
}

// 错误类型
export class DataSourceError extends Error {
  constructor(
    message: string,
    public source: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'DataSourceError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public url: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public source: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

// 请求状态
export interface RequestStatus {
  pending: boolean;
  completed: boolean;
  failed: boolean;
  retryCount: number;
  lastError?: string;
  startTime: number;
  endTime?: number;
}

// 批量请求结果
export interface BatchResult<T> {
  results: Array<ApiResponse<T>>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    duration: number;
  };
}

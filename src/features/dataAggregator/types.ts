/** @description 数据聚合器类型定义 —— 从多个数据源抓取、解析、合并影片元数据 */

export type { FetchOptions } from '../../platform/network/types';
export { NetworkError } from '../../platform/network/types';

/** 数据源配置 */
export interface DataSource {
  name: string;                                       // 数据源名称
  baseUrl: string;                                    // 基础 URL
  enabled: boolean;
  timeout: number;                                    // 请求超时（毫秒）
  retryCount: number;                                 // 最大重试次数
}

/** 统一 API 响应包装 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;                                     // 数据源标识
  timestamp: number;                                  // 响应时间戳
  cached?: boolean;                                   // 是否来自缓存
}

/** 图片数据 */
export interface ImageData {
  url: string;
  type: 'cover' | 'thumbnail' | 'preview';
  width?: number;
  height?: number;
  size?: number;
  quality?: 'low' | 'medium' | 'high';
}

/** 视频预览数据 */
export interface VideoData {
  url: string;
  type: 'preview' | 'trailer' | 'sample';
  duration?: number;
  format?: string;
  quality?: string;
  size?: number;
}

/** 评分数据（来自单一数据源） */
export interface RatingData {
  source: string;                                     // 评分来源（如 'javdb'、'javlibrary'）
  score: number;                                      // 评分值
  total: number;                                      // 评分满分
  count?: number;                                     // 评分人数
  url?: string;
  lastUpdated?: number;
}

/** 演员数据 */
export interface ActorData {
  name: string;
  avatar?: string;
  profileUrl?: string;
  aliases?: string[];
  birthDate?: string;
  measurements?: {                                    // 三围
    height?: number;
    bust?: number;
    waist?: number;
    hips?: number;
  };
  tags?: string[];
}

/** 制作商数据 */
export interface StudioData {
  name: string;
  logo?: string;
  website?: string;
  description?: string;
}

/** 系列数据 */
export interface SeriesData {
  name: string;
  description?: string;
  totalEpisodes?: number;
  studio?: string;
}

/** 影片完整元数据（聚合后的标准化结构） */
export interface VideoMetadata {
  id: string;                                         // 番号
  title?: string;
  originalTitle?: string;
  translatedTitle?: string;                           // 翻译后的标题
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

/** 数据聚合器配置 */
export interface DataAggregatorConfig {
  sources: DataSourceConfig;
  concurrency: number;                                // 并发请求数
  timeout: number;
  enableCache?: boolean;
  cacheTimeout?: number;                              // 缓存过期时间（毫秒）
  maxRetries?: number;
}

/** 翻译结果 */
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;                                // 置信度
  service: string;                                    // 翻译服务标识
  timestamp: number;
}

/** 磁力链接数据 */
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

/** 搜索结果 */
export interface SearchResult {
  videos?: VideoMetadata[];
  magnets?: MagnetData[];
  totalCount?: number;
  hasMore?: boolean;
  nextPage?: string;                                  // 下一页 URL
}

/** 各数据源独立配置 */
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

/** 数据源请求错误 */
export class DataSourceError extends Error {
  constructor(
    message: string,
    public source: string,                            // 出错的数据源
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'DataSourceError';
  }
}

/** 页面解析错误 */
export class ParseError extends Error {
  constructor(
    message: string,
    public source: string,
    public data?: any                                 // 解析失败的原始数据
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/** 请求状态追踪 */
export interface RequestStatus {
  pending: boolean;
  completed: boolean;
  failed: boolean;
  retryCount: number;
  lastError?: string;
  startTime: number;
  endTime?: number;
}

/** 批量请求结果 */
export interface BatchResult<T> {
  results: Array<ApiResponse<T>>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    duration: number;                                 // 总耗时（毫秒）
  };
}

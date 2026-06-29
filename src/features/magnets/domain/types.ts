/** @description 磁力搜索领域类型定义 */

/** 单条磁力搜索结果 */
export interface MagnetResult {
  name: string;                                       // 资源名称
  magnet: string;                                     // 磁力链接
  size: string;                                       // 文件大小（人类可读，如 "1.2GB"）
  sizeBytes: number;                                  // 文件大小（字节）
  date: string;                                       // 发布日期
  seeders?: number;                                   // 做种数（越高下载越快）
  leechers?: number;                                  // 下载数
  source: string;                                     // 来源站点标识
  sources?: string[];                                 // 多源合并时的来源列表
  quality?: string;                                   // 画质标签
  hasSubtitle: boolean;                               // 是否有字幕
}

/** 磁力源标识 */
export type MagnetSourceKey = 'sukebei' | 'btdig' | 'btsow' | 'torrentz2' | 'javbus';
/** 单个磁力源的搜索状态 */
export type MagnetSourceSearchState = 'idle' | 'searching' | 'success' | 'failed';

/** 磁力搜索配置 */
export interface MagnetSearchConfig {
  enabled: boolean;
  showInlineResults: boolean;                         // 在页面内嵌显示结果
  showFloatingButton: boolean;                        // 显示悬浮搜索按钮
  autoSearch: boolean;                                // 进入详情页自动搜索
  blockMojContent: boolean;                           // 屏蔽无码内容
  sources: {                                          // 各源的启用状态
    sukebei: boolean;
    btdig: boolean;
    btsow: boolean;
    torrentz2: boolean;
    javbus: boolean;
    custom: string[];                                 // 自定义源 URL 列表
  };
  maxResults: number;                                 // 最大结果数
  timeout: number;                                    // 单源超时时间（毫秒）
}

/** 单个磁力源的运行时状态 */
export interface MagnetSourceRunState {
  status: MagnetSourceSearchState;
  resultCount?: number;
  error?: string;
}

/** 外部磁力搜索汇总结果 */
export interface MagnetExternalSearchResult {
  discoveredCount: number;                            // 发现总数
  duplicateCount: number;                             // 重复数
  uniqueResults: MagnetResult[];                      // 去重后的结果
  sourceStates: Partial<Record<MagnetSourceKey, MagnetSourceRunState>>;  // 各源状态
}

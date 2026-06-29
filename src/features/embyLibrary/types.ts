/** @description Emby/Jellyfin 媒体库类型定义 */

/** 媒体服务器类型 */
export type EmbyServerType = 'emby' | 'jellyfin';

/** 媒体服务器连接配置 */
export interface EmbyMediaServer {
  id: string;
  type: EmbyServerType;
  name: string;                                       // 用户自定义服务器名称
  url: string;                                        // 服务器地址（含端口）
  apiKey: string;                                     // API 密钥
  enabled: boolean;
}

/** 媒体库状态显示设置 */
export interface EmbyLibraryStatusSettings {
  enabled: boolean;
  showOnList: boolean;                                // 列表页显示状态徽章
  showOnDetail: boolean;                              // 详情页显示状态
}

/** 实时检查设置 */
export interface EmbyRealtimeCheckSettings {
  enabled: boolean;
  concurrency: number;                                // 并发检查数
  batchSize: number;                                  // 每批检查的视频数
  cacheTtlMinutes: number;                            // 缓存有效期（分钟）
}

/** 媒体库索引条目 —— 记录单个视频在 Emby/Jellyfin 中的位置 */
export interface EmbyLibraryIndexEntry {
  serverType: EmbyServerType;
  serverName: string;
  serverUrl: string;
  itemId: string;                                     // Emby/Jellyfin 中的媒体 ID
  serverId?: string;
  itemName: string;                                   // 媒体名称
  path?: string;                                      // 文件路径
  updatedAt: number;
}

/** 媒体库索引 —— 所有视频到 Emby/Jellyfin 的映射 */
export interface EmbyLibraryIndex {
  entries: Record<string, EmbyLibraryIndexEntry[]>;   // key 为番号
  updatedAt: number;
}

/** 单服务器检查结果 */
export interface EmbyLibraryServerResult {
  serverId: string;
  serverType: EmbyServerType;
  serverName: string;
  success: boolean;
  itemCount: number;                                  // 服务器总媒体数
  indexedCount: number;                               // 已索引的匹配数
  error?: string;
  checkedAt: number;
}

/** 媒体库状态（索引 + 服务器检查结果） */
export interface EmbyLibraryState extends EmbyLibraryIndex {
  serverResults?: EmbyLibraryServerResult[];
}

/** Emby/Jellyfin API 返回的媒体条目 */
export interface EmbyMediaItem {
  Id?: string;
  Name?: string;
  Path?: string;
  ServerId?: string;
}

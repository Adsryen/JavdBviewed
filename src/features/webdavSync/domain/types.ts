/** @description WebDAV 同步领域类型定义 */

/** WebDAV 认证信息 */
export interface WebDAVAuth {
  username: string;
  password: string;
}

/** WebDAV 文件/目录信息（PROPFIND 响应解析结果） */
export interface WebDAVFile {
  name: string;                                       // 文件名
  path: string;                                       // 完整路径
  lastModified: string;                               // 最后修改时间（ISO 8601）
  isDirectory: boolean;
  size?: number;                                      // 文件大小（字节）
  uploaderClientId?: string;                          // 上传设备 ID
  uploaderDeviceLabel?: string;                       // 上传设备名称
  uploaderBrowserName?: string;                       // 上传浏览器名称
  uploadId?: string;                                  // 上传批次 ID
}

/** 客户端设备档案 —— 记录每个同步设备的信息 */
export interface WebDAVClientProfile {
  clientId: string;                                   // 设备唯一 ID
  deviceLabel: string;                                // 用户可读的设备名称
  browserName: string;                                // 浏览器名称
  platform?: string;                                  // 操作系统平台
  extensionVersion?: string;                          // 扩展版本号
  installedAt?: string;                               // 安装时间
  lastSeenAt?: string;                                // 最后活跃时间
  lastSyncAt?: string;                                // 最后同步时间
  lastSyncStatus?: 'success' | 'failed' | 'pending';
  lastUploadId?: string;                              // 最后上传批次 ID
  disabled?: boolean;                                 // 是否已禁用
}

/** 上传索引条目 —— 记录每次全量备份的元数据 */
export interface WebDAVUploadIndexItem {
  uploadId: string;                                   // 上传批次 ID（时间戳）
  uploadedAt: string;                                 // 上传时间
  clientId: string;                                   // 上传设备 ID
  deviceLabel: string;
  browserName: string;
  type: 'full';                                       // 备份类型（目前仅支持全量）
  status: 'success' | 'failed';
  file?: string;                                      // 备份文件名
  recordCount?: number;                               // 记录总数
  dataVersion?: number;                               // 数据格式版本号
}

/** 上传索引 —— WebDAV 上所有备份文件的目录 */
export interface WebDAVUploadIndex {
  version: number;                                    // 索引格式版本
  updatedAt: string;                                  // 最后更新时间
  lastUploadId: string;                               // 最新上传批次 ID
  items: WebDAVUploadIndexItem[];                     // 所有备份条目
}

/** WebDAV 连接配置 */
export interface WebDAVConfig {
  id: string;
  name: string;                                       // 配置名称
  url: string;                                        // WebDAV 服务地址
  username: string;
  password: string;
  provider?: 'jianguoyun' | 'teracloud' | 'custom';  // 预设服务商
  createdAt?: number;
  updatedAt: number;
  lastSync: string | null;                            // 最后同步时间
  [key: string]: any;
}

/** @description 115 网盘集成领域类型定义 */

/** 115 网盘文件信息 */
export interface Drive115File {
  name: string;                                       // 文件名
  pickCode: string;                                   // 115 提取码（用于下载/操作）
  fileId: string;                                     // 文件 ID
  parentId: string;                                   // 父目录 ID
  size: number;                                       // 文件大小（字节）
  updatedAt: number;                                  // 最后修改时间戳
  raw: any;                                           // 原始 API 响应
}

/** 115 网盘标准化设置（合并 v1/v2 配置） */
export interface NormalizedDrive115Settings {
  enabled: boolean;
  downloadDir: string;                                // 下载目录路径
  verifyCount: number;                                // 推送后验证次数
  maxFailures: number;                                // 最大失败次数
  v2ApiBaseUrl: string;                               // v2 API 基础 URL
  v2AuthMode?: 'openlist_manual' | 'openlist_scan' | 'self_app';  // 认证模式
  v2ClientId?: string;                                // OAuth 客户端 ID
  v2AccessToken: string;                              // OAuth Access Token
  v2RefreshToken: string;                             // OAuth Refresh Token
  v2TokenExpiresAt: number | null;                    // Token 过期时间戳
  v2AutoRefresh: boolean;                             // 自动刷新 Token
  v2AutoRefreshSkewSec: number;                       // 提前刷新的秒数（防止临界过期）
  v2RefreshTokenStatus?: 'valid' | 'invalid' | 'expired' | 'unknown';
  v2RefreshTokenLastError?: string;
  v2RefreshTokenLastErrorCode?: number;
  v2AccessTokenStatus?: 'valid' | 'expired' | 'rate_limited' | 'unknown';
  v2AccessTokenLastError?: string;
  v2AccessTokenLastErrorCode?: number;
  quotaCache?: {
    data?: any;
    updatedAt?: number;
  } | null;  // 配额缓存
  v2UserInfo?: any;
  v2UserInfoUpdatedAt?: number;
  v2UserInfoExpired?: boolean;
}

/** 离线下载选项 */
export interface Drive115OfflineOptionsUnified {
  videoId: string;                                    // 关联的番号
  magnetUrl: string;                                  // 磁力链接
  downloadDir?: string;                               // 下载目录（覆盖默认）
  autoVerify?: boolean;                               // 下载后自动验证文件
}

/** 批量任务条目 */
export interface Drive115BatchTaskUnified {
  videoId: string;
  magnetUrl: string;
}

/** 批量下载选项 */
export interface Drive115BatchOptionsUnified {
  tasks: Drive115BatchTaskUnified[];
  downloadDir?: string;
  maxFailures?: number;                               // 批量中允许的最大失败数
  autoVerify?: boolean;
}

/** 单次离线下载结果 */
export interface Drive115OfflineResultUnified {
  success: boolean;
  taskId?: string;                                    // 115 离线任务 ID
  error?: string;
  verificationResult?: {
    verified: boolean;                                // 文件是否验证通过
    foundFiles?: Drive115File[];                      // 找到的文件列表
  };
}

/** 批量下载汇总结果 */
export interface Drive115BatchResultUnified {
  totalTasks: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    videoId: string;
    result: Drive115OfflineResultUnified;
  }>;
}

/** 115 操作日志类型 */
export type Drive115LogType = 'push_start' | 'push_success' | 'push_failed' | 'offline_start' | 'offline_success' | 'offline_failed' | 'verify_start' | 'verify_success' | 'verify_failed' | 'batch_start' | 'batch_complete';

/** 推送上下文（用于日志追踪） */
export interface Drive115PushContext {
  source?: string;                                    // 触发来源
  videoId?: string;
  magnetName?: string;
  pageUrl?: string;
  wpPathId?: string;                                  // 115 文件路径 ID
  taskId?: string;
  correlationId?: string;                             // 关联 ID
  traceId?: string;                                   // 追踪 ID
}

/** 115 统一日志条目 */
export interface Drive115LogEntryUnified {
  type: Drive115LogType;
  videoId: string;
  message: string;
  timestamp: number;
  data?: any;
}

/** 旧版搜索结果格式（兼容用） */
export interface Drive115LegacyLikeSearchResult {
  n?: string;                                         // name
  pc?: string;                                        // pickCode
  fid?: string;                                       // fileId
  cid?: string;                                       // parentId
  s?: number;                                         // size
  t?: number;                                         // updatedAt
  file_name?: string;
  pick_code?: string;
  file_id?: string;
  parent_id?: string;
  file_size?: string | number;
  user_utime?: string | number;
}

/** 统一搜索结果类型 */
export type Drive115SearchResultUnified = Drive115File[];

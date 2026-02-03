/**
 * 115网盘相关类型定义
 */

// 115网盘配置接口
export interface Drive115Settings {
  enabled: boolean;           // 启用115功能
  downloadDir: string;        // 下载目录(支持动态参数)
  verifyCount: number;        // 离线验证次数
  maxFailures: number;        // 最大失败数
  autoNotify: boolean;        // 自动通知
  
  // v2: 基于 token 的新版配置（与旧版解耦）
  enableV2?: boolean;         // 是否启用新版（token 模式）
  v2AccessToken?: string;     // 新版 access_token
  v2RefreshToken?: string;    // 新版 refresh_token
  v2TokenExpiresAt?: number | null; // access_token 过期时间（时间戳，秒）
  v2ApiBaseUrl?: string;      // 新版 API 基础域名（例如：https://proapi.115.com）
  v2AutoRefresh?: boolean;    // 是否在过期时自动刷新 access_token
  v2AutoRefreshSkewSec?: number; // 提前刷新的阈值（秒），如 60 表示提前 60 秒刷新
  
  // UI：用户选择的子版本（用于持久化 v1/v2 子页与全局路由）
  lastSelectedVersion?: 'v1' | 'v2';

  // 配额缓存（需要随设置同步的只读镜像）
  quotaCache?: {
    data?: any;        // 兼容不同返回结构（Drive115V2QuotaInfo）
    updatedAt?: number;
  } | null;
}

// 115 API响应基础接口
export interface Drive115Response {
  state: boolean;
  error?: string;
  errNo?: number;
}

// 签名响应接口
export interface Drive115SignResponse extends Drive115Response {
  sign?: string;
  time?: string;
}

// 添加离线任务响应接口
export interface Drive115AddTaskResponse extends Drive115Response {
  result?: Array<{
    info_hash: string;
    name: string;
    url: string;
  }>;
}

// 搜索结果接口
export interface Drive115SearchResult {
  n: string;      // 文件名
  pc: string;     // pickcode
  fid: string;    // 文件ID
  cid: string;    // 目录ID
  s: number;      // 文件大小
  t: number;      // 修改时间
}

// 搜索响应接口
export interface Drive115SearchResponse extends Drive115Response {
  data?: Drive115SearchResult[];
  count?: number;
}

// 离线下载任务状态
export type OfflineTaskStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'verifying';

// 离线下载任务接口
export interface OfflineTask {
  id: string;                 // 任务ID
  videoId: string;           // 视频番号
  magnetUrl: string;         // 磁链地址
  status: OfflineTaskStatus; // 任务状态
  createdAt: number;         // 创建时间
  completedAt?: number;      // 完成时间
  error?: string;            // 错误信息
  downloadDir: string;       // 下载目录
  verifyAttempts: number;    // 验证尝试次数
}

// 验证状态
export type VerifyStatus = 'pending' | 'verified' | 'failed';

// 115验证码处理接口
export interface Drive115Verification {
  status: VerifyStatus;
  timestamp: number;
}

// 离线下载选项
export interface OfflineDownloadOptions {
  videoId: string;           // 视频番号
  magnetUrl: string;         // 磁链地址
  downloadDir?: string;      // 下载目录（可选，使用配置默认值）
  autoVerify?: boolean;      // 是否自动验证（默认true）
  notify?: boolean;          // 是否通知（默认true）
}

// 批量离线下载选项
export interface BatchOfflineOptions {
  tasks: Array<{
    videoId: string;
    magnetUrl: string;
  }>;
  downloadDir?: string;      // 下载目录
  maxFailures?: number;      // 最大失败数
  autoVerify?: boolean;      // 是否自动验证
  notify?: boolean;          // 是否通知
}

// 离线下载结果
export interface OfflineDownloadResult {
  success: boolean;
  taskId?: string;
  error?: string;
  verificationResult?: {
    verified: boolean;
    foundFiles?: Drive115SearchResult[];
  };
}

// 批量离线下载结果
export interface BatchOfflineResult {
  totalTasks: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    videoId: string;
    result: OfflineDownloadResult;
  }>;
}

// 115网盘日志类型
export type Drive115LogType = 'offline_start' | 'offline_success' | 'offline_failed' | 'verify_start' | 'verify_success' | 'verify_failed' | 'batch_start' | 'batch_complete';

// 115网盘日志条目
export interface Drive115LogEntry {
  type: Drive115LogType;
  videoId: string;
  message: string;
  timestamp: number;
  data?: any;
}

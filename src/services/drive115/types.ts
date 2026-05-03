/**
 * 115网盘兼容类型定义
 */

export interface Drive115Settings {
  enabled: boolean;
  downloadDir: string;
  verifyCount: number;
  maxFailures: number;
  autoNotify: boolean;
  v2AccessToken?: string;
  v2RefreshToken?: string;
  v2TokenExpiresAt?: number | null;
  v2RefreshTokenStatus?: 'valid' | 'invalid' | 'expired' | 'unknown';
  v2RefreshTokenLastError?: string;
  v2RefreshTokenLastErrorCode?: number;
  v2AccessTokenStatus?: 'valid' | 'expired' | 'rate_limited' | 'unknown';
  v2AccessTokenLastError?: string;
  v2AccessTokenLastErrorCode?: number;
  v2ApiBaseUrl?: string;
  v2AutoRefresh?: boolean;
  v2AutoRefreshSkewSec?: number;
  quotaCache?: {
    data?: any;
    updatedAt?: number;
  } | null;
}

export interface Drive115SearchResult {
  n: string;
  pc: string;
  fid: string;
  cid: string;
  s: number;
  t: number;
}

export interface OfflineDownloadOptions {
  videoId: string;
  magnetUrl: string;
  downloadDir?: string;
  autoVerify?: boolean;
  notify?: boolean;
}

export interface BatchOfflineOptions {
  tasks: Array<{
    videoId: string;
    magnetUrl: string;
  }>;
  downloadDir?: string;
  maxFailures?: number;
  autoVerify?: boolean;
  notify?: boolean;
}

export interface OfflineDownloadResult {
  success: boolean;
  taskId?: string;
  error?: string;
  verificationResult?: {
    verified: boolean;
    foundFiles?: Drive115SearchResult[];
  };
}

export interface BatchOfflineResult {
  totalTasks: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    videoId: string;
    result: OfflineDownloadResult;
  }>;
}

export type Drive115LogType =
  | 'offline_start'
  | 'offline_success'
  | 'offline_failed'
  | 'verify_start'
  | 'verify_success'
  | 'verify_failed'
  | 'batch_start'
  | 'batch_complete';

export interface Drive115LogEntry {
  type: Drive115LogType;
  videoId: string;
  message: string;
  timestamp: number;
  data?: any;
}

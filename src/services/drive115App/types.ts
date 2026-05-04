export interface Drive115File {
  name: string;
  pickCode: string;
  fileId: string;
  parentId: string;
  size: number;
  updatedAt: number;
  raw: any;
}

export interface NormalizedDrive115Settings {
  enabled: boolean;
  downloadDir: string;
  verifyCount: number;
  maxFailures: number;
  autoNotify: boolean;
  v2ApiBaseUrl: string;
  v2AuthMode?: 'openlist_manual' | 'openlist_scan' | 'self_app';
  v2ClientId?: string;
  v2AccessToken: string;
  v2RefreshToken: string;
  v2TokenExpiresAt: number | null;
  v2AutoRefresh: boolean;
  v2AutoRefreshSkewSec: number;
  v2RefreshTokenStatus?: 'valid' | 'invalid' | 'expired' | 'unknown';
  v2RefreshTokenLastError?: string;
  v2RefreshTokenLastErrorCode?: number;
  v2AccessTokenStatus?: 'valid' | 'expired' | 'rate_limited' | 'unknown';
  v2AccessTokenLastError?: string;
  v2AccessTokenLastErrorCode?: number;
  defaultWpPathId: string;
  quotaCache?: {
    data?: any;
    updatedAt?: number;
  } | null;
  v2UserInfo?: any;
  v2UserInfoUpdatedAt?: number;
  v2UserInfoExpired?: boolean;
}

export interface Drive115OfflineOptionsUnified {
  videoId: string;
  magnetUrl: string;
  downloadDir?: string;
  autoVerify?: boolean;
  notify?: boolean;
}

export interface Drive115BatchTaskUnified {
  videoId: string;
  magnetUrl: string;
}

export interface Drive115BatchOptionsUnified {
  tasks: Drive115BatchTaskUnified[];
  downloadDir?: string;
  maxFailures?: number;
  autoVerify?: boolean;
  notify?: boolean;
}

export interface Drive115OfflineResultUnified {
  success: boolean;
  taskId?: string;
  error?: string;
  verificationResult?: {
    verified: boolean;
    foundFiles?: Drive115File[];
  };
}

export interface Drive115BatchResultUnified {
  totalTasks: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    videoId: string;
    result: Drive115OfflineResultUnified;
  }>;
}

export type Drive115LogType = 'offline_start' | 'offline_success' | 'offline_failed' | 'verify_start' | 'verify_success' | 'verify_failed' | 'batch_start' | 'batch_complete';

export interface Drive115LogEntryUnified {
  type: Drive115LogType;
  videoId: string;
  message: string;
  timestamp: number;
  data?: any;
}

export interface Drive115LegacyLikeSearchResult {
  n?: string;
  pc?: string;
  fid?: string;
  cid?: string;
  s?: number;
  t?: number;
  file_name?: string;
  pick_code?: string;
  file_id?: string;
  parent_id?: string;
  file_size?: string | number;
  user_utime?: string | number;
}

export type Drive115SearchResultUnified = Drive115File[];

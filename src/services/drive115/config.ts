/**
 * 115网盘兼容配置
 */

import type { Drive115Settings } from './types';

export const DEFAULT_DRIVE115_SETTINGS: Drive115Settings = {
  enabled: false,
  downloadDir: '',
  verifyCount: 5,
  maxFailures: 5,
  autoNotify: true,
  v2AccessToken: '',
  v2RefreshToken: '',
  v2TokenExpiresAt: null,
  v2RefreshTokenStatus: 'unknown',
  v2RefreshTokenLastError: undefined,
  v2RefreshTokenLastErrorCode: undefined,
  v2AutoRefresh: true,
  v2AutoRefreshSkewSec: 60,
  v2ApiBaseUrl: 'https://proapi.115.com',
  quotaCache: null,
};

export const MAGNET_REGEX = /^magnet:\?xt=urn:btih:[a-fA-F0-9]{40}/;

export const DYNAMIC_DIR_PARAMS = {
  STAR: '${#star}',
  SERIES: '${#series}',
  STUDIO: '${#studio}',
} as const;

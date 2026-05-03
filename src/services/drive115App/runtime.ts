import { getSettings } from '../../utils/storage';
import type { NormalizedDrive115Settings } from './types';

const DEFAULT_DRIVE115_RUNTIME_SETTINGS: NormalizedDrive115Settings = {
  enabled: false,
  downloadDir: '',
  verifyCount: 5,
  maxFailures: 5,
  autoNotify: true,
  v2ApiBaseUrl: 'https://proapi.115.com',
  v2AccessToken: '',
  v2RefreshToken: '',
  v2TokenExpiresAt: null,
  v2AutoRefresh: true,
  v2AutoRefreshSkewSec: 60,
  v2RefreshTokenStatus: 'unknown',
  v2RefreshTokenLastError: undefined,
  v2RefreshTokenLastErrorCode: undefined,
  defaultWpPathId: '',
  quotaCache: null,
  v2UserInfo: undefined,
  v2UserInfoUpdatedAt: undefined,
  v2UserInfoExpired: false,
};

export function normalizeDrive115Settings(raw: any): NormalizedDrive115Settings {
  return {
    ...DEFAULT_DRIVE115_RUNTIME_SETTINGS,
    enabled: !!(raw?.enabled ?? raw?.enableV2 ?? DEFAULT_DRIVE115_RUNTIME_SETTINGS.enabled),
    downloadDir: String(raw?.downloadDir ?? DEFAULT_DRIVE115_RUNTIME_SETTINGS.downloadDir),
    verifyCount: Number(raw?.verifyCount ?? DEFAULT_DRIVE115_RUNTIME_SETTINGS.verifyCount) || DEFAULT_DRIVE115_RUNTIME_SETTINGS.verifyCount,
    maxFailures: Number(raw?.maxFailures ?? DEFAULT_DRIVE115_RUNTIME_SETTINGS.maxFailures) || DEFAULT_DRIVE115_RUNTIME_SETTINGS.maxFailures,
    autoNotify: raw?.autoNotify !== false,
    v2ApiBaseUrl: String(raw?.v2ApiBaseUrl ?? DEFAULT_DRIVE115_RUNTIME_SETTINGS.v2ApiBaseUrl),
    v2AccessToken: String(raw?.v2AccessToken ?? ''),
    v2RefreshToken: String(raw?.v2RefreshToken ?? ''),
    v2TokenExpiresAt: typeof raw?.v2TokenExpiresAt === 'number' ? raw.v2TokenExpiresAt : null,
    v2AutoRefresh: raw?.v2AutoRefresh !== false,
    v2AutoRefreshSkewSec: Number(raw?.v2AutoRefreshSkewSec ?? DEFAULT_DRIVE115_RUNTIME_SETTINGS.v2AutoRefreshSkewSec) || DEFAULT_DRIVE115_RUNTIME_SETTINGS.v2AutoRefreshSkewSec,
    v2RefreshTokenStatus: raw?.v2RefreshTokenStatus ?? 'unknown',
    v2RefreshTokenLastError: raw?.v2RefreshTokenLastError,
    v2RefreshTokenLastErrorCode: typeof raw?.v2RefreshTokenLastErrorCode === 'number' ? raw.v2RefreshTokenLastErrorCode : undefined,
    defaultWpPathId: String(raw?.defaultWpPathId ?? raw?.downloadDir ?? ''),
    quotaCache: raw?.quotaCache ?? null,
    v2UserInfo: raw?.v2UserInfo,
    v2UserInfoUpdatedAt: typeof raw?.v2UserInfoUpdatedAt === 'number' ? raw.v2UserInfoUpdatedAt : undefined,
    v2UserInfoExpired: !!raw?.v2UserInfoExpired,
  };
}

export async function getDrive115RuntimeState(): Promise<NormalizedDrive115Settings> {
  const settings: any = await getSettings();
  return normalizeDrive115Settings(settings?.drive115 || {});
}

export function isDrive115EnabledState(state: NormalizedDrive115Settings): boolean {
  return !!state.enabled;
}

export function hasDrive115V2Credentials(state: NormalizedDrive115Settings): boolean {
  return !!state.v2RefreshToken || !!state.v2AccessToken;
}

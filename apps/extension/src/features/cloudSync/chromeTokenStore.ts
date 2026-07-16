/**
 * @file chromeTokenStore.ts
 * @description chrome.storage.local token 持久化（仅扩展侧使用）
 * @module features/cloudSync
 */
import type { AuthTokenPair } from '@javdb/sync-protocol';
import type { TokenStore } from '@javdb/sync-client';

/** 本机会话：不进 Cloud 业务同步 */
export const CLOUD_SESSION_STORAGE_KEY = 'cloud_sync_session_v1';

export type CloudSessionRecord = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  deviceId: string;
  expiresIn?: number;
  savedAt: number;
};

function readSession(): Promise<CloudSessionRecord | null> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([CLOUD_SESSION_STORAGE_KEY], (res) => {
        const v = res?.[CLOUD_SESSION_STORAGE_KEY];
        if (!v || typeof v !== 'object') {
          resolve(null);
          return;
        }
        resolve(v as CloudSessionRecord);
      });
    } catch {
      resolve(null);
    }
  });
}

function writeSession(session: CloudSessionRecord | null): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!session) {
        chrome.storage.local.remove([CLOUD_SESSION_STORAGE_KEY], () => resolve());
        return;
      }
      chrome.storage.local.set({ [CLOUD_SESSION_STORAGE_KEY]: session }, () => resolve());
    } catch {
      resolve();
    }
  });
}

/**
 * 创建绑定 chrome.storage 的 TokenStore
 */
export function createChromeTokenStore(opts?: {
  getDeviceId: () => string;
  getUserId?: () => string | null;
}): TokenStore {
  return {
    async getAccessToken() {
      const s = await readSession();
      return s?.accessToken ?? null;
    },
    async getRefreshToken() {
      const s = await readSession();
      return s?.refreshToken ?? null;
    },
    async setTokens(tokens: AuthTokenPair) {
      const prev = await readSession();
      const session: CloudSessionRecord = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: tokens.userId || prev?.userId || opts?.getUserId?.() || '',
        deviceId: tokens.deviceId || prev?.deviceId || opts?.getDeviceId() || '',
        expiresIn: tokens.expiresIn,
        savedAt: Date.now(),
      };
      await writeSession(session);
    },
    async clear() {
      await writeSession(null);
    },
  };
}

export async function loadCloudSession(): Promise<CloudSessionRecord | null> {
  return readSession();
}

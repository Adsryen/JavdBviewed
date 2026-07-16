/**
 * @file memoryTokenStore.ts
 * @description In-memory token store for tests and non-extension hosts.
 * @module @javdb/sync-client
 */

import type { AuthTokenPair } from '@javdb/sync-protocol';
import type { TokenStore } from './types';

export function createMemoryTokenStore(initial?: Partial<AuthTokenPair>): TokenStore {
  let access: string | null = initial?.accessToken ?? null;
  let refresh: string | null = initial?.refreshToken ?? null;
  return {
    async getAccessToken() {
      return access;
    },
    async getRefreshToken() {
      return refresh;
    },
    async setTokens(tokens: AuthTokenPair) {
      access = tokens.accessToken;
      refresh = tokens.refreshToken;
    },
    async clear() {
      access = null;
      refresh = null;
    },
  };
}

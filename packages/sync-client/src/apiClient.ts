/**
 * @file apiClient.ts
 * @description Cloud HTTP API client with optional access-token refresh on 401.
 * @module @javdb/sync-client
 */

import {
  PROTOCOL_VERSION,
  type AuthLoginRequest,
  type AuthLoginResponse,
  type AuthRefreshRequest,
  type AuthRegisterRequest,
  type AuthTokenPair,
  type DeviceInfo,
  type ProtocolVersion,
  type SyncPullRequest,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncPushResponse,
  type VaultItem,
  type VaultListResponse,
  type VaultPutRequest,
} from '@javdb/sync-protocol';
import { SyncHttpError, createFetchTransport } from './fetchTransport';
import type { CloudApi, HttpTransport, SyncClientConfig, TokenStore } from './types';

export interface ApiClient extends CloudApi {
  readonly protocolVersion: ProtocolVersion;
  readonly tokens: TokenStore;
}

export function createApiClient(config: SyncClientConfig): ApiClient {
  const protocolVersion = config.protocolVersion ?? PROTOCOL_VERSION;
  const transport: HttpTransport =
    config.transport ?? createFetchTransport(config.baseUrl);
  const tokens = config.tokens;

  async function raw<T>(
    method: string,
    path: string,
    body?: unknown,
    useAuth = false,
  ): Promise<T> {
    const token = useAuth ? await tokens.getAccessToken() : null;
    return transport.request<T>({ method, path, body, token });
  }

  async function withAuthRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof SyncHttpError) || err.status !== 401) throw err;
      const refreshToken = await tokens.getRefreshToken();
      if (!refreshToken) {
        config.onAuthFailure?.(err);
        throw err;
      }
      try {
        const pair = await raw<AuthTokenPair>('POST', '/v1/auth/refresh', {
          refreshToken,
        } satisfies AuthRefreshRequest);
        await tokens.setTokens(pair);
      } catch (refreshErr) {
        await tokens.clear();
        config.onAuthFailure?.(refreshErr);
        throw refreshErr;
      }
      return fn();
    }
  }

  return {
    protocolVersion,
    tokens,

    register(body: AuthRegisterRequest) {
      return raw('POST', '/v1/auth/register', body);
    },

    async login(body: AuthLoginRequest) {
      const res = await raw<AuthLoginResponse>('POST', '/v1/auth/login', body);
      await tokens.setTokens(res);
      return res;
    },

    async refresh(body: AuthRefreshRequest) {
      const res = await raw<AuthTokenPair>('POST', '/v1/auth/refresh', body);
      await tokens.setTokens(res);
      return res;
    },

    async logout() {
      try {
        await withAuthRetry(() => raw('POST', '/v1/auth/logout', undefined, true));
      } finally {
        await tokens.clear();
      }
    },

    listDevices() {
      return withAuthRetry(() => raw<DeviceInfo[]>('GET', '/v1/devices', undefined, true));
    },

    revokeDevice(deviceId: string) {
      return withAuthRetry(() =>
        raw<void>('DELETE', `/v1/devices/${encodeURIComponent(deviceId)}`, undefined, true),
      );
    },

    pull(body: SyncPullRequest) {
      return withAuthRetry(() =>
        raw<SyncPullResponse>('POST', '/v1/sync/pull', body, true),
      );
    },

    push(body: SyncPushRequest) {
      return withAuthRetry(() =>
        raw<SyncPushResponse>('POST', '/v1/sync/push', body, true),
      );
    },

    listVault() {
      return withAuthRetry(() =>
        raw<VaultListResponse>('GET', '/v1/vault/items', undefined, true),
      );
    },

    putVault(id: string, body: VaultPutRequest) {
      return withAuthRetry(() =>
        raw<VaultItem>('PUT', `/v1/vault/items/${encodeURIComponent(id)}`, body, true),
      );
    },

    deleteVault(id: string) {
      return withAuthRetry(() =>
        raw<void>('DELETE', `/v1/vault/items/${encodeURIComponent(id)}`, undefined, true),
      );
    },
  };
}

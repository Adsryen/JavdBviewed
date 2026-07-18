/**
 * @file types.ts
 * @description Sync client runtime types (transport, tokens, engine options).
 * @module @javdb/sync-client
 */

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRefreshRequest,
  AuthRegisterRequest,
  AuthTokenPair,
  DeviceInfo,
  ProtocolVersion,
  SyncCursorMap,
  SyncEntity,
  SyncPullRequest,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  SyncSessionRequest,
  SyncSessionResponse,
  VaultItem,
  VaultListResponse,
  VaultPutRequest,
} from '@javdb/sync-protocol';

export type { SyncCursorMap, SyncEntity, ProtocolVersion };

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: AuthTokenPair): Promise<void>;
  clear(): Promise<void>;
}

export interface HttpTransport {
  request<T>(opts: {
    method: string;
    path: string;
    body?: unknown;
    token?: string | null;
  }): Promise<T>;
}

export interface SyncClientConfig {
  baseUrl: string;
  protocolVersion?: ProtocolVersion;
  transport?: HttpTransport;
  tokens: TokenStore;
  /** Called when access token refresh fails permanently. */
  onAuthFailure?: (err: unknown) => void;
}

export interface CloudApi {
  register(body: AuthRegisterRequest): Promise<AuthLoginResponse | AuthTokenPair>;
  login(body: AuthLoginRequest): Promise<AuthLoginResponse>;
  refresh(body: AuthRefreshRequest): Promise<AuthTokenPair>;
  logout(): Promise<void>;
  listDevices(): Promise<DeviceInfo[]>;
  revokeDevice(deviceId: string): Promise<void>;
  pull(body: SyncPullRequest): Promise<SyncPullResponse>;
  push(body: SyncPushRequest): Promise<SyncPushResponse>;
  /** Server-authoritative one-shot sync (preferred). */
  session(body: SyncSessionRequest): Promise<SyncSessionResponse>;
  listVault(): Promise<VaultListResponse>;
  putVault(id: string, body: VaultPutRequest): Promise<VaultItem>;
  deleteVault(id: string): Promise<void>;
}

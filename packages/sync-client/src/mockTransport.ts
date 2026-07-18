/**
 * @file mockTransport.ts
 * @description In-memory Cloud mock for engine/api client tests (no network).
 * @module @javdb/sync-client
 */

import {
  PROTOCOL_VERSION,
  mergeSyncEntity,
  type AuthLoginRequest,
  type AuthLoginResponse,
  type AuthTokenPair,
  type DeviceInfo,
  type SyncEntity,
  type SyncPullRequest,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncPushResponse,
  type SyncSessionRequest,
  type SyncSessionResponse,
  type SyncSessionItemResult,
  type VaultItem,
} from '@javdb/sync-protocol';
import { SyncHttpError } from './fetchTransport';
import type { HttpTransport } from './types';

interface MockUser {
  id: string;
  identifier: string;
  password: string;
}

interface MockSession {
  access: string;
  refresh: string;
  userId: string;
  deviceId: string;
}

export interface MockCloudState {
  users: MockUser[];
  sessions: MockSession[];
  devices: DeviceInfo[];
  entities: Map<string, SyncEntity>;
  vault: Map<string, VaultItem>;
}

function key(type: string, id: string) {
  return `${type}\0${id}`;
}

export function createMockCloudTransport(): {
  transport: HttpTransport;
  state: MockCloudState;
} {
  const state: MockCloudState = {
    users: [],
    sessions: [],
    devices: [],
    entities: new Map(),
    vault: new Map(),
  };

  let seq = 1;
  const nextToken = (prefix: string) => `${prefix}_${seq++}`;

  const authUser = (token: string | null | undefined): MockSession | null => {
    if (!token) return null;
    return state.sessions.find((s) => s.access === token) ?? null;
  };

  const transport: HttpTransport = {
    async request<T>(opts: {
      method: string;
      path: string;
      body?: unknown;
      token?: string | null;
    }): Promise<T> {
      const { method, path, body, token } = opts;
      const m = method.toUpperCase();

      if (m === 'POST' && path === '/v1/auth/register') {
        const b = body as { identifier: string; password: string };
        if (state.users.some((u) => u.identifier === b.identifier)) {
          throw new SyncHttpError(409, 'user exists');
        }
        const user: MockUser = {
          id: `u_${seq++}`,
          identifier: b.identifier,
          password: b.password,
        };
        state.users.push(user);
        return { ok: true } as T;
      }

      if (m === 'POST' && path === '/v1/auth/login') {
        const b = body as AuthLoginRequest;
        const user = state.users.find(
          (u) => u.identifier === b.identifier && u.password === b.password,
        );
        if (!user) throw new SyncHttpError(401, 'invalid credentials');
        const access = nextToken('access');
        const refresh = nextToken('refresh');
        const deviceId = b.device.id;
        state.sessions.push({ access, refresh, userId: user.id, deviceId });
        const existing = state.devices.find((d) => d.id === deviceId);
        if (!existing) {
          state.devices.push({
            id: deviceId,
            label: b.device.label,
            platform: b.device.platform,
            clientType: b.device.clientType,
            clientVersion: b.device.clientVersion,
            lastSeenAt: Date.now(),
          });
        }
        const res: AuthLoginResponse = {
          accessToken: access,
          refreshToken: refresh,
          userId: user.id,
          deviceId,
          protocolVersion: PROTOCOL_VERSION,
        };
        return res as T;
      }

      if (m === 'POST' && path === '/v1/auth/refresh') {
        const b = body as { refreshToken: string };
        const session = state.sessions.find((s) => s.refresh === b.refreshToken);
        if (!session) throw new SyncHttpError(401, 'invalid refresh');
        session.access = nextToken('access');
        const pair: AuthTokenPair = {
          accessToken: session.access,
          refreshToken: session.refresh,
          userId: session.userId,
          deviceId: session.deviceId,
        };
        return pair as T;
      }

      if (m === 'POST' && path === '/v1/auth/logout') {
        const s = authUser(token);
        if (s) state.sessions = state.sessions.filter((x) => x.access !== s.access);
        return undefined as T;
      }

      if (m === 'GET' && path === '/v1/devices') {
        if (!authUser(token)) throw new SyncHttpError(401, 'unauthorized');
        return state.devices as T;
      }

      if (m === 'DELETE' && path.startsWith('/v1/devices/')) {
        if (!authUser(token)) throw new SyncHttpError(401, 'unauthorized');
        const id = decodeURIComponent(path.slice('/v1/devices/'.length));
        state.devices = state.devices.filter((d) => d.id !== id);
        state.sessions = state.sessions.filter((s) => s.deviceId !== id);
        return undefined as T;
      }

      if (m === 'POST' && path === '/v1/sync/pull') {
        if (!authUser(token)) throw new SyncHttpError(401, 'unauthorized');
        const b = body as SyncPullRequest;
        const changes: SyncEntity[] = [];
        const cursors = { ...b.cursors };
        for (const ent of state.entities.values()) {
          const cur = b.cursors[ent.type] ?? 0;
          if (ent.revision > cur) {
            changes.push(ent);
            cursors[ent.type] = Math.max(cursors[ent.type] ?? 0, ent.revision);
          }
        }
        const res: SyncPullResponse = {
          protocolVersion: PROTOCOL_VERSION,
          changes,
          cursors,
          hasMore: false,
        };
        return res as T;
      }

      if (m === 'POST' && path === '/v1/sync/push') {
        if (!authUser(token)) throw new SyncHttpError(401, 'unauthorized');
        const b = body as SyncPushRequest;
        const results: SyncPushResponse['results'] = [];
        const cursors: Record<string, number> = {};
        for (const incoming of b.changes) {
          const k = key(incoming.type, incoming.id);
          const existing = state.entities.get(k);
          let stored: SyncEntity;
          if (!existing) {
            stored = { ...incoming, revision: Math.max(1, incoming.revision) };
            state.entities.set(k, stored);
            results.push({
              id: incoming.id,
              type: incoming.type,
              status: 'accepted',
              revision: stored.revision,
            });
          } else {
            stored = mergeSyncEntity(existing, {
              ...incoming,
              revision: Math.max(existing.revision + 1, incoming.revision),
            });
            if (stored.revision <= existing.revision) {
              stored = { ...stored, revision: existing.revision + 1 };
            }
            state.entities.set(k, stored);
            results.push({
              id: incoming.id,
              type: incoming.type,
              status: 'merged',
              entity: stored,
            });
          }
          cursors[stored.type] = Math.max(cursors[stored.type] ?? 0, stored.revision);
        }
        const res: SyncPushResponse = {
          protocolVersion: PROTOCOL_VERSION,
          results,
          cursors,
        };
        return res as T;
      }

      // Server-authoritative: push then pull since request cursors (matches Cloud design).
      if (m === 'POST' && path === '/v1/sync/session') {
        if (!authUser(token)) throw new SyncHttpError(401, 'unauthorized');
        const b = body as SyncSessionRequest;
        const results: SyncSessionItemResult[] = [];
        for (const incoming of b.changes ?? []) {
          if (!incoming.id || !incoming.type) {
            results.push({
              id: incoming.id,
              type: incoming.type,
              status: 'rejected',
              reason: 'missing id/type',
            });
            continue;
          }
          const k = key(incoming.type, incoming.id);
          const existing = state.entities.get(k);
          let stored: SyncEntity;
          if (!existing) {
            stored = { ...incoming, revision: Math.max(1, incoming.revision) };
            state.entities.set(k, stored);
            results.push({
              id: incoming.id,
              type: incoming.type,
              status: 'accepted',
              revision: stored.revision,
            });
          } else {
            stored = mergeSyncEntity(existing, {
              ...incoming,
              revision: Math.max(existing.revision + 1, incoming.revision),
            });
            if (stored.revision <= existing.revision) {
              stored = { ...stored, revision: existing.revision + 1 };
            }
            state.entities.set(k, stored);
            results.push({
              id: incoming.id,
              type: incoming.type,
              status: 'merged',
              entity: stored,
            });
          }
        }

        const apply: SyncEntity[] = [];
        const cursors = { ...(b.cursors ?? {}) };
        for (const ent of state.entities.values()) {
          const cur = b.cursors?.[ent.type] ?? 0;
          if (ent.revision > cur) {
            apply.push(ent);
            cursors[ent.type] = Math.max(cursors[ent.type] ?? 0, ent.revision);
          }
        }

        let accepted = 0;
        let merged = 0;
        let rejected = 0;
        for (const r of results) {
          if (r.status === 'accepted') accepted += 1;
          else if (r.status === 'merged') merged += 1;
          else rejected += 1;
        }
        const byType: Record<string, number> = {};
        for (const e of apply) {
          byType[e.type] = (byType[e.type] ?? 0) + 1;
        }
        const uploaded = accepted + merged;
        const downloaded = apply.length;
        let code: SyncSessionResponse['code'] = 'SYNC_OK';
        let message = `同步完成：上传 ${uploaded}，下载 ${downloaded}`;
        if (rejected > 0) {
          code = 'SYNC_PARTIAL';
          message = `同步部分成功：上传 ${uploaded}，下载 ${downloaded}，拒绝 ${rejected}`;
        } else if (uploaded === 0 && downloaded === 0) {
          code = 'SYNC_EMPTY';
          message = '同步完成（无变更）';
        }

        const res: SyncSessionResponse = {
          protocolVersion: PROTOCOL_VERSION,
          apply,
          results,
          stats: {
            uploaded,
            downloaded,
            merged,
            rejected,
            byType,
          },
          code,
          message,
          cursors,
          hasMore: false,
        };
        return res as T;
      }

      if (m === 'GET' && path === '/v1/vault/items') {
        if (!authUser(token)) throw new SyncHttpError(401, 'unauthorized');
        return {
          protocolVersion: PROTOCOL_VERSION,
          items: [...state.vault.values()],
        } as T;
      }

      throw new SyncHttpError(404, `mock route not found: ${m} ${path}`);
    },
  };

  return { transport, state };
}

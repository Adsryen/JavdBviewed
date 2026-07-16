/**
 * @file fetchTransport.ts
 * @description Default HTTP transport using global fetch (no chrome APIs).
 * @module @javdb/sync-client
 */

import type { HttpTransport } from './types';

export class SyncHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'SyncHttpError';
    this.status = status;
    this.body = body;
  }
}

export function createFetchTransport(baseUrl: string): HttpTransport {
  const root = baseUrl.replace(/\/+$/, '');
  return {
    async request<T>(opts: {
      method: string;
      path: string;
      body?: unknown;
      token?: string | null;
    }): Promise<T> {
      const { method, path, body, token } = opts;
      const url = `${root}${path.startsWith('/') ? path : `/${path}`}`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (res.status === 204) {
        return undefined as T;
      }

      const text = await res.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (!res.ok) {
        const msg =
          typeof parsed === 'object' && parsed && 'message' in parsed
            ? String((parsed as { message: unknown }).message)
            : `HTTP ${res.status}`;
        throw new SyncHttpError(res.status, msg, parsed);
      }

      return parsed as T;
    },
  };
}

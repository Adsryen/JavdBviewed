/**
 * @file entityMapping.test.ts
 * @description 实体映射纯函数级冒烟（不依赖真实 IDB）
 */
import { describe, expect, it } from 'vitest';
import type { SyncEntity } from '@javdb/sync-protocol';

function toEntity(type: string, id: string, payload: unknown, updatedAt?: number): SyncEntity {
  const ts = typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : Date.now();
  return { id, type, revision: 1, updatedAt: ts, payload };
}

describe('entity mapping helpers', () => {
  it('builds video entity envelope', () => {
    const e = toEntity('video', 'ABC-123', { id: 'ABC-123', status: 'viewed' }, 100);
    expect(e.type).toBe('video');
    expect(e.id).toBe('ABC-123');
    expect(e.updatedAt).toBe(100);
    expect((e.payload as { status: string }).status).toBe('viewed');
  });
});

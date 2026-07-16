/**
 * @file toSyncEntity.test.ts
 */
import { describe, expect, it } from 'vitest';
import { actorToSyncEntity, videoToSyncEntity, preferenceToSyncEntity } from './toSyncEntity';

describe('toSyncEntity', () => {
  it('maps video and skips empty id', () => {
    expect(videoToSyncEntity({ id: '', title: 'x' } as any)).toBeNull();
    const e = videoToSyncEntity({
      id: 'ABC-1',
      title: 't',
      status: 'viewed',
      createdAt: 1,
      updatedAt: 2,
    } as any);
    expect(e?.type).toBe('video');
    expect(e?.id).toBe('ABC-1');
    expect(e?.updatedAt).toBe(2);
  });

  it('maps actor and preference', () => {
    expect(actorToSyncEntity({ id: 'a1', name: 'n', updatedAt: 9 } as any)?.type).toBe('actor');
    const p = preferenceToSyncEntity('display', { theme: 'dark' });
    expect(p.type).toBe('preference');
    expect((p.payload as { key: string }).key).toBe('display');
  });
});

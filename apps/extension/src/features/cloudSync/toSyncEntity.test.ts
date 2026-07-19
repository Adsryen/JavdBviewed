/**
 * @file toSyncEntity.test.ts
 */
import { describe, expect, it } from 'vitest';
import {
  actorToSyncEntity,
  insightsReportToSyncEntity,
  insightsViewToSyncEntity,
  magnetToSyncEntity,
  newWorkDailyStatToSyncEntity,
  preferenceToSyncEntity,
  storageItemToSyncEntity,
  videoToSyncEntity,
} from './toSyncEntity';

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

  it('maps newly synced persisted asset types', () => {
    expect(
      magnetToSyncEntity({ key: 'javdb:ABC-1:h1', videoId: 'ABC-1', createdAt: 10 } as any),
    ).toMatchObject({ type: 'magnet', id: 'javdb:ABC-1:h1', updatedAt: 10 });
    expect(insightsViewToSyncEntity({ date: '2026-07-18', updatedAt: 11 } as any)).toMatchObject({
      type: 'insights_view',
      id: '2026-07-18',
      updatedAt: 11,
    });
    expect(insightsReportToSyncEntity({ month: '2026-07', createdAt: 12 } as any)).toMatchObject({
      type: 'insights_report',
      id: '2026-07',
      updatedAt: 12,
    });
    expect(newWorkDailyStatToSyncEntity({ date: '2026-07-19', createdAt: 13 } as any)).toMatchObject({
      type: 'new_work_daily_stat',
      id: '2026-07-19',
      updatedAt: 13,
    });
    expect(storageItemToSyncEntity('settings', { theme: 'dark' }, 14)).toMatchObject({
      type: 'storage_item',
      id: 'settings',
      updatedAt: 14,
      payload: { key: 'settings', value: { theme: 'dark' } },
    });
  });

  it('skips newly synced asset records without stable ids', () => {
    expect(magnetToSyncEntity({ videoId: 'ABC-1' } as any)).toBeNull();
    expect(insightsViewToSyncEntity({ total: 1 } as any)).toBeNull();
    expect(insightsReportToSyncEntity({ html: '<p>x</p>' } as any)).toBeNull();
    expect(newWorkDailyStatToSyncEntity({ total: 1 } as any)).toBeNull();
    expect(storageItemToSyncEntity('', { value: true })).toBeNull();
  });
});

/**
 * @file recycleBinModel.test.ts
 * @description 回收站纯模型单测
 * @module dashboard/tabs
 */
import { describe, expect, it } from 'vitest';
import {
  RECYCLE_BIN_RETENTION_MS,
  buildRecyclePaginationPages,
  formatRecycleRemainingDays,
  getRecycleVideoCoverUrl,
  getRecycleVideoJavdbUrl,
  selectAllRecycleIds,
} from './recycleBinModel';

describe('recycleBinModel', () => {
  it('formats remaining days and imminent purge', () => {
    const now = 1_700_000_000_000;
    expect(formatRecycleRemainingDays(now - RECYCLE_BIN_RETENTION_MS - 1, now)).toBe('即将清理');
    expect(formatRecycleRemainingDays(now - 2 * 24 * 60 * 60 * 1000, now)).toMatch(/天/);
  });

  it('resolves cover and javdb url', () => {
    expect(getRecycleVideoCoverUrl({ javdbImage: 'a.jpg' } as any)).toBe('a.jpg');
    expect(getRecycleVideoCoverUrl({ coverImage: 'b.jpg' } as any)).toBe('b.jpg');
    expect(getRecycleVideoJavdbUrl({ javdbUrl: 'https://x' } as any)).toBe('https://x');
    expect(getRecycleVideoJavdbUrl({ id: 'SSIS-001' } as any)).toContain('SSIS-001');
  });

  it('builds pagination bounds', () => {
    const p = buildRecyclePaginationPages(45, 1, 20);
    expect(p.totalPages).toBe(3);
    expect(p.page).toBe(1);
    expect(p.hasPrev).toBe(true);
    expect(p.hasNext).toBe(true);
  });

  it('selects all ids', () => {
    expect([...selectAllRecycleIds(['a', 'b'])]).toEqual(['a', 'b']);
  });
});

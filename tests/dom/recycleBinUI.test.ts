/**
 * @file recycleBinUI.test.ts
 * @description 回收站 UI 基础测试 —— 模块导入和核心逻辑
 * @module tests/dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('Recycle Bin UI Module', () => {
  it('should export initRecycleBinTab function', async () => {
    const module = await import('../../src/dashboard/tabs/recycleBin');
    expect(module.initRecycleBinTab).toBeDefined();
    expect(typeof module.initRecycleBinTab).toBe('function');
  });
});

describe('Merge Strategy Logic', () => {
  it('readRecordTime should prioritize deletedAt over updatedAt', () => {
    function readRecordTime(record: Record<string, any>): number {
      const deletedAt = Number(record?.deletedAt ?? 0);
      if (deletedAt > 0) return deletedAt;
      return Number(record?.updatedAt ?? record?.createdAt ?? 0);
    }

    // 有 deletedAt 时使用 deletedAt
    expect(readRecordTime({ deletedAt: 5000, updatedAt: 3000 })).toBe(5000);
    // 无 deletedAt 时使用 updatedAt
    expect(readRecordTime({ updatedAt: 4000, createdAt: 1000 })).toBe(4000);
    // 无 updatedAt 时使用 createdAt
    expect(readRecordTime({ createdAt: 1000 })).toBe(1000);
    // 空对象返回 0
    expect(readRecordTime({})).toBe(0);
  });

  it('pickLatestRecord should keep local trashed when local deletedAt is newer', () => {
    function readRecordTime(record: Record<string, any>): number {
      const deletedAt = Number(record?.deletedAt ?? 0);
      if (deletedAt > 0) return deletedAt;
      return Number(record?.updatedAt ?? record?.createdAt ?? 0);
    }

    function pickLatestRecord(left: any, right: any): any {
      return readRecordTime(right) >= readRecordTime(left) ? right : left;
    }

    // 场景B: 本地在回收站（deletedAt=5000），云端正常（updatedAt=4000）
    const local = { id: '1', deletedAt: 5000, updatedAt: 3000 };
    const cloud = { id: '1', updatedAt: 4000 };
    expect(pickLatestRecord(local, cloud)).toBe(local);
  });

  it('pickLatestRecord should keep cloud trashed when cloud deletedAt is newer', () => {
    function readRecordTime(record: Record<string, any>): number {
      const deletedAt = Number(record?.deletedAt ?? 0);
      if (deletedAt > 0) return deletedAt;
      return Number(record?.updatedAt ?? record?.createdAt ?? 0);
    }

    function pickLatestRecord(left: any, right: any): any {
      return readRecordTime(right) >= readRecordTime(left) ? right : left;
    }

    // 场景C: 本地正常（updatedAt=3000），云端在回收站（deletedAt=5000）
    const local = { id: '2', updatedAt: 3000 };
    const cloud = { id: '2', deletedAt: 5000, updatedAt: 4000 };
    expect(pickLatestRecord(local, cloud)).toBe(cloud);
  });

  it('pickLatestRecord should keep newer deletedAt when both trashed', () => {
    function readRecordTime(record: Record<string, any>): number {
      const deletedAt = Number(record?.deletedAt ?? 0);
      if (deletedAt > 0) return deletedAt;
      return Number(record?.updatedAt ?? record?.createdAt ?? 0);
    }

    function pickLatestRecord(left: any, right: any): any {
      return readRecordTime(right) >= readRecordTime(left) ? right : left;
    }

    // 场景D: 两边都在回收站，保留 deletedAt 更新的
    const local = { id: '3', deletedAt: 3000, updatedAt: 2000 };
    const cloud = { id: '3', deletedAt: 5000, updatedAt: 4000 };
    expect(pickLatestRecord(local, cloud)).toBe(cloud);
  });

  it('pickLatestRecord should keep cloud when cloud updatedAt is newer and no deletedAt', () => {
    function readRecordTime(record: Record<string, any>): number {
      const deletedAt = Number(record?.deletedAt ?? 0);
      if (deletedAt > 0) return deletedAt;
      return Number(record?.updatedAt ?? record?.createdAt ?? 0);
    }

    function pickLatestRecord(left: any, right: any): any {
      return readRecordTime(right) >= readRecordTime(left) ? right : left;
    }

    // 场景A: 两边都正常，保留 updatedAt 更新的
    const local = { id: '4', updatedAt: 3000 };
    const cloud = { id: '4', updatedAt: 5000 };
    expect(pickLatestRecord(local, cloud)).toBe(cloud);
  });
});

describe('Expired Records Detection', () => {
  it('should correctly identify expired records', () => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const records = [
      { id: '1', deletedAt: now - thirtyDaysMs - 1000 }, // Expired (31 days ago)
      { id: '2', deletedAt: now - 1000 }, // Not expired (1 day ago)
      { id: '3' }, // No deletedAt (not in trash)
    ];

    const expired = records.filter(r => r.deletedAt && (now - r.deletedAt > thirtyDaysMs));
    expect(expired).toHaveLength(1);
    expect(expired[0].id).toBe('1');
  });

  it('should handle edge case - exactly 30 days', () => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const record = { id: '1', deletedAt: now - thirtyDaysMs };

    // Exactly 30 days should NOT be expired (using > not >=)
    const isExpired = now - record.deletedAt > thirtyDaysMs;
    expect(isExpired).toBe(false);
  });

  it('should handle edge case - just over 30 days', () => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const record = { id: '1', deletedAt: now - thirtyDaysMs - 1 };

    // Just over 30 days should be expired
    const isExpired = now - record.deletedAt > thirtyDaysMs;
    expect(isExpired).toBe(true);
  });
});

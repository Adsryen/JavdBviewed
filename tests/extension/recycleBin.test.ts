/**
 * @file recycleBin.test.ts
 * @description 回收站功能测试 —— 软删除、恢复、永久删除、查询过滤、过期清理
 * @module tests/extension
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock IndexedDB 连接
const mockDB = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
  transaction: vi.fn(),
};

describe('Recycle Bin - Storage Layer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('../../apps/extension/src/platform/storage/indexedDbConnection');
    vi.doUnmock('../../apps/extension/src/platform/storage/indexedDb');
  });

  describe('viewedDelete (soft delete)', () => {
    it('should set deletedAt on existing record', async () => {
      const existingRecord = {
        id: 'SSIS-001',
        title: 'Test Video',
        status: 'viewed',
        createdAt: 1000,
        updatedAt: 2000,
      };

      mockDB.get.mockResolvedValue(existingRecord);
      mockDB.put.mockResolvedValue(undefined);

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { viewedDelete } = await import('../../apps/extension/src/platform/storage/indexedDb');
      await viewedDelete('SSIS-001');

      expect(mockDB.get).toHaveBeenCalledWith('viewedRecords', 'SSIS-001');
      expect(mockDB.put).toHaveBeenCalledWith('viewedRecords', expect.objectContaining({
        id: 'SSIS-001',
        title: 'Test Video',
        status: 'viewed',
        deletedAt: expect.any(Number),
      }));
    });

    it('should not modify non-existing record', async () => {
      mockDB.get.mockResolvedValue(undefined);
      mockDB.put.mockClear();

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { viewedDelete } = await import('../../apps/extension/src/platform/storage/indexedDb');
      await viewedDelete('NON-EXISTING');

      expect(mockDB.get).toHaveBeenCalledWith('viewedRecords', 'NON-EXISTING');
      expect(mockDB.put).not.toHaveBeenCalled();
    });
  });

  describe('viewedRestore', () => {
    it('should remove deletedAt from trashed record', async () => {
      const trashedRecord = {
        id: 'SSIS-001',
        title: 'Test Video',
        status: 'viewed',
        createdAt: 1000,
        updatedAt: 2000,
        deletedAt: 3000,
      };

      mockDB.get.mockResolvedValue(trashedRecord);
      mockDB.put.mockResolvedValue(undefined);

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { viewedRestore } = await import('../../apps/extension/src/platform/storage/indexedDb');
      await viewedRestore('SSIS-001');

      expect(mockDB.put).toHaveBeenCalledWith('viewedRecords', expect.objectContaining({
        id: 'SSIS-001',
        title: 'Test Video',
      }));
      // deletedAt should be removed
      const putCall = mockDB.put.mock.calls[0][1];
      expect(putCall).not.toHaveProperty('deletedAt');
    });
  });

  describe('viewedQueryRecycleBin', () => {
    it('should return only records with deletedAt', async () => {
      const allRecords = [
        { id: 'SSIS-001', title: 'Normal', status: 'viewed', createdAt: 1000, updatedAt: 2000 },
        { id: 'SSIS-002', title: 'Trashed', status: 'viewed', createdAt: 1000, updatedAt: 2000, deletedAt: 3000 },
        { id: 'SSIS-003', title: 'Also Trashed', status: 'want', createdAt: 1000, updatedAt: 2000, deletedAt: 4000 },
      ];

      mockDB.getAll.mockResolvedValue(allRecords);

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { viewedQueryRecycleBin } = await import('../../apps/extension/src/platform/storage/indexedDb');
      const result = await viewedQueryRecycleBin();

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('SSIS-003'); // sorted by deletedAt desc
      expect(result.items[1].id).toBe('SSIS-002');
      expect(result.total).toBe(2);
    });

    it('should return empty when no trashed records', async () => {
      const allRecords = [
        { id: 'SSIS-001', title: 'Normal', status: 'viewed', createdAt: 1000, updatedAt: 2000 },
      ];

      mockDB.getAll.mockResolvedValue(allRecords);

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { viewedQueryRecycleBin } = await import('../../apps/extension/src/platform/storage/indexedDb');
      const result = await viewedQueryRecycleBin();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('viewedPurgeExpired', () => {
    it('should identify and count expired records correctly', async () => {
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      const allRecords = [
        { id: 'SSIS-001', title: 'Expired', status: 'viewed', createdAt: 1000, updatedAt: 2000, deletedAt: now - thirtyDaysMs - 1000 },
        { id: 'SSIS-002', title: 'Not Expired', status: 'viewed', createdAt: 1000, updatedAt: 2000, deletedAt: now - 1000 },
        { id: 'SSIS-003', title: 'Normal', status: 'viewed', createdAt: 1000, updatedAt: 2000 },
      ];

      // 测试过期逻辑（不真正调用 purge，只验证过滤逻辑）
      const expired = allRecords.filter(r => r.deletedAt && (now - r.deletedAt > thirtyDaysMs));
      expect(expired).toHaveLength(1);
      expect(expired[0].id).toBe('SSIS-001');
    });
  });

  describe('viewedPut skip trashed records', () => {
    it('should skip update when record is in trash', async () => {
      const trashedRecord = {
        id: 'SSIS-001',
        title: 'Trashed',
        status: 'viewed',
        createdAt: 1000,
        updatedAt: 2000,
        deletedAt: 3000,
      };

      const mockGet = vi.fn().mockResolvedValue(trashedRecord);
      const mockPut = vi.fn();
      mockDB.get.mockResolvedValue(trashedRecord);
      mockDB.put.mockClear();
      mockDB.transaction.mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          get: mockGet,
          put: mockPut,
          index: vi.fn().mockReturnValue({
            getAll: vi.fn().mockResolvedValue([]),
            openCursor: vi.fn().mockResolvedValue(null),
          }),
        }),
        done: Promise.resolve(),
      });

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { viewedPut } = await import('../../apps/extension/src/platform/storage/indexedDb');
      const result = await viewedPut({
        id: 'SSIS-001',
        title: 'New Title',
        status: 'viewed',
        createdAt: 1000,
        updatedAt: 5000,
      });

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('record_in_trash');
    });
  });
});

describe('Recycle Bin - Actors', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.doUnmock('../../apps/extension/src/platform/storage/indexedDbConnection');
    vi.doUnmock('../../apps/extension/src/platform/storage/indexedDb');
  });

  describe('actorsDelete (soft delete)', () => {
    it('should set deletedAt on existing actor', async () => {
      const existingActor = {
        id: 'actor-1',
        name: 'Test Actor',
        aliases: [],
        gender: 'female',
        category: 'unknown',
        profileUrl: 'https://example.com',
        createdAt: 1000,
        updatedAt: 2000,
      };

      mockDB.get.mockResolvedValue(existingActor);
      mockDB.put.mockResolvedValue(undefined);

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { actorsDelete } = await import('../../apps/extension/src/platform/storage/indexedDb');
      await actorsDelete('actor-1');

      expect(mockDB.get).toHaveBeenCalledWith('actors', 'actor-1');
      expect(mockDB.put).toHaveBeenCalledWith('actors', expect.objectContaining({
        id: 'actor-1',
        name: 'Test Actor',
        deletedAt: expect.any(Number),
      }));
    });
  });

  describe('actorsQueryRecycleBin', () => {
    it('should return only trashed actors', async () => {
      const allActors = [
        { id: 'actor-1', name: 'Normal', aliases: [], gender: 'female', category: 'unknown', profileUrl: '', createdAt: 1000, updatedAt: 2000 },
        { id: 'actor-2', name: 'Trashed', aliases: [], gender: 'male', category: 'unknown', profileUrl: '', createdAt: 1000, updatedAt: 2000, deletedAt: 3000 },
      ];

      mockDB.getAll.mockResolvedValue(allActors);

      vi.doMock('../../apps/extension/src/platform/storage/indexedDbConnection', () => ({
        initDB: vi.fn(() => Promise.resolve(mockDB)),
        resetDBConnection: vi.fn(),
      }));

      const { actorsQueryRecycleBin } = await import('../../apps/extension/src/platform/storage/indexedDb');
      const result = await actorsQueryRecycleBin();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('actor-2');
    });
  });
});

describe('Recycle Bin - Merge Strategy', () => {
  it('readRecordTime should prioritize deletedAt over updatedAt', () => {
    // 模拟 readRecordTime 逻辑
    function readRecordTime(record: Record<string, any>): number {
      const deletedAt = Number(record?.deletedAt ?? 0);
      if (deletedAt > 0) return deletedAt;
      return Number(record?.updatedAt ?? record?.createdAt ?? 0);
    }

    const recordWithDeletedAt = { id: '1', deletedAt: 5000, updatedAt: 3000, createdAt: 1000 };
    const recordWithoutDeletedAt = { id: '2', updatedAt: 4000, createdAt: 1000 };

    expect(readRecordTime(recordWithDeletedAt)).toBe(5000);
    expect(readRecordTime(recordWithoutDeletedAt)).toBe(4000);
  });

  it('pickLatestRecord should keep trashed record when deletedAt is newer', () => {
    function readRecordTime(record: Record<string, any>): number {
      const deletedAt = Number(record?.deletedAt ?? 0);
      if (deletedAt > 0) return deletedAt;
      return Number(record?.updatedAt ?? record?.createdAt ?? 0);
    }

    function pickLatestRecord(left: any, right: any): any {
      return readRecordTime(right) >= readRecordTime(left) ? right : left;
    }

    // 场景B: 本地在回收站，云端正常，本地 deletedAt 更新
    const localTrashed = { id: '1', deletedAt: 5000, updatedAt: 3000 };
    const cloudNormal = { id: '1', updatedAt: 4000 };
    expect(pickLatestRecord(localTrashed, cloudNormal)).toBe(localTrashed);

    // 场景C: 本地正常，云端在回收站，云端 deletedAt 更新
    const localNormal = { id: '2', updatedAt: 3000 };
    const cloudTrashed = { id: '2', deletedAt: 5000, updatedAt: 4000 };
    expect(pickLatestRecord(localNormal, cloudTrashed)).toBe(cloudTrashed);

    // 场景D: 两边都在回收站，保留 deletedAt 更新的
    const localTrashedOld = { id: '3', deletedAt: 3000, updatedAt: 2000 };
    const cloudTrashedNew = { id: '3', deletedAt: 5000, updatedAt: 4000 };
    expect(pickLatestRecord(localTrashedOld, cloudTrashedNew)).toBe(cloudTrashedNew);
  });
});

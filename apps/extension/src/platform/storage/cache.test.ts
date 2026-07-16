// src/platform/storage/cache.test.ts
// 缓存系统测试

import { beforeEach, afterEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { CacheManager, VideoDetail, ResourceData } from './cache';

// Mock storage functions
vi.mock('./chromeStorage', () => ({
  getValue: vi.fn(),
  setValue: vi.fn(),
}));

import { getValue, setValue } from './chromeStorage';

const mockGetValue = getValue as MockedFunction<typeof getValue>;
const mockSetValue = setValue as MockedFunction<typeof setValue>;

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheManager = new CacheManager({
      defaultTTL: 1000, // 1秒用于测试
      maxEntries: 3,
      cleanupInterval: 5000,
    });
  });

  afterEach(() => {
    cacheManager.destroy();
  });

  describe('VideoDetail缓存', () => {
    const testVideoDetail: VideoDetail = {
      id: 'TEST-001',
      title: '测试视频',
      translatedTitle: 'Test Video',
      coverImage: 'https://example.com/cover.jpg',
    };

    it('应该能够设置和获取视频详情', async () => {
      mockGetValue.mockResolvedValue({});
      mockSetValue.mockResolvedValue();

      await cacheManager.setVideoDetail('TEST-001', testVideoDetail);
      
      // 模拟获取缓存
      const now = Date.now();
      mockGetValue.mockResolvedValue({
        'TEST-001': {
          data: testVideoDetail,
          timestamp: now,
          expireAt: now + 1000,
        },
      });

      const result = await cacheManager.getVideoDetail('TEST-001');
      expect(result).toEqual(testVideoDetail);
    });

    it('应该返回null当缓存过期时', async () => {
      const now = Date.now();
      mockGetValue.mockResolvedValue({
        'TEST-001': {
          data: testVideoDetail,
          timestamp: now - 2000,
          expireAt: now - 1000, // 已过期
        },
      });
      mockSetValue.mockResolvedValue();

      const result = await cacheManager.getVideoDetail('TEST-001');
      expect(result).toBeNull();
    });

    it('应该返回null当缓存不存在时', async () => {
      mockGetValue.mockResolvedValue({});

      const result = await cacheManager.getVideoDetail('TEST-001');
      expect(result).toBeNull();
    });
  });

  describe('Resource缓存', () => {
    const testResourceData: ResourceData = {
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      videos: ['https://example.com/video1.mp4'],
      magnets: [{
        name: 'Test Movie',
        link: 'magnet:?xt=urn:btih:test',
        size: '1.5GB',
        date: '2024-01-01',
        source: 'TestSite',
        hasSubtitle: true,
      }],
    };

    it('应该能够设置和获取资源数据', async () => {
      mockGetValue.mockResolvedValue({});
      mockSetValue.mockResolvedValue();

      await cacheManager.setResource('TEST-001', testResourceData);
      
      const now = Date.now();
      mockGetValue.mockResolvedValue({
        'TEST-001': {
          data: testResourceData,
          timestamp: now,
          expireAt: now + 1000,
        },
      });

      const result = await cacheManager.getResource('TEST-001');
      expect(result).toEqual(testResourceData);
    });
  });

  describe('Translation缓存', () => {
    it('应该能够设置和获取翻译', async () => {
      mockGetValue.mockResolvedValue({});
      mockSetValue.mockResolvedValue();

      const originalText = '美少女戦士セーラームーン';
      const translatedText = '美少女战士水手月亮';

      await cacheManager.setTranslation(originalText, translatedText);
      
      const now = Date.now();
      const hashedKey = cacheManager['hashString'](originalText);
      mockGetValue.mockResolvedValue({
        [hashedKey]: {
          data: translatedText,
          timestamp: now,
          expireAt: now + 1000,
        },
      });

      const result = await cacheManager.getTranslation(originalText);
      expect(result).toBe(translatedText);
    });
  });

  describe('缓存清理', () => {
    it('应该清理过期的缓存条目', async () => {
      const now = Date.now();
      const expiredEntry = {
        data: { id: 'expired' },
        timestamp: now - 2000,
        expireAt: now - 1000,
      };
      const validEntry = {
        data: { id: 'valid' },
        timestamp: now,
        expireAt: now + 1000,
      };

      mockGetValue
        .mockResolvedValue({})
        .mockResolvedValueOnce({ expired: expiredEntry, valid: validEntry });

      mockSetValue.mockResolvedValue();

      await cacheManager.cleanup();

      // 验证setValue被调用，且只保留有效条目
      expect(mockSetValue).toHaveBeenCalledWith(
        expect.any(String),
        { valid: validEntry }
      );
    });
  });

  describe('缓存统计', () => {
    it('应该返回正确的缓存统计信息', async () => {
      const mockCache = {
        'item1': { data: {}, timestamp: Date.now(), expireAt: Date.now() + 1000 },
        'item2': { data: {}, timestamp: Date.now(), expireAt: Date.now() + 1000 },
      };

      mockGetValue.mockResolvedValue(mockCache);

      const stats = await cacheManager.getStats();
      
      expect(stats).toHaveProperty('VIDEO_DETAILS');
      expect(stats).toHaveProperty('RESOURCES');
      expect(stats).toHaveProperty('TRANSLATIONS');
      expect(stats.VIDEO_DETAILS.count).toBe(2);
    });
  });
});

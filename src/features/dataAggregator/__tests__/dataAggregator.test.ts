// src/features/dataAggregator/__tests__/dataAggregator.test.ts
// 数据聚合器测试

import { beforeEach, describe, expect, it, vi, type Mocked, type MockedClass } from 'vitest';
import { DataAggregator } from '../index';
import { BlogJavSource } from '../sources/blogJav';
import { TranslatorService } from '../sources/translator';
import { JavLibrarySource } from '../sources/javLibrary';
import { AITranslatorService } from '../sources/aiTranslator';

const cacheMocks = vi.hoisted(() => ({
  getVideoDetail: vi.fn(),
  clearAll: vi.fn(),
  getStats: vi.fn(),
}));

// Mock dependencies
vi.mock('../../../platform/storage/cache', () => ({
  globalCache: {
    getVideoDetail: cacheMocks.getVideoDetail,
    clearAll: cacheMocks.clearAll,
    getStats: cacheMocks.getStats,
  },
}));
vi.mock('../sources/blogJav');
vi.mock('../sources/translator');
vi.mock('../sources/javLibrary');
vi.mock('../sources/aiTranslator');

const MockedBlogJavSource = BlogJavSource as MockedClass<typeof BlogJavSource>;
const MockedTranslatorService = TranslatorService as MockedClass<typeof TranslatorService>;
const MockedJavLibrarySource = JavLibrarySource as MockedClass<typeof JavLibrarySource>;
const MockedAITranslatorService = AITranslatorService as MockedClass<typeof AITranslatorService>;

describe('DataAggregator', () => {
  let dataAggregator: DataAggregator;
  let mockBlogJav: Mocked<BlogJavSource>;
  let mockTranslator: Mocked<TranslatorService>;
  let mockJavLibrary: Mocked<JavLibrarySource>;
  let mockAITranslator: Mocked<AITranslatorService>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 创建mock实例
    mockBlogJav = {
      getCoverImage: vi.fn(),
      searchVideo: vi.fn(),
      batchGetCoverImages: vi.fn(),
    } as any;

    mockTranslator = {
      translate: vi.fn(),
      batchTranslate: vi.fn(),
    } as any;

    mockJavLibrary = {
      getRating: vi.fn(),
      getActors: vi.fn(),
      getVideoInfo: vi.fn(),
    } as any;

    mockAITranslator = {
      translate: vi.fn(),
      updateConfig: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(false),
      getConfig: vi.fn(() => ({})),
    } as any;

    // Mock构造函数
    MockedBlogJavSource.mockImplementation(() => mockBlogJav);
    MockedTranslatorService.mockImplementation(() => mockTranslator);
    MockedJavLibrarySource.mockImplementation(() => mockJavLibrary);
    MockedAITranslatorService.mockImplementation(() => mockAITranslator);

    dataAggregator = new DataAggregator({
      enableCache: false, // 禁用缓存以简化测试
      sources: {
        blogJav: { enabled: true, baseUrl: 'https://test.com', timeout: 5000 },
        translator: { enabled: true, service: 'google', timeout: 5000, sourceLanguage: 'ja', targetLanguage: 'zh-CN' },
        javLibrary: { enabled: true, baseUrl: 'https://test.com', timeout: 5000, language: 'en' },
        javStore: { enabled: false, baseUrl: '', timeout: 5000 },
        javSpyl: { enabled: false, baseUrl: '', timeout: 5000 },
        dmm: { enabled: false, baseUrl: '', timeout: 5000 },
        fc2: { enabled: false, baseUrl: '', timeout: 5000 },
      },
    });
  });

  describe('getEnhancedVideoInfo', () => {
    it('应该聚合多个数据源的信息', async () => {
      const videoId = 'SSIS-123';
      
      // Mock各数据源的返回值
      mockBlogJav.getCoverImage.mockResolvedValue({
        success: true,
        data: [{
          url: 'https://example.com/cover.jpg',
          type: 'cover',
          quality: 'high',
        }],
        source: 'BlogJav',
        timestamp: Date.now(),
      });

      mockJavLibrary.getVideoInfo.mockResolvedValue({
        success: true,
        data: {
          id: videoId,
          title: 'Test Video Title',
          releaseDate: '2026-01-01',
          studio: { name: 'Test Studio' },
          genre: ['Test Genre'],
          lastUpdated: Date.now(),
        },
        source: 'JavLibrary',
        timestamp: Date.now(),
      });

      mockTranslator.translate.mockResolvedValue({
        success: true,
        data: {
          originalText: 'Test Video Title',
          translatedText: '测试视频标题',
          sourceLanguage: 'ja',
          targetLanguage: 'zh-CN',
          service: 'google',
          timestamp: Date.now(),
        },
        source: 'Translator',
        timestamp: Date.now(),
      });

      const result = await dataAggregator.getEnhancedVideoInfo(videoId);

      expect(result.id).toBe(videoId);
      expect(result.images).toHaveLength(1);
      expect(result.images![0].url).toBe('https://example.com/cover.jpg');
      expect(result.title).toBe('Test Video Title');
      expect(result.releaseDate).toBe('2026-01-01');
      expect(result.studio?.name).toBe('Test Studio');
      expect(result.genre).toEqual(['Test Genre']);
      expect(result.translatedTitle).toBe('测试视频标题');
    });

    it('应该处理部分数据源失败的情况', async () => {
      const videoId = 'SSIS-456';
      
      // BlogJav成功，JavLibrary失败
      mockBlogJav.getCoverImage.mockResolvedValue({
        success: true,
        data: [{
          url: 'https://example.com/cover.jpg',
          type: 'cover',
          quality: 'medium',
        }],
        source: 'BlogJav',
        timestamp: Date.now(),
      });

      mockJavLibrary.getVideoInfo.mockRejectedValue(new Error('Network error'));
      mockTranslator.translate.mockRejectedValue(new Error('Translation failed'));

      const result = await dataAggregator.getEnhancedVideoInfo(videoId);

      expect(result.id).toBe(videoId);
      expect(result.images).toHaveLength(1);
      expect(result.ratings).toBeUndefined();
      expect(result.translatedTitle).toBeUndefined();
    });

    it('应该处理所有数据源都失败的情况', async () => {
      const videoId = 'SSIS-789';
      
      mockBlogJav.getCoverImage.mockRejectedValue(new Error('BlogJav failed'));
      mockJavLibrary.getVideoInfo.mockRejectedValue(new Error('JavLibrary failed'));

      const result = await dataAggregator.getEnhancedVideoInfo(videoId);

      expect(result.id).toBe(videoId);
      expect(result.images).toBeUndefined();
      expect(result.ratings).toBeUndefined();
      expect(result.actors).toBeUndefined();
    });
  });

  describe('translateText', () => {
    it('应该成功翻译文本', async () => {
      const originalText = 'テストタイトル';
      const translatedText = '测试标题';

      mockTranslator.translate.mockResolvedValue({
        success: true,
        data: {
          originalText,
          translatedText,
          sourceLanguage: 'ja',
          targetLanguage: 'zh-CN',
          service: 'google',
          timestamp: Date.now(),
        },
        source: 'Translator',
        timestamp: Date.now(),
      });

      const result = await dataAggregator.translateText(originalText);

      expect(result.success).toBe(true);
      expect(result.data?.translatedText).toBe(translatedText);
    });

    it('应该处理翻译失败', async () => {
      const originalText = 'テストタイトル';

      mockTranslator.translate.mockResolvedValue({
        success: false,
        error: 'Translation service unavailable',
        source: 'Translator',
        timestamp: Date.now(),
      });

      const result = await dataAggregator.translateText(originalText);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Translation service unavailable');
    });

    it('应该在翻译服务禁用时返回错误', async () => {
      const disabledAggregator = new DataAggregator({
        sources: {
          translator: { enabled: false, service: 'google', timeout: 5000, sourceLanguage: 'ja', targetLanguage: 'zh-CN' },
          blogJav: { enabled: false, baseUrl: '', timeout: 5000 },
          javLibrary: { enabled: false, baseUrl: '', timeout: 5000, language: 'en' },
          javStore: { enabled: false, baseUrl: '', timeout: 5000 },
          javSpyl: { enabled: false, baseUrl: '', timeout: 5000 },
          dmm: { enabled: false, baseUrl: '', timeout: 5000 },
          fc2: { enabled: false, baseUrl: '', timeout: 5000 },
        },
      });

      const result = await disabledAggregator.translateText('テスト');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Translator is disabled');
    });
  });

  describe('batchGetCoverImages', () => {
    it('应该批量获取封面图片', async () => {
      const videoIds = ['SSIS-123', 'IPX-456'];

      mockBlogJav.batchGetCoverImages.mockResolvedValue([
        {
          success: true,
          data: [{
            url: 'https://example.com/cover1.jpg',
            type: 'cover',
            quality: 'high',
          }],
          source: 'BlogJav',
          timestamp: Date.now(),
        },
        {
          success: true,
          data: [{
            url: 'https://example.com/cover2.jpg',
            type: 'cover',
            quality: 'medium',
          }],
          source: 'BlogJav',
          timestamp: Date.now(),
        },
      ]);

      const result = await dataAggregator.batchGetCoverImages(videoIds);

      expect(result.results).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
    });
  });

  describe('配置管理', () => {
    it('应该能够更新配置', () => {
      const newConfig = {
        enableCache: true,
        cacheExpiration: 48,
      };

      dataAggregator.updateConfig(newConfig);
      const config = dataAggregator.getConfig();

      expect(config.enableCache).toBe(true);
      expect(config.cacheExpiration).toBe(48);
    });

    it('应该返回当前配置', () => {
      const config = dataAggregator.getConfig();

      expect(config).toHaveProperty('enableCache');
      expect(config).toHaveProperty('sources');
      expect(config).toHaveProperty('concurrency');
    });
  });
});

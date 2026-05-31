import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getVideoDetail: vi.fn(),
  clearAll: vi.fn(),
  getStats: vi.fn(),
  getCoverImage: vi.fn(),
  getVideoInfo: vi.fn(),
  translate: vi.fn(),
}));

vi.mock('../../src/platform/storage/cache', () => ({
  globalCache: {
    getVideoDetail: mocks.getVideoDetail,
    clearAll: mocks.clearAll,
    getStats: mocks.getStats,
  },
}));

vi.mock('../../src/features/dataAggregator/sources/blogJav', () => ({
  DEFAULT_BLOGJAV_CONFIG: {
    enabled: true,
    baseUrl: 'https://blogjav.example',
    timeout: 10000,
    maxRetries: 2,
  },
  BlogJavSource: vi.fn(() => ({
    getCoverImage: mocks.getCoverImage,
    batchGetCoverImages: vi.fn(),
  })),
}));

vi.mock('../../src/features/dataAggregator/sources/javLibrary', () => ({
  DEFAULT_JAVLIBRARY_CONFIG: {
    enabled: true,
    baseUrl: 'https://javlibrary.example',
    timeout: 15000,
    maxRetries: 2,
    language: 'en',
  },
  JavLibrarySource: vi.fn(() => ({
    getVideoInfo: mocks.getVideoInfo,
  })),
}));

vi.mock('../../src/features/dataAggregator/sources/translator', () => ({
  DEFAULT_TRANSLATOR_CONFIG: {
    enabled: true,
    service: 'google',
    timeout: 5000,
    maxRetries: 2,
    sourceLanguage: 'ja',
    targetLanguage: 'zh-CN',
  },
  TranslatorService: vi.fn(() => ({
    translate: mocks.translate,
  })),
}));

vi.mock('../../src/features/dataAggregator/sources/aiTranslator', () => ({
  DEFAULT_AI_TRANSLATOR_CONFIG: {
    enabled: false,
    provider: 'openai',
    apiKey: '',
    model: '',
    timeout: 30000,
    maxRetries: 2,
    targetLanguage: 'zh-CN',
  },
  AITranslatorService: vi.fn(() => ({
    translate: vi.fn(),
    getConfig: vi.fn(() => ({})),
  })),
}));

describe('DataAggregator default behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getVideoDetail.mockResolvedValue({
      id: 'CACHED',
      title: 'Cached title',
      lastUpdated: Date.now(),
    });
    mocks.clearAll.mockResolvedValue(undefined);
    mocks.getStats.mockResolvedValue({});
    mocks.getCoverImage.mockResolvedValue({
      success: true,
      data: [{ url: 'https://example.com/cover.jpg', type: 'cover' }],
      source: 'BlogJav',
      timestamp: Date.now(),
    });
    mocks.getVideoInfo.mockResolvedValue({
      success: true,
      data: {
        id: 'SSIS-001',
        title: 'Fresh title',
        lastUpdated: Date.now(),
      },
      source: 'JavLibrary',
      timestamp: Date.now(),
    });
    mocks.translate.mockResolvedValue({
      success: true,
      data: {
        originalText: 'Fresh title',
        translatedText: 'Fresh title translated',
        sourceLanguage: 'ja',
        targetLanguage: 'zh-CN',
        service: 'google',
        timestamp: Date.now(),
      },
      source: 'Translator',
      timestamp: Date.now(),
    });
  });

  it('keeps enhanced-video cache disabled by default', async () => {
    const { DataAggregator } = await import('../../src/features/dataAggregator');
    const aggregator = new DataAggregator();

    expect(aggregator.getConfig().enableCache).toBe(false);

    const result = await aggregator.getEnhancedVideoInfo('SSIS-001');

    expect(mocks.getVideoDetail).not.toHaveBeenCalled();
    expect(mocks.getCoverImage).toHaveBeenCalledWith('SSIS-001');
    expect(result.id).toBe('SSIS-001');
    expect(result.title).toBe('Fresh title');
  });
});

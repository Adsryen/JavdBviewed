// src/services/dataAggregator/sources/blogJav.ts
// BlogJav数据源 - 获取高质量封面图片

import { HttpClient, defaultHttpClient } from '../httpClient';
import { ApiResponse, ImageData, VideoMetadata, DataSourceError, ParseError } from '../types';
import { parseCode } from '../../../utils/codeParser';

export interface BlogJavConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

export class BlogJavSource {
  private httpClient: HttpClient;
  private config: BlogJavConfig;

  constructor(config: BlogJavConfig) {
    this.config = config;
    this.httpClient = defaultHttpClient;
  }

  /**
   * 获取视频封面图片
   */
  async getCoverImage(videoId: string): Promise<ApiResponse<ImageData[]>> {
    const startTime = Date.now();
    
    try {
      if (!this.config.enabled) {
        throw new DataSourceError('BlogJav source is disabled', 'BlogJav');
      }

      const normalizedId = this.normalizeVideoId(videoId);
      const searchUrl = this.buildSearchUrl(normalizedId);
      
      const document = await this.httpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
        retries: this.config.maxRetries,
      });

      const images = this.parseImages(document, normalizedId);
      
      return {
        success: true,
        data: images,
        source: 'BlogJav',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'BlogJav',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 搜索视频信息
   */
  async searchVideo(videoId: string): Promise<ApiResponse<VideoMetadata>> {
    try {
      if (!this.config.enabled) {
        throw new DataSourceError('BlogJav source is disabled', 'BlogJav');
      }

      const normalizedId = this.normalizeVideoId(videoId);
      const searchUrl = this.buildSearchUrl(normalizedId);
      
      const document = await this.httpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
        retries: this.config.maxRetries,
      });

      const metadata = this.parseVideoMetadata(document, normalizedId);
      
      return {
        success: true,
        data: metadata,
        source: 'BlogJav',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'BlogJav',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 批量获取封面图片
   */
  async batchGetCoverImages(videoIds: string[]): Promise<Array<ApiResponse<ImageData[]>>> {
    const requests = videoIds.map(id => ({
      url: this.buildSearchUrl(this.normalizeVideoId(id)),
      config: { responseType: 'document' as const },
    }));

    const results = await this.httpClient.batchRequest(requests, 3);
    
    return results.map((result, index) => {
      if (result.success && result.data) {
        try {
          const images = this.parseImages(result.data as Document, videoIds[index]);
          return {
            success: true,
            data: images,
            source: 'BlogJav',
            timestamp: Date.now(),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Parse error',
            source: 'BlogJav',
            timestamp: Date.now(),
          };
        }
      } else {
        return {
          success: false,
          error: result.error || 'Request failed',
          source: 'BlogJav',
          timestamp: Date.now(),
        };
      }
    });
  }

  // 私有方法

  private normalizeVideoId(videoId: string): string {
    try {
      const parsed = parseCode(videoId);
      return parsed.normalized;
    } catch {
      return videoId.toUpperCase();
    }
  }

  private buildSearchUrl(videoId: string): string {
    const encodedId = encodeURIComponent(videoId);
    return `${this.config.baseUrl}/search?q=${encodedId}`;
  }

  private parseImages(document: Document, videoId: string): ImageData[] {
    const images: ImageData[] = [];
    
    try {
      // 查找搜索结果中的图片
      const resultItems = document.querySelectorAll('.post-item, .search-result-item, .video-item');
      
      for (const item of resultItems) {
        const titleElement = item.querySelector('.title, .post-title, h2, h3');
        const title = titleElement?.textContent?.trim() || '';
        
        // 检查标题是否包含视频ID
        if (!this.isMatchingTitle(title, videoId)) {
          continue;
        }

        // 提取图片
        const imgElements = item.querySelectorAll('img');
        for (const img of imgElements) {
          const src = img.getAttribute('src') || img.getAttribute('data-src');
          if (src && this.isValidImageUrl(src)) {
            images.push({
              url: this.resolveImageUrl(src),
              type: 'cover',
              quality: this.determineImageQuality(src),
            });
          }
        }

        // 如果找到匹配的项目，停止搜索
        if (images.length > 0) {
          break;
        }
      }

      // 如果没有找到特定的结果，尝试获取页面中的所有相关图片
      if (images.length === 0) {
        const allImages = document.querySelectorAll('img');
        for (const img of allImages) {
          const src = img.getAttribute('src') || img.getAttribute('data-src');
          const alt = img.getAttribute('alt') || '';
          
          if (src && this.isValidImageUrl(src) && this.isRelevantImage(src, alt, videoId)) {
            images.push({
              url: this.resolveImageUrl(src),
              type: 'cover',
              quality: this.determineImageQuality(src),
            });
          }
        }
      }

      return images;
    } catch (error) {
      throw new ParseError('Failed to parse images from BlogJav', 'BlogJav', { videoId, error });
    }
  }

  private parseVideoMetadata(document: Document, videoId: string): VideoMetadata {
    try {
      const metadata: VideoMetadata = {
        id: videoId,
        lastUpdated: Date.now(),
      };

      // 查找匹配的视频项目
      const resultItems = document.querySelectorAll('.post-item, .search-result-item, .video-item');
      
      for (const item of resultItems) {
        const titleElement = item.querySelector('.title, .post-title, h2, h3');
        const title = titleElement?.textContent?.trim() || '';
        
        if (!this.isMatchingTitle(title, videoId)) {
          continue;
        }

        // 提取标题
        metadata.title = title;
        metadata.originalTitle = title;

        // 提取图片
        metadata.images = this.parseImages(document, videoId);

        // 提取其他信息
        const descElement = item.querySelector('.description, .excerpt, .summary');
        if (descElement) {
          metadata.description = descElement.textContent?.trim();
        }

        break;
      }

      return metadata;
    } catch (error) {
      throw new ParseError('Failed to parse video metadata from BlogJav', 'BlogJav', { videoId, error });
    }
  }

  private isMatchingTitle(title: string, videoId: string): boolean {
    const normalizedTitle = title.toUpperCase().replace(/[-\s]/g, '');
    const normalizedId = videoId.toUpperCase().replace(/[-\s]/g, '');
    
    return normalizedTitle.includes(normalizedId) || 
           this.fuzzyMatch(normalizedTitle, normalizedId);
  }

  private fuzzyMatch(title: string, videoId: string): boolean {
    // 简单的模糊匹配，允许一些字符差异
    const threshold = 0.8;
    const maxLength = Math.max(title.length, videoId.length);
    const minLength = Math.min(title.length, videoId.length);
    
    if (minLength / maxLength < threshold) {
      return false;
    }

    let matches = 0;
    const shorter = title.length < videoId.length ? title : videoId;
    const longer = title.length >= videoId.length ? title : videoId;
    
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    
    return matches / shorter.length >= threshold;
  }

  private isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const lowerUrl = url.toLowerCase();
    
    return imageExtensions.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.includes('image') ||
           lowerUrl.includes('cover') ||
           lowerUrl.includes('thumb');
  }

  private isRelevantImage(src: string, alt: string, videoId: string): boolean {
    const text = (src + ' ' + alt).toUpperCase();
    const normalizedId = videoId.toUpperCase().replace(/[-\s]/g, '');
    
    return text.includes(normalizedId) ||
           text.includes('COVER') ||
           text.includes('POSTER') ||
           text.includes('THUMBNAIL');
  }

  private resolveImageUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      return this.config.baseUrl + url;
    }
    return this.config.baseUrl + '/' + url;
  }

  private determineImageQuality(url: string): 'low' | 'medium' | 'high' {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('thumb') || lowerUrl.includes('small')) {
      return 'low';
    }
    if (lowerUrl.includes('large') || lowerUrl.includes('big') || lowerUrl.includes('full')) {
      return 'high';
    }
    return 'medium';
  }
}

// 默认配置
export const DEFAULT_BLOGJAV_CONFIG: BlogJavConfig = {
  enabled: true,
  baseUrl: 'https://blogjav.net',
  timeout: 10000,
  maxRetries: 2,
};

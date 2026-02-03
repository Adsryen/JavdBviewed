// src/services/dataAggregator/sources/javLibrary.ts
// JavLibrary数据源 - 获取评分和演员信息

import { HttpClient, defaultHttpClient } from '../httpClient';
import { ApiResponse, RatingData, ActorData, VideoMetadata, DataSourceError, ParseError } from '../types';
import { parseCode } from '../../../utils/codeParser';

export interface JavLibraryConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  language: 'en' | 'ja' | 'cn';
}

export class JavLibrarySource {
  private httpClient: HttpClient;
  private config: JavLibraryConfig;

  constructor(config: JavLibraryConfig) {
    this.config = config;
    this.httpClient = defaultHttpClient;
  }

  /**
   * 获取视频评分
   */
  async getRating(videoId: string): Promise<ApiResponse<RatingData>> {
    try {
      if (!this.config.enabled) {
        throw new DataSourceError('JavLibrary source is disabled', 'JavLibrary');
      }

      const normalizedId = this.normalizeVideoId(videoId);
      const searchUrl = this.buildSearchUrl(normalizedId);
      
      const document = await this.httpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
        retries: this.config.maxRetries,
      });

      const rating = this.parseRating(document, normalizedId);
      
      return {
        success: true,
        data: rating,
        source: 'JavLibrary',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'JavLibrary',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 获取演员信息
   */
  async getActors(videoId: string): Promise<ApiResponse<ActorData[]>> {
    try {
      if (!this.config.enabled) {
        throw new DataSourceError('JavLibrary source is disabled', 'JavLibrary');
      }

      const normalizedId = this.normalizeVideoId(videoId);
      const searchUrl = this.buildSearchUrl(normalizedId);
      
      const document = await this.httpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
        retries: this.config.maxRetries,
      });

      const actors = this.parseActors(document, normalizedId);
      
      return {
        success: true,
        data: actors,
        source: 'JavLibrary',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'JavLibrary',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 获取完整视频信息
   */
  async getVideoInfo(videoId: string): Promise<ApiResponse<VideoMetadata>> {
    try {
      if (!this.config.enabled) {
        throw new DataSourceError('JavLibrary source is disabled', 'JavLibrary');
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
        source: 'JavLibrary',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'JavLibrary',
        timestamp: Date.now(),
      };
    }
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
    return `${this.config.baseUrl}/${this.config.language}/vl_searchbyid.php?keyword=${encodedId}`;
  }

  private parseRating(document: Document, videoId: string): RatingData {
    try {
      // 查找评分信息
      const ratingElement = document.querySelector('.score, .rating, [class*="rating"], [class*="score"]');
      
      if (!ratingElement) {
        throw new ParseError('Rating element not found', 'JavLibrary', { videoId });
      }

      const ratingText = ratingElement.textContent?.trim() || '';
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      
      if (!ratingMatch) {
        throw new ParseError('Rating value not found', 'JavLibrary', { videoId, ratingText });
      }

      const score = parseFloat(ratingMatch[1]);
      
      // 查找评分人数
      const countElement = document.querySelector('.votes, .count, [class*="vote"], [class*="count"]');
      const countText = countElement?.textContent?.trim() || '';
      const countMatch = countText.match(/(\d+)/);
      const count = countMatch ? parseInt(countMatch[1], 10) : undefined;

      // 查找详情页链接
      const linkElement = document.querySelector('a[href*="?v="]');
      const url = linkElement ? this.config.baseUrl + linkElement.getAttribute('href') : undefined;

      return {
        source: 'JavLibrary',
        score,
        total: 10, // JavLibrary通常使用10分制
        count,
        url,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      throw new ParseError('Failed to parse rating from JavLibrary', 'JavLibrary', { videoId, error });
    }
  }

  private parseActors(document: Document, videoId: string): ActorData[] {
    try {
      const actors: ActorData[] = [];
      
      // 查找演员链接
      const actorElements = document.querySelectorAll('a[href*="star"], a[href*="actress"], .cast a, .performers a');
      
      for (const element of actorElements) {
        const name = element.textContent?.trim();
        const href = element.getAttribute('href');
        
        if (name && href) {
          const profileUrl = href.startsWith('http') ? href : this.config.baseUrl + href;
          
          actors.push({
            name,
            profileUrl,
          });
        }
      }

      // 如果没有找到演员链接，尝试查找演员文本
      if (actors.length === 0) {
        const castElements = document.querySelectorAll('.cast, .performers, .actress, .star');
        
        for (const element of castElements) {
          const text = element.textContent?.trim() || '';
          const names = this.extractActorNames(text);
          
          for (const name of names) {
            actors.push({ name });
          }
        }
      }

      return actors;
    } catch (error) {
      throw new ParseError('Failed to parse actors from JavLibrary', 'JavLibrary', { videoId, error });
    }
  }

  private parseVideoMetadata(document: Document, videoId: string): VideoMetadata {
    try {
      const metadata: VideoMetadata = {
        id: videoId,
        lastUpdated: Date.now(),
      };

      // 解析标题
      const titleElement = document.querySelector('title, h1, .title');
      if (titleElement) {
        metadata.title = titleElement.textContent?.trim();
        metadata.originalTitle = metadata.title;
      }

      // 解析评分
      try {
        const rating = this.parseRating(document, videoId);
        metadata.ratings = [rating];
      } catch {
        // 评分解析失败，继续其他信息的解析
      }

      // 解析演员
      try {
        metadata.actors = this.parseActors(document, videoId);
      } catch {
        // 演员解析失败，继续其他信息的解析
      }

      // 解析发行日期
      const dateElement = document.querySelector('.date, .release-date, [class*="date"]');
      if (dateElement) {
        const dateText = dateElement.textContent?.trim();
        if (dateText) {
          metadata.releaseDate = this.parseDate(dateText);
        }
      }

      // 解析制作商
      const studioElement = document.querySelector('.studio, .maker, [class*="studio"], [class*="maker"]');
      if (studioElement) {
        const studioName = studioElement.textContent?.trim();
        if (studioName) {
          metadata.studio = { name: studioName };
        }
      }

      // 解析类别
      const genreElements = document.querySelectorAll('.genre a, .category a, .tag a');
      if (genreElements.length > 0) {
        metadata.genre = Array.from(genreElements)
          .map(el => el.textContent?.trim())
          .filter(Boolean) as string[];
      }

      return metadata;
    } catch (error) {
      throw new ParseError('Failed to parse video metadata from JavLibrary', 'JavLibrary', { videoId, error });
    }
  }

  private extractActorNames(text: string): string[] {
    // 从文本中提取演员姓名
    const names: string[] = [];
    
    // 常见的分隔符
    const separators = [',', '、', '/', '|', ';'];
    let parts = [text];
    
    for (const sep of separators) {
      const newParts: string[] = [];
      for (const part of parts) {
        newParts.push(...part.split(sep));
      }
      parts = newParts;
    }
    
    for (const part of parts) {
      const name = part.trim();
      if (name && name.length > 1 && name.length < 50) {
        names.push(name);
      }
    }
    
    return names;
  }

  private parseDate(dateText: string): string {
    // 尝试解析各种日期格式
    const patterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/,  // YYYY-MM-DD
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})年(\d{1,2})月(\d{1,2})日/, // 中文格式
    ];
    
    for (const pattern of patterns) {
      const match = dateText.match(pattern);
      if (match) {
        const [, year, month, day] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    return dateText; // 如果无法解析，返回原文本
  }
}

// 默认配置
export const DEFAULT_JAVLIBRARY_CONFIG: JavLibraryConfig = {
  enabled: true,
  baseUrl: 'https://www.javlibrary.com',
  timeout: 15000,
  maxRetries: 2,
  language: 'en',
};

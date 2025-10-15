// src/services/reviewBreaker/index.ts
// 破解评论区功能 - 基于JAV-JHS的实现

import { log } from '../../content/state';
import { bgFetchJSON } from '../../utils/net';
import { md5Hex } from '../../utils/md5';

export interface ReviewData {
  id: string;
  content: string;
  author: string;
  rating?: number;
  date: string;
  likes?: number;
}

export interface ReviewResponse {
  success: boolean;
  data?: ReviewData[];
  error?: string;
  total?: number;
}

/**
 * 评论区破解服务
 * 使用JAV-JHS的API服务器和签名系统
 */
export class ReviewBreakerService {
  private static readonly API_BASE = 'https://jdforrepam.com/api';
  private static readonly SIGNATURE_KEY = 'jhs_review_sign';
  private static readonly TIMESTAMP_KEY = 'jhs_review_ts';
  private static readonly SIGNATURE_SALT = '71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa';

  /**
   * 生成API签名
   */
  private static async generateSignature(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const lastTs = parseInt(localStorage.getItem(this.TIMESTAMP_KEY) || '0');
    
    // 如果距离上次生成不到20秒，使用缓存的签名
    if (now - lastTs <= 20) {
      const cachedSign = localStorage.getItem(this.SIGNATURE_KEY);
      if (cachedSign) return cachedSign;
    }

    // 生成新签名
    const signatureData = `${now}${this.SIGNATURE_SALT}`;
    const signature = `${now}.lpw6vgqzsp.${md5Hex(signatureData)}`;
    
    // 缓存签名和时间戳
    localStorage.setItem(this.TIMESTAMP_KEY, now.toString());
    localStorage.setItem(this.SIGNATURE_KEY, signature);
    
    return signature;
  }

  /**
   * 发送HTTP请求
   */
  private static async makeRequest(url: string, params: Record<string, any> = {}): Promise<any> {
    const signature = await this.generateSignature();
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const { success, status, data, error } = await bgFetchJSON<any>({
      url: fullUrl,
      method: 'GET',
      headers: {
        // 与参考脚本保持一致：全小写 jdsignature
        'jdsignature': signature,
      },
      timeoutMs: 15000,
    });

    if (!success) {
      throw new Error(error || `HTTP ${status}`);
    }
    return data;
  }

  /**
   * 获取影片评论
   */
  static async getReviews(movieId: string, page: number = 1, limit: number = 20): Promise<ReviewResponse> {
    try {
      log(`[ReviewBreaker] Fetching reviews for movie: ${movieId}, page: ${page}`);
      
      const url = `${this.API_BASE}/v1/movies/${movieId}/reviews`;
      const params = {
        page: page.toString(),
        sort_by: 'hotly',
        limit: limit.toString(),
      };

      const response = await this.makeRequest(url, params);
      
      if (!response.data || !response.data.reviews) {
        return {
          success: false,
          error: '获取评论数据失败',
        };
      }

      const reviews: ReviewData[] = response.data.reviews.map((review: any) => ({
        id: review.id || Math.random().toString(36),
        content: review.content || review.comment || '',
        author: review.author || review.username || '匿名用户',
        rating: review.rating || review.score,
        date: review.created_at || review.date || new Date().toISOString(),
        likes: review.likes || review.up_votes || 0,
      }));

      log(`[ReviewBreaker] Successfully fetched ${reviews.length} reviews`);
      
      return {
        success: true,
        data: reviews,
        total: response.data.total || reviews.length,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      log(`[ReviewBreaker] Error fetching reviews:`, error);
      
      return {
        success: false,
        error: `获取评论失败: ${errorMsg}`,
      };
    }
  }

  /**
   * 检查评论是否应该被过滤
   */
  static shouldFilterReview(review: ReviewData, filterKeywords: string[]): boolean {
    if (!filterKeywords.length) return false;
    
    const content = review.content.toLowerCase();
    return filterKeywords.some(keyword => 
      content.includes(keyword.toLowerCase())
    );
  }

  /**
   * 获取过滤关键词列表
   */
  static getFilterKeywords(): string[] {
    try {
      const keywords = localStorage.getItem('review_filter_keywords');
      return keywords ? JSON.parse(keywords) : [];
    } catch {
      return [];
    }
  }

  /**
   * 保存过滤关键词
   */
  static saveFilterKeywords(keywords: string[]): void {
    localStorage.setItem('review_filter_keywords', JSON.stringify(keywords));
  }

  /**
   * 添加过滤关键词
   */
  static addFilterKeyword(keyword: string): void {
    const keywords = this.getFilterKeywords();
    if (!keywords.includes(keyword)) {
      keywords.push(keyword);
      this.saveFilterKeywords(keywords);
    }
  }
}

export const reviewBreakerService = ReviewBreakerService;

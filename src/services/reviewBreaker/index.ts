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
  private static readonly SIGNATURE_KEY = 'jhs_jdsignature'; // 与JAV-JHS保持一致
  private static readonly SIGNATURE_SALT = '71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa';

  /**
   * 生成API签名（与JAV-JHS完全一致）
   */
  static async generateSignature(): Promise<string> {
    const curr = Math.floor(Date.now() / 1000);
    
    // 检查缓存的签名是否仍然有效（300秒内，与JAV-JHS保持一致）
    try {
      const storedSign = localStorage.getItem(this.SIGNATURE_KEY);
      if (storedSign) {
        const parts = storedSign.split('.');
        if (parts.length === 3) {
          const timestamp = parseInt(parts[0], 10);
          if (!isNaN(timestamp) && curr - timestamp <= 300) {
            log(`[ReviewBreaker] Using cached signature: ${storedSign.substring(0, 30)}...`);
            return storedSign;
          }
        }
      }
    } catch {}

    // 生成新签名（注意：md5计算时timestamp和salt直接拼接，没有分隔符）
    const sign = `${curr}.lpw6vgqzsp.${md5Hex(`${curr}${this.SIGNATURE_SALT}`)}`;
    log(`[ReviewBreaker] Generated new signature: ${sign.substring(0, 30)}...`);
    
    try {
      localStorage.setItem(this.SIGNATURE_KEY, sign);
    } catch {}
    
    return sign;
  }

  /**
   * 发送HTTP请求
   */
  private static async makeRequest(url: string, params: Record<string, any> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const signature = await this.generateSignature();

    const { success, status, data, error } = await bgFetchJSON<any>({
      url: fullUrl,
      method: 'GET',
      headers: {
        'jdSignature': signature,
      },
      timeoutMs: 15000,
    });

    if (!success) {
      const serverMsg = data && (data.message || data.error || data.msg);
      const errText = serverMsg ? `HTTP ${status}: ${serverMsg}` : (error || `HTTP ${status}`);
      throw new Error(errText);
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

      const sorts = ['hotly', 'hot', 'latest'];
      let response: any | null = null;
      let lastErr: any = null;
      for (const s of sorts) {
        try {
          log(`[ReviewBreaker] Trying sort_by=${s}`);
          const params = { page: page.toString(), sort_by: s, limit: limit.toString() };
          response = await this.makeRequest(url, params);
          log(`[ReviewBreaker] sort_by=${s} ok`);
          break;
        } catch (e) {
          lastErr = e;
          log(`[ReviewBreaker] sort_by=${s} failed`, e);
        }
      }
      if (!response) {
        throw lastErr || new Error('请求失败');
      }
      
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

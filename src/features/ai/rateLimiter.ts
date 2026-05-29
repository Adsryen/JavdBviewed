/**
 * AI服务速率限制器
 */

import type { AIRateLimit } from './types';
import { RateLimitError } from './types';

// 速率限制器类
export class RateLimiter {
  private requestsPerMinute: number;
  private requestsPerHour: number;
  private minuteRequests: number[] = [];
  private hourRequests: number[] = [];

  constructor(config: AIRateLimit) {
    this.requestsPerMinute = config.requestsPerMinute;
    this.requestsPerHour = config.requestsPerHour;
  }

  /**
   * 检查是否可以发送请求
   */
  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // 清理过期的请求记录
    this.cleanupExpiredRequests(now);
    
    // 检查分钟级限制
    if (this.minuteRequests.length >= this.requestsPerMinute) {
      const oldestRequest = this.minuteRequests[0];
      const waitTime = 60000 - (now - oldestRequest);
      throw new RateLimitError(
        `每分钟请求数超限，请等待 ${Math.ceil(waitTime / 1000)} 秒`,
        Math.ceil(waitTime / 1000)
      );
    }
    
    // 检查小时级限制
    if (this.hourRequests.length >= this.requestsPerHour) {
      const oldestRequest = this.hourRequests[0];
      const waitTime = 3600000 - (now - oldestRequest);
      throw new RateLimitError(
        `每小时请求数超限，请等待 ${Math.ceil(waitTime / 60000)} 分钟`,
        Math.ceil(waitTime / 1000)
      );
    }
    
    // 记录本次请求
    this.recordRequest(now);
  }

  /**
   * 记录请求时间
   */
  private recordRequest(timestamp: number): void {
    this.minuteRequests.push(timestamp);
    this.hourRequests.push(timestamp);
  }

  /**
   * 清理过期的请求记录
   */
  private cleanupExpiredRequests(now: number): void {
    // 清理1分钟前的记录
    const oneMinuteAgo = now - 60000;
    this.minuteRequests = this.minuteRequests.filter(time => time > oneMinuteAgo);
    
    // 清理1小时前的记录
    const oneHourAgo = now - 3600000;
    this.hourRequests = this.hourRequests.filter(time => time > oneHourAgo);
  }

  /**
   * 获取当前使用情况
   */
  getCurrentUsage(): {
    minuteUsage: number;
    hourUsage: number;
    minuteLimit: number;
    hourLimit: number;
    minuteRemaining: number;
    hourRemaining: number;
  } {
    const now = Date.now();
    this.cleanupExpiredRequests(now);
    
    return {
      minuteUsage: this.minuteRequests.length,
      hourUsage: this.hourRequests.length,
      minuteLimit: this.requestsPerMinute,
      hourLimit: this.requestsPerHour,
      minuteRemaining: this.requestsPerMinute - this.minuteRequests.length,
      hourRemaining: this.requestsPerHour - this.hourRequests.length
    };
  }

  /**
   * 重置限制器
   */
  reset(): void {
    this.minuteRequests = [];
    this.hourRequests = [];
  }

  /**
   * 更新速率限制配置
   */
  updateConfig(config: AIRateLimit): void {
    this.requestsPerMinute = config.requestsPerMinute;
    this.requestsPerHour = config.requestsPerHour;
    
    // 重新验证当前请求数是否超限
    const now = Date.now();
    this.cleanupExpiredRequests(now);
    
    // 如果新配置更严格，需要清理超出的请求记录
    if (this.minuteRequests.length > this.requestsPerMinute) {
      this.minuteRequests = this.minuteRequests.slice(-this.requestsPerMinute);
    }
    
    if (this.hourRequests.length > this.requestsPerHour) {
      this.hourRequests = this.hourRequests.slice(-this.requestsPerHour);
    }
  }

  /**
   * 计算下次可请求时间
   */
  getNextAvailableTime(): number {
    const now = Date.now();
    this.cleanupExpiredRequests(now);
    
    let nextTime = now;
    
    // 检查分钟级限制
    if (this.minuteRequests.length >= this.requestsPerMinute) {
      const oldestRequest = this.minuteRequests[0];
      nextTime = Math.max(nextTime, oldestRequest + 60000);
    }
    
    // 检查小时级限制
    if (this.hourRequests.length >= this.requestsPerHour) {
      const oldestRequest = this.hourRequests[0];
      nextTime = Math.max(nextTime, oldestRequest + 3600000);
    }
    
    return nextTime;
  }

  /**
   * 等待直到可以发送请求
   */
  async waitForAvailability(): Promise<void> {
    const nextTime = this.getNextAvailableTime();
    const now = Date.now();
    
    if (nextTime > now) {
      const waitTime = nextTime - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

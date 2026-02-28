// src/content/videoFavoriteRating.ts
// 影片页收藏与评分功能

import './styles/videoFavoriteRating.css';
import { STATE, log } from './state';
import { extractVideoIdFromPage } from './videoId';
import { showToast } from './toast';
import type { VideoRecord } from '../types';

/**
 * 影片页收藏与评分增强
 * 在影片详情页显示番号库中的收藏状态和用户评分，支持直接修改
 */
export class VideoFavoriteRatingEnhancer {
  private videoId: string | null = null;
  private record: VideoRecord | null = null;
  private containerElement: HTMLElement | null = null;

  /**
   * 初始化增强功能
   */
  public async init(): Promise<void> {
    try {
      // 检查是否启用
      if (!STATE.settings?.videoEnhancement?.enableVideoFavoriteRating) {
        log('[VideoFavoriteRating] Feature disabled in settings');
        return;
      }

      // 获取当前影片ID
      this.videoId = extractVideoIdFromPage();
      if (!this.videoId) {
        log('[VideoFavoriteRating] No video ID found');
        return;
      }

      log('[VideoFavoriteRating] Initializing for video:', this.videoId);

      // 从番号库获取记录
      await this.loadRecord();

      // 始终显示UI，即使记录不存在（允许用户直接添加收藏和评分）
      await this.renderUI();
    } catch (error) {
      console.error('[VideoFavoriteRating] Init error:', error);
    }
  }

  /**
   * 从番号库加载记录
   */
  private async loadRecord(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DB:VIEWED_GET',
        payload: { id: this.videoId }
      });

      if (response?.success && response.record) {
        this.record = response.record;
        log('[VideoFavoriteRating] Record loaded:', this.record);
      }
    } catch (error) {
      console.error('[VideoFavoriteRating] Failed to load record:', error);
    }
  }

  /**
   * 渲染UI
   */
  private async renderUI(): Promise<void> {
    try {
      // 查找插入位置（影片标题下方）
      const titleContainer = document.querySelector('h2.title.is-4');
      if (!titleContainer) {
        log('[VideoFavoriteRating] Title container not found');
        return;
      }

      // 创建容器
      this.containerElement = document.createElement('div');
      this.containerElement.className = 'video-favorite-rating-container';
      this.containerElement.innerHTML = this.generateHTML();

      // 插入到标题下方
      titleContainer.parentElement?.insertBefore(
        this.containerElement,
        titleContainer.nextSibling
      );

      // 绑定事件
      this.bindEvents();

      log('[VideoFavoriteRating] UI rendered');
    } catch (error) {
      console.error('[VideoFavoriteRating] Failed to render UI:', error);
    }
  }

  /**
   * 生成HTML
   */
  private generateHTML(): string {
    const isFavorite = this.record?.isFavorite || false;
    const userRating = this.record?.userRating || 0;

    return `
      <div class="vfr-panel">
        <div class="vfr-favorite">
          <button class="vfr-favorite-btn ${isFavorite ? 'favorited' : ''}" 
                  data-favorited="${isFavorite}" 
                  title="${isFavorite ? '取消收藏' : '添加到收藏'}">
            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            <span>${isFavorite ? '已收藏' : '收藏'}</span>
          </button>
        </div>
        <div class="vfr-rating">
          <span class="vfr-rating-label">我的评分：</span>
          <div class="vfr-stars">
            ${this.generateStarsHTML(userRating)}
          </div>
          <span class="vfr-rating-value">${userRating > 0 ? userRating.toFixed(1) : '未评分'}</span>
        </div>
      </div>
    `;
  }

  /**
   * 生成星星HTML
   */
  private generateStarsHTML(rating: number): string {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const isFull = i <= Math.floor(rating);
      const isHalf = !isFull && i <= Math.ceil(rating) && rating % 1 >= 0.5;
      
      html += `
        <span class="vfr-star-wrapper" data-rating="${i}">
          <span class="vfr-star-half vfr-star-left" data-rating="${i - 0.5}">
            <i class="${isFull || isHalf ? 'fas' : 'far'} fa-star"></i>
          </span>
          <span class="vfr-star-half vfr-star-right" data-rating="${i}">
            <i class="${isFull ? 'fas' : 'far'} fa-star"></i>
          </span>
        </span>
      `;
    }
    return html;
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.containerElement) return;

    // 收藏按钮点击
    const favoriteBtn = this.containerElement.querySelector('.vfr-favorite-btn');
    favoriteBtn?.addEventListener('click', () => this.toggleFavorite());

    // 星星点击
    const starHalves = this.containerElement.querySelectorAll('.vfr-star-half');
    starHalves.forEach(half => {
      half.addEventListener('click', (e) => {
        const rating = parseFloat((e.currentTarget as HTMLElement).dataset.rating || '0');
        this.setRating(rating);
      });
    });
  }

  /**
   * 切换收藏状态
   */
  private async toggleFavorite(): Promise<void> {
    try {
      // 如果记录不存在，先创建记录
      if (!this.record) {
        this.record = {
          id: this.videoId!,
          title: document.querySelector('h2.title.is-4 strong')?.textContent?.trim() || this.videoId!,
          status: 'browsed',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isFavorite: false
        };
      }

      const newFavoriteState = !this.record.isFavorite;
      this.record.isFavorite = newFavoriteState;
      if (newFavoriteState) {
        this.record.favoritedAt = Date.now();
      }
      this.record.updatedAt = Date.now();

      // 保存到数据库
      await chrome.runtime.sendMessage({
        type: 'DB:VIEWED_PUT',
        payload: { record: this.record }
      });

      // 更新UI
      const btn = this.containerElement?.querySelector('.vfr-favorite-btn');
      if (btn) {
        btn.classList.toggle('favorited', newFavoriteState);
        btn.setAttribute('data-favorited', String(newFavoriteState));
        btn.setAttribute('title', newFavoriteState ? '取消收藏' : '添加到收藏');
        
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        if (icon) {
          icon.className = newFavoriteState ? 'fas fa-heart' : 'far fa-heart';
        }
        if (text) {
          text.textContent = newFavoriteState ? '已收藏' : '收藏';
        }
      }

      showToast(newFavoriteState ? '已添加到收藏' : '已取消收藏', 'success');
      log('[VideoFavoriteRating] Favorite toggled:', newFavoriteState);
    } catch (error) {
      console.error('[VideoFavoriteRating] Failed to toggle favorite:', error);
      showToast('操作失败，请重试', 'error');
    }
  }

  /**
   * 设置评分
   */
  private async setRating(rating: number): Promise<void> {
    try {
      // 如果记录不存在，先创建记录
      if (!this.record) {
        this.record = {
          id: this.videoId!,
          title: document.querySelector('h2.title.is-4 strong')?.textContent?.trim() || this.videoId!,
          status: 'browsed',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userRating: 0
        };
      }

      this.record.userRating = rating;
      this.record.updatedAt = Date.now();

      // 保存到数据库
      await chrome.runtime.sendMessage({
        type: 'DB:VIEWED_PUT',
        payload: { record: this.record }
      });

      // 更新UI
      const starsContainer = this.containerElement?.querySelector('.vfr-stars');
      const ratingValue = this.containerElement?.querySelector('.vfr-rating-value');
      
      if (starsContainer) {
        starsContainer.innerHTML = this.generateStarsHTML(rating);
        // 重新绑定星星事件
        const starHalves = starsContainer.querySelectorAll('.vfr-star-half');
        starHalves.forEach(half => {
          half.addEventListener('click', (e) => {
            const newRating = parseFloat((e.currentTarget as HTMLElement).dataset.rating || '0');
            this.setRating(newRating);
          });
        });
      }
      
      if (ratingValue) {
        ratingValue.textContent = rating > 0 ? rating.toFixed(1) : '未评分';
      }

      showToast(`评分已更新：${rating.toFixed(1)} 星`, 'success');
      log('[VideoFavoriteRating] Rating updated:', rating);
    } catch (error) {
      console.error('[VideoFavoriteRating] Failed to set rating:', error);
      showToast('评分失败，请重试', 'error');
    }
  }

  /**
   * 销毁
   */
  public destroy(): void {
    if (this.containerElement) {
      this.containerElement.remove();
      this.containerElement = null;
    }
    this.record = null;
    this.videoId = null;
  }
}

// 导出单例
export const videoFavoriteRatingEnhancer = new VideoFavoriteRatingEnhancer();

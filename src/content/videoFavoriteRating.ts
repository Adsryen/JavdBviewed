// src/content/videoFavoriteRating.ts
// 影片页收藏与评分功能

import './styles/videoFavoriteRating.css';
import { STATE, log } from './state';
import { extractVideoIdFromPage } from './videoId';
import { showToast } from './toast';
import type { VideoRecord } from '../types';
import { runChunkedWork, yieldToMainThread } from './taskChunking';
import { saveSubtaskDetail } from './taskDetailReporter';

/**
 * 影片页收藏与评分增强
 * 在影片详情页显示番号库中的收藏状态和用户评分，支持直接修改
 */
export class VideoFavoriteRatingEnhancer {
  private static readonly CONTAINER_SELECTOR = '.video-favorite-rating-container';
  private videoId: string | null = null;
  private record: VideoRecord | null = null;
  private containerElement: HTMLElement | null = null;

  /**
   * 初始化增强功能
   */
  public async init(): Promise<void> {
    try {
      const steps: Array<() => Promise<void>> = [
        async () => {
      // 检查是否启用
      if (!STATE.settings?.videoEnhancement?.enableVideoFavoriteRating) {
        log('[VideoFavoriteRating] Feature disabled in settings');
        throw new Error('video-favorite-rating-disabled');
      }
        },
        async () => {

      // 获取当前影片ID
      this.videoId = extractVideoIdFromPage();
      if (!this.videoId) {
        log('[VideoFavoriteRating] No video ID found');
        throw new Error('video-favorite-rating-missing-id');
      }

      log('[VideoFavoriteRating] Initializing for video:', this.videoId);
        },
        async () => {

      // 从番号库获取记录
      await this.loadRecord();
        },
        async () => {

      // 始终显示UI，即使记录不存在（允许用户直接添加收藏和评分）
      await this.renderUI();
        },
      ];

      await runChunkedWork(steps, {
        batchSize: 1,
        parentLabel: 'videoFavoriteRating:init',
        yieldAfterBatch: async () => {
          await yieldToMainThread(0);
        },
        onBatchComplete: async ({ batchIndex }) => {
          const subtaskLabels = ['check-enabled', 'resolve-video-id', 'load-record', 'render-ui'];
          saveSubtaskDetail({
            label: `videoFavoriteRating:init:${subtaskLabels[batchIndex] || 'step'}`,
            parentLabel: 'videoFavoriteRating:init',
            subtaskLabel: subtaskLabels[batchIndex] || 'step',
            batchIndex,
            itemCount: 1,
            phase: 'deferred',
            status: 'done',
            durationMs: 0,
          });
        },
        onItem: async (step) => {
          await step();
        }
      });
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'video-favorite-rating-disabled' ||
        error.message === 'video-favorite-rating-missing-id'
      )) {
        return;
      }
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

      const existingContainers = Array.from(document.querySelectorAll<HTMLElement>(VideoFavoriteRatingEnhancer.CONTAINER_SELECTOR));
      const firstExisting = existingContainers[0] || null;
      if (existingContainers.length > 1) {
        existingContainers.slice(1).forEach((element) => element.remove());
      }

      if (firstExisting) {
        this.containerElement = firstExisting;
        this.containerElement.innerHTML = this.generateHTML();
        this.bindEvents();
        log('[VideoFavoriteRating] UI refreshed');
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

  private static readonly HEART_PATH = 'M10 17 C10 17 2 11.5 2 6.5 C2 4 4 2.5 6 2.5 C7.6 2.5 9.1 3.5 10 5 C10.9 3.5 12.4 2.5 14 2.5 C16 2.5 18 4 18 6.5 C18 11.5 10 17 10 17Z';
  private static readonly STAR_POINTS = '10,1.5 12.4,7.2 18.5,7.6 14,11.8 15.6,17.9 10,14.5 4.4,17.9 6,11.8 1.5,7.6 7.6,7.2';

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
            <svg class="vfr-heart-svg" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="${VideoFavoriteRatingEnhancer.HEART_PATH}"/>
            </svg>
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
   * 生成星星HTML（SVG渐变实现半星，不依赖字体）
   */
  private generateStarsHTML(rating: number): string {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const isFull = i <= Math.floor(rating);
      const isHalf = !isFull && i <= Math.ceil(rating) && rating % 1 >= 0.5;
      const filledPct = isFull ? 100 : isHalf ? 50 : 0;
      const gradId = `vfr-sg-${i}`;

      html += `
        <span class="vfr-star-svg" data-star="${i}">
          <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="${gradId}" x1="0" x2="1" y1="0" y2="0">
                <stop offset="${filledPct}%" stop-color="#ffd700"/>
                <stop offset="${filledPct}%" stop-color="#d0d0d0"/>
              </linearGradient>
            </defs>
            <polygon fill="url(#${gradId})" points="${VideoFavoriteRatingEnhancer.STAR_POINTS}"/>
          </svg>
        </span>
      `;
    }
    return html;
  }

  /**
   * 绑定事件（星星用事件委托，避免重复绑定）
   */
  private bindEvents(): void {
    if (!this.containerElement) return;

    const favoriteBtn = this.containerElement.querySelector('.vfr-favorite-btn');
    favoriteBtn?.addEventListener('click', () => this.toggleFavorite());

    const starsContainer = this.containerElement.querySelector('.vfr-stars');
    starsContainer?.addEventListener('click', (e) => {
      const starSpan = (e.target as HTMLElement).closest('.vfr-star-svg') as HTMLElement | null;
      if (!starSpan) return;
      const starIndex = parseInt(starSpan.dataset.star || '0');
      const rect = starSpan.getBoundingClientRect();
      const isLeftHalf = (e as MouseEvent).clientX < rect.left + rect.width / 2;
      this.setRating(isLeftHalf ? starIndex - 0.5 : starIndex);
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
        const text = btn.querySelector('span:last-child');
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

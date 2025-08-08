// src/content/enhancedVideoDetail.ts
// 视频详情页增强功能

import { defaultDataAggregator } from '../services/dataAggregator';
import { VideoMetadata, ImageData, RatingData, ActorData } from '../services/dataAggregator/types';
import { STATE, log } from './state';
import { extractVideoIdFromPage } from './videoId';

export interface EnhancementOptions {
  enableCoverImage: boolean;
  enableTranslation: boolean;
  enableRating: boolean;
  enableActorInfo: boolean;
  showLoadingIndicator: boolean;
}

export class VideoDetailEnhancer {
  private videoId: string | null = null;
  private enhancedData: VideoMetadata | null = null;
  private options: EnhancementOptions;

  constructor(options: Partial<EnhancementOptions> = {}) {
    this.options = {
      enableCoverImage: true,
      enableTranslation: true,
      enableRating: true,
      enableActorInfo: true,
      showLoadingIndicator: true,
      ...options,
    };
  }

  /**
   * 初始化详情页增强
   */
  async initialize(): Promise<void> {
    try {
      this.videoId = extractVideoIdFromPage();
      if (!this.videoId) {
        log('No video ID found, skipping enhancement');
        return;
      }

      log(`Enhancing video detail page for: ${this.videoId}`);

      // 显示加载指示器
      if (this.options.showLoadingIndicator) {
        this.showLoadingIndicator();
      }

      // 获取增强数据
      this.enhancedData = await defaultDataAggregator.getEnhancedVideoInfo(this.videoId);
      
      // 应用增强功能
      await this.applyEnhancements();

      // 隐藏加载指示器
      if (this.options.showLoadingIndicator) {
        this.hideLoadingIndicator();
      }

      log('Video detail enhancement completed');
    } catch (error) {
      log('Error enhancing video detail:', error);
      this.hideLoadingIndicator();
    }
  }

  /**
   * 应用所有增强功能
   */
  private async applyEnhancements(): Promise<void> {
    if (!this.enhancedData) return;

    const promises: Promise<void>[] = [];

    if (this.options.enableCoverImage && this.enhancedData.images) {
      promises.push(this.enhanceCoverImage(this.enhancedData.images));
    }

    if (this.options.enableTranslation && this.enhancedData.translatedTitle) {
      promises.push(this.enhanceTitle(this.enhancedData.translatedTitle));
    }

    if (this.options.enableRating && this.enhancedData.ratings) {
      promises.push(this.enhanceRating(this.enhancedData.ratings));
    }

    if (this.options.enableActorInfo && this.enhancedData.actors) {
      promises.push(this.enhanceActorInfo(this.enhancedData.actors));
    }

    await Promise.all(promises);
  }

  /**
   * 增强封面图片
   */
  private async enhanceCoverImage(images: ImageData[]): Promise<void> {
    try {
      const coverImage = images.find(img => img.type === 'cover' && img.quality === 'high') ||
                        images.find(img => img.type === 'cover') ||
                        images[0];

      if (!coverImage) return;

      // 查找现有的封面图片元素
      const existingCover = document.querySelector('.video-cover img, .cover img, .poster img, img[src*="cover"]') as HTMLImageElement;
      
      if (existingCover) {
        // 创建增强的封面图片容器
        const enhancedContainer = this.createEnhancedCoverContainer(coverImage, existingCover.src);
        
        // 替换现有封面
        const parent = existingCover.parentElement;
        if (parent) {
          parent.insertBefore(enhancedContainer, existingCover);
          existingCover.style.display = 'none';
        }
      } else {
        // 如果没有现有封面，创建新的封面区域
        this.createNewCoverArea(coverImage);
      }

      log('Cover image enhanced');
    } catch (error) {
      log('Error enhancing cover image:', error);
    }
  }

  /**
   * 增强标题翻译
   */
  private async enhanceTitle(translatedTitle: string): Promise<void> {
    try {
      // 查找标题元素
      const titleElements = document.querySelectorAll('h1, .title, .video-title, .movie-title');
      
      for (const titleElement of titleElements) {
        const originalTitle = titleElement.textContent?.trim();
        if (originalTitle && originalTitle.length > 5) {
          // 创建翻译标题容器
          const translationContainer = this.createTranslationContainer(originalTitle, translatedTitle);
          
          // 插入翻译
          titleElement.parentElement?.insertBefore(translationContainer, titleElement.nextSibling);
          break;
        }
      }

      log('Title translation enhanced');
    } catch (error) {
      log('Error enhancing title translation:', error);
    }
  }

  /**
   * 增强评分信息
   */
  private async enhanceRating(ratings: RatingData[]): Promise<void> {
    try {
      if (ratings.length === 0) return;

      // 查找合适的位置插入评分
      const infoContainer = document.querySelector('.video-info, .movie-info, .details, .metadata') ||
                           document.querySelector('.container, .content, main');

      if (!infoContainer) return;

      const ratingContainer = this.createRatingContainer(ratings);
      
      // 插入评分信息
      const firstChild = infoContainer.firstElementChild;
      if (firstChild) {
        infoContainer.insertBefore(ratingContainer, firstChild);
      } else {
        infoContainer.appendChild(ratingContainer);
      }

      log('Rating information enhanced');
    } catch (error) {
      log('Error enhancing rating:', error);
    }
  }

  /**
   * 增强演员信息
   */
  private async enhanceActorInfo(actors: ActorData[]): Promise<void> {
    try {
      if (actors.length === 0) return;

      // 查找演员区域
      const actorSection = document.querySelector('.actors, .cast, .performers, .stars') ||
                          document.querySelector('.video-info, .movie-info, .details');

      if (!actorSection) return;

      const actorContainer = this.createActorContainer(actors);
      actorSection.appendChild(actorContainer);

      log('Actor information enhanced');
    } catch (error) {
      log('Error enhancing actor info:', error);
    }
  }

  /**
   * 创建增强的封面容器
   */
  private createEnhancedCoverContainer(coverImage: ImageData, originalSrc: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'enhanced-cover-container';
    container.style.cssText = `
      position: relative;
      display: inline-block;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.3s ease;
    `;

    const img = document.createElement('img');
    img.src = coverImage.url;
    img.alt = 'Enhanced Cover';
    img.style.cssText = `
      width: 100%;
      height: auto;
      display: block;
    `;

    // 添加错误处理，回退到原图
    img.onerror = () => {
      img.src = originalSrc;
    };

    // 添加质量标识
    if (coverImage.quality === 'high') {
      const qualityBadge = document.createElement('div');
      qualityBadge.textContent = 'HD';
      qualityBadge.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      `;
      container.appendChild(qualityBadge);
    }

    container.appendChild(img);
    return container;
  }

  /**
   * 创建新的封面区域
   */
  private createNewCoverArea(coverImage: ImageData): void {
    const coverArea = document.createElement('div');
    coverArea.className = 'enhanced-cover-area';
    coverArea.style.cssText = `
      margin: 20px 0;
      text-align: center;
    `;

    const title = document.createElement('h3');
    title.textContent = '高质量封面';
    title.style.cssText = `
      margin-bottom: 10px;
      color: #333;
      font-size: 16px;
    `;

    const container = this.createEnhancedCoverContainer(coverImage, '');
    container.style.maxWidth = '300px';

    coverArea.appendChild(title);
    coverArea.appendChild(container);

    // 插入到页面顶部
    const mainContent = document.querySelector('main, .container, .content, body');
    if (mainContent && mainContent.firstElementChild) {
      mainContent.insertBefore(coverArea, mainContent.firstElementChild);
    }
  }

  /**
   * 创建翻译容器
   */
  private createTranslationContainer(originalTitle: string, translatedTitle: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'enhanced-translation';
    container.style.cssText = `
      margin: 10px 0;
      padding: 12px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;
      border-left: 4px solid #4CAF50;
    `;

    const label = document.createElement('div');
    label.textContent = '中文翻译';
    label.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
      font-weight: bold;
    `;

    const translation = document.createElement('div');
    translation.textContent = translatedTitle;
    translation.style.cssText = `
      font-size: 16px;
      color: #333;
      line-height: 1.4;
    `;

    container.appendChild(label);
    container.appendChild(translation);
    return container;
  }

  /**
   * 创建评分容器
   */
  private createRatingContainer(ratings: RatingData[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'enhanced-ratings';
    container.style.cssText = `
      margin: 20px 0;
      padding: 15px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    `;

    const title = document.createElement('h3');
    title.textContent = '评分信息';
    title.style.cssText = `
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
      border-bottom: 2px solid #4CAF50;
      padding-bottom: 5px;
    `;

    container.appendChild(title);

    ratings.forEach(rating => {
      const ratingItem = document.createElement('div');
      ratingItem.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding: 8px;
        background: #f9f9f9;
        border-radius: 4px;
      `;

      const source = document.createElement('span');
      source.textContent = rating.source;
      source.style.cssText = `
        font-weight: bold;
        color: #555;
      `;

      const score = document.createElement('span');
      score.textContent = `${rating.score}/${rating.total}`;
      score.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: #4CAF50;
      `;

      if (rating.count) {
        const count = document.createElement('span');
        count.textContent = `(${rating.count}人评价)`;
        count.style.cssText = `
          font-size: 12px;
          color: #888;
          margin-left: 5px;
        `;
        score.appendChild(count);
      }

      ratingItem.appendChild(source);
      ratingItem.appendChild(score);
      container.appendChild(ratingItem);
    });

    return container;
  }

  /**
   * 创建演员容器
   */
  private createActorContainer(actors: ActorData[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'enhanced-actors';
    container.style.cssText = `
      margin: 20px 0;
      padding: 15px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const title = document.createElement('h3');
    title.textContent = '演员信息';
    title.style.cssText = `
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
    `;

    const actorList = document.createElement('div');
    actorList.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    `;

    actors.forEach(actor => {
      const actorItem = document.createElement('div');
      actorItem.style.cssText = `
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: #f0f0f0;
        border-radius: 20px;
        font-size: 14px;
        color: #333;
        text-decoration: none;
        transition: background-color 0.3s ease;
      `;

      if (actor.profileUrl) {
        const link = document.createElement('a');
        link.href = actor.profileUrl;
        link.target = '_blank';
        link.textContent = actor.name;
        link.style.cssText = `
          color: inherit;
          text-decoration: none;
        `;
        actorItem.appendChild(link);
        
        actorItem.addEventListener('mouseenter', () => {
          actorItem.style.backgroundColor = '#e0e0e0';
        });
        actorItem.addEventListener('mouseleave', () => {
          actorItem.style.backgroundColor = '#f0f0f0';
        });
      } else {
        actorItem.textContent = actor.name;
      }

      actorList.appendChild(actorItem);
    });

    container.appendChild(title);
    container.appendChild(actorList);
    return container;
  }

  /**
   * 显示加载指示器
   */
  private showLoadingIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'enhancement-loading';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;
    indicator.textContent = '正在获取增强信息...';
    document.body.appendChild(indicator);
  }

  /**
   * 隐藏加载指示器
   */
  private hideLoadingIndicator(): void {
    const indicator = document.getElementById('enhancement-loading');
    if (indicator) {
      indicator.remove();
    }
  }
}

// 导出增强器实例
export const videoDetailEnhancer = new VideoDetailEnhancer();

// src/content/coverEnhancement.ts
// 高质量封面增强功能

import { log } from './state';

export interface CoverEnhancementConfig {
  enabled: boolean;
  enableUrlReplacement: boolean; // 启用URL替换（快速方案）
  enableExternalSource: boolean; // 启用外部数据源（BlogJav等）
  cacheEnabled: boolean; // 启用缓存
}

interface ImageReplaceRule {
  regex: RegExp;
  replace: (url: string) => string;
  description: string;
}

class CoverEnhancementManager {
  private config: CoverEnhancementConfig = {
    enabled: false,
    enableUrlReplacement: true,
    enableExternalSource: true,
    cacheEnabled: true,
  };

  // 图片URL替换规则（参考油猴脚本）
  private imageReplaceRules: ImageReplaceRule[] = [
    {
      // JavDB: /thumbs/ -> /cover/, .jpg -> _b.jpg
      regex: /\/thumbs?\//i,
      replace: (url: string) => url.replace(/\/thumbs?\//g, '/cover/').replace('.jpg', '_b.jpg'),
      description: 'JavDB thumbnail to cover',
    },
    {
      // DMM: ps.jpg -> pl.jpg (small to large)
      regex: /pics\.dmm\.co\.jp/i,
      replace: (url: string) => url.replace('ps.jpg', 'pl.jpg'),
      description: 'DMM small to large',
    },
  ];

  updateConfig(newConfig: Partial<CoverEnhancementConfig>): void {
    this.config = { ...this.config, ...newConfig };
    log('Cover enhancement config updated:', this.config);
  }

  initialize(): void {
    if (!this.config.enabled) {
      return;
    }

    log('Initializing cover enhancement...');

    // 只在列表页做URL替换（参考油猴脚本）
    if (this.isListPage()) {
      this.enhanceListPageCovers();
    }

    log('Cover enhancement initialized');
  }

  private isDetailPage(): boolean {
    return /\/v\/[^/]+/.test(window.location.pathname);
  }

  private isListPage(): boolean {
    return document.querySelector('.movie-list') !== null;
  }

  /**
   * 增强详情页封面
   */
  private async enhanceDetailPageCover(): Promise<void> {
    try {
      // 查找封面图片
      const coverImg = document.querySelector('.video-cover img, .column-video-cover img') as HTMLImageElement;
      if (!coverImg) {
        log('No cover image found on detail page');
        return;
      }

      const originalSrc = coverImg.src;
      log(`Original cover URL: ${originalSrc}`);

      // 方案1: URL替换（快速）
      if (this.config.enableUrlReplacement) {
        const enhancedUrl = this.getEnhancedImageUrl(originalSrc);
        if (enhancedUrl !== originalSrc) {
          await this.replaceCoverImage(coverImg, enhancedUrl, originalSrc);
          return;
        }
      }

      // 方案2: 外部数据源（回退）
      if (this.config.enableExternalSource) {
        const videoCode = this.extractVideoCode();
        if (videoCode) {
          await this.fetchExternalCover(coverImg, videoCode, originalSrc);
        }
      }
    } catch (error) {
      log('Error enhancing detail page cover:', error);
    }
  }

  /**
   * 增强列表页封面
   */
  private enhanceListPageCovers(): void {
    if (!this.config.enableUrlReplacement) {
      return;
    }

    try {
      const items = document.querySelectorAll('.movie-list .item');
      items.forEach(item => {
        const coverImg = item.querySelector('.cover img') as HTMLImageElement;
        if (coverImg) {
          const originalSrc = coverImg.src;
          const enhancedUrl = this.getEnhancedImageUrl(originalSrc);
          
          if (enhancedUrl !== originalSrc) {
            // 添加样式类
            const coverElement = item.querySelector('.cover') as HTMLElement;
            if (coverElement) {
              coverElement.classList.add('x-cover', 'x-enhanced');
            }

            // 替换URL
            coverImg.src = enhancedUrl;
            
            // 错误回退
            coverImg.onerror = () => {
              coverImg.src = originalSrc;
              coverImg.onerror = null;
            };
          }
        }
      });

      // 监听新添加的项目
      this.observeNewListItems();
    } catch (error) {
      log('Error enhancing list page covers:', error);
    }
  }

  /**
   * 通过规则获取增强的图片URL
   */
  private getEnhancedImageUrl(originalUrl: string): string {
    for (const rule of this.imageReplaceRules) {
      if (rule.regex.test(originalUrl)) {
        const enhancedUrl = rule.replace(originalUrl);
        log(`Applied rule "${rule.description}": ${originalUrl} -> ${enhancedUrl}`);
        return enhancedUrl;
      }
    }
    return originalUrl;
  }

  /**
   * 替换封面图片
   */
  private async replaceCoverImage(
    imgElement: HTMLImageElement,
    newUrl: string,
    fallbackUrl: string
  ): Promise<void> {
    return new Promise((resolve) => {
      // 创建临时图片测试URL是否有效
      const testImg = new Image();
      
      testImg.onload = () => {
        // URL有效，替换图片
        imgElement.src = newUrl;
        
        // 添加质量标识
        this.addQualityBadge(imgElement);
        
        // 缓存URL
        if (this.config.cacheEnabled) {
          this.cacheImageUrl(fallbackUrl, newUrl);
        }
        
        log(`Cover image enhanced: ${newUrl}`);
        resolve();
      };

      testImg.onerror = () => {
        // URL无效，保持原图
        log(`Enhanced URL failed, keeping original: ${newUrl}`);
        resolve();
      };

      testImg.src = newUrl;
    });
  }

  /**
   * 从外部数据源获取封面
   */
  private async fetchExternalCover(
    imgElement: HTMLImageElement,
    videoCode: string,
    fallbackUrl: string
  ): Promise<void> {
    try {
      // 检查缓存
      if (this.config.cacheEnabled) {
        const cachedUrl = this.getCachedImageUrl(videoCode);
        if (cachedUrl) {
          await this.replaceCoverImage(imgElement, cachedUrl, fallbackUrl);
          return;
        }
      }

      // 通过background script获取外部封面
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_EXTERNAL_COVER',
        code: videoCode,
      });

      if (response?.success && response?.imageUrl) {
        await this.replaceCoverImage(imgElement, response.imageUrl, fallbackUrl);
      }
    } catch (error) {
      log(`Failed to fetch external cover for ${videoCode}:`, error);
    }
  }

  /**
   * 添加质量标识
   */
  private addQualityBadge(imgElement: HTMLImageElement): void {
    const parent = imgElement.parentElement;
    if (!parent || parent.querySelector('.x-quality-badge')) {
      return;
    }

    // 确保父元素有定位
    const computedStyle = window.getComputedStyle(parent);
    if (computedStyle.position === 'static') {
      parent.style.position = 'relative';
    }

    const badge = document.createElement('div');
    badge.className = 'x-quality-badge';
    badge.textContent = 'HD';
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      z-index: 2;
      pointer-events: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;

    parent.appendChild(badge);
  }

  /**
   * 提取视频代码
   */
  private extractVideoCode(): string | null {
    // 从URL提取
    const urlMatch = window.location.pathname.match(/\/v\/([^/]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // 从页面标题提取
    const titleElement = document.querySelector('.video-title strong, h2.title strong');
    if (titleElement) {
      return titleElement.textContent?.trim() || null;
    }

    return null;
  }

  /**
   * 监听新添加的列表项
   */
  private observeNewListItems(): void {
    const movieList = document.querySelector('.movie-list');
    if (!movieList) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches('.item')) {
              this.enhanceListItemCover(element as HTMLElement);
            } else {
              const items = element.querySelectorAll('.item');
              items.forEach(item => this.enhanceListItemCover(item as HTMLElement));
            }
          }
        });
      });
    });

    observer.observe(movieList, { childList: true, subtree: true });
  }

  /**
   * 增强单个列表项的封面
   */
  private enhanceListItemCover(item: HTMLElement): void {
    const coverImg = item.querySelector('.cover img') as HTMLImageElement;
    if (!coverImg) return;

    const originalSrc = coverImg.src;
    const enhancedUrl = this.getEnhancedImageUrl(originalSrc);

    if (enhancedUrl !== originalSrc) {
      const coverElement = item.querySelector('.cover') as HTMLElement;
      if (coverElement) {
        coverElement.classList.add('x-cover', 'x-enhanced');
      }

      coverImg.src = enhancedUrl;
      coverImg.onerror = () => {
        coverImg.src = originalSrc;
        coverImg.onerror = null;
      };
    }
  }

  /**
   * 缓存图片URL
   */
  private cacheImageUrl(originalUrl: string, enhancedUrl: string): void {
    try {
      const cacheKey = `cover_cache_${this.hashUrl(originalUrl)}`;
      localStorage.setItem(cacheKey, enhancedUrl);
    } catch (error) {
      log('Failed to cache image URL:', error);
    }
  }

  /**
   * 获取缓存的图片URL
   */
  private getCachedImageUrl(key: string): string | null {
    try {
      const cacheKey = `cover_cache_${key}`;
      return localStorage.getItem(cacheKey);
    } catch (error) {
      log('Failed to get cached image URL:', error);
      return null;
    }
  }

  /**
   * URL哈希（简单实现）
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

export const coverEnhancementManager = new CoverEnhancementManager();

// 注入样式
function injectStyles(): void {
  const styleId = 'cover-enhancement-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* 增强封面样式 */
    .x-cover.x-enhanced {
      position: relative;
    }

    .x-cover.x-enhanced img {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .x-cover.x-enhanced:hover img {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    /* 质量标识 */
    .x-quality-badge {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* 详情页封面增强 */
    .video-cover.x-enhanced,
    .column-video-cover.x-enhanced {
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .video-cover.x-enhanced img,
    .column-video-cover.x-enhanced img {
      display: block;
      width: 100%;
      height: auto;
    }
  `;

  document.head.appendChild(style);
}

// 自动注入样式
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
}

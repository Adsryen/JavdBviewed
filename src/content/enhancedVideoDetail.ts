// src/content/enhancedVideoDetail.ts
// 视频详情页增强功能

import { defaultDataAggregator } from '../services/dataAggregator';
import { aiService } from '../services/ai/aiService';
import { showToast } from './toast';
import { VideoMetadata, ImageData } from '../services/dataAggregator/types';
import { STATE, log } from './state';
import { extractVideoIdFromPage } from './videoId';
import { reviewBreakerService, ReviewData } from '../services/reviewBreaker';
import { fc2BreakerService, FC2VideoInfo } from '../services/fc2Breaker';

export interface EnhancementOptions {
  enableCoverImage: boolean;
  enableTranslation: boolean;
  showLoadingIndicator: boolean;
  enableReviewBreaker: boolean;
  enableFC2Breaker: boolean;
}

export class VideoDetailEnhancer {
  private videoId: string | null = null;
  private enhancedData: VideoMetadata | null = null;
  private options: EnhancementOptions;
  

  constructor(options: Partial<EnhancementOptions> = {}) {
    this.options = {
      enableCoverImage: true,
      enableTranslation: true,
      showLoadingIndicator: true,
      enableReviewBreaker: true,
      enableFC2Breaker: true,
      ...options,
    };
  }

  /**
   * 根据当前设置更新增强选项
   */
  public applyOptionsFromSettings(): void {
    try {
      const cfg = STATE.settings?.videoEnhancement;
      if (!cfg) return;
      this.options.enableCoverImage = cfg.enableCoverImage !== false;
      this.options.enableTranslation = cfg.enableTranslation !== false;
      this.options.showLoadingIndicator = cfg.showLoadingIndicator !== false;
      this.options.enableReviewBreaker = cfg.enableReviewBreaker === true;
      this.options.enableFC2Breaker = cfg.enableFC2Breaker === true;
    } catch {}
  }

  /**
   * 针对影片详情页标题 .current-title 的定点翻译
   */
  private async translateCurrentTitleIfNeeded(): Promise<void> {
    try {
      const settings = STATE.settings;
      const enabledByGlobal = !!settings?.dataEnhancement?.enableTranslation;
      if (!enabledByGlobal) return;
      console.log('[Translation] Enable check (global only):', { enabledByGlobal });

      // 当 targets 未配置时，默认启用 currentTitle 翻译；只有明确为 false 才禁用
      const targetEnabled = settings.translation?.targets
        ? (settings.translation.targets.currentTitle !== false)
        : true;
      if (!targetEnabled) {
        log('[Translation] current-title target is disabled by settings. Skipping.');
        return;
      }

      log('[Translation] Trying to translate .current-title ...');
      // 查找页面中的 current-title 元素（带等待重试）
      const titleEl = await this.waitForElement('h2.title.is-4 .current-title', 3000, 300) as HTMLElement | null;
      if (!titleEl) {
        log('[Translation] .current-title not found after waiting. Skip translating.');
        return;
      }

      const original = titleEl.textContent?.trim() || '';
      if (!original) return;

      // 根据 provider 选择翻译方式（AI 前置校验：是否启用且选择了模型）
      const provider = settings.translation?.provider || 'traditional';
      console.log('[Translation] Provider selected:', provider, 'Original text:', original);
      console.log('[Translation] Translation settings:', settings.translation);
      console.log('[Translation] Data enhancement settings:', settings.dataEnhancement);
      
      if (provider === 'ai') {
        const ai = aiService.getSettings();
        console.log('[Translation] AI settings check:', {
          enabled: ai.enabled,
          hasApiKey: !!ai.apiKey,
          selectedModel: ai.selectedModel
        });
        
        if (!ai.enabled) {
          console.error('[Translation] AI service not enabled');
          showToast('标题翻译失败：AI 功能未启用，请在"AI 设置"中开启', 'error');
          return;
        }
        if (!ai.apiKey) {
          console.error('[Translation] No API key configured');
          showToast('标题翻译失败：未配置 API Key，请在"AI 设置"中填写', 'error');
          return;
        }
        if (!ai.selectedModel) {
          console.error('[Translation] No model selected');
          showToast('标题翻译失败：未选择模型，请在"AI 设置"中选择模型', 'error');
          return;
        }
        console.log('[Translation] AI validation passed, proceeding with translation');
      }
      console.log('[Translation] Calling translation service...');
      const resp = provider === 'ai'
        ? await defaultDataAggregator.translateTextWithAI(original)
        : await defaultDataAggregator.translateText(original);

      console.log('[Translation] Translation response:', resp);

      if (!resp.success || !resp.data?.translatedText) {
        const reason = resp.error || '翻译失败';
        console.error('[Translation] Translation failed:', reason);
        showToast(`标题翻译失败：${reason}`, 'error');
        return;
      }
      const translated = resp.data.translatedText;
      // 控制台输出：显示使用的提供方与引擎/模型，以及原文与译文，方便确认来源
      try {
        const engine = resp.data.service || provider;
        // 单行可读输出，避免只显示 "Object" 的情况
        console.log(
          `[Title Translation] provider=${provider} engine=${engine} source=${resp.source} cached=${resp.cached === true} original="${original}" translated="${translated}"`
        );
      } catch {}

      // 显示方式：append（保留原文，追加显示）或 replace（替换原文）
      const mode = settings.translation?.displayMode || 'append';
      if (mode === 'replace') {
        titleEl.textContent = translated;
      } else {
        // 追加显示：在标题下方插入翻译块
        const container = this.createTranslationContainer(original, translated);
        // 插入在 .current-title 所在的 strong 后面
        titleEl.parentElement?.insertBefore(container, titleEl.nextSibling);
      }
      log('[Translation] current-title translated successfully.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      showToast(`标题翻译失败：${msg}`, 'error');
      log('Error translating current-title:', error);
    }
  }

  // 等待元素出现的辅助方法
  private async waitForElement(selector: string, timeoutMs = 3000, intervalMs = 200): Promise<Element | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = document.querySelector(selector);
      if (el) return el;
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return null;
  }

  /**
   * 初始化详情页增强
   */
  async initialize(): Promise<void> {
    try {
      // 兼容旧行为：整体初始化 + 一次性应用所有增强
      await this.initCore();
      await this.applyEnhancements();
      this.hideLoadingIndicator();
      log('Video detail enhancement completed');
    } catch (error) {
      log('Error enhancing video detail:', error);
      this.hideLoadingIndicator();
    }
  }

  /**
   * 轻量核心初始化：应用选项、解析 videoId、展示加载指示器、拉取增强数据、执行定点标题翻译。
   * 注意：不执行封面/评分/演员等重型 UI 增强，便于外部通过编排器分步调度。
   */
  async initCore(): Promise<void> {
    // 将设置中的 videoEnhancement 子项应用到选项
    this.applyOptionsFromSettings();
    this.videoId = extractVideoIdFromPage();
    if (!this.videoId) {
      log('No video ID found, skipping enhancement');
      return;
    }

    log(`Enhancing video detail page (core) for: ${this.videoId}`);

    if (this.options.showLoadingIndicator) {
      this.showLoadingIndicator();
    }

    // 获取增强数据
    this.enhancedData = await defaultDataAggregator.getEnhancedVideoInfo(this.videoId);

    // 执行“current-title”定点翻译
    await this.translateCurrentTitleIfNeeded();
  }

  /**
   * 单独运行封面增强（供外部编排 deferred 调用）
   */
  async runCover(): Promise<void> {
    if (!this.enhancedData) return;
    if (this.options.enableCoverImage && this.enhancedData.images) {
      await this.enhanceCoverImage(this.enhancedData.images);
    }
  }

  /**
   * 单独运行标题增强（聚合层译文展示，避免与定点翻译重复）
   */
  async runTitle(): Promise<void> {
    if (!this.enhancedData) return;
    if (this.options.enableTranslation && this.enhancedData.translatedTitle) {
      const alreadyHasTranslation = document.querySelector('.enhanced-translation');
      if (!alreadyHasTranslation) {
        await this.enhanceTitle(this.enhancedData.translatedTitle);
      }
    }
  }

  /**
   * 单独运行破解评论区功能
   */
  async runReviewBreaker(): Promise<void> {
    if (!this.videoId || !this.options.enableReviewBreaker) return;
    
    try {
      log('[ReviewBreaker] Starting review enhancement');
      await this.enhanceReviews(this.videoId);
    } catch (error) {
      log('[ReviewBreaker] Error enhancing reviews:', error);
    }
  }

  /**
   * 单独运行FC2拦截破解功能
   */
  async runFC2Breaker(): Promise<void> {
    if (!this.videoId || !this.options.enableFC2Breaker) return;
    
    if (!fc2BreakerService.isFC2Video(this.videoId)) {
      log('[FC2Breaker] Not an FC2 video, skipping');
      return;
    }

    try {
      log('[FC2Breaker] Starting FC2 enhancement');
      await this.enhanceFC2Video(this.videoId);
    } catch (error) {
      log('[FC2Breaker] Error enhancing FC2 video:', error);
    }
  }

  /**
   * 外部编排结束时可显式调用，统一隐藏加载指示器
   */
  finish(): void {
    if (this.options.showLoadingIndicator) {
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
      // 如果已通过 current-title 定点翻译插入了翻译块，则避免再次使用聚合层的缓存译文，防止重复
      const alreadyHasTranslation = document.querySelector('.enhanced-translation');
      if (!alreadyHasTranslation) {
        promises.push(this.enhanceTitle(this.enhancedData.translatedTitle));
      }
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
      // 查找标题元素 - 更新为JavDB的实际结构
      const titleElements = document.querySelectorAll('h2.title.is-4 .current-title, h2.title.is-4, h1, .title, .video-title, .movie-title');
      for (let i = 0; i < titleElements.length; i++) {
        const titleElement = titleElements[i] as HTMLElement;
        const originalTitle = titleElement.textContent?.trim();
        if (originalTitle && originalTitle.length > 5) {
          const translationContainer = this.createTranslationContainer(originalTitle, translatedTitle);
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
   * 增强评论区功能
   */
  private async enhanceReviews(_videoId: string): Promise<void> {
    try {
      // 从URL中提取movieId（例如：https://javdb.com/v/NQ6pPb -> NQ6pPb）
      const movieId = window.location.pathname.split('/').pop()?.split(/[?#]/)[0];
      if (!movieId) {
        log('[ReviewBreaker] Failed to extract movieId from URL');
        return;
      }
      log(`[ReviewBreaker] Extracted movieId from URL: ${movieId}`);

      // 先监听短评标签的点击事件，点击时立即显示加载提示
      const reviewTab = document.querySelector('.movie-panel-info a[data-movie-tab-target="reviews"]') as HTMLElement | null;
      
      if (reviewTab) {
        log('[ReviewBreaker] Found review tab, adding click listener');
        
        // 添加点击监听
        reviewTab.addEventListener('click', async () => {
          log('[ReviewBreaker] Review tab clicked, showing loading indicator immediately');
          
          // 立即显示加载提示（在页面中心）
          const earlyLoadingIndicator = this.createEarlyLoadingIndicator();
          document.body.appendChild(earlyLoadingIndicator);
          
          // 等待评论区DOM加载
          const reviewsRoot = (await this.waitForElement('div[data-movie-tab-target="reviews"], #reviews', 6000, 200)) as HTMLElement | null;
          
          // 移除早期加载提示
          earlyLoadingIndicator.remove();
          
          if (!reviewsRoot) {
            log('[ReviewBreaker] Native #reviews container not found, skip.');
            return;
          }

          // 继续原有的破解逻辑
          await this.processReviewBreaking(reviewsRoot, movieId);
        }, { once: true }); // 只监听一次点击
      } else {
        log('[ReviewBreaker] Review tab not found, will try alternative selectors');
        // 尝试其他可能的选择器
        const altReviewTab = document.querySelector('a[href*="reviews"], .review-tab, [data-tab="reviews"]') as HTMLElement | null;
        if (altReviewTab) {
          log('[ReviewBreaker] Found alternative review tab');
          altReviewTab.addEventListener('click', async () => {
            log('[ReviewBreaker] Alternative review tab clicked');
            const earlyLoadingIndicator = this.createEarlyLoadingIndicator();
            document.body.appendChild(earlyLoadingIndicator);
            
            const reviewsRoot = (await this.waitForElement('div[data-movie-tab-target="reviews"], #reviews', 6000, 200)) as HTMLElement | null;
            earlyLoadingIndicator.remove();
            
            if (reviewsRoot) {
              await this.processReviewBreaking(reviewsRoot, movieId);
            }
          }, { once: true });
        }
      }

      // 如果用户直接访问带有评论区的页面（不是通过点击标签），也要处理
      const reviewsRoot = document.querySelector('div[data-movie-tab-target="reviews"], #reviews') as HTMLElement | null;
      if (reviewsRoot && reviewsRoot.offsetParent !== null) {
        // 评论区已经可见，直接处理
        log('[ReviewBreaker] Reviews section already visible, processing immediately');
        await this.processReviewBreaking(reviewsRoot, movieId);
      }
    } catch (error) {
      log('[ReviewBreaker] Error enhancing reviews:', error);
      showToast('评论区增强失败', 'error');
    }
  }

  /**
   * 创建早期加载提示（在点击标签时立即显示）
   */
  private createEarlyLoadingIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.id = 'jhs-early-loading';
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      padding: 24px 32px;
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 16px;
      animation: fadeIn 0.3s ease-out;
    `;

    // 加载动画
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 32px;
      height: 32px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    `;

    // 文字内容
    const text = document.createElement('div');
    text.style.cssText = `
      color: white;
      font-size: 16px;
      font-weight: bold;
    `;
    text.textContent = '🔓 正在解锁评论...';

    indicator.appendChild(spinner);
    indicator.appendChild(text);

    // 添加动画样式
    if (!document.getElementById('jhs-early-loading-animations')) {
      const style = document.createElement('style');
      style.id = 'jhs-early-loading-animations';
      style.textContent = `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `;
      document.head.appendChild(style);
    }

    return indicator;
  }

  /**
   * 处理评论破解逻辑
   */
  private async processReviewBreaking(reviewsRoot: HTMLElement, movieId: string): Promise<void> {
    try {
      // 检查是否需要破解：
      // 1. 查找评论总数（从tab标签中提取）
      // 2. 查找实际显示的评论数量
      // 3. 检查是否有VIP提示
      const reviewTab = document.querySelector('.review-tab span') as HTMLElement | null;
      const totalCountMatch = reviewTab?.textContent?.match(/短評\((\d+)\)/);
      const totalCount = totalCountMatch ? parseInt(totalCountMatch[1], 10) : 0;
      
      const nativeReviewItems = reviewsRoot.querySelectorAll('.review-item:not(.more)');
      const displayedCount = nativeReviewItems.length;
      
      const hasVipPrompt = reviewsRoot.querySelector('.review-item.more');
      
      log(`[ReviewBreaker] Review stats: total=${totalCount}, displayed=${displayedCount}, hasVipPrompt=${!!hasVipPrompt}`);
      
      // 如果显示的评论数量等于总数，且没有VIP提示，说明已经全部显示，跳过
      if (displayedCount >= totalCount && !hasVipPrompt) {
        log('[ReviewBreaker] All reviews are already displayed, skip API fetch.');
        return;
      }
      
      // 如果评论数量<=3且有VIP提示，说明需要破解
      if (displayedCount <= 3 && hasVipPrompt) {
        log('[ReviewBreaker] VIP-locked reviews detected, fetching from API...');
      } else if (displayedCount < totalCount) {
        log('[ReviewBreaker] Partial reviews displayed, fetching complete list from API...');
      } else {
        log('[ReviewBreaker] No need to fetch, all reviews visible.');
        return;
      }

      const ensureList = (): HTMLElement => {
        let dl = reviewsRoot.querySelector('dl.review-items') as HTMLElement | null;
        if (!dl) {
          const body = reviewsRoot.querySelector('.message .message-body') as HTMLElement | null
                    || reviewsRoot.querySelector('.message-body') as HTMLElement | null
                    || reviewsRoot;
          dl = document.createElement('dl');
          dl.className = 'review-items';
          body.appendChild(dl);
        }
        return dl;
      };

      const listEl = ensureList();
      
      // 移除VIP提示
      const vipPrompt = listEl.querySelector('.review-item.more');
      if (vipPrompt) {
        vipPrompt.remove();
        log('[ReviewBreaker] Removed VIP prompt');
      }
      
      const hideLoadingPlaceholders = () => {
        const nodes = Array.from(reviewsRoot.querySelectorAll('.message .message-body, .message-body, p, div, span')) as HTMLElement[];
        for (const el of nodes) {
          const t = (el.textContent || '').trim();
          if (!t) continue;
          if (t.includes('读取中') || t.includes('讀取中') || t.includes('加载中') || t.includes('加載中') || t.includes('Loading')) {
            el.style.display = 'none';
          }
        }
      };
      
      const getErrorHost = (): HTMLElement => {
        let host = reviewsRoot.querySelector('#jhs-review-error') as HTMLElement | null;
        if (!host) {
          host = document.createElement('div');
          host.id = 'jhs-review-error';
          listEl.parentElement?.insertBefore(host, listEl.nextSibling);
        }
        return host;
      };

      const injectOnce = async () => {
        // 显示加载提示
        const loadingIndicator = this.createLoadingIndicator();
        const messageBody = reviewsRoot.querySelector('.message-body') as HTMLElement | null;
        const insertTarget = messageBody || reviewsRoot;
        
        // 插入到评论列表之前
        if (listEl.parentElement) {
          listEl.parentElement.insertBefore(loadingIndicator, listEl);
        } else {
          insertTarget.insertBefore(loadingIndicator, insertTarget.firstChild);
        }
        
        // 确保加载提示至少显示500ms，让用户看到
        const minDisplayTime = 500;
        const startTime = Date.now();
        
        try {
          const resp = await reviewBreakerService.getReviews(movieId, 1, 100); // 使用movieId而不是videoId
          
          // 等待最小显示时间
          const elapsed = Date.now() - startTime;
          if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
          }
          
          // 移除加载提示
          loadingIndicator.remove();
          
          hideLoadingPlaceholders();
          if (resp.success && resp.data) {
            // 隐藏原生评论（保留DOM结构但不显示）
            const nativeReviews = listEl.querySelectorAll('.review-item:not(.jhs-review-item)');
            nativeReviews.forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });
            
            // 移除所有VIP提示（包括在reviewsRoot中的所有位置）
            const vipPrompts = reviewsRoot.querySelectorAll('.review-item.more');
            vipPrompts.forEach(el => el.remove());
            log('[ReviewBreaker] Removed VIP prompts and hidden native reviews');
            
            // 添加提示横幅（插入到listEl之前）
            this.addReviewBreakerBanner(listEl, resp.data.length, totalCount);
            
            this.displayNativeReviews(resp.data, listEl);
            const err = reviewsRoot.querySelector('#jhs-review-error') as HTMLElement | null;
            if (err) err.remove();
            log('[ReviewBreaker] Native reviews injected.');
          } else {
            const host = getErrorHost();
            this.renderRetryBlock(host, `评论获取失败：${resp.error || ''}`, '重试获取', async () => {
              host.innerHTML = '<div style="text-align:center;padding:16px;">正在重试...</div>';
              await injectOnce();
            });
            log('[ReviewBreaker] Failed to fetch reviews for native mount:', resp.error);
          }
        } catch (e) {
          // 等待最小显示时间
          const elapsed = Date.now() - startTime;
          if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
          }
          
          // 移除加载提示
          loadingIndicator.remove();
          
          hideLoadingPlaceholders();
          const host = getErrorHost();
          this.renderRetryBlock(host, `评论获取失败：${e instanceof Error ? e.message : String(e)}`, '重试获取', async () => {
            host.innerHTML = '<div style="text-align:center;padding:16px;">正在重试...</div>';
            await injectOnce();
          });
          log('[ReviewBreaker] Exception while injecting native reviews:', e);
        }
      };

      await injectOnce();

      // 监听 tabs 切换导致的 DOM 重渲染，自动补回注入
      const observer = new MutationObserver(() => {
        const dl = reviewsRoot.querySelector('dl.review-items') as HTMLElement | null;
        // 若列表被重建且没有我们的注入项，则再次注入
        if (dl && !dl.querySelector('.jhs-review-item')) {
          this.displayNativeReviews((window as any).__JHS_REVIEWS_CACHE__ || [], dl);
        }
      });
      try {
        observer.observe(reviewsRoot, { childList: true, subtree: true });
      } catch {}
      // 轻量缓存，供重渲染时快速还原（页面内作用域即可）
      (window as any).__JHS_REVIEWS_CACHE__ = (window as any).__JHS_REVIEWS_CACHE__ || [];
      
      log('[ReviewBreaker] Reviews enhancement (native mount) ready');
    } catch (error) {
      log('[ReviewBreaker] Error enhancing reviews:', error);
      showToast('评论区增强失败', 'error');
    }
  }

  /**
   * 增强FC2视频信息
   */
  private async enhanceFC2Video(videoId: string): Promise<void> {
    try {
      const response = await fc2BreakerService.getFC2VideoInfo(videoId);
      
      if (!response.success || !response.data) {
        log('[FC2Breaker] Failed to get FC2 video info:', response.error);
        showToast(`FC2增强失败: ${response.error}`, 'error');

        // 插入占位容器 + 重试按钮（不影响其它功能）
        const targetContainer = document.querySelector('.container, .content, main');
        if (targetContainer) {
          const placeholder = document.createElement('div');
          placeholder.className = 'enhanced-fc2-info';
          placeholder.style.cssText = `
            margin: 20px 0;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border: 1px dashed #f0b37e;
            border-left: 4px solid #ff9800;
          `;

          const setupErrorUI = (msg: string) => {
            this.renderRetryBlock(placeholder, msg, '重试获取', async () => {
              placeholder.innerHTML = '<div style="text-align:center;padding:16px;">正在重试...</div>';
              const retry = await fc2BreakerService.getFC2VideoInfo(videoId);
              if (retry.success && retry.data) {
                const fc2Container = this.createFC2InfoContainer(retry.data);
                try { placeholder.replaceWith(fc2Container); } catch { targetContainer.appendChild(fc2Container); placeholder.remove(); }
                showToast('FC2视频信息增强成功', 'success');
              } else {
                setupErrorUI(`FC2增强失败：${retry.error || '未知错误'}`);
              }
            });
          };

          const insertPosition = targetContainer.querySelector('.video-info, .movie-info') || targetContainer.firstElementChild;
          if (insertPosition) {
            insertPosition.parentElement?.insertBefore(placeholder, insertPosition.nextSibling);
          } else {
            targetContainer.appendChild(placeholder);
          }

          setupErrorUI(`FC2增强失败：${response.error || '未知错误'}`);
        }
        return;
      }

      const fc2Info = response.data;
      
      // 创建FC2信息展示区域
      const fc2Container = this.createFC2InfoContainer(fc2Info);
      
      // 查找合适的位置插入FC2信息
      const targetContainer = document.querySelector('.container, .content, main');
      if (targetContainer) {
        const insertPosition = targetContainer.querySelector('.video-info, .movie-info') || 
                              targetContainer.firstElementChild;
        if (insertPosition) {
          insertPosition.parentElement?.insertBefore(fc2Container, insertPosition.nextSibling);
        } else {
          targetContainer.appendChild(fc2Container);
        }
      }

      log('[FC2Breaker] FC2 video enhanced successfully');
      showToast('FC2视频信息增强成功', 'success');
    } catch (error) {
      log('[FC2Breaker] Error enhancing FC2 video:', error);
      showToast('FC2增强失败', 'error');
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
    // 为调试/辅助用途保存原始标题，避免未使用参数告警
    try { container.setAttribute('data-original-title', originalTitle || ''); } catch {}
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
   * 显示加载指示器
   */
  private showLoadingIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'enhancement-loading';
    indicator.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
      color: white;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      animation: slideInRight 0.3s ease-out;
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

  /**
   * 在容器内渲染错误提示与重试按钮（轻量UI，不影响其它增强流程）
   */
  private renderRetryBlock(container: HTMLElement, message: string, retryText: string, onRetry: () => Promise<void>): void {
    container.innerHTML = `
      <div style="text-align: center; padding: 16px; color: var(--text-secondary, #666);">
        <div style="margin-bottom: 8px;">${message}</div>
        <button class="enhance-retry-btn" style="background: var(--bg-tertiary, #eee); border: 1px solid var(--border-primary, #ddd); padding: 6px 12px; border-radius: 4px; cursor: pointer; color: var(--text-primary, #333); transition: background 0.2s;">${retryText}</button>
      </div>
    `;
    const btn = container.querySelector('.enhance-retry-btn') as HTMLButtonElement | null;
    if (!btn) return;
    
    // 添加悬停效果
    btn.onmouseenter = () => btn.style.background = 'var(--bg-hover, #e0e0e0)';
    btn.onmouseleave = () => btn.style.background = 'var(--bg-tertiary, #eee)';
    
    btn.onclick = async () => {
      const old = btn.textContent || '重试';
      btn.disabled = true;
      btn.textContent = '重试中...';
      try {
        await onRetry();
      } catch (e) {
        // 静默失败，保持按钮可再次重试
      } finally {
        btn.textContent = old;
        btn.disabled = false;
      }
    };
  }

  /**
   * 创建加载提示
   */
  private createLoadingIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.id = 'jhs-review-loading';
    indicator.style.cssText = `
      margin: 0 0 16px 0;
      padding: 20px;
      background: linear-gradient(135deg, var(--info, #2196f3) 0%, var(--primary, #1976d2) 100%);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 16px;
      animation: slideInDown 0.3s ease-out;
    `;

    // 加载动画
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    `;

    // 文字内容
    const textContent = document.createElement('div');
    textContent.style.cssText = `
      flex: 1;
      color: white;
    `;

    const mainText = document.createElement('div');
    mainText.style.cssText = `
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 4px;
    `;
    mainText.textContent = '🔓 正在解锁全部评论...';

    const subText = document.createElement('div');
    subText.style.cssText = `
      font-size: 13px;
      opacity: 0.9;
    `;
    subText.textContent = 'JavDB 助手正在为您获取完整评论内容';

    textContent.appendChild(mainText);
    textContent.appendChild(subText);

    indicator.appendChild(spinner);
    indicator.appendChild(textContent);

    // 添加旋转动画样式
    if (!document.getElementById('jhs-loading-animations')) {
      const style = document.createElement('style');
      style.id = 'jhs-loading-animations';
      style.textContent = `
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `;
      document.head.appendChild(style);
    }

    return indicator;
  }

  /**
   * 添加评论破解提示横幅
   */
  private addReviewBreakerBanner(listEl: HTMLElement, fetchedCount: number, totalCount: number): void {
    // 检查是否已存在横幅
    const existingBanner = document.querySelector('#jhs-review-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    const banner = document.createElement('div');
    banner.id = 'jhs-review-banner';
    banner.style.cssText = `
      margin: 0 0 16px 0;
      padding: 12px 16px;
      background: linear-gradient(135deg, #4caf50 0%, #2196f3 100%);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInDown 0.3s ease-out;
    `;

    // 图标
    const icon = document.createElement('span');
    icon.innerHTML = '✨';
    icon.style.cssText = `
      font-size: 20px;
      flex-shrink: 0;
    `;

    // 文字内容
    const textContent = document.createElement('div');
    textContent.style.cssText = `
      flex: 1;
      color: white;
      font-size: 14px;
      line-height: 1.5;
    `;

    const mainText = document.createElement('div');
    mainText.style.fontWeight = 'bold';
    mainText.textContent = `🎉 已为您解锁全部 ${fetchedCount} 条评论`;

    const subText = document.createElement('div');
    subText.style.cssText = `
      font-size: 12px;
      opacity: 0.9;
      margin-top: 2px;
    `;
    subText.textContent = `由 JavDB 助手提供 · 原本仅显示 ${Math.min(3, totalCount)} 条`;

    textContent.appendChild(mainText);
    textContent.appendChild(subText);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 20px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = 'rgba(255,255,255,0.3)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'rgba(255,255,255,0.2)';
    };
    closeBtn.onclick = () => {
      banner.style.animation = 'slideOutUp 0.3s ease-out';
      setTimeout(() => banner.remove(), 300);
    };

    banner.appendChild(icon);
    banner.appendChild(textContent);
    banner.appendChild(closeBtn);

    // 添加动画样式
    if (!document.getElementById('jhs-banner-animations')) {
      const style = document.createElement('style');
      style.id = 'jhs-banner-animations';
      style.textContent = `
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOutUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // 插入到评论列表之前
    if (listEl.parentElement) {
      listEl.parentElement.insertBefore(banner, listEl);
    }
    
    log('[ReviewBreaker] Banner added before review list');
  }

  /**
   * 将评论渲染为原生样式并挂载到 <dl class="review-items">，支持分页
   */
  private displayNativeReviews(reviews: ReviewData[], dl: HTMLElement): void {
    const filterKeywords = reviewBreakerService.getFilterKeywords();
    const filtered = reviews.filter(r => !reviewBreakerService.shouldFilterReview(r, filterKeywords));

    // 缓存供重渲染复用
    try { (window as any).__JHS_REVIEWS_CACHE__ = filtered; } catch {}

    // 分页配置
    const pageSize = 10;
    const totalPages = Math.ceil(filtered.length / pageSize);
    let currentPage = 1;

    // 隐藏所有原生评论（一次性处理，不在分页时重复）
    const hideNativeReviews = () => {
      const nativeReviews = dl.querySelectorAll('.review-item:not(.jhs-review-item)');
      nativeReviews.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    };

    // 清空现有JHS评论
    const clearJhsReviews = () => {
      const existingJhsReviews = dl.querySelectorAll('.jhs-review-item');
      existingJhsReviews.forEach(el => el.remove());
    };

    // 渲染指定页的评论
    const renderPage = (page: number) => {
      // 清空JHS评论
      clearJhsReviews();

      // 确保原生评论始终隐藏
      hideNativeReviews();

      // 计算当前页的评论范围
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, filtered.length);
      const pageReviews = filtered.slice(startIndex, endIndex);

      // 渲染当前页评论
      pageReviews.forEach(review => {
        dl.appendChild(this.createNativeReviewElement(review));
      });

      // 更新分页器状态
      updatePagination(page);
    };

    // 创建分页器
    const createPagination = (): HTMLElement => {
      const pagination = document.createElement('div');
      pagination.id = 'jhs-review-pagination';
      pagination.className = 'message-body'; // 使用JavDB的message-body类来继承主题样式
      
      pagination.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 20px;
        padding: 16px;
        border-radius: 8px;
        opacity: 0.95;
      `;

      // 上一页按钮
      const prevBtn = document.createElement('button');
      prevBtn.id = 'jhs-prev-page';
      prevBtn.className = 'button is-small is-info'; // 使用Bulma的按钮样式
      prevBtn.textContent = '‹ 上一页';
      prevBtn.style.cssText = `
        margin: 0 4px;
        font-size: 14px;
      `;
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
          scrollToReviews();
        }
      };

      // 页码信息
      const pageInfo = document.createElement('span');
      pageInfo.id = 'jhs-page-info';
      pageInfo.style.cssText = `
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
      `;

      // 下一页按钮
      const nextBtn = document.createElement('button');
      nextBtn.id = 'jhs-next-page';
      nextBtn.className = 'button is-small is-info'; // 使用Bulma的按钮样式
      nextBtn.textContent = '下一页 ›';
      nextBtn.style.cssText = `
        margin: 0 4px;
        font-size: 14px;
      `;
      nextBtn.onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
          scrollToReviews();
        }
      };

      pagination.appendChild(prevBtn);
      pagination.appendChild(pageInfo);
      pagination.appendChild(nextBtn);

      return pagination;
    };

    // 更新分页器状态
    const updatePagination = (page: number) => {
      const prevBtn = document.getElementById('jhs-prev-page') as HTMLButtonElement | null;
      const nextBtn = document.getElementById('jhs-next-page') as HTMLButtonElement | null;
      const pageInfo = document.getElementById('jhs-page-info');

      if (prevBtn) {
        prevBtn.disabled = page <= 1;
        prevBtn.style.opacity = page <= 1 ? '0.5' : '1';
        prevBtn.style.cursor = page <= 1 ? 'not-allowed' : 'pointer';
      }

      if (nextBtn) {
        nextBtn.disabled = page >= totalPages;
        nextBtn.style.opacity = page >= totalPages ? '0.5' : '1';
        nextBtn.style.cursor = page >= totalPages ? 'not-allowed' : 'pointer';
      }

      if (pageInfo) {
        pageInfo.textContent = `第 ${page} / ${totalPages} 页 (共 ${filtered.length} 条评论)`;
      }
    };

    // 滚动到评论区
    const scrollToReviews = () => {
      const reviewsRoot = dl.closest('[data-movie-tab-target="reviews"], #reviews');
      if (reviewsRoot) {
        reviewsRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // 如果评论数量超过10条，添加分页器
    if (filtered.length > pageSize) {
      // 移除旧的分页器
      const oldPagination = document.getElementById('jhs-review-pagination');
      if (oldPagination) oldPagination.remove();

      // 添加新的分页器
      const pagination = createPagination();
      dl.parentElement?.appendChild(pagination);
    }

    // 渲染第一页
    renderPage(1);
  }

  /**
   * 创建接近原生结构的 <dt class="review-item">，以复用站点样式
   */
  private createNativeReviewElement(review: ReviewData): HTMLElement {
    const dt = document.createElement('dt');
    dt.className = 'review-item jhs-review-item';
    dt.id = `jhs-review-${review.id}`;
    dt.setAttribute('data-source', 'jhs');

    const title = document.createElement('div');
    title.className = 'review-title';

    // 右侧点赞（只展示，不提交）
    const likesWrap = document.createElement('div');
    likesWrap.className = 'likes is-pulled-right';
    const likeBtn = document.createElement('button');
    likeBtn.className = 'button is-small is-info';
    likeBtn.type = 'button';
    likeBtn.title = '贊';
    likeBtn.disabled = true;
    const likeLabel = document.createElement('span');
    likeLabel.className = 'label';
    likeLabel.textContent = '贊';
    const likeCount = document.createElement('span');
    likeCount.className = 'likes-count';
    likeCount.textContent = String(review.likes ?? 0);
    likeBtn.appendChild(likeLabel);
    likeBtn.appendChild(likeCount);
    likesWrap.appendChild(likeBtn);

    // 作者
    const authorText = document.createTextNode(`${review.author}\u00A0`);

    // 评分星星（最多5个）
    const stars = document.createElement('span');
    stars.className = 'score-stars';
    const starCount = Math.max(0, Math.min(5, Math.round(((review.rating ?? 0) as number) / 2)));
    for (let i = 0; i < starCount; i++) {
      const iEl = document.createElement('i');
      iEl.className = 'icon-star';
      stars.appendChild(iEl);
    }

    // 时间
    const time = document.createElement('span');
    time.className = 'time';
    try {
      const d = new Date(review.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      time.textContent = `${y}-${m}-${day}`;
    } catch {
      time.textContent = review.date;
    }

    // 标题行组装
    title.appendChild(likesWrap);
    title.appendChild(authorText);
    title.appendChild(document.createTextNode('\u00A0'));
    title.appendChild(stars);
    title.appendChild(document.createTextNode('\u00A0'));
    title.appendChild(time);

    // 正文
    const contentWrap = document.createElement('div');
    contentWrap.className = 'content';
    const p = document.createElement('p');
    p.textContent = review.content;
    contentWrap.appendChild(p);

    dt.appendChild(title);
    dt.appendChild(contentWrap);
    return dt;
  }

  /**
   * 创建FC2信息容器
   */
  private createFC2InfoContainer(fc2Info: FC2VideoInfo): HTMLElement {
    const container = document.createElement('div');
    container.className = 'enhanced-fc2-info';
    container.style.cssText = `
      margin: 20px 0;
      padding: 20px;
      background: var(--bg-secondary, #fff);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid var(--border-primary, #e0e0e0);
      border-left: 4px solid var(--warning, #ff9800);
    `;

    const title = document.createElement('h3');
    title.textContent = 'FC2 增强信息';
    title.style.cssText = `
      margin: 0 0 15px 0;
      color: var(--text-primary, #333);
      font-size: 18px;
      border-bottom: 2px solid var(--warning, #ff9800);
      padding-bottom: 5px;
    `;

    const infoGrid = document.createElement('div');
    infoGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    `;

    // 基本信息
    if (fc2Info.releaseDate) {
      const dateInfo = this.createInfoItem('发布日期', fc2Info.releaseDate);
      infoGrid.appendChild(dateInfo);
    }

    if (fc2Info.score) {
      const scoreInfo = this.createInfoItem('评分', fc2Info.score);
      infoGrid.appendChild(scoreInfo);
    }

    if (fc2Info.duration) {
      const durationInfo = this.createInfoItem('时长', `${fc2Info.duration} 分钟`);
      infoGrid.appendChild(durationInfo);
    }

    // 演员信息
    if (fc2Info.actors && fc2Info.actors.length > 0) {
      const actorsDiv = document.createElement('div');
      actorsDiv.style.cssText = `margin-bottom: 15px;`;
      
      const actorsTitle = document.createElement('h4');
      actorsTitle.textContent = '主演演员';
      actorsTitle.style.cssText = `margin: 0 0 10px 0; color: var(--text-primary, #333);`;
      
      const actorsList = document.createElement('div');
      actorsList.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      `;
      
      fc2Info.actors.forEach(actor => {
        const actorTag = document.createElement('span');
        actorTag.style.cssText = `
          background: var(--bg-tertiary, #f0f0f0);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 14px;
          color: var(--text-primary, #333);
        `;
        actorTag.textContent = actor.name;
        actorsList.appendChild(actorTag);
      });
      
      actorsDiv.appendChild(actorsTitle);
      actorsDiv.appendChild(actorsList);
      container.appendChild(actorsDiv);
    }

    // 预览图片
    if (fc2Info.images && fc2Info.images.length > 0) {
      const imagesDiv = document.createElement('div');
      imagesDiv.style.cssText = `margin-bottom: 15px;`;
      
      const imagesTitle = document.createElement('h4');
      imagesTitle.textContent = '预览图片';
      imagesTitle.style.cssText = `margin: 0 0 10px 0; color: var(--text-primary, #333);`;
      
      const imagesList = document.createElement('div');
      imagesList.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
      `;
      
      fc2Info.images.forEach((imgSrc, index) => {
        const imgWrapper = document.createElement('a');
        imgWrapper.href = imgSrc;
        imgWrapper.target = '_blank';
        imgWrapper.style.cssText = `
          display: block;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s;
          border: 1px solid var(--border-primary, #e0e0e0);
        `;
        imgWrapper.onmouseenter = () => imgWrapper.style.transform = 'scale(1.05)';
        imgWrapper.onmouseleave = () => imgWrapper.style.transform = 'scale(1)';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `预览图 ${index + 1}`;
        img.style.cssText = `
          width: 100%;
          height: auto;
          display: block;
        `;
        
        imgWrapper.appendChild(img);
        imagesList.appendChild(imgWrapper);
      });
      
      imagesDiv.appendChild(imagesTitle);
      imagesDiv.appendChild(imagesList);
      container.appendChild(imagesDiv);
    }

    container.appendChild(title);
    container.appendChild(infoGrid);

    return container;
  }

  /**
   * 创建信息项
   */
  private createInfoItem(label: string, value: string, url?: string): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 10px;
      background: var(--bg-tertiary, #f9f9f9);
      border-radius: 4px;
      border: 1px solid var(--border-primary, transparent);
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-size: 12px;
      color: var(--text-secondary, #666);
      margin-bottom: 4px;
      font-weight: bold;
    `;

    const valueEl = document.createElement('div');
    valueEl.style.cssText = `
      font-size: 14px;
      color: var(--text-primary, #333);
    `;

    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.textContent = value;
      link.style.cssText = `color: var(--primary, #007bff); text-decoration: none;`;
      valueEl.appendChild(link);
    } else {
      valueEl.textContent = value;
    }

    item.appendChild(labelEl);
    item.appendChild(valueEl);

    return item;
  }
}

// 导出增强器实例
export const videoDetailEnhancer = new VideoDetailEnhancer();

// src/content/enhancedVideoDetail.ts
// 视频详情页增强功能

import { defaultDataAggregator } from '../services/dataAggregator';
import { aiService } from '../services/ai/aiService';
import { showToast } from './toast';
import { VideoMetadata, ImageData, RatingData, ActorData } from '../services/dataAggregator/types';
import { STATE, log } from './state';
import { extractVideoIdFromPage } from './videoId';
import { reviewBreakerService, ReviewData } from '../services/reviewBreaker';
import { fc2BreakerService, FC2VideoInfo } from '../services/fc2Breaker';

export interface EnhancementOptions {
  enableCoverImage: boolean;
  enableTranslation: boolean;
  enableRating: boolean;
  enableActorInfo: boolean;
  showLoadingIndicator: boolean;
  enableReviewBreaker: boolean;
  enableFC2Breaker: boolean;
}

export class VideoDetailEnhancer {
  private videoId: string | null = null;
  private enhancedData: VideoMetadata | null = null;
  private options: EnhancementOptions;
  // 计数器：用于外部编排时选择性隐藏加载指示器
  private pendingParts = 0;

  constructor(options: Partial<EnhancementOptions> = {}) {
    this.options = {
      enableCoverImage: true,
      enableTranslation: true,
      enableRating: true,
      enableActorInfo: true,
      showLoadingIndicator: true,
      enableReviewBreaker: false,
      enableFC2Breaker: false,
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
      this.options.enableRating = cfg.enableRating !== false;
      this.options.enableActorInfo = cfg.enableActorInfo !== false;
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
      const enabledByVE = !!settings?.videoEnhancement?.enableTranslation;
      if (!enabledByGlobal && !enabledByVE) return;
      console.log('[Translation] Enable check:', { enabledByGlobal, enabledByVE });

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
   * 单独运行评分增强
   */
  async runRating(): Promise<void> {
    if (!this.enhancedData) return;
    if (this.options.enableRating && this.enhancedData.ratings) {
      await this.enhanceRating(this.enhancedData.ratings);
    }
  }

  /**
   * 单独运行演员信息增强
   */
  async runActors(): Promise<void> {
    if (!this.enhancedData) return;
    if (this.options.enableActorInfo && this.enhancedData.actors) {
      await this.enhanceActorInfo(this.enhancedData.actors);
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
   * 增强评论区功能
   */
  private async enhanceReviews(videoId: string): Promise<void> {
    try {
      // 查找合适的位置插入评论区
      const targetContainer = document.querySelector('.container, .content, main, body');
      if (!targetContainer) {
        log('[ReviewBreaker] No suitable container found for reviews');
        return;
      }

      // 创建评论区容器
      const reviewsContainer = this.createReviewsContainer();
      
      // 插入到页面中
      const insertPosition = targetContainer.querySelector('.video-info, .movie-info') || 
                            targetContainer.firstElementChild;
      if (insertPosition) {
        insertPosition.parentElement?.insertBefore(reviewsContainer, insertPosition.nextSibling);
      } else {
        targetContainer.appendChild(reviewsContainer);
      }

      // 加载评论数据
      await this.loadReviews(videoId, reviewsContainer);

      log('[ReviewBreaker] Reviews enhanced successfully');
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

  /**
   * 创建评论区容器
   */
  private createReviewsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'enhanced-reviews-section';
    container.style.cssText = `
      margin: 20px 0;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #4CAF50;
    `;

    const title = document.createElement('h3');
    title.textContent = '评论区 (增强版)';
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 18px;
    `;

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '展开';
    toggleBtn.className = 'reviews-toggle-btn';
    toggleBtn.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;

    header.appendChild(title);
    header.appendChild(toggleBtn);

    const content = document.createElement('div');
    content.className = 'reviews-content';
    content.style.cssText = `
      display: none;
      min-height: 100px;
    `;

    container.appendChild(header);
    container.appendChild(content);

    return container;
  }

  /**
   * 加载评论数据
   */
  private async loadReviews(videoId: string, container: HTMLElement): Promise<void> {
    const contentDiv = container.querySelector('.reviews-content') as HTMLElement;
    const toggleBtn = container.querySelector('.reviews-toggle-btn') as HTMLButtonElement;
    
    if (!contentDiv || !toggleBtn) return;

    let isLoaded = false;
    let currentPage = 1;
    const reviewsPerPage = 20;

    toggleBtn.onclick = async () => {
      if (contentDiv.style.display === 'none') {
        contentDiv.style.display = 'block';
        toggleBtn.textContent = '折叠';
        
        if (!isLoaded) {
          contentDiv.innerHTML = '<div style="text-align: center; padding: 20px;">正在加载评论...</div>';
          
          try {
            const response = await reviewBreakerService.getReviews(videoId, currentPage, reviewsPerPage);
            
            if (response.success && response.data) {
              this.displayReviews(response.data, contentDiv, videoId);
              isLoaded = true;
            } else {
              contentDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">获取评论失败: ${response.error || '未知错误'}</div>`;
            }
          } catch (error) {
            contentDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">获取评论失败</div>';
          }
        }
      } else {
        contentDiv.style.display = 'none';
        toggleBtn.textContent = '展开';
      }
    };
  }

  /**
   * 显示评论列表
   */
  private displayReviews(reviews: ReviewData[], container: HTMLElement, videoId: string): void {
    const filterKeywords = reviewBreakerService.getFilterKeywords();
    
    container.innerHTML = '';
    
    const filteredReviews = reviews.filter(review => 
      !reviewBreakerService.shouldFilterReview(review, filterKeywords)
    );

    if (filteredReviews.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">暂无评论</div>';
      return;
    }

    filteredReviews.forEach(review => {
      const reviewElement = this.createReviewElement(review);
      container.appendChild(reviewElement);
    });

    // 添加加载更多按钮
    if (reviews.length >= 20) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.textContent = '加载更多评论';
      loadMoreBtn.style.cssText = `
        width: 100%;
        background: #e1f5fe;
        border: none;
        padding: 10px;
        margin-top: 10px;
        cursor: pointer;
        color: #0277bd;
        font-weight: bold;
        border-radius: 4px;
      `;
      
      loadMoreBtn.onclick = async () => {
        loadMoreBtn.textContent = '加载中...';
        loadMoreBtn.disabled = true;
        
        try {
          const response = await reviewBreakerService.getReviews(videoId, 2, 20);
          if (response.success && response.data) {
            const moreFiltered = response.data.filter(review => 
              !reviewBreakerService.shouldFilterReview(review, filterKeywords)
            );
            
            moreFiltered.forEach(review => {
              const reviewElement = this.createReviewElement(review);
              container.insertBefore(reviewElement, loadMoreBtn);
            });
            
            if (response.data.length < 20) {
              loadMoreBtn.remove();
            } else {
              loadMoreBtn.textContent = '加载更多评论';
              loadMoreBtn.disabled = false;
            }
          } else {
            loadMoreBtn.textContent = '加载失败，点击重试';
            loadMoreBtn.disabled = false;
          }
        } catch (error) {
          loadMoreBtn.textContent = '加载失败，点击重试';
          loadMoreBtn.disabled = false;
        }
      };
      
      container.appendChild(loadMoreBtn);
    }
  }

  /**
   * 创建单个评论元素
   */
  private createReviewElement(review: ReviewData): HTMLElement {
    const element = document.createElement('div');
    element.className = 'review-item';
    element.style.cssText = `
      margin-bottom: 15px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 6px;
      border-left: 4px solid #4CAF50;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
    `;

    const author = document.createElement('span');
    author.textContent = review.author;
    author.style.fontWeight = 'bold';

    const date = document.createElement('span');
    date.textContent = new Date(review.date).toLocaleDateString();

    header.appendChild(author);
    header.appendChild(date);

    const content = document.createElement('div');
    content.className = 'review-content';
    content.textContent = review.content;
    content.style.cssText = `
      line-height: 1.5;
      color: #333;
      margin-bottom: 8px;
    `;

    // 右键菜单功能
    content.addEventListener('contextmenu', (e) => {
      const selection = window.getSelection()?.toString();
      if (selection) {
        e.preventDefault();
        if (confirm(`是否将 '${selection}' 加入评论区过滤关键词?`)) {
          reviewBreakerService.addFilterKeyword(selection);
          showToast('关键词已添加，刷新页面后生效', 'success');
        }
      }
    });

    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 12px;
      color: #888;
    `;

    if (review.rating) {
      const rating = document.createElement('span');
      rating.textContent = `评分: ${review.rating}/10`;
      footer.appendChild(rating);
    }

    if (review.likes) {
      const likes = document.createElement('span');
      likes.textContent = `👍 ${review.likes}`;
      footer.appendChild(likes);
    }

    element.appendChild(header);
    element.appendChild(content);
    element.appendChild(footer);

    return element;
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
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
      border-left: 4px solid #ff9800;
    `;

    const title = document.createElement('h3');
    title.textContent = 'FC2 增强信息';
    title.style.cssText = `
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
      border-bottom: 2px solid #ff9800;
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
    if (fc2Info.publishDate) {
      const dateInfo = this.createInfoItem('发布日期', fc2Info.publishDate);
      infoGrid.appendChild(dateInfo);
    }

    if (fc2Info.seller) {
      const sellerInfo = this.createInfoItem('販売者', fc2Info.seller, fc2Info.sellerUrl);
      infoGrid.appendChild(sellerInfo);
    }

    // 演员信息
    if (fc2Info.actors && fc2Info.actors.length > 0) {
      const actorsDiv = document.createElement('div');
      actorsDiv.style.cssText = `margin-bottom: 15px;`;
      
      const actorsTitle = document.createElement('h4');
      actorsTitle.textContent = '主演演员';
      actorsTitle.style.cssText = `margin: 0 0 10px 0; color: #333;`;
      
      const actorsList = document.createElement('div');
      actorsList.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      `;
      
      fc2Info.actors.forEach(actor => {
        const actorTag = document.createElement('span');
        actorTag.style.cssText = `
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 14px;
        `;
        
        if (actor.profileUrl) {
          const link = document.createElement('a');
          link.href = actor.profileUrl;
          link.target = '_blank';
          link.textContent = actor.name;
          link.style.cssText = `color: inherit; text-decoration: none;`;
          actorTag.appendChild(link);
        } else {
          actorTag.textContent = actor.name;
        }
        
        actorsList.appendChild(actorTag);
      });
      
      actorsDiv.appendChild(actorsTitle);
      actorsDiv.appendChild(actorsList);
      container.appendChild(actorsDiv);
    }

    // 预览按钮
    if (fc2Info.previewUrl) {
      const previewBtn = document.createElement('button');
      previewBtn.textContent = '在123av中预览';
      previewBtn.style.cssText = `
        background: #ff9800;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 10px;
      `;
      
      previewBtn.onclick = () => {
        const modal = fc2BreakerService.createFC2PreviewModal(fc2Info);
        document.body.appendChild(modal);
      };
      
      container.appendChild(previewBtn);
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
      background: #f9f9f9;
      border-radius: 4px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
      font-weight: bold;
    `;

    const valueEl = document.createElement('div');
    valueEl.style.cssText = `
      font-size: 14px;
      color: #333;
    `;

    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.textContent = value;
      link.style.cssText = `color: #007bff; text-decoration: none;`;
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

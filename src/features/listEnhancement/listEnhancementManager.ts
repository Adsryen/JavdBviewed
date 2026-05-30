// src/features/listEnhancement/listEnhancementManager.ts

import { log } from '../../content/state';
import { showToast } from '../../content/toast';
import { actorManager } from '../actors';
import { newWorksManager } from '../newWorks';
import { processVisibleItems } from '../../content/itemProcessor';
import {
  appendSuperRankingTop250Page,
  getSuperRankingTop250PageInfo,
} from '../rankings';
import {
  activatePreviewVideoPreload,
  releasePreviewVideoMedia,
  createPreviewCacheEntry,
  getPreviewSourceType,
  isHlsPreviewUrl,
  isKnownBadVbgflPreviewUrl,
  isVbgflMusumeCode,
  isVbgflPacoCode,
  isVbgflPondoCode,
  normalizePreviewUrl,
  parsePreviewCacheEntry,
  serializePreviewCacheEntry,
} from '../previews';
import {
  createDefaultListEnhancementConfig,
  type ListDisplayControlConfig,
  type ListEnhancementConfig,
  type VideoPreviewOptions,
  type VideoPreviewSource,
} from './domain/config';
import {
  matchActorsFromTitle,
} from './application/actorMatching';
import {
  decideActorHiding,
  type ActorHidingReason,
} from './application/actorHiding';
import {
  buildPopularityEffectAttributes,
  parseRatingStatsText,
} from './application/popularityEffects';
import {
  buildListDisplayControlStyles,
  buildPopularityStyles,
  LIST_ENHANCEMENT_BASE_STYLES,
} from './ui/styles';

export type { ListEnhancementConfig } from './domain/config';

class ListEnhancementManager {
  private config: ListEnhancementConfig = createDefaultListEnhancementConfig();
  
  // 保存上一次的列表显示控制配置，用于检测变化
  private lastDisplayControl: ListDisplayControlConfig | null = null;

  private previewTimer: number | null = null;
  private currentPlayingVideo: HTMLVideoElement | null = null; // 追踪当前播放的视频
  private isScrolling = false;
  private scrollTimer: number | null = null;
  private isLoadingNextPage = false;
  private currentPage = 1;
  private maxPage: number | null = null;
  private scrollPagingThreshold = 200; // 距离底部多少像素时开始加载
  private scrollPagingHandler: ((event: Event) => void) | null = null;
  // 演员索引与订阅缓存
  private actorIndex: Map<string, import('../../types').ActorRecord> | null = null;
  private subscribedActorIds: Set<string> | null = null;
  private loadingActorIndex = false;
  private loadingSubscriptions = false;
  // 缓存时间戳（用于TTL机制）
  private actorIndexTimestamp: number = 0;
  private subscribedActorIdsTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存有效期
  // 演员水印样式注入标记
  private watermarkStylesInjected = false;
  private popularityStylesInjected = false;

  updateConfig(newConfig: Partial<ListEnhancementConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    log('List enhancement config updated:', this.config);
    
    // 如果滚动翻页配置发生变化，重新初始化
    if (oldConfig.enableScrollPaging !== this.config.enableScrollPaging) {
      if (this.config.enableScrollPaging && this.config.enabled) {
        this.initScrollPaging();
        log('Scroll paging enabled and initialized');
      } else {
        this.cleanupScrollPaging();
        log('Scroll paging disabled and cleaned up');
      }
    }

    // 若演员过滤配置变化，重应用一次（不清除缓存，避免所有影片被误判）
    const actorFlagsChanged = (
      oldConfig.hideBlacklistedActorsInList !== this.config.hideBlacklistedActorsInList ||
      oldConfig.hideNonFavoritedActorsInList !== this.config.hideNonFavoritedActorsInList ||
      oldConfig.hideUnrecognizedActorsInList !== this.config.hideUnrecognizedActorsInList ||
      oldConfig.treatSubscribedAsFavorited !== this.config.treatSubscribedAsFavorited
    );
    if (actorFlagsChanged) {
      log('Actor filter config changed, reapplying filters...');
      this.reapplyActorHidingForAll();
    }

    // 🆕 如果列表显示控制配置发生变化，重新应用样式
    const currentControl = this.config.listDisplayControl;
    const lastControl = this.lastDisplayControl;
    
    log('Checking display control changes...', {
      lastEnabled: lastControl?.enabled,
      currentEnabled: currentControl?.enabled,
      lastColumnCount: lastControl?.columnCount,
      currentColumnCount: currentControl?.columnCount,
      lastContainerWidth: lastControl?.containerWidth,
      currentContainerWidth: currentControl?.containerWidth,
      lastEnableContainerExpansion: lastControl?.enableContainerExpansion,
      currentEnableContainerExpansion: currentControl?.enableContainerExpansion
    });
    
    const displayControlChanged = !lastControl || (
      lastControl.enabled !== currentControl?.enabled ||
      lastControl.columnCount !== currentControl?.columnCount ||
      lastControl.containerWidth !== currentControl?.containerWidth ||
      lastControl.enableContainerExpansion !== currentControl?.enableContainerExpansion
    );
    
    log('Display control changed:', displayControlChanged);
    
    if (displayControlChanged) {
      log('Applying list display styles due to config change...');
      this.applyListDisplayStyles();
      // 保存当前配置作为下次比较的基准
      if (currentControl) {
        this.lastDisplayControl = {
          enabled: currentControl.enabled,
          columnCount: currentControl.columnCount,
          containerWidth: currentControl.containerWidth,
          enableContainerExpansion: currentControl.enableContainerExpansion ?? false
        };
      }
    }

    const popularityChanged = JSON.stringify(oldConfig.popularityEffects || null) !== JSON.stringify(this.config.popularityEffects || null);
    if (popularityChanged) {
      this.ensurePopularityStyles();
      this.reapplyPopularityEffects();
    }
  }

  private ensurePopularityStyles(): void {
    const currentConfig = this.config.popularityEffects;
    const existingStyle = document.getElementById('x-popularity-effects-style');

    if (!currentConfig?.enabled) {
      existingStyle?.remove();
      this.popularityStylesInjected = false;
      return;
    }

    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'x-popularity-effects-style';
    style.textContent = buildPopularityStyles();
    document.head.appendChild(style);
    this.popularityStylesInjected = true;
  }

  private reapplyPopularityEffects(): void {
    const items = document.querySelectorAll('.movie-list .item');
    items.forEach(item => this.applyPopularityEffect(item as HTMLElement));
  }

  private extractRatingStats(item: HTMLElement): { score: number | null; count: number | null } {
    const scoreText = item.querySelector('.score .value')?.textContent || item.querySelector('.score')?.textContent || '';
    return parseRatingStatsText(scoreText);
  }

  private applyPopularityEffect(item: HTMLElement): void {
    const config = this.config.popularityEffects;
    item.removeAttribute('data-popularity-effect');
    item.removeAttribute('data-popularity-level');
    item.removeAttribute('data-popularity-count');
    item.removeAttribute('data-popularity-score');

    if (!config?.enabled) {
      return;
    }

    const attrs = buildPopularityEffectAttributes(this.extractRatingStats(item), config);
    if (!attrs) {
      return;
    }

    item.setAttribute('data-popularity-count', attrs.count);
    item.setAttribute('data-popularity-score', attrs.score);
    if (attrs.effect) item.setAttribute('data-popularity-effect', attrs.effect);
    if (attrs.level) item.setAttribute('data-popularity-level', attrs.level);
  }

  // 🆕 应用列表显示样式 - 分两步实现
  private applyListDisplayStyles(): void {
    const control = this.config.listDisplayControl;
    
    // 🆕 域名限制：只在 javdb.com 和 javdb570.com 上应用列表显示控制
    const hostname = window.location.hostname;
    const allowedDomains = ['javdb.com', 'javdb570.com'];
    const isDomainAllowed = allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (!isDomainAllowed) {
      log('[LIST DISPLAY] Domain not allowed for list display control:', hostname);
      // 移除自定义样式
      const existingStyle = document.getElementById('x-list-display-control');
      if (existingStyle) {
        existingStyle.remove();
      }
      // 恢复原始cols类
      const containers = document.querySelectorAll('.movie-list.h') as NodeListOf<HTMLElement>;
      containers.forEach(container => {
        container.removeAttribute('data-x-cols-override');
      });
      return;
    }
    
    log('[LIST DISPLAY] Applying list display styles...', {
      control,
      enabled: control?.enabled,
      columnCount: control?.columnCount,
      containerWidth: control?.containerWidth,
      hostname
    });
    
    // 找到所有容器（可能有多个，比如翻页后）
    const containers = document.querySelectorAll('.movie-list.h') as NodeListOf<HTMLElement>;
    
    if (!control || !control.enabled) {
      // 移除自定义样式
      const existingStyle = document.getElementById('x-list-display-control');
      if (existingStyle) {
        existingStyle.remove();
        log('[LIST DISPLAY] Removed custom styles (disabled)');
      }
      // 恢复原始cols类
      containers.forEach(container => {
        container.removeAttribute('data-x-cols-override');
      });
      return;
    }

    const { columnCount, containerWidth, enableContainerExpansion } = control;
    
    // 移除旧样式
    const existingStyle = document.getElementById('x-list-display-control');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 处理所有容器
    containers.forEach(container => {
      // 移除所有cols-*类
      for (let i = 1; i <= 8; i++) {
        container.classList.remove(`cols-${i}`);
      }
      // 标记为已被我们接管
      container.setAttribute('data-x-cols-override', 'true');
    });
    
    if (containers.length > 0) {
      log('[LIST DISPLAY] Processed containers:', containers.length);
    }

    const { styleContent, itemWidthCalc, marginValue } = buildListDisplayControlStyles({
      columnCount,
      containerWidth,
      enableContainerExpansion,
      isVideoDetailPage: window.location.pathname.startsWith('/v/'),
    });

    const style = document.createElement('style');
    style.id = 'x-list-display-control';
    style.textContent = styleContent;
    document.head.appendChild(style);
    
    log('[LIST DISPLAY] ✓ List display styles applied successfully', {
      columnCount,
      containerWidth,
      enableContainerExpansion,
      itemWidthCalc,
      margin: marginValue,
      containersProcessed: containers.length
    });
  }
  // ====== 演员水印相关 ======
  private ensureWatermarkStyles(): void {
    if (this.watermarkStylesInjected) return;
    try {
      const style = document.createElement('style');
      style.id = 'x-actor-watermark-styles';
      style.textContent = `
        .x-actor-wm { position: absolute; display: inline-flex; flex-wrap: wrap; gap: 6px; padding: 8px; z-index: 4; pointer-events: auto; }
        .x-actor-wm.pos-top-left { top: 6px; left: 6px; }
        .x-actor-wm.pos-top-right { top: 6px; right: 6px; }
        .x-actor-wm.pos-bottom-left { bottom: 6px; left: 6px; }
        .x-actor-wm.pos-bottom-right { bottom: 6px; right: 6px; }
        .x-actor-wm .x-actor-badge { height: 16px; line-height: 16px; padding: 0 6px; border-radius: 9999px; color: #fff; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; box-shadow: 0 0 0 2px rgba(255,255,255,0.85), 0 1px 2px rgba(0,0,0,0.25); }
        .x-actor-wm .badge-red { background: #ef4444; }
        .x-actor-wm .badge-green { background: #22c55e; }
        .x-actor-wm .badge-amber { background: #f59e0b; }
        .x-actor-wm .x-actor-more { background: rgba(31,41,55,0.9); }
      `;
      document.head.appendChild(style);
      this.watermarkStylesInjected = true;
      log('Actor watermark styles injected');
    } catch (e) {
      log('Failed to inject actor watermark styles:', e);
    }
  }
  private async ensureActorIndex(): Promise<void> {
    // 检查缓存是否过期
    const now = Date.now();
    const isCacheExpired = this.actorIndexTimestamp > 0 && (now - this.actorIndexTimestamp) > this.CACHE_TTL;
    
    if (isCacheExpired) {
      log('Actor index cache expired, clearing...');
      this.actorIndex = null;
      this.actorIndexTimestamp = 0;
    }
    
    // 如果正在加载，等待加载完成
    if (this.loadingActorIndex) {
      // 等待加载完成（最多等待5秒）
      const startTime = Date.now();
      while (this.loadingActorIndex && (Date.now() - startTime) < 5000) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }
    
    if (this.actorIndex) return;
    
    this.loadingActorIndex = true;
    try {
      const actors = await actorManager.getAllActors();
      const idx = new Map<string, import('../../types').ActorRecord>();
      actors.forEach(a => {
        const pushKey = (s?: string) => {
          const k = (s || '').trim().toLowerCase();
          if (!k) return;
          if (!idx.has(k)) idx.set(k, a);
        };
        pushKey(a.name);
        (a.aliases || []).forEach(al => pushKey(al));
      });
      this.actorIndex = idx;
      this.actorIndexTimestamp = Date.now(); // 记录缓存时间
      log(`Actor index loaded: ${idx.size} entries`);
    } catch (e) {
      log('Failed to build actor index:', e);
      this.actorIndex = new Map();
      this.actorIndexTimestamp = Date.now();
    } finally {
      this.loadingActorIndex = false;
    }
  }

  private async ensureSubscriptions(): Promise<void> {
    // 检查缓存是否过期
    const now = Date.now();
    const isCacheExpired = this.subscribedActorIdsTimestamp > 0 && (now - this.subscribedActorIdsTimestamp) > this.CACHE_TTL;
    
    if (isCacheExpired) {
      log('Subscriptions cache expired, clearing...');
      this.subscribedActorIds = null;
      this.subscribedActorIdsTimestamp = 0;
    }
    
    // 如果正在加载，等待加载完成
    if (this.loadingSubscriptions) {
      // 等待加载完成（最多等待5秒）
      const startTime = Date.now();
      while (this.loadingSubscriptions && (Date.now() - startTime) < 5000) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }
    
    if (this.subscribedActorIds) return;
    
    this.loadingSubscriptions = true;
    try {
      const subs = await newWorksManager.getSubscriptions();
      this.subscribedActorIds = new Set(subs.map(s => s.actorId));
      this.subscribedActorIdsTimestamp = Date.now(); // 记录缓存时间
      log(`Subscriptions loaded: ${this.subscribedActorIds.size} actors`);
    } catch (e) {
      log('Failed to load subscriptions:', e);
      this.subscribedActorIds = new Set();
      this.subscribedActorIdsTimestamp = Date.now();
    } finally {
      this.loadingSubscriptions = false;
    }
  }

  /**
   * 清除演员相关缓存
   * 在以下情况调用：
   * 1. 翻页前
   * 2. 配置变化时
   * 3. 手动刷新时
   */
  private clearActorCaches(): void {
    log('Clearing actor caches...');
    this.actorIndex = null;
    this.subscribedActorIds = null;
    this.loadingActorIndex = false;
    this.loadingSubscriptions = false;
    this.actorIndexTimestamp = 0;
    this.subscribedActorIdsTimestamp = 0;
  }

  private extractActorsFromTitle(title: string): import('../../types').ActorRecord[] {
    if (!this.actorIndex) {
      return [];
    }
    return matchActorsFromTitle(title, this.actorIndex);
  }

  // 先从DOM提取演员（列表/主页优先可用），再回退标题解析
  private async extractActorsFromDOM(item: HTMLElement): Promise<import('../../types').ActorRecord[]> {
    const anchors = Array.from(item.querySelectorAll('a[href*="/actors/"]')) as HTMLAnchorElement[];
    const ids = new Set<string>();
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/actors\/([^\/?#]+)/);
      if (m && m[1]) ids.add(m[1]);
    }
    if (ids.size === 0) {
      return [];
    }
    try {
      const list = await Promise.all(Array.from(ids).slice(0, 8).map(id => actorManager.getActorById(id).catch(() => null)));
      const actors = list.filter(Boolean) as import('../../types').ActorRecord[];
      return actors;
    } catch {
      return [];
    }
  }

  // 从DOM提取所有演员ID（不查询数据库，仅提取ID）
  private extractActorIdsFromDOM(item: HTMLElement): Set<string> {
    const anchors = Array.from(item.querySelectorAll('a[href*="/actors/"]')) as HTMLAnchorElement[];
    const ids = new Set<string>();
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/actors\/([^\/?#]+)/);
      if (m && m[1]) ids.add(m[1]);
    }
    return ids;
  }

  private async applyActorWatermark(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): Promise<void> {
    try {
      // 确保样式已注入
      this.ensureWatermarkStyles();
      await Promise.all([this.ensureActorIndex(), this.ensureSubscriptions()]);
      const coverElement = item.querySelector('.cover') as HTMLElement | null;
      if (!coverElement) return;

      // 清理旧水印
      const existing = coverElement.querySelector('.x-actor-wm');
      if (existing) existing.remove();

      // 1) 优先DOM抓取（列表/首页可靠）
      let actors = await this.extractActorsFromDOM(item);
      if (actors.length === 0) {
        // 2) 回退：标题解析（快速路径A -> 加权D）
        actors = this.extractActorsFromTitle(videoInfo.title);
      }
      // 演员页兜底：若标题未能匹配到演员，则使用当前演员ID
      if ((actors.length === 0) && /^\/actors\//.test(window.location.pathname)) {
        const m = window.location.pathname.match(/\/actors\/(\w+)/);
        if (m && m[1]) {
          try {
            const rec = await actorManager.getActorById(m[1]);
            if (rec) {
              actors = [rec];
            }
          } catch {}
        }
      }
      actors = actors.slice(0, 6);
      if (actors.length === 0) return;

      const matched = actors.map(a => {
        const isBlack = !!a.blacklisted;
        const isSub = !!this.subscribedActorIds?.has(a.id);
        // 显示策略：红=黑名单、绿=订阅、琥珀=收藏（本地存在记录）
        const type = isBlack ? 'black' : (isSub ? 'sub' : 'fav');
        return { actor: a, isBlack, isSub, type };
      });

      if (matched.length === 0) return;

      // 确保容器定位
      const cs = window.getComputedStyle(coverElement);
      if (cs.position === 'static') {
        coverElement.style.position = 'relative';
      }

      const wm = document.createElement('div');
      wm.className = 'x-actor-wm';
      wm.style.opacity = String(Math.max(0, Math.min(1, this.config.actorWatermarkOpacity ?? 0.8)));

      const pos = this.config.actorWatermarkPosition || 'top-right';
      wm.classList.add(`pos-${pos}`);

      // 生成文本胶囊，最多展示 countLimit，其余折叠为 +N
      const countLimit = 4;
      const toShow = matched.slice(0, countLimit);
      const rest = matched.length - toShow.length;
      toShow.forEach(m => {
        const badge = document.createElement('span');
        const cls = m.isBlack ? 'badge-red' : (m.isSub ? 'badge-green' : 'badge-amber');
        badge.className = `x-actor-badge ${cls}`;
        badge.textContent = m.isBlack ? '黑' : (m.isSub ? '订' : '藏');
        badge.title = `${m.actor.name} ${m.isBlack ? '【黑名单】' : (m.isSub ? '【订阅】' : '【收藏】')}`;
        wm.appendChild(badge);
      });
      if (rest > 0) {
        const more = document.createElement('span');
        more.className = 'x-actor-badge x-actor-more';
        more.textContent = `+${rest}`;
        more.title = matched.slice(countLimit).map(x => `${x.actor.name}`).join('、');
        wm.appendChild(more);
      }

      coverElement.appendChild(wm);
    } catch (e) {
      log('applyActorWatermark failed:', e);
    }
  }

  initialize(): void {
    if (!this.config.enabled) {
      return;
    }

    log('Initializing list enhancement features...');

    // 初始化滚动监听（防止滚动时触发预览）
    this.initScrollListener();

    // 🆕 应用列表显示控制样式
    this.applyListDisplayStyles();
    
    // 保存初始配置
    if (this.config.listDisplayControl) {
      this.lastDisplayControl = {
        enabled: this.config.listDisplayControl.enabled,
        columnCount: this.config.listDisplayControl.columnCount,
        containerWidth: this.config.listDisplayControl.containerWidth,
        enableContainerExpansion: this.config.listDisplayControl.enableContainerExpansion ?? false
      };
    }

    // 处理现有的影片项目
    this.processExistingItems();

    // 监听新添加的项目
    this.observeNewItems();

    // 初始化滚动翻页功能
    if (this.config.enableScrollPaging) {
      this.initScrollPaging();
    }

    // 若启用演员水印，初始化一次样式
    if (this.config.enableActorWatermark) {
      this.ensureWatermarkStyles();
    }

    this.ensurePopularityStyles();
    this.reapplyPopularityEffects();

    log('List enhancement initialized successfully');
  }

  private initScrollListener(): void {
    window.addEventListener('scroll', () => {
      this.isScrolling = true;
      if (this.scrollTimer) clearTimeout(this.scrollTimer);
      
      // 滚动时禁用鼠标事件
      const container = document.querySelector('.movie-list');
      if (container) {
        (container as HTMLElement).style.pointerEvents = 'none';
      }

      this.scrollTimer = window.setTimeout(() => {
        this.isScrolling = false;
        if (container) {
          (container as HTMLElement).style.pointerEvents = '';
        }
      }, 100);
    });
  }

  private processExistingItems(): void {
    const items = document.querySelectorAll('.movie-list .item');
    items.forEach(item => this.enhanceItem(item as HTMLElement));
  }

  private observeNewItems(): void {
    const targetNode = document.querySelector('.movie-list');
    if (!targetNode) return;

    const observer = new MutationObserver(mutations => {
      let hasNewItems = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches('.item')) {
              this.enhanceItem(element as HTMLElement);
              hasNewItems = true;
            } else {
              const items = element.querySelectorAll('.item');
              if (items.length > 0) {
                items.forEach(item => this.enhanceItem(item as HTMLElement));
                hasNewItems = true;
              }
            }
          }
        });
      });
      
      // 如果有新item添加，重新处理容器属性
      if (hasNewItems) {
        this.processContainerAttributes();
      }
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }

  // 🆕 处理容器的data属性（用于列表显示控制）
  private processContainerAttributes(): void {
    const control = this.config.listDisplayControl;
    if (!control || !control.enabled) return;

    const containers = document.querySelectorAll('.movie-list.h') as NodeListOf<HTMLElement>;
    containers.forEach(container => {
      // 移除所有cols-*类
      for (let i = 1; i <= 8; i++) {
        container.classList.remove(`cols-${i}`);
      }
      // 标记为已被我们接管
      if (!container.hasAttribute('data-x-cols-override')) {
        container.setAttribute('data-x-cols-override', 'true');
        log('[LIST DISPLAY] Added data-x-cols-override to new container');
      }
    });
  }

  private enhanceItem(item: HTMLElement): void {
    // 避免重复处理
    if (item.hasAttribute('data-list-enhanced')) {
      return;
    }
    item.setAttribute('data-list-enhanced', 'true');

    // 获取影片信息
    const videoInfo = this.extractVideoInfo(item);
    if (!videoInfo) return;

    // 高质量封面（已弃用 - JavDB 现已默认使用高质量封面）
    // if (this.config.enableHighQualityCover) {
    //   this.enhanceItemCover(item);
    // }

    // 应用各种增强功能
    if (this.config.enableClickEnhancement && this.config.enableClickEnhancementList !== false) {
      this.enhanceClicks(item, videoInfo);
    }

    if (this.config.enableVideoPreview && this.config.enableVideoPreviewList !== false) {
      this.enhanceVideoPreview(item, videoInfo);
    }

    if (this.config.enableListOptimization) {
      this.optimizeListItem(item, videoInfo);
    }

    // 演员水印
    if (this.config.enableActorWatermark) {
      this.applyActorWatermark(item, videoInfo).catch(err => log('Actor watermark error:', err));
    }

    this.applyPopularityEffect(item);

    // 基于演员偏好的隐藏（黑名单/未收藏）
    this.applyActorBasedHiding(item, videoInfo).catch(err => log('Actor-based hiding error:', err));
  }

  // ====== 基于演员的隐藏逻辑 ======
  private async applyActorBasedHiding(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): Promise<void> {
      try {
        const hideByBlacklist = !!this.config.hideBlacklistedActorsInList;
        const hideByNonFavorited = !!this.config.hideNonFavoritedActorsInList;
        const hideUnrecognized = this.config.hideUnrecognizedActorsInList !== false; // 默认true
        
        log(`[ActorHiding] ${videoInfo.code}: hideByBlacklist=${hideByBlacklist}, hideByNonFavorited=${hideByNonFavorited}, hideUnrecognized=${hideUnrecognized}`);
        
        if (!hideByBlacklist && !hideByNonFavorited) {
          // 若之前由"演员原因"隐藏，现在需要清除（不影响其他默认隐藏原因）
          this.clearActorOnlyHiding(item);
          return;
        }

        await Promise.all([this.ensureActorIndex(), this.ensureSubscriptions()]);
        
        // 1. 先从DOM提取所有演员ID（不管是否在本地数据库）
        const allActorIds = this.extractActorIdsFromDOM(item);
        log(`[ActorHiding] ${videoInfo.code}: Found ${allActorIds.size} actor IDs in DOM: ${Array.from(allActorIds).join(', ')}`);
        
        // 2. 查询这些演员在本地数据库中的记录
        const actorRecords: import('../../types').ActorRecord[] = [];
        if (allActorIds.size > 0) {
          try {
            const list = await Promise.all(
              Array.from(allActorIds).slice(0, 8).map(id => actorManager.getActorById(id).catch(() => null))
            );
            actorRecords.push(...(list.filter(Boolean) as import('../../types').ActorRecord[]));
            log(`[ActorHiding] ${videoInfo.code}: Found ${actorRecords.length} actors in local DB: ${actorRecords.map(a => `${a.name}(${a.id})`).join(', ')}`);
          } catch (e) {
            log(`[ActorHiding] ${videoInfo.code}: Failed to fetch actor records:`, e);
          }
        }
        
        // 3. 如果DOM中没有演员链接，尝试从标题解析
        let actors = actorRecords;
        if (actors.length === 0 && allActorIds.size === 0) {
          actors = this.extractActorsFromTitle(videoInfo.title);
          log(`[ActorHiding] ${videoInfo.code}: Extracted ${actors.length} actors from title`);
        }

        const subscribed = this.subscribedActorIds || new Set<string>();
        const decision = decideActorHiding({
          hideByBlacklist,
          hideByNonFavorited,
          hideUnrecognized,
          treatSubscribedAsFavorited: this.config.treatSubscribedAsFavorited !== false,
          domActorIds: allActorIds,
          actors,
          subscribedActorIds: subscribed,
        });

        log(`[ActorHiding] ${videoInfo.code}: Final decision - matchedBlack=${decision.matchedBlack}, matchedNonFav=${decision.matchedNonFavorited}, reason=${decision.reason || 'none'}`);

        if (decision.reason) {
          this.hideItemByActor(item, decision.reason);
          log(`[ActorHiding] ${videoInfo.code}: Hidden by ${decision.reason}`);
        } else {
          this.clearActorOnlyHiding(item);
          log(`[ActorHiding] ${videoInfo.code}: Not hidden, clearing actor-only hiding`);
        }
      } catch (e) {
        log('applyActorBasedHiding failed:', e);
      }
    }


  private hideItemByActor(item: HTMLElement, reason: ActorHidingReason): void {
    // 不覆盖其他原因，仅追加我们的标记
    item.style.display = 'none';
    item.setAttribute('data-hidden-by-default', 'true');
    item.setAttribute('data-hidden-by-actor', 'true');
    item.setAttribute('data-hide-reason-actor', reason);
  }

  private clearActorOnlyHiding(item: HTMLElement): void {
    const hadActorHidden = item.hasAttribute('data-hidden-by-actor');
    if (!hadActorHidden) return;
    // 移除我们设置的“演员原因”标记
    item.removeAttribute('data-hidden-by-actor');
    item.removeAttribute('data-hide-reason-actor');
    // 若不存在其他默认隐藏原因（如 VR/状态），则恢复显示并移除默认隐藏标记
    const hasOtherReason = item.hasAttribute('data-hide-reason');
    if (!hasOtherReason) {
      item.style.display = '';
      item.removeAttribute('data-hidden-by-default');
    }
  }

  // 对外暴露：重应用当前页面所有条目的演员隐藏规则
  public reapplyActorHidingForAll(): void {
    try {
      const items = document.querySelectorAll('.movie-list .item');
      items.forEach(async (el) => {
        const item = el as HTMLElement;
        const info = this.extractVideoInfo(item);
        if (!info) return;
        await this.applyActorBasedHiding(item, info);
      });
    } catch (e) {
      log('reapplyActorHidingForAll failed:', e);
    }
  }

  private extractVideoInfo(item: HTMLElement): { code: string; title: string; url: string } | null {
    const titleElement = item.querySelector('div.video-title > strong');
    const linkElement = item.querySelector('a[href*="/v/"]');
    
    if (!titleElement || !linkElement) return null;

    const code = titleElement.textContent?.trim() || '';
    const title = item.querySelector('div.video-title')?.textContent?.replace(code, '').trim() || '';
    const url = (linkElement as HTMLAnchorElement).href;

    return { code, title, url };
  }

  private enhanceClicks(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    const linkElement = item.querySelector('a[href*="/v/"]') as HTMLAnchorElement;
    if (!linkElement) return;

    // 左键点击增强
    linkElement.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 检查是否为FC2视频
      if (videoInfo.code.toUpperCase().includes('FC2')) {
        log(`[ListEnhancement] FC2 video detected: ${videoInfo.code}, opening FC2 dialog instead of navigating`);
        
        // 提取movieId
        const movieIdMatch = videoInfo.url.match(/\/v\/([^/?#]+)/);
        if (movieIdMatch && movieIdMatch[1]) {
          const movieId = movieIdMatch[1];
          
          // 动态导入FC2破解服务
          try {
            const { fc2BreakerService } = await import('../fc2Breaker');
            await fc2BreakerService.showFC2Dialog(movieId, videoInfo.code, videoInfo.url);
          } catch (error) {
            log('[ListEnhancement] Failed to open FC2 dialog:', error);
            showToast('FC2视频加载失败', 'error');
          }
        } else {
          log('[ListEnhancement] Failed to extract movieId from URL:', videoInfo.url);
          showToast('无法解析FC2视频ID', 'error');
        }
        return;
      }
      
      // 非FC2视频，直接跳转
      window.location.href = videoInfo.url;
    });

    // 右键后台打开
    if (this.config.enableRightClickBackground) {
      let rightClickHandled = false;
      const openInBackground = () => {
        const startedAt = performance.now();
        showToast('已在后台打开', 'success');

        void chrome.runtime.sendMessage({
          type: 'OPEN_TAB_BACKGROUND',
          url: videoInfo.url
        }).then(() => {
          log(`[ListEnhancement] Background tab opened in ${Math.round(performance.now() - startedAt)}ms`);
        }).catch(err => {
          log('Failed to open background tab:', err);
          window.open(videoInfo.url, '_blank');
        });
      };

      linkElement.addEventListener('mousedown', (e) => {
        if (e.button !== 2) return;
        e.preventDefault();
        e.stopPropagation();
        if (rightClickHandled) return;
        rightClickHandled = true;
        openInBackground();
        window.setTimeout(() => {
          rightClickHandled = false;
        }, 800);
      });

      linkElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (rightClickHandled) return;
        rightClickHandled = true;
        openInBackground();
        window.setTimeout(() => {
          rightClickHandled = false;
        }, 800);
      });
    }
  }

  private enhanceVideoPreview(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    const coverElement = item.querySelector('.cover') as HTMLElement;
    if (!coverElement) return;

    // 添加预览样式类
    coverElement.classList.add('x-cover', 'x-preview');

    // 鼠标悬浮事件
    coverElement.addEventListener('mouseenter', () => {
      if (this.isScrolling) return;
      
      this.showPreview(coverElement, videoInfo);
    });

    coverElement.addEventListener('mouseleave', (e) => {
      // 检查是否真的离开了元素
      const relatedTarget = e.relatedTarget as Node;
      if (relatedTarget && coverElement.contains(relatedTarget)) {
        return;
      }

      this.hidePreview(coverElement);
    });
  }

  private showPreview(coverElement: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    coverElement.classList.add('x-holding');
    
    // 预览延迟：0 表示禁用悬停预览
    const delay = Number(this.config.previewDelay || 0);
    if (delay <= 0) {
      coverElement.classList.remove('x-holding');
      return;
    }

    // 暂停之前正在播放的视频
    if (this.currentPlayingVideo && this.currentPlayingVideo.parentElement) {
      this.currentPlayingVideo.pause();
      this.currentPlayingVideo.style.opacity = '0';
    }

    // 如果已有视频，直接显示
    const existingVideo = coverElement.querySelector('video');
    if (existingVideo) {
      existingVideo.style.opacity = '1';
      activatePreviewVideoPreload(existingVideo);
      existingVideo.play().catch(() => {});
      this.currentPlayingVideo = existingVideo;
      return;
    }

    this.previewTimer = window.setTimeout(() => {
      this.loadVideoPreview(coverElement, videoInfo);
    }, delay < 100 ? 100 : delay); // 最小延迟100ms
  }

  private hidePreview(coverElement: HTMLElement): void {
    coverElement.classList.remove('x-holding');
    
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }

    const video = coverElement.querySelector('video');
    if (!video) return;

    // 淡出效果
    video.style.opacity = '0';
    releasePreviewVideoMedia(video);
    
    // 清除当前播放视频的引用
    if (this.currentPlayingVideo === video) {
      this.currentPlayingVideo = null;
    }
  }

  private async loadVideoPreview(coverElement: HTMLElement, videoInfo: { code: string; title: string; url: string }): Promise<void> {
    // 检查是否还在悬停状态
    if (!coverElement.classList.contains('x-holding')) {
      return;
    }

    // 检查是否已有视频
    const existingVideo = coverElement.querySelector('video');
    if (existingVideo) {
      existingVideo.style.opacity = '1';
      existingVideo.play().catch(() => {});
      this.currentPlayingVideo = existingVideo;
      return;
    }

    const cacheKey = `video_preview_${videoInfo.code}`;
    let cachedEntry = null as ReturnType<typeof parsePreviewCacheEntry> | null;
    try {
      cachedEntry = parsePreviewCacheEntry(localStorage.getItem(cacheKey));
    } catch (e) {
      log(`Failed to read from localStorage:`, e);
    }

    if (cachedEntry?.url && isKnownBadVbgflPreviewUrl(videoInfo.code, cachedEntry.url)) {
      log(`Removing stale invalid preview URL cache for ${videoInfo.code}: ${cachedEntry.url}`);
      try {
        localStorage.removeItem(cacheKey);
      } catch (e) {
        log(`Failed to remove invalid preview cache:`, e);
      }
      cachedEntry = null;
    }

    if (cachedEntry?.url) {
      log(`Using cached video URL for ${videoInfo.code}: ${cachedEntry.url}`);
      const video = this.createVideoElement([{ url: cachedEntry.url, type: cachedEntry.type, source: cachedEntry.source }], {
        cacheKey,
        code: videoInfo.code,
        onCacheError: () => this.loadVideoPreviewFromSources(coverElement, videoInfo, cacheKey),
      });
      coverElement.appendChild(video);
      activatePreviewVideoPreload(video);
      return;
    }

    await this.loadVideoPreviewFromSources(coverElement, videoInfo, cacheKey);
  }

  private async loadVideoPreviewFromSources(coverElement: HTMLElement, videoInfo: { code: string; title: string; url: string }, cacheKey: string): Promise<void> {
    try {
      const videoSources = await this.fetchVideoPreview(videoInfo);

      if (!coverElement.classList.contains('x-holding')) {
        return;
      }

      if (videoSources.length === 0) {
        log(`No preview sources found for ${videoInfo.code}`);
        return;
      }

      const video = this.createVideoElement(videoSources, { cacheKey, code: videoInfo.code });
      coverElement.appendChild(video);
      this.currentPlayingVideo = video;
      activatePreviewVideoPreload(video);

    } catch (error) {
      log(`Failed to load video preview for ${videoInfo.code}:`, error);
    }
  }

  private async fetchVideoPreview(videoInfo: { code: string; title: string; url: string }): Promise<VideoPreviewSource[]> {
    const sources: VideoPreviewSource[] = [];

    try {
      log(`Fetching video preview for code: ${videoInfo.code}`);

      // 对于特定的测试代码，使用测试视频
      if (videoInfo.code.startsWith('TEST-')) {
        const testUrl = this.getTestVideoUrl(videoInfo.code);
        if (testUrl) {
          log(`Using test video URL for ${videoInfo.code}: ${testUrl}`);
          sources.push({
            url: testUrl,
            type: 'video/mp4'
          });
          return sources;
        }
      }

      // 依据首选来源确定顺序
      const autoOrder = ['javdb', 'javspyl', 'avpreview', 'vbgfl'] as const;
      const preferred = this.config.preferredPreviewSource || 'auto';
      const order = preferred === 'auto' ? autoOrder : ([preferred, ...autoOrder.filter(x => x !== preferred)] as const);
      log(`Preview source order for ${videoInfo.code}: ${order.join(' -> ')}`);
      
      const fetchMethods = order.map((key) => {
        switch (key) {
          case 'javspyl':
            return { name: 'JavSpyl', source: 'javspyl' as const, method: () => this.fetchFromJavSpyl(videoInfo.code) };
          case 'avpreview':
            return { name: 'AVPreview', source: 'avpreview' as const, method: () => this.fetchFromAVPreview(videoInfo.code) };
          case 'vbgfl':
            return { name: 'VBGFL', source: 'vbgfl' as const, method: () => this.fetchFromVBGFL(videoInfo.code) };
          case 'javdb':
          default:
            return { name: 'JavDB', source: 'javdb' as const, method: () => this.fetchFromJavDB(videoInfo.url) };
        }
      });

      for (const { name, source, method } of fetchMethods) {
        try {
          log(`Trying ${name} for ${videoInfo.code}...`);
          const url = await method();

          if (url) {
            const normalizedUrl = normalizePreviewUrl(url);
            if (source === 'javdb' && isHlsPreviewUrl(normalizedUrl)) {
              log(`${name} returned HLS preview on list page, continuing to MP4 sources: ${normalizedUrl}`);
              continue;
            }
            log(`${name} returned URL: ${normalizedUrl}`);
            sources.push({
              url: normalizedUrl,
              type: getPreviewSourceType(normalizedUrl),
              source,
            });
          } else {
            log(`${name} returned no URL for ${videoInfo.code}`);
          }
        } catch (error) {
          log(`${name} failed for ${videoInfo.code}:`, error);
        }
      }

      if (sources.length === 0) {
        log(`No preview sources found for ${videoInfo.code}`);
      } else {
        log(`Found preview source for ${videoInfo.code}:`, sources[0].url);
      }

    } catch (error) {
      log(`Error fetching video preview for ${videoInfo.code}:`, error);
    }

    return sources;
  }

  // 获取测试视频URL（仅用于TEST-开头的代码）
  private getTestVideoUrl(code: string): string | null {
    // 使用一些公开的测试视频来验证功能
    const testVideos: { [key: string]: string } = {
      'TEST-001': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'TEST-002': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'TEST-003': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    };

    return testVideos[code] || null;
  }

  // 从VBGFL源获取视频（直接尝试已知URL模式）
  private async fetchFromVBGFL(code: string): Promise<string | null> {
    try {
      log(`VBGFL: Trying to fetch video for ${code}`);

      // 处理不同的代码格式
      const normalizedCode = code.replace(/HEYZO-/gi, "").toLowerCase();

      // 根据代码模式生成可能的URL
      const urls: string[] = [];

      // Tokyo Hot：仅限严格格式 N####（3-6 位数字），避免误判如 HUNTC-***
      const isTokyoHot = /^n\d{3,6}$/i.test(normalizedCode);
      if (isTokyoHot) {
        urls.push(`https://my.cdn.tokyo-hot.com/media/samples/${normalizedCode}.mp4`);
      }

      // Caribbeancom (格式: 123456-789)
      if (code.includes('-') && /^\d{6}-\d{3}$/.test(code)) {
        urls.push(`https://smovie.caribbeancom.com/sample/movies/${normalizedCode}/720p.mp4`);
        urls.push(`https://smovie.caribbeancom.com/sample/movies/${normalizedCode}/480p.mp4`);
      }

      // 1Pondo (格式: 123456_789 或 123456-789)
      if (isVbgflPondoCode(code)) {
        const pondo = code.replace('-', '_').toLowerCase();
        urls.push(`https://smovie.1pondo.tv/sample/movies/${pondo}/1080p.mp4`);
        urls.push(`https://smovie.1pondo.tv/sample/movies/${pondo}/720p.mp4`);
      }

      // Heyzo
      if (code.toLowerCase().includes('heyzo') || /^\d{4}$/.test(normalizedCode)) {
        const heyzoCode = normalizedCode.replace('heyzo-', '');
        urls.push(`https://sample.heyzo.com/contents/3000/${heyzoCode}/heyzo_hd_${heyzoCode}_sample.mp4`);
      }

      // 10musume
      if (isVbgflMusumeCode(code)) {
        const musume = code.replace('-', '_').toLowerCase();
        urls.push(`https://smovie.10musume.com/sample/movies/${musume}/720p.mp4`);
      }

      // Pacopacomama
      if (isVbgflPacoCode(code)) {
        const paco = code.replace('-', '_').toLowerCase();
        urls.push(`https://fms.pacopacomama.com/hls/sample/pacopacomama.com/${paco}/720p.mp4`);
      }

      log(`VBGFL: Generated ${urls.length} URLs for ${code}:`, urls);

      // 直接返回第一个匹配的URL，不进行验证（让浏览器自己处理）
      if (urls.length > 0) {
        const url = urls[0];
        log(`VBGFL: Returning first URL: ${url}`);
        return url;
      }

      log(`VBGFL: No suitable URLs found for ${code}`);
    } catch (error) {
      log(`VBGFL fetch error for ${code}:`, error);
    }
    return null;
  }

  // 从JavSpyl API获取视频
  private async fetchFromJavSpyl(code: string): Promise<string | null> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_JAVSPYL_PREVIEW',
        code: code
      });

      if (response?.success && response?.videoUrl) {
        return response.videoUrl;
      }
    } catch (error) {
      log(`JavSpyl fetch error for ${code}:`, error);
    }
    return null;
  }

  // 从AVPreview.com获取视频
  private async fetchFromAVPreview(code: string): Promise<string | null> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_AVPREVIEW_PREVIEW',
        code: code
      });

      if (response?.success && response?.videoUrl) {
        return response.videoUrl;
      }
    } catch (error) {
      log(`AVPreview fetch error for ${code}:`, error);
    }
    return null;
  }

  // 从JavDB页面本身获取预览视频
  private async fetchFromJavDB(detailUrl: string): Promise<string | null> {
    try {
      log(`JavDB: Trying to fetch preview from detail page: ${detailUrl}`);

      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_JAVDB_PREVIEW',
        url: detailUrl
      });

      if (response?.success && response?.videoUrl) {
        log(`JavDB: Got preview from API: ${response.videoUrl}`);
        return response.videoUrl;
      } else {
        log(`JavDB: No preview found via API for provided detail URL`);
      }
    } catch (error) {
      log(`JavDB fetch error:`, error);
    }
    return null;
  }

  private createVideoElement(sources: VideoPreviewSource[], options?: VideoPreviewOptions): HTMLVideoElement {
    const video = document.createElement('video');

    // 基础属性
    video.autoplay = true;
    video.muted = false; // 改为不静音，使用音量控制系统
    video.loop = true;
    video.playsInline = true;
    video.controls = true; // 启用控制条
    video.preload = 'auto';
    video.volume = 0.5; // 默认音量，会被音量控制系统覆盖
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    
    // 设置 controlsList（使用 setAttribute 避免 TypeScript 类型错误）
    video.setAttribute('controlsList', 'nodownload noremoteplayback'); // 保留全屏按钮，移除下载和投屏
    
    // 添加类名，让音量控制系统能识别
    video.className = 'fancybox-video x-preview-video';
    
    // 样式设置
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.25s ease-in;
      background-color: inherit;
    `;

    // 添加视频源
    sources.forEach(source => {
      const sourceElement = document.createElement('source');
      sourceElement.src = source.url;
      sourceElement.type = source.type;
      video.appendChild(sourceElement);
    });

    const persistPreviewCache = () => {
      if (!options || !sources[0]) return;
      try {
        const currentUrl = normalizePreviewUrl(video.currentSrc || sources[0].url);
        const cacheSource = sources.find(source => normalizePreviewUrl(source.url) === currentUrl) || sources[0];
        const entry = createPreviewCacheEntry(currentUrl, cacheSource.source || 'cache');
        localStorage.setItem(options.cacheKey, serializePreviewCacheEntry(entry));
      } catch (e) {
        log(`Failed to cache verified preview URL for ${options.code}:`, e);
      }
    };

    const retryPreview = () => {
      if (!options) return;
      try {
        localStorage.removeItem(options.cacheKey);
      } catch {}
      options.onCacheError?.();
    };

    // 事件监听器
    video.addEventListener('loadeddata', () => {
      log(`Video loaded successfully: ${sources[0]?.url}`);
      persistPreviewCache();
    });

    video.addEventListener('canplay', () => {
      log(`Video can play: ${sources[0]?.url}`);
      persistPreviewCache();
      // 检查视频是否还在DOM中
      if (video.parentElement) {
        video.style.opacity = '1';
        activatePreviewVideoPreload(video);
        video.play().catch(err => {
          log(`Video play failed: ${err.message}`);
        });
      }
    });

    video.addEventListener('error', (e) => {
      const target = e.target as HTMLVideoElement;
      log(`Video error for ${sources[0]?.url}:`, target.error?.message || 'Unknown error');
      retryPreview();
      // 如果视频加载失败，移除元素
      if (video.parentNode) {
        video.remove();
      }
    });

    // 键盘控制
    video.addEventListener('keyup', (e) => {
      if (e.code === 'KeyM') {
        video.muted = !video.muted;
      }
      if (e.code === 'Enter') {
        if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      }
    });

    return video;
  }

  private optimizeListItem(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    const titleElement = item.querySelector('div.video-title') as HTMLElement;
    if (!titleElement) return;

    // 添加功能按钮
    if (!titleElement.querySelector('.x-btn')) {
      const button = document.createElement('span');
      button.className = 'x-btn';
      button.title = '列表功能';
      button.setAttribute('data-code', videoInfo.code);
      button.setAttribute('data-title', videoInfo.title);
      
      titleElement.insertAdjacentElement('afterbegin', button);
    }

    // 优化标题样式
    if (item.querySelector('.tags')) {
      titleElement.classList.add('x-ellipsis');
    }
    titleElement.classList.add('x-title');
  }

  private initScrollPaging(): void {
    log('Initializing scroll paging...');
    
    // 清理之前的监听器
    this.cleanupScrollPaging();
    
    // 获取当前页码和最大页码
    this.updatePageInfo();
    
    // 创建并保存滚动监听器引用
    this.scrollPagingHandler = this.handleScrollPaging.bind(this);
    window.addEventListener('scroll', this.scrollPagingHandler, { passive: true });
    
    // 创建加载指示器
    this.createLoadingIndicator();
    
    log('Scroll paging initialized');
  }

  private cleanupScrollPaging(): void {
    log('Cleaning up scroll paging...');
    
    // 移除滚动监听器
    if (this.scrollPagingHandler) {
      window.removeEventListener('scroll', this.scrollPagingHandler);
      this.scrollPagingHandler = null;
    }
    
    // 移除加载指示器
    const loadingIndicator = document.querySelector('.scroll-paging-loading');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    
    // 重置状态
    this.isLoadingNextPage = false;
    this.currentPage = 1;
    this.maxPage = null;
    
    log('Scroll paging cleaned up');
  }

  private updatePageInfo(): void {
    const superRankingPageInfo = getSuperRankingTop250PageInfo();
    if (superRankingPageInfo) {
      this.currentPage = superRankingPageInfo.page;
      this.maxPage = superRankingPageInfo.maxPage;
      log(`Current super ranking page: ${this.currentPage}, Max page: ${this.maxPage}`);
      return;
    }

    // 从URL获取当前页码
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    this.currentPage = pageParam ? parseInt(pageParam, 10) : 1;
    
    // 尝试从分页器获取最大页码
    const paginationLinks = document.querySelectorAll('.pagination-link');
    let maxPageFromPagination = 0;
    
    paginationLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      const match = href.match(/page=(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        if (pageNum > maxPageFromPagination) {
          maxPageFromPagination = pageNum;
        }
      }
    });
    
    // 如果找到了分页信息，设置最大页码
    if (maxPageFromPagination > 0) {
      this.maxPage = maxPageFromPagination;
    }
    
    log(`Current page: ${this.currentPage}, Max page: ${this.maxPage}`);
  }

  private handleScrollPaging(): void {
    // 如果正在加载或已到最后一页，则不处理
    if (this.isLoadingNextPage || (this.maxPage && this.currentPage >= this.maxPage)) {
      return;
    }
    
    // 计算滚动位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 检查是否接近底部
    const distanceToBottom = documentHeight - (scrollTop + windowHeight);
    
    if (distanceToBottom <= this.scrollPagingThreshold) {
      this.loadNextPage();
    }
  }

  private async loadNextPage(): Promise<void> {
    if (this.isLoadingNextPage) return;
    if (this.maxPage && this.currentPage >= this.maxPage) {
      log('Already at last page');
      return;
    }

    this.isLoadingNextPage = true;
    const nextPage = this.currentPage + 1;

    try {
      log(`Loading page ${nextPage}...`);
      this.showLoadingIndicator();

      // 🔧 翻页前清除演员缓存，确保使用最新数据
      log('Clearing actor caches before loading next page...');
      this.clearActorCaches();

      const superRankingResult = await appendSuperRankingTop250Page(nextPage);
      if (superRankingResult.handled) {
        if (superRankingResult.appended > 0) {
          this.currentPage = superRankingResult.page;
          log(`[ScrollPaging] super ranking page ${nextPage} appended ${superRankingResult.appended} items to DOM at ${new Date().toISOString()}`);
          if (superRankingResult.url) {
            window.history.pushState({}, '', superRankingResult.url);
          }
          processVisibleItems();
        }
        return;
      }

      const nextUrl = this.buildNextPageUrl(nextPage);
      const response = await fetch(nextUrl);
      const html = await response.text();

      // 解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 提取新的影片项目
      const newItems = doc.querySelectorAll('.movie-list .item');
      const movieList = document.querySelector('.movie-list');

      if (movieList && newItems.length > 0) {
        newItems.forEach(item => {
          movieList.appendChild(item.cloneNode(true));
        });

        this.currentPage = nextPage;
        log(`[ScrollPaging] page ${nextPage} appended ${newItems.length} items to DOM at ${new Date().toISOString()}`);

        // 更新URL但不刷新页面
        const newUrl = this.buildNextPageUrl(nextPage);
        window.history.pushState({}, '', newUrl);

        // 对新追加的条目立即执行 display-settings 过滤（hideViewed/hideBrowsed 等）
        // setupObserver 在演员页不会被调用，所以这里主动触发，列表页和演员页均适用
        log('[ScrollPaging] triggering processVisibleItems for new items');
        processVisibleItems();
      }

    } catch (error) {
      log('Failed to load next page:', error);
    } finally {
      this.isLoadingNextPage = false;
      this.hideLoadingIndicator();
    }
  }

  private buildNextPageUrl(nextPage: number): string {
    const url = new URL(window.location.href);
    url.searchParams.set('page', nextPage.toString());
    return url.toString();
  }

  private createLoadingIndicator(): void {
    if (document.getElementById('scroll-loading-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'scroll-loading-indicator';
    indicator.className = 'scroll-loading-indicator';
    indicator.innerHTML = `
      <div class="loading-spinner"></div>
      <span class="loading-text">正在加载更多内容...</span>
    `;
    indicator.style.display = 'none';
    
    document.body.appendChild(indicator);
  }

  private showLoadingIndicator(): void {
    const indicator = document.getElementById('scroll-loading-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }

  private hideLoadingIndicator(): void {
    const indicator = document.getElementById('scroll-loading-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
}

export const listEnhancementManager = new ListEnhancementManager();

// 添加必要的CSS样式
function injectStyles(): void {
  const styleId = 'list-enhancement-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = LIST_ENHANCEMENT_BASE_STYLES;

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

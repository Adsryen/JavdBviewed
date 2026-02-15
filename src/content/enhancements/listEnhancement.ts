// src/content/enhancements/listEnhancement.ts

import { log } from '../state';
import { showToast } from '../toast';
import { actorManager } from '../../services/actorManager';
import { newWorksManager } from '../../services/newWorks';

export interface ListEnhancementConfig {
  enabled: boolean;
  enableClickEnhancement: boolean;
  enableVideoPreview: boolean;
  enableListOptimization: boolean;
  enableScrollPaging: boolean;
  previewDelay: number;
  previewVolume: number;
  enableRightClickBackground: boolean;
  preferredPreviewSource?: 'auto' | 'javdb' | 'javspyl' | 'avpreview' | 'vbgfl';
  // 演员水印
  enableActorWatermark?: boolean;
  actorWatermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  actorWatermarkOpacity?: number;
  // 基于演员偏好的过滤
  hideBlacklistedActorsInList?: boolean; // 隐藏含黑名单演员的作品
  hideNonFavoritedActorsInList?: boolean; // 隐藏未收藏演员的作品（通过标题近似识别）
  treatSubscribedAsFavorited?: boolean; // 订阅视为收藏
}

interface VideoPreviewSource {
  url: string;
  type: string;
}

class ListEnhancementManager {
  private config: ListEnhancementConfig = {
    enabled: false,
    enableClickEnhancement: true,
    enableVideoPreview: true,
    enableListOptimization: true,
    enableScrollPaging: false,
    previewDelay: 1000,
    previewVolume: 0.2,
    enableRightClickBackground: true,
    enableActorWatermark: false,
    actorWatermarkPosition: 'top-right',
    actorWatermarkOpacity: 0.8,
    // 默认：不开启演员过滤；将订阅视为收藏
    hideBlacklistedActorsInList: false,
    hideNonFavoritedActorsInList: false,
    treatSubscribedAsFavorited: true,
  };

  private previewTimer: number | null = null;
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
  // 演员水印样式注入标记
  private watermarkStylesInjected = false;

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

    // 若演员过滤配置变化，重应用一次
    const actorFlagsChanged = (
      oldConfig.hideBlacklistedActorsInList !== this.config.hideBlacklistedActorsInList ||
      oldConfig.hideNonFavoritedActorsInList !== this.config.hideNonFavoritedActorsInList ||
      oldConfig.treatSubscribedAsFavorited !== this.config.treatSubscribedAsFavorited
    );
    if (actorFlagsChanged) {
      this.reapplyActorHidingForAll();
    }
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
    if (this.actorIndex || this.loadingActorIndex === true) return;
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
    } catch (e) {
      log('Failed to build actor index:', e);
      this.actorIndex = new Map();
    } finally {
      this.loadingActorIndex = false;
    }
  }

  private async ensureSubscriptions(): Promise<void> {
    if (this.subscribedActorIds || this.loadingSubscriptions) return;
    this.loadingSubscriptions = true;
    try {
      const subs = await newWorksManager.getSubscriptions();
      this.subscribedActorIds = new Set(subs.map(s => s.actorId));
    } catch (e) {
      log('Failed to load subscriptions:', e);
      this.subscribedActorIds = new Set();
    } finally {
      this.loadingSubscriptions = false;
    }
  }

  private normalizeText(s: string): string {
    return (s || '')
      .replace(/[\t\n\r]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private extractActorsFromTitle(title: string): import('../../types').ActorRecord[] {
    if (!this.actorIndex) {
      log('[ActorWM] extractActorsFromTitle: actor index not ready');
      return [];
    }
    const raw = title || '';
    const norm = this.normalizeText(title).toLowerCase();
    if (!norm) {
      log(`[ActorWM] extractActorsFromTitle: empty/invalid title -> "${raw}"`);
      return [];
    }
    const tokens = norm.split(' ').filter(Boolean);
    const peek = tokens.slice(Math.max(0, tokens.length - 6)).join(' | ');
    log(`[ActorWM] Title tokens (last6): ${peek}`);

    const results: import('../../types').ActorRecord[] = [];
    const seen = new Set<string>();
    // 只在标题末尾尝试匹配，最多回溯 6 个词，名称长度 1..3 词
    const maxBackTokens = Math.min(tokens.length, 6);
    for (let offset = 0; offset < maxBackTokens; offset++) {
      const end = tokens.length - offset;
      for (let len = 3; len >= 1; len--) {
        const start = end - len;
        if (start < 0) continue;
        const phrase = tokens.slice(start, end).join(' ');
        const rec = this.actorIndex.get(phrase);
        if (rec && !seen.has(rec.id)) {
          log(`[ActorWM] Matched phrase: "${phrase}" -> ${rec.name}(${rec.id})`);
          results.push(rec);
          seen.add(rec.id);
          break; // 命中后不再尝试更短的片段
        }
      }
    }

    if (results.length === 0) {
      // 加权混合（方案D）：全局滑窗 + 位置与括注加权
      log('[ActorWM] No actors matched from title end. Start weighted scan...');
      const scores: Map<string, number> = new Map(); // actorId -> score
      const bestPhrase: Map<string, string> = new Map();

      // 括注段提取（提高命中）
      const bracketContents: string[] = [];
      const bracketRegex = /[\(（【\[「『]([^\)）】\]」』]{1,50})[\)）】\]」』]/g;
      let m: RegExpExecArray | null;
      while ((m = bracketRegex.exec(norm)) !== null) {
        if (m[1]) bracketContents.push(m[1]);
      }
      const bracketJoined = bracketContents.join(' ');

      const maxCandidates = Math.min(tokens.length * 3, 120); // 限制候选数量
      let generated = 0;
      for (let start = 0; start < tokens.length; start++) {
        for (let len = 3; len >= 1; len--) {
          const end = start + len;
          if (end > tokens.length) continue;
          const phrase = tokens.slice(start, end).join(' ');
          const rec = this.actorIndex.get(phrase);
          generated++;
          if (generated > maxCandidates) break;
          if (!rec) continue;

          // 基础分 + 位置权重
          let s = 1;
          if (start >= Math.max(0, tokens.length - 6)) s += 3; // 末段
          if (start <= 5) s += 2; // 首段
          if (bracketJoined.includes(phrase)) s += 2; // 括注

          const prev = scores.get(rec.id) || 0;
          if (s > prev) {
            scores.set(rec.id, s);
            bestPhrase.set(rec.id, phrase);
          }
        }
        if (generated > maxCandidates) break;
      }

      const ranked = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([actorId, score]) => ({ actorId, score }));

      if (ranked.length === 0) {
        log('[ActorWM] Weighted scan found no actors');
      } else {
        for (const r of ranked) {
          // 通过短语反查记录（actorIndex仅按名称/别名建索引，已命中代表可取）
          const phrase = bestPhrase.get(r.actorId) || '';
          const rec = this.actorIndex.get(phrase);
          if (rec && !seen.has(rec.id)) {
            results.push(rec);
            seen.add(rec.id);
            log(`[ActorWM] Weighted matched: ${rec.name}(${rec.id}) score=${r.score} by "${phrase}"`);
          }
        }
      }
    } else {
      log(`[ActorWM] Matched actors (end-only): ${results.map(a => `${a.name}(${a.id})`).join(', ')}`);
    }
    return results;
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
      log('[ActorWM] DOM actors: none');
      return [];
    }
    try {
      const list = await Promise.all(Array.from(ids).slice(0, 8).map(id => actorManager.getActorById(id).catch(() => null)));
      const actors = list.filter(Boolean) as import('../../types').ActorRecord[];
      log(`[ActorWM] DOM actors found: ${actors.map(a => a.name + '(' + a.id + ')').join(', ')}`);
      return actors;
    } catch {
      return [];
    }
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

      log(`[ActorWM] Applying watermark for ${videoInfo.code}, title="${videoInfo.title}"`);
      // 1) 优先DOM抓取（列表/首页可靠）
      let actors = await this.extractActorsFromDOM(item);
      if (actors.length === 0) {
        // 2) 回退：标题解析（快速路径A -> 加权D）
        actors = this.extractActorsFromTitle(videoInfo.title);
        log(`[ActorWM] Extracted ${actors.length} candidate(s) from title`);
      }
      // 演员页兜底：若标题未能匹配到演员，则使用当前演员ID
      if ((actors.length === 0) && /^\/actors\//.test(window.location.pathname)) {
        const m = window.location.pathname.match(/\/actors\/(\w+)/);
        if (m && m[1]) {
          try {
            log(`[ActorWM] Fallback to current actor page id: ${m[1]}`);
            const rec = await actorManager.getActorById(m[1]);
            if (rec) {
              actors = [rec];
              log(`[ActorWM] Fallback matched: ${rec.name}(${rec.id})`);
            } else {
              log('[ActorWM] Fallback actor not found in local DB');
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
        log(`[ActorWM] Badge -> ${a.name}(${a.id}): ${type}`);
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
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches('.item')) {
              this.enhanceItem(element as HTMLElement);
            } else {
              const items = element.querySelectorAll('.item');
              items.forEach(item => this.enhanceItem(item as HTMLElement));
            }
          }
        });
      });
    });

    observer.observe(targetNode, { childList: true, subtree: true });
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

    // 应用各种增强功能
    if (this.config.enableClickEnhancement) {
      this.enhanceClicks(item, videoInfo);
    }

    if (this.config.enableVideoPreview) {
      this.enhanceVideoPreview(item, videoInfo);
    }

    if (this.config.enableListOptimization) {
      this.optimizeListItem(item, videoInfo);
    }

    // 演员水印
    if (this.config.enableActorWatermark) {
      this.applyActorWatermark(item, videoInfo).catch(err => log('Actor watermark error:', err));
    }

    // 基于演员偏好的隐藏（黑名单/未收藏）
    this.applyActorBasedHiding(item, videoInfo).catch(err => log('Actor-based hiding error:', err));
  }

  // ====== 基于演员的隐藏逻辑 ======
  private async applyActorBasedHiding(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): Promise<void> {
    try {
      const hideByBlacklist = !!this.config.hideBlacklistedActorsInList;
      const hideByNonFavorited = !!this.config.hideNonFavoritedActorsInList;
      if (!hideByBlacklist && !hideByNonFavorited) {
        // 若之前由“演员原因”隐藏，现在需要清除（不影响其他默认隐藏原因）
        this.clearActorOnlyHiding(item);
        return;
      }

      await Promise.all([this.ensureActorIndex(), this.ensureSubscriptions()]);
      // 先DOM，再标题
      let actors = await this.extractActorsFromDOM(item);
      if (actors.length === 0) {
        actors = this.extractActorsFromTitle(videoInfo.title);
      }

      // 是否命中黑名单
      const matchedBlack = hideByBlacklist && actors.some(a => !!a.blacklisted);

      // 是否“未收藏”（无收藏/订阅的命中）
      let matchedNonFav = false;
      if (hideByNonFavorited) {
        const treatSubs = this.config.treatSubscribedAsFavorited !== false; // 默认将订阅视为收藏
        const subscribed = this.subscribedActorIds || new Set<string>();
        // 规则：
        // - 若标题无法匹配到任何本地演员（actors.length === 0），按“未收藏”处理（近似，允许误差）
        // - 若匹配到了演员，但均为黑名单且未订阅，则也按“未收藏”处理
        if (actors.length === 0) {
          matchedNonFav = true;
        } else {
          const anyNonBlackFavoritedOrSubscribed = actors.some(a => {
            const isBlack = !!a.blacklisted;
            const isSubscribed = treatSubs && !!subscribed.has(a.id);
            return (!isBlack) || isSubscribed;
          });
          matchedNonFav = !anyNonBlackFavoritedOrSubscribed;
        }
      }

      if (matchedBlack) {
        this.hideItemByActor(item, 'ACTOR_BLACKLIST');
      } else if (matchedNonFav) {
        this.hideItemByActor(item, 'ACTOR_NOT_FAVORITED');
      } else {
        this.clearActorOnlyHiding(item);
      }
    } catch (e) {
      log('applyActorBasedHiding failed:', e);
    }
  }

  private hideItemByActor(item: HTMLElement, reason: 'ACTOR_BLACKLIST' | 'ACTOR_NOT_FAVORITED'): void {
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
            const { fc2BreakerService } = await import('../../services/fc2Breaker');
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
      linkElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 使用chrome.runtime.sendMessage发送消息给background script
        chrome.runtime.sendMessage({
          type: 'OPEN_TAB_BACKGROUND',
          url: videoInfo.url
        }).catch(err => {
          log('Failed to open background tab:', err);
          // 降级方案：使用window.open
          window.open(videoInfo.url, '_blank');
        });

        showToast('已在后台打开', 'success');
      });

      // 阻止右键菜单
      linkElement.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // 右键
          e.preventDefault();
        }
      });
    }
  }

  private enhanceVideoPreview(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    const coverElement = item.querySelector('.cover') as HTMLElement;
    if (!coverElement) return;

    // 添加预览样式类
    coverElement.classList.add('x-cover');

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
    coverElement.classList.add('x-preview', 'x-holding');
    // 预览延迟：0 表示禁用悬停预览
    const delay = Number(this.config.previewDelay || 0);
    if (delay <= 0) {
      // 禁用：直接移除加载中的标记并返回
      coverElement.classList.remove('x-holding');
      return;
    }

    this.previewTimer = window.setTimeout(() => {
      this.loadVideoPreview(coverElement, videoInfo);
    }, delay);
  }

  private hidePreview(coverElement: HTMLElement): void {
    coverElement.classList.remove('x-holding');
    
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }

    const video = coverElement.querySelector('video');
    if (video) {
      video.classList.remove('x-in');
      setTimeout(() => {
        if (video.parentNode) {
          video.remove();
        }
      }, 250);
    }
  }

  private async loadVideoPreview(coverElement: HTMLElement, videoInfo: { code: string; title: string; url: string }): Promise<void> {
    try {
      // 获取视频预览源
      const videoSources = await this.fetchVideoPreview(videoInfo);
      
      if (videoSources.length === 0) {
        log(`No preview sources found for ${videoInfo.code}`);
        return;
      }

      // 创建视频元素
      const video = this.createVideoElement(videoSources);
      coverElement.appendChild(video);

      // 添加淡入效果
      setTimeout(() => {
        video.classList.add('x-in');
      }, 50);

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
      const autoOrder = ['javspyl', 'avpreview', 'vbgfl', 'javdb'] as const;
      const preferred = this.config.preferredPreviewSource || 'auto';
      const order = preferred === 'auto' ? autoOrder : ([preferred, ...autoOrder.filter(x => x !== preferred)] as const);
      const fetchMethods = order.map((key) => {
        switch (key) {
          case 'javspyl':
            return { name: 'JavSpyl', method: () => this.fetchFromJavSpyl(videoInfo.code) };
          case 'avpreview':
            return { name: 'AVPreview', method: () => this.fetchFromAVPreview(videoInfo.code) };
          case 'vbgfl':
            return { name: 'VBGFL', method: () => this.fetchFromVBGFL(videoInfo.code) };
          case 'javdb':
          default:
            return { name: 'JavDB', method: () => this.fetchFromJavDB(videoInfo.url) };
        }
      });

      for (const { name, method } of fetchMethods) {
        try {
          log(`Trying ${name} for ${videoInfo.code}...`);
          const url = await method();

          if (url) {
            log(`${name} returned URL: ${url}`);

            // 验证URL是否真的可用
            const isValid = await this.validateVideoUrl(url);
            if (isValid) {
              log(`${name} URL validated successfully: ${url}`);
              sources.push({
                url: url,
                type: 'video/mp4'
              });
              break; // 找到可用的源就停止
            } else {
              log(`${name} URL validation failed: ${url}`);
            }
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

  // 验证视频URL是否可用
  private async validateVideoUrl(url: string): Promise<boolean> {
    try {
      log(`Validating video URL: ${url}`);

      // 通过background script验证URL
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_VIDEO_URL',
        url: url
      });

      const isValid = response?.success && response?.available;
      log(`URL validation result for ${url}: ${isValid}`);
      return isValid;
    } catch (error) {
      log(`URL validation error for ${url}:`, error);
      return false;
    }
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

      // 1Pondo (格式: 123456_789)
      if (code.includes('_') || code.includes('-')) {
        const pondo = code.replace('-', '_').toLowerCase();
        urls.push(`http://smovie.1pondo.tv/sample/movies/${pondo}/1080p.mp4`);
        urls.push(`http://smovie.1pondo.tv/sample/movies/${pondo}/720p.mp4`);
      }

      // Heyzo
      if (code.toLowerCase().includes('heyzo') || /^\d{4}$/.test(normalizedCode)) {
        const heyzoCode = normalizedCode.replace('heyzo-', '');
        urls.push(`https://sample.heyzo.com/contents/3000/${heyzoCode}/heyzo_hd_${heyzoCode}_sample.mp4`);
      }

      // 10musume
      if (code.includes('-') && /^\d{6}_\d{2}$/.test(code.replace('-', '_'))) {
        const musume = code.replace('-', '_').toLowerCase();
        urls.push(`https://smovie.10musume.com/sample/movies/${musume}/720p.mp4`);
      }

      // Pacopacomama
      if (code.includes('-') && /^\d{6}_\d{3}$/.test(code.replace('-', '_'))) {
        const paco = code.replace('-', '_').toLowerCase();
        urls.push(`https://fms.pacopacomama.com/hls/sample/pacopacomama.com/${paco}/720p.mp4`);
      }

      log(`VBGFL: Generated ${urls.length} URLs for ${code}:`, urls);

      // 尝试每个URL，但要真正验证可用性
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          log(`VBGFL: Checking URL ${i + 1}/${urls.length}: ${url}`);

          // 确保使用HTTPS
          const httpsUrl = url.replace('http://', 'https://');

          // 通过background script验证URL
          const response = await chrome.runtime.sendMessage({
            type: 'CHECK_VIDEO_URL',
            url: httpsUrl
          });

          if (response?.success && response?.available) {
            log(`VBGFL: URL verified and available: ${httpsUrl}`);
            return httpsUrl;
          } else {
            log(`VBGFL: URL not available: ${httpsUrl}`);
          }
        } catch (err) {
          log(`VBGFL: Error checking URL ${url}:`, err);
        }
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

  private createVideoElement(sources: VideoPreviewSource[]): HTMLVideoElement {
    const video = document.createElement('video');

    // 设置视频属性
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false; // 预览时不显示控制条
    video.volume = this.config.previewVolume;
    video.disablePictureInPicture = true;
    video.style.opacity = '0';
    video.style.transition = 'opacity 0.25s ease-in-out';
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.zIndex = '2';

    // 添加视频源
    sources.forEach(source => {
      const sourceElement = document.createElement('source');
      sourceElement.src = source.url;
      sourceElement.type = source.type;
      video.appendChild(sourceElement);
    });

    // 添加事件监听器
    video.addEventListener('loadeddata', () => {
      log(`Video loaded successfully: ${sources[0]?.url}`);
      video.style.opacity = '1';
      // 尝试从第3秒开始播放
      if (video.duration > 3) {
        video.currentTime = 3;
      }
    });

    video.addEventListener('canplay', () => {
      log(`Video can play: ${sources[0]?.url}`);
      video.play().catch(err => {
        log(`Video play failed: ${err.message}`);
      });
    });

    video.addEventListener('error', (e) => {
      log(`Video error: ${e.message || 'Unknown error'} for ${sources[0]?.url}`);
      // 如果视频加载失败，移除元素
      if (video.parentNode) {
        video.remove();
      }
    });

    video.addEventListener('keyup', (e) => {
      if (e.code === 'KeyM') {
        video.muted = !video.muted;
      }
    });

    // 设置加载超时
    setTimeout(() => {
      if (video.readyState === 0) {
        log(`Video loading timeout for ${sources[0]?.url}`);
        if (video.parentNode) {
          video.remove();
        }
      }
    }, 10000); // 10秒超时

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
        log(`Successfully loaded page ${nextPage}, added ${newItems.length} items`);

        // 更新URL但不刷新页面
        const newUrl = this.buildNextPageUrl(nextPage);
        window.history.pushState({}, '', newUrl);
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
  style.textContent = `
    /* 预览相关样式 */
    .x-cover {
      position: relative;
      overflow: hidden;
    }

    .x-cover.x-preview {
      z-index: 10;
    }

    .x-cover video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.25s ease-in-out;
      z-index: 2;
    }

    .x-cover video.x-in {
      opacity: 1;
    }

    /* 标题优化样式 */
    .x-title {
      position: relative;
    }

    .x-ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* 功能按钮样式 */
    .x-btn {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #3273dc;
      border-radius: 50%;
      margin-right: 8px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      vertical-align: middle;
    }

    .x-btn:hover {
      opacity: 1;
    }

    /* 右键菜单禁用 */
    .movie-list .item a[href*="/v/"] {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    /* 预览加载状态 */
    .x-cover.x-holding::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      z-index: 3;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* 响应式调整 */
    @media (max-width: 768px) {
      .x-cover video {
        pointer-events: none;
      }
    }

    /* 滚动翻页加载指示器样式 */
    .scroll-loading-indicator {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      white-space: nowrap;
    }

    /* 演员水印 */
    .x-actor-wm {
      position: absolute;
      display: flex;
      gap: 4px;
      z-index: 3;
      padding: 4px;
      pointer-events: none;
    }
    .x-actor-wm .x-actor-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.25);
    }
    .x-actor-wm.pos-top-left { top: 6px; left: 6px; }
    .x-actor-wm.pos-top-right { top: 6px; right: 6px; }
    .x-actor-wm.pos-bottom-left { bottom: 6px; left: 6px; }
    .x-actor-wm.pos-bottom-right { bottom: 6px; right: 6px; }
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

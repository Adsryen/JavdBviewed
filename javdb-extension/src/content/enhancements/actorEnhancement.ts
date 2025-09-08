/**
 * 演员页增强功能
 * 自动保存和应用标签过滤器，支持跨演员页面的过滤器同步
 */

import { getValue, setValue } from '../../utils/storage';
import { showToast } from '../toast';
import type { ActorRecord } from '../../types';
import { actorManager } from '../../services/actorManager';
import { newWorksManager } from '../../services/newWorks';

interface ActorTagFilter {
  tags: string[];
  sortType: number;
  timestamp: number;
}

interface ActorEnhancementConfig {
  enabled: boolean;
  autoApplyTags: boolean;
  defaultTags: string[];
  defaultSortType: number;
}

class ActorEnhancementManager {
  private config: ActorEnhancementConfig = {
    enabled: true,
    autoApplyTags: true,
    defaultTags: ['s', 'd'], // 默認標籤：單體作品 + 含磁鏈
    defaultSortType: 0
  };

  private isActorPage = false;
  private currentActorId = '';
  private availableTags: Map<string, string> = new Map(); // tag code -> tag name
  private storageKey = 'actorTagFilters';

  updateConfig(newConfig: Partial<ActorEnhancementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 从当前页面内容检测演员性别，规则与 actorSync 中保持一致
   */
  private detectGenderFromPage(): 'female' | 'male' | 'unknown' {
    try {
      const html = document.documentElement?.outerHTML || '';
      // 优先匹配日文标签
      if (html.includes('男優')) return 'male';
      if (html.includes('女優')) return 'female';

      // 其他中英文字样
      const malePattern = /男优|男演员|male/i;
      const femalePattern = /女优|女演员|actress|female/i;
      if (malePattern.test(html)) return 'male';
      if (femalePattern.test(html)) return 'female';

      // 默认未知（与同步不同，这里不强制默认女性）
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * 监听收藏/取消收藏按钮，点击时同步演员数据到本地演员库
   */
  private setupCollectSyncListeners(): void {
    const collectBtn = document.getElementById('button-collect-actor');
    const uncollectBtn = document.getElementById('button-uncollect-actor');

    const handler = async (action: 'collect' | 'uncollect') => {
      try {
        const parsed = this.parseActorFromPage();
        if (!parsed) {
          showToast('未能获取演员信息，操作失败', 'error');
          return;
        }

        const existing = await actorManager.getActorById(parsed.id);

        if (action === 'collect') {
          // 合并已有数据，优先保留本地已存在的信息与黑名单状态
          if (existing) {
            parsed.name = existing.name || parsed.name;
            parsed.aliases = (existing.aliases && existing.aliases.length > 0) ? existing.aliases : parsed.aliases;
            if (typeof existing.blacklisted !== 'undefined') {
              (parsed as any).blacklisted = existing.blacklisted;
            }
          }
          await actorManager.saveActor(parsed);
          console.log('[ActorEnhancement] 已收藏并保存到演员库:', parsed);
          showToast('收藏成功', 'success');
        } else {
          // 取消收藏：若已拉黑，不删除，仅提示；否则删除
          if (existing?.blacklisted) {
            showToast('该演员已在黑名单，取消收藏不会删除演员库数据', 'info');
            console.log('[ActorEnhancement] 已取消收藏，但因在黑名单中未删除记录:', existing);
          } else {
            const removed = await actorManager.deleteActor(parsed.id);
            if (removed) {
              showToast('已取消收藏，并从演员库删除', 'success');
              console.log('[ActorEnhancement] 已取消收藏并从演员库删除:', parsed.id);
            } else {
              // 若本地不存在，也提示已取消收藏（对齐“成功与否均有toast”的要求）
              console.log('[ActorEnhancement] 取消收藏：演员库无记录，无需删除:', parsed.id);
              showToast('已取消收藏', 'success');
            }
          }
        }
      } catch (err) {
        console.error('[ActorEnhancement] 同步演员到本地失败:', err);
        showToast('操作失败', 'error');
      }
    };

    if (collectBtn && !collectBtn.getAttribute('data-sync-bound')) {
      collectBtn.addEventListener('click', () => handler('collect'));
      collectBtn.setAttribute('data-sync-bound', 'true');
    }

    if (uncollectBtn && !uncollectBtn.getAttribute('data-sync-bound')) {
      uncollectBtn.addEventListener('click', () => handler('uncollect'));
      uncollectBtn.setAttribute('data-sync-bound', 'true');
    }
  }

  /**
   * 在收藏按钮附近注入“拉黑/取消拉黑”按钮
   */
  private async injectBlacklistButton(): Promise<void> {
    try {
      const collectBtn = document.getElementById('button-collect-actor') as HTMLAnchorElement | null;
      const uncollectBtn = document.getElementById('button-uncollect-actor') as HTMLAnchorElement | null;

      // 使用计算样式判断可见性，避免被我们误改显示
      const collectVisible = !!(collectBtn && window.getComputedStyle(collectBtn).display !== 'none');
      const uncollectVisible = !!(uncollectBtn && window.getComputedStyle(uncollectBtn).display !== 'none');
      const anchorBtn = (uncollectVisible && uncollectBtn) || (collectVisible && collectBtn) || uncollectBtn || collectBtn;
      if (!anchorBtn) return;

      // 避免重复注入
      if (document.getElementById('button-blacklist-actor')) return;

      // 仅对可见按钮进行并列布局设置，隐藏按钮保持隐藏
      [
        collectVisible ? collectBtn : null,
        uncollectVisible ? uncollectBtn : null,
      ].forEach(btn => {
        if (btn) {
          (btn as HTMLAnchorElement).style.display = 'inline-flex';
          (btn as HTMLAnchorElement).style.verticalAlign = 'middle';
          if (!(btn as HTMLAnchorElement).className.includes('mr-2')) {
            (btn as HTMLAnchorElement).classList.add('mr-2');
          }
        }
      });

      // 查询当前本地黑名单状态
      let blacklisted = false;
      try {
        const existing = await actorManager.getActorById(this.currentActorId);
        blacklisted = !!existing?.blacklisted;
      } catch {}

      // 创建按钮
      const btn = document.createElement('a');
      btn.id = 'button-blacklist-actor';
      btn.href = 'javascript:void(0)';
      btn.className = this.getBlacklistBtnClass(blacklisted);
      btn.textContent = blacklisted ? '取消拉黑' : '拉黑';
      (btn as HTMLAnchorElement).style.display = 'inline-flex';
      (btn as HTMLAnchorElement).style.verticalAlign = 'middle';

      // 紧挨收藏按钮后面插入
      anchorBtn.parentElement?.insertBefore(btn, anchorBtn.nextSibling);

      // 点击事件
      btn.addEventListener('click', async () => {
        try {
          // 确保本地有演员记录
          let record = await actorManager.getActorById(this.currentActorId);
          if (!record) {
            const parsed = this.parseActorFromPage();
            if (parsed) {
              await actorManager.saveActor(parsed);
              record = parsed;
            }
          }

          if (!record) {
            showToast('未能获取演员信息，无法拉黑', 'error');
            return;
          }

          const newState = !blacklisted;
          await actorManager.setBlacklisted(this.currentActorId, newState);
          blacklisted = newState;

          // 更新UI
          btn.className = this.getBlacklistBtnClass(blacklisted);
          btn.textContent = blacklisted ? '取消拉黑' : '拉黑';
          showToast(blacklisted ? '已拉黑该演员' : '已取消拉黑', 'success');
        } catch (e) {
          console.error('[ActorEnhancement] 切换拉黑状态失败:', e);
          showToast('操作失败', 'error');
        }
      });
    } catch (e) {
      console.error('[ActorEnhancement] 注入拉黑按钮失败:', e);
    }
  }

  /**
   * 在收藏按钮附近注入“订阅/取消订阅”按钮
   */
  private async injectSubscribeButton(): Promise<void> {
    try {
      const collectBtn = document.getElementById('button-collect-actor') as HTMLAnchorElement | null;
      const uncollectBtn = document.getElementById('button-uncollect-actor') as HTMLAnchorElement | null;

      const collectVisible = !!(collectBtn && window.getComputedStyle(collectBtn).display !== 'none');
      const uncollectVisible = !!(uncollectBtn && window.getComputedStyle(uncollectBtn).display !== 'none');
      const anchorBtn = (uncollectVisible && uncollectBtn) || (collectVisible && collectBtn) || uncollectBtn || collectBtn;
      if (!anchorBtn) return;

      // 避免重复注入
      if (document.getElementById('button-subscribe-actor')) return;

      // 仅对可见按钮进行并列布局设置，隐藏按钮保持隐藏
      [
        collectVisible ? collectBtn : null,
        uncollectVisible ? uncollectBtn : null,
      ].forEach(btn => {
        if (btn) {
          (btn as HTMLAnchorElement).style.display = 'inline-flex';
          (btn as HTMLAnchorElement).style.verticalAlign = 'middle';
          if (!(btn as HTMLAnchorElement).className.includes('mr-2')) {
            (btn as HTMLAnchorElement).classList.add('mr-2');
          }
        }
      });

      // 判断是否已订阅
      let isSubscribed = false;
      try {
        const subs = await newWorksManager.getSubscriptions();
        isSubscribed = subs.some(s => s.actorId === this.currentActorId);
      } catch {}

      // 创建按钮
      const btn = document.createElement('a');
      btn.id = 'button-subscribe-actor';
      btn.href = 'javascript:void(0)';
      btn.className = isSubscribed ? 'button is-info is-light ml-2' : 'button is-info ml-2';
      btn.textContent = isSubscribed ? '取消订阅' : '订阅';
      (btn as HTMLAnchorElement).style.display = 'inline-flex';
      (btn as HTMLAnchorElement).style.verticalAlign = 'middle';

      // 插入到收藏/取消收藏按钮后面
      anchorBtn.parentElement?.insertBefore(btn, anchorBtn.nextSibling);

      // 点击事件：切换订阅
      btn.addEventListener('click', async () => {
        try {
          // 确保本地有演员记录
          let record = await actorManager.getActorById(this.currentActorId);
          if (!record) {
            const parsed = this.parseActorFromPage();
            if (parsed) {
              await actorManager.saveActor(parsed);
              record = parsed;
            }
          }

          if (!record) {
            showToast('未能获取演员信息，无法订阅', 'error');
            return;
          }

          if (!isSubscribed) {
            await newWorksManager.addSubscription(this.currentActorId);
            isSubscribed = true;
            btn.className = 'button is-info is-light ml-2';
            btn.textContent = '取消订阅';
            showToast('已订阅该演员的新作品', 'success');
          } else {
            await newWorksManager.removeSubscription(this.currentActorId);
            isSubscribed = false;
            btn.className = 'button is-info ml-2';
            btn.textContent = '订阅';
            showToast('已取消订阅该演员', 'success');
          }
        } catch (e) {
          console.error('[ActorEnhancement] 切换订阅状态失败:', e);
          showToast('操作失败', 'error');
        }
      });
    } catch (e) {
      console.error('[ActorEnhancement] 注入订阅按钮失败:', e);
    }
  }

  private getBlacklistBtnClass(blacklisted: boolean): string {
    // 颜色规范：
    // 拉黑（未拉黑状态下展示“拉黑”）：黑色按钮
    // 取消拉黑（已拉黑状态下展示“取消拉黑”）：白色底按钮
    return blacklisted
      ? 'button is-white has-text-black ml-2'
      : 'button is-black ml-2';
  }

  /**
   * 从当前页面解析演员基本信息，构建 ActorRecord 以用于本地保存
   */
  private parseActorFromPage(): ActorRecord | null {
    try {
      const id = this.currentActorId;
      if (!id) return null;

      // 名称（优先从 .actor-section-name，其次从页面标题），清理尾随统计文本
      const nameEl = document.querySelector('.actor-section-name') || document.querySelector('.title.is-4');
      let nameRaw = (nameEl?.textContent || '').trim();
      // 归一空白
      nameRaw = nameRaw.replace(/\s+/g, ' ');
      // 依次移除多种常见的“统计/数量”尾缀
      let name = nameRaw
        // 9 部影片 / 9 部作品
        .replace(/\d+\s*部\s*(影片|作品)/gi, '')
        // 共 9 部 / 共9部影片
        .replace(/共\s*\d+\s*部(?:\s*(影片|作品))?/gi, '')
        // 9 作品 / 9 个作品
        .replace(/\d+\s*(个|件)?\s*(影片|作品)/gi, '')
        // 点号分隔的『 · 9 部作品 』
        .replace(/[·・•]\s*\d+\s*(部)?\s*(影片|作品)/gi, '')
        // 括号里的数量（含中文括号）
        .replace(/[\(（]\s*\d+\s*(部)?\s*(影片|作品)[^\)）]*[\)）]/gi, '')
        // 尾部可能残留的连接符号
        .replace(/[·・•|｜]\s*$/, '')
        .trim();
      if (!name) name = id;

      // 头像
      const avatarImg = document.querySelector('.actor-section img, .performer-avatar img, .avatar img') as HTMLImageElement | null;
      const avatarUrl = avatarImg?.src || undefined;

      const now = Date.now();

      const detectedGender = this.detectGenderFromPage();

      const record: ActorRecord = {
        id,
        name,
        aliases: [],
        gender: detectedGender,
        category: 'unknown',
        avatarUrl,
        profileUrl: window.location.origin + window.location.pathname,
        createdAt: now,
        updatedAt: now,
        syncInfo: {
          source: 'javdb',
          lastSyncAt: now,
          syncStatus: 'success'
        }
      };

      return record;
    } catch (e) {
      console.error('[ActorEnhancement] 解析演员页面失败:', e);
      return null;
    }
  }

  async init(): Promise<void> {
    // 检查是否为演员页面
    this.isActorPage = /\/actors\/\w+/.test(window.location.pathname);
    if (!this.isActorPage || !this.config.enabled) return;

    // 提取演员ID
    const match = window.location.pathname.match(/\/actors\/(\w+)/);
    if (!match) return;
    
    this.currentActorId = match[1];
    console.log(`🎭 演员页增强功能已启用，演员ID: ${this.currentActorId}`);

    // 解析页面上可用的标签
    this.parseAvailableTags();

    // 设置标签点击监听器
    this.setupTagClickListener();

    // 设置收藏/取消收藏同步监听器
    this.setupCollectSyncListeners();

    // 注入拉黑/取消拉黑按钮
    await this.injectBlacklistButton();

    // 注入订阅/取消订阅按钮
    await this.injectSubscribeButton();

    // 应用保存的标签过滤器（延迟执行，确保页面加载完成）
    if (this.config.autoApplyTags) {
      setTimeout(() => this.applyStoredTagFilter(), 1000);
    }
  }

  private parseAvailableTags(): void {
    // 解析页面上的标签链接
    const tagLinks = document.querySelectorAll('a.tag[href*="?t="]');
    tagLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      const match = href.match(/[?&]t=([^&]+)/);
      if (match) {
        const tagCode = match[1];
        const tagName = link.textContent?.trim() || tagCode;
        this.availableTags.set(tagCode, tagName);
      }
    });

    // 解析当前已选择的标签
    const selectedTags = document.querySelectorAll('.selected-tags .tag');
    selectedTags.forEach(tag => {
      const deleteBtn = tag.querySelector('button.delete');
      if (deleteBtn) {
        const onclick = deleteBtn.getAttribute('onclick');
        if (onclick) {
          const match = onclick.match(/[?&]t=([^&']+)/);
          if (match) {
            const tagCode = match[1];
            const tagName = tag.textContent?.replace('×', '').trim() || tagCode;
            this.availableTags.set(tagCode, tagName);
          }
        }
      }
    });

    console.log(`📋 解析到 ${this.availableTags.size} 个可用tags:`, Array.from(this.availableTags.entries()));
  }

  private getCurrentTagsFromUrl(): string[] {
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('t');
    return tagParam ? tagParam.split(',').filter(t => t.length > 0) : [];
  }

  private getCurrentSortType(): number {
    const urlParams = new URLSearchParams(window.location.search);
    const sortParam = urlParams.get('sort_type');
    return sortParam ? parseInt(sortParam, 10) : 0;
  }

  private async applyStoredTagFilter(): Promise<void> {
    try {
      // 检查当前URL是否已经有过滤器
      const currentTags = this.getCurrentTagsFromUrl();
      if (currentTags.length > 0) {
        console.log('🏷️ 当前页面已有tag过滤器，跳过自动应用');
        return;
      }

      // 检查是否刚刚应用过过滤器（防止循环）
      const appliedKey = `applied_${this.currentActorId}`;
      const recentlyApplied = sessionStorage.getItem(appliedKey);
      if (recentlyApplied) {
        const appliedTime = parseInt(recentlyApplied, 10);
        if (Date.now() - appliedTime < 5000) { // 5秒内不重复应用
          console.log('🔄 最近已应用过过滤器，跳过重复应用');
          return;
        }
      }

      const storedFilters = await getValue(this.storageKey, '{}');
      const tagFilters = JSON.parse(storedFilters);
      const lastFilter = this.getLastUsedFilter(tagFilters);
      
      if (!lastFilter) {
        // 如果没有保存的过滤器，应用默认过滤器
        await this.applyDefaultFilter();
        return;
      }

      // 检查tag兼容性
      const compatibleTags = this.checkTagCompatibility(lastFilter.tags);
      if (compatibleTags.length === 0) {
        console.log('⚠️ 没有兼容的tags，应用默认过滤器');
        await this.applyDefaultFilter();
        return;
      }

      // 应用兼容的tags
      console.log(`🔄 应用保存的tag过滤器: ${compatibleTags.join(',')}`);
      
      // 标记已应用，防止循环
      sessionStorage.setItem(appliedKey, Date.now().toString());
      
      this.navigateWithTags(compatibleTags, lastFilter.sortType);
      
      showToast(`已应用保存的过滤器: ${this.getTagNames(compatibleTags).join(', ')}`, 'success');
    } catch (error) {
      console.error('应用保存的tag过滤器失败:', error);
      await this.applyDefaultFilter();
    }
  }

  private async applyDefaultFilter(): Promise<void> {
    if (this.config.defaultTags.length === 0) return;

    // 检查是否刚刚应用过默认过滤器（防止循环）
    const appliedKey = `applied_default_${this.currentActorId}`;
    const recentlyApplied = sessionStorage.getItem(appliedKey);
    if (recentlyApplied) {
      const appliedTime = parseInt(recentlyApplied, 10);
      if (Date.now() - appliedTime < 5000) { // 5秒内不重复应用
        console.log('🔄 最近已应用过默认过滤器，跳过重复应用');
        return;
      }
    }

    const compatibleTags = this.checkTagCompatibility(this.config.defaultTags);
    if (compatibleTags.length > 0) {
      console.log(`🔄 应用默认tag过滤器: ${compatibleTags.join(',')}`);
      
      // 标记已应用，防止循环
      sessionStorage.setItem(appliedKey, Date.now().toString());
      
      this.navigateWithTags(compatibleTags, this.config.defaultSortType);
      showToast(`已应用默认过滤器: ${this.getTagNames(compatibleTags).join(', ')}`, 'info');
    }
  }

  private getLastUsedFilter(storedFilters: Record<string, ActorTagFilter>): ActorTagFilter | null {
    const filters = Object.values(storedFilters);
    if (filters.length === 0) return null;

    // 返回最近使用的过滤器
    return filters.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  private checkTagCompatibility(tags: string[]): string[] {
    return tags.filter(tag => this.availableTags.has(tag));
  }

  private getTagNames(tagCodes: string[]): string[] {
    return tagCodes.map(code => this.availableTags.get(code) || code);
  }

  private navigateWithTags(tags: string[], sortType: number = 0): void {
    const url = new URL(window.location.href);
    url.searchParams.set('t', tags.join(','));
    url.searchParams.set('sort_type', sortType.toString());
    window.location.href = url.toString();
  }

  private setupTagClickListener(): void {
    // 监听tag点击事件，保存当前的过滤器设置
    const tagContainer = document.querySelector('.content');
    if (!tagContainer) return;

    tagContainer.addEventListener('click', async (event) => {
      const target = event.target as HTMLElement;
      
      // 检查是否点击了tag链接或删除按钮
      const tagLink = target.closest('a.tag[href*="?t="]') as HTMLAnchorElement;
      const deleteButton = target.closest('button.delete') as HTMLButtonElement;
      
      if (tagLink || deleteButton) {
        // 先保存当前状态，然后预测点击后的状态
        await this.saveCurrentTagFilter();
        
        // 预测点击后的标签状态并保存
        let predictedTags: string[] = [];
        let predictedSortType = this.getCurrentSortType();
        
        if (tagLink) {
          // 点击标签链接，解析目标URL的标签
          const href = tagLink.href;
          const urlParams = new URLSearchParams(new URL(href).search);
          const tagParam = urlParams.get('t');
          predictedTags = tagParam ? tagParam.split(',').filter(t => t.length > 0) : [];
          const sortParam = urlParams.get('sort_type');
          if (sortParam) predictedSortType = parseInt(sortParam, 10);
        } else if (deleteButton) {
          // 点击删除按钮，解析onclick中的标签
          const onclick = deleteButton.getAttribute('onclick');
          if (onclick) {
            const match = onclick.match(/[?&]t=([^&']+)/);
            if (match) {
              predictedTags = match[1].split(',').filter(t => t.length > 0);
            }
          }
        }
        
        // 保存预测的标签状态
        if (predictedTags.length > 0) {
          const filterData: ActorTagFilter = {
            tags: predictedTags,
            sortType: predictedSortType,
            timestamp: Date.now()
          };
          
          const storedFilters = await getValue(this.storageKey, '{}');
          const tagFilters = JSON.parse(storedFilters);
          tagFilters[this.currentActorId] = filterData;
          await setValue(this.storageKey, JSON.stringify(tagFilters));
          
          console.log(`💾 预保存tag过滤器: ${predictedTags.join(',')} (排序: ${predictedSortType})`);
        }
      }
    });
    
    // 监听页面卸载事件，保存最终状态
    window.addEventListener('beforeunload', async () => {
      await this.saveCurrentTagFilter();
    });
  }

  /**
   * 保存当前标签过滤器到存储
   */
  async saveCurrentTagFilter(): Promise<void> {
    if (!this.isActorPage || !this.currentActorId) return;

    try {
      const currentTags = this.getCurrentTagsFromUrl();
      const currentSort = this.getCurrentSortType();

      // 获取现有数据
      const existingData = await getValue(this.storageKey, '{}');
      const tagFilters = JSON.parse(existingData);

      // 保存当前演员的过滤器
      tagFilters[this.currentActorId] = {
        tags: currentTags,
        sortType: currentSort,
        timestamp: Date.now()
      };

      // 限制存储数量，只保留最新的10个
      const entries = Object.entries(tagFilters);
      if (entries.length > 10) {
        entries.sort((a: any, b: any) => b[1].timestamp - a[1].timestamp);
        const limitedEntries = entries.slice(0, 10);
        const limitedTagFilters: any = {};
        limitedEntries.forEach(([key, value]) => {
          limitedTagFilters[key] = value;
        });
        await setValue(this.storageKey, JSON.stringify(limitedTagFilters));
      } else {
        await setValue(this.storageKey, JSON.stringify(tagFilters));
      }

      // 保存上次应用的标签用于设置页面显示
      if (currentTags.length > 0) {
        await setValue('lastAppliedActorTags', currentTags.join(','));
      }

      console.log(`[ActorEnhancement] 已保存演员 ${this.currentActorId} 的标签过滤器:`, { tags: currentTags, sort: currentSort });
    } catch (error) {
      console.error('[ActorEnhancement] 保存标签过滤器失败:', error);
    }
  }

  // 公共方法：清除保存的过滤器
  async clearSavedFilters(): Promise<void> {
    try {
      await setValue(this.storageKey, {});
      showToast('已清除所有保存的过滤器', 'success');
    } catch (error) {
      console.error('清除保存的过滤器失败:', error);
      showToast('清除过滤器失败', 'error');
    }
  }

  // 公共方法：获取当前状态
  getStatus(): any {
    return {
      enabled: this.config.enabled,
      isActorPage: this.isActorPage,
      currentActorId: this.currentActorId,
      availableTags: Array.from(this.availableTags.entries()),
      currentTags: this.getCurrentTagsFromUrl(),
      currentSortType: this.getCurrentSortType()
    };
  }

  destroy(): void {
    // 保存当前状态
    this.saveCurrentTagFilter();
    // 清理事件监听器等资源
    console.log('🎭 演员页增强功能已销毁');
  }
}

// 创建单例实例
export const actorEnhancementManager = new ActorEnhancementManager();

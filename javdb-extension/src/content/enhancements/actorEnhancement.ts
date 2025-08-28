/**
 * 演员页增强功能
 * 自动保存和应用标签过滤器，支持跨演员页面的过滤器同步
 */

import { getValue, setValue } from '../../utils/storage';
import { showToast } from '../toast';

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
    defaultTags: ['s', 'd', 'c', 'b'], // 單體作品 + 含磁鏈 + 含字幕 + 可播放
    defaultSortType: 0
  };

  private isActorPage = false;
  private currentActorId = '';
  private availableTags: Map<string, string> = new Map(); // tag code -> tag name
  private storageKey = 'actorTagFilters';

  updateConfig(newConfig: Partial<ActorEnhancementConfig>): void {
    this.config = { ...this.config, ...newConfig };
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

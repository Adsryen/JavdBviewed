/**
 * 页面元素保护器
 */

import { getPrivacyManager } from '../../services/privacy';

export class ElementProtector {
    private static instance: ElementProtector;
    private protectedElements: Set<HTMLElement> = new Set();
    private observer: MutationObserver | null = null;
    private isActive = false;

    // 默认保护的元素选择器 - 针对Dashboard和JavDB网站结构
    private defaultSelectors = [
        // Dashboard 番号库 - 完整保护
        '.video-item',                    // 整个视频条目
        '.video-title',                   // 视频标题
        '.video-id-link',                 // 番号链接
        '.video-id-text',                 // 番号文本
        '.video-tags',                    // 标签容器
        '.video-tag',                     // 单个标签

        // Dashboard 演员库 - 完整保护
        '.actor-card',                    // 整个演员卡片
        '.actor-card-avatar',             // 演员头像容器
        '.actor-avatar',                  // 演员头像
        '.actor-avatar-img',              // 演员头像图片
        '.actor-card-info',               // 演员信息
        '.actor-card-name',               // 演员名字
        '.actor-name-text',               // 演员名字文本
        '.actor-card-aliases',            // 演员别名
        '.actor-alias',                   // 单个别名

        // JavDB网站内容 - 视频相关
        '.movie-list .item',
        '.movie-list .cover',
        '.movie-list .title',
        '.movie-list .video-title',
        '.grid-item',
        '.grid-item .cover',
        '.grid-item .title',
        '.video-cover',
        '.video-cover img',
        '.cover-container',
        '.poster',
        '.thumbnail',
        '.movie-panel',
        '.video-meta',
        '.video-description',
        '.video-meta-panel',
        '.video-detail',
        '.movie-panel-info',
        '.preview-images',
        '.sample-waterfall',
        '.preview-video',
        '.video-panel',

        // JavDB网站内容 - 演员相关
        '.actor-list',
        '.actor-list .item',
        '.actor-list .avatar',
        '.actor-list .name',
        '.actor-name',
        '.actor-avatar img',
        '.actor-cover',
        '.actor-info',
        '.actor-section',
        '.actor-panel',
        '.performer-list',
        '.performer-avatar',
        '.performer-name',

        // 页面背景和横幅
        '.hero-banner',
        '.backdrop',
        '.hero-video',
        '.banner-image',

        // 用户相关
        '.user-profile',
        '.user-avatar',
        '.user-avatar img',
        '.user-stats',
        '.viewed-records',
        '.collection-list',
        '.watch-history',
        '.favorite-list',

        // 搜索结果
        '.search-result',
        '.search-item',
        '.search-history',
        '.search-suggestions',

        // 标签和分类
        '.tag-list',
        '.genre-list',
        '.category-list',
        '.label-list',

        // 评论和评分
        '.review-list',
        '.comment-list',
        '.rating-section',

        // 通用敏感内容标记
        '[data-sensitive]',
        '[data-private]',
        '.sensitive-content',

        // 可能的其他JavDB元素（根据实际页面结构）
        '.item-image',
        '.card-image',
        '.media-object',
        '.avatar',
        'img[src*="cover"]',
        'img[src*="avatar"]',
        'img[src*="thumb"]'
    ];

    private constructor() {}

    public static getInstance(): ElementProtector {
        if (!ElementProtector.instance) {
            ElementProtector.instance = new ElementProtector();
        }
        return ElementProtector.instance;
    }

    /**
     * 启动元素保护
     */
    async start(customSelectors?: string[]): Promise<void> {
        if (this.isActive) {
            return;
        }

        try {
            const selectors = customSelectors || this.defaultSelectors;
            
            // 保护现有元素
            await this.protectExistingElements(selectors);
            
            // 设置观察器监听新元素
            this.setupMutationObserver(selectors);
            
            this.isActive = true;
            console.log('Element protector started');
        } catch (error) {
            console.error('Failed to start element protector:', error);
        }
    }

    /**
     * 停止元素保护
     */
    stop(): void {
        if (!this.isActive) {
            return;
        }

        // 停止观察器
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // 清除保护标记
        this.protectedElements.clear();
        
        this.isActive = false;
        console.log('Element protector stopped');
    }

    /**
     * 保护现有元素
     */
    private async protectExistingElements(selectors: string[]): Promise<void> {
        console.log('Initializing content privacy features...');

        let totalProtected = 0;

        // 使用选择器保护元素
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);

                // 只记录找到元素的选择器，减少日志输出
                if (elements.length > 0) {
                    elements.forEach(element => {
                        if (element instanceof HTMLElement) {
                            this.markElementAsProtected(element);
                            totalProtected++;
                        }
                    });
                }
            } catch (error) {
                console.warn(`Invalid selector: ${selector}`, error);
            }
        }

        if (totalProtected > 0) {
            console.log(`Protected ${totalProtected} elements for privacy`);
        }

        // 添加Dashboard特定的智能检测
        const dashboardElements = this.detectDashboardSensitiveElements();
        dashboardElements.forEach(element => {
            if (!this.protectedElements.has(element)) {
                this.markElementAsProtected(element);
                console.log('Protected dashboard element:', element.className);
            }
        });

        // 添加JavDB特定的智能检测
        const smartDetectedElements = this.detectJavDBSensitiveElements();
        let smartProtectedCount = 0;
        smartDetectedElements.forEach(element => {
            if (!this.protectedElements.has(element)) {
                this.markElementAsProtected(element);
                smartProtectedCount++;
            }
        });

        if (smartProtectedCount > 0) {
            console.log(`Protected ${smartProtectedCount} smart detected elements`);
        }
    }

    /**
     * 检测Dashboard敏感元素
     */
    private detectDashboardSensitiveElements(): HTMLElement[] {
        const elements: HTMLElement[] = [];

        // 检测是否在Dashboard页面
        if (!window.location.href.includes('dashboard.html')) {
            return elements;
        }

        // 静默检测Dashboard敏感元素

        // 检测番号库元素
        const videoItems = document.querySelectorAll('li[class*="video"], .video-item, [data-video-id]');
        videoItems.forEach(item => {
            if (item instanceof HTMLElement) {
                elements.push(item);

                // 查找内部的标题、番号、标签元素
                const title = item.querySelector('.video-title, [class*="title"]');
                const videoId = item.querySelector('.video-id-link, [class*="video-id"], a[href*="/v/"]');
                const tags = item.querySelectorAll('.video-tag, [class*="tag"]');

                if (title instanceof HTMLElement) elements.push(title);
                if (videoId instanceof HTMLElement) elements.push(videoId);
                tags.forEach(tag => {
                    if (tag instanceof HTMLElement) elements.push(tag);
                });
            }
        });

        // 检测演员库元素
        const actorCards = document.querySelectorAll('.actor-card, [class*="actor-card"], [data-actor-id]');
        actorCards.forEach(card => {
            if (card instanceof HTMLElement) {
                elements.push(card); // 直接保护整个演员卡片

                // 额外保护内部元素
                const avatar = card.querySelector('.actor-avatar, [class*="avatar"], img');
                const name = card.querySelector('.actor-name, [class*="name"]');
                const aliases = card.querySelectorAll('.actor-alias, [class*="alias"]');

                if (avatar instanceof HTMLElement) elements.push(avatar);
                if (name instanceof HTMLElement) elements.push(name);
                aliases.forEach(alias => {
                    if (alias instanceof HTMLElement) elements.push(alias);
                });
            }
        });

        // 通用检测：包含敏感文本的元素
        const textElements = document.querySelectorAll('span, div, a, p');
        textElements.forEach(el => {
            if (el instanceof HTMLElement && this.containsDashboardSensitiveText(el)) {
                elements.push(el);
            }
        });

        // 静默完成Dashboard敏感元素检测
        return elements;
    }

    /**
     * 检查是否包含Dashboard敏感文本
     */
    private containsDashboardSensitiveText(element: HTMLElement): boolean {
        const text = element.textContent?.toLowerCase() || '';

        // 检查番号模式
        const codePattern = /[a-z]{2,5}-\d{2,4}/i;
        if (codePattern.test(text)) {
            return true;
        }

        // 检查是否在敏感容器中
        const sensitiveContainers = [
            '.video-item', '.actor-card', '.video-list', '.actor-list',
            '[data-video-id]', '[data-actor-id]'
        ];

        return sensitiveContainers.some(selector => element.closest(selector) !== null);
    }

    /**
     * 智能检测JavDB敏感元素
     */
    private detectJavDBSensitiveElements(): HTMLElement[] {
        const elements: HTMLElement[] = [];

        // 检测所有图片元素
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (this.isJavDBSensitiveImage(img)) {
                elements.push(img as HTMLElement);
                // 同时保护父容器
                const parent = img.closest('.item, .card, .grid-item, .movie-item, .actor-item');
                if (parent instanceof HTMLElement) {
                    elements.push(parent);
                }
            }
        });

        // 检测包含敏感文本的元素
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .name, .text, a[href*="/v/"], a[href*="/actors/"]');
        textElements.forEach(el => {
            if (el instanceof HTMLElement && this.containsSensitiveText(el)) {
                elements.push(el);
            }
        });

        // 检测卡片式布局
        const cards = document.querySelectorAll('.card, .item, .grid-item, [class*="movie"], [class*="actor"], [class*="video"]');
        cards.forEach(card => {
            if (card instanceof HTMLElement && this.isJavDBContentCard(card)) {
                elements.push(card);
            }
        });

        return elements;
    }

    /**
     * 判断是否为JavDB敏感图片
     */
    private isJavDBSensitiveImage(img: HTMLImageElement): boolean {
        const src = img.src.toLowerCase();
        const alt = img.alt.toLowerCase();
        const className = img.className.toLowerCase();

        // 检查图片源
        const sensitivePatterns = [
            'cover', 'thumb', 'avatar', 'poster', 'preview',
            'sample', 'screenshot', 'banner', 'backdrop', 'pic'
        ];

        return sensitivePatterns.some(pattern =>
            src.includes(pattern) || alt.includes(pattern) || className.includes(pattern)
        ) || img.closest('.movie-list, .actor-list, .grid, .hero, .video-panel, .actor-panel') !== null;
    }

    /**
     * 判断是否包含敏感文本
     */
    private containsSensitiveText(element: HTMLElement): boolean {
        const text = element.textContent?.toLowerCase() || '';
        const href = (element as HTMLAnchorElement).href || '';

        // 检查是否包含番号模式 (如: ABC-123, ABCD-123等)
        const codePattern = /[a-z]{2,5}-\d{2,4}/i;
        if (codePattern.test(text)) {
            return true;
        }

        // 检查链接是否指向视频或演员页面
        if (href.includes('/v/') || href.includes('/actors/')) {
            return true;
        }

        // 检查是否在敏感容器中
        return element.closest('.movie-list, .actor-list, .video-panel, .actor-panel, .search-result') !== null;
    }

    /**
     * 判断是否为JavDB内容卡片
     */
    private isJavDBContentCard(element: HTMLElement): boolean {
        // 检查是否包含图片和文本的组合
        const hasImage = element.querySelector('img') !== null;
        const hasTitle = element.querySelector('.title, .name, h1, h2, h3, h4, h5, h6, a') !== null;

        // 检查是否在内容列表中
        const inContentList = element.closest('.movie-list, .actor-list, .grid, .search-result, .container') !== null;

        // 检查类名是否包含内容相关关键词
        const className = element.className.toLowerCase();
        const contentKeywords = ['movie', 'actor', 'video', 'item', 'card', 'grid'];
        const hasContentClass = contentKeywords.some(keyword => className.includes(keyword));

        return (hasImage && hasTitle) || inContentList || hasContentClass;
    }

    /**
     * 设置变化观察器
     */
    private setupMutationObserver(selectors: string[]): void {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // 检查新增的节点
                mutation.addedNodes.forEach(node => {
                    if (node instanceof HTMLElement) {
                        this.checkAndProtectElement(node, selectors);
                        
                        // 检查子元素
                        selectors.forEach(selector => {
                            try {
                                const childElements = node.querySelectorAll(selector);
                                childElements.forEach(child => {
                                    if (child instanceof HTMLElement) {
                                        this.markElementAsProtected(child);
                                    }
                                });
                            } catch (error) {
                                // 忽略无效选择器
                            }
                        });
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 检查并保护元素
     */
    private checkAndProtectElement(element: HTMLElement, selectors: string[]): void {
        for (const selector of selectors) {
            try {
                if (element.matches(selector)) {
                    this.markElementAsProtected(element);
                    break;
                }
            } catch (error) {
                // 忽略无效选择器
            }
        }
    }

    /**
     * 标记元素为受保护
     */
    private markElementAsProtected(element: HTMLElement): void {
        if (this.protectedElements.has(element)) {
            return;
        }

        // 添加保护标记
        element.setAttribute('data-privacy-protected', 'true');
        element.classList.add('privacy-protected');
        
        // 添加到保护集合
        this.protectedElements.add(element);

        // 如果当前处于模糊状态，立即应用模糊
        this.applyProtectionIfNeeded(element);
    }

    /**
     * 如果需要，应用保护效果
     */
    private async applyProtectionIfNeeded(element: HTMLElement): Promise<void> {
        try {
            const privacyManager = getPrivacyManager();
            const state = privacyManager.getState();
            
            if (state.isBlurred) {
                // 应用模糊效果到新元素
                this.applyBlurToElement(element);
            }
        } catch (error) {
            console.error('Failed to apply protection:', error);
        }
    }

    /**
     * 对单个元素应用模糊
     */
    private applyBlurToElement(element: HTMLElement): void {
        element.style.filter = 'blur(5px)';
        element.style.transition = 'filter 0.3s ease';
        element.style.userSelect = 'none';
        element.style.pointerEvents = 'none';
    }

    /**
     * 获取所有受保护的元素
     */
    getProtectedElements(): HTMLElement[] {
        return Array.from(this.protectedElements);
    }

    /**
     * 检查元素是否受保护
     */
    isElementProtected(element: HTMLElement): boolean {
        return this.protectedElements.has(element) || 
               element.hasAttribute('data-privacy-protected');
    }

    /**
     * 添加自定义保护元素
     */
    addProtectedElement(element: HTMLElement): void {
        this.markElementAsProtected(element);
    }

    /**
     * 移除元素保护
     */
    removeProtectedElement(element: HTMLElement): void {
        element.removeAttribute('data-privacy-protected');
        element.classList.remove('privacy-protected');
        element.style.filter = '';
        element.style.transition = '';
        element.style.userSelect = '';
        element.style.pointerEvents = '';
        
        this.protectedElements.delete(element);
    }

    /**
     * 更新保护选择器
     */
    updateSelectors(newSelectors: string[]): void {
        if (!this.isActive) {
            return;
        }

        // 重新启动保护
        this.stop();
        this.start(newSelectors);
    }

    /**
     * 获取页面敏感内容统计
     */
    getSensitiveContentStats(): {
        totalProtected: number;
        byType: Record<string, number>;
        visibleProtected: number;
    } {
        const stats = {
            totalProtected: this.protectedElements.size,
            byType: {} as Record<string, number>,
            visibleProtected: 0
        };

        this.protectedElements.forEach(element => {
            // 统计可见的受保护元素
            if (this.isElementVisible(element)) {
                stats.visibleProtected++;
            }

            // 按类型统计
            const tagName = element.tagName.toLowerCase();
            stats.byType[tagName] = (stats.byType[tagName] || 0) + 1;
        });

        return stats;
    }

    /**
     * 检查元素是否可见
     */
    private isElementVisible(element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        
        return rect.width > 0 && 
               rect.height > 0 && 
               style.visibility !== 'hidden' && 
               style.display !== 'none' &&
               rect.top < window.innerHeight &&
               rect.bottom > 0;
    }

    /**
     * 临时显示所有受保护元素
     */
    temporaryShowAll(duration: number = 10): void {
        this.protectedElements.forEach(element => {
            const originalFilter = element.style.filter;
            element.style.filter = '';
            
            setTimeout(() => {
                element.style.filter = originalFilter;
            }, duration * 1000);
        });
    }

    /**
     * 导出保护配置
     */
    exportProtectionConfig(): {
        selectors: string[];
        protectedCount: number;
        timestamp: number;
    } {
        return {
            selectors: this.defaultSelectors,
            protectedCount: this.protectedElements.size,
            timestamp: Date.now()
        };
    }
}

/**
 * 获取元素保护器实例
 */
export function getElementProtector(): ElementProtector {
    return ElementProtector.getInstance();
}

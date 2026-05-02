/**
 * 帮助面板管理器
 * 负责管理帮助面板的状态、渲染和交互
 */

import { HelpCategory, HELP_CATEGORIES, getDefaultCategoryId, getCategoryById } from './helpCategories';
import { populateCategoriesWithContent } from './helpContentMapper';

/**
 * 帮助面板状态接口
 */
interface HelpPanelState {
    isVisible: boolean;
    currentCategory: string;
    isMobileLayout: boolean;
}

interface HelpQuickAction {
    label: string;
    categoryId: string;
    targetText?: string;
}

interface HelpSearchResult {
    categoryId: string;
    categoryName: string;
    anchorId: string;
    heading: string;
    snippet: string;
}

const HELP_LAST_CATEGORY_KEY = 'jav-helper.help.last-category';
const HELP_SCROLL_POSITIONS_KEY = 'jav-helper.help.scroll-positions';

const HELP_QUICK_ACTIONS: HelpQuickAction[] = [
    { label: '同步数据', categoryId: 'account-sync', targetText: '数据同步' },
    { label: '备份到 WebDAV', categoryId: 'webdav', targetText: '常用操作' },
    { label: '推送到 115', categoryId: 'drive115', targetText: '115 网盘集成' },
    { label: '生成观影报告', categoryId: 'ai-features', targetText: '报告增强' },
    { label: '找回隐私密码', categoryId: 'privacy', targetText: '密码恢复' }
];

/**
 * 帮助面板管理器类
 */
export class HelpPanelManager {
    private panelElement: HTMLElement;
    private sidebarElement: HTMLElement | null = null;
    private contentElement: HTMLElement | null = null;
    private mainElement: HTMLElement | null = null;
    private outlineElement: HTMLElement | null = null;
    private searchInput: HTMLInputElement | null = null;
    private searchResultsElement: HTMLElement | null = null;
    private quickActionsElement: HTMLElement | null = null;
    private categories: HelpCategory[] = [];
    private state: HelpPanelState;
    private resizeObserver: ResizeObserver | null = null;
    private resizeTimeout: number | null = null;
    private scrollPositions: Record<string, number> = {};
    private contentScrollHandler: (() => void) | null = null;
    private activeHeadingHighlightTimer: number | null = null;

    constructor(panelElement: HTMLElement) {
        this.panelElement = panelElement;
        this.state = {
            isVisible: false,
            currentCategory: this.loadLastCategory(),
            isMobileLayout: false
        };
        this.scrollPositions = this.loadScrollPositions();
    }

    /**
     * 获取当前选中的分类 ID
     */
    get currentCategory(): string {
        return this.state.currentCategory;
    }

    /**
     * 获取是否为移动布局
     */
    get isMobileLayout(): boolean {
        return this.state.isMobileLayout;
    }

    /**
     * 初始化帮助面板
     */
    public async init(helpContentHtml: string): Promise<void> {
        try {
            // 检查必需的 DOM 元素
            if (!this.panelElement) {
                console.error('[HelpPanelManager] 面板元素不存在');
                return;
            }

            // 填充分类内容
            this.categories = populateCategoriesWithContent(HELP_CATEGORIES, helpContentHtml);

            // 获取或创建容器元素
            const bodyContainer = this.panelElement.querySelector('.help-body-container') as HTMLElement;
            if (!bodyContainer) {
                console.error('[HelpPanelManager] .help-body-container 元素不存在');
                return;
            }

            // 渲染侧边栏和内容区域
            this.renderSidebar(bodyContainer);
            this.renderContent(bodyContainer);

            // 绑定事件
            this.bindEvents();

            // 初始化布局模式
            this.updateLayoutMode();

            // 切换到默认分类
            this.switchCategory(this.state.currentCategory);

            console.debug('[HelpPanelManager] 初始化完成');
        } catch (error) {
            console.error('[HelpPanelManager] 初始化失败:', error);
        }
    }

    /**
     * 渲染侧边栏
     */
    private renderSidebar(container: HTMLElement): void {
        // 创建侧边栏容器
        const sidebar = document.createElement('div');
        sidebar.className = 'help-sidebar';
        sidebar.setAttribute('role', 'navigation');
        sidebar.setAttribute('aria-label', '帮助分类导航');

        // 生成分类项
        this.categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'help-category-item';
            item.setAttribute('data-category-id', category.id);
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', category.name);

            const icon = document.createElement('i');
            icon.className = `fas ${category.icon}`;

            const name = document.createElement('span');
            name.textContent = category.name;

            item.appendChild(icon);
            item.appendChild(name);
            sidebar.appendChild(item);
        });

        this.sidebarElement = sidebar;
        container.appendChild(sidebar);
    }

    /**
     * 渲染内容区域
     */
    private renderContent(container: HTMLElement): void {
        const main = document.createElement('div');
        main.className = 'help-main';

        const toolbar = document.createElement('div');
        toolbar.className = 'help-toolbar';

        const searchWrap = document.createElement('div');
        searchWrap.className = 'help-search-wrap';

        const searchIcon = document.createElement('i');
        searchIcon.className = 'fas fa-search';

        const searchInput = document.createElement('input');
        searchInput.className = 'help-search-input';
        searchInput.type = 'search';
        searchInput.placeholder = '搜索功能、页面名、关键词…';
        searchInput.setAttribute('aria-label', '搜索帮助内容');

        searchWrap.appendChild(searchIcon);
        searchWrap.appendChild(searchInput);
        toolbar.appendChild(searchWrap);

        const quickActions = document.createElement('div');
        quickActions.className = 'help-quick-actions';
        HELP_QUICK_ACTIONS.forEach((action) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'help-quick-action';
            button.setAttribute('data-category-id', action.categoryId);
            if (action.targetText) button.setAttribute('data-target-text', action.targetText);
            button.textContent = action.label;
            quickActions.appendChild(button);
        });
        toolbar.appendChild(quickActions);

        const searchResults = document.createElement('div');
        searchResults.className = 'help-search-results';
        searchResults.style.display = 'none';

        const body = document.createElement('div');
        body.className = 'help-main-body';

        // 创建内容容器
        const content = document.createElement('div');
        content.className = 'help-content';
        content.setAttribute('role', 'main');

        // 为每个分类创建内容区域
        this.categories.forEach(category => {
            const categoryContent = document.createElement('div');
            categoryContent.className = 'help-category-content';
            categoryContent.setAttribute('data-category-id', category.id);
            categoryContent.style.display = 'none';
            categoryContent.innerHTML = category.content || '<p style="color:#999;">暂无内容</p>';
            this.decorateCategoryContent(categoryContent, category.id);

            content.appendChild(categoryContent);
        });

        const outline = document.createElement('div');
        outline.className = 'help-outline';
        outline.innerHTML = '<div class="help-outline-title">本页导航</div><div class="help-outline-list"></div>';

        body.appendChild(content);
        body.appendChild(outline);
        main.appendChild(toolbar);
        main.appendChild(searchResults);
        main.appendChild(body);

        this.mainElement = main;
        this.contentElement = content;
        this.outlineElement = outline;
        this.searchInput = searchInput;
        this.searchResultsElement = searchResults;
        this.quickActionsElement = quickActions;
        container.appendChild(main);
    }

    /**
     * 切换到指定分类
     */
    public switchCategory(categoryId: string): void {
        // 验证分类 ID
        const category = getCategoryById(categoryId);
        if (!category) {
            console.warn(`[HelpPanelManager] 无效的分类 ID: ${categoryId}，回退到默认分类`);
            categoryId = getDefaultCategoryId();
        }

        // 更新状态
        this.state.currentCategory = categoryId;
        this.persistLastCategory(categoryId);

        // 更新侧边栏选中状态
        this.updateSidebarActiveState(categoryId);

        // 更新内容显示
        this.updateContentDisplay(categoryId);
        this.renderOutline(categoryId);
        this.restoreScrollPosition(categoryId);
    }

    /**
     * 更新侧边栏选中状态
     */
    private updateSidebarActiveState(categoryId: string): void {
        if (!this.sidebarElement) return;

        const items = this.sidebarElement.querySelectorAll('.help-category-item');
        items.forEach(item => {
            const itemCategoryId = item.getAttribute('data-category-id');
            if (itemCategoryId === categoryId) {
                item.classList.add('active');
                item.setAttribute('aria-selected', 'true');
            } else {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
            }
        });
    }

    /**
     * 更新内容显示
     */
    private updateContentDisplay(categoryId: string): void {
        if (!this.contentElement) return;

        const contents = this.contentElement.querySelectorAll('.help-category-content');
        contents.forEach(content => {
            const contentCategoryId = content.getAttribute('data-category-id');
            if (contentCategoryId === categoryId) {
                (content as HTMLElement).style.display = 'block';
                content.classList.add('visible');
            } else {
                (content as HTMLElement).style.display = 'none';
                content.classList.remove('visible');
            }
        });
    }

    private decorateCategoryContent(categoryContent: HTMLElement, categoryId: string): void {
        const headings = categoryContent.querySelectorAll('h3, h4');
        headings.forEach((heading, index) => {
            const text = heading.textContent?.trim() || `${categoryId}-${index}`;
            const anchorId = this.buildAnchorId(categoryId, text, index);
            heading.setAttribute('data-anchor-id', anchorId);
            heading.id = anchorId;
        });
    }

    private buildAnchorId(categoryId: string, text: string, index: number): string {
        const slug = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 48);
        return `help-${categoryId}-${slug || 'section'}-${index}`;
    }

    private renderOutline(categoryId: string): void {
        if (!this.contentElement || !this.outlineElement) return;

        const categoryContent = this.contentElement.querySelector(`.help-category-content[data-category-id="${categoryId}"]`) as HTMLElement | null;
        const list = this.outlineElement.querySelector('.help-outline-list') as HTMLElement | null;
        if (!categoryContent || !list) return;

        const headings = Array.from(categoryContent.querySelectorAll('h3, h4')) as HTMLElement[];
        list.innerHTML = '';

        headings.forEach((heading) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `help-outline-item help-outline-${heading.tagName.toLowerCase()}`;
            button.setAttribute('data-anchor-id', heading.id);
            button.textContent = heading.textContent?.trim() || '未命名小节';
            list.appendChild(button);
        });

        this.updateActiveOutlineItem();
    }

    /**
     * 绑定事件监听器
     */
    private bindEvents(): void {
        // 绑定侧边栏点击事件（使用事件委托）
        if (this.sidebarElement) {
            this.sidebarElement.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const item = target.closest('.help-category-item') as HTMLElement;
                if (item) {
                    const categoryId = item.getAttribute('data-category-id');
                    if (categoryId) {
                        this.switchCategory(categoryId);
                    }
                }
            });

            // 绑定键盘事件
            this.sidebarElement.addEventListener('keydown', (e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('help-category-item')) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const categoryId = target.getAttribute('data-category-id');
                        if (categoryId) {
                            this.switchCategory(categoryId);
                        }
                    }
                }
            });
        }

        if (this.quickActionsElement) {
            this.quickActionsElement.addEventListener('click', (e) => {
                const target = (e.target as HTMLElement).closest('.help-quick-action') as HTMLElement | null;
                if (!target) return;
                const categoryId = target.getAttribute('data-category-id') || getDefaultCategoryId();
                const targetText = target.getAttribute('data-target-text') || '';
                this.switchCategory(categoryId);
                if (targetText) {
                    window.setTimeout(() => this.scrollToHeadingText(categoryId, targetText), 20);
                }
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.handleSearch(this.searchInput?.value || '');
            });

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.searchInput) {
                    this.searchInput.value = '';
                    this.handleSearch('');
                }
            });
        }

        if (this.searchResultsElement) {
            this.searchResultsElement.addEventListener('click', (e) => {
                const item = (e.target as HTMLElement).closest('.help-search-result') as HTMLElement | null;
                if (!item) return;
                const categoryId = item.getAttribute('data-category-id') || getDefaultCategoryId();
                const anchorId = item.getAttribute('data-anchor-id') || '';
                this.switchCategory(categoryId);
                window.setTimeout(() => this.scrollToAnchor(anchorId), 20);
            });
        }

        if (this.outlineElement) {
            this.outlineElement.addEventListener('click', (e) => {
                const item = (e.target as HTMLElement).closest('.help-outline-item') as HTMLElement | null;
                if (!item) return;
                const anchorId = item.getAttribute('data-anchor-id') || '';
                this.scrollToAnchor(anchorId);
            });
        }

        if (this.contentElement) {
            this.contentScrollHandler = () => {
                this.saveCurrentScrollPosition();
                this.updateActiveOutlineItem();
            };
            this.contentElement.addEventListener('scroll', this.contentScrollHandler, { passive: true });
        }

        // 监听窗口尺寸变化
        this.setupResizeObserver();
    }

    private handleSearch(rawQuery: string): void {
        const query = rawQuery.trim().toLowerCase();
        this.filterSidebar(query);

        if (!this.searchResultsElement) return;

        if (!query) {
            this.searchResultsElement.style.display = 'none';
            this.searchResultsElement.innerHTML = '';
            return;
        }

        const results = this.searchInCategories(query);
        if (!results.length) {
            this.searchResultsElement.innerHTML = '<div class="help-search-empty">没有找到匹配内容，换个关键词试试。</div>';
            this.searchResultsElement.style.display = 'block';
            return;
        }

        this.searchResultsElement.innerHTML = results.map((result) => `
            <button type="button" class="help-search-result" data-category-id="${result.categoryId}" data-anchor-id="${result.anchorId || ''}">
                <span class="help-search-result-category">${result.categoryName}</span>
                <span class="help-search-result-title">${result.heading}</span>
                <span class="help-search-result-snippet">${result.snippet}</span>
            </button>
        `).join('');
        this.searchResultsElement.style.display = 'block';
    }

    private filterSidebar(query: string): void {
        if (!this.sidebarElement) return;
        const items = this.sidebarElement.querySelectorAll('.help-category-item');
        items.forEach((item) => {
            const categoryId = item.getAttribute('data-category-id') || '';
            const category = this.categories.find((c) => c.id === categoryId);
            const haystack = `${category?.name || ''} ${(category?.content || '').replace(/<[^>]+>/g, ' ')}`.toLowerCase();
            (item as HTMLElement).style.display = !query || haystack.includes(query) ? '' : 'none';
        });
    }

    private searchInCategories(query: string): HelpSearchResult[] {
        const results: HelpSearchResult[] = [];

        this.categories.forEach((category) => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = category.content || '';
            const headings = Array.from(wrapper.querySelectorAll('h3, h4')) as HTMLElement[];

            headings.forEach((heading, index) => {
                const sectionText = [heading.textContent || ''];
                let next = heading.nextElementSibling;
                while (next && !/^H[34]$/.test(next.tagName)) {
                    sectionText.push(next.textContent || '');
                    next = next.nextElementSibling;
                }

                const merged = sectionText.join(' ').replace(/\s+/g, ' ').trim();
                if (!merged.toLowerCase().includes(query)) return;

                const anchorId = this.buildAnchorId(category.id, heading.textContent?.trim() || 'section', index);
                const hitIndex = merged.toLowerCase().indexOf(query);
                const snippetStart = Math.max(0, hitIndex - 24);
                const snippet = merged.slice(snippetStart, snippetStart + 88).trim();

                results.push({
                    categoryId: category.id,
                    categoryName: category.name,
                    anchorId,
                    heading: heading.textContent?.trim() || category.name,
                    snippet: snippet || merged.slice(0, 88)
                });
            });
        });

        return results.slice(0, 12);
    }

    private scrollToHeadingText(categoryId: string, targetText: string): void {
        if (!this.contentElement) return;
        const categoryContent = this.contentElement.querySelector(`.help-category-content[data-category-id="${categoryId}"]`) as HTMLElement | null;
        if (!categoryContent) return;
        const headings = Array.from(categoryContent.querySelectorAll('h3, h4')) as HTMLElement[];
        const matched = headings.find((heading) => (heading.textContent || '').includes(targetText));
        if (matched) {
            this.scrollToAnchor(matched.id);
        }
    }

    private scrollToAnchor(anchorId: string): void {
        if (!anchorId || !this.contentElement) return;
        const anchor = this.contentElement.querySelector(`#${CSS.escape(anchorId)}`) as HTMLElement | null;
        if (!anchor) return;
        const top = this.getScrollTopForElement(anchor);
        this.contentElement.scrollTo({ top, behavior: 'smooth' });
        this.highlightHeading(anchor);
    }

    private getScrollTopForElement(element: HTMLElement): number {
        if (!this.contentElement) return 0;
        const contentRect = this.contentElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - contentRect.top + this.contentElement.scrollTop;
        return Math.max(0, relativeTop - 12);
    }

    private highlightHeading(heading: HTMLElement): void {
        if (this.contentElement) {
            this.contentElement.querySelectorAll('.help-heading-highlight').forEach((el) => {
                el.classList.remove('help-heading-highlight');
            });
        }

        heading.classList.add('help-heading-highlight');

        if (this.activeHeadingHighlightTimer) {
            clearTimeout(this.activeHeadingHighlightTimer);
        }

        this.activeHeadingHighlightTimer = window.setTimeout(() => {
            heading.classList.remove('help-heading-highlight');
            this.activeHeadingHighlightTimer = null;
        }, 1600);
    }

    private updateActiveOutlineItem(): void {
        if (!this.contentElement || !this.outlineElement) return;
        const categoryContent = this.contentElement.querySelector(`.help-category-content[data-category-id="${this.state.currentCategory}"]`) as HTMLElement | null;
        if (!categoryContent) return;

        const headings = Array.from(categoryContent.querySelectorAll('h3, h4')) as HTMLElement[];
        if (!headings.length) return;

        const scrollTop = this.contentElement.scrollTop;
        let currentId = headings[0].id;
        headings.forEach((heading) => {
            if (this.getScrollTopForElement(heading) <= scrollTop + 20) {
                currentId = heading.id;
            }
        });

        const items = this.outlineElement.querySelectorAll('.help-outline-item');
        items.forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-anchor-id') === currentId);
        });
    }

    private saveCurrentScrollPosition(): void {
        if (!this.contentElement) return;
        this.scrollPositions[this.state.currentCategory] = this.contentElement.scrollTop;
        try {
            localStorage.setItem(HELP_SCROLL_POSITIONS_KEY, JSON.stringify(this.scrollPositions));
        } catch {}
    }

    private restoreScrollPosition(categoryId: string): void {
        if (!this.contentElement) return;
        const top = this.scrollPositions[categoryId] || 0;
        this.contentElement.scrollTop = top;
        this.updateActiveOutlineItem();
    }

    private loadLastCategory(): string {
        try {
            const saved = localStorage.getItem(HELP_LAST_CATEGORY_KEY);
            if (saved && getCategoryById(saved)) return saved;
        } catch {}
        return getDefaultCategoryId();
    }

    private persistLastCategory(categoryId: string): void {
        try {
            localStorage.setItem(HELP_LAST_CATEGORY_KEY, categoryId);
        } catch {}
    }

    private loadScrollPositions(): Record<string, number> {
        try {
            const raw = localStorage.getItem(HELP_SCROLL_POSITIONS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }

    /**
     * 设置尺寸监听器
     */
    private setupResizeObserver(): void {
        // 使用防抖避免频繁触发
        const handleResize = () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = window.setTimeout(() => {
                this.updateLayoutMode();
            }, 150);
        };

        // 使用 ResizeObserver 监听面板尺寸变化
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(handleResize);
            this.resizeObserver.observe(this.panelElement);
        } else {
            // 降级到 window.resize
            window.addEventListener('resize', handleResize);
        }
    }

    /**
     * 更新布局模式（桌面/移动）
     */
    private updateLayoutMode(): void {
        const width = this.panelElement.offsetWidth;
        const isMobile = width < 768;

        if (this.state.isMobileLayout !== isMobile) {
            this.state.isMobileLayout = isMobile;

            // 更新 DOM 类名
            if (isMobile) {
                this.panelElement.classList.add('mobile-layout');
                this.panelElement.classList.remove('desktop-layout');
            } else {
                this.panelElement.classList.add('desktop-layout');
                this.panelElement.classList.remove('mobile-layout');
            }

            console.debug(`[HelpPanelManager] 布局模式切换: ${isMobile ? '移动' : '桌面'}`);
        }
    }

    /**
     * 显示帮助面板
     */
    public show(): void {
        this.state.isVisible = true;
        this.panelElement.classList.remove('hidden');
        this.panelElement.classList.add('visible');

        if (this.searchInput) {
            this.searchInput.focus();
        } else if (this.sidebarElement) {
            const firstItem = this.sidebarElement.querySelector('.help-category-item') as HTMLElement;
            if (firstItem) {
                firstItem.focus();
            }
        }
    }

    /**
     * 隐藏帮助面板
     */
    public hide(): void {
        this.state.isVisible = false;
        this.panelElement.classList.remove('visible');
        this.panelElement.classList.add('hidden');
    }

    /**
     * 销毁管理器，清理资源
     */
    public destroy(): void {
        if (this.activeHeadingHighlightTimer) {
            clearTimeout(this.activeHeadingHighlightTimer);
            this.activeHeadingHighlightTimer = null;
        }

        if (this.contentElement && this.contentScrollHandler) {
            this.contentElement.removeEventListener('scroll', this.contentScrollHandler);
            this.contentScrollHandler = null;
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
    }
}

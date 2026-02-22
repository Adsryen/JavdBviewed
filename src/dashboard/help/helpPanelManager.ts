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

/**
 * 帮助面板管理器类
 */
export class HelpPanelManager {
    private panelElement: HTMLElement;
    private sidebarElement: HTMLElement | null = null;
    private contentElement: HTMLElement | null = null;
    private categories: HelpCategory[] = [];
    private state: HelpPanelState;
    private resizeObserver: ResizeObserver | null = null;
    private resizeTimeout: number | null = null;

    constructor(panelElement: HTMLElement) {
        this.panelElement = panelElement;
        this.state = {
            isVisible: false,
            currentCategory: getDefaultCategoryId(),
            isMobileLayout: false
        };
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

            content.appendChild(categoryContent);
        });

        this.contentElement = content;
        container.appendChild(content);
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

        // 更新侧边栏选中状态
        this.updateSidebarActiveState(categoryId);

        // 更新内容显示
        this.updateContentDisplay(categoryId);

        // 重置滚动位置
        if (this.contentElement) {
            this.contentElement.scrollTop = 0;
        }
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

        // 监听窗口尺寸变化
        this.setupResizeObserver();
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

        // 设置初始焦点到第一个分类项
        if (this.sidebarElement) {
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

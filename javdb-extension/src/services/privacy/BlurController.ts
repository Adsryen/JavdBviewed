/**
 * 模糊效果控制器
 */

import { IBlurController, BlurEffectConfig, PrivacyEvent, PrivacyEventType } from '../../types/privacy';
import { log } from '../../utils/logController';

export class BlurController implements IBlurController {
    private static instance: BlurController;
    private isBlurActive = false;
    private blurredElements: Set<HTMLElement> = new Set();
    private eyeIcons: Map<HTMLElement, HTMLElement> = new Map();
    private temporaryViewTimeout: number | null = null;
    private eventListeners: Map<PrivacyEventType, ((event: PrivacyEvent) => void)[]> = new Map();

    // 默认配置
    private config: BlurEffectConfig = {
        intensity: 5,
        transition: true,
        transitionDuration: 300,
        overlayColor: 'rgba(0, 0, 0, 0.1)',
        overlayOpacity: 0.8
    };

    // 默认保护的元素选择器 - 布局级保护策略
    private defaultProtectedSelectors = [
        // Dashboard 布局级保护 - 只模糊最外层容器，避免嵌套模糊
        '.video-list-container',          // 番号库整个容器
        '.actor-list-container',          // 演员库整个容器

        // JavDB网站内容 - 视频相关
        '.video-cover',
        '.movie-list .item',
        '.movie-list .cover',
        '.movie-list .title',
        '.movie-list .meta',
        '.video-meta-panel',
        '.video-detail',
        '.preview-images',
        '.sample-waterfall',

        // JavDB网站内容 - 演员相关
        '.actor-name',
        '.actor-list .item',
        '.actor-list .avatar',
        '.actor-list .name',
        '.actor-section',
        '.performer-list',
        '.performer-avatar',

        // 用户相关
        '.user-profile',
        '.user-avatar',
        '.viewed-records',
        '.collection-list',
        '.watch-history',
        '.favorite-list',

        // 搜索和标签
        '.search-result',
        '.tag-list',
        '.genre-list',
        '.category-list',

        // 通用敏感内容
        '[data-sensitive]',
        '[data-private]',
        '.sensitive-content'
    ];

    private constructor() {
        this.injectStyles();
    }

    public static getInstance(): BlurController {
        if (!BlurController.instance) {
            BlurController.instance = new BlurController();
        }
        return BlurController.instance;
    }

    /**
     * 应用模糊效果
     */
    async applyBlur(elements?: string[]): Promise<void> {
        try {
            const selectors = elements || this.defaultProtectedSelectors;
            log.privacy('=== Starting blur application ===');
            log.privacy('Applying blur with selectors:', selectors);
            log.verbose('Current blurred elements count:', this.blurredElements.size);

            const elementsToBlur = this.findElementsToBlur(selectors);
            log.verbose('Found elements to blur:', elementsToBlur.length);

            if (elementsToBlur.length === 0) {
                console.warn('No layout containers found to blur. This is expected if not on Dashboard.');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const element of elementsToBlur) {
                try {
                    this.applyBlurToElement(element);
                    this.addEyeIcon(element);
                    this.blurredElements.add(element);
                    successCount++;

                    // 静默应用模糊，避免日志过多
                } catch (error) {
                    console.error('Failed to blur individual element:', element, error);
                    errorCount++;
                }
            }

            this.isBlurActive = true;
            this.emitEvent('blur-applied', {
                elementCount: successCount,
                errorCount: errorCount,
                totalFound: elementsToBlur.length
            });

            // 模糊应用完成
            if (successCount > 0) {
                // 只在有成功应用时记录简要信息
                console.log(`✅ Successfully applied blur to ${successCount} elements`);
            }
            if (errorCount > 0) {
                console.warn(`❌ Failed to blur ${errorCount} elements`);
            }
        } catch (error) {
            console.error('Failed to apply blur:', error);
            throw new Error('应用模糊效果失败');
        }
    }

    /**
     * 移除模糊效果
     */
    async removeBlur(): Promise<void> {
        try {
            // 移除模糊效果

            for (const element of this.blurredElements) {
                this.removeBlurFromElement(element);
                this.removeEyeIcon(element);
            }

            this.blurredElements.clear();
            this.eyeIcons.clear();
            this.isBlurActive = false;

            // 清除临时查看定时器
            if (this.temporaryViewTimeout) {
                clearTimeout(this.temporaryViewTimeout);
                this.temporaryViewTimeout = null;
            }

            this.emitEvent('blur-removed', {});

            // 已移除所有模糊效果
        } catch (error) {
            console.error('Failed to remove blur:', error);
            throw new Error('移除模糊效果失败');
        }
    }

    /**
     * 强制重新应用模糊（清除现有状态后重新应用）
     */
    async forceReapplyBlur(elements?: string[]): Promise<void> {
        // 强制重新应用模糊

        // 先移除现有模糊
        await this.removeBlur();

        // 等待一小段时间确保DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));

        // 重新应用模糊
        await this.applyBlur(elements);
    }

    /**
     * 切换模糊效果
     */
    async toggleBlur(): Promise<void> {
        if (this.isBlurActive) {
            await this.removeBlur();
        } else {
            await this.applyBlur();
        }
    }

    /**
     * 检查是否处于模糊状态
     */
    isBlurred(): boolean {
        return this.isBlurActive;
    }

    /**
     * 设置模糊强度
     */
    setBlurIntensity(intensity: number): void {
        this.config.intensity = Math.max(1, Math.min(10, intensity));
        
        // 如果当前有模糊效果，重新应用
        if (this.isBlurActive) {
            for (const element of this.blurredElements) {
                this.updateElementBlur(element);
            }
        }
    }

    /**
     * 显示临时查看
     */
    async showTemporaryView(duration: number = 10): Promise<void> {
        if (!this.isBlurActive) {
            return;
        }

        try {
            // 临时移除模糊效果
            for (const element of this.blurredElements) {
                this.removeBlurFromElement(element, false); // 不移除眼睛图标
            }

            // 设置定时器恢复模糊
            if (this.temporaryViewTimeout) {
                clearTimeout(this.temporaryViewTimeout);
            }

            this.temporaryViewTimeout = window.setTimeout(() => {
                this.restoreBlurAfterTemporaryView();
            }, duration * 1000);

            // 临时查看已激活
        } catch (error) {
            console.error('Failed to show temporary view:', error);
        }
    }

    /**
     * 配置模糊效果
     */
    configure(config: Partial<BlurEffectConfig>): void {
        this.config = { ...this.config, ...config };
        this.updateStyles();
    }

    /**
     * 查找需要模糊的元素
     */
    private findElementsToBlur(selectors: string[]): HTMLElement[] {
        const elements: HTMLElement[] = [];
        const processedElements = new Set<HTMLElement>();

        // 开始搜索元素

        for (const selector of selectors) {
            try {
                const found = document.querySelectorAll(selector);
                // 记录找到的元素（减少日志输出）

                found.forEach(el => {
                    if (el instanceof HTMLElement &&
                        !this.blurredElements.has(el) &&
                        !processedElements.has(el)) {

                        elements.push(el);
                        processedElements.add(el);

                        // 静默添加元素，避免日志过多
                    } else if (this.blurredElements.has(el)) {
                        // 静默跳过已模糊的元素，避免日志刷屏
                    }
                });
            } catch (error) {
                console.warn(`Invalid selector: ${selector}`, error);
            }
        }

        // 元素搜索完成
        return elements;
    }

    /**
     * 对单个元素应用模糊
     */
    private applyBlurToElement(element: HTMLElement): void {
        element.classList.add('privacy-blur');
        element.style.filter = `blur(${this.config.intensity}px)`;
        
        if (this.config.transition) {
            element.style.transition = `filter ${this.config.transitionDuration}ms ease`;
        }

        // 添加遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'privacy-blur-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${this.config.overlayColor};
            opacity: ${this.config.overlayOpacity};
            pointer-events: none;
            z-index: 1;
        `;

        // 确保父元素有相对定位
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
        element.setAttribute('data-privacy-blurred', 'true');
    }

    /**
     * 从单个元素移除模糊
     */
    private removeBlurFromElement(element: HTMLElement, removeIcon: boolean = true): void {
        element.classList.remove('privacy-blur');
        element.style.filter = '';
        element.style.transition = '';
        element.removeAttribute('data-privacy-blurred');

        // 移除遮罩层
        const overlay = element.querySelector('.privacy-blur-overlay');
        if (overlay) {
            overlay.remove();
        }

        if (removeIcon) {
            this.removeEyeIcon(element);
        }
    }

    /**
     * 更新元素模糊效果
     */
    private updateElementBlur(element: HTMLElement): void {
        if (element.hasAttribute('data-privacy-blurred')) {
            element.style.filter = `blur(${this.config.intensity}px)`;
        }
    }

    /**
     * 添加眼睛图标
     */
    private addEyeIcon(element: HTMLElement): void {
        if (this.eyeIcons.has(element)) {
            return;
        }

        const eyeIcon = document.createElement('div');
        eyeIcon.className = 'privacy-eye-icon';
        // 创建眼睛开启状态的SVG图标
        const eyeOpenSVG = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
            </svg>
        `;

        // 创建眼睛关闭状态的SVG图标
        const eyeClosedSVG = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
            </svg>
        `;

        eyeIcon.innerHTML = eyeOpenSVG;
        eyeIcon.dataset.state = 'open';
        eyeIcon.style.cssText = `
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
            z-index: 999999;
            pointer-events: auto;
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
            transform: translateZ(0);
            isolation: isolate;
        `;

        // 添加悬停效果
        eyeIcon.addEventListener('mouseenter', () => {
            const isOpen = eyeIcon.dataset.state === 'open';
            if (isOpen) {
                eyeIcon.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)';
            } else {
                eyeIcon.style.background = 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)';
            }
            eyeIcon.style.transform = 'scale(1.05)';
            eyeIcon.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
        });

        eyeIcon.addEventListener('mouseleave', () => {
            const isOpen = eyeIcon.dataset.state === 'open';
            if (isOpen) {
                eyeIcon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            } else {
                eyeIcon.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
            }
            eyeIcon.style.transform = 'scale(1)';
            eyeIcon.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
        });

        // 点击事件，切换图标状态
        eyeIcon.addEventListener('click', (e) => {
            e.stopPropagation();

            const isOpen = eyeIcon.dataset.state === 'open';

            if (isOpen) {
                // 切换到关闭状态 - 显示内容
                eyeIcon.innerHTML = eyeClosedSVG;
                eyeIcon.dataset.state = 'closed';
                eyeIcon.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
                this.showSingleElementView(element, eyeIcon);
            } else {
                // 切换到开启状态 - 恢复模糊
                eyeIcon.innerHTML = eyeOpenSVG;
                eyeIcon.dataset.state = 'open';
                eyeIcon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                this.restoreSingleElementBlur(element);
            }
        });

        // 确保父元素有相对定位
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        // 将眼睛图标添加到body，避免被模糊
        document.body.appendChild(eyeIcon);

        // 计算并设置眼睛图标的绝对位置
        const updateEyePosition = () => {
            const rect = element.getBoundingClientRect();
            eyeIcon.style.position = 'fixed';
            eyeIcon.style.top = `${rect.top + 15}px`;
            eyeIcon.style.left = `${rect.right - 55}px`;
        };

        // 初始定位
        updateEyePosition();

        // 监听滚动和窗口大小变化，更新位置
        const updatePosition = () => updateEyePosition();
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);

        // 存储清理函数
        eyeIcon.dataset.cleanup = 'true';
        (eyeIcon as any).cleanup = () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };

        this.eyeIcons.set(element, eyeIcon);
    }

    /**
     * 移除眼睛图标
     */
    private removeEyeIcon(element: HTMLElement): void {
        const eyeIcon = this.eyeIcons.get(element);
        if (eyeIcon) {
            // 清理事件监听器
            if ((eyeIcon as any).cleanup) {
                (eyeIcon as any).cleanup();
            }

            // 从DOM中移除
            eyeIcon.remove();
            this.eyeIcons.delete(element);
        }
    }

    /**
     * 显示单个元素的临时查看
     */
    private showSingleElementView(element: HTMLElement, eyeIcon: HTMLElement): void {
        // 完全移除模糊效果 - 包括CSS类和内联样式
        element.classList.remove('privacy-blur');
        element.style.filter = 'none';
        element.removeAttribute('data-privacy-blurred');
        // 单元素查看已激活

        // 10秒后自动恢复
        setTimeout(() => {
            if (eyeIcon.dataset.state === 'closed') {
                this.restoreSingleElementBlur(element);
                // 重置图标状态
                const eyeOpenSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>`;
                eyeIcon.innerHTML = eyeOpenSVG;
                eyeIcon.dataset.state = 'open';
                eyeIcon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        }, 10000);
    }

    /**
     * 恢复单个元素的模糊
     */
    private restoreSingleElementBlur(element: HTMLElement): void {
        // 完全恢复模糊效果 - 重新添加CSS类和属性
        element.classList.add('privacy-blur');
        element.style.filter = `blur(${this.config.intensity}px)`;
        element.setAttribute('data-privacy-blurred', 'true');

        // 添加过渡效果
        if (this.config.transition) {
            element.style.transition = `filter ${this.config.transitionDuration}ms ease`;
        }

        // 单元素模糊已恢复
    }

    /**
     * 临时查看后恢复模糊
     */
    private restoreBlurAfterTemporaryView(): void {
        for (const element of this.blurredElements) {
            this.applyBlurToElement(element);
        }
        this.temporaryViewTimeout = null;
        // 临时查看后模糊已恢复
    }

    /**
     * 注入样式
     */
    private injectStyles(): void {
        const styleId = 'privacy-blur-styles';
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = this.getStylesCSS();
        document.head.appendChild(style);
    }

    /**
     * 更新样式
     */
    private updateStyles(): void {
        const style = document.getElementById('privacy-blur-styles');
        if (style) {
            style.textContent = this.getStylesCSS();
        }
    }

    /**
     * 获取CSS样式
     */
    private getStylesCSS(): string {
        return `
            .privacy-blur {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                /* 不在CSS中设置filter，完全由JavaScript控制 */
            }
            
            .privacy-blur-overlay {
                border-radius: inherit;
            }
            
            .privacy-eye-icon:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            @media (max-width: 768px) {
                .privacy-eye-icon {
                    width: 25px !important;
                    height: 25px !important;
                    font-size: 14px !important;
                }
            }
        `;
    }

    /**
     * 添加事件监听器
     */
    addEventListener(type: PrivacyEventType, listener: (event: PrivacyEvent) => void): void {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, []);
        }
        this.eventListeners.get(type)!.push(listener);
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(type: PrivacyEventType, listener: (event: PrivacyEvent) => void): void {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    private emitEvent(type: PrivacyEventType, data?: any): void {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            const event: PrivacyEvent = {
                type,
                timestamp: Date.now(),
                data
            };

            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }
}

/**
 * 获取模糊控制器实例
 */
export function getBlurController(): BlurController {
    return BlurController.getInstance();
}

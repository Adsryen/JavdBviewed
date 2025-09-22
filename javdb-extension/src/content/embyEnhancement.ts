/**
 * Emby增强功能
 * 在Emby/Jellyfin等媒体服务器页面中识别番号并转换为可点击的链接
 */

import { STATE, log } from './state';
import { extractVideoId } from './videoId';

interface EmbyConfig {
    enabled: boolean;
    matchUrls: string[];
    videoCodePatterns: string[];
    linkBehavior: 'javdb-direct' | 'javdb-search';
    enableAutoDetection: boolean;
    highlightStyle: {
        backgroundColor: string;
        color: string;
        borderRadius: string;
        padding: string;
    };
}

/**
 * Emby增强管理器
 */
class EmbyEnhancementManager {
    private isInitialized = false;
    private observer: MutationObserver | null = null;
    private processedElements = new WeakSet<Element>();
    private config: EmbyConfig | null = null;

    /**
     * 初始化Emby增强功能
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.loadConfig();
            
            if (!this.config?.enabled) {
                log('Emby enhancement is disabled');
                return;
            }

            if (!this.isCurrentPageMatched()) {
                log('Current page does not match Emby URL patterns');
                return;
            }

            this.setupMutationObserver();
            this.processExistingContent();
            this.isInitialized = true;

            log('Emby enhancement initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Emby enhancement:', error);
        }
    }

    /**
     * 销毁Emby增强功能
     */
    destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.isInitialized = false;
        this.processedElements = new WeakSet();
        log('Emby enhancement destroyed');
    }

    /**
     * 加载配置
     */
    private async loadConfig(): Promise<void> {
        this.config = STATE.settings?.emby || null;
    }

    /**
     * 检查当前页面是否匹配配置的URL模式
     */
    private isCurrentPageMatched(): boolean {
        if (!this.config?.matchUrls?.length) return false;

        const currentUrl = window.location.href;
        
        return this.config.matchUrls.some(pattern => {
            try {
                const regex = new RegExp(
                    pattern
                        .replace(/\*/g, '.*')
                        .replace(/\./g, '\\.')
                );
                return regex.test(currentUrl);
            } catch {
                return false;
            }
        });
    }

    /**
     * 设置DOM变化监听器
     */
    private setupMutationObserver(): void {
        this.observer = new MutationObserver((mutations) => {
            if (!this.config?.enableAutoDetection) return;

            let shouldProcess = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldProcess = true;
                        }
                    });
                }
            });

            if (shouldProcess) {
                this.processExistingContent();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 处理现有内容
     */
    private processExistingContent(): void {
        if (!this.config) return;

        // 查找所有文本节点
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // 跳过已处理的元素
                    if (node.parentElement && this.processedElements.has(node.parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // 跳过脚本和样式标签
                    const parent = node.parentElement;
                    if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // 跳过已经是链接的元素
                    if (parent && parent.closest('a')) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes: Text[] = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node as Text);
        }

        textNodes.forEach(textNode => this.processTextNode(textNode));
    }

    /**
     * 处理文本节点
     */
    private processTextNode(textNode: Text): void {
        if (!this.config || !textNode.textContent) return;

        const text = textNode.textContent;
        const videoIds = this.extractVideoIds(text);

        if (videoIds.length === 0) return;

        // 标记父元素为已处理
        if (textNode.parentElement) {
            this.processedElements.add(textNode.parentElement);
        }

        // 创建包含链接的HTML
        let newHTML = text;
        
        videoIds.forEach(videoId => {
            const link = this.createVideoLink(videoId);
            const regex = new RegExp(this.escapeRegExp(videoId), 'gi');
            newHTML = newHTML.replace(regex, link);
        });

        // 如果内容发生了变化，替换文本节点
        if (newHTML !== text) {
            const wrapper = document.createElement('span');
            wrapper.innerHTML = newHTML;
            
            // 应用样式
            this.applyLinkStyles(wrapper);
            
            textNode.parentNode?.replaceChild(wrapper, textNode);
        }
    }

    /**
     * 从文本中提取番号
     */
    private extractVideoIds(text: string): string[] {
        const videoIds: string[] = [];
        const patterns = this.config?.videoCodePatterns || [];

        patterns.forEach(pattern => {
            try {
                const regex = new RegExp(pattern, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        const cleanId = extractVideoId(match);
                        if (cleanId && !videoIds.includes(cleanId)) {
                            videoIds.push(cleanId);
                        }
                    });
                }
            } catch (error) {
                console.warn('Invalid regex pattern:', pattern, error);
            }
        });

        return videoIds;
    }

    /**
     * 创建视频链接
     */
    private createVideoLink(videoId: string): string {
        const url = this.generateVideoUrl(videoId);
        const style = this.config?.highlightStyle;
        
        const styleStr = style ? `
            background-color: ${style.backgroundColor};
            color: ${style.color};
            border-radius: ${style.borderRadius};
            padding: ${style.padding};
            text-decoration: none;
            cursor: pointer;
        ` : '';

        return `<a href="${url}" target="_blank" style="${styleStr}" class="emby-video-link" title="点击跳转到JavDB查看 ${videoId}">${videoId}</a>`;
    }

    /**
     * 生成视频URL
     */
    private generateVideoUrl(videoId: string): string {
        if (!this.config) return '#';

        if (this.config.linkBehavior === 'javdb-direct') {
            // 尝试从本地记录中查找直接链接
            const record = STATE.records?.[videoId];
            if (record?.javdbUrl && record.javdbUrl !== '#') {
                return record.javdbUrl;
            }
        }

        // 使用搜索引擎进行搜索
        const searchEngines = STATE.settings?.searchEngines || [];
        const javdbEngine = searchEngines.find(engine => engine.id === 'javdb');
        
        if (javdbEngine) {
            return javdbEngine.urlTemplate.replace('{{ID}}', encodeURIComponent(videoId));
        }

        // 默认使用JavDB搜索
        return `https://javdb.com/search?q=${encodeURIComponent(videoId)}&f=all`;
    }

    /**
     * 应用链接样式
     */
    private applyLinkStyles(container: HTMLElement): void {
        const links = container.querySelectorAll('.emby-video-link');
        links.forEach(link => {
            link.addEventListener('click', (event) => {
                event.stopPropagation();
                // 链接会自动在新标签页打开，这里可以添加额外的处理逻辑
                const videoId = link.textContent?.trim();
                if (videoId) {
                    log(`User clicked on video link: ${videoId}`);
                }
            });

            // 添加悬停效果
            link.addEventListener('mouseenter', () => {
                (link as HTMLElement).style.opacity = '0.8';
            });

            link.addEventListener('mouseleave', () => {
                (link as HTMLElement).style.opacity = '1';
            });
        });
    }

    /**
     * 转义正则表达式特殊字符
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 手动触发内容处理
     */
    async refresh(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
            return;
        }

        await this.loadConfig();
        
        if (!this.config?.enabled || !this.isCurrentPageMatched()) {
            this.destroy();
            return;
        }

        this.processedElements = new WeakSet();
        this.processExistingContent();
        log('Emby enhancement refreshed');
    }

    /**
     * 获取当前状态
     */
    getStatus(): { initialized: boolean; enabled: boolean; matched: boolean } {
        return {
            initialized: this.isInitialized,
            enabled: this.config?.enabled || false,
            matched: this.isCurrentPageMatched()
        };
    }
}

// 创建全局实例
export const embyEnhancementManager = new EmbyEnhancementManager();

// 监听设置变化
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'settings-updated' && message.settings?.emby) {
        embyEnhancementManager.refresh().catch(error => {
            console.error('Failed to refresh Emby enhancement:', error);
        });
    }
});

/**
 * Emby增强功能
 * 在Emby/Jellyfin等媒体服务器页面中识别番号并转换为可点击的链接
 */

import { STATE, log } from './state';
import { extractVideoId } from './videoId';
import { showToast } from './toast';

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
    private quickActions: HTMLElement | null = null;

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
            // 渲染右侧悬浮快捷框（搜番号 / 搜演员）
            this.renderQuickActions();
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
        this.removeQuickActions();
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
                event.preventDefault();
                event.stopPropagation();
                const videoId = link.textContent?.trim();
                if (!videoId) return;

                log(`User clicked on video link: ${videoId}`);

                // 优先：直达详情（需要本地有直链或可即时刷新获取）
                if (this.config?.linkBehavior === 'javdb-direct') {
                    const local = STATE.records?.[videoId];
                    if (local?.javdbUrl && local.javdbUrl !== '#') {
                        window.open(local.javdbUrl, '_blank');
                        return;
                    }
                    try {
                        chrome.runtime.sendMessage({ type: 'refresh-record', videoId }, (resp: any) => {
                            if ((typeof chrome !== 'undefined') && chrome.runtime && chrome.runtime.lastError) {
                                const url = this.generateVideoUrl(videoId);
                                window.open(url, '_blank');
                                return;
                            }
                            const updatedUrl = resp?.record?.javdbUrl;
                            if (resp?.success && updatedUrl && updatedUrl !== '#') {
                                window.open(updatedUrl, '_blank');
                            } else {
                                const url = this.generateVideoUrl(videoId);
                                window.open(url, '_blank');
                            }
                        });
                    } catch {
                        const url = this.generateVideoUrl(videoId);
                        window.open(url, '_blank');
                    }
                    return;
                }

                // 回退：统一走搜索
                const url = this.generateVideoUrl(videoId);
                window.open(url, '_blank');
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
        this.renderQuickActions();
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

    /** 渲染右侧悬浮快捷框（搜番号 / 搜演员） */
    private renderQuickActions(): void {
        if (!this.config?.enabled || !this.isCurrentPageMatched()) return;
        this.removeQuickActions();
        const container = document.createElement('div');
        container.className = 'emby-quick-actions';
        container.style.cssText = `
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const btnSearchCode = this.createActionButton('search-code', '搜番号', '🔎', async () => {
            try {
                let id = this.getFirstVideoIdFromPage();
                if (!id) {
                    const sel = (window.getSelection()?.toString() || '').trim();
                    const idsFromSel = sel ? this.extractVideoIds(sel) : [];
                    id = idsFromSel[0] || extractVideoId(sel || '');
                }
                if (!id) {
                    showToast('未检测到番号，请先在页面中出现或选中番号文本', 'warning');
                    return;
                }

                // 链接行为：优先直达（若未有直链，尝试后台刷新），否则搜索
                if (this.config?.linkBehavior === 'javdb-direct') {
                    const local = STATE.records?.[id];
                    if (local?.javdbUrl && local.javdbUrl !== '#') {
                        window.open(local.javdbUrl, '_blank');
                        showToast(`已打开详情：${id}`,'success');
                        return;
                    }
                    chrome.runtime.sendMessage({ type: 'refresh-record', videoId: id }, (resp: any) => {
                        if ((typeof chrome !== 'undefined') && chrome.runtime && chrome.runtime.lastError) {
                            const url = this.generateVideoUrl(id);
                            window.open(url, '_blank');
                            showToast(`未找到直链，已改为搜索：${id}`,'info');
                            return;
                        }
                        const updatedUrl = resp?.record?.javdbUrl;
                        if (resp?.success && updatedUrl && updatedUrl !== '#') {
                            try { (STATE.records as any)[id] = resp.record; } catch {}
                            window.open(updatedUrl, '_blank');
                            showToast(`已打开详情：${id}`,'success');
                        } else {
                            const url = this.generateVideoUrl(id);
                            window.open(url, '_blank');
                            showToast(`未找到直链，已改为搜索：${id}`,'info');
                        }
                    });
                    return;
                }

                const url = this.generateVideoUrl(id);
                window.open(url, '_blank');
                showToast(`已在新标签页搜索番号：${id}`, 'success');
            } catch (e) {
                showToast('搜索番号失败', 'error');
            }
        });

        const btnSearchActor = this.createActionButton('search-actor', '搜演员', '👤', async () => {
            try {
                let name = this.findActorNameFromPage();
                if (!name) {
                    const sel = (window.getSelection()?.toString() || '').trim();
                    if (sel) name = sel;
                }
                if (!name) {
                    const input = prompt('请输入演员名（也可先选中文本再点击按钮）', '');
                    name = (input || '').trim();
                }
                if (!name) {
                    showToast('未获取到演员名', 'warning');
                    return;
                }
                const url = this.generateSearchUrl(name);
                window.open(url, '_blank');
                showToast(`已在新标签页搜索演员：${name}`, 'success');
            } catch (e) {
                showToast('搜索演员失败', 'error');
            }
        });

        container.appendChild(btnSearchCode);
        container.appendChild(btnSearchActor);
        document.body.appendChild(container);
        this.quickActions = container;
    }

    /** 移除悬浮快捷框 */
    private removeQuickActions(): void {
        if (this.quickActions) {
            this.quickActions.remove();
            this.quickActions = null;
        }
    }

    /** 创建样式统一的按钮 */
    private createActionButton(id: string, label: string, icon: string, onClick: () => void): HTMLElement {
        const btn = document.createElement('a');
        btn.className = `emby-quick-action-btn ${id}`;
        btn.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
          height: 40px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ddd;
          border-radius: 20px;
          color: #333;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          padding: 0 12px;
          gap: 6px;
          backdrop-filter: blur(10px);
        `;
        const i = document.createElement('span');
        i.textContent = icon;
        i.style.fontSize = '14px';
        const t = document.createElement('span');
        t.textContent = label;
        btn.appendChild(i);
        btn.appendChild(t);
        btn.addEventListener('mouseenter', () => {
            (btn as HTMLElement).style.background = 'rgba(255, 255, 255, 1)';
            (btn as HTMLElement).style.transform = 'scale(1.05)';
            (btn as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        btn.addEventListener('mouseleave', () => {
            (btn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.95)';
            (btn as HTMLElement).style.transform = 'scale(1)';
            (btn as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
        });
        return btn;
    }

    /** 从页面中尝试获取第一个番号 */
    private getFirstVideoIdFromPage(): string | null {
        try {
            const text = (document.body?.innerText || document.body?.textContent || '');
            const ids = this.extractVideoIds(text || '');
            return ids[0] || null;
        } catch {
            return null;
        }
    }

    /** 从页面尝试提取演员名（优先已选中文本） */
    private findActorNameFromPage(): string | null {
        // 1. 先看选中文本
        const sel = (window.getSelection()?.toString() || '').trim();
        if (sel) return sel;
        // 2. 常见 Emby/Jellyfin 人员链接
        const personLink = document.querySelector('a[href*="/Persons/"]') || document.querySelector('a[href*="/persons/"]');
        if (personLink && personLink.textContent) {
            const name = personLink.textContent.trim();
            if (name) return name;
        }
        // 3. 类名包含 person/actor 的元素
        const personEl = document.querySelector('[class*="person"], [class*="actor"]');
        if (personEl && personEl.textContent) {
            const name = personEl.textContent.trim().split(/[\n,，|]/)[0].trim();
            if (name) return name;
        }
        // 4. 失败则返回 null，由调用方提示/弹窗
        return null;
    }

    /** 构造通用搜索URL（默认 JavDB search?q=...&f=all） */
    private generateSearchUrl(query: string): string {
        const searchEngines = STATE.settings?.searchEngines || [];
        const javdbEngine = searchEngines.find(engine => engine.id === 'javdb');
        if (javdbEngine?.urlTemplate) {
            return javdbEngine.urlTemplate.replace('{{ID}}', encodeURIComponent(query));
        }
        return `https://javdb.com/search?q=${encodeURIComponent(query)}&f=all`;
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

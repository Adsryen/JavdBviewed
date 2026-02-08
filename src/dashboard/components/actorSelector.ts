// src/dashboard/components/actorSelector.ts
// 演员选择器组件

import { actorManager } from '../../services/actorManager';
import { showMessage } from '../ui/toast';
import type { ActorRecord } from '../../types';

export class ActorSelector {
    private modal: HTMLElement | null = null;
    private selectedActors: Set<string> = new Set();
    private onSelectCallback: ((actors: ActorRecord[]) => void) | null = null;
    private checkingActors: Map<string, { button: HTMLButtonElement; tooltip: HTMLElement | null }> = new Map();
    private progressListener: ((message: any) => void) | null = null;

    /**
     * 显示演员选择弹窗
     */
    async showSelector(
        excludeIds: string[] = [],
        onSelect: (actors: ActorRecord[]) => void
    ): Promise<void> {
        console.log('ActorSelector: 开始显示演员选择弹窗');
        console.log('ActorSelector: 排除的演员ID:', excludeIds);

        this.onSelectCallback = onSelect;
        this.selectedActors.clear();

        try {
            // 获取所有演员
            console.log('ActorSelector: 正在获取所有演员...');
            const allActors = await actorManager.getAllActors();
            console.log('ActorSelector: 获取到演员数量:', allActors.length);

            const availableActors = allActors.filter(actor => !excludeIds.includes(actor.id));
            console.log('ActorSelector: 可选择演员数量:', availableActors.length);

            if (availableActors.length === 0) {
                console.warn('ActorSelector: 没有可选择的演员');
                showMessage('没有可选择的演员，请先在演员库中添加演员', 'warn');
                return;
            }

            console.log('ActorSelector: 开始创建弹窗...');
            this.createModal(availableActors);

            console.log('ActorSelector: 开始显示弹窗...');
            this.showModal();

            console.log('ActorSelector: 弹窗显示完成');
        } catch (error) {
            console.error('ActorSelector: 显示演员选择器失败:', error);
            showMessage('加载演员列表失败: ' + error.message, 'error');
        }
    }

    /**
     * 创建弹窗
     */
    private createModal(actors: ActorRecord[]): void {
        console.log('ActorSelector: 开始创建弹窗，演员数量:', actors.length);

        // 移除已存在的弹窗
        this.removeModal();

        this.modal = document.createElement('div');
        this.modal.className = 'actor-selector-modal';
        console.log('ActorSelector: 弹窗元素已创建');

        this.modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>选择订阅演员</h3>
                        <button class="modal-close-btn" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="actor-selector-search">
                            <input type="text" id="actorSelectorSearch" placeholder="搜索演员姓名..." />
                        </div>
                        <div class="actor-selector-list" id="actorSelectorList">
                            ${this.renderActorList(actors)}
                        </div>
                        <div class="actor-selector-selected" id="actorSelectorSelected">
                            <h4>已选择的演员 (<span id="selectedCount">0</span>)</h4>
                            <div class="selected-actors-list" id="selectedActorsList">
                                <!-- 已选择的演员将显示在这里 -->
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="actorSelectorCancel">取消</button>
                        <button class="btn-primary" id="actorSelectorConfirm" disabled>确认选择</button>
                    </div>
                </div>
            </div>
        `;

        console.log('ActorSelector: 弹窗HTML已生成');

        document.body.appendChild(this.modal);
        console.log('ActorSelector: 弹窗已添加到DOM');

        // 显示弹窗 - 添加visible类
        const overlay = this.modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.add('visible');
            console.log('ActorSelector: 已添加visible类，弹窗应该可见');
        }

        this.setupModalEventListeners(actors);
        console.log('ActorSelector: 事件监听器已设置');
    }

    /**
     * 渲染演员列表
     */
    private renderActorList(actors: ActorRecord[]): string {
        return actors.map(actor => `
            <div class="actor-selector-item" data-actor-id="${actor.id}">
                <div class="actor-checkbox">
                    <input type="checkbox" id="actor-${actor.id}" />
                </div>
                <div class="actor-avatar" data-avatar-url="${actor.avatarUrl || ''}">
                    ${actor.avatarUrl 
                        ? `<img src="${actor.avatarUrl}" alt="${actor.name}" />`
                        : `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`
                    }
                </div>
                <div class="actor-info">
                    <div class="actor-name">${actor.name}</div>
                    <div class="actor-meta">
                        <span class="actor-gender">${this.getGenderText(actor.gender)}</span>
                        <span class="actor-category">${this.getCategoryText(actor.category)}</span>
                        ${actor.details?.worksCount ? `<span class="actor-works">${actor.details.worksCount} 作品</span>` : ''}
                    </div>
                    ${actor.aliases.length > 0 ? `
                        <div class="actor-aliases">
                            别名: ${actor.aliases.slice(0, 2).join(', ')}
                            ${actor.aliases.length > 2 ? '...' : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="actor-actions">
                    <button class="btn-check-single" data-actor-id="${actor.id}" title="立即检查此演员的新作品">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 设置弹窗事件监听器
     */
    private setupModalEventListeners(actors: ActorRecord[]): void {
        if (!this.modal) return;

        // 关闭按钮
        const closeBtn = this.modal.querySelector('.modal-close-btn');
        closeBtn?.addEventListener('click', () => this.hideModal());

        // 取消按钮
        const cancelBtn = this.modal.querySelector('#actorSelectorCancel');
        cancelBtn?.addEventListener('click', () => this.hideModal());

        // 确认按钮
        const confirmBtn = this.modal.querySelector('#actorSelectorConfirm');
        confirmBtn?.addEventListener('click', () => this.handleConfirm(actors));

        // 搜索框
        const searchInput = this.modal.querySelector('#actorSelectorSearch') as HTMLInputElement;
        searchInput?.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value;
            this.handleSearch(query, actors);
        });

        // 演员项点击事件
        const actorItems = this.modal.querySelectorAll('.actor-selector-item');
        actorItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
            const actorId = item.getAttribute('data-actor-id');

            if (checkbox && actorId) {
                // 点击整个项目时切换选择状态（排除按钮点击）
                item.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName !== 'INPUT' && 
                        !target.closest('.btn-check-single') && 
                        !target.closest('.actor-actions')) {
                        checkbox.checked = !checkbox.checked;
                        this.handleActorToggle(actorId, checkbox.checked, actors);
                    }
                });

                // 复选框变化事件
                checkbox.addEventListener('change', () => {
                    this.handleActorToggle(actorId, checkbox.checked, actors);
                });
            }

            // 单独检查按钮事件
            const checkBtn = item.querySelector('.btn-check-single') as HTMLButtonElement;
            if (checkBtn) {
                checkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const actorId = checkBtn.getAttribute('data-actor-id');
                    if (actorId) {
                        const actor = actors.find(a => a.id === actorId);
                        if (actor) {
                            this.handleSingleActorCheck(actor, checkBtn);
                        }
                    }
                });
            }

            // 头像悬浮大图定位
            const avatar = item.querySelector('.actor-avatar') as HTMLElement;
            const avatarUrl = avatar?.getAttribute('data-avatar-url');
            
            if (avatar && avatarUrl) {
                let preview: HTMLElement | null = null;
                let isHovering = false;
                
                const showPreview = () => {
                    isHovering = true;
                    
                    // 创建预览元素并添加到body
                    preview = document.createElement('div');
                    preview.className = 'actor-avatar-preview show';
                    preview.innerHTML = `<img src="${avatarUrl}" alt="预览" />`;
                    document.body.appendChild(preview);
                    
                    const rect = avatar.getBoundingClientRect();
                    const top = rect.top + rect.height / 2 - 100;
                    const left = rect.right + 15;
                    preview.style.top = `${top}px`;
                    preview.style.left = `${left}px`;
                };
                
                const hidePreview = () => {
                    isHovering = false;
                    setTimeout(() => {
                        if (!isHovering && preview) {
                            preview.remove();
                            preview = null;
                        }
                    }, 100);
                };
                
                avatar.addEventListener('mouseenter', showPreview);
                avatar.addEventListener('mouseleave', hidePreview);
            }
        });

        // 点击遮罩层关闭
        const overlay = this.modal.querySelector('.modal-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideModal();
            }
        });
    }

    /**
     * 处理演员选择切换
     */
    private handleActorToggle(actorId: string, selected: boolean, actors: ActorRecord[]): void {
        if (selected) {
            this.selectedActors.add(actorId);
        } else {
            this.selectedActors.delete(actorId);
        }

        this.updateSelectedActorsList(actors);
        this.updateConfirmButton();
    }

    /**
     * 更新已选择演员列表
     */
    private updateSelectedActorsList(actors: ActorRecord[]): void {
        const selectedList = this.modal?.querySelector('#selectedActorsList');
        const selectedCount = this.modal?.querySelector('#selectedCount');
        
        if (!selectedList || !selectedCount) return;

        selectedCount.textContent = this.selectedActors.size.toString();

        if (this.selectedActors.size === 0) {
            selectedList.innerHTML = '<div class="no-selection">未选择任何演员</div>';
            return;
        }

        const selectedActorData = actors.filter(actor => this.selectedActors.has(actor.id));
        selectedList.innerHTML = selectedActorData.map(actor => `
            <div class="selected-actor-item">
                <div class="selected-actor-avatar">
                    ${actor.avatarUrl 
                        ? `<img src="${actor.avatarUrl}" alt="${actor.name}" />`
                        : `<div class="avatar-placeholder-small"><i class="fas fa-user"></i></div>`
                    }
                </div>
                <span class="selected-actor-name">${actor.name}</span>
                <button class="remove-selected-actor" data-actor-id="${actor.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // 添加移除按钮事件
        selectedList.querySelectorAll('.remove-selected-actor').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actorId = (e.target as HTMLElement).closest('.remove-selected-actor')?.getAttribute('data-actor-id');
                if (actorId) {
                    this.selectedActors.delete(actorId);
                    
                    // 更新复选框状态
                    const checkbox = this.modal?.querySelector(`#actor-${actorId}`) as HTMLInputElement;
                    if (checkbox) {
                        checkbox.checked = false;
                    }
                    
                    this.updateSelectedActorsList(actors);
                    this.updateConfirmButton();
                }
            });
        });
    }

    /**
     * 更新确认按钮状态
     */
    private updateConfirmButton(): void {
        const confirmBtn = this.modal?.querySelector('#actorSelectorConfirm') as HTMLButtonElement;
        if (confirmBtn) {
            confirmBtn.disabled = this.selectedActors.size === 0;
        }
    }

    /**
     * 处理搜索
     */
    private handleSearch(query: string, actors: ActorRecord[]): void {
        const listContainer = this.modal?.querySelector('#actorSelectorList');
        if (!listContainer) return;

        const filteredActors = actors.filter(actor => {
            const lowerQuery = query.toLowerCase();
            return actor.name.toLowerCase().includes(lowerQuery) ||
                   actor.aliases.some(alias => alias.toLowerCase().includes(lowerQuery));
        });

        listContainer.innerHTML = this.renderActorList(filteredActors);
        
        // 重新设置事件监听器
        this.setupActorItemListeners(filteredActors);
    }

    /**
     * 设置演员项事件监听器
     */
    private setupActorItemListeners(actors: ActorRecord[]): void {
        if (!this.modal) return;

        const actorItems = this.modal.querySelectorAll('.actor-selector-item');
        actorItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
            const actorId = item.getAttribute('data-actor-id');

            if (checkbox && actorId) {
                // 恢复选择状态
                checkbox.checked = this.selectedActors.has(actorId);

                // 重新绑定事件（排除按钮点击）
                item.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName !== 'INPUT' && 
                        !target.closest('.btn-check-single') && 
                        !target.closest('.actor-actions')) {
                        checkbox.checked = !checkbox.checked;
                        this.handleActorToggle(actorId, checkbox.checked, actors);
                    }
                });

                checkbox.addEventListener('change', () => {
                    this.handleActorToggle(actorId, checkbox.checked, actors);
                });
            }

            // 单独检查按钮事件
            const checkBtn = item.querySelector('.btn-check-single') as HTMLButtonElement;
            if (checkBtn) {
                checkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const actorId = checkBtn.getAttribute('data-actor-id');
                    if (actorId) {
                        const actor = actors.find(a => a.id === actorId);
                        if (actor) {
                            this.handleSingleActorCheck(actor, checkBtn);
                        }
                    }
                });
            }

            // 头像悬浮大图定位（搜索后）
            const avatar = item.querySelector('.actor-avatar') as HTMLElement;
            const avatarUrl = avatar?.getAttribute('data-avatar-url');
            
            if (avatar && avatarUrl) {
                let preview: HTMLElement | null = null;
                let isHovering = false;
                
                const showPreview = () => {
                    isHovering = true;
                    
                    // 创建预览元素并添加到body
                    preview = document.createElement('div');
                    preview.className = 'actor-avatar-preview show';
                    preview.innerHTML = `<img src="${avatarUrl}" alt="预览" />`;
                    document.body.appendChild(preview);
                    
                    const rect = avatar.getBoundingClientRect();
                    const top = rect.top + rect.height / 2 - 100;
                    const left = rect.right + 15;
                    preview.style.top = `${top}px`;
                    preview.style.left = `${left}px`;
                };
                
                const hidePreview = () => {
                    isHovering = false;
                    setTimeout(() => {
                        if (!isHovering && preview) {
                            preview.remove();
                            preview = null;
                        }
                    }, 100);
                };
                
                avatar.addEventListener('mouseenter', showPreview);
                avatar.addEventListener('mouseleave', hidePreview);
            }
        });
    }

    /**
     * 处理确认选择
     */
    private handleConfirm(actors: ActorRecord[]): void {
        const selectedActorData = actors.filter(actor => this.selectedActors.has(actor.id));
        
        if (this.onSelectCallback) {
            this.onSelectCallback(selectedActorData);
        }
        
        this.hideModal();
    }

    /**
     * 显示弹窗
     */
    private showModal(): void {
        console.log('ActorSelector: 尝试显示弹窗');

        if (this.modal) {
            console.log('ActorSelector: 弹窗元素存在，设置显示样式');

            // 强制设置样式
            this.modal.style.display = 'block';
            this.modal.style.position = 'fixed';
            this.modal.style.top = '0';
            this.modal.style.left = '0';
            this.modal.style.width = '100%';
            this.modal.style.height = '100%';
            this.modal.style.zIndex = '10000';
            this.modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

            document.body.style.overflow = 'hidden';

            // 检查弹窗是否真的显示了
            const computedStyle = window.getComputedStyle(this.modal);
            console.log('ActorSelector: 弹窗显示状态:', computedStyle.display);
            console.log('ActorSelector: 弹窗可见性:', computedStyle.visibility);
            console.log('ActorSelector: 弹窗z-index:', computedStyle.zIndex);
            console.log('ActorSelector: 弹窗位置:', {
                top: computedStyle.top,
                left: computedStyle.left,
                width: computedStyle.width,
                height: computedStyle.height
            });

            // 检查弹窗在DOM中的位置
            console.log('ActorSelector: 弹窗父元素:', this.modal.parentElement?.tagName);
            console.log('ActorSelector: 弹窗类名:', this.modal.className);

            // 检查弹窗内容
            const modalContent = this.modal.querySelector('.modal-content');
            if (modalContent) {
                console.log('ActorSelector: 找到弹窗内容元素');
            } else {
                console.error('ActorSelector: 未找到弹窗内容元素');
            }

        } else {
            console.error('ActorSelector: 弹窗元素不存在，无法显示');
        }
    }

    /**
     * 隐藏弹窗
     */
    private hideModal(): void {
        if (this.modal) {
            const overlay = this.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.remove('visible');
                console.log('ActorSelector: 已移除visible类，开始隐藏弹窗');
            }

            // 等待动画完成后移除弹窗
            setTimeout(() => {
                this.removeModal();
            }, 300); // 与CSS transition时间一致
        }
        
        // 移除进度监听器
        this.detachProgressListener();
    }

    /**
     * 移除弹窗
     */
    private removeModal(): void {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            document.body.style.overflow = '';
        }
    }

    /**
     * 获取性别文本
     */
    private getGenderText(gender: string): string {
        switch (gender) {
            case 'female': return '女性';
            case 'male': return '男性';
            default: return '未知';
        }
    }

    /**
     * 获取分类文本
     */
    private getCategoryText(category: string): string {
        switch (category) {
            case 'censored': return '有码';
            case 'uncensored': return '无码';
            case 'western': return '欧美';
            default: return '未知';
        }
    }

    /**
     * 处理单个演员的检查
     */
    private async handleSingleActorCheck(actor: ActorRecord, button: HTMLButtonElement): Promise<void> {
        const originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        // 创建进度提示框
        const tooltip = this.createProgressTooltip(button);
        this.checkingActors.set(actor.id, { button, tooltip });

        // 附加进度监听器
        this.attachProgressListener();

        try {
            console.log(`开始后台检查演员 ${actor.name} 的新作品`);

            // 发送消息到后台脚本
            chrome.runtime.sendMessage(
                {
                    type: 'new-works-check-single-actor',
                    actorId: actor.id,
                    actorName: actor.name
                },
                (response) => {
                    // 检查完成，恢复按钮状态
                    const checkingInfo = this.checkingActors.get(actor.id);
                    if (checkingInfo) {
                        checkingInfo.button.disabled = false;
                        checkingInfo.button.innerHTML = originalHtml;
                        
                        // 移除提示框
                        if (checkingInfo.tooltip && checkingInfo.tooltip.parentElement) {
                            checkingInfo.tooltip.remove();
                        }
                        
                        this.checkingActors.delete(actor.id);
                    }

                    if (response && response.success) {
                        const result = response.result;
                        const statsParts: string[] = [];
                        
                        if (typeof result.identified === 'number') {
                            statsParts.push(`识别 ${result.identified} 个`);
                        }
                        if (typeof result.effective === 'number') {
                            statsParts.push(`有效 ${result.effective} 个`);
                        }
                        statsParts.push(`新增 ${result.discovered} 个`);

                        const message = `${actor.name}: ${statsParts.join('，')}`;
                        
                        showMessage(message, result.discovered > 0 ? 'success' : 'info');
                        console.log(`检查完成: ${message}`);
                        
                        // 如果有新作品，触发列表刷新
                        if (result.discovered > 0) {
                            this.triggerListRefresh();
                        }
                    } else if (response && !response.success) {
                        console.error(`检查演员 ${actor.name} 失败:`, response.error);
                        showMessage(`检查 ${actor.name} 失败: ${response.error}`, 'error');
                    }
                }
            );

            // 立即显示提示
            showMessage(`已开始检查 ${actor.name}`, 'info');
            console.log(`已触发后台检查任务: ${actor.name}`);
            
        } catch (error) {
            console.error(`触发检查演员 ${actor.name} 失败:`, error);
            showMessage(`触发检查 ${actor.name} 失败: ${error.message}`, 'error');
            
            // 出错时恢复按钮
            button.disabled = false;
            button.innerHTML = originalHtml;
            
            const checkingInfo = this.checkingActors.get(actor.id);
            if (checkingInfo && checkingInfo.tooltip && checkingInfo.tooltip.parentElement) {
                checkingInfo.tooltip.remove();
            }
            this.checkingActors.delete(actor.id);
        }
    }

    /**
     * 创建进度提示框
     */
    private createProgressTooltip(button: HTMLButtonElement): HTMLElement {
        const tooltip = document.createElement('div');
        tooltip.className = 'actor-check-progress-tooltip';
        tooltip.innerHTML = '<div class="progress-text">准备中...</div>';
        
        // 定位到按钮旁边
        const updatePosition = () => {
            if (!button.parentElement) return;
            const rect = button.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${rect.top}px`;
            tooltip.style.zIndex = '10001';
        };
        
        updatePosition();
        document.body.appendChild(tooltip);
        
        // 监听滚动和窗口大小变化
        const scrollHandler = () => updatePosition();
        window.addEventListener('scroll', scrollHandler, true);
        window.addEventListener('resize', scrollHandler);
        
        // 保存清理函数
        (tooltip as any)._cleanup = () => {
            window.removeEventListener('scroll', scrollHandler, true);
            window.removeEventListener('resize', scrollHandler);
        };
        
        return tooltip;
    }

    /**
     * 附加进度监听器
     */
    private attachProgressListener(): void {
        if (this.progressListener) return;

        this.progressListener = (message: any) => {
            if (message.type === 'new-works-single-progress') {
                const { actorId, identified, effective } = message.payload;
                const checkingInfo = this.checkingActors.get(actorId);
                
                if (checkingInfo && checkingInfo.tooltip) {
                    const parts: string[] = [];
                    if (typeof identified === 'number') {
                        parts.push(`识别: ${identified}`);
                    }
                    if (typeof effective === 'number') {
                        parts.push(`有效: ${effective}`);
                    }
                    
                    const progressText = checkingInfo.tooltip.querySelector('.progress-text');
                    if (progressText) {
                        progressText.textContent = parts.length > 0 ? parts.join(' | ') : '检查中...';
                    }
                }
            }
        };

        chrome.runtime.onMessage.addListener(this.progressListener);
    }

    /**
     * 移除进度监听器
     */
    private detachProgressListener(): void {
        if (this.progressListener) {
            chrome.runtime.onMessage.removeListener(this.progressListener);
            this.progressListener = null;
        }
        
        // 清理所有提示框
        this.checkingActors.forEach(({ tooltip }) => {
            if (tooltip && tooltip.parentElement) {
                if ((tooltip as any)._cleanup) {
                    (tooltip as any)._cleanup();
                }
                tooltip.remove();
            }
        });
        this.checkingActors.clear();
    }

    /**
     * 触发新作品列表刷新
     */
    private triggerListRefresh(): void {
        console.log('触发新作品列表刷新');
        // 发送自定义事件通知新作品页面刷新
        window.dispatchEvent(new CustomEvent('newworks-refresh'));
    }
}

// 导出单例
export const actorSelector = new ActorSelector();

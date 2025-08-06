// src/dashboard/tabs/newWorks.ts
// 新作品标签页实现

import { newWorksManager } from '../../services/newWorksManager';
import { newWorksCollector } from '../../services/newWorksCollector';
import { actorManager } from '../../services/actorManager';
import { actorSelector } from '../components/actorSelector';
import { newWorksConfigModal } from '../components/newWorksConfigModal';
import { showMessage } from '../ui/toast';
import { showConfirm, showDanger } from '../components/confirmModal';
import type { NewWorkRecord, NewWorksStats, ActorRecord, ActorSubscription } from '../../types';

export class NewWorksTab {
    public isInitialized: boolean = false;
    private currentPage: number = 1;
    private pageSize: number = 20;
    private currentFilters: any = {
        search: '',
        filter: 'all',
        sort: 'discoveredAt_desc'
    };
    private selectedWorks: Set<string> = new Set();
    private isLoading: boolean = false;

    /**
     * 初始化新作品标签页
     */
    async initialize(): Promise<void> {
        try {
            console.log('开始初始化新作品标签页');

            // 确保DOM元素存在
            await this.waitForDOM();

            // 设置事件监听器
            await this.setupEventListeners();

            // 渲染页面
            await this.render();

            this.isInitialized = true;
            console.log('新作品标签页初始化完成');
        } catch (error) {
            console.error('初始化新作品标签页失败:', error);
        }
    }

    /**
     * 等待DOM元素准备就绪
     */
    private async waitForDOM(): Promise<void> {
        return new Promise((resolve) => {
            const checkDOM = () => {
                const newWorksTab = document.getElementById('tab-new-works');
                const configBtn = document.getElementById('newWorksGlobalConfigBtn');

                if (newWorksTab && configBtn) {
                    console.log('新作品标签页DOM元素已准备就绪');
                    resolve();
                } else {
                    console.log('等待新作品标签页DOM元素...');
                    setTimeout(checkDOM, 100);
                }
            };
            checkDOM();
        });
    }

    /**
     * 设置事件监听器
     */
    private async setupEventListeners(): Promise<void> {
        // 使用事件委托，确保在DOM元素存在时绑定事件
        this.bindButtonEvents();
        this.bindFormEvents();
    }

    /**
     * 绑定按钮事件
     */
    private bindButtonEvents(): void {
        // 全局配置按钮
        const configBtn = document.getElementById('newWorksGlobalConfigBtn');
        if (configBtn) {
            configBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击了全局配置按钮');
                this.showGlobalConfigModal();
            });
            console.log('全局配置按钮事件已绑定');
        } else {
            console.warn('未找到全局配置按钮');
        }

        // 立即检查按钮
        const checkNowBtn = document.getElementById('checkNowBtn');
        if (checkNowBtn) {
            checkNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击了立即检查按钮');
                this.checkNewWorksNow();
            });
            console.log('立即检查按钮事件已绑定');
        } else {
            console.warn('未找到立即检查按钮');
        }

        // 添加订阅按钮
        const addSubscriptionBtn = document.getElementById('addSubscriptionBtn');
        if (addSubscriptionBtn) {
            addSubscriptionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击了添加订阅按钮');
                this.showAddSubscriptionModal();
            });
            console.log('添加订阅按钮事件已绑定');
        } else {
            console.warn('未找到添加订阅按钮');
        }

        // 管理订阅按钮
        const manageSubscriptionsBtn = document.getElementById('manageSubscriptionsBtn');
        if (manageSubscriptionsBtn) {
            manageSubscriptionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('点击了管理订阅按钮');
                this.showManageSubscriptionsModal();
            });
            console.log('管理订阅按钮事件已绑定');
        } else {
            console.warn('未找到管理订阅按钮');
        }
    }

    /**
     * 绑定表单事件
     */
    private bindFormEvents(): void {
        // 搜索输入框
        const searchInput = document.getElementById('newWorksSearchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = (e.target as HTMLInputElement).value;
                this.currentPage = 1;
                this.debounceRender();
            });
            console.log('搜索输入框事件已绑定');
        }

        // 过滤选择器
        const filterSelect = document.getElementById('newWorksFilterSelect') as HTMLSelectElement;
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilters.filter = (e.target as HTMLSelectElement).value;
                this.currentPage = 1;
                this.render();
            });
            console.log('过滤选择器事件已绑定');
        }

        // 排序选择器
        const sortSelect = document.getElementById('newWorksSortSelect') as HTMLSelectElement;
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = (e.target as HTMLSelectElement).value;
                this.currentPage = 1;
                this.render();
            });
            console.log('排序选择器事件已绑定');
        }
    }

    /**
     * 渲染页面
     */
    private async render(): Promise<void> {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            await Promise.all([
                this.renderStats(),
                this.renderNewWorksList(),
            ]);
        } catch (error) {
            console.error('渲染新作品页面失败:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 渲染统计信息
     */
    private async renderStats(): Promise<void> {
        const container = document.getElementById('newWorksStatsContainer');
        if (!container) return;

        try {
            const stats = await newWorksManager.getStats();
            
            container.innerHTML = `
                <div class="stat-card new-works-stat">
                    <div class="stat-value">${stats.totalSubscriptions}</div>
                    <div class="stat-label">订阅演员</div>
                </div>
                <div class="stat-card new-works-stat">
                    <div class="stat-value">${stats.activeSubscriptions}</div>
                    <div class="stat-label">活跃订阅</div>
                </div>
                <div class="stat-card new-works-stat">
                    <div class="stat-value">${stats.totalNewWorks}</div>
                    <div class="stat-label">总新作品</div>
                </div>
                <div class="stat-card new-works-stat">
                    <div class="stat-value">${stats.unreadWorks}</div>
                    <div class="stat-label">未读作品</div>
                </div>
                <div class="stat-card new-works-stat">
                    <div class="stat-value">${stats.todayDiscovered}</div>
                    <div class="stat-label">今日发现</div>
                </div>
            `;
        } catch (error) {
            console.error('渲染统计信息失败:', error);
            container.innerHTML = '<div class="error-message">加载统计信息失败</div>';
        }
    }

    /**
     * 渲染新作品列表
     */
    private async renderNewWorksList(): Promise<void> {
        const container = document.getElementById('newWorksList');
        if (!container) return;

        try {
            // 显示加载状态
            container.innerHTML = `
                <div class="new-works-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <div>加载中...</div>
                </div>
            `;

            const result = await newWorksManager.getNewWorks({
                ...this.currentFilters,
                page: this.currentPage,
                pageSize: this.pageSize
            });

            if (result.works.length === 0) {
                container.innerHTML = `
                    <div class="new-works-empty">
                        <i class="fas fa-inbox"></i>
                        <h3>暂无新作品</h3>
                        <p>添加演员订阅后，系统会自动检查新作品</p>
                    </div>
                `;
                this.renderPagination(0);
                return;
            }

            // 渲染作品列表
            container.innerHTML = result.works.map(work => this.renderWorkItem(work)).join('');
            
            // 渲染分页
            this.renderPagination(result.total);

            // 添加事件监听器
            this.attachWorkItemListeners();

        } catch (error) {
            console.error('渲染新作品列表失败:', error);
            container.innerHTML = '<div class="error-message">加载新作品列表失败</div>';
        }
    }

    /**
     * 渲染单个作品项
     */
    private renderWorkItem(work: NewWorkRecord): string {
        const isSelected = this.selectedWorks.has(work.id);
        const readClass = work.isRead ? 'read' : 'unread';
        const selectedClass = isSelected ? 'selected' : '';
        
        const formatDate = (timestamp: number) => {
            return new Date(timestamp).toLocaleDateString('zh-CN');
        };

        const tagsHtml = work.tags.length > 0 
            ? `<div class="new-work-tags">
                ${work.tags.slice(0, 3).map(tag => `<span class="new-work-tag">${tag}</span>`).join('')}
                ${work.tags.length > 3 ? `<span class="new-work-tag">+${work.tags.length - 3}</span>` : ''}
               </div>`
            : '';

        return `
            <li class="new-work-item ${readClass} ${selectedClass}" data-work-id="${work.id}">
                <div class="new-work-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                ${work.coverImage ? `<img src="${work.coverImage}" alt="${work.title}" class="new-work-cover">` : '<div class="new-work-cover"></div>'}
                <div class="new-work-info">
                    <h3 class="new-work-title">${work.title}</h3>
                    <div class="new-work-meta">
                        <span class="new-work-actor">
                            <i class="fas fa-user"></i>
                            ${work.actorName}
                        </span>
                        <span class="new-work-date">
                            <i class="fas fa-calendar"></i>
                            发现于 ${formatDate(work.discoveredAt)}
                        </span>
                        ${work.releaseDate ? `
                            <span class="new-work-release">
                                <i class="fas fa-film"></i>
                                发行于 ${work.releaseDate}
                            </span>
                        ` : ''}
                    </div>
                    ${tagsHtml}
                </div>
                <div class="new-work-actions">
                    ${!work.isRead ? '<button class="new-work-action-btn mark-read-btn" data-action="mark-read"><i class="fas fa-check"></i> 标记已读</button>' : ''}
                    <button class="new-work-action-btn visit-btn" data-action="visit"><i class="fas fa-external-link-alt"></i> 访问</button>
                    <button class="new-work-action-btn delete-btn" data-action="delete"><i class="fas fa-trash"></i> 删除</button>
                </div>
            </li>
        `;
    }

    /**
     * 渲染分页
     */
    private renderPagination(total: number): void {
        const container = document.getElementById('newWorksPagination');
        if (!container) return;

        const pageCount = Math.ceil(total / this.pageSize);
        if (pageCount <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHtml = '';
        
        // 上一页
        if (this.currentPage > 1) {
            paginationHtml += `<button class="pagination-btn" data-page="${this.currentPage - 1}">上一页</button>`;
        }

        // 页码
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(pageCount, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            paginationHtml += `<button class="pagination-btn ${activeClass}" data-page="${i}">${i}</button>`;
        }

        // 下一页
        if (this.currentPage < pageCount) {
            paginationHtml += `<button class="pagination-btn" data-page="${this.currentPage + 1}">下一页</button>`;
        }

        container.innerHTML = paginationHtml;

        // 添加分页事件监听器
        container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt((e.target as HTMLElement).dataset.page || '1');
                this.currentPage = page;
                this.render();
            });
        });
    }

    /**
     * 添加作品项事件监听器
     */
    private attachWorkItemListeners(): void {
        const workItems = document.querySelectorAll('.new-work-item');
        
        workItems.forEach(item => {
            const workId = item.getAttribute('data-work-id');
            if (!workId) return;

            // 复选框事件
            const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
            checkbox?.addEventListener('change', (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    this.selectedWorks.add(workId);
                } else {
                    this.selectedWorks.delete(workId);
                }
                this.updateBatchOperations();
            });

            // 操作按钮事件
            const actionBtns = item.querySelectorAll('.new-work-action-btn');
            actionBtns.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const action = (e.target as HTMLElement).closest('.new-work-action-btn')?.getAttribute('data-action');
                    
                    switch (action) {
                        case 'mark-read':
                            await this.markWorksAsRead([workId]);
                            break;
                        case 'visit':
                            await this.visitWork(workId);
                            break;
                        case 'delete':
                            await this.deleteWorks([workId]);
                            break;
                    }
                });
            });
        });
    }

    /**
     * 防抖渲染
     */
    private debounceRender = this.debounce(() => this.render(), 300);

    /**
     * 防抖函数
     */
    private debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 标记作品为已读
     */
    private async markWorksAsRead(workIds: string[]): Promise<void> {
        try {
            await newWorksManager.markAsRead(workIds);
            await this.render();
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    }

    /**
     * 访问作品
     */
    private async visitWork(workId: string): Promise<void> {
        try {
            const result = await newWorksManager.getNewWorks({ search: workId });
            const work = result.works.find(w => w.id === workId);
            if (work) {
                window.open(work.javdbUrl, '_blank');
                // 自动标记为已读
                await this.markWorksAsRead([workId]);
            }
        } catch (error) {
            console.error('访问作品失败:', error);
        }
    }

    /**
     * 删除作品
     */
    private async deleteWorks(workIds: string[]): Promise<void> {
        if (!confirm(`确定要删除 ${workIds.length} 个作品吗？`)) {
            return;
        }

        try {
            await newWorksManager.deleteWorks(workIds);
            this.selectedWorks.clear();
            await this.render();
        } catch (error) {
            console.error('删除作品失败:', error);
        }
    }

    /**
     * 更新批量操作状态
     */
    private updateBatchOperations(): void {
        // TODO: 实现批量操作UI更新
    }

    /**
     * 显示全局配置弹窗
     */
    private async showGlobalConfigModal(): Promise<void> {
        try {
            console.log('开始显示全局配置弹窗');

            // 初始化新作品管理器
            await newWorksManager.initialize();

            const currentConfig = await newWorksManager.getGlobalConfig();
            console.log('当前配置:', currentConfig);

            const newConfig = await newWorksConfigModal.show(currentConfig);

            if (newConfig) {
                await newWorksManager.updateGlobalConfig(newConfig);
                await this.render(); // 重新渲染以反映配置变化
                showMessage('配置已保存', 'success');
            } else {
                console.log('用户取消了配置');
            }
        } catch (error) {
            console.error('配置全局设置失败:', error);
            showMessage('配置失败，请重试: ' + error.message, 'error');
        }
    }

    /**
     * 立即检查新作品
     */
    private async checkNewWorksNow(): Promise<void> {
        try {
            const checkBtn = document.getElementById('checkNowBtn') as HTMLButtonElement;
            if (checkBtn) {
                checkBtn.disabled = true;
                checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 检查中...';
            }

            // 检查基本条件
            const subscriptions = await newWorksManager.getSubscriptions();
            const activeSubscriptions = subscriptions.filter(sub => sub.enabled);

            if (activeSubscriptions.length === 0) {
                showMessage('没有活跃的订阅演员，请先添加订阅', 'warn');
                return;
            }

            const globalConfig = await newWorksManager.getGlobalConfig();
            if (!globalConfig.enabled) {
                showMessage('新作品功能未启用，请先在全局配置中启用', 'warn');
                return;
            }

            // 通过后台脚本执行检查
            const response = await new Promise<any>((resolve) => {
                chrome.runtime.sendMessage(
                    { type: 'new-works-manual-check' },
                    resolve
                );
            });

            if (response.success) {
                await this.render();

                let message = `检查完成！发现 ${response.result.discovered} 个新作品`;
                if (response.result.errors.length > 0) {
                    message += `，遇到 ${response.result.errors.length} 个错误`;
                }
                showMessage(message, response.result.discovered > 0 ? 'success' : 'info');
            } else {
                throw new Error(response.error || '检查失败');
            }

        } catch (error) {
            console.error('立即检查失败:', error);
            showMessage('检查失败，请重试', 'error');
        } finally {
            const checkBtn = document.getElementById('checkNowBtn') as HTMLButtonElement;
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 立即检查';
            }
        }
    }

    /**
     * 显示添加订阅弹窗
     */
    private async showAddSubscriptionModal(): Promise<void> {
        try {
            console.log('开始显示添加订阅弹窗');

            // 初始化新作品管理器
            await newWorksManager.initialize();

            // 获取已订阅的演员ID列表
            const subscriptions = await newWorksManager.getSubscriptions();
            const subscribedIds = subscriptions.map(sub => sub.actorId);
            console.log('已订阅演员ID:', subscribedIds);

            // 显示演员选择器
            actorSelector.showSelector(subscribedIds, async (selectedActors: ActorRecord[]) => {
                try {
                    console.log('选择的演员:', selectedActors);

                    // 添加订阅
                    for (const actor of selectedActors) {
                        await newWorksManager.addSubscription(actor.id);
                    }

                    await this.render();
                    showMessage(`成功添加 ${selectedActors.length} 个演员订阅`, 'success');
                } catch (error) {
                    console.error('添加订阅失败:', error);
                    showMessage('添加订阅失败，请重试: ' + error.message, 'error');
                }
            });
        } catch (error) {
            console.error('显示添加订阅弹窗失败:', error);
            showMessage('加载失败，请重试: ' + error.message, 'error');
        }
    }

    /**
     * 显示管理订阅弹窗
     */
    private async showManageSubscriptionsModal(): Promise<void> {
        try {
            const subscriptions = await newWorksManager.getSubscriptions();

            if (subscriptions.length === 0) {
                showMessage('暂无订阅演员', 'info');
                return;
            }

            this.showSubscriptionManagementModal(subscriptions);
        } catch (error) {
            console.error('显示管理订阅弹窗失败:', error);
            showMessage('加载失败，请重试', 'error');
        }
    }

    /**
     * 显示订阅管理弹窗
     */
    private showSubscriptionManagementModal(subscriptions: ActorSubscription[]): void {
        const modal = document.createElement('div');
        modal.className = 'subscription-management-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>管理订阅演员</h3>
                        <button class="modal-close-btn" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="subscription-list">
                            ${subscriptions.map(sub => `
                                <div class="subscription-item" data-actor-id="${sub.actorId}">
                                    <div class="subscription-info">
                                        ${sub.avatarUrl ? `<img src="${sub.avatarUrl}" alt="${sub.actorName}" class="subscription-avatar">` : '<div class="subscription-avatar-placeholder"><i class="fas fa-user"></i></div>'}
                                        <div class="subscription-details">
                                            <div class="subscription-name">${sub.actorName}</div>
                                            <div class="subscription-meta">
                                                订阅于 ${new Date(sub.subscribedAt).toLocaleDateString('zh-CN')}
                                                ${sub.lastCheckTime ? `| 最后检查: ${new Date(sub.lastCheckTime).toLocaleDateString('zh-CN')}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="subscription-actions">
                                        <label class="toggle-switch">
                                            <input type="checkbox" ${sub.enabled ? 'checked' : ''} data-action="toggle">
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <button class="btn-danger" data-action="remove">
                                            <i class="fas fa-trash"></i> 移除
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="subscriptionManagementClose">关闭</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 设置事件监听器
        const closeModal = () => {
            const overlay = modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.remove('visible');
                console.log('管理订阅弹窗: 已移除visible类，开始隐藏弹窗');
            }

            // 等待动画完成后移除弹窗
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
            }, 300); // 与CSS transition时间一致
        };

        modal.querySelector('.modal-close-btn')?.addEventListener('click', closeModal);
        modal.querySelector('#subscriptionManagementClose')?.addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-overlay')) {
                closeModal();
            }
        });

        // 订阅项操作
        modal.querySelectorAll('.subscription-item').forEach(item => {
            const actorId = item.getAttribute('data-actor-id');
            if (!actorId) return;

            // 切换启用状态
            const toggleSwitch = item.querySelector('[data-action="toggle"]') as HTMLInputElement;
            toggleSwitch?.addEventListener('change', async () => {
                try {
                    await newWorksManager.toggleSubscription(actorId, toggleSwitch.checked);
                    await this.render();
                } catch (error) {
                    console.error('切换订阅状态失败:', error);
                    toggleSwitch.checked = !toggleSwitch.checked; // 恢复状态
                }
            });

            // 移除订阅
            const removeBtn = item.querySelector('[data-action="remove"]');
            removeBtn?.addEventListener('click', async () => {
                const actorName = subscriptions.find(sub => sub.actorId === actorId)?.actorName || '未知';
                const confirmed = await showDanger(
                    `确定要移除对演员 ${actorName} 的订阅吗？`,
                    '移除订阅'
                );
                if (confirmed) {
                    try {
                        await newWorksManager.removeSubscription(actorId);
                        item.remove();
                        await this.render();
                        showMessage(`已移除演员 ${actorName} 的订阅`, 'success');
                    } catch (error) {
                        console.error('移除订阅失败:', error);
                        showMessage('移除失败，请重试', 'error');
                    }
                }
            });
        });

        // 显示弹窗
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // 添加visible类以显示弹窗
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.add('visible');
            console.log('管理订阅弹窗: 已添加visible类，弹窗应该可见');
        }
    }
}

// 导出实例
export const newWorksTab = new NewWorksTab();

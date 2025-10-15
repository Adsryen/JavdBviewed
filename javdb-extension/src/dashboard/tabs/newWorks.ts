// src/dashboard/tabs/newWorks.ts
// 新作品标签页实现

import { newWorksManager } from '../../services/newWorks';
// 移除未使用的 actorManager 与 newWorksCollector 引用
import { actorSelector } from '../components/actorSelector';
import { newWorksConfigModal } from '../components/newWorks/configModal';
import { showMessage } from '../ui/toast';
import { showConfirm, showDanger } from '../components/confirmModal';
import type { NewWorkRecord, ActorRecord, ActorSubscription } from '../../types';

export class NewWorksTab {
    public isInitialized: boolean = false;
    private currentPage: number = 1;
    private pageSize: number = 20;
    private currentFilters: any = {
        search: '',
        filter: 'unread',
        sort: 'discoveredAt_desc'
    };
    private selectedWorks: Set<string> = new Set();
    private isLoading: boolean = false;
    private debounceRender = this.debounce(() => this.render(), 300);

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

            // 自动同步状态（静默执行）
            this.autoSyncStatus();

            this.isInitialized = true;
            console.log('新作品标签页初始化完成');
        } catch (error) {
            console.error('初始化新作品标签页失败:', error);
        }
    }

    /**
     * 批量打开当前页的未读新作品，并标记为已读
     */
    private async batchOpenCurrentPageUnread(): Promise<void> {
        try {
            const btn = document.getElementById('batchOpenUnreadBtn') as HTMLButtonElement | null;
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在打开...'; }

            // 获取当前页数据（保持与 UI 同步）
            const result = await newWorksManager.getNewWorks({
                ...this.currentFilters,
                page: this.currentPage,
                pageSize: this.pageSize,
            });
            const unread = result.works.filter(w => !w.isRead);

            if (unread.length === 0) {
                showMessage('当前页没有未读作品', 'info');
                return;
            }

            const confirmed = await showConfirm({
                title: '批量打开未读',
                message: `将打开 ${unread.length} 个未读作品的新标签页，并标记为已读，继续吗？`,
                confirmText: '继续',
                cancelText: '取消',
                type: 'warning'
            });
            if (!confirmed) return;

            // 逐个打开（使用 chrome.tabs.create 或回退 window.open）
            for (const w of unread) {
                try {
                    // 优先使用 chrome.tabs.create（若可用）
                    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
                        await new Promise<void>((resolve) => {
                            try { chrome.tabs.create({ url: w.javdbUrl }, () => resolve()); } catch { resolve(); }
                        });
                    } else {
                        window.open(w.javdbUrl, '_blank');
                    }
                } catch (e) {
                    console.warn('打开标签页失败:', e);
                }
            }

            // 标记为已读
            try {
                await newWorksManager.markAsRead(unread.map(w => w.id));
            } catch (e) {
                console.warn('批量标记已读失败:', e);
            }

            await this.render();
            showMessage(`已打开 ${unread.length} 个未读作品并标为已读`, 'success');
        } catch (error) {
            console.error('批量打开未读失败:', error);
            showMessage('批量打开失败，请重试', 'error');
        } finally {
            const btn = document.getElementById('batchOpenUnreadBtn') as HTMLButtonElement | null;
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-external-link-alt"></i> 批量打开未读（当页）'; }
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
                const checkNowBtn = document.getElementById('checkNowBtn');
                const syncStatusBtn = document.getElementById('syncStatusBtn');
                const cleanupReadBtn = document.getElementById('cleanupReadWorksBtn');
                const addSubscriptionBtn = document.getElementById('addSubscriptionBtn');
                const manageSubscriptionsBtn = document.getElementById('manageSubscriptionsBtn');
                const batchOpenUnreadBtn = document.getElementById('batchOpenUnreadBtn');
                const selectAllCurrentPageBtn = document.getElementById('selectAllCurrentPageBtn');
                const clearSelectionBtn = document.getElementById('clearSelectionBtn');
                const batchOpenSelectedBtn = document.getElementById('batchOpenSelectedBtn');

                if (newWorksTab && configBtn && checkNowBtn && syncStatusBtn && cleanupReadBtn && addSubscriptionBtn && manageSubscriptionsBtn && batchOpenUnreadBtn && selectAllCurrentPageBtn && clearSelectionBtn && batchOpenSelectedBtn) {
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

        // 同步状态按钮
        const syncStatusBtn = document.getElementById('syncStatusBtn');
        if (syncStatusBtn) {
            syncStatusBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('点击了同步状态按钮');
                await this.syncNewWorksStatus();
            });
            console.log('同步状态按钮事件已绑定');
        } else {
            console.warn('未找到同步状态按钮');
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

        // 清理已读按钮
        const cleanupReadBtn = document.getElementById('cleanupReadWorksBtn');
        if (cleanupReadBtn) {
            cleanupReadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const confirmed = await showDanger('将删除所有已读的新作品，操作不可撤销，确认继续？', '清理已读');
                if (!confirmed) return;
                try {
                    const deleted = await newWorksManager.cleanupReadWorks();
                    await this.render();
                    showMessage(`已清理 ${deleted} 条已读作品`, 'success');
                } catch (err) {
                    console.error('清理已读失败:', err);
                    showMessage('清理已读失败，请重试', 'error');
                }
            });
            console.log('清理已读按钮事件已绑定');
        } else {
            console.warn('未找到清理已读按钮');
        }

        // 批量打开未读（当页）按钮
        const batchOpenUnreadBtn = document.getElementById('batchOpenUnreadBtn');
        if (batchOpenUnreadBtn) {
            batchOpenUnreadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('点击了批量打开未读（当页）按钮');
                await this.batchOpenCurrentPageUnread();
            });
            console.log('批量打开未读按钮事件已绑定');
        } else {
            console.warn('未找到批量打开未读按钮');
        }

        // 本页全选按钮
        const selectAllCurrentPageBtn = document.getElementById('selectAllCurrentPageBtn');
        if (selectAllCurrentPageBtn) {
            selectAllCurrentPageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectAllCurrentPage();
            });
        } else {
            console.warn('未找到本页全选按钮');
        }

        // 清空选择按钮
        const clearSelectionBtn = document.getElementById('clearSelectionBtn');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearSelection();
            });
        } else {
            console.warn('未找到清空选择按钮');
        }

        // 批量打开（已选）按钮
        const batchOpenSelectedBtn = document.getElementById('batchOpenSelectedBtn');
        if (batchOpenSelectedBtn) {
            batchOpenSelectedBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.batchOpenSelected();
            });
        } else {
            console.warn('未找到批量打开（已选）按钮');
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
            // 初始化为未读
            filterSelect.value = this.currentFilters.filter;
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
        if (!container) {
            console.warn('未找到统计信息容器');
            return;
        }

        try {
            console.log('开始获取新作品统计信息');
            const stats = await newWorksManager.getStats();
            console.log('获取到统计信息:', stats);

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
            console.log('统计信息渲染完成');
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
        if (!container) {
            console.warn('未找到新作品列表容器');
            return;
        }

        try {
            console.log('开始渲染新作品列表，当前过滤条件:', this.currentFilters);

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

            console.log('获取到新作品数据:', result);

            if (result.works.length === 0) {
                console.log('没有新作品数据，显示空状态');
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

            console.log(`开始渲染 ${result.works.length} 个新作品`);

            // 渲染作品列表
            container.innerHTML = result.works.map(work => this.renderWorkItem(work)).join('');

            // 渲染分页
            this.renderPagination(result.total);

            // 添加事件监听器
            this.attachWorkItemListeners();

            console.log('新作品列表渲染完成');

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
            <li class="new-work-item ${readClass} ${selectedClass}" data-work-id="${work.id}" data-javdb-url="${work.javdbUrl}">
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
                    ${!work.isRead ? '<button class="new-work-action-btn mark-read-btn" data-action="mark-read"><i class="fas fa-check-circle"></i> 标为已读</button>' : ''}
                    <button class="new-work-action-btn visit-btn" data-action="visit"><i class="fas fa-play"></i> 去看看</button>
                    <button class="new-work-action-btn delete-btn" data-action="delete"><i class="fas fa-times"></i> 移除</button>
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
            paginationHtml += `<button class="page-button" data-page="${this.currentPage - 1}">上一页</button>`;
        } else {
            paginationHtml += `<button class="page-button" disabled>上一页</button>`;
        }

        // 页码
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(pageCount, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            paginationHtml += `<button class="page-button ${activeClass}" data-page="${i}">${i}</button>`;
        }

        // 下一页
        if (this.currentPage < pageCount) {
            paginationHtml += `<button class="page-button" data-page="${this.currentPage + 1}">下一页</button>`;
        } else {
            paginationHtml += `<button class="page-button" disabled>下一页</button>`;
        }

        container.innerHTML = paginationHtml;

        // 添加分页事件监听器
        container.querySelectorAll('.page-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target.hasAttribute('disabled')) return;

                const page = parseInt(target.dataset.page || '1');
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

            // 整项点击事件（以按钮为主，避免冒泡导致误选）
            item.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const actionBtn = target.closest ? target.closest('.new-work-action-btn') : null;
                if (!actionBtn) return;
                const action = (actionBtn as HTMLElement).getAttribute('data-action');
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
                    default:
                        break;
                }
            });
        });
        // 渲染后同步一次批量操作状态
        this.updateBatchOperations();
    }

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
     * 同步新作品状态
     */
    private async syncNewWorksStatus(): Promise<void> {
        try {
            const syncBtn = document.getElementById('syncStatusBtn') as HTMLButtonElement;
            if (syncBtn) {
                syncBtn.disabled = true;
                syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 同步中...';
            }

            console.log('开始同步新作品状态...');
            const result = await newWorksManager.syncWithVideoRecords();

            console.log('同步完成:', result);

            // 刷新页面显示
            await this.render();

            // 显示同步结果
            if (result.updated > 0) {
                let message = `已同步 ${result.updated} 个作品的状态`;
                if (result.details.length > 0) {
                    // 显示前3个更新详情
                    const detailsToShow = result.details.slice(0, 3);
                    const detailsText = detailsToShow.map(d => `${d.id}: ${d.oldStatus} → ${d.newStatus}`).join('\n');
                    message += `\n\n更新详情:\n${detailsText}`;
                    if (result.details.length > 3) {
                        message += `\n...还有 ${result.details.length - 3} 个作品`;
                    }
                }
                showMessage(message, 'success');
            } else {
                showMessage('没有需要同步的作品状态', 'info');
            }

        } catch (error) {
            console.error('同步新作品状态失败:', error);
            showMessage('同步状态失败，请重试', 'error');
        } finally {
            const syncBtn = document.getElementById('syncStatusBtn') as HTMLButtonElement;
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 同步状态';
            }
        }
    }

    /**
     * 初始化时自动同步状态（静默执行）
     */
    private async autoSyncStatus(): Promise<void> {
        try {
            console.log('自动同步新作品状态...');
            const result = await newWorksManager.syncWithVideoRecords();

            if (result.updated > 0) {
                console.log(`自动同步完成，更新了 ${result.updated} 个作品的状态`);
                result.details.forEach(detail => {
                    console.log(`• ${detail.id}: ${detail.oldStatus} → ${detail.newStatus}`);
                });
                // 静默更新，重新渲染页面
                await this.render();
            } else {
                console.log('自动同步完成，没有需要更新的作品状态');
            }
        } catch (error) {
            console.error('自动同步状态失败:', error);
            // 自动同步失败不影响用户体验，只记录日志
        }
    }

    /**
     * 更新批量操作状态
     */
    private updateBatchOperations(): void {
        const count = this.selectedWorks.size;
        const label = document.getElementById('selectedCountLabel');
        if (label) label.textContent = `已选 ${count}`;

        const batchOpenSelectedBtn = document.getElementById('batchOpenSelectedBtn') as HTMLButtonElement | null;
        if (batchOpenSelectedBtn) {
            batchOpenSelectedBtn.disabled = count === 0;
        }
    }

    /**
     * 本页全选
     */
    private selectAllCurrentPage(): void {
        const items = Array.from(document.querySelectorAll('.new-work-item')) as HTMLElement[];
        items.forEach(item => {
            const id = item.getAttribute('data-work-id');
            if (!id) return;
            this.selectedWorks.add(id);
            const cb = item.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
            if (cb) cb.checked = true;
        });
        this.updateBatchOperations();
    }

    /**
     * 清空选择
     */
    private clearSelection(): void {
        this.selectedWorks.clear();
        // 反选 DOM
        const items = Array.from(document.querySelectorAll('.new-work-item input[type="checkbox"]')) as HTMLInputElement[];
        items.forEach(cb => { cb.checked = false; });
        this.updateBatchOperations();
    }

    /**
     * 批量打开（已选）
     */
    private async batchOpenSelected(): Promise<void> {
        const ids = Array.from(this.selectedWorks);
        if (ids.length === 0) {
            showMessage('未选择任何作品', 'info');
            return;
        }

        const confirmed = await showConfirm({
            title: '批量打开（已选）',
            message: `将打开 ${ids.length} 个已选作品的新标签页，并为未读项标记为已读，继续吗？`,
            confirmText: '继续',
            cancelText: '取消',
            type: 'warning'
        });
        if (!confirmed) return;

        const btn = document.getElementById('batchOpenSelectedBtn') as HTMLButtonElement | null;
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在打开...'; }

        try {
            const worksToOpen: { id: string; url: string; isRead: boolean }[] = [];

            // 优先从当前 DOM 抓取（更快）
            const onPageMap = new Map<string, { url: string; isRead: boolean }>();
            document.querySelectorAll('.new-work-item').forEach(li => {
                const id = li.getAttribute('data-work-id') || '';
                const url = li.getAttribute('data-javdb-url') || '';
                const isRead = li.classList.contains('read');
                if (id && url) onPageMap.set(id, { url, isRead });
            });

            for (const id of ids) {
                const cached = onPageMap.get(id);
                if (cached) {
                    worksToOpen.push({ id, url: cached.url, isRead: cached.isRead });
                    continue;
                }
                try {
                    const res = await newWorksManager.getNewWorks({ search: id });
                    const w = res.works.find(x => x.id === id);
                    if (w && w.javdbUrl) {
                        worksToOpen.push({ id, url: w.javdbUrl, isRead: !!w.isRead });
                    }
                } catch {}
            }

            if (worksToOpen.length === 0) {
                showMessage('未找到可打开的作品链接', 'warn');
                return;
            }

            // 打开标签页
            for (const w of worksToOpen) {
                try {
                    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
                        await new Promise<void>((resolve) => {
                            try { chrome.tabs.create({ url: w.url }, () => resolve()); } catch { resolve(); }
                        });
                    } else {
                        window.open(w.url, '_blank');
                    }
                } catch (e) {
                    console.warn('打开标签页失败:', e);
                }
            }

            // 标记选中中的未读项为已读
            const unreadIds = worksToOpen.filter(w => !w.isRead).map(w => w.id);
            if (unreadIds.length > 0) {
                try { await newWorksManager.markAsRead(unreadIds); } catch {}
            }

            // 清空选择并刷新
            this.selectedWorks.clear();
            await this.render();
            showMessage(`已打开 ${worksToOpen.length} 个已选作品${unreadIds.length > 0 ? '（并标记未读为已读）' : ''}`, 'success');
        } catch (error) {
            console.error('批量打开（已选）失败:', error);
            showMessage('批量打开失败，请重试', 'error');
        } finally {
            const btn2 = document.getElementById('batchOpenSelectedBtn') as HTMLButtonElement | null;
            if (btn2) { btn2.disabled = this.selectedWorks.size === 0; btn2.innerHTML = '<i class="fas fa-external-link-alt"></i> 批量打开（已选）'; }
            this.updateBatchOperations();
        }
    }

    /**
     * 显示全局配置弹窗
     */
    private async showGlobalConfigModal(): Promise<void> {
        try {
            console.log('开始显示设置弹窗');

            // 初始化新作品管理器
            await newWorksManager.initialize();

            const currentConfig = await newWorksManager.getGlobalConfig();
            console.log('当前配置:', currentConfig);

            const newConfig = await newWorksConfigModal.show(currentConfig);

            if (newConfig) {
                await newWorksManager.updateGlobalConfig(newConfig);
                // 尝试重启自动检查调度器
                try {
                    await new Promise<void>((resolve) => {
                        // 忽略返回值即可
                        chrome.runtime.sendMessage({ type: 'new-works-scheduler-restart' }, () => resolve());
                    });
                } catch (e) {
                    console.warn('重启自动检查失败:', e);
                }
                await this.render(); // 重新渲染以反映设置变化
                showMessage('设置已保存', 'success');
            } else {
                console.log('用户取消了设置');
            }
        } catch (error) {
            console.error('打开或保存设置失败:', error);
            showMessage('设置失败，请重试: ' + (error as any).message, 'error');
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

            // 手动检查不再依赖总开关，可直接执行

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
                    // 显示具体错误信息
                    const firstError = response.result.errors[0];
                    if (response.result.errors.length === 1) {
                        message += `，错误：${firstError}`;
                    } else {
                        message += `，错误：${firstError}（共${response.result.errors.length}个错误，详情请查看控制台）`;
                    }
                    console.warn('新作品检查错误详情:', response.result.errors);
                }
                showMessage(message, response.result.discovered > 0 ? 'success' : (response.result.errors.length > 0 ? 'warn' : 'info'));
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
                                        <label class="ui-toggle">
                                            <input class="ui-toggle__input" type="checkbox" ${sub.enabled ? 'checked' : ''} data-action="toggle">
                                            <span class="ui-toggle__slider"></span>
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

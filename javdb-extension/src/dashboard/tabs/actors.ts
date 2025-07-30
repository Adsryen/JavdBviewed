// src/dashboard/tabs/actors.ts
// 演员库标签页

import { actorManager } from '../../services/actorManager';
import { ActorAvatar } from '../../components/ActorAvatar';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import type { ActorRecord, ActorSearchResult } from '../../types';

export class ActorsTab {
    private currentPage = 1;
    private pageSize = 20;
    private currentQuery = '';
    private currentSort = 'name';
    private currentOrder: 'asc' | 'desc' = 'asc';
    private isLoading = false;

    /**
     * 初始化演员库标签页
     */
    async initActorsTab(): Promise<void> {
        try {
            await actorManager.initialize();
            this.setupEventListeners();
            this.setupDataUpdateListeners();
            await this.loadActors();
            await this.updateStats();
        } catch (error) {
            console.error('Failed to initialize actors tab:', error);
            showMessage('初始化演员库失败', 'error');
        }
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 搜索框
        const searchInput = document.getElementById('actorSearchInput') as HTMLInputElement;
        if (searchInput) {
            let searchTimeout: number;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = window.setTimeout(() => {
                    this.currentQuery = searchInput.value.trim();
                    this.currentPage = 1;
                    this.loadActors();
                }, 300);
            });
        }

        // 排序选择
        const sortSelect = document.getElementById('actorSortSelect') as HTMLSelectElement;
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const [sortBy, order] = sortSelect.value.split('_');
                this.currentSort = sortBy;
                this.currentOrder = order as 'asc' | 'desc';
                this.currentPage = 1;
                this.loadActors();
            });
        }

        // 每页显示数量
        const pageSizeSelect = document.getElementById('actorPageSizeSelect') as HTMLSelectElement;
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => {
                this.pageSize = parseInt(pageSizeSelect.value);
                this.currentPage = 1;
                this.loadActors();
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refreshActorsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadActors();
                this.updateStats();
            });
        }
    }

    /**
     * 设置数据更新监听
     */
    private setupDataUpdateListeners(): void {
        // 监听演员数据更新事件
        document.addEventListener('actors-data-updated', () => {
            this.loadActors();
            this.updateStats();
        });
    }

    /**
     * 加载演员列表
     */
    private async loadActors(): Promise<void> {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            const result: ActorSearchResult = await actorManager.searchActors(
                this.currentQuery,
                this.currentPage,
                this.pageSize,
                this.currentSort as any,
                this.currentOrder
            );

            this.renderActorList(result);
            this.renderPagination(result);

        } catch (error) {
            console.error('Failed to load actors:', error);
            showMessage('加载演员列表失败', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * 渲染演员列表
     */
    private renderActorList(result: ActorSearchResult): void {
        const container = document.getElementById('actorListContainer');
        if (!container) return;

        if (result.actors.length === 0) {
            container.innerHTML = `
                <div class="no-actors">
                    <div class="no-actors-icon">👤</div>
                    <div class="no-actors-text">
                        ${this.currentQuery ? '未找到匹配的演员' : '暂无演员数据'}
                    </div>
                    ${!this.currentQuery ? '<div class="no-actors-hint">点击同步按钮从JavDB同步演员数据</div>' : ''}
                </div>
            `;
            return;
        }

        const actorCards = result.actors.map(actor => this.createActorCard(actor)).join('');
        container.innerHTML = `<div class="actor-grid">${actorCards}</div>`;

        // 为每个演员卡片添加头像
        result.actors.forEach(actor => {
            const avatarContainer = document.getElementById(`actor-avatar-${actor.id}`);
            if (avatarContainer) {
                const avatar = new ActorAvatar(
                    actor.id,
                    actor.avatarUrl,
                    actor.gender,
                    {
                        size: 'large',
                        onClick: (actorId) => this.openActorDetail(actorId)
                    }
                );
                avatarContainer.appendChild(avatar.getElement());
            }
        });
    }

    /**
     * 创建演员卡片HTML
     */
    private createActorCard(actor: ActorRecord): string {
        const worksCount = actor.details?.worksCount || 0;
        const lastSync = actor.syncInfo?.lastSyncAt 
            ? new Date(actor.syncInfo.lastSyncAt).toLocaleDateString()
            : '未同步';

        return `
            <div class="actor-card" data-actor-id="${actor.id}">
                <div class="actor-card-avatar" id="actor-avatar-${actor.id}">
                    <!-- 头像将通过JS添加 -->
                </div>
                <div class="actor-card-info">
                    <div class="actor-card-name" title="${actor.name}">${actor.name}</div>
                    ${actor.aliases.length > 0 ? `
                        <div class="actor-card-aliases" title="${actor.aliases.join(', ')}">
                            ${actor.aliases.slice(0, 2).join(', ')}${actor.aliases.length > 2 ? '...' : ''}
                        </div>
                    ` : ''}
                    <div class="actor-card-meta">
                        <span class="actor-gender actor-gender-${actor.gender}">
                            ${actor.gender === 'female' ? '女' : actor.gender === 'male' ? '男' : '未知'}
                        </span>
                        ${worksCount > 0 ? `<span class="actor-works-count">${worksCount} 作品</span>` : ''}
                    </div>
                    <div class="actor-card-sync">
                        <span class="sync-status sync-status-${actor.syncInfo?.syncStatus || 'unknown'}">
                            ${this.getSyncStatusText(actor.syncInfo?.syncStatus)}
                        </span>
                        <span class="sync-time">${lastSync}</span>
                    </div>
                </div>
                <div class="actor-card-actions">
                    <button class="actor-action-btn" onclick="window.actorsTab.openActorDetail('${actor.id}')" title="查看详情">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="actor-action-btn" onclick="window.actorsTab.openActorWorks('${actor.id}')" title="查看作品">
                        <i class="fas fa-film"></i>
                    </button>
                    <button class="actor-action-btn" onclick="window.actorsTab.deleteActor('${actor.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染分页控件
     */
    private renderPagination(result: ActorSearchResult): void {
        const container = document.getElementById('actorPaginationContainer');
        if (!container) return;

        const totalPages = Math.ceil(result.total / result.pageSize);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const pagination = this.createPaginationHTML(result.page, totalPages, result.total);
        container.innerHTML = pagination;

        // 添加分页事件监听器
        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt((e.target as HTMLElement).dataset.page || '1');
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadActors();
                }
            });
        });
    }

    /**
     * 创建分页HTML
     */
    private createPaginationHTML(currentPage: number, totalPages: number, total: number): string {
        const pages: string[] = [];
        
        // 上一页
        if (currentPage > 1) {
            pages.push(`<button class="page-btn" data-page="${currentPage - 1}">上一页</button>`);
        }

        // 页码
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            pages.push(`<button class="page-btn" data-page="1">1</button>`);
            if (startPage > 2) {
                pages.push(`<span class="page-ellipsis">...</span>`);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage ? ' active' : '';
            pages.push(`<button class="page-btn${isActive}" data-page="${i}">${i}</button>`);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(`<span class="page-ellipsis">...</span>`);
            }
            pages.push(`<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`);
        }

        // 下一页
        if (currentPage < totalPages) {
            pages.push(`<button class="page-btn" data-page="${currentPage + 1}">下一页</button>`);
        }

        return `
            <div class="pagination-info">
                共 ${total} 个演员，第 ${currentPage}/${totalPages} 页
            </div>
            <div class="pagination-controls">
                ${pages.join('')}
            </div>
        `;
    }



    /**
     * 显示/隐藏加载状态
     */
    private showLoading(show: boolean): void {
        const container = document.getElementById('actorListContainer');
        const loadingEl = document.getElementById('actorListLoading');
        
        if (show) {
            if (container) container.style.opacity = '0.5';
            if (loadingEl) loadingEl.style.display = 'block';
        } else {
            if (container) container.style.opacity = '1';
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }



    /**
     * 更新统计信息
     */
    private async updateStats(): Promise<void> {
        try {
            const stats = await actorManager.getStats();
            const statsEl = document.getElementById('actorStatsContainer');
            
            if (statsEl) {
                statsEl.innerHTML = `
                    <div class="stat-item">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">总演员数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.byGender.female || 0}</div>
                        <div class="stat-label">女演员</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.byGender.male || 0}</div>
                        <div class="stat-label">男演员</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.recentlyAdded}</div>
                        <div class="stat-label">本周新增</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to update actor stats:', error);
        }
    }

    /**
     * 获取同步状态文本
     */
    private getSyncStatusText(status?: string): string {
        switch (status) {
            case 'success': return '已同步';
            case 'failed': return '同步失败';
            case 'pending': return '同步中';
            default: return '未同步';
        }
    }

    /**
     * 打开演员详情
     */
    openActorDetail(actorId: string): void {
        // TODO: 实现演员详情页面
        console.log('Open actor detail:', actorId);
    }

    /**
     * 打开演员作品列表
     */
    openActorWorks(actorId: string): void {
        // TODO: 实现演员作品列表
        console.log('Open actor works:', actorId);
    }

    /**
     * 删除演员
     */
    async deleteActor(actorId: string): Promise<void> {
        if (!confirm('确定要删除这个演员吗？')) {
            return;
        }

        try {
            const success = await actorManager.deleteActor(actorId);
            if (success) {
                showMessage('演员已删除', 'success');
                await this.loadActors();
                await this.updateStats();
            } else {
                showMessage('删除失败', 'error');
            }
        } catch (error) {
            console.error('Failed to delete actor:', error);
            showMessage('删除失败', 'error');
        }
    }
}

// 导出单例实例
export const actorsTab = new ActorsTab();

// 将实例挂载到window对象，供HTML中的onclick使用
(window as any).actorsTab = actorsTab;

// src/dashboard/tabs/actors.ts
// 演员库标签页

import { actorManager } from '../../services/actorManager';
import { newWorksManager } from '../../services/newWorks';
import { SimpleActorAvatar } from '../../components/SimpleActorAvatar';
import { showMessage } from '../ui/toast';
import { getSettings } from '../../utils/storage';
import { showDanger } from '../components/confirmModal';
import { logAsync } from '../logger';
import type { ActorRecord, ActorSearchResult, ExtensionSettings } from '../../types';

export class ActorsTab {
    private currentPage = 1;
    private pageSize = 20;
    private currentQuery = '';
    private currentSort = 'name';
    private currentOrder: 'asc' | 'desc' = 'asc';
    private currentGenderFilter = '';
    private currentCategoryFilter = '';
    private currentBlacklistFilter: 'all' | 'exclude' | 'only' = 'all';
    private subscribedOnly: boolean = false;
    private isLoading = false;
    public isInitialized = false;
    private settings?: ExtensionSettings;

    /**
     * 初始化演员库标签页
     */
    async initActorsTab(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await actorManager.initialize();
            // 读取设置以确定默认黑名单过滤
            this.settings = await getSettings();
            this.currentBlacklistFilter = this.settings.actorLibrary.blacklist.hideInList ? 'exclude' : 'all';
            this.setupEventListeners();
            this.setupDataUpdateListeners();
            await this.loadActors();
            await this.updateStats();
            this.isInitialized = true;
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

        // 性别筛选
        const genderFilter = document.getElementById('actorGenderFilter') as HTMLSelectElement;
        if (genderFilter) {
            genderFilter.addEventListener('change', () => {
                this.currentGenderFilter = genderFilter.value;
                this.currentPage = 1;
                this.loadActors();
            });
        }

        // 分类筛选
        const categoryFilter = document.getElementById('actorCategoryFilter') as HTMLSelectElement;
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.currentCategoryFilter = categoryFilter.value;
                this.currentPage = 1;
                this.loadActors();
            });
        }

        // 合并后的状态筛选（黑名单 + 订阅）
        const statusFilter = document.getElementById('actorStatusFilter') as HTMLSelectElement;
        if (statusFilter) {
            // 初始化：根据当前内部状态设置默认选项
            let initial = 'all';
            if (this.subscribedOnly) {
                initial = this.currentBlacklistFilter === 'exclude' ? 'sub_exclude' : 'sub_only';
            } else {
                if (this.currentBlacklistFilter === 'exclude') initial = 'exclude';
                else if (this.currentBlacklistFilter === 'only') initial = 'only';
                else initial = 'all';
            }
            try { statusFilter.value = initial; } catch {}

            statusFilter.addEventListener('change', () => {
                const val = statusFilter.value as 'all' | 'exclude' | 'only' | 'sub_only' | 'sub_exclude';
                switch (val) {
                    case 'sub_only':
                        this.subscribedOnly = true;
                        this.currentBlacklistFilter = 'all';
                        break;
                    case 'sub_exclude':
                        this.subscribedOnly = true;
                        this.currentBlacklistFilter = 'exclude';
                        break;
                    case 'exclude':
                        this.subscribedOnly = false;
                        this.currentBlacklistFilter = 'exclude';
                        break;
                    case 'only':
                        this.subscribedOnly = false;
                        this.currentBlacklistFilter = 'only';
                        break;
                    case 'all':
                    default:
                        this.subscribedOnly = false;
                        this.currentBlacklistFilter = 'all';
                        break;
                }
                this.currentPage = 1;
                this.loadActors();
            });
        }

        // 黑名单筛选（可选存在）
        const blacklistFilter = document.getElementById('actorBlacklistFilter') as HTMLSelectElement;
        if (blacklistFilter) {
            blacklistFilter.addEventListener('change', () => {
                const val = blacklistFilter.value as 'all' | 'exclude' | 'only';
                this.currentBlacklistFilter = val;
                this.currentPage = 1;
                this.loadActors();
            });
        }

        // 只看已订阅
        const subscribedOnlyEl = document.getElementById('actorSubscribedOnly') as HTMLInputElement;
        if (subscribedOnlyEl) {
            subscribedOnlyEl.addEventListener('change', () => {
                this.subscribedOnly = !!subscribedOnlyEl.checked;
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
            if (!this.subscribedOnly) {
                const result: ActorSearchResult = await actorManager.searchActors(
                    this.currentQuery,
                    this.currentPage,
                    this.pageSize,
                    this.currentSort as any,
                    this.currentOrder,
                    this.currentGenderFilter || undefined,
                    this.currentCategoryFilter || undefined,
                    this.currentBlacklistFilter
                );
                await this.renderActorList(result);
                this.renderPagination(result);
            } else {
                // 前端过滤：仅展示订阅集合中的演员
                const [subs, allActors] = await Promise.all([
                    newWorksManager.getSubscriptions().catch(() => [] as any[]),
                    actorManager.getAllActors(),
                ]);
                const subSet = new Set<string>((subs || []).filter((s: any) => s && (s.enabled !== false)).map((s: any) => s.actorId));
                let actors = allActors.filter(a => subSet.has(a.id));

                const lowerQuery = (this.currentQuery || '').trim().toLowerCase();
                if (lowerQuery) {
                    actors = actors.filter(actor => (actor.name || '').toLowerCase().includes(lowerQuery)
                        || (Array.isArray(actor.aliases) && actor.aliases.some(alias => String(alias).toLowerCase().includes(lowerQuery))));
                }
                if (this.currentGenderFilter) actors = actors.filter(a => a.gender === this.currentGenderFilter);
                if (this.currentCategoryFilter) actors = actors.filter(a => a.category === this.currentCategoryFilter);
                if (this.currentBlacklistFilter === 'exclude') actors = actors.filter(a => !a.blacklisted);
                else if (this.currentBlacklistFilter === 'only') actors = actors.filter(a => !!a.blacklisted);

                // 排序
                const sortBy = (this.currentSort || 'name') as 'name' | 'updatedAt' | 'worksCount';
                const order = this.currentOrder === 'desc' ? -1 : 1;
                actors.sort((a, b) => {
                    let av: any; let bv: any;
                    switch (sortBy) {
                        case 'updatedAt': av = a.updatedAt || 0; bv = b.updatedAt || 0; break;
                        case 'worksCount': av = a.details?.worksCount || 0; bv = b.details?.worksCount || 0; break;
                        case 'name':
                        default: av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase();
                    }
                    if (typeof av === 'string' && typeof bv === 'string') {
                        const cmp = av.localeCompare(bv);
                        return order === 1 ? cmp : -cmp;
                    }
                    return order === 1 ? (av - bv) : (bv - av);
                });

                const total = actors.length;
                const start = (this.currentPage - 1) * this.pageSize;
                const pageActors = actors.slice(start, start + this.pageSize);
                const result: ActorSearchResult = {
                    actors: pageActors,
                    total,
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    hasMore: this.currentPage * this.pageSize < total,
                };
                await this.renderActorList(result);
                this.renderPagination(result);
            }

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
    private async renderActorList(result: ActorSearchResult): Promise<void> {
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

        // 获取订阅集合（存在即视为已订阅）
        let subscribedSet = new Set<string>();
        try {
            const subs = await newWorksManager.getSubscriptions();
            subscribedSet = new Set(subs.map(s => s.actorId));
        } catch (e) {
            subscribedSet = new Set();
        }

        const actorCards = result.actors.map(actor => this.createActorCard(actor, subscribedSet.has(actor.id))).join('');
        container.innerHTML = `<div class="p-actors__grid">${actorCards}</div>`;

        // 为每个演员卡片添加头像和事件监听器
        result.actors.forEach(actor => {
            const actorCard = document.querySelector(`[data-actor-id="${actor.id}"].actor-card`) as HTMLElement;
            const avatarContainer = document.getElementById(`actor-avatar-${actor.id}`);

            if (avatarContainer) {
                // 使用简化的头像组件
                const avatarElement = SimpleActorAvatar.create(
                    actor.id,
                    actor.avatarUrl,
                    actor.gender,
                    'large',
                    (actorId) => this.openActorWorks(actorId)
                );
                avatarContainer.appendChild(avatarElement);

                // 如果有头像，设置卡片背景
                if (actor.avatarUrl && actorCard) {
                    actorCard.setAttribute('data-has-avatar', 'true');
                    actorCard.style.setProperty('--avatar-bg', `url("${actor.avatarUrl}")`);
                    // 使用CSS变量设置背景
                    const style = document.createElement('style');
                    style.textContent = `
                        .actor-card[data-actor-id="${actor.id}"]::before {
                            background-image: var(--avatar-bg);
                        }
                    `;
                    document.head.appendChild(style);
                }
            }

            // 添加演员名字复制事件监听器
            this.setupActorCardEventListeners(actor);
        });
    }

    /**
     * 创建演员卡片HTML
     */
    private createActorCard(actor: ActorRecord, isSubscribed: boolean = false): string {
        const worksCount = actor.details?.worksCount || 0;
        const lastSync = actor.syncInfo?.lastSyncAt
            ? new Date(actor.syncInfo.lastSyncAt).toLocaleDateString()
            : '未同步';

        // 安全地转义字符串，防止XSS和引号问题
        const escapeName = (name: string) => name.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const escapeForJs = (name: string) => name.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const isBlacklisted = !!actor.blacklisted;
        const showBadge = !!this.settings?.actorLibrary.blacklist.showBadge;
        const blacklistBadge = isBlacklisted && showBadge ? `<span class="actor-badge actor-badge-blacklisted" title="已拉黑">黑名单</span>` : '';
        const cardStyle = isBlacklisted ? 'style="opacity:0.5;"' : '';

        return `
            <div class="actor-card" data-actor-id="${actor.id}" data-blacklisted="${isBlacklisted}" ${cardStyle}>
                <div class="actor-card-avatar" id="actor-avatar-${actor.id}">
                    <!-- 头像将通过JS添加 -->
                </div>
                <div class="actor-card-info">
                    <div class="actor-card-name"
                         title="点击复制：${escapeName(actor.name)}"
                         data-actor-id="${actor.id}"
                         data-actor-name="${escapeForJs(actor.name)}">
                        <span class="actor-name-text">${escapeName(actor.name)}</span>
                        <i class="fas fa-copy actor-name-copy-icon"></i>
                    </div>
                    ${(actor.aliases && actor.aliases.length > 0) ? `
                        <div class="actor-card-aliases" data-actor-id="${actor.id}">
                            <div class="actor-aliases-list">
                                ${(actor.aliases || []).map(alias => `
                                    <div class="actor-alias"
                                         title="点击复制：${escapeName(alias)}"
                                         data-actor-id="${actor.id}"
                                         data-actor-name="${escapeForJs(alias)}">
                                        <span class="actor-alias-text">${escapeName(alias)}</span>
                                        <i class="fas fa-copy actor-alias-copy-icon"></i>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="aliases-toggle-btn"
                                    data-actor-id="${actor.id}"
                                    title="展开/收起别名">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    ` : ''}
                    <div class="actor-card-meta">
                        <span class="actor-gender actor-gender-${actor.gender}">
                            ${actor.gender === 'female' ? '女' : actor.gender === 'male' ? '男' : '未知'}
                        </span>
                        <span class="actor-category actor-category-${actor.category}">
                            ${this.getCategoryText(actor.category)}
                        </span>
                        ${worksCount > 0 ? `<span class="actor-works-count">${worksCount} 作品</span>` : ''}
                        ${blacklistBadge}
                    </div>
                    <div class="actor-card-sync">
                        <span class="sync-status sync-status-${actor.syncInfo?.syncStatus || 'unknown'}">
                            ${this.getSyncStatusText(actor.syncInfo?.syncStatus)}
                        </span>
                        <span class="sync-time">${lastSync}</span>
                    </div>
                </div>
                <div class="actor-card-actions">
                    <button class="actor-action-btn actor-works-btn"
                            data-actor-id="${actor.id}"
                            title="查看作品">
                        <i class="fas fa-film"></i>
                    </button>
                    <button class="actor-action-btn actor-edit-btn"
                            data-actor-id="${actor.id}"
                            title="编辑源数据">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="actor-action-btn actor-delete-btn"
                            data-actor-id="${actor.id}"
                            title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="actor-action-btn actor-blacklist-toggle-btn"
                            data-actor-id="${actor.id}"
                            title="${isBlacklisted ? '取消拉黑' : '拉黑'}">
                        <i class="fas fa-ban"></i>
                    </button>
                    <button class="actor-action-btn actor-subscribe-toggle-btn"
                            data-actor-id="${actor.id}"
                            data-sub="${isSubscribed ? '1' : '0'}"
                            title="${isSubscribed ? '取消订阅' : '订阅'}">
                        <i class="fas ${isSubscribed ? 'fa-bell-slash' : 'fa-bell'}"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 为演员卡片设置事件监听器
     */
    private setupActorCardEventListeners(actor: ActorRecord): void {
        // 演员名字复制事件
        const nameElement = document.querySelector(`[data-actor-id="${actor.id}"].actor-card-name`);
        if (nameElement) {
            nameElement.addEventListener('click', (e) => {
                e.preventDefault();
                const actorId = (e.currentTarget as HTMLElement).dataset.actorId!;
                const actorName = (e.currentTarget as HTMLElement).dataset.actorName!;
                this.copyActorName(actorId, actorName, e);
            });
        }

        // 演员别名复制事件
        const aliasElements = document.querySelectorAll(`[data-actor-id="${actor.id}"].actor-alias`);
        aliasElements.forEach(aliasElement => {
            aliasElement.addEventListener('click', (e) => {
                e.preventDefault();
                const actorId = (e.currentTarget as HTMLElement).dataset.actorId!;
                const actorName = (e.currentTarget as HTMLElement).dataset.actorName!;
                this.copyActorName(actorId, actorName, e);
            });
        });

        // 查看作品按钮事件
        const worksBtn = document.querySelector(`[data-actor-id="${actor.id}"].actor-works-btn`);
        if (worksBtn) {
            worksBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const actorId = (e.currentTarget as HTMLElement).dataset.actorId!;
                this.openActorWorks(actorId);
            });
        }

        // 编辑源数据按钮事件
        const editBtn = document.querySelector(`[data-actor-id="${actor.id}"].actor-edit-btn`);
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const actorId = (e.currentTarget as HTMLElement).dataset.actorId!;
                this.editActorSourceData(actorId);
            });
        }

        // 删除按钮事件
        const deleteBtn = document.querySelector(`[data-actor-id="${actor.id}"].actor-delete-btn`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const actorId = (e.currentTarget as HTMLElement).dataset.actorId!;
                this.deleteActor(actorId);
            });
        }

        // 拉黑/取消拉黑按钮事件
        const blacklistBtn = document.querySelector(`[data-actor-id="${actor.id}"].actor-blacklist-toggle-btn`);
        if (blacklistBtn) {
            blacklistBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const actorId = (e.currentTarget as HTMLElement).dataset.actorId!;
                const isBlacklisted = (document.querySelector(`[data-actor-id="${actor.id}"].actor-card`) as HTMLElement)?.dataset.blacklisted === 'true';
                try {
                    await actorManager.setBlacklisted(actorId, !isBlacklisted);
                    await this.loadActors();
                    await this.updateStats();
                } catch (err) {
                    console.error('切换黑名单状态失败:', err);
                    showMessage('切换黑名单状态失败', 'error');
                }
            });
        }

        // 别名展开/收起按钮事件
        const toggleBtn = document.querySelector(`[data-actor-id="${actor.id}"].aliases-toggle-btn`);
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const actorId = (e.currentTarget as HTMLElement).dataset.actorId!;
                this.toggleAliasesExpansion(actorId);
            });
        }

        // 检查别名是否溢出，如果溢出则显示展开按钮
        this.checkAliasesOverflow(actor.id);

        // 订阅/取消订阅按钮事件
        const subBtn = document.querySelector(`[data-actor-id="${actor.id}"].actor-subscribe-toggle-btn`) as HTMLButtonElement | null;
        if (subBtn) {
            subBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const btn = e.currentTarget as HTMLButtonElement;
                if (btn.getAttribute('data-busy') === '1') return;
                btn.setAttribute('data-busy', '1');
                const actorId = btn.dataset.actorId!;
                const icon = btn.querySelector('i');
                const wasSub = btn.dataset.sub === '1';
                try {
                    if (!wasSub) {
                        await newWorksManager.addSubscription(actorId);
                        btn.dataset.sub = '1';
                        if (icon) { icon.classList.remove('fa-bell'); icon.classList.add('fa-bell-slash'); }
                        btn.title = '取消订阅';
                        showMessage('已订阅该演员的新作品', 'success');
                        if (this.subscribedOnly) { await this.loadActors(); }
                    } else {
                        await newWorksManager.removeSubscription(actorId);
                        btn.dataset.sub = '0';
                        if (icon) { icon.classList.remove('fa-bell-slash'); icon.classList.add('fa-bell'); }
                        btn.title = '订阅';
                        showMessage('已取消订阅该演员', 'success');
                        if (this.subscribedOnly) { await this.loadActors(); }
                    }
                } catch (err: any) {
                    const msg = err?.message || String(err);
                    if (!wasSub && /已经订阅/.test(msg)) {
                        // 幂等：当已订阅报错时，直接修正UI
                        btn.dataset.sub = '1';
                        if (icon) { icon.classList.remove('fa-bell'); icon.classList.add('fa-bell-slash'); }
                        btn.title = '取消订阅';
                        showMessage('该演员已在订阅列表', 'info');
                        if (this.subscribedOnly) { await this.loadActors(); }
                    } else {
                        console.error('切换订阅失败:', err);
                        showMessage('操作失败，请重试', 'error');
                    }
                } finally {
                    btn.removeAttribute('data-busy');
                }
            });
        }
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
        container.querySelectorAll('.page-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt((e.target as HTMLElement).dataset.page || '1');
                if (page && page !== this.currentPage && !btn.hasAttribute('disabled')) {
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
        return `
            <div class="c-pagination__info">
                共 ${total} 个演员，第 ${currentPage}/${totalPages} 页
            </div>
            <div class="c-pagination">
                ${this.createPaginationButtons(currentPage, totalPages)}
            </div>
        `;
    }

    /**
     * 创建分页按钮
     */
    private createPaginationButtons(currentPage: number, totalPages: number): string {
        const buttons: string[] = [];

        // 首页和上一页
        buttons.push(`<button class="page-button" data-page="1" ${currentPage === 1 ? 'disabled' : ''} title="首页">
            <i class="fas fa-angles-left"></i>
        </button>`);
        buttons.push(`<button class="page-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} title="上一页">
            <i class="fas fa-angle-left"></i>
        </button>`);

        // 页码逻辑
        const pagesToShow = new Set<number>();
        pagesToShow.add(1);
        pagesToShow.add(totalPages);

        for (let i = -2; i <= 2; i++) {
            const page = currentPage + i;
            if (page > 1 && page < totalPages) {
                pagesToShow.add(page);
            }
        }
        if (currentPage > 1 && currentPage < totalPages) {
            pagesToShow.add(currentPage);
        }

        const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);

        let lastPage: number | null = null;
        for (const page of sortedPages) {
            if (lastPage !== null && page - lastPage > 1) {
                buttons.push(`<button class="page-button ellipsis" disabled>...</button>`);
            }
            const isActive = page === currentPage ? ' active' : '';
            buttons.push(`<button class="page-button${isActive}" data-page="${page}">${page}</button>`);
            lastPage = page;
        }

        // 下一页和末页
        buttons.push(`<button class="page-button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} title="下一页">
            <i class="fas fa-angle-right"></i>
        </button>`);
        buttons.push(`<button class="page-button" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''} title="末页">
            <i class="fas fa-angles-right"></i>
        </button>`);

        return buttons.join('');
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
                    <div class="stat-card new-works-stat">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">总演员数</div>
                    </div>
                    <div class="stat-card new-works-stat">
                        <div class="stat-value">${stats.byGender.female || 0}</div>
                        <div class="stat-label">女演员</div>
                    </div>
                    <div class="stat-card new-works-stat">
                        <div class="stat-value">${stats.byGender.male || 0}</div>
                        <div class="stat-label">男演员</div>
                    </div>
                    <div class="stat-card new-works-stat">
                        <div class="stat-value">${stats.byCategory.censored || 0}</div>
                        <div class="stat-label">有码</div>
                    </div>
                    <div class="stat-card new-works-stat">
                        <div class="stat-value">${stats.byCategory.uncensored || 0}</div>
                        <div class="stat-label">无码</div>
                    </div>
                    <div class="stat-card new-works-stat">
                        <div class="stat-value">${stats.byCategory.western || 0}</div>
                        <div class="stat-label">欧美</div>
                    </div>
                    <div class="stat-card new-works-stat">
                        <div class="stat-value">${stats.blacklisted || 0}</div>
                        <div class="stat-label">已拉黑</div>
                    </div>
                    <div class="stat-card new-works-stat">
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
     * 复制演员名字
     */
    async copyActorName(actorId: string, name: string, event?: Event): Promise<void> {
        // 找到被点击的元素，添加视觉反馈
        const clickedElement = event?.target as HTMLElement;
        const nameElement = clickedElement?.closest('.actor-card-name, .actor-alias');

        if (nameElement) {
            // 添加复制动画效果
            nameElement.classList.add('copying');

            // 临时改变复制图标
            const copyIcon = nameElement.querySelector('.actor-name-copy-icon, .actor-alias-copy-icon') as HTMLElement;
            if (copyIcon) {
                const originalClass = copyIcon.className;
                copyIcon.className = copyIcon.className.replace('fa-copy', 'fa-check');
                copyIcon.style.color = '#28a745';

                // 1秒后恢复原状
                setTimeout(() => {
                    copyIcon.className = originalClass;
                    copyIcon.style.color = '';
                    nameElement.classList.remove('copying');
                }, 1000);
            }
        }

        try {
            await navigator.clipboard.writeText(name);

            // 显示简洁的成功消息
            showMessage(`已复制：${name}`, 'success');

            logAsync('INFO', '复制演员名字', {
                actorId,
                name
            });

        } catch (error) {
            // 如果clipboard API不可用，使用fallback方法
            try {
                const textArea = document.createElement('textarea');
                textArea.value = name;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    showMessage(`已复制：${name}`, 'success');

                    logAsync('INFO', '复制演员名字(fallback)', {
                        actorId,
                        name
                    });
                } else {
                    throw new Error('Copy command failed');
                }

            } catch (fallbackError) {
                console.error('Failed to copy actor name:', fallbackError);
                showMessage('复制失败，请手动复制', 'error');

                // 恢复图标状态
                if (nameElement) {
                    const copyIcon = nameElement.querySelector('.actor-name-copy-icon, .actor-alias-copy-icon') as HTMLElement;
                    if (copyIcon) {
                        copyIcon.className = copyIcon.className.replace('fa-check', 'fa-copy');
                        copyIcon.style.color = '';
                        nameElement.classList.remove('copying');
                    }
                }
            }
        }
    }

    /**
     * 编辑演员源数据
     */
    async editActorSourceData(actorId: string): Promise<void> {
        try {
            // 获取演员信息
            const actor = await actorManager.getActorById(actorId);
            if (!actor) {
                showMessage('演员信息不存在', 'error');
                return;
            }

            this.showActorEditModal(actor);

        } catch (error) {
            console.error('Failed to edit actor source data:', error);
            showMessage('打开编辑界面失败', 'error');
        }
    }

    /**
     * 打开演员作品列表页面
     */
    async openActorWorks(actorId: string): Promise<void> {
        try {
            // 获取演员信息
            const actor = await actorManager.getActorById(actorId);
            if (!actor) {
                showMessage('演员信息不存在', 'error');
                return;
            }

            // 构建JavDB演员作品列表URL
            const actorWorksUrl = `https://javdb.com/actors/${actorId}`;

            // 在新标签页中打开演员作品列表
            window.open(actorWorksUrl, '_blank');

            logAsync('INFO', '打开演员作品列表', {
                actorId,
                actorName: actor.name,
                url: actorWorksUrl
            });

        } catch (error) {
            console.error('Failed to open actor works:', error);
            showMessage('打开演员作品列表失败', 'error');
        }
    }

    /**
     * 显示演员编辑模态框
     */
    private showActorEditModal(actor: ActorRecord): void {
        // 创建modal元素
        const modal = document.createElement('div');
        modal.className = 'edit-actor-modal';
        modal.innerHTML = `
            <div class="edit-modal-content">
                <div class="edit-modal-header">
                    <h3>编辑演员: ${this.escapeHtml(actor.name)}</h3>
                    <button class="edit-modal-close">&times;</button>
                </div>
                <div class="edit-modal-body">
                    <div class="edit-form">
                        <div class="form-group">
                            <label for="edit-actor-id">演员ID:</label>
                            <input type="text" id="edit-actor-id" value="${actor.id}" />
                            <small class="form-hint">修改ID后会创建新记录，原记录将被删除</small>
                        </div>
                        <div class="form-group">
                            <label for="edit-actor-name">姓名:</label>
                            <input type="text" id="edit-actor-name" value="${this.escapeHtml(actor.name)}" />
                        </div>
                        <div class="form-group">
                            <label for="edit-actor-aliases">别名 (用逗号分隔):</label>
                            <input type="text" id="edit-actor-aliases" value="${(actor.aliases || []).map(alias => this.escapeHtml(alias)).join(', ')}" />
                        </div>
                        <div class="form-group">
                            <label for="edit-actor-gender">性别:</label>
                            <select id="edit-actor-gender">
                                <option value="female" ${actor.gender === 'female' ? 'selected' : ''}>女性</option>
                                <option value="male" ${actor.gender === 'male' ? 'selected' : ''}>男性</option>
                                <option value="unknown" ${actor.gender === 'unknown' ? 'selected' : ''}>未知</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-actor-category">分类:</label>
                            <select id="edit-actor-category">
                                <option value="censored" ${actor.category === 'censored' ? 'selected' : ''}>有码</option>
                                <option value="uncensored" ${actor.category === 'uncensored' ? 'selected' : ''}>无码</option>
                                <option value="western" ${actor.category === 'western' ? 'selected' : ''}>欧美</option>
                                <option value="unknown" ${actor.category === 'unknown' ? 'selected' : ''}>未知</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-actor-avatar">头像URL:</label>
                            <input type="url" id="edit-actor-avatar" value="${actor.avatarUrl || ''}" />
                        </div>
                        <div class="form-group-checkbox">
                            <input type="checkbox" id="edit-actor-blacklisted" ${actor.blacklisted ? 'checked' : ''} />
                            <label for="edit-actor-blacklisted">加入黑名单</label>
                            <small class="form-hint">仅本地偏好，不影响收藏同步</small>
                        </div>
                    </div>
                    <div class="json-editor">
                        <label for="edit-actor-json">原始JSON数据:</label>
                        <textarea id="edit-actor-json" rows="12">${JSON.stringify(actor, null, 2)}</textarea>
                        <div class="json-editor-buttons">
                            <button id="actor-form-to-json" class="btn-secondary">表单 → JSON</button>
                            <button id="actor-json-to-form" class="btn-secondary">JSON → 表单</button>
                        </div>
                    </div>
                </div>
                <div class="edit-modal-footer">
                    <button id="save-actor" class="btn-primary">保存</button>
                    <button id="cancel-actor-edit" class="btn-secondary">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 获取表单元素
        const idInput = modal.querySelector('#edit-actor-id') as HTMLInputElement;
        const nameInput = modal.querySelector('#edit-actor-name') as HTMLInputElement;
        const aliasesInput = modal.querySelector('#edit-actor-aliases') as HTMLInputElement;
        const genderSelect = modal.querySelector('#edit-actor-gender') as HTMLSelectElement;
        const categorySelect = modal.querySelector('#edit-actor-category') as HTMLSelectElement;
        const avatarInput = modal.querySelector('#edit-actor-avatar') as HTMLInputElement;
        const blacklistedCheckbox = modal.querySelector('#edit-actor-blacklisted') as HTMLInputElement;
        const jsonTextarea = modal.querySelector('#edit-actor-json') as HTMLTextAreaElement;

        // 表单到JSON的转换
        const formToJson = () => {
            const formData = {
                id: idInput.value.trim(),
                name: nameInput.value.trim(),
                aliases: aliasesInput.value.split(',').map(alias => alias.trim()).filter(alias => alias),
                gender: genderSelect.value as 'female' | 'male' | 'unknown',
                category: categorySelect.value as 'censored' | 'uncensored' | 'western' | 'unknown',
                avatarUrl: avatarInput.value.trim() || undefined,
                blacklisted: !!(blacklistedCheckbox && blacklistedCheckbox.checked),
                profileUrl: actor.profileUrl,
                worksUrl: actor.worksUrl,
                details: actor.details,
                syncInfo: actor.syncInfo,
                createdAt: actor.createdAt,
                updatedAt: Date.now()
            };
            jsonTextarea.value = JSON.stringify(formData, null, 2);
        };

        // JSON到表单的转换
        const jsonToForm = () => {
            try {
                const jsonData = JSON.parse(jsonTextarea.value);
                idInput.value = jsonData.id || '';
                nameInput.value = jsonData.name || '';
                aliasesInput.value = jsonData.aliases ? jsonData.aliases.join(', ') : '';
                genderSelect.value = jsonData.gender || 'unknown';
                categorySelect.value = jsonData.category || 'unknown';
                avatarInput.value = jsonData.avatarUrl || '';
                if (blacklistedCheckbox) blacklistedCheckbox.checked = !!jsonData.blacklisted;
            } catch (error) {
                showMessage('JSON格式错误，无法解析', 'error');
            }
        };

        // 事件监听器
        modal.querySelector('#actor-form-to-json')?.addEventListener('click', formToJson);
        modal.querySelector('#actor-json-to-form')?.addEventListener('click', jsonToForm);

        // 关闭modal
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.edit-modal-close')?.addEventListener('click', closeModal);
        modal.querySelector('#cancel-actor-edit')?.addEventListener('click', closeModal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // 保存演员
        modal.querySelector('#save-actor')?.addEventListener('click', async () => {
            try {
                // 先将当前表单内容同步到 JSON，防止用户未点击“表单 → JSON”时修改丢失
                formToJson();

                // 再从 JSON 文本解析
                const updatedActor = JSON.parse(jsonTextarea.value);

                // 验证必要字段
                if (!updatedActor.id || !updatedActor.name) {
                    showMessage('ID和姓名是必填字段', 'error');
                    return;
                }

                // 确保更新时间
                updatedActor.updatedAt = Date.now();

                const originalId = actor.id;
                const newId = updatedActor.id.trim();

                // 检查ID是否发生变化
                if (originalId !== newId) {
                    // ID发生变化，需要删除原记录并创建新记录
                    const existingActor = await actorManager.getActorById(newId);
                    if (existingActor) {
                        showMessage(`ID "${newId}" 已存在，请使用其他ID`, 'error');
                        return;
                    }

                    // 删除原记录并添加新记录
                    await actorManager.deleteActor(originalId);
                    await actorManager.saveActor(updatedActor);

                    showMessage(`演员ID从 "${originalId}" 更改为 "${newId}"`, 'success');
                } else {
                    // ID没有变化，直接更新记录
                    await actorManager.saveActor(updatedActor);
                    showMessage(`演员 "${updatedActor.name}" 已更新`, 'success');
                }

                // 关闭modal并刷新列表
                closeModal();
                await this.loadActors();
                await this.updateStats();
                // 广播全局事件，供其他模块感知变更
                document.dispatchEvent(new Event('actors-data-updated'));

                logAsync('INFO', '演员数据已更新', {
                    actorId: updatedActor.id,
                    actorName: updatedActor.name,
                    originalId: originalId !== newId ? originalId : undefined
                });

            } catch (error: any) {
                console.error('Failed to save actor:', error);
                showMessage(`保存失败: ${error.message}`, 'error');
            }
        });
    }

    /**
     * 删除演员
     */
    async deleteActor(actorId: string): Promise<void> {
        const confirmed = await showDanger('确定要删除这个演员吗？', '删除演员');
        if (!confirmed) {
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

    /**
     * 转义HTML字符
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取分类显示文本
     */
    private getCategoryText(category: string): string {
        switch (category) {
            case 'censored':
                return '有码';
            case 'uncensored':
                return '无码';
            case 'western':
                return '欧美';
            default:
                return '未知';
        }
    }

    /**
     * 切换别名展开/收起状态
     */
    private toggleAliasesExpansion(actorId: string): void {
        const aliasesContainer = document.querySelector(`[data-actor-id="${actorId}"].actor-card-aliases`);
        const toggleBtn = document.querySelector(`[data-actor-id="${actorId}"].aliases-toggle-btn`);
        const icon = toggleBtn?.querySelector('i');

        if (aliasesContainer && toggleBtn && icon) {
            const isExpanded = aliasesContainer.classList.contains('expanded');

            if (isExpanded) {
                // 收起
                aliasesContainer.classList.remove('expanded');
                icon.className = 'fas fa-chevron-down';
                toggleBtn.setAttribute('title', '展开别名');
            } else {
                // 展开
                aliasesContainer.classList.add('expanded');
                icon.className = 'fas fa-chevron-up';
                toggleBtn.setAttribute('title', '收起别名');
            }
        }
    }

    /**
     * 检查别名是否溢出，决定是否显示展开按钮
     */
    private checkAliasesOverflow(actorId: string): void {
        // 使用 setTimeout 确保DOM已经渲染完成
        setTimeout(() => {
            const aliasesContainer = document.querySelector(`[data-actor-id="${actorId}"].actor-card-aliases`);
            const aliasesList = aliasesContainer?.querySelector('.actor-aliases-list');

            if (aliasesContainer && aliasesList) {
                // 获取别名数量来判断是否需要折叠
                const aliasCount = aliasesList.querySelectorAll('.actor-alias').length;

                // 如果别名超过6个，或者内容高度超过80px，则认为需要折叠
                const listHeight = aliasesList.scrollHeight;
                const shouldCollapse = aliasCount > 6 || listHeight > 80;

                if (shouldCollapse) {
                    aliasesContainer.classList.add('has-overflow');
                } else {
                    aliasesContainer.classList.remove('has-overflow');
                }
            }
        }, 100);
    }
}

// 导出单例实例
export const actorsTab = new ActorsTab();

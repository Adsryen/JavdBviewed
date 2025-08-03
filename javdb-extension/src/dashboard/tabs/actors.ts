// src/dashboard/tabs/actors.ts
// 演员库标签页

import { actorManager } from '../../services/actorManager';
import { ActorAvatar } from '../../components/ActorAvatar';
import { SimpleActorAvatar } from '../../components/SimpleActorAvatar';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import type { ActorRecord, ActorSearchResult } from '../../types';

export class ActorsTab {
    private currentPage = 1;
    private pageSize = 20;
    private currentQuery = '';
    private currentSort = 'name';
    private currentOrder: 'asc' | 'desc' = 'asc';
    private currentGenderFilter = '';
    private currentCategoryFilter = '';
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
                this.currentOrder,
                this.currentGenderFilter || undefined,
                this.currentCategoryFilter || undefined
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
    private createActorCard(actor: ActorRecord): string {
        const worksCount = actor.details?.worksCount || 0;
        const lastSync = actor.syncInfo?.lastSyncAt
            ? new Date(actor.syncInfo.lastSyncAt).toLocaleDateString()
            : '未同步';

        // 安全地转义字符串，防止XSS和引号问题
        const escapeName = (name: string) => name.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const escapeForJs = (name: string) => name.replace(/'/g, "\\'").replace(/"/g, '\\"');

        return `
            <div class="actor-card" data-actor-id="${actor.id}">
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
                    ${actor.aliases.length > 0 ? `
                        <div class="actor-card-aliases">
                            <div class="actor-aliases-list">
                                ${actor.aliases.map(alias => `
                                    <div class="actor-alias"
                                         title="点击复制：${escapeName(alias)}"
                                         data-actor-id="${actor.id}"
                                         data-actor-name="${escapeForJs(alias)}">
                                        <span class="actor-alias-text">${escapeName(alias)}</span>
                                        <i class="fas fa-copy actor-alias-copy-icon"></i>
                                    </div>
                                `).join('')}
                            </div>
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
                        <div class="stat-value">${stats.byCategory.censored || 0}</div>
                        <div class="stat-label">有码</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.byCategory.uncensored || 0}</div>
                        <div class="stat-label">无码</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.byCategory.western || 0}</div>
                        <div class="stat-label">欧美</div>
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
                            <input type="text" id="edit-actor-aliases" value="${actor.aliases.map(alias => this.escapeHtml(alias)).join(', ')}" />
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
                // 先尝试从JSON解析
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
}

// 导出单例实例
export const actorsTab = new ActorsTab();

// src/dashboard/tabs/actors.ts
// 演员库标签页

import { actorManager } from '../../features/actors';
import { newWorksManager } from '../../features/newWorks';
import { showMessage } from '../ui/toast';
import { getSettings } from '../../utils/storage';
import { showConfirm } from '../components/confirmModal';
import { logAsync } from '../logger';
import type { ActorRecord, ActorPagedSearchResult, ExtensionSettings } from '../../types';
import { buildJavDBUrl } from '../../features/routeManagement';
import {
    buildSubscribedActorSearchResult,
} from './actors/queryModel';
import { buildActorPaginationHtml } from './actors/paginationModel';
import {
    applyActorPageSelection,
    buildBatchBlacklistConfirmationMessage,
    buildBatchSelectionUiState,
    buildBatchSubscribeConfirmationMessage,
} from './actors/batchOperationModel';
import {
    clearSelectedActorCards,
    getCurrentActorCardIds,
    setActorCardSelected,
    setCurrentActorCardsSelected,
    updateActorBatchUi,
} from './actors/batchOperationRuntime';
import {
    type ActorMetadataRefreshResult,
} from './actors/metadataRefreshModel';
import { refreshActorMetadataWorkflow } from './actors/metadataRefreshWorkflow';
import { setupActorCardRuntime } from './actors/actorCardRuntime';
import { showActorEditModalRuntime } from './actors/actorEditModalRuntime';
import { runActorBatchWorkflow } from './actors/batchActionWorkflow';
import { copyActorNameRuntime } from './actors/actorClipboardRuntime';
import { renderActorStats } from './actors/statsRuntime';
import { renderActorListRuntime } from './actors/actorListRuntime';
import { setupActorControlsRuntime, syncActorViewModeButton } from './actors/actorControlsRuntime';
import { scheduleActorAliasesOverflowCheck, toggleActorAliasesExpansion } from './actors/actorAliasRuntime';
import {
    deleteActorWorkflow,
    editActorSourceDataWorkflow,
    openActorWorksWorkflow,
} from './actors/actorSingleActionWorkflow';

export class ActorsTab {
    private currentPage = 1;
    private pageSize = 20;
    private currentQuery = '';
    private currentSort = 'updatedAt';
    private currentOrder: 'asc' | 'desc' = 'desc';
    private currentGenderFilter = '';
    private currentCategoryFilter = '';
    private currentBlacklistFilter: 'all' | 'exclude' | 'only' = 'all';
    private subscribedOnly: boolean = false;
    private isLoading = false;
    public isInitialized = false;
    private settings?: ExtensionSettings;
    private currentViewMode: 'list' | 'card' = 'list';
    
    // 批量操作相关
    private selectedActors = new Set<string>();

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
            console.error('[Actor] Failed to initialize actors tab:', error);
            showMessage('初始化演员库失败', 'error');
        }
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        setupActorControlsRuntime({
            subscribedOnly: this.subscribedOnly,
            blacklistFilter: this.currentBlacklistFilter,
        }, {
            changeQuery: query => {
                this.currentQuery = query;
                this.currentPage = 1;
                this.loadActors();
            },
            changeSort: (sortBy, order) => {
                this.currentSort = sortBy;
                this.currentOrder = order;
                this.currentPage = 1;
                this.loadActors();
            },
            changeGenderFilter: value => {
                this.currentGenderFilter = value;
                this.currentPage = 1;
                this.loadActors();
            },
            changeCategoryFilter: value => {
                this.currentCategoryFilter = value;
                this.currentPage = 1;
                this.loadActors();
            },
            changeStatusFilter: nextState => {
                this.subscribedOnly = nextState.subscribedOnly;
                this.currentBlacklistFilter = nextState.blacklistFilter;
                this.currentPage = 1;
                this.loadActors();
            },
            changeBlacklistFilter: value => {
                this.currentBlacklistFilter = value;
                this.currentPage = 1;
                this.loadActors();
            },
            changeSubscribedOnly: value => {
                this.subscribedOnly = value;
                this.currentPage = 1;
                this.loadActors();
            },
            changePageSize: value => {
                this.pageSize = value;
                this.currentPage = 1;
                this.loadActors();
            },
            refreshActors: () => {
                this.loadActors();
                this.updateStats();
            },
            toggleViewMode: () => {
                this.currentViewMode = this.currentViewMode === 'list' ? 'card' : 'list';
                syncActorViewModeButton(this.currentViewMode);
                this.loadActors();
            },
            handleSelectAll: () => this.handleSelectAll(),
            handleBatchRefresh: () => this.handleBatchRefresh(),
            handleBatchBlacklist: () => this.handleBatchBlacklist(),
            handleBatchSubscribe: () => this.handleBatchSubscribe(),
            handleBatchDelete: () => this.handleBatchDelete(),
            clearSelection: () => this.clearAllSelection(),
        });
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
                const result: ActorPagedSearchResult = await actorManager.searchActors(
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
                const [subscriptions, allActors] = await Promise.all([
                    newWorksManager.getSubscriptions().catch(() => [] as any[]),
                    actorManager.getAllActors(),
                ]);
                const result = buildSubscribedActorSearchResult({
                    actors: allActors,
                    subscriptions,
                    query: this.currentQuery,
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    sortBy: this.currentSort,
                    order: this.currentOrder,
                    genderFilter: this.currentGenderFilter || undefined,
                    categoryFilter: this.currentCategoryFilter || undefined,
                    blacklistFilter: this.currentBlacklistFilter,
                });
                await this.renderActorList(result);
                this.renderPagination(result);
            }

        } catch (error) {
            console.error('[Actor] Failed to load actors:', error);
            showMessage('加载演员列表失败', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * 渲染演员列表
     */
    private async renderActorList(result: ActorPagedSearchResult): Promise<void> {
        const container = document.getElementById('actorListContainer');
        if (!container) return;

        // 获取订阅集合（存在即视为已订阅）
        let subscribedSet = new Set<string>();
        try {
            const subs = await newWorksManager.getSubscriptions();
            subscribedSet = new Set(subs.map(s => s.actorId));
        } catch (e) {
            subscribedSet = new Set();
        }

        renderActorListRuntime(container, result, {
            currentQuery: this.currentQuery,
            currentViewMode: this.currentViewMode,
            selectedActorIds: this.selectedActors,
            subscribedActorIds: subscribedSet,
            showBlacklistBadge: !!this.settings?.actorLibrary.blacklist.showBadge,
            openActorWorks: actorId => this.openActorWorks(actorId),
            selectActor: (actorId, isSelected) => this.handleActorSelection(actorId, isSelected),
            setupActorCard: actor => this.setupActorCardEventListeners(actor),
            updateBatchUi: () => this.updateBatchUI(),
        });
    }

    /**
     * 为演员卡片设置事件监听器
     */
    private setupActorCardEventListeners(actor: ActorRecord): void {
        setupActorCardRuntime(actor.id, {
            copyActorName: (actorId, actorName, event) => this.copyActorName(actorId, actorName, event),
            openActorWorks: actorId => this.openActorWorks(actorId),
            editActorSourceData: actorId => this.editActorSourceData(actorId),
            refreshActorMetadata: actorId => this.refreshActorMetadata(actorId),
            deleteActor: actorId => this.deleteActor(actorId),
            toggleBlacklisted: async (actorId, isBlacklisted) => {
                await actorManager.setBlacklisted(actorId, !isBlacklisted);
                await this.loadActors();
                await this.updateStats();
            },
            toggleAliasesExpansion: actorId => toggleActorAliasesExpansion(actorId),
            checkAliasesOverflow: actorId => scheduleActorAliasesOverflowCheck(actorId),
            addSubscription: actorId => newWorksManager.addSubscription(actorId),
            removeSubscription: actorId => newWorksManager.removeSubscription(actorId),
            isSubscribedOnly: () => this.subscribedOnly,
            reloadActors: () => this.loadActors(),
            showMessage,
            logError: (context, error) => console.error(context, error),
        });
    }

    /**
     * 渲染分页控件
     */
    private renderPagination(result: ActorPagedSearchResult): void {
        const container = document.getElementById('actorPaginationContainer');
        if (!container) return;

        const totalPages = Math.ceil(result.total / result.pageSize);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const pagination = buildActorPaginationHtml(result.page, totalPages, result.total);
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
                renderActorStats(statsEl, stats, {
                    onFilterSelected: nextFilterState => {
                        this.currentQuery = nextFilterState.query;
                        this.currentGenderFilter = nextFilterState.genderFilter;
                        this.currentCategoryFilter = nextFilterState.categoryFilter;
                        this.currentBlacklistFilter = nextFilterState.blacklistFilter;

                        if (nextFilterState.sortBy) {
                            this.currentSort = 'updatedAt';
                            this.currentOrder = nextFilterState.order || 'desc';
                        }

                        this.currentPage = 1;
                    },
                    loadActors: () => {
                        this.loadActors();
                    },
                });
            }
        } catch (error) {
            console.error('[Actor] Failed to update actor stats:', error);
        }
    }

    /**
     * 复制演员名字
     */
    async copyActorName(actorId: string, name: string, event?: Event): Promise<void> {
        await copyActorNameRuntime(actorId, name, event, {
            showMessage,
            logCopy: (copiedActorId, copiedName, usedFallback) => logAsync('INFO', usedFallback ? '复制演员名字(fallback)' : '复制演员名字', {
                actorId: copiedActorId,
                name: copiedName
            }),
            logError: (context, error) => console.error(context, error),
        });
    }

    /**
     * 编辑演员源数据
     */
    async editActorSourceData(actorId: string): Promise<void> {
        await editActorSourceDataWorkflow(actorId, {
            getActorById: id => actorManager.getActorById(id),
            showActorEditModal: actor => this.showActorEditModal(actor),
            showMessage,
            logError: (context, error) => console.error(context, error),
        });
    }

    /**
     * 打开演员作品列表页面
     */
    async openActorWorks(actorId: string): Promise<void> {
        await openActorWorksWorkflow(actorId, {
            getActorById: id => actorManager.getActorById(id),
            buildActorUrl: path => buildJavDBUrl(path),
            openUrl: url => window.open(url, '_blank'),
            showMessage,
            log: (level, message, data) => logAsync(level, message, data),
            logError: (context, error) => console.error(context, error),
        });
    }

    /**
     * 显示演员编辑模态框
     */
    private showActorEditModal(actor: ActorRecord): void {
        showActorEditModalRuntime(actor, {
            saveActor: async (updatedActor, context) => {
                const originalId = context.originalActor.id;
                const newId = updatedActor.id.trim();

                if (originalId !== newId) {
                    const existingActor = await actorManager.getActorById(newId);
                    if (existingActor) {
                        showMessage(`ID "${newId}" 已存在，请使用其他ID`, 'error');
                        return;
                    }

                    await actorManager.deleteActor(originalId);
                    await actorManager.saveActor(updatedActor);

                    showMessage(`演员ID从 "${originalId}" 更改为 "${newId}"`, 'success');
                } else {
                    await actorManager.saveActor(updatedActor);
                    showMessage(`演员 "${updatedActor.name}" 已更新`, 'success');
                }

                context.closeModal();
                await this.loadActors();
                await this.updateStats();
                document.dispatchEvent(new Event('actors-data-updated'));

                logAsync('INFO', '演员数据已更新', {
                    actorId: updatedActor.id,
                    actorName: updatedActor.name,
                    originalId: originalId !== newId ? originalId : undefined,
                    lockedFields: context.lockedFields
                });
            },
            showMessage,
            logError: (context, error) => console.error(context, error),
        });
    }



    /**
     * 刷新演员元数据
     */
    async refreshActorMetadata(actorId: string): Promise<ActorMetadataRefreshResult> {
        try {
            return await refreshActorMetadataWorkflow(actorId, {
                getActorById: id => actorManager.getActorById(id),
                buildActorUrl: path => buildJavDBUrl(path),
                fetchActorPage: url => fetch(url),
                getActorRemarks: async actorName => {
                    const { actorExtraInfoService } = await import('../../features/actorRemarks');
                    return actorExtraInfoService.getActorRemarksWithDiagnostics(actorName);
                },
                saveActor: actor => actorManager.saveActor(actor),
                reloadActors: () => this.loadActors(),
                refreshStats: () => this.updateStats(),
                dispatchDataUpdated: () => document.dispatchEvent(new Event('actors-data-updated')),
                log: (level, message, data) => logAsync(level, message, data),
            });
        } catch (error: any) {
            console.error('[Actor] Failed to refresh actor metadata:', error);
            throw error;
        }
    }

    /**
     * 删除演员
     */
    async deleteActor(actorId: string): Promise<void> {
        await deleteActorWorkflow(actorId, {
            confirm: options => showConfirm(options),
            deleteActor: id => actorManager.deleteActor(id),
            reloadActors: () => this.loadActors(),
            refreshStats: () => this.updateStats(),
            showMessage,
            logError: (context, error) => console.error(context, error),
        });
    }

    /**
     * 处理演员选择
     */
    private handleActorSelection(actorId: string, isSelected: boolean): void {
        if (isSelected) {
            this.selectedActors.add(actorId);
        } else {
            this.selectedActors.delete(actorId);
        }

        // 更新UI
        setActorCardSelected(actorId, isSelected);

        this.updateBatchUI();
    }

    /**
     * 处理全选/取消全选
     */
    private handleSelectAll(): void {
        const selectAllCheckbox = document.getElementById('actorSelectAllCheckbox') as HTMLInputElement;
        const isChecked = selectAllCheckbox.checked;

        const currentActorIds = getCurrentActorCardIds();
        this.selectedActors = applyActorPageSelection(this.selectedActors, currentActorIds, isChecked);
        setCurrentActorCardsSelected(isChecked);

        this.updateBatchUI();
    }

    /**
     * 清除所有选择
     */
    private clearAllSelection(): void {
        this.selectedActors.clear();
        clearSelectedActorCards();
        this.updateBatchUI();
    }

    /**
     * 更新批量操作UI
     */
    private updateBatchUI(): void {
        const currentActorIds = getCurrentActorCardIds();
        const state = buildBatchSelectionUiState(this.selectedActors, currentActorIds);
        updateActorBatchUi(state);
    }

    private async finalizeBatchOperation(): Promise<void> {
        this.clearAllSelection();
        await this.loadActors();
        await this.updateStats();
    }

    /**
     * 批量刷新元数据
     */
    private async handleBatchRefresh(): Promise<void> {
        if (this.selectedActors.size === 0) return;

        const selectedIds = Array.from(this.selectedActors);
        
        const confirmed = await showConfirm({
            title: '批量刷新确认',
            message: `确定要刷新选中的 ${selectedIds.length} 个演员的元数据吗？\n\n此操作将从JavDB重新获取演员信息，可能需要较长时间。`,
            confirmText: '确认刷新',
            cancelText: '取消',
            type: 'warning'
        });

        if (!confirmed) return;

        try {
            showMessage('开始批量刷新演员元数据...', 'info');
            await runActorBatchWorkflow({
                actionName: '批量刷新',
                items: selectedIds,
                runItem: async actorId => {
                    await this.refreshActorMetadata(actorId);
                },
                afterComplete: () => this.finalizeBatchOperation(),
                showMessage,
                logItemError: (actorId, error) => console.error(`[Actor] Failed to refresh actor ${actorId}:`, error),
            });

        } catch (error) {
            console.error('[Actor] Batch refresh failed:', error);
            showMessage('批量刷新失败', 'error');
        }
    }

    /**
     * 批量拉黑管理
     */
    private async handleBatchBlacklist(): Promise<void> {
        if (this.selectedActors.size === 0) return;

        const selectedIds = Array.from(this.selectedActors);
        
        // 检查选中演员的拉黑状态
        const actors: ActorRecord[] = [];
        for (const id of selectedIds) {
            const actor = await actorManager.getActorById(id);
            if (actor) {
                actors.push(actor);
            }
        }

        const blacklistedCount = actors.filter(actor => actor.blacklisted).length;
        const notBlacklistedCount = actors.length - blacklistedCount;
        const message = buildBatchBlacklistConfirmationMessage({
            selectedCount: selectedIds.length,
            blacklistedCount,
            notBlacklistedCount,
        });

        const confirmed = await showConfirm({
            title: '批量拉黑管理',
            message: message,
            confirmText: '确认操作',
            cancelText: '取消',
            type: 'warning'
        });

        if (!confirmed) return;

        try {
            await runActorBatchWorkflow({
                actionName: '批量拉黑管理',
                items: actors,
                runItem: async actor => {
                    await actorManager.setBlacklisted(actor.id, !actor.blacklisted);
                },
                afterComplete: () => this.finalizeBatchOperation(),
                showMessage,
                logItemError: (actor, error) => console.error(`[Actor] Failed to update blacklist for actor ${actor.id}:`, error),
            });

        } catch (error) {
            console.error('[Actor] Batch blacklist failed:', error);
            showMessage('批量拉黑管理失败', 'error');
        }
    }

    /**
     * 批量订阅管理
     */
    private async handleBatchSubscribe(): Promise<void> {
        if (this.selectedActors.size === 0) return;

        const selectedIds = Array.from(this.selectedActors);
        
        try {
            // 获取当前订阅状态
            const subscriptions = await newWorksManager.getSubscriptions();
            const subscribedSet = new Set(subscriptions.map(s => s.actorId));
            
            const subscribedCount = selectedIds.filter(id => subscribedSet.has(id)).length;
            const notSubscribedCount = selectedIds.length - subscribedCount;
            const message = buildBatchSubscribeConfirmationMessage({
                selectedCount: selectedIds.length,
                subscribedCount,
                notSubscribedCount,
            });

            const confirmed = await showConfirm({
                title: '批量订阅管理',
                message: message,
                confirmText: '确认操作',
                cancelText: '取消',
                type: 'info'
            });

            if (!confirmed) return;

            await runActorBatchWorkflow({
                actionName: '批量订阅管理',
                items: selectedIds,
                runItem: async actorId => {
                    const isSubscribed = subscribedSet.has(actorId);
                    if (isSubscribed) {
                        await newWorksManager.removeSubscription(actorId);
                    } else {
                        await newWorksManager.addSubscription(actorId);
                    }
                },
                afterComplete: () => this.finalizeBatchOperation(),
                showMessage,
                logItemError: (actorId, error) => console.error(`[Actor] Failed to update subscription for actor ${actorId}:`, error),
            });

        } catch (error) {
            console.error('[Actor] Batch subscribe failed:', error);
            showMessage('批量订阅管理失败', 'error');
        }
    }

    /**
     * 批量删除
     */
    private async handleBatchDelete(): Promise<void> {
        if (this.selectedActors.size === 0) return;

        const selectedIds = Array.from(this.selectedActors);
        
        const confirmed = await showConfirm({
            title: '批量删除确认',
            message: `确定要删除选中的 ${selectedIds.length} 个演员吗？\n\n此操作不可撤销！`,
            confirmText: '确认删除',
            cancelText: '取消',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await runActorBatchWorkflow({
                actionName: '批量删除',
                items: selectedIds,
                runItem: async actorId => {
                    await actorManager.deleteActor(actorId);
                },
                afterComplete: () => this.finalizeBatchOperation(),
                showMessage,
                logItemError: (actorId, error) => console.error(`[Actor] Failed to delete actor ${actorId}:`, error),
            });

        } catch (error) {
            console.error('[Actor] Batch delete failed:', error);
            showMessage('批量删除失败', 'error');
        }
    }
}

// 导出单例实例
export const actorsTab = new ActorsTab();

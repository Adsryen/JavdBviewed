// src/dashboard/tabs/newWorks.ts
// 新作品标签页实现

import { newWorksManager } from '../../features/newWorks';
// 移除未使用的 actorManager 与 newWorksCollector 引用
import { actorSelector } from '../components/actorSelector';
import { newWorksConfigModal } from '../components/newWorks/configModal';
import { showMessage } from '../ui/toast';
import { showConfirm, showDanger } from '../components/confirmModal';
import {
    MAX_UNREAD_BATCH_OPEN_COUNT,
    getNewWorksPageSize,
    getUnreadBatchOpenCooldownRemaining,
    getUnreadBatchOpenCooldownSeconds,
} from './newWorksBatchOpenPolicy';
import { runUnreadBatchOpenWorkflow } from './newWorksBatchOpenWorkflow';
import { attachNewWorksFilterControls } from './newWorksFilterControlsRuntime';
import type { NewWorksFilters } from './newWorksFilterTypes';
import { renderNewWorksListRuntime } from './newWorksListRuntime';
import {
    clearNewWorksSelection,
    selectAllCurrentNewWorksPage,
    syncNewWorksBatchOperations,
} from './newWorksListRuntime';
import { runNewWorksManualCheckWorkflow } from './newWorksManualCheckWorkflow';
import { runNewWorksStatusSyncWorkflow } from './newWorksStatusSyncWorkflow';
import { runNewWorksAutoStatusSyncWorkflow } from './newWorksAutoStatusSyncWorkflow';
import {
    runDeleteWorksWorkflow,
    runMarkWorksAsReadWorkflow,
    runVisitWorkWorkflow,
} from './newWorksItemActionsWorkflow';
import { attachNewWorksHelpTooltip } from './newWorksHelpTooltipRuntime';
import { updateNewWorksLastCheckTimeDisplay } from './newWorksLastCheckTimeRuntime';
import { openSubscriptionManagementModal } from './newWorksSubscriptionModalRuntime';
import { runSingleSubscriptionCheckWorkflow } from './newWorksSingleSubscriptionCheckWorkflow';
import { runNewWorksGlobalConfigWorkflow } from './newWorksGlobalConfigWorkflow';
import { runAddSubscriptionWorkflow } from './newWorksAddSubscriptionWorkflow';
import { runManageSubscriptionsWorkflow } from './newWorksManageSubscriptionsWorkflow';
import {
    attachNewWorksProgressListener,
    detachNewWorksProgressListener,
    ensureNewWorksProgressUI,
    hideNewWorksProgressUIAfter,
    updateNewWorksProgressUI,
} from './newWorksProgressRuntime';
import type { NewWorksProgressData } from './newWorksProgressRuntime';
import { renderNewWorksStatsRuntime } from './newWorksStatsRuntime';
import {
    findSelectedBatchWorkById,
    runSelectedBatchOpenWorkflow,
} from './newWorksSelectedBatchWorkflow';
import {
    getSelectedBatchCurrentPageWork,
    setBatchOpenSelectedButtonLoading,
} from './newWorksSelectedBatchRuntime';
import { runBatchDeleteSelectedWorkflow } from './newWorksBatchDeleteWorkflow';
import type { NewWorkRecord, ActorSubscription } from '../../types';
import { attachNewWorksButtonEvents } from './newWorksButtonEventsRuntime';
import {
    setBatchDeleteSelectedButtonLoading as setBatchDeleteSelectedButtonLoadingState,
    setCheckNowButtonLoading as setCheckNowButtonLoadingState,
    setSyncStatusButtonLoading as setSyncStatusButtonLoadingState,
    updateBatchOpenUnreadButtonState,
} from './newWorksButtonStateRuntime';

export class NewWorksTab {
    public isInitialized: boolean = false;
    private currentPage: number = 1;
    private currentFilters: NewWorksFilters = {
        search: '',
        filter: 'unread',
        sort: 'discoveredAt_desc'
    };
    private selectedWorks: Set<string> = new Set();
    private isLoading: boolean = false;
    private debounceRender = this.debounce(() => this.render(), 300);
    private progressListener?: (message: any) => void;
    private progressEl?: HTMLElement;
    private lastUnreadBatchOpenAt: number = 0;
    private unreadBatchOpenCooldownTimer?: number;

    /**
     * 初始化新作品标签页
     */
    async initialize(): Promise<void> {
        try {
            console.log('[NewWorks] 开始初始化新作品标签页');

            // 确保DOM元素存在
            await this.waitForDOM();

            // 设置事件监听器
            await this.setupEventListeners();

            // 监听刷新事件
            window.addEventListener('newworks-refresh', () => {
                console.log('[NewWorks] 收到刷新事件，重新渲染列表');
                this.render();
            });

            // 渲染页面
            await this.render();

            // 自动同步状态（静默执行）
            this.autoSyncStatus();

            this.isInitialized = true;
            console.log('[NewWorks] 新作品标签页初始化完成');
        } catch (error) {
            console.error('[NewWorks] 初始化新作品标签页失败:', error);
        }
    }

    /**
     * 批量打开当前页的未读新作品，并标记为已读
     */
    private async batchOpenCurrentPageUnread(): Promise<void> {
        await runUnreadBatchOpenWorkflow({
            filters: this.currentFilters,
            page: this.currentPage,
            pageSize: this.getCurrentPageSize(),
            deps: {
                getCooldownRemaining: () => this.getUnreadBatchOpenCooldownRemaining(),
                getCooldownSeconds: () => this.getUnreadBatchOpenCooldownSeconds(),
                updateButton: options => this.updateBatchOpenUnreadButton(options),
                getNewWorks: query => newWorksManager.getNewWorks(query as any),
                confirm: options => showConfirm(options),
                openWorkUrl: url => this.openNewWorkUrl(url),
                markAsRead: workIds => newWorksManager.markAsRead(workIds),
                startCooldown: () => this.startUnreadBatchOpenCooldown(),
                render: () => this.render(),
                showMessage,
                logWarn: (message, error) => console.warn(message, error),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    private async openNewWorkUrl(url: string): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
            await new Promise<void>((resolve) => {
                try { chrome.tabs.create({ url }, () => resolve()); } catch { resolve(); }
            });
        } else {
            window.open(url, '_blank');
        }
    }

    private getCurrentPageSize(): number {
        return getNewWorksPageSize(this.currentFilters.filter);
    }

    private getUnreadBatchOpenCooldownRemaining(now: number = Date.now()): number {
        return getUnreadBatchOpenCooldownRemaining(this.lastUnreadBatchOpenAt, now);
    }

    private getUnreadBatchOpenCooldownSeconds(now: number = Date.now()): number {
        return getUnreadBatchOpenCooldownSeconds(this.lastUnreadBatchOpenAt, now);
    }

    private startUnreadBatchOpenCooldown(): void {
        this.lastUnreadBatchOpenAt = Date.now();
        if (this.unreadBatchOpenCooldownTimer) {
            window.clearInterval(this.unreadBatchOpenCooldownTimer);
        }

        this.updateBatchOpenUnreadButton();
        this.unreadBatchOpenCooldownTimer = window.setInterval(() => {
            this.updateBatchOpenUnreadButton();
            if (this.getUnreadBatchOpenCooldownRemaining() <= 0 && this.unreadBatchOpenCooldownTimer) {
                window.clearInterval(this.unreadBatchOpenCooldownTimer);
                this.unreadBatchOpenCooldownTimer = undefined;
            }
        }, 1000);
    }

    private updateBatchOpenUnreadButton(options?: { loading?: boolean }): void {
        updateBatchOpenUnreadButtonState({
            loading: options?.loading,
            cooldownSeconds: this.getUnreadBatchOpenCooldownSeconds(),
            maxOpenCount: MAX_UNREAD_BATCH_OPEN_COUNT,
        });
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
        attachNewWorksButtonEvents({
            openGlobalConfig: () => this.showGlobalConfigModal(),
            checkNow: () => this.checkNewWorksNow(),
            syncStatus: () => this.syncNewWorksStatus(),
            setupSyncHelp: () => this.setupHelpIcon(),
            setupCheckNowHelp: () => this.setupCheckNowHelpIcon(),
            addSubscription: () => this.showAddSubscriptionModal(),
            manageSubscriptions: () => this.showManageSubscriptionsModal(),
            confirmCleanupRead: () => showDanger('将删除所有已读的新作品，操作不可撤销，确认继续？', '清理已读'),
            cleanupReadWorks: () => newWorksManager.cleanupReadWorks(),
            render: () => this.render(),
            showMessage,
            logError: (message, error) => console.error(message, error),
            batchOpenUnread: () => this.batchOpenCurrentPageUnread(),
            updateBatchOpenUnreadButton: () => this.updateBatchOpenUnreadButton(),
            selectAllCurrentPage: () => this.selectAllCurrentPage(),
            clearSelection: () => this.clearSelection(),
            batchOpenSelected: () => this.batchOpenSelected(),
            batchDeleteSelected: () => this.batchDeleteSelected(),
        });
    }

    /**
     * 绑定表单事件
     */
    private bindFormEvents(): void {
        attachNewWorksFilterControls(this.currentFilters, {
            setPage: page => { this.currentPage = page; },
            render: () => this.render(),
            debounceRender: () => this.debounceRender(),
        });
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
        await renderNewWorksStatsRuntime({
            filters: this.currentFilters,
            deps: {
                getStats: () => newWorksManager.getStats(),
                setPage: page => { this.currentPage = page; },
                render: () => this.render(),
                openSubscriptionManager: () => {
                    const manageBtn = document.getElementById('manageSubscriptionsBtn') as HTMLButtonElement | null;
                    manageBtn?.click();
                },
                updateLastCheckTimeDisplay: lastCheckTime => this.updateLastCheckTimeDisplay(lastCheckTime),
                logInfo: (message, data) => data === undefined ? console.log(message) : console.log(message, data),
                logWarn: message => console.warn(message),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 渲染新作品列表
     */
    private async renderNewWorksList(): Promise<void> {
        await renderNewWorksListRuntime({
            filters: this.currentFilters,
            page: this.currentPage,
            pageSize: this.getCurrentPageSize(),
            selectedWorks: this.selectedWorks,
            deps: {
                getNewWorks: query => newWorksManager.getNewWorks(query),
                setPage: page => { this.currentPage = page; },
                render: () => this.render(),
                updateBatchOpenUnreadButton: () => this.updateBatchOpenUnreadButton(),
                markWorksAsRead: workIds => this.markWorksAsRead(workIds),
                visitWork: workId => this.visitWork(workId),
                deleteWorks: workIds => this.deleteWorks(workIds),
                updateBatchOperations: () => this.updateBatchOperations(),
                logInfo: (message, data) => data === undefined ? console.log(message) : console.log(message, data),
                logWarn: message => console.warn(message),
                logError: (message, error) => console.error(message, error),
            },
        });
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
        await runMarkWorksAsReadWorkflow({
            workIds,
            deps: {
                markAsRead: ids => newWorksManager.markAsRead(ids),
                render: () => this.render(),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 访问作品
     */
    private async visitWork(workId: string): Promise<void> {
        await runVisitWorkWorkflow({
            workId,
            deps: {
                getNewWorks: query => newWorksManager.getNewWorks(query),
                openUrl: url => window.open(url, '_blank'),
                markWorksAsRead: ids => this.markWorksAsRead(ids),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 删除作品
     */
    private async deleteWorks(workIds: string[]): Promise<void> {
        await runDeleteWorksWorkflow({
            workIds,
            deps: {
                confirm: message => confirm(message),
                deleteWorks: ids => newWorksManager.deleteWorks(ids),
                clearSelection: () => this.selectedWorks.clear(),
                render: () => this.render(),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 同步新作品状态
     */
    private async syncNewWorksStatus(): Promise<void> {
        await runNewWorksStatusSyncWorkflow({
            deps: {
                setSyncButtonLoading: loading => this.setSyncStatusButtonLoading(loading),
                syncWithVideoRecords: () => newWorksManager.syncWithVideoRecords(),
                render: () => this.render(),
                showMessage,
                logInfo: (message, data) => data === undefined ? console.log(message) : console.log(message, data),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    private setSyncStatusButtonLoading(loading: boolean): void {
        setSyncStatusButtonLoadingState(loading);
    }

    /**
     * 初始化时自动同步状态（静默执行）
     */
    private async autoSyncStatus(): Promise<void> {
        await runNewWorksAutoStatusSyncWorkflow({
            deps: {
                syncWithVideoRecords: () => newWorksManager.syncWithVideoRecords(),
                render: () => this.render(),
                logInfo: message => console.log(message),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 设置帮助图标的自定义tooltip
     */
    private setupHelpIcon(): void {
        const helpIcon = document.getElementById('syncStatusHelpIcon');
        if (!helpIcon) return;

        const helpText = '将新作品列表中的作品状态与番号库同步。\n\n例如：如果某个新作品在番号库中被标记为"已看"或"已浏览"，点击此按钮后会自动更新新作品列表中的状态。\n\n建议在浏览完作品后点击此按钮，保持状态一致。';
        attachNewWorksHelpTooltip(helpIcon, helpText);
    }

    /**
     * 设置立即检查按钮的帮助图标
     */
    private setupCheckNowHelpIcon(): void {
        const helpIcon = document.getElementById('checkNowHelpIcon');
        if (!helpIcon) return;

        const helpText = '立即检查所有已启用的订阅演员的新作品。\n\n系统会根据设置的并发数量同时检查多个演员，并自动过滤已看、已浏览等状态的作品。\n\n检查完成后，新发现的作品会显示在下方列表中。';
        attachNewWorksHelpTooltip(helpIcon, helpText);
    }

    /**
     * 更新批量操作状态
     */
    private updateBatchOperations(): void {
        syncNewWorksBatchOperations(this.selectedWorks);
    }

    /**
     * 本页全选
     */
    private selectAllCurrentPage(): void {
        selectAllCurrentNewWorksPage(this.selectedWorks);
        this.updateBatchOperations();
    }

    /**
     * 清空选择
     */
    private clearSelection(): void {
        console.log('执行清空选择，当前选中数量:', this.selectedWorks.size);
        clearNewWorksSelection(this.selectedWorks);
        this.updateBatchOperations();
        console.log('清空选择完成');
    }

    /**
     * 批量打开（已选）
     */
    private async batchOpenSelected(): Promise<void> {
        const ids = Array.from(this.selectedWorks);
        await runSelectedBatchOpenWorkflow({
            selectedIds: ids,
            deps: {
                confirm: options => showConfirm(options),
                setLoading: loading => this.setBatchOpenSelectedLoading(loading),
                getCurrentPageWork: id => getSelectedBatchCurrentPageWork(id),
                findWorkById: id => findSelectedBatchWorkById(id, query => newWorksManager.getNewWorks(query)),
                openWorkUrl: url => this.openNewWorkUrl(url),
                markAsRead: workIds => newWorksManager.markAsRead(workIds),
                clearSelection: () => this.selectedWorks.clear(),
                render: () => this.render(),
                showMessage,
                updateBatchOperations: () => this.updateBatchOperations(),
                logWarn: (message, error) => console.warn(message, error),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    private setBatchOpenSelectedLoading(loading: boolean): void {
        setBatchOpenSelectedButtonLoading({
            loading,
            selectedCount: this.selectedWorks.size,
        });
    }

    /**
     * 批量删除（已选）
     */
    private async batchDeleteSelected(): Promise<void> {
        await runBatchDeleteSelectedWorkflow({
            selectedWorks: this.selectedWorks,
            deps: {
                confirm: options => showConfirm(options),
                setDeletingButtonLoading: (loading, selectedCount) => this.setBatchDeleteSelectedLoading(loading, selectedCount),
                deleteWorks: workIds => newWorksManager.deleteWorks(workIds),
                render: () => this.render(),
                showMessage,
                updateBatchOperations: () => this.updateBatchOperations(),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    private setBatchDeleteSelectedLoading(loading: boolean, selectedCount: number): void {
        setBatchDeleteSelectedButtonLoadingState({
            loading,
            selectedCount,
        });
    }

    /**
     * 显示全局配置弹窗
     */
    private async showGlobalConfigModal(): Promise<void> {
        await runNewWorksGlobalConfigWorkflow({
            deps: {
                initialize: () => newWorksManager.initialize(),
                getGlobalConfig: () => newWorksManager.getGlobalConfig(),
                showConfigModal: config => newWorksConfigModal.show(config),
                updateGlobalConfig: config => newWorksManager.updateGlobalConfig(config),
                restartScheduler: () => new Promise<void>((resolve) => {
                    chrome.runtime.sendMessage({ type: 'new-works-scheduler-restart' }, () => resolve());
                }),
                render: () => this.render(),
                showMessage,
                logInfo: (message, data) => data === undefined ? console.log(message) : console.log(message, data),
                logWarn: (message, error) => console.warn(message, error),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 更新上一次检查时间显示
     */
    private updateLastCheckTimeDisplay(lastCheckTime?: number): void {
        updateNewWorksLastCheckTimeDisplay(lastCheckTime);
    }

    /**
     * 立即检查新作品
     */
    private async checkNewWorksNow(): Promise<void> {
        await runNewWorksManualCheckWorkflow({
            deps: {
                setCheckingButtonLoading: loading => this.setCheckNowButtonLoading(loading),
                getSubscriptions: () => newWorksManager.getSubscriptions(),
                ensureProgressUI: () => this.ensureProgressUI(),
                updateProgressUI: data => this.updateProgressUI(data),
                attachProgressListener: () => this.attachProgressListener(),
                detachProgressListener: () => this.detachProgressListener(),
                hideProgressUIAfter: ms => this.hideProgressUIAfter(ms),
                sendManualCheck: () => new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage({ type: 'new-works-manual-check' }, resolve);
                }),
                render: () => this.render(),
                showMessage,
                logWarn: (message, error) => console.warn(message, error),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    private setCheckNowButtonLoading(loading: boolean): void {
        setCheckNowButtonLoadingState(loading);
    }

    /**
     * 创建进度UI（若不存在）
     */
    private ensureProgressUI(): void {
        this.progressEl = ensureNewWorksProgressUI(this.progressEl, {
            sendCancelMessage: () => {
                try {
                    chrome.runtime.sendMessage({ type: 'new-works-manual-cancel' }, (_res?: any) => {});
                } catch {}
            },
        });
    }

    /**
     * 更新进度UI
     */
    private updateProgressUI(data: NewWorksProgressData): void {
        updateNewWorksProgressUI(this.progressEl, data);
    }

    /**
     * 隐藏进度UI（延迟）
     */
    private hideProgressUIAfter(ms: number): void {
        hideNewWorksProgressUIAfter(this.progressEl, ms, () => {
            this.progressEl = undefined;
        });
    }

    /**
     * 绑定后台进度消息监听
     */
    private attachProgressListener(): void {
        this.progressListener = attachNewWorksProgressListener(
            this.progressListener,
            data => this.updateProgressUI(data),
            chrome.runtime as any,
        );
    }

    /**
     * 解绑后台进度消息监听
     */
    private detachProgressListener(): void {
        this.progressListener = detachNewWorksProgressListener(this.progressListener, chrome.runtime as any);
    }

    /**
     * 显示添加订阅弹窗
     */
    private async showAddSubscriptionModal(): Promise<void> {
        await runAddSubscriptionWorkflow({
            deps: {
                initialize: () => newWorksManager.initialize(),
                getSubscriptions: () => newWorksManager.getSubscriptions(),
                showActorSelector: (subscribedIds, onSelected) => actorSelector.showSelector(subscribedIds, onSelected),
                addSubscription: actorId => newWorksManager.addSubscription(actorId),
                render: () => this.render(),
                showMessage,
                logInfo: (message, data) => data === undefined ? console.log(message) : console.log(message, data),
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 显示管理订阅弹窗
     */
    private async showManageSubscriptionsModal(): Promise<void> {
        await runManageSubscriptionsWorkflow({
            deps: {
                getSubscriptions: () => newWorksManager.getSubscriptions(),
                openSubscriptionManagementModal: subscriptions => this.showSubscriptionManagementModal(subscriptions),
                showMessage,
                logError: (message, error) => console.error(message, error),
            },
        });
    }

    /**
     * 显示订阅管理弹窗
     */
    private showSubscriptionManagementModal(subscriptions: ActorSubscription[]): void {
        openSubscriptionManagementModal(subscriptions, {
            showAddSubscriptionModal: () => this.showAddSubscriptionModal(),
            toggleSubscription: (actorId, enabled) => newWorksManager.toggleSubscription(actorId, enabled),
            removeSubscription: actorId => newWorksManager.removeSubscription(actorId),
            confirmRemove: actorName => showDanger(`确定要移除对演员 ${actorName} 的订阅吗？`, '移除订阅'),
            render: () => this.render(),
            showMessage,
            handleSingleSubscriptionCheck: (subscription, button) => this.handleSingleSubscriptionCheck(subscription, button),
            logInfo: message => console.log(message),
            logError: (message, error) => console.error(message, error),
        });
    }

    /**
     * 手动检查单个订阅演员的新作品
     */
    private async handleSingleSubscriptionCheck(subscription: ActorSubscription, button: HTMLButtonElement): Promise<void> {
        await runSingleSubscriptionCheckWorkflow({
            subscription,
            button,
            deps: {
                sendSingleActorCheck: target => new Promise<any>((resolve) => {
                    chrome.runtime.sendMessage(
                        {
                            type: 'new-works-check-single-actor',
                            actorId: target.actorId,
                            actorName: target.actorName,
                        },
                        resolve,
                    );
                }),
                render: () => this.render(),
                showMessage,
                logError: (message, error) => console.error(message, error),
            },
        });
    }
}

// 导出实例
export const newWorksTab = new NewWorksTab();

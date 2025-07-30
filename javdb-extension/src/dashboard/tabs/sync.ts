// src/dashboard/tabs/sync.ts
// 数据同步标签页

import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import { userService } from '../services/userService';
import { initDataSyncSection } from '../dataSync';
import { on, emit } from '../services/eventBus';
import type { SyncType } from '../dataSync/types';

export class SyncTab {
    private isInitialized = false;

    /**
     * 初始化数据同步标签页
     */
    async initSyncTab(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.checkLoginStatus();
            await this.setupDataSync();
            await this.updateLocalStats();
            this.setupEventListeners();
            this.isInitialized = true;
            logAsync('INFO', '数据同步标签页初始化完成');
        } catch (error) {
            console.error('Failed to initialize sync tab:', error);
            showMessage('初始化数据同步页面失败', 'error');
        }
    }

    /**
     * 检查登录状态
     */
    private async checkLoginStatus(): Promise<void> {
        try {
            const isLoggedIn = await userService.isUserLoggedIn();
            this.updateSyncAvailability(isLoggedIn);
        } catch (error) {
            logAsync('ERROR', '检查登录状态失败', { error: error.message });
            this.updateSyncAvailability(false);
        }
    }

    /**
     * 更新同步功能可用性
     */
    private updateSyncAvailability(isLoggedIn: boolean): void {
        const syncSection = document.getElementById('data-sync-section-main');
        const loginNotice = document.getElementById('sync-login-notice');

        if (isLoggedIn) {
            // 用户已登录，显示同步功能
            if (syncSection) syncSection.style.display = 'block';
            if (loginNotice) loginNotice.style.display = 'none';
        } else {
            // 用户未登录，显示登录提示
            if (syncSection) syncSection.style.display = 'none';
            if (loginNotice) loginNotice.style.display = 'block';
        }
    }

    /**
     * 设置数据同步功能
     */
    private async setupDataSync(): Promise<void> {
        try {
            // 初始化数据同步模块
            await initDataSyncSection();
            logAsync('INFO', '数据同步功能初始化完成');
        } catch (error) {
            logAsync('ERROR', '数据同步功能初始化失败', { error: error.message });
        }
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 监听同步按钮点击事件
        this.bindSyncButtons();

        // 监听取消同步按钮
        this.bindCancelSyncButton();

        // 监听事件总线事件
        this.bindEventBusListeners();
    }

    /**
     * 绑定同步按钮事件
     */
    private bindSyncButtons(): void {
        const syncAllBtn = document.getElementById('syncAllData');
        const syncWantBtn = document.getElementById('syncWantData');
        const syncWatchedBtn = document.getElementById('syncWatchedData');
        const syncActorsBtn = document.getElementById('syncActorsData');

        if (syncAllBtn) {
            syncAllBtn.addEventListener('click', () => this.handleSyncClick('all'));
        }

        if (syncWantBtn) {
            syncWantBtn.addEventListener('click', () => this.handleSyncClick('want'));
        }

        if (syncWatchedBtn) {
            syncWatchedBtn.addEventListener('click', () => this.handleSyncClick('viewed'));
        }

        if (syncActorsBtn) {
            syncActorsBtn.addEventListener('click', () => this.handleActorSync());
        }
    }

    /**
     * 绑定取消同步按钮事件
     */
    private bindCancelSyncButton(): void {
        const cancelBtn = document.getElementById('cancelSyncBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const event = new CustomEvent('sync-cancel-requested');
                document.dispatchEvent(event);
            });
        }
    }

    /**
     * 绑定事件总线监听器
     */
    private bindEventBusListeners(): void {
        // 监听用户登录状态变化
        on('user-login-status-changed', ({ isLoggedIn }) => {
            logAsync('DEBUG', '用户登录状态变化', { isLoggedIn });
            this.updateSyncAvailability(isLoggedIn);
        });

        // 监听用户退出登录
        on('user-logout', () => {
            logAsync('DEBUG', '用户退出登录');
            this.updateSyncAvailability(false);
        });

        // 监听数据同步状态变化
        on('data-sync-status-changed', ({ status, type }) => {
            logAsync('DEBUG', '数据同步状态变化', { status, type });
        });
    }

    /**
     * 处理同步按钮点击
     */
    private async handleSyncClick(type: SyncType): Promise<void> {
        try {
            // 检查用户登录状态
            const isLoggedIn = await userService.isUserLoggedIn();
            if (!isLoggedIn) {
                showMessage('请先登录 JavDB 账号', 'warning');
                return;
            }

            // 触发同步事件
            const event = new CustomEvent('sync-requested', {
                detail: { type }
            });
            document.dispatchEvent(event);

        } catch (error) {
            logAsync('ERROR', '处理同步点击失败', { error: error.message, type });
            showMessage('同步失败，请重试', 'error');
        }
    }

    /**
     * 处理演员同步
     */
    private async handleActorSync(): Promise<void> {
        try {
            // 检查用户登录状态
            const isLoggedIn = await userService.isUserLoggedIn();
            if (!isLoggedIn) {
                showMessage('请先登录 JavDB 账号', 'warning');
                return;
            }

            // 动态导入演员同步服务
            const { actorSyncService } = await import('../../services/actorSync');

            // 检查是否正在同步
            if (actorSyncService.isSync()) {
                showMessage('演员同步正在进行中，请等待完成', 'warning');
                return;
            }

            // 设置按钮状态
            const syncBtn = document.getElementById('syncActorsData') as HTMLButtonElement;
            if (syncBtn) {
                syncBtn.disabled = true;
                syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 同步中...';
            }

            // 开始同步
            const result = await actorSyncService.syncActors('full', (progress) => {
                // 这里可以显示进度，暂时使用简单的日志
                logAsync('INFO', '演员同步进度', {
                    stage: progress.stage,
                    percentage: progress.percentage,
                    message: progress.message
                });
            });

            if (result.success) {
                showMessage(
                    `演员同步完成：新增 ${result.newActors}，更新 ${result.updatedActors}`,
                    'success'
                );

                // 触发演员库刷新事件
                const refreshEvent = new CustomEvent('actors-data-updated');
                document.dispatchEvent(refreshEvent);
            } else {
                showMessage(`演员同步失败：${result.errors.join(', ')}`, 'error');
            }

        } catch (error) {
            logAsync('ERROR', '演员同步失败', { error: error.message });
            showMessage(`演员同步失败：${error instanceof Error ? error.message : '未知错误'}`, 'error');
        } finally {
            // 恢复按钮状态
            const syncBtn = document.getElementById('syncActorsData') as HTMLButtonElement;
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fas fa-users"></i> 同步演员';
            }
        }
    }

    /**
     * 更新本地数据统计
     */
    private async updateLocalStats(): Promise<void> {
        try {
            // 这里会复用现有的统计逻辑
            const statsContainer = document.getElementById('stats-overview-sync');
            if (statsContainer) {
                // 从现有代码中获取统计信息
                const { getLocalStats } = await import('../services/dataSync');
                const stats = await getLocalStats();
                this.renderLocalStats(stats);
            }
        } catch (error) {
            logAsync('ERROR', '更新本地统计失败', { error: error.message });
        }
    }

    /**
     * 渲染本地统计信息
     */
    private renderLocalStats(stats: any): void {
        const container = document.getElementById('stats-overview-sync');
        if (!container) return;

        container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">${stats.total || 0}</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">${stats.viewed || 0}</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">${stats.want || 0}</span>
                <span class="stat-label">想看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">${stats.browsed || 0}</span>
                <span class="stat-label">已浏览</span>
            </div>
        `;
    }



    /**
     * 刷新标签页
     */
    async refresh(): Promise<void> {
        await this.checkLoginStatus();
        await this.updateLocalStats();
    }
}

// 导出单例实例
export const syncTab = new SyncTab();

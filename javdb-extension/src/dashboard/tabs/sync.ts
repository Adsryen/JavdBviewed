// src/dashboard/tabs/sync.ts
// 数据同步标签页

import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import { userService } from '../services/userService';
import { initDataSyncSection } from '../dataSync';
import { on } from '../services/eventBus';
import type { SyncType } from '../dataSync/types';
import { SyncUI } from '../dataSync/ui';

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
            this.setupEventListeners();
            this.isInitialized = true;
            // logAsync('INFO', '数据同步标签页初始化完成');
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
            await this.updateSyncAvailability(isLoggedIn);
        } catch (error) {
            logAsync('ERROR', '检查登录状态失败', { error: error.message });
            await this.updateSyncAvailability(false);
        }
    }

    /**
     * 更新同步功能可用性
     */
    private async updateSyncAvailability(isLoggedIn: boolean): Promise<void> {
        const syncSection = document.getElementById('data-sync-section-main');
        const loginNotice = document.getElementById('sync-login-notice');

        if (isLoggedIn) {
            // 用户已登录，显示同步功能
            if (syncSection) syncSection.style.display = 'block';
            if (loginNotice) loginNotice.style.display = 'none';

            // 启用所有同步按钮（通过数据同步UI管理）
            const ui = SyncUI.getInstance();
            ui.setAllButtonsDisabled(false);
        } else {
            // 用户未登录，显示登录提示
            if (syncSection) syncSection.style.display = 'none';
            if (loginNotice) loginNotice.style.display = 'block';

            // 禁用所有同步按钮
            const ui = SyncUI.getInstance();
            ui.setAllButtonsDisabled(true);
        }
    }

    /**
     * 设置数据同步功能
     */
    private async setupDataSync(): Promise<void> {
        try {
            // 初始化数据同步模块
            await initDataSyncSection();
            // logAsync('INFO', '数据同步功能初始化完成');
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
        // 同步按钮事件现在由数据同步UI统一管理
        // 所有同步类型（包括演员同步）都通过新的同步管理器处理
        // 不需要在这里特殊处理
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
        on('user-login-status-changed', async ({ isLoggedIn }) => {
            // logAsync('DEBUG', '用户登录状态变化', { isLoggedIn });
            await this.updateSyncAvailability(isLoggedIn);
        });

        // 监听用户退出登录
        on('user-logout', async () => {
            // logAsync('DEBUG', '用户退出登录');
            await this.updateSyncAvailability(false);
        });

        // 监听数据同步状态变化
        on('data-sync-status-changed', (_payload) => {
            // logAsync('DEBUG', '数据同步状态变化', _payload);
        });
    }

    /**
     * 刷新标签页
     */
    async refresh(): Promise<void> {
        await this.checkLoginStatus();
        // 本地数据统计功能已移除，因为已经有专门的数据概览页面
    }
}

// 导出单例实例
export const syncTab = new SyncTab();

/**
 * 数据同步UI管理模块
 */

import { logAsync } from '../logger';
import { userService } from '../services/userService';
import type { SyncType, SyncProgress, SyncResult } from './types';
import type { SyncOption, SyncMode } from '../config/syncConfig';
import { SYNC_OPTIONS } from '../config/syncConfig';

/**
 * UI管理类
 */
export class SyncUI {
    private static instance: SyncUI;
    private currentSyncType: SyncType | null = null;

    private constructor() {}

    public static getInstance(): SyncUI {
        if (!SyncUI.instance) {
            SyncUI.instance = new SyncUI();
        }
        return SyncUI.instance;
    }

    /**
     * 初始化数据同步UI
     */
    public async init(): Promise<void> {
        await this.checkUserLoginStatus();
        this.renderSyncOptions();
        this.bindCancelSyncEvent();
    }

    /**
     * 检查用户登录状态并显示/隐藏数据同步区域
     */
    public async checkUserLoginStatus(): Promise<void> {
        try {
            const userProfile = await userService.getUserProfile();
            const dataSyncSection = document.getElementById('data-sync-section');

            if (dataSyncSection) {
                if (userProfile && userProfile.isLoggedIn) {
                    dataSyncSection.style.display = 'block';
                    logAsync('INFO', '用户已登录，显示数据同步区域');
                } else {
                    dataSyncSection.style.display = 'none';
                    logAsync('INFO', '用户未登录，隐藏数据同步区域');
                }
            }
        } catch (error: any) {
            logAsync('ERROR', '检查用户登录状态失败', { error: error.message });
        }
    }

    /**
     * 渲染同步选项按钮
     */
    private renderSyncOptions(): void {
        const container = document.querySelector('.sync-options-grid');
        if (!container) return;

        // 使用静态导入的同步选项配置
        container.innerHTML = SYNC_OPTIONS.map(option => this.createSyncOptionHTML(option)).join('');
        this.bindSyncEvents();
        this.bindModeToggleEvents();
    }

    /**
     * 创建同步选项的HTML
     */
    private createSyncOptionHTML(option: SyncOption): string {
        const disabledAttr = option.enabled ? '' : 'disabled';
        const comingSoonLabel = option.comingSoon ? '<span class="coming-soon-label">即将推出</span>' : '';

        // 对于已观看和想看同步，创建带悬浮菜单的结构
        if (option.type === 'viewed' || option.type === 'want') {
            const modeOptionsId = option.type === 'viewed' ? 'viewedSyncModes' : 'wantSyncModes';
            const typeName = option.type === 'viewed' ? '已观看' : '想看';

            return `
                <div class="sync-option-group">
                    <button id="${option.id}" class="sync-option-btn main-sync-btn" ${disabledAttr}
                            title="悬浮查看同步模式" data-sync-type="${option.type}">
                        <i class="${option.icon}"></i>
                        <span class="sync-btn-text">${option.title}</span>
                        <small>悬浮选择模式</small>
                        ${comingSoonLabel}
                    </button>
                    <div class="sync-mode-options" id="${modeOptionsId}" style="display: none;">
                        <button class="sync-mode-btn" data-sync-type="${option.type}" data-sync-mode="full">
                            <i class="fas fa-sync-alt"></i>
                            <span>全量同步</span>
                            <small>同步所有${typeName}视频</small>
                        </button>
                        <button class="sync-mode-btn" data-sync-type="${option.type}" data-sync-mode="incremental">
                            <i class="fas fa-plus-circle"></i>
                            <span>同步缺失</span>
                            <small>只同步缺失的视频</small>
                        </button>
                    </div>
                </div>
            `;
        }

        // 其他类型的同步选项保持原样
        return `
            <button id="${option.id}" class="sync-option-btn" ${disabledAttr}
                    title="${option.title}" data-sync-type="${option.type}">
                <i class="${option.icon}"></i>
                <span class="sync-btn-text">${option.title}</span>
                <small>${option.description}</small>
                ${comingSoonLabel}
            </button>
        `;
    }

    /**
     * 绑定同步按钮事件
     */
    private bindSyncEvents(): void {
        // 主同步按钮组的悬浮事件
        const syncGroups = document.querySelectorAll('.sync-option-group');
        syncGroups.forEach(group => {
            const mainButton = group.querySelector('.main-sync-btn') as HTMLButtonElement;
            const modeOptions = group.querySelector('.sync-mode-options') as HTMLElement;

            if (mainButton && modeOptions) {
                const syncType = mainButton.getAttribute('data-sync-type') as SyncType;

                // 鼠标进入组时显示模式选项
                group.addEventListener('mouseenter', () => {
                    if (!mainButton.disabled) {
                        this.showModeOptions(syncType);
                    }
                });

                // 鼠标离开组时隐藏模式选项
                group.addEventListener('mouseleave', () => {
                    this.hideModeOptions(syncType);
                });
            }
        });

        // 同步模式按钮事件
        const modeButtons = document.querySelectorAll('.sync-mode-btn');
        modeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const target = event.currentTarget as HTMLButtonElement;
                const syncType = target.getAttribute('data-sync-type') as SyncType;
                const syncMode = target.getAttribute('data-sync-mode') as SyncMode;
                if (syncType && syncMode && !target.disabled) {
                    this.handleSyncClick(syncType, syncMode);
                }
            });
        });

        // 其他同步按钮（不需要模式选择的）
        const otherButtons = document.querySelectorAll('.sync-option-btn:not(.main-sync-btn)');
        otherButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const target = event.currentTarget as HTMLButtonElement;
                const syncType = target.getAttribute('data-sync-type') as SyncType;
                if (syncType && !target.disabled) {
                    this.handleSyncClick(syncType);
                }
            });
        });
    }

    /**
     * 绑定模式切换事件
     */
    private bindModeToggleEvents(): void {
        // 这个方法现在主要用于其他全局事件绑定
        // 悬浮事件已经在 bindSyncEvents 中处理
    }

    /**
     * 显示指定类型的模式选项
     */
    private showModeOptions(syncType: SyncType): void {
        const modeOptionsId = syncType === 'viewed' ? 'viewedSyncModes' : 'wantSyncModes';
        const modeOptions = document.getElementById(modeOptionsId);
        const mainButton = document.querySelector(`[data-sync-type="${syncType}"].main-sync-btn`) as HTMLButtonElement;

        if (modeOptions && mainButton) {
            modeOptions.style.display = 'block';
            modeOptions.classList.add('show');
            mainButton.classList.add('expanded');
            logAsync('DEBUG', `显示${syncType}同步模式选项`);
        }
    }

    /**
     * 隐藏指定类型的模式选项
     */
    private hideModeOptions(syncType: SyncType): void {
        const modeOptionsId = syncType === 'viewed' ? 'viewedSyncModes' : 'wantSyncModes';
        const modeOptions = document.getElementById(modeOptionsId);
        const mainButton = document.querySelector(`[data-sync-type="${syncType}"].main-sync-btn`) as HTMLButtonElement;

        if (modeOptions && mainButton) {
            modeOptions.classList.remove('show');
            mainButton.classList.remove('expanded');
            // 延迟隐藏，让动画完成
            setTimeout(() => {
                if (!modeOptions.classList.contains('show')) {
                    modeOptions.style.display = 'none';
                }
            }, 200);
            logAsync('DEBUG', `隐藏${syncType}同步模式选项`);
        }
    }

    /**
     * 隐藏所有模式选项
     */
    private hideAllModeOptions(): void {
        const modeOptions = document.querySelectorAll('.sync-mode-options');
        const mainButtons = document.querySelectorAll('.main-sync-btn');

        modeOptions.forEach(option => {
            const element = option as HTMLElement;
            element.classList.remove('show');
            setTimeout(() => {
                if (!element.classList.contains('show')) {
                    element.style.display = 'none';
                }
            }, 200);
        });

        mainButtons.forEach(button => {
            button.classList.remove('expanded');
        });
    }

    /**
     * 处理同步按钮点击
     */
    private async handleSyncClick(type: SyncType, mode?: SyncMode): Promise<void> {
        // 隐藏模式选项
        this.hideAllModeOptions();

        // 触发自定义事件，让核心模块处理同步逻辑
        const event = new CustomEvent('sync-requested', {
            detail: { type, mode }
        });
        document.dispatchEvent(event);
    }

    /**
     * 绑定取消同步按钮事件
     */
    private bindCancelSyncEvent(): void {
        const cancelBtn = document.getElementById('cancelSyncBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.handleCancelSync();
            });
        }
    }

    /**
     * 处理取消同步
     */
    private async handleCancelSync(): Promise<void> {
        // 触发取消同步事件
        const event = new CustomEvent('sync-cancel-requested');
        document.dispatchEvent(event);
    }

    /**
     * 显示/隐藏同步进度
     */
    public showSyncProgress(show: boolean): void {
        const progressElement = document.getElementById('syncProgress');
        const resultElement = document.getElementById('syncResult');
        
        if (progressElement) {
            progressElement.style.display = show ? 'block' : 'none';
        }
        
        if (resultElement && show) {
            resultElement.style.display = 'none';
        }
    }

    /**
     * 更新同步进度
     */
    public updateProgress(progress: SyncProgress): void {
        if (progress.stage === 'pages') {
            this.updatePagesProgress(progress);
        } else if (progress.stage === 'details') {
            this.updateDetailsProgress(progress);
        } else {
            // 向后兼容：如果没有stage，默认更新详情进度
            this.updateDetailsProgress(progress);
        }
    }

    /**
     * 更新页面获取进度
     */
    private updatePagesProgress(progress: SyncProgress): void {
        const pagesProgress = document.getElementById('pagesProgress');
        const progressFill = document.getElementById('pagesProgressFill');
        const progressText = document.getElementById('pagesProgressText');
        const progressPercentage = document.getElementById('pagesProgressPercentage');

        // 显示页面进度容器
        if (pagesProgress) {
            pagesProgress.style.display = 'block';
        }

        if (progressFill) {
            progressFill.style.width = `${progress.percentage}%`;
        }

        if (progressText) {
            progressText.textContent = progress.message;
        }

        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(progress.percentage)}%`;
        }
    }

    /**
     * 更新详情获取进度
     */
    private updateDetailsProgress(progress: SyncProgress): void {
        const detailsProgress = document.getElementById('detailsProgress');
        const progressFill = document.getElementById('detailsProgressFill');
        const progressText = document.getElementById('detailsProgressText');
        const progressPercentage = document.getElementById('detailsProgressPercentage');

        // 显示详情进度容器
        if (detailsProgress) {
            detailsProgress.style.display = 'block';
        }

        if (progressFill) {
            progressFill.style.width = `${progress.percentage}%`;
        }

        if (progressText) {
            progressText.textContent = progress.message;
        }

        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(progress.percentage)}%`;
        }
    }

    /**
     * 显示同步结果
     */
    public showSyncResult(result: SyncResult): void {
        const resultElement = document.getElementById('syncResult');
        const resultText = document.getElementById('syncResultText');
        
        if (resultElement && resultText) {
            resultElement.className = `sync-result ${result.success ? 'success' : 'error'}`;
            resultElement.style.display = 'flex';
            resultText.textContent = result.message;
            
            // 更新图标
            const icon = resultElement.querySelector('i');
            if (icon) {
                icon.className = result.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
            }
            
            // 3秒后自动隐藏
            setTimeout(() => {
                resultElement.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 设置按钮加载状态
     */
    public setButtonLoadingState(type: SyncType, loading: boolean): void {
        const button = document.querySelector(`[data-sync-type="${type}"]`) as HTMLButtonElement;
        
        if (button) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
                this.currentSyncType = type;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
                this.currentSyncType = null;
            }
        }
    }

    /**
     * 设置所有按钮的禁用状态
     */
    public setAllButtonsDisabled(disabled: boolean): void {
        const buttons = document.querySelectorAll('.sync-option-btn');
        buttons.forEach(button => {
            const btn = button as HTMLButtonElement;
            if (disabled) {
                btn.disabled = true;
            } else {
                // 只有原本启用的按钮才重新启用
                const syncType = btn.getAttribute('data-sync-type') as SyncType;
                const option = SYNC_OPTIONS.find(opt => opt.type === syncType);
                btn.disabled = !option?.enabled;
            }
        });
    }

    /**
     * 获取当前同步类型
     */
    public getCurrentSyncType(): SyncType | null {
        return this.currentSyncType;
    }

    /**
     * 刷新UI状态
     */
    public async refresh(): Promise<void> {
        await this.checkUserLoginStatus();
    }

    /**
     * 重置UI状态
     */
    public reset(): void {
        this.showSyncProgress(false);
        this.setAllButtonsDisabled(false);
        this.currentSyncType = null;

        // 重置两个进度条
        this.resetProgressBars();

        // 隐藏结果显示
        const resultElement = document.getElementById('syncResult');
        if (resultElement) {
            resultElement.style.display = 'none';
        }
    }

    /**
     * 重置进度条状态
     */
    private resetProgressBars(): void {
        // 重置页面进度
        const pagesProgress = document.getElementById('pagesProgress');
        const pagesProgressFill = document.getElementById('pagesProgressFill');
        const pagesProgressText = document.getElementById('pagesProgressText');
        const pagesProgressPercentage = document.getElementById('pagesProgressPercentage');

        if (pagesProgress) pagesProgress.style.display = 'none';
        if (pagesProgressFill) pagesProgressFill.style.width = '0%';
        if (pagesProgressText) pagesProgressText.textContent = '准备获取...';
        if (pagesProgressPercentage) pagesProgressPercentage.textContent = '0%';

        // 重置详情进度
        const detailsProgress = document.getElementById('detailsProgress');
        const detailsProgressFill = document.getElementById('detailsProgressFill');
        const detailsProgressText = document.getElementById('detailsProgressText');
        const detailsProgressPercentage = document.getElementById('detailsProgressPercentage');

        if (detailsProgress) detailsProgress.style.display = 'none';
        if (detailsProgressFill) detailsProgressFill.style.width = '0%';
        if (detailsProgressText) detailsProgressText.textContent = '等待开始...';
        if (detailsProgressPercentage) detailsProgressPercentage.textContent = '0%';
    }

    /**
     * 显示错误消息
     */
    public showError(message: string): void {
        this.showSyncResult({
            success: false,
            message: message
        });
    }

    /**
     * 显示成功消息
     */
    public showSuccess(message: string, details?: string): void {
        this.showSyncResult({
            success: true,
            message: message,
            details: details
        });
    }
}

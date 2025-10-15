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
    private currentSyncMode: SyncMode | null = null;
    private eventsInitialized = false; // 跟踪事件是否已初始化
    private static globalInitialized = false; // 全局初始化标志

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
        if (SyncUI.globalInitialized) {
            return; // 防止重复初始化
        }

        await this.checkUserLoginStatus();
        this.renderSyncOptions();
        if (!this.eventsInitialized) {
            this.bindCancelSyncEvent();
            this.eventsInitialized = true;
        }

        SyncUI.globalInitialized = true;
    }

    /**
     * 检查用户登录状态并显示/隐藏数据同步区域
     */
    public async checkUserLoginStatus(): Promise<void> {
        try {
            const userProfile = await userService.getUserProfile();
            // 兼容实际 DOM：优先使用 #data-sync-section-main，回退 #data-sync-section
            const mainSection = document.getElementById('data-sync-section-main') as HTMLElement | null;
            const fallbackSection = document.getElementById('data-sync-section') as HTMLElement | null;
            const dataSyncSection = (mainSection || fallbackSection) as HTMLElement | null;
            const loginNotice = document.getElementById('sync-login-notice') as HTMLElement | null;

            if (dataSyncSection) {
                const isLoggedIn = !!(userProfile && userProfile.isLoggedIn);
                dataSyncSection.style.display = isLoggedIn ? 'block' : 'none';
                if (loginNotice) loginNotice.style.display = isLoggedIn ? 'none' : 'block';
                logAsync('INFO', isLoggedIn ? '用户已登录，显示数据同步区域' : '用户未登录，隐藏数据同步区域');
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

        // 清除旧的事件监听器（通过重新生成HTML）
        container.innerHTML = SYNC_OPTIONS.map(option => this.createSyncOptionHTML(option)).join('');

        // 只在首次初始化时绑定事件
        if (!this.eventsInitialized) {
            this.bindSyncEvents();
            this.bindModeToggleEvents();
        }
    }

    /**
     * 创建同步选项的HTML
     */
    private createSyncOptionHTML(option: SyncOption): string {
        const disabledAttr = option.enabled ? '' : 'disabled';
        const comingSoonLabel = option.comingSoon ? '<span class="coming-soon-label">即将推出</span>' : '';

        // 对于已观看、想看、全部同步，直接显示两个分支按钮
        if (option.type === 'viewed' || option.type === 'want' || option.type === 'all') {
            const typeName = option.type === 'viewed' ? '已观看' :
                           option.type === 'want' ? '想看' : '全部';

            return `
                <div class="sync-option-card">
                    <div class="sync-option-header">
                        <i class="${option.icon} sync-option-icon"></i>
                        <h5>${option.title}</h5>
                    </div>
                    <p class="sync-option-description">${option.description}</p>
                    <div class="sync-option-actions">
                        <div class="sync-button-group">
                            <button class="sync-option-btn sync-btn sync-btn-primary sync-mode-btn" ${disabledAttr}
                                    data-sync-type="${option.type}" data-sync-mode="full"
                                    title="同步所有${typeName}视频">
                                <i class="fas fa-sync-alt"></i>
                                <span class="btn-text">全量同步</span>
                                <small class="btn-desc">同步所有${typeName}</small>
                            </button>
                            <button class="sync-option-btn sync-btn sync-btn-secondary sync-mode-btn" ${disabledAttr}
                                    data-sync-type="${option.type}" data-sync-mode="incremental"
                                    title="只同步缺失的${typeName}视频">
                                <i class="fas fa-plus-circle"></i>
                                <span class="btn-text">同步缺失</span>
                                <small class="btn-desc">只同步缺失的</small>
                            </button>
                        </div>
                        ${comingSoonLabel}
                    </div>
                    <div class="sync-option-stats">
                        <span class="stat-item">${option.description}</span>
                    </div>
                </div>
            `;
        }

        // 演员同步特殊处理 - 双按钮布局，提供普通同步和强制更新选项
        if (option.type === 'actors') {
            return `
                <div class="sync-option-card">
                    <div class="sync-option-header">
                        <i class="${option.icon} sync-option-icon"></i>
                        <h5>${option.title}</h5>
                    </div>
                    <p class="sync-option-description">${option.description}</p>
                    <div class="sync-option-actions">
                        <div class="sync-button-group">
                            <button id="${option.id}" class="sync-option-btn sync-btn sync-btn-primary sync-mode-btn" ${disabledAttr}
                                    data-sync-type="${option.type}" data-sync-mode="normal"
                                    title="同步演员信息（包含性别和分类）">
                                <i class="fas fa-users"></i>
                                <span class="btn-text">同步演员</span>
                                <small class="btn-desc">包含性别和分类信息</small>
                            </button>
                            <button id="syncActorsForce" class="sync-option-btn sync-btn sync-btn-secondary sync-mode-btn" ${disabledAttr}
                                    data-sync-type="${option.type}" data-sync-mode="force"
                                    title="强制更新所有演员的性别和分类信息">
                                <i class="fas fa-sync-alt"></i>
                                <span class="btn-text">强制更新</span>
                                <small class="btn-desc">更新现有演员的性别分类</small>
                            </button>
                        </div>
                        ${comingSoonLabel}
                    </div>
                    <div class="sync-option-stats">
                        <span class="stat-item">${option.description}</span>
                    </div>
                </div>
            `;
        }



        // 其他类型的同步选项，使用卡片样式
        return `
            <div class="sync-option-card">
                <div class="sync-option-header">
                    <i class="${option.icon} sync-option-icon"></i>
                    <h5>${option.title}</h5>
                </div>
                <p class="sync-option-description">${option.description}</p>
                <div class="sync-option-actions">
                    <button id="${option.id}" class="sync-option-btn sync-btn sync-btn-secondary" ${disabledAttr}
                            title="${option.title}" data-sync-type="${option.type}">
                        <i class="${option.icon}"></i>
                        ${option.title}
                    </button>
                    ${comingSoonLabel}
                </div>
                <div class="sync-option-stats">
                    <span class="stat-item">${option.description}</span>
                </div>
            </div>
        `;
    }

    /**
     * 移除现有的悬浮事件监听器
     */
    private removeExistingHoverListeners(): void {
        const syncGroups = document.querySelectorAll('.sync-option-group');

        let cleanedCount = 0;
        syncGroups.forEach((group, index) => {
            const mainButton = group.querySelector('.main-sync-btn') as HTMLButtonElement;
            const syncType = mainButton?.getAttribute('data-sync-type');

            if ((group as any).__hoverCleanup) {
                (group as any).__hoverCleanup();
                delete (group as any).__hoverCleanup;
                cleanedCount++;
            }
        });

        // 清理全局悬浮管理器
        if ((this as any).__globalHoverCleanup) {
            (this as any).__globalHoverCleanup();
            delete (this as any).__globalHoverCleanup;
        }
    }

    /**
     * 绑定同步按钮事件
     */
    private bindSyncEvents(): void {
        // 移除所有现有的悬浮菜单事件监听器
        this.removeExistingHoverListeners();

        // 查找所有的sync-option-group元素
        const allSyncGroups = document.querySelectorAll('.sync-option-group');

        allSyncGroups.forEach((group, index) => {
            const mainButton = group.querySelector('.main-sync-btn') as HTMLButtonElement;
            const modeOptions = group.querySelector('.sync-mode-options') as HTMLElement;
            const syncType = mainButton?.getAttribute('data-sync-type');
        });

        // 同步模式按钮事件
        const modeButtons = document.querySelectorAll('.sync-mode-btn');
        modeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const target = event.currentTarget as HTMLButtonElement;
                const syncType = target.getAttribute('data-sync-type') as SyncType;
                const syncMode = target.getAttribute('data-sync-mode');

                if (syncType && syncMode && !target.disabled) {
                    // 添加点击动画效果
                    this.addButtonClickEffect(target);

                    // 标准的同步模式处理
                    this.handleSyncClick(syncType, syncMode as SyncMode);
                }
            });
        });

        // 其他同步按钮（不需要模式选择的，排除已经绑定的模式按钮）
        const otherButtons = document.querySelectorAll('.sync-btn:not(.sync-mode-btn)');
        otherButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const target = event.currentTarget as HTMLButtonElement;
                const syncType = target.getAttribute('data-sync-type') as SyncType;
                if (syncType && !target.disabled) {
                    // 添加点击动画效果
                    this.addButtonClickEffect(target);
                    this.handleSyncClick(syncType);
                }
            });
        });


    }

    /**
     * 添加按钮点击效果
     */
    private addButtonClickEffect(button: HTMLButtonElement): void {
        button.style.transform = 'translateY(-1px) scale(0.98)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    /**
     * 绑定模式切换事件
     */
    private bindModeToggleEvents(): void {
        // 这个方法现在主要用于其他全局事件绑定
        // 悬浮事件已经在 bindSyncEvents 中处理
    }





    // 演员性别同步功能已移除，性别信息将从分类页面直接获取

    /**
     * 处理同步按钮点击
     */
    private async handleSyncClick(type: SyncType, mode?: SyncMode): Promise<void> {
        // 保存当前同步模式
        this.currentSyncMode = mode || 'full';

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
     * 设置按钮加载状态
     */
    public setButtonLoading(buttonId: string, loading: boolean): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (!button) return;

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            // 保存原始文本
            const originalText = button.querySelector('span')?.textContent || button.textContent;
            button.setAttribute('data-original-text', originalText || '');

            // 更新按钮文本
            const span = button.querySelector('span');
            if (span) {
                span.textContent = '同步中...';
            }
        } else {
            button.classList.remove('loading');
            button.disabled = false;

            // 恢复原始文本
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                const span = button.querySelector('span');
                if (span) {
                    span.textContent = originalText;
                }
                button.removeAttribute('data-original-text');
            }
        }
    }

    /**
     * 设置按钮成功状态
     */
    public setButtonSuccess(buttonId: string, message?: string): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (!button) return;

        button.classList.add('success');

        if (message) {
            const span = button.querySelector('span');
            if (span) {
                const originalText = span.textContent;
                span.textContent = message;

                // 3秒后恢复原始状态
                setTimeout(() => {
                    button.classList.remove('success');
                    if (originalText) {
                        span.textContent = originalText;
                    }
                }, 3000);
            }
        }
    }

    /**
     * 设置按钮错误状态
     */
    public setButtonError(buttonId: string, message?: string): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (!button) return;

        button.classList.add('error');

        if (message) {
            const span = button.querySelector('span');
            if (span) {
                const originalText = span.textContent;
                span.textContent = message;

                // 3秒后恢复原始状态
                setTimeout(() => {
                    button.classList.remove('error');
                    if (originalText) {
                        span.textContent = originalText;
                    }
                }, 3000);
            }
        }
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
        // 检查是否为演员同步进度（包含stats信息）
        if (progress.stats) {
            this.updateActorSyncProgress(progress);
            return;
        }

        // 更新阶段信息显示
        this.updatePhaseInfo(progress);

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
     * 更新演员同步进度（使用统计信息而非进度条）
     */
    private updateActorSyncProgress(progress: SyncProgress): void {
        const stats = progress.stats!;

        // 获取或创建演员同步统计容器
        let actorStatsContainer = document.getElementById('actorSyncStats');
        if (!actorStatsContainer) {
            actorStatsContainer = this.createActorStatsContainer();
        }

        // 显示统计容器，隐藏传统进度条
        actorStatsContainer.style.display = 'block';
        this.hidePagesProgress();
        this.hideDetailsProgress();

        // 更新统计信息
        this.updateActorStats(stats, progress.message);
    }

    /**
     * 创建演员同步统计容器
     */
    private createActorStatsContainer(): HTMLElement {
        const progressContainer = document.getElementById('syncProgress');
        if (!progressContainer) {
            throw new Error('Progress container not found');
        }

        const container = document.createElement('div');
        container.id = 'actorSyncStats';
        container.className = 'actor-sync-stats';
        container.innerHTML = `
            <div class="actor-stats-header">
                <h5>演员同步进度</h5>
                <div class="actor-stats-status" id="actorStatsStatus">准备中...</div>
            </div>
            <div class="actor-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📄</div>
                    <div class="stat-content">
                        <div class="stat-label">当前页面</div>
                        <div class="stat-value" id="currentPageStat">-</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-label">已处理</div>
                        <div class="stat-value" id="totalProcessedStat">0</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✨</div>
                    <div class="stat-content">
                        <div class="stat-label">新增</div>
                        <div class="stat-value" id="newActorsStat">0</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔄</div>
                    <div class="stat-content">
                        <div class="stat-label">更新</div>
                        <div class="stat-value" id="updatedActorsStat">0</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏭️</div>
                    <div class="stat-content">
                        <div class="stat-label">跳过</div>
                        <div class="stat-value" id="skippedActorsStat">0</div>
                    </div>
                </div>
                <div class="stat-card current-page-detail" id="currentPageDetail" style="display: none;">
                    <div class="stat-icon">📋</div>
                    <div class="stat-content">
                        <div class="stat-label">本页进度</div>
                        <div class="stat-value" id="currentPageProgressStat">-</div>
                    </div>
                </div>
            </div>
        `;

        // 插入到进度容器的开头
        progressContainer.insertBefore(container, progressContainer.firstChild);
        return container;
    }

    /**
     * 更新演员统计信息
     */
    private updateActorStats(stats: any, message: string): void {
        // 更新状态消息
        const statusElement = document.getElementById('actorStatsStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }

        // 更新各项统计
        const currentPageElement = document.getElementById('currentPageStat');
        if (currentPageElement && stats.currentPage) {
            currentPageElement.textContent = `第 ${stats.currentPage} 页`;
        }

        const totalProcessedElement = document.getElementById('totalProcessedStat');
        if (totalProcessedElement) {
            totalProcessedElement.textContent = stats.totalProcessed?.toString() || '0';
        }

        const newActorsElement = document.getElementById('newActorsStat');
        if (newActorsElement) {
            newActorsElement.textContent = stats.newActors?.toString() || '0';
        }

        const updatedActorsElement = document.getElementById('updatedActorsStat');
        if (updatedActorsElement) {
            updatedActorsElement.textContent = stats.updatedActors?.toString() || '0';
        }

        const skippedActorsElement = document.getElementById('skippedActorsStat');
        if (skippedActorsElement) {
            skippedActorsElement.textContent = stats.skippedActors?.toString() || '0';
        }

        // 如果有当前页面的详细进度，显示它
        const currentPageDetail = document.getElementById('currentPageDetail');
        const currentPageProgressElement = document.getElementById('currentPageProgressStat');

        if (stats.currentPageProgress !== undefined && stats.currentPageTotal !== undefined) {
            if (currentPageDetail) currentPageDetail.style.display = 'block';
            if (currentPageProgressElement) {
                currentPageProgressElement.textContent = `${stats.currentPageProgress}/${stats.currentPageTotal}`;
            }
        } else {
            if (currentPageDetail) currentPageDetail.style.display = 'none';
        }
    }

    /**
     * 隐藏页面进度条
     */
    private hidePagesProgress(): void {
        const pagesProgress = document.getElementById('pagesProgress');
        if (pagesProgress) {
            pagesProgress.style.display = 'none';
        }
    }

    /**
     * 隐藏详情进度条
     */
    private hideDetailsProgress(): void {
        const detailsProgress = document.getElementById('detailsProgress');
        if (detailsProgress) {
            detailsProgress.style.display = 'none';
        }
    }

    /**
     * 更新阶段信息显示
     */
    private updatePhaseInfo(progress: SyncProgress): void {
        if (!progress.phaseInfo) return;

        const phaseInfo = progress.phaseInfo;

        // 更新阶段标题
        const syncTitle = document.querySelector('.sync-progress h3');
        if (syncTitle) {
            syncTitle.textContent = `同步进度 - ${phaseInfo.phaseName} (${phaseInfo.currentPhase}/${phaseInfo.totalPhases})`;
        }

        // 更新进度文本，添加阶段前缀
        const enhancedMessage = `[${phaseInfo.phaseName}] ${progress.message}`;

        // 创建一个新的progress对象，包含增强的消息
        const enhancedProgress = {
            ...progress,
            message: enhancedMessage
        };

        // 如果有阶段信息，使用增强的消息
        if (progress.stage === 'pages') {
            this.updatePagesProgressWithMessage(enhancedProgress);
        } else if (progress.stage === 'details') {
            this.updateDetailsProgressWithMessage(enhancedProgress);
        }

        return; // 阻止后续的普通更新
    }

    /**
     * 更新页面获取进度（带自定义消息）
     */
    private updatePagesProgressWithMessage(progress: SyncProgress): void {
        this.updatePagesProgressInternal(progress);
    }

    /**
     * 更新页面获取进度
     */
    private updatePagesProgress(progress: SyncProgress): void {
        // 如果有阶段信息，跳过普通更新（已在updatePhaseInfo中处理）
        if (progress.phaseInfo) return;

        this.updatePagesProgressInternal(progress);
    }

    /**
     * 内部页面进度更新方法
     */
    private updatePagesProgressInternal(progress: SyncProgress): void {
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

            // 如果是容忍中断，改变进度条颜色
            if (progress.message && progress.message.includes('容忍度')) {
                progressFill.style.background = 'linear-gradient(90deg, #ffc107, #e0a800)';
            } else {
                progressFill.style.background = 'linear-gradient(90deg, #007bff, #0056b3)';
            }
        }

        if (progressText) {
            progressText.textContent = progress.message;

            // 如果是容忍中断，添加特殊样式
            if (progress.message && progress.message.includes('容忍度')) {
                progressText.style.color = '#856404';
                progressText.style.fontWeight = '600';
            } else {
                progressText.style.color = '#6c757d';
                progressText.style.fontWeight = 'normal';
            }
        }

        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(progress.percentage)}%`;
        }
    }

    /**
     * 更新详情获取进度（带自定义消息）
     */
    private updateDetailsProgressWithMessage(progress: SyncProgress): void {
        this.updateDetailsProgressInternal(progress);
    }

    /**
     * 更新详情获取进度
     */
    private updateDetailsProgress(progress: SyncProgress): void {
        // 如果有阶段信息，跳过普通更新（已在updatePhaseInfo中处理）
        if (progress.phaseInfo) return;

        this.updateDetailsProgressInternal(progress);
    }

    /**
     * 内部详情进度更新方法
     */
    private updateDetailsProgressInternal(progress: SyncProgress): void {
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
        // 根据同步类型和模式选择正确的按钮
        let button: HTMLButtonElement | null = null;

        if (this.currentSyncMode) {
            // 如果有保存的同步模式，使用精确选择器
            button = document.querySelector(`[data-sync-type="${type}"][data-sync-mode="${this.currentSyncMode}"]`) as HTMLButtonElement;
        }

        // 如果没找到或没有模式信息，回退到通用选择器
        if (!button) {
            button = document.querySelector(`[data-sync-type="${type}"]`) as HTMLButtonElement;
        }

        if (button) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
                this.currentSyncType = type;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
                this.currentSyncType = null;
                this.currentSyncMode = null; // 清除模式信息
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
     * 设置当前同步模式
     */
    public setSyncMode(mode: SyncMode): void {
        this.currentSyncMode = mode;
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

        // 重置演员同步统计
        const actorSyncStats = document.getElementById('actorSyncStats');
        if (actorSyncStats) {
            actorSyncStats.style.display = 'none';
        }
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

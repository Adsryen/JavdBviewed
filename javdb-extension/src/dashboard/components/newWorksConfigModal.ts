// src/dashboard/components/newWorksConfigModal.ts
// 新作品全局配置弹窗组件

import { showMessage } from '../ui/toast';
import type { NewWorksGlobalConfig } from '../../types';

export class NewWorksConfigModal {
    private modal: HTMLElement | null = null;
    private onSaveCallback: ((config: NewWorksGlobalConfig) => void) | null = null;

    /**
     * 显示配置弹窗
     */
    async show(currentConfig: NewWorksGlobalConfig): Promise<NewWorksGlobalConfig | null> {
        return new Promise((resolve) => {
            this.onSaveCallback = resolve;
            this.createModal(currentConfig);
            this.showModal();
        });
    }

    /**
     * 创建弹窗
     */
    private createModal(config: NewWorksGlobalConfig): void {
        // 移除已存在的弹窗
        this.removeModal();

        this.modal = document.createElement('div');
        this.modal.className = 'new-works-config-modal';
        this.modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-cog"></i> 新作品全局配置</h3>
                        <button class="modal-close-btn" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="newWorksConfigForm">
                            <!-- 基础设置 -->
                            <div class="config-section">
                                <h4><i class="fas fa-sliders-h"></i> 基础设置</h4>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="configEnabled" ${config.enabled ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        启用新作品功能
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label for="configCheckInterval">检查间隔 (小时):</label>
                                    <input type="number" id="configCheckInterval" min="1" max="168" value="${config.checkInterval}">
                                    <small>建议设置为24小时或更长</small>
                                </div>
                                <div class="form-group">
                                    <label for="configRequestInterval">请求间隔 (秒):</label>
                                    <input type="number" id="configRequestInterval" min="1" max="60" value="${config.requestInterval}">
                                    <small>避免频繁请求，建议至少3秒</small>
                                </div>
                            </div>

                            <!-- 过滤条件 -->
                            <div class="config-section">
                                <h4><i class="fas fa-filter"></i> 过滤条件</h4>
                                <p class="section-description">以下条件将应用于所有订阅演员的新作品检查。这些设置独立于功能启用状态，可随时调整。</p>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="configExcludeViewed" ${config.filters.excludeViewed ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        排除已标记"看过"的作品
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="configExcludeBrowsed" ${config.filters.excludeBrowsed ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        排除已浏览详情页的作品
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="configExcludeWant" ${config.filters.excludeWant ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        排除已标记"想看"的作品
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label for="configDateRange">时间范围 (月数):</label>
                                    <input type="number" id="configDateRange" min="0" max="24" value="${config.filters.dateRange}">
                                    <small>0表示不限制时间范围，建议设置为3-6个月</small>
                                </div>
                            </div>

                            <!-- 管理设置 -->
                            <div class="config-section">
                                <h4><i class="fas fa-tasks"></i> 管理设置</h4>
                                
                                <div class="form-group">
                                    <label for="configMaxWorksPerCheck">每次检查最大作品数:</label>
                                    <input type="number" id="configMaxWorksPerCheck" min="10" max="200" value="${config.maxWorksPerCheck}">
                                    <small>限制每次检查的作品数量，避免数据过多</small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="configAutoCleanup" ${config.autoCleanup ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        启用自动清理
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label for="configCleanupDays">清理天数:</label>
                                    <input type="number" id="configCleanupDays" min="7" max="365" value="${config.cleanupDays}">
                                    <small>自动清理已读且超过指定天数的作品</small>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="configCancel">
                            <i class="fas fa-times"></i> 取消
                        </button>
                        <button class="btn-primary" id="configSave">
                            <i class="fas fa-save"></i> 保存配置
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupModalEventListeners();
    }

    /**
     * 设置弹窗事件监听器
     */
    private setupModalEventListeners(): void {
        if (!this.modal) return;

        // 关闭按钮
        const closeBtn = this.modal.querySelector('.modal-close-btn');
        closeBtn?.addEventListener('click', () => this.handleCancel());

        // 取消按钮
        const cancelBtn = this.modal.querySelector('#configCancel');
        cancelBtn?.addEventListener('click', () => this.handleCancel());

        // 保存按钮
        const saveBtn = this.modal.querySelector('#configSave');
        saveBtn?.addEventListener('click', () => this.handleSave());

        // 表单提交
        const form = this.modal.querySelector('#newWorksConfigForm') as HTMLFormElement;
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // 点击遮罩层关闭
        const overlay = this.modal.querySelector('.modal-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.handleCancel();
            }
        });

        // 启用状态变化时的联动效果
        const enabledCheckbox = this.modal.querySelector('#configEnabled') as HTMLInputElement;
        enabledCheckbox?.addEventListener('change', () => {
            this.updateFormState(enabledCheckbox.checked);
        });

        // 自动清理状态变化时的联动效果
        const autoCleanupCheckbox = this.modal.querySelector('#configAutoCleanup') as HTMLInputElement;
        const cleanupDaysInput = this.modal.querySelector('#configCleanupDays') as HTMLInputElement;
        autoCleanupCheckbox?.addEventListener('change', () => {
            if (cleanupDaysInput) {
                cleanupDaysInput.disabled = !autoCleanupCheckbox.checked;
            }
        });

        // 初始化表单状态
        this.updateFormState(enabledCheckbox?.checked || false);
        if (cleanupDaysInput) {
            cleanupDaysInput.disabled = !autoCleanupCheckbox?.checked;
        }
    }

    /**
     * 更新表单状态
     */
    private updateFormState(enabled: boolean): void {
        if (!this.modal) return;

        // 只禁用基础设置和管理设置的输入框，过滤条件始终可用
        const basicInputs = this.modal.querySelectorAll('#configCheckInterval, #configRequestInterval, #configMaxWorksPerCheck');
        const managementInputs = this.modal.querySelectorAll('#configAutoCleanup, #configCleanupDays');

        [...basicInputs, ...managementInputs].forEach(input => {
            (input as HTMLInputElement).disabled = !enabled;
        });

        // 过滤条件始终可用，不受启用状态影响
        const filterInputs = this.modal.querySelectorAll('#configExcludeViewed, #configExcludeBrowsed, #configExcludeWant, #configDateRange');
        filterInputs.forEach(input => {
            (input as HTMLInputElement).disabled = false;
        });
    }

    /**
     * 处理保存
     */
    private handleSave(): void {
        if (!this.modal) return;

        try {
            const config = this.getConfigFromForm();
            
            if (!this.validateConfig(config)) {
                return;
            }

            if (this.onSaveCallback) {
                this.onSaveCallback(config);
            }
            
            this.hideModal();
        } catch (error) {
            console.error('保存配置失败:', error);
            showMessage('保存配置失败，请检查输入', 'error');
        }
    }

    /**
     * 处理取消
     */
    private handleCancel(): void {
        if (this.onSaveCallback) {
            this.onSaveCallback(null);
        }
        this.hideModal();
    }

    /**
     * 从表单获取配置
     */
    private getConfigFromForm(): NewWorksGlobalConfig {
        if (!this.modal) throw new Error('Modal not found');

        const getValue = (id: string): any => {
            const element = this.modal!.querySelector(`#${id}`) as HTMLInputElement;
            if (!element) throw new Error(`Element ${id} not found`);
            
            if (element.type === 'checkbox') {
                return element.checked;
            } else if (element.type === 'number') {
                return parseInt(element.value, 10);
            } else {
                return element.value;
            }
        };

        return {
            enabled: getValue('configEnabled'),
            checkInterval: getValue('configCheckInterval'),
            requestInterval: getValue('configRequestInterval'),
            filters: {
                excludeViewed: getValue('configExcludeViewed'),
                excludeBrowsed: getValue('configExcludeBrowsed'),
                excludeWant: getValue('configExcludeWant'),
                dateRange: getValue('configDateRange'),
            },
            maxWorksPerCheck: getValue('configMaxWorksPerCheck'),
            autoCleanup: getValue('configAutoCleanup'),
            cleanupDays: getValue('configCleanupDays'),
        };
    }

    /**
     * 验证配置
     */
    private validateConfig(config: NewWorksGlobalConfig): boolean {
        if (config.checkInterval < 1 || config.checkInterval > 168) {
            showMessage('检查间隔必须在1-168小时之间', 'warn');
            return false;
        }

        if (config.requestInterval < 1 || config.requestInterval > 60) {
            showMessage('请求间隔必须在1-60秒之间', 'warn');
            return false;
        }

        if (config.filters.dateRange < 0 || config.filters.dateRange > 24) {
            showMessage('时间范围必须在0-24个月之间', 'warn');
            return false;
        }

        if (config.maxWorksPerCheck < 10 || config.maxWorksPerCheck > 200) {
            alert('每次检查最大作品数必须在10-200之间');
            return false;
        }

        if (config.cleanupDays < 7 || config.cleanupDays > 365) {
            alert('清理天数必须在7-365天之间');
            return false;
        }

        return true;
    }

    /**
     * 显示弹窗
     */
    private showModal(): void {
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';

            // 添加visible类以显示弹窗
            const overlay = this.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.add('visible');
                console.log('NewWorksConfigModal: 已添加visible类，弹窗应该可见');
            }
        }
    }

    /**
     * 隐藏弹窗
     */
    private hideModal(): void {
        if (this.modal) {
            const overlay = this.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.remove('visible');
                console.log('NewWorksConfigModal: 已移除visible类，开始隐藏弹窗');
            }

            // 等待动画完成后移除弹窗
            setTimeout(() => {
                this.removeModal();
            }, 300); // 与CSS transition时间一致
        }
    }

    /**
     * 移除弹窗
     */
    private removeModal(): void {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            document.body.style.overflow = '';
        }
    }
}

// 导出单例
export const newWorksConfigModal = new NewWorksConfigModal();

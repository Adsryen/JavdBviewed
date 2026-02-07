// src/dashboard/components/newWorks/configModal.ts
// 新作品全局配置弹窗组件

import { showMessage } from '../../ui/toast';
import type { NewWorksGlobalConfig } from '../../../services/newWorks/types';
import { ACTOR_FILTER_TAGS, getTagsByGroup } from '../../config/actorFilterTags';

export class NewWorksConfigModal {
    private modal: HTMLElement | null = null;
    private onSaveCallback: ((config: NewWorksGlobalConfig | null) => void) | null = null;

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
     * 生成类别复选框HTML
     */
    private generateCategoryCheckboxes(selectedValues?: string[]): string {
        // 获取所有标签（basic、quality、category）
        const allTags = ACTOR_FILTER_TAGS.filter(tag => 
            tag.group === 'basic' || tag.group === 'quality' || tag.group === 'category'
        );
        const selected = selectedValues || [];
        return allTags.map(tag => {
            const checked = selected.includes(tag.value) ? 'checked' : '';
            return `
                <label class="checkbox-label category-checkbox">
                    <input type="checkbox" class="category-filter-checkbox" value="${tag.value}" ${checked}>
                    <span class="checkmark"></span>
                    ${tag.label}
                </label>
            `;
        }).join('');
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
                        <h3><i class="fas fa-cog"></i> 新作品设置</h3>
                        <button class="modal-close-btn" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="newWorksConfigForm">
                            <!-- 自动检查 -->
                            <div class="config-section">
                                <h4><i class="fas fa-sliders-h"></i> 自动检查</h4>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="configAutoCheckEnabled" ${config.autoCheckEnabled ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        启用自动检查
                                    </label>
                                </div>
                                <div class="form-row">
                                    <div class="form-group form-group-inline">
                                        <label for="configCheckInterval">
                                            <span>
                                                检查间隔 (小时)
                                                <i class="fas fa-question-circle help-icon" title="建议设置为24小时或更长"></i>
                                            </span>
                                            <input type="number" id="configCheckInterval" min="1" max="168" value="${config.checkInterval}">
                                        </label>
                                    </div>
                                    <div class="form-group form-group-inline">
                                        <label for="configRequestInterval">
                                            <span>
                                                请求间隔 (秒)
                                                <i class="fas fa-question-circle help-icon" title="避免频繁请求，建议至少3秒"></i>
                                            </span>
                                            <input type="number" id="configRequestInterval" min="1" max="60" value="${config.requestInterval}">
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- 过滤条件 -->
                            <div class="config-section">
                                <h4><i class="fas fa-filter"></i> 过滤条件</h4>
                                <p class="section-description">以下条件将应用于所有订阅演员的新作品检查。这些设置始终生效，可随时调整。</p>
                                
                                <div class="form-row">
                                    <div class="form-group form-group-inline">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="configExcludeViewed" ${config.filters.excludeViewed ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            排除已标记"看过"
                                        </label>
                                    </div>
                                    
                                    <div class="form-group form-group-inline">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="configExcludeBrowsed" ${config.filters.excludeBrowsed ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            排除已浏览详情页
                                        </label>
                                    </div>
                                    
                                    <div class="form-group form-group-inline">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="configExcludeWant" ${config.filters.excludeWant ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            排除已标记"想看"
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="configDateRange">
                                        <span>
                                            时间范围 (月数)
                                            <i class="fas fa-question-circle help-icon" title="0表示不限制时间范围，建议设置为3-6个月"></i>
                                        </span>
                                        <input type="number" id="configDateRange" min="0" max="24" value="${config.filters.dateRange}">
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>类别筛选:</label>
                                    <div class="category-filter-grid">
                                        <label class="checkbox-label category-all-checkbox">
                                            <input type="checkbox" id="categoryFilterAll">
                                            <span class="checkmark"></span>
                                            不限制
                                        </label>
                                        ${this.generateCategoryCheckboxes(config.filters.categoryFilters)}
                                    </div>
                                    <small>可多选类别，不选择任何类别则显示所有类别</small>
                                </div>
                            </div>

                            <!-- 清理与限制 -->
                            <div class="config-section">
                                <h4><i class="fas fa-tasks"></i> 自动清理</h4>
                                
                                <div class="form-row">
                                    <div class="form-group form-group-inline">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="configAutoCleanup" ${config.autoCleanup ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            启用自动清理
                                        </label>
                                    </div>
                                    
                                    <div class="form-group form-group-inline">
                                        <label for="configCleanupDays">
                                            <span>
                                                清理天数
                                                <i class="fas fa-question-circle help-icon" title="自动清理已读且超过指定天数的作品"></i>
                                            </span>
                                            <input type="number" id="configCleanupDays" min="7" max="365" value="${config.cleanupDays}">
                                        </label>
                                    </div>
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

        // 自动检查状态变化时的联动效果
        const autoCheckCheckbox = this.modal.querySelector('#configAutoCheckEnabled') as HTMLInputElement;
        autoCheckCheckbox?.addEventListener('change', () => {
            this.updateFormState(autoCheckCheckbox.checked);
        });

        // 自动清理状态变化时的联动效果
        const autoCleanupCheckbox = this.modal.querySelector('#configAutoCleanup') as HTMLInputElement;
        const cleanupDaysInput = this.modal.querySelector('#configCleanupDays') as HTMLInputElement;
        autoCleanupCheckbox?.addEventListener('change', () => {
            if (cleanupDaysInput) {
                cleanupDaysInput.disabled = !autoCleanupCheckbox.checked;
            }
        });

        // 类别筛选的全选/半选逻辑
        this.setupCategoryFilterListeners();

        // 初始化表单状态
        this.updateFormState(autoCheckCheckbox?.checked || false);
        if (cleanupDaysInput) {
            cleanupDaysInput.disabled = !autoCleanupCheckbox?.checked;
        }
    }

    /**
     * 设置类别筛选的事件监听器
     */
    private setupCategoryFilterListeners(): void {
        if (!this.modal) return;

        const allCheckbox = this.modal.querySelector('#categoryFilterAll') as HTMLInputElement;
        const categoryCheckboxes = this.modal.querySelectorAll('.category-filter-checkbox') as NodeListOf<HTMLInputElement>;

        if (!allCheckbox || !categoryCheckboxes.length) return;

        // 初始化"不限制"复选框状态
        this.updateAllCheckboxState();

        // "不限制"复选框点击事件
        allCheckbox.addEventListener('change', () => {
            const isChecked = allCheckbox.checked;
            categoryCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });

        // 各个类别复选框点击事件
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAllCheckboxState();
            });
        });
    }

    /**
     * 更新"不限制"复选框的状态（全选/半选/未选）
     */
    private updateAllCheckboxState(): void {
        if (!this.modal) return;

        const allCheckbox = this.modal.querySelector('#categoryFilterAll') as HTMLInputElement;
        const allCheckmark = this.modal.querySelector('.category-all-checkbox .checkmark') as HTMLElement;
        const categoryCheckboxes = this.modal.querySelectorAll('.category-filter-checkbox') as NodeListOf<HTMLInputElement>;

        if (!allCheckbox || !allCheckmark || !categoryCheckboxes.length) return;

        const checkedCount = Array.from(categoryCheckboxes).filter(cb => cb.checked).length;
        const totalCount = categoryCheckboxes.length;

        if (checkedCount === 0) {
            // 全不选
            allCheckbox.checked = false;
            allCheckbox.indeterminate = false;
            allCheckmark.classList.remove('indeterminate');
        } else if (checkedCount === totalCount) {
            // 全选
            allCheckbox.checked = true;
            allCheckbox.indeterminate = false;
            allCheckmark.classList.remove('indeterminate');
        } else {
            // 半选
            allCheckbox.checked = false;
            allCheckbox.indeterminate = true;
            allCheckmark.classList.add('indeterminate');
        }
    }

    /**
     * 更新表单状态
     */
    private updateFormState(enabled: boolean): void {
        if (!this.modal) return;

        // 只禁用与自动检查相关的输入框；过滤条件和清理设置始终可用
        const autoInputs = this.modal.querySelectorAll('#configCheckInterval, #configRequestInterval');
        autoInputs.forEach(input => {
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

        // 获取类别筛选的复选框值
        const categoryCheckboxes = this.modal.querySelectorAll('.category-filter-checkbox:checked') as NodeListOf<HTMLInputElement>;
        const categoryFilters = Array.from(categoryCheckboxes).map(cb => cb.value);

        return {
            checkInterval: getValue('configCheckInterval'),
            requestInterval: getValue('configRequestInterval'),
            autoCheckEnabled: getValue('configAutoCheckEnabled'),
            filters: {
                excludeViewed: getValue('configExcludeViewed'),
                excludeBrowsed: getValue('configExcludeBrowsed'),
                excludeWant: getValue('configExcludeWant'),
                dateRange: getValue('configDateRange'),
                categoryFilters: categoryFilters.length > 0 ? categoryFilters : [],
            },
            maxWorksPerCheck: 100, // 固定值，不再通过UI配置
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

        if (config.cleanupDays < 7 || config.cleanupDays > 365) {
            showMessage('清理天数必须在7-365天之间', 'warn');
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

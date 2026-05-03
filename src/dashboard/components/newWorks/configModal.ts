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

        const totalCategoryCount = ACTOR_FILTER_TAGS.filter(tag =>
            tag.group === 'basic' || tag.group === 'quality' || tag.group === 'category'
        ).length;
        const selectedCategoryCount = config.filters.categoryFilters && config.filters.categoryFilters.length > 0
            ? config.filters.categoryFilters.length
            : totalCategoryCount;

        this.modal = document.createElement('div');
        this.modal.className = 'new-works-config-modal';
        this.modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-header-main">
                            <h3><i class="fas fa-cog"></i> 新作品设置</h3>
                            <p class="modal-subtitle">调整新作品扫描与入口行为。</p>
                        </div>
                        <button class="modal-close-btn" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="newWorksConfigForm">
                            <div class="config-layout">
                                <section class="config-section config-section-hero">
                                    <div class="config-section-header">
                                        <div class="config-section-icon"><i class="fas fa-sliders-h"></i></div>
                                        <div class="config-section-copy">
                                            <h4>扫描</h4>
                                            
                                        </div>
                                    </div>
                                    <div class="config-feature-card config-feature-card-highlight">
                                        <label class="checkbox-label config-switch-card">
                                            <input type="checkbox" id="configAutoCheckEnabled" ${config.autoCheckEnabled ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            <span class="config-switch-copy">
                                                <span class="config-switch-title">启用自动检查</span>
                                                <span class="config-switch-desc">在后台按设定周期扫描所有已启用订阅的演员。</span>
                                            </span>
                                        </label>
                                    </div>
                                    <div class="config-metric-grid">
                                        <div class="config-metric-card">
                                            <label for="configCheckInterval">
                                                <span class="metric-label">检查间隔（小时） <i class="fas fa-question-circle help-icon" title="建议设置为24小时或更长"></i></span>
                                                <input type="number" id="configCheckInterval" min="1" max="168" value="${config.checkInterval}">
                                                <small>建议按天级别扫描，减少无效请求。</small>
                                            </label>
                                        </div>
                                        <div class="config-metric-card">
                                            <label for="configRequestInterval">
                                                <span class="metric-label">请求间隔（秒） <i class="fas fa-question-circle help-icon" title="避免频繁请求，建议至少3秒"></i></span>
                                                <input type="number" id="configRequestInterval" min="1" max="60" value="${config.requestInterval}">
                                                <small>请求越平稳，越不容易触发站点限制。</small>
                                            </label>
                                        </div>
                                        <div class="config-metric-card">
                                            <label for="configConcurrency">
                                                <span class="metric-label">并发数量 <i class="fas fa-question-circle help-icon" title="同时检查多少个演员的新作品，建议1-3个，过高可能导致请求失败"></i></span>
                                                <input type="number" id="configConcurrency" min="1" max="5" value="${config.concurrency || 1}">
                                                <small>建议从 1 开始，确认稳定后再逐步提升。</small>
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                <section class="config-section">
                                    <div class="config-section-header">
                                        <div class="config-section-icon"><i class="fas fa-bolt"></i></div>
                                        <div class="config-section-copy">
                                            <h4>入口</h4>
                                            
                                        </div>
                                    </div>
                                    <div class="config-feature-card">
                                        <label class="checkbox-label config-switch-card">
                                            <input type="checkbox" id="configShowActorPageScanButton" ${config.showActorPageScanButton ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            <span class="config-switch-copy">
                                                <span class="config-switch-title">在演员页显示“扫描新作品”按钮</span>
                                                <span class="config-switch-desc">这是快捷入口。点击后仍会使用这里配置的类别过滤、状态过滤和去重规则。</span>
                                            </span>
                                        </label>
                                    </div>
                                </section>

                                <section class="config-section">
                                    <div class="config-section-header">
                                        <div class="config-section-icon"><i class="fas fa-filter"></i></div>
                                        <div class="config-section-copy">
                                            <h4>过滤</h4>
                                            
                                        </div>
                                    </div>
                                    <div class="config-option-grid">
                                        <div class="config-feature-card">
                                            <label class="checkbox-label config-switch-card compact">
                                                <input type="checkbox" id="configExcludeViewed" ${config.filters.excludeViewed ? 'checked' : ''}>
                                                <span class="checkmark"></span>
                                                <span class="config-switch-copy">
                                                    <span class="config-switch-title">排除已标记“看过”</span>
                                                    <span class="config-switch-desc">避免重复收集已经确认看过的作品。</span>
                                                </span>
                                            </label>
                                        </div>
                                        <div class="config-feature-card">
                                            <label class="checkbox-label config-switch-card compact">
                                                <input type="checkbox" id="configExcludeBrowsed" ${config.filters.excludeBrowsed ? 'checked' : ''}>
                                                <span class="checkmark"></span>
                                                <span class="config-switch-copy">
                                                    <span class="config-switch-title">排除已浏览详情页</span>
                                                    <span class="config-switch-desc">减少对已经点进去看过详情作品的重复提醒。</span>
                                                </span>
                                            </label>
                                        </div>
                                        <div class="config-feature-card">
                                            <label class="checkbox-label config-switch-card compact">
                                                <input type="checkbox" id="configExcludeWant" ${config.filters.excludeWant ? 'checked' : ''}>
                                                <span class="checkmark"></span>
                                                <span class="config-switch-copy">
                                                    <span class="config-switch-title">排除已标记“想看”</span>
                                                    <span class="config-switch-desc">把已加入待看清单的作品从新作品结果中剔除。</span>
                                                </span>
                                            </label>
                                        </div>
                                        <div class="config-feature-card">
                                            <label class="checkbox-label config-switch-card compact">
                                                <input type="checkbox" id="configExcludeAR" ${config.filters.excludeAR ? 'checked' : ''}>
                                                <span class="checkmark"></span>
                                                <span class="config-switch-copy">
                                                    <span class="config-switch-title">排除 AR 影片</span>
                                                    <span class="config-switch-desc">过滤掉你不想纳入追踪范围的 AR 类型作品。</span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="config-metric-grid config-metric-grid-wide">
                                        <div class="config-metric-card">
                                            <label for="configDateRange">
                                                <span class="metric-label">时间范围（月） <i class="fas fa-question-circle help-icon" title="仅检查最近几个月内发行的作品，0 表示不限制"></i></span>
                                                <input type="number" id="configDateRange" min="0" max="24" value="${config.filters.dateRange}">
                                                <small>0 表示不限时间范围，适合第一次全量整理时使用。</small>
                                            </label>
                                        </div>
                                        <div class="config-feature-card config-feature-card-note">
                                            <label class="checkbox-label config-switch-card compact">
                                                <input type="checkbox" id="configApplyContentFilter" ${config.filters.applyContentFilter ? 'checked' : ''}>
                                                <span class="checkmark"></span>
                                                <span class="config-switch-copy">
                                                    <span class="config-switch-title">应用智能内容过滤</span>
                                                    <span class="config-switch-desc">联动“功能增强 → 内容过滤”中的隐藏规则，一起过滤不想追踪的作品。</span>
                                                </span>
                                            </label>
                                            <a href="#" id="configGoToContentFilter" class="config-link">前往内容过滤设置</a>
                                        </div>
                                    </div>

                                    <div class="category-panel">
                                        <div class="category-panel-header">
                                            <div>
                                                <h5>类别筛选</h5>
                                                <p>仅扫描你关心的类别；如果不限制，就保持全选状态。</p>
                                            </div>
                                            <div class="category-panel-meta">已选 <strong id="categorySelectedCount">${selectedCategoryCount}</strong> 项</div>
                                        </div>
                                        <div class="category-panel-toolbar">
                                            <label class="checkbox-label category-all-checkbox category-pill">
                                                <input type="checkbox" id="categoryFilterAll">
                                                <span class="checkmark"></span>
                                                不限制（全选）
                                            </label>
                                        </div>
                                        <div class="category-filter-grid">
                                            ${this.generateCategoryCheckboxes(config.filters.categoryFilters)}
                                        </div>
                                    </div>
                                </section>

                                <section class="config-section">
                                    <div class="config-section-header">
                                        <div class="config-section-icon"><i class="fas fa-broom"></i></div>
                                        <div class="config-section-copy">
                                            <h4>清理</h4>
                                            
                                        </div>
                                    </div>
                                    <div class="config-metric-grid config-metric-grid-wide">
                                        <div class="config-feature-card config-feature-card-highlight">
                                            <label class="checkbox-label config-switch-card">
                                                <input type="checkbox" id="configAutoCleanup" ${config.autoCleanup ? 'checked' : ''}>
                                                <span class="checkmark"></span>
                                                <span class="config-switch-copy">
                                                    <span class="config-switch-title">启用自动清理</span>
                                                    <span class="config-switch-desc">自动移除已经处理且超过保留时间的新作品记录。</span>
                                                </span>
                                            </label>
                                        </div>
                                        <div class="config-metric-card">
                                            <label for="configCleanupDays">
                                                <span class="metric-label">清理天数 <i class="fas fa-question-circle help-icon" title="自动清理已读且超过指定天数的作品"></i></span>
                                                <input type="number" id="configCleanupDays" min="7" max="365" value="${config.cleanupDays}">
                                                <small>建议按你的追新节奏设置，例如 30～90 天。</small>
                                            </label>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <div class="modal-footer-note">保存后会立即影响新作品页面与演员页快捷扫描入口。</div>
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

        // 跳转到智能内容过滤设置
        const goToContentFilterBtn = this.modal.querySelector('#configGoToContentFilter') as HTMLAnchorElement | null;
        goToContentFilterBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCancel();
            // 切换到功能增强 tab，并滚动到内容过滤区域
            try {
                const enhancementTab = document.querySelector('[data-tab="tab-enhancement"]') as HTMLElement | null;
                enhancementTab?.click();
                setTimeout(() => {
                    const contentFilterSection = document.getElementById('contentFilterSection') || document.querySelector('.content-filter-section');
                    contentFilterSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            } catch {}
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
        const selectedCountEl = this.modal.querySelector('#categorySelectedCount') as HTMLElement | null;
        if (selectedCountEl) {
            selectedCountEl.textContent = String(checkedCount || totalCount);
        }

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

        // 只禁用与自动检查相关的输入框（检查间隔和请求间隔）
        // 并发设置、过滤条件和清理设置始终可用
        const autoInputs = this.modal.querySelectorAll('#configCheckInterval, #configRequestInterval');
        autoInputs.forEach(input => {
            (input as HTMLInputElement).disabled = !enabled;
        });

        // 并发设置始终可用（手动检查和自动检查都需要）
        const concurrencyInput = this.modal.querySelector('#configConcurrency') as HTMLInputElement;
        if (concurrencyInput) {
            concurrencyInput.disabled = false;
        }

        // 过滤条件始终可用，不受启用状态影响
        const filterInputs = this.modal.querySelectorAll('#configExcludeViewed, #configExcludeBrowsed, #configExcludeWant, #configExcludeAR, #configApplyContentFilter, #configDateRange');
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
            concurrency: getValue('configConcurrency') || 1,
            showActorPageScanButton: getValue('configShowActorPageScanButton'),
            filters: {
                excludeViewed: getValue('configExcludeViewed'),
                excludeBrowsed: getValue('configExcludeBrowsed'),
                excludeWant: getValue('configExcludeWant'),
                dateRange: getValue('configDateRange'),
                categoryFilters: categoryFilters.length > 0 ? categoryFilters : [],
                excludeAR: getValue('configExcludeAR'),
                applyContentFilter: getValue('configApplyContentFilter'),
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

        const concurrency = (config as any).concurrency || 1;
        if (concurrency < 1 || concurrency > 5) {
            showMessage('并发数量必须在1-5之间', 'warn');
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

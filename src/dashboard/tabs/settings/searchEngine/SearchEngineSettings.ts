/**
 * 搜索引擎设置面板
 * 自定义点击番号后跳转的搜索网站
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';
import {
    SEARCH_ENGINE_CATEGORY_OPTIONS,
    dedupeSearchEngines,
    filterSearchEnginesByCategory,
    getSearchEngineCategory,
    isBundledSearchEngine,
    resolveSearchEngineIcon
} from '../../../../features/externalSearch/domain/searchEngines';
import { showMessage } from '../../../ui/toast';

interface SearchEngine {
    id: string;
    name: string;
    urlTemplate: string;
    icon: string;
    enabled?: boolean;
    category?: string;
}

/**
 * 搜索引擎设置面板类
 */
export class SearchEngineSettings extends BaseSettingsPanel {
    private searchEngineList!: HTMLDivElement;
    private addSearchEngineBtn!: HTMLButtonElement;
    private categoryFilter?: HTMLSelectElement;
    private addSearchEngineModal?: HTMLElement;

    constructor() {
        super({
            panelId: 'search-engine-settings',
            panelName: '搜索引擎设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        this.searchEngineList = document.getElementById('search-engine-list') as HTMLDivElement;
        this.addSearchEngineBtn = document.getElementById('add-search-engine') as HTMLButtonElement;
        const categoryFilter = document.getElementById('search-engine-category-filter');
        this.categoryFilter = categoryFilter instanceof HTMLSelectElement ? categoryFilter : undefined;

        if (!this.searchEngineList || !this.addSearchEngineBtn) {
            throw new Error('搜索引擎设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        const signal = this.createEventBindingSignal();
        this.addSearchEngineBtn.addEventListener('click', this.handleAddSearchEngine.bind(this), { signal });
        this.searchEngineList.addEventListener('click', this.handleSearchEngineListClick.bind(this), { signal });
        this.searchEngineList.addEventListener('input', this.handleSearchEngineListInput.bind(this), { signal });
        this.searchEngineList.addEventListener('change', this.handleSearchEngineListInput.bind(this), { signal });
        this.categoryFilter?.addEventListener('change', () => {
            this.updateSearchEnginesFromUI();
            this.renderSearchEngines();
        }, { signal });
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.unbindManagedEvents();
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const searchEngines = settings?.searchEngines || [];

        if (Array.isArray(searchEngines) && searchEngines.length > 0) {
            this.renderSearchEngines();
        }
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            this.updateSearchEnginesFromUI({ notifyDuplicates: true });

            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                searchEngines: STATE.settings.searchEngines
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            return {
                success: true,
                savedSettings: { searchEngines: newSettings.searchEngines }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '保存失败'
            };
        }
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 验证搜索引擎配置
        const nameInputs = this.searchEngineList.querySelectorAll<HTMLInputElement>('.name-input');
        const urlInputs = this.searchEngineList.querySelectorAll<HTMLInputElement>('.url-template-input');

        nameInputs.forEach((nameInput, index) => {
            const urlInput = urlInputs[index];

            if (nameInput.value && !urlInput.value) {
                errors.push(`搜索引擎 "${nameInput.value}" 缺少URL模板`);
            }

            if (urlInput.value && !/\{\{\s*(?:id|fc2_id)\s*\}\}/i.test(urlInput.value)) {
                warnings.push(`搜索引擎 "${nameInput.value || '未命名'}" 的URL模板中缺少 {{ID}} 或 {{FC2_ID}} 占位符`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        this.updateSearchEnginesFromUI();
        return {
            searchEngines: STATE.settings.searchEngines
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        if (settings.searchEngines) {
            STATE.settings.searchEngines = settings.searchEngines;
            this.renderSearchEngines();
        }
    }

    /**
     * 渲染搜索引擎列表
     */
    private renderSearchEngines(): void {
        if (!this.searchEngineList) return;

        this.searchEngineList.innerHTML = ''; // Clear existing entries

        const fullEngines = Array.isArray(STATE.settings.searchEngines)
            ? STATE.settings.searchEngines
            : [];
        const category = this.categoryFilter?.value || 'all';
        const visibleEngines = filterSearchEnginesByCategory(fullEngines, category);

        visibleEngines.forEach((engine: SearchEngine, visibleIndex: number) => {
            if (!engine) {
                console.warn('Skipping invalid search engine entry at index:', visibleIndex, engine);
                return;
            }

            // 跳过包含测试数据的搜索引擎
            if (engine.urlTemplate && engine.urlTemplate.includes('example.com')) {
                console.warn('跳过包含 example.com 的搜索引擎:', engine);
                return;
            }

            if (engine.icon && engine.icon.includes('google.com/s2/favicons')) {
                console.warn('跳过使用 Google favicon 服务的搜索引擎:', engine);
                return;
            }

            const isBundled = isBundledSearchEngine(engine);
            const readonlyAttr = isBundled ? 'disabled aria-disabled="true"' : '';
            const bundledLabel = isBundled ? '<span class="search-engine-builtin-label">内置</span>' : '';
            const index = fullEngines.indexOf(engine);
            const engineId = String(engine.id || '').trim();
            const searchTargetEngineId = engineId.toLowerCase();
            const engineDiv = document.createElement('div');
            engineDiv.className = `search-engine-item${isBundled ? ' is-bundled' : ''}`;
            engineDiv.dataset.engineId = engineId;
            engineDiv.dataset.index = String(index);
            if (searchTargetEngineId) {
                engineDiv.dataset.settingsSearchTarget = `search-engine:${searchTargetEngineId}`;
            }

            const iconSrc = resolveSearchEngineIcon(engine);
            const engineName = this.escapeAttr(engine.name || '');
            const urlTemplate = this.escapeAttr(engine.urlTemplate || '');
            const iconValue = this.escapeAttr(engine.icon || '');
            const currentCategory = getSearchEngineCategory(engine);
            const categoryOptions = SEARCH_ENGINE_CATEGORY_OPTIONS
                .map(item => `<option value="${item.value}"${item.value === currentCategory ? ' selected' : ''}>${item.label}</option>`)
                .join('');
            const enabledChecked = engine.enabled !== false ? 'checked' : '';

            engineDiv.innerHTML = `
                <div class="icon-preview">
                    <img src="${iconSrc}" alt="${engineName}" class="engine-icon" data-fallback="${chrome.runtime.getURL('assets/alternate-search.png')}">
                </div>
                <label class="enabled-cell" title="控制该搜索引擎是否在详情页和番号库显示">
                    <input type="checkbox" class="enabled-input" data-index="${index}" ${enabledChecked}>
                    <span class="enabled-slider" aria-hidden="true"></span>
                </label>
                <div class="search-engine-name-cell">
                    <input type="text" value="${engineName}" class="name-input" data-index="${index}" placeholder="名称" ${readonlyAttr}>
                    ${bundledLabel}
                </div>
                <select class="category-select" data-index="${index}" ${readonlyAttr}>
                    ${categoryOptions}
                </select>
                <input type="text" value="${urlTemplate}" class="url-template-input" data-index="${index}" placeholder="URL 模板" ${readonlyAttr}>
                <input type="text" value="${iconValue}" class="icon-url-input" data-index="${index}" placeholder="Icon URL" ${readonlyAttr}>
                <div class="actions-container">
                    <button class="button-like danger delete-engine" data-index="${index}" ${isBundled ? 'disabled title="内置搜索引擎暂不支持删除"' : ''}><i class="fas fa-trash"></i></button>
                </div>
            `;

            // 添加错误处理事件监听器
            const img = engineDiv.querySelector('.engine-icon') as HTMLImageElement;
            if (img) {
                img.addEventListener('error', function() {
                    this.src = this.dataset.fallback || chrome.runtime.getURL('assets/alternate-search.png');
                });
            }

            this.searchEngineList.appendChild(engineDiv);
        });
    }

    /**
     * 从UI更新搜索引擎数据
     */
    private updateSearchEnginesFromUI(options: { notifyDuplicates?: boolean } = {}): void {
        const rows = this.searchEngineList.querySelectorAll<HTMLElement>('.search-engine-item');
        const newEngines: SearchEngine[] = Array.isArray(STATE.settings.searchEngines)
            ? [...STATE.settings.searchEngines]
            : [];

        rows.forEach((row) => {
            const index = parseInt(row.dataset.index || '-1', 10);
            if (!Number.isInteger(index) || index < 0) return;

            const nameInput = row.querySelector<HTMLInputElement>('.name-input');
            const urlInput = row.querySelector<HTMLInputElement>('.url-template-input');
            const iconUrlInput = row.querySelector<HTMLInputElement>('.icon-url-input');
            const categorySelect = row.querySelector<HTMLSelectElement>('.category-select');
            const enabledInput = row.querySelector<HTMLInputElement>('.enabled-input');
            if (!nameInput || !urlInput) return;

            if (nameInput.value && urlInput.value) {
                const originalEngine = STATE.settings.searchEngines[index] || {};
                const enabled = enabledInput?.checked !== false;
                if (isBundledSearchEngine(originalEngine)) {
                    newEngines[index] = {
                        ...originalEngine,
                        enabled,
                    };
                    return;
                }
                newEngines[index] = {
                    id: originalEngine.id || `engine-${Date.now()}-${index}`,
                    name: nameInput.value,
                    urlTemplate: urlInput.value,
                    icon: iconUrlInput?.value || '',
                    enabled,
                    category: categorySelect?.value || getSearchEngineCategory(originalEngine),
                };
            }
        });

        const deduped = dedupeSearchEngines(newEngines.filter(Boolean));
        STATE.settings.searchEngines = deduped.engines as SearchEngine[];

        if (deduped.duplicates.length > 0) {
            if (options.notifyDuplicates) {
                const names = deduped.duplicates
                    .map(item => `${item.duplicateName} → ${item.keptName}`)
                    .join('，');
                showMessage(`已移除重复搜索引擎：${names}`, 'warn', 6000);
            }
            this.renderSearchEngines();
        }
    }

    /**
     * 处理添加搜索引擎
     */
    private handleAddSearchEngine(): void {
        this.openAddSearchEngineModal();
    }

    private openAddSearchEngineModal(): void {
        this.closeAddSearchEngineModal();

        const defaultCategory = this.categoryFilter?.value && this.categoryFilter.value !== 'all'
            ? this.categoryFilter.value
            : 'search';
        const categoryOptions = SEARCH_ENGINE_CATEGORY_OPTIONS
            .map(item => `<option value="${item.value}"${item.value === defaultCategory ? ' selected' : ''}>${item.label}</option>`)
            .join('');

        const modal = document.createElement('div');
        modal.className = 'search-engine-add-modal';
        modal.innerHTML = `
            <div class="search-engine-modal-backdrop" data-action="close-add-search-engine"></div>
            <div class="search-engine-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="search-engine-modal-title">
                <div class="search-engine-modal-header">
                    <div>
                        <h3 id="search-engine-modal-title">新增搜索引擎</h3>
                        <p>填写后点击确认写入设置列表</p>
                    </div>
                    <button type="button" class="search-engine-modal-close" data-action="close-add-search-engine" aria-label="关闭">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-engine-modal-body">
                    <label>
                        <span>名称</span>
                        <input type="text" class="search-engine-modal-name" placeholder="例如：字幕站">
                    </label>
                    <label>
                        <span>分类</span>
                        <select class="search-engine-modal-category">${categoryOptions}</select>
                    </label>
                    <label class="search-engine-modal-wide">
                        <span>URL 模板</span>
                        <input type="text" class="search-engine-modal-url" placeholder="https://example.com/search?q={{ID}}">
                    </label>
                    <label class="search-engine-modal-wide">
                        <span>图标地址</span>
                        <input type="text" class="search-engine-modal-icon" value="assets/alternate-search.png" placeholder="assets/alternate-search.png">
                    </label>
                </div>
                <div class="search-engine-modal-footer">
                    <button type="button" class="button-like search-engine-modal-cancel" data-action="close-add-search-engine">取消</button>
                    <button type="button" class="button-like search-engine-modal-confirm" title="确认新增">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('[data-action="close-add-search-engine"]')) {
                this.closeAddSearchEngineModal();
                return;
            }

            if (target.closest('.search-engine-modal-confirm')) {
                this.confirmAddSearchEngine(modal);
            }
        });

        modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAddSearchEngineModal();
            }
            if (event.key === 'Enter' && (event.target as HTMLElement).tagName !== 'TEXTAREA') {
                event.preventDefault();
                this.confirmAddSearchEngine(modal);
            }
        });

        document.body.appendChild(modal);
        this.addSearchEngineModal = modal;
        modal.querySelector<HTMLInputElement>('.search-engine-modal-name')?.focus();
    }

    private closeAddSearchEngineModal(): void {
        this.addSearchEngineModal?.remove();
        this.addSearchEngineModal = undefined;
        document.querySelector('.search-engine-add-modal')?.remove();
    }

    private confirmAddSearchEngine(modal: HTMLElement): void {
        const name = modal.querySelector<HTMLInputElement>('.search-engine-modal-name')?.value.trim() || '';
        const urlTemplate = modal.querySelector<HTMLInputElement>('.search-engine-modal-url')?.value.trim() || '';
        const icon = modal.querySelector<HTMLInputElement>('.search-engine-modal-icon')?.value.trim() || 'assets/alternate-search.png';
        const category = modal.querySelector<HTMLSelectElement>('.search-engine-modal-category')?.value || 'search';

        if (!name || !urlTemplate) {
            showMessage('请填写搜索引擎名称和 URL 模板', 'warn');
            return;
        }

        if (!/\{\{\s*(?:id|fc2_id)\s*\}\}/i.test(urlTemplate)) {
            showMessage('URL 模板需要包含 {{ID}} 或 {{FC2_ID}} 占位符', 'warn');
            return;
        }

        const newEngine: SearchEngine = {
            id: `engine-${Date.now()}`,
            name,
            urlTemplate,
            icon,
            category,
        };

        const existingEngines = Array.isArray(STATE.settings.searchEngines)
            ? STATE.settings.searchEngines
            : [];
        const deduped = dedupeSearchEngines([...existingEngines, newEngine]);
        STATE.settings.searchEngines = deduped.engines as SearchEngine[];

        if (deduped.duplicates.length > 0) {
            const duplicate = deduped.duplicates.find(item => item.removed === newEngine);
            if (duplicate) {
                showMessage(`已存在相同搜索引擎：${duplicate.keptName}`, 'warn', 6000);
                return;
            }
        }

        logAsync('INFO', '用户添加了一个新的搜索引擎。', { engine: newEngine });
        this.closeAddSearchEngineModal();
        this.renderSearchEngines();
        this.emit('change');
        this.scheduleAutoSave();
    }

    /**
     * 处理搜索引擎列表点击事件
     */
    private handleSearchEngineListClick(event: Event): void {
        const target = event.target as HTMLElement;
        const removeButton = target.closest('.delete-engine');
        if (removeButton) {
            const index = parseInt(removeButton.getAttribute('data-index')!, 10);
            const removedEngine = STATE.settings.searchEngines[index];
            if (isBundledSearchEngine(removedEngine)) {
                showMessage('内置搜索引擎暂不支持删除', 'warn');
                return;
            }
            logAsync('INFO', '用户删除了一个搜索引擎。', { engine: removedEngine });
            STATE.settings.searchEngines.splice(index, 1);
            this.renderSearchEngines();
            this.scheduleAutoSave();
        }
    }

    /**
     * 处理搜索引擎列表输入事件
     */
    private handleSearchEngineListInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        if (target.classList.contains('name-input') ||
            target.classList.contains('url-template-input') ||
            target.classList.contains('icon-url-input') ||
            target.classList.contains('enabled-input') ||
            target.classList.contains('category-select')) {
            this.emit('change');
            this.scheduleAutoSave();
        }
    }

    private escapeAttr(value: string): string {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

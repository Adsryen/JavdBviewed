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
import { dedupeSearchEngines, isBundledSearchEngine, resolveSearchEngineIcon } from '../../../../utils/searchEngines';
import { showMessage } from '../../../ui/toast';

interface SearchEngine {
    id: string;
    name: string;
    urlTemplate: string;
    icon: string;
}

/**
 * 搜索引擎设置面板类
 */
export class SearchEngineSettings extends BaseSettingsPanel {
    private searchEngineList!: HTMLDivElement;
    private addSearchEngineBtn!: HTMLButtonElement;

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

            if (urlInput.value && !/\{\{\s*id\s*\}\}/i.test(urlInput.value)) {
                warnings.push(`搜索引擎 "${nameInput.value || '未命名'}" 的URL模板中缺少 {{ID}} 占位符`);
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

        STATE.settings.searchEngines?.forEach((engine: SearchEngine, index: number) => {
            if (!engine) {
                console.warn('Skipping invalid search engine entry at index:', index, engine);
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
            const engineDiv = document.createElement('div');
            engineDiv.className = `search-engine-item${isBundled ? ' is-bundled' : ''}`;
            engineDiv.dataset.engineId = engine.id || '';

            const iconSrc = resolveSearchEngineIcon(engine);
            const engineName = this.escapeAttr(engine.name || '');
            const urlTemplate = this.escapeAttr(engine.urlTemplate || '');
            const iconValue = this.escapeAttr(engine.icon || '');

            engineDiv.innerHTML = `
                <div class="icon-preview">
                    <img src="${iconSrc}" alt="${engineName}" class="engine-icon" data-fallback="${chrome.runtime.getURL('assets/alternate-search.png')}">
                </div>
                <div class="search-engine-name-cell">
                    <input type="text" value="${engineName}" class="name-input" data-index="${index}" placeholder="名称" ${readonlyAttr}>
                    ${bundledLabel}
                </div>
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
        const nameInputs = this.searchEngineList.querySelectorAll<HTMLInputElement>('.name-input');
        const urlInputs = this.searchEngineList.querySelectorAll<HTMLInputElement>('.url-template-input');
        const iconUrlInputs = this.searchEngineList.querySelectorAll<HTMLInputElement>('.icon-url-input');

        const newEngines: SearchEngine[] = [];
        nameInputs.forEach((nameInput, index) => {
            const urlInput = urlInputs[index];
            const iconUrlInput = iconUrlInputs[index];
            if (nameInput.value && urlInput.value) {
                const originalEngine = STATE.settings.searchEngines[index] || {};
                if (isBundledSearchEngine(originalEngine)) {
                    newEngines.push(originalEngine);
                    return;
                }
                newEngines.push({
                    id: originalEngine.id || `engine-${Date.now()}-${index}`,
                    name: nameInput.value,
                    urlTemplate: urlInput.value,
                    icon: iconUrlInput.value || ''
                });
            }
        });

        const deduped = dedupeSearchEngines(newEngines);
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
        const newEngine: SearchEngine = {
            id: `engine-${Date.now()}`,
            name: '',
            urlTemplate: '',
            icon: 'assets/alternate-search.png'
        };

        if (!Array.isArray(STATE.settings.searchEngines)) {
            STATE.settings.searchEngines = [];
        }
        STATE.settings.searchEngines.push(newEngine);
        logAsync('INFO', '用户添加了一个新的搜索引擎。', { engine: newEngine });
        this.renderSearchEngines();
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
            target.classList.contains('icon-url-input')) {
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

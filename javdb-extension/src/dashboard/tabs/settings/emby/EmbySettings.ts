/**
 * Emby增强设置面板
 * 配置Emby/Jellyfin等媒体服务器的番号识别和跳转功能
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

/**
 * Emby设置面板类
 */
export class EmbySettings extends BaseSettingsPanel {
    private enabledToggle!: HTMLInputElement;
    private matchUrlsList!: HTMLDivElement;
    private addUrlBtn!: HTMLButtonElement;
    private linkBehaviorSelect!: HTMLSelectElement;
    private autoDetectionToggle!: HTMLInputElement;
    private testCurrentPageBtn!: HTMLButtonElement;
    private testResultDiv!: HTMLDivElement;

    constructor() {
        super({
            panelId: 'emby-settings',
            panelName: 'Emby增强设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        this.enabledToggle = document.getElementById('emby-enabled') as HTMLInputElement;
        this.matchUrlsList = document.getElementById('emby-match-urls-list') as HTMLDivElement;
        this.addUrlBtn = document.getElementById('add-emby-url') as HTMLButtonElement;
        this.linkBehaviorSelect = document.getElementById('emby-link-behavior') as HTMLSelectElement;
        this.autoDetectionToggle = document.getElementById('emby-auto-detection') as HTMLInputElement;
        this.testCurrentPageBtn = document.getElementById('test-current-page') as HTMLButtonElement;
        this.testResultDiv = document.getElementById('test-result') as HTMLDivElement;

        if (!this.enabledToggle || !this.matchUrlsList || !this.addUrlBtn || 
            !this.linkBehaviorSelect || !this.autoDetectionToggle) {
            throw new Error('Emby设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        this.enabledToggle.addEventListener('change', this.handleEnabledChange.bind(this));
        this.addUrlBtn.addEventListener('click', this.handleAddUrl.bind(this));
        this.matchUrlsList.addEventListener('click', this.handleUrlListClick.bind(this));
        this.matchUrlsList.addEventListener('input', this.handleUrlListInput.bind(this));
        this.linkBehaviorSelect.addEventListener('change', this.handleSettingsChange.bind(this));
        this.autoDetectionToggle.addEventListener('change', this.handleSettingsChange.bind(this));
        
        if (this.testCurrentPageBtn) {
            this.testCurrentPageBtn.addEventListener('click', this.handleTestCurrentPage.bind(this));
        }
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.enabledToggle?.removeEventListener('change', this.handleEnabledChange.bind(this));
        this.addUrlBtn?.removeEventListener('click', this.handleAddUrl.bind(this));
        this.matchUrlsList?.removeEventListener('click', this.handleUrlListClick.bind(this));
        this.matchUrlsList?.removeEventListener('input', this.handleUrlListInput.bind(this));
        this.linkBehaviorSelect?.removeEventListener('change', this.handleSettingsChange.bind(this));
        this.autoDetectionToggle?.removeEventListener('change', this.handleSettingsChange.bind(this));
        
        if (this.testCurrentPageBtn) {
            this.testCurrentPageBtn.removeEventListener('click', this.handleTestCurrentPage.bind(this));
        }
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const embyConfig = settings?.emby;

        if (embyConfig) {
            this.enabledToggle.checked = embyConfig.enabled;
            this.linkBehaviorSelect.value = embyConfig.linkBehavior;
            this.autoDetectionToggle.checked = embyConfig.enableAutoDetection;
            
            this.renderMatchUrls();
            this.updateUIState();
        }
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            this.updateEmbyConfigFromUI();
            
            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                emby: STATE.settings.emby
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 通知所有标签页设置已更新
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'settings-updated',
                                settings: { emby: newSettings.emby }
                            }).catch(() => {
                                // 忽略无法发送消息的标签页
                            });
                        }
                    });
                });
            }

            return {
                success: true,
                savedSettings: { emby: newSettings.emby }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '保存设置失败'
            };
        }
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 验证URL模式
        const urls = this.getUrlsFromUI();
        for (const url of urls) {
            if (!url.trim()) {
                errors.push('URL模式不能为空');
                continue;
            }
            
            // 简单的URL格式验证
            if (!this.isValidUrlPattern(url)) {
                warnings.push(`URL模式可能无效: ${url}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }

    /**
     * 处理设置变化
     */
    private handleSettingsChange(): void {
        // 触发自动保存
        if (this.config.autoSave) {
            this.debouncedSave();
        }
    }

    /**
     * 处理启用状态变化
     */
    private handleEnabledChange(): void {
        this.updateUIState();
        this.handleSettingsChange();
    }

    /**
     * 更新UI状态
     */
    private updateUIState(): void {
        const enabled = this.enabledToggle.checked;
        const elements = [
            this.matchUrlsList,
            this.addUrlBtn,
            this.linkBehaviorSelect,
            this.autoDetectionToggle,
            this.testCurrentPageBtn
        ];

        elements.forEach(element => {
            if (element) {
                element.disabled = !enabled;
                if (element.parentElement) {
                    element.parentElement.style.opacity = enabled ? '1' : '0.5';
                }
            }
        });
    }

    /**
     * 渲染匹配URL列表
     */
    private renderMatchUrls(): void {
        const urls = STATE.settings.emby?.matchUrls || [];
        
        this.matchUrlsList.innerHTML = urls.map((url, index) => `
            <div class="url-item" data-index="${index}">
                <input type="text" class="url-input" value="${url}" placeholder="输入URL模式，如 *.emby.com/*">
                <button type="button" class="remove-url-btn" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // 如果没有URL，添加一个空的输入框
        if (urls.length === 0) {
            this.addEmptyUrlInput();
        }
    }

    /**
     * 添加空的URL输入框
     */
    private addEmptyUrlInput(): void {
        const index = this.matchUrlsList.children.length;
        const urlItem = document.createElement('div');
        urlItem.className = 'url-item';
        urlItem.dataset.index = index.toString();
        urlItem.innerHTML = `
            <input type="text" class="url-input" value="" placeholder="输入URL模式，如 *.emby.com/*">
            <button type="button" class="remove-url-btn" title="删除">
                <i class="fas fa-trash"></i>
            </button>
        `;
        this.matchUrlsList.appendChild(urlItem);
    }

    /**
     * 处理添加URL
     */
    private handleAddUrl(): void {
        this.addEmptyUrlInput();
    }

    /**
     * 处理URL列表点击事件
     */
    private handleUrlListClick(event: Event): void {
        const target = event.target as HTMLElement;
        
        if (target.classList.contains('remove-url-btn') || target.closest('.remove-url-btn')) {
            const urlItem = target.closest('.url-item') as HTMLElement;
            if (urlItem) {
                urlItem.remove();
                this.handleSettingsChange();
            }
        }
    }

    /**
     * 处理URL列表输入事件
     */
    private handleUrlListInput(): void {
        this.handleSettingsChange();
    }

    /**
     * 从UI获取URL列表
     */
    private getUrlsFromUI(): string[] {
        const inputs = this.matchUrlsList.querySelectorAll('.url-input') as NodeListOf<HTMLInputElement>;
        return Array.from(inputs).map(input => input.value.trim()).filter(url => url);
    }

    /**
     * 从UI更新Emby配置
     */
    private updateEmbyConfigFromUI(): void {
        if (!STATE.settings.emby) {
            STATE.settings.emby = {
                enabled: false,
                matchUrls: [],
                videoCodePatterns: [],
                linkBehavior: 'javdb-search',
                enableAutoDetection: true,
                highlightStyle: {
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '4px',
                    padding: '2px 4px'
                }
            };
        }

        STATE.settings.emby.enabled = this.enabledToggle.checked;
        STATE.settings.emby.matchUrls = this.getUrlsFromUI();
        STATE.settings.emby.linkBehavior = this.linkBehaviorSelect.value as 'javdb-direct' | 'javdb-search';
        STATE.settings.emby.enableAutoDetection = this.autoDetectionToggle.checked;
    }

    /**
     * 验证URL模式是否有效
     */
    private isValidUrlPattern(pattern: string): boolean {
        try {
            // 简单的URL模式验证
            const regex = pattern
                .replace(/\*/g, '.*')
                .replace(/\./g, '\\.');
            new RegExp(regex);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 测试当前页面是否匹配
     */
    private handleTestCurrentPage(): void {
        if (!this.testResultDiv) return;

        try {
            const currentUrl = window.location.href;
            const urls = this.getUrlsFromUI();
            
            let matched = false;
            let matchedPattern = '';

            for (const pattern of urls) {
                if (this.testUrlMatch(currentUrl, pattern)) {
                    matched = true;
                    matchedPattern = pattern;
                    break;
                }
            }

            this.testResultDiv.innerHTML = matched 
                ? `<div class="test-success">✓ 当前页面匹配模式: ${matchedPattern}</div>`
                : `<div class="test-failure">✗ 当前页面不匹配任何模式</div>`;
        } catch (error) {
            this.testResultDiv.innerHTML = `<div class="test-error">测试失败: ${error}</div>`;
        }
    }

    /**
     * 测试URL是否匹配模式
     */
    private testUrlMatch(url: string, pattern: string): boolean {
        try {
            const regex = new RegExp(
                pattern
                    .replace(/\*/g, '.*')
                    .replace(/\./g, '\\.')
            );
            return regex.test(url);
        } catch {
            return false;
        }
    }
}

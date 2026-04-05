/**
 * Emby增强设置面板
 * 配置Emby/Jellyfin等媒体服务器的番号识别和跳转功能
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { saveSettings } from '../../../../utils/storage';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import type { ExtensionSettings } from '../../../../types';

/**
 * Emby设置面板类
 */
export class EmbySettings extends BaseSettingsPanel {
    private enabledToggle!: HTMLInputElement;
    private matchUrlsList!: HTMLDivElement;
    private addUrlBtn!: HTMLButtonElement;
    private linkBehaviorSelect!: HTMLSelectElement;
    private showQuickSearchCodeToggle!: HTMLInputElement;
    private showQuickSearchActorToggle!: HTMLInputElement;

    constructor() {
        super({
            panelId: 'emby-settings',
            panelName: 'Emby增强设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: true
        });
    }

    protected initializeElements(): void {
        this.enabledToggle = document.getElementById('emby-enabled') as HTMLInputElement;
        this.matchUrlsList = document.getElementById('emby-match-urls-list') as HTMLDivElement;
        this.addUrlBtn = document.getElementById('add-emby-url') as HTMLButtonElement;
        this.linkBehaviorSelect = document.getElementById('emby-link-behavior') as HTMLSelectElement;
        this.showQuickSearchCodeToggle = document.getElementById('emby-show-quick-search-code') as HTMLInputElement;
        this.showQuickSearchActorToggle = document.getElementById('emby-show-quick-search-actor') as HTMLInputElement;

        if (!this.enabledToggle || !this.matchUrlsList || !this.addUrlBtn ||
            !this.linkBehaviorSelect ||
            !this.showQuickSearchCodeToggle || !this.showQuickSearchActorToggle) {
            throw new Error('Emby设置相关的DOM元素未找到');
        }
    }

    protected bindEvents(): void {
        this.enabledToggle.addEventListener('change', this.handleEnabledChange.bind(this));
        this.addUrlBtn.addEventListener('click', this.handleAddUrl.bind(this));
        this.matchUrlsList.addEventListener('click', this.handleUrlListClick.bind(this));
        this.matchUrlsList.addEventListener('input', this.handleUrlListInput.bind(this));
        this.linkBehaviorSelect.addEventListener('change', this.handleSettingsChange.bind(this));
        this.showQuickSearchCodeToggle.addEventListener('change', this.handleSettingsChange.bind(this));
        this.showQuickSearchActorToggle.addEventListener('change', this.handleSettingsChange.bind(this));
    }

    protected unbindEvents(): void {
        this.enabledToggle?.removeEventListener('change', this.handleEnabledChange.bind(this));
        this.addUrlBtn?.removeEventListener('click', this.handleAddUrl.bind(this));
        this.matchUrlsList?.removeEventListener('click', this.handleUrlListClick.bind(this));
        this.matchUrlsList?.removeEventListener('input', this.handleUrlListInput.bind(this));
        this.linkBehaviorSelect?.removeEventListener('change', this.handleSettingsChange.bind(this));
        this.showQuickSearchCodeToggle?.removeEventListener('change', this.handleSettingsChange.bind(this));
        this.showQuickSearchActorToggle?.removeEventListener('change', this.handleSettingsChange.bind(this));
    }

    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const embyConfig = settings?.emby;

        if (embyConfig) {
            this.enabledToggle.checked = embyConfig.enabled;
            this.linkBehaviorSelect.value = embyConfig.linkBehavior;
            this.showQuickSearchCodeToggle.checked = embyConfig.showQuickSearchCode !== false;
            this.showQuickSearchActorToggle.checked = embyConfig.showQuickSearchActor !== false;

            this.renderMatchUrls();
            this.updateUIState();
        }
    }

    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            this.updateEmbyConfigFromUI();

            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                emby: { ...STATE.settings.emby }
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'settings-updated',
                                settings: { emby: newSettings.emby }
                            }).catch(() => {});
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

    protected doValidateSettings(): SettingsValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        const urls = this.getUrlsFromUI();
        for (const url of urls) {
            if (!url.trim()) {
                errors.push('URL模式不能为空');
                continue;
            }
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

    private handleSettingsChange(): void {
        if (this.config.autoSave) {
            this.scheduleAutoSave();
        }
    }

    private handleEnabledChange(): void {
        this.updateUIState();
        this.handleSettingsChange();
    }

    private updateUIState(): void {
        const enabled = this.enabledToggle.checked;
        const elements = [
            this.matchUrlsList,
            this.addUrlBtn,
            this.linkBehaviorSelect,
            this.showQuickSearchCodeToggle,
            this.showQuickSearchActorToggle,
        ];

        elements.forEach(element => {
            if (element) {
                if ('disabled' in element) {
                    (element as HTMLInputElement | HTMLButtonElement | HTMLSelectElement).disabled = !enabled;
                }
                if (element.parentElement) {
                    element.parentElement.style.opacity = enabled ? '1' : '0.5';
                }
            }
        });
    }

    private renderMatchUrls(): void {
        const urls = STATE.settings.emby?.matchUrls || [];

        this.matchUrlsList.innerHTML = urls.map((url, index) => `
            <div class="url-item" data-index="${index}">
                <input type="text" class="url-input" value="${url}" placeholder="输入URL模式，如 http://192.168.1.6:8096/*">
                <button type="button" class="remove-url-btn" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        if (urls.length === 0) {
            this.addEmptyUrlInput();
        }
    }

    private addEmptyUrlInput(): void {
        const index = this.matchUrlsList.children.length;
        const urlItem = document.createElement('div');
        urlItem.className = 'url-item';
        urlItem.dataset.index = index.toString();
        urlItem.innerHTML = `
            <input type="text" class="url-input" value="" placeholder="输入URL模式，如 http://192.168.1.6:8096/*">
            <button type="button" class="remove-url-btn" title="删除">
                <i class="fas fa-trash"></i>
            </button>
        `;
        this.matchUrlsList.appendChild(urlItem);
    }

    private handleAddUrl(): void {
        this.addEmptyUrlInput();
    }

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

    private handleUrlListInput(): void {
        this.handleSettingsChange();
    }

    private getUrlsFromUI(): string[] {
        const inputs = this.matchUrlsList.querySelectorAll('.url-input') as NodeListOf<HTMLInputElement>;
        return Array.from(inputs).map(input => input.value.trim()).filter(url => url);
    }

    private updateEmbyConfigFromUI(): void {
        if (!STATE.settings.emby) {
            STATE.settings.emby = {
                enabled: false,
                matchUrls: [
                    'http://localhost:8096/*',
                    'https://localhost:8920/*',
                    'http://127.0.0.1:8096/*',
                    'http://192.168.*.*:8096/*',
                    'https://*.emby.com/*',
                    'https://*.jellyfin.org/*'
                ],
                videoCodePatterns: [
                    '[A-Z]{2,6}-\\d{2,6}',
                    'FC2-PPV-\\d+',
                    '\\d{4,8}_\\d{1,3}',
                    '\\d{6,12}',
                    '[a-z0-9]+-\\d+_\\d+'
                ],
                linkBehavior: 'javdb-search',
                enableAutoDetection: true,
                highlightStyle: {
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '4px',
                    padding: '2px 4px'
                },
                showQuickSearchCode: true,
                showQuickSearchActor: true
            };
        }

        STATE.settings.emby.enabled = this.enabledToggle.checked;
        STATE.settings.emby.matchUrls = this.getUrlsFromUI();
        STATE.settings.emby.linkBehavior = this.linkBehaviorSelect.value as 'javdb-direct' | 'javdb-search';
        STATE.settings.emby.enableAutoDetection = true; // 始终启用
        STATE.settings.emby.showQuickSearchCode = this.showQuickSearchCodeToggle.checked;
        STATE.settings.emby.showQuickSearchActor = this.showQuickSearchActorToggle.checked;
    }

    private isValidUrlPattern(pattern: string): boolean {
        try {
            const regex = pattern.replace(/\*/g, '.*').replace(/\./g, '\\.');
            new RegExp(regex);
            return true;
        } catch {
            return false;
        }
    }

    protected doGetSettings(): Partial<ExtensionSettings> {
        return { emby: STATE.settings.emby };
    }

    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        if (settings.emby) {
            STATE.settings.emby = { ...STATE.settings.emby, ...settings.emby };
        }
    }
}

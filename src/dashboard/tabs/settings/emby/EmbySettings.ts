/**
 * Emby/Jellyfin 增强设置面板
 * 配置 Emby/Jellyfin 等媒体服务器的番号识别和跳转功能
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { saveSettings } from '../../../../utils/storage';
import { showMessage } from '../../../ui/toast';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import type { ExtensionSettings } from '../../../../types';
import type { EmbyMediaServer } from '../../../../features/embyLibrary/types';

/**
 * Emby/Jellyfin 设置面板类
 */
export class EmbySettings extends BaseSettingsPanel {
    private enabledToggle!: HTMLInputElement;
    private matchUrlsList!: HTMLDivElement;
    private addUrlBtn!: HTMLButtonElement;
    private linkBehaviorSelect!: HTMLSelectElement;
    private showQuickSearchCodeToggle!: HTMLInputElement;
    private showQuickSearchActorToggle!: HTMLInputElement;
    private libraryStatusEnabledToggle!: HTMLInputElement;
    private libraryShowListToggle!: HTMLInputElement;
    private libraryShowDetailToggle!: HTMLInputElement;
    private realtimeCheckEnabledToggle!: HTMLInputElement;
    private syncIntervalInput!: HTMLInputElement;
    private mediaServerList!: HTMLDivElement;
    private addMediaServerBtn!: HTMLButtonElement;
    private syncLibraryBtn!: HTMLButtonElement;
    private syncStatusEl!: HTMLDivElement;

    constructor() {
        super({
            panelId: 'emby-settings',
            panelName: 'Emby/Jellyfin 增强设置',
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
        this.libraryStatusEnabledToggle = document.getElementById('emby-library-status-enabled') as HTMLInputElement;
        this.libraryShowListToggle = document.getElementById('emby-library-show-list') as HTMLInputElement;
        this.libraryShowDetailToggle = document.getElementById('emby-library-show-detail') as HTMLInputElement;
        this.realtimeCheckEnabledToggle = document.getElementById('emby-library-realtime-enabled') as HTMLInputElement;
        this.syncIntervalInput = document.getElementById('emby-library-sync-interval') as HTMLInputElement;
        this.mediaServerList = document.getElementById('emby-media-server-list') as HTMLDivElement;
        this.addMediaServerBtn = document.getElementById('add-emby-media-server') as HTMLButtonElement;
        this.syncLibraryBtn = document.getElementById('sync-emby-library') as HTMLButtonElement;
        this.syncStatusEl = document.getElementById('emby-library-sync-status') as HTMLDivElement;

        if (!this.enabledToggle || !this.matchUrlsList || !this.addUrlBtn ||
            !this.linkBehaviorSelect ||
            !this.showQuickSearchCodeToggle || !this.showQuickSearchActorToggle ||
            !this.libraryStatusEnabledToggle || !this.libraryShowListToggle ||
            !this.libraryShowDetailToggle || !this.realtimeCheckEnabledToggle ||
            !this.syncIntervalInput || !this.mediaServerList ||
            !this.addMediaServerBtn || !this.syncLibraryBtn || !this.syncStatusEl) {
            throw new Error('Emby/Jellyfin 设置相关的DOM元素未找到');
        }
    }

    protected bindEvents(): void {
        const signal = this.createEventBindingSignal();
        this.enabledToggle.addEventListener('change', this.handleEnabledChange.bind(this), { signal });
        this.addUrlBtn.addEventListener('click', this.handleAddUrl.bind(this), { signal });
        this.matchUrlsList.addEventListener('click', this.handleUrlListClick.bind(this), { signal });
        this.matchUrlsList.addEventListener('input', this.handleUrlListInput.bind(this), { signal });
        this.linkBehaviorSelect.addEventListener('change', this.handleSettingsChange.bind(this), { signal });
        this.showQuickSearchCodeToggle.addEventListener('change', this.handleSettingsChange.bind(this), { signal });
        this.showQuickSearchActorToggle.addEventListener('change', this.handleSettingsChange.bind(this), { signal });
        this.libraryStatusEnabledToggle.addEventListener('change', this.handleLibraryStatusChange.bind(this), { signal });
        this.libraryShowListToggle.addEventListener('change', this.handleSettingsChange.bind(this), { signal });
        this.libraryShowDetailToggle.addEventListener('change', this.handleSettingsChange.bind(this), { signal });
        this.realtimeCheckEnabledToggle.addEventListener('change', this.handleSettingsChange.bind(this), { signal });
        this.syncIntervalInput.addEventListener('input', this.handleSettingsChange.bind(this), { signal });
        this.addMediaServerBtn.addEventListener('click', this.handleAddMediaServer.bind(this), { signal });
        this.syncLibraryBtn.addEventListener('click', this.handleManualLibrarySync.bind(this), { signal });
        this.mediaServerList.addEventListener('input', this.handleSettingsChange.bind(this), { signal });
        this.mediaServerList.addEventListener('change', this.handleSettingsChange.bind(this), { signal });
        this.mediaServerList.addEventListener('click', this.handleMediaServerListClick.bind(this), { signal });
    }

    protected unbindEvents(): void {
        this.unbindManagedEvents();
    }

    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const embyConfig = settings?.emby;

        if (embyConfig) {
            this.enabledToggle.checked = embyConfig.enabled;
            this.linkBehaviorSelect.value = embyConfig.linkBehavior;
            this.showQuickSearchCodeToggle.checked = embyConfig.showQuickSearchCode !== false;
            this.showQuickSearchActorToggle.checked = embyConfig.showQuickSearchActor !== false;
            this.libraryStatusEnabledToggle.checked = embyConfig.libraryStatus?.enabled === true;
            this.libraryShowListToggle.checked = embyConfig.libraryStatus?.showOnList !== false;
            this.libraryShowDetailToggle.checked = embyConfig.libraryStatus?.showOnDetail !== false;
            this.realtimeCheckEnabledToggle.checked = embyConfig.realtimeCheck?.enabled === true;
            this.syncIntervalInput.value = String(Math.max(5, Number(embyConfig.syncIntervalMinutes || 60)));

            this.renderMatchUrls();
            this.renderMediaServers();
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
                                settings: newSettings
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

        const mediaServers = this.getMediaServersFromUI();
        mediaServers.forEach((server, index) => {
            if (!this.isValidServerUrl(server.url)) {
                errors.push(`媒体服务器 ${index + 1} 地址需要使用 http 或 https`);
            }
            if (!server.apiKey.trim()) {
                errors.push(`媒体服务器 ${index + 1} API Key 不能为空`);
            }
        });

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

    private handleLibraryStatusChange(): void {
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

        const libraryEnabled = this.libraryStatusEnabledToggle.checked;
        [
            this.libraryShowListToggle,
            this.libraryShowDetailToggle,
            this.realtimeCheckEnabledToggle,
        ].forEach(element => {
            element.disabled = !libraryEnabled;
            if (element.parentElement) {
                element.parentElement.style.opacity = libraryEnabled ? '1' : '0.5';
            }
        });
    }

    private renderMatchUrls(): void {
        const urls = STATE.settings.emby?.matchUrls || [];

        this.matchUrlsList.innerHTML = urls.map((url: string, index: number) => `
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

    private renderMediaServers(): void {
        const servers = this.getStoredMediaServers();
        this.mediaServerList.innerHTML = servers.map((server, index) => this.renderMediaServerItem(server, index)).join('');
    }

    private renderMediaServerItem(server: EmbyMediaServer, index: number): string {
        const type = server.type === 'jellyfin' ? 'jellyfin' : 'emby';
        return `
            <div class="emby-media-server-item" data-index="${index}">
                <div class="emby-media-server-grid">
                    <label class="setting-label">
                        <span class="setting-title">类型</span>
                        <select class="emby-server-type setting-select">
                            <option value="emby" ${type === 'emby' ? 'selected' : ''}>Emby</option>
                            <option value="jellyfin" ${type === 'jellyfin' ? 'selected' : ''}>Jellyfin</option>
                        </select>
                    </label>
                    <label class="setting-label">
                        <span class="setting-title">名称</span>
                        <input type="text" class="emby-server-name setting-input" value="${this.escapeHtml(server.name || '')}" placeholder="主服务器">
                    </label>
                    <label class="setting-label emby-server-url-field">
                        <span class="setting-title">服务器地址</span>
                        <input type="text" class="emby-server-url setting-input" value="${this.escapeHtml(server.url || '')}" placeholder="http://192.168.1.10:8096">
                    </label>
                    <label class="setting-label emby-server-key-field">
                        <span class="setting-title">API Key</span>
                        <input type="password" class="emby-server-api-key setting-input" value="${this.escapeHtml(server.apiKey || '')}" placeholder="媒体服务器 API Key">
                    </label>
                    <label class="setting-label emby-server-enabled-field">
                        <input type="checkbox" class="emby-server-enabled" ${server.enabled !== false ? 'checked' : ''}>
                        <span class="setting-title">启用</span>
                    </label>
                    <button type="button" class="remove-emby-media-server remove-url-btn" title="删除服务器">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    private handleAddMediaServer(): void {
        const servers = this.getStoredMediaServers();
        const now = Date.now();
        servers.push({
            id: `media-server-${now}`,
            type: 'emby',
            name: 'Emby',
            url: '',
            apiKey: '',
            enabled: true,
        });
        STATE.settings.emby = {
            ...STATE.settings.emby,
            mediaServers: servers,
        };
        this.renderMediaServers();
        this.handleSettingsChange();
    }

    private handleMediaServerListClick(event: Event): void {
        const target = event.target as HTMLElement;
        const button = target.closest('.remove-emby-media-server');
        if (!button) return;
        const item = button.closest('.emby-media-server-item') as HTMLElement | null;
        const index = Number(item?.dataset.index);
        if (!Number.isInteger(index)) return;
        const servers = this.getMediaServersFromUI();
        servers.splice(index, 1);
        STATE.settings.emby = {
            ...STATE.settings.emby,
            mediaServers: servers,
        };
        this.renderMediaServers();
        this.handleSettingsChange();
    }

    private getStoredMediaServers(): EmbyMediaServer[] {
        const servers = STATE.settings.emby?.mediaServers;
        return Array.isArray(servers) ? servers.map((server: any): EmbyMediaServer => {
            const type: EmbyMediaServer['type'] = server.type === 'jellyfin' ? 'jellyfin' : 'emby';
            return {
                id: String(server.id || `media-server-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
                type,
                name: String(server.name || (type === 'jellyfin' ? 'Jellyfin' : 'Emby')),
                url: String(server.url || ''),
                apiKey: String(server.apiKey || ''),
                enabled: server.enabled !== false,
            };
        }) : [];
    }

    private getMediaServersFromUI(): EmbyMediaServer[] {
        const items = Array.from(this.mediaServerList.querySelectorAll<HTMLElement>('.emby-media-server-item'));
        return items.map((item, index): EmbyMediaServer => {
            const type: EmbyMediaServer['type'] = item.querySelector<HTMLSelectElement>('.emby-server-type')?.value === 'jellyfin' ? 'jellyfin' : 'emby';
            const name = item.querySelector<HTMLInputElement>('.emby-server-name')?.value.trim() || (type === 'jellyfin' ? 'Jellyfin' : 'Emby');
            const url = item.querySelector<HTMLInputElement>('.emby-server-url')?.value.trim().replace(/\/+$/, '') || '';
            const apiKey = item.querySelector<HTMLInputElement>('.emby-server-api-key')?.value.trim() || '';
            const enabled = item.querySelector<HTMLInputElement>('.emby-server-enabled')?.checked !== false;
            const existing = this.getStoredMediaServers()[index];
            return {
                id: existing?.id || `media-server-${Date.now()}-${index}`,
                type,
                name,
                url,
                apiKey,
                enabled,
            };
        }).filter((server) => server.url || server.apiKey);
    }

    private async handleManualLibrarySync(): Promise<void> {
        if (!this.validateSettings()) return;
        await this.saveSettings();
        this.syncLibraryBtn.disabled = true;
        this.syncStatusEl.textContent = '正在同步媒体库...';
        try {
            const response = await this.sendRuntimeMessage({ type: 'EMBY_LIBRARY_SYNC', manual: true });
            const synced = Number(response?.synced || 0);
            const failed = Number(response?.failed || 0);
            if (response?.success) {
                this.syncStatusEl.textContent = `同步完成：成功 ${synced} 个服务器，失败 ${failed} 个服务器`;
                showMessage('媒体库同步完成', 'success');
                this.broadcastLibraryStateUpdated();
            } else {
                const error = response?.error || (failed > 0 ? `失败 ${failed} 个服务器` : '同步失败');
                this.syncStatusEl.textContent = `同步失败：${error}`;
                showMessage(`媒体库同步失败：${error}`, 'error');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.syncStatusEl.textContent = `同步失败：${message}`;
            showMessage(`媒体库同步失败：${message}`, 'error');
        } finally {
            this.syncLibraryBtn.disabled = false;
        }
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
                showQuickSearchActor: true,
                mediaServers: [],
                syncIntervalMinutes: 60,
                libraryStatus: {
                    enabled: false,
                    showOnList: true,
                    showOnDetail: true,
                },
                realtimeCheck: {
                    enabled: false,
                    concurrency: 1,
                    batchSize: 20,
                    cacheTtlMinutes: 10,
                },
            };
        }

        STATE.settings.emby.enabled = this.enabledToggle.checked;
        STATE.settings.emby.matchUrls = this.getUrlsFromUI();
        STATE.settings.emby.linkBehavior = this.linkBehaviorSelect.value as 'javdb-direct' | 'javdb-search';
        STATE.settings.emby.enableAutoDetection = true; // 始终启用
        STATE.settings.emby.showQuickSearchCode = this.showQuickSearchCodeToggle.checked;
        STATE.settings.emby.showQuickSearchActor = this.showQuickSearchActorToggle.checked;
        STATE.settings.emby.mediaServers = this.getMediaServersFromUI();
        STATE.settings.emby.syncIntervalMinutes = Math.max(5, Number(this.syncIntervalInput.value || 60));
        STATE.settings.emby.libraryStatus = {
            enabled: this.libraryStatusEnabledToggle.checked,
            showOnList: this.libraryShowListToggle.checked,
            showOnDetail: this.libraryShowDetailToggle.checked,
        };
        STATE.settings.emby.realtimeCheck = {
            ...(STATE.settings.emby.realtimeCheck || {}),
            enabled: this.realtimeCheckEnabledToggle.checked,
            concurrency: 1,
            batchSize: 20,
            cacheTtlMinutes: 10,
        };
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

    private isValidServerUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    private sendRuntimeMessage(message: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(response);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    private broadcastLibraryStateUpdated(): void {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { type: 'EMBY_LIBRARY_STATE_UPDATED' }).catch(() => {});
                }
            });
        });
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
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

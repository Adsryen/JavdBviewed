/**
 * 同步设置面板
 * 配置从JavDB同步观看记录、想看列表和演员数据的URL地址和行为参数
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

/**
 * 同步设置面板类
 */
export class SyncSettings extends BaseSettingsPanel {
    // 视频数据同步元素
    private wantWatchUrlInput!: HTMLInputElement;
    private watchedVideosUrlInput!: HTMLInputElement;
    private requestIntervalInput!: HTMLInputElement;
    private batchSizeInput!: HTMLInputElement;
    private maxRetriesInput!: HTMLInputElement;

    // 演员数据同步元素
    private enabledCheckbox!: HTMLInputElement;
    private autoSyncCheckbox!: HTMLInputElement;
    private syncIntervalInput!: HTMLInputElement;
    private collectionUrlInput!: HTMLInputElement;
    private detailUrlInput!: HTMLInputElement;
    private actorRequestIntervalInput!: HTMLInputElement;
    private actorBatchSizeInput!: HTMLInputElement;
    private actorMaxRetriesInput!: HTMLInputElement;

    // 按钮元素
    private saveSyncBtn!: HTMLButtonElement;
    private testConnectionBtn!: HTMLButtonElement;
    private testParsingBtn!: HTMLButtonElement;

    constructor() {
        super({
            panelId: 'sync-settings',
            panelName: '同步设置',
            autoSave: false, // 同步设置需要手动保存
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 视频数据同步元素
        this.wantWatchUrlInput = document.getElementById('dataSyncWantWatchUrl') as HTMLInputElement;
        this.watchedVideosUrlInput = document.getElementById('dataSyncWatchedVideosUrl') as HTMLInputElement;
        this.requestIntervalInput = document.getElementById('dataSyncRequestInterval') as HTMLInputElement;
        this.batchSizeInput = document.getElementById('dataSyncBatchSize') as HTMLInputElement;
        this.maxRetriesInput = document.getElementById('dataSyncMaxRetries') as HTMLInputElement;

        // 演员数据同步元素
        this.enabledCheckbox = document.getElementById('actorSyncEnabled') as HTMLInputElement;
        this.autoSyncCheckbox = document.getElementById('actorAutoSync') as HTMLInputElement;
        this.syncIntervalInput = document.getElementById('actorSyncInterval') as HTMLInputElement;
        this.collectionUrlInput = document.getElementById('actorSyncCollectionUrl') as HTMLInputElement;
        this.detailUrlInput = document.getElementById('actorSyncDetailUrl') as HTMLInputElement;
        this.actorRequestIntervalInput = document.getElementById('actorSyncRequestInterval') as HTMLInputElement;
        this.actorBatchSizeInput = document.getElementById('actorSyncBatchSize') as HTMLInputElement;
        this.actorMaxRetriesInput = document.getElementById('actorSyncMaxRetries') as HTMLInputElement;

        // 按钮元素
        this.saveSyncBtn = document.getElementById('saveSyncSettings') as HTMLButtonElement;
        this.testConnectionBtn = document.getElementById('testActorSyncConnection') as HTMLButtonElement;
        this.testParsingBtn = document.getElementById('testActorSyncParsing') as HTMLButtonElement;

        if (!this.wantWatchUrlInput || !this.watchedVideosUrlInput || !this.enabledCheckbox ||
            !this.saveSyncBtn || !this.testConnectionBtn || !this.testParsingBtn) {
            throw new Error('同步设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        this.saveSyncBtn?.addEventListener('click', this.handleSaveSettings.bind(this));
        this.enabledCheckbox?.addEventListener('change', this.handleActorSyncEnabledChange.bind(this));
        this.testConnectionBtn?.addEventListener('click', this.handleTestConnection.bind(this));
        this.testParsingBtn?.addEventListener('click', this.handleTestParsing.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.saveSyncBtn?.removeEventListener('click', this.handleSaveSettings.bind(this));
        this.enabledCheckbox?.removeEventListener('change', this.handleActorSyncEnabledChange.bind(this));
        this.testConnectionBtn?.removeEventListener('click', this.handleTestConnection.bind(this));
        this.testParsingBtn?.removeEventListener('click', this.handleTestParsing.bind(this));
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        if (!settings) {
            console.warn('设置不存在，使用默认值');
            return;
        }

        const dataSync = settings.dataSync;
        const actorSync = settings.actorSync;

        // 视频数据同步设置
        if (this.wantWatchUrlInput) this.wantWatchUrlInput.value = dataSync?.urls?.wantWatch || 'https://javdb.com/users/want_watch_videos';
        if (this.watchedVideosUrlInput) this.watchedVideosUrlInput.value = dataSync?.urls?.watchedVideos || 'https://javdb.com/users/watched_videos';
        if (this.requestIntervalInput) this.requestIntervalInput.value = (dataSync?.requestInterval || 3).toString();
        if (this.batchSizeInput) this.batchSizeInput.value = (dataSync?.batchSize || 20).toString();
        if (this.maxRetriesInput) this.maxRetriesInput.value = (dataSync?.maxRetries || 3).toString();

        // 演员数据同步设置
        if (this.enabledCheckbox) this.enabledCheckbox.checked = actorSync?.enabled || false;
        if (this.autoSyncCheckbox) this.autoSyncCheckbox.checked = actorSync?.autoSync || false;
        if (this.syncIntervalInput) this.syncIntervalInput.value = (actorSync?.syncInterval || 1440).toString();
        if (this.collectionUrlInput) this.collectionUrlInput.value = actorSync?.urls?.collectionActors || 'https://javdb.com/users/collection_actors';
        if (this.detailUrlInput) this.detailUrlInput.value = actorSync?.urls?.actorDetail || 'https://javdb.com/actors/{{ACTOR_ID}}';
        if (this.actorRequestIntervalInput) this.actorRequestIntervalInput.value = (actorSync?.requestInterval || 3).toString();
        if (this.actorBatchSizeInput) this.actorBatchSizeInput.value = (actorSync?.batchSize || 20).toString();
        if (this.actorMaxRetriesInput) this.actorMaxRetriesInput.value = (actorSync?.maxRetries || 3).toString();

        // 更新控件状态
        this.toggleActorSyncControls();
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const settings = STATE.settings;

            // 获取并验证输入值
            const requestInterval = parseInt(this.requestIntervalInput?.value || '3');
            const batchSize = parseInt(this.batchSizeInput?.value || '20');
            const maxRetries = parseInt(this.maxRetriesInput?.value || '3');
            const syncInterval = parseInt(this.syncIntervalInput?.value || '1440');
            const actorRequestInterval = parseInt(this.actorRequestIntervalInput?.value || '3');
            const actorBatchSize = parseInt(this.actorBatchSizeInput?.value || '20');
            const actorMaxRetries = parseInt(this.actorMaxRetriesInput?.value || '3');

            // 更新数据同步设置
            settings.dataSync = {
                requestInterval,
                batchSize,
                maxRetries,
                urls: {
                    wantWatch: this.wantWatchUrlInput?.value || 'https://javdb.com/users/want_watch_videos',
                    watchedVideos: this.watchedVideosUrlInput?.value || 'https://javdb.com/users/watched_videos',
                    collectionActors: this.collectionUrlInput?.value || 'https://javdb.com/users/collection_actors',
                },
            };

            // 更新演员同步设置
            settings.actorSync = {
                enabled: this.enabledCheckbox?.checked || false,
                autoSync: this.autoSyncCheckbox?.checked || false,
                syncInterval,
                batchSize: actorBatchSize,
                maxRetries: actorMaxRetries,
                requestInterval: actorRequestInterval,
                urls: {
                    collectionActors: this.collectionUrlInput?.value || 'https://javdb.com/users/collection_actors',
                    actorDetail: this.detailUrlInput?.value || 'https://javdb.com/actors/{{ACTOR_ID}}',
                },
            };

            // 保存设置
            await saveSettings(settings);
            STATE.settings = settings;

            logAsync('INFO', '同步设置已保存', { dataSync: settings.dataSync, actorSync: settings.actorSync });

            return {
                success: true,
                savedSettings: { dataSync: settings.dataSync, actorSync: settings.actorSync }
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

        // 验证视频数据同步配置
        const requestInterval = parseInt(this.requestIntervalInput?.value || '3');
        const batchSize = parseInt(this.batchSizeInput?.value || '20');
        const maxRetries = parseInt(this.maxRetriesInput?.value || '3');

        if (requestInterval < 1 || requestInterval > 60) {
            errors.push('视频同步请求间隔必须在1-60秒之间');
        }

        if (batchSize < 10 || batchSize > 100) {
            errors.push('视频同步批量处理大小必须在10-100之间');
        }

        if (maxRetries < 1 || maxRetries > 10) {
            errors.push('视频同步最大重试次数必须在1-10之间');
        }

        // 验证演员同步配置
        const syncInterval = parseInt(this.syncIntervalInput?.value || '1440');
        const actorRequestInterval = parseInt(this.actorRequestIntervalInput?.value || '3');
        const actorBatchSize = parseInt(this.actorBatchSizeInput?.value || '20');
        const actorMaxRetries = parseInt(this.actorMaxRetriesInput?.value || '3');

        if (syncInterval < 60 || syncInterval > 10080) {
            errors.push('演员同步间隔必须在60-10080分钟之间');
        }

        if (actorRequestInterval < 3 || actorRequestInterval > 60) {
            errors.push('演员同步请求间隔必须在3-60秒之间');
        }

        if (actorBatchSize < 10 || actorBatchSize > 50) {
            errors.push('演员同步批量处理大小必须在10-50之间');
        }

        if (actorMaxRetries < 1 || actorMaxRetries > 10) {
            errors.push('演员同步最大重试次数必须在1-10之间');
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        const requestInterval = parseInt(this.requestIntervalInput?.value || '3');
        const batchSize = parseInt(this.batchSizeInput?.value || '20');
        const maxRetries = parseInt(this.maxRetriesInput?.value || '3');
        const syncInterval = parseInt(this.syncIntervalInput?.value || '1440');
        const actorRequestInterval = parseInt(this.actorRequestIntervalInput?.value || '3');
        const actorBatchSize = parseInt(this.actorBatchSizeInput?.value || '20');
        const actorMaxRetries = parseInt(this.actorMaxRetriesInput?.value || '3');

        return {
            dataSync: {
                requestInterval,
                batchSize,
                maxRetries,
                urls: {
                    wantWatch: this.wantWatchUrlInput?.value || 'https://javdb.com/users/want_watch_videos',
                    watchedVideos: this.watchedVideosUrlInput?.value || 'https://javdb.com/users/watched_videos',
                    collectionActors: this.collectionUrlInput?.value || 'https://javdb.com/users/collection_actors',
                },
            },
            actorSync: {
                enabled: this.enabledCheckbox?.checked || false,
                autoSync: this.autoSyncCheckbox?.checked || false,
                syncInterval,
                batchSize: actorBatchSize,
                maxRetries: actorMaxRetries,
                requestInterval: actorRequestInterval,
                urls: {
                    collectionActors: this.collectionUrlInput?.value || 'https://javdb.com/users/collection_actors',
                    actorDetail: this.detailUrlInput?.value || 'https://javdb.com/actors/{{ACTOR_ID}}',
                },
            }
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const dataSync = settings.dataSync;
        const actorSync = settings.actorSync;

        if (dataSync) {
            if (dataSync.urls?.wantWatch && this.wantWatchUrlInput) {
                this.wantWatchUrlInput.value = dataSync.urls.wantWatch;
            }
            if (dataSync.urls?.watchedVideos && this.watchedVideosUrlInput) {
                this.watchedVideosUrlInput.value = dataSync.urls.watchedVideos;
            }
            if (dataSync.requestInterval !== undefined && this.requestIntervalInput) {
                this.requestIntervalInput.value = dataSync.requestInterval.toString();
            }
            if (dataSync.batchSize !== undefined && this.batchSizeInput) {
                this.batchSizeInput.value = dataSync.batchSize.toString();
            }
            if (dataSync.maxRetries !== undefined && this.maxRetriesInput) {
                this.maxRetriesInput.value = dataSync.maxRetries.toString();
            }
        }

        if (actorSync) {
            if (actorSync.enabled !== undefined && this.enabledCheckbox) {
                this.enabledCheckbox.checked = actorSync.enabled;
            }
            if (actorSync.autoSync !== undefined && this.autoSyncCheckbox) {
                this.autoSyncCheckbox.checked = actorSync.autoSync;
            }
            if (actorSync.syncInterval !== undefined && this.syncIntervalInput) {
                this.syncIntervalInput.value = actorSync.syncInterval.toString();
            }
            if (actorSync.urls?.collectionActors && this.collectionUrlInput) {
                this.collectionUrlInput.value = actorSync.urls.collectionActors;
            }
            if (actorSync.urls?.actorDetail && this.detailUrlInput) {
                this.detailUrlInput.value = actorSync.urls.actorDetail;
            }
            if (actorSync.requestInterval !== undefined && this.actorRequestIntervalInput) {
                this.actorRequestIntervalInput.value = actorSync.requestInterval.toString();
            }
            if (actorSync.batchSize !== undefined && this.actorBatchSizeInput) {
                this.actorBatchSizeInput.value = actorSync.batchSize.toString();
            }
            if (actorSync.maxRetries !== undefined && this.actorMaxRetriesInput) {
                this.actorMaxRetriesInput.value = actorSync.maxRetries.toString();
            }
        }

        this.toggleActorSyncControls();
        this.emit('change');
    }

    /**
     * 处理保存设置按钮点击
     */
    private async handleSaveSettings(): Promise<void> {
        try {
            await this.saveSettings();
        } catch (error) {
            console.error('保存同步设置失败:', error);
            showMessage('保存失败，请重试', 'error');
        }
    }

    /**
     * 处理演员同步启用状态变化
     */
    private handleActorSyncEnabledChange(): void {
        this.toggleActorSyncControls();
        this.emit('change');
    }

    /**
     * 切换演员同步控制状态
     */
    private toggleActorSyncControls(): void {
        const isEnabled = this.enabledCheckbox?.checked || false;

        // 获取所有需要控制的元素
        const controlElements = [
            'actorAutoSync',
            'actorSyncInterval',
            'actorSyncCollectionUrl',
            'actorSyncDetailUrl',
            'actorSyncRequestInterval',
            'actorSyncBatchSize',
            'actorSyncMaxRetries',
            'testActorSyncConnection',
            'testActorSyncParsing'
        ];

        controlElements.forEach(id => {
            const element = document.getElementById(id) as HTMLInputElement | HTMLButtonElement;
            if (element) {
                element.disabled = !isEnabled;
            }
        });
    }

    /**
     * 处理测试连接
     */
    private async handleTestConnection(): Promise<void> {
        const testResultsDiv = document.getElementById('actorSyncTestResults');
        if (!testResultsDiv || !this.testConnectionBtn) return;

        try {
            this.testConnectionBtn.disabled = true;
            this.testConnectionBtn.textContent = '测试中...';

            const url = this.collectionUrlInput?.value || 'https://javdb.com/users/collection_actors';

            await fetch(url + '?page=1', {
                method: 'HEAD',
                mode: 'no-cors'
            });

            testResultsDiv.innerHTML = `
                <div class="test-result-success">
                    <i class="fas fa-check-circle"></i>
                    连接测试成功！可以访问演员列表页面。
                </div>
            `;

        } catch (error) {
            testResultsDiv.innerHTML = `
                <div class="test-result-error">
                    <i class="fas fa-exclamation-circle"></i>
                    连接测试失败：${error instanceof Error ? error.message : '未知错误'}
                </div>
            `;
        } finally {
            this.testConnectionBtn.disabled = false;
            this.testConnectionBtn.textContent = '测试连接';
        }
    }

    /**
     * 处理测试解析
     */
    private async handleTestParsing(): Promise<void> {
        const testResultsDiv = document.getElementById('actorSyncTestResults');
        if (!testResultsDiv || !this.testParsingBtn) return;

        try {
            this.testParsingBtn.disabled = true;
            this.testParsingBtn.textContent = '测试中...';

            testResultsDiv.innerHTML = `
                <div class="test-result-info">
                    <i class="fas fa-info-circle"></i>
                    解析测试功能正在开发中，将在后续版本中提供。
                </div>
            `;

        } catch (error) {
            testResultsDiv.innerHTML = `
                <div class="test-result-error">
                    <i class="fas fa-exclamation-circle"></i>
                    解析测试失败：${error instanceof Error ? error.message : '未知错误'}
                </div>
            `;
        } finally {
            this.testParsingBtn.disabled = false;
            this.testParsingBtn.textContent = '测试解析';
        }
    }
}

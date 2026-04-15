/**
 * WebDAV设置面板
 * 通过WebDAV协议，将观看记录备份到兼容的云存储服务
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import type { ExtensionSettings, WebDAVConfig } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

/**
 * WebDAV设置面板类
 */
export class WebDAVSettings extends BaseSettingsPanel {
    // 全局设置元素
    private webdavEnabled!: HTMLInputElement;
    private webdavAutoSync!: HTMLInputElement;
    private webdavSyncInterval!: HTMLInputElement;
    private webdavRetentionDays!: HTMLInputElement;
    private webdavWarningDays!: HTMLInputElement;
    
    // 数据范围选择
    private webdavBackupCoreData!: HTMLInputElement;
    private webdavBackupActorData!: HTMLInputElement;
    private webdavBackupNewWorksData!: HTMLInputElement;
    private webdavBackupSystemConfig!: HTMLInputElement;
    private webdavBackupLogsData!: HTMLInputElement;
    
    // 按钮
    private testWebdavConnectionBtn!: HTMLButtonElement;
    private diagnoseWebdavConnectionBtn!: HTMLButtonElement;
    
    // 配置管理
    private addWebdavConfigBtn!: HTMLButtonElement;
    private webdavConfigList!: HTMLDivElement;
    
    // 弹窗元素
    private webdavConfigModal!: HTMLDivElement;
    private webdavConfigModalTitle!: HTMLHeadingElement;
    private closeWebdavConfigModalBtn!: HTMLButtonElement;
    private cancelWebdavConfigModalBtn!: HTMLButtonElement;
    private testWebdavConfigModalBtn!: HTMLButtonElement;
    private saveWebdavConfigModalBtn!: HTMLButtonElement;
    private modalConfigName!: HTMLInputElement;
    private modalWebdavProvider!: HTMLSelectElement;
    private modalWebdavUrl!: HTMLInputElement;
    private modalWebdavFolder!: HTMLInputElement;
    private modalWebdavUser!: HTMLInputElement;
    private modalWebdavPass!: HTMLInputElement;
    private modalToggleWebdavPasswordVisibilityBtn!: HTMLButtonElement;
    private modalCopyWebdavFullUrlBtn!: HTMLButtonElement;
    private modalCopyWebdavUserBtn!: HTMLButtonElement;
    private modalCopyWebdavPassBtn!: HTMLButtonElement;
    
    // 当前编辑的配置ID（null 表示添加模式）
    private currentEditingConfigId: string | null = null;

    // 事件处理器
    private readonly onWebdavEnabledChange = () => { this.handleWebDAVEnabledChange(); };
    private readonly onWebdavAutoSyncChange = () => { this.handleWebDAVAutoSyncChange(); };
    private readonly onBackupRangeChange = () => { this.handleBackupRangeChange(); };
    private readonly onInputChange = () => { this.handleInputChange(); };
    private readonly onTestClick = () => { this.handleTestWebDAV().catch(() => {}); };
    private readonly onDiagnoseClick = () => { this.handleDiagnoseWebDAV().catch(() => {}); };
    private readonly onAddConfigClick = () => { this.openConfigModal('add'); };
    private readonly onModalProviderChange = () => { this.handleModalProviderChange(); };
    private readonly onModalTogglePasswordClick = () => { this.handleModalTogglePasswordVisibility(); };
    private readonly onModalCopyFullUrlClick = () => { this.handleModalCopyFullUrl(); };
    private readonly onModalCopyUserClick = () => { this.handleModalCopyUser(); };
    private readonly onModalCopyPassClick = () => { this.handleModalCopyPass(); };
    private readonly onCloseModalClick = () => { this.closeConfigModal(); };
    private readonly onCancelModalClick = () => { this.closeConfigModal(); };
    private readonly onTestModalClick = () => { this.handleTestConfigModal(); };
    private readonly onSaveModalClick = () => { this.handleSaveConfigModal(); };

    constructor() {
        super({
            panelId: 'webdav-settings',
            panelName: 'WebDAV设置',
            autoSave: false,
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 全局设置元素
        this.webdavEnabled = document.getElementById('webdavEnabled') as HTMLInputElement;
        this.webdavAutoSync = document.getElementById('webdavAutoSync') as HTMLInputElement;
        this.webdavSyncInterval = document.getElementById('webdav-sync-interval') as HTMLInputElement;
        this.webdavRetentionDays = document.getElementById('webdav-retention-days') as HTMLInputElement;
        this.webdavWarningDays = document.getElementById('webdav-warning-days') as HTMLInputElement;
        
        // 数据范围选择
        this.webdavBackupCoreData = document.getElementById('webdavBackupCoreData') as HTMLInputElement;
        this.webdavBackupActorData = document.getElementById('webdavBackupActorData') as HTMLInputElement;
        this.webdavBackupNewWorksData = document.getElementById('webdavBackupNewWorksData') as HTMLInputElement;
        this.webdavBackupSystemConfig = document.getElementById('webdavBackupSystemConfig') as HTMLInputElement;
        this.webdavBackupLogsData = document.getElementById('webdavBackupLogsData') as HTMLInputElement;
        
        // 按钮
        this.testWebdavConnectionBtn = document.getElementById('testWebdavConnection') as HTMLButtonElement;
        this.diagnoseWebdavConnectionBtn = document.getElementById('diagnoseWebdavConnection') as HTMLButtonElement;
        
        // 配置管理
        this.addWebdavConfigBtn = document.getElementById('addWebdavConfig') as HTMLButtonElement;
        this.webdavConfigList = document.getElementById('webdavConfigList') as HTMLDivElement;
        
        // 弹窗元素
        this.webdavConfigModal = document.getElementById('webdavConfigModal') as HTMLDivElement;
        this.webdavConfigModalTitle = document.getElementById('webdavConfigModalTitle') as HTMLHeadingElement;
        this.closeWebdavConfigModalBtn = document.getElementById('closeWebdavConfigModal') as HTMLButtonElement;
        this.cancelWebdavConfigModalBtn = document.getElementById('cancelWebdavConfigModal') as HTMLButtonElement;
        this.testWebdavConfigModalBtn = document.getElementById('testWebdavConfigModal') as HTMLButtonElement;
        this.saveWebdavConfigModalBtn = document.getElementById('saveWebdavConfigModal') as HTMLButtonElement;
        this.modalConfigName = document.getElementById('modalConfigName') as HTMLInputElement;
        this.modalWebdavProvider = document.getElementById('modalWebdavProvider') as HTMLSelectElement;
        this.modalWebdavUrl = document.getElementById('modalWebdavUrl') as HTMLInputElement;
        this.modalWebdavFolder = document.getElementById('modalWebdavFolder') as HTMLInputElement;
        this.modalWebdavUser = document.getElementById('modalWebdavUser') as HTMLInputElement;
        this.modalWebdavPass = document.getElementById('modalWebdavPass') as HTMLInputElement;
        this.modalToggleWebdavPasswordVisibilityBtn = document.getElementById('modalToggleWebdavPasswordVisibility') as HTMLButtonElement;
        this.modalCopyWebdavFullUrlBtn = document.getElementById('modalCopyWebdavFullUrl') as HTMLButtonElement;
        this.modalCopyWebdavUserBtn = document.getElementById('modalCopyWebdavUser') as HTMLButtonElement;
        this.modalCopyWebdavPassBtn = document.getElementById('modalCopyWebdavPass') as HTMLButtonElement;

        if (!this.webdavEnabled || !this.testWebdavConnectionBtn || 
            !this.diagnoseWebdavConnectionBtn || !this.addWebdavConfigBtn || !this.webdavConfigList ||
            !this.webdavConfigModal || !this.modalConfigName || !this.modalWebdavProvider || 
            !this.modalWebdavUrl || !this.modalWebdavFolder || !this.modalWebdavUser || !this.modalWebdavPass) {
            throw new Error('WebDAV设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        this.webdavEnabled.addEventListener('change', this.onWebdavEnabledChange);
        this.webdavAutoSync.addEventListener('change', this.onWebdavAutoSyncChange);
        
        // 绑定输入框的自动保存
        this.webdavSyncInterval.addEventListener('change', this.onInputChange);
        this.webdavRetentionDays.addEventListener('change', this.onInputChange);
        this.webdavWarningDays.addEventListener('change', this.onInputChange);
        
        // 绑定数据范围复选框的自动保存
        this.webdavBackupCoreData.addEventListener('change', this.onBackupRangeChange);
        this.webdavBackupActorData.addEventListener('change', this.onBackupRangeChange);
        this.webdavBackupNewWorksData.addEventListener('change', this.onBackupRangeChange);
        this.webdavBackupSystemConfig.addEventListener('change', this.onBackupRangeChange);
        this.webdavBackupLogsData.addEventListener('change', this.onBackupRangeChange);
        
        this.testWebdavConnectionBtn.addEventListener('click', this.onTestClick);
        this.diagnoseWebdavConnectionBtn.addEventListener('click', this.onDiagnoseClick);
        this.addWebdavConfigBtn.addEventListener('click', this.onAddConfigClick);
        
        // 弹窗事件
        this.modalWebdavProvider.addEventListener('change', this.onModalProviderChange);
        this.modalToggleWebdavPasswordVisibilityBtn.addEventListener('click', this.onModalTogglePasswordClick);
        this.modalCopyWebdavFullUrlBtn.addEventListener('click', this.onModalCopyFullUrlClick);
        this.modalCopyWebdavUserBtn.addEventListener('click', this.onModalCopyUserClick);
        this.modalCopyWebdavPassBtn.addEventListener('click', this.onModalCopyPassClick);
        this.closeWebdavConfigModalBtn.addEventListener('click', this.onCloseModalClick);
        this.cancelWebdavConfigModalBtn.addEventListener('click', this.onCancelModalClick);
        this.testWebdavConfigModalBtn.addEventListener('click', this.onTestModalClick);
        this.saveWebdavConfigModalBtn.addEventListener('click', this.onSaveModalClick);
        
        // 点击遮罩层关闭弹窗
        this.webdavConfigModal.addEventListener('click', (e) => {
            if (e.target === this.webdavConfigModal) {
                this.closeConfigModal();
            }
        });
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.webdavEnabled?.removeEventListener('change', this.onWebdavEnabledChange);
        this.webdavAutoSync?.removeEventListener('change', this.onWebdavAutoSyncChange);
        
        this.webdavSyncInterval?.removeEventListener('change', this.onInputChange);
        this.webdavRetentionDays?.removeEventListener('change', this.onInputChange);
        this.webdavWarningDays?.removeEventListener('change', this.onInputChange);
        
        this.webdavBackupCoreData?.removeEventListener('change', this.onBackupRangeChange);
        this.webdavBackupActorData?.removeEventListener('change', this.onBackupRangeChange);
        this.webdavBackupNewWorksData?.removeEventListener('change', this.onBackupRangeChange);
        this.webdavBackupSystemConfig?.removeEventListener('change', this.onBackupRangeChange);
        this.webdavBackupLogsData?.removeEventListener('change', this.onBackupRangeChange);
        
        this.testWebdavConnectionBtn?.removeEventListener('click', this.onTestClick);
        this.diagnoseWebdavConnectionBtn?.removeEventListener('click', this.onDiagnoseClick);
        this.addWebdavConfigBtn?.removeEventListener('click', this.onAddConfigClick);
        
        this.modalWebdavProvider?.removeEventListener('change', this.onModalProviderChange);
        this.modalToggleWebdavPasswordVisibilityBtn?.removeEventListener('click', this.onModalTogglePasswordClick);
        this.modalCopyWebdavFullUrlBtn?.removeEventListener('click', this.onModalCopyFullUrlClick);
        this.modalCopyWebdavUserBtn?.removeEventListener('click', this.onModalCopyUserClick);
        this.modalCopyWebdavPassBtn?.removeEventListener('click', this.onModalCopyPassClick);
        this.closeWebdavConfigModalBtn?.removeEventListener('click', this.onCloseModalClick);
        this.cancelWebdavConfigModalBtn?.removeEventListener('click', this.onCancelModalClick);
        this.testWebdavConfigModalBtn?.removeEventListener('click', this.onTestModalClick);
        this.saveWebdavConfigModalBtn?.removeEventListener('click', this.onSaveModalClick);
    }


    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const webdav = settings?.webdav || {};

        console.log('[Settings] doLoadSettings 开始，STATE.settings:', settings);
        console.log('[Settings] webdav 配置:', webdav);
        console.log('[Settings] configs:', webdav.configs);

        // 兼容旧版本：如果有旧配置但没有 configs，自动迁移
        if (webdav.url && webdav.username && (!webdav.configs || webdav.configs.length === 0)) {
            await this.migrateOldConfig();
            return;
        }

        // 渲染配置列表
        this.renderConfigList();

        console.log('[Settings] 准备设置 UI，webdav.enabled:', webdav.enabled);
        console.log('[Settings] this.webdavEnabled 元素:', this.webdavEnabled);
        
        this.webdavEnabled.checked = webdav.enabled || false;
        console.log('[Settings] 设置后 this.webdavEnabled.checked:', this.webdavEnabled.checked);
        
        this.webdavAutoSync.checked = webdav.autoSync || false;
        console.log('[Settings] 设置后 this.webdavAutoSync.checked:', this.webdavAutoSync.checked);
        
        this.webdavSyncInterval.value = String(webdav.syncInterval || 30);
        this.webdavRetentionDays.value = String(webdav.retentionDays ?? 7);
        this.webdavWarningDays.value = String(webdav.warningDays ?? 7);
        
        // 加载数据范围设置
        const backupRange = webdav.backupRange || {
            coreData: true,
            actorData: true,
            newWorksData: false,
            systemConfig: true,
            logsData: false
        };
        this.webdavBackupCoreData.checked = backupRange.coreData !== false;
        this.webdavBackupActorData.checked = backupRange.actorData !== false;
        this.webdavBackupNewWorksData.checked = backupRange.newWorksData || false;
        this.webdavBackupSystemConfig.checked = backupRange.systemConfig !== false;
        this.webdavBackupLogsData.checked = backupRange.logsData || false;

        console.log('[Settings] UI 更新完成，enabled:', this.webdavEnabled.checked);

        // 更新UI状态
        this.updateWebDAVControlsState();

        // 显示下次同步时间
        const nextSyncEl = document.getElementById('webdav-next-sync-time');
        if (nextSyncEl) {
            if (webdav.enabled && webdav.autoSync) {
                chrome.runtime.sendMessage({ type: 'get-next-sync-time' }, (resp) => {
                    if (resp?.scheduledTime) {
                        const d = new Date(resp.scheduledTime);
                        nextSyncEl.textContent = `下次：${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
                    } else {
                        nextSyncEl.textContent = '';
                    }
                });
            } else {
                nextSyncEl.textContent = '（未启用）';
            }
        }
    }

    /**
     * 保存全局设置（不包括配置的增删改）
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const settings = STATE.settings;
            
            const newSettings: ExtensionSettings = {
                ...settings,
                webdav: {
                    ...settings.webdav,
                    enabled: this.webdavEnabled.checked,
                    autoSync: this.webdavAutoSync.checked,
                    syncInterval: parseInt(this.webdavSyncInterval.value, 10),
                    retentionDays: parseInt(this.webdavRetentionDays.value, 10),
                    warningDays: parseInt(this.webdavWarningDays.value, 10),
                    backupRange: {
                        coreData: this.webdavBackupCoreData.checked,
                        actorData: this.webdavBackupActorData.checked,
                        newWorksData: this.webdavBackupNewWorksData.checked,
                        systemConfig: this.webdavBackupSystemConfig.checked,
                        logsData: this.webdavBackupLogsData.checked
                    }
                }
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 设置定时器
            chrome.runtime.sendMessage({ type: 'setup-alarms' });

            return {
                success: true,
                savedSettings: { webdav: newSettings.webdav }
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

        if (this.webdavEnabled.checked) {
            const settings = STATE.settings;
            const activeConfigId = settings?.webdav?.activeConfigId;
            
            if (!activeConfigId) {
                errors.push('请先添加并选择一个 WebDAV 配置');
            }

            const syncInterval = parseInt(this.webdavSyncInterval.value, 10);
            if (isNaN(syncInterval) || syncInterval < 5 || syncInterval > 1440) {
                errors.push('同步间隔必须在5-1440分钟之间');
            }

            const days = parseInt(this.webdavRetentionDays.value, 10);
            if (isNaN(days) || days < 0 || days > 9999) {
                errors.push('保留备份数量必须在0-9999之间');
            }

            const warnDays = parseInt(this.webdavWarningDays.value, 10);
            if (isNaN(warnDays) || warnDays < 0 || warnDays > 3650) {
                errors.push('未备份预警阈值必须在0-3650之间');
            }

            const hasBackupContent = this.webdavBackupCoreData.checked ||
                                    this.webdavBackupActorData.checked ||
                                    this.webdavBackupNewWorksData.checked ||
                                    this.webdavBackupSystemConfig.checked ||
                                    this.webdavBackupLogsData.checked;
            
            if (!hasBackupContent) {
                errors.push('请至少选择一项要备份的数据');
            }
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
        return {
            webdav: {
                ...STATE.settings.webdav,
                enabled: this.webdavEnabled.checked,
                autoSync: this.webdavAutoSync.checked,
                syncInterval: parseInt(this.webdavSyncInterval.value, 10),
                retentionDays: parseInt(this.webdavRetentionDays.value, 10),
                warningDays: parseInt(this.webdavWarningDays.value, 10),
                backupRange: {
                    coreData: this.webdavBackupCoreData.checked,
                    actorData: this.webdavBackupActorData.checked,
                    newWorksData: this.webdavBackupNewWorksData.checked,
                    systemConfig: this.webdavBackupSystemConfig.checked,
                    logsData: this.webdavBackupLogsData.checked
                }
            }
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const webdav = settings.webdav;
        if (webdav) {
            if (webdav.enabled !== undefined) {
                this.webdavEnabled.checked = webdav.enabled;
            }
            if (webdav.autoSync !== undefined) {
                this.webdavAutoSync.checked = webdav.autoSync;
            }
            if (webdav.syncInterval !== undefined) {
                this.webdavSyncInterval.value = String(webdav.syncInterval);
            }
            if (webdav.retentionDays !== undefined) {
                this.webdavRetentionDays.value = String(webdav.retentionDays);
            }
            if (webdav.warningDays !== undefined) {
                this.webdavWarningDays.value = String(webdav.warningDays);
            }
            if (webdav.backupRange !== undefined) {
                const range = webdav.backupRange;
                this.webdavBackupCoreData.checked = range.coreData !== false;
                this.webdavBackupActorData.checked = range.actorData !== false;
                this.webdavBackupNewWorksData.checked = range.newWorksData || false;
                this.webdavBackupSystemConfig.checked = range.systemConfig !== false;
                this.webdavBackupLogsData.checked = range.logsData || false;
            }

            this.updateWebDAVControlsState();

            // 显示下次同步时间
            const nextSyncEl = document.getElementById('webdav-next-sync-time');
            if (nextSyncEl) {
                if (webdav.enabled && webdav.autoSync) {
                    chrome.runtime.sendMessage({ type: 'get-next-sync-time' }, (resp) => {
                        if (resp?.scheduledTime) {
                            const d = new Date(resp.scheduledTime);
                            nextSyncEl.textContent = `下次：${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
                        } else {
                            nextSyncEl.textContent = '';
                        }
                    });
                } else {
                    nextSyncEl.textContent = '（未启用）';
                }
            }
        }
    }


    /**
     * 处理WebDAV启用状态变化
     */
    private handleWebDAVEnabledChange(): void {
        this.updateWebDAVControlsState();
        this.emit('change');
        
        // 无论启用还是禁用都自动保存
        this.saveSettings().catch(() => {});
    }

    /**
     * 处理自动同步状态变化
     */
    private handleWebDAVAutoSyncChange(): void {
        this.emit('change');
        this.saveSettings().catch(() => {});
    }

    /**
     * 处理备份数据范围变化
     */
    private handleBackupRangeChange(): void {
        this.emit('change');
        this.saveSettings().catch(() => {});
    }

    /**
     * 处理输入框变化
     */
    private handleInputChange(): void {
        this.emit('change');
        this.saveSettings().catch(() => {});
    }

    /**
     * 更新WebDAV控件状态
     */
    private updateWebDAVControlsState(): void {
        const sections = [
            document.getElementById('webdavConfigSection'),
            document.getElementById('webdavSyncSection'),
            document.getElementById('webdavBackupSection')
        ];
        
        sections.forEach(section => {
            if (section) {
                if (this.webdavEnabled.checked) {
                    section.classList.add('enabled');
                } else {
                    section.classList.remove('enabled');
                }
            }
        });
    }

    /**
     * 处理测试WebDAV连接
     */
    private async handleTestWebDAV(): Promise<void> {
        logAsync('INFO', '用户点击了"测试 WebDAV 连接"按钮');
        
        try {
            const settings = STATE.settings;
            const activeConfigId = settings?.webdav?.activeConfigId;
            
            if (!activeConfigId) {
                showMessage('请先选择一个配置', 'warn');
                return;
            }

            // 获取当前配置名称
            const configs = settings?.webdav?.configs || [];
            const activeConfig = configs.find(c => c.id === activeConfigId);
            const configName = activeConfig?.name || '未知配置';

            showMessage(`正在测试配置"${configName}"...`, 'info');
            this.testWebdavConnectionBtn.textContent = '测试中...';
            this.testWebdavConnectionBtn.disabled = true;

            chrome.runtime.sendMessage({ type: 'webdav-test' }, response => {
                if (response && response.success) {
                    showMessage(`🎉 配置"${configName}"测试成功！服务器响应正常`, 'success');
                    logAsync('INFO', 'WebDAV连接测试成功', { configName });
                } else {
                    const errorMsg = response?.error || '未知错误';
                    const userFriendlyMsg = this.getErrorMessage(errorMsg);
                    showMessage(`配置"${configName}"测试失败：${userFriendlyMsg}`, 'error');
                    logAsync('ERROR', `WebDAV连接测试失败：${errorMsg}`, { configName });
                }

                this.testWebdavConnectionBtn.textContent = '测试连接';
                this.testWebdavConnectionBtn.disabled = false;
            });
        } catch (error) {
            showMessage('❌ 无法进行连接测试', 'error');
            logAsync('ERROR', `WebDAV连接测试失败：${error instanceof Error ? error.message : '未知错误'}`);
            this.testWebdavConnectionBtn.textContent = '测试连接';
            this.testWebdavConnectionBtn.disabled = false;
        }
    }

    /**
     * 处理诊断WebDAV连接
     */
    private async handleDiagnoseWebDAV(): Promise<void> {
        logAsync('INFO', '用户点击了"诊断 WebDAV 连接"按钮');
        
        try {
            const settings = STATE.settings;
            const activeConfigId = settings?.webdav?.activeConfigId;
            
            if (!activeConfigId) {
                showMessage('请先选择一个配置', 'warn');
                return;
            }

            // 获取当前配置名称
            const configs = settings?.webdav?.configs || [];
            const activeConfig = configs.find(c => c.id === activeConfigId);
            const configName = activeConfig?.name || '未知配置';

            showMessage(`正在诊断配置"${configName}"...`, 'info');
            this.diagnoseWebdavConnectionBtn.textContent = '诊断中...';
            this.diagnoseWebdavConnectionBtn.disabled = true;

            chrome.runtime.sendMessage({ type: 'webdav-diagnose' }, response => {
                if (response && response.success) {
                    // 使用 toast 显示诊断结果
                    this.showDiagnosticResultAsToast(response.diagnostic, configName);

                    if (response.diagnostic.success) {
                        logAsync('INFO', 'WebDAV诊断成功', { configName, diagnostic: response.diagnostic });
                    } else {
                        logAsync('WARN', 'WebDAV诊断发现问题', { configName, diagnostic: response.diagnostic });
                    }
                } else {
                    const errorMsg = response?.error || '诊断失败';
                    showMessage(`配置"${configName}"诊断失败：${errorMsg}`, 'error');
                    logAsync('ERROR', `WebDAV诊断失败：${errorMsg}`, { configName });
                }

                this.diagnoseWebdavConnectionBtn.textContent = '诊断连接';
                this.diagnoseWebdavConnectionBtn.disabled = false;
            });
        } catch (error) {
            showMessage('❌ 无法进行诊断', 'error');
            logAsync('ERROR', `WebDAV诊断失败：${error instanceof Error ? error.message : '未知错误'}`);
            this.diagnoseWebdavConnectionBtn.textContent = '诊断连接';
            this.diagnoseWebdavConnectionBtn.disabled = false;
        }
    }

    /**
     * 获取友好的错误信息
     */
    private getErrorMessage(errorMsg: string): string {
        if (errorMsg.includes('401')) {
            return '用户名或密码错误';
        } else if (errorMsg.includes('404')) {
            return '服务器地址不存在';
        } else if (errorMsg.includes('403')) {
            return '没有访问权限';
        } else if (errorMsg.includes('timeout') || errorMsg.includes('网络')) {
            return '网络超时';
        } else if (errorMsg.includes('not fully configured')) {
            return '配置信息不完整';
        } else {
            return errorMsg;
        }
    }

    /**
     * 使用 Toast 显示诊断结果
     */
    private showDiagnosticResultAsToast(diagnostic: any, configName: string): void {
        const lines: string[] = [];
        
        // 标题
        lines.push(`🔍 配置 "${configName}" 诊断完成`);
        lines.push('');

        // 服务器信息
        if (diagnostic.serverType) {
            lines.push(`📡 服务器类型: ${diagnostic.serverType}`);
        }

        if (diagnostic.supportedMethods && diagnostic.supportedMethods.length > 0) {
            const methods = diagnostic.supportedMethods.join(', ');
            lines.push(`🛠️ 支持的方法:`);
            lines.push(`   ${methods}`);
        }

        if (diagnostic.responseFormat) {
            lines.push(`📄 响应格式:`);
            lines.push(`   ${diagnostic.responseFormat}`);
        }

        // 问题
        if (diagnostic.issues && diagnostic.issues.length > 0) {
            lines.push('');
            lines.push('⚠️ 发现的问题:');
            diagnostic.issues.forEach((issue: string, index: number) => {
                lines.push(`   ${index + 1}. ${issue}`);
            });
        }

        // 建议
        if (diagnostic.recommendations && diagnostic.recommendations.length > 0) {
            lines.push('');
            lines.push('💡 建议:');
            diagnostic.recommendations.forEach((rec: string, index: number) => {
                lines.push(`   ${index + 1}. ${rec}`);
            });
        }

        // 显示结果
        const messageType = diagnostic.success ? 'success' : 'warn';
        const fullMessage = lines.join('\n');
        
        // 使用较长的显示时间（10秒）
        showMessage(fullMessage, messageType, 10000);
    }


    /**
     * 渲染配置列表
     */
    private renderConfigList(): void {
        const settings = STATE.settings;
        const configs = settings?.webdav?.configs || [];
        const activeConfigId = settings?.webdav?.activeConfigId;

        if (configs.length === 0) {
            this.webdavConfigList.innerHTML = `
                <div class="webdav-config-empty">
                    <i class="fas fa-cloud"></i>
                    <p>暂无保存的配置，点击"添加配置"创建新配置</p>
                </div>
            `;
            return;
        }

        this.webdavConfigList.innerHTML = configs.map(config => {
            const isActive = config.id === activeConfigId;
            const providerName = config.provider === 'jianguoyun' ? '坚果云' : 
                                config.provider === 'teracloud' ? 'TeraCloud' : '自定义';
            
            return `
                <div class="webdav-config-item ${isActive ? 'active' : ''}" data-config-id="${config.id}">
                    <div class="config-radio">
                        <input type="radio" name="webdav-config" value="${config.id}" ${isActive ? 'checked' : ''}>
                    </div>
                    <div class="config-info">
                        <div class="config-name">${this.escapeHtml(config.name)}</div>
                        <div class="config-details">
                            <span class="config-detail-item">
                                <i class="fas fa-server"></i>
                                ${providerName}
                            </span>
                            <span class="config-detail-item">
                                <i class="fas fa-user"></i>
                                ${this.escapeHtml(config.username)}
                            </span>
                            ${config.lastSync ? `
                                <span class="config-detail-item">
                                    <i class="fas fa-clock"></i>
                                    ${new Date(config.lastSync).toLocaleString()}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="config-actions">
                        <button type="button" class="config-action-btn edit" data-action="edit" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="config-action-btn delete" data-action="delete" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定事件
        this.webdavConfigList.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.handleSwitchConfig(target.value);
            });
        });

        this.webdavConfigList.querySelectorAll('.config-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const action = target.dataset.action;
                const configItem = target.closest('.webdav-config-item') as HTMLElement;
                const configId = configItem?.dataset.configId;
                
                if (action === 'edit' && configId) {
                    this.openConfigModal('edit', configId);
                } else if (action === 'delete' && configId) {
                    this.handleDeleteConfig(configId);
                }
            });
        });
    }

    /**
     * 打开配置弹窗
     */
    private openConfigModal(mode: 'add' | 'edit', configId?: string): void {
        this.currentEditingConfigId = mode === 'edit' && configId ? configId : null;
        
        // 设置标题
        this.webdavConfigModalTitle.textContent = mode === 'add' ? '添加配置' : '编辑配置';
        
        // 清空或填充表单
        if (mode === 'add') {
            this.modalConfigName.value = '';
            this.modalWebdavUrl.value = '';
            this.modalWebdavFolder.value = '';
            this.modalWebdavUser.value = '';
            this.modalWebdavPass.value = '';
            this.modalWebdavProvider.value = 'custom';
        } else if (mode === 'edit' && configId) {
            const settings = STATE.settings;
            const configs = settings?.webdav?.configs || [];
            const config = configs.find(c => c.id === configId);
            
            if (config) {
                this.modalConfigName.value = config.name;
                const { baseUrl, folder } = this.splitUrl(config.url);
                this.modalWebdavUrl.value = baseUrl;
                this.modalWebdavFolder.value = folder;
                this.modalWebdavUser.value = config.username;
                this.modalWebdavPass.value = config.password;
                this.modalWebdavProvider.value = config.provider || 'custom';
            }
        }
        
        // 显示弹窗
        this.webdavConfigModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭配置弹窗
     */
    private closeConfigModal(): void {
        this.webdavConfigModal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentEditingConfigId = null;
    }

    /**
     * 测试配置弹窗中的连接
     */
    private handleTestConfigModal(): void {
        const name = this.modalConfigName.value.trim();
        const fullUrl = this.combineUrl(this.modalWebdavUrl.value.trim(), this.modalWebdavFolder.value.trim());
        const username = this.modalWebdavUser.value.trim();
        const password = this.modalWebdavPass.value;

        // 验证
        if (!fullUrl) {
            showMessage('请输入 WebDAV 地址', 'warn');
            return;
        }
        if (!username) {
            showMessage('请输入用户名', 'warn');
            return;
        }
        if (!password) {
            showMessage('请输入密码', 'warn');
            return;
        }

        const configName = name || '当前配置';
        showMessage(`正在测试配置"${configName}"...`, 'info');
        this.testWebdavConfigModalBtn.textContent = '测试中...';
        this.testWebdavConfigModalBtn.disabled = true;

        // 使用临时配置进行测试
        chrome.runtime.sendMessage({ 
            type: 'webdav-test-temp',
            config: {
                url: fullUrl,
                username,
                password
            }
        }, response => {
            if (response && response.success) {
                showMessage(`🎉 配置"${configName}"测试成功！服务器响应正常`, 'success');
                logAsync('INFO', 'WebDAV配置测试成功', { configName });
            } else {
                const errorMsg = response?.error || '未知错误';
                const userFriendlyMsg = this.getErrorMessage(errorMsg);
                showMessage(`配置"${configName}"测试失败：${userFriendlyMsg}`, 'error');
                logAsync('ERROR', `WebDAV配置测试失败：${errorMsg}`, { configName });
            }

            this.testWebdavConfigModalBtn.innerHTML = '<i class="fas fa-plug"></i> 测试连接';
            this.testWebdavConfigModalBtn.disabled = false;
        });
    }

    /**
     * 保存配置弹窗
     */
    private handleSaveConfigModal(): void {
        const name = this.modalConfigName.value.trim();
        const fullUrl = this.combineUrl(this.modalWebdavUrl.value.trim(), this.modalWebdavFolder.value.trim());
        const username = this.modalWebdavUser.value.trim();
        const password = this.modalWebdavPass.value;
        const provider = this.modalWebdavProvider.value as 'jianguoyun' | 'teracloud' | 'custom';

        // 验证
        if (!name) {
            showMessage('请输入配置名称', 'warn');
            return;
        }
        if (!fullUrl) {
            showMessage('请输入 WebDAV 地址', 'warn');
            return;
        }
        if (!username) {
            showMessage('请输入用户名', 'warn');
            return;
        }
        if (!password) {
            showMessage('请输入密码', 'warn');
            return;
        }

        const settings = STATE.settings;
        const configs = settings?.webdav?.configs || [];

        if (this.currentEditingConfigId) {
            // 编辑模式
            const configIndex = configs.findIndex(c => c.id === this.currentEditingConfigId);
            if (configIndex !== -1) {
                configs[configIndex] = {
                    ...configs[configIndex],
                    name,
                    url: fullUrl,
                    username,
                    password,
                    provider,
                    updatedAt: Date.now()
                };
            }
        } else {
            // 添加模式
            const newConfig: WebDAVConfig = {
                id: `config_${Date.now()}`,
                name,
                url: fullUrl,
                username,
                password,
                provider,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                lastSync: null
            };
            configs.push(newConfig);
        }

        const newSettings: ExtensionSettings = {
            ...settings,
            webdav: {
                ...settings.webdav,
                configs,
                // 如果是添加新配置，自动激活它
                activeConfigId: this.currentEditingConfigId || `config_${Date.now()}`,
                // 更新主配置
                url: fullUrl,
                username,
                password
            }
        };

        saveSettings(newSettings).then(() => {
            STATE.settings = newSettings;
            this.renderConfigList();
            this.closeConfigModal();
            showMessage(this.currentEditingConfigId ? '✓ 配置已更新' : '✓ 配置已添加', 'success');
            logAsync('INFO', this.currentEditingConfigId ? '用户更新了 WebDAV 配置' : '用户添加了 WebDAV 配置', { name });
        }).catch(() => {
            showMessage('保存配置失败', 'error');
        });
    }

    /**
     * 切换配置
     */
    private handleSwitchConfig(configId: string): void {
        const settings = STATE.settings;
        const configs = settings?.webdav?.configs || [];
        const config = configs.find(c => c.id === configId);

        if (!config) {
            showMessage('配置不存在', 'error');
            return;
        }

        const newSettings: ExtensionSettings = {
            ...settings,
            webdav: {
                ...settings.webdav,
                activeConfigId: configId,
                url: config.url,
                username: config.username,
                password: config.password,
                lastSync: config.lastSync || settings.webdav?.lastSync || null
            }
        };

        saveSettings(newSettings).then(() => {
            STATE.settings = newSettings;
            this.renderConfigList();
            showMessage('✓ 已切换到配置：' + config.name, 'success');
            logAsync('INFO', '用户切换了 WebDAV 配置', { name: config.name });
        }).catch(() => {
            showMessage('切换配置失败', 'error');
        });
    }

    /**
     * 删除配置
     */
    private handleDeleteConfig(configId: string): void {
        const settings = STATE.settings;
        const configs = settings?.webdav?.configs || [];
        const config = configs.find(c => c.id === configId);

        if (!config) {
            showMessage('配置不存在', 'error');
            return;
        }

        if (!confirm(`确定要删除配置"${config.name}"吗？`)) {
            return;
        }

        const newConfigs = configs.filter(c => c.id !== configId);
        let newActiveConfigId = settings.webdav?.activeConfigId;

        // 如果删除的是当前激活的配置，切换到第一个配置
        if (configId === newActiveConfigId) {
            newActiveConfigId = newConfigs.length > 0 ? newConfigs[0].id : undefined;
        }

        const newSettings: ExtensionSettings = {
            ...settings,
            webdav: {
                ...settings.webdav,
                configs: newConfigs,
                activeConfigId: newActiveConfigId,
                url: newConfigs.length > 0 && newActiveConfigId ? newConfigs.find(c => c.id === newActiveConfigId)?.url || '' : '',
                username: newConfigs.length > 0 && newActiveConfigId ? newConfigs.find(c => c.id === newActiveConfigId)?.username || '' : '',
                password: newConfigs.length > 0 && newActiveConfigId ? newConfigs.find(c => c.id === newActiveConfigId)?.password || '' : ''
            }
        };

        saveSettings(newSettings).then(() => {
            STATE.settings = newSettings;
            this.renderConfigList();
            showMessage('✓ 配置已删除', 'success');
            logAsync('INFO', '用户删除了 WebDAV 配置', { name: config.name });
        }).catch(() => {
            showMessage('删除配置失败', 'error');
        });
    }

    /**
     * 迁移旧版本配置
     */
    private async migrateOldConfig(): Promise<void> {
        const settings = STATE.settings;
        const webdav = settings?.webdav;

        if (!webdav || !webdav.url || !webdav.username) {
            return;
        }

        logAsync('INFO', '检测到旧版本 WebDAV 配置，开始迁移');

        const oldConfig: WebDAVConfig = {
            id: `config_${Date.now()}`,
            name: '默认配置',
            url: webdav.url,
            username: webdav.username,
            password: webdav.password || '',
            provider: this.detectProviderType(webdav.url),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastSync: webdav.lastSync || null
        };

        const newSettings: ExtensionSettings = {
            ...settings,
            webdav: {
                ...webdav,
                configs: [oldConfig],
                activeConfigId: oldConfig.id
            }
        };

        try {
            await saveSettings(newSettings);
            STATE.settings = newSettings;
            this.renderConfigList();
            logAsync('INFO', '旧版本 WebDAV 配置迁移成功');
            showMessage('✓ 已自动迁移旧配置', 'success');
            
            await this.loadSettings();
        } catch (error) {
            logAsync('ERROR', '旧版本 WebDAV 配置迁移失败', { error });
            showMessage('配置迁移失败', 'error');
        }
    }

    /**
     * 根据 URL 检测厂商类型
     */
    private detectProviderType(url: string): 'jianguoyun' | 'teracloud' | 'custom' {
        if (url.includes('jianguoyun.com')) {
            return 'jianguoyun';
        } else if (url.includes('teracloud.jp')) {
            return 'teracloud';
        }
        return 'custom';
    }


    /**
     * 处理弹窗内厂商选择变化
     */
    private handleModalProviderChange(): void {
        const provider = this.modalWebdavProvider.value;
        
        // 只在新增模式下自动填充配置名称
        const isAddMode = this.currentEditingConfigId === null;
        
        if (isAddMode) {
            const currentName = this.modalConfigName.value.trim();
            // 如果当前名称是空的，或者是其他厂商的默认名称，则自动替换
            const isDefaultName = !currentName || 
                                 currentName === '坚果云' || 
                                 currentName === 'TeraCloud';
            
            switch (provider) {
                case 'jianguoyun':
                    this.modalWebdavUrl.value = 'https://dav.jianguoyun.com/dav/';
                    if (isDefaultName) {
                        this.modalConfigName.value = '坚果云';
                    }
                    showMessage('已自动填充坚果云服务器地址', 'info');
                    break;
                case 'teracloud':
                    this.modalWebdavUrl.value = 'https://ogi.teracloud.jp/dav/';
                    if (isDefaultName) {
                        this.modalConfigName.value = 'TeraCloud';
                    }
                    showMessage('已自动填充 TeraCloud 服务器地址', 'info');
                    break;
                case 'custom':
                    // 自定义不自动填充配置名称，但如果是默认名称则清空
                    if (currentName === '坚果云' || currentName === 'TeraCloud') {
                        this.modalConfigName.value = '';
                    }
                    break;
            }
        } else {
            // 编辑模式只更新 URL
            switch (provider) {
                case 'jianguoyun':
                    this.modalWebdavUrl.value = 'https://dav.jianguoyun.com/dav/';
                    showMessage('已自动填充坚果云服务器地址', 'info');
                    break;
                case 'teracloud':
                    this.modalWebdavUrl.value = 'https://ogi.teracloud.jp/dav/';
                    showMessage('已自动填充 TeraCloud 服务器地址', 'info');
                    break;
                case 'custom':
                    break;
            }
        }
    }

    /**
     * 处理弹窗内密码可见性切换
     */
    private handleModalTogglePasswordVisibility(): void {
        const isPassword = this.modalWebdavPass.type === 'password';
        this.modalWebdavPass.type = isPassword ? 'text' : 'password';

        const icon = this.modalToggleWebdavPasswordVisibilityBtn.querySelector('i');
        if (icon) {
            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }

        this.modalToggleWebdavPasswordVisibilityBtn.title = isPassword ? '隐藏密码' : '显示密码';
    }

    /**
     * 复制弹窗内的完整 WebDAV 地址
     */
    private handleModalCopyFullUrl(): void {
        const fullUrl = this.combineUrl(this.modalWebdavUrl.value.trim(), this.modalWebdavFolder.value.trim());
        if (!fullUrl) {
            showMessage('地址为空，无法复制', 'warn');
            return;
        }

        navigator.clipboard.writeText(fullUrl).then(() => {
            showMessage('✓ 已复制完整地址', 'success');
        }).catch(() => {
            showMessage('复制失败，请手动复制', 'error');
        });
    }

    /**
     * 复制弹窗内的用户名
     */
    private handleModalCopyUser(): void {
        const username = this.modalWebdavUser.value.trim();
        if (!username) {
            showMessage('用户名为空，无法复制', 'warn');
            return;
        }

        navigator.clipboard.writeText(username).then(() => {
            showMessage('✓ 已复制用户名', 'success');
        }).catch(() => {
            showMessage('复制失败，请手动复制', 'error');
        });
    }

    /**
     * 复制弹窗内的密码
     */
    private handleModalCopyPass(): void {
        const password = this.modalWebdavPass.value;
        if (!password) {
            showMessage('密码为空，无法复制', 'warn');
            return;
        }

        navigator.clipboard.writeText(password).then(() => {
            showMessage('✓ 已复制密码', 'success');
        }).catch(() => {
            showMessage('复制失败，请手动复制', 'error');
        });
    }

    /**
     * 拆分完整 URL 为基础地址和文件夹
     */
    private splitUrl(fullUrl: string): { baseUrl: string; folder: string } {
        if (!fullUrl) {
            return { baseUrl: '', folder: '' };
        }

        const knownBases = [
            'https://dav.jianguoyun.com/dav/',
            'https://ogi.teracloud.jp/dav/'
        ];

        for (const base of knownBases) {
            if (fullUrl.startsWith(base)) {
                const folder = fullUrl.substring(base.length).replace(/\/$/, '');
                return { baseUrl: base, folder };
            }
        }

        if (fullUrl.endsWith('/dav/')) {
            return { baseUrl: fullUrl, folder: '' };
        }

        const davIndex = fullUrl.lastIndexOf('/dav/');
        if (davIndex !== -1) {
            const baseUrl = fullUrl.substring(0, davIndex + 5);
            const folder = fullUrl.substring(davIndex + 5).replace(/\/$/, '');
            return { baseUrl, folder };
        }

        const lastSlashIndex = fullUrl.lastIndexOf('/');
        if (lastSlashIndex > 8) {
            const possibleBase = fullUrl.substring(0, lastSlashIndex + 1);
            const possibleFolder = fullUrl.substring(lastSlashIndex + 1);
            
            if (possibleFolder && !possibleFolder.includes('.')) {
                return { baseUrl: possibleBase, folder: possibleFolder };
            }
        }

        return { baseUrl: fullUrl, folder: '' };
    }

    /**
     * 合并基础地址和文件夹为完整 URL
     */
    private combineUrl(baseUrl: string, folder: string): string {
        if (!baseUrl) {
            return '';
        }

        if (!folder) {
            return baseUrl;
        }

        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
        
        return normalizedBase + normalizedFolder;
    }

    /**
     * HTML 转义
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * 日志设置面板
 * 日志记录配置、日志级别设置、日志查看和管理
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import { onSettingsChanged, log } from '../../../../utils/logController';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

/**
 * 日志设置面板类
 */
export class LoggingSettings extends BaseSettingsPanel {
    // 日志配置元素 - 使用HTML中实际存在的元素ID
    private maxLogEntries!: HTMLInputElement;
    private verboseMode!: HTMLInputElement;
    private showPrivacyLogs!: HTMLInputElement;
    private showStorageLogs!: HTMLInputElement;

    constructor() {
        super({
            panelId: 'log-settings',
            panelName: '日志设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 使用HTML中实际存在的元素ID
        this.maxLogEntries = document.getElementById('maxLogEntries') as HTMLInputElement;
        this.verboseMode = document.getElementById('verboseMode') as HTMLInputElement;
        this.showPrivacyLogs = document.getElementById('showPrivacyLogs') as HTMLInputElement;
        this.showStorageLogs = document.getElementById('showStorageLogs') as HTMLInputElement;

        // 验证元素是否存在
        if (!this.maxLogEntries) {
            console.error('[LoggingSettings] 找不到maxLogEntries元素');
            return;
        }
        if (!this.verboseMode) {
            console.error('[LoggingSettings] 找不到verboseMode元素');
            return;
        }
        if (!this.showPrivacyLogs) {
            console.error('[LoggingSettings] 找不到showPrivacyLogs元素');
            return;
        }
        if (!this.showStorageLogs) {
            console.error('[LoggingSettings] 找不到showStorageLogs元素');
            return;
        }

        log.verbose('[LoggingSettings] DOM元素初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 日志配置事件
        this.maxLogEntries?.addEventListener('change', this.handleSettingChange.bind(this));
        this.verboseMode?.addEventListener('change', this.handleVerboseModeToggle.bind(this));
        this.showPrivacyLogs?.addEventListener('change', this.handleSettingChange.bind(this));
        this.showStorageLogs?.addEventListener('change', this.handleSettingChange.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        // 由于使用了bind，需要保存引用才能正确解绑
        // 为简化起见，暂时省略
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const logging = settings?.logging || {};

        // 日志配置设置
        this.maxLogEntries.value = String(logging.maxEntries || 1000);
        this.verboseMode.checked = logging.verboseMode || false;
        this.showPrivacyLogs.checked = logging.showPrivacyLogs || false;
        this.showStorageLogs.checked = logging.showStorageLogs || false;
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                logging: {
                    ...STATE.settings?.logging,
                    maxEntries: parseInt(this.maxLogEntries.value, 10),
                    verboseMode: this.verboseMode.checked,
                    showPrivacyLogs: this.showPrivacyLogs.checked,
                    showStorageLogs: this.showStorageLogs.checked
                }
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 通知日志控制器设置已更改
            onSettingsChanged(newSettings);

            return {
                success: true,
                savedSettings: { logging: newSettings.logging }
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

        // 验证最大日志条目数
        const maxEntries = parseInt(this.maxLogEntries.value, 10);
        if (isNaN(maxEntries) || maxEntries < 100 || maxEntries > 10000) {
            errors.push('最大日志条目数必须在100-10000之间');
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
            logging: {
                maxEntries: parseInt(this.maxLogEntries.value, 10),
                verboseMode: this.verboseMode.checked,
                showPrivacyLogs: this.showPrivacyLogs.checked,
                showStorageLogs: this.showStorageLogs.checked
            }
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const logging = settings.logging;
        if (logging) {
            if (logging.maxEntries !== undefined) {
                this.maxLogEntries.value = String(logging.maxEntries);
            }
            if (logging.verboseMode !== undefined) {
                this.verboseMode.checked = logging.verboseMode;
            }
            if (logging.showPrivacyLogs !== undefined) {
                this.showPrivacyLogs.checked = logging.showPrivacyLogs;
            }
            if (logging.showStorageLogs !== undefined) {
                this.showStorageLogs.checked = logging.showStorageLogs;
            }
        }
    }

    /**
     * 处理详细模式开关
     */
    private handleVerboseModeToggle(): void {
        if (this.verboseMode.checked) {
            showMessage('详细日志模式已启用，将记录更多调试信息', 'info');
        } else {
            showMessage('详细日志模式已禁用', 'info');
        }
        this.emit('change');
        this.scheduleAutoSave();
    }

    /**
     * 处理设置变化
     */
    private handleSettingChange(): void {
        this.emit('change');
        this.scheduleAutoSave();
    }

}

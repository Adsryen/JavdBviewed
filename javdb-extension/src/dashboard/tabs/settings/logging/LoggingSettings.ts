/**
 * 日志设置面板
 * 日志记录配置、日志级别设置、日志查看和管理
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
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
    private retentionDays!: HTMLInputElement; // 可选：日志按天数保留
    // 统一控制台代理 - 控件
    private consoleLevel!: HTMLSelectElement;
    private consoleShowTimestamp!: HTMLInputElement;
    private consoleShowMilliseconds!: HTMLInputElement;
    private consoleShowSource!: HTMLInputElement;
    private consoleColor!: HTMLInputElement;
    private consoleTimeZone!: HTMLInputElement;
    private consoleCategoryCore!: HTMLInputElement;
    private consoleCategoryOrchestrator!: HTMLInputElement;
    private consoleCategoryDrive115!: HTMLInputElement;
    private consoleCategoryPrivacy!: HTMLInputElement;
    private consoleCategoryMagnet!: HTMLInputElement;
    private consoleCategoryActor!: HTMLInputElement;
    private consoleCategoryStorage!: HTMLInputElement;
    private consoleCategoryGeneral!: HTMLInputElement;

    // 快捷按钮
    private consoleMuteAllBtn!: HTMLButtonElement;
    private consoleEnableAllBtn!: HTMLButtonElement;

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
        // 可选：ID 为 logRetentionDays 的输入框（未在旧模板中时不报错）
        this.retentionDays = document.getElementById('logRetentionDays') as HTMLInputElement;
        if (!this.retentionDays) {
            // 旧模板不存在时，动态插入一个字段，避免修改大型 HTML 文件
            try {
                const panel = document.getElementById('log-settings');
                const anchorField = this.maxLogEntries ? this.maxLogEntries.closest('.field') : null;
                const container = (anchorField && anchorField.parentElement) || panel || document.body;
                const field = document.createElement('div');
                field.className = 'field';
                field.innerHTML = `
                    <label class="label" for="logRetentionDays">日志保留天数（0 = 关闭）</label>
                    <div class="control">
                        <input id="logRetentionDays" class="input" type="number" min="0" max="3650" placeholder="0" />
                    </div>
                    <p class="help">按天数自动清理旧日志；0 表示不按天清理（仍受最大条数上限限制）。</p>
                `;
                if (anchorField && container) {
                    container.insertBefore(field, anchorField.nextSibling);
                } else if (container) {
                    container.appendChild(field);
                }
                this.retentionDays = field.querySelector('#logRetentionDays') as HTMLInputElement;
            } catch (e) {
                console.warn('[LoggingSettings] 动态插入 logRetentionDays 失败：', e);
            }
        }
        // 控制台代理
        this.consoleLevel = document.getElementById('consoleLevel') as HTMLSelectElement;
        this.consoleShowTimestamp = document.getElementById('consoleShowTimestamp') as HTMLInputElement;
        this.consoleShowMilliseconds = document.getElementById('consoleShowMilliseconds') as HTMLInputElement;
        this.consoleShowSource = document.getElementById('consoleShowSource') as HTMLInputElement;
        this.consoleColor = document.getElementById('consoleColor') as HTMLInputElement;
        this.consoleTimeZone = document.getElementById('consoleTimeZone') as HTMLInputElement;
        this.consoleCategoryCore = document.getElementById('consoleCategoryCore') as HTMLInputElement;
        this.consoleCategoryOrchestrator = document.getElementById('consoleCategoryOrchestrator') as HTMLInputElement;
        this.consoleCategoryDrive115 = document.getElementById('consoleCategoryDrive115') as HTMLInputElement;
        this.consoleCategoryPrivacy = document.getElementById('consoleCategoryPrivacy') as HTMLInputElement;
        this.consoleCategoryMagnet = document.getElementById('consoleCategoryMagnet') as HTMLInputElement;
        this.consoleCategoryActor = document.getElementById('consoleCategoryActor') as HTMLInputElement;
        this.consoleCategoryStorage = document.getElementById('consoleCategoryStorage') as HTMLInputElement;
        this.consoleCategoryGeneral = document.getElementById('consoleCategoryGeneral') as HTMLInputElement;

        // 快捷按钮
        this.consoleMuteAllBtn = document.getElementById('consoleMuteAll') as HTMLButtonElement;
        this.consoleEnableAllBtn = document.getElementById('consoleEnableAll') as HTMLButtonElement;

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
        if (!this.retentionDays) console.warn('[LoggingSettings] 找不到 logRetentionDays 元素（可选）');

        // 控制台代理 - 基础校验（允许某些元素在旧模板中缺失，不中断）
        if (!this.consoleLevel) console.warn('[LoggingSettings] 找不到 consoleLevel 元素');
        if (!this.consoleShowTimestamp) console.warn('[LoggingSettings] 找不到 consoleShowTimestamp 元素');
        if (!this.consoleShowSource) console.warn('[LoggingSettings] 找不到 consoleShowSource 元素');
        if (!this.consoleShowMilliseconds) console.warn('[LoggingSettings] 找不到 consoleShowMilliseconds 元素');
        if (!this.consoleColor) console.warn('[LoggingSettings] 找不到 consoleColor 元素');
        if (!this.consoleTimeZone) console.warn('[LoggingSettings] 找不到 consoleTimeZone 元素');
        if (!this.consoleCategoryCore) console.warn('[LoggingSettings] 找不到 consoleCategoryCore 元素');
        if (!this.consoleCategoryOrchestrator) console.warn('[LoggingSettings] 找不到 consoleCategoryOrchestrator 元素');
        if (!this.consoleCategoryDrive115) console.warn('[LoggingSettings] 找不到 consoleCategoryDrive115 元素');
        if (!this.consoleCategoryPrivacy) console.warn('[LoggingSettings] 找不到 consoleCategoryPrivacy 元素');
        if (!this.consoleCategoryMagnet) console.warn('[LoggingSettings] 找不到 consoleCategoryMagnet 元素');
        if (!this.consoleCategoryActor) console.warn('[LoggingSettings] 找不到 consoleCategoryActor 元素');
        if (!this.consoleCategoryStorage) console.warn('[LoggingSettings] 找不到 consoleCategoryStorage 元素');
        if (!this.consoleCategoryGeneral) console.warn('[LoggingSettings] 找不到 consoleCategoryGeneral 元素');

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
        // 控制台代理设置事件
        this.consoleLevel?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleShowTimestamp?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleShowSource?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleShowMilliseconds?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleColor?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleTimeZone?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryCore?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryOrchestrator?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryDrive115?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryPrivacy?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryMagnet?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryActor?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryStorage?.addEventListener('change', this.handleSettingChange.bind(this));
        this.consoleCategoryGeneral?.addEventListener('change', this.handleSettingChange.bind(this));

        // 控制台快捷按钮
        this.consoleMuteAllBtn?.addEventListener('click', this.handleConsoleMuteAll.bind(this));
        this.consoleEnableAllBtn?.addEventListener('click', this.handleConsoleEnableAll.bind(this));
        // 可选：保留天数
        this.retentionDays?.addEventListener('change', this.handleSettingChange.bind(this));
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
        this.maxLogEntries.value = String((logging as any).maxLogEntries || (logging as any).maxEntries || 1000);
        this.verboseMode.checked = logging.verboseMode || false;
        this.showPrivacyLogs.checked = logging.showPrivacyLogs || false;
        this.showStorageLogs.checked = logging.showStorageLogs || false;
        if (this.retentionDays) this.retentionDays.value = String((logging as any).retentionDays ?? 0);

        // 控制台代理设置
        if (this.consoleLevel) this.consoleLevel.value = (logging as any).consoleLevel || 'DEBUG';
        const fmt = (logging as any).consoleFormat || {};
        if (this.consoleShowTimestamp) this.consoleShowTimestamp.checked = fmt.showTimestamp ?? true;
        if (this.consoleShowSource) this.consoleShowSource.checked = fmt.showSource ?? true;
        if (this.consoleShowMilliseconds) this.consoleShowMilliseconds.checked = fmt.showMilliseconds ?? false;
        if (this.consoleColor) this.consoleColor.checked = fmt.color ?? true;
        if (this.consoleTimeZone) this.consoleTimeZone.value = fmt.timeZone || 'Asia/Shanghai';
        const cats = (logging as any).consoleCategories || {};
        if (this.consoleCategoryCore) this.consoleCategoryCore.checked = cats.core ?? true;
        if (this.consoleCategoryOrchestrator) this.consoleCategoryOrchestrator.checked = cats.orchestrator ?? true;
        if (this.consoleCategoryDrive115) this.consoleCategoryDrive115.checked = cats.drive115 ?? true;
        if (this.consoleCategoryPrivacy) this.consoleCategoryPrivacy.checked = cats.privacy ?? true;
        if (this.consoleCategoryMagnet) this.consoleCategoryMagnet.checked = cats.magnet ?? true;
        if (this.consoleCategoryActor) this.consoleCategoryActor.checked = cats.actor ?? true;
        if (this.consoleCategoryStorage) this.consoleCategoryStorage.checked = cats.storage ?? true;
        if (this.consoleCategoryGeneral) this.consoleCategoryGeneral.checked = cats.general ?? true;
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
                    maxLogEntries: parseInt(this.maxLogEntries.value, 10),
                    verboseMode: this.verboseMode.checked,
                    showPrivacyLogs: this.showPrivacyLogs.checked,
                    showStorageLogs: this.showStorageLogs.checked,
                    // 日志保留策略（可选）
                    retentionDays: this.retentionDays ? parseInt(this.retentionDays.value || '0', 10) : (STATE.settings?.logging as any)?.retentionDays,
                    // 控制台代理设置
                    consoleLevel: (this.consoleLevel?.value as any) || 'DEBUG',
                    consoleFormat: {
                        showTimestamp: this.consoleShowTimestamp?.checked ?? true,
                        showSource: this.consoleShowSource?.checked ?? true,
                        showMilliseconds: this.consoleShowMilliseconds?.checked ?? false,
                        color: this.consoleColor?.checked ?? true,
                        timeZone: this.consoleTimeZone?.value || 'Asia/Shanghai',
                    },
                    consoleCategories: {
                        core: this.consoleCategoryCore?.checked ?? true,
                        orchestrator: this.consoleCategoryOrchestrator?.checked ?? true,
                        drive115: this.consoleCategoryDrive115?.checked ?? true,
                        privacy: this.consoleCategoryPrivacy?.checked ?? true,
                        magnet: this.consoleCategoryMagnet?.checked ?? true,
                        actor: this.consoleCategoryActor?.checked ?? true,
                        storage: this.consoleCategoryStorage?.checked ?? true,
                        general: this.consoleCategoryGeneral?.checked ?? true,
                    },
                }
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 通知日志控制器设置已更改
            onSettingsChanged();

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

        // 验证保留天数（可选，0 表示关闭按天清理）
        if (this.retentionDays && this.retentionDays.value !== '') {
            const days = parseInt(this.retentionDays.value, 10);
            if (isNaN(days) || days < 0 || days > 3650) {
                errors.push('日志保留天数必须在0-3650之间');
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
            logging: {
                maxLogEntries: parseInt(this.maxLogEntries.value, 10),
                verboseMode: this.verboseMode.checked,
                showPrivacyLogs: this.showPrivacyLogs.checked,
                showStorageLogs: this.showStorageLogs.checked,
                ...(this.retentionDays ? { retentionDays: parseInt(this.retentionDays.value || '0', 10) } : {}),
                consoleLevel: (this.consoleLevel?.value as any) || 'DEBUG',
                consoleFormat: {
                    showTimestamp: this.consoleShowTimestamp?.checked ?? true,
                    showSource: this.consoleShowSource?.checked ?? true,
                    color: this.consoleColor?.checked ?? true,
                    timeZone: this.consoleTimeZone?.value || 'Asia/Shanghai',
                },
                consoleCategories: {
                    core: this.consoleCategoryCore?.checked ?? true,
                    orchestrator: this.consoleCategoryOrchestrator?.checked ?? true,
                    drive115: this.consoleCategoryDrive115?.checked ?? true,
                    privacy: this.consoleCategoryPrivacy?.checked ?? true,
                    magnet: this.consoleCategoryMagnet?.checked ?? true,
                    actor: this.consoleCategoryActor?.checked ?? true,
                    storage: this.consoleCategoryStorage?.checked ?? true,
                    general: this.consoleCategoryGeneral?.checked ?? true,
                },
            }
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const logging = settings.logging;
        if (logging) {
            if ((logging as any).maxLogEntries !== undefined || (logging as any).maxEntries !== undefined) {
                this.maxLogEntries.value = String((logging as any).maxLogEntries ?? (logging as any).maxEntries);
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
            if (this.retentionDays && (logging as any).retentionDays !== undefined) {
                this.retentionDays.value = String((logging as any).retentionDays ?? 0);
            }

            if ((logging as any).consoleLevel !== undefined && this.consoleLevel) this.consoleLevel.value = (logging as any).consoleLevel as any;
            const fmt = (logging as any).consoleFormat || {};
            if (this.consoleShowTimestamp && fmt.showTimestamp !== undefined) this.consoleShowTimestamp.checked = !!fmt.showTimestamp;
            if (this.consoleShowSource && fmt.showSource !== undefined) this.consoleShowSource.checked = !!fmt.showSource;
            if (this.consoleShowMilliseconds && fmt.showMilliseconds !== undefined) this.consoleShowMilliseconds.checked = !!fmt.showMilliseconds;
            if (this.consoleColor && fmt.color !== undefined) this.consoleColor.checked = !!fmt.color;
            if (this.consoleTimeZone && fmt.timeZone !== undefined) this.consoleTimeZone.value = fmt.timeZone;
            const cats = (logging as any).consoleCategories || {};
            if (this.consoleCategoryCore && cats.core !== undefined) this.consoleCategoryCore.checked = !!cats.core;
            if (this.consoleCategoryOrchestrator && cats.orchestrator !== undefined) this.consoleCategoryOrchestrator.checked = !!cats.orchestrator;
            if (this.consoleCategoryDrive115 && cats.drive115 !== undefined) this.consoleCategoryDrive115.checked = !!cats.drive115;
            if (this.consoleCategoryPrivacy && cats.privacy !== undefined) this.consoleCategoryPrivacy.checked = !!cats.privacy;
            if (this.consoleCategoryMagnet && cats.magnet !== undefined) this.consoleCategoryMagnet.checked = !!cats.magnet;
            if (this.consoleCategoryActor && cats.actor !== undefined) this.consoleCategoryActor.checked = !!cats.actor;
            if (this.consoleCategoryStorage && cats.storage !== undefined) this.consoleCategoryStorage.checked = !!cats.storage;
            if (this.consoleCategoryGeneral && cats.general !== undefined) this.consoleCategoryGeneral.checked = !!cats.general;
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

    /**
     * 一键静默：
     * - 将控制台级别设为 OFF
     * - 关闭所有类别开关
     */
    private handleConsoleMuteAll(): void {
        if (this.consoleLevel) this.consoleLevel.value = 'OFF' as any;
        if (this.consoleCategoryCore) this.consoleCategoryCore.checked = false;
        if (this.consoleCategoryOrchestrator) this.consoleCategoryOrchestrator.checked = false;
        if (this.consoleCategoryDrive115) this.consoleCategoryDrive115.checked = false;
        if (this.consoleCategoryPrivacy) this.consoleCategoryPrivacy.checked = false;
        if (this.consoleCategoryMagnet) this.consoleCategoryMagnet.checked = false;
        if (this.consoleCategoryActor) this.consoleCategoryActor.checked = false;
        if (this.consoleCategoryStorage) this.consoleCategoryStorage.checked = false;
        if (this.consoleCategoryGeneral) this.consoleCategoryGeneral.checked = false;
        showMessage('控制台输出已静默（OFF）', 'info');
        this.handleSettingChange();
    }

    /**
     * 一键全开：
     * - 将控制台级别设为 DEBUG（最详细）
     * - 打开所有类别开关
     * - 打开时间戳/来源/彩色输出
     */
    private handleConsoleEnableAll(): void {
        if (this.consoleLevel) this.consoleLevel.value = 'DEBUG' as any;
        if (this.consoleCategoryCore) this.consoleCategoryCore.checked = true;
        if (this.consoleCategoryOrchestrator) this.consoleCategoryOrchestrator.checked = true;
        if (this.consoleCategoryDrive115) this.consoleCategoryDrive115.checked = true;
        if (this.consoleCategoryPrivacy) this.consoleCategoryPrivacy.checked = true;
        if (this.consoleCategoryMagnet) this.consoleCategoryMagnet.checked = true;
        if (this.consoleCategoryActor) this.consoleCategoryActor.checked = true;
        if (this.consoleCategoryStorage) this.consoleCategoryStorage.checked = true;
        if (this.consoleCategoryGeneral) this.consoleCategoryGeneral.checked = true;
        if (this.consoleShowTimestamp) this.consoleShowTimestamp.checked = true;
        if (this.consoleShowSource) this.consoleShowSource.checked = true;
        if (this.consoleColor) this.consoleColor.checked = true;
        showMessage('控制台输出已全开（DEBUG，所有类别）', 'success');
        this.handleSettingChange();
    }

}

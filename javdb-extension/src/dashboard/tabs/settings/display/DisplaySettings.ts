/**
 * 显示设置面板
 * 控制在JavDB网站上访问时，是否自动隐藏符合条件的影片
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

/**
 * 显示设置面板类
 */
export class DisplaySettings extends BaseSettingsPanel {
    private hideViewedCheckbox!: HTMLInputElement;
    private hideBrowsedCheckbox!: HTMLInputElement;
    private hideVRCheckbox!: HTMLInputElement;

    constructor() {
        super({
            panelId: 'display-settings',
            panelName: '显示设置',
            autoSave: true,
            saveDelay: 500,
            requireValidation: false
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        this.hideViewedCheckbox = document.getElementById('hideViewed') as HTMLInputElement;
        this.hideBrowsedCheckbox = document.getElementById('hideBrowsed') as HTMLInputElement;
        this.hideVRCheckbox = document.getElementById('hideVR') as HTMLInputElement;

        if (!this.hideViewedCheckbox || !this.hideBrowsedCheckbox || !this.hideVRCheckbox) {
            throw new Error('显示设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        this.hideViewedCheckbox.addEventListener('change', this.handleSettingChange.bind(this));
        this.hideBrowsedCheckbox.addEventListener('change', this.handleSettingChange.bind(this));
        this.hideVRCheckbox.addEventListener('change', this.handleSettingChange.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.hideViewedCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.hideBrowsedCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.hideVRCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const display = settings?.display || {};

        this.hideViewedCheckbox.checked = display.hideViewed || false;
        this.hideBrowsedCheckbox.checked = display.hideBrowsed || false;
        this.hideVRCheckbox.checked = display.hideVR || false;
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                display: {
                    hideViewed: this.hideViewedCheckbox.checked,
                    hideBrowsed: this.hideBrowsedCheckbox.checked,
                    hideVR: this.hideVRCheckbox.checked
                }
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 通知所有JavDB标签页设置已更新
            chrome.tabs.query({ url: '*://javdb.com/*' }, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.id) {
                        chrome.tabs.sendMessage(tab.id, { type: 'settings-updated' });
                    }
                });
            });

            return {
                success: true,
                savedSettings: { display: newSettings.display }
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
        // 显示设置不需要特殊验证
        return { isValid: true };
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        return {
            display: {
                hideViewed: this.hideViewedCheckbox.checked,
                hideBrowsed: this.hideBrowsedCheckbox.checked,
                hideVR: this.hideVRCheckbox.checked
            }
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const display = settings.display;
        if (display) {
            if (display.hideViewed !== undefined) {
                this.hideViewedCheckbox.checked = display.hideViewed;
            }
            if (display.hideBrowsed !== undefined) {
                this.hideBrowsedCheckbox.checked = display.hideBrowsed;
            }
            if (display.hideVR !== undefined) {
                this.hideVRCheckbox.checked = display.hideVR;
            }
        }
    }

    /**
     * 处理设置变化
     */
    private handleSettingChange(): void {
        this.emit('change');
        this.scheduleAutoSave();
    }
}

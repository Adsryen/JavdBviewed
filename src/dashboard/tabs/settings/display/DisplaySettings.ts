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
    private hideWantCheckbox!: HTMLInputElement;
    // 新增：演员过滤（列表）
    private hideBlacklistedActorsInListCheckbox: HTMLInputElement | null = null;
    private hideNonFavoritedActorsInListCheckbox: HTMLInputElement | null = null;
    private treatSubscribedAsFavoritedCheckbox: HTMLInputElement | null = null;

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
        this.hideWantCheckbox = document.getElementById('hideWant') as HTMLInputElement;
        // 可选：若页面存在则接入
        this.hideBlacklistedActorsInListCheckbox = document.getElementById('hideBlacklistedActorsInList') as HTMLInputElement | null;
        this.hideNonFavoritedActorsInListCheckbox = document.getElementById('hideNonFavoritedActorsInList') as HTMLInputElement | null;
        this.treatSubscribedAsFavoritedCheckbox = document.getElementById('treatSubscribedAsFavorited') as HTMLInputElement | null;

        if (!this.hideViewedCheckbox || !this.hideBrowsedCheckbox || !this.hideVRCheckbox || !this.hideWantCheckbox) {
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
        this.hideWantCheckbox.addEventListener('change', this.handleSettingChange.bind(this));
        // 仅当存在对应元素时绑定
        this.hideBlacklistedActorsInListCheckbox?.addEventListener('change', this.handleSettingChange.bind(this));
        this.hideNonFavoritedActorsInListCheckbox?.addEventListener('change', this.handleSettingChange.bind(this));
        this.treatSubscribedAsFavoritedCheckbox?.addEventListener('change', this.handleSettingChange.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.hideViewedCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.hideBrowsedCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.hideVRCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.hideWantCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.hideBlacklistedActorsInListCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.hideNonFavoritedActorsInListCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
        this.treatSubscribedAsFavoritedCheckbox?.removeEventListener('change', this.handleSettingChange.bind(this));
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const display = settings?.display || {};
        const listEnhancement = (settings as ExtensionSettings)?.listEnhancement as any || {};

        this.hideViewedCheckbox.checked = display.hideViewed || false;
        this.hideBrowsedCheckbox.checked = display.hideBrowsed || false;
        this.hideVRCheckbox.checked = display.hideVR || false;
        this.hideWantCheckbox.checked = !!display.hideWant;

        if (this.hideBlacklistedActorsInListCheckbox) {
            this.hideBlacklistedActorsInListCheckbox.checked = !!listEnhancement.hideBlacklistedActorsInList;
        }
        if (this.hideNonFavoritedActorsInListCheckbox) {
            this.hideNonFavoritedActorsInListCheckbox.checked = !!listEnhancement.hideNonFavoritedActorsInList;
        }
        if (this.treatSubscribedAsFavoritedCheckbox) {
            // 默认 true（若未配置）
            this.treatSubscribedAsFavoritedCheckbox.checked = listEnhancement.treatSubscribedAsFavorited !== false;
        }
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const current = STATE.settings as ExtensionSettings;
            const newListEnh: any = { ...(current.listEnhancement || {}) };
            if (this.hideBlacklistedActorsInListCheckbox) newListEnh.hideBlacklistedActorsInList = this.hideBlacklistedActorsInListCheckbox.checked;
            if (this.hideNonFavoritedActorsInListCheckbox) newListEnh.hideNonFavoritedActorsInList = this.hideNonFavoritedActorsInListCheckbox.checked;
            if (this.treatSubscribedAsFavoritedCheckbox) newListEnh.treatSubscribedAsFavorited = this.treatSubscribedAsFavoritedCheckbox.checked;

            const newSettings: ExtensionSettings = {
                ...current,
                display: {
                    hideViewed: this.hideViewedCheckbox.checked,
                    hideBrowsed: this.hideBrowsedCheckbox.checked,
                    hideVR: this.hideVRCheckbox.checked,
                    hideWant: this.hideWantCheckbox.checked
                },
                listEnhancement: newListEnh
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
                savedSettings: { display: newSettings.display, listEnhancement: newSettings.listEnhancement }
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
        const out: Partial<ExtensionSettings> = {
            display: {
                hideViewed: this.hideViewedCheckbox.checked,
                hideBrowsed: this.hideBrowsedCheckbox.checked,
                hideVR: this.hideVRCheckbox.checked,
                hideWant: this.hideWantCheckbox.checked
            }
        };
        // 仅在元素存在时输出 listEnhancement 片段
        const le: any = {};
        if (this.hideBlacklistedActorsInListCheckbox) le.hideBlacklistedActorsInList = this.hideBlacklistedActorsInListCheckbox.checked;
        if (this.hideNonFavoritedActorsInListCheckbox) le.hideNonFavoritedActorsInList = this.hideNonFavoritedActorsInListCheckbox.checked;
        if (this.treatSubscribedAsFavoritedCheckbox) le.treatSubscribedAsFavorited = this.treatSubscribedAsFavoritedCheckbox.checked;
        if (Object.keys(le).length > 0) (out as any).listEnhancement = le;
        return out;
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
            if (display.hideWant !== undefined) {
                this.hideWantCheckbox.checked = !!display.hideWant;
            }
        }
        const le = (settings as any).listEnhancement || {};
        if (this.hideBlacklistedActorsInListCheckbox && le.hideBlacklistedActorsInList !== undefined) {
            this.hideBlacklistedActorsInListCheckbox.checked = !!le.hideBlacklistedActorsInList;
        }
        if (this.hideNonFavoritedActorsInListCheckbox && le.hideNonFavoritedActorsInList !== undefined) {
            this.hideNonFavoritedActorsInListCheckbox.checked = !!le.hideNonFavoritedActorsInList;
        }
        if (this.treatSubscribedAsFavoritedCheckbox && le.treatSubscribedAsFavorited !== undefined) {
            this.treatSubscribedAsFavoritedCheckbox.checked = !!le.treatSubscribedAsFavorited;
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

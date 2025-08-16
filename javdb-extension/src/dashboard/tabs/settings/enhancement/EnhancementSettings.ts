/**
 * 功能增强设置面板
 * 解锁强大的增强功能，让JavDB体验更加丰富和高效
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import { log } from '../../../../utils/logController';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

/**
 * 功能增强设置面板类
 */
export class EnhancementSettings extends BaseSettingsPanel {
    // 数据增强功能元素
    private enableTranslation!: HTMLInputElement;
    private cacheExpiration!: HTMLInputElement;

    // 用户体验增强元素
    private enableContentFilter!: HTMLInputElement;
    private enableMagnetSearch!: HTMLInputElement;
    private enableAnchorOptimization!: HTMLInputElement;
    private enableListEnhancement!: HTMLInputElement;

    // 磁力搜索源配置
    private magnetSourceSukebei!: HTMLInputElement;
    private magnetSourceBtdig!: HTMLInputElement;
    private magnetSourceBtsow!: HTMLInputElement;
    private magnetSourceTorrentz2!: HTMLInputElement;

    // 锚点优化配置
    private anchorButtonPosition!: HTMLSelectElement;
    private showPreviewButton!: HTMLInputElement;

    // 列表增强配置
    private enableClickEnhancement!: HTMLInputElement;
    private enableListVideoPreview!: HTMLInputElement;
    private previewDelay!: HTMLInputElement;
    private previewVolume!: HTMLInputElement;
    private previewVolumeValue!: HTMLSpanElement;

    // 配置区域元素
    private translationConfig!: HTMLDivElement;
    private magnetSourcesConfig!: HTMLDivElement;
    private contentFilterConfig!: HTMLElement;
    private anchorOptimizationConfig!: HTMLElement;
    private listEnhancementConfig!: HTMLDivElement;

    private enhancementTogglesInitialized = false;

    constructor() {
        super({
            panelId: 'enhancement-settings',
            panelName: '功能增强设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: false
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 数据增强功能元素
        this.enableTranslation = document.getElementById('enableTranslation') as HTMLInputElement;
        this.cacheExpiration = document.getElementById('cacheExpiration') as HTMLInputElement;

        // 用户体验增强元素
        this.enableContentFilter = document.getElementById('enableContentFilter') as HTMLInputElement;
        this.enableMagnetSearch = document.getElementById('enableMagnetSearch') as HTMLInputElement;
        this.enableAnchorOptimization = document.getElementById('enableAnchorOptimization') as HTMLInputElement;
        this.enableListEnhancement = document.getElementById('enableListEnhancement') as HTMLInputElement;

        // 磁力搜索源配置
        this.magnetSourceSukebei = document.getElementById('magnetSourceSukebei') as HTMLInputElement;
        this.magnetSourceBtdig = document.getElementById('magnetSourceBtdig') as HTMLInputElement;
        this.magnetSourceBtsow = document.getElementById('magnetSourceBtsow') as HTMLInputElement;
        this.magnetSourceTorrentz2 = document.getElementById('magnetSourceTorrentz2') as HTMLInputElement;

        // 锚点优化配置
        this.anchorButtonPosition = document.getElementById('anchorButtonPosition') as HTMLSelectElement;
        this.showPreviewButton = document.getElementById('showPreviewButton') as HTMLInputElement;

        // 列表增强配置
        this.enableClickEnhancement = document.getElementById('enableClickEnhancement') as HTMLInputElement;
        this.enableListVideoPreview = document.getElementById('enableVideoPreview') as HTMLInputElement;
        this.previewDelay = document.getElementById('previewDelay') as HTMLInputElement;
        this.previewVolume = document.getElementById('previewVolume') as HTMLInputElement;
        this.previewVolumeValue = document.getElementById('previewVolumeValue') as HTMLSpanElement;

        // 配置区域元素
        this.translationConfig = document.getElementById('translationConfig') as HTMLDivElement;
        this.magnetSourcesConfig = document.getElementById('magnetSourcesConfig') as HTMLDivElement;
        this.contentFilterConfig = document.getElementById('contentFilterConfig') as HTMLElement;
        this.anchorOptimizationConfig = document.getElementById('anchorOptimizationConfig') as HTMLElement;
        this.listEnhancementConfig = document.getElementById('listEnhancementConfig') as HTMLDivElement;

        if (!this.enableTranslation || !this.enableMagnetSearch || !this.enableListEnhancement) {
            throw new Error('功能增强设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 初始化功能增强开关
        this.initEnhancementToggles();

        // 磁力搜索源配置事件监听
        this.magnetSourceSukebei?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetSourceBtdig?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetSourceBtsow?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetSourceTorrentz2?.addEventListener('change', this.handleSettingChange.bind(this));

        // 锚点优化配置事件监听
        this.anchorButtonPosition?.addEventListener('change', this.handleSettingChange.bind(this));
        this.showPreviewButton?.addEventListener('change', this.handleSettingChange.bind(this));

        // 列表增强配置事件监听
        this.enableClickEnhancement?.addEventListener('change', this.handleSettingChange.bind(this));
        this.enableListVideoPreview?.addEventListener('change', this.handleSettingChange.bind(this));
        this.previewDelay?.addEventListener('change', this.handleSettingChange.bind(this));
        this.previewVolume?.addEventListener('input', this.handleVolumeChange.bind(this));

        // 缓存过期时间
        this.cacheExpiration?.addEventListener('change', this.handleSettingChange.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        // 这里可以添加解绑逻辑，但由于使用了bind，需要保存引用才能正确解绑
        // 为简化起见，暂时省略
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const dataEnhancement = settings?.dataEnhancement || {};
        const userExperience = settings?.userExperience || {};
        const magnetSearch = settings?.magnetSearch || {};
        const anchorOptimization = settings?.anchorOptimization || {};
        const listEnhancement = settings?.listEnhancement || {};

        // 数据增强设置
        this.enableTranslation.checked = dataEnhancement?.enableTranslation || false;
        this.cacheExpiration.value = String(dataEnhancement?.cacheExpiration || 24);

        // 用户体验增强设置
        this.enableContentFilter.checked = userExperience?.enableContentFilter || false;
        this.enableMagnetSearch.checked = userExperience?.enableMagnetSearch || false;
        this.enableAnchorOptimization.checked = userExperience?.enableAnchorOptimization || false;
        this.enableListEnhancement.checked = userExperience?.enableListEnhancement !== false; // 默认启用

        // 磁力搜索源配置
        const sources = magnetSearch.sources || {};
        this.magnetSourceSukebei.checked = sources.sukebei !== false; // 默认启用
        this.magnetSourceBtdig.checked = sources.btdig !== false; // 默认启用
        this.magnetSourceBtsow.checked = sources.btsow !== false; // 默认启用
        this.magnetSourceTorrentz2.checked = sources.torrentz2 || false; // 默认禁用

        // 锚点优化配置
        if (this.anchorButtonPosition) {
            this.anchorButtonPosition.value = anchorOptimization.buttonPosition || 'right-center';
        }
        if (this.showPreviewButton) {
            this.showPreviewButton.checked = anchorOptimization.showPreviewButton !== false;
        }

        // 列表增强配置
        if (this.enableClickEnhancement) this.enableClickEnhancement.checked = listEnhancement.enableClickEnhancement !== false;
        if (this.enableListVideoPreview) this.enableListVideoPreview.checked = listEnhancement.enableVideoPreview !== false;
        if (this.previewDelay) this.previewDelay.value = String(listEnhancement.previewDelay || 1000);
        if (this.previewVolume) {
            this.previewVolume.value = String(listEnhancement.previewVolume || 0.2);
            if (this.previewVolumeValue) this.previewVolumeValue.textContent = `${Math.round((listEnhancement.previewVolume || 0.2) * 100)}%`;
        }

        // 显示/隐藏配置区域
        this.toggleConfigSections();

        // 确保翻译配置的显示状态正确
        if (this.translationConfig) {
            this.translationConfig.style.display = this.enableTranslation.checked ? 'block' : 'none';
        }

        // 初始化功能增强开关
        this.initEnhancementToggles();
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                dataEnhancement: {
                    enableMultiSource: false, // 开发中，强制禁用
                    enableImageCache: false, // 开发中，强制禁用
                    enableVideoPreview: false, // 开发中，强制禁用
                    enableTranslation: this.enableTranslation.checked,
                    enableRatingAggregation: false, // 开发中，强制禁用
                    enableActorInfo: false, // 开发中，强制禁用
                    cacheExpiration: parseInt(this.cacheExpiration.value, 10) || 24,
                },
                userExperience: {
                    enableQuickCopy: false, // 开发中，强制禁用
                    enableContentFilter: this.enableContentFilter.checked,
                    enableKeyboardShortcuts: false, // 开发中，强制禁用
                    enableMagnetSearch: this.enableMagnetSearch.checked,
                    enableAnchorOptimization: this.enableAnchorOptimization.checked,
                    enableListEnhancement: this.enableListEnhancement.checked,
                    showEnhancedTooltips: false, // 开发中，强制禁用
                },
                magnetSearch: {
                    enabled: this.enableMagnetSearch.checked,
                    sources: {
                        sukebei: this.magnetSourceSukebei.checked,
                        btdig: this.magnetSourceBtdig.checked,
                        btsow: this.magnetSourceBtsow.checked,
                        torrentz2: this.magnetSourceTorrentz2.checked,
                    },
                },
                anchorOptimization: {
                    enabled: this.enableAnchorOptimization.checked,
                    showPreviewButton: this.showPreviewButton?.checked !== false,
                    buttonPosition: this.anchorButtonPosition?.value || 'right-center',
                },
                listEnhancement: {
                    enabled: this.enableListEnhancement.checked,
                    enableClickEnhancement: this.enableClickEnhancement?.checked !== false,
                    enableVideoPreview: this.enableListVideoPreview?.checked !== false,
                    enableListOptimization: true, // 总是启用列表优化
                    previewDelay: parseInt(this.previewDelay?.value || '1000', 10),
                    previewVolume: parseFloat(this.previewVolume?.value || '0.2'),
                    enableRightClickBackground: true, // 总是启用右键后台打开
                },
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
                savedSettings: {
                    dataEnhancement: newSettings.dataEnhancement,
                    userExperience: newSettings.userExperience,
                    magnetSearch: newSettings.magnetSearch,
                    anchorOptimization: newSettings.anchorOptimization,
                    listEnhancement: newSettings.listEnhancement
                }
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

        // 验证缓存过期时间
        const cacheExpiration = parseInt(this.cacheExpiration.value, 10);
        if (isNaN(cacheExpiration) || cacheExpiration < 1 || cacheExpiration > 168) {
            errors.push('缓存过期时间必须在1-168小时之间');
        }

        // 验证预览延迟
        if (this.previewDelay) {
            const previewDelay = parseInt(this.previewDelay.value, 10);
            if (isNaN(previewDelay) || previewDelay < 100 || previewDelay > 5000) {
                warnings.push('预览延迟建议在100-5000毫秒之间');
            }
        }

        // 验证预览音量
        if (this.previewVolume) {
            const previewVolume = parseFloat(this.previewVolume.value);
            if (isNaN(previewVolume) || previewVolume < 0 || previewVolume > 1) {
                errors.push('预览音量必须在0-1之间');
            }
        }

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
        return {
            dataEnhancement: {
                enableMultiSource: false,
                enableImageCache: false,
                enableVideoPreview: false,
                enableTranslation: this.enableTranslation.checked,
                enableRatingAggregation: false,
                enableActorInfo: false,
                cacheExpiration: parseInt(this.cacheExpiration.value, 10) || 24,
            },
            userExperience: {
                enableQuickCopy: false,
                enableContentFilter: this.enableContentFilter.checked,
                enableKeyboardShortcuts: false,
                enableMagnetSearch: this.enableMagnetSearch.checked,
                enableAnchorOptimization: this.enableAnchorOptimization.checked,
                enableListEnhancement: this.enableListEnhancement.checked,
                showEnhancedTooltips: false,
            },
            magnetSearch: {
                enabled: this.enableMagnetSearch.checked,
                sources: {
                    sukebei: this.magnetSourceSukebei.checked,
                    btdig: this.magnetSourceBtdig.checked,
                    btsow: this.magnetSourceBtsow.checked,
                    torrentz2: this.magnetSourceTorrentz2.checked,
                },
            },
            anchorOptimization: {
                enabled: this.enableAnchorOptimization.checked,
                showPreviewButton: this.showPreviewButton?.checked !== false,
                buttonPosition: this.anchorButtonPosition?.value || 'right-center',
            },
            listEnhancement: {
                enabled: this.enableListEnhancement.checked,
                enableClickEnhancement: this.enableClickEnhancement?.checked !== false,
                enableVideoPreview: this.enableListVideoPreview?.checked !== false,
                enableListOptimization: true,
                previewDelay: parseInt(this.previewDelay?.value || '1000', 10),
                previewVolume: parseFloat(this.previewVolume?.value || '0.2'),
                enableRightClickBackground: true,
            }
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const dataEnhancement = settings.dataEnhancement;
        const userExperience = settings.userExperience;
        const magnetSearch = settings.magnetSearch;
        const anchorOptimization = settings.anchorOptimization;
        const listEnhancement = settings.listEnhancement;

        if (dataEnhancement) {
            if (dataEnhancement.enableTranslation !== undefined) {
                this.enableTranslation.checked = dataEnhancement.enableTranslation;
            }
            if (dataEnhancement.cacheExpiration !== undefined) {
                this.cacheExpiration.value = String(dataEnhancement.cacheExpiration);
            }
        }

        if (userExperience) {
            if (userExperience.enableContentFilter !== undefined) {
                this.enableContentFilter.checked = userExperience.enableContentFilter;
            }
            if (userExperience.enableMagnetSearch !== undefined) {
                this.enableMagnetSearch.checked = userExperience.enableMagnetSearch;
            }
            if (userExperience.enableAnchorOptimization !== undefined) {
                this.enableAnchorOptimization.checked = userExperience.enableAnchorOptimization;
            }
            if (userExperience.enableListEnhancement !== undefined) {
                this.enableListEnhancement.checked = userExperience.enableListEnhancement;
            }
        }

        if (magnetSearch?.sources) {
            const sources = magnetSearch.sources;
            if (sources.sukebei !== undefined) this.magnetSourceSukebei.checked = sources.sukebei;
            if (sources.btdig !== undefined) this.magnetSourceBtdig.checked = sources.btdig;
            if (sources.btsow !== undefined) this.magnetSourceBtsow.checked = sources.btsow;
            if (sources.torrentz2 !== undefined) this.magnetSourceTorrentz2.checked = sources.torrentz2;
        }

        if (anchorOptimization) {
            if (anchorOptimization.buttonPosition && this.anchorButtonPosition) {
                this.anchorButtonPosition.value = anchorOptimization.buttonPosition;
            }
            if (anchorOptimization.showPreviewButton !== undefined && this.showPreviewButton) {
                this.showPreviewButton.checked = anchorOptimization.showPreviewButton;
            }
        }

        if (listEnhancement) {
            if (listEnhancement.enableClickEnhancement !== undefined && this.enableClickEnhancement) {
                this.enableClickEnhancement.checked = listEnhancement.enableClickEnhancement;
            }
            if (listEnhancement.enableVideoPreview !== undefined && this.enableListVideoPreview) {
                this.enableListVideoPreview.checked = listEnhancement.enableVideoPreview;
            }
            if (listEnhancement.previewDelay !== undefined && this.previewDelay) {
                this.previewDelay.value = String(listEnhancement.previewDelay);
            }
            if (listEnhancement.previewVolume !== undefined && this.previewVolume) {
                this.previewVolume.value = String(listEnhancement.previewVolume);
                if (this.previewVolumeValue) {
                    this.previewVolumeValue.textContent = `${Math.round(listEnhancement.previewVolume * 100)}%`;
                }
            }
        }

        this.toggleConfigSections();
        this.initEnhancementToggles();
    }

    /**
     * 初始化功能增强开关
     */
    private initEnhancementToggles(): void {
        if (this.enhancementTogglesInitialized) {
            return;
        }

        log.verbose('[Enhancement] 初始化功能增强开关...');

        // 获取所有功能增强页面的开关按钮
        const enhancementToggles = document.querySelectorAll('#enhancement-settings .enhancement-toggle');
        log.verbose(`[Enhancement] 找到 ${enhancementToggles.length} 个开关按钮`);

        enhancementToggles.forEach((toggle, index) => {
            const targetId = toggle.getAttribute('data-target');
            if (!targetId) {
                console.warn(`[Enhancement] 开关 ${index + 1} 缺少 data-target 属性`);
                return;
            }

            const hiddenCheckbox = document.getElementById(targetId) as HTMLInputElement;
            if (!hiddenCheckbox) {
                console.warn(`[Enhancement] 未找到对应的checkbox: ${targetId}`);
                return;
            }

            // 根据隐藏的checkbox状态设置开关状态
            const updateToggleState = () => {
                if (hiddenCheckbox.checked) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
            };

            // 初始化状态
            updateToggleState();

            // 添加点击事件
            toggle.addEventListener('click', () => {
                if (toggle.hasAttribute('disabled')) return;

                // 切换状态
                hiddenCheckbox.checked = !hiddenCheckbox.checked;
                updateToggleState();

                // 处理子设置显示/隐藏
                this.handleSubSettingsToggle(targetId, hiddenCheckbox.checked);

                // 特殊处理翻译功能的额外逻辑
                if (targetId === 'enableTranslation') {
                    this.updateTranslationConfigVisibility();
                }

                this.emit('change');
                this.scheduleAutoSave();
            });

            // 监听隐藏checkbox的变化
            hiddenCheckbox.addEventListener('change', () => {
                updateToggleState();
                this.handleSubSettingsToggle(targetId, hiddenCheckbox.checked);

                if (targetId === 'enableTranslation') {
                    this.updateTranslationConfigVisibility();
                }
            });
        });

        this.enhancementTogglesInitialized = true;
        log.verbose('[Enhancement] 功能增强开关初始化完成');
    }

    /**
     * 处理子设置的显示/隐藏
     */
    private handleSubSettingsToggle(targetId: string, isEnabled: boolean): void {
        let subSettingsId: string | null = null;

        switch (targetId) {
            case 'enableTranslation':
                subSettingsId = 'translationConfig';
                break;
            case 'enableContentFilter':
                subSettingsId = 'contentFilterConfig';
                break;
            case 'enableAnchorOptimization':
                subSettingsId = 'anchorOptimizationConfig';
                break;
            case 'enableListEnhancement':
                subSettingsId = 'listEnhancementConfig';
                break;
            case 'enableMagnetSearch':
                subSettingsId = 'magnetSourcesConfig';
                break;
        }

        if (subSettingsId) {
            const subSettings = document.getElementById(subSettingsId);
            if (subSettings) {
                if (isEnabled) {
                    subSettings.style.display = 'block';
                    subSettings.classList.add('show');
                } else {
                    subSettings.style.display = 'none';
                    subSettings.classList.remove('show');
                }
            }
        }
    }

    /**
     * 更新翻译配置可见性
     */
    private updateTranslationConfigVisibility(): void {
        if (this.translationConfig) {
            if (this.enableTranslation.checked) {
                this.translationConfig.style.display = 'block';
            } else {
                this.translationConfig.style.display = 'none';
            }
        }
    }

    /**
     * 切换配置区域显示/隐藏
     */
    private toggleConfigSections(): void {
        // 磁力搜索源配置
        if (this.magnetSourcesConfig) {
            this.magnetSourcesConfig.style.display = this.enableMagnetSearch.checked ? 'block' : 'none';
        }

        // 内容过滤配置
        if (this.contentFilterConfig) {
            this.contentFilterConfig.style.display = this.enableContentFilter.checked ? 'block' : 'none';
        }

        // 锚点优化配置
        if (this.anchorOptimizationConfig) {
            this.anchorOptimizationConfig.style.display = this.enableAnchorOptimization.checked ? 'block' : 'none';
        }

        // 列表增强配置
        if (this.listEnhancementConfig) {
            this.listEnhancementConfig.style.display = this.enableListEnhancement.checked ? 'block' : 'none';
        }
    }

    /**
     * 处理设置变化
     */
    private handleSettingChange(): void {
        this.emit('change');
        this.scheduleAutoSave();
    }

    /**
     * 处理音量变化
     */
    private handleVolumeChange(e: Event): void {
        const value = (e.target as HTMLInputElement).value;
        if (this.previewVolumeValue) {
            this.previewVolumeValue.textContent = `${Math.round(parseFloat(value) * 100)}%`;
        }
        this.handleSettingChange();
    }
}

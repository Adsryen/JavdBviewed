/**
 * 功能增强设置面板
 * 解锁强大的增强功能，让JavDB体验更加丰富和高效
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { STATE } from '../../../state';
import { getValue, setValue } from '../../../../utils/storage';
import { showMessage } from '../../../ui/toast';
import { log } from '../../../../utils/logController';
import type { ExtensionSettings, KeywordFilterRule } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';
import { aiService } from '../../../../services/ai/aiService';

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
    private enableActorEnhancement!: HTMLInputElement;
    private enableVideoEnhancement!: HTMLInputElement;

    // 影片页增强子项
    private veEnableCoverImage!: HTMLInputElement;
    private veEnableTranslation!: HTMLInputElement;
    private veEnableRating!: HTMLInputElement;
    private veEnableActorInfo!: HTMLInputElement;
    private veShowLoadingIndicator!: HTMLInputElement;

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
    private enableScrollPaging!: HTMLInputElement;
    private previewDelay!: HTMLInputElement;
    private previewVolume!: HTMLInputElement;
    private previewVolumeValue!: HTMLSpanElement;
    private previewSourceAuto!: HTMLInputElement;
    private previewSourceJavDB!: HTMLInputElement;
    private previewSourceJavSpyl!: HTMLInputElement;
    private previewSourceAVPreview!: HTMLInputElement;
    private previewSourceVBGFL!: HTMLInputElement;

    // 演员页增强配置
    private enableAutoApplyTags!: HTMLInputElement;
    private actorDefaultTagInputs!: NodeListOf<HTMLInputElement>;
    private actorEnhancementConfig!: HTMLElement;
    private lastAppliedTagsDisplay!: HTMLElement;
    private appliedTagsContainer!: HTMLElement;
    private clearLastAppliedTags!: HTMLButtonElement;
    private exportActorConfig!: HTMLButtonElement;
    private importActorConfig!: HTMLButtonElement;
    private actorConfigFileInput!: HTMLInputElement;

    // 配置区域元素
    private translationConfig!: HTMLDivElement;
    // 翻译相关元素
    private translationProviderSel!: HTMLSelectElement;
    private traditionalServiceSel!: HTMLSelectElement;
    private traditionalApiKeyInput!: HTMLInputElement;
    private traditionalApiKeyGroup!: HTMLDivElement;
    private currentTranslationServiceLabel!: HTMLElement;
    private aiConfigContainer!: HTMLDivElement;
    private traditionalConfigContainer!: HTMLDivElement;
    private translateCurrentTitleChk!: HTMLInputElement;
    private translationDisplayModeSel!: HTMLSelectElement;
    private aiCurrentModelLabel!: HTMLElement;
    private aiModelEmptyTip!: HTMLElement;
    private goAiSettingsBtn!: HTMLButtonElement;
    private magnetSourcesConfig!: HTMLDivElement;
    private contentFilterConfig!: HTMLElement;
    private anchorOptimizationConfig!: HTMLElement;
    private listEnhancementConfig!: HTMLDivElement;
    private videoEnhancementConfig!: HTMLDivElement;

    // 内容过滤相关元素
    private addFilterRuleBtn!: HTMLButtonElement;
    private filterRulesList!: HTMLElement;

    private enhancementTogglesInitialized = false;
    private subSettingsHoverInitialized = false;
    private subSettingsOpenTimers: WeakMap<HTMLElement, number> = new WeakMap();
    private subSettingsCollapseTimers: WeakMap<HTMLElement, number> = new WeakMap();
    private subSettingsOpenedAt: WeakMap<HTMLElement, number> = new WeakMap();
    private currentFilterRules: KeywordFilterRule[] = [];

    // 子标签元素
    private subtabLinks!: NodeListOf<HTMLButtonElement>;
    private currentSubtab: 'list' | 'video' | 'actor' = 'list';

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
     * 获取当前选中的预览来源
     */
    private getPreferredPreviewSource(): 'auto' | 'javdb' | 'javspyl' | 'avpreview' | 'vbgfl' {
        if (this.previewSourceJavDB?.checked) return 'javdb';
        if (this.previewSourceJavSpyl?.checked) return 'javspyl';
        if (this.previewSourceAVPreview?.checked) return 'avpreview';
        if (this.previewSourceVBGFL?.checked) return 'vbgfl';
        return 'auto';
    }

    /**
     * 同步"视频预览增强"的当前延迟展示到说明文字（#currentPreviewDelay）
     */
    private updateCurrentPreviewDelayDisplay(): void {
        const span = document.getElementById('currentPreviewDelay');
        if (!span) return;
        const val = (this.previewDelay?.value || '').trim();
        const n = parseInt(val || '0', 10);
        span.textContent = isNaN(n) ? '—' : String(n);
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
        this.enableActorEnhancement = document.getElementById('enableActorEnhancement') as HTMLInputElement;
        this.enableVideoEnhancement = document.getElementById('enableVideoEnhancement') as HTMLInputElement;

        // 演员页增强配置
        this.enableAutoApplyTags = document.getElementById('enableAutoApplyTags') as HTMLInputElement;
        this.actorDefaultTagInputs = document.querySelectorAll('#actorDefaultTagsGroup input[name="actorDefaultTag"]') as NodeListOf<HTMLInputElement>;
        this.actorEnhancementConfig = document.getElementById('actorEnhancementConfig') as HTMLElement;
        this.lastAppliedTagsDisplay = document.getElementById('lastAppliedTagsDisplay') as HTMLElement;
        this.appliedTagsContainer = document.getElementById('appliedTagsContainer') as HTMLElement;
        this.clearLastAppliedTags = document.getElementById('clearLastAppliedTags') as HTMLButtonElement;
        this.exportActorConfig = document.getElementById('exportActorConfig') as HTMLButtonElement;
        this.importActorConfig = document.getElementById('importActorConfig') as HTMLButtonElement;
        this.actorConfigFileInput = document.getElementById('actorConfigFileInput') as HTMLInputElement;

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
        this.enableScrollPaging = document.getElementById('enableScrollPaging') as HTMLInputElement;
        this.previewDelay = document.getElementById('previewDelay') as HTMLInputElement;
        this.previewVolume = document.getElementById('previewVolume') as HTMLInputElement;
        this.previewVolumeValue = document.getElementById('previewVolumeValue') as HTMLSpanElement;
        // 预览来源单选
        this.previewSourceAuto = document.getElementById('previewSourceAuto') as HTMLInputElement;
        this.previewSourceJavDB = document.getElementById('previewSourceJavDB') as HTMLInputElement;
        this.previewSourceJavSpyl = document.getElementById('previewSourceJavSpyl') as HTMLInputElement;
        this.previewSourceAVPreview = document.getElementById('previewSourceAVPreview') as HTMLInputElement;
        this.previewSourceVBGFL = document.getElementById('previewSourceVBGFL') as HTMLInputElement;

        // 配置区域元素
        this.translationConfig = document.getElementById('translationConfig') as HTMLDivElement;
        // 翻译相关元素
        this.translationProviderSel = document.getElementById('translationProvider') as HTMLSelectElement;
        this.traditionalServiceSel = document.getElementById('traditionalTranslationService') as HTMLSelectElement;
        this.traditionalApiKeyInput = document.getElementById('traditionalApiKey') as HTMLInputElement;
        this.traditionalApiKeyGroup = document.getElementById('traditionalApiKeyGroup') as HTMLDivElement;
        this.currentTranslationServiceLabel = document.getElementById('currentTranslationService') as HTMLElement;
        this.aiConfigContainer = document.getElementById('aiTranslationConfig') as HTMLDivElement;
        this.traditionalConfigContainer = document.getElementById('traditionalTranslationConfig') as HTMLDivElement;
        this.translateCurrentTitleChk = document.getElementById('translateCurrentTitle') as HTMLInputElement;
        this.translationDisplayModeSel = document.getElementById('translationDisplayMode') as HTMLSelectElement;
        this.aiCurrentModelLabel = document.getElementById('aiCurrentModel') as HTMLElement;
        this.aiModelEmptyTip = document.getElementById('aiModelEmptyTip') as HTMLElement;
        this.goAiSettingsBtn = document.getElementById('goAiSettingsBtn') as HTMLButtonElement;
        this.magnetSourcesConfig = document.getElementById('magnetSourcesConfig') as HTMLDivElement;
        this.contentFilterConfig = document.getElementById('contentFilterConfig') as HTMLElement;
        this.anchorOptimizationConfig = document.getElementById('anchorOptimizationConfig') as HTMLElement;
        this.listEnhancementConfig = document.getElementById('listEnhancementConfig') as HTMLDivElement;
        this.videoEnhancementConfig = document.getElementById('videoEnhancementConfig') as HTMLDivElement;

        // 让翻译配置在初始化阶段就具备统一的子设置类名，便于 hover 逻辑一次性绑定
        if (this.translationConfig) {
            if (!this.translationConfig.classList.contains('sub-settings')) {
                this.translationConfig.classList.add('sub-settings');
            }
            // 避免内联样式强制显示/隐藏，交给统一 hover 控制
            this.translationConfig.style.display = '';
        }

        // 子标签
        this.subtabLinks = document.querySelectorAll('#enhancementSubTabs .subtab-link') as NodeListOf<HTMLButtonElement>;

        // 影片页增强子项
        this.veEnableCoverImage = document.getElementById('veEnableCoverImage') as HTMLInputElement;
        this.veEnableTranslation = document.getElementById('veEnableTranslation') as HTMLInputElement;
        this.veEnableRating = document.getElementById('veEnableRating') as HTMLInputElement;
        this.veEnableActorInfo = document.getElementById('veEnableActorInfo') as HTMLInputElement;
        this.veShowLoadingIndicator = document.getElementById('veShowLoadingIndicator') as HTMLInputElement;

        // 内容过滤相关元素
        this.addFilterRuleBtn = document.getElementById('addFilterRule') as HTMLButtonElement;
        this.filterRulesList = document.getElementById('filterRulesList') as HTMLElement;

        if (!this.enableTranslation || !this.enableMagnetSearch || !this.enableListEnhancement || !this.enableActorEnhancement || !this.enableVideoEnhancement) {
            throw new Error('功能增强设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 注意：不在这里初始化功能增强开关，而是在设置加载完成后初始化

        // 磁力搜索源配置事件监听
        this.magnetSourceSukebei?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetSourceBtdig?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetSourceBtsow?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetSourceTorrentz2?.addEventListener('change', this.handleSettingChange.bind(this));

        // 锚点优化配置事件监听
        this.anchorButtonPosition?.addEventListener('change', this.handleSettingChange.bind(this));
        this.showPreviewButton?.addEventListener('change', this.handleSettingChange.bind(this));

        // 翻译配置事件监听
        this.translationProviderSel?.addEventListener('change', this.onTranslationProviderChange.bind(this));
        this.traditionalServiceSel?.addEventListener('change', this.onTraditionalServiceChange.bind(this));
        this.traditionalApiKeyInput?.addEventListener('input', this.handleSettingChange.bind(this));
        this.goAiSettingsBtn?.addEventListener('click', this.navigateToAISettings.bind(this));
        this.translateCurrentTitleChk?.addEventListener('change', this.handleSettingChange.bind(this));
        this.translationDisplayModeSel?.addEventListener('change', this.handleSettingChange.bind(this));

        // 列表增强配置事件监听
        this.enableClickEnhancement?.addEventListener('change', this.handleSettingChange.bind(this));
        this.enableListVideoPreview?.addEventListener('change', this.handleSettingChange.bind(this));
        this.enableScrollPaging?.addEventListener('change', this.handleSettingChange.bind(this));

        // 影片页增强事件监听
        this.enableVideoEnhancement?.addEventListener('change', this.handleSettingChange.bind(this));

        // 影片页增强子项事件监听
        this.veEnableCoverImage?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veEnableTranslation?.addEventListener('change', () => {
            this.handleSettingChange();
            this.updateTranslationConfigVisibility();
        });
        this.veEnableRating?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veEnableActorInfo?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veShowLoadingIndicator?.addEventListener('change', this.handleSettingChange.bind(this));

        // 演员页增强配置事件监听
        this.enableActorEnhancement?.addEventListener('change', this.handleSettingChange.bind(this));
        this.enableAutoApplyTags?.addEventListener('change', () => {
            this.handleSettingChange();
            this.toggleConfigSections();
        });
        if (this.actorDefaultTagInputs) {
            this.actorDefaultTagInputs.forEach(input => {
                input.addEventListener('change', this.handleSettingChange.bind(this));
            });
        }
        this.previewDelay?.addEventListener('change', this.handleSettingChange.bind(this));
        // 同步"视频预览增强"描述里的当前延迟显示
        this.previewDelay?.addEventListener('input', () => this.updateCurrentPreviewDelayDisplay());
        this.previewVolume?.addEventListener('input', this.handleVolumeChange.bind(this));

        // 缓存过期时间
        this.cacheExpiration?.addEventListener('change', this.handleSettingChange.bind(this));

        // 内容过滤规则事件监听
        if (this.addFilterRuleBtn) {
            console.log('[Enhancement] 绑定添加过滤规则按钮事件');
            this.addFilterRuleBtn.addEventListener('click', this.addFilterRule.bind(this));
        } else {
            console.warn('[Enhancement] 未找到添加过滤规则按钮元素');
        }

        // 预览来源变更
        const previewSourceRadios = [this.previewSourceAuto, this.previewSourceJavDB, this.previewSourceJavSpyl, this.previewSourceAVPreview, this.previewSourceVBGFL].filter(Boolean) as HTMLInputElement[];
        previewSourceRadios.forEach(r => r.addEventListener('change', this.handleSettingChange.bind(this)));

        // 设置样式支持（在DOM元素都初始化完成后）
        this.setupVolumeControlStyles();

        // 子标签切换
        if (this.subtabLinks && this.subtabLinks.length > 0) {
            this.subtabLinks.forEach(btn => {
                btn.addEventListener('click', () => {
                    const sub = (btn.getAttribute('data-subtab') || 'list') as 'list' | 'video' | 'actor';
                    this.switchSubtab(sub);
                });
            });
        }

        // 折叠/展开 与 重置按钮
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target) return;
            const action = target.getAttribute('data-action');
            if (action === 'toggle-section') {
                const sel = target.getAttribute('data-target') || '';
                const section = document.querySelector(sel) as HTMLElement;
                if (section) {
                    section.classList.toggle('collapsed');
                    try {
                        const key = `enhancementSectionCollapsed:${section.id}`;
                        const isCollapsed = section.classList.contains('collapsed');
                        localStorage.setItem(key, isCollapsed ? '1' : '0');
                    } catch {}
                }
            } else if (action === 'reset-section') {
                const section = target.getAttribute('data-section') as 'list' | 'video' | 'actor';
                this.resetSectionToDefaults(section);
            }
        });

        // 绑定演员页增强相关按钮事件
        this.initializeActorEnhancementEvents();

        // 统一设置 sub-settings 悬浮展开/离开折叠
        this.setupSubSettingsHoverBehavior();
    }

    /** 将单个板块重置为默认值 */
    private async resetSectionToDefaults(section: 'list' | 'video' | 'actor'): Promise<void> {
        const s = STATE.settings;
        if (!s) return;
        if (section === 'list') {
            s.listEnhancement = {
                enabled: true,
                enableClickEnhancement: true,
                enableVideoPreview: true,
                enableScrollPaging: false,
                enableListOptimization: true,
                previewDelay: 1000,
                previewVolume: 0.2,
                enableRightClickBackground: true,
                preferredPreviewSource: 'auto'
            };
        } else if (section === 'video') {
            s.videoEnhancement = {
                enabled: false,
                enableCoverImage: true,
                enableTranslation: true,
                enableRating: true,
                enableActorInfo: true,
                showLoadingIndicator: true,
            } as any;
        } else if (section === 'actor') {
            s.actorEnhancement = {
                enabled: true,
                autoApplyTags: true,
                defaultTags: ['s','d'],
                defaultSortType: 0,
            } as any;
        }

        await saveSettings(s);
        STATE.settings = s;
        await this.doLoadSettings();
        showMessage('已重置为默认值', 'success');
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
        // const magnetSearch = settings?.magnetSearch || {}; // 属性不存在
        const anchorOptimization = settings?.anchorOptimization || {};
        const listEnhancement = settings?.listEnhancement || {};

        // 数据增强设置
        this.enableTranslation.checked = dataEnhancement?.enableTranslation || false;
        this.cacheExpiration.value = String(dataEnhancement?.cacheExpiration || 24);

        // 翻译配置 - 仅支持 Google 与 AI
        const defaultTranslation = {
            provider: 'traditional' as 'traditional' | 'ai',
            traditional: { service: 'google' as 'google', sourceLanguage: 'ja', targetLanguage: 'zh-CN' },
            ai: { useGlobalModel: true as boolean, customModel: '' as string | undefined }
        };
        const translation = (settings as any).translation || defaultTranslation;

        if (this.translationProviderSel) {
            this.translationProviderSel.value = translation.provider || 'traditional';
        }
        if (this.traditionalServiceSel) {
            this.traditionalServiceSel.value = 'google';
        }
        // API 密钥组：Google 无需展示
        if (this.traditionalApiKeyGroup) this.traditionalApiKeyGroup.style.display = 'none';

        // 固定使用 AI 设置中的模型，无需本地切换

        // 回填目标与显示方式
        if (this.translateCurrentTitleChk) {
            this.translateCurrentTitleChk.checked = !!translation.targets?.currentTitle;
        }
        if (this.translationDisplayModeSel) {
            this.translationDisplayModeSel.value = translation.displayMode || 'append';
        }

        // 初始显示状态
        this.applyTranslationProviderUI();
        await this.updateAiCurrentModelUI();

        // 用户体验增强设置
        this.enableContentFilter.checked = userExperience?.enableContentFilter || false;
        this.enableMagnetSearch.checked = userExperience?.enableMagnetSearch || false;
        this.enableAnchorOptimization.checked = userExperience?.enableAnchorOptimization || false;
        if (userExperience.enableListEnhancement !== undefined) {
            this.enableListEnhancement.checked = userExperience.enableListEnhancement;
        }
        if (userExperience.enableActorEnhancement !== undefined) {
            this.enableActorEnhancement.checked = userExperience.enableActorEnhancement;
        }

        // 磁力搜索源配置
        // const sources = magnetSearch.sources || {}; // 暂时注释
        this.magnetSourceSukebei.checked = true; // 默认启用
        this.magnetSourceBtdig.checked = true; // 默认启用
        this.magnetSourceBtsow.checked = true; // 默认启用
        this.magnetSourceTorrentz2.checked = false; // 默认禁用

        // 锚点优化配置
        if (anchorOptimization) {
            if (anchorOptimization.buttonPosition && this.anchorButtonPosition) {
                this.anchorButtonPosition.value = anchorOptimization.buttonPosition;
            }
            if (anchorOptimization.showPreviewButton !== undefined && this.showPreviewButton) {
                this.showPreviewButton.checked = anchorOptimization.showPreviewButton;
            }
        }

        // 列表增强配置
        if (this.enableClickEnhancement) this.enableClickEnhancement.checked = listEnhancement.enableClickEnhancement !== false;
        if (this.enableListVideoPreview) this.enableListVideoPreview.checked = listEnhancement.enableVideoPreview !== false;
        if (this.enableScrollPaging) this.enableScrollPaging.checked = listEnhancement.enableScrollPaging || false;

        // 预览来源回填
        const preferred = (listEnhancement as any).preferredPreviewSource || 'auto';
        if (this.previewSourceAuto) this.previewSourceAuto.checked = preferred === 'auto';
        if (this.previewSourceJavDB) this.previewSourceJavDB.checked = preferred === 'javdb';
        if (this.previewSourceJavSpyl) this.previewSourceJavSpyl.checked = preferred === 'javspyl';
        if (this.previewSourceAVPreview) this.previewSourceAVPreview.checked = preferred === 'avpreview';
        if (this.previewSourceVBGFL) this.previewSourceVBGFL.checked = preferred === 'vbgfl';

        // 演员页增强配置
        const actorEnhancement = settings.actorEnhancement || { enabled: true, autoApplyTags: true, defaultTags: ['s', 'd'], defaultSortType: 0 };
        if (this.enableAutoApplyTags) this.enableAutoApplyTags.checked = actorEnhancement.autoApplyTags !== false;
        if (this.actorDefaultTagInputs && actorEnhancement.defaultTags) {
            this.actorDefaultTagInputs.forEach((input: HTMLInputElement) => {
                input.checked = actorEnhancement.defaultTags.includes(input.value);
            });
        }
        if (this.previewDelay) this.previewDelay.value = String(listEnhancement.previewDelay || 1000);
        // 首次加载时更新"当前延迟"展示
        this.updateCurrentPreviewDelayDisplay();
        if (this.previewVolume) {
            const volumeValue = listEnhancement.previewVolume || 0.2;
            this.previewVolume.value = String(volumeValue);
            const percentage = Math.round(volumeValue * 100);

            if (this.previewVolumeValue) {
                this.previewVolumeValue.textContent = `${percentage}%`;
            }

            // 同步进度条
            const volumeGroup = document.querySelector('.volume-control-group') as HTMLElement;
            const trackFill = volumeGroup?.querySelector('.range-track-fill') as HTMLElement;
            if (trackFill) {
                trackFill.style.width = `${percentage}%`;
                console.log(`[Enhancement] 设置加载时同步音量进度条: ${percentage}%`);
            }
        }

        // 影片页增强配置
        const videoEnhancement = settings?.videoEnhancement || { enabled: false, enableCoverImage: true, enableTranslation: true, enableRating: true, enableActorInfo: true, showLoadingIndicator: true };
        if (this.enableVideoEnhancement) this.enableVideoEnhancement.checked = !!videoEnhancement.enabled;
        if (this.veEnableCoverImage) this.veEnableCoverImage.checked = videoEnhancement.enableCoverImage !== false;
        if (this.veEnableTranslation) this.veEnableTranslation.checked = videoEnhancement.enableTranslation !== false;
        if (this.veEnableRating) this.veEnableRating.checked = videoEnhancement.enableRating !== false;
        if (this.veEnableActorInfo) this.veEnableActorInfo.checked = videoEnhancement.enableActorInfo !== false;
        if (this.veShowLoadingIndicator) this.veShowLoadingIndicator.checked = videoEnhancement.showLoadingIndicator !== false;

        // 内容过滤规则
        const contentFilter = settings?.contentFilter || {};
        this.currentFilterRules = contentFilter?.keywordRules || [];
        this.renderFilterRules();

        // 将翻译配置容器迁移到“影片页增强 > 标题翻译”独立块中
        this.mountTranslationConfigIntoVideoBlock();

        // 显示/隐藏配置区域
        this.toggleConfigSections();

        // 统一由悬浮控制子设置显隐——不在此处强制显示翻译配置

        // 初始化功能增强开关
        this.initEnhancementToggles();

        // 强制更新所有滑块状态以确保与存储同步
        this.updateAllToggleStates();

        // 初始化子标签（读取最近一次选择）
        try {
            const last = localStorage.getItem('enhancementSubtab') as 'list' | 'video' | 'actor' | null;
            this.switchSubtab(last || 'list');
        } catch {
            this.switchSubtab('list');
        }
    }

    /**
     * 将翻译配置(#translationConfig)移动到“影片页增强”的标题翻译独立区块内
     */
    private mountTranslationConfigIntoVideoBlock(): void {
        try {
            const videoTranslationBlock = document.getElementById('videoTranslationBlock');
            if (!videoTranslationBlock || !this.translationConfig) return;

            // 如果尚未挂载到独立块，则迁移
            if (!videoTranslationBlock.contains(this.translationConfig)) {
                videoTranslationBlock.appendChild(this.translationConfig);
            }

            // 使翻译配置也参与统一的悬浮展开逻辑
            if (!this.translationConfig.classList.contains('sub-settings')) {
                this.translationConfig.classList.add('sub-settings');
            }

            // 依据当前状态刷新可见性
            this.updateTranslationConfigVisibility();
        } catch {}
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            const actorEnabledDerived = (
                this.enableAutoApplyTags?.checked === true ||
                (this.actorDefaultTagInputs && Array.from(this.actorDefaultTagInputs).some((i: HTMLInputElement) => i.checked))
            );
            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                dataEnhancement: {
                    enableMultiSource: false, // 仍未启用
                    enableImageCache: false,  // 仍未启用
                    // 将"视频预览增强"与列表增强的预览开关保持一致
                    enableVideoPreview: this.enableListVideoPreview?.checked !== false,
                    enableTranslation: this.enableTranslation.checked,
                    enableRatingAggregation: false, // 开发中，暂不启用
                    enableActorInfo: false, // 开发中，暂不启用
                    cacheExpiration: parseInt(this.cacheExpiration.value, 10) || 24,
                },
                // 影片页增强配置保存（启用状态由任一子项或“标题翻译”开启决定）
                videoEnhancement: {
                    enabled: (
                        this.veEnableCoverImage?.checked === true ||
                        this.enableTranslation?.checked === true ||
                        this.veEnableRating?.checked === true ||
                        this.veEnableActorInfo?.checked === true ||
                        this.veShowLoadingIndicator?.checked === true
                    ),
                    enableCoverImage: this.veEnableCoverImage?.checked !== false,
                    // 与“翻译”总开关保持一致，避免两处状态不一致
                    enableTranslation: this.enableTranslation?.checked === true,
                    enableRating: this.veEnableRating?.checked !== false,
                    enableActorInfo: this.veEnableActorInfo?.checked !== false,
                    showLoadingIndicator: this.veShowLoadingIndicator?.checked !== false,
                },
                // 翻译配置保存
                translation: {
                    provider: (this.translationProviderSel?.value as 'traditional' | 'ai') || 'traditional',
                    traditional: {
                        service: 'google',
                        apiKey: this.traditionalApiKeyInput?.value?.trim() || undefined,
                        sourceLanguage: 'ja',
                        targetLanguage: 'zh-CN',
                    },
                    ai: {
                        useGlobalModel: true,
                    },
                    displayMode: (this.translationDisplayModeSel?.value as 'append' | 'replace') || 'append',
                    targets: {
                        currentTitle: this.translateCurrentTitleChk?.checked === true,
                    }
                },
                userExperience: {
                    enableQuickCopy: false, // 开发中，强制禁用
                    enableContentFilter: this.enableContentFilter.checked,
                    enableKeyboardShortcuts: false, // 开发中，强制禁用
                    enableMagnetSearch: this.enableMagnetSearch.checked,
                    enableAnchorOptimization: this.enableAnchorOptimization.checked,
                    enableListEnhancement: this.enableListEnhancement.checked,
                    // 与派生的演员页增强状态保持一致
                    enableActorEnhancement: actorEnabledDerived,
                    showEnhancedTooltips: false, // 开发中，强制禁用
                },
                anchorOptimization: {
                    enabled: this.enableAnchorOptimization.checked,
                    showPreviewButton: this.showPreviewButton?.checked !== false,
                    buttonPosition: (this.anchorButtonPosition?.value as 'right-center' | 'right-bottom') || 'right-center',
                },
                listEnhancement: {
                    enabled: this.enableListEnhancement.checked,
                    enableClickEnhancement: this.enableClickEnhancement?.checked !== false,
                    enableVideoPreview: this.enableListVideoPreview?.checked !== false,
                    enableScrollPaging: this.enableScrollPaging?.checked === true,
                    enableListOptimization: true, // 总是启用列表优化
                    previewDelay: parseInt(this.previewDelay?.value || '1000', 10),
                    previewVolume: parseFloat(this.previewVolume?.value || '0.2'),
                    enableRightClickBackground: true, // 总是启用右键后台打开
                    preferredPreviewSource: this.getPreferredPreviewSource(),
                },
                actorEnhancement: {
                    // 若任一子项启用即视为启用演员页增强
                    enabled: actorEnabledDerived,
                    autoApplyTags: this.enableAutoApplyTags?.checked !== false,
                    defaultTags: this.actorDefaultTagInputs && this.actorDefaultTagInputs.length > 0
                        ? Array.from(this.actorDefaultTagInputs).filter((i: HTMLInputElement) => i.checked).map(i => i.value)
                        : ['s', 'd'],
                    defaultSortType: 0,
                },
                contentFilter: {
                    enabled: this.enableContentFilter.checked,
                    keywordRules: this.currentFilterRules,
                },
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 通知所有JavDB标签页设置已更新（兼容大小写类型）
            chrome.tabs.query({ url: '*://javdb.com/*' }, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.id) {
                        try { chrome.tabs.sendMessage(tab.id, { type: 'settings-updated', settings: newSettings }); } catch {}
                        try { chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings: newSettings }); } catch {}
                    }
                });
            });

            return {
                success: true,
                savedSettings: {
                    dataEnhancement: newSettings.dataEnhancement,
                    userExperience: newSettings.userExperience,
                    anchorOptimization: newSettings.anchorOptimization,
                    listEnhancement: newSettings.listEnhancement,
                    actorEnhancement: newSettings.actorEnhancement
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
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        return {
            userExperience: {
                enableQuickCopy: false,
                enableContentFilter: this.enableContentFilter.checked,
                enableKeyboardShortcuts: false,
                enableMagnetSearch: this.enableMagnetSearch.checked,
                enableAnchorOptimization: this.enableAnchorOptimization.checked,
                enableListEnhancement: this.enableListEnhancement.checked,
                enableActorEnhancement: this.enableActorEnhancement.checked,
                showEnhancedTooltips: false,
            },
            videoEnhancement: {
                enabled: this.enableVideoEnhancement?.checked === true,
                enableCoverImage: this.veEnableCoverImage?.checked !== false,
                enableTranslation: this.veEnableTranslation?.checked !== false,
                enableRating: this.veEnableRating?.checked !== false,
                enableActorInfo: this.veEnableActorInfo?.checked !== false,
                showLoadingIndicator: this.veShowLoadingIndicator?.checked !== false,
            },
            anchorOptimization: {
                enabled: this.enableAnchorOptimization.checked,
                showPreviewButton: this.showPreviewButton?.checked !== false,
                buttonPosition: (this.anchorButtonPosition?.value as 'right-center' | 'right-bottom') || 'right-center',
            },
            listEnhancement: {
                enabled: this.enableListEnhancement.checked,
                enableClickEnhancement: this.enableClickEnhancement?.checked !== false,
                enableVideoPreview: this.enableListVideoPreview?.checked !== false,
                enableScrollPaging: this.enableScrollPaging?.checked || false,
                enableListOptimization: true,
                previewDelay: parseInt(this.previewDelay?.value || '1000', 10),
                previewVolume: parseFloat(this.previewVolume?.value || '0.2'),
                enableRightClickBackground: true,
            },
            actorEnhancement: {
                enabled: this.enableActorEnhancement.checked,
                autoApplyTags: this.enableAutoApplyTags?.checked !== false,
                defaultTags: this.actorDefaultTagInputs && this.actorDefaultTagInputs.length > 0
                    ? Array.from(this.actorDefaultTagInputs).filter((i: HTMLInputElement) => i.checked).map(i => i.value)
                    : ['s', 'd'],
                defaultSortType: 0,
            },
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        const dataEnhancement = settings.dataEnhancement;
        const userExperience = settings.userExperience;
        const anchorOptimization = settings.anchorOptimization;
        const listEnhancement = settings.listEnhancement || { enabled: true, enableClickEnhancement: true, enableVideoPreview: true, enableScrollPaging: false, enableListOptimization: true, previewDelay: 1000, previewVolume: 0.2, enableRightClickBackground: true };

        // 数据增强设置
        this.enableTranslation.checked = dataEnhancement?.enableTranslation || false;
        this.cacheExpiration.value = String(dataEnhancement?.cacheExpiration || 24);

        // 用户体验增强设置
        this.enableContentFilter.checked = userExperience?.enableContentFilter || false;
        this.enableMagnetSearch.checked = userExperience?.enableMagnetSearch || false;
        this.enableAnchorOptimization.checked = userExperience?.enableAnchorOptimization || false;
        if (userExperience?.enableListEnhancement !== undefined) {
            this.enableListEnhancement.checked = userExperience.enableListEnhancement;
        }
        if (userExperience?.enableActorEnhancement !== undefined) {
            this.enableActorEnhancement.checked = userExperience.enableActorEnhancement;
        }

        // 磁力搜索源配置
        this.magnetSourceSukebei.checked = true; // 默认启用
        this.magnetSourceBtdig.checked = true; // 默认启用
        this.magnetSourceBtsow.checked = true; // 默认启用
        this.magnetSourceTorrentz2.checked = false; // 默认禁用

        // 锚点优化配置
        if (anchorOptimization) {
            if (anchorOptimization.buttonPosition && this.anchorButtonPosition) {
                this.anchorButtonPosition.value = anchorOptimization.buttonPosition;
            }
            if (anchorOptimization.showPreviewButton !== undefined && this.showPreviewButton) {
                this.showPreviewButton.checked = anchorOptimization.showPreviewButton;
            }
        }

        // 列表增强配置
        if (this.enableClickEnhancement) this.enableClickEnhancement.checked = listEnhancement.enableClickEnhancement !== false;
        if (this.enableListVideoPreview) this.enableListVideoPreview.checked = listEnhancement.enableVideoPreview !== false;
        if (this.enableScrollPaging) this.enableScrollPaging.checked = listEnhancement.enableScrollPaging || false;
        
        // 演员页增强配置
        const actorEnhancement = settings.actorEnhancement || { enabled: true, autoApplyTags: true, defaultTags: ['s', 'd'], defaultSortType: 0 };
        if (this.enableAutoApplyTags) this.enableAutoApplyTags.checked = actorEnhancement.autoApplyTags !== false;
        if (this.actorDefaultTagInputs && actorEnhancement.defaultTags) {
            this.actorDefaultTagInputs.forEach((input: HTMLInputElement) => {
                input.checked = actorEnhancement.defaultTags.includes(input.value);
            });
        }
        if (this.previewDelay) this.previewDelay.value = String(listEnhancement.previewDelay || 1000);
        if (this.previewVolume) {
            const volumeValue = listEnhancement.previewVolume || 0.2;
            this.previewVolume.value = String(volumeValue);
            const percentage = Math.round(volumeValue * 100);

            if (this.previewVolumeValue) {
                this.previewVolumeValue.textContent = `${percentage}%`;
            }

            // 同步进度条
            const volumeGroup = document.querySelector('.volume-control-group') as HTMLElement;
            const trackFill = volumeGroup?.querySelector('.range-track-fill') as HTMLElement;
            if (trackFill) {
                trackFill.style.width = `${percentage}%`;
                console.log(`[Enhancement] 设置加载时同步音量进度条: ${percentage}%`);
            }
        }

        // 内容过滤规则
        const contentFilter = settings?.contentFilter || { keywordRules: [] };
        this.currentFilterRules = contentFilter.keywordRules || [];
        this.renderFilterRules();

        // 显示/隐藏配置区域
        this.toggleConfigSections();

        // 确保翻译配置的显示状态正确
        if (this.translationConfig) {
            this.translationConfig.style.display = this.enableTranslation.checked ? 'block' : 'none';
        }

        // 翻译配置 UI 回填
        const defaultTranslation = {
            provider: 'traditional' as 'traditional' | 'ai',
            traditional: { service: 'google' as 'google', sourceLanguage: 'ja', targetLanguage: 'zh-CN' },
            ai: { useGlobalModel: true as boolean, customModel: '' as string | undefined }
        };
        const translation = (settings as any).translation || defaultTranslation;
        if (this.translationProviderSel) this.translationProviderSel.value = translation.provider || 'traditional';
        if (this.traditionalServiceSel) this.traditionalServiceSel.value = 'google';
        if (this.traditionalApiKeyGroup) this.traditionalApiKeyGroup.style.display = 'none';
        // 固定使用 AI 设置中的模型，无需本地切换

        if (this.translateCurrentTitleChk) {
            this.translateCurrentTitleChk.checked = !!translation.targets?.currentTitle;
        }
        if (this.translationDisplayModeSel) {
            this.translationDisplayModeSel.value = translation.displayMode || 'append';
        }

        this.applyTranslationProviderUI();
        this.updateAiCurrentModelUI();

        // 初始化功能增强开关
        this.initEnhancementToggles();

        // 强制更新所有滑块状态以确保与存储同步
        this.updateAllToggleStates();
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        return { isValid: true };
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
                const isChecked = hiddenCheckbox.checked;
                console.log(`[Enhancement] 更新滑块状态 ${targetId}: ${isChecked}`);

                if (isChecked) {
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

                // 仅记录可用状态（显示由 hover 控制）
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
     * 悬浮展开/离开折叠 sub-settings
     */
    private setupSubSettingsHoverBehavior(): void {
        if (this.subSettingsHoverInitialized) return;
        this.subSettingsHoverInitialized = true;

        const groups = document.querySelectorAll('#enhancement-settings .form-group');
        groups.forEach(group => {
            const container = group as HTMLElement;
            const sub = container.querySelector('.sub-settings') as HTMLElement | null;
            if (!sub) return;

            // 初始折叠（配合CSS动画）
            sub.style.display = 'block'; // 覆盖HTML中的 inline display:none
            sub.style.maxHeight = '0px';
            sub.classList.remove('is-open');
            // 折叠时移除上下边框，避免占位
            sub.style.borderTopWidth = '0px';
            sub.style.borderBottomWidth = '0px';
            // 折叠时取消上下内边距，避免空白
            sub.style.paddingTop = '0px';
            sub.style.paddingBottom = '0px';

            // 过渡结束后，若处于展开状态，将 max-height 设置为 none，避免内部高度变化导致跳动
            const onTransitionEnd = (ev: TransitionEvent) => {
                if (ev.propertyName !== 'max-height') return;
                if (sub.classList.contains('is-open')) {
                    sub.style.maxHeight = 'none';
                }
            };
            sub.addEventListener('transitionend', onTransitionEnd);

            const openWithIntent = () => {
                // 清除关闭定时器
                const cTimer = this.subSettingsCollapseTimers.get(container);
                if (cTimer) { clearTimeout(cTimer); this.subSettingsCollapseTimers.delete(container); }
                // 开启展开
                sub.classList.add('is-open');
                this.subSettingsOpenedAt.set(container, Date.now());
                // 展开前恢复上下边框与内边距，配合过渡
                sub.style.borderTopWidth = '';
                sub.style.borderBottomWidth = '';
                sub.style.paddingTop = '';
                sub.style.paddingBottom = '';
                // 如果之前设为 none，需要重置为准确高度再展开
                if (sub.style.maxHeight === 'none') {
                    sub.style.maxHeight = `${sub.scrollHeight}px`;
                }
                // 强制 reflow，确保过渡生效
                void sub.offsetHeight;
                const targetHeight = sub.scrollHeight;
                sub.style.maxHeight = `${targetHeight}px`;
            };

            const closeWithDelay = () => {
                // 取消待触发的打开
                const oTimer = this.subSettingsOpenTimers.get(container);
                if (oTimer) { clearTimeout(oTimer); this.subSettingsOpenTimers.delete(container); }
                const minOpenMs = 420;
                const openedAt = this.subSettingsOpenedAt.get(container) || 0;
                const elapsed = Date.now() - openedAt;
                const waitMore = elapsed < minOpenMs ? (minOpenMs - elapsed) : 0;
                const timer = window.setTimeout(() => {
                    // 若当前为 none，先设置为实际高度再收起，确保有动画
                    if (sub.style.maxHeight === 'none') {
                        sub.style.maxHeight = `${sub.scrollHeight}px`;
                        // 进入下一帧再设置为 0，以触发展开到收起的过渡
                        requestAnimationFrame(() => {
                            sub.classList.remove('is-open');
                            sub.style.maxHeight = '0px';
                            sub.style.borderTopWidth = '0px';
                            sub.style.borderBottomWidth = '0px';
                            sub.style.paddingTop = '0px';
                            sub.style.paddingBottom = '0px';
                        });
                    } else {
                        sub.classList.remove('is-open');
                        sub.style.maxHeight = '0px';
                        sub.style.borderTopWidth = '0px';
                        sub.style.borderBottomWidth = '0px';
                        sub.style.paddingTop = '0px';
                        sub.style.paddingBottom = '0px';
                    }
                }, 180 + waitMore);
                this.subSettingsCollapseTimers.set(container, timer);
            };

            container.addEventListener('mouseenter', () => {
                // 轻微延迟，避免抖动
                const timer = window.setTimeout(openWithIntent, 120);
                this.subSettingsOpenTimers.set(container, timer);
            });

            container.addEventListener('mouseleave', () => {
                closeWithDelay();
            });

            // 焦点进入/离开时也维持展开，提升可访问性
            container.addEventListener('focusin', () => openWithIntent());
            container.addEventListener('focusout', () => closeWithDelay());
        });
    }

    /**
     * 处理子设置的显示/隐藏
     */
    private handleSubSettingsToggle(targetId: string, isEnabled: boolean): void {
        // 仅记录可用状态，不直接控制显示（显示由 hover 行为接管）
        const map: Record<string, string> = {
            'enableTranslation': 'translationConfig',
            'veEnableTranslation': 'translationConfig',
            'enableAutoApplyTags': 'actorEnhancementConfig',
            'enableContentFilter': 'contentFilterConfig',
            'enableAnchorOptimization': 'anchorOptimizationConfig',
            'enableMagnetSearch': 'magnetSourcesConfig',
            'enableVideoEnhancement': 'videoEnhancementConfig',
        };
        const subSettingsId = map[targetId];
        if (!subSettingsId) return;
        const subSettings = document.getElementById(subSettingsId);
        if (subSettings) {
            subSettings.setAttribute('data-enabled', isEnabled ? '1' : '0');
        }
    }

    /**
     * 更新翻译配置可见性
     */
    private updateTranslationConfigVisibility(): void {
        if (!this.translationConfig) return;
        const enabled = (this.veEnableTranslation?.checked === true) || (this.enableTranslation?.checked === true);
        this.translationConfig.setAttribute('data-enabled', enabled ? '1' : '0');
        this.translationConfig.style.display = 'none';
    }

    /**
     * 处理翻译服务切换
     */
    private onTranslationProviderChange(): void {
        this.applyTranslationProviderUI();
        // 更新"当前使用"标签
        if (this.currentTranslationServiceLabel) {
            const isAI = this.translationProviderSel?.value === 'ai';
            this.currentTranslationServiceLabel.textContent = isAI ? 'AI 翻译' : 'Google 翻译';
        }
        // 若切AI，刷新模型显示
        if (this.translationProviderSel?.value === 'ai') {
            this.updateAiCurrentModelUI();
        }
        this.handleSettingChange();
    }

    /**
     * 传统服务切换（目前仅 Google）
     */
    private onTraditionalServiceChange(): void {
        // 只有 Google，无需 API Key
        if (this.traditionalApiKeyGroup) this.traditionalApiKeyGroup.style.display = 'none';
        this.handleSettingChange();
    }

    // 本地不再切换 AI 模型，直接使用 AI 设置中的模型

    /**
     * 应用翻译服务 UI 显示
     */
    private applyTranslationProviderUI(): void {
        const isAI = this.translationProviderSel?.value === 'ai';
        if (this.traditionalConfigContainer) this.traditionalConfigContainer.style.display = isAI ? 'none' : 'block';
        if (this.aiConfigContainer) this.aiConfigContainer.style.display = isAI ? 'block' : 'none';
    }

    /**
     * 更新 AI 当前模型显示
     */
    private async updateAiCurrentModelUI(): Promise<void> {
        try {
            if (!this.aiCurrentModelLabel || !this.aiModelEmptyTip) return;
            const ai = aiService.getSettings();
            const model = (ai?.selectedModel || '').trim();
            this.aiCurrentModelLabel.textContent = model || '未设置';
            this.aiModelEmptyTip.style.display = model ? 'none' : 'block';
        } catch (e) {
            console.warn('[Enhancement] 获取AI当前模型失败:', e);
        }
    }

    /**
     * 跳转到 AI 设置
     */
    private navigateToAISettings(): void {
        try {
            // 切换到设置- AI 设置子页面
            window.location.hash = '#tab-settings/ai-settings';
            // 触发设置子页面切换事件，确保立即切换
            window.dispatchEvent(new CustomEvent('settingsSubSectionChange' as any, { detail: { section: 'ai-settings' } }));
        } catch (e) {
            console.warn('[Enhancement] 跳转 AI 设置失败:', e);
        }
    }

    /**
     * 切换配置区域显示/隐藏
     */
    private toggleConfigSections(): void {
        // 磁力搜索源配置（仅标记状态，显示交给 hover 动画）
        if (this.magnetSourcesConfig) {
            this.magnetSourcesConfig.setAttribute('data-enabled', this.enableMagnetSearch.checked ? '1' : '0');
            this.magnetSourcesConfig.style.display = 'block';
        }

        // 内容过滤配置（仅标记状态，显示交给 hover 动画）
        if (this.contentFilterConfig) {
            this.contentFilterConfig.setAttribute('data-enabled', this.enableContentFilter.checked ? '1' : '0');
            this.contentFilterConfig.style.display = 'block';
        }

        // 锚点优化配置（仅标记状态，显示交给 hover 动画）
        if (this.anchorOptimizationConfig) {
            this.anchorOptimizationConfig.setAttribute('data-enabled', this.enableAnchorOptimization.checked ? '1' : '0');
            this.anchorOptimizationConfig.style.display = 'block';
        }

        // 列表/影片/演员子配置交由 hover 控制
        if (this.videoEnhancementConfig) {
            const enabled = (
                this.veEnableCoverImage?.checked === true ||
                this.enableTranslation?.checked === true ||
                this.veEnableRating?.checked === true ||
                this.veEnableActorInfo?.checked === true ||
                this.veShowLoadingIndicator?.checked === true
            );
            this.videoEnhancementConfig.setAttribute('data-enabled', enabled ? '1' : '0');
            this.videoEnhancementConfig.style.display = 'block';
        }
        const actorAutoApplyConfig = document.getElementById('actorAutoApplyConfig');
        if (actorAutoApplyConfig) {
            actorAutoApplyConfig.setAttribute('data-enabled', this.enableAutoApplyTags?.checked ? '1' : '0');
            actorAutoApplyConfig.style.display = 'block';
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
        const volumeFloat = parseFloat(value);
        const percentage = Math.round(volumeFloat * 100);

        console.log(`[Enhancement] 音量变化: ${percentage}%`);

        // 更新百分比显示
        if (this.previewVolumeValue) {
            this.previewVolumeValue.textContent = `${percentage}%`;
        }

        // 更新进度条宽度
        const volumeGroup = document.querySelector('.volume-control-group') as HTMLElement;
        const trackFill = volumeGroup?.querySelector('.range-track-fill') as HTMLElement;
        if (trackFill) {
            trackFill.style.width = `${percentage}%`;
            console.log(`[Enhancement] 进度条宽度更新为: ${trackFill.style.width}`);
        } else {
            console.warn('[Enhancement] 未找到进度条元素，无法更新宽度');
        }

        // 立即通知内容脚本音量已更改
        this.notifyVolumeChange(volumeFloat);

        this.handleSettingChange();
    }

    /**
     * 通知内容脚本音量已更改
     */
    private notifyVolumeChange(volume: number): void {
        // 通知所有JavDB标签页音量已更改
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ url: '*://javdb.com/*' }, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.id) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'volume-changed',
                            volume: volume
                        }).catch(() => {
                            // 忽略无法发送消息的标签页（可能已关闭或未加载扩展）
                        });
                    }
                });
            });
        }
    }

    /**
     * 渲染过滤规则列表
     */
    private renderFilterRules(): void {
        if (!this.filterRulesList) return;

        this.filterRulesList.innerHTML = '';

        if (this.currentFilterRules.length === 0) {
            this.filterRulesList.innerHTML = `
                <div class="empty-state">
                    <p>暂无过滤规则</p>
                    <p class="text-muted">点击"添加规则"按钮创建第一个过滤规则</p>
                </div>
            `;
            return;
        }

        this.currentFilterRules.forEach((rule, index) => {
            const ruleElement = this.createFilterRuleElement(rule, index);
            this.filterRulesList.appendChild(ruleElement);
        });
    }

    /**
     * 创建过滤规则元素
     */
    private createFilterRuleElement(rule: KeywordFilterRule, index: number): HTMLElement {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'filter-rule-item';
        ruleDiv.innerHTML = `
            <div class="rule-header">
                <span class="rule-name">${rule.name}</span>
                <div class="rule-actions">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-rule" data-index="${index}">
                        编辑
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-rule" data-index="${index}">
                        删除
                    </button>
                </div>
            </div>
            <div class="rule-details">
                <div class="rule-info">
                    <span class="badge ${rule.enabled ? 'badge-success' : 'badge-secondary'}">
                        ${rule.enabled ? '启用' : '禁用'}
                    </span>
                    <span class="rule-type">字段: ${this.getFilterFieldsText(rule.fields)}</span>
                    <span class="rule-action">动作: ${this.getFilterActionText(rule.action)}</span>
                </div>
                <div class="rule-keywords">
                    <strong>关键词:</strong> ${rule.keyword}
                </div>
                ${rule.message ? `<div class="rule-description">${rule.message}</div>` : ''}
            </div>
        `;

        // 绑定事件
        const editBtn = ruleDiv.querySelector('.edit-rule') as HTMLButtonElement;
        const deleteBtn = ruleDiv.querySelector('.delete-rule') as HTMLButtonElement;

        if (editBtn) {
            console.log(`[Enhancement] 绑定编辑按钮事件，规则索引: ${index}`);
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`[Enhancement] 编辑按钮被点击，规则索引: ${index}`);
                this.editFilterRule(index);
            });
        } else {
            console.error(`[Enhancement] 未找到编辑按钮，规则索引: ${index}`);
        }

        if (deleteBtn) {
            console.log(`[Enhancement] 绑定删除按钮事件，规则索引: ${index}`);
            deleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`[Enhancement] 删除按钮被点击，规则索引: ${index}`);

                // 直接调用删除方法，添加更多调试信息
                try {
                    await this.deleteFilterRule(index);
                } catch (error) {
                    console.error(`[Enhancement] 删除规则时出错:`, error);
                    showMessage('删除规则时出错，请检查控制台', 'error');
                }
            });
        } else {
            console.error(`[Enhancement] 未找到删除按钮，规则索引: ${index}`);
        }

        return ruleDiv;
    }

    /**
     * 获取过滤字段文本
     */
    private getFilterFieldsText(fields: string[]): string {
        const fieldMap: Record<string, string> = {
            'title': '标题',
            'actor': '演员',
            'studio': '厂商',
            'genre': '类型',
            'tag': '标签',
            'video-id': '番号'
        };
        return fields.map(field => fieldMap[field] || field).join(', ');
    }

    /**
     * 获取过滤动作文本
     */
    private getFilterActionText(action: string): string {
        const actionMap: Record<string, string> = {
            'hide': '隐藏',
            'highlight': '高亮',
            'blur': '模糊',
            'mark': '标记'
        };
        return actionMap[action] || action;
    }

    /**
     * 添加过滤规则
     */
    private addFilterRule(): void {
        console.log('[Enhancement] 添加过滤规则按钮被点击');
        try {
            this.openFilterRuleModal();
        } catch (error) {
            console.error('[Enhancement] 显示内联编辑器时出错:', error);
            showMessage('显示编辑器时出错，请检查控制台', 'error');
        }
    }

    /**
     * 编辑过滤规则
     */
    private editFilterRule(index: number): void {
        console.log(`[Enhancement] 编辑过滤规则按钮被点击，索引: ${index}`);
        const rule = this.currentFilterRules[index];
        if (!rule) {
            console.error(`[Enhancement] 未找到索引为 ${index} 的过滤规则`);
            showMessage('未找到要编辑的规则', 'error');
            return;
        }
        console.log(`[Enhancement] 编辑规则: ${rule.name}`);
        try {
            this.openFilterRuleModal(rule, index);
        } catch (error) {
            console.error('[Enhancement] 显示内联编辑器时出错:', error);
            showMessage('显示内联编辑器时出错，请检查控制台', 'error');
        }
    }

    /**
     * 打开规则弹窗
     */
    private openFilterRuleModal(rule?: KeywordFilterRule, index?: number): void {
        const modal = document.getElementById('filterRuleModal');
        if (!modal) {
            console.warn('[Enhancement] 未找到过滤规则弹窗节点');
            return;
        }

        // 标题
        const title = document.getElementById('filterRuleModalTitle');
        if (title) title.textContent = rule ? '编辑过滤规则' : '添加过滤规则';

        // 填充字段
        (document.getElementById('modalInlineRuleName') as HTMLInputElement).value = rule?.name || '';
        (document.getElementById('modalInlineRuleKeyword') as HTMLInputElement).value = rule?.keyword || '';
        (document.getElementById('modalInlineRuleAction') as HTMLSelectElement).value = rule?.action || 'hide';

        const fieldsSel = document.getElementById('modalInlineRuleFields') as HTMLSelectElement;
        if (fieldsSel) {
            Array.from(fieldsSel.options).forEach(opt => {
                opt.selected = !!rule?.fields?.includes(opt.value as any);
            });
        }

        (document.getElementById('modalInlineRuleIsRegex') as HTMLInputElement).checked = !!rule?.isRegex;
        (document.getElementById('modalInlineRuleCaseSensitive') as HTMLInputElement).checked = !!rule?.caseSensitive;
        (document.getElementById('modalInlineRuleEnabled') as HTMLInputElement).checked = rule?.enabled !== false;
        (document.getElementById('modalInlineRuleMessage') as HTMLTextAreaElement).value = rule?.message || '';

        // 事件绑定（先移除旧的）
        const closeBtn = document.getElementById('filterRuleModalClose');
        const cancelBtn = document.getElementById('cancelFilterRuleBtn');
        const saveBtn = document.getElementById('saveFilterRuleBtn');

        const hide = () => { modal.classList.remove('visible'); modal.classList.add('hidden'); };
        closeBtn?.addEventListener('click', hide, { once: true });
        cancelBtn?.addEventListener('click', hide, { once: true });

        saveBtn?.addEventListener('click', () => {
            this.saveFilterRuleFromModal(index);
            hide();
        }, { once: true });

        // 显示
        modal.classList.remove('hidden');
        modal.classList.add('visible');
    }

    /** 保存弹窗中的规则 */
    private saveFilterRuleFromModal(index?: number): void {
        const name = (document.getElementById('modalInlineRuleName') as HTMLInputElement).value.trim();
        const fieldsSelect = document.getElementById('modalInlineRuleFields') as HTMLSelectElement;
        const action = (document.getElementById('modalInlineRuleAction') as HTMLSelectElement).value;
        const keyword = (document.getElementById('modalInlineRuleKeyword') as HTMLInputElement).value.trim();
        const isRegex = (document.getElementById('modalInlineRuleIsRegex') as HTMLInputElement).checked;
        const caseSensitive = (document.getElementById('modalInlineRuleCaseSensitive') as HTMLInputElement).checked;
        const enabled = (document.getElementById('modalInlineRuleEnabled') as HTMLInputElement).checked;
        const message = (document.getElementById('modalInlineRuleMessage') as HTMLTextAreaElement).value.trim();

        if (!name) { showMessage('请输入规则名称', 'error'); return; }
        if (!keyword) { showMessage('请输入关键词', 'error'); return; }
        if (!action) { showMessage('请选择过滤动作', 'error'); return; }

        const selectedFields = Array.from(fieldsSelect.selectedOptions).map(option => option.value) as ('title' | 'actor' | 'studio' | 'genre' | 'tag' | 'video-id')[];
        if (selectedFields.length === 0) { showMessage('请至少选择一个过滤字段', 'error'); return; }

        const rule: KeywordFilterRule = {
            id: typeof index === 'number' ? this.currentFilterRules[index].id : Date.now().toString(),
            name,
            keyword,
            fields: selectedFields,
            action: action as 'hide' | 'highlight' | 'blur' | 'mark',
            isRegex,
            caseSensitive,
            enabled,
            message: message || undefined
        };

        if (typeof index === 'number') {
            this.currentFilterRules[index] = rule;
            showMessage(`过滤规则 "${rule.name}" 已更新`, 'success');
        } else {
            this.currentFilterRules.push(rule);
            showMessage(`过滤规则 "${rule.name}" 已添加`, 'success');
        }

        this.renderFilterRules();
        this.handleSettingChange();
    }

    /**
     * 删除过滤规则
     */
    private async deleteFilterRule(index: number): Promise<void> {
        console.log(`[Enhancement] deleteFilterRule 被调用，索引: ${index}`);

        const rule = this.currentFilterRules[index];
        if (!rule) {
            console.error(`[Enhancement] 未找到索引为 ${index} 的规则`);
            showMessage('未找到要删除的规则', 'error');
            return;
        }

        console.log(`[Enhancement] 准备删除规则: ${rule.name}`);

        let confirmed = false;

        try {
            // 首先尝试使用美观的确认弹窗
            const { showDanger } = await import('../../../components/confirmModal');
            confirmed = await showDanger(
                `确定要删除过滤规则 "${rule.name}" 吗？\n\n关键词: ${rule.keyword}\n动作: ${this.getFilterActionText(rule.action)}\n\n此操作不可撤销！`,
                '删除过滤规则'
            );
            console.log(`[Enhancement] showDanger 返回结果: ${confirmed}`);
        } catch (error) {
            // 如果美观弹窗失败，使用原生确认对话框作为备选方案
            console.warn('[Enhancement] showDanger 失败，使用原生确认对话框', error);
            confirmed = confirm(
                `确定要删除过滤规则 "${rule.name}" 吗？\n\n关键词: ${rule.keyword}\n动作: ${this.getFilterActionText(rule.action)}\n\n此操作不可撤销！`
            );
            console.log(`[Enhancement] 原生confirm 返回结果: ${confirmed}`);
        }

        if (confirmed) {
            try {
                console.log(`[Enhancement] 开始删除规则: ${rule.name}`);
                this.currentFilterRules.splice(index, 1);
                console.log(`[Enhancement] 规则已从数组中移除，剩余规则数量: ${this.currentFilterRules.length}`);

                this.renderFilterRules();
                console.log(`[Enhancement] 规则列表已重新渲染`);

                this.handleSettingChange();
                console.log(`[Enhancement] 设置变更已处理`);

                showMessage(`过滤规则 "${rule.name}" 已删除`, 'success');
                console.log(`[Enhancement] 删除成功消息已显示`);
            } catch (error) {
                console.error('[Enhancement] 删除规则过程中出错:', error);
                showMessage('删除规则时出错，请检查控制台', 'error');
            }
        } else {
            console.log(`[Enhancement] 用户取消删除规则: ${rule.name}`);
        }
    }

    /**
     * 强制更新所有滑块状态
     */
    private updateAllToggleStates(): void {
        console.log('[Enhancement] 强制更新所有滑块状态');

        const toggleMappings = [
            { toggleSelector: '[data-target="enableTranslation"]', checkbox: this.enableTranslation },
            { toggleSelector: '[data-target="enableContentFilter"]', checkbox: this.enableContentFilter },
            { toggleSelector: '[data-target="enableMagnetSearch"]', checkbox: this.enableMagnetSearch },
            { toggleSelector: '[data-target="enableAnchorOptimization"]', checkbox: this.enableAnchorOptimization },
            { toggleSelector: '[data-target="enableListEnhancement"]', checkbox: this.enableListEnhancement },
            // 列表页增强子项
            { toggleSelector: '[data-target="enableClickEnhancement"]', checkbox: this.enableClickEnhancement },
            { toggleSelector: '[data-target="enableVideoPreview"]', checkbox: this.enableListVideoPreview },
            { toggleSelector: '[data-target="enableScrollPaging"]', checkbox: this.enableScrollPaging },
            { toggleSelector: '[data-target="enableAutoApplyTags"]', checkbox: this.enableAutoApplyTags }
        ];

        toggleMappings.forEach(({ toggleSelector, checkbox }) => {
            const toggle = document.querySelector(toggleSelector) as HTMLElement;
            if (toggle && checkbox) {
                console.log(`[Enhancement] 更新滑块 ${toggleSelector}: ${checkbox.checked}`);
                if (checkbox.checked) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }

                // 同时更新子设置的显示状态
                const targetId = toggle.getAttribute('data-target');
                if (targetId) {
                    this.handleSubSettingsToggle(targetId, checkbox.checked);
                }
            } else {
                console.warn(`[Enhancement] 未找到滑块或checkbox: ${toggleSelector}`);
            }
        });
    }

    /**
     * 切换子标签显示
     */
    private switchSubtab(sub: 'list' | 'video' | 'actor'): void {
        this.currentSubtab = sub;
        try { localStorage.setItem('enhancementSubtab', sub); } catch {}

        // 更新按钮状态
        if (this.subtabLinks && this.subtabLinks.length > 0) {
            this.subtabLinks.forEach(btn => {
                if (btn.getAttribute('data-subtab') === sub) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        // 控制所有带 data-subtab 的元素显示/隐藏（仅限内容区域，排除顶部子标签按钮）
        const subtabElements = document.querySelectorAll('#enhancement-settings .settings-panel-body [data-subtab]');
        subtabElements.forEach(el => {
            const elem = el as HTMLElement;
            const attr = elem.getAttribute('data-subtab');
            elem.style.display = (attr === sub) ? '' : 'none';
        });

        // 读取并应用每个 section 的折叠状态
        const sectionIds = ['listEnhancementConfig','videoEnhancementConfig','actorAutoApplyConfig','actorDefaultTagsConfig'];
        sectionIds.forEach(id => {
            const section = document.getElementById(id);
            if (!section) return;
            try {
                const key = `enhancementSectionCollapsed:${id}`;
                const collapsed = localStorage.getItem(key) === '1';
                section.classList.toggle('collapsed', collapsed);
            } catch {}
        });
    }

    /**
     * 设置复选框组样式支持
     * 为不支持CSS :has()选择器的浏览器提供JavaScript支持
     */
    private setupCheckboxGroupStyles(): void {
        // 查找所有复选框组中的复选框
        const checkboxGroups = document.querySelectorAll('.form-group.checkbox-group');

        checkboxGroups.forEach(group => {
            const checkboxes = group.querySelectorAll('input[type="checkbox"]');

            checkboxes.forEach(checkbox => {
                const label = checkbox.closest('.checkbox-label');
                if (!label) return;

                // 初始化状态
                this.updateCheckboxLabelState(checkbox as HTMLInputElement, label as HTMLElement);

                // 监听变化
                checkbox.addEventListener('change', () => {
                    this.updateCheckboxLabelState(checkbox as HTMLInputElement, label as HTMLElement);
                });
            });
        });
    }

    /**
     * 更新复选框标签状态
     */
    private updateCheckboxLabelState(checkbox: HTMLInputElement, label: HTMLElement): void {
        if (checkbox.checked) {
            label.classList.add('checked');
        } else {
            label.classList.remove('checked');
        }
    }

    /**
     * 设置锚点配置样式支持
     * 为不支持CSS :has()选择器的浏览器提供JavaScript支持
     */
    private setupAnchorConfigStyles(): void {
        // 查找锚点配置容器
        const anchorConfigContainer = document.querySelector('.anchor-config-container');
        if (!anchorConfigContainer) return;

        // 处理滑块开关
        const toggleInput = anchorConfigContainer.querySelector('#showPreviewButton') as HTMLInputElement;
        if (toggleInput) {
            const option = toggleInput.closest('.anchor-config-option');
            if (option) {
                // 初始化状态
                this.updateAnchorConfigState(toggleInput, option as HTMLElement);

                // 监听变化
                toggleInput.addEventListener('change', () => {
                    this.updateAnchorConfigState(toggleInput, option as HTMLElement);
                });
            }
        }

        // 处理下拉框
        const selectInput = anchorConfigContainer.querySelector('#anchorButtonPosition') as HTMLSelectElement;
        if (selectInput) {
            const option = selectInput.closest('.anchor-config-option');
            if (option) {
                // 监听聚焦和失焦
                selectInput.addEventListener('focus', () => {
                    option.classList.add('active');
                });

                selectInput.addEventListener('blur', () => {
                    option.classList.remove('active');
                });

                selectInput.addEventListener('change', () => {
                    // 短暂激活状态以显示变化反馈
                    option.classList.add('active');
                    setTimeout(() => {
                        option.classList.remove('active');
                    }, 1000);
                });
            }
        }
    }

    /**
     * 更新锚点配置选项状态
     */
    private updateAnchorConfigState(input: HTMLInputElement, option: HTMLElement): void {
        if (input.checked) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    }

    /**
     * 设置音量控制样式支持
     * 处理滑块轨道填充效果和交互状态
     */
    private setupVolumeControlStyles(): void {
        console.log('[Enhancement] 开始设置音量控制样式...');

        // 使用更灵活的元素查找方式
        const volumeSlider = document.getElementById('previewVolume') as HTMLInputElement;
        const volumeGroup = document.querySelector('.volume-control-group') as HTMLElement;

        if (!volumeSlider) {
            console.warn('[Enhancement] 未找到音量滑块元素 #previewVolume');
            return;
        }

        if (!volumeGroup) {
            console.warn('[Enhancement] 未找到音量控制组元素 .volume-control-group');
            return;
        }

        // 在音量控制组内查找子元素
        const trackFill = volumeGroup.querySelector('.range-track-fill') as HTMLElement;
        const volumeValue = volumeGroup.querySelector('.volume-percentage') as HTMLElement;

        if (!trackFill) {
            console.warn('[Enhancement] 未找到进度条元素 .range-track-fill');
            return;
        }

        if (!volumeValue) {
            console.warn('[Enhancement] 未找到百分比显示元素 .volume-percentage');
            return;
        }

        console.log('[Enhancement] 所有音量控制元素找到，开始绑定事件...');

        // 更新轨道填充和百分比显示
        const updateTrackFill = () => {
            const value = parseFloat(volumeSlider.value);
            const percentage = Math.round(value * 100);

            trackFill.style.width = `${percentage}%`;
            volumeValue.textContent = `${percentage}%`;

            console.log(`[Enhancement] 音量更新: ${percentage}%, 进度条宽度: ${trackFill.style.width}`);
        };

        // 初始化轨道填充和百分比显示
        updateTrackFill();

        // 延迟再次同步，确保设置加载完成后的同步
        setTimeout(() => {
            updateTrackFill();
            console.log('[Enhancement] 延迟同步音量显示完成');
        }, 500);

        // 监听滑块变化
        volumeSlider.addEventListener('input', () => {
            console.log('[Enhancement] 音量滑块input事件触发');
            updateTrackFill();

            // 添加激活状态
            volumeGroup.classList.add('active');

            // 短暂移除激活状态
            if (this.volumeActiveTimeout) {
                clearTimeout(this.volumeActiveTimeout);
            }
            this.volumeActiveTimeout = setTimeout(() => {
                volumeGroup.classList.remove('active');
            }, 1000);
        });

        // 监听滑块变化（change事件作为备用）
        volumeSlider.addEventListener('change', () => {
            console.log('[Enhancement] 音量滑块change事件触发');
            updateTrackFill();
        });

        // 监听鼠标按下和释放
        volumeSlider.addEventListener('mousedown', () => {
            console.log('[Enhancement] 音量滑块mousedown事件');
            volumeGroup.classList.add('active');
        });

        volumeSlider.addEventListener('mouseup', () => {
            console.log('[Enhancement] 音量滑块mouseup事件');
            if (this.volumeActiveTimeout) {
                clearTimeout(this.volumeActiveTimeout);
            }
            this.volumeActiveTimeout = setTimeout(() => {
                volumeGroup.classList.remove('active');
            }, 500);
        });

        // 监听聚焦和失焦
        volumeSlider.addEventListener('focus', () => {
            console.log('[Enhancement] 音量滑块focus事件');
            volumeGroup.classList.add('active');
        });

        volumeSlider.addEventListener('blur', () => {
            console.log('[Enhancement] 音量滑块blur事件');
            if (this.volumeActiveTimeout) {
                clearTimeout(this.volumeActiveTimeout);
            }
            this.volumeActiveTimeout = setTimeout(() => {
                volumeGroup.classList.remove('active');
            }, 300);
        });

        console.log('[Enhancement] 音量控制样式设置完成');
    }

    private volumeActiveTimeout: ReturnType<typeof setTimeout> | null = null;

    /**
     * 加载上次应用的标签
     */
    private async loadLastAppliedTags(): Promise<void> {
        try {
            const lastAppliedTags = await getValue('lastAppliedActorTags', '');
            if (lastAppliedTags && this.appliedTagsContainer) {
                this.displayAppliedTags(lastAppliedTags);
            }
        } catch (error) {
            console.error('[Enhancement] 加载上次应用标签失败:', error);
        }
    }

    /**
     * 显示已应用的标签
     */
    private displayAppliedTags(tagsString: string): void {
        if (!this.appliedTagsContainer) return;

        if (!tagsString) {
            this.appliedTagsContainer.innerHTML = '<span class="no-tags-message">暂无记录</span>';
            return;
        }

        const tags = tagsString.split(',').filter(tag => tag.trim());
        const tagNames: { [key: string]: string } = {
            's': '单体作品',
            'd': '含磁链',
            'c': '含字幕',
            'b': '可播放',
            '4k': '4K',
            'uncensored': '无码流出'
        };

        const tagElements = tags.map(tag => {
            const tagName = tagNames[tag] || tag;
            return `<span class="applied-tag">${tagName}</span>`;
        }).join('');

        this.appliedTagsContainer.innerHTML = tagElements;
    }

    /**
     * 初始化演员页增强事件监听器
     */
    private initializeActorEnhancementEvents(): void {
        // 清除上次应用标签
        if (this.clearLastAppliedTags) {
            this.clearLastAppliedTags.addEventListener('click', async () => {
                await setValue('lastAppliedActorTags', '');
                this.displayAppliedTags('');
            });
        }

        // 导出配置
        if (this.exportActorConfig) {
            this.exportActorConfig.addEventListener('click', () => {
                this.exportActorConfiguration();
            });
        }

        // 导入配置
        if (this.importActorConfig) {
            this.importActorConfig.addEventListener('click', () => {
                this.actorConfigFileInput?.click();
            });
        }

        // 文件选择处理
        if (this.actorConfigFileInput) {
            this.actorConfigFileInput.addEventListener('change', (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                    this.importActorConfiguration(file);
                }
            });
        }
    }

    /**
     * 导出演员页配置
     */
    private async exportActorConfiguration(): Promise<void> {
        try {
            const config = {
                actorTagFilters: await getValue('actorTagFilters', '{}'),
                lastAppliedActorTags: await getValue('lastAppliedActorTags', ''),
                actorEnhancement: STATE.settings?.actorEnhancement || {},
                exportTime: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `javdb-actor-config-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[Enhancement] 导出配置失败:', error);
            alert('导出配置失败，请检查控制台错误信息');
        }
    }

    /**
     * 导入演员页配置
     */
    private async importActorConfiguration(file: File): Promise<void> {
        try {
            const text = await file.text();
            const config = JSON.parse(text);

            // 验证配置格式
            if (!config.actorTagFilters && !config.lastAppliedActorTags && !config.actorEnhancement) {
                throw new Error('无效的配置文件格式');
            }

            // 导入数据
            if (config.actorTagFilters) {
                await setValue('actorTagFilters', config.actorTagFilters);
            }
            if (config.lastAppliedActorTags) {
                await setValue('lastAppliedActorTags', config.lastAppliedActorTags);
                this.displayAppliedTags(config.lastAppliedActorTags);
            }
            if (config.actorEnhancement) {
                // 更新设置并重新加载
                STATE.settings = { ...STATE.settings, actorEnhancement: config.actorEnhancement };
                await this.doLoadSettings();
            }

            alert('配置导入成功！');
        } catch (error) {
            console.error('[Enhancement] 导入配置失败:', error);
            alert('导入配置失败：' + (error as Error).message);
        }
    }
}

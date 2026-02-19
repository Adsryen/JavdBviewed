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
import { ACTOR_FILTER_TAGS, getDefaultTags, getTagByValue } from '../../../config/actorFilterTags';

/**
 * 功能增强设置面板类
 */
export class EnhancementSettings extends BaseSettingsPanel {
    // 数据增强功能元素
    private enableTranslation!: HTMLInputElement;

    // 用户体验增强元素
    private enableContentFilter!: HTMLInputElement;
    private enableMagnetSearch!: HTMLInputElement;
    private enableAnchorOptimization!: HTMLInputElement;
    private enableListEnhancement!: HTMLInputElement;
    private enableActorEnhancement!: HTMLInputElement;
    private enableVideoEnhancement!: HTMLInputElement;

    // 影片页增强子项
    private veEnableCoverImage!: HTMLInputElement;
    private veShowLoadingIndicator!: HTMLInputElement;
    private veEnableReviewBreaker!: HTMLInputElement;
    private veEnableFC2Breaker!: HTMLInputElement;
    private veEnableActorRemarks!: HTMLInputElement;
    private veActorRemarksMode!: HTMLSelectElement;
    private veActorRemarksTTL!: HTMLInputElement;
    // 新增：状态标记增强子项
    private veEnableWantSync!: HTMLInputElement;
    private veAutoMarkWatchedAfter115!: HTMLInputElement;

    // 磁力搜索源配置
    private magnetSourceSukebei!: HTMLInputElement;
    private magnetSourceBtdig!: HTMLInputElement;
    private magnetSourceBtsow!: HTMLInputElement;
    private magnetSourceTorrentz2!: HTMLInputElement;
    // 磁力搜索并发与限流配置
    private magnetPageMaxConcurrentRequests!: HTMLInputElement;
    private magnetBgGlobalMaxConcurrent!: HTMLInputElement;
    private magnetBgPerHostMaxConcurrent!: HTMLInputElement;
    private magnetBgPerHostRateLimitPerMin!: HTMLInputElement;

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
    // 演员水印配置
    private enableActorWatermark!: HTMLInputElement;
    private actorWatermarkPosition!: HTMLSelectElement;
    private actorWatermarkOpacity!: HTMLInputElement;
    private actorWatermarkOpacityValue!: HTMLSpanElement;

    // 演员页增强配置
    private enableAutoApplyTags!: HTMLInputElement;
    private actorDefaultTagInputs!: NodeListOf<HTMLInputElement>;
    private actorEnhancementConfig!: HTMLElement;
    private lastAppliedTagsDisplay!: HTMLElement;
    private appliedTagsContainer!: HTMLElement;
    private clearLastAppliedTags!: HTMLButtonElement;
    // 新增：演员页 影片分段显示
    private aeEnableTimeSegmentationDivider!: HTMLInputElement;
    private aeTimeSegmentationMonths!: HTMLInputElement;

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

    // 合并翻译开关：高级选项已移除（仅保留单一全局开关）

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

    // 编排可视化相关
    private showOrchestratorBtn!: HTMLButtonElement | null;
    private orchestratorModal!: HTMLElement | null;
    private orchestratorModalClose!: HTMLButtonElement | null;
    private orchestratorCloseBtn!: HTMLButtonElement | null;
    private orchestratorRefreshBtn!: HTMLButtonElement | null;
    private orchestratorOpenJavdbBtn!: HTMLButtonElement | null;
    private orchestratorFullscreenBtn!: HTMLButtonElement | null;
    private orchestratorCopyPhasesBtn!: HTMLButtonElement | null;
    private orchestratorCopyTimelineBtn!: HTMLButtonElement | null;
    private orchestratorPhases!: HTMLElement | null;
    private orchestratorTimeline!: HTMLElement | null;
    private orchestratorSummary!: HTMLElement | null;
    private orchestratorRuntimeListener?: (msg: any, sender: any, sendResponse: any) => void;
    private orchFilterStatusSel!: HTMLSelectElement | null;
    private orchFilterPhaseSel!: HTMLSelectElement | null;
    private orchFilterSearchInput!: HTMLInputElement | null;
    private orchViewModeSel!: HTMLSelectElement | null;
    private orchestratorTimelineData: Array<{ phase: string; label: string; status: string; ts: number; detail?: any; durationMs?: number }> = [];

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
     * 动态注入“磁力资源搜索”的并发与限流配置 UI（避免直接修改 settings.html）
     */
    private injectMagnetConcurrencyControls(): void {
        try {
            const container = document.getElementById('magnetSourcesConfig');
            if (!container) return;
            if (document.getElementById('magnetConcurrencyConfig')) return; // 已存在则跳过

            const section = document.createElement('div');
            section.className = 'magnet-concurrency-config';
            section.id = 'magnetConcurrencyConfig';

            // 头部
            const header = document.createElement('div');
            header.className = 'sub-settings-header';
            header.innerHTML = `
                <h5>⚙️ 并发与限流</h5>
                <p class="sub-description">控制磁力搜索的并发与后台限流策略，避免同时打开多个页面时产生突发流量。</p>
            `;
            section.appendChild(header);

            // 行1：页面内并发 + 后台全局并发
            const row1 = document.createElement('div');
            row1.className = 'form-row';
            row1.innerHTML = `
                <div class="form-group-inline">
                    <label for="magnetPageMaxConcurrentRequests">页面内并发:</label>
                    <input type="number" id="magnetPageMaxConcurrentRequests" class="number-input" min="1" max="8" value="2">
                    <span class="input-suffix">请求</span>
                </div>
                <div class="form-group-inline">
                    <label for="magnetBgGlobalMaxConcurrent">后台全局并发:</label>
                    <input type="number" id="magnetBgGlobalMaxConcurrent" class="number-input" min="1" max="16" value="4">
                    <span class="input-suffix">请求</span>
                </div>
            `;
            section.appendChild(row1);

            // 行2：每域并发 + 每域速率
            const row2 = document.createElement('div');
            row2.className = 'form-row';
            row2.innerHTML = `
                <div class="form-group-inline">
                    <label for="magnetBgPerHostMaxConcurrent">每域并发:</label>
                    <input type="number" id="magnetBgPerHostMaxConcurrent" class="number-input" min="1" max="4" value="1">
                    <span class="input-suffix">请求</span>
                </div>
                <div class="form-group-inline">
                    <label for="magnetBgPerHostRateLimitPerMin">每域速率:</label>
                    <input type="number" id="magnetBgPerHostRateLimitPerMin" class="number-input" min="1" max="120" value="12">
                    <span class="input-suffix">次/分钟</span>
                </div>
            `;
            section.appendChild(row2);

            container.appendChild(section);
        } catch (e) {
            console.warn('[Enhancement] injectMagnetConcurrencyControls failed:', e);
        }
    }

    /**
     * 同步演员水印透明度滑块的显示（数值与轨道填充）
     */
    private handleActorOpacityChange(): void {
        if (!this.actorWatermarkOpacity) return;
        const value = this.actorWatermarkOpacity.value;
        const opacityFloat = parseFloat(value);
        const percentage = Math.round(opacityFloat * 100);
        if (this.actorWatermarkOpacityValue) this.actorWatermarkOpacityValue.textContent = `${percentage}%`;
        const group = this.actorWatermarkOpacity.closest('.volume-control-group') as HTMLElement | null;
        const trackFill = group?.querySelector('.range-track-fill') as HTMLElement | null;
        if (trackFill) trackFill.style.width = `${percentage}%`;
        this.handleSettingChange();
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
     * 动态生成演员页过滤标签复选框
     */
    private renderActorFilterTags(): void {
        const container = document.getElementById('actorDefaultTagsGroup');
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 根据配置生成复选框
        ACTOR_FILTER_TAGS.forEach(tag => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.title = tag.description || '';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = 'actorDefaultTag';
            input.value = tag.value;

            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';

            const text = document.createTextNode(tag.label);

            label.appendChild(input);
            label.appendChild(checkmark);
            label.appendChild(text);
            container.appendChild(label);
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 先动态生成演员页过滤标签
        this.renderActorFilterTags();

        // 数据增强功能元素
        this.enableTranslation = document.getElementById('enableTranslation') as HTMLInputElement;

        // 用户体验增强元素
        this.enableContentFilter = document.getElementById('enableContentFilter') as HTMLInputElement;
        this.enableMagnetSearch = document.getElementById('enableMagnetSearch') as HTMLInputElement;
        this.enableAnchorOptimization = document.getElementById('enableAnchorOptimization') as HTMLInputElement;
        this.enableListEnhancement = document.getElementById('enableListEnhancement') as HTMLInputElement;
        this.enableActorEnhancement = document.getElementById('enableActorEnhancement') as HTMLInputElement;
        this.enableVideoEnhancement = document.getElementById('enableVideoEnhancement') as HTMLInputElement;

        // 演员页增强配置（在动态生成后查询）
        this.enableAutoApplyTags = document.getElementById('enableAutoApplyTags') as HTMLInputElement;
        this.actorDefaultTagInputs = document.querySelectorAll('#actorDefaultTagsGroup input[name="actorDefaultTag"]') as NodeListOf<HTMLInputElement>;
        this.actorEnhancementConfig = document.getElementById('actorEnhancementConfig') as HTMLElement;
        this.lastAppliedTagsDisplay = document.getElementById('lastAppliedTagsDisplay') as HTMLElement;
        this.appliedTagsContainer = document.getElementById('appliedTagsContainer') as HTMLElement;
        this.clearLastAppliedTags = document.getElementById('clearLastAppliedTags') as HTMLButtonElement;
        // 新增：演员页 影片分段显示元素
        this.aeEnableTimeSegmentationDivider = document.getElementById('aeEnableTimeSegmentationDivider') as HTMLInputElement;
        this.aeTimeSegmentationMonths = document.getElementById('aeTimeSegmentationMonths') as HTMLInputElement;

        // 磁力搜索源配置
        this.magnetSourceSukebei = document.getElementById('magnetSourceSukebei') as HTMLInputElement;
        this.magnetSourceBtdig = document.getElementById('magnetSourceBtdig') as HTMLInputElement;
        this.magnetSourceBtsow = document.getElementById('magnetSourceBtsow') as HTMLInputElement;
        this.magnetSourceTorrentz2 = document.getElementById('magnetSourceTorrentz2') as HTMLInputElement;
        // 注入并发与限流控件（若未存在）
        this.injectMagnetConcurrencyControls();
        // 并发与限流配置
        this.magnetPageMaxConcurrentRequests = document.getElementById('magnetPageMaxConcurrentRequests') as HTMLInputElement;
        this.magnetBgGlobalMaxConcurrent = document.getElementById('magnetBgGlobalMaxConcurrent') as HTMLInputElement;
        this.magnetBgPerHostMaxConcurrent = document.getElementById('magnetBgPerHostMaxConcurrent') as HTMLInputElement;
        this.magnetBgPerHostRateLimitPerMin = document.getElementById('magnetBgPerHostRateLimitPerMin') as HTMLInputElement;

        // 锚点优化配置
        this.anchorButtonPosition = document.getElementById('anchorButtonPosition') as HTMLSelectElement;
        this.showPreviewButton = document.getElementById('showPreviewButton') as HTMLInputElement;

        // 列表增强配置
        this.enableClickEnhancement = document.getElementById('enableClickEnhancement') as HTMLInputElement;
        this.enableListVideoPreview = document.getElementById('enableVideoPreview') as HTMLInputElement;
        this.enableScrollPaging = document.getElementById('enableScrollPaging') as HTMLInputElement;
        this.enableActorWatermark = document.getElementById('enableActorWatermark') as HTMLInputElement;
        this.previewDelay = document.getElementById('previewDelay') as HTMLInputElement;
        this.previewVolume = document.getElementById('previewVolume') as HTMLInputElement;
        this.previewVolumeValue = document.getElementById('previewVolumeValue') as HTMLSpanElement;
        
        // 影片页增强子项
        this.veEnableCoverImage = document.getElementById('veEnableCoverImage') as HTMLInputElement;
        this.veShowLoadingIndicator = document.getElementById('veShowLoadingIndicator') as HTMLInputElement;
        this.veEnableReviewBreaker = document.getElementById('veEnableReviewBreaker') as HTMLInputElement;
        this.veEnableFC2Breaker = document.getElementById('veEnableFC2Breaker') as HTMLInputElement;
        this.veEnableActorRemarks = document.getElementById('veEnableActorRemarks') as HTMLInputElement;
        this.veActorRemarksMode = document.getElementById('veActorRemarksMode') as HTMLSelectElement;
        this.veActorRemarksTTL = document.getElementById('veActorRemarksTTL') as HTMLInputElement;
        // 新增：本地同步类子项
        this.veEnableWantSync = document.getElementById('veEnableWantSync') as HTMLInputElement;
        this.veAutoMarkWatchedAfter115 = document.getElementById('veAutoMarkWatchedAfter115') as HTMLInputElement;
        // 演员水印子设置元素
        this.actorWatermarkPosition = document.getElementById('actorWatermarkPosition') as HTMLSelectElement;
        this.actorWatermarkOpacity = document.getElementById('actorWatermarkOpacity') as HTMLInputElement;
        this.actorWatermarkOpacityValue = document.getElementById('actorWatermarkOpacityValue') as HTMLSpanElement;
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

        // 合并翻译开关：高级选项已移除（仅保留单一全局开关）

        // 内容过滤相关元素
        this.addFilterRuleBtn = document.getElementById('addFilterRule') as HTMLButtonElement;
        this.filterRulesList = document.getElementById('filterRulesList') as HTMLElement;

        // 子标签
        this.subtabLinks = document.querySelectorAll('#enhancementSubTabs .subtab-link') as NodeListOf<HTMLButtonElement>;

        // 编排可视化元素
        this.showOrchestratorBtn = document.getElementById('showOrchestratorBtn') as HTMLButtonElement | null;
        this.orchestratorModal = document.getElementById('orchestratorModal');
        this.orchestratorModalClose = document.getElementById('orchestratorModalClose') as HTMLButtonElement | null;
        this.orchestratorCloseBtn = document.getElementById('orchestratorCloseBtn') as HTMLButtonElement | null;
        this.orchestratorRefreshBtn = document.getElementById('orchestratorRefreshBtn') as HTMLButtonElement | null;
        this.orchestratorOpenJavdbBtn = document.getElementById('orchestratorOpenJavdbBtn') as HTMLButtonElement | null;
        this.orchestratorFullscreenBtn = document.getElementById('orchestratorFullscreenBtn') as HTMLButtonElement | null;
        this.orchestratorCopyPhasesBtn = document.getElementById('orchestratorCopyPhasesBtn') as HTMLButtonElement | null;
        this.orchestratorCopyTimelineBtn = document.getElementById('orchestratorCopyTimelineBtn') as HTMLButtonElement | null;
        this.orchestratorPhases = document.getElementById('orchestratorPhases');
        this.orchestratorTimeline = document.getElementById('orchestratorTimeline');
        this.orchestratorSummary = document.getElementById('orchestratorSummary');
        this.orchFilterStatusSel = document.getElementById('orchFilterStatus') as HTMLSelectElement | null;
        this.orchFilterPhaseSel = document.getElementById('orchFilterPhase') as HTMLSelectElement | null;
        this.orchFilterSearchInput = document.getElementById('orchFilterSearch') as HTMLInputElement | null;
        this.orchViewModeSel = document.getElementById('orchViewMode') as HTMLSelectElement | null;

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
        // 并发与限流配置事件监听
        this.magnetPageMaxConcurrentRequests?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetBgGlobalMaxConcurrent?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetBgPerHostMaxConcurrent?.addEventListener('change', this.handleSettingChange.bind(this));
        this.magnetBgPerHostRateLimitPerMin?.addEventListener('change', this.handleSettingChange.bind(this));

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
        this.enableActorWatermark?.addEventListener('change', this.handleSettingChange.bind(this));

        // 影片页增强事件监听
        this.enableVideoEnhancement?.addEventListener('change', this.handleSettingChange.bind(this));

        // 影片页增强子项事件监听（已移除“影片页翻译”独立开关，统一由全局翻译控制）
        this.veEnableCoverImage?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veShowLoadingIndicator?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veEnableReviewBreaker?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veEnableFC2Breaker?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veEnableActorRemarks?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veActorRemarksMode?.addEventListener('change', this.handleSettingChange.bind(this));
        this.veActorRemarksTTL?.addEventListener('change', this.handleSettingChange.bind(this));
        // 新增：本地同步子项

        // 锚点优化配置事件监听
        this.anchorButtonPosition?.addEventListener('change', this.handleSettingChange.bind(this));
        this.showPreviewButton?.addEventListener('change', this.handleSettingChange.bind(this));
        this.actorWatermarkOpacity?.addEventListener('input', () => this.handleActorOpacityChange());

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
        this.setupAnchorConfigStyles();
        this.setupCheckboxGroupStyles();

        // 子标签切换
        if (this.subtabLinks && this.subtabLinks.length > 0) {
            this.subtabLinks.forEach(btn => {
                btn.addEventListener('click', () => {
                    const sub = (btn.getAttribute('data-subtab') || 'list') as 'list' | 'video' | 'actor';
                    this.switchSubtab(sub);
                });
            });
        }

        // 编排可视化按钮事件
        if (this.showOrchestratorBtn) {
            this.showOrchestratorBtn.addEventListener('click', () => this.openOrchestratorModal());
        }
        if (this.orchestratorModalClose) {
            this.orchestratorModalClose.addEventListener('click', () => this.closeOrchestratorModal());
        }
        if (this.orchestratorCloseBtn) {
            this.orchestratorCloseBtn.addEventListener('click', () => this.closeOrchestratorModal());
        }
        if (this.orchestratorRefreshBtn) {
            this.orchestratorRefreshBtn.addEventListener('click', () => this.refreshOrchestratorState());
        }
        if (this.orchestratorCopyPhasesBtn) {
            this.orchestratorCopyPhasesBtn.addEventListener('click', () => this.copyPhasesText());
        }
        if (this.orchestratorCopyTimelineBtn) {
            this.orchestratorCopyTimelineBtn.addEventListener('click', () => this.copyTimelineText());
        }
        if (this.orchestratorFullscreenBtn) {
            this.orchestratorFullscreenBtn.addEventListener('click', () => {
                const content = document.getElementById('orchestratorModalContent');
                if (!content) return;
                const isFs = content.classList.toggle('fullscreen');
                if (isFs) {
                    this.orchestratorFullscreenBtn!.textContent = '退出全屏';
                } else {
                    this.orchestratorFullscreenBtn!.textContent = '全屏';
                }
                // 滚到底，避免切换后看不到尾部
                this.orchestratorTimeline?.scrollTo({ top: (this.orchestratorTimeline as HTMLElement).scrollHeight });
            });
        }
        if (this.orchestratorOpenJavdbBtn) {
            this.orchestratorOpenJavdbBtn.addEventListener('click', async () => {
                try {
                    if (!chrome?.tabs?.create) return;
                    await new Promise<void>((resolve) => {
                        chrome.tabs.create({ url: 'https://javdb.com/' }, () => resolve());
                    });
                    // 等页面注入内容脚本
                    setTimeout(() => this.refreshOrchestratorState(), 1500);
                } catch (e) {
                    console.warn('[Enhancement] 打开 JavDB 失败:', e);
                }
            });
        }

        // 过滤器事件
        this.orchFilterStatusSel?.addEventListener('change', () => this.renderOrchestratorTimeline(this.orchestratorTimelineData));
        this.orchFilterPhaseSel?.addEventListener('change', () => this.renderOrchestratorTimeline(this.orchestratorTimelineData));
        this.orchFilterSearchInput?.addEventListener('input', () => this.renderOrchestratorTimeline(this.orchestratorTimelineData));
        this.orchViewModeSel?.addEventListener('change', () => this.refreshOrchestratorState());

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
                showLoadingIndicator: true,
            } as any;
        } else if (section === 'actor') {
            s.actorEnhancement = {
                enabled: true,
                autoApplyTags: true,
                defaultTags: getDefaultTags(),
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

    // ===== Orchestrator Visualization =====
    private async openOrchestratorModal(): Promise<void> {
        if (!this.orchestratorModal) return;
        this.orchestratorModal.classList.remove('hidden');
        this.orchestratorModal.classList.add('visible');
        // 打开时强制默认使用“设计”视图（更贴合你的诉求）
        if (this.orchViewModeSel) this.orchViewModeSel.value = 'design';
        await this.refreshOrchestratorState();
        // 仅在“实时”模式下订阅事件
        const mode = this.orchViewModeSel?.value || 'design';
        if (mode === 'realtime') {
            this.subscribeOrchestratorEvents();
        } else {
            this.unsubscribeOrchestratorEvents();
        }
    }

    private closeOrchestratorModal(): void {
        if (!this.orchestratorModal) return;
        this.orchestratorModal.classList.add('hidden');
        this.orchestratorModal.classList.remove('visible');
        this.unsubscribeOrchestratorEvents();
    }

    private async refreshOrchestratorState(): Promise<void> {
        try {
            const mode = this.orchViewModeSel?.value || 'design';
            // 设计视图：强制状态筛选为“已排程”，并禁用
            if (this.orchFilterStatusSel) {
                if (mode === 'design') {
                    this.orchFilterStatusSel.value = 'scheduled';
                    this.orchFilterStatusSel.disabled = true;
                } else {
                    this.orchFilterStatusSel.disabled = false;
                }
            }
            if (mode === 'design') {
                const spec = this.buildDesignSpec();
                if (this.orchestratorSummary) this.orchestratorSummary.textContent = '展示设计视图：基于代码约定的默认编排时序（不依赖页面注入）';
                this.renderOrchestratorPhases(spec);
                // 将设计 spec 转成时间线（相对时间）：
                // critical 串行；high 并发（同一时间点）；deferred 在 critical 之后按顺序+偏移。
                const timeline: Array<{ phase: 'critical'|'high'|'deferred'|'idle'; label: string; status: 'scheduled'; ts: number }> = [];
                const crit = spec['critical'] || [];
                const high = spec['high'] || [];
                const defd = spec['deferred'] || [];
                const idle = spec['idle'] || [];
                let t = 0;
                // critical 串行（步进10）
                crit.forEach((label: string) => { timeline.push({ phase: 'critical', label, status: 'scheduled', ts: t }); t += 10; });
                const tHigh = t; // high 并发起点
                high.forEach((label: string) => { timeline.push({ phase: 'high', label, status: 'scheduled', ts: tHigh }); });
                // deferred 从 critical 末尾后延迟20再开始，步进10
                let tDef = t + 20;
                defd.forEach((label: string) => { timeline.push({ phase: 'deferred', label, status: 'scheduled', ts: tDef }); tDef += 10; });
                // idle 统一放到更靠后（比如 defd 结束后+50），步进10
                let tIdle = Math.max(tDef, tHigh) + 50;
                idle.forEach((label: string) => { timeline.push({ phase: 'idle', label, status: 'scheduled', ts: tIdle }); tIdle += 10; });
                this.orchestratorTimelineData = timeline as any;
                // 直接渲染（兜底），避免时间线区域空白
                try {
                    const container = this.orchestratorTimeline as HTMLElement | null;
                    if (container) {
                        container.classList.add('timeline-design');
                        container.classList.remove('timeline-realtime');
                        const rows = (this.orchestratorTimelineData || []).map((item) => {
                            const t = `${Math.round(item.ts)} ms`;
                            const badgeClass = `badge ${item.status}`;
                            const desc = this.getTaskDescription(item.label);
                            return `
                              <div class="row">
                                <div class="col time">${t}</div>
                                <div class="col status"><span class="${badgeClass}">${item.status.toUpperCase()}</span></div>
                                <div class="col phase">${item.phase}</div>
                                <div class="col label" title="${item.label}">
                                  <div class="label-main">${item.label}</div>
                                  ${desc ? `<div class=\"label-desc\">${desc}</div>` : ''}
                                </div>
                              </div>
                            `;
                        }).join('');
                        const header = `
                          <div class="header no-duration">
                            <div class="col time">时间(相对)</div>
                            <div class="col status">状态</div>
                            <div class="col phase">阶段</div>
                            <div class="col label">任务</div>
                          </div>
                        `;
                        const empty = '<div class="muted">(暂无事件)</div>';
                        container.innerHTML = `${header}${rows || empty}`;
                        console.log('[Orchestrator][design] rows=%d', (this.orchestratorTimelineData || []).length);
                    }
                } catch (e) {
                    console.warn('[Orchestrator] fallback render failed:', e);
                }
                // 常规渲染（保留原逻辑）
                this.renderOrchestratorTimeline(this.orchestratorTimelineData);
                // 设计视图不订阅事件
                this.unsubscribeOrchestratorEvents();
                return;
            }

            // 实时模式
            if (this.orchestratorSummary) {
                this.orchestratorSummary.textContent = '正在读取当前页面编排信息（实时）...';
            }
            const state = await this.requestOrchestratorStateFromActiveTab();
            if (!state) {
                if (this.orchestratorSummary) this.orchestratorSummary.textContent = '无法读取：请确保浏览器中已打开 JavDB 页面，并且扩展已注入内容脚本。';
                if (this.orchestratorPhases) this.orchestratorPhases.textContent = '';
                if (this.orchestratorTimeline) this.orchestratorTimeline.textContent = '';
                return;
            }
            if (this.orchestratorSummary) {
                this.orchestratorSummary.textContent = state.started ? '编排器已启动' : '编排器尚未启动';
            }
            this.renderOrchestratorPhases(state.phases || {});
            this.orchestratorTimelineData = (state.timeline || []) as any[];
            this.renderOrchestratorTimeline(this.orchestratorTimelineData);
            // 实时订阅
            this.subscribeOrchestratorEvents();
        } catch (e) {
            if (this.orchestratorSummary) this.orchestratorSummary.textContent = '读取失败：' + String(e);
        }
    }

    // 设计视图：根据代码中的编排约定构造静态规格
    private buildDesignSpec(): Record<'critical'|'high'|'deferred'|'idle', string[]> {
        // 注意：此处维护设计时序，不依赖页面是否开启
        // A) 系统内置（例：全局状态、图标、日志初始化等，可按需追加）
        const critical: string[] = [
            'system:init',
            'list:observe:init',
        ];
        // B) 高优先（快捷键、核心初始化等）
        const high: string[] = [
            'keyboardShortcuts:init',
            'videoEnhancement:initCore',
        ];
        // C) 延后/空闲（页面增强模块）
        const deferred: string[] = [
            // 列表页增强
            'list:preview:init',
            'list:optimization:init',
            // 影片页增强
            'videoEnhancement:runCover',
            'videoEnhancement:runTitle',
            'videoEnhancement:finish',
            // 其他增强
            'ux:contentFilter',
            'ux:anchorOptimization',
            'emby:badge',
        ];
        const idle: string[] = [
            'ux:magnet:autoSearch',
        ];
        return { critical, high, deferred, idle };
    }

    private renderOrchestratorPhases(phases: Record<string, string[]>): void {
        if (!this.orchestratorPhases) return;
        const order: Array<'critical'|'high'|'deferred'|'idle'> = ['critical','high','deferred','idle'];
        const phaseTitle: Record<'critical'|'high'|'deferred'|'idle', string> = {
            critical: '关键（critical）',
            high: '优先（high）',
            deferred: '延迟（deferred）',
            idle: '空闲（idle）',
        };

        const html: string[] = [];
        html.push('<div class="orch-phases-grid">');
        order.forEach((p) => {
            const items = phases[p] || [];
            html.push(`
              <div class="orch-card">
                <div class="orch-card-header">
                  <span class="orch-phase">${phaseTitle[p]}</span>
                  <span class="orch-count">${items.length} 项</span>
                </div>
                <ul class="orch-list">
                  ${items.length === 0 ? '<li class="muted">(无任务)</li>' : items.map((label: string) => `<li title="${label}"><i class="dot"></i>${label}</li>`).join('')}
                </ul>
              </div>
            `);
        });
        html.push('</div>');
        this.orchestratorPhases.innerHTML = html.join('');
        this.ensureOrchestratorLocalStyles();
    }

    private getTimelineFilters() {
        const status = (this.orchFilterStatusSel?.value || 'all') as 'all' | 'running' | 'done' | 'error' | 'scheduled';
        const phase = (this.orchFilterPhaseSel?.value || 'all') as 'all' | 'critical' | 'high' | 'deferred' | 'idle';
        const keyword = (this.orchFilterSearchInput?.value || '').trim().toLowerCase();
        return { status, phase, keyword };
    }

    // 任务中文说明（可按需扩展）
    private getTaskDescription(label: string): string {
        const map: Record<string, string> = {
            'system:init': '系统：全局初始化（图标/日志/状态等）',
            'list:observe:init': '列表页：初始化可见项处理与观察器（首屏必要）',
            'keyboardShortcuts:init': '快捷键：注册键位与处理器',
            'list:preview:init': '列表页：悬浮预览/延迟加载初始化',
            'list:optimization:init': '列表页：结构与性能优化',
            'videoEnhancement:initCore': '影片页：核心初始化（定点翻译、数据准备等）',
            'videoEnhancement:runCover': '影片页：封面增强（更清晰/多源展示）',
            'videoEnhancement:runTitle': '影片页：标题增强与翻译（AI/传统服务）',
            'videoEnhancement:finish': '影片页：增强完成，收起加载指示',
            'ux:contentFilter': '内容过滤：隐藏/高亮/模糊等',
            'ux:anchorOptimization': '链接锚点：定位/跳转优化',
            'ux:magnet:autoSearch': '磁力：自动检索与合并',
            'emby:badge': 'Emby：收藏/已看徽标',
        };
        return map[label] || '';
    }

    private renderOrchestratorTimeline(timeline: Array<{ phase: string; label: string; status: string; ts: number; detail?: any; durationMs?: number }>): void {
        if (!this.orchestratorTimeline) return;
        const mode = this.orchViewModeSel?.value || 'design';
        const filters = this.getTimelineFilters();
        const list = (timeline || []).filter(item => {
            if (filters.status !== 'all' && item.status !== filters.status) return false;
            if (filters.phase !== 'all' && item.phase !== filters.phase) return false;
            if (filters.keyword && !(`${item.label}`.toLowerCase().includes(filters.keyword))) return false;
            return true;
        }).slice(-300);

        const container = this.orchestratorTimeline as HTMLElement;
        container.classList.toggle('timeline-design', mode === 'design');
        container.classList.toggle('timeline-realtime', mode !== 'design');

        const rows = list.map((item) => {
            const t = item.ts !== undefined ? (mode === 'design' ? `${Math.round(item.ts)} ms` : `${item.ts.toFixed(1)} ms`) : '';
            const dur = mode === 'design' ? '' : (typeof item.durationMs === 'number' ? `${Math.round(item.durationMs)} ms` : '-');
            const badgeClass = `badge ${item.status}`;
            const detail = item.detail ? `<div class=\"detail\">${item.detail}</div>` : '';
            const desc = this.getTaskDescription(item.label);
            return `
              <div class="row">
                <div class="col time">${t}</div>
                <div class="col status"><span class="${badgeClass}">${item.status.toUpperCase()}</span></div>
                <div class="col phase">${item.phase}</div>
                <div class="col label" title="${item.label}">
                  <div class="label-main">${item.label}</div>
                  ${desc ? `<div class=\"label-desc\">${desc}</div>` : ''}
                </div>
                ${mode === 'design' ? '' : `<div class=\"col duration\">${dur}</div>`}
              </div>
              ${detail}
            `;
        }).join('');

        const header = mode === 'design'
          ? `
            <div class="header no-duration">
              <div class="col time">时间(相对)</div>
              <div class="col status">状态</div>
              <div class="col phase">阶段</div>
              <div class="col label">任务</div>
            </div>
          `
          : `
            <div class="header with-duration">
              <div class="col time">时间(ms)</div>
              <div class="col status">状态</div>
              <div class="col phase">阶段</div>
              <div class="col label">任务</div>
              <div class="col duration">耗时</div>
            </div>
          `;

        const hasActiveFilter = (filters.status !== 'all') || (filters.phase !== 'all') || !!filters.keyword;
        const empty = hasActiveFilter
          ? '<div class=\"muted\">无匹配事件（请检查状态/阶段/搜索条件）</div>'
          : '<div class=\"muted\">(暂无事件)</div>';
        this.orchestratorTimeline.innerHTML = `${header}${rows || empty}`;
        this.ensureOrchestratorLocalStyles();
        this.orchestratorTimeline.scrollTop = this.orchestratorTimeline.scrollHeight;
    }

    // 注入一次性的轻量样式，保证在暗色主题下也清晰
    private ensureOrchestratorLocalStyles(): void {
        if (document.getElementById('orch-local-style')) return;
        const style = document.createElement('style');
        style.id = 'orch-local-style';
        style.textContent = `
        #orchestratorModalContent.fullscreen { width:96vw !important; max-width:96vw !important; height:96vh !important; max-height:96vh !important; }
        .orchestrator-toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding:8px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; }
        .orchestrator-toolbar label { display:flex; align-items:center; gap:6px; padding:6px 10px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; color:#111; }
        .orchestrator-toolbar label > select { border:none; outline:none; background:transparent; color:#111; font-weight:600; }
        .orchestrator-toolbar input[type="search"] { padding:8px 12px; border:1px solid #e5e7eb; border-radius:999px; background:#fff; color:#111; min-width:240px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.03); }
        .orchestrator-toolbar input[type="search"]:focus { border-color:#60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,.25); outline:none; }
        .orch-phases-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; }
        .orch-card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
        .orch-card-header { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid #f1f5f9; font-weight:600; }
        .orch-list { list-style:none; margin:8px 10px; padding:0; }
        .orch-list li { padding:4px 0; display:flex; gap:6px; align-items:center; color:#111; }
        .orch-list li .dot { width:6px; height:6px; background:#9ca3af; border-radius:50%; display:inline-block; }
        .orch-list li.muted { color:#9ca3af; }
        .muted { color:#9ca3af; }
        .header.with-duration { display:grid; grid-template-columns: 90px 100px 110px 1fr 80px; align-items:center; column-gap:8px; }
        .header.no-duration { display:grid; grid-template-columns: 90px 100px 110px 1fr; align-items:center; column-gap:8px; }
        #orchestratorTimeline.timeline-realtime .row { display:grid; grid-template-columns: 90px 100px 110px 1fr 80px; align-items:center; column-gap:8px; }
        #orchestratorTimeline.timeline-design .row { display:grid; grid-template-columns: 90px 100px 110px 1fr; align-items:center; column-gap:8px; }
        .header { font-weight:600; padding:6px 4px; border-bottom:1px solid #e5e7eb; background:#f8fafc; color:#111; }
        .row { padding:6px 4px; border-bottom:1px dashed #eef2f7; }
        .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; color:#fff; }
        .badge.scheduled { background:#607d8b; }
        .badge.running { background:#ff8f00; }
        .badge.done { background:#2e7d32; }
        .badge.error { background:#d32f2f; }
        .detail { margin:0 4px 6px 4px; color:#b91c1c; font-size:12px; }
        .label-main { font-weight:600; color:#111; }
        .label-desc { color:#6b7280; font-size:12px; margin-top:2px; }
        `;
        document.head.appendChild(style);
    }

    // 统一的剪贴板写入（带回退）
    private async writeClipboard(text: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch {}
            document.body.removeChild(ta);
        }
    }

    // 复制“已注册任务”文本
    private async copyPhasesText(): Promise<void> {
        try {
            // 优先使用当前视图模式下的数据：realtime -> 请求活动标签页的 state；design -> 使用设计规格
            const mode = this.orchViewModeSel?.value || 'design';
            let phases: Record<'critical'|'high'|'deferred'|'idle', string[]> | null = null;
            if (mode === 'realtime') {
                const state = await this.requestOrchestratorStateFromActiveTab();
                if (state && state.phases) {
                    phases = state.phases as Record<'critical'|'high'|'deferred'|'idle', string[]>;
                }
            }
            if (!phases) {
                phases = this.buildDesignSpec();
            }

            const order: Array<'critical'|'high'|'deferred'|'idle'> = ['critical','high','deferred','idle'];
            const phaseTitle: Record<'critical'|'high'|'deferred'|'idle', string> = {
                critical: '关键（critical）',
                high: '优先（high）',
                deferred: '延迟（deferred）',
                idle: '空闲（idle）',
            };

            const lines: string[] = [];
            lines.push('已注册任务（按阶段）');
            order.forEach((p) => {
                lines.push(`[${phaseTitle[p]}]`);
                const items = phases![p] || [];
                if (items.length === 0) {
                    lines.push('- （无任务）');
                } else {
                    items.forEach((label) => {
                        const desc = this.getTaskDescription(label);
                        // 使用制表符分隔，便于粘贴到表格或文档中对齐
                        lines.push(`- ${label}\t${desc || ''}`.trimEnd());
                    });
                }
                // 空行分隔不同阶段
                lines.push('');
            });

            const text = lines.join('\n');
            await this.writeClipboard(text);
            showMessage('任务清单已复制到剪贴板', 'success');
        } catch {
            showMessage('复制任务清单失败', 'error');
        }
    }

    // 复制“事件时间线”文本
    private async copyTimelineText(): Promise<void> {
        try {
            const mode = this.orchViewModeSel?.value || 'design';
            const filters = this.getTimelineFilters();
            const raw = (this.orchestratorTimelineData || []) as Array<{ phase: string; label: string; status: string; ts: number; detail?: any; durationMs?: number }>;
            const list = raw.filter(item => {
                if (filters.status !== 'all' && item.status !== filters.status) return false;
                if (filters.phase !== 'all' && item.phase !== filters.phase) return false;
                if (filters.keyword && !(`${item.label}`.toLowerCase().includes(filters.keyword))) return false;
                return true;
            });

            const header = mode === 'design'
                ? '时间(相对)\t状态\t阶段\t任务'
                : '时间(ms)\t状态\t阶段\t任务\t耗时';

            const lines: string[] = [];
            lines.push('事件时间线');
            lines.push(header);

            list.forEach(item => {
                const timeStr = item.ts !== undefined
                    ? (mode === 'design' ? `${Math.round(item.ts)} ms` : `${item.ts.toFixed(1)} ms`)
                    : '';
                const statusStr = (item.status || '').toUpperCase();
                const phaseStr = item.phase || '';
                const labelStr = item.label || '';
                if (mode === 'design') {
                    lines.push(`${timeStr}\t${statusStr}\t${phaseStr}\t${labelStr}`);
                } else {
                    const durStr = typeof item.durationMs === 'number' ? `${Math.round(item.durationMs)} ms` : '-';
                    lines.push(`${timeStr}\t${statusStr}\t${phaseStr}\t${labelStr}\t${durStr}`);
                }
                // 如果存在错误详情，追加一行描述
                if (item.detail) {
                    lines.push(`  详情: ${String(item.detail)}`);
                }
            });

            const text = lines.join('\n');
            await this.writeClipboard(text);
            showMessage('时间线已复制到剪贴板', 'success');
        } catch {
            showMessage('复制时间线失败', 'error');
        }
    }

    private subscribeOrchestratorEvents(): void {
        if (!chrome?.runtime?.onMessage) return;
        // 避免重复订阅
        this.unsubscribeOrchestratorEvents();
        this.orchestratorRuntimeListener = (message: any) => {
            if (!message || message.type !== 'orchestrator:event') return;
            const { event, payload } = message;
            const ts = (typeof payload?.relativeTs === 'number') ? payload.relativeTs : performance.now();
            const item = { phase: payload?.phase || '-', label: payload?.label || String(event), status: (event || '').replace('task:', '') as string, ts, durationMs: payload?.durationMs, detail: payload?.error };
            // 标准化 status
            if (!['scheduled','running','done','error'].includes(item.status)) {
                // 对 run:start 等事件统一映射到 scheduled
                item.status = 'scheduled' as any;
            }
            this.orchestratorTimelineData.push(item as any);
            this.renderOrchestratorTimeline(this.orchestratorTimelineData);
        };
        chrome.runtime.onMessage.addListener(this.orchestratorRuntimeListener as any);
    }

    private unsubscribeOrchestratorEvents(): void {
        if (this.orchestratorRuntimeListener && chrome?.runtime?.onMessage) {
            chrome.runtime.onMessage.removeListener(this.orchestratorRuntimeListener as any);
            this.orchestratorRuntimeListener = undefined;
        }
    }

    private async requestOrchestratorStateFromActiveTab(): Promise<any | null> {
        try {
            if (!chrome?.tabs?.query || !chrome?.tabs?.sendMessage) return null;
            // 1) 在当前窗口内优先找活动的 JavDB 标签页
            const tabsInWin = await new Promise<chrome.tabs.Tab[]>((resolve) => {
                chrome.tabs.query({ lastFocusedWindow: true }, resolve);
            });
            const isJavdb = (url?: string | null) => !!url && /\bjavdb\b/i.test(url) && !url.startsWith('chrome-extension://');
            let target = (tabsInWin || []).find(t => t.active && isJavdb(t.url));
            // 2) 若当前活动标签非 JavDB，则选择任意 JavDB 标签（最近一个）
            if (!target) {
                target = (tabsInWin || []).find(t => isJavdb(t.url));
            }
            // 3) 若当前窗口没有，跨窗口全局搜索
            if (!target) {
                const allTabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
                    chrome.tabs.query({}, resolve);
                });
                target = (allTabs || []).find(t => isJavdb(t.url));
            }
            if (!target || !target.id) return null;

            const resp = await new Promise<any>((resolve) => {
                try {
                    chrome.tabs.sendMessage(target!.id!, { type: 'orchestrator:getState' }, (reply) => {
                        const err = chrome.runtime.lastError;
                        if (err) {
                            console.warn('[Enhancement] sendMessage to content failed:', err.message);
                            resolve(null);
                        } else {
                            resolve(reply);
                        }
                    });
                } catch (e) {
                    console.warn('[Enhancement] sendMessage error:', e);
                    resolve(null);
                }
            });
            if (resp && resp.ok) return resp.state;
            return null;
        } catch (e) {
            console.warn('[Enhancement] requestOrchestratorStateFromActiveTab failed:', e);
            return null;
        }
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

        // 数据增强设置（翻译主开关）
        this.enableTranslation.checked = dataEnhancement?.enableTranslation || false;

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
            // 当未显式配置时，默认启用 current-title 定点翻译（与内容脚本逻辑一致）
            this.translateCurrentTitleChk.checked = translation.targets?.currentTitle !== false;
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

        // 磁力搜索配置
        const magnetSearch = (settings as any).magnetSearch || {};
        const msSources = magnetSearch.sources || {};
        this.magnetSourceSukebei.checked = msSources.sukebei !== false;
        this.magnetSourceBtdig.checked = msSources.btdig !== false;
        this.magnetSourceBtsow.checked = msSources.btsow !== false;
        this.magnetSourceTorrentz2.checked = !!msSources.torrentz2;

        // 并发与限流配置回填
        const cc = (magnetSearch.concurrency || {}) as any;
        if (this.magnetPageMaxConcurrentRequests) this.magnetPageMaxConcurrentRequests.value = String(typeof cc.pageMaxConcurrentRequests === 'number' ? cc.pageMaxConcurrentRequests : 2);
        if (this.magnetBgGlobalMaxConcurrent) this.magnetBgGlobalMaxConcurrent.value = String(typeof cc.bgGlobalMaxConcurrent === 'number' ? cc.bgGlobalMaxConcurrent : 4);
        if (this.magnetBgPerHostMaxConcurrent) this.magnetBgPerHostMaxConcurrent.value = String(typeof cc.bgPerHostMaxConcurrent === 'number' ? cc.bgPerHostMaxConcurrent : 1);
        if (this.magnetBgPerHostRateLimitPerMin) this.magnetBgPerHostRateLimitPerMin.value = String(typeof cc.bgPerHostRateLimitPerMin === 'number' ? cc.bgPerHostRateLimitPerMin : 12);

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
        if (this.enableActorWatermark) this.enableActorWatermark.checked = (listEnhancement as any).enableActorWatermark === true;

        // 预览来源回填
        const preferred = (listEnhancement as any).preferredPreviewSource || 'auto';
        if (this.previewSourceAuto) this.previewSourceAuto.checked = preferred === 'auto';
        if (this.previewSourceJavDB) this.previewSourceJavDB.checked = preferred === 'javdb';
        if (this.previewSourceJavSpyl) this.previewSourceJavSpyl.checked = preferred === 'javspyl';
        if (this.previewSourceAVPreview) this.previewSourceAVPreview.checked = preferred === 'avpreview';
        if (this.previewSourceVBGFL) this.previewSourceVBGFL.checked = preferred === 'vbgfl';

        // 演员页增强配置
        const actorEnhancement = settings.actorEnhancement || { enabled: true, autoApplyTags: true, defaultTags: getDefaultTags(), defaultSortType: 0 };
        if (this.enableAutoApplyTags) this.enableAutoApplyTags.checked = actorEnhancement.autoApplyTags !== false;
        if (this.actorDefaultTagInputs && actorEnhancement.defaultTags) {
            this.actorDefaultTagInputs.forEach((input: HTMLInputElement) => {
                input.checked = actorEnhancement.defaultTags.includes(input.value);
            });
        }
        // 新增：演员页 影片分段显示回填
        if (this.aeEnableTimeSegmentationDivider) this.aeEnableTimeSegmentationDivider.checked = (actorEnhancement as any).enableTimeSegmentationDivider === true;
        if (this.aeTimeSegmentationMonths) this.aeTimeSegmentationMonths.value = String((actorEnhancement as any).timeSegmentationMonths || 6);
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

        // 演员水印配置回填
        const wmPos = (listEnhancement as any).actorWatermarkPosition || 'top-right';
        if (this.actorWatermarkPosition) this.actorWatermarkPosition.value = wmPos;
        const wmOpacity = (typeof (listEnhancement as any).actorWatermarkOpacity === 'number') ? (listEnhancement as any).actorWatermarkOpacity : 0.8;
        if (this.actorWatermarkOpacity) {
            this.actorWatermarkOpacity.value = String(wmOpacity);
            const pct = Math.round(wmOpacity * 100);
            if (this.actorWatermarkOpacityValue) this.actorWatermarkOpacityValue.textContent = `${pct}%`;
            const group = this.actorWatermarkOpacity.closest('.volume-control-group') as HTMLElement | null;
            const trackFill2 = group?.querySelector('.range-track-fill') as HTMLElement | null;
            if (trackFill2) trackFill2.style.width = `${pct}%`;
        }

        // 影片页增强配置
        const videoEnhancement = settings?.videoEnhancement || { 
            enabled: false, 
            enableCoverImage: true, 
            enableTranslation: true, 
            showLoadingIndicator: true,
            enableReviewBreaker: false,
            enableFC2Breaker: false
        };
        if (this.enableVideoEnhancement) this.enableVideoEnhancement.checked = !!videoEnhancement.enabled;
        if (this.veEnableCoverImage) this.veEnableCoverImage.checked = videoEnhancement.enableCoverImage !== false;
        // 不再设置 veEnableTranslation（已移除），翻译开关仅由全局开关控制

        // 同步滑块状态与翻译配置可见性
        try { this.updateAllToggleStates(); } catch {}
        this.updateTranslationConfigVisibility();
        if (this.veShowLoadingIndicator) this.veShowLoadingIndicator.checked = videoEnhancement.showLoadingIndicator !== false;
        if (this.veEnableReviewBreaker) this.veEnableReviewBreaker.checked = videoEnhancement.enableReviewBreaker === true;
        if (this.veEnableFC2Breaker) this.veEnableFC2Breaker.checked = videoEnhancement.enableFC2Breaker === true;
        // 新增：本地同步子项回填
        if (this.veEnableWantSync) this.veEnableWantSync.checked = (videoEnhancement as any).enableWantSync !== false;
        if (this.veAutoMarkWatchedAfter115) this.veAutoMarkWatchedAfter115.checked = (videoEnhancement as any).autoMarkWatchedAfter115 !== false;
        // 新增：演员备注
        if (this.veEnableActorRemarks) this.veEnableActorRemarks.checked = (videoEnhancement as any).enableActorRemarks === true;
        if (this.veActorRemarksMode) this.veActorRemarksMode.value = ((videoEnhancement as any).actorRemarksMode === 'inline') ? 'inline' : 'panel';
        if (this.veActorRemarksTTL) this.veActorRemarksTTL.value = String((videoEnhancement as any).actorRemarksTTLDays ?? 0);

        // 内容过滤规则
        const contentFilter = settings?.contentFilter || {};
        this.currentFilterRules = contentFilter?.keywordRules || [];
        this.renderFilterRules();

        // 将翻译配置容器迁移到“影片页增强 > 标题翻译”独立块中
        this.mountTranslationConfigIntoVideoBlock();

        // 显示/隐藏配置区域
        this.toggleConfigSections();

        // 再次尝试注入“并发与限流”UI（防止极端竞态导致未插入）
        this.injectMagnetConcurrencyControls();

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

        // 加载上次应用的演员标签
        await this.loadLastAppliedTags();

        // 标记以下仅写字段为已读取，避免触发 TS6133
        void this.actorEnhancementConfig;
        void this.lastAppliedTagsDisplay;
        void this.listEnhancementConfig;
        void this.currentSubtab;
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
                // 磁力资源搜索设置保存
                magnetSearch: {
                    sources: {
                        sukebei: this.magnetSourceSukebei?.checked !== false,
                        btdig: this.magnetSourceBtdig?.checked !== false,
                        btsow: this.magnetSourceBtsow?.checked !== false,
                        torrentz2: this.magnetSourceTorrentz2?.checked === true,
                        custom: [],
                    },
                    maxResults: (STATE.settings?.magnetSearch as any)?.maxResults ?? 15,
                    timeoutMs: (STATE.settings?.magnetSearch as any)?.timeoutMs ?? 6000,
                    concurrency: {
                        pageMaxConcurrentRequests: parseInt(this.magnetPageMaxConcurrentRequests?.value || '2', 10),
                        bgGlobalMaxConcurrent: parseInt(this.magnetBgGlobalMaxConcurrent?.value || '4', 10),
                        bgPerHostMaxConcurrent: parseInt(this.magnetBgPerHostMaxConcurrent?.value || '1', 10),
                        bgPerHostRateLimitPerMin: parseInt(this.magnetBgPerHostRateLimitPerMin?.value || '12', 10),
                    },
                },
                dataEnhancement: {
                    enableMultiSource: false, // 仍未启用
                    // 将"视频预览增强"与列表增强的预览开关保持一致
                    enableVideoPreview: this.enableListVideoPreview?.checked !== false,
                    enableTranslation: this.enableTranslation.checked,
                },
                // 影片页增强配置保存（启用状态由任一子项或"标题翻译"开启决定）
                videoEnhancement: {
                    enabled: (
                        this.veEnableCoverImage?.checked === true ||
                        this.enableTranslation?.checked === true ||
                        this.veShowLoadingIndicator?.checked === true ||
                        this.veEnableReviewBreaker?.checked === true ||
                        this.veEnableFC2Breaker?.checked === true
                    ),
                    enableCoverImage: this.veEnableCoverImage?.checked !== false,
                    // 与"翻译"总开关保持一致，避免两处状态不一致
                    enableTranslation: this.enableTranslation?.checked === true,
                    showLoadingIndicator: this.veShowLoadingIndicator?.checked !== false,
                    enableReviewBreaker: this.veEnableReviewBreaker?.checked === true,
                    enableFC2Breaker: this.veEnableFC2Breaker?.checked === true,
                    // 新增：本地同步子项
                    enableWantSync: this.veEnableWantSync?.checked !== false,
                    autoMarkWatchedAfter115: this.veAutoMarkWatchedAfter115?.checked !== false,
                    // 新增：演员备注
                    enableActorRemarks: this.veEnableActorRemarks?.checked === true,
                    actorRemarksMode: ((this.veActorRemarksMode?.value as any) || 'panel') as any,
                    actorRemarksTTLDays: parseInt(this.veActorRemarksTTL?.value || '0', 10) || 0,
                } as any,
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
                    enableActorWatermark: this.enableActorWatermark?.checked === true,
                    actorWatermarkPosition: (this.actorWatermarkPosition?.value as any) || 'top-right',
                    actorWatermarkOpacity: parseFloat(this.actorWatermarkOpacity?.value || '0.8'),
                },
                actorEnhancement: {
                    // 若任一子项启用即视为启用演员页增强
                    enabled: actorEnabledDerived,
                    autoApplyTags: this.enableAutoApplyTags?.checked !== false,
                    defaultTags: this.actorDefaultTagInputs && this.actorDefaultTagInputs.length > 0
                        ? Array.from(this.actorDefaultTagInputs).filter((i: HTMLInputElement) => i.checked).map(i => i.value)
                        : getDefaultTags(),
                    defaultSortType: 0,
                    // 新增：演员页 影片分段显示
                    enableTimeSegmentationDivider: this.aeEnableTimeSegmentationDivider?.checked === true,
                    timeSegmentationMonths: parseInt(this.aeTimeSegmentationMonths?.value || '6', 10),
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

    // 读取当前面板值为设置（满足 BaseSettingsPanel 接口）
    protected doGetSettings(): Partial<ExtensionSettings> {
        return {
            userExperience: {
                enableContentFilter: this.enableContentFilter.checked,
                enableKeyboardShortcuts: false,
                enableMagnetSearch: this.enableMagnetSearch.checked,
                enableAnchorOptimization: this.enableAnchorOptimization.checked,
                enableListEnhancement: this.enableListEnhancement.checked,
                enableActorEnhancement: this.enableActorEnhancement.checked,
                showEnhancedTooltips: false,
            },
            listEnhancement: {
                enabled: this.enableListEnhancement.checked,
                enableClickEnhancement: this.enableClickEnhancement?.checked !== false,
                enableVideoPreview: this.enableListVideoPreview?.checked !== false,
                enableScrollPaging: this.enableScrollPaging?.checked === true,
                enableListOptimization: true,
                previewDelay: parseInt(this.previewDelay?.value || '1000', 10),
                previewVolume: parseFloat(this.previewVolume?.value || '0.2'),
                enableRightClickBackground: true,
                preferredPreviewSource: this.getPreferredPreviewSource(),
                enableActorWatermark: this.enableActorWatermark?.checked === true,
                actorWatermarkPosition: (this.actorWatermarkPosition?.value as any) || 'top-right',
                actorWatermarkOpacity: parseFloat(this.actorWatermarkOpacity?.value || '0.8'),
            },
            anchorOptimization: {
                enabled: this.enableAnchorOptimization.checked,
                showPreviewButton: this.showPreviewButton?.checked !== false,
                buttonPosition: (this.anchorButtonPosition?.value as 'right-center' | 'right-bottom') || 'right-center',
            },
            videoEnhancement: {
                enabled: this.enableVideoEnhancement?.checked === true,
                enableCoverImage: this.veEnableCoverImage?.checked !== false,
                enableTranslation: this.enableTranslation?.checked === true,
                showLoadingIndicator: this.veShowLoadingIndicator?.checked !== false,
                enableReviewBreaker: this.veEnableReviewBreaker?.checked === true,
                enableFC2Breaker: this.veEnableFC2Breaker?.checked === true,
                enableWantSync: this.veEnableWantSync?.checked !== false,
                autoMarkWatchedAfter115: this.veAutoMarkWatchedAfter115?.checked !== false,
                enableActorRemarks: this.veEnableActorRemarks?.checked === true,
                actorRemarksMode: ((this.veActorRemarksMode?.value as any) || 'panel') as any,
                actorRemarksTTLDays: parseInt(this.veActorRemarksTTL?.value || '0', 10) || 0,
            },
            actorEnhancement: {
                enabled: this.enableActorEnhancement.checked,
                autoApplyTags: this.enableAutoApplyTags?.checked !== false,
                defaultTags: this.actorDefaultTagInputs && this.actorDefaultTagInputs.length > 0
                    ? Array.from(this.actorDefaultTagInputs).filter((i: HTMLInputElement) => i.checked).map(i => i.value)
                    : getDefaultTags(),
                defaultSortType: 0,
                enableTimeSegmentationDivider: this.aeEnableTimeSegmentationDivider?.checked === true,
                timeSegmentationMonths: parseInt(this.aeTimeSegmentationMonths?.value || '6', 10),
            },
        };
    }

    // 将给定设置快速回填到面板（满足 BaseSettingsPanel 接口）
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        try {
            if (settings.userExperience) {
                const ux = settings.userExperience;
                if (this.enableContentFilter && typeof ux.enableContentFilter === 'boolean') this.enableContentFilter.checked = ux.enableContentFilter;
                if (this.enableMagnetSearch && typeof ux.enableMagnetSearch === 'boolean') this.enableMagnetSearch.checked = ux.enableMagnetSearch;
                if (this.enableAnchorOptimization && typeof ux.enableAnchorOptimization === 'boolean') this.enableAnchorOptimization.checked = ux.enableAnchorOptimization;
                if (this.enableListEnhancement && typeof ux.enableListEnhancement === 'boolean') this.enableListEnhancement.checked = ux.enableListEnhancement;
                if (this.enableActorEnhancement && typeof ux.enableActorEnhancement === 'boolean') this.enableActorEnhancement.checked = ux.enableActorEnhancement;
            }
            if (settings.listEnhancement) {
                const le = settings.listEnhancement as any;
                if (this.enableClickEnhancement && typeof le.enableClickEnhancement === 'boolean') this.enableClickEnhancement.checked = le.enableClickEnhancement;
                if (this.enableListVideoPreview && typeof le.enableVideoPreview === 'boolean') this.enableListVideoPreview.checked = le.enableVideoPreview;
                if (this.enableScrollPaging && typeof le.enableScrollPaging === 'boolean') this.enableScrollPaging.checked = le.enableScrollPaging;
                if (this.previewDelay && typeof le.previewDelay === 'number') this.previewDelay.value = String(le.previewDelay);
                if (this.previewVolume && typeof le.previewVolume === 'number') this.previewVolume.value = String(le.previewVolume);
                if (this.enableActorWatermark && typeof le.enableActorWatermark === 'boolean') this.enableActorWatermark.checked = le.enableActorWatermark;
                if (this.actorWatermarkPosition && le.actorWatermarkPosition) this.actorWatermarkPosition.value = le.actorWatermarkPosition;
                if (this.actorWatermarkOpacity && typeof le.actorWatermarkOpacity === 'number') this.actorWatermarkOpacity.value = String(le.actorWatermarkOpacity);
            }
            if (settings.actorEnhancement) {
                const ae = settings.actorEnhancement as any;
                if (this.enableAutoApplyTags && typeof ae.autoApplyTags === 'boolean') this.enableAutoApplyTags.checked = ae.autoApplyTags;
                if (this.aeEnableTimeSegmentationDivider && typeof ae.enableTimeSegmentationDivider === 'boolean') this.aeEnableTimeSegmentationDivider.checked = ae.enableTimeSegmentationDivider;
                if (this.aeTimeSegmentationMonths && typeof ae.timeSegmentationMonths === 'number') this.aeTimeSegmentationMonths.value = String(ae.timeSegmentationMonths);
            }
            if (settings.videoEnhancement) {
                const ve = settings.videoEnhancement as any;
                if (this.veEnableActorRemarks && typeof ve.enableActorRemarks === 'boolean') this.veEnableActorRemarks.checked = ve.enableActorRemarks;
                if (this.veActorRemarksMode && typeof ve.actorRemarksMode === 'string') this.veActorRemarksMode.value = (ve.actorRemarksMode === 'inline') ? 'inline' : 'panel';
                if (this.veActorRemarksTTL && typeof ve.actorRemarksTTLDays !== 'undefined') this.veActorRemarksTTL.value = String(ve.actorRemarksTTLDays ?? 0);
            }
            this.updateAllToggleStates();
        } catch {}
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

        // 获取所有功能增强页面的开关按钮（只选择有 data-target 属性的，排除过滤规则的开关）
        const enhancementToggles = document.querySelectorAll('#enhancement-settings .enhancement-toggle[data-target]');
        log.verbose(`[Enhancement] 找到 ${enhancementToggles.length} 个开关按钮`);

        enhancementToggles.forEach((toggle, index) => {
            const targetId = toggle.getAttribute('data-target');
            if (!targetId) {
                if (STATE.settings?.logging?.verboseMode) {
                    console.warn(`[Enhancement] 开关 ${index + 1} 缺少 data-target 属性`);
                }
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
                if (STATE.settings?.logging?.verboseMode) {
                    console.log(`[Enhancement] 更新滑块状态 ${targetId}: ${isChecked}`);
                }

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
            'enableActorEnhancement': 'actorEnhancementConfig',
            'enableAutoApplyTags': 'actorEnhancementConfig',
            'enableContentFilter': 'contentFilterConfig',
            'enableAnchorOptimization': 'anchorOptimizationConfig',
            'enableVideoPreview': 'listVideoPreviewConfig',
            'enableMagnetSearch': 'magnetSourcesConfig',
            'enableVideoEnhancement': 'videoEnhancementConfig',
            'veEnableActorRemarks': 'actorRemarksConfig',
            'enableActorWatermark': 'actorWatermarkConfig',
            'aeEnableTimeSegmentationDivider': 'actorTimeSegmentationConfig',
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
        const enabled = (this.enableTranslation?.checked === true);
        this.translationConfig.setAttribute('data-enabled', enabled ? '1' : '0');
        // 不强制 display，显隐交由统一的悬浮展开逻辑（setupSubSettingsHoverBehavior）控制
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
                this.veShowLoadingIndicator?.checked === true
            );
            this.videoEnhancementConfig.setAttribute('data-enabled', enabled ? '1' : '0');
            this.videoEnhancementConfig.style.display = 'block';
        }
        const actorRemarksConfig = document.getElementById('actorRemarksConfig');
        if (actorRemarksConfig) {
            actorRemarksConfig.setAttribute('data-enabled', this.veEnableActorRemarks?.checked ? '1' : '0');
            actorRemarksConfig.style.display = 'block';
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
    }*/

    /**
     * 通知内容脚本音量已更改
     
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
    }*/

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
        
        // 生成关键词或日期范围的显示文本
        let keywordDisplay = '';
        if (rule.keyword) {
            keywordDisplay = `<div class="rule-keywords"><strong>关键词:</strong> ${rule.keyword}</div>`;
        }
        
        // 如果有发行日期配置,显示日期范围信息
        if (rule.releaseDateRange && rule.fields.includes('release-date')) {
            const dateRange = rule.releaseDateRange;
            let dateText = '';
            
            switch (dateRange.comparison) {
                case 'between':
                    dateText = `${dateRange.startDate || '?'} 至 ${dateRange.endDate || '?'}`;
                    break;
                case 'before':
                    dateText = `早于 ${dateRange.exactDate || '?'}`;
                    break;
                case 'after':
                    dateText = `晚于 ${dateRange.exactDate || '?'}`;
                    break;
                case 'exact':
                    dateText = `精确匹配 ${dateRange.exactDate || '?'}`;
                    break;
            }
            
            keywordDisplay += `<div class="rule-keywords"><strong>发行日期:</strong> ${dateText}</div>`;
        }
        
        ruleDiv.innerHTML = `
            <div class="rule-header">
                <span class="rule-name">${rule.name}</span>
                <div class="rule-actions">
                    <div class="enhancement-toggle-wrapper">
                        <button class="enhancement-toggle ${rule.enabled ? 'active' : ''}" data-index="${index}" data-enabled="${rule.enabled !== false}" title="${rule.enabled ? '点击禁用' : '点击启用'}"></button>
                    </div>
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
                    <span class="rule-type">字段: ${this.getFilterFieldsText(rule.fields)}</span>
                    <span class="rule-action">动作: ${this.getFilterActionText(rule.action)}</span>
                </div>
                ${keywordDisplay}
                ${rule.message ? `<div class="rule-description">${rule.message}</div>` : ''}
            </div>
        `;

        // 绑定事件
        const toggleBtn = ruleDiv.querySelector('.enhancement-toggle') as HTMLButtonElement;
        const editBtn = ruleDiv.querySelector('.edit-rule') as HTMLButtonElement;
        const deleteBtn = ruleDiv.querySelector('.delete-rule') as HTMLButtonElement;

        // 绑定快速开关事件
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFilterRuleEnabled(index);
            });
        }

        if (editBtn) {
            if (STATE.settings?.logging?.verboseMode) {
                console.log(`[Enhancement] 绑定编辑按钮事件，规则索引: ${index}`);
            }
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (STATE.settings?.logging?.verboseMode) {
                    console.log(`[Enhancement] 编辑按钮被点击，规则索引: ${index}`);
                }
                this.editFilterRule(index);
            });
        } else {
            console.error(`[Enhancement] 未找到编辑按钮，规则索引: ${index}`);
        }

        if (deleteBtn) {
            if (STATE.settings?.logging?.verboseMode) {
                console.log(`[Enhancement] 绑定删除按钮事件，规则索引: ${index}`);
            }
            deleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (STATE.settings?.logging?.verboseMode) {
                    console.log(`[Enhancement] 删除按钮被点击，规则索引: ${index}`);
                }

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
            'video-id': '番号',
            'release-date': '发行日期'
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
        
        // 设置启用开关状态
        const enableToggle = document.getElementById('modalInlineRuleEnabled') as HTMLButtonElement;
        const isEnabled = rule?.enabled !== false;
        if (enableToggle) {
            enableToggle.classList.toggle('active', isEnabled);
            enableToggle.setAttribute('data-enabled', isEnabled.toString());
        }
        
        (document.getElementById('modalInlineRuleMessage') as HTMLTextAreaElement).value = rule?.message || '';

        // 字段设置
        const keywordSettings = document.getElementById('keywordSettings') as HTMLElement;
        const releaseDateSettings = document.getElementById('releaseDateSettings') as HTMLElement;
        const dateComparison = document.getElementById('modalInlineRuleDateComparison') as HTMLSelectElement;
        const dateRangeInputs = document.getElementById('dateRangeInputs') as HTMLElement;
        const singleDateInput = document.getElementById('singleDateInput') as HTMLElement;
        const startDateInput = document.getElementById('modalInlineRuleStartDate') as HTMLInputElement;
        const endDateInput = document.getElementById('modalInlineRuleEndDate') as HTMLInputElement;
        const singleDate = document.getElementById('modalInlineRuleSingleDate') as HTMLInputElement;

        // 检查选择的字段，决定显示哪个设置盒子
        const updateFieldSettings = () => {
            const selectedFields = Array.from(fieldsSel.selectedOptions).map(opt => opt.value);
            const hasReleaseDate = selectedFields.includes('release-date');
            const hasOtherFields = selectedFields.some(f => f !== 'release-date');
            
            // 如果只选择了发行日期，只显示发行日期设置
            // 如果选择了其他字段（无论是否包含发行日期），显示关键词设置
            if (hasReleaseDate && !hasOtherFields) {
                keywordSettings.style.display = 'none';
                releaseDateSettings.style.display = 'block';
            } else if (hasOtherFields) {
                keywordSettings.style.display = 'block';
                releaseDateSettings.style.display = hasReleaseDate ? 'block' : 'none';
            } else {
                // 没有选择任何字段
                keywordSettings.style.display = 'block';
                releaseDateSettings.style.display = 'none';
            }
        };

        // 初始化发行日期设置
        if (rule?.releaseDateRange) {
            const dateRange = rule.releaseDateRange;
            dateComparison.value = dateRange.comparison || 'between';
            startDateInput.value = dateRange.startDate || '';
            endDateInput.value = dateRange.endDate || '';
            singleDate.value = dateRange.exactDate || '';
        }

        // 根据对比方式显示不同的输入框
        const updateDateInputs = () => {
            const comparison = dateComparison.value;
            if (comparison === 'between') {
                dateRangeInputs.style.display = 'flex';
                singleDateInput.style.display = 'none';
            } else {
                dateRangeInputs.style.display = 'none';
                singleDateInput.style.display = 'block';
            }
        };

        // 初始化显示状态
        updateFieldSettings();
        updateDateInputs();

        // 监听字段选择变化
        fieldsSel.addEventListener('change', updateFieldSettings);

        // 监听对比方式变化
        dateComparison?.addEventListener('change', updateDateInputs);

        // 绑定启用开关点击事件
        const toggleHandler = () => {
            const isActive = enableToggle.classList.contains('active');
            enableToggle.classList.toggle('active', !isActive);
            enableToggle.setAttribute('data-enabled', (!isActive).toString());
        };
        enableToggle?.addEventListener('click', toggleHandler);

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
        
        // 从button获取启用状态
        const enableToggle = document.getElementById('modalInlineRuleEnabled') as HTMLButtonElement;
        const enabled = enableToggle?.classList.contains('active') ?? true;
        
        const message = (document.getElementById('modalInlineRuleMessage') as HTMLTextAreaElement).value.trim();

        if (!name) { showMessage('请输入规则名称', 'error'); return; }
        if (!action) { showMessage('请选择过滤动作', 'error'); return; }

        const selectedFields = Array.from(fieldsSelect.selectedOptions).map(option => option.value) as ('title' | 'actor' | 'studio' | 'genre' | 'tag' | 'video-id' | 'release-date')[];
        if (selectedFields.length === 0) { showMessage('请至少选择一个过滤字段', 'error'); return; }

        // 检查是否只选择了发行日期
        const hasReleaseDate = selectedFields.includes('release-date');
        const hasOtherFields = selectedFields.some(f => f !== 'release-date');

        // 如果选择了非发行日期的字段，必须输入关键词
        if (hasOtherFields && !keyword) {
            showMessage('请输入关键词', 'error');
            return;
        }

        const rule: KeywordFilterRule = {
            id: typeof index === 'number' ? this.currentFilterRules[index].id : Date.now().toString(),
            name,
            keyword: keyword || '', // 如果只选择发行日期，关键词可以为空
            fields: selectedFields,
            action: action as 'hide' | 'highlight' | 'blur' | 'mark',
            isRegex,
            caseSensitive,
            enabled,
            message: message || undefined
        };

        // 如果选择了发行日期字段，添加日期范围配置
        if (hasReleaseDate) {
            const dateComparison = (document.getElementById('modalInlineRuleDateComparison') as HTMLSelectElement).value;
            const startDate = (document.getElementById('modalInlineRuleStartDate') as HTMLInputElement).value;
            const endDate = (document.getElementById('modalInlineRuleEndDate') as HTMLInputElement).value;
            const singleDate = (document.getElementById('modalInlineRuleSingleDate') as HTMLInputElement).value;

            rule.releaseDateRange = {
                enabled: true,
                comparison: dateComparison as 'between' | 'before' | 'after' | 'exact'
            };
            
            // 根据对比方式设置日期
            if (dateComparison === 'between') {
                rule.releaseDateRange.startDate = startDate || undefined;
                rule.releaseDateRange.endDate = endDate || undefined;
            } else if (dateComparison === 'exact') {
                rule.releaseDateRange.exactDate = singleDate || undefined;
            } else if (dateComparison === 'before') {
                rule.releaseDateRange.exactDate = singleDate || undefined;
            } else if (dateComparison === 'after') {
                rule.releaseDateRange.exactDate = singleDate || undefined;
            }
        }

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
     * 快速切换过滤规则的启用状态
     */
    private toggleFilterRuleEnabled(index: number): void {
        const rule = this.currentFilterRules[index];
        if (!rule) {
            console.error(`[Enhancement] 未找到索引为 ${index} 的规则`);
            return;
        }

        // 切换启用状态
        rule.enabled = !rule.enabled;
        
        // 只更新对应的滑块状态,不重新渲染整个列表
        const toggleBtn = this.filterRulesList?.querySelector(`.enhancement-toggle[data-index="${index}"]`) as HTMLButtonElement;
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', rule.enabled);
            toggleBtn.setAttribute('data-enabled', rule.enabled.toString());
            toggleBtn.title = rule.enabled ? '点击禁用' : '点击启用';
        }
        
        // 保存设置
        this.handleSettingChange();
        
        // 显示提示
        showMessage(`规则 "${rule.name}" 已${rule.enabled ? '启用' : '禁用'}`, 'success');
    }

    /**
     * 强制更新所有滑块状态
     */
    private updateAllToggleStates(): void {
        console.log('[Enhancement] 强制更新所有滑块状态');
        const toggles = document.querySelectorAll('#enhancement-settings .enhancement-toggle');
        toggles.forEach((toggleEl) => {
            const targetId = toggleEl.getAttribute('data-target');
            if (!targetId) return;
            const hiddenCheckbox = document.getElementById(targetId) as HTMLInputElement | null;
            if (!hiddenCheckbox) return;

            // 同步外观
            if (hiddenCheckbox.checked) {
                toggleEl.classList.add('active');
            } else {
                toggleEl.classList.remove('active');
            }

            // 同步子设置可用状态标记
            this.handleSubSettingsToggle(targetId, hiddenCheckbox.checked);

            // 特殊：翻译子设置可见性
            if (targetId === 'enableTranslation') {
                this.updateTranslationConfigVisibility();
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

        // 控制所有带 data-subtab 的元素显示/隐藏（仅限内容区域，显式排除顶部子标签按钮区域）
        const subtabElements = document.querySelectorAll('#enhancement-settings .settings-panel-body [data-subtab]:not(#enhancementSubTabs):not(#enhancementSubTabs *)');
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

        const tagElements = tags.map(tag => {
            // 使用配置文件中的标签定义
            const tagConfig = getTagByValue(tag);
            const tagName = tagConfig ? tagConfig.label : tag;
            return `<span class="applied-tag">${tagName}</span>`;
        }).join('');

        this.appliedTagsContainer.innerHTML = tagElements;
    }

    /**
     * 初始化演员页增强事件监听器
     */
    private initializeActorEnhancementEvents(): void {
        // 默认过滤条件复选框事件监听
        if (this.actorDefaultTagInputs && this.actorDefaultTagInputs.length > 0) {
            this.actorDefaultTagInputs.forEach((input: HTMLInputElement) => {
                input.addEventListener('change', this.handleSettingChange.bind(this));
            });
        }

        // 自动应用过滤器开关事件监听
        if (this.enableAutoApplyTags) {
            this.enableAutoApplyTags.addEventListener('change', this.handleSettingChange.bind(this));
        }

        // 清除上次应用标签
        if (this.clearLastAppliedTags) {
            this.clearLastAppliedTags.addEventListener('click', async () => {
                await setValue('lastAppliedActorTags', '');
                this.displayAppliedTags('');
            });
        }
    }
}


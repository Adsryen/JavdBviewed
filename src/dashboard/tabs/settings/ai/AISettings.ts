/**
 * AI设置面板
 * AI功能配置、模型管理、API设置等
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { showMessage } from '../../../ui/toast';
import { aiService } from '../../../../services/ai/aiService';
import type { ExtensionSettings } from '../../../../types';
import type { AISettings, AIModel } from '../../../../types/ai';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { log } from '../../../../utils/logController';

/**
 * AI设置面板类
 */
export class AISettingsPanel extends BaseSettingsPanel {
    // AI配置元素
    private enableAI!: HTMLInputElement;
    private apiProvider?: HTMLSelectElement;
    private apiKey!: HTMLInputElement;
    private apiEndpoint!: HTMLInputElement;
    private selectedModel!: HTMLSelectElement;
    private maxTokens!: HTMLInputElement;
    private temperature!: HTMLInputElement;
    private temperatureValue!: HTMLSpanElement;
    private timeoutEl!: HTMLInputElement;
    private streamEnabled?: HTMLInputElement;
    private systemPrompt?: HTMLTextAreaElement;
    // 错误重试（网络/超时/429/5xx）可选控件
    private errorRetryEnabledEl?: HTMLInputElement;
    private errorRetryMaxEl?: HTMLInputElement;

    // 功能配置元素 (可选，因为HTML中可能不存在)
    private enableAutoTranslation?: HTMLInputElement;
    private enableSummary?: HTMLInputElement;
    private enableRecommendation?: HTMLInputElement;
    private enableChatbot?: HTMLInputElement;

    // 对话参数 - 自动重试（可选，因为HTML中可能不存在）
    private autoRetryEmptyEl?: HTMLInputElement;
    private autoRetryMaxEl?: HTMLInputElement;

    // 按钮元素
    private testConnectionBtn!: HTMLButtonElement;
    private loadModelsBtn!: HTMLButtonElement;
    private saveAISettingsBtn?: HTMLButtonElement;
    private resetAISettingsBtn!: HTMLButtonElement;
    private sendTestMessageBtn!: HTMLButtonElement;
    private exportAISettingsBtn!: HTMLButtonElement;
    private importAISettingsBtn!: HTMLButtonElement;
    private clearTestResultsBtn!: HTMLButtonElement;
    private toggleApiKeyVisibilityBtn!: HTMLButtonElement;

    // 测试相关元素
    private testInput!: HTMLInputElement;
    private testResults?: HTMLElement;

    // AI设置管理器
    private aiSettings: AISettings = {
        enabled: false,
        apiUrl: '',
        apiKey: '',
        selectedModel: '',
        temperature: 0.7,
        maxTokens: 2048,
        streamEnabled: true,
        systemPrompt: '你是一个有用的AI助手，请用中文回答问题。',
        timeout: 120,
        autoRetryEmpty: false,
        autoRetryMax: 2
    };

    constructor() {
        super({
            panelId: 'ai-settings',
            panelName: 'AI设置',
            autoSave: false, // AI设置需要手动保存
            requireValidation: true
        });
    }

    /**
     * 确保“请求超时时间(秒)”的说明文案更新为建议30-240秒
     */
    private ensureTimeoutHintUpdate(): void {
        try {
            const input = document.getElementById('aiTimeout') as HTMLInputElement | null;
            if (!input) return;
            const group = input.closest('.form-group') as HTMLElement | null;
            const p = group?.querySelector('p.input-description') as HTMLParagraphElement | null;
            if (p) p.textContent = 'API请求的超时时间，建议30-240秒。';
        } catch {}
    }

    /**
     * 若页面未内置对应DOM，则在“对话参数”区域注入自动重试控件
     */
    private ensureAutoRetryControls(): void {
        try {
            const maxTokensEl = document.getElementById('aiMaxTokens');
            if (!maxTokensEl) return; // 找不到锚点，放弃注入
            const section = maxTokensEl.closest('.settings-section') as HTMLElement | null;
            if (!section) return;

            // 已存在则不重复创建
            const existed = document.getElementById('aiAutoRetryEmpty') || document.getElementById('aiAutoRetryMax');
            if (existed) return;

            // 1) 自动重试（空回复）复选框
            const grp1 = document.createElement('div');
            grp1.className = 'param-item param-checkbox';
            grp1.innerHTML = `
                <input type="checkbox" id="aiAutoRetryEmpty">
                <label for="aiAutoRetryEmpty">
                    自动重试（空回复）
                    <i class="fas fa-question-circle param-tooltip" title="当 AI 返回空内容时自动重新请求"></i>
                </label>
            `;

            // 2) 最大重试次数输入
            const grp2 = document.createElement('div');
            grp2.className = 'param-item';
            grp2.innerHTML = `
                <label for="aiAutoRetryMax">
                    最大重试次数
                    <i class="fas fa-question-circle param-tooltip" title="仅在开启自动重试时生效（建议 0-5 次）"></i>
                </label>
                <input type="number" id="aiAutoRetryMax" class="number-input" min="0" max="10" value="2">
            `;

            // 插入到 params-grid 中
            const paramsGrid = section.querySelector('.params-grid');
            if (paramsGrid) {
                // 找到超时时间输入框，在它后面插入最大重试次数
                const timeoutItem = document.getElementById('aiTimeout')?.closest('.param-item');
                if (timeoutItem) {
                    timeoutItem.insertAdjacentElement('afterend', grp2);
                }
                
                // 找到流式输出复选框，在它后面插入自动重试复选框
                const streamCheckbox = document.getElementById('aiStreamEnabled')?.closest('.param-item');
                if (streamCheckbox) {
                    streamCheckbox.insertAdjacentElement('afterend', grp1);
                }
            }
        } catch {}
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 先确保自动重试/错误重试控件存在（如HTML未内置，则动态注入）
        this.ensureAutoRetryControls();
        this.ensureErrorRetryControls();
        this.ensureTimeoutHintUpdate();

        // AI配置元素
        this.enableAI = document.getElementById('aiEnabled') as HTMLInputElement;
        this.apiProvider = document.getElementById('aiProvider') as HTMLSelectElement || undefined;
        this.apiKey = document.getElementById('aiApiKey') as HTMLInputElement;
        this.apiEndpoint = document.getElementById('aiApiUrl') as HTMLInputElement;
        this.selectedModel = document.getElementById('aiSelectedModel') as HTMLSelectElement;
        this.maxTokens = document.getElementById('aiMaxTokens') as HTMLInputElement;
        this.temperature = document.getElementById('aiTemperature') as HTMLInputElement;
        this.temperatureValue = document.getElementById('temperatureValue') as HTMLSpanElement;
        this.timeoutEl = document.getElementById('aiTimeout') as HTMLInputElement;
        this.streamEnabled = document.getElementById('aiStreamEnabled') as HTMLInputElement || undefined;
        this.systemPrompt = document.getElementById('aiSystemPrompt') as HTMLTextAreaElement || undefined;

        // 功能配置元素 (可选)
        this.enableAutoTranslation = document.getElementById('enableAutoTranslation') as HTMLInputElement || undefined;
        this.enableSummary = document.getElementById('enableSummary') as HTMLInputElement || undefined;
        this.enableRecommendation = document.getElementById('enableRecommendation') as HTMLInputElement || undefined;
        this.enableChatbot = document.getElementById('enableChatbot') as HTMLInputElement || undefined;

        // 自动重试（空回复）相关控件（可选）
        this.autoRetryEmptyEl = document.getElementById('aiAutoRetryEmpty') as HTMLInputElement || undefined;
        this.autoRetryMaxEl = document.getElementById('aiAutoRetryMax') as HTMLInputElement || undefined;
        // 错误重试相关控件（可选）
        this.errorRetryEnabledEl = document.getElementById('aiErrorRetryEnabled') as HTMLInputElement || undefined;
        this.errorRetryMaxEl = document.getElementById('aiErrorRetryMax') as HTMLInputElement || undefined;

        // 按钮元素
        this.testConnectionBtn = document.getElementById('testAiConnection') as HTMLButtonElement;
        this.loadModelsBtn = document.getElementById('refreshModels') as HTMLButtonElement;
        this.saveAISettingsBtn = document.getElementById('saveAISettings') as HTMLButtonElement || undefined;
        this.resetAISettingsBtn = document.getElementById('resetAiSettings') as HTMLButtonElement;
        this.sendTestMessageBtn = document.getElementById('sendTestMessage') as HTMLButtonElement;
        this.exportAISettingsBtn = document.getElementById('exportAiSettings') as HTMLButtonElement;
        this.importAISettingsBtn = document.getElementById('importAiSettings') as HTMLButtonElement;
        this.clearTestResultsBtn = document.getElementById('clearTestResults') as HTMLButtonElement;
        this.toggleApiKeyVisibilityBtn = document.getElementById('toggleApiKeyVisibility') as HTMLButtonElement;

        // 测试相关元素
        this.testInput = document.getElementById('aiTestInput') as HTMLInputElement;
        this.testResults = document.getElementById('aiTestResult') as HTMLElement || undefined;

        if (!this.enableAI || !this.apiKey || !this.apiEndpoint || !this.selectedModel ||
            !this.maxTokens || !this.temperature || !this.temperatureValue || !this.timeoutEl ||
            !this.testConnectionBtn || !this.loadModelsBtn || !this.resetAISettingsBtn ||
            !this.sendTestMessageBtn || !this.exportAISettingsBtn || !this.importAISettingsBtn ||
            !this.clearTestResultsBtn || !this.toggleApiKeyVisibilityBtn || !this.testInput) {
            throw new Error('AI设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // AI配置事件
        this.enableAI?.addEventListener('change', this.handleAIToggle.bind(this));
        this.apiProvider?.addEventListener('change', this.handleProviderChange.bind(this));
        this.apiKey?.addEventListener('input', this.handleSettingChange.bind(this));
        this.apiEndpoint?.addEventListener('input', this.handleSettingChange.bind(this));
        this.selectedModel?.addEventListener('change', this.handleSettingChange.bind(this));
        this.maxTokens?.addEventListener('input', this.handleSettingChange.bind(this));
        this.temperature?.addEventListener('input', this.handleTemperatureChange.bind(this));
        this.timeoutEl?.addEventListener('input', this.handleSettingChange.bind(this));
        this.streamEnabled?.addEventListener('change', this.handleStreamEnabledChange.bind(this));
        this.systemPrompt?.addEventListener('blur', this.handleSystemPromptChange.bind(this));

        // 功能配置事件
        this.enableAutoTranslation?.addEventListener('change', this.handleFeatureToggle.bind(this));
        this.enableSummary?.addEventListener('change', this.handleFeatureToggle.bind(this));
        this.enableRecommendation?.addEventListener('change', this.handleFeatureToggle.bind(this));
        this.enableChatbot?.addEventListener('change', this.handleFeatureToggle.bind(this));

        // 自动重试（空回复）
        this.autoRetryEmptyEl?.addEventListener('change', this.handleSettingChange.bind(this));
        this.autoRetryMaxEl?.addEventListener('input', this.handleSettingChange.bind(this));
        // 错误重试
        this.errorRetryEnabledEl?.addEventListener('change', this.handleSettingChange.bind(this));
        this.errorRetryMaxEl?.addEventListener('input', this.handleSettingChange.bind(this));

        // 按钮事件
        this.testConnectionBtn?.addEventListener('click', this.handleTestConnection.bind(this));
        this.loadModelsBtn?.addEventListener('click', this.handleLoadModels.bind(this));
        this.saveAISettingsBtn?.addEventListener('click', this.handleManualSave.bind(this));
        this.resetAISettingsBtn?.addEventListener('click', this.handleResetSettings.bind(this));
        this.sendTestMessageBtn?.addEventListener('click', this.handleSendTestMessage.bind(this));
        this.exportAISettingsBtn?.addEventListener('click', this.handleExportSettings.bind(this));
        this.importAISettingsBtn?.addEventListener('click', this.handleImportSettings.bind(this));
        this.clearTestResultsBtn?.addEventListener('click', this.handleClearTestResults.bind(this));
        this.toggleApiKeyVisibilityBtn?.addEventListener('click', this.handleToggleApiKeyVisibility.bind(this));
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
        try {
            // 从AI服务获取设置
            this.aiSettings = aiService.getSettings();

            // 更新UI
            this.enableAI.checked = this.aiSettings.enabled;
            if (this.apiProvider) {
                this.apiProvider.value = 'openai'; // 默认值，因为新的AISettings中没有provider字段
            }
            this.apiKey.value = this.aiSettings.apiKey;
            this.apiEndpoint.value = this.aiSettings.apiUrl;
            this.selectedModel.value = this.aiSettings.selectedModel;
            this.maxTokens.value = String(this.aiSettings.maxTokens);
            this.temperature.value = String(this.aiSettings.temperature);
            if (this.temperatureValue) {
                this.temperatureValue.textContent = this.aiSettings.temperature.toString();
            }
            this.timeoutEl.value = String(this.aiSettings.timeout);

            // 自动重试（空回复）
            if (this.autoRetryEmptyEl) {
                this.autoRetryEmptyEl.checked = !!this.aiSettings.autoRetryEmpty;
            }
            if (this.autoRetryMaxEl) {
                this.autoRetryMaxEl.value = String(this.aiSettings.autoRetryMax ?? 2);
            }
            // 错误重试
            if (this.errorRetryEnabledEl) {
                this.errorRetryEnabledEl.checked = !!this.aiSettings.errorRetryEnabled;
            }
            if (this.errorRetryMaxEl) {
                this.errorRetryMaxEl.value = String(this.aiSettings.errorRetryMax ?? 2);
            }

            // 功能配置 (只有当元素存在时才设置)
            // 注意：新的AISettings类型中没有features字段，这些功能可能需要单独处理
            if (this.enableAutoTranslation) {
                this.enableAutoTranslation.checked = false;
            }
            if (this.enableSummary) {
                this.enableSummary.checked = false;
            }
            if (this.enableRecommendation) {
                this.enableRecommendation.checked = false;
            }
            if (this.enableChatbot) {
                this.enableChatbot.checked = false;
            }

            // 更新控件状态
            this.updateControlsState();

            // 如果有选择的模型但下拉框中没有选项，尝试加载模型列表
            if (this.aiSettings.selectedModel && this.selectedModel.options.length <= 1) {
                try {
                    const models = await aiService.getAvailableModels(false);
                    if (models.length > 0) {
                        this.updateModelOptions(models);
                        this.selectedModel.value = this.aiSettings.selectedModel;
                    }
                } catch (error) {
                    log.warn('[AI] 自动加载模型列表失败', error);
                }
            }

        } catch (error) {
            log.error('[AI] 加载AI设置失败', error);
            throw error;
        }
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            // 更新AI设置
            this.aiSettings = {
                enabled: this.enableAI.checked,
                apiUrl: this.apiEndpoint.value.trim(),
                apiKey: this.apiKey.value.trim(),
                selectedModel: this.selectedModel.value,
                temperature: parseFloat(this.temperature.value),
                maxTokens: parseInt(this.maxTokens.value, 10),
                streamEnabled: true,
                systemPrompt: '你是一个有用的AI助手，请用中文回答问题。',
                timeout: parseInt(this.timeoutEl.value, 10),
                autoRetryEmpty: this.autoRetryEmptyEl ? this.autoRetryEmptyEl.checked : (this.aiSettings.autoRetryEmpty ?? false),
                autoRetryMax: this.autoRetryMaxEl ? (parseInt(this.autoRetryMaxEl.value, 10) || 0) : (this.aiSettings.autoRetryMax ?? 0),
                errorRetryEnabled: this.errorRetryEnabledEl ? this.errorRetryEnabledEl.checked : (this.aiSettings.errorRetryEnabled ?? false),
                errorRetryMax: this.errorRetryMaxEl ? (parseInt(this.errorRetryMaxEl.value, 10) || 0) : (this.aiSettings.errorRetryMax ?? 0)
            };

            // 保存到AI服务
            await aiService.saveSettings(this.aiSettings);

            return {
                success: true,
                savedSettings: { ai: this.aiSettings }
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

        if (this.enableAI.checked) {
            // 验证API密钥
            if (!this.apiKey.value.trim()) {
                errors.push('API密钥不能为空');
            }

            // 验证端点URL
            if (this.apiEndpoint.value.trim() && !this.isValidUrl(this.apiEndpoint.value.trim())) {
                errors.push('API服务地址URL格式无效');
            }

            // 验证最大令牌数
            const maxTokens = parseInt(this.maxTokens.value, 10);
            if (isNaN(maxTokens) || maxTokens < 1 || maxTokens > 4000) {
                errors.push('最大令牌数必须在1-4000之间');
            }

            // 验证温度值
            const temperature = parseFloat(this.temperature.value);
            if (isNaN(temperature) || temperature < 0 || temperature > 2) {
                errors.push('温度值必须在0-2之间');
            }

            // 验证超时时间（秒）
            const timeout = parseInt(this.timeoutEl.value, 10);
            if (isNaN(timeout) || timeout < 5 || timeout > 300) {
                errors.push('请求超时时间必须在5-300秒之间');
            }

            // 验证自动重试次数
            if (this.autoRetryMaxEl) {
                const v = parseInt(this.autoRetryMaxEl.value, 10);
                if (isNaN(v) || v < 0 || v > 10) {
                    errors.push('自动重试次数必须在0-10之间');
                }
            }
            // 验证错误重试次数
            if (this.errorRetryMaxEl) {
                const v2 = parseInt(this.errorRetryMaxEl.value, 10);
                if (isNaN(v2) || v2 < 0 || v2 > 10) {
                    errors.push('错误重试次数必须在0-10之间');
                }
            }

            // 验证模型选择
            if (!this.selectedModel.value) {
                warnings.push('建议选择一个AI模型');
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
            ai: this.aiSettings
        };
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        if (settings.ai) {
            this.aiSettings = settings.ai;
            this.loadSettings();
        }
    }

    /**
     * 处理AI开关
     */
    private handleAIToggle(): void {
        this.updateControlsState();
        this.emit('change');
    }

    /**
     * 处理提供商变化
     */
    private handleProviderChange(): void {
        // 根据提供商更新默认端点
        if (this.apiProvider) {
            const provider = this.apiProvider.value;
            if (provider === 'openai') {
                this.apiEndpoint.value = 'https://api.openai.com/v1';
            } else if (provider === 'anthropic') {
                this.apiEndpoint.value = 'https://api.anthropic.com/v1';
            } else {
                this.apiEndpoint.value = '';
            }
        }
        
        this.emit('change');
    }

    /**
     * 处理温度变化
     */
    private async handleTemperatureChange(): Promise<void> {
        if (this.temperatureValue) {
            this.temperatureValue.textContent = this.temperature.value;
        }
        this.emit('change');
        
        // 自动保存温度设置
        try {
            const temperature = parseFloat(this.temperature.value);
            this.aiSettings.temperature = temperature;
            await aiService.saveSettings({ temperature });
            showMessage('温度设置已保存', 'success');
        } catch (error) {
            log.warn('[AI] 保存温度设置失败', error);
            showMessage('保存温度设置失败', 'error');
        }
    }

    /**
     * 处理流式输出开关变化
     */
    private async handleStreamEnabledChange(): Promise<void> {
        this.emit('change');
        
        try {
            const streamEnabled = this.streamEnabled?.checked ?? true;
            this.aiSettings.streamEnabled = streamEnabled;
            await aiService.saveSettings({ streamEnabled });
            showMessage('流式输出设置已保存', 'success');
        } catch (error) {
            log.warn('[AI] 保存流式输出设置失败', error);
            showMessage('保存失败', 'error');
        }
    }

    /**
     * 处理系统提示词变化
     */
    private async handleSystemPromptChange(): Promise<void> {
        this.emit('change');
        
        try {
            const systemPrompt = this.systemPrompt?.value ?? '';
            this.aiSettings.systemPrompt = systemPrompt;
            await aiService.saveSettings({ systemPrompt });
            showMessage('系统提示词已保存', 'success');
        } catch (error) {
            log.warn('[AI] 保存系统提示词失败', error);
            showMessage('保存失败', 'error');
        }
    }

    /**
     * 处理功能开关
     */
    private handleFeatureToggle(): void {
        this.emit('change');
    }

    /**
     * 处理设置变化
     */
    private async handleSettingChange(ev?: Event): Promise<void> {
        this.emit('change');

        const target = ev?.target as HTMLElement | undefined;
        const id = target?.id;

        // 若为模型选择变化，立即保存
        if (id === 'aiSelectedModel' && this.selectedModel && this.selectedModel.value !== this.aiSettings.selectedModel) {
            try {
                await this.saveModelSelection();
                showMessage('模型选择已保存', 'success');
            } catch (error) {
                log.warn('[AI] 自动保存模型选择失败', error);
                showMessage('保存模型选择失败', 'error');
            }
            return;
        }

        // 对话参数自动保存
        if (id === 'aiMaxTokens') {
            try {
                const maxTokens = parseInt(this.maxTokens.value, 10);
                if (!isNaN(maxTokens) && maxTokens >= 1 && maxTokens <= 1000000) {
                    this.aiSettings.maxTokens = maxTokens;
                    await aiService.saveSettings({ maxTokens });
                    showMessage('最大回复长度已保存', 'success');
                }
            } catch (error) {
                log.warn('[AI] 保存最大回复长度失败', error);
                showMessage('保存失败', 'error');
            }
            return;
        }

        // 自动重试或超时相关控件，立即保存
        if (id === 'aiAutoRetryEmpty' || id === 'aiAutoRetryMax' || id === 'aiTimeout' || id === 'aiErrorRetryEnabled' || id === 'aiErrorRetryMax') {
            try {
                const partial: Partial<AISettings> = {
                    autoRetryEmpty: this.autoRetryEmptyEl ? this.autoRetryEmptyEl.checked : this.aiSettings.autoRetryEmpty,
                    autoRetryMax: this.autoRetryMaxEl ? (parseInt(this.autoRetryMaxEl.value, 10) || 0) : this.aiSettings.autoRetryMax,
                    timeout: this.timeoutEl ? (parseInt(this.timeoutEl.value, 10) || this.aiSettings.timeout) : this.aiSettings.timeout,
                    errorRetryEnabled: this.errorRetryEnabledEl ? this.errorRetryEnabledEl.checked : this.aiSettings.errorRetryEnabled,
                    errorRetryMax: this.errorRetryMaxEl ? (parseInt(this.errorRetryMaxEl.value, 10) || 0) : this.aiSettings.errorRetryMax
                };
                this.aiSettings = { ...this.aiSettings, ...partial } as AISettings;
                await aiService.saveSettings(partial);
                showMessage('设置已保存', 'success');
            } catch (e) {
                log.warn('[AI] 自动保存设置失败', e);
                showMessage('保存设置失败', 'error');
            }
        }
    }

    /**
     * 若页面未内置对应DOM，则在“对话参数”区域注入错误重试控件
     */
    private ensureErrorRetryControls(): void {
        try {
            const maxTokensEl = document.getElementById('aiMaxTokens');
            if (!maxTokensEl) return;
            const section = maxTokensEl.closest('.settings-section') as HTMLElement | null;
            if (!section) return;

            const existed = document.getElementById('aiErrorRetryEnabled') || document.getElementById('aiErrorRetryMax');
            if (existed) return;

            const grp1 = document.createElement('div');
            grp1.className = 'param-item param-checkbox';
            grp1.innerHTML = `
                <input type="checkbox" id="aiErrorRetryEnabled">
                <label for="aiErrorRetryEnabled">
                    错误重试（超时/网络/429/5xx）
                    <i class="fas fa-question-circle param-tooltip" title="开启后遇到可恢复错误将自动指数退避重试"></i>
                </label>
            `;

            const grp2 = document.createElement('div');
            grp2.className = 'param-item';
            grp2.innerHTML = `
                <label for="aiErrorRetryMax">
                    错误重试最大次数
                    <i class="fas fa-question-circle param-tooltip" title="建议 0-3 次"></i>
                </label>
                <input type="number" id="aiErrorRetryMax" class="number-input" min="0" max="10" value="2">
            `;

            const paramsGrid = section.querySelector('.params-grid');
            if (paramsGrid) {
                // 找到最大重试次数输入框，在它后面插入错误重试最大次数
                const autoRetryMaxItem = document.getElementById('aiAutoRetryMax')?.closest('.param-item');
                if (autoRetryMaxItem) {
                    autoRetryMaxItem.insertAdjacentElement('afterend', grp2);
                }
                
                // 找到自动重试复选框，在它后面插入错误重试复选框
                const autoRetryCheckbox = document.getElementById('aiAutoRetryEmpty')?.closest('.param-item');
                if (autoRetryCheckbox) {
                    autoRetryCheckbox.insertAdjacentElement('afterend', grp1);
                }
            }
        } catch {}
    }

    /**
     * 处理测试连接
     */
    private async handleTestConnection(): Promise<void> {
        try {
            this.testConnectionBtn.disabled = true;
            this.testConnectionBtn.textContent = '测试中...';

            // 先更新aiService的设置
            await aiService.saveSettings({
                apiKey: this.apiKey.value.trim(),
                apiUrl: this.apiEndpoint.value.trim()
            });

            const result = await aiService.testConnection();

            if (result.success) {
                showMessage('AI连接测试成功', 'success');
            } else {
                showMessage(`AI连接测试失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showMessage('AI连接测试失败', 'error');
            log.error('[AI] 连接测试失败', error);
        } finally {
            this.testConnectionBtn.disabled = false;
            this.testConnectionBtn.textContent = '测试连接';
        }
    }

    /**
     * 处理加载模型
     */
    private async handleLoadModels(): Promise<void> {
        try {
            this.loadModelsBtn.disabled = true;
            this.loadModelsBtn.textContent = '加载中...';

            // 先更新aiService的设置
            await aiService.saveSettings({
                apiKey: this.apiKey.value.trim(),
                apiUrl: this.apiEndpoint.value.trim()
            });

            const models = await aiService.getAvailableModels(true);

            this.updateModelOptions(models);
            showMessage(`成功加载 ${models.length} 个模型`, 'success');
        } catch (error) {
            showMessage('加载模型失败', 'error');
            log.error('[AI] 加载模型失败', error);
        } finally {
            this.loadModelsBtn.disabled = false;
            this.loadModelsBtn.textContent = '刷新';
        }
    }

    /**
     * 处理重置设置
     */
    private async handleResetSettings(): Promise<void> {
        if (!confirm('确定要重置所有AI设置吗？此操作不可撤销！')) {
            return;
        }

        try {
            await aiService.resetSettings();
            await this.loadSettings();
            showMessage('AI设置已重置', 'success');
        } catch (error) {
            showMessage('重置AI设置失败', 'error');
            log.error('[AI] 重置AI设置失败', error);
        }
    }

    /**
     * 更新控件状态
     */
    private updateControlsState(): void {
        const isEnabled = this.enableAI.checked;
        
        // 控制子控件的启用状态
        const controls = [
            this.apiProvider, this.apiKey, this.apiEndpoint, this.selectedModel,
            this.maxTokens, this.temperature, this.enableAutoTranslation,
            this.enableSummary, this.enableRecommendation, this.enableChatbot,
            this.timeoutEl,
            this.autoRetryEmptyEl, this.autoRetryMaxEl,
            this.errorRetryEnabledEl, this.errorRetryMaxEl,
            this.testConnectionBtn, this.loadModelsBtn
        ];
        
        controls.forEach(control => {
            if (control) {
                control.disabled = !isEnabled;
            }
        });
    }

    /**
     * 更新模型选项
     */
    private updateModelOptions(models: AIModel[]): void {
        // 保存当前选择的模型
        const currentSelection = this.selectedModel.value;

        // 清空现有选项
        this.selectedModel.innerHTML = '<option value="">请选择模型</option>';

        // 添加新选项
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} (${model.id})`;
            this.selectedModel.appendChild(option);
        });

        // 恢复之前的选择（如果该模型仍然存在）
        if (currentSelection && models.some(model => model.id === currentSelection)) {
            this.selectedModel.value = currentSelection;
        }
    }

    /**
     * 验证URL格式
     */
    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 处理发送测试消息
     */
    private async handleSendTestMessage(): Promise<void> {
        const message = this.testInput.value.trim();
        if (!message) {
            showMessage('请输入测试消息', 'warn');
            return;
        }

        await this.sendTestMessageWithStream(message);
    }

    private async sendTestMessageWithStream(message: string): Promise<void> {
        try {
            // 显示加载动画
            if (this.testResults) {
                this.testResults.style.display = 'block';
                this.testResults.innerHTML = `
                    <div class="test-result loading">
                        <div class="chat-message user-message">
                            <div class="message-avatar">👤</div>
                            <div class="message-wrapper">
                                <button class="resend-btn" data-message="${message.replace(/"/g, '&quot;')}" title="重新发送">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                    </svg>
                                </button>
                                <div class="message-bubble">
                                    <div class="message-content">${message}</div>
                                </div>
                            </div>
                        </div>
                        <div class="chat-message assistant-message">
                            <div class="message-avatar">🤖</div>
                            <div class="message-bubble">
                                <div class="ai-loading-dots">
                                    <span class="ai-cursor">▋</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            showMessage('正在发送测试消息...', 'info');

            let fullReply = '';
            let modelName = '';
            const startTime = Date.now();

            await aiService.sendStreamMessage(
                [{ role: 'user', content: message }],
                (chunk) => {
                    // 处理流式数据块
                    const content = chunk.choices?.[0]?.delta?.content || '';
                    if (content) {
                        fullReply += content;
                        modelName = chunk.model || modelName;
                        
                        // 实时更新显示
                        if (this.testResults) {
                            const assistantBubble = this.testResults.querySelector('.assistant-message .message-bubble');
                            if (assistantBubble) {
                                assistantBubble.innerHTML = `
                                    <div class="message-content streaming">${fullReply}<span class="typing-cursor">▋</span></div>
                                `;
                            }
                        }
                    }
                },
                () => {
                    // 完成回调
                    const endTime = Date.now();
                    const duration = ((endTime - startTime) / 1000).toFixed(2);
                    const estimatedTokens = aiService.estimateTokenUsage(`${message}\n${fullReply}`);
                    
                    if (this.testResults) {
                        this.testResults.innerHTML = `
                            <div class="test-result success">
                                <div class="chat-message user-message">
                                    <div class="message-avatar">👤</div>
                                    <div class="message-wrapper">
                                        <button class="resend-btn" data-message="${message.replace(/"/g, '&quot;')}" title="重新发送">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                            </svg>
                                        </button>
                                        <div class="message-bubble">
                                            <div class="message-content">${message}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="chat-message assistant-message">
                                    <div class="message-avatar">🤖</div>
                                    <div class="message-bubble">
                                        <div class="message-content">${fullReply || '无回复内容'}</div>
                                        <div class="message-meta">
                                            <span class="model-name">${modelName}</span>
                                            <span class="token-count">约 ${estimatedTokens} tokens</span>
                                            <span class="duration">${duration}秒</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // 绑定重新发送按钮事件
                        const resendBtn = this.testResults.querySelector('.resend-btn');
                        if (resendBtn) {
                            resendBtn.addEventListener('click', (e) => {
                                const btn = e.currentTarget as HTMLElement;
                                const msg = btn.getAttribute('data-message') || '';
                                if (msg) {
                                    this.testInput.value = msg;
                                    this.sendTestMessageWithStream(msg);
                                }
                            });
                        }
                    }

                    showMessage('测试消息发送成功', 'success');
                    this.testInput.value = '';
                },
                (error) => {
                    // 错误回调
                    log.error('[AI] 测试消息发送失败', error);
                    const errorMsg = error instanceof Error ? error.message : String(error || '未知错误');
                    const errorLines = errorMsg.split('\n');
                    const mainError = errorLines[0];
                    const details = errorLines.slice(1).filter(line => line.trim());
                    
                    if (this.testResults) {
                        this.testResults.style.display = 'block';
                        let detailsHtml = '';
                        if (details.length > 0) {
                            detailsHtml = details.map(line => `<p style="margin: 4px 0; font-size: 0.9em; color: #666;">${line}</p>`).join('');
                        }
                        this.testResults.innerHTML = `
                            <div class="test-result error">
                                <h5>测试失败</h5>
                                <p><strong>错误:</strong> ${mainError}</p>
                                ${detailsHtml}
                            </div>
                        `;
                    }
                    showMessage(`测试失败: ${mainError}`, 'error');
                }
            );
        } catch (error) {
            log.error('[AI] 测试消息发送失败', error);
            const errorMsg = error instanceof Error ? error.message : String(error || '未知错误');
            if (this.testResults) {
                this.testResults.style.display = 'block';
                this.testResults.innerHTML = `
                    <div class="test-result error">
                        <h5>测试失败</h5>
                        <p><strong>错误:</strong> ${errorMsg}</p>
                    </div>
                `;
            }
            showMessage(`测试失败: ${errorMsg}`, 'error');
        }
    }

    /**
     * 处理导出设置
     */
    private async handleExportSettings(): Promise<void> {
        try {
            const settings = { ...this.aiSettings };
            // 移除敏感信息
            delete (settings as any).apiKey;

            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showMessage('AI设置已导出', 'success');
        } catch (error) {
            log.error('[AI] 导出AI设置失败', error);
            showMessage('导出AI设置失败', 'error');
        }
    }

    /**
     * 处理导入设置
     */
    private async handleImportSettings(): Promise<void> {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = async (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    const importedSettings = JSON.parse(text);

                    // 验证设置格式
                    if (typeof importedSettings !== 'object') {
                        throw new Error('无效的设置文件格式');
                    }

                    // 合并设置（保留当前的API密钥）
                    const currentApiKey = this.aiSettings.apiKey;
                    this.aiSettings = { ...this.aiSettings, ...importedSettings, apiKey: currentApiKey };

                    // 更新UI
                    await this.doLoadSettings();

                    showMessage('AI设置已导入', 'success');
                } catch (error) {
                    log.error('[AI] 导入AI设置失败', error);
                    showMessage('导入AI设置失败：' + (error instanceof Error ? error.message : '未知错误'), 'error');
                }
            };

            input.click();
        } catch (error) {
            log.error('[AI] 导入AI设置失败', error);
            showMessage('导入AI设置失败', 'error');
        }
    }

    /**
     * 处理清除测试结果
     */
    private handleClearTestResults(): void {
        if (this.testResults) {
            this.testResults.innerHTML = '';
            this.testResults.style.display = 'none';
        }
        this.testInput.value = '';
        showMessage('测试结果已清除', 'success');
    }

    /**
     * 处理切换API密钥可见性
     */
    private handleToggleApiKeyVisibility(): void {
        const isPassword = this.apiKey.type === 'password';
        this.apiKey.type = isPassword ? 'text' : 'password';

        const icon = this.toggleApiKeyVisibilityBtn.querySelector('i');
        if (icon) {
            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
    }

    /**
     * 保存模型选择（单独保存，用于即时持久化）
     */
    private async saveModelSelection(): Promise<void> {
        try {
            const selectedModel = this.selectedModel.value;
            if (selectedModel) {
                // 更新本地设置
                this.aiSettings.selectedModel = selectedModel;
                
                // 保存到aiService
                await aiService.saveSettings({ selectedModel });
                
                log.info('[AI] 模型选择已保存: ' + selectedModel);
            }
        } catch (error) {
            log.error('[AI] 保存模型选择失败', error);
            throw error;
        }
    }

    /**
     * 处理手动保存设置
     */
    private async handleManualSave(): Promise<void> {
        try {
            const result = await this.doSaveSettings();
            if (result.success) {
                showMessage('AI设置保存成功', 'success');
            } else {
                showMessage(`保存失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showMessage('保存AI设置失败', 'error');
            log.error('[AI] 保存AI设置失败', error);
        }
    }
}

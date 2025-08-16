/**
 * AI设置面板
 * AI功能配置、模型管理、API设置等
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import { aiService } from '../../../../services/ai/aiService';
import type { ExtensionSettings } from '../../../../types';
import type { AISettings, AIModel } from '../../../../types/ai';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { saveSettings } from '../../../../utils/storage';

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

    // 功能配置元素 (可选，因为HTML中可能不存在)
    private enableAutoTranslation?: HTMLInputElement;
    private enableSummary?: HTMLInputElement;
    private enableRecommendation?: HTMLInputElement;
    private enableChatbot?: HTMLInputElement;

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
        timeout: 30
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
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // AI配置元素
        this.enableAI = document.getElementById('aiEnabled') as HTMLInputElement;
        this.apiProvider = document.getElementById('aiProvider') as HTMLSelectElement || undefined;
        this.apiKey = document.getElementById('aiApiKey') as HTMLInputElement;
        this.apiEndpoint = document.getElementById('aiApiUrl') as HTMLInputElement;
        this.selectedModel = document.getElementById('aiSelectedModel') as HTMLSelectElement;
        this.maxTokens = document.getElementById('aiMaxTokens') as HTMLInputElement;
        this.temperature = document.getElementById('aiTemperature') as HTMLInputElement;
        this.temperatureValue = document.getElementById('temperatureValue') as HTMLSpanElement;

        // 功能配置元素 (可选)
        this.enableAutoTranslation = document.getElementById('enableAutoTranslation') as HTMLInputElement || undefined;
        this.enableSummary = document.getElementById('enableSummary') as HTMLInputElement || undefined;
        this.enableRecommendation = document.getElementById('enableRecommendation') as HTMLInputElement || undefined;
        this.enableChatbot = document.getElementById('enableChatbot') as HTMLInputElement || undefined;

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
            !this.maxTokens || !this.temperature || !this.temperatureValue ||
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

        // 功能配置事件
        this.enableAutoTranslation?.addEventListener('change', this.handleFeatureToggle.bind(this));
        this.enableSummary?.addEventListener('change', this.handleFeatureToggle.bind(this));
        this.enableRecommendation?.addEventListener('change', this.handleFeatureToggle.bind(this));
        this.enableChatbot?.addEventListener('change', this.handleFeatureToggle.bind(this));

        // 按钮事件
        this.testConnectionBtn?.addEventListener('click', this.handleTestConnection.bind(this));
        this.loadModelsBtn?.addEventListener('click', this.handleLoadModels.bind(this));
        this.saveAISettingsBtn?.addEventListener('click', this.handleSaveSettings.bind(this));
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
                    console.warn('自动加载模型列表失败:', error);
                }
            }

        } catch (error) {
            console.error('加载AI设置失败:', error);
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
                timeout: 30
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
        const provider = this.apiProvider.value;
        if (provider === 'openai') {
            this.apiEndpoint.value = 'https://api.openai.com/v1';
        } else if (provider === 'anthropic') {
            this.apiEndpoint.value = 'https://api.anthropic.com/v1';
        } else {
            this.apiEndpoint.value = '';
        }
        
        this.emit('change');
    }

    /**
     * 处理温度变化
     */
    private handleTemperatureChange(): void {
        if (this.temperatureValue) {
            this.temperatureValue.textContent = this.temperature.value;
        }
        this.emit('change');
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
    private handleSettingChange(): void {
        this.emit('change');
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
            console.error('AI连接测试失败:', error);
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
            console.error('加载模型失败:', error);
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
            console.error('重置AI设置失败:', error);
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
            showMessage('请输入测试消息', 'warning');
            return;
        }

        try {
            showMessage('正在发送测试消息...', 'info');

            const response = await aiService.sendMessage([
                { role: 'user', content: message }
            ]);

            if (this.testResults) {
                this.testResults.style.display = 'block';
                this.testResults.innerHTML = `
                    <div class="test-result success">
                        <h5>测试成功</h5>
                        <p><strong>发送:</strong> ${message}</p>
                        <p><strong>回复:</strong> ${response.choices[0]?.message?.content || '无回复内容'}</p>
                        <p><strong>模型:</strong> ${response.model}</p>
                        <p><strong>用时:</strong> ${response.usage?.total_tokens || 0} tokens</p>
                    </div>
                `;
            }

            showMessage('测试消息发送成功', 'success');
            this.testInput.value = '';
        } catch (error) {
            console.error('测试消息发送失败:', error);
            if (this.testResults) {
                this.testResults.style.display = 'block';
                this.testResults.innerHTML = `
                    <div class="test-result error">
                        <h5>测试失败</h5>
                        <p><strong>错误:</strong> ${error instanceof Error ? error.message : '未知错误'}</p>
                    </div>
                `;
            }
            showMessage('测试消息发送失败', 'error');
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
            console.error('导出AI设置失败:', error);
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
                    console.error('导入AI设置失败:', error);
                    showMessage('导入AI设置失败：' + (error instanceof Error ? error.message : '未知错误'), 'error');
                }
            };

            input.click();
        } catch (error) {
            console.error('导入AI设置失败:', error);
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
}

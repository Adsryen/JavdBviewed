// AI设置页面逻辑

import type { AISettings, AIModel, ConnectionTestResult } from '../../types/ai';
import { DEFAULT_AI_SETTINGS } from '../../types/ai';
import { aiService } from '../../services/ai/aiService';
import { showMessage } from '../ui/toast';

/**
 * AI设置页面管理器
 */
class AISettingsManager {
    private settings: AISettings = { ...DEFAULT_AI_SETTINGS };
    private models: AIModel[] = [];
    private isInitialized = false;
    private autoSaveTimeout: number | null = null;
    private isAutoSaving = false;
    private typewriterQueue: string[] = [];
    private typewriterActive = false;

    /**
     * 初始化AI设置页面
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.loadSettings();
            this.bindEvents();
            this.updateUI();
            this.initEnhancements();
            this.updateAutoSaveStatus('idle'); // 初始化自动保存状态

            // 如果已配置API设置，尝试自动加载模型列表
            await this.tryAutoLoadModels();

            this.isInitialized = true;
            console.log('AI设置页面初始化完成');
        } catch (error) {
            console.error('AI设置页面初始化失败:', error);
            this.showError('初始化失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
    }

    /**
     * 加载设置
     */
    private async loadSettings(): Promise<void> {
        try {
            this.settings = aiService.getSettings();
        } catch (error) {
            console.warn('加载AI设置失败，使用默认设置:', error);
            this.settings = { ...DEFAULT_AI_SETTINGS };
        }
    }

    /**
     * 尝试自动加载模型列表（如果已配置API设置）
     */
    private async tryAutoLoadModels(): Promise<void> {
        // 检查是否已配置基本的API设置
        if (!this.settings.apiUrl || !this.settings.apiKey) {
            console.log('API设置未完整配置，跳过自动加载模型');
            return;
        }

        try {
            console.log('检测到已配置的API设置，尝试自动加载模型列表');

            // 静默加载模型列表，不显示错误提示
            this.models = await aiService.getAvailableModels();
            this.updateModelSelect();
            await this.updateModelStats();

            console.log(`自动加载模型列表成功，共${this.models.length}个模型`);
        } catch (error) {
            // 静默失败，不影响页面初始化
            console.warn('自动加载模型列表失败:', error);
            // 保持models为空数组，用户需要手动测试连接
        }
    }

    /**
     * 绑定事件
     */
    private bindEvents(): void {
        // 启用/禁用AI功能
        const enabledCheckbox = document.getElementById('aiEnabled') as HTMLInputElement;
        enabledCheckbox?.addEventListener('change', () => {
            this.settings.enabled = enabledCheckbox.checked;
            this.updateUI();
            this.updateButtonStates(); // 立即更新按钮状态
            this.autoSaveSettings();
        });

        // API地址变化
        const apiUrlInput = document.getElementById('aiApiUrl') as HTMLInputElement;
        apiUrlInput?.addEventListener('input', () => {
            this.settings.apiUrl = apiUrlInput.value.trim();
            this.updateButtonStates(); // 立即更新按钮状态
            this.autoSaveSettings();
        });

        // API密钥变化
        const apiKeyInput = document.getElementById('aiApiKey') as HTMLInputElement;
        apiKeyInput?.addEventListener('input', () => {
            this.settings.apiKey = apiKeyInput.value.trim();
            this.updateButtonStates(); // 立即更新按钮状态
            this.autoSaveSettings();
        });

        // 切换密钥可见性
        const toggleKeyBtn = document.getElementById('toggleApiKeyVisibility');
        toggleKeyBtn?.addEventListener('click', () => {
            const input = apiKeyInput;
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const icon = toggleKeyBtn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                }
            }
        });

        // 测试连接
        const testConnectionBtn = document.getElementById('testAiConnection');
        testConnectionBtn?.addEventListener('click', () => this.testConnection());

        // 模型选择
        const modelSelect = document.getElementById('aiSelectedModel') as HTMLSelectElement;
        modelSelect?.addEventListener('change', () => {
            this.settings.selectedModel = modelSelect.value;
            this.updateModelInfo();
            this.updateButtonStates(); // 立即更新按钮状态
            this.autoSaveSettings();
        });

        // 刷新模型列表
        const refreshModelsBtn = document.getElementById('refreshModels');
        refreshModelsBtn?.addEventListener('click', () => this.refreshModels());

        // 温度滑块
        const temperatureSlider = document.getElementById('aiTemperature') as HTMLInputElement;
        temperatureSlider?.addEventListener('input', () => {
            this.settings.temperature = parseFloat(temperatureSlider.value);
            this.updateTemperatureDisplay();
            this.autoSaveSettings();
        });

        // 最大token数
        const maxTokensInput = document.getElementById('aiMaxTokens') as HTMLInputElement;
        maxTokensInput?.addEventListener('input', () => {
            this.settings.maxTokens = parseInt(maxTokensInput.value, 10);
            this.autoSaveSettings();
        });

        // 流式输出
        const streamCheckbox = document.getElementById('aiStreamEnabled') as HTMLInputElement;
        streamCheckbox?.addEventListener('change', () => {
            this.settings.streamEnabled = streamCheckbox.checked;
            this.autoSaveSettings();
        });

        // 系统提示词
        const systemPromptTextarea = document.getElementById('aiSystemPrompt') as HTMLTextAreaElement;
        systemPromptTextarea?.addEventListener('input', () => {
            this.settings.systemPrompt = systemPromptTextarea.value;
            this.autoSaveSettings();
        });

        // 超时时间
        const timeoutInput = document.getElementById('aiTimeout') as HTMLInputElement;
        timeoutInput?.addEventListener('input', () => {
            this.settings.timeout = parseInt(timeoutInput.value, 10);
            this.autoSaveSettings();
        });

        // 发送测试消息
        const sendTestBtn = document.getElementById('sendTestMessage');
        sendTestBtn?.addEventListener('click', () => this.sendTestMessage());

        // 测试输入框回车发送
        const testInput = document.getElementById('aiTestInput') as HTMLInputElement;
        testInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendTestMessage();
            }
        });

        // 重置设置
        const resetBtn = document.getElementById('resetAiSettings');
        resetBtn?.addEventListener('click', () => this.resetSettings());

        // 导出设置
        const exportBtn = document.getElementById('exportAiSettings');
        exportBtn?.addEventListener('click', () => this.exportSettings());

        // 导入设置
        const importBtn = document.getElementById('importAiSettings');
        importBtn?.addEventListener('click', () => this.importSettings());

        // 清除测试结果
        const clearTestBtn = document.getElementById('clearTestResults');
        clearTestBtn?.addEventListener('click', () => this.clearTestResults());
    }

    /**
     * 更新UI
     */
    private updateUI(): void {
        // 更新表单值
        const enabledCheckbox = document.getElementById('aiEnabled') as HTMLInputElement;
        if (enabledCheckbox) enabledCheckbox.checked = this.settings.enabled;

        const apiUrlInput = document.getElementById('aiApiUrl') as HTMLInputElement;
        if (apiUrlInput) apiUrlInput.value = this.settings.apiUrl;

        const apiKeyInput = document.getElementById('aiApiKey') as HTMLInputElement;
        if (apiKeyInput) apiKeyInput.value = this.settings.apiKey;

        const temperatureSlider = document.getElementById('aiTemperature') as HTMLInputElement;
        if (temperatureSlider) {
            temperatureSlider.value = this.settings.temperature.toString();
            this.updateTemperatureDisplay();
        }

        const maxTokensInput = document.getElementById('aiMaxTokens') as HTMLInputElement;
        if (maxTokensInput) maxTokensInput.value = this.settings.maxTokens.toString();

        const streamCheckbox = document.getElementById('aiStreamEnabled') as HTMLInputElement;
        if (streamCheckbox) streamCheckbox.checked = this.settings.streamEnabled;

        const systemPromptTextarea = document.getElementById('aiSystemPrompt') as HTMLTextAreaElement;
        if (systemPromptTextarea) systemPromptTextarea.value = this.settings.systemPrompt;

        const timeoutInput = document.getElementById('aiTimeout') as HTMLInputElement;
        if (timeoutInput) timeoutInput.value = this.settings.timeout.toString();

        // 更新模型选择
        this.updateModelSelect();

        // 更新按钮状态
        this.updateButtonStates();

        // 更新使用统计
        this.updateUsageStats();
    }

    /**
     * 更新温度显示
     */
    private updateTemperatureDisplay(): void {
        const valueSpan = document.getElementById('temperatureValue');
        if (valueSpan) {
            valueSpan.textContent = this.settings.temperature.toFixed(1);
        }
    }

    /**
     * 更新模型选择下拉框
     */
    private updateModelSelect(): void {
        const select = document.getElementById('aiSelectedModel') as HTMLSelectElement;
        if (!select) return;

        // 清空现有选项
        select.innerHTML = '';

        if (this.models.length === 0) {
            select.innerHTML = '<option value="">请先配置API并测试连接</option>';
            return;
        }

        // 添加模型选项
        for (const model of this.models) {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            if (model.id === this.settings.selectedModel) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        // 如果当前选中的模型不在列表中，选择第一个
        if (this.settings.selectedModel && !this.models.find(m => m.id === this.settings.selectedModel)) {
            if (this.models.length > 0) {
                this.settings.selectedModel = this.models[0].id;
                select.value = this.settings.selectedModel;
            }
        }

        this.updateModelInfo();
    }

    /**
     * 更新模型信息显示
     */
    private updateModelInfo(): void {
        const infoDiv = document.getElementById('modelInfo');
        if (!infoDiv) return;

        if (!this.settings.selectedModel) {
            infoDiv.style.display = 'none';
            return;
        }

        infoDiv.style.display = 'block';
        this.showModelCapabilities(this.settings.selectedModel);
    }

    /**
     * 更新按钮状态
     */
    private updateButtonStates(): void {
        const hasApiConfig = this.settings.apiUrl && this.settings.apiKey;
        
        const testBtn = document.getElementById('testAiConnection') as HTMLButtonElement;
        if (testBtn) testBtn.disabled = !hasApiConfig;

        const refreshBtn = document.getElementById('refreshModels') as HTMLButtonElement;
        if (refreshBtn) refreshBtn.disabled = !hasApiConfig;

        const sendTestBtn = document.getElementById('sendTestMessage') as HTMLButtonElement;
        if (sendTestBtn) sendTestBtn.disabled = !this.settings.enabled || !this.settings.selectedModel;
    }

    /**
     * 测试连接
     */
    private async testConnection(): Promise<void> {
        const statusDiv = document.getElementById('aiConnectionStatus');
        const testBtn = document.getElementById('testAiConnection') as HTMLButtonElement;

        if (!statusDiv || !testBtn) return;

        // 显示加载状态
        statusDiv.style.display = 'block';
        statusDiv.className = 'connection-status loading';
        statusDiv.innerHTML = '<i class="loading-spinner"></i> 正在测试连接...';
        testBtn.disabled = true;

        try {
            // 先验证设置
            const validation = aiService.validateSettings();
            if (!validation.valid) {
                statusDiv.className = 'connection-status error';
                statusDiv.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    设置验证失败: ${validation.errors.join(', ')}
                `;
                return;
            }

            // 保存当前设置到服务
            await aiService.saveSettings(this.settings);

            // 使用健康检查方法
            const healthResult = await aiService.checkHealth();

            if (healthResult.healthy) {
                statusDiv.className = 'connection-status success';
                statusDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    连接成功！响应时间: ${healthResult.latency}ms，可用模型: ${healthResult.modelCount}个
                `;

                // 自动加载模型列表
                await this.loadModels();
                this.showSuccess('连接测试成功，已自动加载模型列表');
            } else {
                statusDiv.className = 'connection-status error';
                statusDiv.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    连接失败: ${healthResult.error}
                `;
                this.showError('连接测试失败: ' + healthResult.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            statusDiv.className = 'connection-status error';
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                连接失败: ${errorMessage}
            `;
            this.showError('连接测试失败: ' + errorMessage);
        } finally {
            testBtn.disabled = false;
            this.updateButtonStates();
        }
    }

    /**
     * 加载模型列表
     */
    private async loadModels(): Promise<void> {
        try {
            this.models = await aiService.getAvailableModels();
            this.updateModelSelect();
            await this.updateModelStats();
        } catch (error) {
            console.error('加载模型列表失败:', error);
            this.showError('加载模型列表失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
    }

    /**
     * 刷新模型列表
     */
    private async refreshModels(): Promise<void> {
        const refreshBtn = document.getElementById('refreshModels') as HTMLButtonElement;
        if (!refreshBtn) return;

        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="loading-spinner"></i> 刷新中...';
        refreshBtn.disabled = true;

        try {
            this.models = await aiService.getAvailableModels(true);
            this.updateModelSelect();
            await this.updateModelStats();
            this.showSuccess('模型列表已刷新');
        } catch (error) {
            this.showError('刷新模型列表失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    /**
     * 更新模型统计信息
     */
    private async updateModelStats(): Promise<void> {
        const statsDiv = document.getElementById('modelStats');
        if (!statsDiv) return;

        try {
            const stats = await aiService.getModelStats();
            statsDiv.style.display = 'block';

            const ownerEntries = Object.entries(stats.byOwner).slice(0, 4); // 只显示前4个
            const typeEntries = Object.entries(stats.byType).slice(0, 4); // 只显示前4个

            const ownerStats = ownerEntries.map(([owner, count]) =>
                `<div class="stat-item">
                    <span class="stat-value">${count}</span>
                    <span class="stat-label">${owner}</span>
                </div>`
            ).join('');

            const typeStats = typeEntries.map(([type, count]) =>
                `<div class="stat-item">
                    <span class="stat-value">${count}</span>
                    <span class="stat-label">${type}</span>
                </div>`
            ).join('');

            const cacheInfo = stats.cacheAge ?
                `<small style="color: #666;">缓存时间: ${Math.round(stats.cacheAge / 1000)}秒前</small>` : '';

            statsDiv.innerHTML = `
                <h5>模型统计 ${cacheInfo}</h5>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${stats.total}</span>
                        <span class="stat-label">总模型数</span>
                    </div>
                    ${ownerStats}
                </div>
                ${typeStats ? `
                <h6 style="margin-top: 15px; margin-bottom: 10px;">按类型分布</h6>
                <div class="stats-grid">
                    ${typeStats}
                </div>
                ` : ''}
            `;
        } catch (error) {
            console.warn('更新模型统计失败:', error);
            statsDiv.innerHTML = `
                <h5>模型统计</h5>
                <p style="color: #ef4444;">加载统计信息失败</p>
            `;
        }
    }

    /**
     * 显示模型能力信息
     */
    private showModelCapabilities(modelId: string): void {
        const capabilities = aiService.getModelCapabilities(modelId);
        const infoDiv = document.getElementById('modelInfo');
        if (!infoDiv) return;

        const selectedModel = this.models.find(m => m.id === modelId);
        if (!selectedModel) return;

        const capabilityItems = [];
        if (capabilities.maxTokens) {
            capabilityItems.push(`
                <div class="model-detail-item">
                    <span class="model-detail-label">最大Token:</span>
                    <span class="model-detail-value">${capabilities.maxTokens.toLocaleString()}</span>
                </div>
            `);
        }
        if (capabilities.supportsFunctions) {
            capabilityItems.push(`
                <div class="model-detail-item">
                    <span class="model-detail-label">函数调用:</span>
                    <span class="model-detail-value">✅ 支持</span>
                </div>
            `);
        }
        if (capabilities.supportsVision) {
            capabilityItems.push(`
                <div class="model-detail-item">
                    <span class="model-detail-label">视觉理解:</span>
                    <span class="model-detail-value">✅ 支持</span>
                </div>
            `);
        }
        if (capabilities.costTier) {
            const costLabels = { low: '💰 低', medium: '💰💰 中', high: '💰💰💰 高' };
            capabilityItems.push(`
                <div class="model-detail-item">
                    <span class="model-detail-label">成本等级:</span>
                    <span class="model-detail-value">${costLabels[capabilities.costTier]}</span>
                </div>
            `);
        }

        infoDiv.innerHTML = `
            <h5>${selectedModel.name}</h5>
            <div class="model-details">
                <div class="model-detail-item">
                    <span class="model-detail-label">模型ID:</span>
                    <span class="model-detail-value">${selectedModel.id}</span>
                </div>
                <div class="model-detail-item">
                    <span class="model-detail-label">所有者:</span>
                    <span class="model-detail-value">${selectedModel.owned_by || '未知'}</span>
                </div>
                ${capabilityItems.join('')}
                ${selectedModel.description ? `
                <div class="model-detail-item" style="grid-column: 1 / -1;">
                    <span class="model-detail-label">描述:</span>
                    <span class="model-detail-value">${selectedModel.description}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 发送测试消息
     */
    private async sendTestMessage(): Promise<void> {
        const input = document.getElementById('aiTestInput') as HTMLInputElement;
        const resultDiv = document.getElementById('aiTestResult');
        const sendBtn = document.getElementById('sendTestMessage') as HTMLButtonElement;
        
        if (!input || !resultDiv || !sendBtn) return;

        const message = input.value.trim();
        if (!message) {
            this.showError('请输入测试消息');
            return;
        }

        // 显示结果区域
        resultDiv.style.display = 'block';
        
        // 添加用户消息
        this.addTestMessage('user', message);
        
        // 清空输入框
        input.value = '';
        
        // 禁用发送按钮
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<i class="loading-spinner"></i> 发送中...';
        sendBtn.disabled = true;

        try {
            // 先保存设置
            await aiService.saveSettings(this.settings);

            if (this.settings.streamEnabled) {
                // 流式响应
                let assistantMessage = '';
                const messageDiv = this.addTestMessage('assistant', '正在思考...');
                let isFirstChunk = true;

                // 重置打字机状态
                this.resetTypewriter();

                await aiService.sendStreamMessage(
                    [{ role: 'user', content: message }],
                    (chunk) => {
                        if (chunk.choices[0]?.delta?.content) {
                            if (isFirstChunk) {
                                // 清理"正在思考..."文本
                                messageDiv.textContent = '';
                                assistantMessage = '';
                                isFirstChunk = false;
                            }
                            assistantMessage += chunk.choices[0].delta.content;

                            // 使用打字机效果更新内容
                            this.typewriterEffect(messageDiv, assistantMessage);
                        }
                    },
                    () => {
                        console.log('流式响应完成');
                        if (!assistantMessage.trim()) {
                            messageDiv.textContent = '响应完成，但未收到内容';
                            messageDiv.style.fontStyle = 'italic';
                            messageDiv.style.color = '#666';
                        }
                    },
                    (error) => {
                        this.addTestMessage('system', `流式响应错误: ${error.message}`);
                    }
                );
            } else {
                // 非流式响应
                const response = await aiService.sendMessage([{ role: 'user', content: message }]);
                const reply = response.choices[0]?.message?.content || '无响应';
                this.addTestMessage('assistant', reply);

                // 显示token使用情况
                if (response.usage) {
                    this.addTestMessage('system',
                        `Token使用: 输入${response.usage.prompt_tokens}, 输出${response.usage.completion_tokens}, 总计${response.usage.total_tokens}`
                    );
                }
            }
        } catch (error) {
            this.addTestMessage('system', `错误: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
        }
    }

    /**
     * 添加测试消息到结果区域
     */
    private addTestMessage(role: 'user' | 'assistant' | 'system', content: string): HTMLDivElement {
        const resultDiv = document.getElementById('aiTestResult');
        if (!resultDiv) throw new Error('测试结果区域不存在');

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.textContent = content;
        
        resultDiv.appendChild(messageDiv);
        resultDiv.scrollTop = resultDiv.scrollHeight;
        
        return messageDiv;
    }

    /**
     * 自动保存设置（防抖）
     */
    private autoSaveSettings(): void {
        console.log('AI设置自动保存触发', this.settings);

        // 清除之前的定时器
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // 显示保存中状态
        this.updateAutoSaveStatus('saving');

        // 设置新的定时器，500ms后执行保存
        this.autoSaveTimeout = window.setTimeout(async () => {
            await this.performAutoSave();
        }, 500);
    }

    /**
     * 执行自动保存
     */
    private async performAutoSave(): Promise<void> {
        if (this.isAutoSaving) return;

        console.log('开始执行自动保存', this.settings);
        this.isAutoSaving = true;

        try {
            await aiService.saveSettings(this.settings);
            console.log('自动保存成功');
            this.updateAutoSaveStatus('saved');

            // 更新按钮状态
            this.updateButtonStates();

            // 2秒后恢复到空闲状态
            setTimeout(() => {
                this.updateAutoSaveStatus('idle');
            }, 2000);
        } catch (error) {
            console.error('自动保存失败:', error);
            this.updateAutoSaveStatus('error');

            // 5秒后恢复到空闲状态
            setTimeout(() => {
                this.updateAutoSaveStatus('idle');
            }, 5000);
        } finally {
            this.isAutoSaving = false;
        }
    }

    /**
     * 更新自动保存状态显示
     */
    private updateAutoSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error'): void {
        const statusDiv = document.getElementById('autoSaveStatus');
        if (!statusDiv) {
            console.warn('自动保存状态元素未找到');
            return;
        }

        console.log('更新自动保存状态:', status);
        statusDiv.className = `auto-save-status ${status}`;

        const statusConfig = {
            idle: { icon: 'fas fa-circle', text: '已同步' },
            saving: { icon: 'fas fa-sync-alt', text: '保存中...' },
            saved: { icon: 'fas fa-check', text: '已保存' },
            error: { icon: 'fas fa-exclamation-triangle', text: '保存失败' }
        };

        const config = statusConfig[status];
        statusDiv.innerHTML = `<i class="${config.icon}"></i> ${config.text}`;
    }

    /**
     * 手动保存设置（保留用于重置等操作）
     */
    private async saveSettings(): Promise<void> {
        try {
            await aiService.saveSettings(this.settings);
            this.updateAutoSaveStatus('saved');
            this.showSuccess('AI设置已保存');
        } catch (error) {
            this.updateAutoSaveStatus('error');
            this.showError('保存设置失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
    }

    /**
     * 重置设置
     */
    private async resetSettings(): Promise<void> {
        if (confirm('确定要重置所有AI设置为默认值吗？')) {
            this.settings = { ...DEFAULT_AI_SETTINGS };
            this.updateUI();

            // 重置后立即保存
            await this.saveSettings();
            this.showSuccess('AI设置已重置为默认值');
        }
    }

    /**
     * 显示成功消息
     */
    private showSuccess(message: string): void {
        console.log('成功:', message);
        showMessage(message, 'success');
    }

    /**
     * 显示错误消息
     */
    private showError(message: string): void {
        console.error('错误:', message);
        showMessage(message, 'error');
    }



    /**
     * 清除测试结果
     */
    private clearTestResults(): void {
        const resultDiv = document.getElementById('aiTestResult');
        if (resultDiv) {
            resultDiv.innerHTML = '';
            resultDiv.style.display = 'none';
        }
    }

    /**
     * 获取设置验证状态
     */
    private getValidationStatus(): { valid: boolean; message: string } {
        if (!this.settings.apiUrl) {
            return { valid: false, message: '请填写API地址' };
        }
        if (!this.settings.apiKey) {
            return { valid: false, message: '请填写API密钥' };
        }
        if (!this.settings.selectedModel) {
            return { valid: false, message: '请选择模型' };
        }
        return { valid: true, message: '设置有效' };
    }

    /**
     * 导出AI设置
     */
    private exportSettings(): void {
        const exportData = {
            ...this.settings,
            apiKey: '***' // 不导出敏感信息
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showSuccess('AI设置已导出');
    }

    /**
     * 导入AI设置
     */
    private importSettings(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importedSettings = JSON.parse(text);

                // 验证导入的设置
                if (typeof importedSettings === 'object' && importedSettings.apiUrl) {
                    // 合并设置（保留当前的API密钥）
                    this.settings = {
                        ...this.settings,
                        ...importedSettings,
                        apiKey: this.settings.apiKey // 保留当前密钥
                    };

                    this.updateUI();
                    this.showSuccess('AI设置已导入');
                } else {
                    this.showError('无效的设置文件格式');
                }
            } catch (error) {
                this.showError('导入设置失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
        };

        input.click();
    }

    /**
     * 更新使用统计
     */
    private updateUsageStats(): void {
        const statsDiv = document.getElementById('aiUsageStats');
        if (!statsDiv) return;

        try {
            const stats = aiService.getUsageStats();
            const serviceStatus = aiService.getStatus();

            statsDiv.innerHTML = `
                <div class="stats-row">
                    <span class="stat-label">服务状态:</span>
                    <span class="stat-value">
                        <span class="health-indicator ${serviceStatus.connected ? 'healthy' : 'unhealthy'}">
                            <i class="fas fa-circle"></i>
                            ${serviceStatus.connected ? '已连接' : '未连接'}
                        </span>
                    </span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">当前模型:</span>
                    <span class="stat-value">${serviceStatus.currentModel || '未选择'}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">总请求数:</span>
                    <span class="stat-value">${stats.totalRequests}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">成功率:</span>
                    <span class="stat-value">
                        ${stats.totalRequests > 0 ?
                            Math.round((stats.successfulRequests / stats.totalRequests) * 100) + '%' :
                            'N/A'
                        }
                    </span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">平均响应时间:</span>
                    <span class="stat-value">${stats.averageResponseTime}ms</span>
                </div>
                ${serviceStatus.lastError ? `
                <div class="stats-row">
                    <span class="stat-label">最后错误:</span>
                    <span class="stat-value" style="color: var(--ai-error-color); font-size: 12px;">
                        ${serviceStatus.lastError}
                    </span>
                </div>
                ` : ''}
            `;
        } catch (error) {
            statsDiv.innerHTML = `
                <div class="stats-row">
                    <span class="stat-label">状态:</span>
                    <span class="stat-value" style="color: var(--ai-error-color);">
                        获取统计信息失败
                    </span>
                </div>
            `;
        }
    }

    /**
     * 添加实时验证
     */
    private addRealTimeValidation(): void {
        const apiUrlInput = document.getElementById('aiApiUrl') as HTMLInputElement;
        const apiKeyInput = document.getElementById('aiApiKey') as HTMLInputElement;

        const validateAndShow = () => {
            const validation = this.getValidationStatus();
            this.showValidationStatus(validation);
        };

        apiUrlInput?.addEventListener('blur', validateAndShow);
        apiKeyInput?.addEventListener('blur', validateAndShow);
    }

    /**
     * 显示验证状态
     */
    private showValidationStatus(validation: { valid: boolean; message: string }): void {
        let statusDiv = document.getElementById('aiValidationStatus');

        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'aiValidationStatus';
            statusDiv.className = 'validation-status';

            const apiKeyInput = document.getElementById('aiApiKey');
            if (apiKeyInput?.parentNode) {
                apiKeyInput.parentNode.insertBefore(statusDiv, apiKeyInput.nextSibling);
            }
        }

        statusDiv.className = `validation-status ${validation.valid ? 'valid' : 'invalid'}`;
        statusDiv.innerHTML = `
            <i class="fas fa-${validation.valid ? 'check-circle' : 'exclamation-circle'}"></i>
            ${validation.message}
        `;

        statusDiv.style.display = 'flex';
    }

    /**
     * 添加键盘快捷键
     */
    private addKeyboardShortcuts(): void {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter 发送测试消息
            if (e.ctrlKey && e.key === 'Enter') {
                const testInput = document.getElementById('aiTestInput') as HTMLInputElement;
                if (testInput && document.activeElement === testInput) {
                    e.preventDefault();
                    this.sendTestMessage();
                }
            }

            // Ctrl+R 重置设置
            if (e.ctrlKey && e.key === 'r') {
                const aiSettingsPanel = document.getElementById('ai-settings');
                if (aiSettingsPanel && aiSettingsPanel.classList.contains('active')) {
                    e.preventDefault();
                    this.resetSettings();
                }
            }
        });
    }

    /**
     * 打字机效果处理
     */
    private async typewriterEffect(element: HTMLElement, newContent: string): Promise<void> {
        // 将新内容添加到队列
        this.typewriterQueue.push(newContent);

        // 如果打字机正在工作，直接返回
        if (this.typewriterActive) {
            return;
        }

        this.typewriterActive = true;
        let currentText = element.textContent || '';

        while (this.typewriterQueue.length > 0) {
            const targetText = this.typewriterQueue.shift()!;

            // 如果目标文本比当前文本短，直接设置
            if (targetText.length < currentText.length) {
                currentText = targetText;
                element.textContent = currentText;
                continue;
            }

            // 逐字符添加新内容
            const newChars = targetText.slice(currentText.length);
            for (const char of newChars) {
                currentText += char;
                element.textContent = currentText;

                // 添加打字机光标效果
                element.classList.add('streaming-cursor');

                // 控制打字速度 - 根据字符类型调整
                let delay = 20; // 默认20ms
                if (char === '。' || char === '！' || char === '？' || char === '\n') {
                    delay = 100; // 句号等停顿更久
                } else if (char === '，' || char === '；') {
                    delay = 50; // 逗号等中等停顿
                } else if (char === ' ') {
                    delay = 10; // 空格很快
                }

                await new Promise(resolve => setTimeout(resolve, delay));

                // 自动滚动
                const resultDiv = document.getElementById('aiTestResult');
                if (resultDiv) {
                    resultDiv.scrollTop = resultDiv.scrollHeight;
                }
            }
        }

        // 移除光标效果
        setTimeout(() => {
            element.classList.remove('streaming-cursor');
        }, 500);

        this.typewriterActive = false;
    }

    /**
     * 重置打字机状态
     */
    private resetTypewriter(): void {
        this.typewriterQueue = [];
        this.typewriterActive = false;
    }

    /**
     * 初始化增强功能
     */
    private initEnhancements(): void {
        this.addRealTimeValidation();
        this.addKeyboardShortcuts();

        // 定期更新统计信息
        setInterval(() => {
            if (this.isInitialized) {
                this.updateUsageStats();
            }
        }, 30000); // 每30秒更新一次
    }
}

// 创建全局实例
export const aiSettingsManager = new AISettingsManager();

// 初始化函数，供dashboard调用
export async function initAISettingsTab(): Promise<void> {
    console.log('开始初始化AI设置标签页');
    try {
        await aiSettingsManager.initialize();
        console.log('AI设置标签页初始化完成');
    } catch (error) {
        console.error('AI设置标签页初始化失败:', error);
    }
}

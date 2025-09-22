/**
 * 网络测试设置面板
 * 测试网络连通性和性能，帮助诊断连接问题
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { showMessage } from '../../../ui/toast';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';

/**
 * 网络测试设置面板类
 * 基于原始network.ts的简化实现
 */
export class NetworkTestSettings extends BaseSettingsPanel {
    // 手动测试相关元素
    private manualTestBtn!: HTMLButtonElement;
    private manualUrlInput!: HTMLInputElement;
    private manualResultsDiv!: HTMLDivElement;
    private resultsContainerWrapper!: HTMLDivElement;

    // 批量测试元素
    private testAllDomainsBtn!: HTMLButtonElement;
    private testCoreDomainsBtn!: HTMLButtonElement;
    private toggleDomainConfigBtn!: HTMLButtonElement;
    private clearBatchResultsBtn!: HTMLButtonElement;
    private selectAllDomainsBtn!: HTMLButtonElement;
    private deselectAllDomainsBtn!: HTMLButtonElement;
    private resetDefaultDomainsBtn!: HTMLButtonElement;

    constructor() {
        super({
            panelId: 'network-test-settings',
            panelName: '网络测试设置',
            autoSave: false, // 网络测试不需要保存设置
            requireValidation: false
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        // 使用HTML中实际存在的元素ID（基于原始network.ts实现）
        this.manualTestBtn = document.getElementById('start-ping-test') as HTMLButtonElement;
        this.manualUrlInput = document.getElementById('ping-url') as HTMLInputElement;
        this.manualResultsDiv = document.getElementById('ping-results') as HTMLDivElement;
        this.resultsContainerWrapper = document.getElementById('ping-results-container') as HTMLDivElement;

        // 批量测试按钮
        this.testAllDomainsBtn = document.getElementById('test-all-domains') as HTMLButtonElement;
        this.testCoreDomainsBtn = document.getElementById('test-core-domains') as HTMLButtonElement;
        this.toggleDomainConfigBtn = document.getElementById('toggle-domain-config') as HTMLButtonElement;
        this.clearBatchResultsBtn = document.getElementById('clear-batch-results') as HTMLButtonElement;
        this.selectAllDomainsBtn = document.getElementById('select-all-domains') as HTMLButtonElement;
        this.deselectAllDomainsBtn = document.getElementById('deselect-all-domains') as HTMLButtonElement;
        this.resetDefaultDomainsBtn = document.getElementById('reset-default-domains') as HTMLButtonElement;

        if (!this.manualTestBtn || !this.manualUrlInput || !this.manualResultsDiv || !this.resultsContainerWrapper ||
            !this.testAllDomainsBtn || !this.testCoreDomainsBtn || !this.toggleDomainConfigBtn || !this.clearBatchResultsBtn ||
            !this.selectAllDomainsBtn || !this.deselectAllDomainsBtn || !this.resetDefaultDomainsBtn) {
            throw new Error('网络测试设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 基于原始network.ts的ping测试实现
        this.manualTestBtn.addEventListener('click', this.handlePingTest.bind(this));

        // 批量测试事件绑定
        this.testAllDomainsBtn.addEventListener('click', this.handleTestAllDomains.bind(this));
        this.testCoreDomainsBtn.addEventListener('click', this.handleTestCoreDomains.bind(this));
        this.toggleDomainConfigBtn.addEventListener('click', this.handleToggleDomainConfig.bind(this));
        this.clearBatchResultsBtn.addEventListener('click', this.handleClearBatchResults.bind(this));
        this.selectAllDomainsBtn.addEventListener('click', this.handleSelectAllDomains.bind(this));
        this.deselectAllDomainsBtn.addEventListener('click', this.handleDeselectAllDomains.bind(this));
        this.resetDefaultDomainsBtn.addEventListener('click', this.handleResetDefaultDomains.bind(this));
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.manualTestBtn?.removeEventListener('click', this.handlePingTest.bind(this));
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        // 网络测试面板不需要加载设置，只需要初始化UI状态
        if (this.manualResultsDiv) {
            this.manualResultsDiv.innerHTML = '<p class="test-placeholder">点击上方按钮开始网络测试</p>';
        }
        if (this.resultsContainerWrapper) {
            this.resultsContainerWrapper.style.display = 'none';
        }
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        // 网络测试面板不需要保存设置
        return { success: true };
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        // 网络测试面板不需要验证设置
        return { isValid: true };
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        // 网络测试面板不需要返回设置
        return {};
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(_settings: Partial<ExtensionSettings>): void {
        // 网络测试面板不需要设置数据到UI
    }

    /**
     * 处理ping测试（基于原始network.ts实现）
     */
    private async handlePingTest(): Promise<void> {
        const urlValue = this.manualUrlInput.value.trim();
        if (!urlValue) {
            // 显示结果容器并显示错误信息
            this.resultsContainerWrapper.style.display = 'block';
            this.manualResultsDiv.innerHTML = '<div class="ping-result-item failure"><i class="fas fa-times-circle icon"></i><span>请输入一个有效的 URL。</span></div>';
            return;
        }

        // 显示结果容器
        this.resultsContainerWrapper.style.display = 'block';

        const buttonText = this.manualTestBtn.querySelector('.button-text') as HTMLSpanElement;
        const spinner = this.manualTestBtn.querySelector('.spinner') as HTMLDivElement;

        this.manualTestBtn.disabled = true;
        if (buttonText) buttonText.textContent = '测试中...';
        if (spinner) spinner.classList.remove('hidden');
        this.manualResultsDiv.innerHTML = '';

        const onProgress = (message: string, success: boolean, latency?: number) => {
            const item = document.createElement('div');
            item.classList.add('ping-result-item');
            item.classList.add(success ? 'success' : 'failure');
            const iconClass = success ? 'fa-check-circle' : 'fa-times-circle';
            let content = `<i class="fas ${iconClass} icon"></i>`;
            if (typeof latency !== 'undefined') {
                content += `<span>${message}: 时间=${latency}ms</span>`;
            } else {
                content += `<span>${message}</span>`;
            }
            item.innerHTML = content;
            this.manualResultsDiv.appendChild(item);
            this.manualResultsDiv.scrollTop = this.manualResultsDiv.scrollHeight;
        };

        const urlsToTest: string[] = [];
        if (urlValue.match(/^https?:\/\//)) {
            urlsToTest.push(urlValue);
        } else {
            urlsToTest.push(`https://${urlValue}`);
            urlsToTest.push(`http://${urlValue}`);
        }

        for (const url of urlsToTest) {
            await this.runPingTest(url, onProgress);
            // Add a separator if there are more tests to run
            if (urlsToTest.length > 1 && url !== urlsToTest[urlsToTest.length - 1]) {
                const separator = document.createElement('hr');
                separator.style.marginTop = '20px';
                separator.style.marginBottom = '20px';
                separator.style.border = 'none';
                separator.style.borderTop = '1px solid #ccc';
                this.manualResultsDiv.appendChild(separator);
            }
        }

        this.manualTestBtn.disabled = false;
        if (buttonText) buttonText.textContent = '开始测试';
        if (spinner) spinner.classList.add('hidden');
    }

    /**
     * 执行ping测试（基于原始network.ts实现）
     */
    private async runPingTest(
        url: string,
        onProgress: (message: string, success: boolean, latency?: number) => void
    ): Promise<void> {
        try {
            const latencies = await this.ping(url, onProgress, 4);

            // Remove the "Pinging..." message for this specific test
            const pingingMessage = Array.from(this.manualResultsDiv.children).find(child => {
                const txt = (child as HTMLElement).textContent || '';
                return txt.includes(`正在 Ping ${url}`);
            });
            if (pingingMessage) {
                this.manualResultsDiv.removeChild(pingingMessage);
            }

            const validLatencies = latencies.filter(l => l >= 0);
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'ping-summary';

            if (validLatencies.length > 0) {
                const sum = validLatencies.reduce((a, b) => a + b, 0);
                const avg = Math.round(sum / validLatencies.length);
                const min = Math.min(...validLatencies);
                const max = Math.max(...validLatencies);
                const loss = ((latencies.length - validLatencies.length) / latencies.length) * 100;

                summaryDiv.innerHTML = `
                    <h5>Ping 统计信息 for ${url}</h5>
                    <p><strong>数据包:</strong> 已发送 = ${latencies.length}, 已接收 = ${validLatencies.length}, 丢失 = ${latencies.length - validLatencies.length} (${loss}% 丢失)</p>
                    <p><strong>往返行程的估计时间 (ms):</strong></p>
                    <p style="margin-left: 15px;">最短 = ${min}ms, 最长 = ${max}ms, 平均 = ${avg}ms</p>
                `;
            } else {
                summaryDiv.innerHTML = `
                    <h5>Ping 统计信息 for ${url}</h5>
                    <p>所有 ping 请求均失败。请检查 URL 或您的网络连接。</p>
                `;
            }
            this.manualResultsDiv.appendChild(summaryDiv);
        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'ping-result-item failure';
            const message = error instanceof Error ? error.message : String(error);
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle icon"></i><span>测试 ${url} 过程中出现错误: ${message}</span>`;
            this.manualResultsDiv.appendChild(errorDiv);
        }
    }

    /**
     * 模拟ping功能，测试到指定URL的网络延迟（基于原始network.ts实现）
     */
    private async ping(
        url: string,
        onProgress: (message: string, success: boolean, latency?: number) => void,
        count = 4
    ): Promise<number[]> {
        const latencies: number[] = [];
        const testUrl = url;

        onProgress(`正在 Ping ${testUrl} ...`, true);

        for (let i = 0; i < count; i++) {
            const startTime = Date.now();
            try {
                const cacheBuster = `?t=${new Date().getTime()}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                await fetch(testUrl + cacheBuster, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const latency = Date.now() - startTime;
                latencies.push(latency);
                onProgress(`来自 ${testUrl} 的回复`, true, latency);

                if (i < count - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                const latency = Date.now() - startTime;
                let errorMessage = '未知错误';
                if (error instanceof Error) {
                    errorMessage = error.name === 'AbortError' ? '请求超时' : error.message;
                }
                onProgress(`请求失败: ${errorMessage}`, false, latency);
                latencies.push(-1);
            }
        }
        return latencies;
    }

    /**
     * 处理测试所有域名
     */
    private async handleTestAllDomains(): Promise<void> {
        try {
            showMessage('开始测试所有域名...', 'info');
            // TODO: 实现批量域名测试逻辑
            console.log('测试所有域名功能待实现');
            showMessage('测试所有域名功能正在开发中', 'warn');
        } catch (error) {
            console.error('测试所有域名失败:', error);
            showMessage('测试所有域名失败', 'error');
        }
    }

    /**
     * 处理测试核心域名
     */
    private async handleTestCoreDomains(): Promise<void> {
        try {
            showMessage('开始测试核心域名...', 'info');
            // TODO: 实现核心域名测试逻辑
            console.log('测试核心域名功能待实现');
            showMessage('测试核心域名功能正在开发中', 'warn');
        } catch (error) {
            console.error('测试核心域名失败:', error);
            showMessage('测试核心域名失败', 'error');
        }
    }

    /**
     * 处理切换域名配置面板
     */
    private handleToggleDomainConfig(): void {
        const configPanel = document.getElementById('domain-config-panel');
        if (configPanel) {
            const isHidden = configPanel.style.display === 'none' || !configPanel.style.display;
            configPanel.style.display = isHidden ? 'block' : 'none';
            this.toggleDomainConfigBtn.innerHTML = isHidden
                ? '<i class="fas fa-cog"></i><span class="button-text">隐藏配置</span>'
                : '<i class="fas fa-cog"></i><span class="button-text">配置域名</span>';
        }
    }

    /**
     * 处理清空批量测试结果
     */
    private handleClearBatchResults(): void {
        const batchResults = document.getElementById('batch-test-results');
        if (batchResults) {
            batchResults.innerHTML = `
                <div class="batch-results-placeholder">
                    <i class="fas fa-info-circle"></i>
                    <p>点击上方按钮开始批量测试</p>
                </div>
            `;
            batchResults.style.display = 'none';
        }
        showMessage('批量测试结果已清空', 'success');
    }

    /**
     * 处理全选域名
     */
    private handleSelectAllDomains(): void {
        const checkboxes = document.querySelectorAll('#domain-config-content input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            (checkbox as HTMLInputElement).checked = true;
        });
        showMessage('已全选所有域名', 'success');
    }

    /**
     * 处理全不选域名
     */
    private handleDeselectAllDomains(): void {
        const checkboxes = document.querySelectorAll('#domain-config-content input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            (checkbox as HTMLInputElement).checked = false;
        });
        showMessage('已取消选择所有域名', 'success');
    }

    /**
     * 处理恢复默认域名配置
     */
    private handleResetDefaultDomains(): void {
        // TODO: 实现恢复默认域名配置逻辑
        console.log('恢复默认域名配置功能待实现');
        showMessage('恢复默认域名配置功能正在开发中', 'warn');
    }

}

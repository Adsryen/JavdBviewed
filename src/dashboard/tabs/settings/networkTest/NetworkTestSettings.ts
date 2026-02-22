/**
 * 网络测试设置面板
 * 测试网络连通性和性能，帮助诊断连接问题
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { showMessage } from '../../../ui/toast';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { 
    getAllEnabledDomains, 
    getDomainsByCategory, 
    EXTENSION_DOMAINS,
    saveDomainConfig,
    loadDomainConfig,
    type DomainInfo 
} from '../../../../utils/domainConfig';

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

    // 上次测试时间的存储键
    private readonly LAST_TEST_TIME_KEY = 'network_test_last_time';

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
        // 加载域名配置
        loadDomainConfig();

        // 网络测试面板不需要加载设置，只需要初始化UI状态
        if (this.manualResultsDiv) {
            this.manualResultsDiv.innerHTML = '<p class="test-placeholder">点击上方按钮开始网络测试</p>';
        }
        if (this.resultsContainerWrapper) {
            this.resultsContainerWrapper.style.display = 'none';
        }

        // 更新域名统计信息
        this.updateDomainStats();
        
        // 加载上次测试时间
        this.loadLastTestTime();
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
            const allDomains = getAllEnabledDomains();
            if (allDomains.length === 0) {
                showMessage('没有启用的域名需要测试', 'warn');
                return;
            }

            showMessage(`开始测试 ${allDomains.length} 个域名...`, 'info');
            await this.runBatchDomainTest(allDomains, '所有域名');
        } catch (error) {
            console.error('[Settings] 测试所有域名失败:', error);
            showMessage('测试所有域名失败', 'error');
        }
    }

    /**
     * 处理测试核心域名
     */
    private async handleTestCoreDomains(): Promise<void> {
        try {
            const coreDomains = getDomainsByCategory('core');
            if (coreDomains.length === 0) {
                showMessage('没有启用的核心域名需要测试', 'warn');
                return;
            }

            showMessage(`开始测试 ${coreDomains.length} 个核心域名...`, 'info');
            await this.runBatchDomainTest(coreDomains, '核心域名');
        } catch (error) {
            console.error('[Settings] 测试核心域名失败:', error);
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
            
            if (isHidden) {
                // 显示配置面板前，先生成域名配置UI
                this.renderDomainConfig();
                configPanel.style.display = 'block';
                this.toggleDomainConfigBtn.innerHTML = '<i class="fas fa-cog"></i><span class="button-text">隐藏配置</span>';
            } else {
                configPanel.style.display = 'none';
                this.toggleDomainConfigBtn.innerHTML = '<i class="fas fa-cog"></i><span class="button-text">配置域名</span>';
            }
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
            const cb = checkbox as HTMLInputElement;
            cb.checked = true;
            // 更新域名状态
            const cat = cb.dataset.category!;
            const idx = parseInt(cb.dataset.index!);
            EXTENSION_DOMAINS[cat].domains[idx].enabled = true;
        });
        this.updateDomainStats();
        saveDomainConfig();
        showMessage('已全选所有域名', 'success');
    }

    /**
     * 处理全不选域名
     */
    private handleDeselectAllDomains(): void {
        const checkboxes = document.querySelectorAll('#domain-config-content input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const cb = checkbox as HTMLInputElement;
            cb.checked = false;
            // 更新域名状态
            const cat = cb.dataset.category!;
            const idx = parseInt(cb.dataset.index!);
            EXTENSION_DOMAINS[cat].domains[idx].enabled = false;
        });
        this.updateDomainStats();
        saveDomainConfig();
        showMessage('已取消选择所有域名', 'success');
    }

    /**
     * 处理恢复默认域名配置
     */
    private handleResetDefaultDomains(): void {
        // 重新渲染域名配置，所有域名默认启用
        Object.values(EXTENSION_DOMAINS).forEach(category => {
            category.domains.forEach(domain => {
                domain.enabled = true;
            });
        });
        
        this.renderDomainConfig();
        this.updateDomainStats();
        saveDomainConfig();
        showMessage('已恢复默认域名配置', 'success');
    }

    /**
     * 渲染域名配置UI
     */
    private renderDomainConfig(): void {
        const configContent = document.getElementById('domain-config-content');
        if (!configContent) return;

        configContent.innerHTML = '';

        // 遍历所有分类
        Object.entries(EXTENSION_DOMAINS).forEach(([categoryKey, category]) => {
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'domain-category-group';
            categoryGroup.dataset.category = categoryKey;

            categoryGroup.innerHTML = `
                <h6>${category.icon} ${category.name}</h6>
                <div class="domain-category-description">${category.description}</div>
                <div class="domain-checkbox-list"></div>
            `;

            const checkboxList = categoryGroup.querySelector('.domain-checkbox-list') as HTMLDivElement;

            // 添加该分类下的所有域名
            category.domains.forEach((domain, index) => {
                const checkboxItem = document.createElement('div');
                checkboxItem.className = 'domain-checkbox-item';

                const checkboxId = `domain-${categoryKey}-${index}`;
                
                checkboxItem.innerHTML = `
                    <input type="checkbox" 
                           id="${checkboxId}" 
                           ${domain.enabled ? 'checked' : ''}
                           data-category="${categoryKey}"
                           data-index="${index}">
                    <label for="${checkboxId}" class="domain-checkbox-label">
                        <div class="domain-checkbox-name">
                            <span>${domain.name}</span>
                            <span class="domain-priority-badge ${domain.priority}">${this.getPriorityText(domain.priority)}</span>
                        </div>
                        <div class="domain-checkbox-url">${domain.domain}</div>
                        <div class="domain-checkbox-description">${domain.description}</div>
                    </label>
                `;

                // 添加复选框变化事件
                const checkbox = checkboxItem.querySelector('input[type="checkbox"]') as HTMLInputElement;
                checkbox.addEventListener('change', (e) => {
                    const target = e.target as HTMLInputElement;
                    const cat = target.dataset.category!;
                    const idx = parseInt(target.dataset.index!);
                    EXTENSION_DOMAINS[cat].domains[idx].enabled = target.checked;
                    // 更新统计信息
                    this.updateDomainStats();
                    // 保存配置
                    saveDomainConfig();
                });

                checkboxList.appendChild(checkboxItem);
            });

            configContent.appendChild(categoryGroup);
        });
    }

    /**
     * 批量测试域名
     */
    private async runBatchDomainTest(domains: DomainInfo[], testType: string): Promise<void> {
        const batchResults = document.getElementById('batch-test-results');
        if (!batchResults) {
            console.error('[Settings] 批量测试结果容器未找到');
            return;
        }

        // 显示结果容器
        batchResults.style.display = 'block';
        batchResults.innerHTML = `
            <div class="batch-test-header">
                <h4>正在测试${testType}...</h4>
                <div class="test-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">0 / ${domains.length}</div>
                </div>
            </div>
            <div class="batch-test-results-grid"></div>
        `;

        const resultsGrid = batchResults.querySelector('.batch-test-results-grid') as HTMLDivElement;
        const progressFill = batchResults.querySelector('.progress-fill') as HTMLDivElement;
        const progressText = batchResults.querySelector('.progress-text') as HTMLDivElement;

        let completedCount = 0;
        let successCount = 0;
        let failureCount = 0;

        // 禁用测试按钮
        this.testAllDomainsBtn.disabled = true;
        this.testCoreDomainsBtn.disabled = true;

        // 按分类组织域名
        const domainsByCategory = this.groupDomainsByCategory(domains);

        // 测试每个域名
        for (const [categoryName, categoryDomains] of Object.entries(domainsByCategory)) {
            // 添加分类标题
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'batch-category-header';
            categoryHeader.innerHTML = `
                <h5>${categoryName}</h5>
            `;
            resultsGrid.appendChild(categoryHeader);

            // 测试该分类下的所有域名
            for (const domain of categoryDomains) {
                const result = await this.testSingleDomain(domain);
                
                // 创建结果项
                const resultItem = document.createElement('div');
                resultItem.className = `batch-result-item ${result.success ? 'success' : 'failure'}`;
                
                const statusIcon = result.success ? 'fa-check-circle' : 'fa-times-circle';
                const statusText = result.success ? '可访问' : '无法访问';
                const latencyText = result.latency >= 0 ? `${result.latency}ms` : 'N/A';
                
                resultItem.innerHTML = `
                    <div class="result-header">
                        <i class="fas ${statusIcon}"></i>
                        <span class="domain-name">${domain.name}</span>
                        <span class="domain-status">${statusText}</span>
                    </div>
                    <div class="result-details">
                        <div class="domain-url">${domain.domain}</div>
                        <div class="domain-info">
                            <span class="latency">延迟: ${latencyText}</span>
                            <span class="priority">优先级: ${this.getPriorityText(domain.priority)}</span>
                        </div>
                        ${domain.description ? `<div class="domain-description">${domain.description}</div>` : ''}
                        ${result.error ? `<div class="error-message">${result.error}</div>` : ''}
                    </div>
                `;
                
                resultsGrid.appendChild(resultItem);

                // 更新统计
                completedCount++;
                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                }

                // 更新进度
                const progress = (completedCount / domains.length) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${completedCount} / ${domains.length}`;

                // 滚动到最新结果
                resultItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // 添加测试摘要
        const summary = document.createElement('div');
        summary.className = 'batch-test-summary';
        summary.innerHTML = `
            <h5>测试完成</h5>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-label">总计:</span>
                    <span class="stat-value">${domains.length}</span>
                </div>
                <div class="stat-item success">
                    <span class="stat-label">成功:</span>
                    <span class="stat-value">${successCount}</span>
                </div>
                <div class="stat-item failure">
                    <span class="stat-label">失败:</span>
                    <span class="stat-value">${failureCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">成功率:</span>
                    <span class="stat-value">${((successCount / domains.length) * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
        batchResults.insertBefore(summary, resultsGrid);

        // 重新启用测试按钮
        this.testAllDomainsBtn.disabled = false;
        this.testCoreDomainsBtn.disabled = false;

        // 显示完成消息
        const successRate = ((successCount / domains.length) * 100).toFixed(1);
        showMessage(`测试完成！成功: ${successCount}/${domains.length} (${successRate}%)`, 
                    successCount === domains.length ? 'success' : 'warn');

        // 保存测试时间
        this.saveLastTestTime();
    }

    /**
     * 测试单个域名
     */
    private async testSingleDomain(domain: DomainInfo): Promise<{
        success: boolean;
        latency: number;
        error?: string;
    }> {
        const testUrl = `https://${domain.domain}`;
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            await fetch(testUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;

            return {
                success: true,
                latency
            };
        } catch (error) {
            const latency = Date.now() - startTime;
            let errorMessage = '未知错误';
            
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = '请求超时';
                } else {
                    errorMessage = error.message;
                }
            }

            return {
                success: false,
                latency,
                error: errorMessage
            };
        }
    }

    /**
     * 按分类组织域名
     */
    private groupDomainsByCategory(domains: DomainInfo[]): Record<string, DomainInfo[]> {
        const grouped: Record<string, DomainInfo[]> = {};

        // 遍历所有分类
        Object.entries(EXTENSION_DOMAINS).forEach(([categoryKey, category]) => {
            const categoryDomains = domains.filter(domain => 
                category.domains.some(d => d.domain === domain.domain)
            );

            if (categoryDomains.length > 0) {
                grouped[`${category.icon} ${category.name}`] = categoryDomains;
            }
        });

        return grouped;
    }

    /**
     * 获取优先级文本
     */
    private getPriorityText(priority: 'high' | 'medium' | 'low'): string {
        const priorityMap = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return priorityMap[priority];
    }

    /**
     * 更新域名统计信息
     */
    private updateDomainStats(): void {
        const totalDomainsEl = document.getElementById('total-domains');
        const enabledDomainsEl = document.getElementById('enabled-domains');
        
        if (totalDomainsEl && enabledDomainsEl) {
            let total = 0;
            let enabled = 0;

            Object.values(EXTENSION_DOMAINS).forEach(category => {
                category.domains.forEach(domain => {
                    total++;
                    if (domain.enabled) {
                        enabled++;
                    }
                });
            });

            totalDomainsEl.textContent = total.toString();
            enabledDomainsEl.textContent = enabled.toString();
        }
    }

    /**
     * 保存上次测试时间
     */
    private saveLastTestTime(): void {
        const now = new Date().toISOString();
        localStorage.setItem(this.LAST_TEST_TIME_KEY, now);
        this.updateLastTestTimeDisplay(now);
    }

    /**
     * 加载上次测试时间
     */
    private loadLastTestTime(): void {
        const lastTime = localStorage.getItem(this.LAST_TEST_TIME_KEY);
        this.updateLastTestTimeDisplay(lastTime);
    }

    /**
     * 更新上次测试时间显示
     */
    private updateLastTestTimeDisplay(isoTime: string | null): void {
        const lastTestTimeEl = document.getElementById('last-test-time');
        if (!lastTestTimeEl) return;

        if (!isoTime) {
            lastTestTimeEl.textContent = '从未';
            return;
        }

        try {
            const testDate = new Date(isoTime);
            const now = new Date();
            const diffMs = now.getTime() - testDate.getTime();
            const diffMinutes = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            let timeText = '';
            if (diffMinutes < 1) {
                timeText = '刚刚';
            } else if (diffMinutes < 60) {
                timeText = `${diffMinutes}分钟前`;
            } else if (diffHours < 24) {
                timeText = `${diffHours}小时前`;
            } else if (diffDays < 7) {
                timeText = `${diffDays}天前`;
            } else {
                // 显示具体日期
                const year = testDate.getFullYear();
                const month = String(testDate.getMonth() + 1).padStart(2, '0');
                const day = String(testDate.getDate()).padStart(2, '0');
                const hours = String(testDate.getHours()).padStart(2, '0');
                const minutes = String(testDate.getMinutes()).padStart(2, '0');
                timeText = `${year}-${month}-${day} ${hours}:${minutes}`;
            }

            lastTestTimeEl.textContent = timeText;
            lastTestTimeEl.title = testDate.toLocaleString('zh-CN');
        } catch (error) {
            console.error('[Settings] 解析测试时间失败:', error);
            lastTestTimeEl.textContent = '从未';
        }
    }

}

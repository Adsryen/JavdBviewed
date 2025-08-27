/**
 * Emby增强设置面板
 * 配置Emby/Jellyfin等媒体服务器的番号识别和跳转功能
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { saveSettings } from '../../../../utils/storage';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import type { ExtensionSettings } from '../../../../types';

/**
 * Emby设置面板类
 */
export class EmbySettings extends BaseSettingsPanel {
    private enabledToggle!: HTMLInputElement;
    private matchUrlsList!: HTMLDivElement;
    private addUrlBtn!: HTMLButtonElement;
    private linkBehaviorSelect!: HTMLSelectElement;
    private autoDetectionToggle!: HTMLInputElement;
    private testCurrentPageBtn!: HTMLButtonElement;
    private testSampleUrlsBtn!: HTMLButtonElement;
    private testResultDiv!: HTMLDivElement;

    constructor() {
        super({
            panelId: 'emby-settings',
            panelName: 'Emby增强设置',
            autoSave: true,
            saveDelay: 1000,
            requireValidation: true
        });
    }

    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        this.enabledToggle = document.getElementById('emby-enabled') as HTMLInputElement;
        this.matchUrlsList = document.getElementById('emby-match-urls-list') as HTMLDivElement;
        this.addUrlBtn = document.getElementById('add-emby-url') as HTMLButtonElement;
        this.linkBehaviorSelect = document.getElementById('emby-link-behavior') as HTMLSelectElement;
        this.autoDetectionToggle = document.getElementById('emby-auto-detection') as HTMLInputElement;
        this.testCurrentPageBtn = document.getElementById('test-current-page') as HTMLButtonElement;
        this.testSampleUrlsBtn = document.getElementById('test-sample-urls') as HTMLButtonElement;
        this.testResultDiv = document.getElementById('test-result') as HTMLDivElement;

        if (!this.enabledToggle || !this.matchUrlsList || !this.addUrlBtn || 
            !this.linkBehaviorSelect || !this.autoDetectionToggle) {
            throw new Error('Emby设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        this.enabledToggle.addEventListener('change', this.handleEnabledChange.bind(this));
        this.addUrlBtn.addEventListener('click', this.handleAddUrl.bind(this));
        this.matchUrlsList.addEventListener('click', this.handleUrlListClick.bind(this));
        this.matchUrlsList.addEventListener('input', this.handleUrlListInput.bind(this));
        this.linkBehaviorSelect.addEventListener('change', this.handleSettingsChange.bind(this));
        this.autoDetectionToggle.addEventListener('change', this.handleSettingsChange.bind(this));
        
        if (this.testCurrentPageBtn) {
            this.testCurrentPageBtn.addEventListener('click', this.handleTestCurrentPage.bind(this));
        }
        if (this.testSampleUrlsBtn) {
            this.testSampleUrlsBtn.addEventListener('click', this.handleTestSampleUrls.bind(this));
        }
    }

    /**
     * 解绑事件监听器
     */
    protected unbindEvents(): void {
        this.enabledToggle?.removeEventListener('change', this.handleEnabledChange.bind(this));
        this.addUrlBtn?.removeEventListener('click', this.handleAddUrl.bind(this));
        this.matchUrlsList?.removeEventListener('click', this.handleUrlListClick.bind(this));
        this.matchUrlsList?.removeEventListener('input', this.handleUrlListInput.bind(this));
        this.linkBehaviorSelect?.removeEventListener('change', this.handleSettingsChange.bind(this));
        this.autoDetectionToggle?.removeEventListener('change', this.handleSettingsChange.bind(this));
        
        if (this.testCurrentPageBtn) {
            this.testCurrentPageBtn?.removeEventListener('click', this.handleTestCurrentPage.bind(this));
        }
        if (this.testSampleUrlsBtn) {
            this.testSampleUrlsBtn?.removeEventListener('click', this.handleTestSampleUrls.bind(this));
        }
    }

    /**
     * 加载设置到UI
     */
    protected async doLoadSettings(): Promise<void> {
        const settings = STATE.settings;
        const embyConfig = settings?.emby;

        if (embyConfig) {
            this.enabledToggle.checked = embyConfig.enabled;
            this.linkBehaviorSelect.value = embyConfig.linkBehavior;
            this.autoDetectionToggle.checked = embyConfig.enableAutoDetection;
            
            this.renderMatchUrls();
            this.updateUIState();
        }
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        try {
            this.updateEmbyConfigFromUI();
            
            const newSettings: ExtensionSettings = {
                ...STATE.settings,
                emby: { ...STATE.settings.emby }
            };

            await saveSettings(newSettings);
            STATE.settings = newSettings;

            // 通知所有标签页设置已更新
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'settings-updated',
                                settings: { emby: newSettings.emby }
                            }).catch(() => {
                                // 忽略无法发送消息的标签页
                            });
                        }
                    });
                });
            }

            return {
                success: true,
                savedSettings: { emby: newSettings.emby }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '保存设置失败'
            };
        }
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 验证URL模式
        const urls = this.getUrlsFromUI();
        for (const url of urls) {
            if (!url.trim()) {
                errors.push('URL模式不能为空');
                continue;
            }
            
            // 简单的URL格式验证
            if (!this.isValidUrlPattern(url)) {
                warnings.push(`URL模式可能无效: ${url}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }

    /**
     * 处理设置变化
     */
    private handleSettingsChange(): void {
        // 触发自动保存
        if (this.config.autoSave) {
            this.scheduleAutoSave();
        }
    }

    /**
     * 处理启用状态变化
     */
    private handleEnabledChange(): void {
        this.updateUIState();
        this.handleSettingsChange();
    }

    /**
     * 更新UI状态
     */
    private updateUIState(): void {
        const enabled = this.enabledToggle.checked;
        const elements = [
            this.matchUrlsList,
            this.addUrlBtn,
            this.linkBehaviorSelect,
            this.autoDetectionToggle,
            this.testCurrentPageBtn
        ];

        elements.forEach(element => {
            if (element) {
                if ('disabled' in element) {
                    (element as HTMLInputElement | HTMLButtonElement | HTMLSelectElement).disabled = !enabled;
                }
                if (element.parentElement) {
                    element.parentElement.style.opacity = enabled ? '1' : '0.5';
                }
            }
        });
    }

    /**
     * 渲染匹配URL列表
     */
    private renderMatchUrls(): void {
        const urls = STATE.settings.emby?.matchUrls || [];
        
        this.matchUrlsList.innerHTML = urls.map((url, index) => `
            <div class="url-item" data-index="${index}">
                <input type="text" class="url-input" value="${url}" placeholder="输入URL模式，如 *.emby.com/*">
                <button type="button" class="remove-url-btn" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // 如果没有URL，添加一个空的输入框
        if (urls.length === 0) {
            this.addEmptyUrlInput();
        }
    }

    /**
     * 添加空的URL输入框
     */
    private addEmptyUrlInput(): void {
        const index = this.matchUrlsList.children.length;
        const urlItem = document.createElement('div');
        urlItem.className = 'url-item';
        urlItem.dataset.index = index.toString();
        urlItem.innerHTML = `
            <input type="text" class="url-input" value="" placeholder="输入URL模式，如 *.emby.com/*">
            <button type="button" class="remove-url-btn" title="删除">
                <i class="fas fa-trash"></i>
            </button>
        `;
        this.matchUrlsList.appendChild(urlItem);
    }

    /**
     * 处理添加URL
     */
    private handleAddUrl(): void {
        this.addEmptyUrlInput();
    }

    /**
     * 处理URL列表点击事件
     */
    private handleUrlListClick(event: Event): void {
        const target = event.target as HTMLElement;
        
        if (target.classList.contains('remove-url-btn') || target.closest('.remove-url-btn')) {
            const urlItem = target.closest('.url-item') as HTMLElement;
            if (urlItem) {
                urlItem.remove();
                this.handleSettingsChange();
            }
        }
    }

    /**
     * 处理URL列表输入事件
     */
    private handleUrlListInput(): void {
        this.handleSettingsChange();
    }

    /**
     * 从UI获取URL列表
     */
    private getUrlsFromUI(): string[] {
        const inputs = this.matchUrlsList.querySelectorAll('.url-input') as NodeListOf<HTMLInputElement>;
        return Array.from(inputs).map(input => input.value.trim()).filter(url => url);
    }

    /**
     * 从UI更新Emby配置
     */
    private updateEmbyConfigFromUI(): void {
        if (!STATE.settings.emby) {
            STATE.settings.emby = {
                enabled: false,
                matchUrls: [
                    'http://localhost:8096/*',
                    'https://localhost:8920/*',
                    'http://127.0.0.1:8096/*',
                    'http://192.168.*.*:8096/*',
                    'https://*.emby.com/*',
                    'https://*.jellyfin.org/*'
                ],
                videoCodePatterns: [],
                linkBehavior: 'javdb-search',
                enableAutoDetection: true,
                highlightStyle: {
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '4px',
                    padding: '2px 4px'
                }
            };
        }

        STATE.settings.emby.enabled = this.enabledToggle.checked;
        STATE.settings.emby.matchUrls = this.getUrlsFromUI();
        STATE.settings.emby.linkBehavior = this.linkBehaviorSelect.value as 'javdb-direct' | 'javdb-search';
        STATE.settings.emby.enableAutoDetection = this.autoDetectionToggle.checked;
    }

    /**
     * 验证URL模式是否有效
     */
    private isValidUrlPattern(pattern: string): boolean {
        try {
            // 简单的URL模式验证
            const regex = pattern
                .replace(/\*/g, '.*')
                .replace(/\./g, '\\.');
            new RegExp(regex);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 测试当前页面是否匹配
     */
    private handleTestCurrentPage(): void {
        if (!this.testResultDiv) return;

        try {
            const currentUrl = window.location.href;
            const urls = this.getUrlsFromUI();
            
            // 检查是否是扩展页面
            const isExtensionPage = currentUrl.startsWith('chrome-extension://') || currentUrl.startsWith('extension://');
            
            if (isExtensionPage) {
                // 为扩展页面添加测试番号
                this.addTestVideoCodesForExtensionPage();
                
                // 使用固定的测试番号（包含说明中的示例）
                const testCodes = ['ABC-123', 'FC2-PPV-123456', 'GVH-301', 'ABW-152', 'ABW-153'];
                let resultHtml = `
                    <div class="test-info">
                        <strong>扩展页面番号检测测试</strong><br>
                        当前页面: ${currentUrl}<br><br>
                        检测到的测试番号:
                    </div>
                `;
                
                // 显示番号库统计信息
                const totalRecords = STATE.records?.length || 0;
                resultHtml += `<div style="background: #f8f9fa; padding: 8px; margin-bottom: 12px; border-radius: 4px; font-size: 13px;">
                    📊 当前番号库状态: ${totalRecords > 0 ? `已加载 ${totalRecords} 条记录` : '番号库为空'}
                </div>`;

                // 显示测试说明
                resultHtml += `<div style="background: #e8f5e8; padding: 8px; margin-bottom: 12px; border-radius: 4px; font-size: 13px;">
                    🧪 使用固定测试番号（包含说明文档中的示例）
                </div>`;

                testCodes.forEach((code: string) => {
                    // 真实番号库查询
                    const hasRecord = this.simulateRecordLookup(code);
                    const jumpTarget = hasRecord ? 'JavDB详情页面' : 'JavDB搜索页面';
                    const statusIcon = hasRecord ? '🎯' : '🔍';
                    
                    // 生成实际的跳转URL
                    const jumpUrl = this.generateTestJumpUrl(code, hasRecord);
                    
                    resultHtml += `<div class="test-success" style="margin: 8px 0; padding: 8px;">
                        ${statusIcon} 检测到番号: <strong>${code}</strong>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">
                            点击后的跳转效果: ${jumpTarget}<br>
                            <span style="font-family: monospace; color: #0066cc;">${jumpUrl}</span>
                        </div>
                    </div>`;
                });
                
                this.testResultDiv.innerHTML = resultHtml;
                return;
            }
            
            // 普通页面的URL匹配测试
            let matched = false;
            let matchedPattern = '';

            for (const pattern of urls) {
                if (this.testUrlMatch(currentUrl, pattern)) {
                    matched = true;
                    matchedPattern = pattern;
                    break;
                }
            }

            this.testResultDiv.innerHTML = matched 
                ? `<div class="test-success">✓ 当前页面匹配模式: ${matchedPattern}</div>`
                : `<div class="test-failure">✗ 当前页面不匹配任何模式</div>`;
        } catch (error) {
            this.testResultDiv.innerHTML = `<div class="test-error">测试失败: ${error}</div>`;
        }
    }

    /**
     * 为扩展页面添加测试番号元素
     */
    private addTestVideoCodesForExtensionPage(): void {
        // 移除已存在的测试元素
        const existingTest = document.querySelector('.emby-test-codes');
        if (existingTest) {
            existingTest.remove();
        }

        // 创建测试番号容器
        const testContainer = document.createElement('div');
        testContainer.className = 'emby-test-codes';
        testContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            padding: 16px;
            font-family: monospace;
            font-size: 14px;
            z-index: 9999;
            max-width: 300px;
        `;
        
        testContainer.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 12px; color: #495057;">
                🧪 Emby功能测试番号
            </div>
            <div style="margin-bottom: 8px;">GVH-301 (标准格式)</div>
            <div style="margin-bottom: 8px;">ABW-152 (标准格式)</div>
            <div style="margin-bottom: 8px;">ABW-153 (标准格式)</div>
            <div style="font-size: 12px; color: #6c757d; margin-top: 12px;">
                这些番号用于测试Emby增强功能的番号识别和链接转换
            </div>
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                color: #6c757d;
            ">×</button>
        `;
        
        document.body.appendChild(testContainer);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (testContainer.parentElement) {
                testContainer.remove();
            }
        }, 10000);
    }

    /**
     * 真实的番号库查询
     */
    private simulateRecordLookup(videoId: string): boolean {
        // 查询真实的番号库记录
        if (!STATE.records || STATE.records.length === 0) {
            console.log('番号库为空或未加载');
            return false;
        }
        
        // 在真实记录中查找番号
        const record = STATE.records.find(r => r.id === videoId);
        const hasRecord = record && record.javdbUrl && record.javdbUrl !== '#';
        
        console.log(`番号库查询: ${videoId} -> ${hasRecord ? '找到记录' : '未找到记录'}`, record);
        return !!hasRecord;
    }

    /**
     * 从文本中提取番号
     */
    private extractVideoCodesFromText(text: string): string[] {
        const videoIds: string[] = [];
        const patterns = [
            '[A-Z]{2,6}-\\d{2,6}', // 标准格式: ABC-123, ABCD-123
            'FC2-PPV-\\d+', // FC2格式
        ];

        patterns.forEach(pattern => {
            try {
                const regex = new RegExp(pattern, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach((match: string) => {
                        const cleanId = match.trim().toUpperCase();
                        // 过滤掉明显不是番号的匹配
                        if (cleanId && !videoIds.includes(cleanId) && this.isValidVideoCode(cleanId)) {
                            videoIds.push(cleanId);
                        }
                    });
                }
            } catch (error) {
                console.warn('Invalid regex pattern:', pattern, error);
            }
        });

        return videoIds;
    }

    /**
     * 验证是否是有效的番号
     */
    private isValidVideoCode(code: string): boolean {
        // 过滤掉常见的非番号匹配
        const invalidPatterns = [
            /^\d{1,3}-\d{1,3}$/, // 简单数字组合如 1-1, 123-456
            /^[A-Z]{1,2}-\d{1,2}$/, // 太短的组合如 A-1, AB-12
            /^\d{4}-\d{2}-\d{2}$/, // 日期格式
            /^HTTP-\d+$/i, // HTTP状态码
            /^CSS-\d+$/i, // CSS相关
            /^JS-\d+$/i, // JavaScript相关
        ];

        return !invalidPatterns.some(pattern => pattern.test(code));
    }

    /**
     * 生成测试跳转URL
     */
    private generateTestJumpUrl(videoId: string, hasRecord: boolean): string {
        if (hasRecord) {
            // 如果有记录，显示直接链接（模拟）
            const record = STATE.records?.find(r => r.id === videoId);
            if (record?.javdbUrl && record.javdbUrl !== '#') {
                return record.javdbUrl;
            }
        }

        // 使用搜索引擎配置生成URL
        const searchEngines = STATE.settings?.searchEngines || [];
        const javdbEngine = searchEngines.find(engine => engine.id === 'javdb');
        
        if (javdbEngine) {
            return javdbEngine.urlTemplate.replace('{{ID}}', encodeURIComponent(videoId));
        }

        // 默认使用JavDB搜索
        return `https://javdb.com/search?q=${encodeURIComponent(videoId)}&f=all`;
    }

    /**
     * 测试示例网址
     */
    private handleTestSampleUrls(): void {
        if (!this.testResultDiv) return;

        try {
            const urls = this.getUrlsFromUI();
            if (urls.length === 0) {
                this.testResultDiv.innerHTML = `<div class="test-error">请先添加至少一个网址模式</div>`;
                return;
            }

            // 示例测试网址（根据用户实际配置动态判断）
            const testCases = [
                // 典型的Emby/Jellyfin页面 - 根据配置判断是否应该匹配
                { url: 'http://192.168.1.100:8096/web/index.html#!/movies.html', description: 'Emby本地服务器电影页面', suggestion: 'http://192.168.*.*:8096/*' },
                { url: 'https://emby.mydomain.com/web/index.html#!/item?id=123456', description: 'Emby远程服务器详情页', suggestion: 'https://*.mydomain.com/*' },
                { url: 'http://jellyfin.local:8920/web/index.html#!/library?tab=0', description: 'Jellyfin媒体库页面', suggestion: 'http://jellyfin.local:8920/*' },
                
                // 其他类型的页面
                { url: 'http://192.168.1.100:8096/System/Configuration', description: 'Emby管理后台页面', suggestion: 'http://192.168.*.*:8096/System/*' },
                { url: 'https://app.plex.tv/desktop/#!/media', description: 'Plex媒体服务器页面', suggestion: 'https://app.plex.tv/*' },
                { url: 'http://nas.local:5000/webman/index.cgi', description: 'NAS管理界面', suggestion: 'http://nas.local:5000/*' }
            ];

            let resultHtml = '<div class="test-results-container">';
            let totalCount = testCases.length;

            // 调试：显示当前配置的URL模式
            resultHtml += `<div class="test-debug" style="background: #f8f9fa; padding: 12px; margin-bottom: 16px; border-radius: 6px; font-family: monospace; font-size: 13px;">
                <strong>当前配置的URL模式 (${urls.length}个):</strong><br>
                ${urls.length > 0 ? urls.map(u => `• ${u}`).join('<br>') : '(无配置)'}
            </div>`;

            for (const testCase of testCases) {
                let matched = false;
                let matchedPattern = '';
                let debugInfo = '';

                for (const pattern of urls) {
                    if (this.testUrlMatch(testCase.url, pattern)) {
                        matched = true;
                        matchedPattern = pattern;
                        break;
                    }
                }

                // 添加调试信息：显示所有模式的匹配尝试
                if (urls.length > 0) {
                    let debugLines = [];
                    for (const pattern of urls) {
                        const regexPattern = pattern
                            .replace(/\*/g, '___WILDCARD___')
                            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                            .replace(/___WILDCARD___/g, '.*');
                        const regex = new RegExp('^' + regexPattern + '$');
                        const matches = regex.test(testCase.url);
                        debugLines.push(`"${pattern}" → "^${regexPattern}$" ${matches ? '✓' : '✗'}`);
                    }
                    
                    // 添加建议的正确模式
                    const suggestionLine = `<div style="color: #059669; font-weight: 500; margin-top: 6px;">💡 建议模式: ${testCase.suggestion}</div>`;
                    
                    debugInfo = `<div class="test-debug-pattern" style="font-size: 12px; color: #666; margin-top: 4px;">
                        ${debugLines.join('<br>')}
                        ${suggestionLine}
                    </div>`;
                }

                const statusClass = matched ? 'test-success' : 'test-info';
                const statusIcon = matched ? '✓' : '○';
                const matchInfo = matched ? `匹配模式: ${matchedPattern}` : '无匹配';
                
                resultHtml += `
                    <div class="${statusClass} test-case">
                        <div class="test-case-header">
                            ${statusIcon} ${testCase.description}
                        </div>
                        <div class="test-case-details">
                            <div class="test-url">网址: ${testCase.url}</div>
                            <div class="test-result">结果: ${matchInfo}</div>
                            ${debugInfo}
                        </div>
                    </div>
                `;
            }

            const matchedUrls = testCases.filter((testCase) => {
                for (const pattern of urls) {
                    if (this.testUrlMatch(testCase.url, pattern)) {
                        return true;
                    }
                }
                return false;
            });

            resultHtml += `
                <div class="test-summary test-info">
                    测试完成: ${matchedUrls.length}/${totalCount} 个网址匹配当前配置
                    <br><small>这显示了您的网址模式会匹配哪些测试网址。根据需要调整模式以匹配或排除特定网址。</small>
                </div>
            </div>`;

            this.testResultDiv.innerHTML = resultHtml;
        } catch (error) {
            this.testResultDiv.innerHTML = `<div class="test-error">测试失败: ${error}</div>`;
        }
    }

    /**
     * 测试URL是否匹配模式
     */
    private testUrlMatch(url: string, pattern: string): boolean {
        try {
            // 先替换通配符，再转义其他特殊字符
            const regexPattern = pattern
                .replace(/\*/g, '___WILDCARD___')  // 临时标记通配符
                .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // 转义正则特殊字符
                .replace(/___WILDCARD___/g, '.*');  // 恢复通配符为 .*
            
            const regex = new RegExp('^' + regexPattern + '$');
            const result = regex.test(url);
            
            // 调试信息
            if (process.env.NODE_ENV === 'development') {
                console.log(`URL匹配调试:`, {
                    url,
                    pattern,
                    regexPattern: '^' + regexPattern + '$',
                    result
                });
            }
            
            return result;
        } catch (error) {
            console.error('URL匹配错误:', error);
            return false;
        }
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        return {
            emby: STATE.settings.emby
        };
    }

    /**
     * 设置配置
     */
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
        if (settings.emby) {
            STATE.settings.emby = { ...STATE.settings.emby, ...settings.emby };
        }
    }
}

/**
 * 高级配置设置面板
 * JSON配置编辑、演员库管理、数据结构检查等高级功能
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';

/**
 * 高级配置设置面板类
 * 基于原始advanced.ts的dataViewModal实现
 */
export class AdvancedSettings extends BaseSettingsPanel {
    // 基于HTML中实际存在的按钮元素
    private viewJsonBtn!: HTMLButtonElement;
    private editJsonBtn!: HTMLButtonElement;
    private exportJsonBtn!: HTMLButtonElement;
    private viewRawLogsBtn!: HTMLButtonElement;
    private testLogBtn!: HTMLButtonElement;

    constructor() {
        super({
            panelId: 'advanced-settings',
            panelName: '高级配置',
            autoSave: false, // 高级配置需要手动保存
            requireValidation: true
        });
    }


    /**
     * 初始化DOM元素
     */
    protected initializeElements(): void {
        console.log('[AdvancedSettings] 开始初始化DOM元素');
        
        // 使用HTML中实际存在的元素ID（基于原始advanced.ts实现）
        this.viewJsonBtn = document.getElementById('viewJsonBtn') as HTMLButtonElement;
        this.editJsonBtn = document.getElementById('editJsonBtn') as HTMLButtonElement;
        this.exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
        this.viewRawLogsBtn = document.getElementById('viewRawLogsBtn') as HTMLButtonElement;
        this.testLogBtn = document.getElementById('testLogBtn') as HTMLButtonElement;

        console.log('[AdvancedSettings] DOM元素查找结果:', {
            viewJsonBtn: !!this.viewJsonBtn,
            editJsonBtn: !!this.editJsonBtn,
            exportJsonBtn: !!this.exportJsonBtn,
            viewRawLogsBtn: !!this.viewRawLogsBtn,
            testLogBtn: !!this.testLogBtn
        });

        if (!this.viewJsonBtn || !this.editJsonBtn || !this.exportJsonBtn) {
            console.error('[AdvancedSettings] 缺少必需的DOM元素');
            throw new Error('高级配置设置相关的DOM元素未找到');
        }
        
        console.log('[AdvancedSettings] DOM元素初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        console.log('[AdvancedSettings] 开始绑定事件监听器');
        
        // 基于原始advanced.ts的事件绑定
        this.viewJsonBtn.addEventListener('click', this.handleViewJson.bind(this));
        this.editJsonBtn.addEventListener('click', this.handleEditJson.bind(this));
        this.exportJsonBtn.addEventListener('click', this.handleExportData.bind(this));

        // 可选元素的事件绑定
        if (this.viewRawLogsBtn) {
            this.viewRawLogsBtn.addEventListener('click', this.handleViewRawLogs.bind(this));
            console.log('[AdvancedSettings] viewRawLogsBtn 事件已绑定');
        }
        if (this.testLogBtn) {
            this.testLogBtn.addEventListener('click', this.handleTestLog.bind(this));
            console.log('[AdvancedSettings] testLogBtn 事件已绑定');
        }
        
        console.log('[AdvancedSettings] 事件监听器绑定完成');
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
        // 高级配置不需要加载设置，所有操作都是按需执行
    }

    /**
     * 保存设置
     */
    protected async doSaveSettings(): Promise<SettingsSaveResult> {
        // 高级配置不需要保存设置，所有操作都是即时的
        return { success: true };
    }

    /**
     * 验证设置
     */
    protected doValidateSettings(): SettingsValidationResult {
        // 高级配置不需要验证，所有操作都是即时的
        return { isValid: true };
    }

    /**
     * 获取当前设置
     */
    protected doGetSettings(): Partial<ExtensionSettings> {
        // 高级配置不返回设置，所有操作都是即时的
        return {};
    }

    /**
     * 设置数据到UI
     */
    protected doSetSettings(_settings: Partial<ExtensionSettings>): void {
        // 高级配置不需要设置数据到UI
    }

    // ===== 基于原始advanced.ts的事件处理方法 =====

    /**
     * 查看JSON设置（只读模式）
     */
    private async handleViewJson(): Promise<void> {
        try {
            const { dataViewModal } = await import('../../../ui/dataViewModal');
            dataViewModal.show({
                title: '原始设置 (JSON)',
                data: STATE.settings,
                dataType: 'json',
                enableFilter: true,
                keyLabels: {
                    display: '显示设置',
                    actorLibrary: '演员库',
                    webdav: 'WebDAV',
                    dataSync: '数据同步',
                    actorSync: '演员同步',
                    privacy: '隐私保护',
                    searchEngines: '搜索引擎',
                    logging: '日志',
                    drive115: '115 网盘',
                    dataEnhancement: '数据增强',
                    translation: '翻译',
                    userExperience: '用户体验',
                    magnetSearch: '磁力搜索',
                    videoEnhancement: '影片页增强',
                    contentFilter: '内容过滤',
                    anchorOptimization: '锚点优化',
                    listEnhancement: '列表增强',
                    actorEnhancement: '演员页增强',
                    emby: 'Emby',
                    ai: 'AI',
                    version: '版本',
                    recordsPerPage: '每页记录数',
                    showCoversInRecords: '记录列表显示封面',
                    autoUpdateCheck: '自动检查更新',
                    updateCheckInterval: '检查间隔',
                    includePrerelease: '包含预发布'
                },
                editable: false,
                filename: `javdb-settings-${new Date().toISOString().split('T')[0]}.json`,
                info: '当前扩展的所有设置配置'
            });
        } catch (error) {
            console.error('查看JSON设置失败:', error);
            showMessage('查看JSON设置失败', 'error');
        }
    }

    /**
     * 编辑JSON设置（可编辑模式）
     */
    private async handleEditJson(): Promise<void> {
        try {
            const { dataViewModal } = await import('../../../ui/dataViewModal');
            const { applyImportedData } = await import('../../../import');

            dataViewModal.show({
                title: '编辑设置 (JSON)',
                data: STATE.settings,
                dataType: 'json',
                editable: true,
                enableFilter: true,
                keyLabels: {
                    display: '显示设置',
                    actorLibrary: '演员库',
                    webdav: 'WebDAV',
                    dataSync: '数据同步',
                    actorSync: '演员同步',
                    privacy: '隐私保护',
                    searchEngines: '搜索引擎',
                    logging: '日志',
                    drive115: '115 网盘',
                    dataEnhancement: '数据增强',
                    translation: '翻译',
                    userExperience: '用户体验',
                    magnetSearch: '磁力搜索',
                    videoEnhancement: '影片页增强',
                    contentFilter: '内容过滤',
                    anchorOptimization: '锚点优化',
                    listEnhancement: '列表增强',
                    actorEnhancement: '演员页增强',
                    emby: 'Emby',
                    ai: 'AI',
                    version: '版本',
                    recordsPerPage: '每页记录数',
                    showCoversInRecords: '记录列表显示封面',
                    autoUpdateCheck: '自动检查更新',
                    updateCheckInterval: '检查间隔',
                    includePrerelease: '包含预发布'
                },
                onSave: async (data: string) => {
                    try {
                        const settingsObject = JSON.parse(data);
                        await applyImportedData(JSON.stringify({ settings: settingsObject }));
                        await logAsync('INFO', 'JSON 配置已通过弹窗编辑器更新');
                        showMessage('JSON配置已更新', 'success');
                    } catch (error) {
                        console.error('保存JSON配置失败:', error);
                        showMessage('保存JSON配置失败', 'error');
                    }
                },
                info: '编辑模式 - 请谨慎修改配置'
            });
        } catch (error) {
            console.error('编辑JSON设置失败:', error);
            showMessage('编辑JSON设置失败', 'error');
        }
    }

    /**
     * 导出完整数据
     */
    private async handleExportData(): Promise<void> {
        try {
            await logAsync('INFO', '用户在"高级设置"中点击了导出按钮');

            const exportData = {
                settings: STATE.settings,
                records: STATE.records,
                logs: STATE.logs,
                exportedAt: new Date().toISOString(),
                version: '1.13.356'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `javdb-complete-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showMessage('完整备份已导出', 'success');
            await logAsync('INFO', '完整数据备份导出成功');
        } catch (error) {
            console.error('导出数据失败:', error);
            showMessage('导出数据失败', 'error');
            await logAsync('ERROR', '导出数据失败', { error });
        }
    }

    /**
     * 查看原始日志
     */
    private async handleViewRawLogs(): Promise<void> {
        try {
            const { dataViewModal } = await import('../../../ui/dataViewModal');
            const logs = STATE.logs || [];
            dataViewModal.show({
                title: '原始日志 (Raw Logs)',
                data: logs,
                dataType: 'json',
                editable: false,
                filename: `javdb-logs-${new Date().toISOString().split('T')[0]}.json`,
                info: `共 ${logs.length} 条日志记录`
            });
        } catch (error) {
            console.error('查看原始日志失败:', error);
            showMessage('查看原始日志失败', 'error');
        }
    }

    /**
     * 测试日志功能
     */
    private async handleTestLog(): Promise<void> {
        try {
            console.log("Attempting to send a test log message...");
            await logAsync('INFO', 'This is a test log from the dashboard.', { timestamp: new Date().toLocaleTimeString() });
            showMessage('测试日志已发送', 'success');
        } catch (error) {
            console.error('测试日志失败:', error);
            showMessage('测试日志失败', 'error');
        }
    }


}

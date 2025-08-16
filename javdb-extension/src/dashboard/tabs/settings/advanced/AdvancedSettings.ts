/**
 * 高级配置设置面板
 * JSON配置编辑、演员库管理、数据结构检查等高级功能
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import { getValue, saveSettings } from '../../../../utils/storage';
import { actorManager } from '../../../../services/actorManager';
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
    private viewRawRecordsBtn!: HTMLButtonElement;
    private checkDataStructureBtn!: HTMLButtonElement;
    private viewActorsBtn!: HTMLButtonElement;
    private editActorsBtn!: HTMLButtonElement;
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
        // 使用HTML中实际存在的元素ID（基于原始advanced.ts实现）
        this.viewJsonBtn = document.getElementById('viewJsonBtn') as HTMLButtonElement;
        this.editJsonBtn = document.getElementById('editJsonBtn') as HTMLButtonElement;
        this.exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
        this.viewRawRecordsBtn = document.getElementById('viewRawRecordsBtn') as HTMLButtonElement;
        this.checkDataStructureBtn = document.getElementById('checkDataStructureBtn') as HTMLButtonElement;
        this.viewActorsBtn = document.getElementById('viewActorsBtn') as HTMLButtonElement;
        this.editActorsBtn = document.getElementById('editActorsBtn') as HTMLButtonElement;
        this.viewRawLogsBtn = document.getElementById('viewRawLogsBtn') as HTMLButtonElement;
        this.testLogBtn = document.getElementById('testLogBtn') as HTMLButtonElement;

        if (!this.viewJsonBtn || !this.editJsonBtn || !this.exportJsonBtn ||
            !this.viewRawRecordsBtn || !this.checkDataStructureBtn || !this.viewActorsBtn) {
            throw new Error('高级配置设置相关的DOM元素未找到');
        }
    }

    /**
     * 绑定事件监听器
     */
    protected bindEvents(): void {
        // 基于原始advanced.ts的事件绑定
        this.viewJsonBtn.addEventListener('click', this.handleViewJson.bind(this));
        this.editJsonBtn.addEventListener('click', this.handleEditJson.bind(this));
        this.exportJsonBtn.addEventListener('click', this.handleExportData.bind(this));
        this.viewRawRecordsBtn.addEventListener('click', this.handleViewRawRecords.bind(this));
        this.checkDataStructureBtn.addEventListener('click', this.handleDataStructureCheck.bind(this));
        this.viewActorsBtn.addEventListener('click', this.handleViewActors.bind(this));

        // 可选元素的事件绑定
        if (this.editActorsBtn) {
            this.editActorsBtn.addEventListener('click', this.handleEditActors.bind(this));
        }
        if (this.viewRawLogsBtn) {
            this.viewRawLogsBtn.addEventListener('click', this.handleViewRawLogs.bind(this));
        }
        if (this.testLogBtn) {
            this.testLogBtn.addEventListener('click', this.handleTestLog.bind(this));
        }
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
    protected doSetSettings(settings: Partial<ExtensionSettings>): void {
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
     * 查看原始记录数据
     */
    private async handleViewRawRecords(): Promise<void> {
        try {
            const { dataViewModal } = await import('../../../ui/dataViewModal');
            const records = STATE.records || [];
            dataViewModal.show({
                title: '原始番号库数据 (Raw Records)',
                data: records,
                dataType: 'json',
                editable: false,
                filename: `javdb-records-${new Date().toISOString().split('T')[0]}.json`,
                info: `共 ${Object.keys(records).length} 条番号记录`
            });
        } catch (error) {
            console.error('查看原始记录数据失败:', error);
            showMessage('查看原始记录数据失败', 'error');
        }
    }

    /**
     * 数据结构检查
     */
    private async handleDataStructureCheck(): Promise<void> {
        try {
            const { dataViewModal } = await import('../../../ui/dataViewModal');
            const records = STATE.records || {};

            // 简化的数据结构分析
            const analysis = this.analyzeDataStructure(records);

            dataViewModal.show({
                title: '数据结构分析报告',
                data: analysis,
                dataType: 'text',
                editable: false,
                filename: `javdb-structure-analysis-${new Date().toISOString().split('T')[0]}.txt`,
                info: '数据结构完整性检查结果'
            });

        } catch (error) {
            console.error('数据结构检查失败:', error);
            showMessage('数据结构检查失败', 'error');
        }
    }
    /**
     * 查看演员数据（只读）
     */
    private async handleViewActors(): Promise<void> {
        try {
            const { dataViewModal } = await import('../../../ui/dataViewModal');
            const { getValue } = await import('../../../../utils/storage');

            const actorsData = await getValue('actors', {});

            dataViewModal.show({
                title: '演员库数据',
                data: actorsData,
                dataType: 'json',
                editable: false,
                filename: `javdb-actors-${new Date().toISOString().split('T')[0]}.json`,
                info: `共 ${Object.keys(actorsData).length} 个演员记录`
            });
        } catch (error) {
            console.error('加载演员数据失败:', error);
            showMessage('加载演员数据失败', 'error');
        }
    }

    /**
     * 编辑演员数据（可编辑保存）
     */
    private async handleEditActors(): Promise<void> {
        try {
            const { dataViewModal } = await import('../../../ui/dataViewModal');
            const { getValue, setValue } = await import('../../../../utils/storage');

            const actorsData = await getValue('actors', {});

            dataViewModal.show({
                title: '编辑演员库 (JSON)',
                data: actorsData,
                dataType: 'json',
                editable: true,
                info: '编辑模式 - 请谨慎修改，保存将覆盖现有演员库',
                onSave: async (text: string) => {
                    try {
                        const parsed = JSON.parse(text);
                        await setValue('actors', parsed);
                        showMessage('演员库已保存', 'success');
                    } catch (e) {
                        console.error('保存演员库失败:', e);
                        showMessage('保存演员库失败：' + (e as Error).message, 'error');
                    }
                }
            });
        } catch (error) {
            console.error('加载演员数据失败:', error);
            showMessage('加载演员数据失败', 'error');
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

    // ===== 辅助方法 =====

    /**
     * 分析数据结构（基于原始advanced.ts实现）
     */
    private analyzeDataStructure(records: Record<string, any>): string {
        const analysis = [];
        const recordsArray = Object.values(records);

        analysis.push('=== 番号库数据结构分析报告 ===\n');
        analysis.push(`生成时间: ${new Date().toLocaleString()}\n`);
        analysis.push(`总记录数: ${recordsArray.length}\n`);

        if (recordsArray.length === 0) {
            analysis.push('\n⚠️ 警告: 没有找到任何记录\n');
            return analysis.join('');
        }

        // 状态统计
        const statusStats: Record<string, number> = {};
        recordsArray.forEach(record => {
            const status = record.status || 'unknown';
            statusStats[status] = (statusStats[status] || 0) + 1;
        });

        analysis.push('\n=== 状态分布 ===');
        Object.entries(statusStats).forEach(([status, count]) => {
            analysis.push(`${status}: ${count} 条记录`);
        });

        // 字段完整性检查
        analysis.push('\n=== 字段完整性检查 ===');
        const requiredFields = ['title', 'status', 'timestamp'];
        const fieldStats: Record<string, { missing: number, empty: number }> = {};

        requiredFields.forEach(field => {
            fieldStats[field] = { missing: 0, empty: 0 };
        });

        recordsArray.forEach(record => {
            requiredFields.forEach(field => {
                if (!(field in record)) {
                    fieldStats[field].missing++;
                } else if (!record[field]) {
                    fieldStats[field].empty++;
                }
            });
        });

        requiredFields.forEach(field => {
            const stats = fieldStats[field];
            if (stats.missing > 0 || stats.empty > 0) {
                analysis.push(`⚠️ ${field}: 缺失 ${stats.missing} 个, 空值 ${stats.empty} 个`);
            } else {
                analysis.push(`✅ ${field}: 完整`);
            }
        });

        return analysis.join('\n');
    }


}

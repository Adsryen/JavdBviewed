/**
 * 高级配置设置面板
 * JSON配置编辑、演员库管理、数据结构检查等高级功能
 */

import { STATE } from '../../../state';
import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import { logAsync } from '../../../logger';
import { showMessage } from '../../../ui/toast';
import { STORAGE_KEYS, VIDEO_STATUS } from '../../../../utils/config';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { dbViewedCount, dbViewedPage, dbViewedExport, type ViewedPageParams } from '../../../dbClient';

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

    // ===== IndexedDB 分页查看器（源数据） =====
    private idbViewerOverlay: HTMLDivElement | null = null;
    private idbViewerTextarea: HTMLTextAreaElement | null = null;
    private idbViewerInfo: HTMLDivElement | null = null;
    private idbViewerCloseBtn: HTMLButtonElement | null = null;
    private idbViewerPrevBtn: HTMLButtonElement | null = null;
    private idbViewerNextBtn: HTMLButtonElement | null = null;
    private idbViewerExportBtn: HTMLButtonElement | null = null;
    private idbViewerStatusSel: HTMLSelectElement | null = null;
    private idbViewerOrderBySel: HTMLSelectElement | null = null;
    private idbViewerOrderSel: HTMLSelectElement | null = null;
    private idbViewerPageSizeSel: HTMLSelectElement | null = null;
    private idbCurrentPage = 1;
    private idbTotal = 0;
    private idbPageSize = 50;

    private async showViewedRecordsPager(): Promise<void> {
        if (!this.idbViewerOverlay) this.createIdbViewer();
        if (!this.idbViewerOverlay) return;
        this.idbCurrentPage = 1;
        await this.loadAndRenderIdbPage();
        this.idbViewerOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    private createIdbViewer(): void {
        const overlay = document.createElement('div');
        overlay.id = 'idb-viewer-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.45)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'none';

        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.top = '5%';
        panel.style.left = '50%';
        panel.style.transform = 'translateX(-50%)';
        panel.style.width = '90%';
        panel.style.maxWidth = '1100px';
        panel.style.maxHeight = '90%';
        panel.style.background = '#fff';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.padding = '12px 16px';
        header.style.borderBottom = '1px solid #eee';
        const title = document.createElement('h3');
        title.textContent = '番号源数据（IndexedDB 分页）';
        title.style.margin = '0';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.className = 'btn btn-secondary';
        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        });
        header.appendChild(title);
        header.appendChild(closeBtn);

        const toolbar = document.createElement('div');
        toolbar.style.display = 'flex';
        toolbar.style.gap = '8px';
        toolbar.style.alignItems = 'center';
        toolbar.style.padding = '8px 16px';
        toolbar.style.borderBottom = '1px solid #f0f0f0';

        const statusSel = document.createElement('select');
        statusSel.innerHTML = `
            <option value="ALL">全部状态</option>
            <option value="${VIDEO_STATUS.VIEWED}">已观看</option>
            <option value="${VIDEO_STATUS.WANT}">想看</option>
            <option value="${VIDEO_STATUS.BROWSED}">已浏览</option>
        `;
        statusSel.addEventListener('change', () => { this.idbCurrentPage = 1; this.loadAndRenderIdbPage(); });

        const orderBySel = document.createElement('select');
        orderBySel.innerHTML = `<option value="updatedAt">按更新时间</option><option value="createdAt">按创建时间</option>`;
        orderBySel.addEventListener('change', () => { this.idbCurrentPage = 1; this.loadAndRenderIdbPage(); });

        const orderSel = document.createElement('select');
        orderSel.innerHTML = `<option value="desc">倒序</option><option value="asc">正序</option>`;
        orderSel.addEventListener('change', () => { this.idbCurrentPage = 1; this.loadAndRenderIdbPage(); });

        const pageSizeSel = document.createElement('select');
        pageSizeSel.innerHTML = `<option>20</option><option selected>50</option><option>100</option><option>200</option>`;
        pageSizeSel.addEventListener('change', () => {
            const v = parseInt(pageSizeSel.value, 10);
            this.idbPageSize = Number.isFinite(v) && v > 0 ? v : 50;
            this.idbCurrentPage = 1;
            this.loadAndRenderIdbPage();
        });

        const exportBtn = document.createElement('button');
        exportBtn.textContent = '导出JSON';
        exportBtn.className = 'btn btn-outline';
        exportBtn.addEventListener('click', async () => {
            try {
                const json = await dbViewedExport();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `javdb-records-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('导出失败', e);
                showMessage('导出失败', 'error');
            }
        });

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一页';
        prevBtn.className = 'btn';
        prevBtn.addEventListener('click', () => {
            if (this.idbCurrentPage > 1) { this.idbCurrentPage--; this.loadAndRenderIdbPage(); }
        });

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页';
        nextBtn.className = 'btn';
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(this.idbTotal / this.idbPageSize));
            if (this.idbCurrentPage < totalPages) { this.idbCurrentPage++; this.loadAndRenderIdbPage(); }
        });

        const info = document.createElement('div');
        info.style.marginLeft = 'auto';
        info.style.color = '#666';

        toolbar.appendChild(statusSel);
        toolbar.appendChild(orderBySel);
        toolbar.appendChild(orderSel);
        toolbar.appendChild(pageSizeSel);
        toolbar.appendChild(prevBtn);
        toolbar.appendChild(nextBtn);
        toolbar.appendChild(exportBtn);
        toolbar.appendChild(info);

        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.padding = '12px 16px';
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.minHeight = '360px';
        textarea.readOnly = true;
        content.appendChild(textarea);

        panel.appendChild(header);
        panel.appendChild(toolbar);
        panel.appendChild(content);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        this.idbViewerOverlay = overlay;
        this.idbViewerTextarea = textarea;
        this.idbViewerInfo = info;
        this.idbViewerCloseBtn = closeBtn;
        this.idbViewerPrevBtn = prevBtn;
        this.idbViewerNextBtn = nextBtn;
        this.idbViewerExportBtn = exportBtn;
        this.idbViewerStatusSel = statusSel;
        this.idbViewerOrderBySel = orderBySel;
        this.idbViewerOrderSel = orderSel;
        this.idbViewerPageSizeSel = pageSizeSel;
    }

    private async loadAndRenderIdbPage(): Promise<void> {
        if (!this.idbViewerTextarea || !this.idbViewerInfo) return;
        const statusRaw = this.idbViewerStatusSel?.value || 'ALL';
        const status = statusRaw === 'ALL' ? undefined : (statusRaw as any);
        const orderBy = (this.idbViewerOrderBySel?.value || 'updatedAt') as 'updatedAt' | 'createdAt';
        const order = (this.idbViewerOrderSel?.value || 'desc') as 'asc' | 'desc';
        const offset = (this.idbCurrentPage - 1) * this.idbPageSize;
        const limit = this.idbPageSize;

        try {
            // total
            const total = await dbViewedCount(status as any);
            this.idbTotal = total || 0;
            // page
            const { items } = await dbViewedPage({ offset, limit, status: status as any, orderBy, order } as ViewedPageParams);
            this.idbViewerTextarea.value = JSON.stringify(items, null, 2);
            const totalPages = Math.max(1, Math.ceil(this.idbTotal / this.idbPageSize));
            this.idbViewerInfo.textContent = `第 ${this.idbCurrentPage}/${totalPages} 页 · 共 ${this.idbTotal} 条 · 每页 ${this.idbPageSize}`;
        } catch (e) {
            console.error('加载 IDB 源数据失败', e);
            this.idbViewerTextarea.value = '// 加载失败，请检查后台脚本是否运行';
            this.idbViewerInfo.textContent = '加载失败';
        }
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
        // 新实现：使用 IndexedDB 分页查看，避免一次性加载巨大数据
        try {
            await this.showViewedRecordsPager();
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
            const { getValue: getVal } = await import('../../../../utils/storage');

            // 读取正确的演员库存储键
            const actorsData = await getVal(STORAGE_KEYS.ACTOR_RECORDS, {} as Record<string, any>);

            dataViewModal.show({
                title: '演员库数据',
                data: actorsData,
                dataType: 'json',
                editable: false,
                filename: `javdb-actors-${new Date().toISOString().split('T')[0]}.json`,
                info: `共 ${Object.keys(actorsData || {}).length} 个演员记录`
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
            const { getValue: getVal, setValue: setVal } = await import('../../../../utils/storage');

            // 读取正确的演员库存储键
            const actorsData = await getVal(STORAGE_KEYS.ACTOR_RECORDS, {} as Record<string, any>);

            dataViewModal.show({
                title: '编辑演员库 (JSON)',
                data: actorsData,
                dataType: 'json',
                editable: true,
                info: '编辑模式 - 请谨慎修改，保存将覆盖现有演员库',
                onSave: async (text: string) => {
                    try {
                        const parsed = JSON.parse(text);
                        // 保存到正确的演员库存储键
                        await setVal(STORAGE_KEYS.ACTOR_RECORDS, parsed);
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

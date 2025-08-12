import { STATE } from '../state';
import { getValue, setValue } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import { applyImportedData } from '../import';
import type { LogEntry, VideoRecord, OldVideoRecord, VideoStatus, ActorRecord } from '../../types';
import { STORAGE_KEYS } from '../../utils/config';
import { dataViewModal } from '../ui/dataViewModal';

// 默认视频记录结构
const DEFAULT_VIDEO_RECORD: Partial<VideoRecord> = {
    id: '',
    title: '',
    status: 'viewed' as VideoStatus,
    createdAt: 0,
    updatedAt: 0,
    url: '',
    tags: [],
    actors: [],
    studio: '',
    releaseDate: '',
    duration: '',
    rating: 0,
    notes: ''
};

export function initAdvancedSettingsTab(): void {
    // 新的按钮引用
    const viewJsonBtn = document.getElementById('viewJsonBtn') as HTMLButtonElement;
    const editJsonBtn = document.getElementById('editJsonBtn') as HTMLButtonElement;
    const exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
    const viewRawLogsBtn = document.getElementById('viewRawLogsBtn') as HTMLButtonElement;
    const testLogBtn = document.getElementById('testLogBtn') as HTMLButtonElement;
    const viewRawRecordsBtn = document.getElementById('viewRawRecordsBtn') as HTMLButtonElement;
    const checkDataStructureBtn = document.getElementById('checkDataStructureBtn') as HTMLButtonElement;
    const viewActorsBtn = document.getElementById('viewActorsBtn') as HTMLButtonElement;

    if (!viewJsonBtn || !editJsonBtn || !exportJsonBtn || !viewRawLogsBtn || !testLogBtn || !viewRawRecordsBtn || !checkDataStructureBtn || !viewActorsBtn) {
        console.error("One or more elements for Advanced Settings not found. Aborting init.");
        return;
    }

    // 新的事件监听器 - 使用弹窗系统
    viewJsonBtn.addEventListener('click', () => {
        dataViewModal.show({
            title: '原始设置 (JSON)',
            data: STATE.settings,
            dataType: 'json',
            editable: false,
            filename: `javdb-settings-${new Date().toISOString().split('T')[0]}.json`,
            info: '当前扩展的所有设置配置'
        });
    });

    editJsonBtn.addEventListener('click', () => {
        dataViewModal.show({
            title: '编辑设置 (JSON)',
            data: STATE.settings,
            dataType: 'json',
            editable: true,
            onSave: async (data: string) => {
                const settingsObject = JSON.parse(data);
                await applyImportedData(JSON.stringify({ settings: settingsObject }));
                logAsync('JSON 配置已通过弹窗编辑器更新', 'INFO');
            },
            info: '编辑模式 - 请谨慎修改配置'
        });
    });

    exportJsonBtn.addEventListener('click', handleExportData);

    viewRawLogsBtn.addEventListener('click', () => {
        const logs = STATE.logs || [];
        dataViewModal.show({
            title: '原始日志 (Raw Logs)',
            data: logs,
            dataType: 'json',
            editable: false,
            filename: `javdb-logs-${new Date().toISOString().split('T')[0]}.json`,
            info: `共 ${logs.length} 条日志记录`
        });
    });

    testLogBtn.addEventListener('click', handleTestLog);

    viewRawRecordsBtn.addEventListener('click', () => {
        const records = STATE.records || [];
        dataViewModal.show({
            title: '原始番号库数据 (Raw Records)',
            data: records,
            dataType: 'json',
            editable: false,
            filename: `javdb-records-${new Date().toISOString().split('T')[0]}.json`,
            info: `共 ${records.length} 条番号记录`
        });
    });

    checkDataStructureBtn.addEventListener('click', handleDataStructureCheck);

    // 查看演员数据（只读）
    viewActorsBtn.addEventListener('click', async () => {
        try {
            const { actorManager } = await import('../../services/actorManager');
            const actorsData = await actorManager.getAllActors();

            dataViewModal.show({
                title: '演员库数据',
                data: actorsData,
                dataType: 'json',
                editable: false,
                filename: `javdb-actors-${new Date().toISOString().split('T')[0]}.json`,
                info: `共 ${actorsData.length} 个演员记录`
            });
        } catch (error) {
            console.error('加载演员数据失败:', error);
            showMessage('加载演员数据失败', 'error');
        }
    });

    // 编辑演员数据（可编辑保存）
    const editActorsBtn = document.getElementById('editActorsBtn') as HTMLButtonElement | null;
    if (editActorsBtn) {
        editActorsBtn.addEventListener('click', async () => {
            try {
                const { actorManager } = await import('../../services/actorManager');
                const actorsData = await actorManager.getAllActors();

                dataViewModal.show({
                    title: '编辑演员库 (JSON)',
                    data: actorsData,
                    dataType: 'json',
                    editable: true,
                    info: '编辑模式 - 请谨慎修改，保存将覆盖现有演员库',
                    onSave: async (text: string) => {
                        try {
                            const parsed = JSON.parse(text) as ActorRecord[];
                            if (!Array.isArray(parsed)) throw new Error('JSON 顶层应为数组');
                            // 使用 replace 模式完全覆盖
                            const { actorManager } = await import('../../services/actorManager');
                            await actorManager.importActors(parsed, 'replace');
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
        });
    }

    // 测试日志功能
    async function handleTestLog() {
        console.log("Attempting to send a test log message...");
        await logAsync('This is a test log from the dashboard.', 'INFO', { timestamp: new Date().toLocaleTimeString() });
        showMessage('测试日志已发送', 'success');
    }

    // 数据结构检查函数（兼容旧版“修复确认”流程）
    function handleDataStructureCheck(): void {
        try {
            const records = STATE.records || [];
            // 内联规范化函数，避免作用域/构建时丢失
            const normalize = (recs: VideoRecord[]) => {
                const now = Date.now();
                const normalized: VideoRecord[] = [];
                const changedIndices: number[] = [];
                recs.forEach((rec, idx) => {
                    const before = JSON.stringify(rec);
                    const n: VideoRecord = {
                        ...DEFAULT_VIDEO_RECORD,
                        ...rec,
                        id: String(rec.id ?? ''),
                        title: String(rec.title ?? ''),
                        status: (rec.status as VideoStatus) ?? 'viewed',
                        createdAt: typeof rec.createdAt === 'number' ? rec.createdAt : now,
                        updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : now,
                        url: String(rec.url ?? ''),
                        tags: Array.isArray(rec.tags) ? rec.tags : [],
                        actors: Array.isArray(rec.actors) ? rec.actors : [],
                        studio: String((rec as any).studio ?? ''),
                        releaseDate: String((rec as any).releaseDate ?? ''),
                        duration: String((rec as any).duration ?? ''),
                        rating: typeof (rec as any).rating === 'number' ? (rec as any).rating : 0,
                        notes: String((rec as any).notes ?? '')
                    } as VideoRecord;
                    const after = JSON.stringify(n);
                    normalized.push(n);
                    if (before !== after) changedIndices.push(idx);
                });
                return { normalized, changedIndices };
            };

            const { normalized, changedIndices } = normalize(records);

            if (changedIndices.length === 0) {
                showMessage('数据结构正常，无需修复', 'success');
                return;
            }

            // 生成对比文本（仅展示有改动的样例，避免页面卡顿）
            const { beforeText, afterText } = buildDiffTexts(records, normalized, changedIndices);

            // 打开确认修复弹窗（使用当前页面已有的 data-check-modal）
            openDataCheckModal({
                message: `检测到 ${changedIndices.length} 条记录存在结构问题。是否应用修复？\n（仅填充缺失字段的默认值，不会覆盖已有有效数据）`,
                beforeText,
                afterText,
                onConfirm: async () => {
                    await saveNormalizedRecords(normalized);
                    showMessage('数据结构修复完成', 'success');
                },
                onCancel: () => {
                    showMessage('已取消修复', 'info');
                }
            });
        } catch (error) {
            console.error('数据结构检查失败:', error);
            showMessage('数据结构检查失败', 'error');
        }
    }

    // 导出数据功能
    async function handleExportData() {
        logAsync('用户在"高级设置"中点击了导出按钮。', 'INFO');
        try {
            const exportData = {
                settings: STATE.settings,
                records: STATE.records,
                logs: STATE.logs,
                exportedAt: new Date().toISOString(),
                version: '1.13.347'
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
            logAsync('完整数据备份导出成功', 'INFO');
        } catch (error) {
            console.error('导出数据失败:', error);
            showMessage('导出数据失败', 'error');
            logAsync('导出数据失败', 'ERROR', { error });
        }
    }

    // 分析数据结构
    function analyzeDataStructure(records: VideoRecord[]): string {
        const analysis = [];
        analysis.push('=== 番号库数据结构分析报告 ===\n');
        analysis.push(`生成时间: ${new Date().toLocaleString()}\n`);
        analysis.push(`总记录数: ${records.length}\n`);

        if (records.length === 0) {
            analysis.push('\n⚠️ 警告: 没有找到任何记录\n');
            return analysis.join('');
        }

        // 状态统计
        const statusStats: Record<string, number> = {};
        records.forEach(record => {
            statusStats[record.status] = (statusStats[record.status] || 0) + 1;
        });

        analysis.push('\n=== 状态分布 ===');
        Object.entries(statusStats).forEach(([status, count]) => {
            analysis.push(`${status}: ${count} 条记录`);
        });

        // 字段完整性检查
        analysis.push('\n=== 字段完整性检查 ===');
        const requiredFields = ['id', 'title', 'status', 'createdAt', 'updatedAt'];
        const fieldStats: Record<string, { missing: number, empty: number }> = {};

        requiredFields.forEach(field => {
            fieldStats[field] = { missing: 0, empty: 0 };
        });

        records.forEach(record => {
            requiredFields.forEach(field => {
                if (!(field in record)) {
                    fieldStats[field].missing++;
                } else if (!record[field as keyof VideoRecord]) {
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

        // 数据质量检查
        analysis.push('\n=== 数据质量检查 ===');
        const duplicateIds = findDuplicateIds(records);
        if (duplicateIds.length > 0) {
            analysis.push(`⚠️ 发现重复ID: ${duplicateIds.join(', ')}`);
        } else {
            analysis.push('✅ 没有重复ID');
        }

        const invalidDates = records.filter(r => r.createdAt > Date.now() || r.updatedAt > Date.now()).length;
        if (invalidDates > 0) {
            analysis.push(`⚠️ 发现 ${invalidDates} 条记录的时间戳异常`);
        } else {
            analysis.push('✅ 时间戳正常');
        }

        return analysis.join('\n');
    }

    /*
    // 删除重复的 return

	        return analysis.join('\n');
	    }

    */

    // 规范化记录（填充缺失字段、修正异常类型），返回新数组和变更索引
    function normalizeRecords(records: VideoRecord[]): { normalized: VideoRecord[]; changedIndices: number[] } {
        const normalized: VideoRecord[] = [];
        const changedIndices: number[] = [];
        const now = Date.now();

        records.forEach((rec, idx) => {
            const before = JSON.stringify(rec);
            const n: VideoRecord = {
                ...DEFAULT_VIDEO_RECORD,
                ...rec,
                id: String(rec.id ?? ''),
                title: String(rec.title ?? ''),
                status: (rec.status as VideoStatus) ?? 'viewed',
                createdAt: typeof rec.createdAt === 'number' ? rec.createdAt : now,
                updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : now,
                url: String(rec.url ?? ''),
                tags: Array.isArray(rec.tags) ? rec.tags : [],
                actors: Array.isArray(rec.actors) ? rec.actors : [],
                studio: String((rec as any).studio ?? ''),
                releaseDate: String((rec as any).releaseDate ?? ''),
                duration: String((rec as any).duration ?? ''),
                rating: typeof (rec as any).rating === 'number' ? (rec as any).rating : 0,
                notes: String((rec as any).notes ?? '')
            } as VideoRecord;

            const after = JSON.stringify(n);
            normalized.push(n);
            if (before !== after) changedIndices.push(idx);
        });

        return { normalized, changedIndices };
    }

    // 生成修复对比文本（最多展示前 N 条差异，避免卡顿）
    function buildDiffTexts(beforeList: VideoRecord[], afterList: VideoRecord[], changedIdx: number[], limit = 5) {
        const sample = changedIdx.slice(0, limit);
        const beforeParts: string[] = [];
        const afterParts: string[] = [];
        sample.forEach(i => {
            beforeParts.push(`[#${i}] ${beforeList[i].id}\n` + JSON.stringify(beforeList[i], null, 2));
            afterParts.push(`[#${i}] ${afterList[i].id}\n` + JSON.stringify(afterList[i], null, 2));
        });
        return {
            beforeText: beforeParts.join('\n\n-------------------------\n\n'),
            afterText: afterParts.join('\n\n-------------------------\n\n')
        };
    }

    // 打开“数据结构修复确认”弹窗，绑定按钮
    function openDataCheckModal({
        message,
        beforeText,
        afterText,
        onConfirm,
        onCancel
    }: {
        message: string;
        beforeText: string;
        afterText: string;
        onConfirm: () => void | Promise<void>;
        onCancel?: () => void;
    }) {
        const modal = document.getElementById('data-check-modal');
        const msg = document.getElementById('data-check-modal-message');
        const preBefore = document.getElementById('data-check-diff-before');
        const preAfter = document.getElementById('data-check-diff-after');
        const btnConfirm = document.getElementById('data-check-confirm-btn') as HTMLButtonElement;
        const btnCancel = document.getElementById('data-check-cancel-btn') as HTMLButtonElement;

        if (!modal || !msg || !preBefore || !preAfter || !btnConfirm || !btnCancel) {
            console.error('data-check-modal 相关元素不存在，回退为文本报告弹窗');
            dataViewModal.show({ title: '数据结构分析报告', data: message + '\n\n' + beforeText, dataType: 'text' });
            return;
        }

        msg.textContent = message;
        preBefore.textContent = beforeText;
        preAfter.textContent = afterText;

        // 先移除历史监听
        const newConfirm = btnConfirm.cloneNode(true) as HTMLButtonElement;
        const newCancel = btnCancel.cloneNode(true) as HTMLButtonElement;
        btnConfirm.parentNode?.replaceChild(newConfirm, btnConfirm);
        btnCancel.parentNode?.replaceChild(newCancel, btnCancel);

        const hide = () => { modal.classList.remove('visible'); modal.classList.add('hidden'); };

        newConfirm.onclick = async () => {
            hide();
            await onConfirm();
        };
        newCancel.onclick = () => { hide(); onCancel && onCancel(); };

        modal.classList.remove('hidden');
        modal.classList.add('visible');
    }

    // 保存规范化后的记录到本地存储
    async function saveNormalizedRecords(newRecords: VideoRecord[]) {
        const map: Record<string, VideoRecord> = {};
        newRecords.forEach(r => { map[r.id] = r; });
        await setValue(STORAGE_KEYS.VIEWED_RECORDS, map);
        STATE.records = newRecords;
    }

    // 查找重复ID
    function findDuplicateIds(records: VideoRecord[]): string[] {
        const idCounts: Record<string, number> = {};
        records.forEach(record => {
            idCounts[record.id] = (idCounts[record.id] || 0) + 1;
        });
        return Object.keys(idCounts).filter(id => idCounts[id] > 1);
    }
}

import { STATE } from '../state';
import { getValue, setValue } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import { applyImportedData } from '../import';
import type { LogEntry, VideoRecord, OldVideoRecord, VideoStatus } from '../../types';
import { STORAGE_KEYS } from '../../utils/config';


const DEFAULT_VIDEO_RECORD: Omit<VideoRecord, 'id'> = {
    title: '',
    status: 'browsed',
    tags: [],
    createdAt: 0,
    updatedAt: 0,
    releaseDate: undefined,
};

export function initAdvancedSettingsTab(): void {
    const jsonConfigTextarea = document.getElementById('jsonConfig') as HTMLTextAreaElement;
    const editJsonBtn = document.getElementById('editJsonBtn') as HTMLButtonElement;
    const saveJsonBtn = document.getElementById('saveJsonBtn') as HTMLButtonElement;
    const exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
    const rawLogsTextarea = document.getElementById('rawLogsTextarea') as HTMLTextAreaElement;
    const refreshRawLogsBtn = document.getElementById('refreshRawLogsBtn') as HTMLButtonElement;
    const testLogBtn = document.getElementById('testLogBtn') as HTMLButtonElement;
    const rawRecordsTextarea = document.getElementById('rawRecordsTextarea') as HTMLTextAreaElement;
    const refreshRawRecordsBtn = document.getElementById('refreshRawRecordsBtn') as HTMLButtonElement;
    const editRawRecordsBtn = document.getElementById('editRawRecordsBtn') as HTMLButtonElement;
    const saveRawRecordsBtn = document.getElementById('saveRawRecordsBtn') as HTMLButtonElement;
    const checkDataStructureBtn = document.getElementById('checkDataStructureBtn') as HTMLButtonElement;

    if (!jsonConfigTextarea || !editJsonBtn || !saveJsonBtn || !exportJsonBtn || !rawLogsTextarea || !refreshRawLogsBtn || !testLogBtn || !rawRecordsTextarea || !refreshRawRecordsBtn || !editRawRecordsBtn || !saveRawRecordsBtn || !checkDataStructureBtn) {
        console.error("One or more elements for Advanced Settings not found. Aborting init.");
        return;
    }
    
    checkDataStructureBtn.addEventListener('click', () => {
        // All previous logs indicated the logic inside this async IIFE works,
        // so the fire-and-forget pattern is correct. The issue was purely CSS class handling.
        (async () => {
            try {
                const modal = document.getElementById('data-check-modal') as HTMLElement;
                if (!modal) {
                    console.error('Data check modal element not found!');
                    showMessage('无法找到数据检查窗口，请刷新页面后重试。', 'error');
                    return;
                }

                const message = modal.querySelector('#data-check-modal-message') as HTMLElement;
                const diffContainer = modal.querySelector('.diff-container') as HTMLElement;
                const actions = modal.querySelector('.modal-actions') as HTMLElement;
                const confirmBtn = modal.querySelector('#data-check-confirm-btn') as HTMLButtonElement;
                const cancelBtn = modal.querySelector('#data-check-cancel-btn') as HTMLButtonElement;

                if (!message || !diffContainer || !actions || !confirmBtn || !cancelBtn) {
                    console.error('数据检查窗口内部组件不完整');
                    showMessage('数据检查窗口内部组件不完整，请刷新页面后重试。', 'error');
                    return;
                }

                const records = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
                const recordsArray = Object.values(records);
                const totalRecords = recordsArray.length;

                if (totalRecords === 0) {
                    showMessage('没有找到任何记录，无需检查。', 'info');
                    return;
                }
                
                // --- FIX: Use .visible class to show the modal ---
                modal.classList.remove('hidden');
                modal.classList.add('visible');
                diffContainer.style.display = 'none';
                actions.style.display = 'none';
                message.textContent = `准备检查 ${totalRecords} 条记录...`;

                await new Promise(resolve => setTimeout(resolve, 500));

                const recordsToFix: VideoRecord[] = [];
                const fixedRecordsPreview: Record<string, VideoRecord> = {};

                for (let i = 0; i < totalRecords; i++) {
                    const record = recordsArray[i];
                    let changed = false;
                    const newRecord = { ...record };

                    for (const key of Object.keys(DEFAULT_VIDEO_RECORD) as Array<keyof typeof DEFAULT_VIDEO_RECORD>) {
                        if (!(key in newRecord) || newRecord[key] === undefined || newRecord[key] === null) {
                            (newRecord as any)[key] = DEFAULT_VIDEO_RECORD[key];
                            changed = true;
                        }
                    }

                    if (!newRecord.createdAt || newRecord.createdAt === 0) {
                        newRecord.createdAt = Date.now();
                        changed = true;
                    }
                    if (!newRecord.updatedAt || newRecord.updatedAt === 0) {
                        newRecord.updatedAt = newRecord.createdAt;
                        changed = true;
                    }
                    if (typeof newRecord.title === 'undefined') {
                        newRecord.title = '';
                        changed = true;
                    }

                    if (changed) {
                        recordsToFix.push(record);
                        fixedRecordsPreview[record.id] = newRecord;
                    }
                    
                    if (i % 20 === 0 || i === totalRecords - 1) {
                        message.textContent = `正在检查... (${i + 1}/${totalRecords})`;
                        await new Promise(resolve => requestAnimationFrame(resolve));
                    }
                }

                if (recordsToFix.length > 0) {
                    const diffBefore = modal.querySelector('#data-check-diff-before') as HTMLElement;
                    const diffAfter = modal.querySelector('#data-check-diff-after') as HTMLElement;

                    if (!diffBefore || !diffAfter) {
                        console.error('Diff <pre> 元素未找到。');
                        return;
                    }

                    message.textContent = `检查完成！发现 ${recordsToFix.length} 条记录的结构需要修复。这是一个示例：`;

                    try {
                        diffBefore.textContent = JSON.stringify(recordsToFix[0], null, 2);
                        diffAfter.textContent = JSON.stringify(fixedRecordsPreview[recordsToFix[0].id], null, 2);
                    } catch (e) {
                        message.textContent = '无法显示修复示例，因为数据结构过于复杂或存在循环引用。';
                    }

                    diffContainer.style.display = '';
                    actions.style.display = '';

                    const hideModal = () => {
                        modal.classList.remove('visible');
                        modal.classList.add('hidden');
                    };
                    
                    const onConfirm = async () => {
                        hideModal();
                        showMessage('正在修复记录...', 'info');
                        const allRecords = { ...records, ...fixedRecordsPreview };
                        await setValue(STORAGE_KEYS.VIEWED_RECORDS, allRecords);
                        showMessage(`成功修复了 ${recordsToFix.length} 条记录。页面将刷新。`, 'success');
                        logAsync('INFO', `数据结构修复完成，共修复 ${recordsToFix.length} 条记录。`);
                        setTimeout(() => window.location.reload(), 1500);
                    };

                    const onCancel = () => {
                        hideModal();
                        logAsync('INFO', '用户取消了数据结构修复操作。');
                    };

                    confirmBtn.onclick = onConfirm;
                    cancelBtn.onclick = onCancel;
                } else {
                    message.textContent = '数据结构检查完成，所有记录都符合标准，无需修复。';
                    diffContainer.style.display = 'none';
                    actions.style.display = '';

                    const okBtn = document.createElement('button');
                    okBtn.textContent = '好的';
                    okBtn.className = 'button-like';
                    okBtn.onclick = () => {
                        modal.classList.remove('visible');
                        modal.classList.add('hidden');
                    };
                    
                    actions.innerHTML = '';
                    actions.appendChild(okBtn);

                    logAsync('INFO', '数据结构检查完成，未发现问题。');
                }
            } catch (error: any) {
                showMessage(`检查数据结构时出错: ${error.message}`, 'error');
                logAsync('ERROR', '检查数据结构时发生错误。', { error: error.message, stack: error.stack });
            }
        })();
    });

    async function loadRawLogs() {
        try {
            // 从 STATE 直接获取日志，而不是重新从 storage 读取
            const logs = STATE.logs || [];
            rawLogsTextarea.value = JSON.stringify(logs, null, 2);
            rawLogsTextarea.classList.remove('hidden'); // Show the textarea
            showMessage('Raw logs refreshed.', 'success');
            logAsync('INFO', '用户刷新并显示了原始日志。');
        } catch (error: any) {
            const errorMessage = `Error loading logs: ${error.message}`;
            rawLogsTextarea.value = errorMessage;
            rawLogsTextarea.classList.remove('hidden'); // Also show on error
            showMessage('Failed to refresh raw logs.', 'error');
            logAsync('ERROR', '显示原始日志时出错。', { error: error.message });
        }
    }

    async function handleTestLog() {
        console.log("Attempting to send a test log message...");
        await logAsync('INFO', 'This is a test log from the dashboard.', { timestamp: new Date().toLocaleTimeString() });
        showMessage('Test log sent. Refreshing raw logs...', 'success');
        await loadRawLogs();
    }

    function loadRawRecords() {
        try {
            const records = STATE.records || [];
            rawRecordsTextarea.value = JSON.stringify(records, null, 2);
            rawRecordsTextarea.classList.remove('hidden'); // Show the textarea
            showMessage('Raw records refreshed.', 'success');
            logAsync('INFO', '用户刷新并显示了原始番号库数据。');
        } catch (error: any) {
            const errorMessage = `Error loading records: ${error.message}`;
            rawRecordsTextarea.value = errorMessage;
            rawRecordsTextarea.classList.remove('hidden'); // Also show on error
            showMessage('Failed to refresh raw records.', 'error');
            logAsync('ERROR', '显示原始番号库数据时出错。', { error: error.message });
        }
    }

    function enableRawRecordsEdit() {
        rawRecordsTextarea.readOnly = false;
        rawRecordsTextarea.focus();
        editRawRecordsBtn.classList.add('hidden');
        saveRawRecordsBtn.classList.remove('hidden');
        showMessage('Raw records editing enabled. Be careful!', 'warn');
        logAsync('INFO', '用户启用了高级设置中的原始番号库数据编辑模式。');
    }

    async function handleSaveRawRecords() {
        logAsync('INFO', '用户点击了“保存原始番号库数据”按钮。');
        try {
            const recordsObject = JSON.parse(rawRecordsTextarea.value);
            // Construct a format that applyImportedData can understand
            const dataToImport = {
                data: recordsObject.reduce((acc: Record<string, VideoRecord>, record: VideoRecord) => {
                    acc[record.id] = record;
                    return acc;
                }, {})
            };
            // Use applyImportedData to process the records, with overwrite mode
            await applyImportedData(JSON.stringify(dataToImport), 'data', 'overwrite');
            showMessage('Raw records saved successfully. The page will now reload.', 'success');
            logAsync('INFO', '原始番号库数据已成功解析并应用。');
        } catch (error: any) {
            showMessage(`Error parsing or applying records JSON: ${error.message}`, 'error');
            console.error("Failed to save raw records:", error);
            logAsync('ERROR', '保存原始番号库数据时出错。', { error: error.message });
        } finally {
            // Reset UI after attempting to save
            rawRecordsTextarea.readOnly = true;
            saveRawRecordsBtn.classList.add('hidden');
            editRawRecordsBtn.classList.remove('hidden');
            loadRawRecords(); // Re-load to show the current state
        }
    }

    function loadJsonConfig() {
        // 只显示设置，不显示数据
        jsonConfigTextarea.value = JSON.stringify(STATE.settings, null, 2);
    }

    function enableJsonEdit() {
        jsonConfigTextarea.readOnly = false;
        jsonConfigTextarea.focus();
        editJsonBtn.classList.add('hidden');
        saveJsonBtn.classList.remove('hidden');
        showMessage('JSON editing enabled. Be careful!', 'warn');
        logAsync('INFO', '用户启用了高级设置中的 JSON 编辑模式。');
    }

    async function handleSaveJson() {
        logAsync('INFO', '用户点击了“保存 JSON”按钮。');
        try {
            // 假设文本框中的内容是 settings 对象
            const settingsObject = JSON.parse(jsonConfigTextarea.value);
            // 将其包装在 { settings: ... } 结构中以供 applyImportedData 使用
            await applyImportedData(JSON.stringify({ settings: settingsObject }));
            logAsync('INFO', 'JSON 配置已成功解析并应用。');
        } catch (error: any) {
            showMessage(`Error parsing or applying JSON: ${error.message}`, 'error');
            console.error("Failed to save JSON settings:", error);
            logAsync('ERROR', '保存 JSON 配置时出错。', { error: error.message });
        } finally {
            // 保存后重置UI
            jsonConfigTextarea.readOnly = true;
            saveJsonBtn.classList.add('hidden');
            editJsonBtn.classList.remove('hidden');
            // 重新加载配置以确认更改（applyImportedData 成功后会刷新页面，但这作为一个保险措施）
            loadJsonConfig();
        }
    }
    
    function handleExportData() {
        // 导出完整数据（设置+影片记录），与侧边栏导出功能保持一致
        logAsync('INFO', '用户在“高级设置”中点击了导出按钮。');
        const dataToExport = {
            settings: STATE.settings,
            data: STATE.records.reduce((acc, record) => {
                acc[record.id] = record;
                return acc;
            }, {} as Record<string, VideoRecord>)
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        showMessage('Full backup (settings + data) exported successfully.', 'success');
        logAsync('INFO', '高级设置中的数据导出成功。');
    }

    editJsonBtn.addEventListener('click', enableJsonEdit);
    saveJsonBtn.addEventListener('click', handleSaveJson);
    exportJsonBtn.addEventListener('click', handleExportData);
    refreshRawLogsBtn.addEventListener('click', loadRawLogs);
    testLogBtn.addEventListener('click', handleTestLog);
    refreshRawRecordsBtn.addEventListener('click', loadRawRecords);
    editRawRecordsBtn.addEventListener('click', enableRawRecordsEdit);
    saveRawRecordsBtn.addEventListener('click', handleSaveRawRecords);
    
    loadJsonConfig();
    // loadRawLogs(); // Removed initial auto-load for performance
} 
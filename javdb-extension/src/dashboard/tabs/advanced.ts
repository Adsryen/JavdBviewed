import { STATE } from '../state';
import { getValue } from '../../utils/storage';
import { showMessage } from '../ui/toast';
import { logAsync } from '../logger';
import { applyImportedData } from '../import';
import type { LogEntry, VideoRecord } from '../../types';

export function initAdvancedSettingsTab(): void {
    const jsonConfigTextarea = document.getElementById('jsonConfig') as HTMLTextAreaElement;
    const editJsonBtn = document.getElementById('editJsonBtn') as HTMLButtonElement;
    const saveJsonBtn = document.getElementById('saveJsonBtn') as HTMLButtonElement;
    const exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
    const rawLogsTextarea = document.getElementById('rawLogsTextarea') as HTMLTextAreaElement;
    const refreshRawLogsBtn = document.getElementById('refreshRawLogsBtn') as HTMLButtonElement;
    const testLogBtn = document.getElementById('testLogBtn') as HTMLButtonElement;

    if (!jsonConfigTextarea || !editJsonBtn || !saveJsonBtn || !exportJsonBtn || !rawLogsTextarea || !refreshRawLogsBtn || !testLogBtn) {
        console.error("One or more elements for Advanced Settings not found. Aborting init.");
        return;
    }

    async function loadRawLogs() {
        try {
            const logs = await getValue<LogEntry[]>('logs', []);
            rawLogsTextarea.value = JSON.stringify(logs, null, 2);
            rawLogsTextarea.classList.remove('hidden'); // Show the textarea
            showMessage('Raw logs refreshed.', 'success');
        } catch (error: any) {
            rawLogsTextarea.value = `Error loading logs: ${error.message}`;
            rawLogsTextarea.classList.remove('hidden'); // Also show on error
            showMessage('Failed to refresh raw logs.', 'error');
        }
    }

    async function handleTestLog() {
        console.log("Attempting to send a test log message...");
        await logAsync('INFO', 'This is a test log from the dashboard.', { timestamp: new Date().toLocaleTimeString() });
        showMessage('Test log sent. Refreshing raw logs...', 'success');
        await loadRawLogs();
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
    
    loadJsonConfig();
    // loadRawLogs(); // Removed initial auto-load for performance
} 
import { getValue, saveSettings, setValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import { showConfirmationModal } from './ui/modal';
import type { VideoRecord, OldVideoRecord, VideoStatus } from '../types';

function migrateRecord(record: OldVideoRecord | VideoRecord): VideoRecord {
  if ('timestamp' in record && typeof record.timestamp === 'number') {
    const oldRecord = record as any;
    
    let newStatus: VideoStatus = 'browsed';
    if (oldRecord.status === 'viewed') {
      newStatus = 'viewed';
    }

    return {
      id: oldRecord.id,
      title: oldRecord.title || oldRecord.id,
      status: newStatus,
      tags: oldRecord.tags || [],
      createdAt: oldRecord.timestamp,
      updatedAt: oldRecord.timestamp,
      releaseDate: oldRecord.releaseDate,
      actors: oldRecord.actors,
      url: oldRecord.url,
    };
  }

  const now = Date.now();
  return {
    title: record.id,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...record,
  };
}

export function handleFileRestoreClick(file: { name: string, path: string }) {
    logAsync('INFO', '用户选择了一个云端文件准备恢复。', { filename: file.name });
    showConfirmationModal({
        title: '确认恢复',
        message: `您确定要从文件 "${file.name}" 中恢复数据吗？此操作将覆盖本地数据。`,
        showRestoreOptions: true,
        onConfirm: (options) => {
            if (!options) return;
            if (!options.restoreRecords && !options.restoreSettings) {
                showMessage('您没有选择任何要恢复的内容。', 'warn');
                logAsync('WARN', '用户在恢复时未选择任何内容。');
                return;
            }

            showMessage('正在从云端恢复，请稍候...', 'info');
            logAsync('INFO', '开始从云端恢复数据。', { filename: file.name, options });
            chrome.runtime.sendMessage({ type: 'webdav-restore', filename: file.path, options: options }, response => {
                if (response?.success) {
                    showMessage('数据恢复成功！页面即将刷新以应用更改。', 'success');
                    logAsync('INFO', '云端数据恢复成功。');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showMessage(`恢复失败: ${response.error}`, 'error');
                    logAsync('ERROR', '云端数据恢复失败。', { error: response.error });
                }
            });
        },
        onCancel: () => {
            logAsync('INFO', '用户取消了云端恢复操作。');
        }
    });
}

// A helper function to ping the background script and ensure it's active
async function pingBackground(): Promise<boolean> {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'ping-background' });
        if (response && response.success) {
            console.log("Background service responded to ping.");
            return true;
        }
    } catch (error: any) {
        if (error.message.includes('Receiving end does not exist')) {
            console.error("Ping failed: Background service is not active.", error);
            return false;
        }
        console.error("An unexpected error occurred during ping:", error);
    }
    return false;
}

export async function applyTampermonkeyData(jsonData: string, mode: 'merge' | 'overwrite'): Promise<void> {
    const isBackgroundAlive = await pingBackground();
    if (!isBackgroundAlive) {
        showMessage('后台服务无响应，无法完成操作。请尝试重新加载扩展或浏览器。', 'error');
        await logAsync('ERROR', '尝试从油猴脚本导入数据失败：后台服务无响应。');
        return;
    }
    
    try {
        const importData = JSON.parse(jsonData);
        if (!importData.myIds && !importData.videoBrowseHistory) {
            showMessage('该文件不是有效的油猴脚本备份。', 'error');
            return;
        }

        let currentRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
        let newRecordsCount = 0;
        let overwrittenRecordsCount = 0;
        const newRecords: Record<string, VideoRecord> = {};

        // 1. Build a map of all records to be imported from the file
        // Process "watched" first due to higher priority
        const myIds = importData.myIds || [];
        myIds.forEach((id: any) => {
            const videoId = typeof id === 'object' ? id.id : id;
            if (typeof videoId === 'string' && videoId) {
                const now = Date.now();
                newRecords[videoId] = { 
                    id: videoId, 
                    title: videoId, 
                    status: 'viewed', 
                    tags: ['tampermonkey-import'], 
                    createdAt: now, 
                    updatedAt: now 
                };
            }
        });

        // Process "browsed" next, do not overwrite "watched"
        const videoBrowseHistory = importData.videoBrowseHistory || [];
        videoBrowseHistory.forEach((item: any) => {
            const videoId = typeof item === 'object' && item.id ? item.id : item;
            if (typeof videoId === 'string' && videoId && !newRecords[videoId]) {
                const now = Date.now();
                newRecords[videoId] = { 
                    id: videoId, 
                    title: videoId, 
                    status: 'browsed', 
                    tags: ['tampermonkey-import'], 
                    createdAt: now, 
                    updatedAt: now 
                };
            }
        });

        // 2. Apply based on mode
        await logAsync('INFO', `开始从油猴脚本导入数据，模式: ${mode}`, { totalInFile: Object.keys(newRecords).length });

        if (mode === 'overwrite') {
            const initialTotal = Object.keys(currentRecords).length;
            // Filter out old tampermonkey imports
            const baseRecords = Object.entries(currentRecords).reduce((acc, [key, value]) => {
                if (!value.tags?.includes('tampermonkey-import')) {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, VideoRecord>);
            
            overwrittenRecordsCount = initialTotal - Object.keys(baseRecords).length;
            
            // Add all new records
            const finalRecords = { ...baseRecords, ...newRecords };
            newRecordsCount = Object.keys(newRecords).length;

            await setValue(STORAGE_KEYS.VIEWED_RECORDS, finalRecords);
            await logAsync('INFO', `油猴脚本覆盖导入完成。`, { overwritten: overwrittenRecordsCount, new: newRecordsCount });

        } else { // mode === 'merge'
            let addedCount = 0;
            Object.keys(newRecords).forEach(videoId => {
                if (!currentRecords[videoId]) {
                    currentRecords[videoId] = newRecords[videoId];
                    addedCount++;
                }
            });
            newRecordsCount = addedCount;
            
            if (newRecordsCount > 0) {
                 await setValue(STORAGE_KEYS.VIEWED_RECORDS, currentRecords);
                 await logAsync('INFO', `油猴脚本合并导入完成。`, { new: newRecordsCount });
            }
        }
        
        // 3. Report result
        if (newRecordsCount > 0 || overwrittenRecordsCount > 0) {
            let successMessage = `成功合并导入 ${newRecordsCount} 条新记录。`;
            if (mode === 'overwrite') {
                 successMessage = `成功覆盖 ${overwrittenRecordsCount} 条旧记录，并导入 ${newRecordsCount} 条新记录。`;
            }
            showMessage(successMessage, 'success');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showMessage('油猴脚本备份中没有新的记录可供导入。您的数据已是最新。', 'info');
            await logAsync('INFO', '油猴脚本导入操作完成，但没有新记录被添加。');
        }

    } catch (error: any) {
        showMessage(`应用油猴脚本备份时出错: ${error.message}`, 'error');
        console.error('Error applying tampermonkey data:', error);
        await logAsync('ERROR', '应用油猴脚本备份时发生错误。', { error: error.message });
    }
}

export async function applyImportedData(jsonData: string, importType: 'data' | 'settings' | 'all' = 'all', mode: 'merge' | 'overwrite' = 'merge'): Promise<void> {
    logAsync('INFO', `开始导入拓展数据，类型: ${importType}, 模式: ${mode}`);
    try {
        const importData = JSON.parse(jsonData);
        let settingsChanged = false;
        let recordsChanged = false;

        if (importData.myIds || importData.videoBrowseHistory) {
            showMessage('请使用油猴脚本导入选项。', 'warn');
            logAsync('WARN', '用户尝试使用标准导入功能导入油猴脚本备份。');
            return;
        }

        if ((importType === 'settings' || importType === 'all') && importData.settings && typeof importData.settings === 'object') {
            await saveSettings(importData.settings);
            settingsChanged = true;
            logAsync('INFO', '已成功从文件导入并应用新设置。');
        }

        if ((importType === 'data' || importType === 'all') && importData.data && typeof importData.data === 'object' && importData.data !== null) {
            let currentRecords = mode === 'merge' ? await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {}) : {};
            
            const incomingRecords = (Array.isArray(importData.data) 
                ? importData.data.reduce((acc: Record<string, VideoRecord>, record: VideoRecord) => {
                    if (record && record.id) acc[record.id] = migrateRecord(record);
                    return acc;
                }, {})
                : Object.entries(importData.data as Record<string, OldVideoRecord | VideoRecord>).reduce((acc, [key, record]) => {
                    acc[key] = migrateRecord(record);
                    return acc;
                }, {} as Record<string, VideoRecord>)) as Record<string, VideoRecord>;

            let newRecordsCount = 0;
            let updatedRecords: Record<string, VideoRecord>;

            if (mode === 'overwrite') {
                updatedRecords = incomingRecords;
                newRecordsCount = Object.keys(updatedRecords).length;
                await logAsync('INFO', `已准备覆盖所有记录，共 ${newRecordsCount} 条。`);
            } else { // merge mode
                updatedRecords = { ...currentRecords };
                for (const id in incomingRecords) {
                    if (!updatedRecords[id]) {
                        updatedRecords[id] = incomingRecords[id];
                        newRecordsCount++;
                    }
                }
            }

            if (newRecordsCount > 0 || mode === 'overwrite') {
                await setValue(STORAGE_KEYS.VIEWED_RECORDS, updatedRecords);
                recordsChanged = true;
                if (mode === 'overwrite') {
                    logAsync('INFO', `已成功从文件覆盖了所有记录，共 ${newRecordsCount} 条。`);
                } else {
                    logAsync('INFO', `已成功从文件导入并合并了 ${newRecordsCount} 条新记录。`);
                }
            }
        }

        if (settingsChanged || recordsChanged) {
            let successMessage = 'Import successful. ';
            if (settingsChanged && recordsChanged) successMessage += 'Settings and data records have been updated.';
            else if (settingsChanged) successMessage += 'Settings have been updated.';
            else if (recordsChanged) successMessage += 'New data records have been added.';
            else successMessage = 'No new data to import. Your records are up to date.';


            showMessage(successMessage, 'success');
            logAsync('INFO', `拓展数据导入成功: ${successMessage}`);
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showMessage('The selected file does not contain compatible "settings" or "data" fields to import.', 'warn');
            logAsync('WARN', '拓展数据导入失败：文件中没有可用的 "settings" 或 "data" 字段。');
        }
    } catch (error: any) {
        showMessage(`Error applying imported data: ${error.message}`, 'error');
        console.error('Error applying imported data:', error);
        await logAsync('ERROR', '应用导入的数据时出错。', { error: error.message });
    }
}

export function initModal(): void {
    const modal = document.getElementById('import-modal');
    if (!modal) return;

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('is-active');
        }
    });
}

export function showImportModal(jsonData: string): void {
    const modal = document.getElementById('import-modal') as HTMLElement;
    const modalText = document.getElementById('modal-text') as HTMLElement;
    const modalFooter = modal.querySelector('.import-modal-footer') as HTMLElement;
    if (!modal || !modalText || !modalFooter) return;

    modalFooter.innerHTML = '';

    const closeModal = () => modal.classList.remove('is-active');

    try {
        const data = JSON.parse(jsonData);

        const isTampermonkey = data.myIds || data.videoBrowseHistory;
        const isExtension = data.settings || data.data;

        if (isTampermonkey) {
            modalText.innerHTML = `检测到 <a href="https://sleazyfork.org/zh-CN/scripts/505534-javdb%E5%88%97%E8%A1%A8%E9%A1%B5%E6%98%BE%E7%A4%BA%E6%98%AF%E5%90%A6%E5%B7%B2%E7%9C%8B" target="_blank" rel="noopener noreferrer"><strong>油猴脚本</strong></a> 备份文件。<br>请选择导入模式：`;

            const mergeBtn = document.createElement('button');
            mergeBtn.className = 'btn btn-success';
            mergeBtn.textContent = '合并导入';
            mergeBtn.title = '只添加备份文件中新增的记录，不影响现有数据。';
            mergeBtn.onclick = () => {
                logAsync('INFO', '用户选择“合并导入”油猴脚本数据。');
                applyTampermonkeyData(jsonData, 'merge');
                closeModal();
            };

            const overwriteBtn = document.createElement('button');
            overwriteBtn.className = 'btn btn-warning';
            overwriteBtn.textContent = '覆盖导入';
            overwriteBtn.title = '删除所有之前从油猴脚本导入的记录，然后导入本次备份文件的所有记录。';
            overwriteBtn.onclick = () => {
                logAsync('INFO', '用户选择“覆盖导入”油猴脚本数据。');
                applyTampermonkeyData(jsonData, 'overwrite');
                closeModal();
            };

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-default';
            cancelBtn.textContent = '取消';
            cancelBtn.onclick = () => {
                logAsync('INFO', '用户取消了油猴脚本数据导入。');
                closeModal();
            };

            modalFooter.appendChild(cancelBtn);
            modalFooter.appendChild(overwriteBtn);
            modalFooter.appendChild(mergeBtn);

        } else if (isExtension) {
            modalText.innerHTML = '检测到 <strong>本拓展</strong> 的备份文件。<br>请选择要导入的内容：';

            const importDataBtn = document.createElement('button');
            importDataBtn.className = 'btn btn-link';
            importDataBtn.textContent = '仅导入数据';
            importDataBtn.onclick = () => {
                logAsync('INFO', '用户选择“仅导入数据”。');
                applyImportedData(jsonData, 'data');
                closeModal();
            };

            const importSettingsBtn = document.createElement('button');
            importSettingsBtn.className = 'btn btn-info';
            importSettingsBtn.textContent = '仅导入设置';
            importSettingsBtn.onclick = () => {
                logAsync('INFO', '用户选择“仅导入设置”。');
                applyImportedData(jsonData, 'settings');
                closeModal();
            };

            const importAllBtn = document.createElement('button');
            importAllBtn.className = 'btn btn-primary';
            importAllBtn.textContent = '全部导入';
            importAllBtn.onclick = () => {
                logAsync('INFO', '用户选择“全部导入”。');
                applyImportedData(jsonData, 'all');
                closeModal();
            };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-default';
            cancelBtn.textContent = '取消';
            cancelBtn.onclick = () => {
                logAsync('INFO', '用户取消了拓展数据导入。');
                closeModal();
            };

            modalFooter.appendChild(cancelBtn);
            modalFooter.appendChild(importAllBtn);
            modalFooter.appendChild(importDataBtn);
            modalFooter.appendChild(importSettingsBtn);

        } else {
            showMessage('无法识别的备份文件格式。', 'error');
            return;
        }

        modal.classList.add('is-active');

    } catch (error) {
        showMessage('文件解析失败，请确认文件是有效的JSON格式。', 'error');
    }
} 
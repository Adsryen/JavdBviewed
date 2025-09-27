import { showMessage } from './ui/toast';
import { logAsync } from './logger';
import type { VideoRecord, OldVideoRecord, VideoStatus } from '../types';
import { STORAGE_KEYS } from '../utils/config';
import { setValue } from '../utils/storage';
import { dbActorsBulkPut } from './dbClient';

function migrateRecord(record: OldVideoRecord | VideoRecord): VideoRecord {
  const now = Date.now();
  let status: VideoStatus = 'browsed';
  if ((record as any).status === 'viewed') status = 'viewed';
  else if ((record as any).status === 'want') status = 'want';

  const base: Partial<VideoRecord> = {
    ...(record as any),
    status,
    title: (record as any).title || (record as any).id,
    tags: (record as any).tags || [],
  };
  if (!base.createdAt) base.createdAt = now;
  base.updatedAt = now;
  return base as VideoRecord;
}

export function handleFileRestoreClick(file: { name: string; path: string }) {
  showMessage('WebDAV 恢复暂时不可用（正在修复中）', 'warn');
  logAsync('WARN', 'WebDAV restore temporarily disabled (stub)', { file });
}

export async function applyTampermonkeyData(jsonData: string, mode: 'merge' | 'overwrite'): Promise<void> {
  try {
    JSON.parse(jsonData);
  } catch (e: any) {
    showMessage(`JSON 解析失败：${e?.message || e}`, 'error');
    await logAsync('ERROR', 'TM json parse failed (stub)', { error: e?.message || String(e) });
    return;
  }
  showMessage(`已接收 Tampermonkey 数据（${mode}），暂不执行写入（临时存根）`, 'info');
  await logAsync('INFO', 'TM data received (stub)', { mode });
}

export async function applyImportedData(
  jsonData: string,
  importType: 'data' | 'settings' | 'all' = 'all',
  mode: 'merge' | 'overwrite' = 'merge'
): Promise<void> {
  try {
    const importData = JSON.parse(jsonData);
    let actorsChanged = false;

    // 仅处理演员库，其他数据留待后续完整恢复
    let actorObj: Record<string, any> | undefined;
    if (importData && typeof importData === 'object') {
      if ((importData as any).actorRecords && typeof (importData as any).actorRecords === 'object') {
        actorObj = (importData as any).actorRecords as Record<string, any>;
      } else if ((importData as any).data && typeof (importData as any).data === 'object') {
        const dataObj: any = (importData as any).data;
        actorObj = dataObj && (dataObj[STORAGE_KEYS.ACTOR_RECORDS] || dataObj.actorRecords);
      }
    }
    if (actorObj && typeof actorObj === 'object') {
      await setValue(STORAGE_KEYS.ACTOR_RECORDS, actorObj);
      try {
        const arr = Object.values(actorObj || {});
        if (Array.isArray(arr) && arr.length > 0) {
          await dbActorsBulkPut(arr as any);
        }
      } catch (e) {
        console.warn('[Import Stub] 写入 IDB 演员库失败：', (e as any)?.message || e);
      }
      actorsChanged = true;
    }

    showMessage('导入文件已解析（简化模式，浏览记录/设置导入稍后恢复）', 'info');
    await logAsync('INFO', 'Import stub executed', { importType, mode, actorsChanged });
  } catch (e: any) {
    showMessage(`解析导入数据失败：${e?.message || e}`, 'error');
    await logAsync('ERROR', 'Import stub failed', { error: e?.message || String(e) });
  }
}

export function initModal(): void {
  // 暂无操作（存根）
}

export function showImportModal(jsonData: string): void {
  showMessage('导入对话框暂时不可用（正在修复中）。你仍可在设置页使用导入。', 'warn');
}

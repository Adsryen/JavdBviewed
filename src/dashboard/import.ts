import { showMessage } from './ui/toast';
import { logAsync } from './logger';
import type { VideoRecord, OldVideoRecord, VideoStatus } from '../types';
import { STORAGE_KEYS } from '../utils/config';
import { setValue } from '../utils/storage';
import { dbActorsBulkPut } from './dbClient';

/**
 * 检测备份数据的版本
 */
function detectBackupVersion(data: any): 'v1' | 'v2' | 'unknown' {
  if (!data || typeof data !== 'object') return 'unknown';
  
  // v2 格式特征：有 version 字段或包含 data/actorRecords 等结构化字段
  if (data.version || data.timestamp || (data.data && typeof data.data === 'object')) {
    return 'v2';
  }
  
  // v1 格式特征：直接是记录对象，或者有 viewed/browsed 等旧字段
  if (data.viewed || data.browsed || data.want) {
    return 'v1';
  }
  
  // 检查第一个记录的结构
  const firstRecord = Object.values(data)[0];
  if (firstRecord && typeof firstRecord === 'object') {
    const rec = firstRecord as any;
    // 旧版特征：status 是 'viewed'/'unviewed'，没有 createdAt/updatedAt
    if ((rec.status === 'viewed' || rec.status === 'unviewed') && !rec.createdAt) {
      return 'v1';
    }
    // 新版特征：有 createdAt/updatedAt
    if (rec.createdAt || rec.updatedAt) {
      return 'v2';
    }
  }
  
  return 'unknown';
}

/**
 * 迁移单条旧版记录到新版格式
 */
function migrateRecord(record: OldVideoRecord | VideoRecord): VideoRecord {
  const now = Date.now();
  
  // 如果已经是新版格式，直接返回
  if ((record as VideoRecord).createdAt && (record as VideoRecord).updatedAt) {
    return record as VideoRecord;
  }
  
  // 转换旧版 status
  let status: VideoStatus = 'browsed';
  if ((record as any).status === 'viewed') {
    status = 'viewed';
  } else if ((record as any).status === 'want') {
    status = 'want';
  } else if ((record as any).status === 'unviewed') {
    status = 'browsed'; // 旧版的 unviewed 对应新版的 browsed
  }

  // 使用扩展运算符保留所有原有字段（包括未来可能添加的字段）
  const base: Partial<VideoRecord> = {
    ...(record as any), // 保留所有原有字段
    // 覆盖必需的字段
    id: record.id,
    title: (record as any).title || record.id,
    status,
    tags: (record as any).tags || [],
    listIds: (record as any).listIds || [],
    createdAt: (record as any).createdAt || now,
    updatedAt: now,
    // 以下字段如果存在则保留，不存在则为 undefined（会被过滤）
    releaseDate: (record as any).releaseDate,
    javdbUrl: (record as any).javdbUrl,
    javdbImage: (record as any).javdbImage,
    enhancedData: (record as any).enhancedData,
  };
  
  return base as VideoRecord;
}

/**
 * 迁移旧版备份数据到新版格式
 */
function migrateBackupData(oldData: any): any {
  const version = detectBackupVersion(oldData);
  
  logAsync('INFO', '检测到备份数据版本', { version });
  
  if (version === 'v2') {
    // 已经是新版格式，直接返回
    return oldData;
  }
  
  if (version === 'v1') {
    // 旧版格式迁移
    const migratedData: any = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      data: {},
      actorRecords: oldData.actorRecords || {},
      settings: oldData.settings,
      userProfile: oldData.userProfile,
      logs: oldData.logs || [],
      importStats: oldData.importStats,
      newWorks: oldData.newWorks || {}
    };
    
    // 迁移视频记录
    const recordsSource = oldData.data || oldData.viewed || oldData;
    if (recordsSource && typeof recordsSource === 'object') {
      const migratedRecords: Record<string, VideoRecord> = {};
      
      for (const [id, record] of Object.entries(recordsSource)) {
        if (record && typeof record === 'object') {
          migratedRecords[id] = migrateRecord(record as any);
        }
      }
      
      migratedData.data = migratedRecords;
      logAsync('INFO', '已迁移视频记录', { count: Object.keys(migratedRecords).length });
    }
    
    // 合并 browsed 和 want 列表（如果存在）
    if (oldData.browsed && typeof oldData.browsed === 'object') {
      for (const [id, record] of Object.entries(oldData.browsed)) {
        if (record && typeof record === 'object' && !migratedData.data[id]) {
          const migrated = migrateRecord(record as any);
          migrated.status = 'browsed';
          migratedData.data[id] = migrated;
        }
      }
    }
    
    if (oldData.want && typeof oldData.want === 'object') {
      for (const [id, record] of Object.entries(oldData.want)) {
        if (record && typeof record === 'object' && !migratedData.data[id]) {
          const migrated = migrateRecord(record as any);
          migrated.status = 'want';
          migratedData.data[id] = migrated;
        }
      }
    }
    
    return migratedData;
  }
  
  // 未知格式，尝试原样返回
  logAsync('WARN', '无法识别备份数据版本，尝试原样导入');
  return oldData;
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
    let importData = JSON.parse(jsonData);
    
    // 检测并迁移旧版数据格式
    const version = detectBackupVersion(importData);
    if (version === 'v1') {
      showMessage('检测到旧版本备份数据，正在自动迁移...', 'info');
      await logAsync('INFO', '开始迁移旧版本备份数据');
      importData = migrateBackupData(importData);
      showMessage('✓ 旧版本数据迁移成功', 'success');
    }
    
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
    await logAsync('INFO', 'Import stub executed', { importType, mode, actorsChanged, detectedVersion: version });
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

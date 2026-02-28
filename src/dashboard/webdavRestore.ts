// src/dashboard/webdavRestore.ts

import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import { showSmartRestoreModal } from './ui/modal';
import { analyzeDataDifferences, type DataDiffResult, type MergeOptions } from '../utils/dataDiff';
import { mergeData, type MergeResult } from '../utils/dataMerge';
import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, RESTORE_CONFIG } from '../utils/config';
import { requireAuthIfRestricted } from '../services/privacy';
import { dbActorsBulkPut } from './dbClient';
import { showConfirm } from './components/confirmModal';
import type { VideoRecord, VideoStatus } from '../types';

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
  const firstKey = Object.keys(data)[0];
  if (firstKey && data[firstKey] && typeof data[firstKey] === 'object') {
    const rec = data[firstKey] as any;
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
function migrateOldRecord(record: any): VideoRecord {
  const now = Date.now();
  
  // 如果已经是新版格式，直接返回
  if (record.createdAt && record.updatedAt) {
    return record as VideoRecord;
  }
  
  // 转换旧版 status
  let status: VideoStatus = 'browsed';
  if (record.status === 'viewed') {
    status = 'viewed';
  } else if (record.status === 'want') {
    status = 'want';
  } else if (record.status === 'unviewed') {
    status = 'browsed'; // 旧版的 unviewed 对应新版的 browsed
  }

  // 使用扩展运算符保留所有原有字段（包括未来可能添加的字段）
  return {
    ...record, // 保留所有原有字段
    // 覆盖必需的字段
    id: record.id,
    title: record.title || record.id,
    status,
    tags: record.tags || [],
    listIds: record.listIds || [],
    createdAt: record.createdAt || now,
    updatedAt: now,
    // 以下字段如果存在则保留，不存在则为 undefined
    releaseDate: record.releaseDate,
    javdbUrl: record.javdbUrl,
    javdbImage: record.javdbImage,
    enhancedData: record.enhancedData,
  };
}

/**
 * 迁移旧版备份数据到新版格式
 */
function migrateBackupData(oldData: any): any {
  const version = detectBackupVersion(oldData);
  
  logAsync('INFO', 'WebDAV恢复：检测到备份数据版本', { version });
  
  if (version === 'v2') {
    // 已经是新版格式，直接返回
    return oldData;
  }
  
  if (version === 'v1') {
    // 旧版格式迁移
    logAsync('INFO', 'WebDAV恢复：开始迁移旧版本数据格式');
    
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
      let migratedCount = 0;
      
      for (const [id, record] of Object.entries(recordsSource)) {
        if (record && typeof record === 'object') {
          migratedRecords[id] = migrateOldRecord(record as any);
          migratedCount++;
        }
      }
      
      migratedData.data = migratedRecords;
      logAsync('INFO', 'WebDAV恢复：已迁移视频记录', { count: migratedCount });
    }
    
    // 合并 browsed 和 want 列表（如果存在）
    if (oldData.browsed && typeof oldData.browsed === 'object') {
      let browsedCount = 0;
      for (const [id, record] of Object.entries(oldData.browsed)) {
        if (record && typeof record === 'object' && !migratedData.data[id]) {
          const migrated = migrateOldRecord(record as any);
          migrated.status = 'browsed';
          migratedData.data[id] = migrated;
          browsedCount++;
        }
      }
      if (browsedCount > 0) {
        logAsync('INFO', 'WebDAV恢复：已迁移browsed记录', { count: browsedCount });
      }
    }
    
    if (oldData.want && typeof oldData.want === 'object') {
      let wantCount = 0;
      for (const [id, record] of Object.entries(oldData.want)) {
        if (record && typeof record === 'object' && !migratedData.data[id]) {
          const migrated = migrateOldRecord(record as any);
          migrated.status = 'want';
          migratedData.data[id] = migrated;
          wantCount++;
        }
      }
      if (wantCount > 0) {
        logAsync('INFO', 'WebDAV恢复：已迁移want记录', { count: wantCount });
      }
    }
    
    logAsync('INFO', 'WebDAV恢复：旧版本数据迁移完成', { 
      totalRecords: Object.keys(migratedData.data).length,
      actors: Object.keys(migratedData.actorRecords).length
    });
    
    return migratedData;
  }
  
  // 未知格式，尝试原样返回
  logAsync('WARN', 'WebDAV恢复：无法识别备份数据版本，尝试原样导入');
  return oldData;
}

interface WebDAVFile {
    path: string;
    name: string;
    lastModified: string;
    size?: number;
}

/**
 * 防御性修正：确保四个操作按钮都在当前弹窗的 .modal-footer 内
 */
function ensureFooterInModal(): void {
    const modal = getRestoreModal();
    if (!modal) return;
    let footer = modal.querySelector('.modal-footer') as HTMLElement | null;
    if (!footer) {
        // 若当前可见弹窗内不存在 .modal-footer，则即时创建一个容器
        const content = modal.querySelector('.modal-content') as HTMLElement | null;
        if (content) {
            footer = document.createElement('div');
            footer.className = 'modal-footer';
            content.appendChild(footer);
        } else {
            return;
        }
    }

    const ids = ['webdavRestoreBack', 'webdavRestoreCancel', 'webdavRestoreConfirm'];
    ids.forEach(id => {
        // 优先在当前弹窗作用域内查找（避免误操作弹窗外的同 ID 节点）
        const scopedNodes = Array.from((modal || document).querySelectorAll(`[id="${id}"]`)) as HTMLElement[];

        // 选择当前弹窗内的节点作为首选；若无，则取作用域内任意一个
        let preferred = scopedNodes.find(n => modal.contains(n)) || scopedNodes[0] || null;

        if (preferred && !footer.contains(preferred)) {
            footer.appendChild(preferred);
        }

        // 额外清理：移除弹窗作用域外的重复节点，避免在页面底部出现
        const allNodes = Array.from(document.querySelectorAll(`[id="${id}"]`)) as HTMLElement[];
        allNodes.forEach(n => {
            if (n !== preferred && !footer.contains(n)) {
                try { n.remove(); } catch {}
            }
        });
    });
}

// 全局变量
let selectedFile: WebDAVFile | null = null;

// Helper: scope queries to the restore modal to avoid duplicate IDs elsewhere
function getRestoreModal(): HTMLElement | null {
    const root = document.getElementById('dashboard-modals-root');
    // 绝对优先：文档中当前“可见”的实例（不限定在 root 内）
    const docVisible = document.querySelector('#webdavRestoreModal.modal-overlay.visible') as HTMLElement | null;
    if (docVisible) return docVisible;
    // 次优先：root 内可见实例
    const inRootVisible = root?.querySelector('#webdavRestoreModal.modal-overlay.visible') as HTMLElement | null;
    if (inRootVisible) return inRootVisible;
    // 再次：root 内任意实例
    const inRootAny = root?.querySelector('#webdavRestoreModal') as HTMLElement | null;
    if (inRootAny) return inRootAny;
    // 兜底：文档中任意实例（可能是隐藏的克隆）
    return document.getElementById('webdavRestoreModal') as HTMLElement | null;
}

function mq<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    const modal = getRestoreModal();
    return (modal ? modal.querySelector(selector) : null) as T | null;
}

/**
 * 创建正确的按钮
 */
function createCorrectButtons(): void {
    const modal = getRestoreModal();
    if (!modal) return;

    let modalFooter = modal.querySelector('.modal-footer') as HTMLElement | null;
    if (!modalFooter) {
        // 若缺少页脚容器，先在 .modal-content 内创建
        const content = modal.querySelector('.modal-content') as HTMLElement | null;
        if (content) {
            modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            content.appendChild(modalFooter);
        } else {
            return;
        }
    }

    // 清空现有内容
    modalFooter.innerHTML = '';
    
    // 创建按钮（不再创建“分析数据”按钮）
    const backBtn = document.createElement('button');
    backBtn.id = 'webdavRestoreBack';
    backBtn.className = 'btn btn-secondary hidden';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> 返回';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'webdavRestoreCancel';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.innerHTML = '取消';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'webdavRestoreConfirm';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-download"></i> 开始覆盖式恢复';
    
    // 添加到footer
    modalFooter.appendChild(backBtn);
    modalFooter.appendChild(cancelBtn);
    modalFooter.appendChild(confirmBtn);
}

let currentCloudData: any = null;
let currentLocalData: any = null;
let currentDiffResult: DataDiffResult | null = null;
let currentConflicts: any[] = [];
let currentConflictIndex = 0;
let conflictResolutions: Record<string, 'local' | 'cloud' | 'merge'> = {};

// 当前冲突类型（用于渲染与显示文案）
let currentConflictType: 'video' | 'actor' | 'newWorksSub' | 'newWorksRec' = 'video';

// 向导状态管理
interface WizardState {
    currentMode: 'quick' | 'wizard' | 'expert';
    currentStep: number;
    strategy: string;
    selectedContent: string[];
    isAnalysisComplete: boolean;
}

// 简化状态管理：覆盖式恢复不需要复杂的向导状态
// 保留向导状态以兼容现有代码，但简化使用
let wizardState: WizardState = {
    currentMode: 'quick',
    currentStep: 1,
    strategy: 'overwrite',
    selectedContent: [],
    isAnalysisComplete: false
};

// 格式化文件大小
function formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '未知大小';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// 格式化相对时间
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return '刚刚';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays === 1) {
        return '昨天';
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks}周前`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months}个月前`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${years}年前`;
    }
}

// 从备份文件名解析日期（优先从文件名提取，形如 javdb-extension-backup-YYYY-MM-DD[-HH-MM-SS].(json|zip)）
function parseDateFromFilename(filename: string): Date | null {
    const match = filename.match(/javdb-extension-backup-(\d{4}-\d{2}-\d{2})(?:-(\d{2})-(\d{2})-(\d{2}))?\.(?:json|zip)$/i);
    if (!match) return null;
    const datePart = match[1];
    const h = match[2] || '00';
    const m = match[3] || '00';
    const s = match[4] || '00';
    const iso = `${datePart}T${h}:${m}:${s}Z`;
    const t = Date.parse(iso);
    if (isNaN(t)) return null;
    return new Date(t);
}

// 格式化日期为 YYYY-MM-DD（UTC）
function formatDateYMD(date: Date): string {
    const y = date.getUTCFullYear();
    const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
}

// 更新“云端备份数量 & 范围”摘要
function updateBackupSummary(files: WebDAVFile[]): void {
    try {
        const countEl = mq<HTMLElement>('#webdavBackupCount');
        const rangeEl = mq<HTMLElement>('#webdavBackupRange');

        if (countEl) countEl.textContent = String(files.length);

        if (rangeEl) {
            const dates: Date[] = [];
            // 优先使用文件名解析
            for (const f of files) {
                const d = parseDateFromFilename(f.name);
                if (d) dates.push(d);
            }
            // 若文件名解析不到，再尝试 lastModified
            if (dates.length === 0) {
                for (const f of files) {
                    const t = Date.parse(f.lastModified);
                    if (!isNaN(t)) dates.push(new Date(t));
                }
            }

            if (dates.length > 0) {
                dates.sort((a, b) => a.getTime() - b.getTime());
                const first = dates[0];
                const last = dates[dates.length - 1];
                const firstStr = formatDateYMD(first);
                const lastStr = formatDateYMD(last);
                rangeEl.textContent = firstStr === lastStr ? firstStr : `${firstStr} ~ ${lastStr}`;
            } else {
                rangeEl.textContent = '未知';
            }
        }
    } catch (e) {
        logAsync('WARN', '日期范围计算失败', { error: e });
    }
}

/**
 * 初始化覆盖式恢复界面
 */
function initializeRestoreInterface(diffResult: DataDiffResult): void {
    logAsync('INFO', '初始化覆盖式恢复界面');

    // 标记分析完成
    wizardState.isAnalysisComplete = true;

    // 初始化统一的恢复模式
    initializeRestoreMode(diffResult);

    // 自动检测并配置恢复内容选项
    configureRestoreOptions(currentCloudData);

    // 显示数据预览
    showElement('webdavDataPreview');

    // 专家模式已废弃：移除影响预览容器，避免叠加/干扰
    try {
        const impact = document.getElementById('expertImpactPreview');
        if (impact) impact.remove();
        // 同时清理旧模板中的“影响预览”区块与摘要容器
        const modal = getRestoreModal();
        const impactSummary = (modal || document).querySelector('#impactSummary') as HTMLElement | null;
        if (impactSummary) impactSummary.remove();
        const impactPreview = (modal || document).querySelector('.impact-preview') as HTMLElement | null;
        if (impactPreview) impactPreview.remove();
    } catch {}
}

/**
 * 初始化统一的恢复模式
 */
function initializeRestoreMode(diffResult: DataDiffResult): void {
    logAsync('INFO', '初始化统一恢复模式');

    // 更新统计数据
    updateElement('quickVideoCount', diffResult.videoRecords.summary.totalLocal.toString());
    updateElement('quickActorCount', diffResult.actorRecords.summary.totalLocal.toString());
    updateElement('quickNewWorksSubsCount', diffResult.newWorks.subscriptions.summary.totalLocal.toString());
    updateElement('quickNewWorksRecsCount', diffResult.newWorks.records.summary.totalLocal.toString());

    const totalConflicts = diffResult.videoRecords.summary.conflictCount +
                          diffResult.actorRecords.summary.conflictCount +
                          diffResult.newWorks.subscriptions.summary.conflictCount +
                          diffResult.newWorks.records.summary.conflictCount;
    updateElement('quickConflictCount', totalConflicts.toString());

    // 绑定恢复按钮
    const restoreBtn = document.getElementById('quickRestoreBtn');
    if (restoreBtn) {
        restoreBtn.onclick = () => {
            startQuickRestore();
        };
    }
}

/**
 * 切换模式
 */
function switchMode(newMode: 'quick' | 'wizard' | 'expert'): void {
    logAsync('INFO', '切换恢复模式', { from: wizardState.currentMode, to: newMode });

    // 更新状态
    wizardState.currentMode = newMode;

    // 更新标签页状态
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-mode') === newMode) {
            tab.classList.add('active');
        }
    });

    // 更新内容显示
    document.querySelectorAll('.restore-mode-content').forEach(content => {
        content.classList.remove('active');
    });

    const targetContent = document.getElementById(`${newMode}Mode`);
    if (targetContent) {
        targetContent.classList.add('active');
    }

    // 根据新模式初始化
    if (wizardState.isAnalysisComplete && currentDiffResult) {
        switch (newMode) {
            case 'quick':
                initializeQuickMode(currentDiffResult);
                break;
            case 'wizard':
                initializeWizardMode(currentDiffResult);
                break;
            case 'expert':
                displayDiffAnalysis(currentDiffResult);
                break;
        }
    }
}

/**
 * 初始化快捷模式
 */
function initializeQuickMode(diffResult: DataDiffResult): void {
    logAsync('INFO', '初始化快捷模式');

    // 更新统计数据
    updateElement('quickVideoCount', diffResult.videoRecords.summary.totalLocal.toString());
    updateElement('quickActorCount', diffResult.actorRecords.summary.totalLocal.toString());
    // 新增：新作品统计
    updateElement('quickNewWorksSubsCount', diffResult.newWorks.subscriptions.summary.totalLocal.toString());
    updateElement('quickNewWorksRecsCount', diffResult.newWorks.records.summary.totalLocal.toString());

    const totalConflicts = diffResult.videoRecords.summary.conflictCount +
                          diffResult.actorRecords.summary.conflictCount +
                          diffResult.newWorks.subscriptions.summary.conflictCount +
                          diffResult.newWorks.records.summary.conflictCount;
    updateElement('quickConflictCount', totalConflicts.toString());

    // 绑定快捷恢复按钮
    const quickRestoreBtn = mq<HTMLElement>('#quickRestoreBtn');
    if (quickRestoreBtn) {
        quickRestoreBtn.onclick = () => {
            startQuickRestore();
        };
    }
}

/**
 * 初始化向导模式
 */
function initializeWizardMode(diffResult: DataDiffResult): void {
    logAsync('INFO', '初始化向导模式');

    // 重置向导状态
    wizardState.currentStep = 1;
    wizardState.strategy = RESTORE_CONFIG.defaults.strategy;
    wizardState.selectedContent = [];

    // 初始化步骤指示器
    updateWizardSteps();

    // 初始化策略选择
    initializeStrategySelection(diffResult);

    // 绑定向导导航
    bindWizardNavigation();
}

/**
 * 开始快捷恢复
 */
async function startQuickRestore(): Promise<void> {
    logAsync('INFO', '开始快捷恢复');

    // 强制要求预览为必经步骤
    if (!currentDiffResult || !currentCloudData || !currentLocalData) {
        showMessage('请先完成数据分析和预览，这是必经步骤', 'warn');
        return;
    }

    // 二次检查预览数据的完整性
    if (!currentDiffResult.videoRecords || !currentDiffResult.actorRecords) {
        showMessage('预览数据不完整，请重新分析', 'error');
        return;
    }

    const totalConflicts = currentDiffResult.videoRecords.summary.conflictCount +
                          currentDiffResult.actorRecords.summary.conflictCount;

    // 显示智能恢复确认弹窗
    try {
        showSmartRestoreModal({
            localRecordsCount: currentDiffResult.videoRecords.summary.totalLocal,
            localActorsCount: currentDiffResult.actorRecords.summary.totalLocal,
            cloudNewDataCount: currentDiffResult.videoRecords.summary.cloudOnlyCount + currentDiffResult.actorRecords.summary.cloudOnlyCount,
            conflictsCount: totalConflicts,
            onConfirm: () => {
                // 用户确认后执行恢复
                logAsync('INFO', '用户确认执行快捷恢复');

                // 使用智能合并策略和默认内容选择
                const mergeOptions: MergeOptions = {
                    strategy: 'smart',
                    restoreSettings: false, // 快捷恢复默认不恢复设置
                    restoreRecords: true,   // 恢复视频记录
                    restoreUserProfile: true, // 恢复用户资料
                    restoreActorRecords: true, // 恢复演员记录
                    restoreLogs: false,     // 不恢复日志
                    restoreImportStats: true, // 恢复导入统计
                    restoreNewWorks: true   // 新增：快捷恢复包含新作品
                };

                // 执行恢复
                executeRestore(mergeOptions);
            },
            onCancel: () => {
                logAsync('INFO', '用户取消快捷恢复');
            }
        });
    } catch (error) {
        console.error('Failed to load smart restore modal:', error);
        // 降级到原来的confirm方式
        const confirmMessage = `
            <div style="line-height: 1.8;">
                <p style="margin: 0 0 16px 0; font-weight: 600;">确认执行一键智能恢复？</p>
                
                <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: var(--text-primary);">📊 操作预览：</p>
                    <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">
                        <li>保留本地视频记录：<strong>${currentDiffResult.videoRecords.summary.totalLocal.toLocaleString()}</strong> 条</li>
                        <li>保留本地演员收藏：<strong>${currentDiffResult.actorRecords.summary.totalLocal.toLocaleString()}</strong> 个</li>
                        <li>添加云端新增数据：<strong>${currentDiffResult.videoRecords.summary.cloudOnlyCount + currentDiffResult.actorRecords.summary.cloudOnlyCount}</strong> 项</li>
                        <li>自动处理冲突：<strong>${totalConflicts}</strong> 个（保留最新数据）</li>
                    </ul>
                </div>
                
                <div class="alert-warning">
                    <p>⚠️ 注意：此操作将修改您的本地数据，建议在操作前确保已备份重要信息。</p>
                </div>
            </div>
        `;

        const confirmed = await showConfirm({
            title: '确认一键智能恢复',
            message: confirmMessage,
            confirmText: '开始恢复',
            cancelText: '取消',
            type: 'warning',
            isHtml: true
        });

        if (confirmed) {
            // 用户确认后执行恢复
            logAsync('INFO', '用户确认执行快捷恢复');

            // 使用智能合并策略和默认内容选择
            const mergeOptions: MergeOptions = {
                strategy: 'smart',
                restoreSettings: false, // 快捷恢复默认不恢复设置
                restoreRecords: true,   // 恢复视频记录
                restoreUserProfile: true, // 恢复用户资料
                restoreActorRecords: true, // 恢复演员记录
                restoreLogs: false,     // 不恢复日志
                restoreImportStats: true, // 恢复导入统计
                restoreNewWorks: true   // 新增：快捷恢复包含新作品
            };

            // 执行恢复
            executeRestore(mergeOptions);
        } else {
            logAsync('INFO', '用户取消快捷恢复');
        }
    }
}

/**
 * 更新向导步骤指示器
 */
function updateWizardSteps(): void {
    const steps = getRestoreModal()?.querySelectorAll('.step') || [];

    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNumber < wizardState.currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === wizardState.currentStep) {
            step.classList.add('active');
        }
    });

    // 更新步骤内容显示
    (getRestoreModal() || document).querySelectorAll('.wizard-step-content').forEach((content, index) => {
        content.classList.remove('active');
        if (index + 1 === wizardState.currentStep) {
            content.classList.add('active');
        }
    });
}

/**
 * 初始化策略选择
 */
function initializeStrategySelection(diffResult: DataDiffResult): void {
    // 绑定策略选择事件
    const strategyRadios = (getRestoreModal() || document).querySelectorAll('input[name="wizardStrategy"]');
    strategyRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                wizardState.strategy = target.value;
                updateStrategyPreview(target.value, diffResult);
            }
        });
    });

    // 初始化预览
    updateStrategyPreview(wizardState.strategy, diffResult);
}

/**
 * 更新策略预览
 */
function updateStrategyPreview(strategy: string, diffResult: DataDiffResult): void {
    const previewContent = mq<HTMLElement>('#previewContent');
    if (!previewContent) return;

    let previewHtml = '';

    switch (strategy) {
        case 'smart':
            previewHtml = `
                <div class="preview-section">
                    <h6><i class="fas fa-check-circle text-success"></i> 将会保留：</h6>
                    <ul>
                        <li>本地视频记录：${diffResult.videoRecords.summary.totalLocal.toLocaleString()} 条</li>
                        <li>本地演员收藏：${diffResult.actorRecords.summary.totalLocal.toLocaleString()} 个</li>
                        <li>本地设置配置</li>
                    </ul>
                </div>
                <div class="preview-section">
                    <h6><i class="fas fa-plus-circle text-info"></i> 将会添加：</h6>
                    <ul>
                        <li>云端新增视频：${diffResult.videoRecords.summary.cloudOnlyCount.toLocaleString()} 条</li>
                        <li>云端新增演员：${diffResult.actorRecords.summary.cloudOnlyCount.toLocaleString()} 个</li>
                        <li>云端新增新作品订阅：${diffResult.newWorks.subscriptions.summary.cloudOnlyCount.toLocaleString()} 个</li>
                        <li>云端新增新作品记录：${diffResult.newWorks.records.summary.cloudOnlyCount.toLocaleString()} 条</li>
                    </ul>
                </div>
                <div class="preview-section">
                    <h6><i class="fas fa-exclamation-triangle text-warning"></i> 需要处理：</h6>
                    <ul>
                        <li>冲突视频记录：${diffResult.videoRecords.summary.conflictCount.toLocaleString()} 条 → 自动选择最新</li>
                        <li>冲突演员记录：${diffResult.actorRecords.summary.conflictCount.toLocaleString()} 个 → 自动选择最新</li>
                        <li>冲突新作品订阅：${diffResult.newWorks.subscriptions.summary.conflictCount.toLocaleString()} 个</li>
                        <li>冲突新作品记录：${diffResult.newWorks.records.summary.conflictCount.toLocaleString()} 条</li>
                    </ul>
                </div>
            `;
            break;
        case 'local':
            previewHtml = `
                <div class="preview-section">
                    <h6><i class="fas fa-shield-alt text-success"></i> 保持现状：</h6>
                    <p>完全保留本地数据，不会有任何改变。云端备份将被忽略。</p>
                    <ul>
                        <li>本地视频记录：${diffResult.videoRecords.summary.totalLocal.toLocaleString()} 条（保持不变）</li>
                        <li>本地演员收藏：${diffResult.actorRecords.summary.totalLocal.toLocaleString()} 个（保持不变）</li>
                    </ul>
                </div>
            `;
            break;
        case 'cloud':
            previewHtml = `
                <div class="preview-section">
                    <h6><i class="fas fa-cloud-download-alt text-info"></i> 完全恢复：</h6>
                    <p>使用云端备份完全覆盖本地数据。</p>
                    <ul>
                        <li>视频记录：恢复到 ${diffResult.videoRecords.summary.totalCloud.toLocaleString()} 条</li>
                        <li>演员收藏：恢复到 ${diffResult.actorRecords.summary.totalCloud.toLocaleString()} 个</li>
                    </ul>
                </div>
                <div class="preview-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>注意：</strong>本地独有的 ${diffResult.videoRecords.summary.localOnlyCount} 条视频记录将会丢失！
                </div>
            `;
            break;
        case 'manual':
            previewHtml = `
                <div class="preview-section">
                    <h6><i class="fas fa-hand-paper text-primary"></i> 手动控制：</h6>
                    <p>您将能够查看每个冲突项的详细信息，并手动选择保留方式。</p>
                    <ul>
                        <li>需要处理的视频冲突：${diffResult.videoRecords.summary.conflictCount.toLocaleString()} 个</li>
                        <li>需要处理的演员冲突：${diffResult.actorRecords.summary.conflictCount.toLocaleString()} 个</li>
                        <li>预计处理时间：${Math.ceil((diffResult.videoRecords.summary.conflictCount + diffResult.actorRecords.summary.conflictCount) / 10)} 分钟</li>
                    </ul>
                </div>
            `;
            break;
    }

    previewContent.innerHTML = previewHtml;
}

/**
 * 绑定向导导航事件
 */
function bindWizardNavigation(): void {
    const prevBtn = mq<HTMLElement>('#wizardPrevBtn');
    const nextBtn = mq<HTMLElement>('#wizardNextBtn');
    const startBtn = mq<HTMLElement>('#wizardStartBtn');

    if (prevBtn) {
        prevBtn.onclick = () => {
            if (wizardState.currentStep > 1) {
                wizardState.currentStep--;
                updateWizardSteps();
                updateWizardNavigation();
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (validateCurrentStep()) {
                if (wizardState.currentStep < 3) {
                    wizardState.currentStep++;
                    updateWizardSteps();
                    updateWizardNavigation();

                    // 初始化新步骤
                    initializeCurrentStep();
                }
            }
        };
    }

    if (startBtn) {
        startBtn.onclick = () => {
            startWizardRestore();
        };
    }

    // 初始化导航状态
    updateWizardNavigation();
}

/**
 * 更新向导导航按钮状态
 */
function updateWizardNavigation(): void {
    const prevBtn = mq<HTMLButtonElement>('#wizardPrevBtn');
    const nextBtn = mq<HTMLButtonElement>('#wizardNextBtn');
    const startBtn = mq<HTMLButtonElement>('#wizardStartBtn');

    if (prevBtn) {
        prevBtn.disabled = wizardState.currentStep === 1;
    }

    if (nextBtn && startBtn) {
        if (wizardState.currentStep === 3) {
            nextBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            startBtn.classList.add('hidden');
        }
    }
}

/**
 * 验证当前步骤
 */
function validateCurrentStep(): boolean {
    switch (wizardState.currentStep) {
        case 1:
            // 策略选择验证
            return !!wizardState.strategy;
        case 2:
            // 内容选择验证
            return wizardState.selectedContent.length > 0;
        case 3:
            // 确认步骤
            return true;
        default:
            return false;
    }
}

/**
 * 初始化当前步骤
 */
function initializeCurrentStep(): void {
    switch (wizardState.currentStep) {
        case 2:
            initializeContentSelection();
            break;
        case 3:
            initializeConfirmation();
            break;
    }
}

/**
 * 初始化内容选择步骤
 */
function initializeContentSelection(): void {
    if (!currentCloudData) return;

    const grid = mq<HTMLElement>('#contentSelectionGrid');
    if (!grid) return;

    // 重用现有的configureRestoreOptions逻辑
    configureRestoreOptions(currentCloudData);

    // 将现有的恢复选项移动到向导中
    const existingOptions = mq<HTMLElement>('.restore-options-grid');
    if (existingOptions) {
        grid.innerHTML = existingOptions.innerHTML;

        // 重新绑定事件
        const checkboxes = grid.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedContent);
        });

        // 初始化选中状态
        updateSelectedContent();
    }
}

/**
 * 更新选中的内容
 */
function updateSelectedContent(): void {
    const modal = getRestoreModal();
    const checkboxes = (modal || document).querySelectorAll('#contentSelectionGrid input[type="checkbox"]:checked');
    wizardState.selectedContent = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).id);
}

/**
 * 初始化确认步骤
 */
function initializeConfirmation(): void {
    const summaryContainer = mq<HTMLElement>('#confirmationSummary');
    if (!summaryContainer || !currentDiffResult) return;

    const strategyNames = {
        'smart': '智能合并',
        'local': '保留本地',
        'cloud': '使用云端',
        'manual': '手动处理'
    };

    const summaryHtml = `
        <div class="summary-section">
            <h5><i class="fas fa-cog"></i> 恢复策略</h5>
            <p>${strategyNames[wizardState.strategy as keyof typeof strategyNames] || wizardState.strategy}</p>
        </div>
        <div class="summary-section">
            <h5><i class="fas fa-list"></i> 恢复内容</h5>
            <ul>
                ${wizardState.selectedContent.map(id => {
                    const element = mq<HTMLElement>('#' + id) || document.getElementById(id);
                    const label = element?.closest('.form-group-checkbox')?.querySelector('label')?.textContent || id;
                    return `<li>${label}</li>`;
                }).join('')}
            </ul>
        </div>
        <div class="summary-section">
            <h5><i class="fas fa-chart-bar"></i> 预期结果</h5>
            <div class="result-stats">
                <div class="stat">
                    <span class="stat-label">视频记录：</span>
                    <span class="stat-value">${currentDiffResult.videoRecords.summary.totalLocal.toLocaleString()} 条</span>
                </div>
                <div class="stat">
                    <span class="stat-label">演员收藏：</span>
                    <span class="stat-value">${currentDiffResult.actorRecords.summary.totalLocal.toLocaleString()} 个</span>
                </div>
                <div class="stat">
                    <span class="stat-label">新作品订阅：</span>
                    <span class="stat-value">${currentDiffResult.newWorks.subscriptions.summary.totalLocal.toLocaleString()} 个</span>
                </div>
                <div class="stat">
                    <span class="stat-label">新作品记录：</span>
                    <span class="stat-value">${currentDiffResult.newWorks.records.summary.totalLocal.toLocaleString()} 条</span>
                </div>
            </div>
        </div>
    `;

    summaryContainer.innerHTML = summaryHtml;
}

/**
 * 开始向导恢复
 */
function startWizardRestore(): void {
    logAsync('INFO', '开始向导恢复', {
        strategy: wizardState.strategy,
        selectedContent: wizardState.selectedContent
    });

    // 根据选择的策略和内容构建合并选项
    const restoreSettings = (document.getElementById('webdavRestoreSettings') as HTMLInputElement)?.checked ?? true;
    const restoreRecords = (document.getElementById('webdavRestoreRecords') as HTMLInputElement)?.checked ?? true;
    const restoreUserProfile = (document.getElementById('webdavRestoreUserProfile') as HTMLInputElement)?.checked ?? true;
    const restoreActorRecords = (document.getElementById('webdavRestoreActorRecords') as HTMLInputElement)?.checked ?? true;
    const restoreLogs = (document.getElementById('webdavRestoreLogs') as HTMLInputElement)?.checked ?? false;
    const restoreImportStats = (document.getElementById('webdavRestoreImportStats') as HTMLInputElement)?.checked ?? false;
    const restoreNewWorks = (document.getElementById('webdavRestoreNewWorks') as HTMLInputElement)?.checked ?? false;

    const mergeOptions: MergeOptions = {
        strategy: wizardState.strategy as any,
        restoreSettings,
        restoreRecords,
        restoreUserProfile,
        restoreActorRecords,
        restoreLogs,
        restoreImportStats,
        restoreNewWorks
    };

    // 执行恢复
    executeRestore(mergeOptions);
}

/**
 * 执行恢复操作
 */
async function executeRestore(mergeOptions: MergeOptions): Promise<void> {
    try {
        // 敏感操作：执行恢复前进行密码验证
        const ok = await requireAuthIfRestricted('webdav-sync', async () => {}, {
            title: '需要密码验证',
            message: '恢复云端备份将修改本地数据，请先完成密码验证。'
        });
        if (!ok) {
            showMessage('已取消：未通过密码验证', 'warn');
            return;
        }

        // 构造统一恢复类别映射
        const categories = {
            settings: !!mergeOptions.restoreSettings,
            userProfile: !!mergeOptions.restoreUserProfile,
            viewed: !!mergeOptions.restoreRecords,
            actors: !!mergeOptions.restoreActorRecords,
            newWorks: !!mergeOptions.restoreNewWorks,
            logs: !!mergeOptions.restoreLogs,
            importStats: !!mergeOptions.restoreImportStats,
            magnets: (((document.getElementById('webdavRestoreMagnets') as HTMLInputElement)?.checked) ?? ((document.getElementById('webdavRestoreMagnetsSimple') as HTMLInputElement)?.checked) ?? false), // 暂无前端开关，默认不恢复
        };

        // 读取自动备份开关状态
        const autoBackupBeforeRestore = (document.getElementById('webdavAutoBackupBeforeRestore') as HTMLInputElement)?.checked ?? true;

        // 二次确认提示
        const selectedCategories = Object.entries(categories).filter(([_, enabled]) => enabled).map(([key, _]) => key);
        const categoryNames: { [key: string]: string } = {
            settings: '扩展设置',
            userProfile: '账号信息',
            viewed: '观看记录',
            actors: '演员库',
            newWorks: '新作品',
            logs: '日志记录',
            importStats: '导入统计',
            magnets: '磁链缓存'
        };
        const confirmMessage = `
            <div style="line-height: 1.8;">
                <div class="alert-error">
                    <p>⚠️ 警告：替换式恢复将清空现有数据！</p>
                </div>
                
                <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: var(--text-primary);">将要恢复的类别：</p>
                    <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">
                        ${selectedCategories.map(cat => `<li>${categoryNames[cat] || cat}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="${autoBackupBeforeRestore ? 'alert-success' : 'alert-warning'}">
                    <p>${autoBackupBeforeRestore ? '✓ 恢复前将自动备份当前数据' : '✗ 未启用自动备份'}</p>
                </div>
                
                <p style="margin: 0; font-weight: 600; color: var(--error-text, #c62828); text-align: center;">
                    此操作不可撤销，确定要继续吗？
                </p>
            </div>
        `;
        
        const confirmed = await showConfirm({
            title: '⚠️ 确认覆盖式恢复',
            message: confirmMessage,
            confirmText: '确定恢复',
            cancelText: '取消',
            type: 'danger',
            isHtml: true
        });

        if (!confirmed) {
            showMessage('已取消恢复操作', 'info');
            return;
        }

        logAsync('INFO', '开始执行统一恢复（替换语义）', { mergeOptions });

        // 显示进度
        showRestoreProgress();

        const resp = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
                type: 'WEB_DAV:RESTORE_UNIFIED',
                filename: selectedFile!.path,
                options: {
                    categories,
                    autoBackupBeforeRestore,
                },
            }, resolve);
        });

        if (resp?.success) {
            logAsync('INFO', '统一恢复完成', { summary: resp.summary });
            
            // 清理计时器
            if ((window as any).restoreTimer) {
                clearInterval((window as any).restoreTimer);
                delete (window as any).restoreTimer;
            }
            
            // 显示结果摘要
            showRestoreResults(resp.summary);
        } else {
            // 清理计时器
            if ((window as any).restoreTimer) {
                clearInterval((window as any).restoreTimer);
                delete (window as any).restoreTimer;
            }
            throw new Error(resp?.error || '恢复失败');
        }
    } catch (error) {
        logAsync('ERROR', '恢复操作失败', { error: error.message });
        showMessage(`恢复失败: ${error.message}`, 'error');
    }
}

/**
 * 显示恢复进度
 */
function showRestoreProgress(): void {
    // 创建详细的进度显示界面
    const modal = document.getElementById('webdavRestoreModal');
    if (!modal) return;

    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return;

    // 隐藏其他内容，显示进度界面（使用 children 避免无效选择器）
    const existingContent = Array.from(modalBody.children) as HTMLElement[];
    existingContent.forEach(el => { el.style.display = 'none'; });

    // 创建进度界面
    const progressContainer = document.createElement('div');
    progressContainer.id = 'restoreProgressContainer';
    progressContainer.className = 'restore-progress-container';
    progressContainer.innerHTML = `
        <div class="progress-header">
            <h4><i class="fas fa-sync fa-spin"></i> 正在执行覆盖式恢复</h4>
            <p>请耐心等待，恢复过程中请勿关闭页面</p>
        </div>
        <div class="progress-categories" id="progressCategories">
            <!-- 类别进度将动态添加 -->
        </div>
        <div class="progress-summary" id="progressSummary">
            <div class="summary-item">
                <span class="label">总进度:</span>
                <span class="value" id="overallProgress">准备中...</span>
            </div>
            <div class="summary-item">
                <span class="label">已用时间:</span>
                <span class="value" id="elapsedTime">00:00</span>
            </div>
        </div>
    `;

    modalBody.appendChild(progressContainer);

    // 开始计时
    const startTime = Date.now();
    const updateTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timerEl = document.getElementById('elapsedTime');
        if (timerEl) {
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);

    // 存储计时器ID以便后续清理
    (window as any).restoreTimer = updateTimer;
}

/**
 * 显示恢复结果摘要
 */
function showRestoreResults(summary: any): void {
    const modal = document.getElementById('webdavRestoreModal');
    if (!modal) return;

    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return;

    // 清理进度界面
    const progressContainer = document.getElementById('restoreProgressContainer');
    if (progressContainer) {
        progressContainer.remove();
    }

    // 只展示结果视图：显式隐藏选择/预览/错误/加载等区域，避免叠在一起
    hideElement('webdavRestoreLoading');
    hideElement('webdavRestoreError');
    hideElement('webdavRestoreOptions');
    hideElement('webdavDataPreview');
    hideElement('webdavRestoreContent');

    // 创建结果界面
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'restoreResultsContainer';
    resultsContainer.className = 'restore-results-container';
    
    const categoryNames: { [key: string]: string } = {
        settings: '扩展设置',
        userProfile: '账号信息',
        viewed: '观看记录',
        actors: '演员库',
        newWorks: '新作品',
        logs: '日志记录',
        importStats: '导入统计',
        magnets: '磁链缓存'
    };

    let resultsHtml = `
        <div class="results-header">
            <h4><i class="fas fa-check-circle text-success"></i> 恢复完成</h4>
            <p>数据已成功覆盖，以下是详细结果：</p>
        </div>
        <div class="results-categories">
    `;

    // 遍历所有类别，未选择的也展示为“跳过”
    const catsToShow = Object.keys(categoryNames);
    catsToShow.forEach((category) => {
        const result: any = (summary?.categories && summary.categories[category]) ? summary.categories[category] : { reason: 'not_selected' };
        const categoryName = categoryNames[category] || category;

        const hasError = !!result?.error || result?.reason === 'error';
        const missing = result?.reason === 'missing';
        const notSelected = result?.reason === 'not_selected';
        const hasReplaced = result?.replaced === true;
        const hasCleared = result?.cleared === true;
        const written = typeof result?.written === 'number' ? result.written : undefined;
        const hadNewWorks = !!(result?.hasSubs || result?.hasRecords || result?.hasConfig);

        let statusText = '跳过';
        let statusClass = 'status-skipped';
        let icon = 'fas fa-minus text-muted';

        if (hasError) {
            statusText = '失败';
            statusClass = 'status-error';
            icon = 'fas fa-times text-danger';
        } else if (hasReplaced || hasCleared || (typeof written === 'number' && written > 0) || hadNewWorks) {
            statusText = '已覆盖';
            statusClass = 'status-success';
            icon = 'fas fa-check text-success';
        } else if (missing || notSelected) {
            statusText = '跳过';
            statusClass = 'status-skipped';
            icon = 'fas fa-minus text-muted';
        }

        // 构建详情：云端统计 + 写入条数 + 耗时 + 备注
        const detailParts: string[] = [];
        // 云端统计（从 currentCloudData 推断）
        try {
            switch (category) {
                case 'settings': {
                    const sa = (currentCloudData?.storageAll || {});
                    const has = !!(currentCloudData?.settings || sa[STORAGE_KEYS.SETTINGS]);
                    detailParts.push(`云端：${has ? '有' : '无'}`);
                    break;
                }
                case 'userProfile': {
                    const sa = (currentCloudData?.storageAll || {});
                    const has = currentCloudData?.userProfile != null || sa[STORAGE_KEYS.USER_PROFILE] != null;
                    detailParts.push(`云端：${has ? '有' : '无'}`);
                    break;
                }
                case 'viewed': {
                    const sa = (currentCloudData?.storageAll || {});
                    const idbArr = Array.isArray(currentCloudData?.idb?.viewedRecords) ? currentCloudData.idb.viewedRecords : [];
                    const cloudViewed = idbArr.length || Object.keys(currentCloudData?.data || currentCloudData?.viewed || sa[STORAGE_KEYS.VIEWED_RECORDS] || {}).length;
                    if (cloudViewed || cloudViewed === 0) detailParts.push(`云端：${cloudViewed} 条`);
                    break;
                }
                case 'actors': {
                    const sa = (currentCloudData?.storageAll || {});
                    const idbArr = Array.isArray(currentCloudData?.idb?.actors) ? currentCloudData.idb.actors : [];
                    const cloudActors = idbArr.length || Object.keys(currentCloudData?.actorRecords || sa[STORAGE_KEYS.ACTOR_RECORDS] || {}).length;
                    if (cloudActors || cloudActors === 0) detailParts.push(`云端：${cloudActors} 条`);
                    break;
                }
                case 'newWorks': {
                    const sa = (currentCloudData?.storageAll || {});
                    const subs = Object.keys((currentCloudData?.newWorks?.subscriptions) || (sa[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS] || {})).length;
                    const recs = Object.keys((currentCloudData?.newWorks?.records) || (sa[STORAGE_KEYS.NEW_WORKS_RECORDS] || {})).length;
                    detailParts.push(`云端：订阅 ${subs} · 记录 ${recs}`);
                    break;
                }
                case 'logs': {
                    const idbArr = Array.isArray(currentCloudData?.idb?.logs) ? currentCloudData.idb.logs : [];
                    const logsCount = idbArr.length || (Array.isArray(currentCloudData?.logs) ? currentCloudData.logs.length : 0);
                    detailParts.push(`云端：${logsCount} 条`);
                    break;
                }
                case 'magnets': {
                    const idbArr = Array.isArray(currentCloudData?.idb?.magnets) ? currentCloudData.idb.magnets : [];
                    detailParts.push(`云端：${idbArr.length} 条`);
                    break;
                }
                case 'importStats': {
                    const sa = (currentCloudData?.storageAll || {});
                    const has = currentCloudData?.importStats != null || sa[STORAGE_KEYS.LAST_IMPORT_STATS] != null;
                    detailParts.push(`云端：${has ? '有' : '无'}`);
                    break;
                }
                default:
                    break;
            }
        } catch {}

        if (typeof written === 'number') detailParts.push(`写入：${written} 条`);
        if (typeof result?.durationMs === 'number') detailParts.push(`${Math.round(result.durationMs)} ms`);
        if (result?.reason && !['missing', 'error', 'not_selected'].includes(result.reason)) detailParts.push(String(result.reason));
        if (notSelected) detailParts.push('未选择');
        const details = detailParts.join(' · ');

        resultsHtml += `
            <div class="result-item">
                <div class="result-icon"><i class="${icon}"></i></div>
                <div class="result-content">
                    <div class="result-title">${categoryName}</div>
                    <div class="result-status ${statusClass}">${statusText}</div>
                    ${details ? `<div class="result-details">${details}</div>` : ''}
                </div>
            </div>
        `;
    });

    resultsHtml += `
        </div>
        <div class="results-footer">
            <button class="btn btn-secondary" id="resultsBackBtn">
                <i class="fas fa-arrow-left"></i>
                返回选择备份
            </button>
            <button class="btn btn-primary" id="resultsDoneBtn">
                <i class="fas fa-check"></i>
                完成
            </button>
        </div>
    `;

    resultsContainer.innerHTML = resultsHtml;
    modalBody.appendChild(resultsContainer);

    // 隐藏默认底部按钮，只显示结果页自带的按钮
    const modalEl = getRestoreModal();
    const modalFooter = modalEl?.querySelector('.modal-footer') as HTMLElement | null;
    if (modalFooter) {
        modalFooter.style.display = 'none';
    }
    
    // 额外隐藏所有可能的底部按钮（防止重复显示）
    const allFooters = modalEl?.querySelectorAll('.modal-footer');
    allFooters?.forEach((footer) => {
        (footer as HTMLElement).style.display = 'none';
    });
    
    // 隐藏具体的按钮元素
    const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
    const backBtn = mq<HTMLButtonElement>('#webdavRestoreBack');
    const cancelBtn = mq<HTMLButtonElement>('#webdavRestoreCancel');
    if (confirmBtn) confirmBtn.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';

    // 绑定结果页按钮事件
    const resultsBackBtn = resultsContainer.querySelector('#resultsBackBtn') as HTMLButtonElement | null;
    const resultsDoneBtn = resultsContainer.querySelector('#resultsDoneBtn') as HTMLButtonElement | null;
    if (resultsBackBtn) {
        resultsBackBtn.onclick = () => {
            // 返回文件列表视图
            resultsContainer.remove();
            const modal = getRestoreModal();

            // 恢复 modal-body 子元素显示
            const modalBody2 = modal?.querySelector('.modal-body') as HTMLElement | null;
            if (modalBody2) {
                Array.from(modalBody2.children).forEach((el: Element) => {
                    (el as HTMLElement).style.display = '';
                });
            }

            // 回到文件选择页：先显示加载，再重新获取列表
            hideElement('webdavRestoreError');
            hideElement('webdavDataPreview');
            showElement('webdavRestoreLoading');
            const p = (modal?.querySelector('#webdavRestoreLoading p')) as HTMLElement | null;
            if (p) p.textContent = '正在获取云端文件列表...';
            fetchFileList();

            const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
            const backBtn = mq<HTMLButtonElement>('#webdavRestoreBack');
            const cancelBtn = mq<HTMLButtonElement>('#webdavRestoreCancel');
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.style.display = '';
            }
            if (backBtn) {
                backBtn.classList.add('hidden');
                backBtn.style.display = '';
            }
            if (cancelBtn) {
                cancelBtn.style.display = '';
            }

            // 恢复默认底部按钮可见
            if (modalFooter) modalFooter.style.display = '';
            const allFooters = modal?.querySelectorAll('.modal-footer');
            allFooters?.forEach((footer) => {
                (footer as HTMLElement).style.display = '';
            });
        };
    }
    if (resultsDoneBtn) {
        resultsDoneBtn.onclick = () => {
            // 关闭弹窗
            try { closeModal(); } catch {}
            // 恢复默认底部按钮可见（下次打开弹窗时可用）
            if (modalFooter) modalFooter.style.display = '';
            const allFooters = modalEl?.querySelectorAll('.modal-footer');
            allFooters?.forEach((footer) => {
                (footer as HTMLElement).style.display = '';
            });
            const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
            const backBtn = mq<HTMLButtonElement>('#webdavRestoreBack');
            const cancelBtn = mq<HTMLButtonElement>('#webdavRestoreCancel');
            if (confirmBtn) confirmBtn.style.display = '';
            if (backBtn) backBtn.style.display = '';
            if (cancelBtn) cancelBtn.style.display = '';
        };
    }
}

/**
 * 保存恢复的数据
 */
async function saveRestoredData(mergeResult: MergeResult): Promise<void> {
    try {
        // 保存合并后的数据到本地存储
        if (mergeResult.mergedData) {
        await setValue(STORAGE_KEYS.VIEWED_RECORDS, mergeResult.mergedData.videoRecords || {});
        await setValue(STORAGE_KEYS.ACTOR_RECORDS, mergeResult.mergedData.actorRecords || {});

        // 同步写入 IndexedDB（演员库）
        try {
            const actorsObj = mergeResult.mergedData.actorRecords || {};
            const actorsArr = Object.values(actorsObj || {});
            if (actorsArr.length > 0) {
                await dbActorsBulkPut(actorsArr as any);
            }
        } catch (e) {
            // 不阻断流程，仅记录日志
            console.warn('[WebDAVRestore] Failed to write actors into IDB, fallback to localStorage only:', (e as any)?.message || e);
        }

        if (mergeResult.mergedData.settings) {
            await setValue(STORAGE_KEYS.SETTINGS, mergeResult.mergedData.settings as any);
        }

        if (mergeResult.mergedData.userProfile) {
            await setValue(STORAGE_KEYS.USER_PROFILE, mergeResult.mergedData.userProfile);
        }
        }
    } catch (error) {
        console.error('保存恢复数据失败:', error);
        throw error;
    }
}

/**
 * 关闭WebDAV恢复弹窗
 */
function closeWebDAVRestoreModal(): void {
    const modal = getRestoreModal();
    if (modal) {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
    }

    try { document.body.classList.remove('modal-open'); } catch {}
}

export function showWebDAVRestoreModal(): void {
    const modal = getRestoreModal();
    if (!modal) return;
    
    // 创建正确的按钮
    createCorrectButtons();

    // 确保按钮在当前弹窗页脚内（防御：若存在同名元素在别处）
    ensureFooterInModal();

    // 重置状态
    selectedFile = null;
    resetModalState();

    // 显示弹窗
    modal.classList.remove('hidden');
    modal.classList.add('visible');

    try { document.body.classList.add('modal-open'); } catch {}

    // 绑定事件
    bindModalEvents();

    // 开始获取文件列表
    fetchFileList();
}

function resetModalState(): void {
    // 隐藏所有内容区域
    hideElement('webdavRestoreContent');
    hideElement('webdavRestoreError');
    hideElement('webdavRestoreOptions');

    // 显示加载状态
    showElement('webdavRestoreLoading');

    // 重置按钮状态
    const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
    if (confirmBtn) {
        confirmBtn.disabled = true;
    }

    // 清空文件列表
    const fileList = mq<HTMLElement>('#webdavFileList');
    if (fileList) {
        fileList.innerHTML = '';
    }
}

function bindModalEvents(): void {
    // 关闭按钮
    const closeBtn = mq('#webdavRestoreModalClose');
    const cancelBtn = mq('#webdavRestoreCancel');
    const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
    const retryBtn = mq('#webdavRestoreRetry');
    const backBtn = mq('#webdavRestoreBack');

    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }

    if (cancelBtn) {
        cancelBtn.onclick = closeModal;
    }

    if (confirmBtn) {
        confirmBtn.onclick = startWizardRestore;
    }

    if (retryBtn) {
        retryBtn.onclick = fetchFileList;
    }


    if (backBtn) {
        backBtn.onclick = () => {
            // 返回文件选择界面
            hideElement('webdavDataPreview');

            // 显示文件选择相关的元素
            const modal = getRestoreModal();
            const restoreDescription = modal?.querySelector('#webdavRestoreContent .restore-description');
            const fileListContainer = modal?.querySelector('#webdavRestoreContent .file-list-container');
            if (restoreDescription) restoreDescription.classList.remove('hidden');
            if (fileListContainer) fileListContainer.classList.remove('hidden');

            // 更新按钮状态
            if (confirmBtn) confirmBtn.disabled = true;
            backBtn.classList.add('hidden');
        };
    }

    // 点击背景关闭
    const modalEl = getRestoreModal();
    if (modalEl) {
        modalEl.onclick = (e) => {
            if (e.target === modalEl) {
                closeModal();
            }
        };
    }
}

function fetchFileList(): void {
    logAsync('INFO', '开始获取WebDAV文件列表');

    // 显示加载状态
    hideElement('webdavRestoreContent');
    hideElement('webdavRestoreError');
    showElement('webdavRestoreLoading');

    chrome.runtime.sendMessage({ type: 'webdav-list-files' }, response => {
        if (response?.success) {
            if (response.files && response.files.length > 0) {
                displayFileList(response.files);
                logAsync('INFO', '成功获取云端文件列表', { fileCount: response.files.length });
            } else {
                showError('在云端未找到任何备份文件');
                logAsync('WARN', '云端没有任何备份文件');
            }
        } else {
            showError(response?.error || '获取文件列表失败');
            logAsync('ERROR', '从云端获取文件列表失败', { error: response?.error });
        }
    });
}

async function displayFileList(files: WebDAVFile[]): Promise<void> {
    hideElement('webdavRestoreLoading');
    hideElement('webdavRestoreError');
    showElement('webdavRestoreContent');

    // 确保文件列表相关容器可见
    try {
        const modal = getRestoreModal();
        const restoreDescription = modal?.querySelector('#webdavRestoreContent .restore-description') as HTMLElement | null;
        const fileListContainer = modal?.querySelector('#webdavRestoreContent .file-list-container') as HTMLElement | null;
        if (restoreDescription) restoreDescription.classList.remove('hidden');
        if (fileListContainer) fileListContainer.classList.remove('hidden');
        // 进入文件列表时隐藏数据预览
        hideElement('webdavDataPreview');
    } catch {}

    const fileList = mq<HTMLElement>('#webdavFileList');
    if (!fileList) return;

    fileList.innerHTML = '';

    // 按最后修改时间排序，最新的在前面
    const sortedFiles = files.slice().sort((a, b) => {
        const dateA = new Date(a.lastModified).getTime();
        const dateB = new Date(b.lastModified).getTime();
        return dateB - dateA;
    });

    logAsync('INFO', '文件列表排序完成', {
        totalFiles: sortedFiles.length,
        latestFile: sortedFiles[0]?.name,
        latestDate: sortedFiles[0]?.lastModified
    });

    // 更新摘要（数量与范围）
    updateBackupSummary(sortedFiles);

    // 建立 path 到元素与对象的映射，便于之后快速预选
    const pathMap = new Map<string, { file: WebDAVFile; el: HTMLElement }>();

    sortedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'webdav-file-item';
        li.dataset.filename = file.name;
        li.dataset.filepath = file.path;

        // 为最新的文件添加特殊标识
        const isLatest = index === 0;
        const isRecent = index < 3; // 前3个文件标记为最近的

        if (isLatest) {
            li.classList.add('latest-file');
        } else if (isRecent) {
            li.classList.add('recent-file');
        }

        const latestBadge = isLatest ? '<span class="latest-badge">最新</span>' : '';
        const recentBadge = isRecent && !isLatest ? '<span class="recent-badge">最近</span>' : '';

        li.innerHTML = `
            <i class="fas fa-file-alt file-icon"></i>
            <div class="file-info">
                <span class="file-name">
                    ${file.name}
                    ${latestBadge}
                    ${recentBadge}
                </span>
                <div class="file-meta">
                    <span class="file-date">${formatRelativeTime(file.lastModified)}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
        `;

        li.addEventListener('click', () => selectFile(file, li));
        fileList.appendChild(li);

        pathMap.set(file.path, { file, el: li });
    });

    // 稳定性加固：列表渲染后再次确保按钮在弹窗页脚
    try { ensureFooterInModal(); } catch {}

    // 默认仅高亮最新（第一个）但不进入预览
    const first = sortedFiles[0];
    if (first) {
        const pair = pathMap.get(first.path);
        if (pair) {
            pair.el.classList.add('selected');
            selectedFile = pair.file;
        }
    }
}

function selectFile(file: WebDAVFile, element: HTMLElement): void {
    // 移除之前的选中状态
    const previousSelected = (getRestoreModal() || document).querySelector('.webdav-file-item.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }

    // 设置新的选中状态
    element.classList.add('selected');
    selectedFile = file;

    // 不再记忆上次选择（按用户要求始终默认最新）

    // 重置状态
    currentCloudData = null;
    currentLocalData = null;
    currentDiffResult = null;

    // 隐藏旧的界面
    hideElement('webdavRestoreOptions');
    hideElement('webdavDataPreview');

    const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-download"></i> 开始覆盖式恢复';
      confirmBtn.title = '选择备份后即可恢复';
    }

  try { ensureFooterInModal(); } catch {}

  logAsync('INFO', '用户选择了文件', { filename: file.name });

  // 选择文件后，直接加载云端预览并填充统计
  void loadCloudPreview();
}

/**
 * 加载云端备份预览并填充统计（不做本地/差异分析）
 */
async function loadCloudPreview(): Promise<void> {
    if (!selectedFile) return;

    // 显示加载
    const loading = document.getElementById('webdavRestoreLoading');
    const p = loading?.querySelector('p');
    if (p) p.textContent = '正在读取云端备份统计...';
    hideElement('webdavRestoreError');
    hideElement('webdavRestoreContent');
    showElement('webdavRestoreLoading');

    try {
        const resp = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
                type: 'WEB_DAV:RESTORE_PREVIEW',
                filename: selectedFile!.path,
            }, resolve);
        });

        if (!resp?.success) throw new Error(resp?.error || '预览失败');

        let cloudData = resp.raw || resp.data || {};
        
        // 检测并迁移旧版本数据格式
        const version = detectBackupVersion(cloudData);
        if (version === 'v1') {
            logAsync('INFO', 'WebDAV恢复：检测到旧版本备份，正在自动迁移');
            showMessage('检测到旧版本备份数据，正在自动迁移...', 'info');
            cloudData = migrateBackupData(cloudData);
            showMessage('✓ 旧版本数据迁移成功', 'success');
        } else if (version === 'unknown') {
            logAsync('WARN', 'WebDAV恢复：无法识别备份版本，尝试原样处理');
            showMessage('⚠️ 备份数据格式未知，将尝试兼容处理', 'warn');
        }
        
        currentCloudData = cloudData;

        // 计算云端统计（优先使用后台 preview.counts），并增加 storageAll 回退
        const previewCounts = resp.preview?.counts || {};
        const storageAll = currentCloudData?.storageAll || {};
        let videoCount = Number(previewCounts.viewed ?? NaN);
        let actorCount = Number(previewCounts.actors ?? NaN);

        if (isNaN(videoCount)) {
            // 回退：data/viewed 或 idb.viewedRecords 或 storageAll.VIEWED_RECORDS
            const viewedMap = currentCloudData.data || currentCloudData.viewed || storageAll[STORAGE_KEYS.VIEWED_RECORDS] || {};
            const idbViewedArr = Array.isArray(currentCloudData?.idb?.viewedRecords) ? currentCloudData.idb.viewedRecords : [];
            videoCount = (Object.keys(viewedMap || {}).length) || idbViewedArr.length || 0;
        }
        if (isNaN(actorCount)) {
            // 回退：idb.actors 或 actorRecords 或 storageAll.ACTOR_RECORDS
            const storageActors = storageAll[STORAGE_KEYS.ACTOR_RECORDS] || {};
            actorCount = Array.isArray(currentCloudData?.idb?.actors)
                ? currentCloudData.idb.actors.length
                : (Object.keys(currentCloudData.actorRecords || {}).length || Object.keys(storageActors).length);
        }
        // newWorks 拆分为 subs/recs 两个计数（含 storageAll 回退）
        const subsCount = Object.keys((currentCloudData.newWorks?.subscriptions) || (storageAll[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS] || {})).length;
        const recsCount = Object.keys((currentCloudData.newWorks?.records) || (storageAll[STORAGE_KEYS.NEW_WORKS_RECORDS] || {})).length;
        // 磁链缓存计数：优先 preview.counts.magnets，回退到 idb.magnets.length
        let magnetCount = Number(previewCounts.magnets ?? NaN);
        if (isNaN(magnetCount)) {
            const idbMagnetsArr = Array.isArray(currentCloudData?.idb?.magnets) ? currentCloudData.idb.magnets : [];
            magnetCount = idbMagnetsArr.length || 0;
        }

        updateElement('quickVideoCount', videoCount.toString());
        updateElement('quickActorCount', actorCount.toString());
        updateElement('quickNewWorksSubsCount', subsCount.toString());
        updateElement('quickNewWorksRecsCount', recsCount.toString());

        // 显示或注入“磁链缓存”计数
        const magnetNumEl = mq<HTMLElement>('#quickMagnetCount');
        if (magnetNumEl) {
            magnetNumEl.textContent = magnetCount.toString();
        } else {
            const statsContainer = mq<HTMLElement>('#restoreModeStats');
            if (statsContainer) {
                const item = document.createElement('div');
                item.className = 'stat-item';
                item.innerHTML = `
                    <span class="stat-number" id="quickMagnetCount">${magnetCount}</span>
                    <span class="stat-label">磁链缓存</span>
                `;
                statsContainer.appendChild(item);
            }
        }

        // 配置可选恢复项
        configureRestoreOptions(currentCloudData);

        // 切换到统计视图
        hideElement('webdavRestoreLoading');
        const modal = getRestoreModal();
        const restoreDescription = modal?.querySelector('#webdavRestoreContent .restore-description');
        const fileListContainer = modal?.querySelector('#webdavRestoreContent .file-list-container');
        if (restoreDescription) restoreDescription.classList.add('hidden');
        if (fileListContainer) fileListContainer.classList.add('hidden');
        showElement('webdavRestoreContent');
        showElement('webdavDataPreview');

        // 强制清理“影响预览”残留 UI（旧模板可能仍包含该块）
        try {
            const impactSummary2 = (modal || document).querySelector('#impactSummary') as HTMLElement | null;
            if (impactSummary2) impactSummary2.remove();
            const impactPreview2 = (modal || document).querySelector('.impact-preview') as HTMLElement | null;
            if (impactPreview2) impactPreview2.remove();
        } catch {}

        // 启用操作按钮
        const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
        const backBtn = mq<HTMLButtonElement>('#webdavRestoreBack');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class=\"fas fa-download\"></i> 开始覆盖式恢复';
            confirmBtn.title = '开始执行覆盖式恢复';
        }
        if (backBtn) backBtn.classList.remove('hidden');

        // 同步绑定中部动作按钮
        const quickRestoreBtn = mq<HTMLElement>('#quickRestoreBtn');
        if (quickRestoreBtn) quickRestoreBtn.onclick = () => startWizardRestore();

        try { ensureFooterInModal(); } catch {}
    } catch (e: any) {
        hideElement('webdavRestoreLoading');
        showElement('webdavRestoreError');
        const msgEl = document.getElementById('webdavRestoreErrorMessage');
        if (msgEl) msgEl.textContent = e?.message || '预览失败';
        logAsync('ERROR', '读取云端备份统计失败', { error: e?.message });
    }
}

/**
 * 分析数据差异
 */
async function performDataAnalysis(): Promise<void> {
    if (!selectedFile) return;

    logAsync('INFO', '开始分析数据差异', { filename: selectedFile.name });

    try {
        // 显示加载状态
        showAnalysisLoading();

        // 获取云端数据（统一恢复：必经预览）
        const cloudResponse = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
                type: 'WEB_DAV:RESTORE_PREVIEW',
                filename: selectedFile!.path,
            }, resolve);
        });

        if (!cloudResponse?.success) {
            throw new Error(cloudResponse?.error || '预览失败');
        }

        // 统一预览返回 { preview, raw }，兼容旧字段 data
        currentCloudData = cloudResponse.raw || cloudResponse.data || {};

        // 获取本地数据
        currentLocalData = await getCurrentLocalData();

        // 分析差异
        currentDiffResult = analyzeDataDifferences(currentLocalData, currentCloudData);

        // 先显示数据预览界面
        hideElement('webdavRestoreLoading');
        // 确保webdavRestoreContent容器显示
        const restoreContent = mq<HTMLElement>('#webdavRestoreContent');
        if (restoreContent) {
            restoreContent.classList.remove('hidden');
            restoreContent.style.display = 'block';
            restoreContent.style.height = 'auto';
            restoreContent.style.minHeight = '400px';
            restoreContent.style.overflow = 'visible';
        }

        // 隐藏文件选择相关的元素，但保持webdavRestoreContent容器显示
        const modal = getRestoreModal();
        const restoreDescription = modal?.querySelector('#webdavRestoreContent .restore-description');
        const fileListContainer = modal?.querySelector('#webdavRestoreContent .file-list-container');
        if (restoreDescription) restoreDescription.classList.add('hidden');
        if (fileListContainer) fileListContainer.classList.add('hidden');

        // 验证父容器状态
        logAsync('INFO', 'webdavRestoreContent容器状态', {
            exists: !!restoreContent,
            isHidden: restoreContent?.classList.contains('hidden'),
            display: restoreContent ? getComputedStyle(restoreContent).display : 'N/A',
            offsetHeight: restoreContent?.offsetHeight,
            offsetWidth: restoreContent?.offsetWidth
        });

        showElement('webdavDataPreview');

        // 强制显示元素（调试用）
        const previewElement = mq<HTMLElement>('#webdavDataPreview');
        if (previewElement) {
            previewElement.style.display = 'block';
            previewElement.style.visibility = 'visible';
            previewElement.style.opacity = '1';
            previewElement.style.position = 'relative';
            previewElement.style.zIndex = '1000';
            previewElement.classList.remove('hidden');
        }

        // 验证元素是否正确显示
        const previewElementAfterShow = mq<HTMLElement>('#webdavDataPreview');
        logAsync('INFO', '显示webdavDataPreview后验证', {
            isHidden: previewElementAfterShow?.classList.contains('hidden'),
            display: previewElementAfterShow ? getComputedStyle(previewElementAfterShow).display : 'N/A',
            styleDisplay: previewElementAfterShow?.style.display,
            offsetHeight: previewElementAfterShow?.offsetHeight,
            offsetWidth: previewElementAfterShow?.offsetWidth
        });

        // 初始化覆盖式恢复界面
        initializeRestoreInterface(currentDiffResult);

        // 更新按钮状态
        const analyzeBtn = mq<HTMLButtonElement>('#webdavRestoreAnalyze');
        const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
        const backBtn = mq<HTMLButtonElement>('#webdavRestoreBack');

        if (analyzeBtn) analyzeBtn.classList.add('hidden');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-download"></i> 开始恢复';
            confirmBtn.title = '开始执行覆盖式恢复';
        }
        if (backBtn) backBtn.classList.remove('hidden');

        logAsync('INFO', '数据差异分析完成', {
            videoConflicts: currentDiffResult.videoRecords.conflicts.length,
            actorConflicts: currentDiffResult.actorRecords.conflicts.length
        });

    } catch (error: any) {
        logAsync('ERROR', '数据差异分析失败', { error: error.message });
        showMessage(`分析失败: ${error.message}`, 'error');
        hideAnalysisLoading();
    }
}

/**
 * 获取当前本地数据
 */
async function getCurrentLocalData(): Promise<any> {
    const [viewedRecords, actorRecords, settings, userProfile, logs, importStats, nwSubs, nwRecords, nwConfig] = await Promise.all([
        getValue(STORAGE_KEYS.VIEWED_RECORDS, {}),
        getValue(STORAGE_KEYS.ACTOR_RECORDS, {}),
        getValue(STORAGE_KEYS.SETTINGS, {}),
        getValue(STORAGE_KEYS.USER_PROFILE, {}),
        getValue(STORAGE_KEYS.LOGS, []),
        getValue(STORAGE_KEYS.LAST_IMPORT_STATS, {}),
        // 新增：采集新作品本地数据
        getValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, {}),
        getValue(STORAGE_KEYS.NEW_WORKS_RECORDS, {}),
        getValue(STORAGE_KEYS.NEW_WORKS_CONFIG, {})
    ]);

    return {
        viewedRecords,
        actorRecords,
        settings,
        userProfile,
        logs,
        importStats,
        newWorks: {
            subscriptions: nwSubs || {},
            records: nwRecords || {},
            config: nwConfig || {}
        }
    };
}

/**
 * 显示分析加载状态
 */
function showAnalysisLoading(): void {
    const loadingElement = document.getElementById('webdavRestoreLoading');
    const loadingText = loadingElement?.querySelector('p');

    if (loadingText) {
        loadingText.textContent = '正在分析数据差异...';
    }

    hideElement('webdavRestoreContent');
    showElement('webdavRestoreLoading');
}

/**
 * 隐藏分析加载状态
 */
function hideAnalysisLoading(): void {
    hideElement('webdavRestoreLoading');
    showElement('webdavRestoreContent');
}

/**
 * 显示差异分析结果（专家模式）
 */
function displayDiffAnalysis(diffResult: DataDiffResult): void {
    // 专家模式已废弃：此函数改为无操作，避免影响覆盖式恢复
    return;
}

/**
 * 生成差异分析HTML内容
 */
function generateDiffSummaryHTML(diffResult: DataDiffResult): string {
    return `
        <div class="diff-summary">
            <div class="diff-category">
                <div class="diff-header">
                    <i class="fas fa-video"></i>
                    <span>视频记录</span>
                </div>
                <div class="diff-stats">
                    <div class="stat-item">
                        <span class="stat-label">云端新增：</span>
                        <span class="stat-value">${diffResult.videoRecords.summary.cloudOnlyCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">本地保留：</span>
                        <span class="stat-value">${diffResult.videoRecords.summary.totalLocal}</span>
                    </div>
                    <div class="stat-item conflict">
                        <span class="stat-label">发现冲突：</span>
                        <span class="stat-value">${diffResult.videoRecords.summary.conflictCount}</span>
                        ${diffResult.videoRecords.summary.conflictCount > 0 ?
                            '<button class="btn-link" id="viewVideoConflicts">查看详情</button>' :
                            '<button class="btn-link hidden" id="viewVideoConflicts">查看详情</button>'
                        }
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">本地独有：</span>
                        <span class="stat-value">${diffResult.videoRecords.summary.localOnlyCount}</span>
                        <small>(云端没有)</small>
                    </div>
                </div>
            </div>

            <div class="diff-category">
                <div class="diff-header">
                    <i class="fas fa-users"></i>
                    <span>演员收藏</span>
                </div>
                <div class="diff-stats">
                    <div class="stat-item">
                        <span class="stat-label">云端新增：</span>
                        <span class="stat-value">${diffResult.actorRecords.summary.cloudOnlyCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">本地保留：</span>
                        <span class="stat-value">${diffResult.actorRecords.summary.totalLocal}</span>
                    </div>
                    <div class="stat-item conflict">
                        <span class="stat-label">发现冲突：</span>
                        <span class="stat-value">${diffResult.actorRecords.summary.conflictCount}</span>
                        ${diffResult.actorRecords.summary.conflictCount > 0 ?
                            '<button class="btn-link" id="viewActorConflicts">查看详情</button>' :
                            '<button class="btn-link hidden" id="viewActorConflicts">查看详情</button>'
                        }
                    </div>
                </div>
            </div>

            <div class="diff-category">
                <div class="diff-header">
                    <i class="fas fa-bell"></i>
                    <span>新作品</span>
                </div>
                <div class="diff-stats">
                    <div class="stat-item">
                        <span class="stat-label">订阅 云端新增：</span>
                        <span class="stat-value">${diffResult.newWorks.subscriptions.summary.cloudOnlyCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">订阅 本地保留：</span>
                        <span class="stat-value">${diffResult.newWorks.subscriptions.summary.totalLocal}</span>
                    </div>
                    <div class="stat-item conflict">
                        <span class="stat-label">订阅 冲突：</span>
                        <span class="stat-value">${diffResult.newWorks.subscriptions.summary.conflictCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">记录 云端新增：</span>
                        <span class="stat-value">${diffResult.newWorks.records.summary.cloudOnlyCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">记录 本地保留：</span>
                        <span class="stat-value">${diffResult.newWorks.records.summary.totalLocal}</span>
                    </div>
                    <div class="stat-item conflict">
                        <span class="stat-label">记录 冲突：</span>
                        <span class="stat-value">${diffResult.newWorks.records.summary.conflictCount}</span>
                    </div>
                </div>
            </div>

            <div class="diff-category">
                <div class="diff-header">
                    <i class="fas fa-cogs"></i>
                    <span>扩展设置</span>
                </div>
                <div class="diff-stats">
                    <div class="stat-item" id="settingsDiffStatus">
                        <span class="stat-label">状态：</span>
                        <span class="stat-value">${diffResult.settings.hasConflict ? '检测到差异' : '无差异'}</span>
                        ${diffResult.settings.hasConflict ?
                            '<button class="btn-link" id="viewSettingsDiff">查看详情</button>' : ''
                        }
                    </div>
                </div>
            </div>
        </div>

        <div class="merge-strategy-section">
            <h5>
                <i class="fas fa-cogs"></i>
                合并策略选择
            </h5>
            <p class="section-description">选择如何处理数据冲突和差异</p>

            <div class="strategy-options">
                <div class="strategy-option">
                    <input type="radio" id="expertSmartMerge" name="expertMergeStrategy" value="smart" checked>
                    <label for="expertSmartMerge">
                        <i class="fas fa-magic"></i>
                        <div class="strategy-content">
                            <span class="strategy-title">智能合并</span>
                            <span class="strategy-description">自动处理冲突，保留最新数据</span>
                        </div>
                    </label>
                </div>

                <div class="strategy-option">
                    <input type="radio" id="expertKeepLocal" name="expertMergeStrategy" value="local">
                    <label for="expertKeepLocal">
                        <i class="fas fa-hdd"></i>
                        <div class="strategy-content">
                            <span class="strategy-title">保留本地</span>
                            <span class="strategy-description">完全保留本地数据</span>
                        </div>
                    </label>
                </div>

                <div class="strategy-option">
                    <input type="radio" id="expertKeepCloud" name="expertMergeStrategy" value="cloud">
                    <label for="expertKeepCloud">
                        <i class="fas fa-cloud"></i>
                        <div class="strategy-content">
                            <span class="strategy-title">保留云端</span>
                            <span class="strategy-description">使用云端数据覆盖本地</span>
                        </div>
                    </label>
                </div>

                <div class="strategy-option">
                    <input type="radio" id="expertManualResolve" name="expertMergeStrategy" value="manual">
                    <label for="expertManualResolve">
                        <i class="fas fa-hand-paper"></i>
                        <div class="strategy-content">
                            <span class="strategy-title">手动处理</span>
                            <span class="strategy-description">逐个处理冲突项</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <!-- 影响预览模块已移除，保持分析界面简洁 -->
    `;
}

/**
 * 自动检测并配置恢复内容选项
 */
function configureRestoreOptions(cloudData: any): void {
    const options = [
        {
            id: 'webdavRestoreSettings',
            dataKey: 'settings',
            required: true, // 设置是必需的
            name: '扩展设置'
        },
        {
            id: 'webdavRestoreRecords',
            dataKey: 'data',
            required: true, // 观看记录是必需的
            name: '观看记录'
        },
        {
            id: 'webdavRestoreUserProfile',
            dataKey: 'userProfile',
            required: true, // 账号信息是必需的
            name: '账号信息'
        },
        {
            id: 'webdavRestoreActorRecords',
            dataKey: 'actorRecords',
            required: false, // 演员库是可选的
            name: '演员库'
        },
        {
            id: 'webdavRestoreLogs',
            dataKey: 'logs',
            required: false, // 日志是可选的
            name: '日志记录'
        },
        {
            id: 'webdavRestoreNewWorks',
            dataKey: 'newWorks',
            required: false,
            name: '新作品（订阅/记录/配置）'
        },
        {
            id: 'webdavRestoreImportStats',
            dataKey: 'importStats',
            required: false, // 导入统计是可选的
            name: '导入统计'
        },
        {
            id: 'webdavRestoreMagnets',
            dataKey: 'magnets',
            required: false, // 磁链缓存是可选的
            name: '磁链缓存'
        }
    ];

    let availableCount = 0;
    let unavailableCount = 0;

    options.forEach(option => {
        const checkbox = document.getElementById(option.id) as HTMLInputElement;
        const container = checkbox?.closest('.form-group-checkbox') as HTMLElement;

        if (!checkbox || !container) return;

        // 更健壮的数据源回退（优先原字段 -> storageAll -> idb.*）
        const sa = cloudData?.storageAll || {};
        let dataset: any = undefined;
        let hasData = false;

        switch (option.dataKey) {
            case 'data': { // 观看记录
                dataset = cloudData?.data || cloudData?.viewed || sa[STORAGE_KEYS.VIEWED_RECORDS] ||
                    (Array.isArray(cloudData?.idb?.viewedRecords) ? cloudData.idb.viewedRecords : undefined);
                break;
            }
            case 'actorRecords': { // 演员库
                dataset = cloudData?.actorRecords || sa[STORAGE_KEYS.ACTOR_RECORDS] ||
                    (Array.isArray(cloudData?.idb?.actors) ? cloudData.idb.actors : undefined);
                break;
            }
            case 'settings': {
                dataset = cloudData?.settings || sa[STORAGE_KEYS.SETTINGS];
                break;
            }
            case 'userProfile': {
                dataset = cloudData?.userProfile ?? sa[STORAGE_KEYS.USER_PROFILE];
                break;
            }
            case 'logs': {
                dataset = cloudData?.logs || (Array.isArray(cloudData?.idb?.logs) ? cloudData.idb.logs : undefined);
                break;
            }
            case 'newWorks': {
                const subs = Object.keys((cloudData?.newWorks?.subscriptions) || (sa[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS] || {})).length;
                const recs = Object.keys((cloudData?.newWorks?.records) || (sa[STORAGE_KEYS.NEW_WORKS_RECORDS] || {})).length;
                const cfg = Object.keys((cloudData?.newWorks?.config) || (sa[STORAGE_KEYS.NEW_WORKS_CONFIG] || {})).length;
                dataset = cloudData?.newWorks || { subscriptions: subs, records: recs, config: cfg };
                hasData = (subs + recs + cfg) > 0;
                break;
            }
            case 'importStats': {
                dataset = cloudData?.importStats ?? sa[STORAGE_KEYS.LAST_IMPORT_STATS];
                break;
            }
            case 'magnets': {
                // 磁链只在 IDB 快照中可用
                dataset = Array.isArray(cloudData?.idb?.magnets) ? cloudData.idb.magnets : [];
                break;
            }
            default: {
                dataset = cloudData ? cloudData[option.dataKey] : undefined;
            }
        }

        if (option.dataKey !== 'newWorks') {
            if (Array.isArray(dataset)) hasData = dataset.length > 0;
            else if (dataset && typeof dataset === 'object') hasData = Object.keys(dataset).length > 0;
            else hasData = !!dataset;
        }

        if (hasData) {
            // 数据存在，启用选项
            checkbox.disabled = false;
            checkbox.checked = true;
            container.classList.remove('disabled', 'unavailable');
            container.classList.add('available');

            // 添加数据统计信息
            updateOptionStats(container, dataset, option.dataKey);
            availableCount++;
        } else if (option.required) {
            // 必需数据不存在，显示警告但保持启用
            checkbox.disabled = false;
            checkbox.checked = true;
            container.classList.remove('disabled', 'available');
            container.classList.add('warning');

            // 添加警告信息
            addWarningMessage(container, `${option.name}数据在备份中缺失`);
            availableCount++;
        } else {
            // 可选数据不存在，禁用选项
            checkbox.disabled = true;
            checkbox.checked = false;
            container.classList.remove('available', 'warning');
            container.classList.add('disabled', 'unavailable');

            // 添加不可用信息
            addUnavailableMessage(container, `${option.name}在此备份中不可用`);
            unavailableCount++;
        }
    });

    // 记录检测结果
    logAsync('INFO', '恢复内容选项自动配置完成', {
        availableOptions: availableCount,
        unavailableOptions: unavailableCount,
        cloudDataKeys: cloudData ? Object.keys(cloudData) : []
    });
}

/**
 * 更新选项统计信息
 */
function updateOptionStats(container: HTMLElement, data: any, dataKey: string): void {
    const small = container.querySelector('small');
    if (!small) return;

    let statsText = '';

    switch (dataKey) {
        case 'data':
            if (Array.isArray(data)) {
                statsText = `包含 ${data.length} 条观看记录`;
            } else if (data && typeof data === 'object') {
                const videoCount = Object.keys(data).length;
                statsText = `包含 ${videoCount} 条观看记录`;
            }
            break;
        case 'actorRecords':
            if (Array.isArray(data)) {
                statsText = `包含 ${data.length} 个演员信息`;
            } else if (data && typeof data === 'object') {
                const count = Object.keys(data).length;
                statsText = `包含 ${count} 个演员信息`;
            }
            break;
        case 'logs':
            if (Array.isArray(data)) {
                statsText = `包含 ${data.length} 条日志记录`;
            }
            break;
        case 'settings':
            if (data && typeof data === 'object') {
                const settingsCount = Object.keys(data).length;
                statsText = `包含 ${settingsCount} 项设置`;
            }
            break;
        case 'userProfile':
            if (data && data.email) {
                statsText = `账号: ${data.email}`;
            }
            break;
        case 'importStats':
            if (data && data.lastImportTime) {
                const date = new Date(data.lastImportTime);
                statsText = `最后导入: ${date.toLocaleDateString()}`;
            }
            break;
        case 'newWorks': {
            let subs = 0, recs = 0;
            if (data && typeof data === 'object') {
                const s = (data as any).subscriptions;
                const r = (data as any).records;
                subs = typeof s === 'number' ? s : (s && typeof s === 'object' ? Object.keys(s).length : 0);
                recs = typeof r === 'number' ? r : (r && typeof r === 'object' ? Object.keys(r).length : 0);
            }
            statsText = `订阅 ${subs} · 记录 ${recs}`;
            break;
        }
        case 'magnets':
            if (Array.isArray(data)) {
                statsText = `包含 ${data.length} 条磁链缓存`;
            } else if (data && typeof data === 'object') {
                const magnetCount = Object.keys(data).length;
                statsText = `包含 ${magnetCount} 条磁链缓存`;
            }
            break;
    }

    if (statsText) {
        const originalText = small.textContent || '';
        const baseText = originalText.split('(')[0].trim();
        small.innerHTML = `${baseText} <span class="stats-info">(${statsText})</span>`;
    }
}

/**
 * 添加警告信息
 */
function addWarningMessage(container: HTMLElement, message: string): void {
    const small = container.querySelector('small');
    if (small) {
        small.innerHTML = `<span class="warning-text"><i class="fas fa-exclamation-triangle"></i> ${message}</span>`;
    }
}

/**
 * 添加不可用信息
 */
function addUnavailableMessage(container: HTMLElement, message: string): void {
    const small = container.querySelector('small');
    if (small) {
        small.innerHTML = `<span class="unavailable-text"><i class="fas fa-times-circle"></i> ${message}</span>`;
    }
}

/**
 * 绑定冲突详情查看事件
 */
function bindConflictDetailEvents(diffResult: DataDiffResult): void {
    const videoConflictsBtn = document.getElementById('viewVideoConflicts');
    const actorConflictsBtn = document.getElementById('viewActorConflicts');
    const settingsDiffBtn = document.getElementById('viewSettingsDiff');

    // 调试日志
    logAsync('DEBUG', '绑定冲突详情事件', {
        videoConflictsBtn: !!videoConflictsBtn,
        actorConflictsBtn: !!actorConflictsBtn,
        settingsDiffBtn: !!settingsDiffBtn,
        settingsHasConflict: diffResult.settings.hasConflict,
        settingsData: diffResult.settings
    });

    if (videoConflictsBtn && diffResult.videoRecords.conflicts.length > 0) {
        videoConflictsBtn.onclick = () => showConflictResolution('video', diffResult.videoRecords.conflicts);
    }

    if (actorConflictsBtn && diffResult.actorRecords.conflicts.length > 0) {
        actorConflictsBtn.onclick = () => showConflictResolution('actor', diffResult.actorRecords.conflicts);
    }

    if (settingsDiffBtn) {
        if (diffResult.settings.hasConflict) {
            settingsDiffBtn.onclick = () => {
                logAsync('INFO', '点击设置差异查看详情按钮');
                showSettingsDifference(diffResult.settings);
            };
            logAsync('INFO', '设置差异按钮事件已绑定');
        } else {
            logAsync('INFO', '设置无差异，不绑定事件');
        }
    } else {
        logAsync('ERROR', '设置差异按钮元素未找到');
    }
}

 

 

 

async function handleConfirmRestore(): Promise<void> {
    if (!selectedFile) return;

    try {
        // 强制要求预览为必经步骤
        if (!currentDiffResult || !currentCloudData || !currentLocalData) {
            showMessage('请先点击"分析"按钮预览恢复内容，预览是必经步骤', 'warn');
            return;
        }

        // 二次检查预览数据的完整性
        if (!currentDiffResult.videoRecords || !currentDiffResult.actorRecords) {
            showMessage('预览数据不完整，请重新分析', 'error');
            return;
        }

        // 获取恢复选项
        const restoreSettings = (document.getElementById('webdavRestoreSettings') as HTMLInputElement)?.checked ?? true;
        const restoreRecords = (document.getElementById('webdavRestoreRecords') as HTMLInputElement)?.checked ?? true;
        const restoreUserProfile = (document.getElementById('webdavRestoreUserProfile') as HTMLInputElement)?.checked ?? true;
        const restoreActorRecords = (document.getElementById('webdavRestoreActorRecords') as HTMLInputElement)?.checked ?? true;
        const restoreLogs = (document.getElementById('webdavRestoreLogs') as HTMLInputElement)?.checked ?? false;
        const restoreImportStats = (document.getElementById('webdavRestoreImportStats') as HTMLInputElement)?.checked ?? false;

        if (!restoreSettings && !restoreRecords && !restoreUserProfile && !restoreActorRecords && !restoreLogs && !restoreImportStats) {
            showMessage('请至少选择一项要恢复的内容', 'warn');
            return;
        }

        // 获取合并策略
        const strategy = getSelectedStrategy();

        // 构建合并选项
        const mergeOptions: MergeOptions = {
            strategy: strategy as any,
            restoreSettings,
            restoreRecords,
            restoreUserProfile,
            restoreActorRecords,
            restoreLogs,
            restoreImportStats,
            customConflictResolutions: strategy === 'custom' ? conflictResolutions : undefined
        };

        logAsync('INFO', '开始智能合并恢复数据', {
            filename: selectedFile.name,
            strategy,
            options: mergeOptions
        });

        // 禁用按钮，显示加载状态（限定在当前弹窗作用域）
        const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
        const cancelBtn = mq<HTMLButtonElement>('#webdavRestoreCancel');

        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合并中...';
        }

        if (cancelBtn) {
            cancelBtn.disabled = true;
        }

        // 创建恢复前备份
        await createRestoreBackup();

        // 执行智能合并
        const mergeResult = mergeData(currentLocalData, currentCloudData, currentDiffResult!, mergeOptions);

        if (!mergeResult.success) {
            throw new Error(mergeResult.error || '合并失败');
        }

        // 应用合并结果到本地存储
        await applyMergeResult(mergeResult, mergeOptions);

        // 显示成功结果
        showRestoreResult(mergeResult);

        logAsync('INFO', '智能合并恢复成功', {
            summary: mergeResult.summary
        });

    } catch (error: any) {
        logAsync('ERROR', '智能合并恢复失败', { error: error.message });
        showMessage(`恢复失败: ${error.message}`, 'error');

        // 恢复按钮状态（限定在当前弹窗作用域）
        const confirmBtn = mq<HTMLButtonElement>('#webdavRestoreConfirm');
        const cancelBtn = mq<HTMLButtonElement>('#webdavRestoreCancel');

        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-download"></i> 开始恢复';
        }

        if (cancelBtn) {
            cancelBtn.disabled = false;
        }
    }
}

/**
 * 创建恢复前备份
 */
async function createRestoreBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
        timestamp: Date.now(),
        version: '2.0',
        data: currentLocalData,
        metadata: {
            createdBy: 'smart-restore',
            originalFile: selectedFile?.name
        }
    };

    await setValue(`${STORAGE_KEYS.RESTORE_BACKUP}_${timestamp}`, backupData);
    logAsync('INFO', '已创建恢复前备份', { timestamp });
}

/**
 * 应用合并结果到本地存储
 */
async function applyMergeResult(mergeResult: MergeResult, options: MergeOptions): Promise<void> {
    const promises = [];

    if (options.restoreRecords && mergeResult.mergedData) {
        // 数据校验
    // 新增：新作品
    if (mergeResult.mergedData.newWorks) {
        const nw = mergeResult.mergedData.newWorks;
        if (nw.subscriptions) {
            promises.push(setValue(STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS, nw.subscriptions));
        }
        if (nw.records) {
            promises.push(setValue(STORAGE_KEYS.NEW_WORKS_RECORDS, nw.records));
        }
        if (nw.config) {
            promises.push(setValue(STORAGE_KEYS.NEW_WORKS_CONFIG, nw.config));
        }
    }

        if (mergeResult.mergedData.videoRecords) {
            validateVideoRecords(mergeResult.mergedData.videoRecords);
            promises.push(setValue(STORAGE_KEYS.VIEWED_RECORDS, mergeResult.mergedData.videoRecords));
        }
    }

    if (options.restoreActorRecords && mergeResult.mergedData) {
        // 数据校验
        if (mergeResult.mergedData.actorRecords) {
            validateActorRecords(mergeResult.mergedData.actorRecords);
            // 写回前剔除 blacklisted
            const sanitized = Object.fromEntries(
                Object.entries(mergeResult.mergedData.actorRecords || {}).map(([id, a]: any) => {
                    const { blacklisted, ...rest } = a || {};
                    return [id, rest];
                })
            );
            promises.push(setValue(STORAGE_KEYS.ACTOR_RECORDS, sanitized));
        }
    }

    if (options.restoreSettings && mergeResult.mergedData) {
        // 数据校验
        validateSettings(mergeResult.mergedData.settings);
        promises.push(setValue(STORAGE_KEYS.SETTINGS, mergeResult.mergedData.settings));
    }

    if (options.restoreUserProfile && mergeResult.mergedData) {
        promises.push(setValue(STORAGE_KEYS.USER_PROFILE, mergeResult.mergedData.userProfile));
    }

    if (options.restoreLogs && mergeResult.mergedData) {
        promises.push(setValue(STORAGE_KEYS.LOGS, mergeResult.mergedData.logs));
    }

    if (options.restoreImportStats && mergeResult.mergedData) {
        promises.push(setValue(STORAGE_KEYS.LAST_IMPORT_STATS, mergeResult.mergedData.importStats));
    }

    await Promise.all(promises);

    // 应用后再次校验
    await verifyDataIntegrity(mergeResult, options);
}

/**
 * 校验视频记录数据
 */
function validateVideoRecords(records: Record<string, any>): void {
    for (const [id, record] of Object.entries(records)) {
        if (!record.id || !record.title || !record.status) {
            throw new Error(`视频记录 ${id} 缺少必要字段`);
        }

        if (!['viewed', 'want', 'browsed'].includes(record.status)) {
            throw new Error(`视频记录 ${id} 状态值无效: ${record.status}`);
        }

        if (!record.createdAt || !record.updatedAt) {
            throw new Error(`视频记录 ${id} 缺少时间戳`);
        }

        if (!Array.isArray(record.tags)) {
            throw new Error(`视频记录 ${id} 标签格式错误`);
        }
    }
}

/**
 * 校验演员记录数据
 */
function validateActorRecords(records: Record<string, any>): void {
    for (const [id, record] of Object.entries(records)) {
        if (!record.id || !record.name) {
            throw new Error(`演员记录 ${id} 缺少必要字段`);
        }

        if (!['female', 'male', 'unknown'].includes(record.gender)) {
            throw new Error(`演员记录 ${id} 性别值无效: ${record.gender}`);
        }

        if (!['censored', 'uncensored', 'western', 'unknown'].includes(record.category)) {
            throw new Error(`演员记录 ${id} 分类值无效: ${record.category}`);
        }

        if (!Array.isArray(record.aliases)) {
            throw new Error(`演员记录 ${id} 别名格式错误`);
        }
    }
}

/**
 * 校验设置数据
 */
function validateSettings(settings: any): void {
    if (!settings || typeof settings !== 'object') {
        throw new Error('设置数据格式错误');
    }

    // 检查必要的设置结构
    const requiredSections = ['display', 'webdav', 'dataSync', 'actorSync'];
    for (const section of requiredSections) {
        if (!settings[section] || typeof settings[section] !== 'object') {
            throw new Error(`设置缺少必要部分: ${section}`);
        }
    }
}

/**
 * 验证数据完整性
 */
async function verifyDataIntegrity(mergeResult: MergeResult, options: MergeOptions): Promise<void> {
    const verificationPromises = [];

    if (options.restoreRecords) {
        verificationPromises.push(verifyVideoRecordsIntegrity(mergeResult.summary.videoRecords));
    }

    if (options.restoreActorRecords) {
        verificationPromises.push(verifyActorRecordsIntegrity(mergeResult.summary.actorRecords));
    }

    await Promise.all(verificationPromises);
    logAsync('INFO', '数据完整性验证通过');
}

/**
 * 验证视频记录完整性
 */
async function verifyVideoRecordsIntegrity(summary: any): Promise<void> {
    const actualRecords = await getValue(STORAGE_KEYS.VIEWED_RECORDS, {});
    const actualCount = Object.keys(actualRecords).length;

    if (actualCount !== summary.total) {
        throw new Error(`视频记录数量不匹配: 期望 ${summary.total}, 实际 ${actualCount}`);
    }
}

/**
 * 验证演员记录完整性
 */
async function verifyActorRecordsIntegrity(summary: any): Promise<void> {
    const actualRecords = await getValue(STORAGE_KEYS.ACTOR_RECORDS, {});
    const actualCount = Object.keys(actualRecords).length;

    if (actualCount !== summary.total) {
        throw new Error(`演员记录数量不匹配: 期望 ${summary.total}, 实际 ${actualCount}`);
    }
}

/**
 * 显示恢复结果
 */
function showRestoreResult(mergeResult: MergeResult): void {
    // 隐藏当前弹窗
    const currentModal = document.getElementById('webdavRestoreModal');
    if (currentModal) {
        currentModal.classList.add('hidden');
    }

    // 显示结果弹窗
    const resultModal = document.getElementById('restoreResultModal');
    if (resultModal) {
        resultModal.classList.remove('hidden');
        resultModal.classList.add('visible');
    }

    // 更新操作摘要
    updateOperationSummary(mergeResult.summary);

    // 绑定结果弹窗事件
    bindRestoreResultEvents();
}

/**
 * 更新操作摘要
 */
function updateOperationSummary(summary: any): void {
    const summaryGrid = document.getElementById('operationSummaryGrid');
    if (!summaryGrid) return;

    const summaryItems = [
        { label: '新增视频记录', value: summary.videoRecords.added, icon: 'fas fa-plus' },
        { label: '更新视频记录', value: summary.videoRecords.updated, icon: 'fas fa-edit' },
        { label: '保留视频记录', value: summary.videoRecords.kept, icon: 'fas fa-check' },
        { label: '新增演员收藏', value: summary.actorRecords.added, icon: 'fas fa-user-plus' },
        { label: '更新演员收藏', value: summary.actorRecords.updated, icon: 'fas fa-user-edit' },
        { label: '保留演员收藏', value: summary.actorRecords.kept, icon: 'fas fa-user-check' },
        { label: '新增新作品订阅', value: summary.newWorks?.subscriptions?.added ?? 0, icon: 'fas fa-bell' },
        { label: '更新新作品订阅', value: summary.newWorks?.subscriptions?.updated ?? 0, icon: 'fas fa-bell' },
        { label: '新增新作品记录', value: summary.newWorks?.records?.added ?? 0, icon: 'fas fa-bell' },
        { label: '更新新作品记录', value: summary.newWorks?.records?.updated ?? 0, icon: 'fas fa-bell' }
    ];

    const html = summaryItems.map(item => `
        <div class="summary-item">
            <div class="summary-label">
                <i class="${item.icon}"></i>
                ${item.label}
            </div>
            <div class="summary-value">${item.value}</div>
        </div>
    `).join('');

    summaryGrid.innerHTML = html;
}

/**
 * 绑定恢复结果弹窗事件
 */
function bindRestoreResultEvents(): void {
    const confirmBtn = document.getElementById('restoreResultConfirm');
    const closeBtn = document.getElementById('restoreResultModalClose');
    const downloadBackupBtn = document.getElementById('downloadBackup');

    const closeHandler = () => {
        const resultModal = document.getElementById('restoreResultModal');
        if (resultModal) {
            resultModal.classList.add('hidden');
            resultModal.classList.remove('visible');
        }

        // 刷新页面以应用更改
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    if (confirmBtn) confirmBtn.onclick = closeHandler;
    if (closeBtn) closeBtn.onclick = closeHandler;

    if (downloadBackupBtn) {
        downloadBackupBtn.onclick = downloadLatestBackup;
    }
}

/**
 * 下载最新备份
 */
async function downloadLatestBackup(): Promise<void> {
    try {
        // 获取最新的备份
        const backupKeys = await chrome.storage.local.get(null);
        const restoreBackupKeys = Object.keys(backupKeys).filter(key =>
            key.startsWith(STORAGE_KEYS.RESTORE_BACKUP)
        );

        if (restoreBackupKeys.length === 0) {
            showMessage('没有找到备份文件', 'warn');
            return;
        }

        // 获取最新的备份
        const latestBackupKey = restoreBackupKeys.sort().pop()!;
        const backupData = backupKeys[latestBackupKey] as any;

        // 创建下载
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `restore-backup-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('备份文件下载成功', 'success');

    } catch (error: any) {
        logAsync('ERROR', '下载备份失败', { error: error.message });
        showMessage(`下载备份失败: ${error.message}`, 'error');
    }
}

/**
 * 回滚到上次恢复前的状态
 */
export async function rollbackLastRestore(): Promise<void> {
    try {
        // 获取最新的备份
        const backupKeys = await chrome.storage.local.get(null);
        const restoreBackupKeys = Object.keys(backupKeys).filter(key =>
            key.startsWith(STORAGE_KEYS.RESTORE_BACKUP)
        );

        if (restoreBackupKeys.length === 0) {
            throw new Error('没有找到可回滚的备份');
        }

        // 获取最新的备份
        const latestBackupKey = restoreBackupKeys.sort().pop()!;
        const backupData = backupKeys[latestBackupKey] as any;

        if (!backupData || !backupData.data) {
            throw new Error('备份数据格式错误');
        }

        logAsync('INFO', '开始回滚到恢复前状态', { backupKey: latestBackupKey });

        // 恢复数据
        const promises = [];

        if (backupData.data.viewedRecords) {
            promises.push(setValue(STORAGE_KEYS.VIEWED_RECORDS, backupData.data.viewedRecords));
        }

        if (backupData.data.actorRecords) {
            const sanitized = Object.fromEntries(
                Object.entries(backupData.data.actorRecords || {}).map(([id, a]: any) => {
                    const { blacklisted, ...rest } = a || {};
                    return [id, rest];
                })
            );
            promises.push(setValue(STORAGE_KEYS.ACTOR_RECORDS, sanitized));
        }

        if (backupData.data.settings) {
            promises.push(setValue(STORAGE_KEYS.SETTINGS, backupData.data.settings));
        }

        if (backupData.data.userProfile) {
            promises.push(setValue(STORAGE_KEYS.USER_PROFILE, backupData.data.userProfile));
        }

        if (backupData.data.logs) {
            promises.push(setValue(STORAGE_KEYS.LOGS, backupData.data.logs));
        }

        if (backupData.data.importStats) {
            promises.push(setValue(STORAGE_KEYS.LAST_IMPORT_STATS, backupData.data.importStats));
        }

        await Promise.all(promises);

        // 删除已使用的备份
        await chrome.storage.local.remove(latestBackupKey);

        logAsync('INFO', '回滚完成');
        showMessage('已成功回滚到恢复前状态，页面即将刷新', 'success');

        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error: any) {
        logAsync('ERROR', '回滚失败', { error: error.message });
        showMessage(`回滚失败: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * 清理旧备份
 */
export async function cleanupOldBackups(keepCount: number = 5): Promise<void> {
    try {
        const backupKeys = await chrome.storage.local.get(null);
        const restoreBackupKeys = Object.keys(backupKeys).filter(key =>
            key.startsWith(STORAGE_KEYS.RESTORE_BACKUP)
        ).sort();

        if (restoreBackupKeys.length <= keepCount) {
            return; // 不需要清理
        }

        // 删除多余的旧备份
        const keysToDelete = restoreBackupKeys.slice(0, restoreBackupKeys.length - keepCount);
        await chrome.storage.local.remove(keysToDelete);

        logAsync('INFO', '清理旧备份完成', {
            deleted: keysToDelete.length,
            remaining: keepCount
        });

    } catch (error: any) {
        logAsync('WARN', '清理旧备份失败', { error: error.message });
    }
}

function showError(message: string): void {
    hideElement('webdavRestoreLoading');
    hideElement('webdavRestoreContent');
    showElement('webdavRestoreError');

    const ctx = getRestoreModal() || document;
    const errorMessage = ctx.querySelector('#webdavRestoreErrorMessage') as HTMLElement | null;
    if (errorMessage) errorMessage.textContent = message;
}

function closeModal(): void {
    const modal = document.getElementById('webdavRestoreModal');
    if (modal) {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
    }

    try { document.body.classList.remove('modal-open'); } catch {}

    selectedFile = null;
    logAsync('INFO', '用户关闭了WebDAV恢复弹窗');
}

function showElement(id: string): void {
    const ctx = getRestoreModal() || document;
    const element = ctx.querySelector('#' + id) as HTMLElement | null;
    if (element) element.classList.remove('hidden');
}

function hideElement(id: string): void {
    const ctx = getRestoreModal() || document;
    const element = ctx.querySelector('#' + id) as HTMLElement | null;
    if (element) element.classList.add('hidden');
}

function updateElement(id: string, text: string): void {
    const ctx = getRestoreModal() || document;
    const element = ctx.querySelector('#' + id) as HTMLElement | null;
    if (element) element.textContent = text;
}

/**
 * 获取恢复策略（覆盖式恢复固定为统一策略）
 */
function getSelectedStrategy(): string {
    // 覆盖式恢复只有一种策略：完全替换
    return 'overwrite';
}

 

/**
 * 显示设置差异详情
 */
function showSettingsDifference(settingsDiff: any): void {
    logAsync('INFO', '显示设置差异详情', { settingsDiff });

    // 先移除可能存在的旧弹窗
    const existingModal = document.querySelector('.settings-diff-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建美观的设置差异弹窗
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.6) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        backdrop-filter: blur(4px) !important;
    `;

    modal.innerHTML = `
        <div style="
            background: white !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
            max-width: 90vw !important;
            max-height: 90vh !important;
            width: 1000px !important;
            overflow: hidden !important;
            position: relative !important;
        ">
            <!-- 标题栏 -->
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
                padding: 20px 24px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
            ">
                <h3 style="
                    margin: 0 !important;
                    font-size: 20px !important;
                    font-weight: 700 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                ">
                    <span style="font-size: 18px !important;">⚙️</span>
                    扩展设置差异对比
                </h3>
                <button id="closeSettingsDiff" style="
                    background: none !important;
                    border: none !important;
                    color: white !important;
                    font-size: 18px !important;
                    cursor: pointer !important;
                    padding: 8px !important;
                    border-radius: 8px !important;
                    transition: background-color 0.3s ease !important;
                " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='transparent'">
                    ✕
                </button>
            </div>

            <!-- 主体内容 -->
            <div style="
                padding: 24px !important;
                max-height: 70vh !important;
                overflow-y: auto !important;
            ">
                <!-- 对比区域 -->
                <div style="
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 24px !important;
                    margin-bottom: 24px !important;
                ">
                    <!-- 本地设置 -->
                    <div style="
                        border: 2px solid #e2e8f0 !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    ">
                        <div style="
                            background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%) !important;
                            padding: 16px 20px !important;
                            border-bottom: 2px solid #e2e8f0 !important;
                        ">
                            <div style="
                                display: flex !important;
                                align-items: center !important;
                                gap: 8px !important;
                                font-weight: 700 !important;
                                color: #2d3748 !important;
                                font-size: 16px !important;
                                margin-bottom: 4px !important;
                            ">
                                <span>💻</span>
                                本地设置
                            </div>
                            <small style="color: #6b7280 !important; font-size: 12px !important;">当前扩展配置</small>
                        </div>
                        <div style="
                            padding: 16px !important;
                            background: #f8fafc !important;
                            max-height: 400px !important;
                            overflow-y: auto !important;
                        ">
                            <pre style="
                                margin: 0 !important;
                                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                                font-size: 12px !important;
                                line-height: 1.5 !important;
                                color: #2d3748 !important;
                                white-space: pre-wrap !important;
                                word-break: break-word !important;
                                background: none !important;
                                padding: 0 !important;
                                border: none !important;
                            ">${JSON.stringify(settingsDiff.local || {}, null, 2)}</pre>
                        </div>
                    </div>

                    <!-- 云端设置 -->
                    <div style="
                        border: 2px solid #e2e8f0 !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                    ">
                        <div style="
                            background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%) !important;
                            padding: 16px 20px !important;
                            border-bottom: 2px solid #e2e8f0 !important;
                        ">
                            <div style="
                                display: flex !important;
                                align-items: center !important;
                                gap: 8px !important;
                                font-weight: 700 !important;
                                color: #2d3748 !important;
                                font-size: 16px !important;
                                margin-bottom: 4px !important;
                            ">
                                <span>☁️</span>
                                云端设置
                            </div>
                            <small style="color: #6b7280 !important; font-size: 12px !important;">备份文件配置</small>
                        </div>
                        <div style="
                            padding: 16px !important;
                            background: #f8fafc !important;
                            max-height: 400px !important;
                            overflow-y: auto !important;
                        ">
                            <pre style="
                                margin: 0 !important;
                                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                                font-size: 12px !important;
                                line-height: 1.5 !important;
                                color: #2d3748 !important;
                                white-space: pre-wrap !important;
                                word-break: break-word !important;
                                background: none !important;
                                padding: 0 !important;
                                border: none !important;
                            ">${JSON.stringify(settingsDiff.cloud || {}, null, 2)}</pre>
                        </div>
                    </div>
                </div>

                <!-- 说明信息 -->
                <div style="
                    background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%) !important;
                    border: 2px solid #4fd1c7 !important;
                    border-radius: 12px !important;
                    padding: 16px !important;
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 12px !important;
                ">
                    <div style="
                        color: #319795 !important;
                        font-size: 18px !important;
                        margin-top: 2px !important;
                    ">ℹ️</div>
                    <div>
                        <p style="
                            margin: 0 0 8px 0 !important;
                            color: #2d3748 !important;
                            line-height: 1.5 !important;
                            font-weight: 600 !important;
                        ">说明：恢复时将根据选择的合并策略处理设置差异</p>
                        <p style="
                            margin: 0 !important;
                            color: #4a5568 !important;
                            font-size: 14px !important;
                            line-height: 1.5 !important;
                        ">建议仔细对比两边的设置，确认是否需要保留本地配置</p>
                    </div>
                </div>
            </div>

            <!-- 底部按钮 -->
            <div style="
                background: #f8fafc !important;
                border-top: 2px solid #e2e8f0 !important;
                padding: 16px 24px !important;
                display: flex !important;
                justify-content: flex-end !important;
            ">
                <button id="closeSettingsDiffFooter" style="
                    background: #6b7280 !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 24px !important;
                    border-radius: 8px !important;
                    cursor: pointer !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    transition: background-color 0.3s ease !important;
                " onmouseover="this.style.backgroundColor='#4a5568'" onmouseout="this.style.backgroundColor='#6b7280'">
                    <span>✕</span>
                    关闭
                </button>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(modal);

    // 防止页面滚动
    document.body.style.overflow = 'hidden';

    logAsync('INFO', '美观设置差异弹窗已创建');

    // 关闭弹窗函数
    const closeModal = () => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';

        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
            // 恢复页面滚动
            document.body.style.overflow = '';
            logAsync('INFO', '设置差异弹窗已关闭');
        }, 300);
    };

    // 绑定关闭事件
    const closeBtnHeader = modal.querySelector('#closeSettingsDiff');
    const closeBtnFooter = modal.querySelector('#closeSettingsDiffFooter');

    if (closeBtnHeader) {
        closeBtnHeader.addEventListener('click', closeModal);
    }

    if (closeBtnFooter) {
        closeBtnFooter.addEventListener('click', closeModal);
    }

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 阻止内容区域点击事件冒泡
    const modalContent = modal.querySelector('div');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // ESC键关闭
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // 显示弹窗动画
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    modal.style.transition = 'all 0.3s ease-out';

    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });

}

/**
 * 显示冲突解决界面
 */
function showConflictResolution(type: 'video' | 'actor' | 'newWorksSub' | 'newWorksRec', conflicts: any[]): void {
    currentConflicts = conflicts;
    currentConflictIndex = 0;
    conflictResolutions = {};
    currentConflictType = type;

    // 显示冲突解决弹窗
    const modal = document.getElementById('conflictResolutionModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('visible');
    }

    // 更新冲突总数
    updateElement('totalConflictsCount', conflicts.length.toString());

    // 显示第一个冲突
    displayCurrentConflict();

    // 初始化进度条
    updateConflictProgress();

    // 绑定导航事件
    bindConflictNavigationEvents();
}

/**
 * 显示当前冲突
 */
function displayCurrentConflict(): void {
    if (currentConflicts.length === 0) return;

    const conflict = currentConflicts[currentConflictIndex];

    // 更新冲突索引和进度
    updateElement('currentConflictIndex', (currentConflictIndex + 1).toString());
    updateConflictProgress();

    // 更新冲突标题和类型
    updateElement('conflictItemTitle', conflict.id);
    const typeText = currentConflictType === 'video' ? '视频记录' : (currentConflictType === 'actor' ? '演员记录' : (currentConflictType === 'newWorksSub' ? '新作品订阅' : '新作品记录'));
    updateElement('conflictItemType', typeText);

    // 更新时间戳（若数据包含时间）
    if (conflict.local?.updatedAt) updateElement('localVersionTime', formatTimestamp(conflict.local.updatedAt));
    if (conflict.cloud?.updatedAt) updateElement('cloudVersionTime', formatTimestamp(conflict.cloud.updatedAt));

    // 更新版本内容（视频/演员/新作品订阅/新作品记录）
    displayVersionContent('localVersionContent', conflict.local, currentConflictType);
    displayVersionContent('cloudVersionContent', conflict.cloud, currentConflictType);

    // 设置默认选择
    const currentResolution = conflictResolutions[conflict.id] || conflict.recommendation || 'merge';
    const resolutionInput = document.querySelector(`input[name="currentResolution"][value="${currentResolution}"]`) as HTMLInputElement;
    if (resolutionInput) {
        resolutionInput.checked = true;
    }

    // 更新导航按钮状态
    updateNavigationButtons();
}

/**
 * 显示版本内容（根据类型渲染）
 */
function displayVersionContent(containerId: string, data: any, type: 'video' | 'actor' | 'newWorksSub' | 'newWorksRec'): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';

    if (type === 'video') {
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-video"></i> 标题:</span><span class="field-value">${data.title || '未知'}</span></div>`;
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-eye"></i> 状态:</span><span class="field-value status-${data.status}">${getStatusText(data.status)}</span></div>`;
        
        if (data.tags && data.tags.length > 0) {
            const tagsHtml = data.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('');
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-tags"></i> 标签:</span><span class="field-value tags">${tagsHtml}</span></div>`;
        } else {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-tags"></i> 标签:</span><span class="field-value empty">无标签</span></div>`;
        }
        
        if (data.releaseDate) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-calendar"></i> 发行日期:</span><span class="field-value">${data.releaseDate}</span></div>`;
        }
        if (data.javdbUrl) {
            const urlDisplay = data.javdbUrl.length > 50 ? data.javdbUrl.substring(0, 50) + '...' : data.javdbUrl;
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-link"></i> 链接:</span><span class="field-value"><a href="${data.javdbUrl}" target="_blank" class="external-link">${urlDisplay}</a></span></div>`;
        }
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-clock"></i> 更新时间:</span><span class="field-value">${formatTimestamp(data.updatedAt)}</span></div>`;
    } else if (type === 'actor') {
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-user"></i> 姓名:</span><span class="field-value">${data.name || '未知'}</span></div>`;
        if (data.gender) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-venus-mars"></i> 性别:</span><span class="field-value">${data.gender}</span></div>`;
        }
        if (data.category) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-tags"></i> 分类:</span><span class="field-value">${data.category}</span></div>`;
        }
        if (data.profileUrl) {
            const urlDisplay = data.profileUrl.length > 50 ? data.profileUrl.substring(0, 50) + '...' : data.profileUrl;
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-link"></i> 资料链接:</span><span class="field-value"><a href="${data.profileUrl}" target="_blank" class="external-link">${urlDisplay}</a></span></div>`;
        }
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-clock"></i> 更新时间:</span><span class="field-value">${formatTimestamp(data.updatedAt)}</span></div>`;
    } else if (type === 'newWorksSub') {
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-id-badge"></i> 演员：</span><span class="field-value">${data.actorName || '未知'}</span></div>`;
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-toggle-on"></i> 订阅状态：</span><span class="field-value">${data.enabled ? '启用' : '停用'}</span></div>`;
        if (data.lastCheckTime) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-clock"></i> 最后检查：</span><span class="field-value">${formatTimestamp(data.lastCheckTime)}</span></div>`;
        }
        if (data.subscribedAt) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-calendar-plus"></i> 订阅时间：</span><span class="field-value">${formatTimestamp(data.subscribedAt)}</span></div>`;
        }
    } else if (type === 'newWorksRec') {
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-film"></i> 标题：</span><span class="field-value">${data.title || '未知'}</span></div>`;
        if (data.actorName) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-user"></i> 演员：</span><span class="field-value">${data.actorName}</span></div>`;
        }
        if (data.releaseDate) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-calendar"></i> 发行日期：</span><span class="field-value">${data.releaseDate}</span></div>`;
        }
        if (data.tags && data.tags.length > 0) {
            const tagsHtml = data.tags.map((t: string) => `<span class="tag">${t}</span>`).join('');
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-tags"></i> 标签：</span><span class="field-value tags">${tagsHtml}</span></div>`;
        }
        if (data.javdbUrl) {
            const urlDisplay = data.javdbUrl.length > 50 ? data.javdbUrl.substring(0, 50) + '...' : data.javdbUrl;
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-link"></i> 链接：</span><span class="field-value"><a href="${data.javdbUrl}" target="_blank" class="external-link">${urlDisplay}</a></span></div>`;
        }
        if (data.discoveredAt) {
            html += `<div class="field-item"><span class="field-label"><i class="fas fa-search"></i> 发现时间：</span><span class="field-value">${formatTimestamp(data.discoveredAt)}</span></div>`;
        }
        html += `<div class="field-item"><span class="field-label"><i class="fas fa-clock"></i> 更新时间：</span><span class="field-value">${formatTimestamp(data.updatedAt || Date.now())}</span></div>`;
    }

    container.innerHTML = html;
}






/**
 * 绑定冲突导航事件
 */
function bindConflictNavigationEvents(): void {
    const prevBtn = document.getElementById('prevConflict');
    const nextBtn = document.getElementById('nextConflict');
    const confirmBtn = document.getElementById('conflictResolutionConfirm');
    const cancelBtn = document.getElementById('conflictResolutionCancel');
    const closeBtn = document.getElementById('conflictResolutionModalClose');

    if (prevBtn) {
        prevBtn.onclick = () => {
            saveCurrentResolution();
            if (currentConflictIndex > 0) {
                currentConflictIndex--;
                displayCurrentConflict();
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            saveCurrentResolution();
            if (currentConflictIndex < currentConflicts.length - 1) {
                currentConflictIndex++;
                displayCurrentConflict();
            }
        };
    }

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            saveCurrentResolution();
            hideConflictResolution();
        };
    }

    if (cancelBtn || closeBtn) {
        const closeHandler = () => {
            conflictResolutions = {};
            hideConflictResolution();
        };
        if (cancelBtn) cancelBtn.onclick = closeHandler;
        if (closeBtn) closeBtn.onclick = closeHandler;
    }

    // 绑定批量操作
    bindBatchOperations();
}

/**
 * 保存当前冲突的解决方案
 */
function saveCurrentResolution(): void {
    const conflict = currentConflicts[currentConflictIndex];
    const selectedResolution = document.querySelector('input[name="currentResolution"]:checked') as HTMLInputElement;

    if (selectedResolution && conflict) {
        conflictResolutions[conflict.id] = selectedResolution.value as 'local' | 'cloud' | 'merge';
    }
}

/**
 * 更新冲突进度条
 */
function updateConflictProgress(): void {
    const progressFill = document.getElementById('conflictProgressFill');
    if (progressFill && currentConflicts.length > 0) {
        const progress = ((currentConflictIndex + 1) / currentConflicts.length) * 100;

        // 强制设置样式
        progressFill.style.setProperty('width', `${progress}%`, 'important');
        progressFill.style.setProperty('display', 'block', 'important');
        progressFill.style.setProperty('height', '100%', 'important');
        progressFill.style.setProperty('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'important');
        progressFill.style.setProperty('transition', 'width 0.4s ease', 'important');

        // 调试日志
        logAsync('DEBUG', '更新冲突进度条', {
            currentIndex: currentConflictIndex,
            totalConflicts: currentConflicts.length,
            progress: progress,
            progressWidth: progressFill.style.width,
            computedWidth: getComputedStyle(progressFill).width
        });
    } else {
        logAsync('DEBUG', '进度条更新失败', {
            progressFillExists: !!progressFill,
            conflictsLength: currentConflicts.length,
            currentIndex: currentConflictIndex
        });
    }
}

/**
 * 更新导航按钮状态
 */
function updateNavigationButtons(): void {
    const prevBtn = document.getElementById('prevConflict') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextConflict') as HTMLButtonElement;

    if (prevBtn) {
        prevBtn.disabled = currentConflictIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentConflictIndex === currentConflicts.length - 1;
    }
}

/**
 * 绑定批量操作
 */
function bindBatchOperations(): void {
    const batchLocalBtn = document.getElementById('batchSelectLocal');
    const batchCloudBtn = document.getElementById('batchSelectCloud');
    const batchMergeBtn = document.getElementById('batchSelectMerge');

    if (batchLocalBtn) {
        batchLocalBtn.onclick = () => setBatchResolution('local');
    }

    if (batchCloudBtn) {
        batchCloudBtn.onclick = () => setBatchResolution('cloud');
    }

    if (batchMergeBtn) {
        batchMergeBtn.onclick = () => setBatchResolution('merge');
    }
}

/**
 * 设置批量解决方案
 */
function setBatchResolution(resolution: 'local' | 'cloud' | 'merge'): void {
    // 保存当前冲突的选择
    saveCurrentResolution();

    // 为所有冲突设置相同的解决方案
    currentConflicts.forEach(conflict => {
        conflictResolutions[conflict.id] = resolution;
    });

    // 更新当前显示的选择
    const resolutionInput = document.querySelector(`input[name="currentResolution"][value="${resolution}"]`) as HTMLInputElement;
    if (resolutionInput) {
        resolutionInput.checked = true;
    }

    showMessage(`已为所有 ${currentConflicts.length} 个冲突设置为"${getResolutionText(resolution)}"`, 'success');
}

/**
 * 隐藏冲突解决界面
 */
function hideConflictResolution(): void {
    const modal = document.getElementById('conflictResolutionModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('visible');
    }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'viewed': '已观看',
        'want': '我想看',
        'browsed': '已浏览'
    };
    return statusMap[status] || status;
}

/**
 * 获取解决方案文本
 */
function getResolutionText(resolution: string): string {
    const resolutionMap: Record<string, string> = {
        'local': '保留本地',
        'cloud': '保留云端',
        'merge': '智能合并'
    };
    return resolutionMap[resolution] || resolution;
}

/**
 * 绑定专家模式事件
 */
function bindExpertModeEvents(diffResult: DataDiffResult): void {
    // 专家模式已废弃：此函数改为无操作
    return;
}

/**
 * 绑定专家模式策略选择事件
 */
function bindExpertStrategyChangeEvents(): void {
    // 专家模式已废弃：此函数改为无操作
    return;
}

/**
 * 更新专家模式影响预览
 */
function updateExpertImpactPreview(strategy: string, diffResult: DataDiffResult): void {
    // 专家模式已废弃：不再更新影响预览
    return;
}

// 函数已在定义时导出

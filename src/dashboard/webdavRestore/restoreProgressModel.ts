export function buildRestoreProgressHtml(): string {
  return `
        <div class="progress-header">
            <h4><i class="fas fa-sync fa-spin"></i> 正在执行恢复</h4>
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
}

export type RestoreProgressStage =
  | 'prepare'
  | 'autoBackup'
  | 'download'
  | 'parse'
  | 'apply'
  | 'category'
  | 'complete'
  | 'error';

export type RestoreProgressStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

export type RestoreProgressCategoryMode = 'skip' | 'merge' | 'replace';

export interface RestoreProgressEvent {
  type?: 'WEB_DAV:RESTORE_PROGRESS';
  taskId?: string;
  stage: RestoreProgressStage;
  status: RestoreProgressStatus;
  message: string;
  category?: string;
  categoryMode?: RestoreProgressCategoryMode;
  completedCategories?: number;
  totalCategories?: number;
  summary?: Record<string, any>;
  error?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  settings: '扩展设置',
  userProfile: '账号信息',
  viewed: '观看记录',
  actors: '演员库',
  newWorks: '新作品',
  lists: '清单 / 系列 / 番号',
  magnets: '磁链缓存',
  logs: '日志记录',
  magnetPushLogs: '磁力推送日志',
  importStats: '导入统计',
};

const MODE_LABELS: Record<RestoreProgressCategoryMode, string> = {
  skip: '跳过',
  merge: '合并',
  replace: '覆盖',
};

const STATUS_LABELS: Record<RestoreProgressStatus, string> = {
  pending: '等待中',
  running: '进行中',
  done: '已完成',
  skipped: '已跳过',
  error: '失败',
};

export function getRestoreProgressCategoryLabel(category: string | undefined): string {
  if (!category) return '恢复任务';
  return CATEGORY_LABELS[category] || category;
}

export function getRestoreProgressModeLabel(mode: RestoreProgressCategoryMode | undefined): string {
  return MODE_LABELS[mode || 'skip'] || MODE_LABELS.skip;
}

export function buildRestoreCategoryProgressHtml(event: RestoreProgressEvent): string {
  const category = event.category || 'unknown';
  const statusClass = event.status === 'error' ? 'error' : event.status === 'done' ? 'done' : event.status === 'skipped' ? 'skipped' : 'running';
  const detail = buildRestoreProgressDetailText(event);

  return `
        <div class="restore-progress-category ${statusClass}" data-restore-progress-category="${escapeHtml(category)}">
            <div class="restore-progress-category-main">
                <span class="restore-progress-category-name">${escapeHtml(getRestoreProgressCategoryLabel(event.category))}</span>
                <span class="restore-progress-category-mode">${escapeHtml(getRestoreProgressModeLabel(event.categoryMode))}</span>
                <span class="restore-progress-category-status">${escapeHtml(STATUS_LABELS[event.status])}</span>
            </div>
            <div class="restore-progress-category-detail">${escapeHtml(detail)}</div>
        </div>
    `;
}

export function buildRestoreProgressDetailText(event: RestoreProgressEvent): string {
  const parts: string[] = [];
  const written = Number(event.summary?.written ?? event.summary?.added);
  if (Number.isFinite(written) && written > 0) parts.push(`已写入 ${written} 条`);
  if (event.summary?.kept != null) parts.push(`保留 ${event.summary.kept} 条`);
  if (event.summary?.updated != null) parts.push(`更新 ${event.summary.updated} 条`);
  if (event.summary?.reason === 'missing') parts.push('云端备份缺少该类别数据');
  if (event.error || event.summary?.error) parts.push(event.error || event.summary?.error);
  if (parts.length > 0) return parts.join('，');
  return event.message;
}

export function buildRestoreOverallProgressText(event: RestoreProgressEvent): string {
  const progressText = event.totalCategories && event.completedCategories != null
    ? `（${event.completedCategories}/${event.totalCategories} 个类别）`
    : '';
  return `${event.message}${progressText}`;
}

export interface RestoreProgressContainerSpec {
  id: string;
  className: string;
  html: string;
}

export interface RestoreProgressEnterState {
  modalId: string;
  modalBodySelector: string;
  hiddenChildDisplay: string;
}

export interface RestoreProgressLeaveState {
  progressContainerId: string;
  restoredChildDisplay: string;
}

export function buildRestoreProgressContainerSpec(): RestoreProgressContainerSpec {
  return {
    id: 'restoreProgressContainer',
    className: 'restore-progress-container',
    html: buildRestoreProgressHtml(),
  };
}

export function buildRestoreProgressEnterState(): RestoreProgressEnterState {
  return {
    modalId: 'webdavRestoreModal',
    modalBodySelector: '.modal-body',
    hiddenChildDisplay: 'none',
  };
}

export function buildRestoreProgressLeaveState(): RestoreProgressLeaveState {
  return {
    progressContainerId: 'restoreProgressContainer',
    restoredChildDisplay: '',
  };
}

export function formatElapsedTime(elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

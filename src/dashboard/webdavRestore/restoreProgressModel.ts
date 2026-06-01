export function buildRestoreProgressHtml(): string {
  return `
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

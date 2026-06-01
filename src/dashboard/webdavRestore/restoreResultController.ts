import {
  buildOperationSummaryHtml,
  buildOperationSummaryItems,
  buildRestoreResultModalCloseState,
  buildRestoreResultModalShowState,
} from './operationSummaryModel';
import {
  buildRestoreBackupDownloadName,
  findLatestRestoreBackupKey,
} from './restoreBackupModel';

export interface RestoreResultLike {
  summary: any;
}

export interface WebDAVRestoreResultControllerOptions {
  backupPrefix: string;
  getAllStorage: () => Promise<Record<string, any>>;
  showMessage: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
  logError: (message: string, payload?: Record<string, unknown>) => void;
  reloadPage: () => void;
  now?: () => Date;
}

export class WebDAVRestoreResultController {
  constructor(private readonly options: WebDAVRestoreResultControllerOptions) {}

  show(mergeResult: RestoreResultLike): void {
    const state = buildRestoreResultModalShowState();
    document.getElementById(state.currentModalId)?.classList.add(...state.currentModalClassNamesToAdd);

    const resultModal = document.getElementById(state.resultModalId);
    if (resultModal) {
      resultModal.classList.remove(...state.resultModalClassNamesToRemove);
      resultModal.classList.add(...state.resultModalClassNamesToAdd);
    }

    this.updateOperationSummary(mergeResult.summary);
    this.bindRestoreResultEvents();
  }

  private updateOperationSummary(summary: any): void {
    const summaryGrid = document.getElementById('operationSummaryGrid');
    if (!summaryGrid) return;

    summaryGrid.innerHTML = buildOperationSummaryHtml(buildOperationSummaryItems(summary));
  }

  private bindRestoreResultEvents(): void {
    const confirmBtn = document.getElementById('restoreResultConfirm');
    const closeBtn = document.getElementById('restoreResultModalClose');
    const downloadBackupBtn = document.getElementById('downloadBackup');

    const closeHandler = () => {
      const state = buildRestoreResultModalCloseState();
      const resultModal = document.getElementById(state.resultModalId);
      if (resultModal) {
        resultModal.classList.add(...state.resultModalClassNamesToAdd);
        resultModal.classList.remove(...state.resultModalClassNamesToRemove);
      }

      setTimeout(() => {
        this.options.reloadPage();
      }, state.reloadDelayMs);
    };

    if (confirmBtn) confirmBtn.onclick = closeHandler;
    if (closeBtn) closeBtn.onclick = closeHandler;

    if (downloadBackupBtn) {
      downloadBackupBtn.onclick = () => {
        void this.downloadLatestBackup();
      };
    }
  }

  private async downloadLatestBackup(): Promise<void> {
    try {
      const backupKeys = await this.options.getAllStorage();
      const latestBackupKey = findLatestRestoreBackupKey(Object.keys(backupKeys), this.options.backupPrefix);

      if (!latestBackupKey) {
        this.options.showMessage('没有找到备份文件', 'warn');
        return;
      }

      const backupData = backupKeys[latestBackupKey] as any;
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = buildRestoreBackupDownloadName((this.options.now ?? (() => new Date()))());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.options.showMessage('备份文件下载成功', 'success');
    } catch (error: any) {
      this.options.logError('下载备份失败', { error: error.message });
      this.options.showMessage(`下载备份失败: ${error.message}`, 'error');
    }
  }
}

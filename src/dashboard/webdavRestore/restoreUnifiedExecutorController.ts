import type { MergeOptions } from '../../features/webdavSync/application/dataDiff';
import type { RestrictedFeature } from '../../types/privacy';
import {
  buildRestoreCategoryModes,
  buildRestoreCategorySelection,
  buildRestoreExecuteConfirmHtml,
  type RestoreCategoryMode,
  type RestoreCategoryModes,
} from './restoreExecuteConfirmModel';

export interface RestoreUnifiedSelectedFile {
  name: string;
  path: string;
}

export interface RestoreUnifiedConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type?: 'warning' | 'danger' | 'info';
  isHtml: boolean;
}

export interface WebDAVRestoreUnifiedExecutorControllerOptions {
  queryInModal: <T extends HTMLElement = HTMLElement>(selector: string) => T | null;
  getSelectedFile: () => RestoreUnifiedSelectedFile | null;
  getCloudData: () => any;
  requireAuthIfRestricted: (
    scope: RestrictedFeature,
    callback: () => void | Promise<void>,
    options: { title: string; message: string },
  ) => Promise<boolean>;
  showConfirm: (options: RestoreUnifiedConfirmOptions) => Promise<boolean>;
  showMessage: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
  showRestoreProgress: () => void;
  showRestoreResults: (summary: any, cloudData: any) => void;
  clearProgressTimer: () => void;
  sendRuntimeMessage: (message: any, callback: (response: any) => void) => void;
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
  logError: (message: string, payload?: Record<string, unknown>) => void;
}

export class WebDAVRestoreUnifiedExecutorController {
  constructor(private readonly options: WebDAVRestoreUnifiedExecutorControllerOptions) {}

  async executeRestore(mergeOptions: MergeOptions): Promise<void> {
    try {
      const selectedFile = this.options.getSelectedFile();
      if (!selectedFile) return;

      const ok = await this.options.requireAuthIfRestricted('webdav-sync', async () => {}, {
        title: '需要密码验证',
        message: '恢复云端备份将修改本地数据，请先完成密码验证。',
      });
      if (!ok) {
        this.options.showMessage('已取消：未通过密码验证', 'warn');
        return;
      }

      const categories = buildRestoreCategorySelection({
        mergeOptions,
        restoreMagnetPushLogs: this.readCheckboxValue(['webdavRestoreMagnetPushLogs', 'webdavRestoreMagnetPushLogsSimple'], false),
        restoreMagnets: this.readCheckboxValue(['webdavRestoreMagnets', 'webdavRestoreMagnetsSimple'], false),
      });
      const categoryModes = buildRestoreCategoryModes({
        mergeOptions,
        restoreMagnetPushLogs: categories.magnetPushLogs,
        restoreMagnets: categories.magnets,
        explicitModes: this.readCategoryModes(),
      });

      const autoBackupBeforeRestore = this.readCheckboxValue(['webdavAutoBackupBeforeRestore'], true);

      const confirmed = await this.options.showConfirm({
        title: '⚠️ 确认恢复策略',
        message: buildRestoreExecuteConfirmHtml({ categories, categoryModes, autoBackupBeforeRestore }),
        confirmText: '确定恢复',
        cancelText: '取消',
        type: 'danger',
        isHtml: true,
      });

      if (!confirmed) {
        this.options.showMessage('已取消恢复操作', 'info');
        return;
      }

      this.options.logInfo('开始执行统一恢复', { mergeOptions, categories, categoryModes });
      this.options.showRestoreProgress();

      const resp = await new Promise<any>((resolve) => {
        this.options.sendRuntimeMessage({
          type: 'WEB_DAV:RESTORE_UNIFIED',
          filename: selectedFile.path,
          options: {
            categories,
            categoryModes,
            autoBackupBeforeRestore,
          },
        }, resolve);
      });

      if (resp?.success) {
        this.options.logInfo('统一恢复完成', { summary: resp.summary });
        this.options.clearProgressTimer();
        this.options.showRestoreResults(resp.summary, this.options.getCloudData());
      } else {
        this.options.clearProgressTimer();
        throw new Error(resp?.error || '恢复失败');
      }
    } catch (error: any) {
      this.options.logError('恢复操作失败', { error: error.message });
      this.options.showMessage(`恢复失败: ${error.message}`, 'error');
    }
  }

  private readCheckboxValue(ids: string[], fallback: boolean): boolean {
    for (const id of ids) {
      const checkbox = this.options.queryInModal<HTMLInputElement>('#' + id);
      if (checkbox) return Boolean(checkbox.checked);
    }

    return fallback;
  }

  private readCategoryModes(): Partial<RestoreCategoryModes> {
    const modes: Partial<RestoreCategoryModes> = {};
    const selectors = [
      ['settings', ['webdavRestoreSettingsMode', 'webdavRestoreSettingsModeSimple']],
      ['viewed', ['webdavRestoreRecordsMode', 'webdavRestoreRecordsModeSimple']],
      ['userProfile', ['webdavRestoreUserProfileMode', 'webdavRestoreUserProfileModeSimple']],
      ['actors', ['webdavRestoreActorRecordsMode', 'webdavRestoreActorRecordsModeSimple']],
      ['newWorks', ['webdavRestoreNewWorksMode', 'webdavRestoreNewWorksModeSimple']],
      ['lists', ['webdavRestoreListsMode', 'webdavRestoreListsModeSimple']],
      ['logs', ['webdavRestoreLogsMode', 'webdavRestoreLogsModeSimple']],
      ['magnetPushLogs', ['webdavRestoreMagnetPushLogsMode', 'webdavRestoreMagnetPushLogsModeSimple']],
      ['importStats', ['webdavRestoreImportStatsMode', 'webdavRestoreImportStatsModeSimple']],
      ['magnets', ['webdavRestoreMagnetsMode', 'webdavRestoreMagnetsModeSimple']],
    ] as const;

    for (const [category, ids] of selectors) {
      const value = this.readSelectValue(ids);
      if (value) modes[category] = value;
    }

    return modes;
  }

  private readSelectValue(ids: readonly string[]): RestoreCategoryMode | undefined {
    for (const id of ids) {
      const select = this.options.queryInModal<HTMLSelectElement>('#' + id);
      const value = select?.value;
      if (value === 'skip' || value === 'merge' || value === 'replace') return value;
    }

    return undefined;
  }
}

import type { DataDiffResult, MergeOptions } from '../../features/webdavSync/application/dataDiff';
import type { MergeResult } from '../../features/webdavSync/application/dataMerge';
import {
  buildRestoreBackupData,
  buildRestoreBackupKey,
  findLatestRestoreBackupKey,
  formatRestoreBackupTimestamp,
  selectOldRestoreBackupKeys,
} from './restoreBackupModel';
import {
  buildMergeStorageWritePlans,
  buildRollbackStorageWritePlans,
  buildRestoreStorageKeys,
  type RestoreStorageKeyConstants,
} from './restoreApplyPlanModel';
import {
  buildRestoreSubmitErrorState,
  buildRestoreSubmitLoadingState,
} from './restoreModalStateModel';
import {
  validateActorRecords,
  validateSettings,
  validateVideoRecords,
} from './restoreValidationModel';

export interface RestoreApplyStorageKeys extends RestoreStorageKeyConstants {
  RESTORE_BACKUP: string;
}

export interface RestoreApplySelectedFile {
  name: string;
  path: string;
}

export interface RestoreApplyContext {
  diffResult: DataDiffResult | null;
  cloudData: any;
  localData: any;
}

export interface WebDAVRestoreApplyControllerOptions {
  storageKeys: RestoreApplyStorageKeys;
  getSelectedFile: () => RestoreApplySelectedFile | null;
  getRestoreContext: () => RestoreApplyContext;
  getConflictResolutions: () => Record<string, unknown>;
  queryInModal: <T extends HTMLElement = HTMLElement>(selector: string) => T | null;
  setValue: (key: string, value: any) => Promise<void>;
  getValue: (key: string, fallback: any) => Promise<any>;
  getAllStorage: () => Promise<Record<string, any>>;
  removeStorage: (keys: string | string[]) => Promise<void>;
  clearMagnetPushLogs: () => Promise<void>;
  addMagnetPushLogs: (logs: any[]) => Promise<void>;
  mergeData: (localData: any, cloudData: any, diffResult: DataDiffResult, options: MergeOptions) => MergeResult;
  showMessage: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
  showRestoreResult: (mergeResult: MergeResult) => void;
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
  logWarn: (message: string, payload?: Record<string, unknown>) => void;
  logError: (message: string, payload?: Record<string, unknown>) => void;
  reloadPage: () => void;
  now?: () => Date;
  setTimeout?: (handler: () => void, timeout?: number) => unknown;
}

export class WebDAVRestoreApplyController {
  constructor(private readonly options: WebDAVRestoreApplyControllerOptions) {}

  async handleConfirmRestore(): Promise<void> {
    const selectedFile = this.options.getSelectedFile();
    if (!selectedFile) return;

    try {
      const context = this.options.getRestoreContext();
      if (!context.diffResult || !context.cloudData || !context.localData) {
        this.options.showMessage('请先点击"分析"按钮预览恢复内容，预览是必经步骤', 'warn');
        return;
      }

      if (!context.diffResult.videoRecords || !context.diffResult.actorRecords) {
        this.options.showMessage('预览数据不完整，请重新分析', 'error');
        return;
      }

      const mergeOptions = this.buildSelectedMergeOptions();
      if (!hasAnyRestoreTarget(mergeOptions)) {
        this.options.showMessage('请至少选择一项要恢复的内容', 'warn');
        return;
      }

      this.options.logInfo('开始智能合并恢复数据', {
        filename: selectedFile.name,
        strategy: mergeOptions.strategy,
        options: mergeOptions,
      });

      this.applyRestoreSubmitLoadingState();
      await this.createRestoreBackup();

      const mergeResult = this.options.mergeData(context.localData, context.cloudData, context.diffResult, mergeOptions);
      if (!mergeResult.success) {
        throw new Error(mergeResult.error || '合并失败');
      }

      await this.applyMergeResult(mergeResult, mergeOptions);
      this.options.showRestoreResult(mergeResult);
      this.options.logInfo('智能合并恢复成功', { summary: mergeResult.summary });
    } catch (error: any) {
      this.options.logError('智能合并恢复失败', { error: error.message });
      this.options.showMessage(`恢复失败: ${error.message}`, 'error');
      this.applyRestoreSubmitErrorState();
    }
  }

  async createRestoreBackup(): Promise<void> {
    const selectedFile = this.options.getSelectedFile();
    const context = this.options.getRestoreContext();
    const now = (this.options.now ?? (() => new Date()))();
    const timestamp = formatRestoreBackupTimestamp(now);
    const backupData = buildRestoreBackupData({
      data: context.localData,
      now,
      originalFile: selectedFile?.name,
    });

    await this.options.setValue(buildRestoreBackupKey(this.options.storageKeys.RESTORE_BACKUP, timestamp), backupData);
    this.options.logInfo('已创建恢复前备份', { timestamp });
  }

  async applyMergeResult(mergeResult: MergeResult, options: MergeOptions): Promise<void> {
    const writePlans = buildMergeStorageWritePlans(
      mergeResult.mergedData,
      options,
      buildRestoreStorageKeys(this.options.storageKeys),
    );

    await Promise.all(writePlans.map((plan) => {
      if (plan.kind === 'videoRecords') validateVideoRecords(plan.value);
      if (plan.kind === 'actorRecords') validateActorRecords(plan.value);
      if (plan.kind === 'settings') validateSettings(plan.value);

      return this.options.setValue(plan.key, plan.value);
    }));

    await this.verifyDataIntegrity(mergeResult, options);
  }

  async verifyDataIntegrity(mergeResult: MergeResult, options: MergeOptions): Promise<void> {
    const verificationPromises: Promise<void>[] = [];

    if (options.restoreRecords) {
      verificationPromises.push(this.verifyVideoRecordsIntegrity(mergeResult.summary.videoRecords));
    }

    if (options.restoreActorRecords) {
      verificationPromises.push(this.verifyActorRecordsIntegrity(mergeResult.summary.actorRecords));
    }

    await Promise.all(verificationPromises);
    this.options.logInfo('数据完整性验证通过');
  }

  async rollbackLastRestore(): Promise<void> {
    try {
      const backupKeys = await this.options.getAllStorage();
      const latestBackupKey = findLatestRestoreBackupKey(Object.keys(backupKeys), this.options.storageKeys.RESTORE_BACKUP);

      if (!latestBackupKey) {
        throw new Error('没有找到可回滚的备份');
      }

      const backupData = backupKeys[latestBackupKey] as any;
      if (!backupData || !backupData.data) {
        throw new Error('备份数据格式错误');
      }

      this.options.logInfo('开始回滚到恢复前状态', { backupKey: latestBackupKey });

      const writePlans = buildRollbackStorageWritePlans(
        backupData.data,
        buildRestoreStorageKeys(this.options.storageKeys),
      );
      const promises = writePlans.map((plan) => this.options.setValue(plan.key, plan.value));

      if (backupData.data.magnetPushLogs) {
        promises.push(
          this.options.clearMagnetPushLogs().then(() => this.options.addMagnetPushLogs(backupData.data.magnetPushLogs)),
        );
      }

      await Promise.all(promises);
      await this.options.removeStorage(latestBackupKey);

      this.options.logInfo('回滚完成');
      this.options.showMessage('已成功回滚到恢复前状态，页面即将刷新', 'success');

      const setTimeoutImpl = this.options.setTimeout ?? window.setTimeout.bind(window);
      setTimeoutImpl(() => {
        this.options.reloadPage();
      }, 1500);
    } catch (error: any) {
      this.options.logError('回滚失败', { error: error.message });
      this.options.showMessage(`回滚失败: ${error.message}`, 'error');
      throw error;
    }
  }

  async cleanupOldBackups(keepCount = 5): Promise<void> {
    try {
      const backupKeys = await this.options.getAllStorage();
      const keysToDelete = selectOldRestoreBackupKeys(
        Object.keys(backupKeys),
        this.options.storageKeys.RESTORE_BACKUP,
        keepCount,
      );

      if (keysToDelete.length === 0) return;

      await this.options.removeStorage(keysToDelete);
      this.options.logInfo('清理旧备份完成', {
        deleted: keysToDelete.length,
        remaining: keepCount,
      });
    } catch (error: any) {
      this.options.logWarn('清理旧备份失败', { error: error.message });
    }
  }

  private async verifyVideoRecordsIntegrity(summary: any): Promise<void> {
    const actualRecords = await this.options.getValue(this.options.storageKeys.VIEWED_RECORDS, {});
    const actualCount = Object.keys(actualRecords).length;

    if (actualCount !== summary.total) {
      throw new Error(`视频记录数量不匹配: 期望 ${summary.total}, 实际 ${actualCount}`);
    }
  }

  private async verifyActorRecordsIntegrity(summary: any): Promise<void> {
    const actualRecords = await this.options.getValue(this.options.storageKeys.ACTOR_RECORDS, {});
    const actualCount = Object.keys(actualRecords).length;

    if (actualCount !== summary.total) {
      throw new Error(`演员记录数量不匹配: 期望 ${summary.total}, 实际 ${actualCount}`);
    }
  }

  private buildSelectedMergeOptions(): MergeOptions {
    const strategy: string = 'overwrite';
    return {
      strategy: strategy as any,
      restoreSettings: this.readCheckboxValue('webdavRestoreSettings', true),
      restoreRecords: this.readCheckboxValue('webdavRestoreRecords', true),
      restoreUserProfile: this.readCheckboxValue('webdavRestoreUserProfile', true),
      restoreActorRecords: this.readCheckboxValue('webdavRestoreActorRecords', true),
      restoreLogs: this.readCheckboxValue('webdavRestoreLogs', false),
      restoreMagnetPushLogs: this.readCheckboxValue('webdavRestoreMagnetPushLogs', false),
      restoreImportStats: this.readCheckboxValue('webdavRestoreImportStats', false),
      customConflictResolutions: strategy === 'custom' ? this.options.getConflictResolutions() as any : undefined,
    };
  }

  private readCheckboxValue(id: string, fallback: boolean): boolean {
    const checkbox = this.options.queryInModal<HTMLInputElement>('#' + id);
    return checkbox ? Boolean(checkbox.checked) : fallback;
  }

  private applyRestoreSubmitLoadingState(): void {
    const state = buildRestoreSubmitLoadingState();
    state.disabledButtonIds.forEach((id) => {
      const button = this.options.queryInModal<HTMLButtonElement>('#' + id);
      if (button) button.disabled = true;
    });

    const confirmBtn = this.options.queryInModal<HTMLButtonElement>('#webdavRestoreConfirm');
    if (confirmBtn) confirmBtn.innerHTML = state.confirmButtonHtml;
  }

  private applyRestoreSubmitErrorState(): void {
    const state = buildRestoreSubmitErrorState();
    state.enabledButtonIds.forEach((id) => {
      const button = this.options.queryInModal<HTMLButtonElement>('#' + id);
      if (button) button.disabled = false;
    });

    state.shownButtonIds.forEach((id) => this.options.queryInModal<HTMLElement>('#' + id)?.classList.remove('hidden'));

    const confirmBtn = this.options.queryInModal<HTMLButtonElement>('#webdavRestoreConfirm');
    if (confirmBtn) confirmBtn.innerHTML = state.confirmButtonHtml;
  }
}

function hasAnyRestoreTarget(options: MergeOptions): boolean {
  return Boolean(
    options.restoreSettings ||
    options.restoreRecords ||
    options.restoreUserProfile ||
    options.restoreActorRecords ||
    options.restoreLogs ||
    options.restoreMagnetPushLogs ||
    options.restoreImportStats
  );
}

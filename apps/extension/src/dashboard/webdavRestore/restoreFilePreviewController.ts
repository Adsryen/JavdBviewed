import { detectBackupVersion, migrateBackupData } from '../../features/webdavSync/application/backupMigration';
import {
  buildBackupDateRangeLabel,
  buildFileListItemHtml,
  buildFileListItemViewModels,
  type WebDAVFile,
} from './fileListModel';
import {
  buildCloudPreviewStatItems,
  buildCloudPreviewStats,
  buildExtraStatItemHtml,
  type CloudPreviewStatItem,
} from './previewStatsModel';
import {
  buildCloudPreviewEnterState,
  buildCloudPreviewLoadingState,
  buildFileListEnterState,
  buildFileListLoadingState,
  buildFileSelectionState,
} from './restoreModalStateModel';

export interface WebDAVRestoreFilePreviewControllerOptions {
  getRestoreModal: () => HTMLElement | null;
  queryInModal: <T extends HTMLElement = HTMLElement>(selector: string) => T | null;
  hideElement: (id: string) => void;
  showElement: (id: string) => void;
  showError: (message: string) => void;
  showMessage: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
  configureRestoreOptions: (cloudData: any) => void;
  startWizardRestore: () => void;
  ensureFooterInModal: () => void;
  setSelectedFile: (file: WebDAVFile | null) => void;
  getSelectedFile?: () => WebDAVFile | null;
  resetRestorePreviewContext: () => void;
  setCloudData: (data: any) => void;
  sendRuntimeMessage: (message: any, callback: (response: any) => void) => void;
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
  logWarn: (message: string, payload?: Record<string, unknown>) => void;
  logError: (message: string, payload?: Record<string, unknown>) => void;
}

export class WebDAVRestoreFilePreviewController {
  private selectedFile: WebDAVFile | null = null;

  constructor(private readonly options: WebDAVRestoreFilePreviewControllerOptions) {}

  fetchFileList(): void {
    this.options.logInfo('开始获取WebDAV文件列表');

    this.applyFileListLoadingState();

    this.options.sendRuntimeMessage({ type: 'webdav-list-files' }, (response) => {
      if (response?.success) {
        if (response.files && response.files.length > 0) {
          void this.displayFileList(response.files);
          this.options.logInfo('成功获取云端文件列表', { fileCount: response.files.length });
        } else {
          this.options.showError('在云端未找到任何备份文件');
          this.options.logWarn('云端没有任何备份文件');
        }
      } else {
        this.options.showError(response?.error || '获取文件列表失败');
        this.options.logError('从云端获取文件列表失败', { error: response?.error });
      }
    });
  }

  async displayFileList(files: WebDAVFile[]): Promise<void> {
    const fileList = this.applyFileListEnterState();
    if (!fileList) return;

    const fileItems = buildFileListItemViewModels(files);
    const sortedFiles = fileItems.map(item => item.file);

    this.options.logInfo('文件列表排序完成', {
      totalFiles: sortedFiles.length,
      latestFile: sortedFiles[0]?.name,
      latestDate: sortedFiles[0]?.lastModified,
    });

    this.updateBackupSummary(sortedFiles);
    this.buildDeviceFilter(sortedFiles);

    const pathMap = new Map<string, { file: WebDAVFile; el: HTMLElement }>();

    fileItems.forEach((item) => {
      const file = item.file;
      const li = document.createElement('li');
      li.className = item.className;
      li.dataset.filename = file.name;
      li.dataset.filepath = file.path;
      li.dataset.deviceId = file.uploaderClientId || 'unknown';
      li.innerHTML = buildFileListItemHtml(item);

      this.bindDownloadButton(li);

      li.addEventListener('click', () => this.selectFile(file, li));
      fileList.appendChild(li);
      pathMap.set(file.path, { file, el: li });
    });

    try { this.options.ensureFooterInModal(); } catch {}

    const first = sortedFiles[0];
    if (!first) return;

    const pair = pathMap.get(first.path);
    if (pair) {
      pair.el.classList.add('selected');
      this.setSelectedFile(pair.file);
    }
  }

  selectFile(file: WebDAVFile, element: HTMLElement): void {
    const previousSelected = (this.options.getRestoreModal() || document).querySelector('.webdav-file-item.selected');
    if (previousSelected) previousSelected.classList.remove('selected');

    element.classList.add('selected');
    this.setSelectedFile(file);
    this.options.resetRestorePreviewContext();
    this.applyFileSelectionState();

    try { this.options.ensureFooterInModal(); } catch {}

    this.options.logInfo('用户选择了文件', { filename: file.name });
    void this.loadCloudPreview();
  }

  async loadCloudPreview(): Promise<void> {
    const selectedFile = this.getSelectedFile();
    if (!selectedFile) return;

    this.applyCloudPreviewLoadingState();

    try {
      const resp = await new Promise<any>((resolve) => {
        this.options.sendRuntimeMessage({
          type: 'WEB_DAV:RESTORE_PREVIEW',
          filename: selectedFile.path,
        }, resolve);
      });

      if (!resp?.success) throw new Error(resp?.error || '预览失败');

      const cloudData = this.normalizeCloudData(resp.raw || resp.data || {});
      this.options.setCloudData(cloudData);

      this.renderCloudPreviewStats(buildCloudPreviewStatItems(buildCloudPreviewStats({
        cloudData,
        previewCounts: resp.preview?.counts || {},
      })));

      this.options.configureRestoreOptions(cloudData);
      this.applyCloudPreviewEnterState();
      this.cleanupLegacyImpactPreview();
      this.bindQuickRestoreButton();

      try { this.options.ensureFooterInModal(); } catch {}
    } catch (error: any) {
      this.options.hideElement('webdavRestoreLoading');
      this.options.showElement('webdavRestoreError');
      const msgEl = document.getElementById('webdavRestoreErrorMessage');
      if (msgEl) msgEl.textContent = error?.message || '预览失败';
      this.options.logError('读取云端备份统计失败', { error: error?.message });
    }
  }

  private bindDownloadButton(listItem: HTMLElement): void {
    const dlBtn = listItem.querySelector('.file-download-btn') as HTMLButtonElement | null;
    if (!dlBtn) return;

    dlBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const fp = dlBtn.dataset.filepath!;
      const fn = dlBtn.dataset.filename!;
      dlBtn.disabled = true;
      dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      this.options.sendRuntimeMessage({ type: 'webdav-download-file', filename: fp }, (resp) => {
        dlBtn.disabled = false;
        dlBtn.innerHTML = '<i class="fas fa-download"></i>';

        if (!resp?.success) {
          this.options.showMessage(`下载失败: ${resp?.error || '未知错误'}`, 'error');
          return;
        }

        this.downloadBackupBlob(resp.base64, fn);
        this.options.showMessage('备份下载成功', 'success');
      });
    });
  }

  private downloadBackupBlob(base64: string, filename: string): void {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const isZip = /\.zip$/i.test(filename);
    const mime = isZip ? 'application/zip' : 'application/json';
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private updateBackupSummary(files: WebDAVFile[]): void {
    try {
      const countEl = this.options.queryInModal<HTMLElement>('#webdavBackupCount');
      const rangeEl = this.options.queryInModal<HTMLElement>('#webdavBackupRange');

      if (countEl) countEl.textContent = String(files.length);
      if (rangeEl) rangeEl.textContent = buildBackupDateRangeLabel(files);
    } catch (error) {
      this.options.logWarn('日期范围计算失败', { error });
    }
  }

  private buildDeviceFilter(files: WebDAVFile[]): void {
    const filterSelect = this.options.queryInModal<HTMLSelectElement>('#webdavDeviceFilter');
    if (!filterSelect) return;

    // 收集所有设备
    const deviceMap = new Map<string, { label: string; count: number }>();

    files.forEach(file => {
      const deviceId = file.uploaderClientId || 'unknown';
      const deviceLabel = file.uploaderDeviceLabel || file.uploaderClientId || '未知设备';

      if (deviceMap.has(deviceId)) {
        deviceMap.get(deviceId)!.count++;
      } else {
        deviceMap.set(deviceId, { label: deviceLabel, count: 1 });
      }
    });

    // 清空并重建选项
    filterSelect.innerHTML = '<option value="all">所有设备</option>';

    // 按备份数量排序设备
    const sortedDevices = Array.from(deviceMap.entries()).sort((a, b) => b[1].count - a[1].count);

    sortedDevices.forEach(([deviceId, info]) => {
      const option = document.createElement('option');
      option.value = deviceId;
      option.textContent = `${info.label} (${info.count})`;
      filterSelect.appendChild(option);
    });

    // 绑定筛选事件
    filterSelect.addEventListener('change', () => {
      this.filterFilesByDevice(filterSelect.value);
    });

    this.options.logInfo('设备筛选器已构建', {
      deviceCount: deviceMap.size,
      devices: Array.from(deviceMap.entries()).map(([id, info]) => ({ id, ...info })),
    });
  }

  private filterFilesByDevice(deviceId: string): void {
    const fileList = this.options.queryInModal<HTMLElement>('#webdavFileList');
    if (!fileList) return;

    const allItems = fileList.querySelectorAll<HTMLElement>('.webdav-file-item');
    let visibleCount = 0;

    allItems.forEach(item => {
      const itemDeviceId = item.dataset.deviceId || 'unknown';

      if (deviceId === 'all' || itemDeviceId === deviceId) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    // 更新统计信息
    const countEl = this.options.queryInModal<HTMLElement>('#webdavBackupCount');
    if (countEl) {
      if (deviceId === 'all') {
        countEl.textContent = String(allItems.length);
      } else {
        countEl.textContent = `${visibleCount} / ${allItems.length}`;
      }
    }

    this.options.logInfo('已应用设备筛选', { deviceId, visibleCount, totalCount: allItems.length });
  }

  private applyFileListLoadingState(): void {
    const state = buildFileListLoadingState();
    state.hiddenElementIds.forEach(this.options.hideElement);
    state.shownElementIds.forEach(this.options.showElement);
  }

  private applyFileListEnterState(): HTMLElement | null {
    const state = buildFileListEnterState();
    const modal = this.options.getRestoreModal();

    state.hiddenElementIds.forEach(this.options.hideElement);
    state.shownElementIds.forEach(this.options.showElement);

    const restoreDescription = modal?.querySelector(state.shownContentSelector);
    const fileListContainer = modal?.querySelector(state.shownListSelector);
    if (restoreDescription) restoreDescription.classList.remove('hidden');
    if (fileListContainer) fileListContainer.classList.remove('hidden');

    state.clearedElementIds.forEach((id) => {
      const element = this.options.queryInModal<HTMLElement>('#' + id);
      if (element) element.innerHTML = '';
    });

    return this.options.queryInModal<HTMLElement>('#webdavFileList');
  }

  private applyFileSelectionState(): void {
    const state = buildFileSelectionState();
    state.hiddenElementIds.forEach(this.options.hideElement);
    state.disabledButtonIds.forEach((id) => {
      const button = this.options.queryInModal<HTMLButtonElement>('#' + id);
      if (button) button.disabled = true;
    });
    state.hiddenButtonIds.forEach((id) => this.options.queryInModal<HTMLElement>('#' + id)?.classList.add('hidden'));

    const confirmBtn = this.options.queryInModal<HTMLButtonElement>('#webdavRestoreConfirm');
    if (confirmBtn) {
      confirmBtn.innerHTML = state.confirmButtonHtml;
      confirmBtn.title = state.confirmButtonTitle;
    }
  }

  private renderCloudPreviewStats(items: CloudPreviewStatItem[]): void {
    const statsContainer = this.options.queryInModal<HTMLElement>('#restoreModeStats');

    items.forEach((item) => {
      const numberEl = this.options.queryInModal<HTMLElement>(`#${item.id}`);
      if (numberEl) {
        numberEl.textContent = item.value.toString();
        return;
      }

      if (!item.fixed && statsContainer) {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = buildExtraStatItemHtml(item);
        statsContainer.appendChild(statItem);
      }
    });
  }

  private applyCloudPreviewLoadingState(): void {
    const state = buildCloudPreviewLoadingState();
    const modal = this.options.getRestoreModal();
    state.modalClassNamesToRemove.forEach(className => modal?.classList.remove(className));

    const loading = document.getElementById('webdavRestoreLoading');
    const loadingText = loading?.querySelector('p');
    if (loadingText) loadingText.textContent = state.loadingText;

    state.hiddenElementIds.forEach(this.options.hideElement);
    state.shownElementIds.forEach(this.options.showElement);
  }

  private applyCloudPreviewEnterState(): void {
    const state = buildCloudPreviewEnterState();
    const modal = this.options.getRestoreModal();

    state.hiddenElementIds.forEach(this.options.hideElement);
    state.shownElementIds.forEach(this.options.showElement);

    const restoreDescription = modal?.querySelector(state.hiddenContentSelector);
    const fileListContainer = modal?.querySelector(state.hiddenListSelector);
    if (restoreDescription) restoreDescription.classList.add('hidden');
    if (fileListContainer) fileListContainer.classList.add('hidden');
    state.modalClassNamesToAdd.forEach(className => modal?.classList.add(className));

    state.enabledButtonIds.forEach((id) => {
      const button = this.options.queryInModal<HTMLButtonElement>('#' + id);
      if (button) button.disabled = false;
    });

    state.shownButtonIds.forEach((id) => this.options.queryInModal<HTMLElement>('#' + id)?.classList.remove('hidden'));

    const confirmBtn = this.options.queryInModal<HTMLButtonElement>('#webdavRestoreConfirm');
    if (confirmBtn) {
      confirmBtn.innerHTML = state.confirmButtonHtml;
      confirmBtn.title = state.confirmButtonTitle;
    }
  }

  private normalizeCloudData(cloudData: any): any {
    let normalized = cloudData;
    const version = detectBackupVersion(normalized);

    if (version === 'v1') {
      this.options.logInfo('WebDAV恢复：检测到旧版本备份，正在自动迁移');
      this.options.showMessage('检测到旧版本备份数据，正在自动迁移...', 'info');
      normalized = migrateBackupData(normalized, { logger: this.logMigrationMessage });
      this.options.showMessage('✓ 旧版本数据迁移成功', 'success');
    } else if (version === 'unknown') {
      this.options.logWarn('WebDAV恢复：无法识别备份版本，尝试原样处理');
      this.options.showMessage('⚠️ 备份数据格式未知，将尝试兼容处理', 'warn');
    }

    return normalized;
  }

  private logMigrationMessage = (
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    data?: any,
  ): void => {
    if (level === 'INFO') this.options.logInfo(message, data);
    else if (level === 'WARN') this.options.logWarn(message, data);
    else this.options.logError(message, data);
  };

  private cleanupLegacyImpactPreview(): void {
    try {
      const modal = this.options.getRestoreModal();
      (modal || document).querySelector('#impactSummary')?.remove();
      (modal || document).querySelector('.impact-preview')?.remove();
    } catch {}
  }

  private bindQuickRestoreButton(): void {
    const quickRestoreBtn = this.options.queryInModal<HTMLElement>('#quickRestoreBtn');
    if (quickRestoreBtn) quickRestoreBtn.onclick = () => this.options.startWizardRestore();
  }

  private setSelectedFile(file: WebDAVFile | null): void {
    this.selectedFile = file;
    this.options.setSelectedFile(file);
  }

  private getSelectedFile(): WebDAVFile | null {
    return this.options.getSelectedFile?.() ?? this.selectedFile;
  }
}

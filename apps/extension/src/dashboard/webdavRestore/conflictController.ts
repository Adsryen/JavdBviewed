import { buildConflictVersionContentHtml, getResolutionText, type ConflictDetailType } from './conflictDetailModel';
import {
  buildConflictDisplayState,
  buildConflictModalHideState,
  buildConflictModalShowState,
  type ConflictModalVisibilityState,
} from './conflictDisplayModel';
import {
  applyBatchConflictResolution,
  buildConflictNavigationState,
  buildConflictProgressStyle,
  calculateConflictProgressPercent,
  type ConflictResolution,
} from './conflictNavigationModel';

export interface WebDAVRestoreConflictControllerOptions {
  showMessage: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
  logDebug?: (message: string, payload?: Record<string, unknown>) => void;
}

export class WebDAVRestoreConflictController {
  private currentConflicts: any[] = [];
  private currentConflictIndex = 0;
  private conflictResolutions: Record<string, ConflictResolution> = {};
  private currentConflictType: ConflictDetailType = 'video';

  constructor(private readonly options: WebDAVRestoreConflictControllerOptions) {}

  show(type: ConflictDetailType, conflicts: any[]): void {
    this.currentConflicts = conflicts;
    this.currentConflictIndex = 0;
    this.conflictResolutions = {};
    this.currentConflictType = type;

    this.applyConflictModalVisibility(buildConflictModalShowState());
    this.updateElement('totalConflictsCount', conflicts.length.toString());
    this.displayCurrentConflict();
    this.updateConflictProgress();
    this.bindConflictNavigationEvents();
  }

  hide(): void {
    this.applyConflictModalVisibility(buildConflictModalHideState());
  }

  getResolutions(): Record<string, ConflictResolution> {
    return { ...this.conflictResolutions };
  }

  private displayCurrentConflict(): void {
    const displayState = buildConflictDisplayState({
      conflicts: this.currentConflicts,
      currentIndex: this.currentConflictIndex,
      conflictType: this.currentConflictType,
      resolutions: this.conflictResolutions,
    });
    if (!displayState) return;

    this.updateElement('currentConflictIndex', displayState.currentIndexText);
    this.updateConflictProgress();

    this.updateElement('conflictItemTitle', displayState.title);
    this.updateElement('conflictItemType', displayState.typeLabel);

    if (displayState.localTime) this.updateElement('localVersionTime', displayState.localTime);
    if (displayState.cloudTime) this.updateElement('cloudVersionTime', displayState.cloudTime);

    this.displayVersionContent('localVersionContent', displayState.conflict.local, this.currentConflictType);
    this.displayVersionContent('cloudVersionContent', displayState.conflict.cloud, this.currentConflictType);

    const resolutionInput = document.querySelector(`input[name="currentResolution"][value="${displayState.selectedResolution}"]`) as HTMLInputElement;
    if (resolutionInput) {
      resolutionInput.checked = true;
    }

    this.updateNavigationButtons();
  }

  private displayVersionContent(containerId: string, data: any, type: ConflictDetailType): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = buildConflictVersionContentHtml(data, type);
  }

  private bindConflictNavigationEvents(): void {
    const prevBtn = document.getElementById('prevConflict');
    const nextBtn = document.getElementById('nextConflict');
    const confirmBtn = document.getElementById('conflictResolutionConfirm');
    const cancelBtn = document.getElementById('conflictResolutionCancel');
    const closeBtn = document.getElementById('conflictResolutionModalClose');

    if (prevBtn) {
      prevBtn.onclick = () => {
        this.saveCurrentResolution();
        if (this.currentConflictIndex > 0) {
          this.currentConflictIndex--;
          this.displayCurrentConflict();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        this.saveCurrentResolution();
        if (this.currentConflictIndex < this.currentConflicts.length - 1) {
          this.currentConflictIndex++;
          this.displayCurrentConflict();
        }
      };
    }

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        this.saveCurrentResolution();
        this.hide();
      };
    }

    if (cancelBtn || closeBtn) {
      const closeHandler = () => {
        this.conflictResolutions = {};
        this.hide();
      };
      if (cancelBtn) cancelBtn.onclick = closeHandler;
      if (closeBtn) closeBtn.onclick = closeHandler;
    }

    this.bindBatchOperations();
  }

  private saveCurrentResolution(): void {
    const conflict = this.currentConflicts[this.currentConflictIndex];
    const selectedResolution = document.querySelector('input[name="currentResolution"]:checked') as HTMLInputElement;

    if (selectedResolution && conflict) {
      this.conflictResolutions[conflict.id] = selectedResolution.value as ConflictResolution;
    }
  }

  private updateConflictProgress(): void {
    const progressFill = document.getElementById('conflictProgressFill');
    if (progressFill && this.currentConflicts.length > 0) {
      const progress = calculateConflictProgressPercent(this.currentConflictIndex, this.currentConflicts.length);
      const progressStyle = buildConflictProgressStyle(this.currentConflictIndex, this.currentConflicts.length);

      Object.entries(progressStyle).forEach(([property, value]) => {
        progressFill.style.setProperty(property, value, 'important');
      });

      this.options.logDebug?.('更新冲突进度条', {
        currentIndex: this.currentConflictIndex,
        totalConflicts: this.currentConflicts.length,
        progress,
        progressWidth: progressFill.style.width,
        computedWidth: getComputedStyle(progressFill).width,
      });
      return;
    }

    this.options.logDebug?.('进度条更新失败', {
      progressFillExists: Boolean(progressFill),
      conflictsLength: this.currentConflicts.length,
      currentIndex: this.currentConflictIndex,
    });
  }

  private updateNavigationButtons(): void {
    const prevBtn = document.getElementById('prevConflict') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextConflict') as HTMLButtonElement;
    const navigationState = buildConflictNavigationState(this.currentConflictIndex, this.currentConflicts.length);

    if (prevBtn) {
      prevBtn.disabled = navigationState.previousDisabled;
    }

    if (nextBtn) {
      nextBtn.disabled = navigationState.nextDisabled;
    }
  }

  private bindBatchOperations(): void {
    const batchLocalBtn = document.getElementById('batchSelectLocal');
    const batchCloudBtn = document.getElementById('batchSelectCloud');
    const batchMergeBtn = document.getElementById('batchSelectMerge');

    if (batchLocalBtn) {
      batchLocalBtn.onclick = () => this.setBatchResolution('local');
    }

    if (batchCloudBtn) {
      batchCloudBtn.onclick = () => this.setBatchResolution('cloud');
    }

    if (batchMergeBtn) {
      batchMergeBtn.onclick = () => this.setBatchResolution('merge');
    }
  }

  private setBatchResolution(resolution: ConflictResolution): void {
    this.saveCurrentResolution();

    this.conflictResolutions = applyBatchConflictResolution({
      conflicts: this.currentConflicts,
      existingResolutions: this.conflictResolutions,
      resolution,
    });

    const resolutionInput = document.querySelector(`input[name="currentResolution"][value="${resolution}"]`) as HTMLInputElement;
    if (resolutionInput) {
      resolutionInput.checked = true;
    }

    this.options.showMessage(`已为所有 ${this.currentConflicts.length} 个冲突设置为"${getResolutionText(resolution)}"`, 'success');
  }

  private applyConflictModalVisibility(state: ConflictModalVisibilityState): void {
    const modal = document.getElementById(state.modalId);
    if (modal) {
      state.classNamesToRemove.forEach(className => modal.classList.remove(className));
      state.classNamesToAdd.forEach(className => modal.classList.add(className));
    }
  }

  private updateElement(id: string, text: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }
}

import type { DataDiffResult, MergeOptions } from '../../features/webdavSync/application/dataDiff';
import {
  buildQuickRestoreConfirmHtml,
  buildQuickRestoreMergeOptions,
  buildQuickRestoreModalStats,
} from './quickRestoreModel';
import { buildRestoreConfirmationHtml } from './restoreConfirmationModel';
import {
  buildRestoreInterfaceCleanupState,
  buildRestoreModeSwitchState,
  type RestoreMode,
} from './restoreModeUiModel';
import { buildRestoreModeStatItems } from './restoreModeStatsModel';
import {
  buildWizardNavigationState,
  buildWizardStepClassNames,
  canProceedFromWizardStep,
} from './restoreWizardStateModel';
import { buildStrategyPreviewHtml } from './strategyPreviewModel';

interface RestoreWizardState {
  currentMode: RestoreMode;
  currentStep: number;
  strategy: string;
  selectedContent: string[];
  isAnalysisComplete: boolean;
}

export interface RestoreWizardContext {
  diffResult: DataDiffResult | null;
  cloudData: any;
  localData: any;
}

export interface SmartRestoreModalOptions {
  onConfirm: () => void;
  onCancel?: () => void;
  localRecordsCount: number;
  localActorsCount: number;
  cloudNewDataCount: number;
  conflictsCount: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type?: 'warning' | 'danger' | 'info';
  isHtml: boolean;
}

export interface WebDAVRestoreWizardControllerOptions {
  getRestoreModal: () => HTMLElement | null;
  queryInModal: <T extends HTMLElement = HTMLElement>(selector: string) => T | null;
  updateElement: (id: string, text: string) => void;
  showElement: (id: string) => void;
  configureRestoreOptions: (cloudData: any) => void;
  executeRestore: (mergeOptions: MergeOptions) => void | Promise<void>;
  showMessage: (message: string, type: 'success' | 'error' | 'warn' | 'info') => void;
  showSmartRestoreModal: (options: SmartRestoreModalOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
  getRestoreContext: () => RestoreWizardContext;
  defaultStrategy: string;
}

export class WebDAVRestoreWizardController {
  private state: RestoreWizardState;

  constructor(private readonly options: WebDAVRestoreWizardControllerOptions) {
    this.state = this.createInitialState();
  }

  initializeRestoreInterface(diffResult: DataDiffResult, cloudData: any): void {
    this.options.logInfo('初始化覆盖式恢复界面');
    this.state.isAnalysisComplete = true;

    this.initializeRestoreMode(diffResult);
    this.options.configureRestoreOptions(cloudData);
    this.options.showElement('webdavDataPreview');
    this.cleanupLegacyExpertPreview();
  }

  initializeRestoreMode(diffResult: DataDiffResult): void {
    this.options.logInfo('初始化统一恢复模式');
    this.renderRestoreModeStats(diffResult);

    const restoreBtn = document.getElementById('quickRestoreBtn');
    if (restoreBtn) {
      restoreBtn.onclick = () => {
        void this.startQuickRestore();
      };
    }
  }

  switchMode(newMode: RestoreMode): void {
    this.options.logInfo('切换恢复模式', {
      from: this.state.currentMode,
      to: newMode,
    });

    this.state.currentMode = newMode;
    const switchState = buildRestoreModeSwitchState(newMode);

    document.querySelectorAll(switchState.tabSelector).forEach((tab) => {
      tab.classList.remove(switchState.activeClassName);
      if (tab.getAttribute(switchState.tabModeAttribute) === switchState.mode) {
        tab.classList.add(switchState.activeClassName);
      }
    });

    document.querySelectorAll(switchState.contentSelector).forEach((content) => {
      content.classList.remove(switchState.activeClassName);
    });

    document.getElementById(switchState.targetContentId)?.classList.add(switchState.activeClassName);

    const context = this.options.getRestoreContext();
    if (this.state.isAnalysisComplete && context.diffResult) {
      if (newMode === 'quick') this.initializeQuickMode(context.diffResult);
      if (newMode === 'wizard') this.initializeWizardMode(context.diffResult);
    }
  }

  initializeQuickMode(diffResult: DataDiffResult): void {
    this.options.logInfo('初始化快捷模式');
    this.renderRestoreModeStats(diffResult);

    const quickRestoreBtn = this.options.queryInModal<HTMLElement>('#quickRestoreBtn');
    if (quickRestoreBtn) {
      quickRestoreBtn.onclick = () => {
        void this.startQuickRestore();
      };
    }
  }

  initializeWizardMode(diffResult: DataDiffResult): void {
    this.options.logInfo('初始化向导模式');

    this.state.currentStep = 1;
    this.state.strategy = this.options.defaultStrategy;
    this.state.selectedContent = [];

    this.updateWizardSteps();
    this.initializeStrategySelection(diffResult);
    this.bindWizardNavigation();
  }

  async startQuickRestore(): Promise<void> {
    this.options.logInfo('开始快捷恢复');

    const context = this.options.getRestoreContext();
    if (!context.diffResult || !context.cloudData || !context.localData) {
      this.options.showMessage('请先完成数据分析和预览，这是必经步骤', 'warn');
      return;
    }

    if (!context.diffResult.videoRecords || !context.diffResult.actorRecords) {
      this.options.showMessage('预览数据不完整，请重新分析', 'error');
      return;
    }

    try {
      this.options.showSmartRestoreModal({
        ...buildQuickRestoreModalStats(context.diffResult),
        onConfirm: () => {
          this.options.logInfo('用户确认执行快捷恢复');
          void this.options.executeRestore(buildQuickRestoreMergeOptions());
        },
        onCancel: () => {
          this.options.logInfo('用户取消快捷恢复');
        },
      });
    } catch {
      const confirmed = await this.options.showConfirm({
        title: '确认一键智能恢复',
        message: buildQuickRestoreConfirmHtml(context.diffResult),
        confirmText: '开始恢复',
        cancelText: '取消',
        type: 'warning',
        isHtml: true,
      });

      if (confirmed) {
        this.options.logInfo('用户确认执行快捷恢复');
        void this.options.executeRestore(buildQuickRestoreMergeOptions());
      } else {
        this.options.logInfo('用户取消快捷恢复');
      }
    }
  }

  startWizardRestore(): void {
    this.options.logInfo('开始向导恢复', {
      strategy: this.state.strategy,
      selectedContent: this.state.selectedContent,
    });

    void this.options.executeRestore({
      strategy: this.state.strategy as any,
      restoreSettings: this.readCheckboxValue('webdavRestoreSettings', true),
      restoreRecords: this.readCheckboxValue('webdavRestoreRecords', true),
      restoreUserProfile: this.readCheckboxValue('webdavRestoreUserProfile', true),
      restoreActorRecords: this.readCheckboxValue('webdavRestoreActorRecords', true),
      restoreLogs: this.readCheckboxValue('webdavRestoreLogs', false),
      restoreMagnetPushLogs: this.readCheckboxValue('webdavRestoreMagnetPushLogs', false),
      restoreImportStats: this.readCheckboxValue('webdavRestoreImportStats', false),
      restoreNewWorks: this.readCheckboxValue('webdavRestoreNewWorks', false),
    });
  }

  private createInitialState(): RestoreWizardState {
    return {
      currentMode: 'quick',
      currentStep: 1,
      strategy: this.options.defaultStrategy,
      selectedContent: [],
      isAnalysisComplete: false,
    };
  }

  private renderRestoreModeStats(diffResult: DataDiffResult): void {
    buildRestoreModeStatItems(diffResult).forEach((item) => {
      this.options.updateElement(item.id, item.value.toString());
    });
  }

  private cleanupLegacyExpertPreview(): void {
    try {
      const cleanupState = buildRestoreInterfaceCleanupState();
      cleanupState.elementIdsToRemove.forEach((id) => document.getElementById(id)?.remove());
      const modal = this.options.getRestoreModal();
      cleanupState.selectorsToRemove.forEach((selector) => {
        (modal || document).querySelector(selector)?.remove();
      });
    } catch {}
  }

  private updateWizardSteps(): void {
    const modal = this.options.getRestoreModal();
    const steps = modal?.querySelectorAll('.step') || [];
    const stepClassNames = buildWizardStepClassNames(this.state.currentStep, steps.length);

    steps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
      const className = stepClassNames[index];
      if (className) step.classList.add(className);
    });

    (modal || document).querySelectorAll('.wizard-step-content').forEach((content, index) => {
      content.classList.remove('active');
      if (index + 1 === this.state.currentStep) {
        content.classList.add('active');
      }
    });
  }

  private initializeStrategySelection(diffResult: DataDiffResult): void {
    const modal = this.options.getRestoreModal();
    const strategyRadios = (modal || document).querySelectorAll('input[name="wizardStrategy"]');

    strategyRadios.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
          this.state.strategy = target.value;
          this.updateStrategyPreview(target.value, diffResult);
        }
      });
    });

    this.updateStrategyPreview(this.state.strategy, diffResult);
  }

  private updateStrategyPreview(strategy: string, diffResult: DataDiffResult): void {
    const previewContent = this.options.queryInModal<HTMLElement>('#previewContent');
    if (!previewContent) return;

    previewContent.innerHTML = buildStrategyPreviewHtml(strategy, diffResult);
  }

  private bindWizardNavigation(): void {
    const prevBtn = this.options.queryInModal<HTMLElement>('#wizardPrevBtn');
    const nextBtn = this.options.queryInModal<HTMLElement>('#wizardNextBtn');
    const startBtn = this.options.queryInModal<HTMLElement>('#wizardStartBtn');

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.state.currentStep > 1) {
          this.state.currentStep--;
          this.updateWizardSteps();
          this.updateWizardNavigation();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.validateCurrentStep() && this.state.currentStep < 3) {
          this.state.currentStep++;
          this.updateWizardSteps();
          this.updateWizardNavigation();
          this.initializeCurrentStep();
        }
      };
    }

    if (startBtn) {
      startBtn.onclick = () => {
        this.startWizardRestore();
      };
    }

    this.updateWizardNavigation();
  }

  private updateWizardNavigation(): void {
    const prevBtn = this.options.queryInModal<HTMLButtonElement>('#wizardPrevBtn');
    const nextBtn = this.options.queryInModal<HTMLButtonElement>('#wizardNextBtn');
    const startBtn = this.options.queryInModal<HTMLButtonElement>('#wizardStartBtn');
    const navigationState = buildWizardNavigationState(this.state.currentStep, 3);

    if (prevBtn) {
      prevBtn.disabled = navigationState.previousDisabled;
    }

    if (nextBtn && startBtn) {
      nextBtn.classList.toggle('hidden', navigationState.nextHidden);
      startBtn.classList.toggle('hidden', navigationState.startHidden);
    }
  }

  private validateCurrentStep(): boolean {
    return canProceedFromWizardStep({
      currentStep: this.state.currentStep,
      strategy: this.state.strategy,
      selectedContentCount: this.state.selectedContent.length,
    });
  }

  private initializeCurrentStep(): void {
    if (this.state.currentStep === 2) this.initializeContentSelection();
    if (this.state.currentStep === 3) this.initializeConfirmation();
  }

  private initializeContentSelection(): void {
    const context = this.options.getRestoreContext();
    if (!context.cloudData) return;

    const grid = this.options.queryInModal<HTMLElement>('#contentSelectionGrid');
    if (!grid) return;

    this.options.configureRestoreOptions(context.cloudData);

    const existingOptions = this.options.queryInModal<HTMLElement>('.restore-options-grid');
    if (!existingOptions) return;

    grid.innerHTML = existingOptions.innerHTML;

    grid.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => this.updateSelectedContent());
    });

    this.updateSelectedContent();
  }

  private updateSelectedContent(): void {
    const modal = this.options.getRestoreModal();
    const checkboxes = (modal || document).querySelectorAll('#contentSelectionGrid input[type="checkbox"]:checked');
    this.state.selectedContent = Array.from(checkboxes).map((checkbox) => (checkbox as HTMLInputElement).id);
  }

  private initializeConfirmation(): void {
    const summaryContainer = this.options.queryInModal<HTMLElement>('#confirmationSummary');
    const context = this.options.getRestoreContext();
    if (!summaryContainer || !context.diffResult) return;

    const contentLabels = Object.fromEntries(
      this.state.selectedContent.map((id) => {
        const element = this.options.queryInModal<HTMLElement>('#' + id) || document.getElementById(id);
        const label = element?.closest('.form-group-checkbox')?.querySelector('label')?.textContent || id;
        return [id, label];
      }),
    );

    summaryContainer.innerHTML = buildRestoreConfirmationHtml({
      strategy: this.state.strategy,
      selectedContent: this.state.selectedContent,
      contentLabels,
      diffSummary: {
        videoCount: context.diffResult.videoRecords.summary.totalLocal,
        actorCount: context.diffResult.actorRecords.summary.totalLocal,
        subscriptionCount: context.diffResult.newWorks.subscriptions.summary.totalLocal,
        recordCount: context.diffResult.newWorks.records.summary.totalLocal,
      },
    });
  }

  private readCheckboxValue(id: string, fallback: boolean): boolean {
    const checkbox = document.getElementById(id) as HTMLInputElement | null;
    return checkbox ? Boolean(checkbox.checked) : fallback;
  }
}

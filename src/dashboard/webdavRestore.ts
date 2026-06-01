// src/dashboard/webdavRestore.ts

import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import { showSmartRestoreModal } from './ui/modal';
import { detectBackupVersion, migrateBackupData } from '../features/webdavSync/application/backupMigration';
import { analyzeDataDifferences, type DataDiffResult, type MergeOptions } from '../features/webdavSync/application/dataDiff';
import { mergeData, type MergeResult } from '../features/webdavSync/application/dataMerge';
import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, RESTORE_CONFIG } from '../utils/config';
import { requireAuthIfRestricted } from '../features/privacy';
import { dbMagnetPushLogsBulkAdd, dbMagnetPushLogsClear } from './dbClient';
import { showConfirm } from './components/confirmModal';
import {
    buildBackupDateRangeLabel,
    buildFileListItemHtml,
    buildFileListItemViewModels,
    type WebDAVFile,
} from './webdavRestore/fileListModel';
import {
    buildRestoreOptionViewModels,
    summarizeRestoreOptionViewModels,
    type RestoreOptionViewModel,
} from './webdavRestore/restoreOptionsModel';
import {
    buildConflictVersionFieldsHtml,
    buildConflictVersionFields,
    getConflictTypeLabel,
    getResolutionText,
    type ConflictDetailType,
} from './webdavRestore/conflictDetailModel';
import { buildConflictDisplayState } from './webdavRestore/conflictDisplayModel';
import {
    buildRestoreResultsEnterUiState,
    buildRestoreResultsLeaveUiState,
    buildRestoreResultItems,
    buildRestoreResultsHtml,
} from './webdavRestore/restoreResultsModel';
import { buildStrategyPreviewHtml } from './webdavRestore/strategyPreviewModel';
import {
    buildOperationSummaryItems,
    type OperationSummaryItemViewModel,
} from './webdavRestore/operationSummaryModel';
import {
    buildCloudPreviewStatItems,
    buildCloudPreviewStats,
    buildExtraStatItemHtml,
} from './webdavRestore/previewStatsModel';
import {
    buildQuickRestoreConfirmHtml,
    buildQuickRestoreMergeOptions,
    buildQuickRestoreModalStats,
} from './webdavRestore/quickRestoreModel';
import {
    buildSettingsDifferenceModalHtml,
    getSettingsDifferenceOverlayStyle,
    SETTINGS_DIFFERENCE_MODAL_CLASS,
} from './webdavRestore/settingsDifferenceModel';
import {
    buildRestoreProgressHtml,
    formatElapsedTime,
} from './webdavRestore/restoreProgressModel';
import {
    buildAnalysisLoadingEnterState,
    buildAnalysisLoadingLeaveState,
    buildRestoreModalResetState,
} from './webdavRestore/restoreModalStateModel';
import { buildRestoreModeStatItems } from './webdavRestore/restoreModeStatsModel';
import { buildRestoreConfirmationHtml } from './webdavRestore/restoreConfirmationModel';
import {
    buildRestoreBackupData,
    buildRestoreBackupDownloadName,
    buildRestoreBackupKey,
    findLatestRestoreBackupKey,
    formatRestoreBackupTimestamp,
    selectOldRestoreBackupKeys,
} from './webdavRestore/restoreBackupModel';
import {
    buildRestoreCategorySelection,
    buildRestoreExecuteConfirmHtml,
} from './webdavRestore/restoreExecuteConfirmModel';
import {
    validateActorRecords,
    validateSettings,
    validateVideoRecords,
} from './webdavRestore/restoreValidationModel';
import {
    buildMergeStorageWritePlans,
    buildRollbackStorageWritePlans,
    buildRestoreStorageKeys,
} from './webdavRestore/restoreApplyPlanModel';
import {
    buildWizardNavigationState,
    buildWizardStepClassNames,
    canProceedFromWizardStep,
} from './webdavRestore/restoreWizardStateModel';
import {
    applyBatchConflictResolution,
    buildConflictNavigationState,
    buildConflictProgressStyle,
    calculateConflictProgressPercent,
    type ConflictResolution,
} from './webdavRestore/conflictNavigationModel';

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

    const ids = ['webdavRestoreBack', 'webdavRestoreCancel'];
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
    
    // 添加到footer
    modalFooter.appendChild(backBtn);
    modalFooter.appendChild(cancelBtn);
}

let currentCloudData: any = null;
let currentLocalData: any = null;
let currentDiffResult: DataDiffResult | null = null;
let currentConflicts: any[] = [];
let currentConflictIndex = 0;
let conflictResolutions: Record<string, ConflictResolution> = {};

// 当前冲突类型（用于渲染与显示文案）
let currentConflictType: ConflictDetailType = 'video';

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

// 更新“云端备份数量 & 范围”摘要
function updateBackupSummary(files: WebDAVFile[]): void {
    try {
        const countEl = mq<HTMLElement>('#webdavBackupCount');
        const rangeEl = mq<HTMLElement>('#webdavBackupRange');

        if (countEl) countEl.textContent = String(files.length);
        if (rangeEl) rangeEl.textContent = buildBackupDateRangeLabel(files);
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

    renderRestoreModeStats(diffResult);

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
                break;
        }
    }
}

/**
 * 初始化快捷模式
 */
function initializeQuickMode(diffResult: DataDiffResult): void {
    logAsync('INFO', '初始化快捷模式');

    renderRestoreModeStats(diffResult);

    // 绑定快捷恢复按钮
    const quickRestoreBtn = mq<HTMLElement>('#quickRestoreBtn');
    if (quickRestoreBtn) {
        quickRestoreBtn.onclick = () => {
            startQuickRestore();
        };
    }
}

function renderRestoreModeStats(diffResult: DataDiffResult): void {
    buildRestoreModeStatItems(diffResult).forEach(item => {
        updateElement(item.id, item.value.toString());
    });
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

    // 显示智能恢复确认弹窗
    try {
        showSmartRestoreModal({
            ...buildQuickRestoreModalStats(currentDiffResult),
            onConfirm: () => {
                // 用户确认后执行恢复
                logAsync('INFO', '用户确认执行快捷恢复');

                // 执行恢复
                executeRestore(buildQuickRestoreMergeOptions());
            },
            onCancel: () => {
                logAsync('INFO', '用户取消快捷恢复');
            }
        });
    } catch (error) {
        console.error('Failed to load smart restore modal:', error);
        // 降级到原来的confirm方式
        const confirmed = await showConfirm({
            title: '确认一键智能恢复',
            message: buildQuickRestoreConfirmHtml(currentDiffResult),
            confirmText: '开始恢复',
            cancelText: '取消',
            type: 'warning',
            isHtml: true
        });

        if (confirmed) {
            // 用户确认后执行恢复
            logAsync('INFO', '用户确认执行快捷恢复');

            // 执行恢复
            executeRestore(buildQuickRestoreMergeOptions());
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
    const stepClassNames = buildWizardStepClassNames(wizardState.currentStep, steps.length);

    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        const className = stepClassNames[index];
        if (className) step.classList.add(className);
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

    previewContent.innerHTML = buildStrategyPreviewHtml(strategy, diffResult);
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
    const navigationState = buildWizardNavigationState(wizardState.currentStep, 3);

    if (prevBtn) {
        prevBtn.disabled = navigationState.previousDisabled;
    }

    if (nextBtn && startBtn) {
        if (navigationState.nextHidden) {
            nextBtn.classList.add('hidden');
        } else {
            nextBtn.classList.remove('hidden');
        }

        if (navigationState.startHidden) {
            startBtn.classList.add('hidden');
        } else {
            startBtn.classList.remove('hidden');
        }
    }
}

/**
 * 验证当前步骤
 */
function validateCurrentStep(): boolean {
    return canProceedFromWizardStep({
        currentStep: wizardState.currentStep,
        strategy: wizardState.strategy,
        selectedContentCount: wizardState.selectedContent.length,
    });
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

    const contentLabels = Object.fromEntries(
        wizardState.selectedContent.map(id => {
            const element = mq<HTMLElement>('#' + id) || document.getElementById(id);
            const label = element?.closest('.form-group-checkbox')?.querySelector('label')?.textContent || id;
            return [id, label];
        })
    );

    summaryContainer.innerHTML = buildRestoreConfirmationHtml({
        strategy: wizardState.strategy,
        selectedContent: wizardState.selectedContent,
        contentLabels,
        diffSummary: {
            videoCount: currentDiffResult.videoRecords.summary.totalLocal,
            actorCount: currentDiffResult.actorRecords.summary.totalLocal,
            subscriptionCount: currentDiffResult.newWorks.subscriptions.summary.totalLocal,
            recordCount: currentDiffResult.newWorks.records.summary.totalLocal,
        },
    });
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
    const restoreMagnetPushLogs = (document.getElementById('webdavRestoreMagnetPushLogs') as HTMLInputElement)?.checked ?? false;
    const restoreImportStats = (document.getElementById('webdavRestoreImportStats') as HTMLInputElement)?.checked ?? false;
    const restoreNewWorks = (document.getElementById('webdavRestoreNewWorks') as HTMLInputElement)?.checked ?? false;

    const mergeOptions: MergeOptions = {
        strategy: wizardState.strategy as any,
        restoreSettings,
        restoreRecords,
        restoreUserProfile,
        restoreActorRecords,
        restoreLogs,
        restoreMagnetPushLogs,
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

        const categories = buildRestoreCategorySelection({
            mergeOptions,
            restoreMagnetPushLogs: readCheckboxValue(['webdavRestoreMagnetPushLogs', 'webdavRestoreMagnetPushLogsSimple'], false),
            restoreMagnets: readCheckboxValue(['webdavRestoreMagnets', 'webdavRestoreMagnetsSimple'], false),
        });

        // 读取自动备份开关状态
        const autoBackupBeforeRestore = readCheckboxValue(['webdavAutoBackupBeforeRestore'], true);

        const confirmed = await showConfirm({
            title: '⚠️ 确认覆盖式恢复',
            message: buildRestoreExecuteConfirmHtml({ categories, autoBackupBeforeRestore }),
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
    progressContainer.innerHTML = buildRestoreProgressHtml();

    modalBody.appendChild(progressContainer);

    // 开始计时
    const startTime = Date.now();
    const updateTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timerEl = document.getElementById('elapsedTime');
        if (timerEl) {
            timerEl.textContent = formatElapsedTime(elapsed);
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
    const enterUiState = buildRestoreResultsEnterUiState();
    enterUiState.hiddenElementIds.forEach(hideElement);

    // 创建结果界面
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'restoreResultsContainer';
    resultsContainer.className = 'restore-results-container';

    const resultItems = buildRestoreResultItems(summary, currentCloudData);
    resultsContainer.innerHTML = buildRestoreResultsHtml(resultItems);
    modalBody.appendChild(resultsContainer);

    // 隐藏默认底部按钮，只显示结果页自带的按钮
    const modalEl = getRestoreModal();
    const modalFooter = modalEl?.querySelector('.modal-footer') as HTMLElement | null;
    if (enterUiState.hideFooters) setModalFootersDisplay(modalEl, 'none');
    
    // 隐藏具体的按钮元素
    enterUiState.hiddenButtonIds.forEach((id) => hideRestoreResultButton(id));

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
            const leaveUiState = buildRestoreResultsLeaveUiState();
            leaveUiState.hiddenElementIds.forEach(hideElement);
            showElement('webdavRestoreLoading');
            const p = (modal?.querySelector('#webdavRestoreLoading p')) as HTMLElement | null;
            if (p) p.textContent = leaveUiState.loadingText;
            fetchFileList();

            restoreResultActionButtons(leaveUiState.restoreButtonIds, { disableConfirm: true, hideBack: true });

            // 恢复默认底部按钮可见
            if (leaveUiState.showFooters) setModalFootersDisplay(modal, '');
        };
    }
    if (resultsDoneBtn) {
        resultsDoneBtn.onclick = () => {
            // 关闭弹窗
            try { closeModal(); } catch {}
            // 恢复默认底部按钮可见（下次打开弹窗时可用）
            const leaveUiState = buildRestoreResultsLeaveUiState();
            if (leaveUiState.showFooters) setModalFootersDisplay(modalEl, '');
            restoreResultActionButtons(leaveUiState.restoreButtonIds, { hideConfirm: true });
        };
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
    const modal = getRestoreModal();
    const state = buildRestoreModalResetState();
    state.modalClassNamesToRemove.forEach(className => modal?.classList.remove(className));

    state.hiddenElementIds.forEach(hideElement);
    state.shownElementIds.forEach(showElement);

    state.disabledButtonIds.forEach(id => {
        const button = mq<HTMLButtonElement>('#' + id);
        if (button) button.disabled = true;
    });

    state.hiddenButtonIds.forEach(id => mq<HTMLElement>('#' + id)?.classList.add('hidden'));
    state.clearedElementIds.forEach(id => {
        const element = mq<HTMLElement>('#' + id);
        if (element) element.innerHTML = '';
    });
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
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.classList.add('hidden');
            }
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

    const fileItems = buildFileListItemViewModels(files);
    const sortedFiles = fileItems.map(item => item.file);

    logAsync('INFO', '文件列表排序完成', {
        totalFiles: sortedFiles.length,
        latestFile: sortedFiles[0]?.name,
        latestDate: sortedFiles[0]?.lastModified
    });

    // 更新摘要（数量与范围）
    updateBackupSummary(sortedFiles);

    // 建立 path 到元素与对象的映射，便于之后快速预选
    const pathMap = new Map<string, { file: WebDAVFile; el: HTMLElement }>();

    fileItems.forEach((item) => {
        const file = item.file;
        const li = document.createElement('li');
        li.className = item.className;
        li.dataset.filename = file.name;
        li.dataset.filepath = file.path;

        li.innerHTML = buildFileListItemHtml(item);

        // 下载按钮点击不触发选中
        const dlBtn = li.querySelector('.file-download-btn') as HTMLButtonElement;
        if (dlBtn) {
            dlBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fp = dlBtn.dataset.filepath!;
                const fn = dlBtn.dataset.filename!;
                dlBtn.disabled = true;
                dlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                chrome.runtime.sendMessage({ type: 'webdav-download-file', filename: fp }, (resp) => {
                    dlBtn.disabled = false;
                    dlBtn.innerHTML = '<i class="fas fa-download"></i>';
                    if (!resp?.success) {
                        showMessage(`下载失败: ${resp?.error || '未知错误'}`, 'error');
                        return;
                    }
                    // base64 → Blob → 下载
                    const binary = atob(resp.base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    const isZip = /\.zip$/i.test(fn);
                    const mime = isZip ? 'application/zip' : 'application/json';
                    const blob = new Blob([bytes], { type: mime });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fn;
                    a.click();
                    URL.revokeObjectURL(url);
                    showMessage('备份下载成功', 'success');
                });
            });
        }

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
      confirmBtn.classList.add('hidden');
      confirmBtn.innerHTML = '<i class="fas fa-download"></i> 开始覆盖式恢复';
      confirmBtn.title = '选择备份后即可恢复';
    }

  try { ensureFooterInModal(); } catch {}

  logAsync('INFO', '用户选择了文件', { filename: file.name });

  // 选择文件后，直接加载云端预览并填充统计
  void loadCloudPreview();
}

function renderCloudPreviewStats(items: ReturnType<typeof buildCloudPreviewStatItems>): void {
    const statsContainer = mq<HTMLElement>('#restoreModeStats');

    items.forEach(item => {
        const numberEl = mq<HTMLElement>(`#${item.id}`);
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

/**
 * 加载云端备份预览并填充统计（不做本地/差异分析）
 */
async function loadCloudPreview(): Promise<void> {
    if (!selectedFile) return;

    const modal = getRestoreModal();
    modal?.classList.remove('preview-active');

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
            cloudData = migrateBackupData(cloudData, { logger: logAsync });
            showMessage('✓ 旧版本数据迁移成功', 'success');
        } else if (version === 'unknown') {
            logAsync('WARN', 'WebDAV恢复：无法识别备份版本，尝试原样处理');
            showMessage('⚠️ 备份数据格式未知，将尝试兼容处理', 'warn');
        }
        
        currentCloudData = cloudData;

        renderCloudPreviewStats(buildCloudPreviewStatItems(buildCloudPreviewStats({
            cloudData: currentCloudData,
            previewCounts: resp.preview?.counts || {},
        })));

        // 配置可选恢复项
        configureRestoreOptions(currentCloudData);

        // 切换到统计视图
        hideElement('webdavRestoreLoading');
        const modal = getRestoreModal();
        const restoreDescription = modal?.querySelector('#webdavRestoreContent .restore-description');
        const fileListContainer = modal?.querySelector('#webdavRestoreContent .file-list-container');
        if (restoreDescription) restoreDescription.classList.add('hidden');
        if (fileListContainer) fileListContainer.classList.add('hidden');
        modal?.classList.add('preview-active');
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
            confirmBtn.classList.remove('hidden');
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

    const modal = getRestoreModal();
    modal?.classList.remove('preview-active');

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
        modal?.classList.add('preview-active');

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
            confirmBtn.classList.remove('hidden');
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
    const state = buildAnalysisLoadingEnterState();
    const loadingElement = document.getElementById('webdavRestoreLoading');
    const loadingText = loadingElement?.querySelector('p');

    if (loadingText) {
        loadingText.textContent = state.loadingText;
    }

    state.hiddenElementIds.forEach(hideElement);
    state.shownElementIds.forEach(showElement);
}

/**
 * 隐藏分析加载状态
 */
function hideAnalysisLoading(): void {
    const state = buildAnalysisLoadingLeaveState();
    state.hiddenElementIds.forEach(hideElement);
    state.shownElementIds.forEach(showElement);
}

/**
 * 自动检测并配置恢复内容选项
 */
function configureRestoreOptions(cloudData: any): void {
    const viewModels = buildRestoreOptionViewModels(cloudData);
    viewModels.forEach(renderRestoreOptionViewModel);
    const summary = summarizeRestoreOptionViewModels(viewModels);

    // 记录检测结果
    logAsync('INFO', '恢复内容选项自动配置完成', {
        availableOptions: summary.availableOptions,
        unavailableOptions: summary.unavailableOptions,
        cloudDataKeys: cloudData ? Object.keys(cloudData) : []
    });
}

/**
 * 渲染恢复选项状态
 */
function renderRestoreOptionViewModel(viewModel: RestoreOptionViewModel): void {
    const checkbox = document.getElementById(viewModel.id) as HTMLInputElement | null;
    const container = checkbox?.closest('.form-group-checkbox') as HTMLElement | null;

    if (!checkbox || !container) return;

    checkbox.disabled = viewModel.disabled;
    checkbox.checked = viewModel.checked;
    container.classList.remove('available', 'warning', 'disabled', 'unavailable');

    if (viewModel.state === 'available') {
        container.classList.add('available');
        updateOptionStats(container, viewModel.statsText);
        return;
    }

    if (viewModel.state === 'warning') {
        container.classList.add('warning');
        updateOptionMessage(container, 'warning-text', 'fa-exclamation-triangle', viewModel.message || '');
        return;
    }

    container.classList.add('disabled', 'unavailable');
    updateOptionMessage(container, 'unavailable-text', 'fa-times-circle', viewModel.message || '');
}

/**
 * 更新选项统计信息
 */
function updateOptionStats(container: HTMLElement, statsText?: string): void {
    const small = container.querySelector('small');
    if (!small) return;

    if (statsText) {
        const originalText = small.textContent || '';
        const baseText = originalText.split('(')[0].trim();
        small.innerHTML = `${baseText} <span class="stats-info">(${statsText})</span>`;
    }
}

/**
 * 更新选项状态信息
 */
function updateOptionMessage(container: HTMLElement, className: string, iconClass: string, message: string): void {
    const small = container.querySelector('small');
    if (small) {
        small.innerHTML = `<span class="${className}"><i class="fas ${iconClass}"></i> ${message}</span>`;
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
        const restoreMagnetPushLogs = (document.getElementById('webdavRestoreMagnetPushLogs') as HTMLInputElement)?.checked ?? false;
        const restoreImportStats = (document.getElementById('webdavRestoreImportStats') as HTMLInputElement)?.checked ?? false;

        if (!restoreSettings && !restoreRecords && !restoreUserProfile && !restoreActorRecords && !restoreLogs && !restoreMagnetPushLogs && !restoreImportStats) {
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
            restoreMagnetPushLogs,
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
            confirmBtn.classList.remove('hidden');
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
    const now = new Date();
    const timestamp = formatRestoreBackupTimestamp(now);
    const backupData = buildRestoreBackupData({
        data: currentLocalData,
        now,
        originalFile: selectedFile?.name,
    });

    await setValue(buildRestoreBackupKey(STORAGE_KEYS.RESTORE_BACKUP, timestamp), backupData);
    logAsync('INFO', '已创建恢复前备份', { timestamp });
}

/**
 * 应用合并结果到本地存储
 */
async function applyMergeResult(mergeResult: MergeResult, options: MergeOptions): Promise<void> {
    const writePlans = buildMergeStorageWritePlans(
        mergeResult.mergedData,
        options,
        buildRestoreStorageKeys(STORAGE_KEYS)
    );

    const promises = writePlans.map((plan) => {
        if (plan.kind === 'videoRecords') validateVideoRecords(plan.value);
        if (plan.kind === 'actorRecords') validateActorRecords(plan.value);
        if (plan.kind === 'settings') validateSettings(plan.value);

        return setValue(plan.key, plan.value);
    });

    await Promise.all(promises);

    // 应用后再次校验
    await verifyDataIntegrity(mergeResult, options);
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

    const html = buildOperationSummaryItems(summary).map(renderOperationSummaryItem).join('');
    summaryGrid.innerHTML = html;
}

function renderOperationSummaryItem(item: OperationSummaryItemViewModel): string {
    return `
        <div class="summary-item">
            <div class="summary-label">
                <i class="${item.iconClass}"></i>
                ${item.label}
            </div>
            <div class="summary-value">${item.value}</div>
        </div>
    `;
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
        const latestBackupKey = findLatestRestoreBackupKey(Object.keys(backupKeys), STORAGE_KEYS.RESTORE_BACKUP);

        if (!latestBackupKey) {
            showMessage('没有找到备份文件', 'warn');
            return;
        }

        const backupData = backupKeys[latestBackupKey] as any;

        // 创建下载
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = buildRestoreBackupDownloadName(new Date());
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
        const latestBackupKey = findLatestRestoreBackupKey(Object.keys(backupKeys), STORAGE_KEYS.RESTORE_BACKUP);

        if (!latestBackupKey) {
            throw new Error('没有找到可回滚的备份');
        }

        const backupData = backupKeys[latestBackupKey] as any;

        if (!backupData || !backupData.data) {
            throw new Error('备份数据格式错误');
        }

        logAsync('INFO', '开始回滚到恢复前状态', { backupKey: latestBackupKey });

        const writePlans = buildRollbackStorageWritePlans(
            backupData.data,
            buildRestoreStorageKeys(STORAGE_KEYS)
        );

        const promises = writePlans.map((plan) => setValue(plan.key, plan.value));

        if (backupData.data.magnetPushLogs) {
            promises.push(
                dbMagnetPushLogsClear().then(() => dbMagnetPushLogsBulkAdd(backupData.data.magnetPushLogs))
            );
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
        const keysToDelete = selectOldRestoreBackupKeys(
            Object.keys(backupKeys),
            STORAGE_KEYS.RESTORE_BACKUP,
            keepCount
        );

        if (keysToDelete.length === 0) {
            return; // 不需要清理
        }

        // 删除多余的旧备份
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

function setModalFootersDisplay(modal: Element | null | undefined, display: string): void {
    modal?.querySelectorAll('.modal-footer').forEach((footer) => {
        (footer as HTMLElement).style.display = display;
    });
}

function hideRestoreResultButton(id: string): void {
    const button = mq<HTMLButtonElement>('#' + id);
    if (!button) return;

    button.style.display = 'none';
    if (id === 'webdavRestoreConfirm') button.classList.add('hidden');
}

function restoreResultActionButtons(ids: string[], options: { disableConfirm?: boolean; hideBack?: boolean; hideConfirm?: boolean } = {}): void {
    ids.forEach((id) => {
        const button = mq<HTMLButtonElement>('#' + id);
        if (!button) return;

        button.style.display = '';
        if (id === 'webdavRestoreConfirm' && options.disableConfirm) button.disabled = true;
        if (id === 'webdavRestoreConfirm' && options.hideConfirm) button.classList.add('hidden');
        if (id === 'webdavRestoreBack' && options.hideBack) button.classList.add('hidden');
    });
}

function readCheckboxValue(ids: string[], fallback: boolean): boolean {
    const ctx = getRestoreModal() || document;

    for (const id of ids) {
        const checkbox = ctx.querySelector('#' + id) as HTMLInputElement | null;
        if (checkbox) return Boolean(checkbox.checked);
    }

    return fallback;
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
    const existingModal = document.querySelector(`.${SETTINGS_DIFFERENCE_MODAL_CLASS}`);
    if (existingModal) {
        existingModal.remove();
    }

    // 创建美观的设置差异弹窗
    const modal = document.createElement('div');
    modal.className = SETTINGS_DIFFERENCE_MODAL_CLASS;
    modal.style.cssText = getSettingsDifferenceOverlayStyle();
    modal.innerHTML = buildSettingsDifferenceModalHtml(settingsDiff);

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
function showConflictResolution(type: ConflictDetailType, conflicts: any[]): void {
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
    const displayState = buildConflictDisplayState({
        conflicts: currentConflicts,
        currentIndex: currentConflictIndex,
        conflictType: currentConflictType,
        resolutions: conflictResolutions,
    });
    if (!displayState) return;

    // 更新冲突索引和进度
    updateElement('currentConflictIndex', displayState.currentIndexText);
    updateConflictProgress();

    // 更新冲突标题和类型
    updateElement('conflictItemTitle', displayState.title);
    updateElement('conflictItemType', displayState.typeLabel);

    // 更新时间戳（若数据包含时间）
    if (displayState.localTime) updateElement('localVersionTime', displayState.localTime);
    if (displayState.cloudTime) updateElement('cloudVersionTime', displayState.cloudTime);

    // 更新版本内容（视频/演员/新作品订阅/新作品记录）
    displayVersionContent('localVersionContent', displayState.conflict.local, currentConflictType);
    displayVersionContent('cloudVersionContent', displayState.conflict.cloud, currentConflictType);

    // 设置默认选择
    const resolutionInput = document.querySelector(`input[name="currentResolution"][value="${displayState.selectedResolution}"]`) as HTMLInputElement;
    if (resolutionInput) {
        resolutionInput.checked = true;
    }

    // 更新导航按钮状态
    updateNavigationButtons();
}

/**
 * 显示版本内容（根据类型渲染）
 */
function displayVersionContent(containerId: string, data: any, type: ConflictDetailType): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = buildConflictVersionFieldsHtml(buildConflictVersionFields(data, type));
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
        conflictResolutions[conflict.id] = selectedResolution.value as ConflictResolution;
    }
}

/**
 * 更新冲突进度条
 */
function updateConflictProgress(): void {
    const progressFill = document.getElementById('conflictProgressFill');
    if (progressFill && currentConflicts.length > 0) {
        const progress = calculateConflictProgressPercent(currentConflictIndex, currentConflicts.length);
        const progressStyle = buildConflictProgressStyle(currentConflictIndex, currentConflicts.length);

        // 强制设置样式
        Object.entries(progressStyle).forEach(([property, value]) => {
            progressFill.style.setProperty(property, value, 'important');
        });

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
    const navigationState = buildConflictNavigationState(currentConflictIndex, currentConflicts.length);

    if (prevBtn) {
        prevBtn.disabled = navigationState.previousDisabled;
    }

    if (nextBtn) {
        nextBtn.disabled = navigationState.nextDisabled;
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
function setBatchResolution(resolution: ConflictResolution): void {
    // 保存当前冲突的选择
    saveCurrentResolution();

    // 为所有冲突设置相同的解决方案
    conflictResolutions = applyBatchConflictResolution({
        conflicts: currentConflicts,
        existingResolutions: conflictResolutions,
        resolution,
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

// 函数已在定义时导出

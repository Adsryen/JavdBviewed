// src/dashboard/webdavRestore.ts

import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import { showSmartRestoreModal } from './ui/modal';
import { analyzeDataDifferences, type DataDiffResult, type MergeOptions } from '../features/webdavSync/application/dataDiff';
import { mergeData } from '../features/webdavSync/application/dataMerge';
import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS, RESTORE_CONFIG } from '../utils/config';
import { requireAuthIfRestricted } from '../features/privacy';
import { dbMagnetPushLogsBulkAdd, dbMagnetPushLogsClear } from './dbClient';
import { showConfirm } from './components/confirmModal';
import {
    type WebDAVFile,
} from './webdavRestore/fileListModel';
import {
    type ConflictDetailType,
} from './webdavRestore/conflictDetailModel';
import { WebDAVRestoreConflictController } from './webdavRestore/conflictController';
import { WebDAVRestoreResultController } from './webdavRestore/restoreResultController';
import { WebDAVRestoreProgressResultsController } from './webdavRestore/restoreProgressResultsController';
import { WebDAVRestoreWizardController } from './webdavRestore/restoreWizardController';
import { WebDAVRestoreApplyController } from './webdavRestore/restoreApplyController';
import { WebDAVRestoreFilePreviewController } from './webdavRestore/restoreFilePreviewController';
import { WebDAVRestoreAnalysisController } from './webdavRestore/restoreAnalysisController';
import { WebDAVRestoreOptionsController } from './webdavRestore/restoreOptionsController';
import { WebDAVRestoreUnifiedExecutorController } from './webdavRestore/restoreUnifiedExecutorController';
import { WebDAVRestoreModalShellController } from './webdavRestore/restoreModalShellController';
import { WebDAVSettingsDifferenceController } from './webdavRestore/settingsDifferenceController';
import {
    type RestoreMode,
} from './webdavRestore/restoreModeUiModel';
import {
    buildSettingsDifferenceModalHtml,
    SETTINGS_DIFFERENCE_MODAL_CLASS,
} from './webdavRestore/settingsDifferenceModel';

// 全局变量
let selectedFile: WebDAVFile | null = null;

function getRestoreModal(): HTMLElement | null {
    return restoreModalShellController.getRestoreModal();
}

function mq<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return restoreModalShellController.queryInModal(selector);
}

let currentCloudData: any = null;
let currentLocalData: any = null;
let currentDiffResult: DataDiffResult | null = null;
const restoreModalShellController = new WebDAVRestoreModalShellController({
    setSelectedFile: (file) => {
        selectedFile = file;
    },
    fetchFileList,
    startWizardRestore,
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
});
const conflictController = new WebDAVRestoreConflictController({
    showMessage,
    logDebug: (message, payload) => {
        logAsync('DEBUG', message, payload);
    },
});
const restoreResultController = new WebDAVRestoreResultController({
    backupPrefix: STORAGE_KEYS.RESTORE_BACKUP,
    getAllStorage: () => chrome.storage.local.get(null),
    showMessage,
    logError: (message, payload) => {
        logAsync('ERROR', message, payload);
    },
    reloadPage: () => {
        window.location.reload();
    },
});
const settingsDifferenceController = new WebDAVSettingsDifferenceController({
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
});
const restoreOptionsController = new WebDAVRestoreOptionsController({
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
});
const restoreFilePreviewController = new WebDAVRestoreFilePreviewController({
    getRestoreModal,
    queryInModal: mq,
    hideElement,
    showElement,
    showError,
    showMessage,
    configureRestoreOptions,
    startWizardRestore,
    ensureFooterInModal: () => restoreModalShellController.ensureFooterInModal(),
    setSelectedFile: (file) => {
        selectedFile = file;
    },
    getSelectedFile: () => selectedFile,
    resetRestorePreviewContext: () => {
        currentCloudData = null;
        currentLocalData = null;
        currentDiffResult = null;
    },
    setCloudData: (data) => {
        currentCloudData = data;
    },
    sendRuntimeMessage: (message, callback) => {
        chrome.runtime.sendMessage(message, callback);
    },
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
    logWarn: (message, payload) => {
        logAsync('WARN', message, payload);
    },
    logError: (message, payload) => {
        logAsync('ERROR', message, payload);
    },
});
const restoreAnalysisController = new WebDAVRestoreAnalysisController({
    storageKeys: {
        VIEWED_RECORDS: STORAGE_KEYS.VIEWED_RECORDS,
        ACTOR_RECORDS: STORAGE_KEYS.ACTOR_RECORDS,
        SETTINGS: STORAGE_KEYS.SETTINGS,
        USER_PROFILE: STORAGE_KEYS.USER_PROFILE,
        LOGS: STORAGE_KEYS.LOGS,
        LAST_IMPORT_STATS: STORAGE_KEYS.LAST_IMPORT_STATS,
        NEW_WORKS_SUBSCRIPTIONS: STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS,
        NEW_WORKS_RECORDS: STORAGE_KEYS.NEW_WORKS_RECORDS,
        NEW_WORKS_CONFIG: STORAGE_KEYS.NEW_WORKS_CONFIG,
    },
    getRestoreModal,
    queryInModal: mq,
    hideElement,
    showElement,
    getSelectedFile: () => selectedFile,
    setCloudData: (data) => {
        currentCloudData = data;
    },
    setLocalData: (data) => {
        currentLocalData = data;
    },
    setDiffResult: (diffResult) => {
        currentDiffResult = diffResult;
    },
    getValue,
    sendRuntimeMessage: (message, callback) => {
        chrome.runtime.sendMessage(message, callback);
    },
    analyzeDataDifferences,
    initializeRestoreInterface,
    showMessage,
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
    logError: (message, payload) => {
        logAsync('ERROR', message, payload);
    },
});
const restoreProgressResultsController = new WebDAVRestoreProgressResultsController({
    getRestoreModal,
    hideElement,
    showElement,
    fetchFileList,
    closeModal,
});
const restoreWizardController = new WebDAVRestoreWizardController({
    getRestoreModal,
    queryInModal: mq,
    updateElement,
    showElement,
    configureRestoreOptions,
    executeRestore,
    showMessage,
    showSmartRestoreModal,
    showConfirm,
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
    getRestoreContext: () => ({
        diffResult: currentDiffResult,
        cloudData: currentCloudData,
        localData: currentLocalData,
    }),
    defaultStrategy: RESTORE_CONFIG.defaults.strategy,
});
const restoreApplyController = new WebDAVRestoreApplyController({
    storageKeys: STORAGE_KEYS,
    getSelectedFile: () => selectedFile,
    getRestoreContext: () => ({
        diffResult: currentDiffResult,
        cloudData: currentCloudData,
        localData: currentLocalData,
    }),
    getConflictResolutions: () => conflictController.getResolutions(),
    queryInModal: mq,
    setValue,
    getValue,
    getAllStorage: () => chrome.storage.local.get(null),
    removeStorage: (keys) => chrome.storage.local.remove(keys),
    clearMagnetPushLogs: dbMagnetPushLogsClear,
    addMagnetPushLogs: dbMagnetPushLogsBulkAdd,
    mergeData,
    showMessage,
    showRestoreResult: (mergeResult) => {
        restoreResultController.show(mergeResult);
    },
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
    logWarn: (message, payload) => {
        logAsync('WARN', message, payload);
    },
    logError: (message, payload) => {
        logAsync('ERROR', message, payload);
    },
    reloadPage: () => {
        window.location.reload();
    },
});
const restoreUnifiedExecutorController = new WebDAVRestoreUnifiedExecutorController({
    queryInModal: mq,
    getSelectedFile: () => selectedFile,
    getCloudData: () => currentCloudData,
    requireAuthIfRestricted,
    showConfirm,
    showMessage,
    showRestoreProgress: () => {
        restoreProgressResultsController.showProgress();
    },
    showRestoreResults: (summary, cloudData) => {
        restoreProgressResultsController.showResults(summary, cloudData);
    },
    clearProgressTimer: () => {
        restoreProgressResultsController.clearProgressTimer();
    },
    sendRuntimeMessage: (message, callback) => {
        chrome.runtime.sendMessage(message, callback);
    },
    logInfo: (message, payload) => {
        logAsync('INFO', message, payload);
    },
    logError: (message, payload) => {
        logAsync('ERROR', message, payload);
    },
});

/**
 * 初始化覆盖式恢复界面
 */
function initializeRestoreInterface(diffResult: DataDiffResult): void {
    restoreWizardController.initializeRestoreInterface(diffResult, currentCloudData);
}

/**
 * 初始化统一的恢复模式
 */
function initializeRestoreMode(diffResult: DataDiffResult): void {
    restoreWizardController.initializeRestoreMode(diffResult);
}

/**
 * 切换模式
 */
function switchMode(newMode: RestoreMode): void {
    restoreWizardController.switchMode(newMode);
}

/**
 * 初始化快捷模式
 */
function initializeQuickMode(diffResult: DataDiffResult): void {
    restoreWizardController.initializeQuickMode(diffResult);
}

/**
 * 初始化向导模式
 */
function initializeWizardMode(diffResult: DataDiffResult): void {
    restoreWizardController.initializeWizardMode(diffResult);
}

/**
 * 开始快捷恢复
 */
async function startQuickRestore(): Promise<void> {
    await restoreWizardController.startQuickRestore();
}

/**
 * 开始向导恢复
 */
function startWizardRestore(): void {
    restoreWizardController.startWizardRestore();
}

/**
 * 执行恢复操作
 */
async function executeRestore(mergeOptions: MergeOptions): Promise<void> {
    await restoreUnifiedExecutorController.executeRestore(mergeOptions);
}

/**
 * 关闭WebDAV恢复弹窗
 */
function closeWebDAVRestoreModal(): void {
    restoreModalShellController.closeModal();
}

export function showWebDAVRestoreModal(): void {
    restoreModalShellController.showWebDAVRestoreModal();
}

function fetchFileList(): void {
    restoreFilePreviewController.fetchFileList();
}

async function displayFileList(files: WebDAVFile[]): Promise<void> {
    await restoreFilePreviewController.displayFileList(files);
}

function selectFile(file: WebDAVFile, element: HTMLElement): void {
    restoreFilePreviewController.selectFile(file, element);
}

/**
 * 分析数据差异
 */
async function performDataAnalysis(): Promise<void> {
    await restoreAnalysisController.performDataAnalysis();
}

/**
 * 自动检测并配置恢复内容选项
 */
function configureRestoreOptions(cloudData: any): void {
    restoreOptionsController.configureRestoreOptions(cloudData);
}

 

 

 

async function handleConfirmRestore(): Promise<void> {
    await restoreApplyController.handleConfirmRestore();
}

/**
 * 回滚到上次恢复前的状态
 */
export async function rollbackLastRestore(): Promise<void> {
    await restoreApplyController.rollbackLastRestore();
}

/**
 * 清理旧备份
 */
export async function cleanupOldBackups(keepCount: number = 5): Promise<void> {
    await restoreApplyController.cleanupOldBackups(keepCount);
}

function showError(message: string): void {
    restoreModalShellController.showError(message);
}

function applyRestoreFileListBackState(): void {
    restoreModalShellController.applyRestoreFileListBackState();
}

function closeModal(): void {
    restoreModalShellController.closeModal();
}

function showElement(id: string): void {
    restoreModalShellController.showElement(id);
}

function hideElement(id: string): void {
    restoreModalShellController.hideElement(id);
}

function updateElement(id: string, text: string): void {
    restoreModalShellController.updateElement(id, text);
}

/**
 * 显示设置差异详情
 */
function showSettingsDifference(settingsDiff: any): void {
    settingsDifferenceController.show(settingsDiff);
}

/**
 * 显示冲突解决界面
 */
function showConflictResolution(type: ConflictDetailType, conflicts: any[]): void {
    conflictController.show(type, conflicts);
}

// 函数已在定义时导出

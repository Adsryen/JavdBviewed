export type RestoreCategorySelection = Record<string, boolean>;

export interface RestoreCategorySelectionInput {
  mergeOptions: {
    restoreSettings?: boolean;
    restoreRecords?: boolean;
    restoreUserProfile?: boolean;
    restoreActorRecords?: boolean;
    restoreNewWorks?: boolean;
    restoreLogs?: boolean;
    restoreMagnetPushLogs?: boolean;
    restoreImportStats?: boolean;
  };
  restoreMagnetPushLogs: boolean;
  restoreMagnets: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  settings: '扩展设置',
  userProfile: '账号信息',
  viewed: '观看记录',
  actors: '演员库',
  newWorks: '新作品',
  logs: '日志记录',
  magnetPushLogs: '磁力推送日志',
  importStats: '导入统计',
  magnets: '磁链缓存',
};

export function getRestoreCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export function getSelectedRestoreCategories(categories: RestoreCategorySelection): string[] {
  return Object.entries(categories)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
}

export function buildRestoreCategorySelection(input: RestoreCategorySelectionInput): RestoreCategorySelection {
  return {
    settings: Boolean(input.mergeOptions.restoreSettings),
    userProfile: Boolean(input.mergeOptions.restoreUserProfile),
    viewed: Boolean(input.mergeOptions.restoreRecords),
    actors: Boolean(input.mergeOptions.restoreActorRecords),
    newWorks: Boolean(input.mergeOptions.restoreNewWorks),
    logs: Boolean(input.mergeOptions.restoreLogs),
    magnetPushLogs: input.restoreMagnetPushLogs,
    importStats: Boolean(input.mergeOptions.restoreImportStats),
    magnets: input.restoreMagnets,
  };
}

export function buildRestoreExecuteConfirmHtml(input: {
  categories: RestoreCategorySelection;
  autoBackupBeforeRestore: boolean;
}): string {
  const selectedCategories = getSelectedRestoreCategories(input.categories);
  const backupClass = input.autoBackupBeforeRestore ? 'alert-success' : 'alert-warning';
  const backupText = input.autoBackupBeforeRestore ? '✓ 恢复前将自动备份当前数据' : '✗ 未启用自动备份';

  return `
            <div style="line-height: 1.8;">
                <div class="alert-error">
                    <p>⚠️ 警告：替换式恢复将清空现有数据！</p>
                </div>
                
                <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: var(--text-primary);">将要恢复的类别：</p>
                    <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">
                        ${selectedCategories.map(cat => `<li>${escapeHtml(getRestoreCategoryLabel(cat))}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="${backupClass}">
                    <p>${backupText}</p>
                </div>
                
                <p style="margin: 0; font-weight: 600; color: var(--error-text, #c62828); text-align: center;">
                    此操作不可撤销，确定要继续吗？
                </p>
            </div>
        `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

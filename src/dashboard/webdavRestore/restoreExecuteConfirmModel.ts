export type RestoreCategorySelection = Record<string, boolean>;
export type RestoreCategoryMode = 'skip' | 'merge' | 'replace';
export type RestoreCategoryModes = Record<string, RestoreCategoryMode>;

export interface RestoreCategorySelectionInput {
  mergeOptions: {
    strategy?: string;
    restoreSettings?: boolean;
    restoreRecords?: boolean;
    restoreUserProfile?: boolean;
    restoreActorRecords?: boolean;
    restoreNewWorks?: boolean;
    restoreLogs?: boolean;
    restoreMagnetPushLogs?: boolean;
    restoreImportStats?: boolean;
    restoreLists?: boolean;
    categoryModes?: Partial<RestoreCategoryModes>;
  };
  restoreMagnetPushLogs: boolean;
  restoreMagnets: boolean;
}

export interface RestoreCategoryModesInput extends RestoreCategorySelectionInput {
  explicitModes?: Partial<RestoreCategoryModes>;
}

const CATEGORY_LABELS: Record<string, string> = {
  settings: '扩展设置',
  userProfile: '账号信息',
  viewed: '观看记录',
  actors: '演员库',
  newWorks: '新作品',
  lists: '清单 / 系列 / 番号',
  logs: '日志记录',
  magnetPushLogs: '磁力推送日志',
  importStats: '导入统计',
  magnets: '磁链缓存',
};

const DEFAULT_SELECTED_MODES: RestoreCategoryModes = {
  settings: 'replace',
  userProfile: 'replace',
  viewed: 'merge',
  actors: 'merge',
  newWorks: 'merge',
  lists: 'merge',
  logs: 'merge',
  magnetPushLogs: 'merge',
  importStats: 'replace',
  magnets: 'merge',
};

const MODE_LABELS: Record<RestoreCategoryMode, string> = {
  skip: '跳过',
  merge: '合并',
  replace: '覆盖',
};

export function getRestoreCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export function getRestoreCategoryModeLabel(mode: RestoreCategoryMode | undefined): string {
  return MODE_LABELS[mode || 'skip'] || MODE_LABELS.skip;
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
    lists: Boolean(input.mergeOptions.restoreLists ?? input.mergeOptions.restoreRecords),
    logs: Boolean(input.mergeOptions.restoreLogs),
    magnetPushLogs: input.restoreMagnetPushLogs,
    importStats: Boolean(input.mergeOptions.restoreImportStats),
    magnets: input.restoreMagnets,
  };
}

export function buildRestoreCategoryModes(input: RestoreCategoryModesInput): RestoreCategoryModes {
  const categories = buildRestoreCategorySelection(input);
  const modes: RestoreCategoryModes = {};
  const overrides = {
    ...(input.mergeOptions.categoryModes || {}),
    ...(input.explicitModes || {}),
  };

  for (const key of Object.keys(DEFAULT_SELECTED_MODES)) {
    const selected = categories[key] === true;
    modes[key] = selected ? (overrides[key] || DEFAULT_SELECTED_MODES[key]) : 'skip';
  }

  return modes;
}

export function buildRestoreExecuteConfirmHtml(input: {
  categories: RestoreCategorySelection;
  categoryModes: RestoreCategoryModes;
  autoBackupBeforeRestore: boolean;
}): string {
  const selectedCategories = getSelectedRestoreCategories(input.categories)
    .filter((category) => input.categoryModes[category] !== 'skip');
  const backupClass = input.autoBackupBeforeRestore ? 'alert-success' : 'alert-warning';
  const backupText = input.autoBackupBeforeRestore ? '✓ 恢复前将自动备份当前数据' : '✗ 未启用自动备份';

  return `
            <div style="line-height: 1.8;">
                <div class="alert-error">
                    <p>⚠️ 确认恢复策略</p>
                    <p>覆盖类别会先清空本地同类数据；合并类别会保留本地独有数据并按记录标识去重。</p>
                </div>
                
                <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: var(--text-primary);">将要恢复的类别：</p>
                    <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary);">
                        ${selectedCategories.map(cat => `<li>${escapeHtml(getRestoreCategoryLabel(cat))}：<strong>${escapeHtml(getRestoreCategoryModeLabel(input.categoryModes[cat]))}</strong></li>`).join('')}
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

type StorageKeys = {
  VIEWED_RECORDS: string;
  SETTINGS: string;
  LAST_IMPORT_STATS: string;
  USER_PROFILE: string;
  ACTOR_RECORDS: string;
  NEW_WORKS_SUBSCRIPTIONS: string;
  NEW_WORKS_RECORDS: string;
};

const STORAGE_KEYS: StorageKeys = {
  VIEWED_RECORDS: 'viewed',
  SETTINGS: 'settings',
  LAST_IMPORT_STATS: 'last_import_stats',
  USER_PROFILE: 'user_profile',
  ACTOR_RECORDS: 'actor_records',
  NEW_WORKS_SUBSCRIPTIONS: 'new_works_subscriptions',
  NEW_WORKS_RECORDS: 'new_works_records',
};

export interface RestoreResultItemViewModel {
  key: string;
  title: string;
  statusText: string;
  statusClass: string;
  iconClass: string;
  details: string[];
}

export interface RestoreResultsContainerSpec {
  id: string;
  className: string;
  html: string;
}

export interface RestoreResultsEnterUiState {
  hiddenElementIds: string[];
  hiddenButtonIds: string[];
  hideFooters: boolean;
}

export interface RestoreResultsLeaveUiState {
  hiddenElementIds: string[];
  loadingText: string;
  restoreButtonIds: string[];
  showFooters: boolean;
}

export interface RestoreResultsReturnToListState {
  resultsContainerId: string;
  modalBodySelector: string;
  restoredChildDisplay: string;
  hiddenElementIds: string[];
  shownElementIds: string[];
  loadingTextElementSelector: string;
  loadingText: string;
  restoreButtonIds: string[];
  actionButtonOptions: {
    disableConfirm: boolean;
    hideBack: boolean;
  };
  footerDisplay: string;
}

export interface RestoreResultsDoneState {
  restoreButtonIds: string[];
  actionButtonOptions: {
    hideConfirm: boolean;
  };
  footerDisplay: string;
}

const CATEGORY_NAMES: Record<string, string> = {
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

export function buildRestoreResultItems(summary: any, cloudData: any): RestoreResultItemViewModel[] {
  return Object.entries(CATEGORY_NAMES).map(([key, title]) => {
    const result = summary?.categories?.[key] || { reason: 'not_selected' };
    const details = buildDetails(key, result, cloudData);
    const status = getResultStatus(result);

    return {
      key,
      title,
      details,
      ...status,
    };
  });
}

export function buildRestoreResultsContainerSpec(summary: any, cloudData: any): RestoreResultsContainerSpec {
  return {
    id: 'restoreResultsContainer',
    className: 'restore-results-container',
    html: buildRestoreResultsHtml(buildRestoreResultItems(summary, cloudData)),
  };
}

export function buildRestoreResultsHtml(items: RestoreResultItemViewModel[]): string {
  return `
        <div class="results-header">
            <h4><i class="fas fa-check-circle text-success"></i> 恢复完成</h4>
            <p>数据已成功覆盖，以下是详细结果：</p>
        </div>
        <div class="results-categories">
            ${items.map(buildRestoreResultItemHtml).join('')}
        </div>
        <div class="results-footer">
            <button class="btn btn-secondary" id="resultsBackBtn">
                <i class="fas fa-arrow-left"></i>
                返回选择备份
            </button>
            <button class="btn btn-primary" id="resultsDoneBtn">
                <i class="fas fa-check"></i>
                完成
            </button>
        </div>
    `;
}

export function buildRestoreResultItemHtml(item: RestoreResultItemViewModel): string {
  const details = item.details.join(' · ');
  return `
        <div class="result-item">
            <div class="result-icon"><i class="${item.iconClass}"></i></div>
            <div class="result-content">
                <div class="result-title">${item.title}</div>
                <div class="result-status ${item.statusClass}">${item.statusText}</div>
                ${details ? `<div class="result-details">${details}</div>` : ''}
            </div>
        </div>
    `;
}

export function buildRestoreResultsEnterUiState(): RestoreResultsEnterUiState {
  return {
    hiddenElementIds: [
      'webdavRestoreLoading',
      'webdavRestoreError',
      'webdavRestoreOptions',
      'webdavDataPreview',
      'webdavRestoreContent',
    ],
    hiddenButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreBack',
      'webdavRestoreCancel',
    ],
    hideFooters: true,
  };
}

export function buildRestoreResultsLeaveUiState(): RestoreResultsLeaveUiState {
  return {
    hiddenElementIds: [
      'webdavRestoreError',
      'webdavDataPreview',
    ],
    loadingText: '正在获取云端文件列表...',
    restoreButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreBack',
      'webdavRestoreCancel',
    ],
    showFooters: true,
  };
}

export function buildRestoreResultsReturnToListState(): RestoreResultsReturnToListState {
  return {
    resultsContainerId: 'restoreResultsContainer',
    modalBodySelector: '.modal-body',
    restoredChildDisplay: '',
    hiddenElementIds: [
      'webdavRestoreError',
      'webdavDataPreview',
    ],
    shownElementIds: ['webdavRestoreLoading'],
    loadingTextElementSelector: '#webdavRestoreLoading p',
    loadingText: '正在获取云端文件列表...',
    restoreButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreBack',
      'webdavRestoreCancel',
    ],
    actionButtonOptions: {
      disableConfirm: true,
      hideBack: true,
    },
    footerDisplay: '',
  };
}

export function buildRestoreResultsDoneState(): RestoreResultsDoneState {
  return {
    restoreButtonIds: [
      'webdavRestoreConfirm',
      'webdavRestoreBack',
      'webdavRestoreCancel',
    ],
    actionButtonOptions: {
      hideConfirm: true,
    },
    footerDisplay: '',
  };
}

function getResultStatus(result: any): {
  statusText: string;
  statusClass: string;
  iconClass: string;
} {
  const hasError = Boolean(result?.error) || result?.reason === 'error';
  const hasReplaced = result?.replaced === true;
  const hasCleared = result?.cleared === true;
  const written = typeof result?.written === 'number' ? result.written : undefined;
  const hadNewWorks = Boolean(result?.hasSubs || result?.hasRecords || result?.hasConfig);

  if (hasError) {
    return {
      statusText: '失败',
      statusClass: 'status-error',
      iconClass: 'fas fa-times text-danger',
    };
  }

  if (hasReplaced || hasCleared || (typeof written === 'number' && written > 0) || hadNewWorks) {
    return {
      statusText: '已覆盖',
      statusClass: 'status-success',
      iconClass: 'fas fa-check text-success',
    };
  }

  return {
    statusText: '跳过',
    statusClass: 'status-skipped',
    iconClass: 'fas fa-minus text-muted',
  };
}

function buildDetails(category: string, result: any, cloudData: any): string[] {
  const detailParts = getCloudDetails(category, cloudData);
  const written = typeof result?.written === 'number' ? result.written : undefined;

  if (typeof written === 'number') detailParts.push(`写入：${written} 条`);
  if (typeof result?.durationMs === 'number') detailParts.push(`${Math.round(result.durationMs)} ms`);
  if (result?.reason && !['missing', 'error', 'not_selected'].includes(result.reason)) {
    detailParts.push(String(result.reason));
  }
  if (result?.reason === 'not_selected' || !result || Object.keys(result).length === 0) {
    detailParts.push('未选择');
  }

  return detailParts;
}

function getCloudDetails(category: string, cloudData: any): string[] {
  const sa = cloudData?.storageAll || {};

  switch (category) {
    case 'settings':
      return [`云端：${cloudData?.settings || sa[STORAGE_KEYS.SETTINGS] ? '有' : '无'}`];
    case 'userProfile':
      return [`云端：${cloudData?.userProfile != null || sa[STORAGE_KEYS.USER_PROFILE] != null ? '有' : '无'}`];
    case 'viewed': {
      const idbRecords = Array.isArray(cloudData?.idb?.viewedRecords) ? cloudData.idb.viewedRecords : [];
      const count = idbRecords.length || countObjectEntries(cloudData?.data || cloudData?.viewed || sa[STORAGE_KEYS.VIEWED_RECORDS]);
      return [`云端：${count} 条`];
    }
    case 'actors': {
      const idbActors = Array.isArray(cloudData?.idb?.actors) ? cloudData.idb.actors : [];
      const count = idbActors.length || countObjectEntries(cloudData?.actorRecords || sa[STORAGE_KEYS.ACTOR_RECORDS]);
      return [`云端：${count} 条`];
    }
    case 'newWorks': {
      const subscriptions = countObjectEntries(cloudData?.newWorks?.subscriptions || sa[STORAGE_KEYS.NEW_WORKS_SUBSCRIPTIONS]);
      const records = countObjectEntries(cloudData?.newWorks?.records || sa[STORAGE_KEYS.NEW_WORKS_RECORDS]);
      return [`云端：订阅 ${subscriptions} · 记录 ${records}`];
    }
    case 'logs': {
      const idbLogs = Array.isArray(cloudData?.idb?.logs) ? cloudData.idb.logs : [];
      const count = idbLogs.length || (Array.isArray(cloudData?.logs) ? cloudData.logs.length : 0);
      return [`云端：${count} 条`];
    }
    case 'magnets': {
      const idbMagnets = Array.isArray(cloudData?.idb?.magnets) ? cloudData.idb.magnets : [];
      return [`云端：${idbMagnets.length} 条`];
    }
    case 'importStats':
      return [`云端：${cloudData?.importStats != null || sa[STORAGE_KEYS.LAST_IMPORT_STATS] != null ? '有' : '无'}`];
    default:
      return [];
  }
}

function countObjectEntries(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  return Object.keys(data).length;
}

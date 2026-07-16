/**
 * @file drive115CleanupModel.ts
 * @description 真实已看 → 115 待清理清单（pure，无副作用）
 * @module features/drive115
 */

export type Drive115CleanupItem = {
  id: string;
  code: string;
  title: string;
  /** 115 文件 */
  fileId?: string;
  pickCode?: string;
  fileName?: string;
  /** 关联 Emby 证据 */
  embyItemId?: string;
  embyServerUrl?: string;
  reason: 'watched' | 'manual';
  addedAt: number;
  status: 'pending' | 'deleted' | 'failed' | 'skipped';
  error?: string;
};

export type Drive115CleanupListState = {
  items: Drive115CleanupItem[];
  updatedAt: number;
};

export const EMPTY_CLEANUP_LIST: Drive115CleanupListState = {
  items: [],
  updatedAt: 0,
};

/**
 * 生成稳定清单项 id
 */
export function makeCleanupItemId(code: string, fileId?: string, pickCode?: string): string {
  return `${code}::${fileId || ''}::${pickCode || ''}`;
}

/**
 * 加入待删清单（去重：同 code+fileId）
 */
export function enqueueCleanupItem(
  state: Drive115CleanupListState,
  item: Omit<Drive115CleanupItem, 'id' | 'status' | 'addedAt'> & { addedAt?: number },
  now = Date.now(),
): Drive115CleanupListState {
  const id = makeCleanupItemId(item.code, item.fileId, item.pickCode);
  const exists = state.items.some((x) => x.id === id && x.status === 'pending');
  if (exists) return state;
  const next: Drive115CleanupItem = {
    id,
    code: item.code,
    title: item.title,
    fileId: item.fileId,
    pickCode: item.pickCode,
    fileName: item.fileName,
    embyItemId: item.embyItemId,
    embyServerUrl: item.embyServerUrl,
    reason: item.reason,
    addedAt: item.addedAt ?? now,
    status: 'pending',
  };
  return {
    items: [next, ...state.items.filter((x) => x.id !== id)],
    updatedAt: now,
  };
}

/**
 * 待处理项
 */
export function listPendingCleanup(state: Drive115CleanupListState): Drive115CleanupItem[] {
  return state.items.filter((x) => x.status === 'pending');
}

/**
 * 标记结果
 */
export function markCleanupResult(
  state: Drive115CleanupListState,
  id: string,
  status: 'deleted' | 'failed' | 'skipped',
  error?: string,
  now = Date.now(),
): Drive115CleanupListState {
  return {
    updatedAt: now,
    items: state.items.map((x) => (x.id === id ? { ...x, status, error } : x)),
  };
}

/**
 * 清空已完成（deleted/skipped）
 */
export function pruneFinishedCleanup(state: Drive115CleanupListState, now = Date.now()): Drive115CleanupListState {
  return {
    updatedAt: now,
    items: state.items.filter((x) => x.status === 'pending' || x.status === 'failed'),
  };
}

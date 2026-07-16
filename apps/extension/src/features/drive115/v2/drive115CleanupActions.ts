/**
 * @file drive115CleanupActions.ts
 * @description 115 清理清单：持久化 + 按番号搜索绑定 + 删除尝试（open API 有限时降级说明）
 * @module features/drive115
 */
import { STORAGE_KEYS } from '../../../utils/config';
import { getValue, setValue } from '../../../utils/storage';
import { searchFilesV2 } from './search';
import { getDrive115V2Service } from './index';
import {
  EMPTY_CLEANUP_LIST,
  enqueueCleanupItem,
  listPendingCleanup,
  markCleanupResult,
  pruneFinishedCleanup,
  type Drive115CleanupItem,
  type Drive115CleanupListState,
} from './drive115CleanupModel';
import { pickDefaultPlayCandidate, mapSearchItemsToPlayCandidates } from './drive115PlaybackModel';

/**
 * 读取清理清单
 */
export async function loadCleanupList(): Promise<Drive115CleanupListState> {
  return getValue<Drive115CleanupListState>(
    STORAGE_KEYS.MEDIA_115_CLEANUP_LIST,
    EMPTY_CLEANUP_LIST,
  );
}

/**
 * 保存清理清单
 */
export async function saveCleanupList(state: Drive115CleanupListState): Promise<void> {
  await setValue(STORAGE_KEYS.MEDIA_115_CLEANUP_LIST, state);
}

/**
 * 将真实已看条目加入清单，并尽量用 115 搜索绑定 fileId/pickCode
 */
export async function enqueueWatchedForCleanup(input: {
  code: string;
  title: string;
  embyItemId?: string;
  embyServerUrl?: string;
  fileId?: string;
  pickCode?: string;
  fileName?: string;
}): Promise<{ state: Drive115CleanupListState; bound: boolean; message?: string }> {
  let state = await loadCleanupList();
  let fileId = input.fileId;
  let pickCode = input.pickCode;
  let fileName = input.fileName;
  let bound = Boolean(fileId || pickCode);
  let message: string | undefined;

  if (!bound && input.code) {
    try {
      const ret = await searchFilesV2({
        search_value: input.code,
        limit: 10,
        offset: 0,
        type: 4,
        fc: 2,
      });
      if (ret.success && ret.data?.length) {
        const candidates = mapSearchItemsToPlayCandidates(ret.data);
        const def = pickDefaultPlayCandidate(candidates);
        if (def) {
          fileId = def.fileId;
          pickCode = def.pickCode;
          fileName = def.fileName;
          bound = true;
        }
      } else {
        message = ret.message || '未在 115 搜索到匹配文件，已加入清单待手动绑定';
      }
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
  }

  state = enqueueCleanupItem(state, {
    code: input.code,
    title: input.title,
    fileId,
    pickCode,
    fileName,
    embyItemId: input.embyItemId,
    embyServerUrl: input.embyServerUrl,
    reason: 'watched',
  });
  await saveCleanupList(state);
  return { state, bound, message };
}

/**
 * 尝试删除 115 文件：先调 open 删除接口；失败则明确原因（不误删离线任务）
 */
export async function attemptDeleteCleanupItem(
  item: Drive115CleanupItem,
): Promise<{ ok: boolean; state: Drive115CleanupListState; message: string }> {
  let state = await loadCleanupList();

  if (!item.fileId && !item.pickCode) {
    state = markCleanupResult(state, item.id, 'failed', '缺少 115 fileId/pickCode，请先搜索绑定');
    await saveCleanupList(state);
    return { ok: false, state, message: '缺少 115 文件绑定' };
  }

  try {
    const svc = getDrive115V2Service();
    const tokenRet = await svc.getValidAccessToken();
    if (!tokenRet.success) {
      const msg = (tokenRet as any).message || '无法获取 115 access_token';
      state = markCleanupResult(state, item.id, 'failed', msg);
      await saveCleanupList(state);
      return { ok: false, state, message: msg };
    }

    if (!item.fileId) {
      const msg = '缺少 file_id，无法调用删除接口（仅有 pick_code）';
      state = markCleanupResult(state, item.id, 'failed', msg);
      await saveCleanupList(state);
      return { ok: false, state, message: msg };
    }

    const del = await svc.deleteFiles({
      accessToken: tokenRet.accessToken,
      fileIds: [item.fileId],
    });

    if (del.success) {
      state = markCleanupResult(state, item.id, 'deleted');
      await saveCleanupList(state);
      return { ok: true, state, message: '已删除（或已移入回收站）' };
    }

    const msg =
      del.message
      || '删除接口不可用；请在 115 网页手动删除，或确认 Open 应用权限包含文件删除';
    state = markCleanupResult(state, item.id, 'failed', msg);
    await saveCleanupList(state);
    return { ok: false, state, message: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    state = markCleanupResult(state, item.id, 'failed', msg);
    await saveCleanupList(state);
    return { ok: false, state, message: msg };
  }
}

/**
 * 批量处理待删（当前会因 API 限制多标记 failed，但流程闭环）
 */
export async function processPendingCleanup(): Promise<{
  state: Drive115CleanupListState;
  attempted: number;
  failed: number;
}> {
  let state = await loadCleanupList();
  const pending = listPendingCleanup(state);
  let failed = 0;
  for (const item of pending) {
    const ret = await attemptDeleteCleanupItem(item);
    state = ret.state;
    if (!ret.ok) failed += 1;
  }
  state = pruneFinishedCleanup(state);
  await saveCleanupList(state);
  return { state, attempted: pending.length, failed };
}

export async function removeCleanupItem(id: string): Promise<Drive115CleanupListState> {
  let state = await loadCleanupList();
  state = {
    updatedAt: Date.now(),
    items: state.items.filter((x) => x.id !== id),
  };
  await saveCleanupList(state);
  return state;
}

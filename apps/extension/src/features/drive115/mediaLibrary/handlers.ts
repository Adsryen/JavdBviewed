/**
 * @file handlers.ts
 * @description 115 媒体库索引 background / 消息处理
 * @module features/drive115/mediaLibrary
 */
import { getSettings, saveSettings } from '../../../utils/storage';
import { mediaLog } from '../../embyLibrary/mediaLibraryLogger';
import { getDrive115V2Service } from '../v2';
import { indexDrive115Roots } from './indexer';
import { loadDrive115LibraryState, saveDrive115LibraryState } from './store';
import type { Drive115IndexResult, Drive115MediaLibraryRoot } from './types';

type SendResponse = (response: any) => void;

let indexingPromise: Promise<Drive115IndexResult> | null = null;

function log115(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown): void {
  const text = `[115] ${message}`;
  if (level === 'error') mediaLog.error(text, data);
  else if (level === 'warn') mediaLog.warn(text, data);
  else if (level === 'debug') mediaLog.debug(text, data);
  else mediaLog.info(text, data);
}

/** 规范化片库根目录（不依赖 dashboard model，避免 features→apps） */
function normalizeRoots(raw: unknown): Drive115MediaLibraryRoot[] {
  if (!Array.isArray(raw)) return [];
  const byCid = new Map<string, Drive115MediaLibraryRoot>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const cid = String(row.cid ?? '').trim();
    if (!cid) continue;
    byCid.set(cid, {
      cid,
      name: typeof row.name === 'string' ? row.name : undefined,
      path: typeof row.path === 'string' ? row.path : undefined,
      enabled: row.enabled !== false,
    });
  }
  return Array.from(byCid.values());
}

function readRootsFromSettings(settings: any): Drive115MediaLibraryRoot[] {
  const drive115 = settings?.drive115 || {};
  return normalizeRoots(drive115.mediaLibraryRoots);
}

async function patchDrive115IndexMeta(patch: {
  mediaLibraryLastIndexAt?: number | null;
  mediaLibraryLastIndexError?: string | null;
}): Promise<void> {
  try {
    const settings = await getSettings();
    const prev = ((settings as any).drive115 || {}) as Record<string, unknown>;
    const nextDrive115 = { ...prev };
    if ('mediaLibraryLastIndexAt' in patch) {
      nextDrive115.mediaLibraryLastIndexAt = patch.mediaLibraryLastIndexAt ?? null;
    }
    if ('mediaLibraryLastIndexError' in patch) {
      const err = patch.mediaLibraryLastIndexError;
      if (err == null || err === '') delete nextDrive115.mediaLibraryLastIndexError;
      else nextDrive115.mediaLibraryLastIndexError = err;
    }
    await saveSettings({ ...(settings as any), drive115: nextDrive115 } as any);
  } catch (e) {
    log115('warn', '写入索引元数据失败', e);
  }
}

/**
 * 执行一次手动索引（串行；并发请求复用同一 promise）
 */
export async function runDrive115MediaLibraryIndex(): Promise<Drive115IndexResult> {
  if (indexingPromise) return indexingPromise;

  indexingPromise = (async () => {
    const previous = await loadDrive115LibraryState();
    try {
      const settings = await getSettings();
      const roots = readRootsFromSettings(settings);
      const enabled = roots.filter((r) => r.enabled !== false);
      if (!enabled.length) {
        const result: Drive115IndexResult = {
          success: false,
          keptPrevious: previous.entries.length > 0,
          state: { ...previous, lastError: '未配置启用的片库根目录' },
          message: '未配置启用的片库根目录',
        };
        await patchDrive115IndexMeta({
          mediaLibraryLastIndexError: result.message || null,
        });
        return result;
      }

      const svc = getDrive115V2Service();
      const tokenRet = await svc.getValidAccessToken({ forceAutoRefresh: true });
      if (!tokenRet.success || !('accessToken' in tokenRet) || !tokenRet.accessToken) {
        const msg = (tokenRet as any).message || '无法获取 115 授权';
        const result: Drive115IndexResult = {
          success: false,
          keptPrevious: previous.entries.length > 0,
          state: { ...previous, lastError: msg },
          message: msg,
        };
        await patchDrive115IndexMeta({ mediaLibraryLastIndexError: msg });
        return result;
      }
      const accessToken = tokenRet.accessToken;

      log115('info', `开始索引，根目录 ${enabled.length} 个`, {
        roots: enabled.map((r) => r.cid),
      });

      const result = await indexDrive115Roots({
        roots: enabled,
        previous,
        listFiles: async ({ cid, limit, offset }) => {
          const ret = await svc.listFiles({
            accessToken,
            cid,
            limit,
            offset,
            show_dir: 1,
            stdir: 1,
            cur: 1,
          });
          return {
            success: !!ret.success,
            message: ret.message,
            data: (ret.data || []) as Array<Record<string, unknown>>,
            code: Number((ret.raw as any)?.code) || undefined,
          };
        },
        onProgress: (p) => {
          if (p.phase === 'folder' && (p.foldersSeen || 0) % 20 === 0) {
            log115('debug', p.message, {
              indexed: p.indexed,
              apiCalls: p.apiCalls,
            });
          }
        },
      });

      if (result.success) {
        await saveDrive115LibraryState(result.state);
        await patchDrive115IndexMeta({
          mediaLibraryLastIndexAt: result.state.updatedAt,
          mediaLibraryLastIndexError: null,
        });
        log115('info', result.message || '索引完成', result.state.stats);
      } else {
        await saveDrive115LibraryState(result.state);
        await patchDrive115IndexMeta({
          mediaLibraryLastIndexError: result.message || '索引失败',
        });
        log115('warn', result.message || '索引失败', {
          keptPrevious: result.keptPrevious,
          stats: result.state.stats,
        });
      }
      return result;
    } catch (e: any) {
      const msg = e?.message || String(e);
      log115('error', `索引异常：${msg}`);
      const result: Drive115IndexResult = {
        success: false,
        keptPrevious: previous.entries.length > 0,
        state: { ...previous, lastError: msg },
        message: msg,
      };
      try {
        await saveDrive115LibraryState(result.state);
        await patchDrive115IndexMeta({ mediaLibraryLastIndexError: msg });
      } catch {
        /* ignore */
      }
      return result;
    } finally {
      indexingPromise = null;
    }
  })();

  return indexingPromise;
}

export function handleDrive115MediaLibraryIndex(
  _message: any,
  sendResponse: SendResponse,
): boolean {
  void (async () => {
    try {
      const result = await runDrive115MediaLibraryIndex();
      sendResponse({
        success: result.success,
        keptPrevious: result.keptPrevious,
        message: result.message,
        state: result.state,
        stats: result.state.stats,
      });
    } catch (e: any) {
      sendResponse({ success: false, message: e?.message || String(e) });
    }
  })();
  return true;
}

export function handleDrive115MediaLibraryGetState(
  _message: any,
  sendResponse: SendResponse,
): boolean {
  void (async () => {
    try {
      const state = await loadDrive115LibraryState();
      sendResponse({ success: true, state });
    } catch (e: any) {
      sendResponse({ success: false, message: e?.message || String(e) });
    }
  })();
  return true;
}

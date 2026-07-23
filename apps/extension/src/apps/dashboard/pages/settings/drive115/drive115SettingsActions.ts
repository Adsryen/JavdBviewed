/**
 * @file drive115SettingsActions.ts
 * @description 115 网盘设置动作：持久化、校验 token、扫码授权、手动刷新
 * @module apps/dashboard/pages/settings/drive115
 */
import {
  applyDrive115FormToSettings,
  decodeOpenlistScanClientId,
  formatDrive115LogEntryText,
  formatDrive115LogStatsText,
  OPENLIST_MANUAL_URL,
  takeRecentDrive115Logs,
  type Drive115AuthMode,
  type Drive115LogStatsView,
  type Drive115LogViewEntry,
  type Drive115SettingsFormState,
} from './drive115SettingsModel';
import { getDrive115AppLogger } from '../../../../../features/drive115';
import {
  getSettings,
  saveSettings,
  syncDashboardState,
} from '../shared/settingsPersist';

export type AuthStatusKind = 'idle' | 'info' | 'success' | 'error';

export type AuthSession = {
  clientId: string;
  codeVerifier: string;
  uid: string;
  time: string;
  sign: string;
  qrcode: string;
};

export type ValidateTokenResult = {
  success: boolean;
  message: string;
  formPatch?: Partial<Drive115SettingsFormState>;
  userInfo?: Record<string, unknown> | null;
};

export type ManualRefreshResult = {
  success: boolean;
  message: string;
  formPatch?: Partial<Drive115SettingsFormState>;
};

export type StartAuthResult = {
  success: boolean;
  message: string;
  kind: AuthStatusKind;
  session?: AuthSession;
  qrImageUrl?: string;
  deviceMeta?: string;
};

export type PollAuthResult = {
  done: boolean;
  message: string;
  kind: AuthStatusKind;
  formPatch?: Partial<Drive115SettingsFormState>;
  userInfo?: Record<string, unknown> | null;
  /** 继续轮询 */
  continuePolling?: boolean;
};

async function toast(
  message: string,
  type: 'success' | 'info' | 'error' | 'warning' = 'info',
): Promise<void> {
  try {
    const { showMessage } = await import('../../../../../dashboard/ui/toast');
    showMessage(message, type as any);
  } catch {
    /* ignore */
  }
}

/**
 * 打开 OpenList 手动获取地址
 */
export function openOpenlistManualUrl(): void {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: OPENLIST_MANUAL_URL, active: true });
      return;
    }
  } catch {
    /* fallthrough */
  }
  window.open(OPENLIST_MANUAL_URL, '_blank');
}

/**
 * 复制 OpenList 地址
 */
export async function copyOpenlistManualUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(OPENLIST_MANUAL_URL);
    await toast('已复制 OpenList 获取地址', 'success');
    return true;
  } catch {
    await toast('复制失败，请手动复制地址', 'error');
    return false;
  }
}

/**
 * 持久化表单（合并现有 drive115，保留 service 侧维护的额外字段）
 */
export async function persistDrive115Form(
  form: Drive115SettingsFormState,
): Promise<void> {
  const current = await getSettings();
  const next = applyDrive115FormToSettings(current, form);
  await saveSettings(next);
  await syncDashboardState(next);
  try {
    window.dispatchEvent(
      new CustomEvent('drive115:enabled-changed', {
        detail: { enabled: !!form.enabled },
      }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * 将部分补丁合并进 storage 中的 drive115，并返回映射后的表单
 */
export async function patchDrive115Storage(
  patch: Record<string, unknown>,
): Promise<Drive115SettingsFormState> {
  const current = await getSettings();
  const prev = ((current as any).drive115 || {}) as Record<string, unknown>;
  const nextDrive115 = { ...prev, ...patch };
  const next = { ...current, drive115: nextDrive115 } as any;
  await saveSettings(next);
  await syncDashboardState(next);
  const { mapSettingsToDrive115Form } = await import('./drive115SettingsModel');
  return mapSettingsToDrive115Form(next);
}

/**
 * 验证 token 有效性（调用现有 v2 service）
 */
export async function validateDrive115Token(
  form: Drive115SettingsFormState,
): Promise<ValidateTokenResult> {
  try {
    // 先把当前表单 token 写入，确保 service 读到最新
    await persistDrive115Form(form);
    const { getDrive115V2Service } = await import('../../../../../features/drive115/v2');
    const { describe115Error } = await import(
      '../../../../../features/drive115/v2/errorCodes'
    );
    const svc = getDrive115V2Service();
    const userInfo = await svc.fetchUserInfoAuto({ forceAutoRefresh: true });
    if (!userInfo.success || !userInfo.data) {
      const msg =
        describe115Error((userInfo as any).raw) || userInfo.message || '验证失败';
      return { success: false, message: msg };
    }

    const latest = await getSettings();
    const drv = ((latest as any)?.drive115 || {}) as any;
    const formPatch: Partial<Drive115SettingsFormState> = {
      v2AccessToken: String(drv.v2AccessToken || form.v2AccessToken || '').trim(),
      v2RefreshToken: String(drv.v2RefreshToken || form.v2RefreshToken || '').trim(),
      v2TokenExpiresAt:
        typeof drv.v2TokenExpiresAt === 'number' ? drv.v2TokenExpiresAt : form.v2TokenExpiresAt,
      v2RefreshTokenIssuedAtSec:
        Number(drv.v2RefreshTokenIssuedAtSec || drv.v2LastTokenRefreshAtSec || 0) ||
        form.v2RefreshTokenIssuedAtSec,
      v2RefreshTokenStatus: 'valid',
      v2RefreshTokenLastError: undefined,
      v2RefreshTokenLastErrorCode: undefined,
      v2AccessTokenStatus: 'valid',
      v2AccessTokenLastError: undefined,
      v2AccessTokenLastErrorCode: undefined,
      v2UserInfo: (userInfo.data as any) || null,
      v2UserInfoExpired: false,
      v2LastTokenRefreshAtSec:
        Number(drv.v2LastTokenRefreshAtSec || 0) || form.v2LastTokenRefreshAtSec,
      v2TokenRefreshHistorySec: Array.isArray(drv.v2TokenRefreshHistorySec)
        ? drv.v2TokenRefreshHistorySec.map(Number).filter((n: number) => Number.isFinite(n))
        : form.v2TokenRefreshHistorySec,
    };

    // 持久化用户信息缓存
    await patchDrive115Storage({
      ...formPatch,
      v2UserInfo: userInfo.data,
      v2UserInfoUpdatedAt: Date.now(),
      v2UserInfoExpired: false,
    });

    await toast('已验证有效性', 'success');
    return {
      success: true,
      message: '已验证并更新用户信息',
      formPatch,
      userInfo: userInfo.data as any,
    };
  } catch (err: any) {
    const { describe115Error } = await import(
      '../../../../../features/drive115/v2/errorCodes'
    );
    const msg = describe115Error(err) || err?.message || '验证失败';
    await toast(msg, 'error');
    return { success: false, message: msg };
  }
}

/**
 * 检查手动刷新是否受最小间隔 / 2h 上限限制
 */
export async function isManualRefreshAllowed(
  form: Drive115SettingsFormState,
): Promise<{ allowed: boolean; message?: string }> {
  const minMin = Math.min(120, Math.max(60, form.v2MinRefreshIntervalMin || 60));
  const last = Number(form.v2LastTokenRefreshAtSec || 0) || 0;
  if (last > 0) {
    const nowSec = Math.floor(Date.now() / 1000);
    const remainSec = minMin * 60 - (nowSec - last);
    if (remainSec > 0) {
      const remainMin = Math.ceil(remainSec / 60);
      return {
        allowed: false,
        message: `距离上次刷新不足最小间隔（${minMin}分钟），请稍后再试（剩余约 ${remainMin} 分钟）`,
      };
    }
    const maxPer2h = 3;
    const hist = form.v2TokenRefreshHistorySec || [];
    const twoHoursAgo = nowSec - 7200;
    const cnt = hist.filter((ts) => ts >= twoHoursAgo).length;
    if (cnt >= maxPer2h) {
      return {
        allowed: false,
        message: `2小时内刷新次数已达上限（${maxPer2h} 次），请稍后再试`,
      };
    }
  }
  return { allowed: true };
}

/**
 * 手动刷新 access_token
 */
export async function manualRefreshAccessToken(
  form: Drive115SettingsFormState,
): Promise<ManualRefreshResult> {
  const rt = (form.v2RefreshToken || '').trim();
  if (!rt) {
    return { success: false, message: '请先填写 refresh_token' };
  }

  const allow = await isManualRefreshAllowed(form);
  if (!allow.allowed) {
    await toast(allow.message || '刷新受限', 'error');
    return { success: false, message: allow.message || '刷新受限' };
  }

  try {
    try {
      await navigator.clipboard.writeText(rt);
      await toast('已复制 refresh_token 到剪贴板', 'success');
    } catch {
      /* ignore */
    }

    await persistDrive115Form(form);
    const { getDrive115V2Service } = await import('../../../../../features/drive115/v2');
    const { describe115Error } = await import(
      '../../../../../features/drive115/v2/errorCodes'
    );
    const svc = getDrive115V2Service();
    const ret = await svc.refreshToken(rt);
    if (!ret.success || !ret.token) {
      const msg = describe115Error((ret as any).raw) || ret.message || '刷新失败';
      await toast(msg, 'error');
      return { success: false, message: msg };
    }

    const { access_token, refresh_token, expires_at } = ret.token as any;
    const nowSec = Math.floor(Date.now() / 1000);
    const minMin = Math.min(120, Math.max(60, form.v2MinRefreshIntervalMin || 60));
    const hist = [...(form.v2TokenRefreshHistorySec || []), nowSec].filter(
      (n) => Number.isFinite(n) && n > 0,
    );

    const formPatch: Partial<Drive115SettingsFormState> = {
      v2AccessToken: String(access_token || '').trim(),
      v2RefreshToken: String(refresh_token || '').trim(),
      v2TokenExpiresAt: typeof expires_at === 'number' ? expires_at : null,
      v2RefreshTokenIssuedAtSec: nowSec,
      v2RefreshTokenStatus: 'valid',
      v2RefreshTokenLastError: undefined,
      v2RefreshTokenLastErrorCode: undefined,
      v2AccessTokenStatus: 'valid',
      v2AccessTokenLastError: undefined,
      v2AccessTokenLastErrorCode: undefined,
      v2LastTokenRefreshAtSec: nowSec,
      v2MinRefreshIntervalMin: minMin,
      v2TokenRefreshHistorySec: hist,
    };

    await patchDrive115Storage({
      ...formPatch,
      v2LastTokenRefreshAtSec: nowSec,
      v2RefreshTokenIssuedAtSec: nowSec,
      v2MinRefreshIntervalMin: minMin,
      v2TokenRefreshHistorySec: hist,
    });

    await toast('已刷新 access_token', 'success');
    return {
      success: true,
      message: '已刷新 access_token',
      formPatch,
    };
  } catch (err: any) {
    const { describe115Error } = await import(
      '../../../../../features/drive115/v2/errorCodes'
    );
    const msg = describe115Error(err) || err?.message || '刷新失败';
    await toast(msg, 'error');
    return { success: false, message: msg };
  }
}

/**
 * 解析扫码用 clientId
 */
export function resolveAuthClientId(
  mode: Drive115AuthMode,
  formClientId: string,
): string {
  if (mode === 'openlist_scan') return decodeOpenlistScanClientId();
  return String(formClientId || '').trim();
}

/**
 * 启动 PKCE 扫码授权（调用现有 pkce 模块）
 */
export async function startPkceAuth(
  mode: Drive115AuthMode,
  form: Drive115SettingsFormState,
): Promise<StartAuthResult> {
  const clientId = resolveAuthClientId(mode, form.v2ClientId);
  if (!clientId) {
    await toast('请先填写 APP ID', 'error');
    return { success: false, message: '请先填写 APP ID', kind: 'error' };
  }

  try {
    if (mode === 'self_app') {
      await persistDrive115Form({ ...form, v2ClientId: clientId });
    }

    const {
      generateDrive115PkcePair,
      requestDrive115DeviceCode,
      buildDrive115QrImageUrl,
    } = await import('../../../../../features/drive115/v2/pkce');

    const { codeVerifier, codeChallenge } = await generateDrive115PkcePair();
    const deviceCode = await requestDrive115DeviceCode(clientId, codeChallenge, 'sha256');
    const session: AuthSession = {
      clientId,
      codeVerifier,
      uid: deviceCode.uid,
      time: deviceCode.time,
      sign: deviceCode.sign,
      qrcode: deviceCode.qrcode,
    };

    return {
      success: true,
      message: '二维码已生成，请使用 115 手机客户端扫码',
      kind: 'info',
      session,
      qrImageUrl: buildDrive115QrImageUrl(deviceCode.qrcode),
      deviceMeta: `设备码：${deviceCode.uid}`,
    };
  } catch (error: any) {
    const { describe115Error } = await import(
      '../../../../../features/drive115/v2/errorCodes'
    );
    const message = describe115Error(error) || error?.message || '生成二维码失败';
    await toast(message, 'error');
    return { success: false, message, kind: 'error' };
  }
}

/**
 * 轮询一次扫码状态；若已确认则换取 token 并持久化
 */
export async function pollPkceAuthOnce(
  session: AuthSession,
  mode: Drive115AuthMode,
): Promise<PollAuthResult> {
  const { pollDrive115DeviceStatus, exchangeDrive115DeviceCode } = await import(
    '../../../../../features/drive115/v2/pkce'
  );
  const { describe115Error } = await import(
    '../../../../../features/drive115/v2/errorCodes'
  );
  const { getDrive115V2Service } = await import('../../../../../features/drive115/v2');

  try {
    const result = await pollDrive115DeviceStatus(session.uid, session.time, session.sign);

    if (result.state === 0) {
      return {
        done: true,
        message: result.msg || '二维码已失效，请重新生成',
        kind: 'error',
        continuePolling: false,
      };
    }

    if (result.status === 1) {
      return {
        done: false,
        message: result.msg || '已扫码，请在 115 客户端确认授权',
        kind: 'info',
        continuePolling: true,
      };
    }

    if (result.status === 2) {
      try {
        const token = await exchangeDrive115DeviceCode(session.uid, session.codeVerifier);
        const nowSec = Math.floor(Date.now() / 1000);
        const formPatch: Partial<Drive115SettingsFormState> = {
          v2AccessToken: (token.access_token || '').trim(),
          v2RefreshToken: (token.refresh_token || '').trim(),
          v2TokenExpiresAt: typeof token.expires_at === 'number' ? token.expires_at : null,
          v2RefreshTokenIssuedAtSec: nowSec,
          v2RefreshTokenStatus: 'valid',
          v2RefreshTokenLastError: undefined,
          v2RefreshTokenLastErrorCode: undefined,
          v2AccessTokenStatus: 'valid',
          v2AccessTokenLastError: undefined,
          v2AccessTokenLastErrorCode: undefined,
        };
        if (mode === 'self_app') {
          formPatch.v2ClientId = session.clientId;
        }

        await patchDrive115Storage(formPatch as Record<string, unknown>);

        let userInfo: Record<string, unknown> | null = null;
        try {
          const svc = getDrive115V2Service();
          const ui = await svc.fetchUserInfo(token.access_token);
          if (ui.success && ui.data) {
            userInfo = ui.data as any;
            formPatch.v2UserInfo = userInfo;
            formPatch.v2UserInfoExpired = false;
            await patchDrive115Storage({
              v2UserInfo: userInfo,
              v2UserInfoUpdatedAt: Date.now(),
              v2UserInfoExpired: false,
            });
          }
        } catch {
          /* 用户信息可选 */
        }

        await toast('115 授权成功，token 已保存', 'success');
        return {
          done: true,
          message: '授权成功，token 已保存',
          kind: 'success',
          formPatch,
          userInfo,
          continuePolling: false,
        };
      } catch (error: any) {
        const message = describe115Error(error) || error?.message || '换取 token 失败';
        await toast(message, 'error');
        return {
          done: true,
          message,
          kind: 'error',
          continuePolling: false,
        };
      }
    }

    return {
      done: false,
      message: result.msg || '等待扫码…',
      kind: 'info',
      continuePolling: true,
    };
  } catch (error: any) {
    const message = describe115Error(error) || error?.message || '轮询扫码状态失败';
    return {
      done: true,
      message,
      kind: 'error',
      continuePolling: false,
    };
  }
}

/**
 * 打开文件夹选择器（取消/关闭时返回 null）
 */
export async function chooseDownloadDir(
  currentCid: string,
): Promise<{ cid: string; name: string; path: string } | null> {
  return new Promise((resolve) => {
    void (async () => {
      let settled = false;
      const settle = (value: { cid: string; name: string; path: string } | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      try {
        const { openDrive115FolderPicker } = await import(
          '../../../../../dashboard/components/drive115FolderPicker'
        );
        openDrive115FolderPicker({
          initialCid: currentCid,
          onSelect: async (selection) => {
            settle(selection);
          },
        });

        // 遗留选择器在关闭时不回调 onSelect，需监听 DOM 移除
        const overlay = document.getElementById('drive115FolderPickerOverlay');
        if (!overlay) {
          settle(null);
          return;
        }
        const observer = new MutationObserver(() => {
          if (!document.getElementById('drive115FolderPickerOverlay')) {
            observer.disconnect();
            settle(null);
          }
        });
        observer.observe(document.body, { childList: true });
      } catch (err) {
        console.error('[Drive115Settings] open folder picker failed', err);
        await toast('打开文件夹选择器失败', 'error');
        settle(null);
      }
    })();
  });
}

export { toast };

export type Drive115LogsPanelData = {
  entries: Drive115LogViewEntry[];
  stats: Drive115LogStatsView;
  statsText: string;
  lines: string[];
};

/**
 * 加载 115 网盘日志面板数据（专用 storage key，不入 settings 主文档）
 */
export async function loadDrive115LogsPanel(limit = 100): Promise<Drive115LogsPanelData> {
  const logger = getDrive115AppLogger();
  const [rawLogs, rawStats] = await Promise.all([logger.getLogs(), logger.getLogStats()]);
  const entries = takeRecentDrive115Logs(
    (Array.isArray(rawLogs) ? rawLogs : []).map((item) => ({
      type: String((item as any)?.type || ''),
      videoId: (item as any)?.videoId ? String((item as any).videoId) : undefined,
      message: String((item as any)?.message || ''),
      timestamp: Number((item as any)?.timestamp || 0),
    })),
    limit,
  );
  const stats: Drive115LogStatsView = {
    total: Number((rawStats as any)?.total || 0),
    recent24h: Number((rawStats as any)?.recent24h || 0),
    byType: { ...((rawStats as any)?.byType || {}) },
  };
  return {
    entries,
    stats,
    statsText: formatDrive115LogStatsText(stats),
    lines: entries.map((e) => formatDrive115LogEntryText(e)),
  };
}

/**
 * 清空 115 网盘日志
 */
export async function clearDrive115LogsPanel(): Promise<void> {
  await getDrive115AppLogger().clearLogs();
}

/**
 * 导出 115 网盘日志为 JSON 下载
 */
export async function exportDrive115LogsPanel(): Promise<boolean> {
  try {
    const json = await getDrive115AppLogger().exportLogs();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `drive115-logs-${stamp}.json`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    await toast('日志已导出', 'success');
    return true;
  } catch (err) {
    console.error('[Drive115Settings] export logs failed', err);
    await toast('导出日志失败', 'error');
    return false;
  }
}

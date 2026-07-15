/**
 * @file Drive115SettingsPage.tsx
 * @description 115 网盘设置 React 全页
 * @module apps/dashboard/pages/settings/drive115
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../../ui/primitives/Button/Button';
import { Input } from '../../../../../ui/primitives/Input/Input';
import { SettingSection } from '../../../../../ui/patterns/SettingSection/SettingSection';
import { SettingField } from '../../../../../ui/patterns/SettingField/SettingField';
import { SettingSelect } from '../../../../../ui/patterns/SettingSelect/SettingSelect';
import { SettingToggleRow } from '../../../../../ui/patterns/SettingToggleRow/SettingToggleRow';
import { SettingsPageFrame } from '../shared/settingsPageFrame';
import {
  getSettings,
  useDebouncedSettingsSave,
} from '../shared/settingsPersist';
import {
  chooseDownloadDir,
  copyOpenlistManualUrl,
  manualRefreshAccessToken,
  openOpenlistManualUrl,
  persistDrive115Form,
  pollPkceAuthOnce,
  startPkceAuth,
  toast,
  validateDrive115Token,
  type AuthSession,
  type AuthStatusKind,
} from './drive115SettingsActions';
import {
  computeNextAutoRefreshAt,
  countRefreshIn2h,
  DEFAULT_DRIVE115_SETTINGS_FORM,
  DRIVE115_AUTH_MODE_OPTIONS,
  extractUserInfoDisplay,
  formatDrive115DateTime,
  getAccessTokenExpiryLabel,
  getAccessTokenStatusLabel,
  getRefreshTokenStatusLabel,
  mapSettingsToDrive115Form,
  OPENLIST_MANUAL_URL,
  type Drive115AuthMode,
  type Drive115SettingsFormState,
} from './drive115SettingsModel';

const AUTO_SAVE_MS = 1000;

function statusToneClass(tone: 'ok' | 'warn' | 'error' | 'muted'): string {
  if (tone === 'ok') return 'text-[var(--color-success,#27ae60)]';
  if (tone === 'warn') return 'text-[var(--color-warning,#d68910)]';
  if (tone === 'error') return 'text-[var(--color-danger,#c0392b)]';
  return 'text-[var(--color-fg-muted)]';
}

function authKindClass(kind: AuthStatusKind): string {
  if (kind === 'success') return 'bg-[var(--color-success,#27ae60)]/10 text-[var(--color-success,#27ae60)]';
  if (kind === 'error') return 'bg-[var(--color-danger,#c0392b)]/10 text-[var(--color-danger,#c0392b)]';
  if (kind === 'info') return 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]';
  return 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]';
}

/**
 * 115 网盘设置完整页面
 */
export function Drive115SettingsPage() {
  const [form, setForm] = useState<Drive115SettingsFormState>(DEFAULT_DRIVE115_SETTINGS_FORM);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [userInfoStatus, setUserInfoStatus] = useState<{
    message: string;
    kind: 'ok' | 'error' | 'info';
  }>({ message: '等待验证', kind: 'info' });
  const [validating, setValidating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ message: string; kind: AuthStatusKind }>({
    message: '未开始授权',
    kind: 'idle',
  });
  const [authQrUrl, setAuthQrUrl] = useState('');
  const [authDeviceMeta, setAuthDeviceMeta] = useState('');
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  const formRef = useRef(form);
  formRef.current = form;
  const authSessionRef = useRef<AuthSession | null>(null);
  const authPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveToastAt = useRef(0);

  const persist = useCallback(async (nextForm: Drive115SettingsFormState) => {
    try {
      await persistDrive115Form(nextForm);
      setSaveError(null);
      const now = Date.now();
      if (!lastSaveToastAt.current || now - lastSaveToastAt.current > 3000) {
        lastSaveToastAt.current = now;
        await toast('设置已保存', 'success');
      }
    } catch (err) {
      console.error('[Drive115SettingsPage] save failed', err);
      setSaveError(err instanceof Error ? err.message : '保存失败');
      await toast('保存设置失败', 'error');
    }
  }, []);

  const { scheduleSave, flush } = useDebouncedSettingsSave({
    delayMs: AUTO_SAVE_MS,
    persist,
  });

  const clearAuthPolling = useCallback(() => {
    if (authPollTimerRef.current) {
      clearTimeout(authPollTimerRef.current);
      authPollTimerRef.current = null;
    }
  }, []);

  const resetAuthUi = useCallback(
    (options?: { keepQr?: boolean; keepStatus?: boolean }) => {
      clearAuthPolling();
      authSessionRef.current = null;
      if (!options?.keepQr) {
        setAuthQrUrl('');
        setAuthDeviceMeta('');
      }
      if (!options?.keepStatus) {
        setAuthStatus({ message: '未开始授权', kind: 'idle' });
      }
    },
    [clearAuthPolling],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        if (cancelled) return;
        const next = mapSettingsToDrive115Form(settings);
        setForm(next);
        if (next.v2UserInfo) {
          setUserInfoStatus({
            message: next.v2UserInfoExpired ? '已过期（缓存）' : '已缓存',
            kind: 'info',
          });
        }
      } catch (err) {
        console.error('[Drive115SettingsPage] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      clearAuthPolling();
    };
  }, [clearAuthPolling]);

  // access_token 到期倒计时
  useEffect(() => {
    if (!form.v2TokenExpiresAt) return;
    const timer = window.setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [form.v2TokenExpiresAt]);

  // storage 同步（外部刷新 token 时跟随 UI）
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== 'local' || !changes.settings) return;
      const newVal = changes.settings.newValue || {};
      const mapped = mapSettingsToDrive115Form(newVal);
      setForm((prev) => {
        // 若用户正在编辑且内容相同则跳过
        if (
          prev.v2AccessToken === mapped.v2AccessToken &&
          prev.v2RefreshToken === mapped.v2RefreshToken &&
          prev.v2TokenExpiresAt === mapped.v2TokenExpiresAt &&
          prev.enabled === mapped.enabled &&
          prev.v2AuthMode === mapped.v2AuthMode &&
          prev.v2ClientId === mapped.v2ClientId
        ) {
          return prev;
        }
        return { ...prev, ...mapped };
      });
    };
    chrome.storage.onChanged.addListener(handler);
    return () => {
      try {
        chrome.storage.onChanged.removeListener(handler);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const disabled = !form.enabled;

  const update = useCallback(
    <K extends keyof Drive115SettingsFormState>(
      key: K,
      value: Drive115SettingsFormState[K],
      options?: { immediate?: boolean },
    ) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (options?.immediate) {
          void flush(next);
        } else {
          scheduleSave(next);
        }
        return next;
      });
    },
    [flush, scheduleSave],
  );

  const patchForm = useCallback(
    (patch: Partial<Drive115SettingsFormState>, options?: { save?: boolean; immediate?: boolean }) => {
      setForm((prev) => {
        const next = { ...prev, ...patch };
        if (options?.save !== false) {
          if (options?.immediate) void flush(next);
          else scheduleSave(next);
        }
        return next;
      });
    },
    [flush, scheduleSave],
  );

  const onEnabledChange = async (checked: boolean) => {
    const previous = form;
    const next = { ...form, enabled: checked };
    setForm(next);
    try {
      await persistDrive115Form(next);
      await toast(`115 离线下载已${checked ? '启用' : '禁用'}`, 'success');
    } catch (err) {
      console.error('[Drive115SettingsPage] toggle enabled failed', err);
      setForm(previous);
      await toast('保存设置失败', 'error');
    }
  };

  const onAuthModeChange = async (value: string) => {
    const mode: Drive115AuthMode =
      value === 'self_app' ? 'self_app' : value === 'openlist_scan' ? 'openlist_scan' : 'openlist_manual';
    if (mode === 'openlist_manual') {
      resetAuthUi();
    }
    patchForm({ v2AuthMode: mode }, { immediate: true });
  };

  const runPollLoop = useCallback(
    async (session: AuthSession, mode: Drive115AuthMode) => {
      const result = await pollPkceAuthOnce(session, mode);
      if (authSessionRef.current?.uid !== session.uid) return;

      setAuthStatus({ message: result.message, kind: result.kind });

      if (result.formPatch) {
        setForm((prev) => ({ ...prev, ...result.formPatch }));
      }
      if (result.userInfo) {
        setUserInfoStatus({ message: '账号信息已更新', kind: 'ok' });
      } else if (result.kind === 'success') {
        setUserInfoStatus({ message: 'token 已保存，账号信息待刷新', kind: 'info' });
      }

      if (result.continuePolling) {
        authPollTimerRef.current = setTimeout(() => {
          void runPollLoop(session, mode);
        }, 1500);
        return;
      }

      if (result.done) {
        if (result.kind === 'success') {
          resetAuthUi({ keepQr: true, keepStatus: true });
        } else {
          clearAuthPolling();
          authSessionRef.current = null;
        }
      }
    },
    [clearAuthPolling, resetAuthUi],
  );

  const onStartAuth = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthStatus({ message: '正在生成二维码…', kind: 'info' });
    setAuthQrUrl('');
    setAuthDeviceMeta('');
    clearAuthPolling();
    try {
      const result = await startPkceAuth(formRef.current.v2AuthMode, formRef.current);
      setAuthStatus({ message: result.message, kind: result.kind });
      if (!result.success || !result.session) return;
      authSessionRef.current = result.session;
      setAuthQrUrl(result.qrImageUrl || '');
      setAuthDeviceMeta(result.deviceMeta || '');
      void runPollLoop(result.session, formRef.current.v2AuthMode);
    } finally {
      setAuthBusy(false);
    }
  };

  const onCancelAuth = () => {
    resetAuthUi();
  };

  const onValidateToken = async () => {
    if (validating) return;
    setValidating(true);
    setUserInfoStatus({ message: '获取用户信息中…', kind: 'info' });
    try {
      const result = await validateDrive115Token(formRef.current);
      if (result.success) {
        if (result.formPatch) {
          setForm((prev) => ({ ...prev, ...result.formPatch }));
        }
        setUserInfoStatus({ message: result.message, kind: 'ok' });
      } else {
        setUserInfoStatus({ message: result.message, kind: 'error' });
      }
    } finally {
      setValidating(false);
    }
  };

  const onManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setUserInfoStatus({ message: '刷新中…', kind: 'info' });
    try {
      const result = await manualRefreshAccessToken(formRef.current);
      if (result.success) {
        if (result.formPatch) {
          setForm((prev) => ({ ...prev, ...result.formPatch }));
        }
        setUserInfoStatus({ message: result.message, kind: 'ok' });
      } else {
        setUserInfoStatus({ message: result.message, kind: 'error' });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const onChooseDir = async () => {
    const selection = await chooseDownloadDir(formRef.current.downloadDir);
    if (!selection) return;
    const next = {
      ...formRef.current,
      downloadDir: selection.cid,
      downloadDirName: selection.name,
      downloadDirPath: selection.path,
    };
    setForm(next);
    await flush(next);
    await toast(`已选择目录：${selection.path}`, 'success');
  };

  const refreshTokenLabel = useMemo(
    () => getRefreshTokenStatusLabel(form, nowSec),
    [form, nowSec],
  );
  const accessExpiry = useMemo(
    () => getAccessTokenExpiryLabel(form, nowSec),
    [form, nowSec],
  );
  const accessStatus = useMemo(() => getAccessTokenStatusLabel(form), [form]);
  const userDisplay = useMemo(
    () => extractUserInfoDisplay(form.v2UserInfo),
    [form.v2UserInfo],
  );
  const nextRefreshAt = useMemo(() => computeNextAutoRefreshAt(form), [form]);
  const refresh2hCount = useMemo(
    () => countRefreshIn2h(form.v2TokenRefreshHistorySec, nowSec),
    [form.v2TokenRefreshHistorySec, nowSec],
  );

  const showOpenlistManual = form.v2AuthMode === 'openlist_manual';
  const showScanPanel =
    form.v2AuthMode === 'self_app' || form.v2AuthMode === 'openlist_scan';
  const showClientId = form.v2AuthMode === 'self_app';
  const showOpenlistScanHint = form.v2AuthMode === 'openlist_scan';

  return (
    <SettingsPageFrame
      title="115 网盘离线下载"
      description="配置 115 网盘离线下载、扫码授权与任务验证能力。"
      rootDataAttrs={{ 'data-drive115-settings-react': '1' }}
    >
      {loading ? (
        <p className="m-0 text-[13px] text-[var(--color-fg-muted)]">加载中…</p>
      ) : (
        <div className="flex flex-col gap-4" id="drive115-settings">
          {saveError ? (
            <p className="m-0 rounded-[var(--radius-2)] border border-[var(--color-danger,#c0392b)]/40 bg-[var(--color-surface-2)] px-3 py-2 text-[12.5px] text-[var(--color-danger,#c0392b)]">
              保存失败：{saveError}
            </p>
          ) : null}

          <SettingSection title="模式与接口">
            <SettingToggleRow
              id="drive115Enabled"
              label="启用 115 离线下载"
              description="支持三种入口：借用 OpenList 手动获取、借用 OpenList 扫码、或使用自有 115 应用扫码授权。"
              checked={form.enabled}
              onChange={(v) => void onEnabledChange(v)}
            />

            <SettingField
              id="drive115V2AuthMode"
              label="获取方式"
              description="推荐没有 115 开放平台应用的用户先用 OpenList 方案；切换这里只影响上方授权区，不影响下方 token 手动填写。"
            >
              <SettingSelect
                id="drive115V2AuthMode"
                disabled={disabled}
                value={form.v2AuthMode}
                options={[...DRIVE115_AUTH_MODE_OPTIONS]}
                onChange={(v) => void onAuthModeChange(v)}
              />
            </SettingField>

            <SettingField
              id="drive115V2ApiBaseUrl"
              label="接口域名（v2）"
              description="可自定义 v2 接口基础域名，默认 https://proapi.115.com，无需以斜杠结尾。"
            >
              <Input
                id="drive115V2ApiBaseUrl"
                type="text"
                disabled={disabled}
                placeholder="例如：https://proapi.115.com"
                value={form.v2ApiBaseUrl}
                onChange={(e) => update('v2ApiBaseUrl', e.currentTarget.value)}
              />
            </SettingField>
          </SettingSection>

          {showOpenlistManual ? (
            <SettingSection title="OpenList 手动获取" id="drive115V2OpenlistPanel">
              <div className="flex flex-col gap-3 px-2 py-2 text-[13px] text-[var(--color-fg)]">
                <p className="m-0 text-[12.5px] text-[var(--color-fg-muted)]">
                  适合没有自有 115 开放平台应用的用户。先通过 OpenList 的相关工具拿到
                  <code className="mx-1">refresh_token</code> /
                  <code className="mx-1">access_token</code>
                  ，再粘贴到下方“凭据与状态”区域。
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-[var(--color-fg-muted)]">获取地址</div>
                    <code
                      id="drive115V2OpenlistManualUrl"
                      className="block break-all text-[13px]"
                    >
                      {OPENLIST_MANUAL_URL}
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      id="drive115V2OpenlistManualOpen"
                      variant="secondary"
                      disabled={disabled}
                      onClick={() => openOpenlistManualUrl()}
                    >
                      前往获取
                    </Button>
                    <Button
                      id="drive115V2OpenlistManualCopy"
                      variant="secondary"
                      disabled={disabled}
                      onClick={() => void copyOpenlistManualUrl()}
                    >
                      复制地址
                    </Button>
                  </div>
                </div>
                <ol className="m-0 list-decimal space-y-1 pl-5 text-[12.5px] text-[var(--color-fg-muted)]">
                  <li>
                    打开上方地址后，选择 <code>115 网盘 (OAuth2)</code>。
                  </li>
                  <li>按页面提示跳转并登录 115 账号。</li>
                  <li>
                    勾选 <code>使用 OpenList 提供的参数</code>，再获取 token。
                  </li>
                  <li>
                    把得到的 <code>refresh_token</code> 和 <code>access_token</code> 粘贴到下方。
                  </li>
                  <li>点击“验证有效性”，确认当前 token 可用。</li>
                </ol>
              </div>
            </SettingSection>
          ) : null}

          {showScanPanel ? (
            <SettingSection title="扫码授权（PKCE）" id="drive115V2SelfAppPanel">
              {showClientId ? (
                <SettingField id="drive115V2ClientId" label="APP ID">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="drive115V2ClientId"
                      className="min-w-0 flex-1"
                      disabled={disabled}
                      placeholder="请输入 115 开放平台 APP ID"
                      value={form.v2ClientId}
                      onChange={(e) => update('v2ClientId', e.currentTarget.value)}
                    />
                    <Button
                      id="drive115V2StartAuth"
                      variant="primary"
                      disabled={disabled || authBusy}
                      onClick={() => void onStartAuth()}
                    >
                      {authBusy ? '生成中…' : '生成二维码'}
                    </Button>
                    <Button
                      id="drive115V2CancelAuth"
                      variant="secondary"
                      disabled={disabled}
                      onClick={onCancelAuth}
                    >
                      取消授权
                    </Button>
                  </div>
                </SettingField>
              ) : null}

              {showOpenlistScanHint ? (
                <>
                  <p
                    id="drive115V2OpenlistScanHint"
                    className="m-0 px-2 text-[12.5px] text-[var(--color-fg-muted)]"
                  >
                    当前使用内置 OpenList APP ID 进行扫码授权，无需手动填写。
                  </p>
                  <div className="flex flex-wrap gap-2 px-2 py-2">
                    <Button
                      id="drive115V2StartAuthShared"
                      variant="primary"
                      disabled={disabled || authBusy}
                      onClick={() => void onStartAuth()}
                    >
                      {authBusy ? '生成中…' : '生成二维码'}
                    </Button>
                    <Button
                      id="drive115V2CancelAuthShared"
                      variant="secondary"
                      disabled={disabled}
                      onClick={onCancelAuth}
                    >
                      取消授权
                    </Button>
                  </div>
                </>
              ) : null}

              <p id="drive115V2AuthFlowDesc" className="m-0 px-2 text-[12.5px] text-[var(--color-fg-muted)]">
                {form.v2AuthMode === 'openlist_scan'
                  ? '流程：使用内置 OpenList APP ID → 生成二维码 → 用 115 手机客户端扫码并确认 → 自动保存新 token。'
                  : '流程：输入 APP ID → 生成二维码 → 用 115 手机客户端扫码并确认 → 自动保存新 token。'}
              </p>

              <div
                id="drive115V2AuthPanel"
                className="mx-2 mb-2 flex flex-wrap gap-4 rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
              >
                <div className="flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  {authQrUrl ? (
                    <img
                      id="drive115V2QrImage"
                      src={authQrUrl}
                      alt="115 扫码授权二维码"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div
                      id="drive115V2QrPlaceholder"
                      className="px-3 text-center text-[12px] text-[var(--color-fg-muted)]"
                    >
                      点击“生成二维码”开始授权
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    id="drive115V2AuthStatus"
                    className={`mb-2 inline-block rounded-[var(--radius-2)] px-2 py-1 text-[12.5px] ${authKindClass(authStatus.kind)}`}
                  >
                    {authStatus.message}
                  </div>
                  <div
                    id="drive115V2DeviceCodeMeta"
                    className="mb-2 text-[12px] text-[var(--color-fg-muted)]"
                  >
                    {authDeviceMeta}
                  </div>
                  <ul className="m-0 list-disc space-y-1 pl-4 text-[12px] text-[var(--color-fg-muted)]">
                    <li>PKCE 模式不需要 App Secret。</li>
                    <li>二维码失效后重新生成即可。</li>
                    <li>refresh_token 会用于后续自动刷新 access_token。</li>
                  </ul>
                </div>
              </div>
            </SettingSection>
          ) : null}

          <SettingSection
            title="凭据与状态"
            description="无论当前选择哪种获取方式，下面的 refresh_token 和 access_token 都可以手动输入或覆盖。"
          >
            <SettingField id="drive115V2RefreshToken" label="refresh_token">
              <p
                id="drive115V2RefreshTokenStatusRow"
                className="m-0 mb-1 text-[12.5px] text-[var(--color-fg-muted)]"
              >
                状态：
                <span
                  id="drive115V2RefreshTokenStatus"
                  className={`ml-1 rounded px-2 py-0.5 text-[11px] ${statusToneClass(refreshTokenLabel.tone)}`}
                  title={refreshTokenLabel.title}
                >
                  {refreshTokenLabel.text}
                </span>
              </p>
              <textarea
                id="drive115V2RefreshToken"
                rows={3}
                disabled={disabled}
                placeholder="粘贴 refresh_token"
                className="min-h-[4.5rem] w-full resize-y break-all rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[12.5px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] disabled:cursor-not-allowed disabled:opacity-50"
                value={form.v2RefreshToken}
                onChange={(e) => {
                  const trimmed = e.currentTarget.value;
                  const now = Math.floor(Date.now() / 1000);
                  patchForm({
                    v2RefreshToken: trimmed,
                    v2RefreshTokenIssuedAtSec: trimmed.trim() ? now : null,
                    v2RefreshTokenStatus: 'unknown',
                    v2RefreshTokenLastError: undefined,
                    v2RefreshTokenLastErrorCode: undefined,
                  });
                }}
              />
            </SettingField>

            <SettingField id="drive115V2AccessToken" label="access_token">
              <p className="m-0 mb-1 text-[12.5px] text-[var(--color-fg-muted)]">
                状态：
                <span
                  id="drive115V2TokenExpiry"
                  className={`ml-1 ${statusToneClass(accessExpiry.tone)}`}
                  title={
                    form.v2TokenExpiresAt
                      ? formatDrive115DateTime(form.v2TokenExpiresAt)
                      : ''
                  }
                >
                  {accessExpiry.text}
                </span>
                {accessStatus ? (
                  <span
                    id="drive115V2AccessTokenStatus"
                    className={`ml-2 rounded px-2 py-0.5 text-[11px] ${statusToneClass(accessStatus.tone)}`}
                  >
                    {accessStatus.text}
                  </span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                <textarea
                  id="drive115V2AccessToken"
                  rows={3}
                  disabled={disabled}
                  placeholder="粘贴 access_token"
                  className="min-h-[4.5rem] min-w-0 flex-1 resize-y break-all rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[12.5px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.v2AccessToken}
                  onChange={(e) => {
                    const trimmed = e.currentTarget.value;
                    patchForm({
                      v2AccessToken: trimmed,
                      v2TokenExpiresAt: trimmed.trim() ? form.v2TokenExpiresAt : null,
                      v2AccessTokenStatus: 'unknown',
                      v2AccessTokenLastError: undefined,
                      v2AccessTokenLastErrorCode: undefined,
                      v2UserInfoExpired: false,
                    });
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    id="drive115V2ValidateToken"
                    variant="primary"
                    disabled={disabled || validating}
                    onClick={() => void onValidateToken()}
                  >
                    {validating ? '验证中…' : '验证有效性'}
                  </Button>
                  <Button
                    id="drive115V2ManualRefresh"
                    variant="secondary"
                    disabled={disabled || refreshing}
                    onClick={() => void onManualRefresh()}
                  >
                    {refreshing ? '刷新中…' : '手动刷新 access_token'}
                  </Button>
                </div>
              </div>
              <p className="m-0 mt-1 text-[12px] text-[var(--color-fg-muted)]">
                这里保留手动粘贴作为备用方案；正常情况下建议优先使用上方扫码授权。手动刷新会直接调用
                115 官方 <code>refreshToken</code> 接口。
              </p>
            </SettingField>

            <div className="px-2 py-2">
              <div className="mb-1 text-[13.5px] font-semibold text-[var(--color-fg)]">
                账号信息
              </div>
              <p
                id="drive115V2UserInfoStatus"
                className={`m-0 mb-2 text-[12.5px] ${
                  userInfoStatus.kind === 'ok'
                    ? 'text-[var(--color-success,#27ae60)]'
                    : userInfoStatus.kind === 'error'
                      ? 'text-[var(--color-danger,#c0392b)]'
                      : 'text-[var(--color-fg-muted)]'
                }`}
                data-kind={userInfoStatus.kind}
              >
                {userInfoStatus.message}
              </p>
              <div
                id="drive115V2UserInfoBox"
                className="rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
              >
                {userDisplay ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      {userDisplay.avatar ? (
                        <img
                          src={userDisplay.avatar}
                          alt="avatar"
                          className="h-12 w-12 rounded-full object-cover shadow-sm"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-[var(--color-fg)]">
                            {userDisplay.name}
                          </span>
                          {userDisplay.isVip ? (
                            <span className="rounded-full bg-[linear-gradient(135deg,#f2b01e,#e89f0e)] px-2 py-0.5 text-[11px] text-white">
                              {userDisplay.vipLevelName || 'VIP'}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[var(--color-fg-muted)]">
                          UID: {userDisplay.uid}
                          {userDisplay.vipExpireText
                            ? ` · 到期：${userDisplay.vipExpireText}`
                            : ''}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="h-2 overflow-hidden rounded bg-[var(--color-surface)]">
                        <div
                          className="h-full bg-[linear-gradient(90deg,#42a5f5,#1e88e5)]"
                          style={{ width: `${userDisplay.percent}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-[12px] text-[var(--color-fg-muted)]">
                        <span>已用：{userDisplay.usedText}</span>
                        <span>剩余：{userDisplay.freeText}</span>
                        <span>总计：{userDisplay.totalText}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[12.5px] text-[var(--color-fg-muted)]">
                    授权成功后会在这里显示账号、VIP 和空间信息。
                  </div>
                )}
              </div>
            </div>

            <SettingToggleRow
              id="drive115V2AutoRefresh"
              label="自动刷新 access_token"
              description="开启后，当 access_token 过期或即将在指定秒数内过期时，将自动使用 refresh_token 刷新并保存。"
              checked={form.v2AutoRefresh}
              disabled={disabled}
              onChange={(v) => update('v2AutoRefresh', v)}
            />

            <SettingField
              id="drive115V2AutoRefreshSkewSec"
              label="提前刷新(秒)"
              description="在 token 到期前提前多少秒触发自动刷新。"
            >
              <Input
                id="drive115V2AutoRefreshSkewSec"
                type="number"
                min={0}
                step={1}
                disabled={disabled}
                value={String(form.v2AutoRefreshSkewSec)}
                onChange={(e) => {
                  const n = Math.max(0, Math.floor(Number(e.currentTarget.value) || 0));
                  update('v2AutoRefreshSkewSec', n);
                }}
              />
            </SettingField>

            <SettingField
              id="drive115V2MinRefreshIntervalMin"
              label="最小自动刷新间隔(分钟)"
              description="范围 60-120。2 小时自动刷新上限固定为 3 次。"
            >
              <Input
                id="drive115V2MinRefreshIntervalMin"
                type="number"
                min={60}
                max={120}
                step={1}
                disabled={disabled}
                value={String(form.v2MinRefreshIntervalMin)}
                onChange={(e) => {
                  const raw = Math.floor(Number(e.currentTarget.value) || 60);
                  const n = Math.min(120, Math.max(60, raw));
                  update('v2MinRefreshIntervalMin', n);
                }}
              />
            </SettingField>

            <div
              id="drive115V2RefreshInfoBlock"
              className="mx-2 mb-2 space-y-1 text-[12px] text-[var(--color-fg-muted)]"
            >
              <div>
                最近自动刷新时间：
                <span id="drive115V2LastRefreshAt" className="text-[var(--color-fg)]">
                  {formatDrive115DateTime(form.v2LastTokenRefreshAtSec)}
                </span>
              </div>
              <div>
                下次自动刷新时间：
                <span id="drive115V2NextRefreshAt" className="text-[var(--color-fg)]">
                  {formatDrive115DateTime(nextRefreshAt)}
                </span>
              </div>
              <div>
                2小时内已刷新：
                <span id="drive115V2Refresh2hStat" className="text-[var(--color-fg)]">
                  {refresh2hCount}/3
                </span>
              </div>
            </div>
          </SettingSection>

          <SettingSection title="下载设置">
            <SettingField
              id="drive115DownloadDir"
              label="下载目录 ID"
              description="可手动填写目录 ID，也可通过文件夹选择器快速选择。"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="drive115DownloadDir"
                  className="min-w-0 flex-1"
                  disabled={disabled}
                  placeholder="请输入目录 ID（cid），例如：123456789"
                  value={form.downloadDir}
                  onChange={(e) => {
                    patchForm({
                      downloadDir: e.currentTarget.value,
                      downloadDirName: '',
                      downloadDirPath: '',
                    });
                  }}
                />
                <Button
                  id="drive115ChooseDownloadDir"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => void onChooseDir()}
                >
                  选择文件夹
                </Button>
              </div>
              {form.downloadDirName || form.downloadDirPath ? (
                <div
                  id="drive115DownloadDirSummary"
                  className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--color-fg-muted)]"
                  title={form.downloadDirPath || form.downloadDirName}
                >
                  <span>{form.downloadDirName || form.downloadDirPath}</span>
                  {form.downloadDir ? (
                    <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[11px]">
                      {form.downloadDir}
                    </code>
                  ) : null}
                </div>
              ) : null}
            </SettingField>

            <div className="grid gap-2 sm:grid-cols-2">
              <SettingField
                id="drive115VerifyCount"
                label="验证次数"
                description="下载后验证文件的重试次数，建议 3-5 次。"
              >
                <Input
                  id="drive115VerifyCount"
                  type="number"
                  min={1}
                  max={20}
                  disabled={disabled}
                  value={String(form.verifyCount)}
                  onChange={(e) => {
                    const n = Math.max(1, Math.floor(Number(e.currentTarget.value) || 1));
                    update('verifyCount', n);
                  }}
                />
              </SettingField>

              <SettingField
                id="drive115MaxFailures"
                label="最大失败数"
                description="批量下载时允许的最大失败次数，0 表示不限制。"
              >
                <Input
                  id="drive115MaxFailures"
                  type="number"
                  min={0}
                  max={50}
                  disabled={disabled}
                  value={String(form.maxFailures)}
                  onChange={(e) => {
                    const n = Math.max(0, Math.floor(Number(e.currentTarget.value) || 0));
                    update('maxFailures', n);
                  }}
                />
              </SettingField>
            </div>
          </SettingSection>
        </div>
      )}
    </SettingsPageFrame>
  );
}

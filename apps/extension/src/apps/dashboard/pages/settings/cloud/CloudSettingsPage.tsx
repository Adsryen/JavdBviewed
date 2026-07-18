/**
 * @file CloudSettingsPage.tsx
 * @description Cloud 多端同步设置页：状态总览、连接、登录、同步结果、设备
 * @module apps/dashboard/pages/settings/cloud
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DeviceInfo } from '@javdb/sync-protocol';
import { Badge } from '../../../../../ui/primitives/Badge/Badge';
import { Button } from '../../../../../ui/primitives/Button/Button';
import { Input } from '../../../../../ui/primitives/Input/Input';
import { SettingSection } from '../../../../../ui/patterns/SettingSection/SettingSection';
import { SettingField } from '../../../../../ui/patterns/SettingField/SettingField';
import { SettingsPageFrame } from '../shared/settingsPageFrame';
import {
  createExtensionCloudClient,
  formatTypeCounts,
  humanizeCloudError,
  loadCloudAutoSyncSettings,
  loadCloudSession,
  loadCloudSettings,
  normalizeCloudBaseUrl,
  runCloudSyncNow,
  saveCloudAutoSyncSettings,
  saveCloudSettings,
  type CloudAutoSyncSettings,
  type CloudConnectionSettings,
  type CloudSessionRecord,
  type CloudSyncNowResult,
  type TypeCountMap,
} from '../../../../../features/cloudSync';

type StatusTone = 'idle' | 'ok' | 'err' | 'busy';
type HealthState = 'unknown' | 'ok' | 'err' | 'checking';

type SyncReport = CloudSyncNowResult & {
  finishedAt: number;
};

/**
 * Cloud 同步设置完整页面
 */
export function CloudSettingsPage() {
  const [settings, setSettings] = useState<CloudConnectionSettings | null>(null);
  const [baseUrlDraft, setBaseUrlDraft] = useState('');
  const [deviceLabelDraft, setDeviceLabelDraft] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<CloudSessionRecord | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [healthState, setHealthState] = useState<HealthState>('unknown');
  const [healthDetail, setHealthDetail] = useState('尚未检测');
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<StatusTone>('idle');
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [showDeviceId, setShowDeviceId] = useState(false);
  const [autoSync, setAutoSync] = useState<CloudAutoSyncSettings>({
    enabled: true,
    intervalMinutes: 30,
    updatedAt: 0,
  });

  const busy = busyAction != null;
  const loggedIn = Boolean(session?.accessToken);

  const refreshSession = useCallback(async () => {
    setSession(await loadCloudSession());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, auto] = await Promise.all([loadCloudSettings(), loadCloudAutoSyncSettings()]);
        if (cancelled) return;
        setSettings(s);
        setBaseUrlDraft(s.baseUrl);
        setDeviceLabelDraft(s.deviceLabel);
        setAutoSync(auto);
        await refreshSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  // 进入页面且已登录时自动刷设备
  useEffect(() => {
    if (loading || !loggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const { api } = await createExtensionCloudClient();
        const list = await api.listDevices();
        if (!cancelled) setDevices(list);
      } catch {
        // 静默：可能 token 过期，用户可重登
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, loggedIn, session?.accessToken]);

  const setStatus = (text: string, next: StatusTone) => {
    setMessage(text);
    setTone(next);
  };

  const withBusy = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  };

  const persistConnection = async () => {
    const baseUrl = normalizeCloudBaseUrl(baseUrlDraft);
    if (!baseUrl) {
      setStatus('请填写有效的 Cloud 地址', 'err');
      return null;
    }
    const next = await saveCloudSettings({
      baseUrl,
      deviceLabel: deviceLabelDraft.trim() || '浏览器扩展',
    });
    setSettings(next);
    setBaseUrlDraft(next.baseUrl);
    setDeviceLabelDraft(next.deviceLabel);
    return next;
  };

  const onProbeHealth = () =>
    withBusy('health', async () => {
      setHealthState('checking');
      try {
        const saved = await persistConnection();
        if (!saved) {
          setHealthState('err');
          return;
        }
        const url = `${saved.baseUrl}/health`;
        const res = await fetch(url);
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          protocolVersion?: number;
        };
        if (!res.ok || !data.ok) {
          setHealthState('err');
          setHealthDetail(`异常 · HTTP ${res.status}`);
          setStatus('健康检查失败，请确认服务已启动', 'err');
          return;
        }
        setHealthState('ok');
        setHealthDetail(`正常 · 协议 v${data.protocolVersion ?? '?'}`);
        setStatus('已连通 Cloud 服务', 'ok');
      } catch (e) {
        setHealthState('err');
        setHealthDetail('无法连接');
        setStatus(humanizeCloudError(e), 'err');
      }
    });

  const onRegister = () =>
    withBusy('register', async () => {
      try {
        const saved = await persistConnection();
        if (!saved) return;
        if (!identifier.trim() || !password) {
          setStatus('请填写账号与密码', 'err');
          return;
        }
        const { api } = await createExtensionCloudClient(saved);
        await api.register({ identifier: identifier.trim(), password });
        setStatus('注册成功，请点击登录', 'ok');
      } catch (e) {
        setStatus(humanizeCloudError(e), 'err');
      }
    });

  const onLogin = () =>
    withBusy('login', async () => {
      try {
        const saved = await persistConnection();
        if (!saved) return;
        if (!identifier.trim() || !password) {
          setStatus('请填写账号与密码', 'err');
          return;
        }
        const { api } = await createExtensionCloudClient(saved);
        const res = await api.login({
          identifier: identifier.trim(),
          password,
          device: {
            id: saved.deviceId,
            label: saved.deviceLabel,
            clientType: 'extension',
            platform: navigator.userAgent.slice(0, 120),
          },
        });
        await refreshSession();
        setPassword('');
        setStatus('登录成功，可以开始同步', 'ok');
        try {
          setDevices(await api.listDevices());
        } catch {
          setDevices([]);
        }
        void res;
      } catch (e) {
        setStatus(humanizeCloudError(e), 'err');
      }
    });

  const onLogout = () =>
    withBusy('logout', async () => {
      try {
        const saved = settings ?? (await loadCloudSettings());
        const { api } = await createExtensionCloudClient(saved);
        await api.logout();
        await refreshSession();
        setDevices([]);
        setSyncReport(null);
        setStatus('已登出本机 Cloud 会话', 'ok');
      } catch (e) {
        try {
          const { api } = await createExtensionCloudClient();
          await api.tokens.clear();
        } catch {
          // ignore
        }
        await refreshSession();
        setDevices([]);
        setStatus(humanizeCloudError(e) + '（本机会话已清理）', 'err');
      }
    });

  const onRefreshDevices = () =>
    withBusy('devices', async () => {
      try {
        const { api } = await createExtensionCloudClient();
        const list = await api.listDevices();
        setDevices(list);
        setStatus(`设备列表已更新（${list.length} 台）`, 'ok');
      } catch (e) {
        setStatus(humanizeCloudError(e), 'err');
      }
    });

  const onSyncNow = () =>
    withBusy('sync', async () => {
      try {
        const result = await runCloudSyncNow();
        const report: SyncReport = { ...result, finishedAt: Date.now() };
        setSyncReport(report);
        // 权威文案来自服务端 message；失败码用 err 色
        const tone: StatusTone = result.code === 'SYNC_PARTIAL' ? 'ok' : 'ok';
        setStatus(result.message || `同步完成：↑${result.pushed} ↓${result.pulled}`, tone);
        try {
          const { api } = await createExtensionCloudClient();
          setDevices(await api.listDevices());
        } catch {
          // ignore
        }
      } catch (e) {
        setStatus(humanizeCloudError(e), 'err');
      }
    });

  const onToggleAutoSync = (enabled: boolean) =>
    withBusy('auto', async () => {
      const next = await saveCloudAutoSyncSettings({ enabled });
      setAutoSync(next);
      try {
        await chrome.runtime.sendMessage({ type: 'CLOUD_SYNC_SETUP_ALARM' });
      } catch {
        // ignore
      }
      setStatus(enabled ? '已开启自动同步（后台定时）' : '已关闭自动同步', 'ok');
    });

  const onChangeInterval = (minutes: number) =>
    withBusy('auto', async () => {
      const next = await saveCloudAutoSyncSettings({ intervalMinutes: minutes });
      setAutoSync(next);
      try {
        await chrome.runtime.sendMessage({ type: 'CLOUD_SYNC_SETUP_ALARM' });
      } catch {
        // ignore
      }
      setStatus(`自动同步间隔已设为 ${next.intervalMinutes} 分钟`, 'ok');
    });

  const connectionReady = useMemo(() => {
    return Boolean(normalizeCloudBaseUrl(baseUrlDraft));
  }, [baseUrlDraft]);

  if (loading || !settings) {
    return (
      <SettingsPageFrame
        title="Cloud 多端同步"
        description="连接自建 JavdBviewed-Cloud"
        rootDataAttrs={{ 'data-cloud-settings-react': '1' }}
      >
        <p className="text-sm text-[var(--color-fg-muted)]">加载中…</p>
      </SettingsPageFrame>
    );
  }

  return (
    <SettingsPageFrame
      title="Cloud 多端同步"
      description="多浏览器 / 多端共用的账号数据中枢。日志与本机缓存不同步。"
      rootDataAttrs={{ 'data-cloud-settings-react': '1' }}
    >
      {/* 状态总览 */}
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <StatusCard
          label="服务"
          badge={
            healthState === 'ok' ? (
              <Badge tone="success">在线</Badge>
            ) : healthState === 'err' ? (
              <Badge tone="danger">异常</Badge>
            ) : healthState === 'checking' ? (
              <Badge tone="info">检测中</Badge>
            ) : (
              <Badge tone="neutral">未检测</Badge>
            )
          }
          detail={healthDetail}
        />
        <StatusCard
          label="登录"
          badge={loggedIn ? <Badge tone="success">已登录</Badge> : <Badge tone="warning">未登录</Badge>}
          detail={
            loggedIn
              ? `设备 ${session?.deviceId?.slice(0, 8) ?? '—'}…`
              : '登录后可同步用户资产'
          }
        />
        <StatusCard
          label="上次同步"
          badge={
            syncReport ? (
              <Badge tone="primary">有记录</Badge>
            ) : (
              <Badge tone="neutral">尚无</Badge>
            )
          }
          detail={
            syncReport
              ? `↑${syncReport.pushed} ↓${syncReport.pulled} · ${formatTime(syncReport.finishedAt)}`
              : '点击下方「立即同步」'
          }
        />
      </div>

      <div className="mb-4 rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-fg-muted)]">
        <span className="font-semibold text-[var(--color-fg)]">同步范围：</span>
        视频状态、演员、清单、新作品与订阅、资料、搜索方案、部分显示/同步偏好。
        <span className="font-semibold text-[var(--color-fg)]"> 不同步：</span>
        运行/磁力日志、磁力缓存、Emby 本机库、遥测、会话与设备密钥明文。
        <span className="mt-1 block">
          <span className="font-semibold text-[var(--color-fg)]">WebDAV</span>
          仍是冷备份兜底，与 Cloud live 同步并存。
        </span>
      </div>

      {message ? (
        <div
          className={`mb-4 rounded-[var(--radius-2)] border px-3 py-2 text-[13px] ${
            tone === 'err'
              ? 'border-[var(--color-danger,#c0392b)]/30 bg-[var(--color-danger,#c0392b)]/8 text-[var(--color-danger,#c0392b)]'
              : tone === 'ok'
                ? 'border-[var(--color-success,#27ae60)]/30 bg-[var(--color-success,#27ae60)]/8 text-[var(--color-success,#27ae60)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)]'
          }`}
          role="status"
        >
          {busy ? (
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-current align-middle" />
          ) : null}
          {message}
        </div>
      ) : null}

      <SettingSection title="1. 连接服务" description="自建实例地址（容器/本机均可）">
        <div className="grid gap-1 sm:grid-cols-2">
          <SettingField id="cloud-base-url" label="Cloud 地址" description="例 http://127.0.0.1:8080">
            <Input
              id="cloud-base-url"
              value={baseUrlDraft}
              onChange={(e) => setBaseUrlDraft(e.target.value)}
              placeholder="http://127.0.0.1:8080"
              autoComplete="off"
              disabled={busy}
            />
          </SettingField>
          <SettingField id="cloud-device-label" label="本机设备名称" description="显示在设备列表里">
            <Input
              id="cloud-device-label"
              value={deviceLabelDraft}
              onChange={(e) => setDeviceLabelDraft(e.target.value)}
              placeholder="浏览器扩展"
              autoComplete="off"
              disabled={busy}
            />
          </SettingField>
        </div>
        <div className="mt-1 px-2">
          <button
            type="button"
            className="text-[12px] text-[var(--color-primary)] underline-offset-2 hover:underline"
            onClick={() => setShowDeviceId((v) => !v)}
          >
            {showDeviceId ? '隐藏设备 ID' : '显示设备 ID'}
          </button>
          {showDeviceId ? (
            <p className="mt-1 break-all font-mono text-[11px] text-[var(--color-fg-muted)]">
              {settings.deviceId}
            </p>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 px-2 pb-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !connectionReady}
            onClick={() =>
              void withBusy('save', async () => {
                const saved = await persistConnection();
                if (saved) setStatus('连接配置已保存', 'ok');
              })
            }
          >
            {busyAction === 'save' ? '保存中…' : '保存连接'}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy || !connectionReady}
            onClick={() => void onProbeHealth()}
          >
            {busyAction === 'health' ? '检测中…' : '测试连接'}
          </Button>
        </div>
      </SettingSection>

      <SettingSection
        title="2. 账号"
        description={loggedIn ? '已登录，可同步或换账号' : '使用引导管理员或自建账号登录'}
      >
        {loggedIn ? (
          <div className="space-y-3 px-2 pb-2">
            <p className="text-[13px] text-[var(--color-fg)]">
              当前会话有效 · 本机设备「{settings.deviceLabel}」
            </p>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void onLogout()}>
              {busyAction === 'logout' ? '退出中…' : '退出登录'}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-1 sm:grid-cols-2">
              <SettingField id="cloud-identifier" label="账号">
                <Input
                  id="cloud-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  disabled={busy}
                />
              </SettingField>
              <SettingField id="cloud-password" label="密码">
                <Input
                  id="cloud-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={busy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void onLogin();
                  }}
                />
              </SettingField>
            </div>
            <p className="mt-1 px-2 text-[12px] text-[var(--color-fg-muted)]">
              默认引导账号：<code className="text-[var(--color-fg)]">admin</code> /{' '}
              <code className="text-[var(--color-fg)]">javdbviewed</code>
              （可用服务端环境变量覆盖）
            </p>
            <div className="mt-3 flex flex-wrap gap-2 px-2 pb-2">
              <Button type="button" variant="primary" disabled={busy} onClick={() => void onLogin()}>
                {busyAction === 'login' ? '登录中…' : '登录'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void onRegister()}
              >
                {busyAction === 'register' ? '注册中…' : '注册新账号'}
              </Button>
            </div>
          </>
        )}
      </SettingSection>

      <SettingSection
        title="3. 同步用户资产"
        description="多端一致：扩展 / 桌面 / 手机共用同一账号数据（日志与缓存除外）"
      >
        <div className="flex flex-wrap items-center gap-2 px-2">
          <Button
            type="button"
            variant="primary"
            disabled={busy || !loggedIn}
            onClick={() => void onSyncNow()}
          >
            {busyAction === 'sync' ? '同步中…' : '立即同步'}
          </Button>
          {!loggedIn ? (
            <span className="text-[12.5px] text-[var(--color-warning)]">请先完成登录</span>
          ) : (
            <span className="text-[12.5px] text-[var(--color-fg-muted)]">
              本地改动会自动入队；空云首传不会清空本地
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[var(--color-fg)]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--color-primary)]"
              checked={autoSync.enabled}
              disabled={busy || !loggedIn}
              onChange={(e) => void onToggleAutoSync(e.target.checked)}
            />
            后台自动同步
          </label>
          <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-fg-muted)]">
            间隔
            <select
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[13px] text-[var(--color-fg)]"
              value={autoSync.intervalMinutes}
              disabled={busy || !loggedIn || !autoSync.enabled}
              onChange={(e) => void onChangeInterval(Number(e.target.value))}
            >
              <option value={15}>15 分钟</option>
              <option value={30}>30 分钟</option>
              <option value={60}>1 小时</option>
              <option value={180}>3 小时</option>
            </select>
          </label>
        </div>

        {syncReport ? (
          <SyncResultPanel report={syncReport} />
        ) : (
          <p className="mt-3 px-2 pb-2 text-[12.5px] text-[var(--color-fg-muted)]">
            同步后将在此显示：上传/下载条数、按类型明细（视频、演员、清单…）。
          </p>
        )}
      </SettingSection>

      <SettingSection title="4. 已登录设备" description="同一账号下的客户端列表">
        <div className="mb-2 flex flex-wrap gap-2 px-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !loggedIn}
            onClick={() => void onRefreshDevices()}
          >
            {busyAction === 'devices' ? '刷新中…' : '刷新列表'}
          </Button>
        </div>
        {!loggedIn ? (
          <p className="px-2 pb-2 text-[13px] text-[var(--color-fg-muted)]">登录后显示设备</p>
        ) : devices.length === 0 ? (
          <p className="px-2 pb-2 text-[13px] text-[var(--color-fg-muted)]">暂无设备数据</p>
        ) : (
          <ul className="space-y-2 px-2 pb-2">
            {devices.map((d) => {
              const isCurrent = d.id === settings.deviceId;
              return (
                <li
                  key={d.id}
                  className={`rounded-[var(--radius-2)] border px-3 py-2.5 text-[13px] ${
                    isCurrent
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft,#eef5ff)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 font-medium text-[var(--color-fg)]">
                    <span>{d.label || '未命名设备'}</span>
                    {isCurrent ? <Badge tone="primary">本机</Badge> : null}
                    <Badge tone="neutral">{d.clientType || 'client'}</Badge>
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--color-fg-muted)]">
                    {d.platform ? `${d.platform.slice(0, 64)}` : '无平台信息'}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SettingSection>
    </SettingsPageFrame>
  );
}

function StatusCard(props: {
  label: string;
  badge: ReactNode;
  detail: string;
}) {
  return (
    <div className="rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-[var(--color-fg-muted)]">{props.label}</span>
        {props.badge}
      </div>
      <p className="m-0 truncate text-[12.5px] text-[var(--color-fg)]" title={props.detail}>
        {props.detail}
      </p>
    </div>
  );
}

function SyncResultPanel({ report }: { report: SyncReport }) {
  // 权威类型分布：服务端 apply byType；本地库快照仅作辅助
  const serverByType: TypeCountMap = report.stats?.byType ?? {};
  const hasServerTypes = Object.keys(serverByType).length > 0;

  return (
    <div className="mx-2 mt-3 mb-2 rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-bg-muted,#f4f5f7)] p-3">
      <div className="mb-2 text-[13px] font-semibold text-[var(--color-fg)]">同步结果明细</div>
      {report.message ? (
        <p className="mt-0 mb-2 text-[12.5px] leading-relaxed text-[var(--color-fg)]">
          {report.message}
          {report.code ? (
            <span className="ml-2 font-mono text-[11px] text-[var(--color-fg-muted)]">
              ({report.code})
            </span>
          ) : null}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="上传" value={String(report.stats?.uploaded ?? report.pushed)} />
        <Metric label="下载" value={String(report.stats?.downloaded ?? report.pulled)} />
        <Metric label="合并" value={String(report.stats?.merged ?? 0)} />
        <Metric label="拒绝" value={String(report.stats?.rejected ?? 0)} />
      </div>
      <p className="mt-2 mb-0 text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
        <span className="font-medium text-[var(--color-fg)]">下载类型（服务端）：</span>
        {hasServerTypes ? formatTypeCounts(serverByType) : '无'}
      </p>
      <p className="mt-1 mb-0 text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
        <span className="font-medium text-[var(--color-fg)]">本地库快照：</span>
        {formatTypeCounts(report.localByType)}
        <span className="ml-1">（非权威）</span>
      </p>
      <p className="mt-1 mb-0 text-[11px] text-[var(--color-fg-muted)]">
        {formatTime(report.finishedAt)}
        {report.pendingBefore ? ` · 同步前 pending ${report.pendingBefore}` : null}
        {report.enqueuedNow ? ` · 本次入队 ${report.enqueuedNow}` : null}
      </p>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center">
      <div className="text-[16px] font-bold tabular-nums text-[var(--color-fg)]">{props.value}</div>
      <div className="text-[11px] text-[var(--color-fg-muted)]">{props.label}</div>
    </div>
  );
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

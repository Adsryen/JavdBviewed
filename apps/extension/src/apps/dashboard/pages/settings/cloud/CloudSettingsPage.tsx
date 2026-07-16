/**
 * @file CloudSettingsPage.tsx
 * @description Cloud 多端同步设置页：连接、登录、设备、与 WebDAV 职责区分
 * @module apps/dashboard/pages/settings/cloud
 */
import { useCallback, useEffect, useState } from 'react';
import type { DeviceInfo } from '@javdb/sync-protocol';
import { Button } from '../../../../../ui/primitives/Button/Button';
import { Input } from '../../../../../ui/primitives/Input/Input';
import { SettingSection } from '../../../../../ui/patterns/SettingSection/SettingSection';
import { SettingField } from '../../../../../ui/patterns/SettingField/SettingField';
import { SettingsPageFrame } from '../shared/settingsPageFrame';
import {
  createExtensionCloudClient,
  loadCloudSession,
  loadCloudSettings,
  normalizeCloudBaseUrl,
  runCloudSyncNow,
  saveCloudSettings,
  type CloudConnectionSettings,
  type CloudSessionRecord,
} from '../../../../../features/cloudSync';

type StatusTone = 'idle' | 'ok' | 'err' | 'busy';

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
  const [health, setHealth] = useState<string>('未检测');
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<StatusTone>('idle');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refreshSession = useCallback(async () => {
    setSession(await loadCloudSession());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await loadCloudSettings();
        if (cancelled) return;
        setSettings(s);
        setBaseUrlDraft(s.baseUrl);
        setDeviceLabelDraft(s.deviceLabel);
        await refreshSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const setStatus = (text: string, next: StatusTone) => {
    setMessage(text);
    setTone(next);
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

  const onProbeHealth = async () => {
    setBusy(true);
    try {
      const saved = await persistConnection();
      if (!saved) return;
      const url = `${saved.baseUrl}/health`;
      const res = await fetch(url);
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; protocolVersion?: number };
      if (!res.ok) {
        setHealth(`HTTP ${res.status}`);
        setStatus('健康检查失败', 'err');
        return;
      }
      setHealth(
        data.ok
          ? `正常 · protocol v${data.protocolVersion ?? '?'}`
          : `异常响应 · HTTP ${res.status}`,
      );
      setStatus('已连通 Cloud 服务', 'ok');
    } catch (e) {
      setHealth('无法连接');
      setStatus(e instanceof Error ? e.message : '健康检查失败', 'err');
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async () => {
    setBusy(true);
    try {
      const saved = await persistConnection();
      if (!saved) return;
      if (!identifier.trim() || !password) {
        setStatus('请填写账号与密码', 'err');
        return;
      }
      const { api } = await createExtensionCloudClient(saved);
      await api.register({ identifier: identifier.trim(), password });
      setStatus('注册成功，请登录', 'ok');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '注册失败', 'err');
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async () => {
    setBusy(true);
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
      setStatus(`已登录 · 用户 ${res.userId}`, 'ok');
      try {
        setDevices(await api.listDevices());
      } catch {
        setDevices([]);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '登录失败', 'err');
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      const saved = settings ?? (await loadCloudSettings());
      const { api } = await createExtensionCloudClient(saved);
      await api.logout();
      await refreshSession();
      setDevices([]);
      setStatus('已登出本机 Cloud 会话', 'ok');
    } catch (e) {
      // 仍清理本地会话
      try {
        const { api } = await createExtensionCloudClient();
        await api.tokens.clear();
      } catch {
        // ignore
      }
      await refreshSession();
      setStatus(e instanceof Error ? e.message : '登出时服务端异常，本机会话已清理', 'err');
    } finally {
      setBusy(false);
    }
  };

  const onRefreshDevices = async () => {
    setBusy(true);
    try {
      const { api } = await createExtensionCloudClient();
      const list = await api.listDevices();
      setDevices(list);
      setStatus(`已刷新设备列表（${list.length}）`, 'ok');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '刷新设备失败', 'err');
    } finally {
      setBusy(false);
    }
  };

  const onSyncNow = async () => {
    setBusy(true);
    try {
      const result = await runCloudSyncNow();
      setStatus(
        `同步完成：拉取 ${result.pulled} · 推送 ${result.pushed} · 本地实体 ${result.localEntityCount}` +
          (result.enqueuedNow ? ` · 首推入队 ${result.enqueuedNow}` : ''),
        'ok',
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '同步失败', 'err');
    } finally {
      setBusy(false);
    }
  };

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

  const loggedIn = Boolean(session?.accessToken);

  return (
    <SettingsPageFrame
      title="Cloud 多端同步"
      description="账号中枢：多端 live 同步。WebDAV 仍是冷备份通道，两者职责不同。"
      rootDataAttrs={{ 'data-cloud-settings-react': '1' }}
    >
      <div className="mb-4 rounded-[var(--radius-2)] border border-[var(--color-border)] bg-[var(--color-surface-2,#f6f7f9)] p-3 text-[13px] leading-relaxed text-[var(--color-fg)]">
        <strong>和 WebDAV 的区别：</strong>
        Cloud 负责账号、设备与增量同步；WebDAV 负责全量冷备份/换机兜底。可同时启用，互不替代。
      </div>

      <SettingSection title="连接" description="指向你自己部署的 Go Cloud 实例">
        <SettingField id="cloud-base-url" label="Cloud Base URL" description="例如 http://127.0.0.1:8080">
          <Input
            id="cloud-base-url"
            value={baseUrlDraft}
            onChange={(e) => setBaseUrlDraft(e.target.value)}
            placeholder="http://127.0.0.1:8080"
            autoComplete="off"
          />
        </SettingField>
        <SettingField id="cloud-device-label" label="本机设备名称">
          <Input
            id="cloud-device-label"
            value={deviceLabelDraft}
            onChange={(e) => setDeviceLabelDraft(e.target.value)}
            placeholder="浏览器扩展"
            autoComplete="off"
          />
        </SettingField>
        <SettingField id="cloud-device-id" label="设备 ID（本机）" description="自动生成，用于多端区分">
          <Input id="cloud-device-id" value={settings.deviceId} readOnly />
        </SettingField>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void persistConnection().then(() => setStatus('连接配置已保存', 'ok'))}>
            保存连接
          </Button>
          <Button type="button" variant="primary" disabled={busy} onClick={() => void onProbeHealth()}>
            健康检查
          </Button>
        </div>
        <p className="mt-2 text-[12.5px] text-[var(--color-fg-muted)]">服务状态：{health}</p>
      </SettingSection>

      <SettingSection title="账号" description="注册/登录同一 Cloud 账号后，各端进入同一数据世界">
        <SettingField id="cloud-identifier" label="账号（邮箱或用户名）">
          <Input
            id="cloud-identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
        </SettingField>
        <SettingField id="cloud-password" label="密码">
          <Input
            id="cloud-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </SettingField>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void onRegister()}>
            注册
          </Button>
          <Button type="button" variant="primary" disabled={busy} onClick={() => void onLogin()}>
            登录
          </Button>
          <Button type="button" variant="ghost" disabled={busy || !loggedIn} onClick={() => void onLogout()}>
            登出
          </Button>
        </div>
        <p className="mt-2 text-[12.5px] text-[var(--color-fg-muted)]">
          登录状态：{loggedIn ? `已登录（设备 ${session?.deviceId ?? '—'}）` : '未登录'}
        </p>
      </SettingSection>

      <SettingSection title="数据同步" description="将本机用户资产与 Cloud 双向同步（首次会把本地全量入队推送）">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" disabled={busy || !loggedIn} onClick={() => void onSyncNow()}>
            立即同步
          </Button>
        </div>
        <p className="mt-2 text-[12.5px] text-[var(--color-fg-muted)]">
          覆盖：视频状态、演员、清单、新作品、订阅、资料、搜索方案及部分显示/同步偏好。不含遥测、Emby 本机库、日志与凭据明文。
        </p>
      </SettingSection>

      <SettingSection title="设备" description="当前账号下已授权设备（需已登录）">
        <div className="mb-2">
          <Button type="button" variant="secondary" disabled={busy || !loggedIn} onClick={() => void onRefreshDevices()}>
            刷新设备列表
          </Button>
        </div>
        {devices.length === 0 ? (
          <p className="text-[13px] text-[var(--color-fg-muted)]">暂无设备数据</p>
        ) : (
          <ul className="space-y-2">
            {devices.map((d) => (
              <li
                key={d.id}
                className="rounded-[var(--radius-2)] border border-[var(--color-border)] px-3 py-2 text-[13px]"
              >
                <div className="font-medium text-[var(--color-fg)]">
                  {d.label || d.id}
                  {d.id === settings.deviceId ? (
                    <span className="ml-2 text-[12px] text-[var(--color-primary)]">当前</span>
                  ) : null}
                </div>
                <div className="text-[12px] text-[var(--color-fg-muted)]">
                  {d.clientType}
                  {d.platform ? ` · ${d.platform.slice(0, 48)}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingSection>

      {message ? (
        <p
          className={`mt-4 text-[13px] ${
            tone === 'err'
              ? 'text-[var(--color-danger,#c0392b)]'
              : tone === 'ok'
                ? 'text-[var(--color-success,#27ae60)]'
                : 'text-[var(--color-fg-muted)]'
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </SettingsPageFrame>
  );
}

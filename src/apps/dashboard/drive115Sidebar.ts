import { isDrive115EnabledState, normalizeDrive115Settings } from '../../features/drive115/app';
import { getDrive115V2Service } from '../../features/drive115/v2';
import { STATE } from '../../dashboard/state';

type QuotaInfo = { total?: number; used?: number; surplus?: number; list?: any[] };

export function updateDrive115SidebarVisibility(enabledParam?: boolean): void {
  const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
  if (!section) return;
  const state = normalizeDrive115Settings(STATE.settings?.drive115 || {});
  const enabled = typeof enabledParam === 'boolean' ? enabledParam : isDrive115EnabledState(state);
  section.style.display = enabled ? '' : 'none';
}

export function installDrive115SidebarGlobals(): void {
  (window as any).initDrive115QuotaSidebar = initializeDrive115QuotaSidebar;
}

export function initializeDrive115SidebarAfterState(): void {
  updateDrive115SidebarVisibility();
  if (isDrive115EnabledState(normalizeDrive115Settings(STATE.settings?.drive115 || {}))) {
    void initializeDrive115QuotaSidebar();
  }
}

export function bindDrive115SidebarEvents(): void {
  window.addEventListener('drive115:refreshQuota' as any, () => {
    void initializeDrive115QuotaSidebar();
  });

  window.addEventListener('drive115:enabled-changed' as any, (event: any) => {
    const enabled = !!(event?.detail?.enabled);
    updateDrive115SidebarVisibility(enabled);
    if (enabled) {
      void initializeDrive115QuotaSidebar();
    }
  });
}

async function initializeDrive115QuotaSidebar(): Promise<void> {
  try {
    const state = normalizeDrive115Settings(STATE.settings?.drive115 || {});
    const enabled = isDrive115EnabledState(state);
    const section = document.getElementById('drive115SidebarSection') as HTMLDivElement | null;
    if (!enabled) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = '';
    const box = document.getElementById('drive115QuotaSidebar');
    if (!box) return;

    const svc = getDrive115V2Service();
    const tokenRet = await svc.getValidAccessToken();
    if (!('success' in tokenRet) || !tokenRet.success) {
      box.innerHTML = '<div style="font-size:12px; color:#999;">'
        + '无法获取配额：' + ((tokenRet as any)?.message || '未启用或缺少凭据')
        + '<div style="margin-top:6px;">'
        + '<a href="#tab-settings/drive115-settings" style="color:#4a90e2; text-decoration:none;">前往设置 115</a>'
        + '</div>'
        + '</div>';
      return;
    }

    const quotaRet = await svc.getQuotaInfo({ accessToken: tokenRet.accessToken });
    if (!quotaRet.success) {
      box.innerHTML = `<div style="font-size:12px; color:#d9534f;">获取配额失败：${quotaRet.message || '未知错误'}</div>`;
      return;
    }

    renderQuotaSidebar(quotaRet.data || {} as any);
  } catch (error) {
    const box = document.getElementById('drive115QuotaSidebar');
    if (box) box.innerHTML = '<div style="font-size:12px; color:#d9534f;">获取配额异常</div>';
    console.error('initDrive115QuotaSidebar error:', error);
  }
}

function renderQuotaSidebar(info: QuotaInfo): void {
  const box = document.getElementById('drive115QuotaSidebar');
  if (!box) return;

  const total = typeof info.total === 'number' ? info.total : undefined;
  const used = typeof info.used === 'number' ? info.used : undefined;
  const surplus = typeof info.surplus === 'number'
    ? info.surplus
    : (typeof used === 'number' && typeof total === 'number' ? Math.max(0, total - used) : undefined);

  const percent = (() => {
    if (typeof used === 'number' && typeof total === 'number' && total > 0) return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
    if (typeof surplus === 'number' && typeof total === 'number' && total > 0) return Math.max(0, Math.min(100, Math.round(((total - surplus) / total) * 100)));
    return undefined;
  })();

  const fmt = (value?: number) => (typeof value === 'number' ? String(value) : '-');
  const barHtml = percent !== undefined
    ? `
        <div style="height:8px; background:#eee; border-radius:6px; overflow:hidden;">
            <div style="height:100%; width:${percent}%; background:linear-gradient(90deg,#4a90e2,#50c9c3);"></div>
        </div>
        <div style="font-size:11px; color:#777; margin-top:4px;">已用 ${percent}%</div>
        `
    : '<div style="font-size:12px; color:#999;">暂无总量信息</div>';

  box.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>总量</span>
                <span>${fmt(total)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>已用</span>
                <span>${fmt(used)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                <span>剩余</span>
                <span>${fmt(surplus)}</span>
            </div>
            ${barHtml}
            <div style="margin-top:2px;">
                <a href="#tab-settings/drive115-settings" style="color:#4a90e2; text-decoration:none; font-size:12px;">查看详情与刷新</a>
            </div>
        </div>
    `;
}

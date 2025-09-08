import type { IDrive115Pane } from './Drive115TabsController';
import { getDrive115V2Service, type Drive115V2UserInfo } from '../../../../services/drive115v2';
import { getSettings, saveSettings } from '../../../../utils/storage';
import { addTaskUrlsV2 } from '../../../../services/drive115Router';
import { describe115Error } from '../../../../services/drive115v2/errorCodes';
import { showToast } from '../../../../content/toast';

type Drive115PaneContext = {
  update: (patch: Partial<any>) => void;
  updateUI: () => void;
  save?: () => void;
};

export class Drive115V2Pane implements IDrive115Pane {
  private el: HTMLElement | null = null;
  constructor(
    private readonly elId: string = 'drive115V2Pane',
    private readonly ctx?: Drive115PaneContext
  ) {}

  private autoResize(el?: HTMLTextAreaElement | null) {
    if (!el) return;
    // 先重置再按内容撑开
    el.style.height = 'auto';
    el.style.overflow = 'hidden';
    // 计算高度：scrollHeight 包含内边距，不含边框
    let target = el.scrollHeight;
    const cs = window.getComputedStyle(el);
    if (cs.boxSizing === 'border-box') {
      const borderTop = parseFloat(cs.borderTopWidth || '0') || 0;
      const borderBottom = parseFloat(cs.borderBottomWidth || '0') || 0;
      target += borderTop + borderBottom;
    }
    // 最小高度保护：至少容纳 rows 行（若未设置 rows，则按 2 行），避免出现第二行被裁切
    const lineHeight = parseFloat(cs.lineHeight || '0') || 0;
    const paddingTop = parseFloat(cs.paddingTop || '0') || 0;
    const paddingBottom = parseFloat(cs.paddingBottom || '0') || 0;
    const rowsAttr = parseInt(el.getAttribute('rows') || '0', 10);
    const minRows = rowsAttr > 0 ? rowsAttr : 2;
    if (lineHeight > 0) {
      const minHeight = minRows * lineHeight + paddingTop + paddingBottom + (cs.boxSizing === 'border-box' ? (parseFloat(cs.borderTopWidth||'0')||0) + (parseFloat(cs.borderBottomWidth||'0')||0) : 0);
      target = Math.max(target, minHeight);
    }
    // 像素取整并加 1px 余量，避免渲染取整造成的裁切
    const finalH = Math.ceil(target) + 1;
    el.style.height = `${finalH}px`;
  }

  private scheduleAutoResize(ids: string[]) {
    const run = () => {
      ids.forEach((id) => this.autoResize(document.getElementById(id) as HTMLTextAreaElement | null));
    };
    // 立即执行一次
    run();
    // 下一帧
    requestAnimationFrame(run);
    // 稍后再执行几次，覆盖异步填充值的场景
    setTimeout(run, 100);
    setTimeout(run, 300);
  }

  private hideLegacyDownloadDirRow(): void {
    try {
      const input = document.getElementById('drive115DownloadDir') as HTMLInputElement | null;
      if (!input) return;
      // 隐藏输入本身
      input.style.display = 'none';
      // 隐藏错误提示
      const err = document.getElementById('drive115DownloadDirError') as HTMLParagraphElement | null;
      if (err) err.style.display = 'none';
      // 隐藏“如何获取ID”折叠与按钮
      const howBtn = document.getElementById('drive115HowToCidToggle') as HTMLButtonElement | null;
      const howBlock = document.getElementById('drive115HowToCid') as HTMLDivElement | null;
      if (howBtn) howBtn.style.display = 'none';
      if (howBlock) howBlock.style.display = 'none';
      // 隐藏上一层容器行，尽量找到包含 label 的行
      let row: HTMLElement | null = input.parentElement as HTMLElement | null;
      for (let i = 0; i < 3 && row; i++) {
        if (row.classList && (row.classList.contains('form-row') || row.classList.contains('settings-row'))) {
          row.style.display = 'none';
          break;
        }
        row = row.parentElement as HTMLElement | null;
      }
    } catch {}
  }

  // 兜底：通过文本内容隐藏旧版字段（当 ID 发生变化或由模板生成时）
  private hideLegacyDownloadDirByText(): void {
    try {
      const root = document.getElementById('drive115-settings') || document.body;
      if (!root) return;
      const texts = ['下载目录ID', '如何获取ID'];
      const candidates = Array.from(root.querySelectorAll<HTMLElement>('*'))
        .filter(el => {
          const t = (el.textContent || '').trim();
          if (!t) return false;
          return texts.some(key => t.includes(key));
        });
      for (const el of candidates) {
        // 向上寻找一到两层“.form-group”或“.setting-item”容器隐藏
        let row: HTMLElement | null = el;
        for (let i = 0; i < 3 && row; i++) {
          if (row.classList && (row.classList.contains('form-group') || row.classList.contains('setting-item') || row.classList.contains('settings-row'))) {
            row.style.display = 'none';
            break;
          }
          row = row.parentElement as HTMLElement | null;
        }
      }
    } catch {}
  }

  private getElement(): HTMLElement | null {
    if (!this.el) this.el = document.getElementById(this.elId);
    return this.el;
  }

  private bindEvents(): void {
    // 新版开关
    const enableV2Checkbox = document.getElementById('drive115EnableV2') as HTMLInputElement | null;
    enableV2Checkbox?.addEventListener('change', () => {
      const enableV2 = !!enableV2Checkbox.checked;
      // 仅更新开关状态，不改变 lastSelectedVersion，避免关闭时跳到 v1
      this.ctx?.update({ enableV2 });
      this.ctx?.updateUI();
      this.ctx?.save?.();
    });

    // 工具：自适应高度（封装为类方法）

    // v2 接口域名输入
    const v2ApiBaseUrlInput = document.getElementById('drive115V2ApiBaseUrl') as HTMLInputElement | null;
    v2ApiBaseUrlInput?.addEventListener('input', () => {
      const val = (v2ApiBaseUrlInput?.value || '').trim();
      this.ctx?.update({ v2ApiBaseUrl: val });
      this.ctx?.save?.();
    });

    // 自动刷新开关
    const v2AutoRefreshCheckbox = document.getElementById('drive115V2AutoRefresh') as HTMLInputElement | null;
    v2AutoRefreshCheckbox?.addEventListener('change', () => {
      const v = !!v2AutoRefreshCheckbox.checked;
      this.ctx?.update({ v2AutoRefresh: v });
      this.ctx?.save?.();
    });

    // 提前刷新秒数
    const v2AutoRefreshSkewInput = document.getElementById('drive115V2AutoRefreshSkewSec') as HTMLInputElement | null;
    const onSkewChange = () => {
      const raw = (v2AutoRefreshSkewInput?.value || '').trim();
      const n = Math.max(0, Math.floor(Number(raw) || 0));
      this.ctx?.update({ v2AutoRefreshSkewSec: n });
      this.ctx?.save?.();
    };
    v2AutoRefreshSkewInput?.addEventListener('change', onSkewChange);
    v2AutoRefreshSkewInput?.addEventListener('input', onSkewChange);

    // access_token 输入（兼容 input 或 textarea）
    const v2AccessTokenInput = document.getElementById('drive115V2AccessToken') as (HTMLInputElement | HTMLTextAreaElement | null);
    v2AccessTokenInput?.addEventListener('input', () => {
      const val = (v2AccessTokenInput as any).value || '';
      const trimmed = (val as string).trim();
      // 当手动修改 access_token 时：
      // 1) 持久化新的 access_token
      // 2) 将到期时间重置为当前时间起 2 小时（7200 秒）
      // 3) 标记用户信息未过期（与 UI 提示相关）
      const nowSec = Math.floor(Date.now() / 1000);
      const twoHoursLater = nowSec + 7200;
      this.ctx?.update({
        v2AccessToken: trimmed,
        v2TokenExpiresAt: twoHoursLater,
        // 与 UI 关联的过期提示标记（若存在该字段，则置为未过期）
        v2UserInfoExpired: false as any,
      });
      // 立刻保存并刷新 UI，让“到期时间/倒计时”即时更新
      this.ctx?.save?.();
      this.ctx?.updateUI?.();
      if (v2AccessTokenInput && 'rows' in v2AccessTokenInput) this.autoResize(v2AccessTokenInput as HTMLTextAreaElement);
    });
    // 初始也调整一次高度
    if (v2AccessTokenInput && 'rows' in v2AccessTokenInput) this.autoResize(v2AccessTokenInput as HTMLTextAreaElement);

    // refresh_token 输入（兼容 input 或 textarea）
    const v2RefreshTokenInput = document.getElementById('drive115V2RefreshToken') as (HTMLInputElement | HTMLTextAreaElement | null);
    v2RefreshTokenInput?.addEventListener('input', () => {
      const val = (v2RefreshTokenInput as any).value || '';
      this.ctx?.update({ v2RefreshToken: (val as string).trim() });
      this.ctx?.save?.();
      if (v2RefreshTokenInput && 'rows' in v2RefreshTokenInput) this.autoResize(v2RefreshTokenInput as HTMLTextAreaElement);
    });
    if (v2RefreshTokenInput && 'rows' in v2RefreshTokenInput) this.autoResize(v2RefreshTokenInput as HTMLTextAreaElement);

    // 绑定后调度多次自适应，覆盖异步填充值
    this.scheduleAutoResize(['drive115V2AccessToken', 'drive115V2RefreshToken']);

    // 窗口大小变化时也重新计算
    window.addEventListener('resize', () => {
      this.scheduleAutoResize(['drive115V2AccessToken', 'drive115V2RefreshToken', 'drive115V2AddUrls']);
    });

    // 事件绑定完成后，兜底隐藏旧版字段（防模板异步渲染）
    this.hideLegacyDownloadDirByText();

    // 手动刷新按钮：调用刷新接口，成功后回填两个 token 并记录过期时间
    const manualRefreshBtn = document.getElementById('drive115V2ManualRefresh') as HTMLButtonElement | null;
    manualRefreshBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const rt = (((v2RefreshTokenInput as any)?.value) || '').trim();
      if (!rt) {
        this.setUserInfoStatus('请先填写 refresh_token', 'error');
        return;
      }
      this.setUserInfoStatus('刷新中…', 'info');
      try {
        const svc = getDrive115V2Service();
        const ret = await svc.refreshToken(rt);
        if (!ret.success || !ret.token) {
          const msg = describe115Error((ret as any).raw) || ret.message || '刷新失败';
          this.setUserInfoStatus(msg, 'error');
          showToast(msg, 'error');
          return;
        }
        // 回填新的 token
        const { access_token, refresh_token, expires_at } = ret.token as any;
        if (v2AccessTokenInput) (v2AccessTokenInput as any).value = access_token || '';
        if (v2RefreshTokenInput) (v2RefreshTokenInput as any).value = refresh_token || '';
        // 同步到上下文并保存
        this.ctx?.update({ 
          v2AccessToken: (access_token || '').trim(), 
          v2RefreshToken: (refresh_token || '').trim(),
          v2TokenExpiresAt: (typeof expires_at === 'number' ? expires_at : null)
        });
        this.ctx?.save?.();
        // 立即刷新UI以更新到期时间显示
        this.ctx?.updateUI?.();
        // 自适应高度
        this.scheduleAutoResize(['drive115V2AccessToken', 'drive115V2RefreshToken']);
        this.setUserInfoStatus('已刷新 access_token', 'ok');
        showToast('已刷新 access_token', 'success');
      } catch (err: any) {
        const msg = describe115Error(err) || err?.message || '刷新失败';
        this.setUserInfoStatus(msg, 'error');
        showToast(msg, 'error');
      }
    });

    // 刷新用户信息
    const fetchBtn = document.getElementById('drive115V2FetchUserInfo') as HTMLButtonElement | null;
    const boxEl = document.getElementById('drive115V2UserInfoBox');
    fetchBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const token = (((v2AccessTokenInput as any)?.value) || '').trim();
      if (!token) {
        this.setUserInfoStatus('请先填写 access_token', 'error');
        return;
      }
      this.setUserInfoStatus('加载中…');
      if (boxEl) boxEl.innerHTML = '<p style="margin:0; color:#888;">加载中…</p>';
      try {
        const svc = getDrive115V2Service();
        const ret = await svc.fetchUserInfo(token);
        if (!ret.success || !ret.data) {
          const msg = describe115Error((ret as any).raw) || ret.message || '获取失败';
          this.setUserInfoStatus(msg, 'error');
          if (boxEl) boxEl.innerHTML = `<p style="margin:0; color:#d00;">${msg}</p>`;
          showToast(msg, 'error');
          return;
        }
        this.setUserInfoStatus('已更新', 'ok');
        showToast('已获取用户信息', 'success');
        this.renderUserInfo(ret.data);
        // 持久化保存用户信息
        try {
          const settings: any = await getSettings();
          const ns: any = { ...settings };
          ns.drive115 = {
            ...(settings?.drive115 || {}),
            v2UserInfo: ret.data,
            v2UserInfoUpdatedAt: Date.now(),
            v2UserInfoExpired: false,
          };
          await saveSettings(ns);
          // 用户信息成功后触发侧边栏配额刷新
          try { window.dispatchEvent(new Event('drive115:refreshQuota')); } catch {}
        } catch {}
      } catch (err: any) {
        const msg = describe115Error(err) || err?.message || '发生错误';
        this.setUserInfoStatus(msg, 'error');
        if (boxEl) boxEl.innerHTML = `<p style="margin:0; color:#d00;">${msg}</p>`;
        showToast(msg, 'error');
      }
    });

    // 添加云下载任务（多链接）
    const addUrlsTextarea = document.getElementById('drive115V2AddUrls') as HTMLTextAreaElement | null;
    const wpPathIdInput = document.getElementById('drive115V2WpPathId') as HTMLInputElement | null;
    const addBtn = document.getElementById('drive115V2AddUrlsBtn') as HTMLButtonElement | null;
    const statusEl = document.getElementById('drive115V2AddUrlsStatus') as HTMLSpanElement | null;
    const resultBox = document.getElementById('drive115V2AddUrlsResult') as HTMLDivElement | null;

    // 自适应高度与输入事件
    if (addUrlsTextarea) {
      this.autoResize(addUrlsTextarea);
      addUrlsTextarea.addEventListener('input', () => this.autoResize(addUrlsTextarea));
    }

    // 合并字段：将目录ID持久化为 settings.drive115.defaultWpPathId
    if (wpPathIdInput) {
      // 初次回填默认值
      getSettings().then((settings: any) => {
        const def = (settings?.drive115?.defaultWpPathId ?? '').toString();
        if (!wpPathIdInput.value) wpPathIdInput.value = def;
      }).catch(() => {});
      // 变更时保存
      const onWpChange = async () => {
        try {
          const val = (wpPathIdInput.value || '').trim();
          const settings: any = await getSettings();
          const ns: any = { ...settings };
          ns.drive115 = { ...(settings?.drive115 || {}), defaultWpPathId: val };
          await saveSettings(ns);
        } catch {}
      };
      wpPathIdInput.addEventListener('input', onWpChange);
      wpPathIdInput.addEventListener('change', onWpChange);
    }

    const setAddStatus = (msg: string, kind: 'info' | 'ok' | 'error' = 'info') => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.style.color = kind === 'ok' ? '#2e7d32' : kind === 'error' ? '#c62828' : '#888';
    };

    const renderAddResults = (items: any[] | undefined) => {
      if (!resultBox) return;
      if (!Array.isArray(items) || items.length === 0) {
        resultBox.innerHTML = '<p style="margin:0; color:#888;">无返回结果</p>';
        return;
      }
      const rows = items.map((it: any, idx: number) => {
        const ok = (it?.state === true) || (it?.success === true) || (it?.errcode === 0);
        const url = (it?.url || it?.src || it?.link || '').toString();
        const msg = (it?.message || it?.errmsg || it?.error || (ok ? '已提交' : '失败')).toString();
        const tid = it?.task_id || it?.id || '';
        return `
          <div style="padding:6px 8px; border:1px solid ${ok ? '#c8e6c9' : '#ffcdd2'}; background:${ok ? '#e8f5e9' : '#ffebee'}; border-radius:6px; margin-bottom:6px;">
            <div style="font-weight:600; color:${ok ? '#2e7d32' : '#c62828'};">第 ${idx + 1} 条：${ok ? '成功' : '失败'}${tid ? `（任务ID：${this.escapeHtml(String(tid))}）` : ''}</div>
            ${url ? `<div style="color:#555; word-break:break-all;">URL：${this.escapeHtml(url)}</div>` : ''}
            <div style="color:#777;">${this.escapeHtml(msg)}</div>
          </div>
        `;
      }).join('');
      resultBox.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">${rows}</div>
      `;
    };

    addBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const raw = (addUrlsTextarea?.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (!raw.length) {
        setAddStatus('请输入至少一条链接', 'error');
        return;
      }
      const urls = raw.join('\n');
      // 目录ID优先使用表单值，否则回退到设置中的 defaultWpPathId
      let folderId = (wpPathIdInput?.value || '').trim();
      if (!folderId) {
        try {
          const settings: any = await getSettings();
          folderId = (settings?.drive115?.defaultWpPathId || '').toString().trim();
        } catch {}
      }

      // 清空结果并提示
      if (resultBox) resultBox.innerHTML = '';
      setAddStatus('提交中…', 'info');
      if (addBtn) addBtn.disabled = true;

      try {
        // 空串 => 传 '0'（根目录）；显式 '0' => 传 '0'
        const wpArg = folderId === '' ? '0' : folderId;
        const ret = await addTaskUrlsV2({ urls, wp_path_id: wpArg });
        if (!ret.success) {
          const msg = describe115Error((ret as any).raw) || ret.message || '添加任务失败';
          setAddStatus(msg, 'error');
          showToast(msg, 'error');
          renderAddResults(ret.data as any[] | undefined);
          return;
        }
        setAddStatus('已提交', 'ok');
        showToast('已提交云下载任务', 'success');
        renderAddResults(ret.data as any[] | undefined);
      } catch (err: any) {
        const msg = describe115Error(err) || err?.message || '请求失败';
        setAddStatus(msg, 'error');
        showToast(msg, 'error');
      } finally {
        if (addBtn) addBtn.disabled = false;
      }
    });
  }

  mount(): void {
    this.getElement();
    this.bindEvents();
    // v2 生效时，尽量隐藏旧版“下载目录ID”一组
    this.hideLegacyDownloadDirRow();
    this.hideLegacyDownloadDirByText();
  }

  unmount(): void {
    // 目前为直接绑定，卸载时不做特殊清理（面板整体销毁时由容器负责）
  }

  show(): void {
    const el = this.getElement();
    if (el) {
      el.style.display = '';
      // 面板从隐藏转为可见后再计算高度，避免 hidden 状态下 scrollHeight 过小
      setTimeout(() => {
        this.scheduleAutoResize(['drive115V2AccessToken', 'drive115V2RefreshToken']);
      }, 0);
      // 显示时优先渲染已缓存的 115 用户信息，并尝试后台刷新
      this.renderCachedAndMaybeRefresh();
      // 再次隐藏旧版下载目录行（防止其他代码重新显示）
      this.hideLegacyDownloadDirRow();
      this.hideLegacyDownloadDirByText();
    }
  }

  hide(): void {
    const el = this.getElement();
    if (el) el.style.display = 'none';
  }

  // 优先渲染缓存，并在后台尝试刷新 + 持久化
  private async renderCachedAndMaybeRefresh() {
    try {
      const settings: any = await getSettings();
      const s = settings?.drive115 || {};
      const enabled = !!s.enabled;
      const cachedUser: Drive115V2UserInfo | undefined = s.v2UserInfo;
      const expired: boolean = !!s.v2UserInfoExpired;

      if (!enabled) return;
      // 先渲染缓存
      if (cachedUser && Object.keys(cachedUser).length > 0) {
        this.renderUserInfo(cachedUser);
        this.setUserInfoStatus(expired ? '已过期（缓存）' : '已缓存', 'info');
      }
      // 禁止自动刷新：仅渲染缓存，直接返回
      return;
    } catch (e) {
      // 静默失败（不打断设置页操作）
    }
  }

  // 校验 v2 相关字段（可选填：若填写则简单长度校验）
  validate?(): string[] {
    const errors: string[] = [];
    const enabled = (document.getElementById('drive115Enabled') as HTMLInputElement | null)?.checked ?? false;
    const enableV2 = (document.getElementById('drive115EnableV2') as HTMLInputElement | null)?.checked ?? false;
    if (!enabled || !enableV2) return errors;

    // 基础域名校验（可留空；若填写需 http(s) 且不可以/结尾）
    const baseUrl = ((document.getElementById('drive115V2ApiBaseUrl') as any)?.value || '').trim();
    if (baseUrl) {
      if (!/^https?:\/\//i.test(baseUrl)) errors.push('v2 接口域名必须以 http(s):// 开头');
      if (/\/$/.test(baseUrl)) errors.push('v2 接口域名末尾不要带 /');
    }

    const at = ((document.getElementById('drive115V2AccessToken') as any)?.value || '').trim();
    const rt = ((document.getElementById('drive115V2RefreshToken') as any)?.value || '').trim();
    if (at && at.length < 8) errors.push('access_token 看起来不正确（长度过短）');
    if (rt && rt.length < 8) errors.push('refresh_token 看起来不正确（长度过短）');
    return errors;
  }

  private setUserInfoStatus(msg: string, kind: 'ok' | 'error' | 'info' = 'info') {
    const el = document.getElementById('drive115V2UserInfoStatus');
    if (!el) return;
    el.textContent = msg;
    el.setAttribute('data-kind', kind);
    el['style'] && (el['style'].color = kind === 'ok' ? '#2e7d32' : kind === 'error' ? '#c62828' : '#888');
  }

  private renderUserInfo(user: Drive115V2UserInfo) {
    const boxEl = document.getElementById('drive115V2UserInfoBox');
    if (!boxEl) return;

    const u: any = user || {};
    // 兼容字段映射
    const uid = u.uid || u.user_id || u.id || '-';
    const name = u.user_name || u.name || u.nick || u.username || `UID ${uid}`;
    const avatar = u.user_face_m || u.user_face_l || u.user_face_s || u.avatar_middle || u.avatar || u.avatar_small || '';

    // VIP 信息
    const vip = u.vip_info || {};
    const vipLevelName: string = vip.level_name || '';
    const vipExpireTs: number | undefined = typeof vip.expire === 'number' ? vip.expire : undefined;
    const vipExpireText = vipExpireTs ? this.formatExpire(vipExpireTs) : (u.vip_expire || '');
    const isVip = vipLevelName ? '是' : ((typeof u.is_vip === 'boolean') ? (u.is_vip ? '是' : '否') : (typeof u.is_vip === 'number' ? (u.is_vip > 0 ? '是' : '否') : (vipLevelName ? '是' : '否')));

    // 空间信息（优先使用 rt_space_info -> size 与 size_format）
    const space = u.rt_space_info || {};
    const totalSize: number | undefined = space?.all_total?.size;
    const usedSize: number | undefined = space?.all_use?.size;
    const freeSize: number | undefined = space?.all_remain?.size;
    const totalText: string = space?.all_total?.size_format || this.formatBytes(u.space_total);
    const usedText: string = space?.all_use?.size_format || this.formatBytes(u.space_used);
    const freeText: string = space?.all_remain?.size_format || this.formatBytes(u.space_free);
    const percent = ((): number => {
      if (typeof usedSize === 'number' && typeof totalSize === 'number' && totalSize > 0) return Math.max(0, Math.min(100, Math.round((usedSize / totalSize) * 100)));
      // 回退：尝试根据 free/total 推算
      if (typeof freeSize === 'number' && typeof totalSize === 'number' && totalSize > 0) return Math.max(0, Math.min(100, Math.round(((totalSize - freeSize) / totalSize) * 100)));
      return 0;
    })();

    // 渲染卡片
    boxEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        ${avatar ? `<img src="${avatar}" alt="avatar" style="width:48px; height:48px; border-radius:50%; object-fit:cover; box-shadow:0 1px 3px rgba(0,0,0,.15);">` : ''}
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-weight:600; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${this.escapeHtml(name)}</div>
            ${vipLevelName ? `<span style="font-size:11px; color:#ab47bc; background:#f3e5f5; padding:2px 6px; border-radius:10px;">${this.escapeHtml(vipLevelName)}</span>` : ''}
            <span style="font-size:11px; color:${isVip === '是' ? '#2e7d32' : '#888'};">VIP: ${isVip}</span>
          </div>
          <div style="font-size:12px; color:#666; margin-top:2px;">UID: ${this.escapeHtml(String(uid))}${vipExpireText ? ` · 到期：${this.escapeHtml(String(vipExpireText))}` : ''}</div>
        </div>
      </div>

      <div style="margin-top:10px;">
        <div style="height:8px; background:#eee; border-radius:6px; overflow:hidden;">
          <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, #42a5f5, #1e88e5);"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#444; margin-top:6px;">
          <span>已用：${this.escapeHtml(usedText)}</span>
          <span>剩余：${this.escapeHtml(freeText)}</span>
          <span>总计：${this.escapeHtml(totalText)}</span>
        </div>
      </div>
    `;
  }

  private formatExpire(tsSec: number): string {
    if (!tsSec || isNaN(tsSec)) return '';
    try {
      const d = new Date(tsSec * 1000);
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return '';
    }
  }

  private formatBytes(n?: number): string {
    if (typeof n !== 'number' || isNaN(n)) return '-';
    const units = ['B','KB','MB','GB','TB','PB'];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }
}

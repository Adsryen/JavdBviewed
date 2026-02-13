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
    // 限制点击范围：点击文字不触发切换，仅允许点击开关
    try {
      const toggleText = document.querySelector('#drive115V2Pane .drive115-toggle-text') as HTMLElement | null;
      toggleText?.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
    } catch {}

    // 提前刷新秒数
    const v2AutoRefreshSkewInput = document.getElementById('drive115V2AutoRefreshSkewSec') as HTMLInputElement | null;
    const onSkewChange = () => {
      const raw = (v2AutoRefreshSkewInput?.value || '').trim();
      const n = Math.max(0, Math.floor(Number(raw) || 0));
      this.ctx?.update({ v2AutoRefreshSkewSec: n });
      this.ctx?.save?.();
      // 更新“下次自动刷新时间”
      this.updateRefreshIntervalUIFromStorage();
    };
    v2AutoRefreshSkewInput?.addEventListener('change', onSkewChange);
    v2AutoRefreshSkewInput?.addEventListener('input', onSkewChange);

    // 动态注入：最小自动刷新间隔（分钟，60-120）+ 最近/下次自动刷新时间（只读展示）
    this.injectRefreshIntervalUI();

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
      this.ctx?.update({ 
        v2RefreshToken: (val as string).trim(),
        // 手动修改 refresh_token 时，重置状态为 unknown
        v2RefreshTokenStatus: 'unknown',
        v2RefreshTokenLastError: undefined,
        v2RefreshTokenLastErrorCode: undefined,
      });
      this.ctx?.save?.();
      // 更新状态显示
      this.updateRefreshTokenStatusUI();
      if (v2RefreshTokenInput && 'rows' in v2RefreshTokenInput) this.autoResize(v2RefreshTokenInput as HTMLTextAreaElement);
    });
    if (v2RefreshTokenInput && 'rows' in v2RefreshTokenInput) this.autoResize(v2RefreshTokenInput as HTMLTextAreaElement);
    
    // 初始化时显示 refresh_token 状态
    this.updateRefreshTokenStatusUI();

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
      // 当缺少 refresh_token 时：给出指引页
      if (!rt) {
        try {
          const masked = '（未填写）';
          const helpHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>115 手动刷新帮助</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Microsoft YaHei',sans-serif;padding:16px;line-height:1.6;color:#1f2937} code{background:#f3f4f6;padding:2px 4px;border-radius:4px} .ok{color:#16a34a} .warn{color:#d97706} .err{color:#dc2626}</style></head><body><h2>115 手动刷新指引</h2><ol><li>refresh_token：<strong class="err">${masked}</strong></li><li>请返回设置页填写 refresh_token 后再试。</li></ol></body></html>`;
          const url = 'data:text/html;charset=UTF-8,' + encodeURIComponent(helpHtml);
          window.open(url, '_blank');
        } catch {}
        this.setUserInfoStatus('请先填写 refresh_token', 'error');
        return;
      }
      // 已填写 refresh_token：不打开新窗口，直接在当前页执行刷新
      try {
        await navigator.clipboard.writeText(rt);
        showToast('已复制 refresh_token 到剪贴板', 'success');
      } catch {}
      // 限频校验：手动刷新也受“最小自动刷新间隔(分钟)”限制（不低于30）
      const allow = await this.isManualRefreshAllowed_();
      if (!allow) return;
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
        // 写入“最近接口刷新时间”，并确保最小间隔配置不低于30
        try {
          const nowSec = Math.floor(Date.now() / 1000);
          const settings: any = await getSettings();
          const ns: any = { ...settings };
          const rawMin = Number((settings?.drive115 || {}).v2MinRefreshIntervalMin ?? 60) || 60;
          const minMin = Math.min(120, Math.max(60, rawMin));
          ns.drive115 = {
            ...(settings?.drive115 || {}),
            v2LastTokenRefreshAtSec: nowSec,
            v2MinRefreshIntervalMin: minMin,
          };
          await saveSettings(ns);
          // 同步刷新 UI 的“最近/下次自动刷新时间”
          await this.updateRefreshIntervalUIFromStorage();
        } catch {}
        // 立即刷新UI以更新到期时间显示
        this.ctx?.updateUI?.();
        // 自适应高度
        this.scheduleAutoResize(['drive115V2AccessToken', 'drive115V2RefreshToken']);
        // 更新 refresh_token 状态显示
        this.updateRefreshTokenStatusUI();
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
      // 同步刷新限频UI显示
      this.updateRefreshIntervalUIFromStorage();
      // 更新 refresh_token 状态显示
      this.updateRefreshTokenStatusUI();
    }
  }

  /**
   * 更新 refresh_token 状态显示
   */
  private async updateRefreshTokenStatusUI(): Promise<void> {
    try {
      const settings = await getSettings();
      const drv = (settings?.drive115 || {}) as any;
      const status = drv.v2RefreshTokenStatus || 'unknown';
      const lastError = drv.v2RefreshTokenLastError;
      const lastErrorCode = drv.v2RefreshTokenLastErrorCode;
      
      // 查找或创建状态显示元素
      const rtInput = document.getElementById('drive115V2RefreshToken');
      if (!rtInput) return;
      
      let statusEl = document.getElementById('drive115V2RefreshTokenStatus') as HTMLSpanElement | null;
      if (!statusEl) {
        // 创建状态显示元素
        statusEl = document.createElement('span');
        statusEl.id = 'drive115V2RefreshTokenStatus';
        statusEl.style.cssText = 'display:inline-block; margin-left:8px; font-size:11px; padding:2px 8px; border-radius:4px;';
        
        // 插入到 refresh_token 输入框的父容器中
        const parent = rtInput.parentElement;
        if (parent) {
          // 尝试找到 label 元素
          const label = parent.querySelector('label');
          if (label) {
            label.appendChild(statusEl);
          } else {
            parent.insertBefore(statusEl, rtInput);
          }
        }
      }
      
      // 根据状态设置样式和文本
      if (status === 'valid') {
        statusEl.textContent = '✓ 有效';
        statusEl.style.color = '#2e7d32';
        statusEl.style.background = '#e8f5e9';
        statusEl.title = '刷新令牌状态正常';
      } else if (status === 'invalid') {
        statusEl.textContent = '✗ 已失效';
        statusEl.style.color = '#c62828';
        statusEl.style.background = '#ffebee';
        statusEl.title = lastError ? `${lastError}${lastErrorCode ? ` (错误码: ${lastErrorCode})` : ''}` : '需要重新授权';
      } else if (status === 'expired') {
        statusEl.textContent = '⏱ 已过期';
        statusEl.style.color = '#d84315';
        statusEl.style.background = '#fbe9e7';
        statusEl.title = lastError ? `${lastError}${lastErrorCode ? ` (错误码: ${lastErrorCode})` : ''}` : '需要重新授权';
      } else {
        statusEl.textContent = '? 未知';
        statusEl.style.color = '#757575';
        statusEl.style.background = '#f5f5f5';
        statusEl.title = '尚未验证刷新令牌状态';
      }
    } catch (e) {
      // 静默失败
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

  // 动态注入“最小自动刷新间隔(分钟)”与“最近自动刷新时间”UI
  private async injectRefreshIntervalUI(): Promise<void> {
    try {
      // 优先锚定在“提前刷新秒数”控件所在行附近
      const skewEl = document.getElementById('drive115V2AutoRefreshSkewSec') as HTMLElement | null;
      const atEl = document.getElementById('drive115V2AccessToken') as HTMLElement | null;
      let host: HTMLElement | null = null;

      const findRow = (el: HTMLElement | null): HTMLElement | null => {
        if (!el) return null;
        let cur: HTMLElement | null = el;
        for (let i = 0; i < 4 && cur; i++) {
          if (cur.classList && (cur.classList.contains('form-row') || cur.classList.contains('settings-row') || cur.classList.contains('form-group') || cur.id === 'drive115V2Pane')) return cur;
          cur = cur.parentElement as HTMLElement | null;
        }
        return el.parentElement as HTMLElement | null;
      };

      host = findRow(skewEl) || findRow(atEl);
      if (!host) return;

      // 若已存在则刷新显示；兼容老版本：
      // 1) 若缺少“下次自动刷新时间”一行，则升级为多行块
      // 2) 若信息块已存在但被放在同一行(wrapper)内，则移动到下一行（wrapper 之后），实现换行
      if (document.getElementById('drive115V2MinRefreshIntervalMin')) {
        try {
          const hasNext = !!document.getElementById('drive115V2NextRefreshAt');
          if (!hasNext) {
            // 移除旧版单行展示（含“最近… 2小时内已刷新…”在同一行）
            const oldLast = document.getElementById('drive115V2LastRefreshAt') as HTMLSpanElement | null;
            if (oldLast) {
              const oldLine = oldLast.closest('div') as HTMLElement | null;
              if (oldLine && oldLine.parentElement) {
                oldLine.parentElement.removeChild(oldLine);
              }
            }
            // 注入新版三行块
            const infoBlock = document.createElement('div');
            infoBlock.id = 'drive115V2RefreshInfoBlock';
            infoBlock.style.cssText = 'font-size:12px; color:#666; display:flex; flex-direction:column; gap:4px;';
            infoBlock.innerHTML = `
              <div>最近自动刷新时间：<span id="drive115V2LastRefreshAt" style="color:#444;">-</span></div>
              <div>下次自动刷新时间：<span id="drive115V2NextRefreshAt" style="color:#444;">-</span></div>
              <div>2小时内已刷新：<span id="drive115V2Refresh2hStat" style="color:#444;">-</span></div>
            `;
            host.appendChild(infoBlock);
          }
          // 若信息块已存在但仍位于同一行容器内，则移出到下一行
          const infoBlock = document.getElementById('drive115V2RefreshInfoBlock');
          if (infoBlock && infoBlock.parentElement) {
            const parent = infoBlock.parentElement as HTMLElement;
            const hasMinInput = !!parent.querySelector('#drive115V2MinRefreshIntervalMin');
            if (hasMinInput && parent !== host) {
              parent.removeChild(infoBlock);
              infoBlock.style.marginTop = '6px';
              infoBlock.style.flexBasis = '100%';
              (infoBlock as any).style && (infoBlock.style.width = '100%');
              host.appendChild(infoBlock);
            }
          }
        } catch {}
        await this.updateRefreshIntervalUIFromStorage();
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.style.marginTop = '8px';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '10px';
      wrapper.innerHTML = `
        <label style="font-size:12px; color:#555; display:flex; align-items:center; gap:6px;">
          最小自动刷新间隔(分钟)
          <input id="drive115V2MinRefreshIntervalMin" type="number" min="60" max="120" step="1" style="width:96px; padding:4px 6px;" />
          <span style="font-size:12px; color:#888;">范围 60-120</span>
        </label>
        <div style="font-size:12px; color:#555; display:flex; align-items:center; gap:6px;">
          <span>2小时自动刷新上限(次)</span>
          <span style="font-weight:600; color:#444;">3（固定）</span>
        </div>
      `;
      host.appendChild(wrapper);

      // 在单独一行渲染信息块，强制换行展示
      const infoBlock = document.createElement('div');
      infoBlock.id = 'drive115V2RefreshInfoBlock';
      infoBlock.style.cssText = 'font-size:12px; color:#666; display:flex; flex-direction:column; gap:4px; margin-top:6px;';
      infoBlock.innerHTML = `
        <div>最近自动刷新时间：<span id="drive115V2LastRefreshAt" style="color:#444;">-</span></div>
        <div>下次自动刷新时间：<span id="drive115V2NextRefreshAt" style="color:#444;">-</span></div>
        <div>2小时内已刷新：<span id="drive115V2Refresh2hStat" style="color:#444;">-</span></div>
      `;
      host.appendChild(infoBlock);

      const input = wrapper.querySelector('#drive115V2MinRefreshIntervalMin') as HTMLInputElement | null;
      // 输入时不强制覆盖输入框，允许清空再输入；值合法时实时保存
      input?.addEventListener('input', async () => {
        try {
          const str = (input.value ?? '').trim();
          if (str === '') return; // 允许清空
          const raw = Math.floor(Number(str));
          if (!Number.isFinite(raw)) return;
          const val = Math.min(120, Math.max(60, raw));
          const settings: any = await getSettings();
          const ns: any = { ...settings };
          ns.drive115 = { ...(settings?.drive115 || {}), v2MinRefreshIntervalMin: val };
          await saveSettings(ns);
        } catch {}
      });
      // 失焦时进行兜底与回填
      input?.addEventListener('change', async () => {
        try {
          const raw = Math.floor(Number((input.value ?? '').trim() || 60));
          const val = Math.min(120, Math.max(60, Number.isFinite(raw) ? raw : 60));
          input.value = String(val);
          const settings: any = await getSettings();
          const ns: any = { ...settings };
          ns.drive115 = { ...(settings?.drive115 || {}), v2MinRefreshIntervalMin: val };
          await saveSettings(ns);
        } catch {}
      });

      await this.updateRefreshIntervalUIFromStorage();
    } catch {}
  }

  private async updateRefreshIntervalUIFromStorage(): Promise<void> {
    try {
      const input = document.getElementById('drive115V2MinRefreshIntervalMin') as HTMLInputElement | null;
      const lastEl = document.getElementById('drive115V2LastRefreshAt') as HTMLSpanElement | null;
      const nextEl = document.getElementById('drive115V2NextRefreshAt') as HTMLSpanElement | null;
      const statEl = document.getElementById('drive115V2Refresh2hStat') as HTMLSpanElement | null;
      const settings: any = await getSettings();
      const s = settings?.drive115 || {};
      const minMin = Math.min(120, Math.max(60, Number(s.v2MinRefreshIntervalMin ?? 60) || 60));
      if (input) input.value = String(minMin);
      const last = Number(s.v2LastTokenRefreshAtSec || 0) || 0;
      if (lastEl) lastEl.textContent = last > 0 ? this.formatLocalDateTime(last) : '-';
      const maxPer2h = 3; // 固定上限
      // 计算“下次自动刷新时间”：受最小间隔与到期-提前秒数共同约束
      try {
        const skewSec = Math.max(0, Number(s.v2AutoRefreshSkewSec ?? 60) || 0);
        const expAt = typeof s.v2TokenExpiresAt === 'number' ? s.v2TokenExpiresAt : 0;
        const nextByInterval = last > 0 ? (last + minMin * 60) : 0;
        const nextByExpiry = expAt > 0 ? Math.max(0, expAt - skewSec) : 0;
        const positives = [nextByInterval, nextByExpiry].filter(v => v > 0);
        let next = 0;
        if (positives.length === 1) next = positives[0];
        else if (positives.length === 2) next = Math.max(positives[0], positives[1]); // 需要同时满足两条件，取较晚者
        if (nextEl) nextEl.textContent = next > 0 ? this.formatLocalDateTime(next) : '-';
      } catch {}
      // 2小时窗口统计
      try {
        const nowSec = Math.floor(Date.now() / 1000);
        const histRaw: any[] = Array.isArray(s.v2TokenRefreshHistorySec) ? s.v2TokenRefreshHistorySec : [];
        const hist: number[] = histRaw.map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0);
        const twoHoursAgo = nowSec - 7200;
        const cnt = hist.filter(ts => ts >= twoHoursAgo).length;
        if (statEl) statEl.textContent = `${cnt}/${maxPer2h}`;
      } catch {}
    } catch {}
  }

  private formatLocalDateTime(tsSec: number): string {
    if (!tsSec || isNaN(tsSec as any)) return '-';
    const d = new Date(tsSec * 1000);
    const Y = d.getFullYear();
    const M = d.getMonth() + 1;
    const D = d.getDate();
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mm = `${d.getMinutes()}`.padStart(2, '0');
    const ss = `${d.getSeconds()}`.padStart(2, '0');
    return `${Y}/${M}/${D}  ${hh}:${mm}:${ss}`;
  }

  // 手动刷新限频判断（与服务层自动刷新一致，最小间隔不低于30分钟）
  private async isManualRefreshAllowed_(): Promise<boolean> {
    try {
      const settings: any = await getSettings();
      const s = settings?.drive115 || {};
      const minMin = Math.min(120, Math.max(60, Number(s.v2MinRefreshIntervalMin ?? 60) || 60));
      const last = Number(s.v2LastTokenRefreshAtSec || 0) || 0;
      if (last <= 0) return true;
      const nowSec = Math.floor(Date.now() / 1000);
      const remainSec = minMin * 60 - (nowSec - last);
      if (remainSec > 0) {
        const remainMin = Math.ceil(remainSec / 60);
        const msg = `距离上次刷新不足最小间隔（${minMin}分钟），请稍后再试（剩余约 ${remainMin} 分钟）`;
        this.setUserInfoStatus(msg, 'error');
        showToast(msg, 'error');
        return false;
      }
      // 2小时窗口限制（与服务层一致）
      try {
        const maxPer2h = 3; // 固定上限
        const histRaw: any[] = Array.isArray(s.v2TokenRefreshHistorySec) ? s.v2TokenRefreshHistorySec : [];
        const hist: number[] = histRaw.map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0);
        const twoHoursAgo = nowSec - 7200;
        const cnt = hist.filter(ts => ts >= twoHoursAgo).length;
        if (cnt >= maxPer2h) {
          const msg = `2小时内刷新次数已达上限（${maxPer2h} 次），请稍后再试`;
          this.setUserInfoStatus(msg, 'error');
          showToast(msg, 'error');
          return false;
        }
      } catch {}
      return true;
    } catch {
      // 出错时不阻断
      return true;
    }
  }
}

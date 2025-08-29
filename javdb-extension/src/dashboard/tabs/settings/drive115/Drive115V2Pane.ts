import type { IDrive115Pane } from './Drive115TabsController';

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

  private getElement(): HTMLElement | null {
    if (!this.el) this.el = document.getElementById(this.elId);
    return this.el;
  }

  private bindEvents(): void {
    // 新版开关
    const enableV2Checkbox = document.getElementById('drive115EnableV2') as HTMLInputElement | null;
    enableV2Checkbox?.addEventListener('change', () => {
      const enableV2 = !!enableV2Checkbox.checked;
      this.ctx?.update({ enableV2, lastSelectedVersion: enableV2 ? 'v2' : 'v1' });
      this.ctx?.updateUI();
      this.ctx?.save?.();
    });

    // access_token 输入
    const v2AccessTokenInput = document.getElementById('drive115V2AccessToken') as HTMLInputElement | null;
    v2AccessTokenInput?.addEventListener('input', () => {
      this.ctx?.update({ v2AccessToken: (v2AccessTokenInput.value || '').trim() });
      this.ctx?.save?.();
    });

    // refresh_token 输入
    const v2RefreshTokenInput = document.getElementById('drive115V2RefreshToken') as HTMLInputElement | null;
    v2RefreshTokenInput?.addEventListener('input', () => {
      this.ctx?.update({ v2RefreshToken: (v2RefreshTokenInput.value || '').trim() });
      this.ctx?.save?.();
    });

    // 手动刷新按钮：复制 refresh_token 并打开帮助
    const manualRefreshBtn = document.getElementById('drive115V2ManualRefresh') as HTMLButtonElement | null;
    const helpLink = document.getElementById('drive115V2HelpLink') as HTMLAnchorElement | null;
    manualRefreshBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const text = (v2RefreshTokenInput?.value || '').trim();
      if (text) {
        navigator.clipboard?.writeText(text).catch(() => {});
      }
      if (helpLink?.href) window.open(helpLink.href, '_blank', 'noopener,noreferrer');
    });
  }

  mount(): void {
    this.getElement();
    this.bindEvents();
  }

  unmount(): void {
    // 目前为直接绑定，卸载时不做特殊清理（面板整体销毁时由容器负责）
  }

  show(): void {
    const el = this.getElement();
    if (el) el.style.display = '';
  }

  hide(): void {
    const el = this.getElement();
    if (el) el.style.display = 'none';
  }

  // 校验 v2 相关字段（可选填：若填写则简单长度校验）
  validate?(): string[] {
    const errors: string[] = [];
    const enabled = (document.getElementById('drive115Enabled') as HTMLInputElement | null)?.checked ?? false;
    const enableV2 = (document.getElementById('drive115EnableV2') as HTMLInputElement | null)?.checked ?? false;
    if (!enabled || !enableV2) return errors;

    const at = (document.getElementById('drive115V2AccessToken') as HTMLInputElement | null)?.value?.trim() || '';
    const rt = (document.getElementById('drive115V2RefreshToken') as HTMLInputElement | null)?.value?.trim() || '';
    if (at && at.length < 8) errors.push('access_token 看起来不正确（长度过短）');
    if (rt && rt.length < 8) errors.push('refresh_token 看起来不正确（长度过短）');
    return errors;
  }
}

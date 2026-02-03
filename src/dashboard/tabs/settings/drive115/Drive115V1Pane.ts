import type { IDrive115Pane } from './Drive115TabsController';

type Drive115PaneContext = {
  update: (patch: Partial<any>) => void;
  updateUI: () => void;
  save?: () => void;
};

export class Drive115V1Pane implements IDrive115Pane {
  private el: HTMLElement | null = null;
  constructor(
    private readonly elId: string = 'drive115V1Pane',
    private readonly ctx?: Drive115PaneContext
  ) {}

  private getElement(): HTMLElement | null {
    if (!this.el) this.el = document.getElementById(this.elId);
    return this.el;
  }

  private bindEvents(): void {
    // 下载目录ID
    const downloadDirInput = document.getElementById('drive115DownloadDir') as HTMLInputElement | null;
    const downloadDirError = document.getElementById('drive115DownloadDirError') as HTMLParagraphElement | null;
    downloadDirInput?.addEventListener('input', () => {
      const digitsOnly = (downloadDirInput.value || '').replace(/\D/g, '');
      downloadDirInput.value = digitsOnly;
      if (downloadDirError) downloadDirError.style.display = digitsOnly ? 'none' : 'block';
      this.ctx?.update({ downloadDir: digitsOnly });
      this.ctx?.updateUI();
      this.ctx?.save?.();
    });

    // 如何获取ID 折叠
    const howToToggle = document.getElementById('drive115HowToCidToggle') as HTMLButtonElement | null;
    const howToBlock = document.getElementById('drive115HowToCid') as HTMLDivElement | null;
    howToToggle?.addEventListener('click', () => {
      if (!howToBlock) return;
      const visible = howToBlock.style.display !== 'none';
      howToBlock.style.display = visible ? 'none' : 'block';
    });

    // 验证次数
    const verifyCountInput = document.getElementById('drive115VerifyCount') as HTMLInputElement | null;
    verifyCountInput?.addEventListener('input', () => {
      const value = parseInt(verifyCountInput.value || '5') || 5;
      const clamped = Math.max(1, Math.min(10, value));
      verifyCountInput.value = String(clamped);
      this.ctx?.update({ verifyCount: clamped });
      this.ctx?.save?.();
    });

    // 最大失败数
    const maxFailuresInput = document.getElementById('drive115MaxFailures') as HTMLInputElement | null;
    maxFailuresInput?.addEventListener('input', () => {
      const value = parseInt(maxFailuresInput.value || '5') || 5;
      const clamped = Math.max(0, Math.min(50, value));
      maxFailuresInput.value = String(clamped);
      this.ctx?.update({ maxFailures: clamped });
      this.ctx?.save?.();
    });

    // 自动通知
    const autoNotify = document.getElementById('drive115AutoNotify') as HTMLInputElement | null;
    autoNotify?.addEventListener('change', () => {
      this.ctx?.update({ autoNotify: !!autoNotify.checked });
      this.ctx?.save?.();
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

  // 校验 v1 相关字段
  validate?(): string[] {
    const errors: string[] = [];
    const enabled = (document.getElementById('drive115Enabled') as HTMLInputElement | null)?.checked ?? false;
    const enableV2 = (document.getElementById('drive115EnableV2') as HTMLInputElement | null)?.checked ?? false;

    if (!enabled) return errors;

    // v1 模式需要下载目录
    if (!enableV2) {
      const dir = (document.getElementById('drive115DownloadDir') as HTMLInputElement | null)?.value?.trim() || '';
      if (!dir) errors.push('启用115旧版模式时必须设置下载目录ID');
    }

    // 验证次数范围
    const verifyVal = parseInt((document.getElementById('drive115VerifyCount') as HTMLInputElement | null)?.value || '0');
    if (isNaN(verifyVal) || verifyVal < 1 || verifyVal > 10) {
      errors.push('验证次数必须在1-10之间');
    }

    // 最大失败数范围
    const maxFailVal = parseInt((document.getElementById('drive115MaxFailures') as HTMLInputElement | null)?.value || '0');
    if (isNaN(maxFailVal) || maxFailVal < 0 || maxFailVal > 50) {
      errors.push('最大失败数必须在0-50之间');
    }

    return errors;
  }
}

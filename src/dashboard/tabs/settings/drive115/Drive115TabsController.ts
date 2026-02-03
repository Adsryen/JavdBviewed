/**
 * Drive115TabsController
 * 负责管理 v1/v2 子面板的挂载/卸载与可见性切换。
 */

export type Drive115Version = 'v1' | 'v2';

export interface IDrive115Pane {
  mount(): void;
  unmount(): void;
  show(): void;
  hide(): void;
  validate?(): string[]; // 可选：由子面板返回自身校验错误
}

export interface TabsControllerOptions {
  v1Pane: IDrive115Pane;
  v2Pane: IDrive115Pane;
  getCurrentVersion: () => Drive115Version; // 从设置读取当前版本
  onVersionChange?: (next: Drive115Version) => void; // 切换后回调（可持久化）
}

export class Drive115TabsController {
  private v1: IDrive115Pane;
  private v2: IDrive115Pane;
  private getVersion: () => Drive115Version;
  private onChange?: (v: Drive115Version) => void;
  private mounted = false;
  private current: Drive115Version | null = null;

  constructor(opts: TabsControllerOptions) {
    this.v1 = opts.v1Pane;
    this.v2 = opts.v2Pane;
    this.getVersion = opts.getCurrentVersion;
    this.onChange = opts.onVersionChange;
  }

  init(): void {
    if (this.mounted) return;
    this.v1.mount();
    this.v2.mount();
    this.mounted = true;

    const initial = this.getVersion();
    this.switchTo(initial, { silent: true });
  }

  dispose(): void {
    if (!this.mounted) return;
    this.v1.unmount();
    this.v2.unmount();
    this.mounted = false;
    this.current = null;
  }

  switchTo(version: Drive115Version, opts: { silent?: boolean } = {}): void {
    if (!this.mounted) this.init();
    if (this.current === version) return;

    if (version === 'v2') {
      this.v1.hide();
      this.v2.show();
    } else {
      this.v2.hide();
      this.v1.show();
    }

    this.current = version;
    if (!opts.silent) this.onChange?.(version);
  }

  /**
   * 调用子面板的可选校验，聚合错误
   */
  validateAll(): string[] {
    const errors: string[] = [];
    const v1Err = this.v1.validate?.();
    if (v1Err && v1Err.length) errors.push(...v1Err);
    const v2Err = this.v2.validate?.();
    if (v2Err && v2Err.length) errors.push(...v2Err);
    return errors;
  }
}

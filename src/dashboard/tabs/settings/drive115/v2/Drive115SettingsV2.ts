/**
 * 115 网盘设置（v2 独立控制器）
 * 仅管理 `#drive115V2Pane` 相关 UI 与逻辑，不依赖 v1 文件。
 */

import { BaseSettingsPanel } from '../../base/BaseSettingsPanel';
import { getSettings, saveSettings } from '../../../../../utils/storage';
import { showMessage } from '../../../../ui/toast';
import { log } from '../../../../../utils/logController';
import { Drive115V2Pane } from '../Drive115V2Pane';
import { searchFilesV2 } from '../../../../../services/drive115v2/search';
import { addLogV2 } from '../../../../../services/drive115v2/logs';
// 避免从全局类型引入（其依赖 v1 类型），此处不再导入 ExtensionSettings，使用结构化 any

// v2 局部设置类型（仅包含 v2 需要的字段，避免依赖 v1 类型与默认值）
type Drive115V2LocalSettings = {
  enabled: boolean;
  v2ApiBaseUrl?: string;
  v2AccessToken?: string;
  v2RefreshToken?: string;
  v2TokenExpiresAt?: number | null;
  v2RefreshTokenStatus?: 'valid' | 'invalid' | 'expired' | 'unknown';
  v2RefreshTokenLastError?: string;
  v2RefreshTokenLastErrorCode?: number;
  v2AccessTokenStatus?: 'valid' | 'expired' | 'rate_limited' | 'unknown';
  v2AccessTokenLastError?: string;
  v2AccessTokenLastErrorCode?: number;
};

const DEFAULT_DRIVE115_V2_SETTINGS: Drive115V2LocalSettings = {
  enabled: true,
  v2ApiBaseUrl: 'https://proapi.115.com',
  v2AccessToken: '',
  v2RefreshToken: '',
  v2TokenExpiresAt: null,
};

export class Drive115SettingsPanelV2 extends BaseSettingsPanel {
  private settings: Drive115V2LocalSettings = { ...DEFAULT_DRIVE115_V2_SETTINGS };
  protected autoSaveTimeout: number | undefined = undefined;
  private isAutoSaving = false;
  private v2Pane: Drive115V2Pane | null = null;
  private expiryTimer: number | undefined = undefined;
  // 监听 storage 变化以便在外部刷新 token 后同步 UI
  private storageChangedHandler?: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void;
  // 保存成功 toast 节流
  private lastSaveToastAt: number = 0;

  constructor() {
    super({
      panelId: 'drive115-settings',
      panelName: '115网盘设置（v2）',
      autoSave: true,
      saveDelay: 1000,
      requireValidation: true
    });
  }

  // 统一的禁用视觉处理：控件本身与其父级行（若存在）一起置灰
  private applyDisabledVisual(target: HTMLElement, disabled: boolean) {
    const el = target as HTMLElement;
    const row = this.findFieldRow(el);
    const apply = (node: HTMLElement, on: boolean) => {
      if (on) {
        node.style.opacity = '0.6';
        // 仅对输入类控件设置背景；容器仅降低不透明度
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.tagName === 'BUTTON') {
          (node as HTMLElement).style.backgroundColor = '#f5f5f5';
          (node as HTMLElement).style.color = '#888';
        }
        node.setAttribute('data-disabled-visual', 'true');
        node.style.pointerEvents = node.tagName === 'BUTTON' ? 'none' : node.style.pointerEvents; // 禁用按钮的鼠标事件
      } else if (node.getAttribute('data-disabled-visual') === 'true') {
        node.style.opacity = '';
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.tagName === 'BUTTON') {
          (node as HTMLElement).style.backgroundColor = '';
          (node as HTMLElement).style.color = '';
        }
        node.style.pointerEvents = '';
        node.removeAttribute('data-disabled-visual');
      }
    };

    apply(el, disabled);
    if (row && row !== el) apply(row, disabled);
  }

  // 尝试寻找字段所在的容器行，便于一并置灰
  private findFieldRow(el: HTMLElement): HTMLElement | null {
    let cur: HTMLElement | null = el;
    for (let i = 0; i < 4 && cur; i++) { // 向上找几层即可
      if (cur.classList && (cur.classList.contains('form-row') || cur.classList.contains('settings-row') || cur.id === 'drive115V2Pane')) return cur;
      cur = cur.parentElement as HTMLElement | null;
    }
    return null;
  }

  protected initializeElements(): void {
    log.verbose('115 v2 设置 DOM 元素初始化完成');
  }

  private async loadDrive115Settings(): Promise<void> {
    try {
      const mainSettings = await getSettings();
      const merged: Drive115V2LocalSettings = {
        ...DEFAULT_DRIVE115_V2_SETTINGS,
        ...(mainSettings.drive115 || {}),
      } as Drive115V2LocalSettings;
      this.settings = merged;
    } catch (error) {
      console.warn('加载115 v2 设置失败，使用默认设置:', error);
      this.settings = { ...DEFAULT_DRIVE115_V2_SETTINGS } as any;
    }
  }

  protected bindEvents(): void {
    // 全局启用/禁用
    const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement | null;
    enabledCheckbox?.addEventListener('change', () => {
      this.settings.enabled = !!enabledCheckbox.checked;
      this.updateUI();
      this.autoSaveSettings();
      // 派发全局事件
      try {
        window.dispatchEvent(new CustomEvent('drive115:enabled-changed' as any, {
          detail: { enabled: !!this.settings.enabled }
        }));
      } catch (_) {}
    });

    // v2 专属：手动测试搜索（与 v1 彻底隔离）
    const testSearchInput = document.getElementById('testSearchInput') as HTMLInputElement | null;
    const testSearchButton = document.getElementById('testDrive115Search') as HTMLButtonElement | null;
    testSearchButton?.addEventListener('click', async () => {
      const query = testSearchInput?.value?.trim();
      if (!query) {
        showMessage('请输入搜索关键词', 'warn');
        return;
      }
      await addLogV2({ timestamp: Date.now(), level: 'debug', message: `设置面板：触发 v2 测试搜索，q="${query.slice(0,50)}"` });
      await this.testSearch(query);
    });

    // 移除日志相关事件绑定（统一到全局“日志”标签页，不在设置页展示/维护）
  }

  private updateUI(): void {
    log.verbose('更新115 v2 设置UI，当前设置:', this.settings);

    // 启用状态
    const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement | null;
    if (enabledCheckbox) enabledCheckbox.checked = !!this.settings.enabled;

    // 仅渲染 v2 Pane 所需字段
    const v2ApiBaseUrlInput = document.getElementById('drive115V2ApiBaseUrl') as HTMLInputElement | null;
    if (v2ApiBaseUrlInput) {
      const val = (this.settings.v2ApiBaseUrl || DEFAULT_DRIVE115_V2_SETTINGS.v2ApiBaseUrl || '').toString();
      v2ApiBaseUrlInput.value = val;
    }
    const v2AccessTokenInput = document.getElementById('drive115V2AccessToken') as HTMLInputElement | null;
    if (v2AccessTokenInput) v2AccessTokenInput.value = this.settings.v2AccessToken || '';
    const v2RefreshTokenInput = document.getElementById('drive115V2RefreshToken') as HTMLInputElement | null;
    if (v2RefreshTokenInput) v2RefreshTokenInput.value = this.settings.v2RefreshToken || '';

    // v2 自动刷新：回填 UI 状态与提前刷新秒数
    const v2AutoRefreshCheckbox = document.getElementById('drive115V2AutoRefresh') as HTMLInputElement | null;
    if (v2AutoRefreshCheckbox) {
      // 默认开启：当未设置时也视为 true
      const on = (this.settings as any).v2AutoRefresh;
      v2AutoRefreshCheckbox.checked = (on !== false);
    }
    const v2AutoRefreshSkewInput = document.getElementById('drive115V2AutoRefreshSkewSec') as HTMLInputElement | null;
    if (v2AutoRefreshSkewInput) {
      const raw = (this.settings as any).v2AutoRefreshSkewSec;
      const skew = Math.max(0, Number(raw ?? 60) || 0);
      v2AutoRefreshSkewInput.value = String(Math.floor(skew));
    }

    // 到期显示（并启动倒计时）
    const expiryEl = document.getElementById('drive115V2TokenExpiry') as HTMLSpanElement | null;
    if (expiryEl) {
      const ts = (this.settings as any).v2TokenExpiresAt as number | undefined;
      if (typeof ts === 'number' && ts > 0) {
        const now = Math.floor(Date.now() / 1000);
        const remain = ts - now;
        const dateTimeText = this.formatDateTime(ts) || '';
        const remainText = remain > 0 ? this.formatRemain(remain) : '已过期';
        expiryEl.textContent = `${dateTimeText}（${remainText}）`;
        expiryEl.style.color = remain > 0 ? (remain <= 3600 ? '#ef6c00' : '#2e7d32') : '#c62828';
        this.startExpiryCountdown(ts);
      } else if ((this.settings.v2AccessToken || '').trim()) {
        expiryEl.textContent = '已填写（待验证）';
        expiryEl.style.color = '#888';
        this.stopExpiryCountdown();
      } else {
        expiryEl.textContent = '未填写';
        expiryEl.style.color = '#888';
        this.stopExpiryCountdown();
      }
    }

    // 禁用策略：由总开关 enabled 控制交互
    const enableInteractive = !!this.settings.enabled;
    const allowIds = new Set<string>(['drive115Enabled']);

    // 1) 容器内批量处理
    const v2PaneRoot = document.getElementById('drive115V2Pane');
    if (v2PaneRoot) {
      const interactive = v2PaneRoot.querySelectorAll('input, textarea, select, button');
      interactive.forEach((el) => {
        const id = (el as HTMLElement).id || '';
        const shouldEnable = allowIds.has(id) ? true : enableInteractive;
        const ctrl = el as HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement | HTMLSelectElement;
        ctrl.disabled = !shouldEnable;
        this.applyDisabledVisual(ctrl as unknown as HTMLElement, !shouldEnable);
      });
    }

    // 2) 可能不在容器内或被选择器遗漏的已知控件（按 ID 明确设置）
    const knownIds = [
      'drive115V2ApiBaseUrl',
      'drive115V2AccessToken',
      'drive115V2RefreshToken',
      'testSearchInput',
      'testDrive115Search',
      'drive115V2ValidateToken',
      'drive115V2ManualRefresh',
      // 已移除设置页日志功能的相关按钮ID
    ];
    knownIds.forEach(id => {
      const el = document.getElementById(id) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement | null);
      if (!el) return;
      const shouldEnable = allowIds.has(id) ? true : enableInteractive;
      el.disabled = !shouldEnable;
      this.applyDisabledVisual(el as unknown as HTMLElement, !shouldEnable);
    });

    const v2Pane = document.getElementById('drive115V2Pane') as HTMLDivElement | null;
    if (v2Pane) v2Pane.style.display = 'block';
  }

  private async testSearch(query: string): Promise<void> {
    const button = document.getElementById('testDrive115Search') as HTMLButtonElement | null;
    const originalText = button?.textContent || '测试搜索';
    try {
      if (button) {
        button.disabled = true;
        button.textContent = '测试中...';
      }
      const ret = await searchFilesV2({ search_value: query, limit: 20, offset: 0 });
      if (!ret.success) {
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: `设置面板：v2 测试搜索失败：${ret.message || '未知错误'}` });
        throw new Error(ret.message || '搜索失败');
      }
      const results = Array.isArray(ret.data) ? ret.data : [];
      const count = results.length;
      showMessage(`搜索测试成功（v2），找到 ${count} 个结果`, 'success');
      await addLogV2({ timestamp: Date.now(), level: 'info', message: `设置面板：v2 测试搜索成功，返回 ${count} 条` });
      this.displayTestResults(results as any[], query);
    } catch (err) {
      console.error('115 v2 搜索测试失败:', err);
      showMessage('搜索测试失败，请检查 access_token 与网络', 'error');
      await addLogV2({ timestamp: Date.now(), level: 'error', message: `设置面板：v2 测试搜索异常：${(err as any)?.message || err || '未知异常'}` });
      this.clearTestResults();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  private displayTestResults(results: any[], query: string): void {
    const resultsContainer = document.getElementById('testResults');
    if (!resultsContainer) return;
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="test-result-empty">
          <p>未找到包含"${this.escapeHtml(query)}"的文件</p>
        </div>
      `;
      return;
    }
    const displayResults = results.slice(0, 5);
    resultsContainer.innerHTML = `
      <div class="test-result-header">
        <h5>搜索结果 (显示前${displayResults.length}个，共${results.length}个)</h5>
      </div>
      <div class="test-result-list">
        ${displayResults.map(file => `
          <div class="test-result-item">
            <div class="file-name">${this.escapeHtml(this.getFileName(file))}</div>
            <div class="file-info">
              <span class="file-type">${this.getTypeText(file)}</span>
              ${this.getIsFile(file) ? `<span class=\"file-size\">${this.formatFileSize(this.getFileSize(file))}</span>` : ''}
              <span class="file-time">${this.formatTime(this.getFileTime(file))}</span>
            </div>
            ${file?.pick_code ? `<div class=\"file-extra\">提取码：${this.escapeHtml(String(file.pick_code))}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ${results.length > 5 ? `<p class=\"test-result-more\">还有 ${results.length - 5} 个结果未显示</p>` : ''}
    `;
  }

  private clearTestResults(): void {
    const resultsContainer = document.getElementById('testResults');
    if (resultsContainer) resultsContainer.innerHTML = '';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatTime(timestamp: string | number): string {
    if (!timestamp) return '';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleDateString('zh-CN');
  }

  // 统一字段映射：兼容 v1 与 v2 返回结构
  private getFileName(file: any): string {
    return (file?.n || file?.name || file?.file_name || '未知文件') as string;
  }

  private getFileSize(file: any): number {
    const val = file?.s ?? file?.size ?? file?.file_size;
    const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
    return Number.isFinite(num) && num > 0 ? num : 0;
  }

  private getFileTime(file: any): string | number {
    return (file?.user_utime ?? file?.user_ptime ?? file?.t ?? file?.time ?? '') as any;
  }

  private getIsFile(file: any): boolean {
    const cat = file?.file_category ?? file?.fc;
    const s = String(cat ?? '');
    return s === '1'; // 文档：1 文件；0 文件夹
  }

  private getTypeText(file: any): string {
    return this.getIsFile(file) ? '文件' : '文件夹';
  }

  private formatDateTime(tsSec: number): string {
    if (!tsSec || isNaN(tsSec as any)) return '';
    const d = new Date(tsSec * 1000);
    const Y = d.getFullYear();
    const M = d.getMonth() + 1;
    const D = d.getDate();
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mm = `${d.getMinutes()}`.padStart(2, '0');
    const ss = `${d.getSeconds()}`.padStart(2, '0');
    return `${Y}/${M}/${D}  ${hh}:${mm}:${ss}`;
  }

  private formatRemain(sec: number): string {
    if (!sec || sec <= 0) return '已过期';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (d > 0) return `${d}天${h}小时${m}分钟${s}秒`;
    if (h > 0) return `${h}小时${m}分钟${s}秒`;
    if (m > 0) return `${m}分钟${s}秒`;
    return `${s}秒`;
  }

  // 已移除设置页日志功能：refreshLog / clearLog / exportLog / displayLogs

  private autoSaveSettings(): void {
    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    this.updateAutoSaveStatus('saving');
    this.autoSaveTimeout = window.setTimeout(async () => {
      try {
        this.isAutoSaving = true;
        const currentSettings: any = await getSettings();
        const newSettings: any = { ...currentSettings, drive115: { ...(currentSettings.drive115 || {}), ...(this.settings as any) } } as any;
        await saveSettings(newSettings);
        this.updateAutoSaveStatus('saved');
        setTimeout(() => { if (!this.isAutoSaving) this.updateAutoSaveStatus('idle'); }, 2000);
      } catch (e) {
        console.error('保存115 v2 设置失败:', e);
        this.updateAutoSaveStatus('error');
        showMessage('保存设置失败', 'error');
      } finally {
        this.isAutoSaving = false;
      }
    }, 1000);
  }

  private updateAutoSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error'): void {
    const statusEl = document.getElementById('drive115AutoSaveStatus') as HTMLSpanElement | null;
    if (!statusEl) return;
    const statusMap = {
      idle: { text: '设置修改后自动保存，无需手动操作', class: 'status-idle' },
      saving: { text: '正在保存...', class: 'status-saving' },
      saved: { text: '✓ 已保存', class: 'status-saved' },
      error: { text: '✗ 保存失败', class: 'status-error' }
    } as const;
    const { text, class: className } = statusMap[status];
    statusEl.textContent = text;
    statusEl.className = `auto-save-status ${className}`;
    // 保存成功时右下角 toast 提示（节流避免过于频繁）
    if (status === 'saved') {
      try {
        const now = Date.now();
        if (!this.lastSaveToastAt || now - this.lastSaveToastAt > 3000) {
          showMessage('设置已保存', 'success');
          this.lastSaveToastAt = now;
        }
      } catch {}
    }
  }

  async reset(): Promise<void> {
    this.settings = { ...DEFAULT_DRIVE115_V2_SETTINGS } as any;
    this.updateUI();
    await this.saveSettings();
  }

  getSettings(): any {
    return { drive115: { ...(this.settings as any) } };
  }

  setSettings(settings: any): void {
    if (settings.drive115) {
      this.settings = { ...this.settings, ...(settings.drive115 as any) } as Drive115V2LocalSettings;
      this.updateUI();
    }
  }

  protected unbindEvents(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = undefined;
    }
    this.stopExpiryCountdown();
    // 卸载 storage 监听，避免内存泄漏
    try {
      if (this.storageChangedHandler) {
        chrome.storage.onChanged.removeListener(this.storageChangedHandler);
        this.storageChangedHandler = undefined;
      }
    } catch {}
  }

  // 立刻保存设置（关键项：避免在自动保存延迟期间刷新导致丢失）
  private async saveImmediately(): Promise<void> {
    try {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = undefined;
      }
      this.updateAutoSaveStatus('saving');
      this.isAutoSaving = true;
      const currentSettings: any = await getSettings();
      const newSettings: any = { ...currentSettings, drive115: { ...(currentSettings.drive115 || {}), ...(this.settings as any) } } as any;
      await saveSettings(newSettings);
      this.updateAutoSaveStatus('saved');
      setTimeout(() => { if (!this.isAutoSaving) this.updateAutoSaveStatus('idle'); }, 1200);
    } catch (e) {
      console.error('立即保存115 v2 设置失败:', e);
      this.updateAutoSaveStatus('error');
      showMessage('保存设置失败', 'error');
    } finally {
      this.isAutoSaving = false;
    }
  }

  protected async doLoadSettings(): Promise<void> {
    await this.loadDrive115Settings();
    setTimeout(() => {
      this.updateUI();
      if (!this.v2Pane) {
        const ctx = {
          update: (patch: Partial<any>) => { this.settings = { ...(this.settings as any), ...(patch as any) } as any; },
          updateUI: () => this.updateUI(),
          // 子面板调用保存：既触发自动保存也做一次立即保存，避免刷新丢失
          save: async () => { this.autoSaveSettings(); await this.saveImmediately(); }
        };
        this.v2Pane = new Drive115V2Pane('drive115V2Pane', ctx);
        this.v2Pane.mount();
        this.v2Pane.show();
      }
      // 安装 storage 同步：当左侧面板或后台刷新了 token 时，设置页自动跟随更新
      this.setupStorageSync();
    }, 50);
    this.updateAutoSaveStatus('idle');
  }

  /**
   * 监听 chrome.storage 中 settings 的变化，自动回填 v2 token 到 UI
   */
  private setupStorageSync(): void {
    try {
      if (this.storageChangedHandler) return; // 避免重复注册
      if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
      this.storageChangedHandler = (changes, area) => {
        if (area !== 'local' || !changes['settings']) return;
        const newVal = changes['settings'].newValue || {};
        const drv: any = (newVal as any)?.drive115 || {};
        let changed = false;
        const prev = this.settings as any;
        // 同步关键字段
        if (typeof drv.v2AccessToken !== 'undefined' && prev.v2AccessToken !== drv.v2AccessToken) {
          prev.v2AccessToken = drv.v2AccessToken || '';
          changed = true;
        }
        if (typeof drv.v2RefreshToken !== 'undefined' && prev.v2RefreshToken !== drv.v2RefreshToken) {
          prev.v2RefreshToken = drv.v2RefreshToken || '';
          changed = true;
        }
        if (typeof drv.v2TokenExpiresAt !== 'undefined' && prev.v2TokenExpiresAt !== drv.v2TokenExpiresAt) {
          prev.v2TokenExpiresAt = (typeof drv.v2TokenExpiresAt === 'number' ? drv.v2TokenExpiresAt : null);
          changed = true;
        }
        if (typeof drv.v2RefreshTokenStatus !== 'undefined' && (prev as any).v2RefreshTokenStatus !== drv.v2RefreshTokenStatus) {
          (prev as any).v2RefreshTokenStatus = drv.v2RefreshTokenStatus || 'unknown';
          changed = true;
        }
        if (typeof drv.v2RefreshTokenLastError !== 'undefined' && (prev as any).v2RefreshTokenLastError !== drv.v2RefreshTokenLastError) {
          (prev as any).v2RefreshTokenLastError = drv.v2RefreshTokenLastError;
          changed = true;
        }
        if (typeof drv.v2RefreshTokenLastErrorCode !== 'undefined' && (prev as any).v2RefreshTokenLastErrorCode !== drv.v2RefreshTokenLastErrorCode) {
          (prev as any).v2RefreshTokenLastErrorCode = (typeof drv.v2RefreshTokenLastErrorCode === 'number' ? drv.v2RefreshTokenLastErrorCode : undefined);
          changed = true;
        }
        if (typeof drv.v2AccessTokenStatus !== 'undefined' && (prev as any).v2AccessTokenStatus !== drv.v2AccessTokenStatus) {
          (prev as any).v2AccessTokenStatus = drv.v2AccessTokenStatus || 'unknown';
          changed = true;
        }
        if (typeof drv.v2AccessTokenLastError !== 'undefined' && (prev as any).v2AccessTokenLastError !== drv.v2AccessTokenLastError) {
          (prev as any).v2AccessTokenLastError = drv.v2AccessTokenLastError;
          changed = true;
        }
        if (typeof drv.v2AccessTokenLastErrorCode !== 'undefined' && (prev as any).v2AccessTokenLastErrorCode !== drv.v2AccessTokenLastErrorCode) {
          (prev as any).v2AccessTokenLastErrorCode = (typeof drv.v2AccessTokenLastErrorCode === 'number' ? drv.v2AccessTokenLastErrorCode : undefined);
          changed = true;
        }
        // 同步启用状态，避免 UI 与开关不一致
        if (typeof drv.enabled === 'boolean' && this.settings.enabled !== !!drv.enabled) {
          this.settings.enabled = !!drv.enabled;
          changed = true;
        }
        if (changed) {
          this.updateUI();
        }
      };
      chrome.storage.onChanged.addListener(this.storageChangedHandler);
    } catch {}
  }

  // 启动倒计时，每秒更新剩余时间与颜色
  private startExpiryCountdown(ts: number): void {
    this.stopExpiryCountdown();
    this.expiryTimer = window.setInterval(() => {
      const el = document.getElementById('drive115V2TokenExpiry') as HTMLSpanElement | null;
      if (!el) return;
      const now = Math.floor(Date.now() / 1000);
      const remain = ts - now;
      const dateTimeText = this.formatDateTime(ts) || '';
      const remainText = remain > 0 ? this.formatRemain(remain) : '已过期';
      el.textContent = `${dateTimeText}（${remainText}）`;
      el.style.color = remain > 0 ? (remain <= 3600 ? '#ef6c00' : '#2e7d32') : '#c62828';
      if (remain <= -1) {
        this.stopExpiryCountdown();
      }
    }, 1000);
  }

  private stopExpiryCountdown(): void {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
      this.expiryTimer = undefined;
    }
  }

  protected async doSaveSettings(): Promise<{ success: boolean; message?: string }> {
    try {
      const currentSettings: any = await getSettings();
      const newSettings: any = { ...currentSettings, drive115: { ...(currentSettings.drive115 || {}), ...(this.settings as any) } } as any;
      await saveSettings(newSettings);
      return { success: true };
    } catch (error) {
      console.error('保存115 v2 设置失败:', error);
      return { success: false, message: '保存设置时发生错误' };
    }
  }

  protected doValidateSettings(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (this.settings.enabled) {
      const at = this.settings.v2AccessToken || '';
      const rt = this.settings.v2RefreshToken || '';
      if (at && at.length < 8) errors.push('access_token 看起来不正确（长度过短）');
      if (rt && rt.length < 8) errors.push('refresh_token 看起来不正确（长度过短）');
    }
    return { isValid: errors.length === 0, errors };
  }

  protected doGetSettings(): any {
    return { drive115: { ...(this.settings as any) } };
  }

  protected doSetSettings(settings: any): void {
    if (settings.drive115) {
      this.settings = { ...this.settings, ...(settings.drive115 as any) } as Drive115V2LocalSettings;
      this.updateUI();
    }
  }
}

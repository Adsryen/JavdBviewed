/**
 * 115 网盘设置（v2 独立控制器）
 * 仅管理 `#drive115V2Pane` 相关 UI 与逻辑，不依赖 v1 文件。
 */

import { BaseSettingsPanel } from '../../base/BaseSettingsPanel';
import { getSettings, saveSettings } from '../../../../../utils/storage';
import { showMessage } from '../../../../ui/toast';
import { log } from '../../../../../utils/logController';
import { Drive115V2Pane } from '../Drive115V2Pane';
import { testSearchV2 } from '../../../../../services/drive115v2/search';
import { getLogsV2, clearLogsV2 } from '../../../../../services/drive115v2/logs';
// 避免从全局类型引入（其依赖 v1 类型），此处不再导入 ExtensionSettings，使用结构化 any

// v2 局部设置类型（仅包含 v2 需要的字段，避免依赖 v1 类型与默认值）
type Drive115V2LocalSettings = {
  enabled: boolean;
  enableV2: boolean;
  lastSelectedVersion: 'v2';
  v2ApiBaseUrl?: string;
  v2AccessToken?: string;
  v2RefreshToken?: string;
  v2TokenExpiresAt?: number | null;
};

const DEFAULT_DRIVE115_V2_SETTINGS: Drive115V2LocalSettings = {
  enabled: true,
  enableV2: true,
  lastSelectedVersion: 'v2',
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
      await this.testSearch(query);
    });

    // 日志（v2 自有存储）
    const refreshLogButton = document.getElementById('drive115RefreshLog') as HTMLButtonElement | null;
    const clearLogButton = document.getElementById('drive115ClearLog') as HTMLButtonElement | null;
    const exportLogButton = document.getElementById('drive115ExportLog') as HTMLButtonElement | null;
    refreshLogButton?.addEventListener('click', () => this.refreshLog());
    clearLogButton?.addEventListener('click', () => this.clearLog());
    exportLogButton?.addEventListener('click', () => this.exportLog());
  }

  private updateUI(): void {
    log.verbose('更新115 v2 设置UI，当前设置:', this.settings);

    // 启用状态
    const enabledCheckbox = document.getElementById('drive115Enabled') as HTMLInputElement | null;
    if (enabledCheckbox) enabledCheckbox.checked = !!this.settings.enabled;

    // 新版开关（与存储同步）
    const enableV2Checkbox = document.getElementById('drive115EnableV2') as HTMLInputElement | null;
    if (enableV2Checkbox) enableV2Checkbox.checked = !!this.settings.enableV2;

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
      } else {
        expiryEl.textContent = '未知';
        expiryEl.style.color = '#888';
        this.stopExpiryCountdown();
      }
    }

    // 禁用策略：当 v2 关闭时，下面的所有 v2 控件均不可用（仅保留版本按钮与新版开关）
    const enableInteractive = !!this.settings.enabled && !!this.settings.enableV2;
    const allowIds = new Set(['drive115EnableV2', 'drive115VerV1Btn', 'drive115VerV2Btn']);

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
      'drive115V2ManualRefresh',
      'drive115RefreshLog',
      'drive115ClearLog',
      'drive115ExportLog'
    ];
    knownIds.forEach(id => {
      const el = document.getElementById(id) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement | null);
      if (!el) return;
      const shouldEnable = allowIds.has(id) ? true : enableInteractive;
      el.disabled = !shouldEnable;
      this.applyDisabledVisual(el as unknown as HTMLElement, !shouldEnable);
    });

    // 仅显示 v2 面板
    const v1Pane = document.getElementById('drive115V1Pane') as HTMLDivElement | null;
    const v2Pane = document.getElementById('drive115V2Pane') as HTMLDivElement | null;
    if (v1Pane) v1Pane.style.display = 'none';
    if (v2Pane) v2Pane.style.display = 'block';

    // 版本按钮样式（仅使“新版”高亮）
    const v1Btn = document.getElementById('drive115VerV1Btn') as HTMLButtonElement | null;
    const v2Btn = document.getElementById('drive115VerV2Btn') as HTMLButtonElement | null;
    if (v1Btn) v1Btn.classList.remove('active');
    if (v2Btn) v2Btn.classList.add('active');
    if (v1Btn) v1Btn.style.background = '#f7f7f7';
    if (v2Btn) v2Btn.style.background = '#e3f2fd';
  }

  private async testSearch(query: string): Promise<void> {
    const button = document.getElementById('testDrive115Search') as HTMLButtonElement | null;
    const originalText = button?.textContent || '测试搜索';
    try {
      if (button) {
        button.disabled = true;
        button.textContent = '测试中...';
      }
      const results = await testSearchV2(query);
      const count = Array.isArray(results) ? results.length : 0;
      showMessage(`搜索测试成功（v2），找到 ${count} 个结果`, 'success');
      this.displayTestResults(Array.isArray(results) ? results : [], query);
    } catch (err) {
      console.error('115 v2 搜索测试失败:', err);
      showMessage('搜索测试失败，请检查 access_token 与网络', 'error');
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
            <div class="file-name">${this.escapeHtml(file.n || file.name || '未知文件')}</div>
            <div class="file-info">
              <span class="file-size">${this.formatFileSize(file.s || file.size || 0)}</span>
              <span class="file-time">${this.formatTime(file.t || file.time || '')}</span>
            </div>
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

  private async refreshLog(): Promise<void> {
    try {
      const logs = await getLogsV2();
      this.displayLogs(logs as any);
    } catch (error) {
      console.error('刷新115 v2 日志失败:', error);
      showMessage('刷新日志失败', 'error');
    }
  }

  private async clearLog(): Promise<void> {
    try {
      await clearLogsV2();
      this.displayLogs([]);
      showMessage('日志已清空', 'success');
    } catch (error) {
      console.error('清空115 v2 日志失败:', error);
      showMessage('清空日志失败', 'error');
    }
  }

  private async exportLog(): Promise<void> {
    try {
      const logs = await getLogsV2();
      const logText = logs.map((l: any) => `[${new Date(l.timestamp).toLocaleString()}] ${l.level}: ${l.message}`).join('\n');
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `115-v2-logs-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('日志已导出', 'success');
    } catch (error) {
      console.error('导出115 v2 日志失败:', error);
      showMessage('导出日志失败', 'error');
    }
  }

  private displayLogs(logs: any[]): void {
    const logContainer = document.getElementById('drive115LogContainer') as HTMLDivElement | null;
    if (!logContainer) return;
    if (!Array.isArray(logs) || logs.length === 0) {
      logContainer.innerHTML = '<p class="no-logs">暂无日志记录</p>';
      return;
    }
    const html = logs.map((log: any) => `
      <div class="log-entry log-${log.level}">
        <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
        <span class="log-level">[${(log.level || '').toString().toUpperCase()}]</span>
        <span class="log-message">${log.message}</span>
      </div>
    `).join('');
    logContainer.innerHTML = html;
  }

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
    }, 50);
    this.updateAutoSaveStatus('idle');
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

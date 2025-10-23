/**
 * 报告（Insights）设置面板
 * 暴露聚合参数：topN/阈值/最小计数/rising/falling
 */

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsValidationResult, SettingsSaveResult } from '../types';
import { STATE } from '../../../state';
import { saveSettings } from '../../../../utils/storage';

export class InsightsSettingsPanel extends BaseSettingsPanel {
  private topNInput!: HTMLInputElement;
  private thresholdInput!: HTMLInputElement; // changeThresholdRatio (0~1)
  private minTagCountInput!: HTMLInputElement;
  private risingLimitInput!: HTMLInputElement;
  private fallingLimitInput!: HTMLInputElement;
  private statusScopeSelect!: HTMLSelectElement; // statusScope
  private autoMonthlyCheckbox!: HTMLInputElement; // autoMonthlyEnabled
  private autoCompensateCheckbox!: HTMLInputElement; // autoCompensateOnStartupEnabled
  private sourceSelect!: HTMLSelectElement; // insights.source
  private minMonthlySamplesInput!: HTMLInputElement; // insights.minMonthlySamples
  private autoMinuteInput!: HTMLInputElement; // insights.autoMonthlyMinuteOfDay
  private autoTipDiv!: HTMLDivElement; // 显著提示容器

  constructor() {
    super({
      panelId: 'insights-settings',
      panelName: '报告（Insights）',
      autoSave: true,
      saveDelay: 600,
      requireValidation: true,
    });
  }

  protected initializeElements(): void {
    this.topNInput = document.getElementById('insightsTopN') as HTMLInputElement;
    this.thresholdInput = document.getElementById('insightsChangeThresholdRatio') as HTMLInputElement;
    this.minTagCountInput = document.getElementById('insightsMinTagCount') as HTMLInputElement;
    this.risingLimitInput = document.getElementById('insightsRisingLimit') as HTMLInputElement;
    this.fallingLimitInput = document.getElementById('insightsFallingLimit') as HTMLInputElement;
    this.statusScopeSelect = document.getElementById('insightsStatusScope') as HTMLSelectElement;
    this.autoMonthlyCheckbox = document.getElementById('insightsAutoMonthlyEnabled') as HTMLInputElement;
    this.autoCompensateCheckbox = document.getElementById('insightsAutoCompensateEnabled') as HTMLInputElement;
    this.sourceSelect = document.getElementById('insightsSource') as HTMLSelectElement;
    this.minMonthlySamplesInput = document.getElementById('insightsMinMonthlySamples') as HTMLInputElement;
    this.autoMinuteInput = document.getElementById('insightsAutoMinuteOfDay') as HTMLInputElement;
    this.autoTipDiv = document.getElementById('insights-auto-tip') as HTMLDivElement;

    if (!this.topNInput || !this.thresholdInput || !this.minTagCountInput || !this.risingLimitInput || !this.fallingLimitInput || !this.statusScopeSelect || !this.autoMonthlyCheckbox || !this.autoCompensateCheckbox || !this.sourceSelect || !this.minMonthlySamplesInput || !this.autoMinuteInput || !this.autoTipDiv) {
      throw new Error('Insights 设置相关的DOM元素未找到');
    }
  }

  protected bindEvents(): void {
    const handler = this.handleChange.bind(this);
    this.topNInput.addEventListener('input', handler);
    this.thresholdInput.addEventListener('input', handler);
    this.minTagCountInput.addEventListener('input', handler);
    this.risingLimitInput.addEventListener('input', handler);
    this.fallingLimitInput.addEventListener('input', handler);
    this.statusScopeSelect.addEventListener('change', handler);
    this.autoMonthlyCheckbox.addEventListener('change', handler);
    this.autoCompensateCheckbox.addEventListener('change', handler);
    this.sourceSelect.addEventListener('change', handler);
    this.minMonthlySamplesInput.addEventListener('input', handler);
    this.autoMinuteInput.addEventListener('input', handler);
  }

  protected unbindEvents(): void {
    // 简化：由于使用了 bind，解绑略过
  }

  protected async doLoadSettings(): Promise<void> {
    const settings = STATE.settings as ExtensionSettings;
    const ins = settings?.insights || {};

    this.topNInput.value = String(ins.topN ?? 10);
    this.thresholdInput.value = String(ins.changeThresholdRatio ?? 0.08);
    this.minTagCountInput.value = String(ins.minTagCount ?? 3);
    this.risingLimitInput.value = String(ins.risingLimit ?? 5);
    this.fallingLimitInput.value = String(ins.fallingLimit ?? 5);
    this.statusScopeSelect.value = String(ins.statusScope ?? 'viewed');
    this.autoMonthlyCheckbox.checked = !!ins.autoMonthlyEnabled;
    this.autoCompensateCheckbox.checked = !!ins.autoCompensateOnStartupEnabled;
    this.sourceSelect.value = String(ins.source ?? 'views');
    this.minMonthlySamplesInput.value = String(ins.minMonthlySamples ?? 10);
    this.autoMinuteInput.value = String(Number.isFinite(ins.autoMonthlyMinuteOfDay as any) ? ins.autoMonthlyMinuteOfDay : 10);
    this.updateAutoTip();
  }

  protected async doSaveSettings(): Promise<SettingsSaveResult> {
    try {
      const current = STATE.settings as ExtensionSettings;
      const nextInsights = {
        topN: this.parseIntSafe(this.topNInput.value, 10),
        changeThresholdRatio: this.parseFloatSafe(this.thresholdInput.value, 0.08),
        minTagCount: this.parseIntSafe(this.minTagCountInput.value, 3),
        risingLimit: this.parseIntSafe(this.risingLimitInput.value, 5),
        fallingLimit: this.parseIntSafe(this.fallingLimitInput.value, 5),
        statusScope: (this.statusScopeSelect.value as any) || 'viewed',
        autoMonthlyEnabled: !!this.autoMonthlyCheckbox.checked,
        autoCompensateOnStartupEnabled: !!this.autoCompensateCheckbox.checked,
        source: (this.sourceSelect.value as any) || 'views',
        minMonthlySamples: this.parseIntSafe(this.minMonthlySamplesInput.value, 10),
        autoMonthlyMinuteOfDay: this.parseIntSafe(this.autoMinuteInput.value, 10),
      } as NonNullable<ExtensionSettings['insights']>;

      const newSettings: ExtensionSettings = {
        ...current,
        insights: nextInsights,
      };

      await saveSettings(newSettings);
      STATE.settings = newSettings;

      return { success: true, savedSettings: { insights: nextInsights } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '保存失败' };
    }
  }

  protected doValidateSettings(): SettingsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const topN = this.parseIntSafe(this.topNInput.value, 10);
    if (!Number.isFinite(topN) || topN < 1 || topN > 50) errors.push('TopN 需在 1-50 之间');

    const ratio = this.parseFloatSafe(this.thresholdInput.value, 0.08);
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) errors.push('显著变化阈值需在 0-1 之间');

    const minCount = this.parseIntSafe(this.minTagCountInput.value, 3);
    if (!Number.isFinite(minCount) || minCount < 0 || minCount > 999) errors.push('最小计数需在 0-999 之间');

    const rising = this.parseIntSafe(this.risingLimitInput.value, 5);
    if (!Number.isFinite(rising) || rising < 0 || rising > 50) errors.push('上升标签展示条数需在 0-50 之间');

    const falling = this.parseIntSafe(this.fallingLimitInput.value, 5);
    if (!Number.isFinite(falling) || falling < 0 || falling > 50) errors.push('下降标签展示条数需在 0-50 之间');

    const statusScope = String(this.statusScopeSelect.value || 'viewed');
    if (!['viewed','viewed_browsed','viewed_browsed_want'].includes(statusScope)) errors.push('统计状态口径取值不合法');

    const source = String(this.sourceSelect.value || 'views');
    if (!['views','compare','auto'].includes(source)) errors.push('数据源模式取值不合法');

    const minMonthlySamples = this.parseIntSafe(this.minMonthlySamplesInput.value, 10);
    if (!Number.isFinite(minMonthlySamples) || minMonthlySamples < 0 || minMonthlySamples > 999) errors.push('最小样本量需在 0-999 之间');

    const minute = this.parseIntSafe(this.autoMinuteInput.value, 10);
    if (!Number.isFinite(minute) || minute < 0 || minute > 1439) errors.push('触发分钟需在 0-1439 之间');

    return { isValid: errors.length === 0, errors: errors.length ? errors : undefined, warnings: warnings.length ? warnings : undefined };
  }

  protected doGetSettings(): Partial<ExtensionSettings> {
    return {
      insights: {
        topN: this.parseIntSafe(this.topNInput.value, 10),
        changeThresholdRatio: this.parseFloatSafe(this.thresholdInput.value, 0.08),
        minTagCount: this.parseIntSafe(this.minTagCountInput.value, 3),
        risingLimit: this.parseIntSafe(this.risingLimitInput.value, 5),
        fallingLimit: this.parseIntSafe(this.fallingLimitInput.value, 5),
        statusScope: (this.statusScopeSelect.value as any) || 'viewed',
        autoMonthlyEnabled: !!this.autoMonthlyCheckbox.checked,
        autoCompensateOnStartupEnabled: !!this.autoCompensateCheckbox.checked,
        source: (this.sourceSelect.value as any) || 'views',
        minMonthlySamples: this.parseIntSafe(this.minMonthlySamplesInput.value, 10),
        autoMonthlyMinuteOfDay: this.parseIntSafe(this.autoMinuteInput.value, 10),
      },
    };
  }

  protected doSetSettings(settings: Partial<ExtensionSettings>): void {
    const ins = settings.insights || {};
    if (ins.topN !== undefined) this.topNInput.value = String(ins.topN);
    if (ins.changeThresholdRatio !== undefined) this.thresholdInput.value = String(ins.changeThresholdRatio);
    if (ins.minTagCount !== undefined) this.minTagCountInput.value = String(ins.minTagCount);
    if (ins.risingLimit !== undefined) this.risingLimitInput.value = String(ins.risingLimit);
    if (ins.fallingLimit !== undefined) this.fallingLimitInput.value = String(ins.fallingLimit);
    if (ins.statusScope !== undefined) this.statusScopeSelect.value = String(ins.statusScope);
    if (ins.autoMonthlyEnabled !== undefined) this.autoMonthlyCheckbox.checked = !!ins.autoMonthlyEnabled;
    if (ins.autoCompensateOnStartupEnabled !== undefined) this.autoCompensateCheckbox.checked = !!ins.autoCompensateOnStartupEnabled;
    if (ins.source !== undefined) this.sourceSelect.value = String(ins.source);
    if (ins.minMonthlySamples !== undefined) this.minMonthlySamplesInput.value = String(ins.minMonthlySamples);
    if (ins.autoMonthlyMinuteOfDay !== undefined) this.autoMinuteInput.value = String(ins.autoMonthlyMinuteOfDay);
    this.updateAutoTip();
  }

  private handleChange(): void {
    this.emit('change');
    this.scheduleAutoSave();
    this.updateAutoTip();
  }

  private updateAutoTip(): void {
    try {
      const on = !!this.autoMonthlyCheckbox?.checked;
      const onComp = !!this.autoCompensateCheckbox?.checked;
      const minute = this.parseIntSafe(this.autoMinuteInput?.value || '10', 10);
      const hh = Math.floor(minute / 60);
      const mm = minute % 60;
      const hhStr = String(hh).padStart(2, '0');
      const mmStr = String(mm).padStart(2, '0');
      const lines: string[] = [];
      if (on) lines.push(`已启用自动月报：每月 1 日 ${hhStr}:${mmStr} 自动生成上月报告。`);
      if (onComp) lines.push('已启用启动补偿：如错过定时，将在浏览器启动/扩展唤醒时自动补生成。');
      if (this.autoTipDiv) {
        if (lines.length > 0) {
          this.autoTipDiv.style.display = 'block';
          this.autoTipDiv.textContent = lines.join(' ');
        } else {
          this.autoTipDiv.style.display = 'none';
          this.autoTipDiv.textContent = '';
        }
      }
    } catch {}
  }

  private parseIntSafe(v: string, def: number): number {
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : def;
  }

  private parseFloatSafe(v: string, def: number): number {
    const n = parseFloat(String(v).trim());
    return Number.isFinite(n) ? n : def;
  }
}

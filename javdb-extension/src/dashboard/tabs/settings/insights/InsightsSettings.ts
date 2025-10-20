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

    if (!this.topNInput || !this.thresholdInput || !this.minTagCountInput || !this.risingLimitInput || !this.fallingLimitInput) {
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
  }

  private handleChange(): void {
    this.emit('change');
    this.scheduleAutoSave();
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

import { BaseSettingsPanel } from '../base/BaseSettingsPanel';
import type { ExtensionSettings } from '../../../../types';
import type { SettingsPanelConfig, SettingsSaveResult, SettingsValidationResult } from '../types';
import { renderDashboardVersionInfo } from '../../../../apps/dashboard/dashboardVersionInfo';

export class AboutSettings extends BaseSettingsPanel {
  constructor() {
    const config: SettingsPanelConfig = {
      panelId: 'about-settings',
      panelName: '关于',
      requireValidation: false,
      autoSave: false,
    };
    super(config);
  }

  protected initializeElements(): void {
    renderDashboardVersionInfo('aboutVersionInfo');
  }

  protected bindEvents(): void {}

  protected unbindEvents(): void {}

  protected async doLoadSettings(): Promise<void> {
    renderDashboardVersionInfo('aboutVersionInfo');
  }

  protected async doSaveSettings(): Promise<SettingsSaveResult> {
    return { success: true };
  }

  protected doValidateSettings(): SettingsValidationResult {
    return { isValid: true };
  }

  protected doGetSettings(): Partial<ExtensionSettings> {
    return {};
  }

  protected doSetSettings(_settings: Partial<ExtensionSettings>): void {}
}

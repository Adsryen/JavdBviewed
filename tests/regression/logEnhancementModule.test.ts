/**
 * @file logEnhancementModule.test.ts
 * @description 功能增强日志模块标识回归测试
 * @module tests/regression
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

describe('log enhancement module', () => {
  it('keeps feature enhancement logs independently controllable', () => {
    const settingsMarkup = read('src/dashboard/partials/tabs/settings-log.html');
    const loggingSettings = read('src/dashboard/tabs/settings/logging/LoggingSettings.ts');
    const consoleProxy = read('src/platform/logging/consoleProxy.ts');
    const dashboardConsoleBootstrap = read('src/apps/dashboard/consoleBootstrap.ts');
    const defaultSettings = read('src/utils/config.ts');

    expect(settingsMarkup).toContain('id="logModuleEnhancement"');
    expect(settingsMarkup).toContain('功能增强');
    expect(settingsMarkup).toContain('[ENHANCEMENT]');

    expect(loggingSettings).toContain('logModuleEnhancement');
    expect(loggingSettings).toContain('modules.enhancement');
    expect(loggingSettings).toContain('consoleCategories.enhancement');

    expect(consoleProxy).toContain('enhancement: {');
    expect(consoleProxy).toContain("label: 'ENHANCEMENT'");
    expect(consoleProxy).toMatch(/Enhancement\|ListEnhancement\|CoverEnhancement\|OnlineAvailability/);
    expect(dashboardConsoleBootstrap).toContain('enhancement: {');
    expect(dashboardConsoleBootstrap).toContain("label: 'ENHANCEMENT'");

    expect(defaultSettings).toMatch(/consoleCategories:\s*\{[\s\S]*enhancement:\s*true/);
  });
});

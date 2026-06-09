import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

describe('log settings theme styles', () => {
  it('uses theme variables for the suppress console output option', () => {
    const markup = read('src/dashboard/partials/tabs/settings-log.html');
    const styles = read('src/dashboard/styles/05-pages/settings/logs.css');

    const optionMarkup = markup.match(/<div class="form-group-checkbox suppress-console-output-setting"[\s\S]*?<p class="input-description">[\s\S]*?<\/p>\s*<\/div>/)?.[0] ?? '';

    expect(optionMarkup).toContain('id="suppressConsoleOutput"');
    expect(optionMarkup).toContain('仅抑制控制台输出（数据库仍保存）');
    expect(optionMarkup).not.toContain('style=');
    expect(optionMarkup).not.toContain('#f8f9fa');
    expect(optionMarkup).not.toContain('#666');

    expect(styles).toContain('#log-settings .suppress-console-output-setting');
    expect(styles).toContain('background: var(--surface-secondary');
    expect(styles).toContain('border: 1px solid var(--border-primary');
    expect(styles).toContain('#log-settings .suppress-console-output-setting .input-description');
    expect(styles).toContain('color: var(--text-secondary)');
  });
});

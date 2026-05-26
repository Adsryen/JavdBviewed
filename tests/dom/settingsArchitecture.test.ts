import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('settings page architecture', () => {
  const extractClassTokens = (html: string): string[] => {
    return Array.from(html.matchAll(/\bclass=(["'])(.*?)\1/gs))
      .flatMap((match) => match[2].split(/\s+/).filter(Boolean));
  };

  it('keeps the dashboard settings entry on the single-page settings architecture', () => {
    const oldPartials = [
      'src/dashboard/partials/tabs/settings.html',
      'src/dashboard/partials/tabs/settings.html.bak',
      'src/dashboard/partials/tabs/settings.html.navbak',
      'src/dashboard/partials/tabs/settings.html.navbak.1761127007',
    ];

    for (const partial of oldPartials) {
      expect(fs.existsSync(path.resolve(root, partial))).toBe(false);
    }
  });

  it('keeps legacy settings shell selectors out of the shared settings stylesheet', () => {
    const cssPath = path.resolve(root, 'src/dashboard/styles/05-pages/settings/settings.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).not.toContain('旧架构样式');
    expect(css).not.toMatch(/\.settings-container\b/);
    expect(css).not.toMatch(/\.settings-sidebar\b/);
    expect(css).not.toMatch(/\.settings-nav-item\b/);
    expect(css).not.toMatch(/\.settings-menu-toggle\b/);
    expect(css).not.toMatch(/\.settings-content\b/);
    expect(css).not.toMatch(/\.settings-panel:not/);
    expect(css).not.toMatch(/\.settings-panel(?:\s|\.|,|\{)/);
  });

  it('keeps the settings subpage back button aligned to the left', () => {
    const cssPath = path.resolve(root, 'src/dashboard/styles/05-pages/settings/settings.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('.settings-page-header');
    expect(css).toContain('align-items: stretch');
    expect(css).toContain('.settings-back-btn');
    expect(css).toContain('align-self: flex-start');
    expect(css).toContain('margin-right: auto');
  });

  it('keeps translation sub-settings hidden before enhancement initialization', () => {
    const htmlPath = path.resolve(root, 'src/dashboard/partials/tabs/settings-enhancement.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const translationConfig = doc.getElementById('translationConfig');

    expect(translationConfig).not.toBeNull();
    expect(translationConfig?.getAttribute('style')).toMatch(/display\s*:\s*none/i);
  });

  it('keeps active settings partials on the settings-page shell classes', () => {
    const partialDir = path.resolve(root, 'src/dashboard/partials/tabs');
    const partials = fs
      .readdirSync(partialDir)
      .filter(file => /^settings.*\.html$/.test(file));

    for (const partial of partials) {
      const html = fs.readFileSync(path.join(partialDir, partial), 'utf8');
      const classTokens = extractClassTokens(html);

      expect(classTokens, partial).not.toContain('settings-panel-header');
      expect(classTokens, partial).not.toContain('settings-panel-body');
      expect(classTokens, partial).not.toContain('settings-container');
      expect(classTokens, partial).not.toContain('settings-content');
      expect(
        classTokens.includes('settings-page') || classTokens.includes('settings-index'),
        partial,
      ).toBe(true);
    }
  });

  it('does not create legacy settings shell DOM from the settings bootstrap', () => {
    const sourcePath = path.resolve(root, 'src/dashboard/tabs/settings/index.ts');
    const source = fs.readFileSync(sourcePath, 'utf8');

    expect(source).not.toContain("document.querySelector('.settings-content')");
    expect(source).not.toContain("className = 'settings-panel'");
    expect(source).not.toContain('settings-panel-header');
    expect(source).not.toContain('settings-panel-body');
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function listSourceFiles(dir: string): string[] {
  const absoluteDir = path.resolve(root, dir);
  const result: string[] = [];
  const visit = (currentDir: string) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      if (/\.(ts|tsx)$/.test(entry.name)) {
        result.push(absolutePath);
      }
    }
  };
  visit(absoluteDir);
  return result;
}

function readRelativeImports(source: string): string[] {
  const imports: string[] = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith('.')) imports.push(specifier);
    }
  }

  return imports;
}

function resolveImportPath(fromFile: string, specifier: string): string {
  return path.relative(root, path.resolve(path.dirname(fromFile), specifier)).replace(/\\/g, '/');
}

describe('source architecture cleanup', () => {
  it('keeps generated background backup snapshots out of src/background', () => {
    const backgroundDir = path.resolve(root, 'src/background');
    const backupFiles = fs
      .readdirSync(backgroundDir)
      .filter((file) => file.endsWith('.bak') || /^background\.ts\.step/.test(file));

    expect(backupFiles).toEqual([]);
  });

  it('keeps test files out of src/background', () => {
    const backgroundDir = path.resolve(root, 'src/background');
    const testFiles = fs
      .readdirSync(backgroundDir)
      .filter((file) => /\.test\.tsx?$/.test(file));

    expect(testFiles).toEqual([]);
  });

  it('keeps feature tests out of src/utils', () => {
    const utilsDir = path.resolve(root, 'src/utils');
    const testFiles = fs
      .readdirSync(utilsDir, { recursive: true })
      .map((entry) => String(entry).replace(/\\/g, '/'))
      .filter((file) => /\.test\.tsx?$/.test(file));

    expect(testFiles).toEqual([]);
  });

  it('keeps feature tests out of src/content', () => {
    const contentDir = path.resolve(root, 'src/content');
    const testFiles = fs
      .readdirSync(contentDir, { recursive: true })
      .map((entry) => String(entry).replace(/\\/g, '/'))
      .filter((file) => /\.test\.tsx?$/.test(file));

    expect(testFiles).toEqual([]);
  });

  it('keeps platform modules independent from app and feature layers', () => {
    const violations: string[] = [];
    const forbidden = [
      /^src\/features\//,
      /^src\/content\//,
      /^src\/services\//,
      /^src\/background\//,
      /^src\/dashboard\//,
    ];

    for (const file of listSourceFiles('src/platform')) {
      const source = fs.readFileSync(file, 'utf8');
      for (const specifier of readRelativeImports(source)) {
        const target = resolveImportPath(file, specifier);
        if (forbidden.some((pattern) => pattern.test(target))) {
          violations.push(`${path.relative(root, file).replace(/\\/g, '/')} -> ${target}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps magnets domain, application, and adapters independent from content runtime', () => {
    const violations: string[] = [];

    for (const area of ['domain', 'application', 'adapters']) {
      for (const file of listSourceFiles(`src/features/magnets/${area}`)) {
        const source = fs.readFileSync(file, 'utf8');
        for (const specifier of readRelativeImports(source)) {
          const target = resolveImportPath(file, specifier);
          if (/^src\/content\//.test(target) || /^src\/background\//.test(target) || /^src\/dashboard\//.test(target)) {
            violations.push(`${path.relative(root, file).replace(/\\/g, '/')} -> ${target}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps newWorks implementation under features and services as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/newWorks/index.ts',
      'src/features/newWorks/collector.ts',
      'src/features/newWorks/manager.ts',
      'src/features/newWorks/scheduler.ts',
      'src/features/newWorks/types.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    for (const file of listSourceFiles('src/services/newWorks')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      const source = fs.readFileSync(file, 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(12);
      expect(source, `${relative} should re-export from features/newWorks`).toMatch(/features\/newWorks/);
    }
  });

  it('keeps actors implementation under features and services as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/actors/index.ts',
      'src/features/actors/actorManager.ts',
      'src/features/actors/actorSync.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const serviceFiles = [
      'src/services/actorManager.ts',
      'src/services/actorSync.ts',
    ];

    for (const relative of serviceFiles) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/actors`).toMatch(/features\/actors/);
    }
  });

  it('keeps relatedLists implementation under features and service path as a compatibility export', () => {
    const expectedFeatureFiles = [
      'src/features/relatedLists/index.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const relative = 'src/services/relatedLists/index.ts';
    const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(source, `${relative} should re-export from features/relatedLists`).toMatch(/features\/relatedLists/);
  });

  it('keeps review unlock implementation under features and service path as a compatibility export', () => {
    const expectedFeatureFiles = [
      'src/features/reviewUnlock/index.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const relative = 'src/services/reviewBreaker/index.ts';
    const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(source, `${relative} should re-export from features/reviewUnlock`).toMatch(/features\/reviewUnlock/);
  });

  it('keeps fc2Breaker implementation under features and service path as a compatibility export', () => {
    const expectedFeatureFiles = [
      'src/features/fc2Breaker/index.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const relative = 'src/services/fc2Breaker/index.ts';
    const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(source, `${relative} should re-export from features/fc2Breaker`).toMatch(/features\/fc2Breaker/);
  });

  it('keeps actorRemarks implementation under features and service path as a compatibility export', () => {
    const expectedFeatureFiles = [
      'src/features/actorRemarks/index.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const relative = 'src/services/actorRemarks/index.ts';
    const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(source, `${relative} should re-export from features/actorRemarks`).toMatch(/features\/actorRemarks/);
  });

  it('keeps insights implementation under features and services as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/insights/index.ts',
      'src/features/insights/aggregator.ts',
      'src/features/insights/compareAggregator.ts',
      'src/features/insights/generationTrace.ts',
      'src/features/insights/personas.ts',
      'src/features/insights/prompts.ts',
      'src/features/insights/reportGenerator.ts',
      'src/features/insights/contentCollector.ts',
      'src/features/insights/ui/homeInsightsWidget.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    for (const file of listSourceFiles('src/services/insights')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      const source = fs.readFileSync(file, 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/insights`).toMatch(/features\/insights/);
    }

    const legacyContentPath = 'src/content/insightsCollector.ts';
    const legacyContentSource = fs.readFileSync(path.resolve(root, legacyContentPath), 'utf8');
    const legacyContentLines = legacyContentSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    expect(legacyContentLines.length, `${legacyContentPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacyContentSource, `${legacyContentPath} should re-export from features/insights`).toMatch(/features\/insights/);

    const bootstrapSource = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    expect(bootstrapSource, 'content bootstrap should use the insights feature directly').not.toMatch(/content\/insightsCollector/);
    expect(bootstrapSource, 'content bootstrap should import initInsightsCollector from features/insights').toMatch(/features\/insights/);

    const legacyHomeWidgetPath = 'src/content/homeInsightsWidget.ts';
    const legacyHomeWidgetSource = fs.readFileSync(path.resolve(root, legacyHomeWidgetPath), 'utf8');
    const legacyHomeWidgetLines = legacyHomeWidgetSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(legacyHomeWidgetLines.length, `${legacyHomeWidgetPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacyHomeWidgetSource, `${legacyHomeWidgetPath} should re-export from features/insights`).toMatch(/features\/insights/);
  });

  it('keeps dataAggregator implementation under features and services as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/dataAggregator/index.ts',
      'src/features/dataAggregator/types.ts',
      'src/features/dataAggregator/sources/aiTranslator.ts',
      'src/features/dataAggregator/sources/blogJav.ts',
      'src/features/dataAggregator/sources/javLibrary.ts',
      'src/features/dataAggregator/sources/translator.ts',
      'src/features/dataAggregator/__tests__/dataAggregator.test.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyTest = 'src/services/dataAggregator/__tests__/dataAggregator.test.ts';
    expect(fs.existsSync(path.resolve(root, legacyTest)), `${legacyTest} should be migrated`).toBe(false);

    for (const file of listSourceFiles('src/services/dataAggregator')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      const source = fs.readFileSync(file, 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(12);
      if (relative.endsWith('/httpClient.ts')) {
        expect(source, `${relative} should re-export from platform/network`).toMatch(/platform\/network/);
      } else {
        expect(source, `${relative} should re-export from features/dataAggregator`).toMatch(/features\/dataAggregator/);
      }
    }
  });

  it('keeps update checker implementation under features and service path as a compatibility export', () => {
    const expectedFeatureFiles = [
      'src/features/updateChecker/index.ts',
      'src/features/updateChecker/checker.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const relative = 'src/services/update/checker.ts';
    const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(source, `${relative} should re-export from features/updateChecker`).toMatch(/features\/updateChecker/);
  });

  it('keeps AI service implementation under features and services as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/ai/index.ts',
      'src/features/ai/aiService.ts',
      'src/features/ai/config.ts',
      'src/features/ai/modelManager.ts',
      'src/features/ai/newApiClient.ts',
      'src/features/ai/rateLimiter.ts',
      'src/features/ai/types.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    for (const file of listSourceFiles('src/services/ai')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      const source = fs.readFileSync(file, 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/ai`).toMatch(/features\/ai/);
    }
  });

  it('keeps privacy service implementation under features and services as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/privacy/index.ts',
      'src/features/privacy/BlurController.ts',
      'src/features/privacy/LockScreen.ts',
      'src/features/privacy/PasswordService.ts',
      'src/features/privacy/PrivacyManager.ts',
      'src/features/privacy/RecoveryService.ts',
      'src/features/privacy/SessionManager.ts',
      'src/features/privacy/blurAreaMapper.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    for (const file of listSourceFiles('src/services/privacy')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      const source = fs.readFileSync(file, 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/privacy`).toMatch(/features\/privacy/);
    }
  });

  it('keeps drive115 implementation under features and services as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/drive115/index.ts',
      'src/features/drive115/legacy/index.ts',
      'src/features/drive115/legacy/config.ts',
      'src/features/drive115/legacy/types.ts',
      'src/features/drive115/app/index.ts',
      'src/features/drive115/app/adapters.ts',
      'src/features/drive115/app/logger.ts',
      'src/features/drive115/app/runtime.ts',
      'src/features/drive115/app/types.ts',
      'src/features/drive115/content/index.ts',
      'src/features/drive115/router/index.ts',
      'src/features/drive115/v2/index.ts',
      'src/features/drive115/v2/errorCodes.ts',
      'src/features/drive115/v2/logs.ts',
      'src/features/drive115/v2/pkce.ts',
      'src/features/drive115/v2/search.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    for (const serviceDir of ['src/services/drive115', 'src/services/drive115App', 'src/services/drive115Router', 'src/services/drive115v2']) {
      for (const file of listSourceFiles(serviceDir)) {
        const relative = path.relative(root, file).replace(/\\/g, '/');
        const source = fs.readFileSync(file, 'utf8');
        const nonEmptyLines = source
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
        expect(source, `${relative} should re-export from features/drive115`).toMatch(/features\/drive115/);
      }
    }

    const legacyContentPath = 'src/content/drive115.ts';
    const legacyContentSource = fs.readFileSync(path.resolve(root, legacyContentPath), 'utf8');
    const legacyContentLines = legacyContentSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(legacyContentLines.length, `${legacyContentPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacyContentSource).toMatch(/features\/drive115\/content/);

    const bootstrap = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    const magnetManager = fs.readFileSync(path.resolve(root, 'src/features/magnets/ui/magnetSearchManager.ts'), 'utf8');
    expect(bootstrap).toMatch(/features\/drive115\/content/);
    expect(magnetManager).toMatch(/drive115\/content/);
  });

  it('keeps privacy utilities under the privacy feature and utils path as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/privacy/utils/crypto.ts',
      'src/features/privacy/utils/storage.ts',
      'src/features/privacy/utils/validation.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    for (const file of listSourceFiles('src/utils/privacy')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      const source = fs.readFileSync(file, 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/privacy/utils`).toMatch(/features\/privacy\/utils/);
    }
  });

  it('keeps the background service worker entry thin and boots through apps/background', () => {
    const bootstrapPath = 'src/apps/background/bootstrap.ts';
    expect(fs.existsSync(path.resolve(root, bootstrapPath)), `${bootstrapPath} should exist`).toBe(true);

    const entryPath = 'src/background/background.ts';
    const source = fs.readFileSync(path.resolve(root, entryPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${entryPath} should stay a thin manifest entry`).toBeLessThanOrEqual(8);
    expect(source, `${entryPath} should import apps/background/bootstrap`).toMatch(/apps\/background\/bootstrap/);
  });

  it('keeps background bootstrap focused on wiring and delegates operational areas to app modules', () => {
    const bootstrapPath = 'src/apps/background/bootstrap.ts';
    const source = fs.readFileSync(path.resolve(root, bootstrapPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${bootstrapPath} should stay focused on wiring`).toBeLessThanOrEqual(180);

    const expectedModules = [
      'src/apps/background/dynamicContentScripts.ts',
      'src/apps/background/dnrRules.ts',
      'src/apps/background/routeAutoUpdate.ts',
      'src/apps/background/drive115UserRefresh.ts',
      'src/apps/background/alarmRouter.ts',
      'src/apps/background/errorHandlers.ts',
    ];

    for (const file of expectedModules) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
      expect(source, `${bootstrapPath} should import ${file}`).toContain(`./${path.basename(file, '.ts')}`);
    }
  });

  it('keeps the main content script entry thin and boots through apps/content', () => {
    const bootstrapPath = 'src/apps/content/bootstrap.ts';
    expect(fs.existsSync(path.resolve(root, bootstrapPath)), `${bootstrapPath} should exist`).toBe(true);

    const entryPath = 'src/content/index.ts';
    const source = fs.readFileSync(path.resolve(root, entryPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${entryPath} should stay a thin manifest entry`).toBeLessThanOrEqual(8);
    expect(source, `${entryPath} should import apps/content/bootstrap`).toMatch(/apps\/content\/bootstrap/);
    expect(source, `${entryPath} should re-export onExecute for the CRX loader`).toMatch(/export\s+\{\s*onExecute\s*\}/);
  });

  it('keeps content bootstrap focused on initialization and delegates runtime listeners', () => {
    const bootstrapPath = 'src/apps/content/bootstrap.ts';
    const source = fs.readFileSync(path.resolve(root, bootstrapPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${bootstrapPath} should stay focused on initialization`).toBeLessThanOrEqual(900);

    const expectedModules = [
      'src/apps/content/consoleSettingsBridge.ts',
      'src/apps/content/contentLifecycle.ts',
      'src/apps/content/contentMessageRouter.ts',
      'src/apps/content/orchestratorStateBridge.ts',
      'src/apps/content/pageChrome.ts',
      'src/features/previews/previewVolumeControl.ts',
    ];

    for (const file of expectedModules) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    expect(source).toMatch(/\.\/consoleSettingsBridge/);
    expect(source).toMatch(/\.\/contentLifecycle/);
    expect(source).toMatch(/\.\/contentMessageRouter/);
    expect(source).toMatch(/\.\/orchestratorStateBridge/);
    expect(source).toMatch(/\.\/pageChrome/);
    expect(source).toMatch(/features\/previews/);
  });

  it('keeps drive115 content script entries thin and boots through apps/content', () => {
    const expectedBootstraps = [
      'src/apps/content/drive115Content.ts',
      'src/apps/content/drive115Verify.ts',
    ];

    for (const file of expectedBootstraps) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const entries = [
      { path: 'src/content/drive115-content.ts', pattern: /apps\/content\/drive115Content/ },
      { path: 'src/content/drive115-verify.ts', pattern: /apps\/content\/drive115Verify/ },
    ];

    for (const entry of entries) {
      const source = fs.readFileSync(path.resolve(root, entry.path), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${entry.path} should stay a thin manifest entry`).toBeLessThanOrEqual(8);
      expect(source, `${entry.path} should import its apps/content bootstrap`).toMatch(entry.pattern);
    }
  });

  it('keeps the dashboard page entry thin and boots through apps/dashboard', () => {
    const bootstrapPath = 'src/apps/dashboard/bootstrap.ts';
    expect(fs.existsSync(path.resolve(root, bootstrapPath)), `${bootstrapPath} should exist`).toBe(true);

    const entryPath = 'src/dashboard/dashboard.ts';
    const source = fs.readFileSync(path.resolve(root, entryPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${entryPath} should stay a thin page entry`).toBeLessThanOrEqual(8);
    expect(source, `${entryPath} should import apps/dashboard/bootstrap`).toMatch(/apps\/dashboard\/bootstrap/);
  });

  it('keeps dashboard bootstrap delegated to focused app modules', () => {
    const bootstrapPath = 'src/apps/dashboard/bootstrap.ts';
    const bootstrapSource = fs.readFileSync(path.resolve(root, bootstrapPath), 'utf8');
    const delegatedModules = [
      'src/apps/dashboard/themeBootstrap.ts',
      'src/apps/dashboard/consoleBootstrap.ts',
      'src/apps/dashboard/privacyBootstrap.ts',
      'src/apps/dashboard/drive115Sidebar.ts',
      'src/apps/dashboard/versionInfoSidebar.ts',
    ];

    for (const modulePath of delegatedModules) {
      expect(fs.existsSync(path.resolve(root, modulePath)), `${modulePath} should exist`).toBe(true);
      const importPattern = new RegExp(`\\./${path.basename(modulePath, '.ts')}`);
      expect(bootstrapSource, `${bootstrapPath} should import ${modulePath}`).toMatch(importPattern);
    }

    expect(bootstrapSource, `${bootstrapPath} should delegate console proxy configuration`).not.toMatch(/\binstallConsoleProxy\(/);
    expect(bootstrapSource, `${bootstrapPath} should delegate theme switcher details`).not.toMatch(/\bThemeSwitcher\b/);
    expect(bootstrapSource, `${bootstrapPath} should delegate privacy initialization`).not.toMatch(/\binitializePrivacySystem\b/);
    expect(bootstrapSource, `${bootstrapPath} should delegate 115 quota rendering`).not.toMatch(/\bgetDrive115V2Service\b|\brenderDrive115QuotaSidebar\b/);
    expect(bootstrapSource, `${bootstrapPath} should delegate version info rendering`).not.toMatch(/\bgetDisplayVersionInfo\b|\binitInfoContainer\b/);
  });

  it('keeps the popup page entry thin and boots through apps/popup', () => {
    const bootstrapPath = 'src/apps/popup/bootstrap.ts';
    expect(fs.existsSync(path.resolve(root, bootstrapPath)), `${bootstrapPath} should exist`).toBe(true);

    const entryPath = 'src/popup/popup.ts';
    const source = fs.readFileSync(path.resolve(root, entryPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${entryPath} should stay a thin popup entry`).toBeLessThanOrEqual(8);
    expect(source, `${entryPath} should import apps/popup/bootstrap`).toMatch(/apps\/popup\/bootstrap/);
  });

  it('keeps online availability implementation under features and content path as a compatibility export', () => {
    const featurePath = 'src/features/onlineAvailability/index.ts';
    expect(fs.existsSync(path.resolve(root, featurePath)), `${featurePath} should exist`).toBe(true);

    const legacyPath = 'src/content/onlineAvailability.ts';
    const source = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(source, `${legacyPath} should re-export from features/onlineAvailability`).toMatch(/features\/onlineAvailability/);
  });

  it('keeps video status implementation under features and legacy paths as compatibility exports', () => {
    const expectedFeatureFiles = [
      'src/features/videoStatus/index.ts',
      'src/features/videoStatus/statusManager.ts',
      'src/features/videoStatus/statusPriority.ts',
    ];

    for (const file of expectedFeatureFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyFiles = [
      'src/content/statusManager.ts',
      'src/utils/statusPriority.ts',
    ];

    for (const relative of legacyFiles) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/videoStatus`).toMatch(/features\/videoStatus/);
    }
  });

  it('keeps shared list record helpers under shared utils with utils path as a compatibility export', () => {
    const sharedPath = 'src/shared/utils/listRecordHelpers.ts';
    expect(fs.existsSync(path.resolve(root, sharedPath)), `${sharedPath} should exist`).toBe(true);

    const legacyPath = 'src/utils/listRecordHelpers.ts';
    const source = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(source, `${legacyPath} should re-export from shared/utils/listRecordHelpers`).toMatch(/shared\/utils\/listRecordHelpers/);
  });

  it('keeps pure reusable utilities under shared utils with utils paths as compatibility exports', () => {
    const modules = [
      'codeParser',
      'md5',
      'tagFilter',
      'versionInfo',
    ];

    for (const moduleName of modules) {
      const sharedPath = `src/shared/utils/${moduleName}.ts`;
      expect(fs.existsSync(path.resolve(root, sharedPath)), `${sharedPath} should exist`).toBe(true);

      const legacyPath = `src/utils/${moduleName}.ts`;
      const source = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${legacyPath} should re-export from shared/utils/${moduleName}`).toMatch(new RegExp(`shared\\/utils\\/${moduleName}`));
    }

    const violations: string[] = [];
    const legacyUtilityImport = /(?:^|['"])(?:\.\.\/)+utils\/(?:codeParser|md5|tagFilter|versionInfo)(?:['"]|$)/;

    for (const file of listSourceFiles('src')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      if (relative.startsWith('src/utils/')) continue;

      const source = fs.readFileSync(file, 'utf8');
      if (legacyUtilityImport.test(source)) {
        violations.push(relative);
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps content video id parsing as a shared pure utility with page extraction under platform browser', () => {
    const sharedPath = 'src/shared/utils/videoId.ts';
    expect(fs.existsSync(path.resolve(root, sharedPath)), `${sharedPath} should exist`).toBe(true);

    const platformPath = 'src/platform/browser/videoId.ts';
    expect(fs.existsSync(path.resolve(root, platformPath)), `${platformPath} should exist`).toBe(true);

    const contentSource = fs.readFileSync(path.resolve(root, 'src/content/videoId.ts'), 'utf8');
    const nonEmptyLines = contentSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    expect(nonEmptyLines.length, 'src/content/videoId.ts should stay a thin compatibility wrapper').toBeLessThanOrEqual(8);
    expect(contentSource, 'src/content/videoId.ts should re-export from platform/browser/videoId').toMatch(/platform\/browser\/videoId/);

    const platformSource = fs.readFileSync(path.resolve(root, platformPath), 'utf8');
    expect(platformSource, `${platformPath} should reuse shared pure parser`).toMatch(/shared\/utils\/videoId/);

    const directConsumers = [
      'src/features/onlineAvailability/index.ts',
      'src/features/magnets/ui/magnetSearchManager.ts',
      'src/features/drive115/content/index.ts',
      'src/features/insights/contentCollector.ts',
      'src/features/videoDetail/pageHandler.ts',
      'src/features/videoDetail/favoriteRating.ts',
      'src/features/videoDetail/enhancer.ts',
      'src/features/videoStatus/statusManager.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use platform/browser video id helpers`).not.toMatch(/content\/videoId/);
      expect(source, `${relative} should reference platform/browser`).toMatch(/platform\/browser/);
    }
  });

  it('keeps console proxy under platform logging with utils path as a compatibility export', () => {
    const targetPath = 'src/platform/logging/consoleProxy.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/utils/consoleProxy.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from platform/logging/consoleProxy`).toMatch(/platform\/logging\/consoleProxy/);

    const directConsumers = [
      'src/apps/content/consoleSettingsBridge.ts',
      'src/apps/dashboard/consoleBootstrap.ts',
      'src/platform/logging/backgroundConsole.ts',
      'src/platform/logging/index.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use platform/logging/consoleProxy directly`).not.toMatch(/utils\/consoleProxy/);
      expect(source, `${relative} should reference platform logging console proxy`).toMatch(/consoleProxy/);
    }
  });

  it('keeps route management under features with utils path as a compatibility export', () => {
    const featurePath = 'src/features/routeManagement/index.ts';
    expect(fs.existsSync(path.resolve(root, featurePath)), `${featurePath} should exist`).toBe(true);

    const legacyPath = 'src/utils/routeManager.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from features/routeManagement`).toMatch(/features\/routeManagement/);

    const directConsumers = [
      'src/apps/background/routeAutoUpdate.ts',
      'src/dashboard/dataSync/api.ts',
      'src/dashboard/tabs/actors.ts',
      'src/dashboard/tabs/settings/networkTest/NetworkTestSettings.ts',
      'src/features/newWorks/collector.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use features/routeManagement directly`).not.toMatch(/utils\/routeManager/);
      expect(source, `${relative} should reference route management feature`).toMatch(/features\/routeManagement|routeManagement/);
    }
  });

  it('keeps TTL cache under platform storage with utils path as a compatibility export', () => {
    const targetPath = 'src/platform/storage/cache.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/utils/cache.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from platform/storage/cache`).toMatch(/platform\/storage\/cache/);

    const directConsumers = [
      'src/features/dataAggregator/index.ts',
      'src/components/ActorAvatar.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use platform storage cache directly`).not.toMatch(/utils\/cache/);
      expect(source, `${relative} should reference platform storage cache`).toMatch(/platform\/storage\/cache/);
    }
  });

  it('keeps content DB runtime client under platform storage', () => {
    const targetPath = 'src/platform/storage/dbRuntimeClient.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/dbClient.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from platform/storage/dbRuntimeClient`).toMatch(/platform\/storage\/dbRuntimeClient/);

    const directConsumers = [
      'src/features/records/content/concurrency.ts',
      'src/features/fc2Breaker/index.ts',
      'src/features/magnets/ui/magnetSearchManager.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use platform storage DB runtime client directly`).not.toMatch(/content\/dbClient|\.\/dbClient/);
      expect(source, `${relative} should reference platform storage DB runtime client`).toMatch(/platform\/storage\/dbRuntimeClient/);
    }
  });

  it('keeps network test domain configuration under the network test feature', () => {
    const targetPath = 'src/features/networkTest/domain/domainConfig.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/utils/domainConfig.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from features/networkTest/domain/domainConfig`).toMatch(/features\/networkTest\/domain\/domainConfig/);

    const directConsumer = 'src/dashboard/tabs/settings/networkTest/NetworkTestSettings.ts';
    const source = fs.readFileSync(path.resolve(root, directConsumer), 'utf8');
    expect(source, `${directConsumer} should use the feature domain config directly`).not.toMatch(/utils\/domainConfig/);
    expect(source, `${directConsumer} should reference network test feature`).toMatch(/features\/networkTest/);
  });

  it('keeps content-side record concurrency under the records feature with content paths as compatibility exports', () => {
    const expectedFiles = [
      'src/features/records/content/index.ts',
      'src/features/records/content/concurrency.ts',
      'src/features/records/content/concurrencyTest.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyFiles = [
      {
        legacyPath: 'src/content/concurrency.ts',
        targetPattern: /features\/records\/content/,
      },
      {
        legacyPath: 'src/content/concurrencyTest.ts',
        targetPattern: /features\/records\/content\/concurrencyTest/,
      },
    ];

    for (const item of legacyFiles) {
      const legacySource = fs.readFileSync(path.resolve(root, item.legacyPath), 'utf8');
      const nonEmptyLines = legacySource
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${item.legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(legacySource, `${item.legacyPath} should re-export from records content feature`).toMatch(item.targetPattern);
    }

    const directConsumers = [
      'src/features/videoDetail/pageHandler.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use records content concurrency directly`).not.toMatch(/content\/concurrency/);
      expect(source, `${relative} should reference records content feature`).toMatch(/features\/records\/content|records\/content/);
    }
  });

  it('keeps content-side JAVBUS tab fetch client under platform browser', () => {
    const targetPath = 'src/platform/browser/javbusRuntimeClient.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/javbusTabFetch.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from platform/browser/javbusRuntimeClient`).toMatch(/platform\/browser\/javbusRuntimeClient/);

    const directConsumer = 'src/features/magnets/ui/magnetSearchManager.ts';
    const source = fs.readFileSync(path.resolve(root, directConsumer), 'utf8');
    expect(source, `${directConsumer} should use platform browser JAVBUS runtime client directly`).not.toMatch(/content\/javbusTabFetch/);
    expect(source, `${directConsumer} should reference platform browser JAVBUS runtime client`).toMatch(/platform\/browser\/javbusRuntimeClient/);
  });

  it('keeps small background modules under platform or features with background paths as compatibility exports', () => {
    const modules = [
      {
        legacyPath: 'src/background/consoleConfig.ts',
        targetPath: 'src/platform/logging/backgroundConsole.ts',
        targetPattern: /platform\/logging\/backgroundConsole/,
      },
      {
        legacyPath: 'src/background/netProxy.ts',
        targetPath: 'src/platform/network/backgroundFetchRouter.ts',
        targetPattern: /platform\/network\/backgroundFetchRouter/,
      },
      {
        legacyPath: 'src/background/javbusTabFetch.ts',
        targetPath: 'src/platform/browser/javbusTabFetch.ts',
        targetPattern: /platform\/browser\/javbusTabFetch/,
      },
      {
        legacyPath: 'src/background/viewedTagStats.ts',
        targetPath: 'src/features/records/tagStats.ts',
        targetPattern: /features\/records\/tagStats/,
      },
    ];

    for (const item of modules) {
      expect(fs.existsSync(path.resolve(root, item.targetPath)), `${item.targetPath} should exist`).toBe(true);

      const source = fs.readFileSync(path.resolve(root, item.legacyPath), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${item.legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${item.legacyPath} should re-export from ${item.targetPath}`).toMatch(item.targetPattern);
    }
  });

  it('keeps WebDAV sync foundation under features while background controller uses the new modules', () => {
    const expectedFiles = [
      'src/features/webdavSync/domain/types.ts',
      'src/features/webdavSync/domain/paths.ts',
      'src/features/webdavSync/infrastructure/webdavClient.ts',
      'src/features/webdavSync/infrastructure/propfindParser.ts',
      'src/features/webdavSync/application/clientIdentity.ts',
      'src/features/webdavSync/application/clientRegistry.ts',
      'src/features/webdavSync/background/controller.ts',
      'src/features/webdavSync/index.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const source = fs.readFileSync(path.resolve(root, 'src/features/webdavSync/background/controller.ts'), 'utf8');
    expect(source).toMatch(/\.\.\/domain\/paths/);
    expect(source).toMatch(/\.\.\/infrastructure\/webdavClient/);
    expect(source).toMatch(/\.\.\/infrastructure\/propfindParser/);
    expect(source).toMatch(/\.\.\/application\/clientIdentity/);
    expect(source).toMatch(/\.\.\/application\/clientRegistry/);
  });

  it('keeps WebDAV backup upload chain under features while background controller delegates to it', () => {
    const expectedFiles = [
      'src/features/webdavSync/application/backupCollector.ts',
      'src/features/webdavSync/application/uploadIndex.ts',
      'src/features/webdavSync/application/uploadService.ts',
      'src/features/webdavSync/application/cleanupService.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const source = fs.readFileSync(path.resolve(root, 'src/features/webdavSync/background/controller.ts'), 'utf8');
    expect(source).toMatch(/\.\.\/application\/backupCollector/);
    expect(source).toMatch(/\.\.\/application\/uploadIndex/);
    expect(source).toMatch(/\.\.\/application\/uploadService/);
    expect(source).toMatch(/\.\.\/application\/cleanupService/);
  });

  it('keeps WebDAV restore, diagnostics, and message router under features', () => {
    const expectedFiles = [
      'src/features/webdavSync/application/restorePreview.ts',
      'src/features/webdavSync/application/restoreService.ts',
      'src/features/webdavSync/application/restoreStorage.ts',
      'src/features/webdavSync/application/importSanitizer.ts',
      'src/features/webdavSync/application/dataDiff.ts',
      'src/features/webdavSync/application/dataMerge.ts',
      'src/features/webdavSync/application/mergeKeyedMap.ts',
      'src/features/webdavSync/application/backupMigration.ts',
      'src/features/webdavSync/application/diagnostics.ts',
      'src/features/webdavSync/background/router.ts',
      'src/features/webdavSync/background/controller.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const source = fs.readFileSync(path.resolve(root, 'src/features/webdavSync/background/controller.ts'), 'utf8');
    expect(source).toMatch(/\.\.\/application\/restorePreview/);
    expect(source).toMatch(/\.\.\/application\/restoreService/);
    expect(source).toMatch(/\.\.\/application\/restoreStorage/);
    expect(source).toMatch(/\.\.\/application\/importSanitizer/);
    expect(source).toMatch(/\.\.\/application\/diagnostics/);
    expect(source).toMatch(/\.\/router/);

    const dashboardRestore = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore.ts'), 'utf8');
    expect(dashboardRestore).toMatch(/features\/webdavSync\/application\/dataDiff/);
    expect(dashboardRestore).toMatch(/features\/webdavSync\/application\/dataMerge/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/fileListModel/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/conflictController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/conflictDetailModel/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreApplyController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreAnalysisController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreFilePreviewController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreModalShellController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreOptionsController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreUnifiedExecutorController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreResultController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreProgressResultsController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/restoreWizardController/);
    expect(dashboardRestore).toMatch(/\.\/webdavRestore\/settingsDifferenceModel/);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/fileListModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreOptionsModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/conflictController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/conflictDisplayModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/conflictDetailModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/conflictNavigationModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreResultsModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreBackupModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/strategyPreviewModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreConfirmationModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreWizardStateModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreExecuteConfirmModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreModeStatsModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreValidationModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreApplyPlanModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreModalStateModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreFooterModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreApplyController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreAnalysisController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreFilePreviewController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreModalShellController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreOptionsController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreUnifiedExecutorController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreResultController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreProgressResultsController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreWizardController.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/operationSummaryModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/previewStatsModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/quickRestoreModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/settingsDifferenceModel.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreProgressModel.ts'))).toBe(true);

    const conflictController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/conflictController.ts'), 'utf8');
    expect(conflictController).toMatch(/\.\/conflictDisplayModel/);
    expect(conflictController).toMatch(/\.\/conflictDetailModel/);
    expect(conflictController).toMatch(/\.\/conflictNavigationModel/);

    const restoreResultController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreResultController.ts'), 'utf8');
    expect(restoreResultController).toMatch(/\.\/operationSummaryModel/);
    expect(restoreResultController).toMatch(/\.\/restoreBackupModel/);

    const restoreProgressResultsController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreProgressResultsController.ts'), 'utf8');
    expect(restoreProgressResultsController).toMatch(/\.\/restoreProgressModel/);
    expect(restoreProgressResultsController).toMatch(/\.\/restoreResultsModel/);

    const restoreWizardController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreWizardController.ts'), 'utf8');
    expect(restoreWizardController).toMatch(/\.\/quickRestoreModel/);
    expect(restoreWizardController).toMatch(/\.\/restoreConfirmationModel/);
    expect(restoreWizardController).toMatch(/\.\/restoreModeStatsModel/);
    expect(restoreWizardController).toMatch(/\.\/restoreModeUiModel/);
    expect(restoreWizardController).toMatch(/\.\/restoreWizardStateModel/);
    expect(restoreWizardController).toMatch(/\.\/strategyPreviewModel/);

    const restoreApplyController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreApplyController.ts'), 'utf8');
    expect(restoreApplyController).toMatch(/\.\/restoreApplyPlanModel/);
    expect(restoreApplyController).toMatch(/\.\/restoreBackupModel/);
    expect(restoreApplyController).toMatch(/\.\/restoreModalStateModel/);
    expect(restoreApplyController).toMatch(/\.\/restoreValidationModel/);

    const restoreAnalysisController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreAnalysisController.ts'), 'utf8');
    expect(restoreAnalysisController).toMatch(/features\/webdavSync\/application\/dataDiff/);
    expect(restoreAnalysisController).toMatch(/\.\/restoreModalStateModel/);

    const restoreFilePreviewController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreFilePreviewController.ts'), 'utf8');
    expect(restoreFilePreviewController).toMatch(/features\/webdavSync\/application\/backupMigration/);
    expect(restoreFilePreviewController).toMatch(/\.\/fileListModel/);
    expect(restoreFilePreviewController).toMatch(/\.\/previewStatsModel/);
    expect(restoreFilePreviewController).toMatch(/\.\/restoreModalStateModel/);

    const restoreModalShellController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreModalShellController.ts'), 'utf8');
    expect(restoreModalShellController).toMatch(/\.\/restoreFooterModel/);
    expect(restoreModalShellController).toMatch(/\.\/restoreModalStateModel/);

    const restoreOptionsController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreOptionsController.ts'), 'utf8');
    expect(restoreOptionsController).toMatch(/\.\/restoreOptionsModel/);

    const restoreUnifiedExecutorController = fs.readFileSync(path.resolve(root, 'src/dashboard/webdavRestore/restoreUnifiedExecutorController.ts'), 'utf8');
    expect(restoreUnifiedExecutorController).toMatch(/features\/webdavSync\/application\/dataDiff/);
    expect(restoreUnifiedExecutorController).toMatch(/\.\/restoreExecuteConfirmModel/);

    const removedExpertDiffArtifacts = [
      'displayDiffAnalysis',
      'generateDiffSummaryHTML',
      'bindConflictDetailEvents',
      'bindExpertModeEvents',
      'bindExpertStrategyChangeEvents',
      'updateExpertImpactPreview',
      'expertMergeStrategy',
      'expertSmartMerge',
      'expertKeepLocal',
      'expertKeepCloud',
      'expertManualResolve',
    ];

    for (const artifact of removedExpertDiffArtifacts) {
      expect(dashboardRestore, `${artifact} should be removed from deprecated expert restore mode`).not.toContain(artifact);
    }

    const removedRestoreSaveArtifacts = [
      'saveRestoredData',
      'dbActorsBulkPut',
    ];

    for (const artifact of removedRestoreSaveArtifacts) {
      expect(dashboardRestore, `${artifact} should be removed from legacy restore save flow`).not.toContain(artifact);
    }

    const legacyFiles = [
      {
        legacyPath: 'src/utils/dataDiff.ts',
        targetPattern: /features\/webdavSync\/application\/dataDiff/,
      },
      {
        legacyPath: 'src/utils/dataMerge.ts',
        targetPattern: /features\/webdavSync\/application\/dataMerge/,
      },
      {
        legacyPath: 'src/utils/mergeKeyedMap.ts',
        targetPattern: /features\/webdavSync\/application\/mergeKeyedMap/,
      },
    ];

    for (const item of legacyFiles) {
      const legacySource = fs.readFileSync(path.resolve(root, item.legacyPath), 'utf8');
      const nonEmptyLines = legacySource
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${item.legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(legacySource, `${item.legacyPath} should re-export from webdavSync application`).toMatch(item.targetPattern);
    }
  });

  it('keeps WebDAV background entry as compatibility export after moving controller under feature', () => {
    const legacyPath = 'src/background/webdav.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(14);
    expect(legacySource).toMatch(/features\/webdavSync\/background\/controller/);

    const bootstrap = fs.readFileSync(path.resolve(root, 'src/apps/background/bootstrap.ts'), 'utf8');
    const scheduler = fs.readFileSync(path.resolve(root, 'src/apps/background/scheduler.ts'), 'utf8');
    expect(bootstrap).toMatch(/features\/webdavSync\/background\/controller/);
    expect(scheduler).toMatch(/features\/webdavSync\/background\/controller/);
  });

  it('keeps record refresh implementation under features with background sync as a compatibility export', () => {
    const expectedFiles = [
      'src/features/records/refresh/domain/types.ts',
      'src/features/records/refresh/application/cloudflareVerification.ts',
      'src/features/records/refresh/application/fc2Refresh.ts',
      'src/features/records/refresh/application/javdbParsers.ts',
      'src/features/records/refresh/application/recordRefresh.ts',
      'src/features/records/refresh/index.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const syncSource = fs.readFileSync(path.resolve(root, 'src/background/sync.ts'), 'utf8');
    const syncNonEmptyLines = syncSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(syncNonEmptyLines.length, 'src/background/sync.ts should stay a thin compatibility wrapper').toBeLessThanOrEqual(10);
    expect(syncSource).toMatch(/features\/records\/refresh/);

    const miscSource = fs.readFileSync(path.resolve(root, 'src/apps/background/miscMessageRouter.ts'), 'utf8');
    expect(miscSource).toMatch(/features\/records\/refresh/);
  });

  it('keeps utility migration targets in features and platform while utils paths stay compatibility exports', () => {
    const modules = [
      {
        legacyPath: 'src/utils/searchEngines.ts',
        targetPath: 'src/features/externalSearch/domain/searchEngines.ts',
        targetPattern: /features\/externalSearch\/domain\/searchEngines/,
      },
      {
        legacyPath: 'src/utils/net.ts',
        targetPath: 'src/platform/network/clientFetch.ts',
        targetPattern: /platform\/network\/clientFetch/,
      },
      {
        legacyPath: 'src/utils/ipLookup.ts',
        targetPath: 'src/platform/network/ipLookup.ts',
        targetPattern: /platform\/network\/ipLookup/,
      },
      {
        legacyPath: 'src/utils/webdavDiagnostic.ts',
        targetPath: 'src/features/webdavSync/application/webdavDiagnostic.ts',
        targetPattern: /features\/webdavSync\/application\/webdavDiagnostic/,
      },
    ];

    for (const item of modules) {
      expect(fs.existsSync(path.resolve(root, item.targetPath)), `${item.targetPath} should exist`).toBe(true);

      const source = fs.readFileSync(path.resolve(root, item.legacyPath), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${item.legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${item.legacyPath} should re-export from ${item.targetPath}`).toMatch(item.targetPattern);
    }
  });

  it('keeps preview implementation under features with content paths as compatibility exports', () => {
    const expectedFiles = [
      'src/features/previews/index.ts',
      'src/features/previews/nativeJavdbPreview.ts',
      'src/features/previews/previewSourceRules.ts',
      'src/features/previews/previewVideoPreload.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyFiles = [
      'src/content/nativeJavdbPreview.ts',
      'src/content/previewSourceRules.ts',
      'src/content/previewVideoPreload.ts',
    ];

    for (const relative of legacyFiles) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/previews`).toMatch(/features\/previews/);
    }

    const contentBootstrap = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    const detailEnhancer = fs.readFileSync(path.resolve(root, 'src/features/videoDetail/enhancer.ts'), 'utf8');
    const listEnhancement = fs.readFileSync(path.resolve(root, 'src/features/listEnhancement/listEnhancementManager.ts'), 'utf8');
    expect(contentBootstrap).toMatch(/features\/previews/);
    expect(detailEnhancer).toMatch(/['"]\.\.\/previews['"]/);
    expect(listEnhancement).toMatch(/['"]\.\.\/previews['"]/);
  });

  it('keeps super ranking navigation under features with content path as a compatibility export', () => {
    const expectedFiles = [
      'src/features/rankings/index.ts',
      'src/features/rankings/superRankingNav.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyPath = 'src/content/superRankingNav.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/features\/rankings/);

    const featureSource = fs.readFileSync(path.resolve(root, 'src/features/rankings/superRankingNav.ts'), 'utf8');
    expect(featureSource).not.toMatch(/from ['"].*content\//);

    const contentBootstrap = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    const listEnhancement = fs.readFileSync(path.resolve(root, 'src/features/listEnhancement/listEnhancementManager.ts'), 'utf8');
    expect(contentBootstrap).toMatch(/features\/rankings/);
    expect(listEnhancement).toMatch(/['"]\.\.\/rankings['"]/);
  });

  it('keeps content filter implementation under features with content path as a compatibility export', () => {
    const expectedFiles = [
      'src/features/contentFilter/index.ts',
      'src/features/contentFilter/contentFilterManager.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyPath = 'src/content/contentFilter.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/features\/contentFilter/);

    const contentBootstrap = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    const keyboardShortcuts = fs.readFileSync(path.resolve(root, 'src/features/keyboardShortcuts/index.ts'), 'utf8');
    expect(contentBootstrap).toMatch(/features\/contentFilter/);
    expect(keyboardShortcuts).toMatch(/\.\.\/contentFilter/);
  });

  it('keeps keyboard shortcuts under features with content path as a compatibility export', () => {
    const featurePath = 'src/features/keyboardShortcuts/index.ts';
    expect(fs.existsSync(path.resolve(root, featurePath)), `${featurePath} should exist`).toBe(true);

    const legacyPath = 'src/content/keyboardShortcuts.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/features\/keyboardShortcuts/);

    const bootstrap = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    const lifecycle = fs.readFileSync(path.resolve(root, 'src/apps/content/contentLifecycle.ts'), 'utf8');
    expect(bootstrap).toMatch(/features\/keyboardShortcuts/);
    expect(lifecycle).toMatch(/features\/keyboardShortcuts/);
  });

  it('keeps list enhancement implementation under features with content path as a compatibility export', () => {
    const expectedFiles = [
      'src/features/listEnhancement/index.ts',
      'src/features/listEnhancement/listEnhancementManager.ts',
      'src/features/listEnhancement/content/itemProcessor.ts',
      'src/features/listEnhancement/domain/config.ts',
      'src/features/listEnhancement/application/actorMatching.ts',
      'src/features/listEnhancement/application/actorHiding.ts',
      'src/features/listEnhancement/application/actorHidingWorkflow.ts',
      'src/features/listEnhancement/application/actorWatermark.ts',
      'src/features/listEnhancement/application/popularityEffects.ts',
      'src/features/listEnhancement/application/scrollPaging.ts',
      'src/features/listEnhancement/ui/clickEnhancement.ts',
      'src/features/listEnhancement/ui/listItemObserver.ts',
      'src/features/listEnhancement/ui/listItemDom.ts',
      'src/features/listEnhancement/ui/listScrollState.ts',
      'src/features/listEnhancement/ui/listDisplayControl.ts',
      'src/features/listEnhancement/ui/previewHoverController.ts',
      'src/features/listEnhancement/ui/styles.ts',
      'src/features/previews/listPreviewLoader.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyPath = 'src/content/enhancements/listEnhancement.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/features\/listEnhancement/);

    const legacyItemProcessorPath = 'src/content/itemProcessor.ts';
    const legacyItemProcessorSource = fs.readFileSync(path.resolve(root, legacyItemProcessorPath), 'utf8');
    const legacyItemProcessorLines = legacyItemProcessorSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(legacyItemProcessorLines.length, `${legacyItemProcessorPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacyItemProcessorSource).toMatch(/features\/listEnhancement\/content\/itemProcessor/);

    const featureSource = fs.readFileSync(path.resolve(root, 'src/features/listEnhancement/listEnhancementManager.ts'), 'utf8');
    const managerLineCount = featureSource.split(/\r?\n/).length;
    expect(managerLineCount, 'listEnhancementManager.ts should keep shrinking as config, pure helpers, and styles move out').toBeLessThanOrEqual(900);
    expect(featureSource).toMatch(/\.\/domain\/config/);
    expect(featureSource).toMatch(/\.\/application\/actorHidingWorkflow/);
    expect(featureSource).toMatch(/\.\/application\/actorWatermark/);
    expect(featureSource).toMatch(/loadListPreviewVideo/);
    expect(featureSource).toMatch(/\.\/application\/popularityEffects/);
    expect(featureSource).toMatch(/\.\/application\/scrollPaging/);
    expect(featureSource).toMatch(/\.\/ui\/clickEnhancement/);
    expect(featureSource).toMatch(/\.\/ui\/listItemObserver/);
    expect(featureSource).toMatch(/\.\/ui\/listItemDom/);
    expect(featureSource).toMatch(/\.\/ui\/listScrollState/);
    expect(featureSource).toMatch(/\.\/ui\/listDisplayControl/);
    expect(featureSource).toMatch(/\.\/ui\/previewHoverController/);
    expect(featureSource).toMatch(/\.\/ui\/styles/);
    expect(featureSource).toMatch(/['"]\.\.\/previews['"]/);
    expect(featureSource).toMatch(/['"]\.\.\/rankings['"]/);

    const contentBootstrap = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    expect(contentBootstrap).toMatch(/features\/listEnhancement/);

    const directConsumers = [
      'src/apps/content/bootstrap.ts',
      'src/apps/content/contentMessageRouter.ts',
      'src/features/listEnhancement/listEnhancementManager.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use list enhancement item processor directly`).not.toMatch(/(?:\.\.\/)+content\/itemProcessor|src\/content\/itemProcessor/);
      expect(source, `${relative} should reference list enhancement feature`).toMatch(/features\/listEnhancement/);
    }
  });

  it('keeps content task runtime helpers under platform with content paths as compatibility exports', () => {
    const modules = [
      {
        legacyPath: 'src/content/pageContext.ts',
        targetPath: 'src/platform/browser/pageContext.ts',
        targetPattern: /platform\/browser\/pageContext/,
      },
      {
        legacyPath: 'src/content/taskRuntime.ts',
        targetPath: 'src/platform/tasks/contentRuntime.ts',
        targetPattern: /platform\/tasks\/contentRuntime/,
      },
      {
        legacyPath: 'src/content/taskDetailReporter.ts',
        targetPath: 'src/platform/tasks/contentTaskDetailReporter.ts',
        targetPattern: /platform\/tasks\/contentTaskDetailReporter/,
      },
      {
        legacyPath: 'src/content/taskHeartbeat.ts',
        targetPath: 'src/platform/tasks/taskHeartbeatReporter.ts',
        targetPattern: /platform\/tasks\/taskHeartbeatReporter/,
      },
      {
        legacyPath: 'src/content/taskVisibilityReporter.ts',
        targetPath: 'src/platform/tasks/taskVisibilityReporter.ts',
        targetPattern: /platform\/tasks\/taskVisibilityReporter/,
      },
      {
        legacyPath: 'src/content/taskChunking.ts',
        targetPath: 'src/platform/tasks/chunking.ts',
        targetPattern: /platform\/tasks\/chunking/,
      },
      {
        legacyPath: 'src/content/performanceOptimizer.ts',
        targetPath: 'src/platform/tasks/performanceOptimizer.ts',
        targetPattern: /platform\/tasks\/performanceOptimizer/,
      },
    ];

    for (const item of modules) {
      expect(fs.existsSync(path.resolve(root, item.targetPath)), `${item.targetPath} should exist`).toBe(true);

      const source = fs.readFileSync(path.resolve(root, item.legacyPath), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${item.legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${item.legacyPath} should re-export from ${item.targetPath}`).toMatch(item.targetPattern);
    }

    const directConsumers = [
      'src/apps/content/bootstrap.ts',
      'src/apps/content/contentLifecycle.ts',
      'src/apps/content/consoleSettingsBridge.ts',
      'src/features/actorEnhancement/actorEnhancementManager.ts',
      'src/features/contentFilter/contentFilterManager.ts',
      'src/features/magnets/ui/magnetSearchManager.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use platform task/browser helpers directly`).not.toMatch(/content\/(?:task(?:Runtime|Chunking|DetailReporter|Heartbeat|VisibilityReporter)|pageContext|performanceOptimizer)|\.\.\/\.\.\/content\/(?:task|pageContext|performanceOptimizer)/);
    }
  });

  it('keeps content init orchestrator under apps/content with content path as a compatibility export', () => {
    const expectedFiles = [
      'src/apps/content/orchestrator/index.ts',
      'src/apps/content/orchestrator/initOrchestrator.ts',
      'src/apps/content/orchestrator/types.ts',
      'src/apps/content/orchestrator/hardwareConcurrency.ts',
      'src/apps/content/orchestrator/metrics.ts',
      'src/apps/content/orchestrator/schedulingRules.ts',
      'src/apps/content/orchestrator/retryTimers.ts',
      'src/apps/content/orchestrator/highPhaseScheduler.ts',
      'src/apps/content/orchestrator/pageLifecycleBindings.ts',
      'src/apps/content/orchestrator/dashboardMetricsMessages.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyPath = 'src/content/initOrchestrator.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/apps\/content\/orchestrator/);

    const bootstrapSource = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    expect(bootstrapSource).toMatch(/\.\/orchestrator/);
    expect(bootstrapSource).not.toMatch(/content\/initOrchestrator/);

    const videoDetailSource = fs.readFileSync(path.resolve(root, 'src/features/videoDetail/pageHandler.ts'), 'utf8');
    const enhancedVideoDetailSource = fs.readFileSync(path.resolve(root, 'src/features/videoDetail/enhancer.ts'), 'utf8');
    expect(videoDetailSource).toMatch(/apps\/content\/orchestrator/);
    expect(enhancedVideoDetailSource).toMatch(/apps\/content\/orchestrator/);

    const orchestratorSource = fs.readFileSync(path.resolve(root, 'src/apps/content/orchestrator/initOrchestrator.ts'), 'utf8');
    expect(orchestratorSource).toMatch(/platform\/tasks/);
    expect(orchestratorSource).toMatch(/platform\/browser/);
    expect(orchestratorSource).toMatch(/\.\/types/);
    expect(orchestratorSource).toMatch(/\.\/hardwareConcurrency/);
    expect(orchestratorSource).toMatch(/\.\/metrics/);
    expect(orchestratorSource).toMatch(/\.\/schedulingRules/);
    expect(orchestratorSource).toMatch(/\.\/retryTimers/);
    expect(orchestratorSource).toMatch(/\.\/highPhaseScheduler/);
    expect(orchestratorSource).toMatch(/\.\/pageLifecycleBindings/);
    expect(orchestratorSource).toMatch(/\.\/dashboardMetricsMessages/);
    expect(orchestratorSource).not.toMatch(/function getDefaultVisibilityPolicy/);
    expect(orchestratorSource).not.toMatch(/navigator\.hardwareConcurrency/);
    expect(orchestratorSource).not.toMatch(/completedTasks:\s*0/);
    expect(orchestratorSource).not.toMatch(/priorityB - priorityA/);
    expect(orchestratorSource).not.toMatch(/waitReason === 'tab-hidden' \? 1200 : 400/);
    expect(orchestratorSource).not.toMatch(/visibilityPolicy === 'background_allowed' \? 300 : 150/);
    expect(orchestratorSource).not.toMatch(/window\.addEventListener\('pagehide'/);
    expect(orchestratorSource).not.toMatch(/chrome\.runtime\.onMessage\.addListener/);
    expect(orchestratorSource).not.toMatch(/deferredRetryTimers/);
    expect(orchestratorSource).not.toMatch(/warning: circular dependency or missing dependency detected/);
  });

  it('keeps actor enhancement implementation under features with content paths as compatibility exports', () => {
    const expectedFiles = [
      'src/features/actorEnhancement/index.ts',
      'src/features/actorEnhancement/actorEnhancementManager.ts',
      'src/features/actorEnhancement/actorQuickActionsManager.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyFiles = [
      'src/content/enhancements/actorEnhancement.ts',
      'src/content/enhancements/actorQuickActions.ts',
    ];

    for (const relative of legacyFiles) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${relative} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(source, `${relative} should re-export from features/actorEnhancement`).toMatch(/features\/actorEnhancement/);
    }

    const contentBootstrap = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    expect(contentBootstrap).toMatch(/features\/actorEnhancement/);
  });

  it('keeps background misc message router under apps with legacy background path as compatibility export', () => {
    const expectedFiles = [
      'src/apps/background/miscMessageRouter.ts',
      'src/features/previews/backgroundHandlers.ts',
      'src/features/newWorks/backgroundMessages.ts',
      'src/apps/background/orchestratorMetrics.ts',
      'src/apps/background/embyDynamicContentScripts.ts',
      'src/apps/background/tabMessageHandlers.ts',
      'src/apps/background/networkMessageHandlers.ts',
      'src/apps/background/userProfileMessageHandler.ts',
      'src/apps/background/utilityMessageHandlers.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const miscRouter = fs.readFileSync(path.resolve(root, 'src/apps/background/miscMessageRouter.ts'), 'utf8');
    expect(miscRouter).toMatch(/features\/previews/);
    expect(miscRouter).toMatch(/features\/newWorks\/backgroundMessages/);
    expect(miscRouter).toMatch(/\.\/orchestratorMetrics/);
    expect(miscRouter).toMatch(/\.\/embyDynamicContentScripts/);
    expect(miscRouter).toMatch(/\.\/tabMessageHandlers/);
    expect(miscRouter).toMatch(/\.\/networkMessageHandlers/);
    expect(miscRouter).toMatch(/\.\/userProfileMessageHandler/);
    expect(miscRouter).toMatch(/\.\/utilityMessageHandlers/);

    const legacyPath = 'src/background/miscHandlers.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/apps\/background\/miscMessageRouter/);

    const bootstrap = fs.readFileSync(path.resolve(root, 'src/apps/background/bootstrap.ts'), 'utf8');
    expect(bootstrap).toMatch(/\.\/miscMessageRouter/);
  });

  it('keeps background DB router under apps with legacy background path as compatibility export', () => {
    const targetPath = 'src/apps/background/dbMessageRouter.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/apps/background/dbTagsMessageHandlers.ts')), 'src/apps/background/dbTagsMessageHandlers.ts should exist').toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/apps/background/dbMagnetPushLogMessageHandlers.ts')), 'src/apps/background/dbMagnetPushLogMessageHandlers.ts should exist').toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/apps/background/dbInsightsMessageHandlers.ts')), 'src/apps/background/dbInsightsMessageHandlers.ts should exist').toBe(true);
    expect(fs.existsSync(path.resolve(root, 'src/apps/background/dbLogMessageHandlers.ts')), 'src/apps/background/dbLogMessageHandlers.ts should exist').toBe(true);

    const legacyPath = 'src/background/dbRouter.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/apps\/background\/dbMessageRouter/);

    const bootstrap = fs.readFileSync(path.resolve(root, 'src/apps/background/bootstrap.ts'), 'utf8');
    expect(bootstrap).toMatch(/\.\/dbMessageRouter/);

    const dbRouter = fs.readFileSync(path.resolve(root, targetPath), 'utf8');
    expect(dbRouter).toMatch(/\.\/dbTagsMessageHandlers/);
    expect(dbRouter).toMatch(/\.\/dbMagnetPushLogMessageHandlers/);
    expect(dbRouter).toMatch(/\.\/dbInsightsMessageHandlers/);
    expect(dbRouter).toMatch(/\.\/dbLogMessageHandlers/);
  });

  it('keeps background scheduler under apps with legacy background path as compatibility export', () => {
    const targetPath = 'src/apps/background/scheduler.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/background/scheduler.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/apps\/background\/scheduler/);

    const alarmRouter = fs.readFileSync(path.resolve(root, 'src/apps/background/alarmRouter.ts'), 'utf8');
    const utilityHandlers = fs.readFileSync(path.resolve(root, 'src/apps/background/utilityMessageHandlers.ts'), 'utf8');
    expect(alarmRouter).toMatch(/\.\/scheduler/);
    expect(utilityHandlers).toMatch(/\.\/scheduler/);
  });

  it('keeps 115 v2 background proxy under drive115 feature with legacy background path as compatibility export', () => {
    const targetPath = 'src/features/drive115/v2/backgroundProxy.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/background/drive115Proxy.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/features\/drive115\/v2\/backgroundProxy/);

    const bootstrap = fs.readFileSync(path.resolve(root, 'src/apps/background/bootstrap.ts'), 'utf8');
    expect(bootstrap).toMatch(/features\/drive115\/v2\/backgroundProxy/);
  });

  it('keeps storage migrations under platform with legacy background path as compatibility export', () => {
    const targetPath = 'src/platform/storage/migrations.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/background/migrations.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/platform\/storage\/migrations/);

    const bootstrap = fs.readFileSync(path.resolve(root, 'src/apps/background/bootstrap.ts'), 'utf8');
    expect(bootstrap).toMatch(/platform\/storage\/migrations/);
  });

  it('keeps IndexedDB storage split into schema, connection, log fields, and viewed index helpers', () => {
    const expectedFiles = [
      'src/platform/storage/indexedDb.ts',
      'src/platform/storage/indexedDbConnection.ts',
      'src/platform/storage/indexedDbSchema.ts',
      'src/platform/storage/indexedDbLogFields.ts',
      'src/platform/storage/indexedDbViewedIndexes.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const indexedDbSource = fs.readFileSync(path.resolve(root, 'src/platform/storage/indexedDb.ts'), 'utf8');
    const indexedDbLineCount = indexedDbSource.split(/\r?\n/).length;
    expect(indexedDbLineCount, 'indexedDb.ts should keep shrinking as storage internals move out').toBeLessThanOrEqual(2100);
    expect(indexedDbSource).toMatch(/\.\/indexedDbConnection/);
    expect(indexedDbSource).toMatch(/\.\/indexedDbSchema/);
    expect(indexedDbSource).toMatch(/\.\/indexedDbLogFields/);
    expect(indexedDbSource).toMatch(/\.\/indexedDbViewedIndexes/);
    expect(indexedDbSource).not.toMatch(/\bopenDB\b/);

    const connectionSource = fs.readFileSync(path.resolve(root, 'src/platform/storage/indexedDbConnection.ts'), 'utf8');
    expect(connectionSource).toMatch(/\bopenDB\b/);
    expect(connectionSource).toMatch(/\bupgrade\b/);
    expect(connectionSource).toMatch(/indexedDbSchema/);
    expect(connectionSource).toMatch(/indexedDbViewedIndexes/);
    expect(connectionSource).toMatch(/indexedDbLogFields/);
  });

  it('keeps magnet search manager focused on UI orchestration with result metadata helpers in application', () => {
    const targetPath = 'src/features/magnets/application/resultMetadata.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const managerSource = fs.readFileSync(path.resolve(root, 'src/features/magnets/ui/magnetSearchManager.ts'), 'utf8');
    const managerLineCount = managerSource.split(/\r?\n/).length;
    expect(managerLineCount, 'magnetSearchManager.ts should keep shrinking as pure result helpers move out').toBeLessThanOrEqual(2450);
    expect(managerSource).toMatch(/application\/resultMetadata/);

    const helperSource = fs.readFileSync(path.resolve(root, targetPath), 'utf8');
    expect(helperSource).toMatch(/parseSizeToBytes/);
    expect(helperSource).toMatch(/detectMagnetQuality/);
    expect(helperSource).toMatch(/normalizeMagnetDate/);
    expect(helperSource).toMatch(/isValidMagnetResultName/);
  });

  it('keeps content-side toast UI under platform browser with content path as compatibility export', () => {
    const targetPath = 'src/platform/browser/toast.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/toast.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/platform\/browser\/toast/);

    const violations: string[] = [];
    for (const file of listSourceFiles('src')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      if (relative === legacyPath) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const specifier of readRelativeImports(source)) {
        const target = resolveImportPath(file, specifier);
        if (target === 'src/content/toast') {
          violations.push(relative);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps content shared state under features with content path as a compatibility export', () => {
    const targetPath = 'src/features/contentState/index.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/state.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from contentState feature`).toMatch(/features\/contentState/);

    const scannedDirs = [
      'src/apps/content',
      'src/features',
      'tests/dom',
    ];
    const violations: string[] = [];

    for (const dir of scannedDirs) {
      for (const file of listSourceFiles(dir)) {
        const relative = path.relative(root, file).replace(/\\/g, '/');
        if (relative === legacyPath) continue;
        const source = fs.readFileSync(file, 'utf8');
        if (/content\/state|src\/content\/state/.test(source)) {
          violations.push(relative);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps content DOM utilities under platform browser and task timeout helpers under platform tasks', () => {
    const browserTarget = 'src/platform/browser/domUtils.ts';
    const taskTarget = 'src/platform/tasks/taskTimeoutGuard.ts';
    expect(fs.existsSync(path.resolve(root, browserTarget)), `${browserTarget} should exist`).toBe(true);
    expect(fs.existsSync(path.resolve(root, taskTarget)), `${taskTarget} should exist`).toBe(true);

    const legacyPath = 'src/content/utils.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(12);
    expect(legacySource).toMatch(/platform\/browser\/domUtils/);
    expect(legacySource).toMatch(/platform\/tasks\/taskTimeoutGuard/);

    const violations: string[] = [];
    for (const file of listSourceFiles('src')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      if (relative === legacyPath) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const specifier of readRelativeImports(source)) {
        const target = resolveImportPath(file, specifier);
        if (target === 'src/content/utils') {
          violations.push(relative);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps enhancement loading indicator under platform browser with content path as compatibility export', () => {
    const targetPath = 'src/platform/browser/enhancementLoadingIndicator.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/enhancementLoadingIndicator.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/platform\/browser\/enhancementLoadingIndicator/);

    const violations: string[] = [];
    for (const file of listSourceFiles('src')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      if (relative === legacyPath) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const specifier of readRelativeImports(source)) {
        const target = resolveImportPath(file, specifier);
        if (target === 'src/content/enhancementLoadingIndicator') {
          violations.push(relative);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps video favorite rating under the video detail feature with content path as compatibility export', () => {
    const targetPath = 'src/features/videoDetail/favoriteRating.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/videoFavoriteRating.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource).toMatch(/features\/videoDetail\/favoriteRating/);

    const violations: string[] = [];
    for (const file of listSourceFiles('src')) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      if (relative === legacyPath) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const specifier of readRelativeImports(source)) {
        const target = resolveImportPath(file, specifier);
        if (target === 'src/content/videoFavoriteRating') {
          violations.push(relative);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps video detail page handling under features with content paths as compatibility exports', () => {
    const expectedFiles = [
      'src/features/videoDetail/index.ts',
      'src/features/videoDetail/pageHandler.ts',
      'src/features/videoDetail/enhancer.ts',
      'src/features/videoDetail/favoriteRating.ts',
      'src/features/videoDetail/favoriteRating.css',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyFiles = [
      {
        legacyPath: 'src/content/videoDetail.ts',
        targetPattern: /features\/videoDetail\/pageHandler/,
      },
      {
        legacyPath: 'src/content/enhancedVideoDetail.ts',
        targetPattern: /features\/videoDetail\/enhancer/,
      },
    ];

    for (const item of legacyFiles) {
      const legacySource = fs.readFileSync(path.resolve(root, item.legacyPath), 'utf8');
      const nonEmptyLines = legacySource
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${item.legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(legacySource, `${item.legacyPath} should re-export from videoDetail feature`).toMatch(item.targetPattern);
    }

    const directConsumers = [
      'src/apps/content/bootstrap.ts',
      'src/apps/content/contentLifecycle.ts',
      'src/apps/content/contentMessageRouter.ts',
      'src/features/listEnhancement/content/itemProcessor.ts',
      'src/dashboard/tabs/settings/enhancement/orchestrator/orchestratorDesign.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use videoDetail feature directly`).not.toMatch(/content\/(?:videoDetail|enhancedVideoDetail)/);
      expect(source, `${relative} should reference features/videoDetail`).toMatch(/features\/videoDetail|\.\.\/\.\.\/videoDetail/);
    }
  });

  it('keeps content privacy implementation under privacy feature with content paths as compatibility exports', () => {
    const expectedFiles = [
      'src/features/privacy/content/index.ts',
      'src/features/privacy/content/elementProtector.ts',
      'src/features/privacy/content/stateListener.ts',
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.resolve(root, file)), `${file} should exist`).toBe(true);
    }

    const legacyFiles = [
      {
        legacyPath: 'src/content/privacy/index.ts',
        targetPattern: /features\/privacy\/content/,
      },
      {
        legacyPath: 'src/content/privacy/elementProtector.ts',
        targetPattern: /features\/privacy\/content\/elementProtector/,
      },
      {
        legacyPath: 'src/content/privacy/stateListener.ts',
        targetPattern: /features\/privacy\/content\/stateListener/,
      },
    ];

    for (const item of legacyFiles) {
      const legacySource = fs.readFileSync(path.resolve(root, item.legacyPath), 'utf8');
      const nonEmptyLines = legacySource
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, `${item.legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
      expect(legacySource, `${item.legacyPath} should re-export from privacy content feature`).toMatch(item.targetPattern);
    }

    const exportSource = fs.readFileSync(path.resolve(root, 'src/content/export.ts'), 'utf8');
    expect(exportSource, 'content export should re-export from the page export feature').toMatch(/features\/pageExport\/content/);
    expect(exportSource, 'content export should stay a thin compatibility wrapper').not.toMatch(/requireAuthIfRestricted|createExportUI|startExport/);
  });

  it('keeps page export implementation under its feature with content path as a compatibility export', () => {
    const targetPath = 'src/features/pageExport/content/index.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const source = fs.readFileSync(path.resolve(root, targetPath), 'utf8');
    expect(source, 'page export feature should use privacy service directly').toMatch(/features\/privacy/);
    expect(source, 'page export feature should not depend on content privacy compatibility exports').not.toMatch(/content\/privacy|\.\/privacy/);

    const bootstrapSource = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    expect(bootstrapSource, 'content bootstrap should use page export feature directly').not.toMatch(/content\/export/);
    expect(bootstrapSource, 'content bootstrap should reference page export feature').toMatch(/features\/pageExport/);
  });

  it('keeps detail search links under external search with content path as compatibility export', () => {
    const targetPath = 'src/features/externalSearch/ui/detailSearchPanel.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/detailSearchLinks.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(12);
    expect(legacySource, `${legacyPath} should re-export from features/externalSearch`).toMatch(/features\/externalSearch/);

    const directConsumers = [
      'src/features/videoDetail/pageHandler.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use external search feature directly`).not.toMatch(/content\/detailSearchLinks/);
      expect(source, `${relative} should reference externalSearch`).toMatch(/externalSearch/);
    }
  });

  it('keeps password helper content implementation under passwordHelper feature with content path as compatibility export', () => {
    const targetPath = 'src/features/passwordHelper/content/index.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/passwordHelper.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from features/passwordHelper/content`).toMatch(/features\/passwordHelper\/content/);

    const bootstrapSource = fs.readFileSync(path.resolve(root, 'src/apps/content/bootstrap.ts'), 'utf8');
    expect(bootstrapSource, 'content bootstrap should use passwordHelper feature directly').not.toMatch(/content\/passwordHelper/);
    expect(bootstrapSource, 'content bootstrap should reference features/passwordHelper/content').toMatch(/features\/passwordHelper\/content/);
  });

  it('keeps anchor optimization implementation under its feature with content path as compatibility export', () => {
    const targetPath = 'src/features/anchorOptimization/content/index.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/anchorOptimization.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from features/anchorOptimization/content`).toMatch(/features\/anchorOptimization\/content/);

    const directConsumers = [
      'src/apps/content/bootstrap.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use anchorOptimization feature directly`).not.toMatch(/content\/anchorOptimization/);
      expect(source, `${relative} should reference features/anchorOptimization/content`).toMatch(/features\/anchorOptimization\/content/);
    }
  });

  it('keeps cover enhancement implementation under its feature with content path as compatibility export', () => {
    const targetPath = 'src/features/coverEnhancement/content/index.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/coverEnhancement.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from features/coverEnhancement/content`).toMatch(/features\/coverEnhancement\/content/);
  });

  it('keeps Emby enhancement implementation under its feature with content path as compatibility export', () => {
    const targetPath = 'src/features/embyEnhancement/content/index.ts';
    expect(fs.existsSync(path.resolve(root, targetPath)), `${targetPath} should exist`).toBe(true);

    const legacyPath = 'src/content/embyEnhancement.ts';
    const legacySource = fs.readFileSync(path.resolve(root, legacyPath), 'utf8');
    const nonEmptyLines = legacySource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(nonEmptyLines.length, `${legacyPath} should stay a thin compatibility wrapper`).toBeLessThanOrEqual(8);
    expect(legacySource, `${legacyPath} should re-export from features/embyEnhancement/content`).toMatch(/features\/embyEnhancement\/content/);

    const directConsumers = [
      'src/apps/content/bootstrap.ts',
      'src/apps/content/contentLifecycle.ts',
      'src/apps/content/contentMessageRouter.ts',
    ];

    for (const relative of directConsumers) {
      const source = fs.readFileSync(path.resolve(root, relative), 'utf8');
      expect(source, `${relative} should use Emby enhancement feature directly`).not.toMatch(/content\/embyEnhancement/);
      expect(source, `${relative} should reference features/embyEnhancement/content`).toMatch(/features\/embyEnhancement\/content/);
    }
  });
});

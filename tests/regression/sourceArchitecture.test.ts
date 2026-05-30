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
    const detailEnhancer = fs.readFileSync(path.resolve(root, 'src/content/enhancedVideoDetail.ts'), 'utf8');
    const listEnhancement = fs.readFileSync(path.resolve(root, 'src/features/listEnhancement/listEnhancementManager.ts'), 'utf8');
    expect(contentBootstrap).toMatch(/features\/previews/);
    expect(detailEnhancer).toMatch(/features\/previews/);
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
    const keyboardShortcuts = fs.readFileSync(path.resolve(root, 'src/content/keyboardShortcuts.ts'), 'utf8');
    expect(contentBootstrap).toMatch(/features\/contentFilter/);
    expect(keyboardShortcuts).toMatch(/features\/contentFilter/);
  });

  it('keeps list enhancement implementation under features with content path as a compatibility export', () => {
    const expectedFiles = [
      'src/features/listEnhancement/index.ts',
      'src/features/listEnhancement/listEnhancementManager.ts',
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
});

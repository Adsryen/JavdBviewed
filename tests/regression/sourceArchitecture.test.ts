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
});

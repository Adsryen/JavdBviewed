/**
 * @file build.ts
 * @description 构建脚本 —— Vite 构建 + 版本号刷新 + 资源复制 + 双产物 ZIP（chrome / firefox）
 * @module scripts
 */
import { build } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import archiver from 'archiver';
import { execSync } from 'child_process';
import { formatArtifactVersion } from './versioning';
import { toFirefoxManifest, type ExtensionManifest } from './firefoxManifest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const distChromeDir = resolve(root, 'dist-chrome');
const distFirefoxDir = resolve(root, 'dist-firefox');
const distZipDir = resolve(root, 'dist-zip');

type BuildTarget = 'chrome' | 'firefox' | 'all';

function parseTarget(argv: string[]): BuildTarget {
  const flag = argv.find((a) => a.startsWith('--target='));
  const value = flag ? flag.slice('--target='.length) : 'all';
  if (value === 'chrome' || value === 'firefox' || value === 'all') return value;
  throw new Error(`Unknown --target=${value}. Use chrome|firefox|all`);
}

/** 从 version.json 或 package.json 读取当前版本号 */
async function getVersion() {
  const versionJsonPath = resolve(root, 'version.json');
  if (fs.existsSync(versionJsonPath)) {
    const versionJson = await fs.readJson(versionJsonPath);
    return formatArtifactVersion({
      version: versionJson.version,
      build: versionJson.build,
    });
  }
  const packageJsonPath = resolve(root, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    return packageJson.version;
  }
  throw new Error('Could not find version information.');
}

async function copyRuntimeAssets(): Promise<void> {
  const fontawesomeSrcDir = resolve(root, 'src/assets/fontawesome');
  const fontawesomeDistDir = resolve(distDir, 'assets/fontawesome');
  if (fs.existsSync(fontawesomeSrcDir)) {
    await fs.copy(fontawesomeSrcDir, fontawesomeDistDir);
    console.log(`[build] Copied Font Awesome assets from: ${fontawesomeSrcDir}`);
  }

  const distTemplatesDir = resolve(distDir, 'assets/templates');
  await fs.ensureDir(distTemplatesDir);
  const g2plotDistPath = resolve(distTemplatesDir, 'g2plot.min.js');
  const g2plotCandidates = [
    resolve(root, 'src/assets/templates/g2plot.min.js'),
    resolve(root, 'public/assets/templates/g2plot.min.js'),
    resolve(root, 'node_modules/@antv/g2plot/dist/g2plot.min.js'),
  ];
  let copied = false;
  for (const p of g2plotCandidates) {
    if (fs.existsSync(p)) {
      await fs.copy(p, g2plotDistPath);
      console.log(`[build] Copied g2plot.min.js from: ${p}`);
      copied = true;
      break;
    }
  }
  if (!copied) {
    console.warn('[build] g2plot.min.js not found in src/public/node_modules. G2Plot will fallback to ECharts at runtime.');
  }
}

async function zipDirectory(sourceDir: string, zipPath: string): Promise<void> {
  await fs.ensureDir(dirname(zipPath));
  await new Promise<void>((resolvePromise, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`[build] Zip created: ${zipPath} (${archive.pointer()} bytes)`);
      resolvePromise();
    });
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') console.warn('[build] zip warning:', err);
      else reject(err);
    });
    archive.on('error', reject);

    archive.pipe(output);
    archive.glob('**/*', { cwd: sourceDir, ignore: ['*.zip'] });
    void archive.finalize();
  });
}

/**
 * 以 Chromium dist 为源：复制到 dist-chrome / 变换后写入 dist-firefox，并打 zip。
 * Firefox 包不二次 Vite，避免双 SW 打包成本；仅改 manifest。
 */
async function materializeTargets(
  targets: Array<'chrome' | 'firefox'>,
  version: string,
): Promise<void> {
  const manifestPath = resolve(distDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('dist/manifest.json missing after Vite build');
  }
  const chromeManifest = (await fs.readJson(manifestPath)) as ExtensionManifest;

  for (const target of targets) {
    if (target === 'chrome') {
      await fs.remove(distChromeDir);
      await fs.copy(distDir, distChromeDir);
      const zipPath = resolve(distZipDir, `javdb-extension-v${version}-chrome.zip`);
      await zipDirectory(distChromeDir, zipPath);
      // 兼容旧文件名（未加 -chrome 后缀）供现有脚本/文档过渡
      const legacyZip = resolve(distZipDir, `javdb-extension-v${version}.zip`);
      await fs.copy(zipPath, legacyZip);
      console.log(`[build] Also wrote legacy zip name: ${legacyZip}`);
    } else {
      await fs.remove(distFirefoxDir);
      await fs.copy(distDir, distFirefoxDir);
      const firefoxManifest = toFirefoxManifest(chromeManifest);
      await fs.writeJson(resolve(distFirefoxDir, 'manifest.json'), firefoxManifest, { spaces: 2 });
      const zipPath = resolve(distZipDir, `javdb-extension-v${version}-firefox.zip`);
      await zipDirectory(distFirefoxDir, zipPath);
    }
  }
}

async function main() {
  try {
    const target = parseTarget(process.argv.slice(2));
    console.log(`Starting build process (target=${target})...`);

    try {
      execSync('node --import tsx scripts/version.ts', {
        cwd: root,
        stdio: 'inherit',
      });
    } catch {
      console.warn('[build] Failed to refresh build id via scripts/version.ts. Proceeding with existing env/version files.');
    }

    await build();
    console.log('Vite build finished successfully.');

    await copyRuntimeAssets();

    const version = await getVersion();
    await fs.ensureDir(distZipDir);
    await fs.emptyDir(distZipDir);

    const targets: Array<'chrome' | 'firefox'> =
      target === 'all' ? ['chrome', 'firefox'] : [target];
    await materializeTargets(targets, version);

    console.log('\nBuild and packaging process completed.');
  } catch (e) {
    console.error('\nAn error occurred during the build process:');
    console.error(e);
    process.exit(1);
  }
}

main();

import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import manifest from './src/manifest.json';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { formatManifestVersion } from '../../scripts/versioning';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

// 动态同步 manifest.version 从 version.json（仅在构建时）
function getUpdatedManifest() {
  const manifestCopy = { ...manifest };

  try {
    const versionJsonPath = path.resolve(repoRoot, 'version.json');
    if (fs.existsSync(versionJsonPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
      if (versionData.version) {
        const manifestVersion = formatManifestVersion(versionData);
        manifestCopy.version = manifestVersion;
        console.log(`📦 Manifest version synced to: ${manifestVersion}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('⚠️  Could not sync manifest version from version.json:', message);
  }

  return manifestCopy;
}

export default defineConfig({
  // vite root = extension src (crx entries live under apps/extension/src)
  root: path.resolve(__dirname, 'src'),
  envDir: repoRoot,
  // 重要：使用相对资源路径，避免内容脚本动态分包以 /assets/ 前缀从网站域拉取
  base: '',
  plugins: [
    react(),
    crx({ manifest: getUpdatedManifest() }),
  ],
  resolve: {
    alias: {
      '@javdb/sync-protocol': path.resolve(repoRoot, 'packages/sync-protocol/src/index.ts'),
      '@javdb/sync-client': path.resolve(repoRoot, 'packages/sync-client/src/index.ts'),
    },
  },
  build: {
    // Keep dist at monorepo root for existing scripts / load-unpacked habits
    outDir: path.resolve(repoRoot, 'dist'),
    emptyOutDir: true,
  },
});

import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import path from 'path';
import fs from 'fs';
import { formatManifestVersion } from './scripts/versioning';

// 动态同步 manifest.version 从 version.json（仅在构建时）
function getUpdatedManifest() {
  const manifestCopy = { ...manifest };

  try {
    const versionJsonPath = path.resolve(__dirname, 'version.json');
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
  root: 'src',
  envDir: '..',
  // 重要：使用相对资源路径，避免内容脚本动态分包以 /assets/ 前缀从网站域拉取
  base: '',
  plugins: [
    crx({ manifest: getUpdatedManifest() }),
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    /*
    rollupOptions: {
      onwarn(warning, warn) {
        // 抑制动态导入和静态导入冲突的警告
        if (warning.code === 'DYNAMIC_IMPORT_STATIC_IMPORT_CONFLICT') {
          return;
        }
        // 其他警告正常显示
        warn(warning);
      }
    }*/
  },
});

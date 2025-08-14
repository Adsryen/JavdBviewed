import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import path from 'path';
import fs from 'fs';

// 动态同步 manifest.version 从 version.json（仅在构建时）
function getUpdatedManifest() {
  const manifestCopy = { ...manifest };

  try {
    const versionJsonPath = path.resolve(__dirname, 'version.json');
    if (fs.existsSync(versionJsonPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
      if (versionData.version) {
        manifestCopy.version = versionData.version;
        console.log(`📦 Manifest version synced to: ${versionData.version}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not sync manifest version from version.json:', error.message);
  }

  return manifestCopy;
}

export default defineConfig({
  root: 'src',
  envDir: '..',
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
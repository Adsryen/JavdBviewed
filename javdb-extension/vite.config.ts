import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import path from 'path';

export default defineConfig({
  root: 'src',
  envDir: '..',
  plugins: [
    crx({ manifest }),
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
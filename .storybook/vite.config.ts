/**
 * @file vite.config.ts
 * @description Storybook 专用 Vite 配置（不加载扩展 crx 插件与 src root）
 * @module .storybook
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ui': path.resolve(process.cwd(), 'src/ui'),
    },
  },
});

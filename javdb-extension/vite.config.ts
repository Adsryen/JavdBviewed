import { defineConfig } from 'vite';
const { crx } = require('@crxjs/vite-plugin');
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',
        dashboard: 'src/dashboard/dashboard.html',
      },
    },
  },
}); 
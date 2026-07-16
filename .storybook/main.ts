/**
 * @file main.ts
 * @description Storybook 主配置：仅加载 apps/extension/src/ui 组件故事，使用独立 Vite 配置
 * @module .storybook
 */
import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';

const config: StorybookConfig = {
  stories: ['../apps/extension/src/ui/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      // 使用独立配置，避免继承扩展构建的 root:src + crx 插件
      builder: {
        viteConfigPath: path.resolve(process.cwd(), '.storybook/vite.config.ts'),
      },
    },
  },
  core: {
    disableTelemetry: true,
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;

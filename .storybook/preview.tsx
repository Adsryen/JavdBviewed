/**
 * @file preview.tsx
 * @description Storybook 预览：注入主题 CSS，工具栏切换 data-theme（日夜）
 * @module .storybook
 */
import type { Preview, Decorator } from '@storybook/react';
import React, { useEffect } from 'react';
import '../src/ui/styles/globals.css';

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) || 'light';
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background: 'var(--color-bg, var(--bg-primary))',
        color: 'var(--color-fg, var(--text-primary))',
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'fullscreen',
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'html[data-theme] 日夜切换',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;

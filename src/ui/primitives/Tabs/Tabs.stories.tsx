/**
 * @file Tabs.stories.tsx
 * @description Tabs 分段切换 Story
 * @module ui/primitives
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const ITEMS = [
  { id: 'all', label: '全部' },
  { id: 'emby', label: 'Emby' },
  { id: 'jellyfin', label: 'Jellyfin' },
  { id: '115', label: '115', disabled: true },
] as const;

export const Basic: Story = {
  render: () => {
    const [value, setValue] = useState('all');
    return <Tabs items={[...ITEMS]} value={value} onChange={setValue} />;
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState('emby');
    return <Tabs size="sm" items={[...ITEMS]} value={value} onChange={setValue} />;
  },
};

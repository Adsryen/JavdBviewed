/**
 * @file SettingSection.stories.tsx
 * @description 设置区块 Story
 * @module ui/patterns
 */
import type { Meta, StoryObj } from '@storybook/react';
import { SettingToggleRow } from '../SettingToggleRow/SettingToggleRow';
import { SettingSection } from './SettingSection';

const meta: Meta<typeof SettingSection> = {
  title: 'Patterns/SettingSection',
  component: SettingSection,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SettingSection>;

export const Default: Story = {
  args: {
    title: '番号过滤',
    description: '控制在列表中自动隐藏的影片类型',
    children: (
      <>
        <SettingToggleRow id="demo-viewed" label="隐藏已看" checked onChange={() => {}} />
        <SettingToggleRow id="demo-vr" label="隐藏 VR" checked={false} onChange={() => {}} />
      </>
    ),
  },
};

export const TwoColumn: Story = {
  render: () => (
    <SettingSection
      title="演员过滤（列表）"
      description="基于本地演员库近似识别"
      contentClassName="sm:grid sm:grid-cols-2"
    >
      <SettingToggleRow
        id="demo-bl"
        label="隐藏黑名单演员"
        checked={false}
        onChange={() => {}}
      />
      <SettingToggleRow
        id="demo-fav"
        label="仅收藏演员"
        checked
        onChange={() => {}}
      />
    </SettingSection>
  ),
};

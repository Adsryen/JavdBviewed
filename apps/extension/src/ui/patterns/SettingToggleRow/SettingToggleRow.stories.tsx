/**
 * @file SettingToggleRow.stories.tsx
 * @description 设置开关行 Story
 * @module ui/patterns
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SettingToggleRow } from './SettingToggleRow';

const meta: Meta<typeof SettingToggleRow> = {
  title: 'Patterns/SettingToggleRow',
  component: SettingToggleRow,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SettingToggleRow>;

export const Off: Story = {
  args: {
    id: 'hide-viewed',
    label: '隐藏已标记"看过"的影片',
    checked: false,
    onChange: () => {},
  },
};

export const On: Story = {
  args: {
    id: 'hide-vr',
    label: '隐藏所有 VR 影片',
    checked: true,
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="max-w-md rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <SettingToggleRow
          id="interactive-toggle"
          label="隐藏想看的影片"
          description="开启后列表中不再显示想看条目"
          checked={checked}
          onChange={setChecked}
        />
      </div>
    );
  },
};

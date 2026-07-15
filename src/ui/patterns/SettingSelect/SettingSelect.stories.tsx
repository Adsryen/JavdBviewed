/**
 * @file SettingSelect.stories.tsx
 * @description SettingSelect Story
 * @module ui/patterns
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SettingSelect } from './SettingSelect';

const meta: Meta<typeof SettingSelect> = {
  title: 'Patterns/SettingSelect',
  component: SettingSelect,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SettingSelect>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('INFO');
    return (
      <SettingSelect
        id="demo-level"
        value={value}
        onChange={setValue}
        options={[
          { value: 'OFF', label: 'OFF - 关闭' },
          { value: 'INFO', label: 'INFO - 信息' },
          { value: 'DEBUG', label: 'DEBUG - 全部' },
        ]}
      />
    );
  },
};

/**
 * @file FilterChip.stories.tsx
 * @description 筛选芯片 Story
 * @module ui/patterns
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterChip } from './FilterChip';

const meta: Meta<typeof FilterChip> = {
  title: 'Patterns/FilterChip',
  component: FilterChip,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof FilterChip>;

export const Inactive: Story = {
  args: {
    children: '全部来源',
    active: false,
  },
};

export const Active: Story = {
  args: {
    children: 'Emby',
    active: true,
  },
};

export const Group: Story = {
  render: () => {
    const options = ['全部来源', 'Emby', 'Jellyfin', '115'] as const;
    const [value, setValue] = useState<(typeof options)[number]>('全部来源');
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((label) => (
          <FilterChip
            key={label}
            active={value === label}
            onClick={() => setValue(label)}
          >
            {label}
          </FilterChip>
        ))}
      </div>
    );
  },
};

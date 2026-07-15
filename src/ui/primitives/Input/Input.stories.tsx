import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: {
    placeholder: '搜索番号 / 标题',
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: '格式不正确' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: '不可编辑' },
};

export const SearchRow: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <label className="text-xs font-semibold text-[var(--color-fg-muted)]">搜索</label>
      <Input type="search" placeholder="搜索…" />
    </div>
  ),
};

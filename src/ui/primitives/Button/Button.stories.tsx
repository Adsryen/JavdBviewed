import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  args: {
    children: '确认',
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: '主要操作' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: '次要操作' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: '幽灵按钮' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: '危险操作' },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>默认</Badge>
      <Badge tone="primary">Primary</Badge>
      <Badge tone="success">已入库</Badge>
      <Badge tone="warning">警告</Badge>
      <Badge tone="danger">错误</Badge>
      <Badge tone="info">Emby</Badge>
    </div>
  ),
};

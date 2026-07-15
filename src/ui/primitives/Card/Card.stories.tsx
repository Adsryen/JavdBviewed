/**
 * @file Card.stories.tsx
 * @description 通用卡片 Story
 * @module ui/primitives
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  args: {
    title: '同步说明',
    children: '配置服务器后，可在此查看最近一次同步结果与失败原因。',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithActions: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <Card
        title="操作"
        actions={
          <>
            <Button size="sm" variant="secondary">
              取消
            </Button>
            <Button size="sm">保存</Button>
          </>
        }
      >
        卡片可承载设置说明与页脚操作。
      </Card>
    </div>
  ),
};

export const Flat: Story = {
  args: {
    title: '平面卡片',
    flat: true,
    children: '无阴影，适合嵌套在已有面板内。',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * @file Toast.stories.tsx
 * @description Toast 提示 Story
 * @module ui/primitives
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Primitives/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Info: Story = {
  args: {
    tone: 'info',
    title: '提示',
    children: '已保存到本地配置。',
    onClose: () => undefined,
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    title: '成功',
    children: '同步完成。',
    onClose: () => undefined,
  },
};

export const Warning: Story = {
  args: {
    tone: 'warning',
    title: '注意',
    children: '部分服务器返回 401。',
    onClose: () => undefined,
  },
};

export const Danger: Story = {
  args: {
    tone: 'danger',
    title: '失败',
    children: '网络超时，请稍后重试。',
    onClose: () => undefined,
  },
};

export const Stack: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <Toast tone="success" title="成功">
        第一项
      </Toast>
      <Toast tone="info" title="提示">
        第二项
      </Toast>
    </div>
  ),
};

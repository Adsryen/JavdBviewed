/**
 * @file PageHeader.stories.tsx
 * @description 页面顶栏 Story
 * @module ui/patterns
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../primitives/Button/Button';
import { PageHeader } from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  title: 'Patterns/PageHeader',
  component: PageHeader,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: '媒体库',
    description: '本地索引 · 128 部',
  },
};

export const WithActions: Story = {
  render: () => (
    <PageHeader
      title="媒体库"
      description="当前为预览数据"
      actions={
        <>
          <Button size="sm" variant="secondary">
            同步媒体库
          </Button>
          <Button size="sm" variant="ghost">
            刷新列表
          </Button>
        </>
      }
    />
  ),
};

export const WithEyebrow: Story = {
  render: () => (
    <PageHeader
      align="center"
      eyebrow={
        <Button size="sm" variant="secondary">
          ← 返回设置
        </Button>
      }
      title="列表显示设置"
      description="控制列表中已看 / 想看等条目的显示策略"
    />
  ),
};

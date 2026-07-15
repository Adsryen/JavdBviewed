/**
 * @file EmptyState.stories.tsx
 * @description 空态 Story
 * @module ui/patterns
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../primitives/Button/Button';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Patterns/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: '这里还没有可展示的条目',
    description: '可先到设置中配置 Emby / Jellyfin 并完成媒体库同步。',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithAction: Story = {
  render: () => (
    <div style={{ width: 420 }}>
      <EmptyState
        title="当前筛选下无结果"
        description="可切换来源或清空搜索。"
        action={
          <Button size="sm" variant="secondary">
            清空筛选
          </Button>
        }
      />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div style={{ width: 420 }}>
      <EmptyState
        icon={<span aria-hidden="true">📭</span>}
        title="没有匹配的设置项"
        description="换个关键词试试。"
      />
    </div>
  ),
};

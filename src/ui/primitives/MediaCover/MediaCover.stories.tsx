/**
 * @file MediaCover.stories.tsx
 * @description 媒体封面原语 Story（含日夜工具栏）
 * @module ui/primitives
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../Badge/Badge';
import { MediaCover } from './MediaCover';

const meta: Meta<typeof MediaCover> = {
  title: 'Primitives/MediaCover',
  component: MediaCover,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof MediaCover>;

const demoArt = {
  background:
    'linear-gradient(125deg, hsl(210 48% 48%), hsl(246 42% 28%) 50%, hsl(228 28% 14%))',
};

export const Default: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <MediaCover
        artStyle={demoArt}
        badges={
          <>
            <Badge tone="primary">Emby</Badge>
            <Badge tone="success">预览</Badge>
          </>
        }
        footer={
          <>
            <span style={{ fontWeight: 800, fontSize: 11 }}>SSIS-458</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>示例标题</span>
          </>
        }
      />
    </div>
  ),
};

export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 200px))',
        gap: 12,
        width: 640,
      }}
    >
      {[200, 330, 145].map((hue) => (
        <MediaCover
          key={hue}
          artStyle={{
            background: `linear-gradient(125deg, hsl(${hue} 48% 48%), hsl(${(hue + 36) % 360} 42% 28%))`,
          }}
          badges={<Badge tone="info">Jellyfin</Badge>}
          footer={<span style={{ fontWeight: 700 }}>封面 {hue}</span>}
        />
      ))}
    </div>
  ),
};

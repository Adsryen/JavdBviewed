/**
 * @file SettingField.stories.tsx
 * @description SettingField Story
 * @module ui/patterns
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../primitives/Input/Input';
import { SettingField } from './SettingField';

const meta: Meta<typeof SettingField> = {
  title: 'Patterns/SettingField',
  component: SettingField,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SettingField>;

export const Default: Story = {
  render: () => (
    <SettingField
      id="demo-topn"
      label="Top N 排行数量"
      description="排行榜显示的条目数量（1-50）"
    >
      <Input id="demo-topn" type="number" defaultValue={10} min={1} max={50} />
    </SettingField>
  ),
};

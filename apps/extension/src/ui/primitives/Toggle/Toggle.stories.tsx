import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Primitives/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Off: Story = {
  args: { label: '自动检查', defaultChecked: false },
};

export const On: Story = {
  args: { label: '自动检查', defaultChecked: true },
};

export const Controlled: Story = {
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <Toggle
        label={on ? '已开启' : '已关闭'}
        checked={on}
        onChange={(e) => setOn(e.currentTarget.checked)}
      />
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Toggle size="sm" label="Small" defaultChecked />
      <Toggle size="md" label="Medium" defaultChecked />
      <Toggle size="lg" label="Large" defaultChecked />
    </div>
  ),
};

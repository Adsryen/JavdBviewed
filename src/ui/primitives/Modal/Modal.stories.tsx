import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Primitives/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Open: Story = {
  args: {
    open: true,
    title: '确认操作',
    children: '此操作会写入本地配置，可随时在设置中修改。',
    onClose: () => undefined,
    footer: (
      <>
        <Button variant="secondary">取消</Button>
        <Button>确认</Button>
      </>
    ),
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8">
        <Button onClick={() => setOpen(true)}>打开弹窗</Button>
        <Modal
          open={open}
          title="示例弹窗"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setOpen(false)}>完成</Button>
            </>
          }
        >
          用 Storybook 预览弹窗与日夜主题，无需加载扩展。
        </Modal>
      </div>
    );
  },
};

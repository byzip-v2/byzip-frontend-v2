import type { Meta, StoryObj } from "@storybook/nextjs";
import Toast from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Common/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'radio' },
      options: ['success', 'error'],
    },
    message: {
      control: 'text',
    },
  },
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    message: "좌표 등록 성공",
    type: 'success',
  },
};

export const Error: Story = {
  args: {
    message: "좌표 등록 실패",
    type: 'error',
  },
};

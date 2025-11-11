import type { Meta, StoryObj } from "@storybook/nextjs";
import Toast from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Common/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: "text",
      description: "토스트에 표시할 메시지",
    },
    color: {
      control: "color",
      description: "배경 색상",
    },
  },
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    message: "좌표 등록 성공",
    color: "#3270ff", // 파랑 (primary)
  },
};

export const Error: Story = {
  args: {
    message: "좌표 등록 실패",
    color: "#ff4d4f", // 빨강 (error)
  },
};


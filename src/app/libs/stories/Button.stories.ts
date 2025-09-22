import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 버튼
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '로그인',
  },
};

// 보조 버튼
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '취소',
  },
};

// 작은 버튼
export const Small: Story = {
  args: {
    size: 'small',
    children: '작은 버튼',
  },
};

// 큰 버튼
export const Large: Story = {
  args: {
    size: 'large',
    children: '큰 버튼',
  },
};

// 비활성화된 버튼
export const Disabled: Story = {
  args: {
    disabled: true,
    children: '비활성화',
  },
};

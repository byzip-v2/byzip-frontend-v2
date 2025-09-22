import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password'],
    },
    icon: {
      control: { type: 'select' },
      options: ['none', 'email', 'lock'],
    },
    showPasswordToggle: {
      control: { type: 'boolean' },
    },
    error: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 입력 필드
export const Default: Story = {
  args: {
    placeholder: '텍스트를 입력하세요',
  },
};

// 이메일 입력 필드
export const Email: Story = {
  args: {
    type: 'email',
    icon: 'email',
    label: '이메일',
    placeholder: '이메일을 입력하세요',
  },
};

// 비밀번호 입력 필드
export const Password: Story = {
  args: {
    type: 'password',
    icon: 'lock',
    label: '비밀번호',
    placeholder: '비밀번호를 입력하세요',
    showPasswordToggle: true,
  },
};

// 에러 상태
export const Error: Story = {
  args: {
    label: '이메일',
    icon: 'email',
    placeholder: '이메일을 입력하세요',
    error: true,
    errorMessage: '올바른 이메일 형식이 아닙니다.',
  },
};

// 비활성화 상태
export const Disabled: Story = {
  args: {
    label: '이메일',
    icon: 'email',
    placeholder: '이메일을 입력하세요',
    disabled: true,
  },
};

// 라벨 없는 입력 필드
export const NoLabel: Story = {
  args: {
    icon: 'email',
    placeholder: '이메일을 입력하세요',
  },
}; 
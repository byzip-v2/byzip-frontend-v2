import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './LoginForm';

const meta = {
  title: 'Components/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    loading: {
      control: { type: 'boolean' },
    },
    errorMessage: {
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 로그인 폼
export const Default: Story = {
  args: {
    onLogin: (email, password) => {
      console.log('로그인 시도:', { email, password });
    },
  },
};

// 로딩 상태
export const Loading: Story = {
  args: {
    loading: true,
    onLogin: (email, password) => {
      console.log('로그인 시도:', { email, password });
    },
  },
};

// 에러 상태
export const Error: Story = {
  args: {
    errorMessage: '이메일 또는 비밀번호가 올바르지 않습니다.',
    onLogin: (email, password) => {
      console.log('로그인 시도:', { email, password });
    },
  },
}; 
import type { Meta, StoryObj } from '@storybook/react';
import { AdminLayout } from './AdminLayout';
import { CoordinatesPage } from './CoordinatesPage';

const meta = {
  title: 'Layouts/AdminLayout',
  component: AdminLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    pageTitle: {
      control: { type: 'text' },
    },
    activeMenu: {
      control: { type: 'select' },
      options: ['dashboard', 'announcements', 'coordinates', 'bugreports'],
    },
  },
} satisfies Meta<typeof AdminLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 관리자 레이아웃
export const Default: Story = {
  args: {
    pageTitle: 'Dashboard',
    activeMenu: 'dashboard',
    children: (
      <div style={{ padding: '24px' }}>
        <h1>대시보드</h1>
        <p>관리자 페이지 메인 콘텐츠입니다.</p>
      </div>
    ),
  },
};

// 좌표 관리 페이지
export const CoordinatesPage: Story = {
  args: {
    pageTitle: '좌표 관리',
    activeMenu: 'coordinates',
    children: <CoordinatesPage />,
  },
};

// 분양공고 관리 페이지
export const AnnouncementsPage: Story = {
  args: {
    pageTitle: '분양공고 관리',
    activeMenu: 'announcements',
    children: (
      <div style={{ padding: '24px' }}>
        <h1>분양공고 관리</h1>
        <p>분양공고 목록과 관리 기능이 여기에 표시됩니다.</p>
      </div>
    ),
  },
};

// 버그리포트 페이지
export const BugReportsPage: Story = {
  args: {
    pageTitle: '버그리포트',
    activeMenu: 'bugreports',
    children: (
      <div style={{ padding: '24px' }}>
        <h1>버그리포트</h1>
        <p>사용자들이 신고한 버그 목록이 여기에 표시됩니다.</p>
      </div>
    ),
  },
};

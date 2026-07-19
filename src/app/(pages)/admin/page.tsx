import DashboardClient from './DashboardClient';
import {
  getDashboardSummary,
  getAnalyticsSummary,
  getMissingCoordinatesSummary,
  getBugReportsSummary,
} from './actions';
import type { Metadata } from 'next';

// (한국어) 관리자 대시보드 화면의 브라우저 탭 타이틀 최적화를 위한 메타데이터 설정
export const metadata: Metadata = {
  title: '관리자 대시보드',
};

export default async function AdminDashboardPage() {
  // 데이터를 서버에서 미리 가져옴
  const [statsRes, analyticsRes, missingRes, bugRes] = await Promise.all([
    getDashboardSummary(),
    getAnalyticsSummary(),
    getMissingCoordinatesSummary(),
    getBugReportsSummary(),
  ]);

  const stats =
    statsRes.success && statsRes.data
      ? statsRes.data
      : { pendingCount: 0, todayNewCount: 0 };

  const analytics =
    analyticsRes.success && analyticsRes.data
      ? analyticsRes.data
      : { dailyVisitors: [], osVisitors: [] };

  const missingData =
    missingRes.success && missingRes.data
      ? missingRes.data
      : { items: [], total: 0 };

  const bugReports = bugRes.success && bugRes.data ? bugRes.data : [];

  return (
    <DashboardClient
      initialStats={stats}
      analytics={analytics}
      missingData={missingData}
      bugReports={bugReports}
    />
  );
}

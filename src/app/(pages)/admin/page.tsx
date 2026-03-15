import DashboardClient from './DashboardClient';
import {
  getDashboardSummary,
  getAnalyticsSummary,
  getMissingCoordinatesSummary,
} from './actions';

export default async function AdminDashboardPage() {
  // 데이터를 서버에서 미리 가져옴
  const [statsRes, analyticsRes, missingRes] = await Promise.all([
    getDashboardSummary(),
    getAnalyticsSummary(),
    getMissingCoordinatesSummary(),
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

  return (
    <DashboardClient
      initialStats={stats}
      analytics={analytics}
      missingData={missingData}
    />
  );
}

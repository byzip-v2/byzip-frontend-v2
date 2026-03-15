import DashboardClient from './DashboardClient';
import { getDashboardSummary } from './actions';

/**
 * 관리자 대시보드 페이지 (Server Component)
 * 데이터를 서버 사이드에서 미리 가져와서 클라이언트 컴포넌트에 전달합니다.
 */
export default async function AdminDashboardPage() {
  // 데이터를 서버에서 미리 가져옴
  const result = await getDashboardSummary();
  
  const stats = result.success && result.data 
    ? result.data 
    : { pendingCount: 0, todayNewCount: 0 };

  return <DashboardClient initialStats={stats} />;
}

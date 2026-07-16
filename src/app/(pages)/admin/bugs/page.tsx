import { getBugReports, type GetBugReportsParams } from './actions';
import BugReportPage from './components/BugReportPage';
import type { Metadata } from 'next';

// (한국어) 관리자 버그 리포트 관리 화면의 브라우저 탭 타이틀 최적화를 위한 메타데이터 설정
export const metadata: Metadata = {
  title: '버그리포트',
};

interface BugReportPageProps {
  searchParams: Promise<{
    search?: string;
    assigneeId?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function Page({ searchParams }: BugReportPageProps) {
  const params = await searchParams;
  const { search, assigneeId, status, page } = params;

  // API 파라미터 준비 (검색어: search, 담당자: assigneeId 로 백엔드에 전달)
  const apiParams: GetBugReportsParams = {
    search: search || undefined,
    assigneeId: assigneeId || undefined,
    page: Number(page) || 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  };

  // 필터는 URL에 있을 때만 적용 (없으면 전체 조회)
  apiParams.status = status || undefined;

  // 서버사이드 데이터 페칭
  const result = await getBugReports(apiParams);

  if (!result.success) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>데이터를 불러오는데 실패했습니다</h2>
        <p>{result.message}</p>
      </div>
    );
  }

  return (
    <BugReportPage
      initialBugs={result.data || []}
      initialMeta={result.meta}
      searchParams={params}
      statusCounts={result.meta?.statusCounts}
    />
  );
}

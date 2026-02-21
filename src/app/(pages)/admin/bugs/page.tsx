'use server';

import { BugReportStatus } from 'byzip-v2-sdk';
import { getBugReports, type GetBugReportsParams } from './actions';
import BugReportPage from './components/BugReportPage';

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

  // 필터는 항상 있음. URL에 없으면 기본값 open
  apiParams.status = status || BugReportStatus.OPEN;

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
    />
  );
}

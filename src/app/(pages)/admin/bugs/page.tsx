'use server';

import { getBugReports, type GetBugReportsParams } from './actions';
import BugReportPage, {
  BugStatus,
  mapUiToApiStatus,
} from './components/BugReportPage';

interface BugReportPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function Page({ searchParams }: BugReportPageProps) {
  const params = await searchParams;
  const { q, status, page } = params;

  // API 파라미터 준비
  const apiParams: GetBugReportsParams = {
    search: q || undefined,
    page: Number(page) || 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  };

  if (status && status !== 'all') {
    apiParams.status = mapUiToApiStatus(status as BugStatus);
  }

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

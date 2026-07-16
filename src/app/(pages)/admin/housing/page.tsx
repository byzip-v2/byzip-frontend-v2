import { getHousingSupplies, GetHousingSuppliesResultData } from './actions';
import HousingPage from './components/HousingPage';
import type { Metadata } from 'next';

// (한국어) 관리자 분양공고 관리 화면의 브라우저 탭 타이틀 최적화를 위한 메타데이터 설정
export const metadata: Metadata = {
  title: '분양공고 관리',
};

/**
 * 분양공고 관리 페이지 (서버 컴포넌트)
 * 초기 데이터를 서버사이드에서 페칭하여 클라이언트 컴포넌트로 전달합니다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    isHidden?: string;
    includeEnded?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;
  const isHidden = params.isHidden === 'true';
  const includeEnded = params.includeEnded === 'true';

  // 초기 데이터 페칭
  const result = await getHousingSupplies({
    page,
    limit: 10,
    search,
    isHidden: isHidden || undefined,
    // includeEnded가 true이면 날짜 필터 생략, false이면 오늘 이후인 것만 조회
    includeEnded: includeEnded,
    recruiting: includeEnded ? undefined : true,
  });
  if (!result.success) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>데이터를 불러오는데 실패했습니다</h2>
        <p>{result.message}</p>
      </div>
    );
  }

  // 데이터가 없을 경우를 대비해 빈 객체 구조 전달
  const initialData = result.data || {
    items: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      itemCount: 0,
    },
  };

  return (
    <HousingPage
      initialData={initialData as GetHousingSuppliesResultData}
      searchParams={params}
    />
  );
}

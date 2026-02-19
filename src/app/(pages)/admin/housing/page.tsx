'use server';

import { getHousingSupplies } from './actions';
import HousingPage from './components/HousingPage';

/**
 * 분양공고 관리 페이지 (서버 컴포넌트)
 * 초기 데이터를 서버사이드에서 페칭하여 클라이언트 컴포넌트로 전달합니다.
 */
export default async function Page() {
  // 초기 데이터 페칭 (페이지 1, 리밋 10)
  const result = await getHousingSupplies({
    page: 1,
    limit: 10,
    rcritPblancDeFrom: new Date().toISOString().split('T')[0],
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
      itemCount: 0
    }
  };

  return <HousingPage initialData={initialData} />;
}

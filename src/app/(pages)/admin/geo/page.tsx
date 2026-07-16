import { getMissingCoordinates } from './actions';
import GeoPage from './components/GeoPage';
import type { Metadata } from 'next';

// (한국어) 관리자 좌표 관리 화면의 브라우저 탭 타이틀 최적화를 위한 메타데이터 설정
export const metadata: Metadata = {
  title: '좌표 관리',
};

/**
 * 좌표 관리 페이지 (서버 컴포넌트)
 * 좌표가 없는 데이터를 서버사이드에서 페칭하여 클라이언트 컴포넌트로 전달합니다.
 */
export default async function Page() {
  // 서버사이드 데이터 페칭
  const result = await getMissingCoordinates();

  if (!result.success) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>데이터를 불러오는데 실패했습니다</h2>
        <p>{result.message}</p>
      </div>
    );
  }

  return <GeoPage initialData={result.data || []} />;
}

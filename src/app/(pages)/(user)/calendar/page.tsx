import { getPublicHousingSupplies } from '../(with-map)/actions';
import CalendarClient from './components/CalendarClient';

export default async function CalendarPage() {
  // 접수 종료일(rceptEndde)을 기준으로 오름차순(ASC) 정렬
  const result = await getPublicHousingSupplies({
    page: 1,
    limit: 500,
    sortBy: 'rceptEndde',
    sortOrder: 'ASC',
  });
  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* 캘린더 페이지 루트 컨테이너: 헤더 높이(4rem)를 제외한 화면 최소 높이(100vh - 4rem)를 보장하여 배경색이 화면 하단까지 꽉 차도록 설정합니다. */}
      <CalendarClient
        initialHousingData={
          result.success && result.data ? result.data.items : []
        }
      />
    </div>
  );
}

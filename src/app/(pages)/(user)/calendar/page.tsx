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
    <div className="flex justify-center w-full overflow-hidden">
      <CalendarClient
        initialHousingData={
          result.success && result.data ? result.data.items : []
        }
      />
    </div>
  );
}

import { getPublicHousingSupplies } from '../(with-map)/home/actions';
import CalendarClient from './components/CalendarClient';

export default async function CalendarPage() {
  const result = await getPublicHousingSupplies({
    page: 1,
    limit: 500,
    sortBy: 'rcritPblancDe',
    sortOrder: 'DESC',
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

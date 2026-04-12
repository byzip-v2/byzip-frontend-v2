import HomeClient from './HomeClient';
import { getPublicHousingSupplies } from './actions';

/**
 * Home Page (Server Component)
 * - 최초 데이터 fetch를 서버에서 수행 (Server Action)
 * - 클라이언트 컴포넌트(HomeClient)에는 초기 데이터만 전달
 */
export default async function Page() {
  const result = await getPublicHousingSupplies({
    page: 1,
    limit: 100,
    sortBy: 'rcritPblancDe',
    sortOrder: 'DESC',
  });

  return <HomeClient initialHousingData={result.success && result.data ? result.data.items : []} />;
}

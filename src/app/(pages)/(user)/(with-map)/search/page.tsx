import SearchingClient from "./components/SearchingClient";
import { getPublicHousingSupplies } from "../actions";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  // 접수 종료일(rceptEndde)을 기준으로 오름차순(ASC) 정렬
  const result = await getPublicHousingSupplies({
    page: 1,
    limit: 100,
    sortBy: 'rceptEndde',
    sortOrder: 'ASC',
    search: query,
    recruiting: true
  });
  return <SearchingClient initialHousingData={result.success && result.data ? result.data.items : []} />;
}

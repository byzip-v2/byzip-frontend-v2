import SearchingClient from "./components/SearchingClient";
import { getPublicHousingSupplies } from "../actions";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const result = await getPublicHousingSupplies({
    page: 1,
    limit: 100,
    sortBy: 'rcritPblancDe',
    sortOrder: 'DESC',
    search: query,
    recruiting: true
  });
  return <SearchingClient initialHousingData={result.success && result.data ? result.data.items : []} />;
}

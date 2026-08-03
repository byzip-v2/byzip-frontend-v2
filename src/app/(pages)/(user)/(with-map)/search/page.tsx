import SearchingClient from "./components/SearchingClient";
import { getPublicHousingSupplies } from "../actions";
import type { Metadata } from 'next';

interface SearchPageProps {
  searchParams: Promise<{ query?: string }>;
}

// (한국어) 검색어 입력 상태에 대응해 동적 메타데이터(Title, Description)를 유동적으로 생성합니다.
// 검색어가 있을 경우 "'검색어' 검색 결과 | 분양모음집" 형태로 인덱싱을 지원합니다.
export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { query } = await searchParams;
  const searchQuery = query ? String(query).trim() : '';

  const title = searchQuery ? `'${searchQuery}' 검색 결과` : '분양 검색';
  const description = searchQuery
    ? `'${searchQuery}'에 대한 분양 정보를 간편하게 검색해 보세요.`
    : '찾으시는 지역명이나 공고명으로 전국 아파트 분양 공급 정보를 간편하게 검색해 보세요.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: '/images/og_image.png',
          width: 1200,
          height: 630,
          alt: searchQuery ? `'${searchQuery}' 검색 결과` : '분양 검색',
        },
      ],
    },
  };
}

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

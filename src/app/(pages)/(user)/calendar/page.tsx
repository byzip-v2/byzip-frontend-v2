import { getPublicHousingSupplies } from '../(with-map)/actions';
import CalendarClient, {
  type CalendarHousingData,
} from './components/CalendarClient';
import type { Metadata } from 'next';

// 청약 달력 화면의 검색엔진 및 소셜 공유(OpenGraph) 최적화를 위한 메타데이터 설정
export const metadata: Metadata = {
  title: '청약 캘린더',
  description: '전국 아파트, 민간임대, 오피스텔 등 주요 분양 접수 일정을 달력 형식으로 한눈에 편리하게 파악해 보세요.',
  openGraph: {
    title: '청약 캘린더',
    description: '전국 아파트, 민간임대, 오피스텔 등 주요 분양 접수 일정을 달력 형식으로 한눈에 편리하게 파악해 보세요.',
    images: [
      {
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: '청약 캘린더',
      },
    ],
  },
};

const PAGE_LIMIT = 500;

/**
 * 캘린더는 모든 달을 자유롭게 이동할 수 있어야 하므로 전체 청약 일정이 필요합니다.
 * 단일 페이지만 조회하면 총 건수가 limit을 넘는 순간 정렬 기준(rceptEndde ASC)상
 * 가장 최근 달부터 잘려나가므로, meta.totalPages를 확인해 남은 페이지를 모두 가져옵니다.
 */
async function getAllHousingSupplies(): Promise<CalendarHousingData[]> {
  const fetchPage = (page: number) =>
    getPublicHousingSupplies({
      page,
      limit: PAGE_LIMIT,
      sortBy: 'rceptEndde',
      sortOrder: 'ASC',
    });

  const firstPage = await fetchPage(1);
  if (!firstPage.success || !firstPage.data) return [];

  const restPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.data.meta.totalPages - 1) }, (_, index) =>
      fetchPage(index + 2),
    ),
  );

  return [firstPage, ...restPages]
    .flatMap((result) => (result.success && result.data ? result.data.items : []))
    // 캘린더 렌더링에 필요한 필드만 남겨 클라이언트로 전송되는 페이로드를 줄입니다.
    .map(({ id, houseName, rceptEndde, houseSecdNm }) => ({
      id,
      houseName,
      rceptEndde,
      houseSecdNm,
    }));
}

export default async function CalendarPage() {
  const housingData = await getAllHousingSupplies();
  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* 캘린더 페이지 루트 컨테이너: 헤더 높이(4rem)를 제외한 화면 최소 높이(100vh - 4rem)를 보장하여 배경색이 화면 하단까지 꽉 차도록 설정합니다. */}
      <CalendarClient initialHousingData={housingData} />
    </div>
  );
}

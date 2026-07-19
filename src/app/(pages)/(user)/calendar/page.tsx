import { getPublicHousingSupplies } from '../(with-map)/actions';
import CalendarClient from './components/CalendarClient';
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

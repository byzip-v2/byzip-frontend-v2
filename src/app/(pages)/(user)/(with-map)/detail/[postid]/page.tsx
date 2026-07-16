import DetailPageClient from '@/app/(user)/detail/[postid]/DetailPageClient';
import { getHousingSupplyDetail } from '@/app/(user)/detail/[postid]/housing-supply-detail';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface DetailPageProps {
  params: Promise<{
    postid: string;
  }>;
}

// 각 분양 상세 정보 단지에 맞는 동적 메타데이터(Title, Description) 생성
// 검색엔진(Google, Naver 등)이 개별 아파트/오피스텔 등의 단지명과 주소로 크롤링할 수 있도록 설계합니다.
// (한국어) 날짜 객체를 YYYY.MM.DD 포맷으로 변환하는 헬퍼 함수
function formatDate(dateValue?: Date | string): string {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// (한국어) 청약접수 시작일과 종료일 범위를 포맷팅하는 헬퍼 함수
function formatDateRange(start?: Date | string, end?: Date | string): string {
  const startText = formatDate(start);
  const endText = formatDate(end);
  if (startText && endText) {
    return `${startText} ~ ${endText}`;
  }
  return startText || endText || '';
}

// 각 분양 상세 정보 단지에 맞는 동적 메타데이터(Title, Description) 생성
// (한국어) 요구사항에 따라 공급위치, 공급규모, 청약접수일 3가지 주요 정보만 가독성 좋게 조립하여 설명문을 생성합니다.
export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { postid } = await params;

  try {
    const detail = await getHousingSupplyDetail(postid);
    if (detail && detail.houseName) {
      // 1. 공급위치
      const locationText = `공급위치: ${detail.hssplyAdres || '정보 없음'}`;
      
      // 2. 공급규모 (총 세대수)
      const sizeText = `공급규모: ${detail.totSuplyHshldco ? `${detail.totSuplyHshldco}세대` : '정보 없음'}`;
      
      // 3. 청약접수일 기간
      const dateRange = formatDateRange(detail.rceptBgnde, detail.rceptEndde);
      const scheduleText = `청약접수일: ${dateRange || '정보 없음'}`;

      // 3가지 핵심 지표를 가운뎃점(·)으로 결합
      const desc = `${locationText} · ${sizeText} · ${scheduleText}`;

      return {
        title: `${detail.houseName} 분양 정보`,
        description: desc,
        openGraph: {
          title: `${detail.houseName} 분양 정보`,
          description: desc,
          images: [
            {
              url: '/og_image.png',
              width: 1200,
              height: 630,
              alt: detail.houseName,
            },
          ],
        },
      };
    }
  } catch (error) {
    console.error('❌ [generateMetadata] 동적 메타데이터 조회 중 오류 발생:', error);
  }

  return {
    title: '분양 상세 정보',
    description: '전국 아파트, 오피스텔, 민간임대 등 분양 상세 정보를 확인합니다.',
    openGraph: {
      title: '분양 상세 정보',
      description: '전국 아파트, 오피스텔, 민간임대 등 분양 상세 정보를 확인합니다.',
      images: [
        {
          url: '/og_image.png',
          width: 1200,
          height: 630,
          alt: '분양 상세 정보',
        },
      ],
    },
  };
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { postid } = await params;

  try {
    const detail = await getHousingSupplyDetail(postid);

    return (
      <DetailPageClient
        detail={detail}
        detailId={postid}
        isRealPriceEnabled={Boolean(process.env.NEXT_PUBLIC_APT_API_KEY)}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '상세 페이지 데이터를 불러오지 못했습니다.';

    return (
      <div
        style={{
          width: '100%',
          padding: '48px 24px',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
            상세 정보를 불러오지 못했습니다
          </h1>
          <p style={{ color: '#666', lineHeight: 1.7 }}>{message}</p>
        </div>
      </div>
    );
  }
}

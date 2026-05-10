import DetailPageClient from '@/app/(user)/detail/[postid]/DetailPageClient';
import { getHousingSupplyDetail } from '@/app/(user)/detail/[postid]/housing-supply-detail';

export const dynamic = 'force-dynamic';

interface DetailPageProps {
  params: Promise<{
    postid: string;
  }>;
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { postid } = await params;

  try {
    const detail = await getHousingSupplyDetail(postid);

    return (
      <DetailPageClient
        detail={detail}
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

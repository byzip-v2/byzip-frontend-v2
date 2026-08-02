import { MetadataRoute } from 'next';
import { getPublicHousingSupplies } from '@/app/(pages)/(user)/(with-map)/actions';

// Next.js가 빌드 시점에 정적으로 생성하지 않고 요청 시 동적으로 갱신하도록 설정할 수 있습니다.
// 여기서는 기본적으로 ISR 혹은 빌드 타임 생성을 지원합니다.
export const revalidate = 86400; // 하루(24시간) 단위로 사이트맵 캐시를 갱신하도록 설정합니다.

/**
 * Next.js App Router용 사이트맵 생성기 (sitemap.ts)
 * 검색 엔진(Google, Naver 등)이 사이트 내 공개 가능한 정적/동적 URL들을 수집할 수 있도록 돕습니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. 기본 도메인 URL 설정
  // 환경 변수 NEXT_PUBLIC_BASE_URL이 존재하면 사용하고, 배포 환경 대비 기본 대체 도메인을 설정합니다.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://by-zip.com';

  // 2. 정적 페이지 주소 정의
  // 주요 공개 페이지의 빈도(changeFrequency)와 검색 중요도(priority)를 세밀하게 부여합니다.
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily', // 홈 화면은 정보가 자주 변동되므로 daily
      priority: 1.0,           // 가장 핵심이 되는 경로
    },
    {
      url: `${baseUrl}/calendar`,
      lastModified: new Date(),
      changeFrequency: 'daily', // 청약 달력 또한 일 단위 업데이트
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily', // 매물/분양 검색 화면
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bookmark`,
      lastModified: new Date(),
      changeFrequency: 'weekly', // 북마크
      priority: 0.5,
    },
  ];

  // 3. 동적 페이지(주택 분양 상세 페이지) 주소 추가
  // getPublicHousingSupplies API를 통해 최신 주택 공급 정보 1,000개를 조회하여 추가합니다.
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const apiResult = await getPublicHousingSupplies({
      page: 1,
      limit: 100,
      sortBy: 'rceptEndde',
      sortOrder: 'ASC',
    });

    if (apiResult.success && apiResult.data?.items) {
      dynamicRoutes = apiResult.data.items.map((item) => {
        // 아이템의 최종 수정일(updatedAt 또는 createdAt) 파싱 시 에러가 나지 않도록 유연하게 안전장치 처리
        let lastModifiedDate = new Date();
        if (item.updatedAt) {
          const parsed = new Date(item.updatedAt);
          if (!isNaN(parsed.getTime())) {
            lastModifiedDate = parsed;
          }
        } else if (item.createdAt) {
          const parsed = new Date(item.createdAt);
          if (!isNaN(parsed.getTime())) {
            lastModifiedDate = parsed;
          }
        }

        return {
          url: `${baseUrl}/detail/${item.id}`,
          lastModified: lastModifiedDate,
          changeFrequency: 'weekly', // 상세 정보는 등록 후 변동성이 크지 않으므로 주간 단위 크롤링 제안
          priority: 0.7,             // 상세 페이지의 검색 노출 가치 부여
        };
      });
    } else {
      console.warn('⚠️ [sitemap] API 호출 성공하였으나 빈 데이터를 수신함:', apiResult.message);
    }
  } catch (error) {
    // API 장애가 발생하여도 빌드가 중단되거나 사이트맵 자체가 완전히 깨지지 않도록 예외 처리
    console.error('❌ [sitemap] 동적 청약 정보 조회 중 예외 발생:', error);
  }

  // 정적 경로와 동적 경로를 합쳐서 반환합니다.
  return [...staticRoutes, ...dynamicRoutes];
}

import { MetadataRoute } from 'next';

/**
 * Next.js App Router용 크롤러 제어기 (robots.ts)
 * 검색엔진 크롤러가 크롤링을 허용할 페이지와 금지할 페이지를 규정하고, 사이트맵의 위치를 명시합니다.
 */
export default function robots(): MetadataRoute.Robots {
  // 환경 변수 NEXT_PUBLIC_BASE_URL이 존재하면 사용하고, 기본 대체 도메인을 설정합니다.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://by-zip.com';

  return {
    // 모든 사용자 에이전트(크롤러)에 대한 공통 규칙 정의
    rules: {
      userAgent: '*',
      // 1. 일반 서비스 화면은 크롤링을 전면 허용합니다.
      allow: '/',
      // 2. 어드민 페이지와 로그인 페이지는 보안 및 인덱싱 가치 관점에서 제외시킵니다.
      disallow: [
        '/admin/', 
        '/login',
      ],
    },
    // 생성된 사이트맵의 전체 URL을 기재하여 검색엔진이 참조할 수 있게 돕습니다.
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

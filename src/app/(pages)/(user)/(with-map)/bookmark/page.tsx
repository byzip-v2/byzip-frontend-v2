import BookmarkPageClient from './BookmarkPageClient';
import type { Metadata } from 'next';

// 북마크 관심 단지 페이지의 검색엔진 및 소셜 공유(OpenGraph) 최적화를 위한 메타데이터 설정
export const metadata: Metadata = {
  title: '북마크',
  description: '내가 북마크한 분양 정보를 확인해 보세요.',
  openGraph: {
    title: '북마크',
    description: '내가 북마크한 분양 정보를 확인해 보세요.',
    images: [
      {
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: '북마크',
      },
    ],
  },
};

/**
 * 북마크 목록 페이지 (서버 컴포넌트 껍데기)
 * - 이 페이지는 (with-map) 레이아웃 그룹 하위로 이동되어, 우측에 네이버 지도가 함께 표시됩니다.
 * - 실제 목록 UI 및 지도 동기화 로직은 BookmarkPageClient에서 수행됩니다.
 */
export default function BookmarkPage() {
  return <BookmarkPageClient />;
}

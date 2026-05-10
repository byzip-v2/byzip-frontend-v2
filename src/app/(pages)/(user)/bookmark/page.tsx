import BookmarkPageClient from './BookmarkPageClient';

/**
 * 북마크 목록 페이지 (서버 컴포넌트 껍데기)
 * - 실제 목록 UI는 BookmarkPageClient에서 HousingListSection으로 렌더링합니다.
 */
export default function BookmarkPage() {
  return <BookmarkPageClient />;
}

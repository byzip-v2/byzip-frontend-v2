import BookmarkPageClient from './BookmarkPageClient';

/**
 * 북마크 목록 페이지 (서버 컴포넌트 껍데기)
 * - 이 페이지는 (with-map) 레이아웃 그룹 하위로 이동되어, 우측에 네이버 지도가 함께 표시됩니다.
 * - 실제 목록 UI 및 지도 동기화 로직은 BookmarkPageClient에서 수행됩니다.
 */
export default function BookmarkPage() {
  return <BookmarkPageClient />;
}

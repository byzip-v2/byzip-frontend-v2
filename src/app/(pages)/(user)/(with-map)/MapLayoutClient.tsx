'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NaverMap from '@/app/components/common/NaverMap/NaverMap';
import styles from './map-layout.module.scss';
import { useMapStore } from '@/app/libs/stores/zustand/useMapStore';

interface MapLayoutClientProps {
  children: React.ReactNode;
}

const SHEET_LAYOUT_MEDIA_QUERY = '(max-width: 1023px)';

export default function MapLayoutClient({ children }: MapLayoutClientProps) {
  const pathname = usePathname();
  const [isLocalMobile, setIsLocalMobile] = useState(false);
  const { setIsMobileLayout, setViewType } = useMapStore();

  const isDetailRoute = pathname?.startsWith('/detail') ?? false;

  useEffect(() => {
    const mediaQuery = window.matchMedia(SHEET_LAYOUT_MEDIA_QUERY);

    // 1024px 미만인지 여부를 판단하여 전역 스토어와 로컬 상태에 동기화합니다.
    const syncLayout = () => {
      const matches = mediaQuery.matches;
      setIsLocalMobile(matches);
      setIsMobileLayout(matches);
      // 모바일에서 데스크톱으로 전환될 때는 뷰 타입을 기본인 'list'로 초기화합니다.
      if (!matches) {
        setViewType('list');
      }
    };

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);

    return () => {
      mediaQuery.removeEventListener('change', syncLayout);
    };
  }, [setIsMobileLayout, setViewType]);

  // 상세 페이지 경로(/detail/...)이거나 데스크톱(1024px 이상)인 경우에는 지도 분할 뷰를 사용합니다.
  const showDesktopLayout = !isLocalMobile || isDetailRoute;

  return (
    <div
      className={[
        styles.mapLayout,
        isDetailRoute ? styles.detailRoute : '',
        isLocalMobile ? styles.mobileLayout : '',
      ].join(' ')}
    >
      {/* 
        리스트 뷰(list)가 활성화되어 있거나 데스크톱 환경인 경우 콘텐츠 판넬을 렌더링합니다.
        (지도 뷰일 때도 상단 필터바/헤더를 유지해야 하므로, children 내에서 자체적으로 하단 콘텐츠만 스위칭하도록 children은 항상 렌더링합니다.)
      */}
      <div className={styles.contentPane}>
        <div className={styles.contentBody}>
          {children}
        </div>
      </div>

      {/* 데스크톱 분할 화면용 고정 지도 */}
      {showDesktopLayout && (
        <div className={styles.desktopMap}>
          <NaverMap />
        </div>
      )}
    </div>
  );
}

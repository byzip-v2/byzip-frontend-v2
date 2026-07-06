'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

import NaverMap from '@/app/components/common/NaverMap/NaverMap';
import styles from './map-layout.module.scss';

interface MapLayoutClientProps {
  children: React.ReactNode;
}

const SHEET_LAYOUT_MEDIA_QUERY = '(max-width: 1023px)';

export default function MapLayoutClient({ children }: MapLayoutClientProps) {
  const pathname = usePathname();
  const [isSheetLayout, setIsSheetLayout] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isDetailRoute = pathname?.startsWith('/detail') ?? false;
  const shouldUseSheet = isSheetLayout && !isDetailRoute;

  useEffect(() => {
    const mediaQuery = window.matchMedia(SHEET_LAYOUT_MEDIA_QUERY);
    const syncSheetLayout = () => setIsSheetLayout(mediaQuery.matches);

    syncSheetLayout();
    mediaQuery.addEventListener('change', syncSheetLayout);

    return () => {
      mediaQuery.removeEventListener('change', syncSheetLayout);
    };
  }, []);

  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <div
      className={[
        styles.mapLayout,
        isDetailRoute ? styles.detailRoute : '',
        isSheetOpen ? styles.sheetOpen : '',
      ].join(' ')}
    >
      {shouldUseSheet && (
        <div className={styles.mobileMap}>
          <NaverMap />
        </div>
      )}

      <div className={styles.contentPane}>
        {shouldUseSheet && (
          <button
            type="button"
            className={styles.sheetHandle}
            aria-label={isSheetOpen ? '목록 접기' : '목록 펼치기'}
            aria-expanded={isSheetOpen}
            onClick={() => setIsSheetOpen((prev) => !prev)}
          >
            <ChevronUp className={styles.sheetIcon} size={22} />
          </button>
        )}
        <div
          className={
            shouldUseSheet ? styles.mobileSheetBody : styles.contentBody
          }
        >
          {children}
        </div>
      </div>

      {!isSheetLayout && (
        <div className={styles.desktopMap}>
          <NaverMap />
        </div>
      )}
    </div>
  );
}

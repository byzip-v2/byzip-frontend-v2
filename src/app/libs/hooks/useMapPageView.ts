'use client';

import { useEffect } from 'react';
import {
  useMapStore,
  type MapPageView,
} from '@/app/libs/stores/zustand/useMapStore';

/**
 * (한국어) `(with-map)` 레이아웃 하위 페이지에서 지도의 기본 중심·줌을 등록합니다.
 *
 * 왜 훅으로 분리했는지:
 * - 각 페이지가 마운트될 때 동일한 패턴(set → 언마운트 시 clear)을 반복하지 않도록 합니다.
 * - 페이지 언마운트 시에는 `clearMapPageView()`로 스토어 기본값(DEFAULT_MAP_PAGE_VIEW)으로 복원됩니다.
 *
 * @param center - 해당 페이지에서 기본으로 보여줄 지도 중심(WGS84)
 * @param zoom - 해당 페이지의 기본 확대 레벨(네이버 지도 zoom 스케일)
 */
export function useMapPageView(
  center: MapPageView['center'],
  zoom: MapPageView['zoom'],
) {
  const setMapPageView = useMapStore((s) => s.setMapPageView);
  const clearMapPageView = useMapStore((s) => s.clearMapPageView);

  useEffect(() => {
    setMapPageView({ center, zoom });
    return () => {
      clearMapPageView();
    };
  }, [center, zoom, setMapPageView, clearMapPageView]);
}

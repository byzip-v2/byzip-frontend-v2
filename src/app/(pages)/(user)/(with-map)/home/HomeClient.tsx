'use client';

import {
  DEFAULT_MAP_PAGE_VIEW,
  useMapStore,
} from '@/app/libs/stores/zustand/useMapStore';
import { useEffect, useMemo, useState } from 'react';
// 홈 전용 UI는 라우트 폴더 `home/components/`에 두고, 존재하지 않는 `@/components/home/*` 별칭은 쓰지 않습니다.
// 같은 트리 안의 상대 경로로 두면 `(pages)` 이동 등 디렉터리 구조 변경 시에도 import가 깨지지 않습니다.
import { useMapPageView } from '@/app/libs/hooks/useMapPageView';
import { determineHousingType } from '@/app/libs/utils/date';
import CategoryBar from './components/CategoryBar';
import HousingStatusTab from './components/HousingStatusTab';
// 리스트 섹션은 `components/home/`가 아니라 `components/` 바로 아래에 있습니다.
import { HousingSupplyResponseDto } from 'byzip-v2-sdk';
import { useHousingStore } from '@/app/libs/stores/zustand/useHousingStore';
import HousingListSection from '../../global/components/HousingListSection';
interface HomeClientProps {
  /**
   * 서버에서 미리 가져온 public housing-supplies 목록.
   * 클라이언트에서는 이 원본 데이터를 탭/필터 기준으로만 가공합니다.
   */
  initialHousingData: HousingSupplyResponseDto[];
}

/**
 * HomeClient
 * - 최초 데이터 fetch는 서버에서 수행(토큰 없이 public)
 * - 클라이언트는 탭 전환/리스트 가공 렌더링만 담당
 */
export default function HomeClient({ initialHousingData }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { setMarkers } = useMapStore();
  const { setHousingData } = useHousingStore();

  useMapPageView(DEFAULT_MAP_PAGE_VIEW.center, DEFAULT_MAP_PAGE_VIEW.zoom);

  // 서버에서 전달받은 원본 공고 데이터를 북마크 등 다른 페이지와 공유하기 위해 전역 스토어에 캐싱합니다.
  useEffect(() => {
    if (initialHousingData && initialHousingData.length > 0) {
      setHousingData(initialHousingData);
    }
  }, [initialHousingData, setHousingData]);

  // 서버에서 주입받은 원본 데이터
  const housingData = initialHousingData;

  // 탭 카운트 계산 (원본 데이터 기준)
  const counts = useMemo(() => {
    return housingData.reduce(
      (acc, item) => {
        const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
        acc.all += 1;
        if (type === 'today' && item.houseSecd !== '04') acc.today += 1;
        if (type === 'coming' && item.houseSecd !== '04') acc.coming += 1;
        // 무순위: 기존 규칙 유지 (houseSecd === '04')
        if (item.houseSecd === '04') acc.random += 1;
        return acc;
      },
      { all: 0, today: 0, coming: 0, random: 0 },
    );
  }, [housingData]);

  // 스토어의 markers 데이터 동기화
  useEffect(() => {
    // 필터링된 데이터에서 좌표가 있는 항목만 마커로 생성
    const markers = housingData
      .filter((item) => {
        const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
        if (activeTab === 0) return true;
        if (activeTab === 1) return type === 'today';
        if (activeTab === 2) return type === 'coming';
        if (activeTab === 3) return item.houseSecd === '04';
        return true;
      })
      .filter((item) => {
        const hasCoords =
          item.latitude !== undefined &&
          item.latitude !== null &&
          item.longitude !== undefined &&
          item.longitude !== null;
        return hasCoords;
      })
      .map((item) => ({
        id: String(item.id),
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        title: item.houseName || '',
      }));

    setMarkers(markers);

    // 컴포넌트 언마운트 시 마커 초기화 (다른 페이지 이동 시 지도의 마커를 비움)
    return () => {
      setMarkers([]);
    };
  }, [housingData, activeTab, setMarkers]);

  // 탭에 따른 카드 데이터 가공
  const filteredData = useMemo((): HousingSupplyResponseDto[] => {
    return housingData.filter((item) => {
      const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
      if (activeTab === 0) return true;
      if (activeTab === 1) return type === 'today' && item.houseSecd !== '04';
      if (activeTab === 2) return type === 'coming' && item.houseSecd !== '04';
      if (activeTab === 3) return item.houseSecd === '04';
      return true;
    });
  }, [housingData, activeTab]);

  // 서버에서 데이터를 못 가져온 경우에도 UI는 안전하게 동작하도록 처리
  const isLoading = false;

  return (
    <div className="w-full h-full bg-white flex flex-col items-center">
      <div className="w-full flex flex-col items-center sticky top-0 bg-white z-10">
        <HousingStatusTab
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
        />
        <CategoryBar />
      </div>

      <div className="w-full flex-1 flex flex-col min-h-0 border-t border-[rgba(0,0,0,0.25)]">
        <HousingListSection housingData={filteredData} isLoading={isLoading} />
      </div>
    </div>
  );
}

'use client';

import { DEFAULT_MAP_PAGE_VIEW, useMapStore } from '@/app/libs/stores/zustand/useMapStore';
import { useEffect, useMemo, useState } from 'react';
import { useMapPageView } from '@/app/libs/hooks/useMapPageView';
import { determineHousingType } from '@/app/libs/utils/date';
import CategoryBar from './components/CategoryBar';
import HousingStatusTab from './components/HousingStatusTab';
import { HousingSupplyResponseDto } from 'byzip-v2-sdk';
import { useHousingStore } from '@/app/libs/stores/zustand/useHousingStore';
import HousingListSection from '../global/components/HousingListSection';
import NaverMap from '@/app/components/common/NaverMap/NaverMap';

interface HomeClientProps {
  /**
   * 서버에서 미리 가져온 public housing-supplies 목록.
   * 클라이언트에서는 이 원본 데이터를 탭/필터 기준으로만 가공합니다.
   */
  initialHousingData: HousingSupplyResponseDto[];
}

/**
 * HomeClient
 * - 최초 데이터 fetch는 서버에서 수행(Server Component)
 * - 클라이언트는 추가적인 API 호출 없이, 사용자가 선택한 지역/분양형태 상태값에 따라 
 *   브라우저단(클라이언트)에서 자체적으로 실시간 필터링을 수행하여 UI와 마커를 갱신합니다.
 */
export default function HomeClient({ initialHousingData }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  // 전역 맵 스토어로부터 모바일 레이아웃 판별 값 및 탭 스위치(viewType) 상태를 참조합니다.
  const { setMarkers, isMobileLayout, viewType } = useMapStore();

  // UI 렌더링에 사용되는 전역 스토어의 전체 데이터입니다.
  const { housingData, setHousingData } = useHousingStore();

  // 사용자가 선택한 지역 및 분양형태 필터의 상태값입니다.
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // 로컬스토리지 필터 상태 복원이 완료되었는지 감시하는 플래그입니다.
  const [isFilterLoaded, setIsFilterLoaded] = useState(false);

  // 서버로부터 가져온 데이터를 클라이언트의 전역 스토어에 동기화 완료했는지 판별하는 상태값입니다.
  // 이 값이 true가 되기 전(첫 렌더링)에는 로딩 스피너만 보이게 제어합니다.
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useMapPageView(DEFAULT_MAP_PAGE_VIEW.center, DEFAULT_MAP_PAGE_VIEW.zoom);

  // 서버에서 전달받은 원본 공고 데이터를 최초 1회 전역 스토어에 세팅합니다.
  // 세팅이 완료되면 isDataLoaded를 true로 세팅하여 화면에 목록이 그려지도록 유도합니다.
  useEffect(() => {
    if (initialHousingData && initialHousingData.length > 0) {
      setHousingData(initialHousingData);
    }
    setIsDataLoaded(true);
  }, [initialHousingData, setHousingData]);

  // 1. 마운트 시 로컬스토리지에 저장된 이전 필터 상태를 복원합니다.
  useEffect(() => {
    try {
      const savedRegions = localStorage.getItem('byzip:filter-regions');
      if (savedRegions) {
        setSelectedRegions(JSON.parse(savedRegions));
      }
      const savedTypes = localStorage.getItem('byzip:filter-types');
      if (savedTypes) {
        setSelectedTypes(JSON.parse(savedTypes));
      }
    } catch (error) {
      console.error('🔍 [Filter] 로컬스토리지 필터 상태 복원 실패:', error);
    } finally {
      setIsFilterLoaded(true);
    }
  }, []);

  // 2. 필터 상태가 변경되면 로컬스토리지에 기록하여 상태를 영속화합니다.
  useEffect(() => {
    if (!isFilterLoaded) return;
    try {
      localStorage.setItem('byzip:filter-regions', JSON.stringify(selectedRegions));
      localStorage.setItem('byzip:filter-types', JSON.stringify(selectedTypes));
    } catch (error) {
      console.error('🔍 [Filter] 로컬스토리지 필터 상태 저장 실패:', error);
    }
  }, [selectedRegions, selectedTypes, isFilterLoaded]);

  // 3. 탭 카운트를 표시하기 위해, 탭 필터를 제외한 '지역 및 분양형태' 필터만 반영된 데이터셋을 생성합니다.
  const filteredForCounts = useMemo(() => {
    return housingData
      .filter((item) => {
        // 지역 필터가 비어있으면 전체 허용, 선택되어 있으면 subscrptAreaCodeNm 포함 여부 확인
        if (selectedRegions.length === 0) return true;
        return selectedRegions.includes(item.subscrptAreaCodeNm || '');
      })
      .filter((item) => {
        // 분양형태 필터가 비어있으면 전체 허용, 선택되어 있으면 매핑된 houseSecd 확인
        if (selectedTypes.length === 0) return true;
        return selectedTypes.some((type) => {
          // 각 주택 구분 코드(houseSecd)에 매칭하여 필터링을 수행합니다.
          if (type === 'APT') return item.houseSecd === '01';
          if (type === '오피스텔/빌라') return item.houseSecd === '02';
          if (type === '민간임대') return item.houseSecd === '03';
          if (type === '잔여세대') return item.houseSecd === '04' || item.houseSecd === '06';
          if (type === '신혼희망타운') return item.houseSecd === '10';
          if (type === '임의공급') return item.houseSecd === '11';
          return false;
        });
      });
  }, [housingData, selectedRegions, selectedTypes]);

  // filteredForCounts를 기반으로 탭 카운트를 동적으로 계산합니다.
  const counts = useMemo(() => {
    return filteredForCounts.reduce(
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
  }, [filteredForCounts]);

  // 4. 지도의 마커 데이터를 활성화된 탭 및 사용자가 선택한 지역/유형 필터와 실시간 동기화합니다.
  useEffect(() => {
    const markers = housingData
      .filter((item) => {
        // 1) 탭 필터링
        const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
        if (activeTab === 0) return true;
        if (activeTab === 1) return type === 'today' && item.houseSecd !== '04';
        if (activeTab === 2) return type === 'coming' && item.houseSecd !== '04';
        if (activeTab === 3) return item.houseSecd === '04';
        return true;
      })
      .filter((item) => {
        // 2) 지역 필터링
        if (selectedRegions.length === 0) return true;
        return selectedRegions.includes(item.subscrptAreaCodeNm || '');
      })
      .filter((item) => {
        // 3) 분양형태 필터링
        if (selectedTypes.length === 0) return true;
        return selectedTypes.some((type) => {
          // 각 주택 구분 코드(houseSecd)에 매칭하여 필터링을 수행합니다.
          if (type === 'APT') return item.houseSecd === '01';
          if (type === '오피스텔/빌라') return item.houseSecd === '02';
          if (type === '민간임대') return item.houseSecd === '03';
          if (type === '잔여세대') return item.houseSecd === '04' || item.houseSecd === '06';
          if (type === '신혼희망타운') return item.houseSecd === '10';
          if (type === '임의공급') return item.houseSecd === '11';
          return false;
        });
      })
      .filter((item) => {
        // 4) 좌표 유효성 검증
        return (
          item.latitude !== undefined &&
          item.latitude !== null &&
          item.longitude !== undefined &&
          item.longitude !== null
        );
      })
      .map((item) => ({
        id: String(item.id),
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        title: item.houseName || '',
        // (한국어) 마커마다 청약 상태 아이콘을 분기하기 위해 타입을 추가 매핑합니다.
        // houseSecd가 '04'이면 무순위('random'), 그 외에는 접수일에 따라 오늘('today') 혹은 예정('coming')으로 분류됩니다.
        type: (item.houseSecd === '04' ? 'random' : determineHousingType(item.rceptBgnde, item.rceptEndde)) as 'today' | 'coming' | 'random' | 'all',
        houseSecdNm: item.houseSecdNm || '', // 주택 공급 유형 (마커에 노출)
        // (한국어) 툴팁에 날짜 정보를 노출할 수 있도록 접수 시작일/종료일 데이터를 매핑해 전달합니다.
        rceptBgnde: item.rceptBgnde || '',
        rceptEndde: item.rceptEndde || '',
      }));

    setMarkers(markers);

    // 컴포넌트 언마운트 시 마커 초기화
    return () => {
      setMarkers([]);
    };
  }, [housingData, activeTab, selectedRegions, selectedTypes, setMarkers]);

  // 5. 탭과 필터(지역/분양형태) 조건이 모두 적용된 최종 카드용 리스트 데이터입니다.
  const filteredData = useMemo((): HousingSupplyResponseDto[] => {
    return housingData
      .filter((item) => {
        // 1) 탭 필터링
        const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
        if (activeTab === 0) return true;
        if (activeTab === 1) return type === 'today' && item.houseSecd !== '04';
        if (activeTab === 2) return type === 'coming' && item.houseSecd !== '04';
        if (activeTab === 3) return item.houseSecd === '04';
        return true;
      })
      .filter((item) => {
        // 2) 지역 필터링
        if (selectedRegions.length === 0) return true;
        return selectedRegions.includes(item.subscrptAreaCodeNm || '');
      })
      .filter((item) => {
        // 3) 분양형태 필터링
        if (selectedTypes.length === 0) return true;
        return selectedTypes.some((type) => {
          // 각 주택 구분 코드(houseSecd)에 매칭하여 필터링을 수행합니다.
          if (type === 'APT') return item.houseSecd === '01';
          if (type === '오피스텔/빌라') return item.houseSecd === '02';
          if (type === '민간임대') return item.houseSecd === '03';
          if (type === '잔여세대') return item.houseSecd === '04' || item.houseSecd === '06';
          if (type === '신혼희망타운') return item.houseSecd === '10';
          if (type === '임의공급') return item.houseSecd === '11';
          return false;
        });
      });
  }, [housingData, activeTab, selectedRegions, selectedTypes]);

  // 최초에 서버 데이터가 클라이언트 전역 스토어에 바인딩되기 전까지는
  // '해당하는 분양 공고가 없습니다' 등의 빈 상태 UI 대신 로딩 스피너를 보여주도록 처리합니다.
  const isLoading = !isDataLoaded;

  return (
    <div className="w-full h-full bg-white flex flex-col items-center">
      <div className="w-full flex flex-col items-center sticky top-0 bg-white z-10">
        <HousingStatusTab
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
        />
        {/* CategoryBar에 필터 상태값 및 상태 업데이트 핸들러를 바인딩합니다. */}
        <CategoryBar
          selectedRegions={selectedRegions}
          setSelectedRegions={setSelectedRegions}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
        />
      </div>

      <div className="w-full flex-1 flex flex-col min-h-0 border-t border-[rgba(0,0,0,0.25)] relative">
        {/* 모바일 레이아웃 환경이면서 지도 뷰(map)가 켜진 경우 지도를 가득 채우고, 그 외에는 기존 리스트 섹션을 보여줍니다. */}
        {isMobileLayout && viewType === 'map' ? (
          <div className="absolute inset-0 w-full h-full">
            <NaverMap />
          </div>
        ) : (
          <HousingListSection housingData={filteredData} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

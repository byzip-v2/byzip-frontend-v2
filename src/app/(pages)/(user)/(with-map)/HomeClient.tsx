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
import { getPublicHousingSupplies, GetHousingSuppliesParams } from './actions';

/**
 * 공급지역 명칭과 공급지역 코드(subscrptAreaCode) 간의 매핑 테이블입니다.
 * API 호출 시 지역 명칭을 숫자로 된 코드로 치환하여 전송합니다.
 */
const REGION_CODE_MAP: Record<string, string> = {
  '서울': '100',
  '강원': '200',
  '대전': '300',
  '충남': '312',
  '광주': '500',
  '대구': '700',
  '세종': '338',
  '충북': '360',
  '인천': '400',
  '경기': '410',
  '울산': '680',
  '경북': '712',
  '전남': '513',
  '전북': '560',
  '부산': '600',
  '경남': '621',
  '제주': '690',
};

/**
 * 분양형태 명칭과 주택구분 코드(houseSecd) 간의 매핑 테이블입니다.
 * 잔여세대의 경우 '04,06' 형태로 매핑하여 API 다중 쿼리를 지원합니다.
 */
const TYPE_CODE_MAP: Record<string, string> = {
  'APT': '01',
  '오피스텔/빌라': '02',
  '민간임대': '03',
  '잔여세대': '04,06',
  '임의공급': '11',
};

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
 * - 클라이언트는 탭 전환 및 필터 상태(지역, 분양형태) 변경 시 API를 재호출하여 리스트 가공 렌더링을 처리합니다.
 */
export default function HomeClient({ initialHousingData }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { setMarkers } = useMapStore();
  
  // UI 렌더링에 사용될 전역 스토어의 데이터와 업데이트 액션입니다.
  const { housingData, setHousingData } = useHousingStore();

  // 사용자가 선택한 지역 및 분양형태 옵션 상태값입니다.
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // 로컬스토리지 필터 상태 복원이 완료되었는지 감시하는 플래그입니다.
  const [isFilterLoaded, setIsFilterLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useMapPageView(DEFAULT_MAP_PAGE_VIEW.center, DEFAULT_MAP_PAGE_VIEW.zoom);

  // 서버에서 전달받은 원본 공고 데이터를 최초 1회 전역 스토어에 세팅합니다.
  useEffect(() => {
    if (initialHousingData && initialHousingData.length > 0) {
      setHousingData(initialHousingData);
    }
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

  // 2. 필터 상태가 변경되면 로컬스토리지에 기록하고, 해당 조건으로 API 데이터를 다시 가져옵니다.
  useEffect(() => {
    if (!isFilterLoaded) return;

    // 로컬스토리지 저장
    try {
      localStorage.setItem('byzip:filter-regions', JSON.stringify(selectedRegions));
      localStorage.setItem('byzip:filter-types', JSON.stringify(selectedTypes));
    } catch (error) {
      console.error('🔍 [Filter] 로컬스토리지 필터 상태 저장 실패:', error);
    }

    // 최적화: 최초 로드 시 필터가 아예 비어있고, 서버에서 받은 데이터 개수와 현재 스토어 데이터 개수가 같다면 
    // 불필요한 API 재조회를 생략합니다.
    const isFilterEmpty = selectedRegions.length === 0 && selectedTypes.length === 0;
    if (isFilterEmpty && housingData.length === initialHousingData.length) {
      return;
    }

    const fetchFilteredData = async () => {
      setIsLoading(true);

      // 지역 한글 명칭을 코드로 변환
      const regionCodes = selectedRegions
        .map((r) => REGION_CODE_MAP[r])
        .filter(Boolean);

      // 분양형태 한글 명칭을 코드로 변환
      const typeCodes = selectedTypes
        .flatMap((t) => {
          const code = TYPE_CODE_MAP[t];
          return code ? code.split(',') : [];
        })
        .filter(Boolean);

      const params: GetHousingSuppliesParams = {
        page: 1,
        limit: 100,
        sortBy: 'rcritPblancDe',
        sortOrder: 'DESC',
        recruiting: true,
      };

      // 전체 선택 혹은 아무것도 선택하지 않았을 때는 필터링 파라미터를 넘기지 않고 전체를 불러옵니다.
      if (regionCodes.length > 0 && selectedRegions.length < Object.keys(REGION_CODE_MAP).length) {
        params.subscrptAreaCode = regionCodes.join(',');
      }
      if (typeCodes.length > 0 && selectedTypes.length < Object.keys(TYPE_CODE_MAP).length) {
        params.houseSecd = typeCodes.join(',');
      }

      try {
        const result = await getPublicHousingSupplies(params);
        if (result.success && result.data) {
          setHousingData(result.data.items);
        } else {
          setHousingData([]);
        }
      } catch (error) {
        console.error('🔍 [Filter] API 재페치 조회 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredData();
  }, [selectedRegions, selectedTypes, isFilterLoaded, setHousingData, initialHousingData.length, housingData.length]);

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

      <div className="w-full flex-1 flex flex-col min-h-0 border-t border-[rgba(0,0,0,0.25)]">
        <HousingListSection housingData={filteredData} isLoading={isLoading} />
      </div>
    </div>
  );
}

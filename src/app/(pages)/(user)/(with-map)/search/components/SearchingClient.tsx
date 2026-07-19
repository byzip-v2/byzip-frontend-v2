"use client"
import { HousingSupplyResponseDto } from 'byzip-v2-sdk'
import { useSearchParams } from 'next/navigation'
import HousingListSection from '../../../global/components/HousingListSection'
import { useMapStore } from '@/app/libs/stores/zustand/useMapStore'
import { useEffect } from 'react'
import { determineHousingType } from '@/app/libs/utils/date'
import NaverMap from '@/app/components/common/NaverMap/NaverMap'
import ViewToggle from '@/app/components/common/ViewToggle/ViewToggle'

const SearchingClient = ({ initialHousingData }: { initialHousingData: HousingSupplyResponseDto[] }) => {
  const searchParams = useSearchParams()
  const query = searchParams.get('query')
  // 서버에서 주입받은 원본 데이터
  const housingData = initialHousingData;

  // (한국어) 지도의 마커 데이터를 변경하기 위해 전역 맵 스토어의 setMarkers 함수를 가져옵니다.
  const { setMarkers, isMobileLayout, viewType } = useMapStore();

  // (한국어) 검색 페이지에 진입하거나 검색 결과 데이터(housingData)가 갱신될 때
  // 지도의 마커 목록을 검색 결과 좌표 데이터로 동기화합니다.
  useEffect(() => {
    if (!housingData) return;

    const markers = housingData
      .filter((item) => {
        // 위도(latitude)와 경도(longitude) 값이 유효하게 존재하는 데이터만 걸러냅니다.
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
        // houseSecd가 '04'이면 무순위('random'), 그 외에는 접수일에 따라 오늘('today') 혹은 예정('coming')으로 이미지 타입을 분류합니다.
        type: (item.houseSecd === '04' ? 'random' : determineHousingType(item.rceptBgnde, item.rceptEndde)) as 'today' | 'coming' | 'random' | 'all',
        houseSecdNm: item.houseSecdNm || '', // 마커 내부에 표시할 주택 공급 유형 텍스트
        rceptBgnde: item.rceptBgnde || '',
        rceptEndde: item.rceptEndde || '',
      }));

    // 생성된 마커 배열을 전역 지도 스토어에 세팅합니다.
    setMarkers(markers);

    // 컴포넌트 언마운트 시 또는 데이터 변경 시 기존 마커를 깨끗이 지워줍니다.
    return () => {
      setMarkers([]);
    };
  }, [housingData, setMarkers]);

  return (
    <div className="w-full h-full bg-white flex flex-col items-center relative">
      <div className='w-full max-w-3xl mx-auto pl-5 pr-4 flex flex-row justify-between items-center py-4'>
        <h2 className="text-xl font-semibold">
          <span className='text-[#356EFF]'>&apos;{query}&apos;</span> 검색 결과 총 {housingData?.length || 0}건
        </h2>

        {/* 모바일/태블릿(1024px 미만) 화면에서만 노출되는 리스트/지도 뷰 전환 세그먼트 토글 스위치 */}
        <ViewToggle />
      </div>
      <div className="w-full flex-1 flex flex-col min-h-0 border-t border-gray-200 relative">
        {/* 모바일 레이아웃 환경이면서 지도 뷰(map)가 켜진 경우 지도를 가득 채우고, 그 외에는 기존 리스트 섹션을 보여줍니다. */}
        {isMobileLayout && viewType === 'map' ? (
          <div className="absolute inset-0 w-full h-full">
            <NaverMap />
          </div>
        ) : (
          <HousingListSection housingData={housingData} isLoading={false} />
        )}
      </div>
    </div>
  )
}

export default SearchingClient
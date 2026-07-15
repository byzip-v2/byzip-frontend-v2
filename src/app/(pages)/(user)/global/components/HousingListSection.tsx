'use client';

import React, { useMemo } from 'react';
// HousingCard는 이 파일과 같은 디렉터리에 있으므로 `@/components/home`(미존재) 대신 상대 경로로 가져옵니다.
import HousingCard, { type HousingItem } from './HousingCard';
import Spinner from '@/app/components/common/Spinner/Spinner';
import { HousingSupplyDetailResponseDto, HousingSupplyResponseDto } from 'byzip-v2-sdk';
import { determineHousingType, formatDateRange, formatDateString } from '@/app/libs/utils/date';

export interface HousingListSectionProps {
  /**
   * 그리드에 표시할 카드용 데이터.
   * 홈/검색 등 페이지마다 필터·매핑 로직만 다르고, 이 컴포넌트는 동일한 리스트 UI만 담당합니다.
   */
  housingData: HousingSupplyResponseDto[];
  /**
   * 비동기 로딩 중일 때 스피너를 보여줍니다.
   * 검색 페이지처럼 클라이언트 fetch가 있는 화면에서 true로 넘기면 됩니다.
   */
  isLoading?: boolean;
  /**
   * 목록이 비었을 때 안내 문구.
   * 검색 결과 없음 등 페이지별 메시지를 바꿀 때 이 prop만 오버라이드하면 됩니다.
   */
  emptyMessage?: string;
}

/**
 * HousingListSection
 * - 홈·검색 등에서 공통으로 쓰는 분양 카드 스크롤 영역(배경, 그리드, 로딩, 빈 상태)을 한곳에 둡니다.
 */
export default function HousingListSection({
  housingData,
  isLoading = false,
  emptyMessage = '해당하는 분양 공고가 없습니다.',
}: HousingListSectionProps) {

  const calculateArea = (details?: HousingSupplyDetailResponseDto[]) => {
    if (!details || details.length === 0) return '-';
    if (!details[0].area) {
      return '-'
    }

    const areas = details
      .map((d) => Number(d.area))
      .filter((val) => !isNaN(val))
      .sort((a, b) => a - b);
    if (areas.length === 0) return '-';

    const minArea = areas[0].toFixed(2);
    const maxArea = areas[areas.length - 1].toFixed(2);

    if (minArea === maxArea) {
      return `${minArea}m²`;
    }

    return `${minArea}m² ~ ${maxArea}m²`;
  };

  const calculatePrice = (details?: HousingSupplyDetailResponseDto[]) => {
    if (!details || details.length === 0) return '공고문 확인';

    const prices = details
      .map((d) => Number(d.supplyAmount))
      .filter((val) => !isNaN(val) && val > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) return '공고문 확인';

    const formatValue = (amount: number) => {
      const uk = Math.floor(amount / 10000);
      const man = amount % 10000;
      if (uk > 0) {
        return man > 0 ? `${uk}억 ${man.toLocaleString()}` : `${uk}억`;
      }
      return `${man.toLocaleString()}`;
    };

    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];

    if (minPrice === maxPrice) {
      return `${formatValue(minPrice)}만`;
    }

    return `${formatValue(minPrice)}만 ~ ${formatValue(maxPrice)}만`;
  };

  const filteredData = useMemo((): HousingItem[] => {
    return housingData
      .map((item) => ({
        id: String(item.id),
        type: item.houseSecd === '04' ? 'random' : determineHousingType(item.rceptBgnde, item.rceptEndde),
        title: item.houseName || '-',
        subTitle:
          item.houseSecdNm || '-',
        region: item.subscrptAreaCodeNm || '-',
        area: item.details ? calculateArea(item.details) : '-',
        price: item.details ? calculatePrice(item.details) : '공고문 확인',
        regularDate: formatDateRange(item.rceptBgnde, item.rceptEndde),
        // 특별 청약일은 기간이 아니라 시작일 1개만 노출 (v1 UI와 동일)
        specialDate: formatDateString(item.spsplyRceptBgnde),
      }));
  }, [housingData]);

  // 550px 이하(모바일 화면)에서는 grid-cols-1을 적용하여 한 줄에 카드 하나만 노출되도록 하고,
  // 550px 초과(데스크톱 화면)에서는 min-[551px]:grid-cols-[repeat(auto-fit,220px)]를 적용하여 기존과 동일하게 너비에 맞춰 자동 정렬되도록 합니다.
  return (
    <section className="w-full flex-1 min-h-0 bg-[#f8faff] pt-6 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto grid grid-cols-1 min-[551px]:grid-cols-[repeat(auto-fit,220px)] justify-center px-4 gap-x-8 gap-y-0">
        {isLoading ? (
          <div className="col-span-full min-h-[40vh] flex items-center justify-center">
            <Spinner size={36} strokeWidth={3.5} className="text-[#356EFF]" />
          </div>
        ) : (
          <>
            {filteredData.map((item) => (
              <HousingCard key={item.id} item={item} />
            ))}
            {filteredData.length === 0 && (
              <div className="col-span-full py-20 text-gray-500 font-medium text-center w-full">
                {emptyMessage}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

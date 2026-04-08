'use client';

import React, { useMemo, useState } from 'react';
import type { HousingSupplyDataDto } from 'byzip-v2-sdk';
import HousingStatusTab from '@/components/home/HousingStatusTab';
import CategoryBar from '@/components/home/CategoryBar';
import HousingCard, { type HousingItem } from '@/components/home/HousingCard';
import { formatDateRange, formatDateString, determineHousingType } from '@/app/libs/utils/date';
import Spinner from '@/app/components/common/Spinner/Spinner';

interface HomeClientProps {
  /**
   * 서버에서 미리 가져온 public housing-supplies 목록.
   * 클라이언트에서는 이 원본 데이터를 탭/필터 기준으로만 가공합니다.
   */
  initialHousingData: HousingSupplyDataDto[];
}

/**
 * HomeClient
 * - 최초 데이터 fetch는 서버에서 수행(토큰 없이 public)
 * - 클라이언트는 탭 전환/리스트 가공 렌더링만 담당
 */
export default function HomeClient({ initialHousingData }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState(0);

  // 서버에서 주입받은 원본 데이터
  const housingData = initialHousingData;

  // 탭 카운트 계산 (원본 데이터 기준)
  const counts = useMemo(() => {
    return housingData.reduce(
      (acc, item) => {
        const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
        acc.all += 1;
        if (type === 'today') acc.today += 1;
        if (type === 'coming') acc.coming += 1;
        // 무순위: 기존 규칙 유지 (houseSecd === '04')
        if (item.houseSecd === '04') acc.random += 1;
        return acc;
      },
      { all: 0, today: 0, coming: 0, random: 0 },
    );
  }, [housingData]);

  // 탭에 따른 카드 데이터 가공
  const filteredData = useMemo((): HousingItem[] => {
    return housingData
      .filter((item) => {
        const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
        if (activeTab === 0) return true;
        if (activeTab === 1) return type === 'today';
        if (activeTab === 2) return type === 'coming';
        if (activeTab === 3) return item.houseSecd === '04';
        return true;
      })
      .map((item) => ({
        id: String(item.id),
        type: determineHousingType(item.rceptBgnde, item.rceptEndde),
        title: item.houseName || '-',
        // houseDtlSecdNm가 '민영'인 경우 v1 표기 규칙에 맞춰 'APT'로 노출
        subTitle:
          item.houseDtlSecdNm === '민영' ? 'APT' : item.houseDtlSecdNm || '-',
        region: item.subscrptAreaCodeNm || '-',
        area: '-',
        price: '공고문 확인',
        regularDate: formatDateRange(item.rceptBgnde, item.rceptEndde),
        // 특별 청약일은 기간이 아니라 시작일 1개만 노출 (v1 UI와 동일)
        specialDate: formatDateString(item.spsplyRceptBgnde),
      }));
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

      <section className="w-full flex-1 bg-[#f8faff] border-t border-[rgba(0,0,0,0.25)] pt-6 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto grid grid-cols-[repeat(auto-fit,220px)] justify-center px-4 md:px-0 gap-x-8 gap-y-0">
          {isLoading ? (
            <div className="col-span-full min-h-[40vh] flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              {filteredData.map((item) => (
                <HousingCard key={item.id} item={item} />
              ))}
              {filteredData.length === 0 && (
                <div className="col-span-full py-20 text-gray-500 font-medium text-center w-full">
                  해당하는 분양 공고가 없습니다.
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}


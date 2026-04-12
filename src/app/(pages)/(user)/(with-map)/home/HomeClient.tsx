'use client';

import React, { useMemo, useState } from 'react';
import type { HousingSupplyDataDto } from 'byzip-v2-sdk';
// 홈 전용 UI는 라우트 폴더 `home/components/`에 두고, 존재하지 않는 `@/components/home/*` 별칭은 쓰지 않습니다.
// 같은 트리 안의 상대 경로로 두면 `(pages)` 이동 등 디렉터리 구조 변경 시에도 import가 깨지지 않습니다.
import HousingStatusTab from './components/HousingStatusTab';
import CategoryBar from './components/CategoryBar';
import { type HousingItem } from './components/HousingCard';
import {
  formatDateRange,
  formatDateString,
  determineHousingType,
} from '@/app/libs/utils/date';
// 리스트 섹션은 `components/home/`가 아니라 `components/` 바로 아래에 있습니다.
import HousingListSection from './components/HousingListSection';
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

      <HousingListSection items={filteredData} isLoading={isLoading} />
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import HousingStatusTab from '@/components/home/HousingStatusTab';
import CategoryBar from '@/components/home/CategoryBar';
import HousingCard, { HousingItem } from '@/components/home/HousingCard';
import { HousingSupplyDataDto } from 'byzip-v2-sdk';
import { formatDateRange, determineHousingType } from '@/app/libs/utils/date';
import Spinner from '@/app/components/common/Spinner/Spinner';

const USE_DUMMY = true; // API 문제로 임시 더미 데이터 사용

const DUMMY_DATA: HousingItem[] = [
  { id: '1', type: 'today', title: '거창대성 4블록 영구임...', subTitle: '영구임대', region: '경남', area: '22m²', price: '공고문 확인', regularDate: '3월 30일 ~ 4월 3일' },
  { id: '2', type: 'today', title: '창원석동 영구임대', subTitle: '영구임대', region: '경남', area: '24m²', price: '공고문 확인', regularDate: '3월 30일 ~ 4월 3일' },
  { id: '3', type: 'today', title: '논산내동2 영구임대', subTitle: '영구임대', region: '충남', area: '23m² - 26m²', price: '공고문 확인', regularDate: '3월 30일 ~ 4월 3일' },
  { id: '4', type: 'today', title: '부여규암(07, 11) ..', subTitle: '영구임대', region: '충남', area: '26m²', price: '공고문 확인', regularDate: '3월 30일 ~ 4월 3일' },
  { id: '5', type: 'today', title: '보령명천A-1BL 영구...', subTitle: '영구임대', region: '충남', area: '24m² - 26m²', price: '공고문 확인', regularDate: '3월 30일 ~ 4월 3일' },
  { id: '6', type: 'today', title: '양천메디토유', subTitle: '분양주택', region: '서울', area: '54m²', price: '공고문 확인', regularDate: '6월 22일 ~ 4월 22일' },
  { id: '7', type: 'today', title: '군산무정2차', subTitle: '공공주택', region: '전북', area: '30m²', price: '공고문 확인', regularDate: '8월 6일 ~ 8월 6일' },
  { id: '8', type: 'today', title: '군산보장1차', subTitle: '공공주택', region: '전북', area: '27m² - 39m²', price: '공고문 확인', regularDate: '8월 6일 ~ 8월 6일' },
  { id: '9', type: 'today', title: '아름뜰아파트(경북 경산시 ..', subTitle: '공공주택', region: '대구', area: '46m² - 58m²', price: '공고문 확인', regularDate: '12월 22일 ~ 12월 18일' },
];

const HomePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [housingData] = useState<HousingSupplyDataDto[]>([]);
  const [isLoading] = useState(!USE_DUMMY);
  const [counts] = useState({
    all: USE_DUMMY ? DUMMY_DATA.length : 0,
    today: USE_DUMMY ? DUMMY_DATA.filter(d => d.type === 'today').length : 0,
    coming: 0,
    random: 0,
  });

  const filteredData = useMemo(() => {
    if (USE_DUMMY) {
      if (activeTab === 0) return DUMMY_DATA;
      const typeMap = ['all', 'today', 'coming', 'random'] as const;
      return DUMMY_DATA.filter(item => item.type === typeMap[activeTab]);
    }

    return housingData.filter((item) => {
      const type = determineHousingType(item.rceptBgnde, item.rceptEndde);
      if (activeTab === 0) return true;
      if (activeTab === 1) return type === 'today';
      if (activeTab === 2) return type === 'coming';
      if (activeTab === 3) return item.houseSecd === '04';
      return true;
    }).map((item): HousingItem => ({
      id: String(item.id),
      type: determineHousingType(item.rceptBgnde, item.rceptEndde),
      title: item.houseName || '-',
      subTitle: item.houseSecdNm || '-',
      region: item.subscrptAreaCodeNm || '-',
      area: '-',
      price: '공고문 확인',
      regularDate: formatDateRange(item.rceptBgnde, item.rceptEndde),
      specialDate: formatDateRange(item.spsplyRceptBgnde, item.spsplyRceptEndde),
    }));
  }, [housingData, activeTab]);

  return (
    <div className="w-full h-full bg-white flex flex-col items-center">
      <div className="w-full flex flex-col items-center sticky top-0 bg-white z-10">
        <HousingStatusTab activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
        <CategoryBar />
      </div>

      <section className="w-full flex-1 bg-[#f8faff] border-t border-[rgba(0,0,0,0.25)] pt-6 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto flex flex-wrap justify-center px-4 md:px-0 gap-x-8 gap-y-0">
          {isLoading ? (
            <div className="col-span-full py-20">
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
};


export default HomePage;

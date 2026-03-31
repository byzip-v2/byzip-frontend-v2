'use client';

import React, { useState, useMemo } from 'react';
import HousingStatusTab from '@/components/home/HousingStatusTab';
import CategoryBar from '@/components/home/CategoryBar';
import HousingCard, { HousingItem } from '@/components/home/HousingCard';

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

  const counts = useMemo(() => {
    return {
      all: 15,
      today: 15,
      coming: 0,
      random: 0,
    };
  }, []);

  const filteredData = useMemo(() => {
    if (activeTab === 0) return DUMMY_DATA;
    const typeMap = ['all', 'today', 'coming', 'random'];
    return DUMMY_DATA.filter(item => item.type === typeMap[activeTab]);
  }, [activeTab]);

  return (
    <div className="w-full h-full bg-white flex flex-col items-center">
      {/* 탭 & 카테고리 고정 영역 */}
      <div className="w-full flex flex-col items-center sticky top-0 bg-white z-10">
        <HousingStatusTab activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
        <CategoryBar />
      </div>

      {/* 리스트 섹션 (V1 스타일) */}
      <section className="w-full flex-1 bg-[#f8faff] border-t border-[rgba(0,0,0,0.25)] pt-6 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 place-items-center">
          {filteredData.map((item) => (
            <HousingCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;

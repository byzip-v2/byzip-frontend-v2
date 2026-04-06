'use client';

import React from 'react';
import Image from 'next/image';

export interface HousingItem {
  id: string;
  type: 'today' | 'coming' | 'random' | 'all';
  title: string;
  subTitle: string; // 분양형태 | 주택형태
  region: string;
  area: string;
  price: string;
  specialDate?: string;
  regularDate: string;
}

interface HousingCardProps {
  item: HousingItem;
}

const HousingCard = ({ item }: HousingCardProps) => {
  const getIconPath = () => {
    switch (item.type) {
      case 'today':
        return '/images/icons/today.png';
      case 'coming':
        return '/images/icons/coming.png';
      case 'random':
        return '/images/icons/random.png';
      default:
        return '/images/icons/all.png';
    }
  };

  const getStatusText = () => {
    switch (item.type) {
      case 'today':
        return '청약가능';
      case 'coming':
        return '청약예정';
      case 'random':
        return '무순위';
      default:
        return '전체';
    }
  };

  return (
    <article className="w-[218px] bg-white flex flex-col items-center justify-center mb-10 rounded-2xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] text-center cursor-pointer relative overflow-hidden">
      {/* 리스트 분류 (상태 정보) */}
      <div className="w-full flex flex-row justify-start items-end px-3 pt-4 pb-1.5 gap-1.5">
        <div className="w-7 relative flex items-center justify-center">
          <Image
            src={getIconPath()}
            alt={getStatusText()}
            width={28}
            height={22}
            quality={100}
            priority={true}
            className="object-contain"
          />
        </div>
        <span className="w-full font-semibold text-xs text-left text-[#8e8e8e]">
          {getStatusText()}
        </span>
      </div>

      {/* 주택 이름 */}
      <div className="w-full flex justify-start px-3">
        <h3 className="h-5 font-bold text-base text-[#000000] mt-2 mb-1 truncate">
          {item.title.length < 13
            ? item.title
            : item.title.slice(0, 12) + '...'}
        </h3>
      </div>

      {/* 분양형태 / 지역 */}
      <div className="w-full h-3 flex flex-row justify-start items-center pl-3 mt-1 mb-3 gap-1">
        <span className="text-xs font-medium text-[#7b7b7b] leading-3">
          {item.subTitle} |
        </span>
        <span className="text-xs font-medium text-[#7b7b7b] leading-3">
          {item.region}
        </span>
      </div>

      {/* 면적 및 가격 정보 */}
      <div className="w-full flex flex-col justify-between px-3 pb-4">
        <div className="w-full flex flex-row justify-between items-center mt-3">
          <span className="text-[#7b7b7b] text-xs font-normal leading-4">
            전용면적
          </span>
          <span className="text-black text-xs font-bold leading-4 text-right">
            {item.area}
          </span>
        </div>
        <div className="w-full flex flex-row justify-between items-center mt-3">
          <span className="text-[#7b7b7b] text-xs font-normal leading-4">
            분양가격
          </span>
          <span className="text-black text-xs font-bold leading-4 text-right">
            {item.price}
          </span>
        </div>
      </div>

      {/* 하단 청약일 정보 (파란색 배경) */}
      <div className="w-full h-18 mt-auto bg-[#356EFF] flex flex-col justify-center items-center gap-3">
        <div className="w-full flex flex-row justify-between items-center px-3 gap-1">
          <span className="text-white text-xs font-normal leading-4">
            특별 청약일
          </span>
          <span className="text-white text-xs font-bold leading-4">
            {item.specialDate || '정보가 없습니다.'}
          </span>
        </div>
        <div className="w-full flex flex-row justify-between items-center px-3 gap-1">
          <span className="text-white text-xs font-normal leading-4">
            청약 접수일
          </span>
          <span className="text-white text-xs font-bold leading-4">
            {item.regularDate}
          </span>
        </div>
      </div>
    </article>
  );
};

export default HousingCard;

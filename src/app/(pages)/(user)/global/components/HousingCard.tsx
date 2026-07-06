'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
    <Link href={`/detail/${item.id}`} className="block w-full max-w-[350px] min-w-[min(318px,calc(100vw-48px))] lg:w-auto lg:max-w-none lg:min-w-0">
      <article className="w-full h-[246px] lg:h-auto lg:w-58 bg-white flex flex-col items-center justify-center mb-10 lg:mb-8 rounded-2xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] text-center cursor-pointer relative overflow-hidden">
        {/* 리스트 분류 (상태 정보) */}
        <div className="w-full flex flex-row justify-start items-end px-[13px] pt-3 pb-1 gap-1.5">
          <div className="w-7 relative flex items-center justify-center">
            <Image
              src={getIconPath()}
              alt={getStatusText()}
              width={28}
              height={22}
              // (한국어) Next.js 15 이상에서 quality 100이 설정되어 있지 않을 때 발생하는 경고를 방지하기 위해 quality 속성을 지우고 기본값 최적화를 사용합니다.
              priority={true}
              className="object-contain"
              // (한국어) CSS로 이미지 너비/높이를 재정의할 때 종횡비(aspect ratio)가 깨지는 것을 막기 위해 width/height 'auto' 스타일을 추가합니다.
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <span className="w-full font-medium text-xs text-left text-[#8e8e8e]">
            {getStatusText()}
          </span>
        </div>

        {/* 주택 이름 */}
        <div className="w-full flex justify-start px-[13px]">
          <h3 className="h-[22px] w-full font-semibold text-[18px] leading-[22px] lg:text-base lg:leading-5 text-[#000000] mt-2 mb-[3px] text-left">
            {item.title.length < 13
              ? item.title
              : item.title.slice(0, 12) + '...'}
          </h3>
        </div>

        {/* 분양형태 / 지역 */}
        <div className="w-full h-[16px] flex flex-row justify-start items-center pl-[13px] mt-[3px] mb-[17px] gap-1 overflow-hidden">
          <span className="text-sm lg:text-xs font-medium text-[#7b7b7b] leading-4 lg:leading-3 whitespace-nowrap">
            {item.subTitle} |
          </span>
          <span className="text-sm lg:text-xs font-medium text-[#7b7b7b] leading-4 lg:leading-3 whitespace-nowrap">
            {item.region}
          </span>
        </div>

        {/* 면적 및 가격 정보 */}
        <div className="w-full flex flex-col justify-between px-[13px]">
          <div className="w-full flex flex-row justify-between items-center mt-3">
            <span className="text-[#7b7b7b] text-[15px] lg:text-xs font-normal leading-4">
              전용면적
            </span>
            <span className="text-black text-base lg:text-xs font-semibold lg:font-bold leading-4 text-right">
              {item.area}
            </span>
          </div>
          <div className="w-full flex flex-row justify-between items-center mt-3">
            <span className="text-[#7b7b7b] text-[15px] lg:text-xs font-normal leading-4">
              분양가격
            </span>
            <span className="text-black text-base lg:text-xs font-semibold lg:font-bold leading-4 text-right">
              {item.price}
            </span>
          </div>
        </div>

        {/* 하단 청약일 정보 (파란색 배경) */}
        <div className="w-full h-[74px] lg:h-18 mt-auto bg-[#356EFF] flex flex-col justify-center items-center gap-3">
          <div className="w-full flex flex-row justify-between items-center px-[13px] gap-1">
            <span className="text-white text-[15px] lg:text-xs font-normal leading-4">
              특별 청약일
            </span>
            <span
              className={`text-white text-base lg:text-xs leading-4 ${item.specialDate &&
                item.specialDate !== '정보가 없습니다.' &&
                item.specialDate !== '데이터 오류'
                ? 'font-semibold lg:font-bold'
                : 'font-normal'
                }`}
            >
              {item.specialDate || '정보가 없습니다.'}
            </span>
          </div>
          <div className="w-full flex flex-row justify-between items-center px-[13px] gap-1">
            <span className="text-white text-[15px] lg:text-xs font-normal leading-4">
              청약 접수일
            </span>
            <span className="text-white text-base lg:text-xs font-semibold lg:font-bold leading-4">
              {item.regularDate}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default HousingCard;

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

  // 550px 이하(모바일 화면)에서는 카드가 한 줄에 하나만 보이므로 최대 너비를 432px로 제한(max-w-[432px])하여 상단 필터바/탭바와 가로 정렬을 정렬하고 중앙에 배치(mx-auto)합니다.
  // 550px 초과(데스크톱 화면)에서는 기존 크기(min-[551px]:w-58)와 마진(min-[551px]:mx-0), 최대 너비 제한 해제(min-[551px]:max-w-none)를 유지합니다.
  return (
    <Link href={`/detail/${item.id}`} className="block">
      <article className="w-full max-w-100 mx-auto min-[551px]:mx-0 min-[551px]:w-58 min-[551px]:max-w-none bg-white flex flex-col items-center justify-center mb-8 rounded-2xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] text-center cursor-pointer relative overflow-hidden">
        {/* 리스트 분류 (상태 정보) */}
        <div className="w-full flex flex-row justify-start items-end px-3 pt-4 pb-1.5 gap-1.5">
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
          <span className="w-full font-semibold text-xs text-left text-[#8e8e8e]">
            {getStatusText()}
          </span>
        </div>

        {/* 주택 이름 */}
        <div className="w-full flex justify-start px-3">
          {/* 
            550px 이하(모바일 화면)에서는 제목이 한 줄로만 표시되도록 h-6, min-h-0, truncate를 적용합니다.
            550px 초과(데스크톱 화면)에서는 기존처럼 2줄 영역을 확보하도록 min-[551px]:h-5, min-[551px]:min-h-12, min-[551px]:whitespace-normal, min-[551px]:overflow-visible을 적용합니다.
          */}
          <h3 className="w-full truncate h-6 min-h-0 font-bold text-base text-[#000000] mt-2 mb-1 text-left min-[551px]:h-5 min-[551px]:min-h-12 min-[551px]:whitespace-normal min-[551px]:overflow-visible">
            {item.title.length < 35
              ? item.title
              : item.title.slice(0, 34) + '...'}
          </h3>
        </div>

        {/* 분양형태 / 지역 */}
        <div className="w-full h-3 flex flex-row justify-start items-center pl-3 mt-1 mb-2 gap-1">
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
              공급면적
            </span>
            {/* (한국어) 공급면적 데이터가 없거나 '-'로 설정된 경우 '정보 없음'을 표시하고 텍스트 굵기를 얇게(font-normal) 조정합니다. */}
            <span
              className={`text-black text-xs leading-4 text-right ${!item.area || item.area === '-' ? 'font-normal' : 'font-bold'
                }`}
            >
              {!item.area || item.area === '-' ? '정보 없음' : item.area}
            </span>
          </div>
          <div className="w-full flex flex-row justify-between items-center mt-3">
            <span className="text-[#7b7b7b] text-xs font-normal leading-4">
              분양가격
            </span>
            {/* (한국어) 분양가격 데이터가 없거나 '공고문 확인'으로 지정된 경우 '공고문 확인'을 표시하고 텍스트 굵기를 얇게(font-normal) 조정합니다. */}
            <span
              className={`text-black text-xs leading-4 text-right ${!item.price || item.price === '공고문 확인' ? 'font-normal' : 'font-bold'
                }`}
            >
              {!item.price || item.price === '공고문 확인' ? '공고문 확인' : item.price}
            </span>
          </div>
        </div>

        {/* 하단 청약일 정보 (파란색 배경) */}
        <div className="w-full h-18 mt-auto bg-[#356EFF] flex flex-col justify-center items-center gap-3">
          <div className="w-full flex flex-row justify-between items-center px-3 gap-1">
            <span className="text-white text-xs font-normal leading-4">
              특별 청약일
            </span>
            {/* (한국어) 특별 청약일 데이터가 유효하지 않거나 '정보가 없습니다.' 혹은 '데이터 오류'인 경우 '정보 없음'으로 표시하며 텍스트 굵기를 얇게(font-normal) 조정합니다. */}
            <span
              className={`text-white text-xs leading-4 ${item.specialDate &&
                item.specialDate !== '정보가 없습니다.' &&
                item.specialDate !== '정보 없음' &&
                item.specialDate !== '데이터 오류'
                ? 'font-bold'
                : 'font-normal'
                }`}
            >
              {!item.specialDate ||
                item.specialDate === '정보가 없습니다.' ||
                item.specialDate === '데이터 오류'
                ? '정보 없음'
                : item.specialDate}
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
    </Link>
  );
};

export default HousingCard;
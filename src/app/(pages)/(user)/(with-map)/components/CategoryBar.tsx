'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, CheckCircle2 } from 'lucide-react';
import InfoLinkBtn from './InfoLinkBtn';

// 지역 옵션
const REGIONS = [
  '서울',
  '경기',
  '인천',
  '대전',
  '세종',
  '충남',
  '충북',
  '강원',
  '광주',
  '전남',
  '전북',
  '울산',
  '부산',
  '대구',
  '경남',
  '경북',
  '제주',
];

// 분양형태 옵션
const TYPES = [
  'APT',
  '오피스텔/빌라',
  '민간임대',
  '잔여세대',
  '임의공급',
];

interface CategoryBarProps {
  /**
   * 부모 컴포넌트(HomeClient)와 선택된 필터 상태를 양방향으로 공유하기 위한 Props 인터페이스입니다.
   * 로컬 스토리지 보존 및 API 재조회를 부모 컴포넌트에서 일괄 제어하기 위해 상태를 위임받습니다.
   */
  selectedRegions: string[];
  setSelectedRegions: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
}

const CategoryBar = ({
  selectedRegions,
  setSelectedRegions,
  selectedTypes,
  setSelectedTypes,
}: CategoryBarProps) => {
  const [openFilter, setOpenFilter] = useState<'region' | 'type' | null>(null);

  const toggleFilter = (filter: 'region' | 'type') => {
    setOpenFilter(openFilter === filter ? null : filter);
  };

  const toggleSelection = (item: string, type: 'region' | 'type') => {
    if (type === 'region') {
      setSelectedRegions((prev) =>
        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
      );
    } else {
      setSelectedTypes((prev) =>
        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
      );
    }
  };

  const clearFilters = (type: 'region' | 'type') => {
    if (type === 'region') setSelectedRegions([]);
    else setSelectedTypes([]);
  };

  const selectAll = (type: 'region' | 'type') => {
    if (type === 'region') setSelectedRegions(REGIONS);
    else setSelectedTypes(TYPES);
  };

  const getButtonLabel = (type: 'region' | 'type') => {
    const selected = type === 'region' ? selectedRegions : selectedTypes;
    const defaultLabel = type === 'region' ? '지역' : '분양형태';

    if (selected.length === 0) return defaultLabel;
    if (selected.length === 1) return selected[0];
    return `${selected[0]}+${selected.length - 1}`;
  };

  return (
    <section className="w-full max-w-3xl flex flex-row flex-wrap items-center md:justify-between justify-center z-10 relative mx-auto mb-4 px-4 gap-4 md:gap-0">
      <div className="flex flex-row gap-2.5 items-center text-sm">
        {/* 지역 필터 버튼 */}
        <button
          onClick={() => toggleFilter('region')}
          className={`
            rounded-md border flex items-center pl-3 pr-2 py-1 gap-1 transition-all
            ${openFilter === 'region' || selectedRegions.length > 0
              ? 'border-[#356EFF] text-[#356EFF]'
              : 'border-[#D8D8D8] text-[#505050]'
            }
          `}
        >
          <span className="font-medium leading-4">
            {getButtonLabel('region')}
          </span>
          {openFilter === 'region' ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {/* 분양형태 필터 버튼 */}
        <button
          onClick={() => toggleFilter('type')}
          className={`
            rounded-md border flex items-center px-2 py-1 gap-1 transition-all
            ${openFilter === 'type' || selectedTypes.length > 0
              ? 'border-[#356EFF] text-[#356EFF]'
              : 'border-[#D8D8D8] text-[#505050]'
            }
          `}
        >
          {/* 상단 region 버튼과 동일하게 텍스트 크기는 버튼(text-sm)에서 상속 */}
          <span className="font-medium leading-4">
            {getButtonLabel('type')}
          </span>
          {openFilter === 'type' ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 우측 버튼 링크 */}
      <InfoLinkBtn />

      {/* 드롭다운 패널 (V1 스타일) */}
      {openFilter && (
        <div
          className="absolute top-10 z-20 w-72 p-2.5 bg-white border border-[#e8eaef] rounded-2xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] flex flex-col items-center h-auto"
        >
          <div
            className={`grid w-full pb-2 gap-x-2 gap-y-3 ${openFilter === 'region' ? 'grid-cols-5' : 'grid-cols-6'}`}
          >
            {(openFilter === 'region' ? REGIONS : TYPES).map((item) => (
              <button
                key={item}
                onClick={() => toggleSelection(item, openFilter)}
                className={`
                  w-full h-8 flex justify-center items-center px-1 py-2.5 rounded-md text-sm! font-medium border whitespace-nowrap
                  /* 
                    분양형태 필터일 때 첫 행의 두 항목(APT, 오피스텔/빌라)은 3열씩 차지(합계 6열)하게 하고, 
                    두 번째 행의 나머지 세 항목은 2열씩 차지(합계 6열)하게 하여 2줄 배치를 완성합니다.
                  */
                  ${openFilter === 'type' && (item === 'APT' || item === '오피스텔/빌라') ? 'col-span-3' : ''}
                  ${openFilter === 'type' && item !== 'APT' && item !== '오피스텔/빌라' ? 'col-span-2' : ''}
                  ${(openFilter === 'region'
                    ? selectedRegions
                    : selectedTypes
                  ).includes(item)
                    ? 'bg-[#F0F4FF] border-[#356EFF] text-[#356EFF]'
                    : 'bg-transparent border-[#d8d8d8] text-[#505050]'
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="w-full flex justify-between items-center px-3 pt-2 pb-1 bg-white">
            <button
              onClick={() => selectAll(openFilter)}
              className="flex flex-row items-end gap-1.5 text-sm! font-semibold underline text-[#505050] hover:text-[#3d7fff] hover:decoration-[#3d7fff]"
            >
              <div className="pb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              전체 선택
            </button>
            <button
              onClick={() => clearFilters(openFilter)}
              className="flex flex-row items-end gap-1.5 text-sm! font-semibold underline text-[#505050] hover:text-[#3d7fff] hover:decoration-[#3d7fff]"
            >
              <div className="pb-0.5">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
              초기화
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoryBar;

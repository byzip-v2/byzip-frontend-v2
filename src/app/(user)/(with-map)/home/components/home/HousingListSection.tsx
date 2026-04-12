'use client';

import React from 'react';
import HousingCard, { type HousingItem } from '@/components/home/HousingCard';
import Spinner from '@/app/components/common/Spinner/Spinner';

export interface HousingListSectionProps {
  /**
   * 그리드에 표시할 카드용 데이터.
   * 홈/검색 등 페이지마다 필터·매핑 로직만 다르고, 이 컴포넌트는 동일한 리스트 UI만 담당합니다.
   */
  items: HousingItem[];
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
 * - 레이아웃/스타일을 한 컴포넌트로 묶어 두면 검색 페이지 추가 시 JSX 중복과 스타일 불일치를 막을 수 있습니다.
 */
export default function HousingListSection({
  items,
  isLoading = false,
  emptyMessage = '해당하는 분양 공고가 없습니다.',
}: HousingListSectionProps) {
  return (
    <section className="w-full flex-1 bg-[#f8faff] border-t border-[rgba(0,0,0,0.25)] pt-6 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto grid grid-cols-[repeat(auto-fit,220px)] justify-center px-4 md:px-0 gap-x-8 gap-y-0">
        {isLoading ? (
          <div className="col-span-full min-h-[40vh] flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            {items.map((item) => (
              <HousingCard key={item.id} item={item} />
            ))}
            {items.length === 0 && (
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
